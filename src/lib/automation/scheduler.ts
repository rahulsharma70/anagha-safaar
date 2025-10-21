// src/lib/automation/scheduler.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '../logger';
import { webhookService } from '../api/webhooks';
import { notificationService } from '../api/notifications';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  function: string;
  parameters?: Record<string, any>;
}

export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultJobs();
  }

  private initializeDefaultJobs() {
    // Booking reminders (daily at 9 AM)
    this.addJob({
      id: 'booking-reminders',
      name: 'Send Booking Reminders',
      schedule: '0 9 * * *', // Daily at 9 AM
      enabled: true,
      function: 'sendBookingReminders',
    });

    // Expired bookings cleanup (daily at 2 AM)
    this.addJob({
      id: 'cleanup-expired-bookings',
      name: 'Cleanup Expired Bookings',
      schedule: '0 2 * * *', // Daily at 2 AM
      enabled: true,
      function: 'cleanupExpiredBookings',
    });

    // Payment reminders (every 6 hours)
    this.addJob({
      id: 'payment-reminders',
      name: 'Send Payment Reminders',
      schedule: '0 */6 * * *', // Every 6 hours
      enabled: true,
      function: 'sendPaymentReminders',
    });

    // Analytics report (weekly on Monday at 8 AM)
    this.addJob({
      id: 'weekly-analytics',
      name: 'Generate Weekly Analytics Report',
      schedule: '0 8 * * 1', // Monday at 8 AM
      enabled: true,
      function: 'generateWeeklyAnalytics',
    });

    // Promotional campaigns (daily at 10 AM)
    this.addJob({
      id: 'promotional-campaigns',
      name: 'Send Promotional Campaigns',
      schedule: '0 10 * * *', // Daily at 10 AM
      enabled: true,
      function: 'sendPromotionalCampaigns',
    });
  }

  addJob(job: ScheduledJob) {
    this.jobs.set(job.id, job);
    this.scheduleJob(job);
    logger.info(`Added scheduled job: ${job.name}`);
  }

  removeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      const interval = this.intervals.get(jobId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(jobId);
      }
      this.jobs.delete(jobId);
      logger.info(`Removed scheduled job: ${job.name}`);
    }
  }

  private scheduleJob(job: ScheduledJob) {
    if (!job.enabled) return;

    // For demo purposes, we'll use simple intervals instead of cron
    // In production, use a proper cron library like node-cron
    const interval = this.parseScheduleToInterval(job.schedule);
    
    const intervalId = setInterval(async () => {
      try {
        await this.executeJob(job);
      } catch (error) {
        logger.error(`Error executing job ${job.name}:`, error);
      }
    }, interval);

    this.intervals.set(job.id, intervalId);
    logger.info(`Scheduled job ${job.name} to run every ${interval}ms`);
  }

  private parseScheduleToInterval(schedule: string): number {
    // Simple parsing for demo - in production use proper cron parser
    if (schedule.includes('*/6')) return 6 * 60 * 60 * 1000; // 6 hours
    if (schedule.includes('0 9')) return 24 * 60 * 60 * 1000; // 24 hours
    if (schedule.includes('0 2')) return 24 * 60 * 60 * 1000; // 24 hours
    if (schedule.includes('0 10')) return 24 * 60 * 60 * 1000; // 24 hours
    if (schedule.includes('0 8 * * 1')) return 7 * 24 * 60 * 60 * 1000; // 7 days
    return 60 * 60 * 1000; // Default 1 hour
  }

  private async executeJob(job: ScheduledJob) {
    logger.info(`Executing job: ${job.name}`);
    
    try {
      switch (job.function) {
        case 'sendBookingReminders':
          await webhookService.sendBookingReminders();
          break;
        case 'cleanupExpiredBookings':
          await webhookService.cleanupExpiredBookings();
          break;
        case 'sendPaymentReminders':
          await this.sendPaymentReminders();
          break;
        case 'generateWeeklyAnalytics':
          await this.generateWeeklyAnalytics();
          break;
        case 'sendPromotionalCampaigns':
          await this.sendPromotionalCampaigns();
          break;
        default:
          logger.warn(`Unknown job function: ${job.function}`);
      }

      // Update last run time
      await this.updateJobLastRun(job.id);
      logger.info(`Job ${job.name} completed successfully`);
    } catch (error) {
      logger.error(`Job ${job.name} failed:`, error);
      throw error;
    }
  }

  private async updateJobLastRun(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.lastRun = new Date().toISOString();
      this.jobs.set(jobId, job);
    }
  }

  // Send payment reminders for pending bookings
  private async sendPaymentReminders() {
    try {
      const { data: pendingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .eq('payment_status', 'pending')
        .lt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()); // 2 hours ago

      if (error) throw error;

      for (const booking of pendingBookings || []) {
        const { guest_details } = booking;
        const email = guest_details?.email;
        const phone = guest_details?.phone;

        if (email) {
          await notificationService.sendEmail(
            email,
            `Payment Reminder - ${booking.booking_reference}`,
            `
              <h2>💳 Payment Reminder</h2>
              <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
              <p>Your booking is pending payment. Please complete payment to confirm your reservation.</p>
              <p><strong>Amount:</strong> ${booking.currency} ${booking.total_amount}</p>
              <p>Complete your payment now to secure your booking!</p>
            `
          );
        }

        if (phone) {
          await notificationService.sendSms(
            phone,
            `Payment reminder: Complete payment for booking ${booking.booking_reference}. Amount: ${booking.currency} ${booking.total_amount}`
          );
        }
      }

      logger.info(`Sent payment reminders for ${pendingBookings?.length || 0} bookings`);
    } catch (error) {
      logger.error('Error sending payment reminders:', error);
      throw error;
    }
  }

  // Generate weekly analytics report
  private async generateWeeklyAnalytics() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      const analytics = {
        totalBookings: bookings?.length || 0,
        confirmedBookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        averageBookingValue: bookings?.length ? 
          bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / bookings.length : 0,
        topDestinations: this.getTopDestinations(bookings || []),
        bookingTypes: this.getBookingTypes(bookings || []),
      };

      // Store analytics in database
      await supabase
        .from('analytics_reports')
        .insert({
          report_type: 'weekly',
          report_date: new Date().toISOString(),
          data: analytics,
        });

      logger.info('Weekly analytics report generated:', analytics);
    } catch (error) {
      logger.error('Error generating weekly analytics:', error);
      throw error;
    }
  }

  // Send promotional campaigns
  private async sendPromotionalCampaigns() {
    try {
      const { data: campaigns, error } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (error) throw error;

      for (const campaign of campaigns || []) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('marketing_consent', true);

        if (usersError) throw usersError;

        for (const user of users || []) {
          if (user.email) {
            await notificationService.sendEmail(
              user.email,
              campaign.subject,
              campaign.email_content
            );
          }

          if (user.phone && campaign.sms_content) {
            await notificationService.sendSms(user.phone, campaign.sms_content);
          }
        }

        logger.info(`Sent promotional campaign ${campaign.name} to ${users?.length || 0} users`);
      }
    } catch (error) {
      logger.error('Error sending promotional campaigns:', error);
      throw error;
    }
  }

  private getTopDestinations(bookings: any[]): Record<string, number> {
    const destinations: Record<string, number> = {};
    bookings.forEach(booking => {
      const destination = booking.item_id; // Simplified for demo
      destinations[destination] = (destinations[destination] || 0) + 1;
    });
    return destinations;
  }

  private getBookingTypes(bookings: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    bookings.forEach(booking => {
      const type = booking.item_type;
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  }

  // Manual job execution
  async executeJobManually(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      await this.executeJob(job);
    } else {
      throw new Error(`Job ${jobId} not found`);
    }
  }

  // Get all jobs
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  // Enable/disable job
  toggleJob(jobId: string, enabled: boolean) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = enabled;
      this.jobs.set(jobId, job);
      
      if (enabled) {
        this.scheduleJob(job);
      } else {
        const interval = this.intervals.get(jobId);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(jobId);
        }
      }
      
      logger.info(`Job ${job.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Cleanup on shutdown
  shutdown() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    logger.info('Scheduler service shutdown');
  }
}

export const schedulerService = new SchedulerService();
