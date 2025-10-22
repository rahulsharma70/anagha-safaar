// Enhanced app.ts with Sentry and Mixpanel integration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

// Import our custom modules
const sentryService = require('./lib/sentryService');
const mixpanelService = require('./lib/mixpanelService');
const errorTrackingMiddleware = require('./lib/errorTrackingMiddleware');
const privacyCompliantAnalytics = require('./lib/privacyCompliantAnalytics');
const logger = require('./lib/logger');
const healthCheckService = require('./lib/healthCheck');
const {
  requestLoggingMiddleware,
  performanceMiddleware,
  securityLoggingMiddleware,
  businessLoggingMiddleware
} = require('./lib/loggingMiddleware');

// Initialize Sentry first
sentryService.initialize();

// Initialize Mixpanel
mixpanelService.initialize();

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Analytics-Consent']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    errorType: 'rate_limit',
    statusCode: 429,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      errorType: 'rate_limit',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

app.use(limiter);

// Request ID middleware (must be early)
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLoggingMiddleware);
app.use(performanceMiddleware);
app.use(securityLoggingMiddleware);
app.use(businessLoggingMiddleware);

// Privacy-compliant analytics middleware
app.use(privacyCompliantAnalytics.createPrivacyMiddleware());

// Error tracking middleware
app.use(errorTrackingMiddleware.createErrorTrackingMiddleware());
app.use(errorTrackingMiddleware.createPerformanceTrackingMiddleware());
app.use(errorTrackingMiddleware.createAnalyticsMiddleware());
app.use(errorTrackingMiddleware.createSessionTrackingMiddleware());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Initialize Redis client
let redisClient;
try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });
  
  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  
  redisClient.on('error', (error) => {
    logger.error('Redis connection error', { error: error.message });
  });
} catch (error) {
  logger.error('Redis initialization failed', { error: error.message });
}

// Make clients available globally
app.locals.supabase = supabase;
app.locals.redis = redisClient;

// Initialize health checks
healthCheckService.initializeDefaultChecks();

// Import routes
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const tourRoutes = require('./routes/tours');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/analytics', analyticsRoutes);

// Consent management routes
app.use('/api/consent', privacyCompliantAnalytics.createConsentMiddleware());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Booking API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    analytics: {
      sentry: sentryService.getStats(),
      mixpanel: mixpanelService.getStats(),
      privacy: privacyCompliantAnalytics.getPrivacyStats()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    error: 'The requested resource was not found.',
    errorType: 'not_found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Global error handler (must be last)
app.use((error, req, res, next) => {
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
  sentryService.captureError(error, {
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
  
  // Track error in Mixpanel if user has consent
  if (req.user?.id && req.analyticsConsent) {
    mixpanelService.trackError(req.user.id, errorType, error.message, {
      requestId,
      method: req.method,
      url: req.url,
      statusCode
    });
  }
  
  // Create generic error response
  const errorResponse = {
    success: false,
    error: userMessage,
    errorType,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId
  };
  
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
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (redisClient) {
    redisClient.disconnect();
  }
  
  await sentryService.close();
  mixpanelService.flush();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (redisClient) {
    redisClient.disconnect();
  }
  
  await sentryService.close();
  mixpanelService.flush();
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  sentryService.captureError(error, {
    tags: { component: 'uncaught_exception' },
    level: 'fatal'
  });
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    promise: promise.toString()
  });
  
  sentryService.captureError(new Error(reason), {
    tags: { component: 'unhandled_rejection' },
    level: 'error'
  });
  
  process.exit(1);
});

// Export app and clients
module.exports = {
  app,
  supabase,
  redis: redisClient
};
