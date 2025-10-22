import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';
import { logger } from './logger';

// Redis client configuration
const redis = new Redis({
  host: import.meta.env.VITE_REDIS_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
  password: import.meta.env.VITE_REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Booking lock configuration
export const BOOKING_CONFIG = {
  LOCK_DURATION_MINUTES: 15, // 15 minutes to complete booking
  EXTEND_LOCK_MINUTES: 5, // 5 minutes extension
  MAX_LOCK_EXTENSIONS: 2, // Maximum 2 extensions
  INVENTORY_CACHE_TTL: 300, // 5 minutes cache for inventory
  PRICING_CACHE_TTL: 60, // 1 minute cache for pricing
  CALENDAR_CACHE_TTL: 600, // 10 minutes cache for calendar
};

// Booking lock types
export enum BookingLockType {
  HOTEL_ROOM = 'hotel_room',
  FLIGHT_SEAT = 'flight_seat',
  TOUR_SLOT = 'tour_slot',
}

// Booking status
export enum BookingStatus {
  LOCKED = 'locked',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Lock data structure
interface BookingLock {
  id: string;
  userId: string;
  itemType: BookingLockType;
  itemId: string;
  itemDetails: any;
  lockedAt: Date;
  expiresAt: Date;
  extensions: number;
  sessionId: string;
  pricing: {
    basePrice: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    source: string;
  };
}

// Calendar availability structure
interface CalendarAvailability {
  date: string;
  available: boolean;
  price: number;
  inventory: number;
  locked: number;
  metadata: any;
}

// Dynamic pricing structure
interface DynamicPricing {
  basePrice: number;
  demandMultiplier: number;
  seasonalMultiplier: number;
  timeMultiplier: number;
  finalPrice: number;
  currency: string;
  factors: {
    demand: number;
    season: number;
    timeOfDay: number;
    dayOfWeek: number;
    advanceBooking: number;
  };
}

class BookingLockService {
  private redis: Redis;
  private supabase: any;

  constructor() {
    this.redis = redis;
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
  }

  // Generate lock key for Redis
  private getLockKey(itemType: BookingLockType, itemId: string, userId: string): string {
    return `booking_lock:${itemType}:${itemId}:${userId}`;
  }

  // Generate inventory key for Redis
  private getInventoryKey(itemType: BookingLockType, itemId: string, date: string): string {
    return `inventory:${itemType}:${itemId}:${date}`;
  }

  // Generate pricing key for Redis
  private getPricingKey(itemType: BookingLockType, itemId: string, date: string): string {
    return `pricing:${itemType}:${itemId}:${date}`;
  }

  // Lock a seat/room for booking
  async lockItem(
    itemType: BookingLockType,
    itemId: string,
    userId: string,
    sessionId: string,
    metadata: any = {}
  ): Promise<{ success: boolean; lockId?: string; error?: string; pricing?: DynamicPricing }> {
    try {
      const lockId = `${itemType}_${itemId}_${userId}_${Date.now()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + BOOKING_CONFIG.LOCK_DURATION_MINUTES * 60 * 1000);

      // Check if item is already locked by another user
      const existingLock = await this.getActiveLock(itemType, itemId);
      if (existingLock && existingLock.userId !== userId) {
        return {
          success: false,
          error: 'Item is currently locked by another user'
        };
      }

      // Get current pricing
      const pricing = await this.getDynamicPricing(itemType, itemId, new Date().toISOString().split('T')[0]);
      if (!pricing) {
        return {
          success: false,
          error: 'Unable to fetch current pricing'
        };
      }

      // Create lock data
      const lockData: BookingLock = {
        id: lockId,
        userId,
        itemType,
        itemId,
        itemDetails: await this.getItemDetails(itemType, itemId),
        lockedAt: now,
        expiresAt,
        extensions: 0,
        sessionId,
        pricing: {
          basePrice: pricing.basePrice,
          taxes: pricing.finalPrice * 0.12, // 12% tax
          fees: pricing.finalPrice * 0.05, // 5% service fee
          total: pricing.finalPrice * 1.17, // Total with tax and fees
          currency: pricing.currency
        },
        metadata: {
          ipAddress: metadata.ipAddress || 'unknown',
          userAgent: metadata.userAgent || 'unknown',
          source: metadata.source || 'web'
        }
      };

      // Store lock in Redis with expiration
      const lockKey = this.getLockKey(itemType, itemId, userId);
      await this.redis.setex(
        lockKey,
        BOOKING_CONFIG.LOCK_DURATION_MINUTES * 60,
        JSON.stringify(lockData)
      );

      // Update inventory to reflect locked item
      await this.updateInventory(itemType, itemId, new Date().toISOString().split('T')[0], -1);

      // Log the lock event
      await this.logBookingEvent('item_locked', {
        lockId,
        itemType,
        itemId,
        userId,
        pricing: lockData.pricing,
        expiresAt
      });

      logger.info('Item locked successfully', {
        lockId,
        itemType,
        itemId,
        userId,
        expiresAt
      });

      return {
        success: true,
        lockId,
        pricing: pricing
      };

    } catch (error) {
      logger.error('Failed to lock item', error);
      return {
        success: false,
        error: 'Failed to lock item'
      };
    }
  }

  // Extend lock duration
  async extendLock(lockId: string, userId: string): Promise<{ success: boolean; newExpiry?: Date; error?: string }> {
    try {
      const lockData = await this.getLockById(lockId);
      if (!lockData) {
        return { success: false, error: 'Lock not found' };
      }

      if (lockData.userId !== userId) {
        return { success: false, error: 'Unauthorized to extend this lock' };
      }

      if (lockData.extensions >= BOOKING_CONFIG.MAX_LOCK_EXTENSIONS) {
        return { success: false, error: 'Maximum lock extensions reached' };
      }

      const newExpiry = new Date(lockData.expiresAt.getTime() + BOOKING_CONFIG.EXTEND_LOCK_MINUTES * 60 * 1000);
      lockData.expiresAt = newExpiry;
      lockData.extensions += 1;

      const lockKey = this.getLockKey(lockData.itemType, lockData.itemId, userId);
      const remainingTTL = Math.ceil((newExpiry.getTime() - Date.now()) / 1000);

      await this.redis.setex(lockKey, remainingTTL, JSON.stringify(lockData));

      await this.logBookingEvent('lock_extended', {
        lockId,
        userId,
        newExpiry,
        extensions: lockData.extensions
      });

      return {
        success: true,
        newExpiry
      };

    } catch (error) {
      logger.error('Failed to extend lock', error);
      return { success: false, error: 'Failed to extend lock' };
    }
  }

  // Release lock
  async releaseLock(lockId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const lockData = await this.getLockById(lockId);
      if (!lockData) {
        return { success: false, error: 'Lock not found' };
      }

      if (lockData.userId !== userId) {
        return { success: false, error: 'Unauthorized to release this lock' };
      }

      const lockKey = this.getLockKey(lockData.itemType, lockData.itemId, userId);
      await this.redis.del(lockKey);

      // Restore inventory
      await this.updateInventory(lockData.itemType, lockData.itemId, new Date().toISOString().split('T')[0], 1);

      await this.logBookingEvent('lock_released', {
        lockId,
        userId,
        itemType: lockData.itemType,
        itemId: lockData.itemId
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to release lock', error);
      return { success: false, error: 'Failed to release lock' };
    }
  }

  // Confirm booking
  async confirmBooking(lockId: string, userId: string, paymentData: any): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const lockData = await this.getLockById(lockId);
      if (!lockData) {
        return { success: false, error: 'Lock not found or expired' };
      }

      if (lockData.userId !== userId) {
        return { success: false, error: 'Unauthorized to confirm this booking' };
      }

      // Check if lock is still valid
      if (new Date() > lockData.expiresAt) {
        await this.releaseLock(lockId, userId);
        return { success: false, error: 'Lock has expired' };
      }

      // Create booking record in database
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .insert({
          booking_reference: `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          user_id: userId,
          item_type: lockData.itemType,
          item_id: lockData.itemId,
          start_date: new Date().toISOString().split('T')[0],
          total_amount: lockData.pricing.total,
          currency: lockData.pricing.currency,
          status: 'confirmed',
          payment_status: 'paid',
          guest_details: lockData.itemDetails,
          pricing_details: lockData.pricing,
          lock_id: lockId,
          payment_data: paymentData
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create booking', error);
        return { success: false, error: 'Failed to create booking' };
      }

      // Release the lock
      await this.releaseLock(lockId, userId);

      // Update inventory permanently
      await this.updateInventory(lockData.itemType, lockData.itemId, new Date().toISOString().split('T')[0], -1, true);

      await this.logBookingEvent('booking_confirmed', {
        bookingId: booking.id,
        lockId,
        userId,
        amount: lockData.pricing.total
      });

      return {
        success: true,
        bookingId: booking.id
      };

    } catch (error) {
      logger.error('Failed to confirm booking', error);
      return { success: false, error: 'Failed to confirm booking' };
    }
  }

  // Get active lock for an item
  async getActiveLock(itemType: BookingLockType, itemId: string): Promise<BookingLock | null> {
    try {
      const pattern = `booking_lock:${itemType}:${itemId}:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const parsed = JSON.parse(lockData);
          if (new Date(parsed.expiresAt) > new Date()) {
            return parsed;
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get active lock', error);
      return null;
    }
  }

  // Get lock by ID
  async getLockById(lockId: string): Promise<BookingLock | null> {
    try {
      const pattern = `booking_lock:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const parsed = JSON.parse(lockData);
          if (parsed.id === lockId && new Date(parsed.expiresAt) > new Date()) {
            return parsed;
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get lock by ID', error);
      return null;
    }
  }

  // Get user's active locks
  async getUserLocks(userId: string): Promise<BookingLock[]> {
    try {
      const pattern = `booking_lock:*:${userId}`;
      const keys = await this.redis.keys(pattern);
      const locks: BookingLock[] = [];
      
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const parsed = JSON.parse(lockData);
          if (new Date(parsed.expiresAt) > new Date()) {
            locks.push(parsed);
          }
        }
      }
      
      return locks;
    } catch (error) {
      logger.error('Failed to get user locks', error);
      return [];
    }
  }

  // Get calendar availability
  async getCalendarAvailability(
    itemType: BookingLockType,
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarAvailability[]> {
    try {
      const cacheKey = `calendar:${itemType}:${itemId}:${startDate}:${endDate}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const availability: CalendarAvailability[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Get inventory for this date
        const inventory = await this.getInventory(itemType, itemId, dateStr);
        
        // Get locked count for this date
        const locked = await this.getLockedCount(itemType, itemId, dateStr);
        
        // Get pricing for this date
        const pricing = await this.getDynamicPricing(itemType, itemId, dateStr);
        
        availability.push({
          date: dateStr,
          available: inventory > locked,
          price: pricing?.finalPrice || 0,
          inventory: inventory,
          locked: locked,
          metadata: {
            pricing: pricing,
            lastUpdated: new Date().toISOString()
          }
        });
      }

      // Cache the result
      await this.redis.setex(cacheKey, BOOKING_CONFIG.CALENDAR_CACHE_TTL, JSON.stringify(availability));
      
      return availability;
    } catch (error) {
      logger.error('Failed to get calendar availability', error);
      return [];
    }
  }

  // Get dynamic pricing
  async getDynamicPricing(itemType: BookingLockType, itemId: string, date: string): Promise<DynamicPricing | null> {
    try {
      const cacheKey = this.getPricingKey(itemType, itemId, date);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from API (this would integrate with your pricing service)
      const pricing = await this.fetchPricingFromAPI(itemType, itemId, date);
      
      if (pricing) {
        // Cache the pricing
        await this.redis.setex(cacheKey, BOOKING_CONFIG.PRICING_CACHE_TTL, JSON.stringify(pricing));
      }
      
      return pricing;
    } catch (error) {
      logger.error('Failed to get dynamic pricing', error);
      return null;
    }
  }

  // Update inventory
  async updateInventory(
    itemType: BookingLockType,
    itemId: string,
    date: string,
    delta: number,
    permanent: boolean = false
  ): Promise<void> {
    try {
      const inventoryKey = this.getInventoryKey(itemType, itemId, date);
      
      if (permanent) {
        // Update database inventory
        const tableName = this.getTableName(itemType);
        await this.supabase
          .from(tableName)
          .update({
            available_rooms: this.supabase.raw(`available_rooms + ${delta}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);
      }
      
      // Update Redis cache
      const current = await this.redis.get(inventoryKey) || '0';
      const newValue = parseInt(current) + delta;
      await this.redis.setex(inventoryKey, BOOKING_CONFIG.INVENTORY_CACHE_TTL, newValue.toString());
      
    } catch (error) {
      logger.error('Failed to update inventory', error);
    }
  }

  // Get inventory count
  async getInventory(itemType: BookingLockType, itemId: string, date: string): Promise<number> {
    try {
      const inventoryKey = this.getInventoryKey(itemType, itemId, date);
      const cached = await this.redis.get(inventoryKey);
      
      if (cached) {
        return parseInt(cached);
      }

      // Fetch from database
      const tableName = this.getTableName(itemType);
      const { data } = await this.supabase
        .from(tableName)
        .select('available_rooms, available_seats, max_group_size')
        .eq('id', itemId)
        .single();

      const inventory = data?.available_rooms || data?.available_seats || data?.max_group_size || 0;
      
      // Cache the result
      await this.redis.setex(inventoryKey, BOOKING_CONFIG.INVENTORY_CACHE_TTL, inventory.toString());
      
      return inventory;
    } catch (error) {
      logger.error('Failed to get inventory', error);
      return 0;
    }
  }

  // Get locked count for a date
  async getLockedCount(itemType: BookingLockType, itemId: string, date: string): Promise<number> {
    try {
      const pattern = `booking_lock:${itemType}:${itemId}:*`;
      const keys = await this.redis.keys(pattern);
      let lockedCount = 0;
      
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const parsed = JSON.parse(lockData);
          if (new Date(parsed.expiresAt) > new Date()) {
            lockedCount++;
          }
        }
      }
      
      return lockedCount;
    } catch (error) {
      logger.error('Failed to get locked count', error);
      return 0;
    }
  }

  // Fetch pricing from API
  private async fetchPricingFromAPI(itemType: BookingLockType, itemId: string, date: string): Promise<DynamicPricing | null> {
    try {
      // This would integrate with your pricing API
      // For now, return mock data
      const basePrice = 1000; // Base price
      const now = new Date();
      const bookingDate = new Date(date);
      const daysUntilBooking = Math.ceil((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate multipliers
      const demandMultiplier = 1 + (Math.random() * 0.5); // 1.0 to 1.5
      const seasonalMultiplier = 1 + (Math.sin(now.getMonth() / 12 * Math.PI * 2) * 0.3); // Seasonal variation
      const timeMultiplier = 1 + (now.getHours() / 24 * 0.2); // Time of day
      const advanceBookingMultiplier = Math.max(0.8, 1 - (daysUntilBooking / 30 * 0.3)); // Advance booking discount
      
      const finalPrice = basePrice * demandMultiplier * seasonalMultiplier * timeMultiplier * advanceBookingMultiplier;
      
      return {
        basePrice,
        demandMultiplier,
        seasonalMultiplier,
        timeMultiplier,
        finalPrice: Math.round(finalPrice),
        currency: 'INR',
        factors: {
          demand: demandMultiplier,
          season: seasonalMultiplier,
          timeOfDay: timeMultiplier,
          dayOfWeek: 1 + (now.getDay() / 7 * 0.2),
          advanceBooking: advanceBookingMultiplier
        }
      };
    } catch (error) {
      logger.error('Failed to fetch pricing from API', error);
      return null;
    }
  }

  // Get item details
  private async getItemDetails(itemType: BookingLockType, itemId: string): Promise<any> {
    try {
      const tableName = this.getTableName(itemType);
      const { data } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', itemId)
        .single();
      
      return data;
    } catch (error) {
      logger.error('Failed to get item details', error);
      return null;
    }
  }

  // Get table name for item type
  private getTableName(itemType: BookingLockType): string {
    switch (itemType) {
      case BookingLockType.HOTEL_ROOM:
        return 'hotels';
      case BookingLockType.FLIGHT_SEAT:
        return 'flights';
      case BookingLockType.TOUR_SLOT:
        return 'tours';
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }
  }

  // Log booking events
  private async logBookingEvent(eventType: string, data: any): Promise<void> {
    try {
      await this.supabase
        .from('booking_events')
        .insert({
          event_type: eventType,
          data: data,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Failed to log booking event', error);
    }
  }

  // Cleanup expired locks
  async cleanupExpiredLocks(): Promise<void> {
    try {
      const pattern = 'booking_lock:*';
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const parsed = JSON.parse(lockData);
          if (new Date(parsed.expiresAt) <= new Date()) {
            // Release expired lock
            await this.releaseLock(parsed.id, parsed.userId);
            logger.info('Cleaned up expired lock', { lockId: parsed.id });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired locks', error);
    }
  }
}

// Export singleton instance
export const bookingLockService = new BookingLockService();

// Export types
export type { BookingLock, CalendarAvailability, DynamicPricing };
