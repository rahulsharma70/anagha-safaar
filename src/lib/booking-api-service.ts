import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Booking API service for backend integration
export class BookingAPIService {
  private static baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Create booking record
  static async createBooking(bookingData: {
    type: 'hotel' | 'flight' | 'tour';
    itemId: string;
    itemName: string;
    startDate: string;
    endDate?: string;
    guestsCount: number;
    guestDetails: any[];
    addOns: any;
    totalPrice: number;
    userId: string;
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      logger.info('Creating booking record', { 
        type: bookingData.type, 
        itemId: bookingData.itemId,
        userId: bookingData.userId 
      });

      // Generate booking reference
      const bookingRef = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          booking_reference: bookingRef,
          user_id: bookingData.userId,
          item_type: bookingData.type,
          item_id: bookingData.itemId,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate || null,
          guests_count: bookingData.guestsCount,
          guest_details: bookingData.guestDetails,
          total_amount: bookingData.totalPrice,
          currency: 'INR',
          status: 'pending',
          payment_status: 'pending',
          add_ons: bookingData.addOns,
          metadata: {
            item_name: bookingData.itemName,
            created_at: new Date().toISOString(),
            source: 'web'
          }
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create booking', error);
        return { success: false, error: error.message };
      }

      logger.info('Booking created successfully', { 
        bookingId: data.id, 
        bookingRef: bookingRef 
      });

      return { 
        success: true, 
        bookingId: data.id 
      };

    } catch (error) {
      logger.error('Booking creation failed', error);
      return { 
        success: false, 
        error: 'Failed to create booking' 
      };
    }
  }

  // Update booking status
  static async updateBookingStatus(
    bookingId: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'payment_failed',
    paymentStatus?: 'pending' | 'paid' | 'refunded',
    paymentData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      if (paymentData) {
        updateData.payment_data = paymentData;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) {
        logger.error('Failed to update booking status', error);
        return { success: false, error: error.message };
      }

      logger.info('Booking status updated', { 
        bookingId, 
        status, 
        paymentStatus 
      });

      return { success: true };

    } catch (error) {
      logger.error('Booking status update failed', error);
      return { 
        success: false, 
        error: 'Failed to update booking status' 
      };
    }
  }

  // Get booking details
  static async getBooking(bookingId: string): Promise<{ success: boolean; booking?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) {
        logger.error('Failed to get booking', error);
        return { success: false, error: error.message };
      }

      return { success: true, booking: data };

    } catch (error) {
      logger.error('Get booking failed', error);
      return { 
        success: false, 
        error: 'Failed to get booking' 
      };
    }
  }

  // Cancel booking
  static async cancelBooking(
    bookingId: string, 
    reason?: string
  ): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
    try {
      // Get booking details first
      const bookingResult = await this.getBooking(bookingId);
      if (!bookingResult.success || !bookingResult.booking) {
        return { success: false, error: 'Booking not found' };
      }

      const booking = bookingResult.booking;

      // Update booking status
      const updateResult = await this.updateBookingStatus(
        bookingId, 
        'cancelled',
        'refunded',
        {
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          refund_initiated: true
        }
      );

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      logger.info('Booking cancelled', { 
        bookingId, 
        refundAmount: booking.total_amount 
      });

      return { 
        success: true, 
        refundAmount: booking.total_amount 
      };

    } catch (error) {
      logger.error('Booking cancellation failed', error);
      return { 
        success: false, 
        error: 'Failed to cancel booking' 
      };
    }
  }
}

// Razorpay payment service
export class RazorpayService {
  private static razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  private static razorpayKeySecret = import.meta.env.VITE_RAZORPAY_KEY_SECRET;

  // Create Razorpay order
  static async createOrder(
    amount: number,
    currency: string = 'INR',
    metadata: {
      bookingId: string;
      itemType: string;
      userId: string;
    }
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      logger.info('Creating Razorpay order', { 
        amount, 
        currency, 
        metadata 
      });

      // In a real implementation, this would call your backend API
      // For now, we'll simulate the order creation
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store order details in database for tracking
      const { error } = await supabase
        .from('payment_orders')
        .insert([{
          order_id: orderId,
          booking_id: metadata.bookingId,
          amount: amount,
          currency: currency,
          status: 'created',
          metadata: metadata,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Failed to store order details', error);
        return { success: false, error: error.message };
      }

      logger.info('Razorpay order created', { orderId });

      return { 
        success: true, 
        orderId 
      };

    } catch (error) {
      logger.error('Razorpay order creation failed', error);
      return { 
        success: false, 
        error: 'Failed to create payment order' 
      };
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      // In a real implementation, you would verify the signature using Razorpay's webhook secret
      // For now, we'll return true for demo purposes
      logger.info('Verifying payment signature', { 
        razorpayOrderId, 
        razorpayPaymentId 
      });
      
      return true;
    } catch (error) {
      logger.error('Payment signature verification failed', error);
      return false;
    }
  }

  // Process refund
  static async processRefund(
    paymentId: string,
    amount: number,
    reason: string = 'Booking cancellation'
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      logger.info('Processing refund', { 
        paymentId, 
        amount, 
        reason 
      });

      // In a real implementation, this would call Razorpay's refund API
      const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store refund details
      const { error } = await supabase
        .from('payment_refunds')
        .insert([{
          refund_id: refundId,
          payment_id: paymentId,
          amount: amount,
          reason: reason,
          status: 'processed',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Failed to store refund details', error);
        return { success: false, error: error.message };
      }

      logger.info('Refund processed', { refundId });

      return { 
        success: true, 
        refundId 
      };

    } catch (error) {
      logger.error('Refund processing failed', error);
      return { 
        success: false, 
        error: 'Failed to process refund' 
      };
    }
  }
}

// Notification service
export class NotificationService {
  private static sendGridApiKey = import.meta.env.VITE_SENDGRID_API_KEY;
  private static twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  private static twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  private static twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

  // Send email notification
  static async sendEmailNotification(
    to: string,
    subject: string,
    templateId: string,
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Sending email notification', { to, subject, templateId });

      // In a real implementation, this would use SendGrid API
      // For now, we'll simulate the email sending
      
      // Store notification in database
      const { error } = await supabase
        .from('notifications')
        .insert([{
          type: 'email',
          recipient: to,
          subject: subject,
          template_id: templateId,
          data: data,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Failed to store email notification', error);
        return { success: false, error: error.message };
      }

      logger.info('Email notification sent', { to });

      return { success: true };

    } catch (error) {
      logger.error('Email notification failed', error);
      return { 
        success: false, 
        error: 'Failed to send email notification' 
      };
    }
  }

  // Send SMS notification
  static async sendSMSNotification(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Sending SMS notification', { to });

      // In a real implementation, this would use Twilio API
      // For now, we'll simulate the SMS sending
      
      // Store notification in database
      const { error } = await supabase
        .from('notifications')
        .insert([{
          type: 'sms',
          recipient: to,
          message: message,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Failed to store SMS notification', error);
        return { success: false, error: error.message };
      }

      logger.info('SMS notification sent', { to });

      return { success: true };

    } catch (error) {
      logger.error('SMS notification failed', error);
      return { 
        success: false, 
        error: 'Failed to send SMS notification' 
      };
    }
  }

  // Send booking confirmation
  static async sendBookingConfirmation(booking: any): Promise<{ success: boolean; error?: string }> {
    try {
      const guestEmail = booking.guest_details?.[0]?.email;
      const guestPhone = booking.guest_details?.[0]?.phone;

      if (!guestEmail && !guestPhone) {
        return { success: false, error: 'No contact information available' };
      }

      // Send email confirmation
      if (guestEmail) {
        await this.sendEmailNotification(
          guestEmail,
          `Booking Confirmation - ${booking.booking_reference}`,
          'booking_confirmation',
          {
            booking_reference: booking.booking_reference,
            item_name: booking.metadata?.item_name,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            guest_details: booking.guest_details
          }
        );
      }

      // Send SMS confirmation
      if (guestPhone) {
        await this.sendSMSNotification(
          guestPhone,
          `Your booking ${booking.booking_reference} is confirmed! Total: ₹${booking.total_amount}`
        );
      }

      return { success: true };

    } catch (error) {
      logger.error('Booking confirmation notification failed', error);
      return { 
        success: false, 
        error: 'Failed to send booking confirmation' 
      };
    }
  }
}

export default {
  BookingAPIService,
  RazorpayService,
  NotificationService
};
