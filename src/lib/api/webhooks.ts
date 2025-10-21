// src/lib/api/webhooks.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '../logger';
import { notificationService } from './notifications';
import { bookingService } from './booking';

export interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount?: number;
    currency?: string;
    payment_id?: string;
    order_id?: string;
    signature?: string;
  };
  timestamp: string;
}

export interface BookingUpdatePayload {
  bookingId: string;
  status: 'confirmed' | 'cancelled' | 'refunded' | 'failed';
  paymentStatus?: 'paid' | 'failed' | 'refunded';
  amount?: number;
  reason?: string;
}

export const webhookService = {
  // Razorpay Payment Webhook Handler
  handleRazorpayWebhook: async (payload: WebhookPayload) => {
    try {
      logger.info('Processing Razorpay webhook:', payload);

      const { event, data } = payload;

      switch (event) {
        case 'payment.captured':
          await webhookService.handlePaymentSuccess(data);
          break;
        case 'payment.failed':
          await webhookService.handlePaymentFailure(data);
          break;
        case 'refund.created':
          await webhookService.handleRefundCreated(data);
          break;
        default:
          logger.warn('Unhandled Razorpay webhook event:', event);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      logger.error('Error processing Razorpay webhook:', error);
      throw error;
    }
  },

  // Handle successful payment
  handlePaymentSuccess: async (data: WebhookPayload['data']) => {
    try {
      const booking = await bookingService.getBookingDetails(data.id);
      
      if (booking) {
        // Update booking status
        await bookingService.updateBookingStatus(
          booking.id,
          'confirmed',
          'paid'
        );

        // Send confirmation notifications
        await notificationService.sendBookingConfirmation(booking);
        
        // Generate invoice
        await webhookService.generateInvoice(booking);

        logger.info(`Payment successful for booking ${booking.id}`);
      }
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  },

  // Handle failed payment
  handlePaymentFailure: async (data: WebhookPayload['data']) => {
    try {
      const booking = await bookingService.getBookingDetails(data.id);
      
      if (booking) {
        // Update booking status
        await bookingService.updateBookingStatus(
          booking.id,
          'failed',
          'failed'
        );

        // Send failure notification
        await notificationService.sendPaymentFailureNotification(booking);

        logger.info(`Payment failed for booking ${booking.id}`);
      }
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  },

  // Handle refund creation
  handleRefundCreated: async (data: WebhookPayload['data']) => {
    try {
      const booking = await bookingService.getBookingDetails(data.id);
      
      if (booking) {
        // Update booking status
        await bookingService.updateBookingStatus(
          booking.id,
          'refunded',
          'refunded'
        );

        // Send refund notification
        await notificationService.sendRefundNotification(booking);

        logger.info(`Refund processed for booking ${booking.id}`);
      }
    } catch (error) {
      logger.error('Error handling refund:', error);
      throw error;
    }
  },

  // Generate invoice for booking
  generateInvoice: async (booking: any) => {
    try {
      const invoiceData = {
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_amount,
        currency: booking.currency,
        status: 'generated',
        generated_at: new Date().toISOString(),
        invoice_number: `INV-${Date.now()}-${booking.id.slice(-6)}`,
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select();

      if (error) throw error;

      logger.info(`Invoice generated for booking ${booking.id}`);
      return data[0];
    } catch (error) {
      logger.error('Error generating invoice:', error);
      throw error;
    }
  },

  // Cancel booking with refund
  cancelBooking: async (bookingId: string, reason: string) => {
    try {
      const booking = await bookingService.getBookingDetails(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status
      await bookingService.updateBookingStatus(bookingId, 'cancelled');

      // Process refund if payment was made
      if (booking.payment_status === 'paid') {
        await webhookService.processRefund(booking, reason);
      }

      // Send cancellation notification
      await notificationService.sendCancellationNotification(booking, reason);

      logger.info(`Booking ${bookingId} cancelled: ${reason}`);
      return { success: true, message: 'Booking cancelled successfully' };
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Process refund
  processRefund: async (booking: any, reason: string) => {
    try {
      // In a real implementation, this would call Razorpay refund API
      const refundData = {
        booking_id: booking.id,
        amount: booking.total_amount,
        currency: booking.currency,
        reason: reason,
        status: 'processed',
        processed_at: new Date().toISOString(),
        refund_id: `REF-${Date.now()}-${booking.id.slice(-6)}`,
      };

      const { data, error } = await supabase
        .from('refunds')
        .insert(refundData)
        .select();

      if (error) throw error;

      logger.info(`Refund processed for booking ${booking.id}`);
      return data[0];
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  },

  // Scheduled job for booking reminders
  sendBookingReminders: async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .eq('start_date', tomorrowStr);

      if (error) throw error;

      for (const booking of bookings || []) {
        await notificationService.sendBookingReminder(booking);
      }

      logger.info(`Sent reminders for ${bookings?.length || 0} bookings`);
    } catch (error) {
      logger.error('Error sending booking reminders:', error);
      throw error;
    }
  },

  // Scheduled job for expired bookings cleanup
  cleanupExpiredBookings: async () => {
    try {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const { data: expiredBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', expiredDate.toISOString());

      if (error) throw error;

      for (const booking of expiredBookings || []) {
        await bookingService.updateBookingStatus(booking.id, 'expired');
        await notificationService.sendBookingExpiredNotification(booking);
      }

      logger.info(`Cleaned up ${expiredBookings?.length || 0} expired bookings`);
    } catch (error) {
      logger.error('Error cleaning up expired bookings:', error);
      throw error;
    }
  },
};
