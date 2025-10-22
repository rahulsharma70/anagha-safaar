import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BookingAPIService, RazorpayService, NotificationService } from '@/lib/booking-api-service';
import { WebhookHandler } from '@/lib/webhook-handler';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn()
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('BookingAPIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const mockBookingData = {
        type: 'hotel' as const,
        itemId: 'hotel-123',
        itemName: 'Test Hotel',
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        guestsCount: 2,
        guestDetails: [{
          id: 'guest-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          idType: 'passport' as const,
          idNumber: 'P123456789'
        }],
        addOns: {
          travelInsurance: true,
          mealPlan: 'breakfast' as const,
          specialRequests: 'Vegetarian meals'
        },
        totalPrice: 5000,
        userId: 'user-123'
      };

      const mockResponse = {
        data: { id: 'booking-123' },
        error: null
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await BookingAPIService.createBooking(mockBookingData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking-123');
    });

    it('should handle booking creation failure', async () => {
      const mockBookingData = {
        type: 'hotel' as const,
        itemId: 'hotel-123',
        itemName: 'Test Hotel',
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        guestsCount: 2,
        guestDetails: [],
        addOns: { travelInsurance: false, specialRequests: '' },
        totalPrice: 5000,
        userId: 'user-123'
      };

      const mockError = new Error('Database error');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(mockError)
          })
        })
      });

      const result = await BookingAPIService.createBooking(mockBookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create booking');
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status successfully', async () => {
      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockResponse)
        })
      });

      const result = await BookingAPIService.updateBookingStatus(
        'booking-123',
        'confirmed',
        'paid'
      );

      expect(result.success).toBe(true);
    });

    it('should handle status update failure', async () => {
      const mockError = new Error('Update failed');
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(mockError)
        })
      });

      const result = await BookingAPIService.updateBookingStatus(
        'booking-123',
        'confirmed',
        'paid'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update booking status');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        total_amount: 5000,
        status: 'confirmed'
      };

      const mockGetBookingResponse = {
        data: mockBooking,
        error: null
      };

      const mockUpdateResponse = { error: null };

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockGetBookingResponse)
            })
          })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(mockUpdateResponse)
          })
        });

      const result = await BookingAPIService.cancelBooking('booking-123', 'User request');

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(5000);
    });
  });
});

describe('RazorpayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create Razorpay order successfully', async () => {
      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await RazorpayService.createOrder(
        500000, // 5000 INR in paise
        'INR',
        {
          bookingId: 'booking-123',
          itemType: 'hotel',
          userId: 'user-123'
        }
      );

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('should handle order creation failure', async () => {
      const mockError = new Error('Order creation failed');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(mockError)
      });

      const result = await RazorpayService.createOrder(
        500000,
        'INR',
        {
          bookingId: 'booking-123',
          itemType: 'hotel',
          userId: 'user-123'
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create payment order');
    });
  });

  describe('verifyPaymentSignature', () => {
    it('should verify payment signature successfully', () => {
      const result = RazorpayService.verifyPaymentSignature(
        'order_123',
        'pay_456',
        'signature_789'
      );

      expect(result).toBe(true);
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await RazorpayService.processRefund(
        'pay_123',
        500000,
        'Booking cancellation'
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toBeDefined();
    });
  });
});

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmailNotification', () => {
    it('should send email notification successfully', async () => {
      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await NotificationService.sendEmailNotification(
        'test@example.com',
        'Test Subject',
        'test_template',
        { name: 'John Doe' }
      );

      expect(result.success).toBe(true);
    });

    it('should handle email sending failure', async () => {
      const mockError = new Error('Email sending failed');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(mockError)
      });

      const result = await NotificationService.sendEmailNotification(
        'test@example.com',
        'Test Subject',
        'test_template',
        { name: 'John Doe' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email notification');
    });
  });

  describe('sendSMSNotification', () => {
    it('should send SMS notification successfully', async () => {
      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await NotificationService.sendSMSNotification(
        '+1234567890',
        'Test SMS message'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation notifications', async () => {
      const mockBooking = {
        booking_reference: 'BK123456',
        guest_details: [{
          email: 'test@example.com',
          phone: '+1234567890'
        }],
        total_amount: 5000,
        metadata: { item_name: 'Test Hotel' },
        start_date: '2024-02-01',
        end_date: '2024-02-03'
      };

      const mockResponse = { error: null };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await NotificationService.sendBookingConfirmation(mockBooking);

      expect(result.success).toBe(true);
    });

    it('should handle missing contact information', async () => {
      const mockBooking = {
        booking_reference: 'BK123456',
        guest_details: [],
        total_amount: 5000
      };

      const result = await NotificationService.sendBookingConfirmation(mockBooking);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No contact information available');
    });
  });
});

describe('WebhookHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', () => {
      const result = WebhookHandler.verifyWebhookSignature(
        'test_payload',
        'test_signature'
      );

      expect(result).toBe(true);
    });
  });

  describe('handleRazorpayWebhook', () => {
    it('should handle Razorpay webhook successfully', async () => {
      const mockResponse = {
        data: { success: true },
        error: null
      };

      (supabase.rpc as any).mockResolvedValue(mockResponse);

      const result = await WebhookHandler.handleRazorpayWebhook(
        'payment.paid',
        'event_123',
        { id: 'pay_456' }
      );

      expect(result.success).toBe(true);
    });

    it('should handle webhook processing failure', async () => {
      const mockError = new Error('Webhook processing failed');
      (supabase.rpc as any).mockRejectedValue(mockError);

      const result = await WebhookHandler.handleRazorpayWebhook(
        'payment.paid',
        'event_123',
        { id: 'pay_456' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to process webhook');
    });
  });

  describe('handlePaymentPaid', () => {
    it('should handle payment.paid event successfully', async () => {
      const mockPayload = {
        id: 'pay_123',
        order_id: { id: 'order_456' },
        amount: 500000,
        currency: 'INR',
        signature: 'sig_789'
      };

      const mockPaymentOrder = {
        data: { booking_id: 'booking_123' },
        error: null
      };

      const mockBooking = {
        data: {
          id: 'booking_123',
          booking_reference: 'BK123456',
          guest_details: [{ email: 'test@example.com' }],
          total_amount: 5000
        },
        error: null
      };

      (supabase.from as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockPaymentOrder)
            })
          })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockBooking)
            })
          })
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null })
        });

      const result = await WebhookHandler.handlePaymentPaid(mockPayload);

      expect(result.success).toBe(true);
    });
  });

  describe('handlePaymentFailed', () => {
    it('should handle payment.failed event successfully', async () => {
      const mockPayload = {
        id: 'pay_123',
        order_id: { id: 'order_456' }
      };

      const mockPaymentOrder = {
        data: { booking_id: 'booking_123' },
        error: null
      };

      (supabase.from as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockPaymentOrder)
            })
          })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        });

      const result = await WebhookHandler.handlePaymentFailed(mockPayload);

      expect(result.success).toBe(true);
    });
  });
});

// Integration tests
describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full booking flow successfully', async () => {
    // Mock successful booking creation
    const mockBookingResponse = {
      data: { id: 'booking-123' },
      error: null
    };

    // Mock successful order creation
    const mockOrderResponse = { error: null };

    // Mock successful payment order creation
    const mockPaymentOrderResponse = { error: null };

    (supabase.from as any)
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockBookingResponse)
          })
        })
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue(mockOrderResponse)
      });

    // Step 1: Create booking
    const bookingResult = await BookingAPIService.createBooking({
      type: 'hotel',
      itemId: 'hotel-123',
      itemName: 'Test Hotel',
      startDate: '2024-02-01',
      endDate: '2024-02-03',
      guestsCount: 2,
      guestDetails: [{
        id: 'guest-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        idType: 'passport',
        idNumber: 'P123456789'
      }],
      addOns: { travelInsurance: true, specialRequests: '' },
      totalPrice: 5000,
      userId: 'user-123'
    });

    expect(bookingResult.success).toBe(true);

    // Step 2: Create payment order
    const orderResult = await RazorpayService.createOrder(
      500000,
      'INR',
      {
        bookingId: bookingResult.bookingId!,
        itemType: 'hotel',
        userId: 'user-123'
      }
    );

    expect(orderResult.success).toBe(true);

    // Step 3: Simulate payment success
    const paymentSuccessResult = await BookingAPIService.updateBookingStatus(
      bookingResult.bookingId!,
      'confirmed',
      'paid',
      {
        razorpay_payment_id: 'pay_123',
        paid_at: new Date().toISOString()
      }
    );

    expect(paymentSuccessResult.success).toBe(true);
  });

  it('should handle booking cancellation with refund', async () => {
    const mockBooking = {
      data: {
        id: 'booking-123',
        total_amount: 5000,
        razorpay_payment_id: 'pay_123'
      },
      error: null
    };

    const mockUpdateResponse = { error: null };
    const mockRefundResponse = { error: null };

    (supabase.from as any)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockBooking)
          })
        })
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockUpdateResponse)
        })
      });

    // Cancel booking
    const cancelResult = await BookingAPIService.cancelBooking('booking-123', 'User request');

    expect(cancelResult.success).toBe(true);
    expect(cancelResult.refundAmount).toBe(5000);

    // Process refund
    const refundResult = await RazorpayService.processRefund(
      'pay_123',
      500000,
      'Booking cancellation'
    );

    expect(refundResult.success).toBe(true);
  });
});

// Performance tests
describe('Performance Tests', () => {
  it('should handle concurrent booking requests', async () => {
    const mockResponse = {
      data: { id: 'booking-123' },
      error: null
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    const bookingPromises = Array.from({ length: 10 }, (_, i) =>
      BookingAPIService.createBooking({
        type: 'hotel',
        itemId: `hotel-${i}`,
        itemName: `Test Hotel ${i}`,
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        guestsCount: 2,
        guestDetails: [],
        addOns: { travelInsurance: false, specialRequests: '' },
        totalPrice: 5000,
        userId: `user-${i}`
      })
    );

    const results = await Promise.all(bookingPromises);

    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});

export default {
  BookingAPIService,
  RazorpayService,
  NotificationService,
  WebhookHandler
};
