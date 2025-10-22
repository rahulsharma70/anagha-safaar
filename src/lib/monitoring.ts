import winston from 'winston';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';
import { env } from './security-middleware';

// =============================================================================
// 1. WINSTON LOGGER CONFIGURATION
// =============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'anagha-safaar-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// =============================================================================
// 2. SENTRY MONITORING CONFIGURATION
// =============================================================================

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter out development errors
    if (env.NODE_ENV === 'development') {
      return null;
    }
    
    // Add custom tags
    event.tags = {
      ...event.tags,
      service: 'anagha-safaar-api',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return event;
  }
});

// =============================================================================
// 3. SUPABASE CLIENT FOR LOGGING
// =============================================================================

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// =============================================================================
// 4. STRUCTURED LOGGING SERVICE
// =============================================================================

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export class LoggingService {
  // Log info message
  static info(message: string, context: LogContext = {}): void {
    logger.info(message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Log warning message
  static warn(message: string, context: LogContext = {}): void {
    logger.warn(message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Log error message
  static error(message: string, error?: Error, context: LogContext = {}): void {
    logger.error(message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });

    // Send to Sentry
    if (error) {
      Sentry.captureException(error, {
        tags: context,
        extra: context
      });
    }
  }

  // Log debug message
  static debug(message: string, context: LogContext = {}): void {
    logger.debug(message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Log security event
  static securityEvent(eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', description: string, context: LogContext = {}): void {
    const logData = {
      eventType,
      severity,
      description,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.warn(`Security Event: ${eventType}`, logData);

    // Store in database
    supabase
      .from('security_events')
      .insert([{
        user_id: context.userId,
        event_type: eventType,
        severity: severity,
        description: description,
        ip_address: context.ip,
        user_agent: context.userAgent,
        metadata: context
      }])
      .catch(err => {
        logger.error('Failed to store security event', err);
      });

    // Send to Sentry for high/critical events
    if (severity === 'high' || severity === 'critical') {
      Sentry.captureMessage(`Security Event: ${eventType}`, {
        level: 'warning',
        tags: {
          eventType,
          severity,
          userId: context.userId
        },
        extra: logData
      });
    }
  }

  // Log audit event
  static auditEvent(action: string, resourceType: string, resourceId: string, oldValues?: any, newValues?: any, context: LogContext = {}): void {
    const logData = {
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.info(`Audit Event: ${action}`, logData);

    // Store in database
    supabase
      .from('audit_logs')
      .insert([{
        user_id: context.userId,
        session_id: context.sessionId,
        action: action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: context.ip,
        user_agent: context.userAgent
      }])
      .catch(err => {
        logger.error('Failed to store audit event', err);
      });
  }

  // Log payment event
  static paymentEvent(eventType: string, amount: number, currency: string, paymentId: string, context: LogContext = {}): void {
    const logData = {
      eventType,
      amount,
      currency,
      paymentId,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.info(`Payment Event: ${eventType}`, logData);

    // Store in database
    supabase
      .from('payment_events')
      .insert([{
        user_id: context.userId,
        event_type: eventType,
        amount: amount,
        currency: currency,
        payment_id: paymentId,
        metadata: context
      }])
      .catch(err => {
        logger.error('Failed to store payment event', err);
      });
  }

  // Log booking event
  static bookingEvent(eventType: string, bookingId: string, context: LogContext = {}): void {
    const logData = {
      eventType,
      bookingId,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.info(`Booking Event: ${eventType}`, logData);

    // Store in database
    supabase
      .from('booking_events')
      .insert([{
        user_id: context.userId,
        event_type: eventType,
        data: context,
        session_id: context.sessionId,
        ip_address: context.ip,
        user_agent: context.userAgent
      }])
      .catch(err => {
        logger.error('Failed to store booking event', err);
      });
  }

  // Log performance metrics
  static performanceMetric(metricName: string, value: number, unit: string, context: LogContext = {}): void {
    const logData = {
      metricName,
      value,
      unit,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.info(`Performance Metric: ${metricName}`, logData);

    // Send to Sentry for performance tracking
    Sentry.addBreadcrumb({
      message: `Performance Metric: ${metricName}`,
      category: 'performance',
      data: logData,
      level: 'info'
    });
  }

  // Log user activity
  static userActivity(activity: string, context: LogContext = {}): void {
    const logData = {
      activity,
      ...context,
      timestamp: new Date().toISOString()
    };

    logger.info(`User Activity: ${activity}`, logData);

    // Store in database
    supabase
      .from('user_activities')
      .insert([{
        user_id: context.userId,
        activity: activity,
        session_id: context.sessionId,
        ip_address: context.ip,
        user_agent: context.userAgent,
        metadata: context
      }])
      .catch(err => {
        logger.error('Failed to store user activity', err);
      });
  }

  // Mask sensitive data in logs
  static maskSensitiveData(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'card', 'ssn', 'email'];
    
    if (typeof data === 'object' && data !== null) {
      const masked = { ...data };
      
      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = '***MASKED***';
        }
      }
      
      return masked;
    }
    
    return data;
  }

  // Create request correlation ID
  static createCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// 5. MONITORING SERVICE
// =============================================================================

export class MonitoringService {
  // Track API response times
  static trackResponseTime(endpoint: string, method: string, duration: number, statusCode: number, context: LogContext = {}): void {
    LoggingService.performanceMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      statusCode,
      ...context
    });

    // Alert if response time is too high
    if (duration > 5000) { // 5 seconds
      LoggingService.warn('Slow API response detected', {
        endpoint,
        method,
        duration,
        statusCode,
        ...context
      });
    }
  }

  // Track database query performance
  static trackDatabaseQuery(query: string, duration: number, rowsAffected: number, context: LogContext = {}): void {
    LoggingService.performanceMetric('database_query_time', duration, 'ms', {
      query: query.substring(0, 100), // Truncate long queries
      rowsAffected,
      ...context
    });

    // Alert if query is too slow
    if (duration > 1000) { // 1 second
      LoggingService.warn('Slow database query detected', {
        query: query.substring(0, 100),
        duration,
        rowsAffected,
        ...context
      });
    }
  }

  // Track memory usage
  static trackMemoryUsage(context: LogContext = {}): void {
    const memUsage = process.memoryUsage();
    
    LoggingService.performanceMetric('memory_usage', memUsage.heapUsed, 'bytes', {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      ...context
    });

    // Alert if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      LoggingService.warn('High memory usage detected', {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        ...context
      });
    }
  }

  // Track error rates
  static trackErrorRate(endpoint: string, errorCount: number, totalRequests: number, context: LogContext = {}): void {
    const errorRate = (errorCount / totalRequests) * 100;
    
    LoggingService.performanceMetric('error_rate', errorRate, 'percent', {
      endpoint,
      errorCount,
      totalRequests,
      ...context
    });

    // Alert if error rate is high
    if (errorRate > 5) { // 5%
      LoggingService.warn('High error rate detected', {
        endpoint,
        errorRate,
        errorCount,
        totalRequests,
        ...context
      });
    }
  }

  // Track authentication failures
  static trackAuthFailure(email: string, reason: string, ip: string, context: LogContext = {}): void {
    LoggingService.securityEvent('auth_failure', 'medium', `Authentication failed for ${email}: ${reason}`, {
      email,
      reason,
      ip,
      ...context
    });

    // Check for brute force attempts
    supabase
      .from('auth_failures')
      .select('count')
      .eq('email', email)
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
      .then(({ data }) => {
        const failureCount = data?.length || 0;
        
        if (failureCount >= 5) {
          LoggingService.securityEvent('brute_force_attempt', 'high', `Multiple failed login attempts from ${ip}`, {
            email,
            ip,
            failureCount,
            ...context
          });
        }
      });
  }

  // Track suspicious activity
  static trackSuspiciousActivity(activity: string, riskScore: number, context: LogContext = {}): void {
    const severity = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
    
    LoggingService.securityEvent('suspicious_activity', severity, activity, {
      riskScore,
      ...context
    });

    // Store in fraud detection logs
    supabase
      .from('fraud_detection_logs')
      .insert([{
        user_id: context.userId,
        session_id: context.sessionId,
        ip_address: context.ip,
        user_agent: context.userAgent,
        risk_score: riskScore,
        activity_type: 'suspicious_activity',
        activity_data: context,
        is_blocked: riskScore >= 80
      }])
      .catch(err => {
        logger.error('Failed to store fraud detection log', err);
      });
  }
}

// =============================================================================
// 6. HEALTH CHECK SERVICE
// =============================================================================

export class HealthCheckService {
  // Check database connectivity
  static async checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return { status: 'unhealthy', latency, error: error.message };
      }
      
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { status: 'unhealthy', latency, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Check external services
  static async checkExternalServices(): Promise<{ [service: string]: { status: 'healthy' | 'unhealthy'; latency: number; error?: string } }> {
    const services = {
      razorpay: await this.checkRazorpay(),
      sendgrid: await this.checkSendGrid(),
      twilio: await this.checkTwilio()
    };
    
    return services;
  }

  // Check Razorpay API
  private static async checkRazorpay(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simple health check - verify API key format
      const keyId = env.RAZORPAY_KEY_ID;
      const latency = Date.now() - startTime;
      
      if (!keyId || !keyId.startsWith('rzp_')) {
        return { status: 'unhealthy', latency, error: 'Invalid Razorpay key format' };
      }
      
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { status: 'unhealthy', latency, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Check SendGrid API
  private static async checkSendGrid(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simple health check - verify API key format
      const apiKey = env.SENDGRID_API_KEY;
      const latency = Date.now() - startTime;
      
      if (!apiKey || !apiKey.startsWith('SG.')) {
        return { status: 'unhealthy', latency, error: 'Invalid SendGrid key format' };
      }
      
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { status: 'unhealthy', latency, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Check Twilio API
  private static async checkTwilio(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simple health check - verify account SID format
      const accountSid = env.TWILIO_ACCOUNT_SID;
      const latency = Date.now() - startTime;
      
      if (!accountSid || !accountSid.startsWith('AC')) {
        return { status: 'unhealthy', latency, error: 'Invalid Twilio account SID format' };
      }
      
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { status: 'unhealthy', latency, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get system metrics
  static getSystemMetrics(): any {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      uptime: uptime,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuUsage: process.cpuUsage()
    };
  }
}

// =============================================================================
// 7. EXPORT SERVICES
// =============================================================================

export { logger, Sentry };
export { LoggingService, MonitoringService, HealthCheckService };

export default {
  LoggingService,
  MonitoringService,
  HealthCheckService,
  logger,
  Sentry
};