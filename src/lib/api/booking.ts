import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from '@/lib/api/payment';
import { notificationService } from '@/lib/api/notifications';

export interface BookingRequest {
  itemId: string;
  itemType: 'hotel' | 'flight' | 'tour';
  userId: string;
  startDate: string;
  endDate?: string;
  guestsCount: number;
  totalAmount: number;
  currency: string;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

class BookingService {
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      // Generate unique booking reference
      const bookingReference = `AS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingReference,
          item_id: request.itemId,
          item_type: request.itemType,
          user_id: request.userId,
          start_date: request.startDate,
          end_date: request.endDate,
          guests_count: request.guestsCount,
          total_amount: request.totalAmount,
          currency: request.currency,
          guest_details: request.guestDetails,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        bookingReference: data.booking_reference,
        status: data.status as any,
        paymentStatus: data.payment_status as any,
        totalAmount: data.total_amount,
        currency: data.currency || 'INR',
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  async processPayment(request: PaymentRequest): Promise<{ orderId: string; paymentId?: string }> {
    try {
      // Create Razorpay order
      const order = await razorpayService.createOrder({
        amount: request.amount,
        currency: request.currency,
        orderId: `order_${Date.now()}`,
        customerId: request.bookingId,
        customerName: request.customerDetails.name,
        customerEmail: request.customerDetails.email,
        customerPhone: request.customerDetails.phone,
        description: `Booking payment for ${request.bookingId}`,
        bookingId: request.bookingId,
      });

      return {
        orderId: order.orderId,
      };
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  async confirmPayment(bookingId: string, paymentDetails: any): Promise<BookingResponse> {
    try {
      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Send confirmation notifications
      await this.sendBookingConfirmation(bookingId);

      return {
        id: data.id,
        bookingReference: data.booking_reference,
        status: data.status as any,
        paymentStatus: data.payment_status as any,
        totalAmount: data.total_amount,
        currency: data.currency || 'INR',
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async cancelBooking(bookingId: string, reason: string): Promise<BookingResponse> {
    try {
      // Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Process refund if payment was made
      if (booking.payment_status === 'paid') {
        await this.processRefund(bookingId, booking.total_amount, reason);
      }

      // Send cancellation notifications
      await this.sendBookingCancellation(bookingId);

      return {
        id: data.id,
        bookingReference: data.booking_reference,
        status: data.status as any,
        paymentStatus: data.payment_status as any,
        totalAmount: data.total_amount,
        currency: data.currency || 'INR',
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  async processRefund(bookingId: string, amount: number, reason: string): Promise<void> {
    try {
      // Get payment details from booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Process refund through Razorpay
      const refund = await razorpayService.refundPayment({
        paymentId: booking.payment_id || '',
        amount: amount,
        reason: reason,
        notes: `Refund for booking ${booking.booking_reference}`,
      });

      // Update booking payment status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

    } catch (error) {
      console.error('Failed to process refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(booking => ({
        id: booking.id,
        bookingReference: booking.booking_reference,
        status: booking.status as any,
        paymentStatus: booking.payment_status as any,
        totalAmount: booking.total_amount,
        currency: booking.currency || 'INR',
        createdAt: booking.created_at,
      }));
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async getBookingDetails(bookingId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hotels:item_id(name, location_city, location_state),
          flights:item_id(airline, departure_city, arrival_city),
          tours:item_id(name, location_city, location_state)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      throw new Error('Failed to fetch booking details');
    }
  }

  private async sendBookingConfirmation(bookingId: string): Promise<void> {
    try {
      const booking = await this.getBookingDetails(bookingId);
      const guestDetails = booking.guest_details;

      await notificationService.sendBookingConfirmation({
        customerEmail: guestDetails.email,
        customerPhone: guestDetails.phone,
        bookingId: booking.booking_reference,
        bookingDetails: {
          customerName: guestDetails.name,
          type: booking.item_type,
          date: booking.start_date,
          totalAmount: booking.total_amount,
          currency: booking.currency,
        },
      });
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
    }
  }

  private async sendBookingCancellation(bookingId: string): Promise<void> {
    try {
      const booking = await this.getBookingDetails(bookingId);
      const guestDetails = booking.guest_details;

      await notificationService.sendBookingCancellation({
        customerEmail: guestDetails.email,
        customerPhone: guestDetails.phone,
        bookingId: booking.booking_reference,
        refundAmount: booking.total_amount,
        currency: booking.currency,
      });
    } catch (error) {
      console.error('Failed to send booking cancellation:', error);
    }
  }
}

export const bookingService = new BookingService();
