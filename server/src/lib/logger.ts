import winston from 'winston';
import path from 'path';

// =============================================================================
// 1. LOG LEVELS
// =============================================================================

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// =============================================================================
// 2. LOG FORMATS
// =============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// =============================================================================
// 3. TRANSPORTS
// =============================================================================

const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: logFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';
  
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // HTTP request log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// =============================================================================
// 4. LOGGER INSTANCE
// =============================================================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  transports,
  exitOnError: false,
});

// =============================================================================
// 5. LOGGING UTILITIES
// =============================================================================

export const logRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
};

export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export const logDatabaseQuery = (query: string, params?: any, duration?: number) => {
  logger.debug('Database Query', {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    params,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export const logApiCall = (service: string, endpoint: string, status: number, duration?: number) => {
  const level = status >= 400 ? 'warn' : 'info';
  logger[level]('External API Call', {
    service,
    endpoint,
    status,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export const logCacheOperation = (operation: string, key: string, hit?: boolean) => {
  logger.debug('Cache Operation', {
    operation,
    key,
    hit,
  });
};

export const logPaymentEvent = (event: string, details: any) => {
  logger.info('Payment Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export const logBookingEvent = (event: string, bookingId: string, details?: any) => {
  logger.info('Booking Event', {
    event,
    bookingId,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// =============================================================================
// 6. LOG ROTATION UTILITIES
// =============================================================================

export const rotateLogs = () => {
  logger.info('Log rotation initiated');
  // Winston handles log rotation automatically with maxFiles and maxsize
  // This function can be used for manual log rotation if needed
};

export const clearOldLogs = (daysToKeep: number = 30) => {
  logger.info(`Clearing logs older than ${daysToKeep} days`);
  // Implementation would depend on your log storage strategy
};

// =============================================================================
// 7. LOG ANALYSIS UTILITIES
// =============================================================================

export const getLogStats = () => {
  return {
    level: logger.level,
    transports: logger.transports.length,
    timestamp: new Date().toISOString(),
  };
};

export const setLogLevel = (level: string) => {
  logger.level = level;
  logger.info(`Log level changed to: ${level}`);
};

// =============================================================================
// 8. DEVELOPMENT HELPERS
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  // Add debug logging for development
  logger.debug('Logger initialized in development mode');
  
  // Log environment variables (without sensitive data)
  logger.debug('Environment Configuration', {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  });
}

// =============================================================================
// 9. EXPORT DEFAULT LOGGER
// =============================================================================

export default logger;
