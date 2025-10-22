import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';

const router = Router();

// =============================================================================
// 1. RAZORPAY CONFIGURATION
// =============================================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// =============================================================================
// 2. VALIDATION SCHEMAS
// =============================================================================

const paymentCreateSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  amount: z.number().min(1, 'Amount must be positive'),
  currency: z.string().default('INR'),
  payment_method: z.enum(['card', 'upi', 'netbanking', 'wallet']).default('card'),
});

const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

const refundCreateSchema = z.object({
  payment_id: z.string().min(1, 'Payment ID is required'),
  amount: z.number().min(1, 'Refund amount must be positive').optional(),
  reason: z.string().min(1, 'Refund reason is required'),
});

// =============================================================================
// 3. CREATE PAYMENT ORDER
// =============================================================================

router.post('/create-order',
  validateRequest({ body: paymentCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { booking_id, amount, currency, payment_method } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Verify booking exists and belongs to user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, total_price, user_id')
        .eq('id', booking_id)
        .eq('user_id', userId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(409).json({
          success: false,
          error: 'Booking is not in pending status',
          code: 'BOOKING_NOT_PENDING'
        });
      }

      // Verify amount matches booking total
      if (amount !== booking.total_price) {
        return res.status(400).json({
          success: false,
          error: 'Payment amount does not match booking total',
          code: 'AMOUNT_MISMATCH'
        });
      }

      // Create Razorpay order
      const orderOptions = {
        amount: amount * 100, // Convert to paise
        currency: currency,
        receipt: `booking_${booking_id}`,
        notes: {
          booking_id: booking_id,
          user_id: userId,
          payment_method: payment_method,
        },
      };

      const order = await razorpay.orders.create(orderOptions);

      // Store payment record
      const paymentData = {
        id: order.id,
        booking_id: booking_id,
        user_id: userId,
        amount: amount,
        currency: currency,
        status: 'created',
        payment_method: payment_method,
        razorpay_order_id: order.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentError) {
        logger.error('Error creating payment record', paymentError);
        throw paymentError;
      }

      logger.info('Payment order created', {
        orderId: order.id,
        bookingId: booking_id,
        userId,
        amount
      });

      res.json({
        success: true,
        data: {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          payment: payment
        },
        message: 'Payment order created successfully'
      });

    } catch (error) {
      logger.error('Error creating payment order', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. VERIFY PAYMENT
// =============================================================================

router.post('/verify',
  validateRequest({ body: paymentVerifySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .eq('user_id', userId)
        .single();

      if (paymentError || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment record not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        logger.warn('Invalid payment signature', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          userId
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      // Update payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpay_payment_id,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating payment record', updateError);
        throw updateError;
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id);

      if (bookingError) {
        logger.error('Error updating booking status', bookingError);
        throw bookingError;
      }

      logger.info('Payment verified successfully', {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        bookingId: payment.booking_id,
        userId
      });

      res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment verified successfully'
      });

    } catch (error) {
      logger.error('Error verifying payment', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. GET PAYMENT STATUS
// =============================================================================

router.get('/:paymentId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .single();

      if (error || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      // Get payment details from Razorpay if payment is captured
      let razorpayPayment = null;
      if (payment.status === 'captured' && payment.razorpay_payment_id) {
        try {
          razorpayPayment = await razorpay.payments.fetch(payment.razorpay_payment_id);
        } catch (razorpayError) {
          logger.warn('Error fetching payment from Razorpay', razorpayError);
        }
      }

      logger.info('Payment status fetched', { paymentId, userId });

      res.json({
        success: true,
        data: {
          payment,
          razorpay_payment: razorpayPayment
        }
      });

    } catch (error) {
      logger.error('Error fetching payment status', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. CREATE REFUND
// =============================================================================

router.post('/refund',
  validateRequest({ body: refundCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { payment_id, amount, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*, bookings(*)')
        .eq('id', payment_id)
        .eq('user_id', userId)
        .single();

      if (paymentError || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      if (payment.status !== 'captured') {
        return res.status(409).json({
          success: false,
          error: 'Payment is not captured',
          code: 'PAYMENT_NOT_CAPTURED'
        });
      }

      if (!payment.razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          error: 'Razorpay payment ID not found',
          code: 'RAZORPAY_PAYMENT_ID_MISSING'
        });
      }

      // Create refund with Razorpay
      const refundAmount = amount ? amount * 100 : undefined; // Convert to paise
      const refundOptions: any = {
        payment_id: payment.razorpay_payment_id,
        notes: {
          reason: reason,
          booking_id: payment.booking_id,
          user_id: userId,
        },
      };

      if (refundAmount) {
        refundOptions.amount = refundAmount;
      }

      const razorpayRefund = await razorpay.payments.refund(
        payment.razorpay_payment_id,
        refundOptions
      );

      // Store refund record
      const refundData = {
        id: razorpayRefund.id,
        payment_id: payment_id,
        user_id: userId,
        amount: razorpayRefund.amount / 100, // Convert from paise
        currency: razorpayRefund.currency,
        status: razorpayRefund.status,
        reason: reason,
        razorpay_refund_id: razorpayRefund.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert([refundData])
        .select()
        .single();

      if (refundError) {
        logger.error('Error creating refund record', refundError);
        throw refundError;
      }

      // Update payment status if full refund
      if (!amount || amount === payment.amount) {
        await supabase
          .from('payments')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment_id);

        // Update booking status
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.booking_id);
      }

      logger.info('Refund created successfully', {
        refundId: razorpayRefund.id,
        paymentId: payment_id,
        userId,
        amount: razorpayRefund.amount / 100
      });

      res.json({
        success: true,
        data: refund,
        message: 'Refund created successfully'
      });

    } catch (error) {
      logger.error('Error creating refund', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. GET USER PAYMENTS
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
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: payments, error, count } = await query;

      if (error) {
        logger.error('Error fetching user payments', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);

      logger.info('User payments fetched', {
        userId,
        count: payments?.length || 0,
        totalCount: count || 0
      });

      res.json({
        success: true,
        data: payments || [],
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
      logger.error('Error in payments GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. WEBHOOK HANDLER
// =============================================================================

router.post('/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET as string)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature', { signature, expectedSignature });
        return res.status(400).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      const event = req.body;
      logger.info('Razorpay webhook received', { event: event.event });

      // Handle different webhook events
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'refund.created':
          await handleRefundCreated(event.payload.refund.entity);
          break;
        default:
          logger.info('Unhandled webhook event', { event: event.event });
      }

      res.json({ success: true, message: 'Webhook processed' });

    } catch (error) {
      logger.error('Error processing webhook', error);
      throw error;
    }
  })
);

// =============================================================================
// 9. WEBHOOK HANDLERS
// =============================================================================

async function handlePaymentCaptured(payment: any) {
  try {
    await supabase
      .from('payments')
      .update({
        status: 'captured',
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id);

    // Update booking status
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('booking_id')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (paymentRecord) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.booking_id);
    }

    logger.info('Payment captured webhook processed', { paymentId: payment.id });
  } catch (error) {
    logger.error('Error handling payment captured webhook', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id);

    logger.info('Payment failed webhook processed', { paymentId: payment.id });
  } catch (error) {
    logger.error('Error handling payment failed webhook', error);
  }
}

async function handleRefundCreated(refund: any) {
  try {
    await supabase
      .from('refunds')
      .update({
        status: refund.status,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_refund_id', refund.id);

    logger.info('Refund created webhook processed', { refundId: refund.id });
  } catch (error) {
    logger.error('Error handling refund created webhook', error);
  }
}

export default router;
