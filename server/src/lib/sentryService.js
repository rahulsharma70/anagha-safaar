// Enhanced Sentry integration with comprehensive error tracking
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

class SentryService {
  constructor() {
    this.isInitialized = false;
    this.config = {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        Sentry.httpIntegration({
          tracing: {
            instrumentOutgoingRequests: true
          }
        }),
        Sentry.prismaIntegration(),
        nodeProfilingIntegration(),
        Sentry.consoleIntegration(),
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration()
      ],
      beforeSend: this.beforeSend.bind(this),
      beforeSendTransaction: this.beforeSendTransaction.bind(this),
      initialScope: {
        tags: {
          service: 'travel-booking-api',
          component: 'backend'
        }
      }
    };
  }
  
  // Initialize Sentry
  initialize() {
    if (!this.config.dsn) {
      logger.warn('Sentry DSN not configured, error tracking disabled');
      return false;
    }
    
    try {
      Sentry.init(this.config);
      this.isInitialized = true;
      
      logger.info('Sentry initialized successfully', {
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate
      });
      
      return true;
    } catch (error) {
      logger.error('Sentry initialization failed', { error: error.message });
      return false;
    }
  }
  
  // Filter events before sending to Sentry
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (this.config.environment === 'production') {
      const error = hint.originalException;
      
      // Filter out common non-critical errors
      if (error && (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Request timeout') ||
        error.message?.includes('Connection timeout') ||
        error.message?.includes('ECONNRESET')
      )) {
        return null;
      }
    }
    
    // Add custom context
    event.tags = {
      ...event.tags,
      service: 'travel-booking-api',
      component: 'backend',
      timestamp: new Date().toISOString()
    };
    
    // Log error details server-side
    logger.error('Error sent to Sentry', {
      eventId: event.event_id,
      level: event.level,
      message: event.message,
      exception: event.exception,
      tags: event.tags
    });
    
    return event;
  }
  
  // Filter transactions before sending
  beforeSendTransaction(event) {
    // Only send transactions for important operations
    const importantOperations = [
      'http.server.request',
      'db.query',
      'cache.operation',
      'payment.process',
      'booking.create',
      'user.auth'
    ];
    
    if (!importantOperations.includes(event.transaction)) {
      return null;
    }
    
    return event;
  }
  
  // Capture error with context
  captureError(error, context = {}) {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', {
        error: error.message,
        stack: error.stack,
        ...context
      });
      return;
    }
    
    Sentry.withScope((scope) => {
      // Set tags
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Set extra data
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      // Set user context
      if (context.user) {
        scope.setUser(context.user);
      }
      
      // Set level
      if (context.level) {
        scope.setLevel(context.level);
      }
      
      // Set fingerprint for grouping
      if (context.fingerprint) {
        scope.setFingerprint(context.fingerprint);
      }
      
      Sentry.captureException(error);
    });
  }
  
  // Capture message
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging message locally', {
        message,
        level,
        ...context
      });
      return;
    }
    
    Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      if (context.user) {
        scope.setUser(context.user);
      }
      
      Sentry.captureMessage(message, level);
    });
  }
  
  // Set user context
  setUser(user) {
    if (!this.isInitialized) return;
    
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscription: user.subscription
    });
  }
  
  // Set custom context
  setContext(key, context) {
    if (!this.isInitialized) return;
    
    Sentry.setContext(key, context);
  }
  
  // Add breadcrumb
  addBreadcrumb(breadcrumb) {
    if (!this.isInitialized) return;
    
    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now() / 1000
    });
  }
  
  // Start transaction
  startTransaction(name, op, data = {}) {
    if (!this.isInitialized) return null;
    
    const transaction = Sentry.startTransaction({
      name,
      op,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    });
    
    return transaction;
  }
  
  // Capture performance metrics
  capturePerformance(operation, duration, meta = {}) {
    if (!this.isInitialized) return;
    
    const transaction = this.startTransaction(operation, 'performance', meta);
    if (transaction) {
      transaction.setData('duration', duration);
      transaction.setData('meta', meta);
      transaction.finish();
    }
  }
  
  // Capture API request
  captureApiRequest(req, res, duration) {
    if (!this.isInitialized) return;
    
    this.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.url}`,
      data: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      level: res.statusCode >= 400 ? 'error' : 'info'
    });
  }
  
  // Capture database operation
  captureDatabaseOperation(operation, table, duration, meta = {}) {
    if (!this.isInitialized) return;
    
    this.addBreadcrumb({
      category: 'database',
      message: `${operation} on ${table}`,
      data: {
        operation,
        table,
        duration: `${duration}ms`,
        ...meta
      },
      level: duration > 1000 ? 'warning' : 'info'
    });
  }
  
  // Capture business event
  captureBusinessEvent(event, data = {}) {
    if (!this.isInitialized) return;
    
    this.addBreadcrumb({
      category: 'business',
      message: event,
      data: {
        event,
        ...data,
        timestamp: new Date().toISOString()
      },
      level: 'info'
    });
  }
  
  // Capture security event
  captureSecurityEvent(event, severity, data = {}) {
    if (!this.isInitialized) return;
    
    this.addBreadcrumb({
      category: 'security',
      message: event,
      data: {
        event,
        severity,
        ...data,
        timestamp: new Date().toISOString()
      },
      level: severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'
    });
  }
  
  // Get Sentry statistics
  getStats() {
    return {
      initialized: this.isInitialized,
      environment: this.config.environment,
      release: this.config.release,
      tracesSampleRate: this.config.tracesSampleRate,
      profilesSampleRate: this.config.profilesSampleRate
    };
  }
  
  // Close Sentry connection
  async close() {
    if (!this.isInitialized) return;
    
    try {
      await Sentry.close(2000); // 2 second timeout
      this.isInitialized = false;
      logger.info('Sentry connection closed');
    } catch (error) {
      logger.error('Error closing Sentry connection', { error: error.message });
    }
  }
}

// Create singleton instance
const sentryService = new SentryService();

module.exports = sentryService;
