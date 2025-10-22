import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';
import { NotificationService, NotificationData } from '../services/notificationService';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
// =============================================================================

const notificationTriggerSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  notificationType: z.enum(['booking_confirmation', 'payment_receipt', 'booking_cancellation', 'payment_failure']),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).min(1, 'At least one channel required'),
  customMessage: z.string().optional(),
});

const bulkNotificationSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1, 'At least one booking ID required'),
  notificationType: z.enum(['booking_confirmation', 'payment_receipt', 'booking_cancellation', 'payment_failure']),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).min(1, 'At least one channel required'),
});

// =============================================================================
// 2. TRIGGER SINGLE NOTIFICATION
// =============================================================================

router.post('/trigger',
  validateRequest({ body: notificationTriggerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { bookingId, notificationType, channels, customMessage } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          hotels(name, location_city, location_state),
          tours(name, location_city, location_state),
          flights(airline, flight_number, departure_city, arrival_city)
        `)
        .eq('id', bookingId)
        .eq('user_id', userId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email, phone, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prepare notification data
      const notificationData: NotificationData = {
        userId: userId,
        email: user.email,
        phone: user.phone,
        name: `${user.first_name} ${user.last_name}`,
        bookingId: bookingId,
        bookingReference: booking.booking_reference,
        itemType: booking.item_type,
        itemName: getItemName(booking),
        amount: booking.total_price,
        currency: 'INR',
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        guests: booking.guests,
        specialRequests: booking.special_requests,
        addOns: booking.add_ons
      };

      // Send notifications
      const notificationId = `${notificationType}_${bookingId}_${Date.now()}`;
      
      const results = await NotificationService.sendBulkNotifications([{
        id: notificationId,
        type: notificationType,
        data: notificationData,
        channels: channels
      }]);

      logger.info('Manual notification triggered', {
        userId,
        bookingId,
        notificationType,
        channels,
        results: results.map(r => ({ channel: r.channel, success: r.success }))
      });

      res.json({
        success: true,
        data: {
          notificationId,
          bookingId,
          notificationType,
          channels,
          results
        },
        message: 'Notification triggered successfully'
      });

    } catch (error) {
      logger.error('Error triggering notification', {
        userId,
        bookingId,
        notificationType,
        error: error.message
      });
      throw error;
    }
  })
);

// =============================================================================
// 3. TRIGGER BULK NOTIFICATIONS
// =============================================================================

router.post('/trigger/bulk',
  validateRequest({ body: bulkNotificationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { bookingIds, notificationType, channels } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          hotels(name, location_city, location_state),
          tours(name, location_city, location_state),
          flights(airline, flight_number, departure_city, arrival_city)
        `)
        .in('id', bookingIds)
        .eq('user_id', userId);

      if (bookingsError || !bookings || bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No bookings found',
          code: 'BOOKINGS_NOT_FOUND'
        });
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email, phone, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prepare notifications
      const notifications = bookings.map(booking => ({
        id: `${notificationType}_${booking.id}_${Date.now()}`,
        type: notificationType,
        data: {
          userId: userId,
          email: user.email,
          phone: user.phone,
          name: `${user.first_name} ${user.last_name}`,
          bookingId: booking.id,
          bookingReference: booking.booking_reference,
          itemType: booking.item_type,
          itemName: getItemName(booking),
          amount: booking.total_price,
          currency: 'INR',
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          guests: booking.guests,
          specialRequests: booking.special_requests,
          addOns: booking.add_ons
        } as NotificationData,
        channels: channels
      }));

      // Send bulk notifications
      const results = await NotificationService.sendBulkNotifications(notifications);

      logger.info('Bulk notifications triggered', {
        userId,
        bookingIds,
        notificationType,
        channels,
        totalNotifications: notifications.length,
        successfulResults: results.filter(r => r.success).length,
        failedResults: results.filter(r => !r.success).length
      });

      res.json({
        success: true,
        data: {
          totalNotifications: notifications.length,
          successfulResults: results.filter(r => r.success).length,
          failedResults: results.filter(r => !r.success).length,
          results
        },
        message: 'Bulk notifications triggered successfully'
      });

    } catch (error) {
      logger.error('Error triggering bulk notifications', {
        userId,
        bookingIds,
        notificationType,
        error: error.message
      });
      throw error;
    }
  })
);

// =============================================================================
// 4. GET NOTIFICATION STATUS
// =============================================================================

router.get('/status/:notificationId',
  asyncHandler(async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    try {
      const status = await NotificationService.getNotificationStatus(notificationId);

      res.json({
        success: true,
        data: {
          notificationId,
          status,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error getting notification status', {
        notificationId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get notification status',
        code: 'NOTIFICATION_STATUS_ERROR'
      });
    }
  })
);

// =============================================================================
// 5. GET NOTIFICATION HISTORY
// =============================================================================

router.get('/history',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10, type, channel } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // This would typically query a notifications table
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit,
            hasNextPage: false,
            hasPrevPage: false
          }
        },
        message: 'Notification history retrieved successfully'
      });

    } catch (error) {
      logger.error('Error getting notification history', {
        userId,
        error: error.message
      });
      throw error;
    }
  })
);

// =============================================================================
// 6. TEST NOTIFICATION SERVICE
// =============================================================================

router.post('/test',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { email, phone, channels = ['email'] } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Test notification data
      const testData: NotificationData = {
        userId: userId,
        email: email || 'test@example.com',
        phone: phone || '+919876543210',
        name: 'Test User',
        bookingId: 'test-booking-id',
        bookingReference: 'TEST123456',
        itemType: 'hotel',
        itemName: 'Test Hotel, Mumbai',
        amount: 5000,
        currency: 'INR',
        checkInDate: '2024-12-01T14:00:00Z',
        checkOutDate: '2024-12-03T11:00:00Z',
        guests: 2
      };

      const notificationId = `test_${Date.now()}`;
      
      const results = await NotificationService.sendBulkNotifications([{
        id: notificationId,
        type: 'booking_confirmation',
        data: testData,
        channels: channels
      }]);

      logger.info('Test notification sent', {
        userId,
        channels,
        results: results.map(r => ({ channel: r.channel, success: r.success }))
      });

      res.json({
        success: true,
        data: {
          notificationId,
          channels,
          results
        },
        message: 'Test notification sent successfully'
      });

    } catch (error) {
      logger.error('Error sending test notification', {
        userId,
        error: error.message
      });
      throw error;
    }
  })
);

// =============================================================================
// 7. HELPER FUNCTIONS
// =============================================================================

function getItemName(booking: any): string {
  if (booking.item_type === 'hotel' && booking.hotels) {
    return `${booking.hotels.name}, ${booking.hotels.location_city}`;
  } else if (booking.item_type === 'tour' && booking.tours) {
    return `${booking.tours.name}, ${booking.tours.location_city}`;
  } else if (booking.item_type === 'flight' && booking.flights) {
    return `${booking.flights.airline} ${booking.flights.flight_number} - ${booking.flights.departure_city} to ${booking.flights.arrival_city}`;
  }
  return 'Travel Service';
}

export default router;
