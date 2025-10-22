import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { logger } from '../lib/logger';
import { RedisService } from '../services/redisService';

// =============================================================================
// 1. INTERFACES AND TYPES
// =============================================================================

export interface NotificationData {
  userId: string;
  email: string;
  phone?: string;
  name: string;
  bookingId: string;
  bookingReference: string;
  itemType: 'hotel' | 'tour' | 'flight';
  itemName: string;
  amount: number;
  currency: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  specialRequests?: string;
  addOns?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface EmailTemplate {
  templateId: string;
  dynamicData: Record<string, any>;
}

export interface SMSMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: 'email' | 'sms' | 'whatsapp';
}

// =============================================================================
// 2. NOTIFICATION SERVICE CLASS
// =============================================================================

export class NotificationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s
  private static readonly NOTIFICATION_PREFIX = 'notification:';

  // Initialize SendGrid
  static initializeSendGrid(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(apiKey);
    logger.info('SendGrid initialized successfully');
  }

  // Initialize Twilio
  static initializeTwilio(): twilio.Twilio {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    const client = twilio(accountSid, authToken);
    logger.info('Twilio initialized successfully');
    return client;
  }

  // =============================================================================
  // 3. EMAIL NOTIFICATIONS
  // =============================================================================

  static async sendBookingConfirmationEmail(data: NotificationData): Promise<NotificationResult> {
    try {
      this.initializeSendGrid();

      const templateId = process.env.SENDGRID_BOOKING_CONFIRMATION_TEMPLATE || 'd-booking-confirmation';
      
      const emailData = {
        to: data.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@anaghasafaar.com',
          name: process.env.SENDGRID_FROM_NAME || 'Anagha Safaar'
        },
        templateId,
        dynamicTemplateData: {
          customer_name: data.name,
          booking_reference: data.bookingReference,
          item_name: data.itemName,
          item_type: data.itemType,
          amount: data.amount,
          currency: data.currency,
          check_in_date: data.checkInDate,
          check_out_date: data.checkOutDate,
          guests: data.guests,
          special_requests: data.specialRequests,
          add_ons: data.addOns,
          booking_url: `${process.env.FRONTEND_URL}/bookings/${data.bookingId}`,
          support_email: 'support@anaghasafaar.com',
          company_name: 'Anagha Safaar'
        }
      };

      const [response] = await sgMail.send(emailData);
      
      logger.info('Booking confirmation email sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        channel: 'email'
      };

    } catch (error) {
      logger.error('Error sending booking confirmation email', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'email'
      };
    }
  }

  static async sendPaymentReceiptEmail(data: NotificationData): Promise<NotificationResult> {
    try {
      this.initializeSendGrid();

      const templateId = process.env.SENDGRID_PAYMENT_RECEIPT_TEMPLATE || 'd-payment-receipt';
      
      const emailData = {
        to: data.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@anaghasafaar.com',
          name: process.env.SENDGRID_FROM_NAME || 'Anagha Safaar'
        },
        templateId,
        dynamicTemplateData: {
          customer_name: data.name,
          booking_reference: data.bookingReference,
          item_name: data.itemName,
          amount: data.amount,
          currency: data.currency,
          payment_date: new Date().toISOString(),
          receipt_url: `${process.env.FRONTEND_URL}/bookings/${data.bookingId}/receipt`,
          support_email: 'support@anaghasafaar.com',
          company_name: 'Anagha Safaar'
        }
      };

      const [response] = await sgMail.send(emailData);
      
      logger.info('Payment receipt email sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        channel: 'email'
      };

    } catch (error) {
      logger.error('Error sending payment receipt email', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'email'
      };
    }
  }

  static async sendBookingCancellationEmail(data: NotificationData): Promise<NotificationResult> {
    try {
      this.initializeSendGrid();

      const templateId = process.env.SENDGRID_BOOKING_CANCELLATION_TEMPLATE || 'd-booking-cancellation';
      
      const emailData = {
        to: data.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@anaghasafaar.com',
          name: process.env.SENDGRID_FROM_NAME || 'Anagha Safaar'
        },
        templateId,
        dynamicTemplateData: {
          customer_name: data.name,
          booking_reference: data.bookingReference,
          item_name: data.itemName,
          item_type: data.itemType,
          amount: data.amount,
          currency: data.currency,
          cancellation_date: new Date().toISOString(),
          refund_info: 'Refund will be processed within 5-7 business days',
          support_email: 'support@anaghasafaar.com',
          company_name: 'Anagha Safaar'
        }
      };

      const [response] = await sgMail.send(emailData);
      
      logger.info('Booking cancellation email sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        channel: 'email'
      };

    } catch (error) {
      logger.error('Error sending booking cancellation email', {
        userId: data.userId,
        bookingId: data.bookingId,
        email: data.email,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'email'
      };
    }
  }

  // =============================================================================
  // 4. SMS NOTIFICATIONS
  // =============================================================================

  static async sendBookingConfirmationSMS(data: NotificationData): Promise<NotificationResult> {
    try {
      if (!data.phone) {
        throw new Error('Phone number not provided');
      }

      const client = this.initializeTwilio();
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!fromNumber) {
        throw new Error('Twilio phone number not configured');
      }

      const message = `🎉 Booking Confirmed!\n\n` +
        `Booking Ref: ${data.bookingReference}\n` +
        `${data.itemName}\n` +
        `Amount: ₹${data.amount}\n` +
        `${data.checkInDate ? `Check-in: ${new Date(data.checkInDate).toLocaleDateString()}` : ''}\n` +
        `${data.checkOutDate ? `Check-out: ${new Date(data.checkOutDate).toLocaleDateString()}` : ''}\n\n` +
        `Thank you for choosing Anagha Safaar!`;

      const messageResponse = await client.messages.create({
        body: message,
        from: fromNumber,
        to: data.phone
      });

      logger.info('Booking confirmation SMS sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        messageSid: messageResponse.sid
      });

      return {
        success: true,
        messageId: messageResponse.sid,
        channel: 'sms'
      };

    } catch (error) {
      logger.error('Error sending booking confirmation SMS', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'sms'
      };
    }
  }

  static async sendPaymentFailureSMS(data: NotificationData): Promise<NotificationResult> {
    try {
      if (!data.phone) {
        throw new Error('Phone number not provided');
      }

      const client = this.initializeTwilio();
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!fromNumber) {
        throw new Error('Twilio phone number not configured');
      }

      const message = `❌ Payment Failed\n\n` +
        `Booking Ref: ${data.bookingReference}\n` +
        `${data.itemName}\n` +
        `Amount: ₹${data.amount}\n\n` +
        `Please try again or contact support.\n` +
        `Support: support@anaghasafaar.com`;

      const messageResponse = await client.messages.create({
        body: message,
        from: fromNumber,
        to: data.phone
      });

      logger.info('Payment failure SMS sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        messageSid: messageResponse.sid
      });

      return {
        success: true,
        messageId: messageResponse.sid,
        channel: 'sms'
      };

    } catch (error) {
      logger.error('Error sending payment failure SMS', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'sms'
      };
    }
  }

  // =============================================================================
  // 5. WHATSAPP NOTIFICATIONS
  // =============================================================================

  static async sendBookingConfirmationWhatsApp(data: NotificationData): Promise<NotificationResult> {
    try {
      if (!data.phone) {
        throw new Error('Phone number not provided');
      }

      const client = this.initializeTwilio();
      const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
      const toNumber = `whatsapp:${data.phone}`;
      
      if (!fromNumber) {
        throw new Error('Twilio WhatsApp number not configured');
      }

      const message = `🎉 *Booking Confirmed!*\n\n` +
        `Booking Reference: *${data.bookingReference}*\n` +
        `Service: *${data.itemName}*\n` +
        `Amount: *₹${data.amount}*\n` +
        `${data.checkInDate ? `Check-in: *${new Date(data.checkInDate).toLocaleDateString()}*` : ''}\n` +
        `${data.checkOutDate ? `Check-out: *${new Date(data.checkOutDate).toLocaleDateString()}*` : ''}\n\n` +
        `Thank you for choosing *Anagha Safaar*! 🙏\n\n` +
        `For any queries, contact us at support@anaghasafaar.com`;

      const messageResponse = await client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber
      });

      logger.info('Booking confirmation WhatsApp sent', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        messageSid: messageResponse.sid
      });

      return {
        success: true,
        messageId: messageResponse.sid,
        channel: 'whatsapp'
      };

    } catch (error) {
      logger.error('Error sending booking confirmation WhatsApp', {
        userId: data.userId,
        bookingId: data.bookingId,
        phone: data.phone,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        channel: 'whatsapp'
      };
    }
  }

  // =============================================================================
  // 6. RETRY MECHANISM
  // =============================================================================

  static async sendWithRetry(
    notificationId: string,
    channel: 'email' | 'sms' | 'whatsapp',
    sendFunction: () => Promise<NotificationResult>
  ): Promise<NotificationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        logger.info('Sending notification', {
          notificationId,
          channel,
          attempt: attempt + 1,
          maxRetries: this.MAX_RETRIES + 1
        });

        const result = await sendFunction();

        if (result.success) {
          // Success - remove any existing retry record
          await RedisService.del(`${this.NOTIFICATION_PREFIX}${notificationId}`);

          logger.info('Notification sent successfully', {
            notificationId,
            channel,
            attempt: attempt + 1,
            messageId: result.messageId
          });

          return result;
        } else {
          throw new Error(result.error || 'Notification failed');
        }

      } catch (error) {
        lastError = error as Error;
        
        logger.error('Notification sending failed', {
          notificationId,
          channel,
          attempt: attempt + 1,
          error: error.message
        });

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt];
          
          // Store retry information
          await RedisService.setex(
            `${this.NOTIFICATION_PREFIX}${notificationId}`,
            3600, // 1 hour TTL
            JSON.stringify({
              channel,
              attempt: attempt + 1,
              lastError: error.message,
              nextRetryAt: new Date(Date.now() + delay).toISOString()
            })
          );

          logger.warn('Scheduling notification retry', {
            notificationId,
            channel,
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
    logger.error('Notification sending failed after all retries', {
      notificationId,
      channel,
      maxRetries: this.MAX_RETRIES,
      finalError: lastError?.message
    });

    return {
      success: false,
      error: lastError?.message || 'All retry attempts failed',
      channel
    };
  }

  // =============================================================================
  // 7. BULK NOTIFICATIONS
  // =============================================================================

  static async sendBulkNotifications(
    notifications: Array<{
      id: string;
      type: 'booking_confirmation' | 'payment_receipt' | 'booking_cancellation' | 'payment_failure';
      data: NotificationData;
      channels: ('email' | 'sms' | 'whatsapp')[];
    }>
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    logger.info('Starting bulk notification sending', {
      totalNotifications: notifications.length
    });

    // Process notifications in parallel with concurrency limit
    const concurrencyLimit = 10;
    const chunks = [];
    
    for (let i = 0; i < notifications.length; i += concurrencyLimit) {
      chunks.push(notifications.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (notification) => {
        const channelResults: NotificationResult[] = [];

        for (const channel of notification.channels) {
          let sendFunction: () => Promise<NotificationResult>;

          switch (notification.type) {
            case 'booking_confirmation':
              if (channel === 'email') {
                sendFunction = () => this.sendBookingConfirmationEmail(notification.data);
              } else if (channel === 'sms') {
                sendFunction = () => this.sendBookingConfirmationSMS(notification.data);
              } else if (channel === 'whatsapp') {
                sendFunction = () => this.sendBookingConfirmationWhatsApp(notification.data);
              }
              break;
            case 'payment_receipt':
              sendFunction = () => this.sendPaymentReceiptEmail(notification.data);
              break;
            case 'booking_cancellation':
              sendFunction = () => this.sendBookingCancellationEmail(notification.data);
              break;
            case 'payment_failure':
              if (channel === 'sms') {
                sendFunction = () => this.sendPaymentFailureSMS(notification.data);
              }
              break;
          }

          if (sendFunction) {
            const result = await this.sendWithRetry(notification.id, channel, sendFunction);
            channelResults.push(result);
          }
        }

        return channelResults;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.flat());
    }

    logger.info('Bulk notification sending completed', {
      totalNotifications: notifications.length,
      successfulResults: results.filter(r => r.success).length,
      failedResults: results.filter(r => !r.success).length
    });

    return results;
  }

  // =============================================================================
  // 8. NOTIFICATION STATUS CHECKING
  // =============================================================================

  static async getNotificationStatus(notificationId: string): Promise<any> {
    const retryData = await RedisService.get(`${this.NOTIFICATION_PREFIX}${notificationId}`);
    
    return {
      retry: retryData ? JSON.parse(retryData) : null,
      timestamp: new Date().toISOString()
    };
  }
}

export default NotificationService;
