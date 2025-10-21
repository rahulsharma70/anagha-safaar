import axios from 'axios';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface SMSParams {
  to: string;
  message: string;
  from?: string;
}

export interface WhatsAppParams {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SendGridService {
  private apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
  private baseURL = 'https://api.sendgrid.com/v3';

  async sendEmail(params: EmailParams): Promise<NotificationResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/mail/send`, {
        personalizations: [
          {
            to: [{ email: params.to }],
            dynamic_template_data: params.dynamicTemplateData,
          },
        ],
        from: {
          email: 'noreply@anaghasafaar.com',
          name: 'Anagha Safaar',
        },
        template_id: params.templateId,
        content: params.templateId ? undefined : [
          {
            type: 'text/html',
            value: params.html,
          },
          {
            type: 'text/plain',
            value: params.text || params.html.replace(/<[^>]*>/g, ''),
          },
        ],
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'],
      };
    } catch (error: any) {
      console.error('SendGrid email error:', error);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || 'Failed to send email',
      };
    }
  }
}

class TwilioService {
  private accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  private authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  private phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
  private baseURL = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;

  async sendSMS(params: SMSParams): Promise<NotificationResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/Messages.json`, 
        new URLSearchParams({
          To: params.to,
          From: params.from || this.phoneNumber,
          Body: params.message,
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send SMS',
      };
    }
  }

  async sendWhatsApp(params: WhatsAppParams): Promise<NotificationResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/Messages.json`, 
        new URLSearchParams({
          To: `whatsapp:${params.to}`,
          From: `whatsapp:${this.phoneNumber}`,
          Body: params.message,
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      console.error('Twilio WhatsApp error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send WhatsApp message',
      };
    }
  }
}

class NotificationService {
  private sendGrid: SendGridService;
  private twilio: TwilioService;

  constructor() {
    this.sendGrid = new SendGridService();
    this.twilio = new TwilioService();
  }

  async sendBookingConfirmation(params: {
    customerEmail: string;
    customerPhone: string;
    bookingId: string;
    bookingDetails: any;
  }): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    // Send email confirmation
    const emailResult = await this.sendGrid.sendEmail({
      to: params.customerEmail,
      subject: `Booking Confirmation - ${params.bookingId}`,
      templateId: 'd-booking-confirmation',
      dynamicTemplateData: {
        booking_id: params.bookingId,
        customer_name: params.bookingDetails.customerName,
        booking_type: params.bookingDetails.type,
        booking_date: params.bookingDetails.date,
        total_amount: params.bookingDetails.totalAmount,
        currency: params.bookingDetails.currency,
      },
    });
    results.push(emailResult);

    // Send SMS confirmation
    const smsResult = await this.twilio.sendSMS({
      to: params.customerPhone,
      message: `Your booking ${params.bookingId} has been confirmed! Total: ${params.bookingDetails.currency} ${params.bookingDetails.totalAmount}. Check your email for details.`,
    });
    results.push(smsResult);

    return results;
  }

  async sendPaymentConfirmation(params: {
    customerEmail: string;
    customerPhone: string;
    paymentId: string;
    amount: number;
    currency: string;
  }): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    // Send email confirmation
    const emailResult = await this.sendGrid.sendEmail({
      to: params.customerEmail,
      subject: `Payment Confirmation - ${params.paymentId}`,
      templateId: 'd-payment-confirmation',
      dynamicTemplateData: {
        payment_id: params.paymentId,
        amount: params.amount,
        currency: params.currency,
        payment_date: new Date().toISOString(),
      },
    });
    results.push(emailResult);

    // Send SMS confirmation
    const smsResult = await this.twilio.sendSMS({
      to: params.customerPhone,
      message: `Payment of ${params.currency} ${params.amount} confirmed! Payment ID: ${params.paymentId}`,
    });
    results.push(smsResult);

    return results;
  }

  async sendBookingCancellation(params: {
    customerEmail: string;
    customerPhone: string;
    bookingId: string;
    refundAmount: number;
    currency: string;
  }): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    // Send email notification
    const emailResult = await this.sendGrid.sendEmail({
      to: params.customerEmail,
      subject: `Booking Cancelled - ${params.bookingId}`,
      templateId: 'd-booking-cancellation',
      dynamicTemplateData: {
        booking_id: params.bookingId,
        refund_amount: params.refundAmount,
        currency: params.currency,
        cancellation_date: new Date().toISOString(),
      },
    });
    results.push(emailResult);

    // Send SMS notification
    const smsResult = await this.twilio.sendSMS({
      to: params.customerPhone,
      message: `Your booking ${params.bookingId} has been cancelled. Refund of ${params.currency} ${params.refundAmount} will be processed within 5-7 business days.`,
    });
    results.push(smsResult);

    return results;
  }

  async sendReminder(params: {
    customerEmail: string;
    customerPhone: string;
    bookingId: string;
    reminderType: 'checkin' | 'checkout' | 'tour_start';
    bookingDetails: any;
  }): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    let subject = '';
    let message = '';
    let templateId = '';

    switch (params.reminderType) {
      case 'checkin':
        subject = `Check-in Reminder - ${params.bookingId}`;
        message = `Reminder: Your hotel check-in is tomorrow! Booking ID: ${params.bookingId}`;
        templateId = 'd-checkin-reminder';
        break;
      case 'checkout':
        subject = `Check-out Reminder - ${params.bookingId}`;
        message = `Reminder: Your hotel check-out is tomorrow! Booking ID: ${params.bookingId}`;
        templateId = 'd-checkout-reminder';
        break;
      case 'tour_start':
        subject = `Tour Starting Soon - ${params.bookingId}`;
        message = `Reminder: Your tour starts tomorrow! Booking ID: ${params.bookingId}`;
        templateId = 'd-tour-reminder';
        break;
    }

    // Send email reminder
    const emailResult = await this.sendGrid.sendEmail({
      to: params.customerEmail,
      subject,
      templateId,
      dynamicTemplateData: {
        booking_id: params.bookingId,
        booking_details: params.bookingDetails,
      },
    });
    results.push(emailResult);

    // Send SMS reminder
    const smsResult = await this.twilio.sendSMS({
      to: params.customerPhone,
      message,
    });
    results.push(smsResult);

    return results;
  }
}

export const notificationService = new NotificationService();
export const sendGridService = new SendGridService();
export const twilioService = new TwilioService();
