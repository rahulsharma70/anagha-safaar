// Enhanced Winston logger with structured logging
const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: 'travel-booking-api',
      environment: process.env.NODE_ENV || 'development'
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'travel-booking-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for HTTP requests
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Add HTTP request logging
logger.add(new winston.transports.Console({
  level: 'http',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom logging methods
const structuredLogger = {
  // Basic logging methods
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // HTTP request logging
  http: (req, res, responseTime) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || null,
      requestId: req.requestId || null
    });
  },
  
  // Database operation logging
  db: (operation, table, duration, meta = {}) => {
    logger.info('Database Operation', {
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    });
  },
  
  // External API call logging
  api: (service, method, url, statusCode, duration, meta = {}) => {
    logger.info('External API Call', {
      service,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ...meta
    });
  },
  
  // Authentication logging
  auth: (event, userId, meta = {}) => {
    logger.info('Authentication Event', {
      event,
      userId,
      ...meta
    });
  },
  
  // Payment logging
  payment: (event, amount, currency, meta = {}) => {
    logger.info('Payment Event', {
      event,
      amount,
      currency,
      ...meta
    });
  },
  
  // Security event logging
  security: (event, severity, meta = {}) => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    logger[level]('Security Event', {
      event,
      severity,
      ...meta
    });
  },
  
  // Performance logging
  performance: (operation, duration, meta = {}) => {
    logger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...meta
    });
  },
  
  // Business logic logging
  business: (event, meta = {}) => {
    logger.info('Business Event', {
      event,
      ...meta
    });
  }
};

module.exports = structuredLogger;
