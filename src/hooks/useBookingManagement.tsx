import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  bookingLockService, 
  BookingLockType, 
  BookingLock,
  CalendarAvailability,
  DynamicPricing 
} from '@/lib/booking-lock-service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface BookingState {
  locks: BookingLock[];
  availability: CalendarAvailability[];
  pricing: DynamicPricing | null;
  loading: boolean;
  error: string | null;
}

interface BookingActions {
  lockItem: (itemType: BookingLockType, itemId: string, sessionId: string) => Promise<boolean>;
  extendLock: (lockId: string) => Promise<boolean>;
  releaseLock: (lockId: string) => Promise<boolean>;
  confirmBooking: (lockId: string, paymentData: any) => Promise<string | null>;
  getAvailability: (itemType: BookingLockType, itemId: string, startDate: string, endDate: string) => Promise<void>;
  getPricing: (itemType: BookingLockType, itemId: string, date: string) => Promise<void>;
  refreshLocks: () => Promise<void>;
  cleanupExpiredLocks: () => Promise<void>;
}

interface UseBookingManagementReturn extends BookingState, BookingActions {
  // Additional computed properties
  activeLocks: BookingLock[];
  expiredLocks: BookingLock[];
  totalLockedValue: number;
  canExtendLock: (lockId: string) => boolean;
  getTimeRemaining: (lockId: string) => number;
}

export const useBookingManagement = (userId?: string): UseBookingManagementReturn => {
  const [state, setState] = useState<BookingState>({
    locks: [],
    availability: [],
    pricing: null,
    loading: false,
    error: null
  });

  // Load user's active locks on mount
  useEffect(() => {
    if (userId) {
      refreshLocks();
    }
  }, [userId]);

  // Set up periodic cleanup of expired locks
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredLocks();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Lock an item for booking
  const lockItem = useCallback(async (
    itemType: BookingLockType, 
    itemId: string, 
    sessionId: string
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await bookingLockService.lockItem(
        itemType,
        itemId,
        userId,
        sessionId,
        {
          ipAddress: 'unknown', // Would get from request context
          userAgent: navigator.userAgent,
          source: 'web'
        }
      );

      if (result.success) {
        await refreshLocks();
        toast.success('Item locked successfully! Complete your booking within 15 minutes.');
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to lock item' }));
        toast.error(result.error || 'Failed to lock item');
        return false;
      }
    } catch (error) {
      const errorMessage = 'Failed to lock item';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // Extend lock duration
  const extendLock = useCallback(async (lockId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await bookingLockService.extendLock(lockId, userId);

      if (result.success) {
        await refreshLocks();
        toast.success('Lock extended by 5 minutes');
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to extend lock' }));
        toast.error(result.error || 'Failed to extend lock');
        return false;
      }
    } catch (error) {
      const errorMessage = 'Failed to extend lock';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // Release lock
  const releaseLock = useCallback(async (lockId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await bookingLockService.releaseLock(lockId, userId);

      if (result.success) {
        await refreshLocks();
        toast.success('Booking session cancelled');
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to release lock' }));
        toast.error(result.error || 'Failed to release lock');
        return false;
      }
    } catch (error) {
      const errorMessage = 'Failed to release lock';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // Confirm booking
  const confirmBooking = useCallback(async (
    lockId: string, 
    paymentData: any
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await bookingLockService.confirmBooking(lockId, userId, paymentData);

      if (result.success && result.bookingId) {
        await refreshLocks();
        toast.success('Booking confirmed successfully!');
        return result.bookingId;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to confirm booking' }));
        toast.error(result.error || 'Failed to confirm booking');
        return null;
      }
    } catch (error) {
      const errorMessage = 'Failed to confirm booking';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // Get calendar availability
  const getAvailability = useCallback(async (
    itemType: BookingLockType,
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const availability = await bookingLockService.getCalendarAvailability(
        itemType,
        itemId,
        startDate,
        endDate
      );

      setState(prev => ({ ...prev, availability, loading: false }));
    } catch (error) {
      const errorMessage = 'Failed to load availability';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
    }
  }, []);

  // Get dynamic pricing
  const getPricing = useCallback(async (
    itemType: BookingLockType,
    itemId: string,
    date: string
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const pricing = await bookingLockService.getDynamicPricing(itemType, itemId, date);

      setState(prev => ({ ...prev, pricing, loading: false }));
    } catch (error) {
      const errorMessage = 'Failed to load pricing';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      logger.error(errorMessage, error);
      toast.error(errorMessage);
    }
  }, []);

  // Refresh user's locks
  const refreshLocks = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const locks = await bookingLockService.getUserLocks(userId);
      setState(prev => ({ ...prev, locks }));
    } catch (error) {
      logger.error('Failed to refresh locks', error);
    }
  }, [userId]);

  // Cleanup expired locks
  const cleanupExpiredLocks = useCallback(async (): Promise<void> => {
    try {
      await bookingLockService.cleanupExpiredLocks();
      await refreshLocks();
    } catch (error) {
      logger.error('Failed to cleanup expired locks', error);
    }
  }, [refreshLocks]);

  // Computed properties
  const activeLocks = state.locks.filter(lock => new Date(lock.expiresAt) > new Date());
  const expiredLocks = state.locks.filter(lock => new Date(lock.expiresAt) <= new Date());
  const totalLockedValue = activeLocks.reduce((sum, lock) => sum + lock.pricing.total, 0);

  // Check if lock can be extended
  const canExtendLock = useCallback((lockId: string): boolean => {
    const lock = state.locks.find(l => l.id === lockId);
    return lock ? lock.extensions < 2 : false;
  }, [state.locks]);

  // Get time remaining for a lock
  const getTimeRemaining = useCallback((lockId: string): number => {
    const lock = state.locks.find(l => l.id === lockId);
    if (!lock) return 0;
    
    const remaining = new Date(lock.expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // Return minutes
  }, [state.locks]);

  return {
    ...state,
    activeLocks,
    expiredLocks,
    totalLockedValue,
    lockItem,
    extendLock,
    releaseLock,
    confirmBooking,
    getAvailability,
    getPricing,
    refreshLocks,
    cleanupExpiredLocks,
    canExtendLock,
    getTimeRemaining
  };
};

// Hook for booking analytics
export const useBookingAnalytics = (startDate: string, endDate: string) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_booking_analytics', {
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (fetchError) throw fetchError;

      setAnalytics(data);
    } catch (err) {
      const errorMessage = 'Failed to load booking analytics';
      setError(errorMessage);
      logger.error(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics
  };
};

// Hook for inventory management
export const useInventoryManagement = (itemType: BookingLockType, itemId: string) => {
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory_tracking')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      setInventory(data);
    } catch (err) {
      const errorMessage = 'Failed to load inventory';
      setError(errorMessage);
      logger.error(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [itemType, itemId]);

  const updateInventory = useCallback(async (date: string, delta: number) => {
    try {
      const { error: updateError } = await supabase
        .rpc('update_inventory', {
          p_item_type: itemType,
          p_item_id: itemId,
          p_date: date,
          p_delta: delta
        });

      if (updateError) throw updateError;

      await loadInventory(date);
    } catch (err) {
      const errorMessage = 'Failed to update inventory';
      setError(errorMessage);
      logger.error(errorMessage, err);
    }
  }, [itemType, itemId, loadInventory]);

  return {
    inventory,
    loading,
    error,
    loadInventory,
    updateInventory
  };
};

export default useBookingManagement;
