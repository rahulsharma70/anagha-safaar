import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { asyncHandler } from '../middleware/index';
import { RedisService } from '../services/redisService';

const router = Router();

// =============================================================================
// 1. WEBHOOK RETRY AND ERROR HANDLING SERVICE
// =============================================================================

class WebhookRetryService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s
  private static readonly RETRY_PREFIX = 'webhook_retry:';

  static async processWithRetry(
    webhookId: string,
    eventType: string,
    payload: any,
    handler: (payload: any) => Promise<void>
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        logger.info('Processing webhook', {
          webhookId,
          eventType,
          attempt: attempt + 1,
          maxRetries: this.MAX_RETRIES + 1
        });

        await handler(payload);

        // Success - remove any existing retry record
        await RedisService.del(`${this.RETRY_PREFIX}${webhookId}`);

        logger.info('Webhook processed successfully', {
          webhookId,
          eventType,
          attempt: attempt + 1
        });

        return;
      } catch (error) {
        lastError = error as Error;
        
        logger.error('Webhook processing failed', {
          webhookId,
          eventType,
          attempt: attempt + 1,
          error: error.message,
          stack: error.stack
        });

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt];
          
          // Store retry information
          await RedisService.setex(
            `${this.RETRY_PREFIX}${webhookId}`,
            3600, // 1 hour TTL
            JSON.stringify({
              eventType,
              payload,
              attempt: attempt + 1,
              lastError: error.message,
              nextRetryAt: new Date(Date.now() + delay).toISOString()
            })
          );

          logger.warn('Scheduling webhook retry', {
            webhookId,
            eventType,
            attempt: attempt + 1,
            delayMs: delay,
            nextRetryAt: new Date(Date.now() + delay).toISOString()
          });

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    logger.error('Webhook processing failed after all retries', {
      webhookId,
      eventType,
      maxRetries: this.MAX_RETRIES,
      finalError: lastError?.message
    });

    // Store failed webhook for manual review
    await RedisService.setex(
      `webhook_failed:${webhookId}`,
      86400, // 24 hours TTL
      JSON.stringify({
        eventType,
        payload,
        error: lastError?.message,
        failedAt: new Date().toISOString(),
        attempts: this.MAX_RETRIES + 1
      })
    );

    throw lastError;
  }

  static async getRetryStatus(webhookId: string): Promise<any> {
    const retryData = await RedisService.get(`${this.RETRY_PREFIX}${webhookId}`);
    const failedData = await RedisService.get(`webhook_failed:${webhookId}`);
    
    return {
      retry: retryData ? JSON.parse(retryData) : null,
      failed: failedData ? JSON.parse(failedData) : null
    };
  }
}

// =============================================================================
// 2. ENHANCED WEBHOOK HANDLER WITH SIGNATURE VERIFICATION
// =============================================================================

router.post('/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookId = req.headers['x-razorpay-event-id'] as string;
    const body = JSON.stringify(req.body);
    const timestamp = Date.now();

    // Generate unique webhook processing ID
    const processingId = `webhook_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Razorpay webhook received', {
      processingId,
      webhookId,
      signature: signature ? 'present' : 'missing',
      bodySize: body.length,
      timestamp: new Date(timestamp).toISOString()
    });

    try {
      // Step 1: Verify webhook signature
      if (!signature) {
        logger.error('Missing webhook signature', { processingId, webhookId });
        return res.status(400).json({
          success: false,
          error: 'Missing signature',
          code: 'MISSING_SIGNATURE'
        });
      }

      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.error('Webhook secret not configured', { processingId });
        return res.status(500).json({
          success: false,
          error: 'Webhook configuration error',
          code: 'WEBHOOK_CONFIG_ERROR'
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.error('Invalid webhook signature', {
          processingId,
          webhookId,
          receivedSignature: signature,
          expectedSignature,
          bodyPreview: body.substring(0, 100) + '...'
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      // Step 2: Parse and validate webhook data
      const event = req.body;
      if (!event || !event.event || !event.payload) {
        logger.error('Invalid webhook payload structure', {
          processingId,
          webhookId,
          event: event?.event || 'missing',
          hasPayload: !!event?.payload
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid payload structure',
          code: 'INVALID_PAYLOAD'
        });
      }

      logger.info('Webhook signature verified', {
        processingId,
        webhookId,
        eventType: event.event,
        accountId: event.account_id,
        createdAt: event.created_at
      });

      // Step 3: Process webhook with retry logic
      await WebhookRetryService.processWithRetry(
        webhookId || processingId,
        event.event,
        event.payload,
        async (payload) => {
          await handleWebhookEvent(event.event, payload, processingId);
        }
      );

      logger.info('Webhook processed successfully', {
        processingId,
        webhookId,
        eventType: event.event
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        processingId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Webhook processing failed', {
        processingId,
        webhookId,
        error: error.message,
        stack: error.stack,
        bodyPreview: body.substring(0, 200) + '...'
      });

      // Return 200 to prevent Razorpay from retrying
      // (we handle retries internally)
      res.status(200).json({
        success: false,
        error: 'Webhook processing failed',
        processingId,
        timestamp: new Date().toISOString()
      });
    }
  })
);

// =============================================================================
// 3. WEBHOOK EVENT HANDLERS
// =============================================================================

async function handleWebhookEvent(eventType: string, payload: any, processingId: string): Promise<void> {
  logger.info('Handling webhook event', {
    processingId,
    eventType,
    payloadKeys: Object.keys(payload)
  });

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(payload.payment.entity, processingId);
      break;
    case 'payment.failed':
      await handlePaymentFailed(payload.payment.entity, processingId);
      break;
    case 'refund.created':
      await handleRefundCreated(payload.refund.entity, processingId);
      break;
    case 'order.paid':
      await handleOrderPaid(payload.order.entity, processingId);
      break;
    case 'payment.authorized':
      await handlePaymentAuthorized(payload.payment.entity, processingId);
      break;
    default:
      logger.warn('Unhandled webhook event type', {
        processingId,
        eventType,
        payload
      });
  }
}

async function handlePaymentCaptured(payment: any, processingId: string): Promise<void> {
  try {
    logger.info('Processing payment captured', {
      processingId,
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency
    });

    // Update payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'captured',
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id)
      .select('booking_id, user_id')
      .single();

    if (paymentError) {
      logger.error('Error updating payment record', {
        processingId,
        paymentId: payment.id,
        orderId: payment.order_id,
        error: paymentError
      });
      throw paymentError;
    }

    if (!paymentRecord) {
      logger.error('Payment record not found', {
        processingId,
        paymentId: payment.id,
        orderId: payment.order_id
      });
      throw new Error('Payment record not found');
    }

    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.booking_id);

    if (bookingError) {
      logger.error('Error updating booking status', {
        processingId,
        bookingId: paymentRecord.booking_id,
        error: bookingError
      });
      throw bookingError;
    }

    // Release inventory lock if exists
    const { data: booking } = await supabase
      .from('bookings')
      .select('lock_id, item_type, item_id')
      .eq('id', paymentRecord.booking_id)
      .single();

    if (booking?.lock_id) {
      // Import InventoryLockService (assuming it exists)
      const { InventoryLockService } = await import('./enhanced-bookings');
      await InventoryLockService.releaseInventory(
        booking.item_type,
        booking.item_id,
        booking.lock_id
      );
    }

    // Trigger notifications (email, SMS)
    await triggerBookingConfirmationNotifications(paymentRecord, processingId);

    logger.info('Payment captured processed successfully', {
      processingId,
      paymentId: payment.id,
      bookingId: paymentRecord.booking_id,
      userId: paymentRecord.user_id
    });

  } catch (error) {
    logger.error('Error handling payment captured', {
      processingId,
      paymentId: payment.id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function handlePaymentFailed(payment: any, processingId: string): Promise<void> {
  try {
    logger.info('Processing payment failed', {
      processingId,
      paymentId: payment.id,
      orderId: payment.order_id,
      errorCode: payment.error_code,
      errorDescription: payment.error_description
    });

    // Update payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        razorpay_payment_id: payment.id,
        error_code: payment.error_code,
        error_description: payment.error_description,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id)
      .select('booking_id, user_id')
      .single();

    if (paymentError) {
      logger.error('Error updating failed payment record', {
        processingId,
        paymentId: payment.id,
        error: paymentError
      });
      throw paymentError;
    }

    if (paymentRecord) {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.booking_id);

      // Release inventory lock
      const { data: booking } = await supabase
        .from('bookings')
        .select('lock_id, item_type, item_id')
        .eq('id', paymentRecord.booking_id)
        .single();

      if (booking?.lock_id) {
        const { InventoryLockService } = await import('./enhanced-bookings');
        await InventoryLockService.releaseInventory(
          booking.item_type,
          booking.item_id,
          booking.lock_id
        );
      }

      // Trigger payment failure notifications
      await triggerPaymentFailureNotifications(paymentRecord, processingId);
    }

    logger.info('Payment failed processed successfully', {
      processingId,
      paymentId: payment.id,
      bookingId: paymentRecord?.booking_id
    });

  } catch (error) {
    logger.error('Error handling payment failed', {
      processingId,
      paymentId: payment.id,
      error: error.message
    });
    throw error;
  }
}

async function handleRefundCreated(refund: any, processingId: string): Promise<void> {
  try {
    logger.info('Processing refund created', {
      processingId,
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount,
      status: refund.status
    });

    // Update refund record
    const { error: refundError } = await supabase
      .from('refunds')
      .update({
        status: refund.status,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_refund_id', refund.id);

    if (refundError) {
      logger.error('Error updating refund record', {
        processingId,
        refundId: refund.id,
        error: refundError
      });
      throw refundError;
    }

    logger.info('Refund created processed successfully', {
      processingId,
      refundId: refund.id
    });

  } catch (error) {
    logger.error('Error handling refund created', {
      processingId,
      refundId: refund.id,
      error: error.message
    });
    throw error;
  }
}

async function handleOrderPaid(order: any, processingId: string): Promise<void> {
  logger.info('Processing order paid', {
    processingId,
    orderId: order.id,
    amount: order.amount,
    status: order.status
  });
  // Additional order paid logic if needed
}

async function handlePaymentAuthorized(payment: any, processingId: string): Promise<void> {
  logger.info('Processing payment authorized', {
    processingId,
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount
  });
  // Additional payment authorized logic if needed
}

// =============================================================================
// 4. NOTIFICATION SERVICES
// =============================================================================

import { NotificationService, NotificationData } from '../services/notificationService';

async function triggerBookingConfirmationNotifications(paymentRecord: any, processingId: string): Promise<void> {
  try {
    logger.info('Triggering booking confirmation notifications', {
      processingId,
      bookingId: paymentRecord.booking_id,
      userId: paymentRecord.user_id
    });

    // Get booking details for notification
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        hotels(name, location_city, location_state),
        tours(name, location_city, location_state),
        flights(airline, flight_number, departure_city, arrival_city)
      `)
      .eq('id', paymentRecord.booking_id)
      .single();

    if (!booking) {
      logger.error('Booking not found for notification', {
        processingId,
        bookingId: paymentRecord.booking_id
      });
      return;
    }

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, phone, first_name, last_name')
      .eq('id', paymentRecord.user_id)
      .single();

    if (!user) {
      logger.error('User not found for notification', {
        processingId,
        userId: paymentRecord.user_id
      });
      return;
    }

    // Prepare notification data
    const notificationData: NotificationData = {
      userId: paymentRecord.user_id,
      email: user.email,
      phone: user.phone,
      name: `${user.first_name} ${user.last_name}`,
      bookingId: paymentRecord.booking_id,
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
    const notificationId = `booking_confirmation_${paymentRecord.booking_id}_${processingId}`;
    
    await NotificationService.sendBulkNotifications([{
      id: notificationId,
      type: 'booking_confirmation',
      data: notificationData,
      channels: ['email', 'sms', 'whatsapp']
    }]);

    logger.info('Booking confirmation notifications triggered successfully', {
      processingId,
      bookingId: paymentRecord.booking_id,
      userId: paymentRecord.user_id,
      channels: ['email', 'sms', 'whatsapp']
    });

  } catch (error) {
    logger.error('Error triggering booking confirmation notifications', {
      processingId,
      error: error.message
    });
  }
}

async function triggerPaymentFailureNotifications(paymentRecord: any, processingId: string): Promise<void> {
  try {
    logger.info('Triggering payment failure notifications', {
      processingId,
      bookingId: paymentRecord.booking_id,
      userId: paymentRecord.user_id
    });

    // Get booking details for notification
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        hotels(name, location_city, location_state),
        tours(name, location_city, location_state),
        flights(airline, flight_number, departure_city, arrival_city)
      `)
      .eq('id', paymentRecord.booking_id)
      .single();

    if (!booking) {
      logger.error('Booking not found for notification', {
        processingId,
        bookingId: paymentRecord.booking_id
      });
      return;
    }

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, phone, first_name, last_name')
      .eq('id', paymentRecord.user_id)
      .single();

    if (!user) {
      logger.error('User not found for notification', {
        processingId,
        userId: paymentRecord.user_id
      });
      return;
    }

    // Prepare notification data
    const notificationData: NotificationData = {
      userId: paymentRecord.user_id,
      email: user.email,
      phone: user.phone,
      name: `${user.first_name} ${user.last_name}`,
      bookingId: paymentRecord.booking_id,
      bookingReference: booking.booking_reference,
      itemType: booking.item_type,
      itemName: getItemName(booking),
      amount: booking.total_price,
      currency: 'INR',
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      guests: booking.guests
    };

    // Send notifications
    const notificationId = `payment_failure_${paymentRecord.booking_id}_${processingId}`;
    
    await NotificationService.sendBulkNotifications([{
      id: notificationId,
      type: 'payment_failure',
      data: notificationData,
      channels: ['sms', 'whatsapp']
    }]);

    logger.info('Payment failure notifications triggered successfully', {
      processingId,
      bookingId: paymentRecord.booking_id,
      userId: paymentRecord.user_id,
      channels: ['sms', 'whatsapp']
    });

  } catch (error) {
    logger.error('Error triggering payment failure notifications', {
      processingId,
      error: error.message
    });
  }
}

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

// =============================================================================
// 5. WEBHOOK STATUS ENDPOINT
// =============================================================================

router.get('/webhook/status/:webhookId',
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;

    try {
      const status = await WebhookRetryService.getRetryStatus(webhookId);

      res.json({
        success: true,
        data: {
          webhookId,
          status,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error getting webhook status', {
        webhookId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get webhook status',
        code: 'WEBHOOK_STATUS_ERROR'
      });
    }
  })
);

export default router;
