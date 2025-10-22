// HTTP request logging middleware
const logger = require('./logger');

// Request logging middleware
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log HTTP response
    logger.http(req, res, responseTime);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id || null
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Database operation logging
const dbLoggingMiddleware = (operation, table, startTime, meta = {}) => {
  const duration = Date.now() - startTime;
  
  logger.db(operation, table, duration, meta);
  
  // Log slow database operations
  if (duration > 500) {
    logger.warn('Slow database operation detected', {
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    });
  }
};

// External API call logging
const apiLoggingMiddleware = (service, method, url, startTime, meta = {}) => {
  const duration = Date.now() - startTime;
  
  logger.api(service, method, url, null, duration, meta);
  
  // Log slow API calls
  if (duration > 2000) {
    logger.warn('Slow external API call detected', {
      service,
      method,
      url,
      duration: `${duration}ms`,
      ...meta
    });
  }
};

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Add performance tracking to request
  req.performanceStart = startTime;
  
  // Track memory usage
  const memUsage = process.memoryUsage();
  req.initialMemoryUsage = {
    rss: memUsage.rss,
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal
  };
  
  res.on('finish', () => {
    const totalTime = Date.now() - startTime;
    const finalMemUsage = process.memoryUsage();
    
    // Log performance metrics
    logger.performance('request', totalTime, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      memoryDelta: {
        rss: finalMemUsage.rss - req.initialMemoryUsage.rss,
        heapUsed: finalMemUsage.heapUsed - req.initialMemoryUsage.heapUsed
      },
      userId: req.user?.id || null
    });
  });
  
  next();
};

// Security event logging middleware
const securityLoggingMiddleware = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
    /javascript:/i  // JavaScript injection
  ];
  
  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  const body = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(body)) {
      logger.security('suspicious_request', 'medium', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || null,
        pattern: pattern.toString()
      });
      break;
    }
  }
  
  next();
};

// Business event logging middleware
const businessLoggingMiddleware = (req, res, next) => {
  // Log business events based on route
  const businessRoutes = {
    '/api/bookings': 'booking_operation',
    '/api/payments': 'payment_operation',
    '/api/hotels': 'hotel_operation',
    '/api/flights': 'flight_operation',
    '/api/tours': 'tour_operation',
    '/api/ai/itinerary': 'ai_itinerary_operation'
  };
  
  const route = Object.keys(businessRoutes).find(r => req.url.startsWith(r));
  if (route) {
    req.businessEvent = businessRoutes[route];
  }
  
  next();
};

module.exports = {
  requestLoggingMiddleware,
  dbLoggingMiddleware,
  apiLoggingMiddleware,
  performanceMiddleware,
  securityLoggingMiddleware,
  businessLoggingMiddleware
};
