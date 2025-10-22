// Sentry error tracking and monitoring
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

// Initialize Sentry
function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration({
        tracing: {
          instrumentOutgoingRequests: true
        }
      }),
      
      // Enable database tracing
      Sentry.prismaIntegration(),
      
      // Enable profiling
      nodeProfilingIntegration(),
      
      // Custom integrations
      {
        name: 'CustomErrorHandler',
        setupOnce() {
          // Custom error handling setup
        }
      }
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        const error = hint.originalException;
        
        // Filter out common non-critical errors
        if (error && (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ENOTFOUND' ||
          error.message?.includes('Request timeout') ||
          error.message?.includes('Connection timeout')
        )) {
          return null;
        }
      }
      
      // Add custom context
      event.tags = {
        ...event.tags,
        service: 'travel-booking-api',
        component: 'backend'
      };
      
      return event;
    },
    
    // Custom context
    initialScope: {
      tags: {
        service: 'travel-booking-api',
        component: 'backend'
      }
    }
  });

  console.log('Sentry initialized successfully', {
    environment: process.env.NODE_ENV,
    dsn: process.env.SENTRY_DSN ? 'configured' : 'not configured'
  });
}

// Error tracking utilities
const errorTracker = {
  // Capture and log error
  captureError: (error, context = {}) => {
    // Log error server-side
    console.log('Error captured:', {
      message: error.message,
      stack: error.stack,
      ...context
    });
    
    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: context.tags || {},
        extra: context.extra || {},
        user: context.user || {},
        level: context.level || 'error'
      });
    }
  },
  
  // Capture message
  captureMessage: (message, level = 'info', context = {}) => {
    console.log('Message captured:', {
      message,
      level,
      ...context
    });
    
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level,
        tags: context.tags || {},
        extra: context.extra || {},
        user: context.user || {}
      });
    }
  },
  
  // Set user context
  setUser: (user) => {
    Sentry.setUser(user);
    logger.debug('User context set', { userId: user.id });
  },
  
  // Set custom context
  setContext: (key, context) => {
    Sentry.setContext(key, context);
    logger.debug('Context set', { key, context });
  },
  
  // Add breadcrumb
  addBreadcrumb: (breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb);
    logger.debug('Breadcrumb added', breadcrumb);
  },
  
  // Start transaction
  startTransaction: (name, op) => {
    const transaction = Sentry.startTransaction({ name, op });
    logger.debug('Transaction started', { name, op });
    return transaction;
  },
  
  // Capture performance metrics
  capturePerformance: (operation, duration, meta = {}) => {
    const transaction = Sentry.startTransaction({
      name: operation,
      op: 'performance'
    });
    
    transaction.setData('duration', duration);
    transaction.setData('meta', meta);
    transaction.finish();
    
    logger.performance(operation, duration, meta);
  }
};

// Generic error response creator
const createGenericError = (type, message, statusCode = 500) => {
  const genericMessages = {
    'validation_error': 'Invalid request data. Please check your input and try again.',
    'authentication_error': 'Authentication failed. Please log in again.',
    'authorization_error': 'You do not have permission to perform this action.',
    'not_found': 'The requested resource was not found.',
    'rate_limit': 'Too many requests. Please try again later.',
    'payment_error': 'Payment processing failed. Please try again.',
    'external_service_error': 'Service temporarily unavailable. Please try again later.',
    'database_error': 'Service temporarily unavailable. Please try again later.',
    'internal_error': 'An unexpected error occurred. Please try again later.'
  };
  
  return {
    success: false,
    error: genericMessages[type] || genericMessages['internal_error'],
    errorType: type,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: null // Will be set by middleware
  };
};

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  // Determine error type and status code
  let errorType = 'internal_error';
  let statusCode = 500;
  let userMessage = 'An unexpected error occurred. Please try again later.';
  
  if (error.name === 'ValidationError') {
    errorType = 'validation_error';
    statusCode = 400;
    userMessage = 'Invalid request data. Please check your input and try again.';
  } else if (error.name === 'UnauthorizedError') {
    errorType = 'authentication_error';
    statusCode = 401;
    userMessage = 'Authentication failed. Please log in again.';
  } else if (error.name === 'ForbiddenError') {
    errorType = 'authorization_error';
    statusCode = 403;
    userMessage = 'You do not have permission to perform this action.';
  } else if (error.name === 'NotFoundError') {
    errorType = 'not_found';
    statusCode = 404;
    userMessage = 'The requested resource was not found.';
  } else if (error.name === 'RateLimitError') {
    errorType = 'rate_limit';
    statusCode = 429;
    userMessage = 'Too many requests. Please try again later.';
  } else if (error.name === 'PaymentError') {
    errorType = 'payment_error';
    statusCode = 402;
    userMessage = 'Payment processing failed. Please try again.';
  } else if (error.name === 'ExternalServiceError') {
    errorType = 'external_service_error';
    statusCode = 503;
    userMessage = 'Service temporarily unavailable. Please try again later.';
  } else if (error.name === 'DatabaseError') {
    errorType = 'database_error';
    statusCode = 503;
    userMessage = 'Service temporarily unavailable. Please try again later.';
  }
  
  // Capture error with Sentry
  errorTracker.captureError(error, {
    tags: {
      errorType,
      requestId,
      userId: req.user?.id || null,
      method: req.method,
      url: req.url
    },
    extra: {
      requestBody: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    },
    user: {
      id: req.user?.id || null,
      email: req.user?.email || null
    }
  });
  
  // Create generic error response
  const errorResponse = createGenericError(errorType, userMessage, statusCode);
  errorResponse.requestId = requestId;
  
  // Log error details server-side
  logger.error('Request error', {
    requestId,
    errorType,
    statusCode,
    message: error.message,
    stack: error.stack,
    userId: req.user?.id || null,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });
  
  // Send generic error to client
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

module.exports = {
  initializeSentry,
  errorTracker,
  createGenericError,
  errorHandler,
  asyncHandler,
  requestIdMiddleware
};
