// Enhanced error handling middleware for routes
const { errorTracker, createGenericError } = require('../lib/sentry');
const logger = require('../lib/logger');

// Custom error classes
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

class PaymentError extends Error {
  constructor(message = 'Payment processing failed') {
    super(message);
    this.name = 'PaymentError';
    this.statusCode = 402;
  }
}

class ExternalServiceError extends Error {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`);
    this.name = 'ExternalServiceError';
    this.statusCode = 503;
    this.service = service;
  }
}

class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 503;
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database operation wrapper with logging
const dbOperation = async (operation, table, fn, meta = {}) => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.db(operation, table, duration, {
      success: true,
      ...meta
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Database operation failed', {
      operation,
      table,
      duration: `${duration}ms`,
      error: error.message,
      ...meta
    });
    
    throw new DatabaseError(`Database ${operation} failed: ${error.message}`);
  }
};

// External API call wrapper with logging
const apiCall = async (service, method, url, fn, meta = {}) => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.api(service, method, url, 200, duration, {
      success: true,
      ...meta
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('External API call failed', {
      service,
      method,
      url,
      duration: `${duration}ms`,
      error: error.message,
      ...meta
    });
    
    throw new ExternalServiceError(service, error.message);
  }
};

// Validation helper
const validateRequired = (data, fields) => {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }
};

// Generic error response creator
const sendError = (res, error, requestId) => {
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
      userId: res.req.user?.id || null,
      method: res.req.method,
      url: res.req.url
    },
    extra: {
      requestBody: res.req.body,
      query: res.req.query,
      params: res.req.params
    },
    user: {
      id: res.req.user?.id || null,
      email: res.req.user?.email || null
    }
  });
  
  // Send generic error response
  const errorResponse = createGenericError(errorType, userMessage, statusCode);
  errorResponse.requestId = requestId;
  
  res.status(statusCode).json(errorResponse);
};

// Success response helper
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId: res.req.requestId
  });
};

// Pagination helper
const createPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

module.exports = {
  // Error classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  PaymentError,
  ExternalServiceError,
  DatabaseError,
  
  // Utilities
  asyncHandler,
  dbOperation,
  apiCall,
  validateRequired,
  sendError,
  sendSuccess,
  createPagination
};
