import Razorpay from 'razorpay';

export interface PaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  bookingId: string;
}

export interface PaymentResponse {
  orderId: string;
  paymentId: string;
  signature: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  method: string;
  description: string;
  createdAt: string;
}

export interface RefundParams {
  paymentId: string;
  amount: number;
  reason: string;
  notes?: string;
}

class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: import.meta.env.VITE_RAZORPAY_KEY_ID,
      key_secret: import.meta.env.VITE_RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(params: PaymentParams): Promise<PaymentResponse> {
    try {
      const order = await this.razorpay.orders.create({
        amount: params.amount * 100, // Razorpay expects amount in paise
        currency: params.currency,
        receipt: params.orderId,
        notes: {
          booking_id: params.bookingId,
          customer_id: params.customerId,
          description: params.description,
        },
      });

      return {
        orderId: order.id,
        paymentId: '',
        signature: '',
        status: 'created',
        amount: params.amount,
        currency: params.currency,
        method: '',
        description: params.description,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  async capturePayment(paymentId: string, amount: number): Promise<PaymentResponse> {
    try {
      const payment = await this.razorpay.payments.capture(paymentId, amount * 100);

      return {
        orderId: payment.order_id,
        paymentId: payment.id,
        signature: payment.signature || '',
        status: payment.status as any,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        method: payment.method,
        description: payment.description || '',
        createdAt: new Date(payment.created_at * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Razorpay payment capture failed:', error);
      throw new Error('Failed to capture payment');
    }
  }

  async refundPayment(params: RefundParams): Promise<PaymentResponse> {
    try {
      const refund = await this.razorpay.payments.refund(params.paymentId, {
        amount: params.amount * 100, // Convert to paise
        notes: {
          reason: params.reason,
          notes: params.notes || '',
        },
      });

      return {
        orderId: refund.order_id,
        paymentId: refund.payment_id,
        signature: '',
        status: 'refunded',
        amount: refund.amount / 100,
        currency: refund.currency,
        method: '',
        description: `Refund: ${params.reason}`,
        createdAt: new Date(refund.created_at * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Razorpay refund failed:', error);
      throw new Error('Failed to process refund');
    }
  }

  async verifyPaymentSignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', import.meta.env.VITE_RAZORPAY_KEY_SECRET);
      hmac.update(params.razorpay_order_id + '|' + params.razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');

      return generatedSignature === params.razorpay_signature;
    } catch (error) {
      console.error('Payment signature verification failed:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentResponse> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        orderId: payment.order_id,
        paymentId: payment.id,
        signature: payment.signature || '',
        status: payment.status as any,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        description: payment.description || '',
        createdAt: new Date(payment.created_at * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }
}

// Client-side Razorpay integration
export class RazorpayClient {
  private options: any;

  constructor() {
    this.options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: 0,
      currency: 'INR',
      name: 'Anagha Safaar',
      description: '',
      order_id: '',
      handler: (response: any) => {
        console.log('Payment successful:', response);
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      notes: {
        address: '',
      },
      theme: {
        color: '#059669',
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        },
      },
    };
  }

  async openPaymentModal(params: PaymentParams): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      this.options.amount = params.amount * 100;
      this.options.currency = params.currency;
      this.options.description = params.description;
      this.options.order_id = params.orderId;
      this.options.prefill.name = params.customerName;
      this.options.prefill.email = params.customerEmail;
      this.options.prefill.contact = params.customerPhone;
      this.options.notes.booking_id = params.bookingId;

      this.options.handler = (response: any) => {
        resolve({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          status: 'captured',
          amount: params.amount,
          currency: params.currency,
          method: 'razorpay',
          description: params.description,
          createdAt: new Date().toISOString(),
        });
      };

      this.options.modal.ondismiss = () => {
        reject(new Error('Payment cancelled by user'));
      };

      const rzp = new (window as any).Razorpay(this.options);
      rzp.open();
    });
  }
}

export const razorpayService = new RazorpayService();
export const razorpayClient = new RazorpayClient();
