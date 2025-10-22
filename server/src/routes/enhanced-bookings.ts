import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';
import { RedisService } from '../services/redisService';

const router = Router();

// =============================================================================
// 1. RAZORPAY CONFIGURATION
// =============================================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// =============================================================================
// 2. VALIDATION SCHEMAS
// =============================================================================

const bookingCreateSchema = z.object({
  item_type: z.enum(['hotel', 'tour', 'flight']),
  item_id: z.string().uuid('Invalid item ID'),
  check_in_date: z.string().datetime('Invalid check-in date'),
  check_out_date: z.string().datetime('Invalid check-out date').optional(),
  guests: z.number().min(1, 'At least 1 guest required'),
  total_price: z.number().min(0, 'Price must be positive'),
  guest_info: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Invalid phone number'),
    passport_number: z.string().optional(),
    aadhaar_number: z.string().optional(),
  }),
  special_requests: z.string().optional(),
  add_ons: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
  })).default([]),
});

// =============================================================================
// 3. INVENTORY LOCKING SERVICE
// =============================================================================

class InventoryLockService {
  private static readonly LOCK_TTL = 1800; // 30 minutes
  private static readonly LOCK_PREFIX = 'inventory_lock:';

  static async lockInventory(itemType: string, itemId: string, quantity: number): Promise<string> {
    const lockKey = `${this.LOCK_PREFIX}${itemType}:${itemId}`;
    const lockId = crypto.randomUUID();
    
    try {
      // Try to acquire lock
      const lockAcquired = await RedisService.setex(lockKey, this.LOCK_TTL, JSON.stringify({
        lockId,
        quantity,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.LOCK_TTL * 1000).toISOString()
      }));

      if (!lockAcquired) {
        throw new Error('Inventory already locked');
      }

      // Check and update inventory
      const inventoryKey = `inventory:${itemType}:${itemId}`;
      const currentInventory = await RedisService.get(inventoryKey);
      
      if (!currentInventory) {
        // Get from database if not in cache
        const { data: item } = await supabase
          .from(itemType === 'hotel' ? 'hotels' : itemType === 'tour' ? 'tours' : 'flights')
          .select('available_rooms, available_seats, max_group_size')
          .eq('id', itemId)
          .single();

        if (!item) {
          await RedisService.del(lockKey);
          throw new Error('Item not found');
        }

        const availableQuantity = itemType === 'hotel' ? item.available_rooms : 
                                 itemType === 'tour' ? item.max_group_size : 
                                 item.available_seats;

        if (availableQuantity < quantity) {
          await RedisService.del(lockKey);
          throw new Error('Insufficient inventory');
        }

        // Update inventory in cache
        await RedisService.setex(inventoryKey, 3600, availableQuantity - quantity);
      } else {
        const availableQuantity = parseInt(currentInventory);
        if (availableQuantity < quantity) {
          await RedisService.del(lockKey);
          throw new Error('Insufficient inventory');
        }
        await RedisService.setex(inventoryKey, 3600, availableQuantity - quantity);
      }

      logger.info('Inventory locked successfully', {
        itemType,
        itemId,
        quantity,
        lockId
      });

      return lockId;
    } catch (error) {
      logger.error('Failed to lock inventory', error);
      throw error;
    }
  }

  static async releaseInventory(itemType: string, itemId: string, lockId: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${itemType}:${itemId}`;
    
    try {
      const lockData = await RedisService.get(lockKey);
      if (lockData) {
        const lock = JSON.parse(lockData);
        if (lock.lockId === lockId) {
          // Release the lock
          await RedisService.del(lockKey);
          
          // Restore inventory
          const inventoryKey = `inventory:${itemType}:${itemId}`;
          const currentInventory = await RedisService.get(inventoryKey);
          if (currentInventory) {
            const newQuantity = parseInt(currentInventory) + lock.quantity;
            await RedisService.setex(inventoryKey, 3600, newQuantity);
          }

          logger.info('Inventory released successfully', {
            itemType,
            itemId,
            lockId,
            quantity: lock.quantity
          });
        }
      }
    } catch (error) {
      logger.error('Failed to release inventory', error);
    }
  }

  static async extendLock(itemType: string, itemId: string, lockId: string): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${itemType}:${itemId}`;
    
    try {
      const lockData = await RedisService.get(lockKey);
      if (lockData) {
        const lock = JSON.parse(lockData);
        if (lock.lockId === lockId) {
          // Extend lock by updating TTL
          await RedisService.expire(lockKey, this.LOCK_TTL);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Failed to extend lock', error);
      return false;
    }
  }
}

// =============================================================================
// 4. ENHANCED BOOKING CREATION WITH INVENTORY LOCKING AND RAZORPAY
// =============================================================================

router.post('/',
  validateRequest({ body: bookingCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const bookingData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    let lockId: string | null = null;

    try {
      // Step 1: Lock inventory
      logger.info('Starting booking creation with inventory locking', {
        userId,
        itemType: bookingData.item_type,
        itemId: bookingData.item_id,
        quantity: bookingData.guests
      });

      lockId = await InventoryLockService.lockInventory(
        bookingData.item_type,
        bookingData.item_id,
        bookingData.guests
      );

      // Step 2: Generate booking reference
      const bookingReference = 'BK' + crypto.randomUUID().slice(0, 8).toUpperCase();

      // Step 3: Create booking in database
      const booking = {
        ...bookingData,
        user_id: userId,
        booking_reference: bookingReference,
        status: 'pending',
        lock_id: lockId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (bookingError) {
        logger.error('Error creating booking', bookingError);
        throw bookingError;
      }

      // Step 4: Create Razorpay order
      logger.info('Creating Razorpay order for booking', {
        bookingId: newBooking.id,
        amount: bookingData.total_price
      });

      const orderOptions = {
        amount: bookingData.total_price * 100, // Convert to paise
        currency: 'INR',
        receipt: `booking_${newBooking.id}`,
        notes: {
          booking_id: newBooking.id,
          user_id: userId,
          item_type: bookingData.item_type,
          item_id: bookingData.item_id,
          lock_id: lockId,
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions);

      // Step 5: Create payment record
      const paymentData = {
        id: razorpayOrder.id,
        booking_id: newBooking.id,
        user_id: userId,
        amount: bookingData.total_price,
        currency: 'INR',
        status: 'created',
        payment_method: 'razorpay',
        razorpay_order_id: razorpayOrder.id,
        lock_id: lockId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentError) {
        logger.error('Error creating payment record', paymentError);
        throw paymentError;
      }

      logger.info('Booking created successfully with Razorpay order', {
        bookingId: newBooking.id,
        userId,
        bookingReference,
        razorpayOrderId: razorpayOrder.id,
        lockId
      });

      res.status(201).json({
        success: true,
        data: {
          booking: newBooking,
          payment: payment,
          razorpay_order: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt
          },
          lock_id: lockId
        },
        message: 'Booking created successfully with payment order'
      });

    } catch (error) {
      // Release inventory lock on error
      if (lockId) {
        await InventoryLockService.releaseInventory(
          bookingData.item_type,
          bookingData.item_id,
          lockId
        );
      }

      logger.error('Error in booking creation', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. BOOKING CONFIRMATION (AFTER PAYMENT SUCCESS)
// =============================================================================

router.post('/:id/confirm',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get booking with lock information
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(409).json({
          success: false,
          error: 'Booking is not in pending status',
          code: 'BOOKING_NOT_PENDING'
        });
      }

      // Update booking status to confirmed
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error confirming booking', updateError);
        throw updateError;
      }

      // Release inventory lock (convert to permanent booking)
      if (booking.lock_id) {
        await InventoryLockService.releaseInventory(
          booking.item_type,
          booking.item_id,
          booking.lock_id
        );
      }

      logger.info('Booking confirmed successfully', {
        bookingId: id,
        userId
      });

      res.json({
        success: true,
        data: updatedBooking,
        message: 'Booking confirmed successfully'
      });

    } catch (error) {
      logger.error('Error in booking confirmation', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. BOOKING CANCELLATION (RELEASE INVENTORY)
// =============================================================================

router.post('/:id/cancel',
  validateRequest({ 
    body: z.object({
      cancellation_reason: z.string().min(1, 'Cancellation reason is required')
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { cancellation_reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      if (booking.status === 'cancelled') {
        return res.status(409).json({
          success: false,
          error: 'Booking already cancelled',
          code: 'BOOKING_ALREADY_CANCELLED'
        });
      }

      // Release inventory lock if exists
      if (booking.lock_id) {
        await InventoryLockService.releaseInventory(
          booking.item_type,
          booking.item_id,
          booking.lock_id
        );
      }

      // Update booking status
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error cancelling booking', updateError);
        throw updateError;
      }

      logger.info('Booking cancelled successfully', {
        bookingId: id,
        userId,
        cancellation_reason
      });

      res.json({
        success: true,
        data: updatedBooking,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      logger.error('Error in booking cancellation', error);
      throw error;
    }
  })
);

export default router;
