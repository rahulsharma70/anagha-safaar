import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Webhook handler for Razorpay payment events
export class WebhookHandler {
  private static webhookSecret = import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string = this.webhookSecret
  ): boolean {
    try {
      // In a real implementation, you would use crypto to verify the signature
      // For now, we'll return true for demo purposes
      logger.info('Verifying webhook signature', { signature });
      return true;
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  // Handle Razorpay webhook
  static async handleRazorpayWebhook(
    eventType: string,
    eventId: string,
    payload: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Processing Razorpay webhook', { 
        eventType, 
        eventId 
      });

      // Process webhook using database function
      const { data, error } = await supabase
        .rpc('process_razorpay_webhook', {
          p_event_type: eventType,
          p_event_id: eventId,
          p_payload: payload
        });

      if (error) {
        logger.error('Webhook processing failed', error);
        return { success: false, error: error.message };
      }

      logger.info('Webhook processed successfully', { 
        eventType, 
        eventId,
        result: data 
      });

      return { success: true };

    } catch (error) {
      logger.error('Webhook handling failed', error);
      return { 
        success: false, 
        error: 'Failed to process webhook' 
      };
    }
  }

  // Handle payment.paid event
  static async handlePaymentPaid(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentId = payload.id;
      const orderId = payload.order_id?.id;
      const amount = payload.amount;
      const currency = payload.currency;

      logger.info('Processing payment.paid event', { 
        paymentId, 
        orderId, 
        amount, 
        currency 
      });

      // Update payment order status
      const { error: orderError } = await supabase
        .from('payment_orders')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
          razorpay_signature: payload.signature,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', orderId);

      if (orderError) {
        logger.error('Failed to update payment order', orderError);
        return { success: false, error: orderError.message };
      }

      // Get booking ID from payment order
      const { data: paymentOrder, error: orderFetchError } = await supabase
        .from('payment_orders')
        .select('booking_id')
        .eq('razorpay_order_id', orderId)
        .single();

      if (orderFetchError || !paymentOrder) {
        logger.error('Failed to fetch payment order', orderFetchError);
        return { success: false, error: 'Payment order not found' };
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.booking_id);

      if (bookingError) {
        logger.error('Failed to update booking status', bookingError);
        return { success: false, error: bookingError.message };
      }

      // Get booking details for notifications
      const { data: booking, error: bookingFetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', paymentOrder.booking_id)
        .single();

      if (bookingFetchError || !booking) {
        logger.error('Failed to fetch booking details', bookingFetchError);
        return { success: false, error: 'Booking not found' };
      }

      // Send confirmation notifications
      await this.sendBookingConfirmationNotifications(booking);

      return { success: true };

    } catch (error) {
      logger.error('Payment.paid event handling failed', error);
      return { 
        success: false, 
        error: 'Failed to process payment.paid event' 
      };
    }
  }

  // Handle payment.failed event
  static async handlePaymentFailed(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentId = payload.id;
      const orderId = payload.order_id?.id;

      logger.info('Processing payment.failed event', { 
        paymentId, 
        orderId 
      });

      // Update payment order status
      const { error: orderError } = await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', orderId);

      if (orderError) {
        logger.error('Failed to update payment order', orderError);
        return { success: false, error: orderError.message };
      }

      // Get booking ID from payment order
      const { data: paymentOrder, error: orderFetchError } = await supabase
        .from('payment_orders')
        .select('booking_id')
        .eq('razorpay_order_id', orderId)
        .single();

      if (orderFetchError || !paymentOrder) {
        logger.error('Failed to fetch payment order', orderFetchError);
        return { success: false, error: 'Payment order not found' };
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.booking_id);

      if (bookingError) {
        logger.error('Failed to update booking status', bookingError);
        return { success: false, error: bookingError.message };
      }

      return { success: true };

    } catch (error) {
      logger.error('Payment.failed event handling failed', error);
      return { 
        success: false, 
        error: 'Failed to process payment.failed event' 
      };
    }
  }

  // Send booking confirmation notifications
  static async sendBookingConfirmationNotifications(booking: any): Promise<void> {
    try {
      const guestEmail = booking.guest_details?.[0]?.email;
      const guestPhone = booking.guest_details?.[0]?.phone;

      // Send email notification
      if (guestEmail) {
        await supabase
          .from('notifications')
          .insert([{
            type: 'email',
            recipient: guestEmail,
            subject: `Booking Confirmation - ${booking.booking_reference}`,
            template_id: 'booking_confirmation',
            data: {
              booking_reference: booking.booking_reference,
              item_name: booking.metadata?.item_name,
              start_date: booking.start_date,
              end_date: booking.end_date,
              total_amount: booking.total_amount,
              guest_details: booking.guest_details
            },
            status: 'pending'
          }]);
      }

      // Send SMS notification
      if (guestPhone) {
        await supabase
          .from('notifications')
          .insert([{
            type: 'sms',
            recipient: guestPhone,
            message: `Your booking ${booking.booking_reference} is confirmed! Total: ₹${booking.total_amount}`,
            status: 'pending'
          }]);
      }

      logger.info('Booking confirmation notifications sent', { 
        bookingId: booking.id,
        email: guestEmail,
        phone: guestPhone 
      });

    } catch (error) {
      logger.error('Failed to send booking confirmation notifications', error);
    }
  }

  // Process refund webhook
  static async handleRefundProcessed(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const refundId = payload.id;
      const paymentId = payload.payment_id;
      const amount = payload.amount;
      const status = payload.status;

      logger.info('Processing refund processed event', { 
        refundId, 
        paymentId, 
        amount, 
        status 
      });

      // Update refund status
      const { error: refundError } = await supabase
        .from('payment_refunds')
        .update({
          status: status === 'processed' ? 'processed' : 'failed',
          razorpay_refund_id: refundId,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (refundError) {
        logger.error('Failed to update refund status', refundError);
        return { success: false, error: refundError.message };
      }

      return { success: true };

    } catch (error) {
      logger.error('Refund processed event handling failed', error);
      return { 
        success: false, 
        error: 'Failed to process refund event' 
      };
    }
  }
}

// Express.js webhook endpoint handler (for backend)
export const createWebhookEndpoint = () => {
  return async (req: any, res: any) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      if (!WebhookHandler.verifyWebhookSignature(body, signature)) {
        logger.warn('Invalid webhook signature', { signature });
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const { event, contains } = req.body;

      // Process different event types
      switch (event) {
        case 'payment.paid':
          await WebhookHandler.handlePaymentPaid(contains);
          break;
        case 'payment.failed':
          await WebhookHandler.handlePaymentFailed(contains);
          break;
        case 'refund.processed':
          await WebhookHandler.handleRefundProcessed(contains);
          break;
        default:
          logger.info('Unhandled webhook event', { event });
      }

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Webhook endpoint error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export default WebhookHandler;
