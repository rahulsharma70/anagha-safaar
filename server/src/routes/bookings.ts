import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
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

const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  check_in_date: z.string().datetime().optional(),
  check_out_date: z.string().datetime().optional(),
  guests: z.number().min(1).optional(),
  total_price: z.number().min(0).optional(),
  special_requests: z.string().optional(),
  cancellation_reason: z.string().optional(),
});

// =============================================================================
// 2. GET USER BOOKINGS
// =============================================================================

router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: bookings, error, count } = await query;

      if (error) {
        logger.error('Error fetching user bookings', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);

      logger.info('User bookings fetched', {
        userId,
        count: bookings?.length || 0,
        totalCount: count || 0
      });

      res.json({
        success: true,
        data: bookings || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      logger.error('Error in bookings GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 3. GET BOOKING BY ID
// =============================================================================

router.get('/:id',
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
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Booking fetched by ID', { bookingId: id, userId });

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      logger.error('Error fetching booking by ID', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. CREATE BOOKING
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

    try {
      // Generate booking reference
      const bookingReference = 'BK' + crypto.randomUUID().slice(0, 8).toUpperCase();

      const booking = {
        ...bookingData,
        user_id: userId,
        booking_reference: bookingReference,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) {
        logger.error('Error creating booking', error);
        throw error;
      }

      logger.info('Booking created successfully', { 
        bookingId: newBooking.id, 
        userId,
        bookingReference 
      });

      res.status(201).json({
        success: true,
        data: newBooking,
        message: 'Booking created successfully'
      });

    } catch (error) {
      logger.error('Error in booking creation', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. UPDATE BOOKING
// =============================================================================

router.put('/:id',
  validateRequest({ body: bookingUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Check if booking exists and belongs to user
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      // Prevent updates to completed bookings
      if (existingBooking.status === 'completed') {
        return res.status(409).json({
          success: false,
          error: 'Cannot update completed booking',
          code: 'BOOKING_COMPLETED'
        });
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating booking', error);
        throw error;
      }

      logger.info('Booking updated successfully', { bookingId: id, userId });

      res.json({
        success: true,
        data: booking,
        message: 'Booking updated successfully'
      });

    } catch (error) {
      logger.error('Error in booking update', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. CANCEL BOOKING
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
      // Check if booking exists and belongs to user
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, status, check_in_date')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      // Check if booking can be cancelled
      if (existingBooking.status === 'cancelled') {
        return res.status(409).json({
          success: false,
          error: 'Booking already cancelled',
          code: 'BOOKING_ALREADY_CANCELLED'
        });
      }

      if (existingBooking.status === 'completed') {
        return res.status(409).json({
          success: false,
          error: 'Cannot cancel completed booking',
          code: 'BOOKING_COMPLETED'
        });
      }

      // Check if cancellation is within allowed time
      const checkInDate = new Date(existingBooking.check_in_date);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCheckIn < 24) {
        return res.status(409).json({
          success: false,
          error: 'Cannot cancel booking within 24 hours of check-in',
          code: 'CANCELLATION_TOO_LATE'
        });
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling booking', error);
        throw error;
      }

      logger.info('Booking cancelled successfully', { 
        bookingId: id, 
        userId,
        cancellation_reason 
      });

      res.json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      logger.error('Error in booking cancellation', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. GET BOOKING DETAILS WITH ITEM INFO
// =============================================================================

router.get('/:id/details',
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
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          });
        }
        throw error;
      }

      // Get item details based on type
      let itemDetails = null;
      if (booking.item_type === 'hotel') {
        const { data: hotel } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', booking.item_id)
          .single();
        itemDetails = hotel;
      } else if (booking.item_type === 'tour') {
        const { data: tour } = await supabase
          .from('tours')
          .select('*')
          .eq('id', booking.item_id)
          .single();
        itemDetails = tour;
      } else if (booking.item_type === 'flight') {
        const { data: flight } = await supabase
          .from('flights')
          .select('*')
          .eq('id', booking.item_id)
          .single();
        itemDetails = flight;
      }

      logger.info('Booking details fetched', { bookingId: id, userId });

      res.json({
        success: true,
        data: {
          booking,
          item: itemDetails
        }
      });

    } catch (error) {
      logger.error('Error fetching booking details', error);
      throw error;
    }
  })
);

export default router;
