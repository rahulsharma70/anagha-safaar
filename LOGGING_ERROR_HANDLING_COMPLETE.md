# Comprehensive Logging and Error Handling Implementation

## Overview

This document outlines the complete implementation of server-side error logging with Sentry, generic error responses to the frontend, structured logging with Winston, and comprehensive health checks for the travel booking application.

## 🚨 **Server-Side Error Logging with Sentry**

### Implementation

**File:** `server/src/lib/sentry.js`

**Key Features:**
- ✅ **Error Tracking**: Captures and logs all server-side errors
- ✅ **Performance Monitoring**: Tracks API response times and database queries
- ✅ **User Context**: Associates errors with specific users
- ✅ **Custom Context**: Adds business-specific metadata to errors
- ✅ **Error Filtering**: Filters out non-critical errors in production
- ✅ **Release Tracking**: Associates errors with application versions

**Usage:**
```javascript
const { errorTracker } = require('./lib/sentry');

// Capture error with context
errorTracker.captureError(error, {
  tags: { component: 'booking', userId: 'user_123' },
  extra: { bookingId: 'booking_456', amount: 15000 },
  user: { id: 'user_123', email: 'user@example.com' }
});

// Capture message
errorTracker.captureMessage('Payment processed successfully', 'info', {
  tags: { component: 'payment' },
  extra: { amount: 10000, currency: 'INR' }
});
```

### Configuration

**Environment Variables:**
```bash
SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=production
npm_package_version=1.0.0
```

## 🛡️ **Generic Error Responses to Frontend**

### Implementation

**File:** `server/src/lib/sentry.js` (createGenericError function)

**Error Types:**
- ✅ **Validation Error**: Invalid request data
- ✅ **Authentication Error**: Login/authentication failures
- ✅ **Authorization Error**: Permission denied
- ✅ **Not Found Error**: Resource not found
- ✅ **Rate Limit Error**: Too many requests
- ✅ **Payment Error**: Payment processing failures
- ✅ **External Service Error**: Third-party service issues
- ✅ **Database Error**: Database operation failures
- ✅ **Internal Error**: Unexpected server errors

**Generic Error Response Format:**
```json
{
  "success": false,
  "error": "Service temporarily unavailable. Please try again later.",
  "errorType": "external_service_error",
  "statusCode": 503,
  "timestamp": "2024-12-01T10:00:00.000Z",
  "requestId": "req_123456789"
}
```

**Benefits:**
- ✅ **Security**: Prevents sensitive information leakage
- ✅ **Consistency**: Standardized error responses
- ✅ **User-Friendly**: Clear, actionable error messages
- ✅ **Debugging**: Request ID for server-side correlation

## 📝 **Structured Logging with Winston**

### Implementation

**File:** `server/src/lib/logger.js`

**Logging Levels:**
- ✅ **Error**: Critical errors requiring immediate attention
- ✅ **Warn**: Warning conditions that should be monitored
- ✅ **Info**: General information about application flow
- ✅ **Debug**: Detailed information for debugging
- ✅ **HTTP**: HTTP request/response logging

**Structured Logging Methods:**
```javascript
const logger = require('./lib/logger');

// Basic logging
logger.error('Database connection failed', { 
  error: error.message, 
  stack: error.stack,
  component: 'database'
});

// HTTP request logging
logger.http(req, res, responseTime);

// Database operation logging
logger.db('SELECT', 'hotels', duration, { 
  query: 'SELECT * FROM hotels',
  rowsReturned: 10 
});

// External API logging
logger.api('weather-api', 'GET', url, statusCode, duration, {
  city: 'Mumbai',
  responseSize: '2KB'
});

// Authentication logging
logger.auth('login', userId, { 
  method: 'email',
  success: true 
});

// Payment logging
logger.payment('payment_captured', amount, currency, {
  paymentId: 'pay_123',
  orderId: 'order_123'
});

// Security event logging
logger.security('suspicious_request', 'medium', {
  ip: '192.168.1.100',
  pattern: 'XSS attempt'
});

// Performance logging
logger.performance('database_query', duration, {
  table: 'bookings',
  operation: 'SELECT'
});

// Business event logging
logger.business('booking_created', {
  bookingId: 'booking_123',
  amount: 15000,
  userId: 'user_123'
});
```

**Log Transports:**
- ✅ **Console**: Development logging with colors
- ✅ **File**: Persistent log storage with rotation
- ✅ **Error File**: Separate error log file
- ✅ **HTTP File**: Dedicated HTTP request logs

**Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "info",
  "message": "Application started",
  "service": "travel-booking-api",
  "environment": "production",
  "version": "1.0.0",
  "component": "startup"
}
```

## 🏥 **Comprehensive Health Check System**

### Implementation

**File:** `server/src/lib/healthCheck.js`

**Health Check Types:**
- ✅ **Database Health**: Supabase connection and query performance
- ✅ **Redis Health**: Cache service connectivity
- ✅ **Memory Health**: Memory usage monitoring
- ✅ **External Services**: Razorpay, SendGrid, Twilio API health
- ✅ **Disk Space**: Available storage monitoring

**Health Check Endpoints:**
```javascript
// Basic health check
GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production"
}

// Detailed health check
GET /api/health/detailed
{
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "duration": "45ms",
      "result": "OK",
      "critical": true
    },
    "redis": {
      "status": "healthy",
      "duration": "12ms",
      "result": "OK",
      "critical": false
    }
  }
}

// Readiness probe
GET /api/health/ready
{
  "status": "ready",
  "timestamp": "2024-12-01T10:00:00.000Z"
}

// Liveness probe
GET /api/health/live
{
  "status": "alive",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "uptime": 3600,
  "pid": 12345
}

// Metrics endpoint
GET /api/health/metrics
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 150,
    "heapTotal": 100,
    "heapUsed": 80,
    "external": 20
  },
  "cpu": {
    "user": 1000000,
    "system": 500000
  },
  "process": {
    "pid": 12345,
    "version": "v18.17.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

## 🔧 **Request/Response Logging Middleware**

### Implementation

**File:** `server/src/lib/loggingMiddleware.js`

**Middleware Components:**
- ✅ **Request Logging**: Logs incoming requests with metadata
- ✅ **Response Logging**: Logs outgoing responses with timing
- ✅ **Performance Monitoring**: Tracks slow requests (>1s)
- ✅ **Security Logging**: Detects suspicious patterns
- ✅ **Business Logging**: Tracks business events by route

**Request Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "info",
  "message": "Incoming request",
  "requestId": "req_123456789",
  "method": "POST",
  "url": "/api/bookings",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "userId": "user_123"
}
```

**HTTP Response Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "http",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/bookings",
  "statusCode": 201,
  "responseTime": "250ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "userId": "user_123",
  "requestId": "req_123456789"
}
```

## ⚡ **Performance Monitoring Middleware**

### Implementation

**File:** `server/src/lib/loggingMiddleware.js`

**Performance Metrics:**
- ✅ **Request Duration**: Total request processing time
- ✅ **Memory Usage**: Memory consumption per request
- ✅ **Slow Request Detection**: Alerts for requests >1s
- ✅ **Memory Delta**: Memory usage change per request

**Performance Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "info",
  "message": "Performance Metric",
  "operation": "request",
  "duration": "250ms",
  "method": "POST",
  "url": "/api/bookings",
  "statusCode": 201,
  "memoryDelta": {
    "rss": 1024,
    "heapUsed": 512
  },
  "userId": "user_123"
}
```

## 🔒 **Security Event Logging**

### Implementation

**File:** `server/src/lib/loggingMiddleware.js`

**Security Patterns Detected:**
- ✅ **Path Traversal**: `../` patterns
- ✅ **XSS Attempts**: `<script>` tags
- ✅ **SQL Injection**: `union select` patterns
- ✅ **Code Injection**: `eval(` functions
- ✅ **JavaScript Injection**: `javascript:` protocols

**Security Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "warn",
  "message": "Security Event",
  "event": "suspicious_request",
  "severity": "medium",
  "requestId": "req_123456789",
  "method": "GET",
  "url": "/api/test/../admin",
  "userAgent": "Suspicious Agent",
  "ip": "192.168.1.100",
  "userId": "user_123",
  "pattern": "/\\.\\./"
}
```

## 📊 **Business Event Logging**

### Implementation

**File:** `server/src/lib/loggingMiddleware.js`

**Business Events Tracked:**
- ✅ **Booking Operations**: Create, update, cancel bookings
- ✅ **Payment Operations**: Process payments, refunds
- ✅ **Hotel Operations**: View, search hotels
- ✅ **Flight Operations**: Search, book flights
- ✅ **Tour Operations**: Browse, book tours
- ✅ **AI Itinerary Operations**: Generate, save itineraries

**Business Log Format:**
```json
{
  "timestamp": "2024-12-01T10:00:00.000Z",
  "level": "info",
  "message": "Business Event",
  "event": "booking_created",
  "requestId": "req_123456789",
  "bookingId": "booking_123",
  "amount": 15000,
  "userId": "user_123",
  "hotelId": "hotel_456"
}
```

## 🛠️ **Custom Error Classes and Handlers**

### Implementation

**File:** `server/src/lib/errorHandlers.js`

**Custom Error Classes:**
```javascript
// Validation errors
throw new ValidationError('Invalid email format', 'email');

// Authentication errors
throw new AuthenticationError('Invalid credentials');

// Authorization errors
throw new AuthorizationError('Admin access required');

// Not found errors
throw new NotFoundError('Hotel');

// Rate limit errors
throw new RateLimitError('Too many requests');

// Payment errors
throw new PaymentError('Payment gateway error');

// External service errors
throw new ExternalServiceError('weather-api', 'API timeout');

// Database errors
throw new DatabaseError('Connection failed');
```

**Error Handler Utilities:**
```javascript
const { asyncHandler, dbOperation, apiCall, sendError, sendSuccess } = require('./lib/errorHandlers');

// Async error wrapper
router.get('/', asyncHandler(async (req, res) => {
  // Route logic here
}));

// Database operation with logging
const result = await dbOperation('SELECT', 'hotels', () => 
  supabase.from('hotels').select('*'), 
  { requestId: req.requestId }
);

// External API call with logging
const data = await apiCall('weather-api', 'GET', url, () => 
  axios.get(url), 
  { requestId: req.requestId }
);

// Send error response
sendError(res, error, req.requestId);

// Send success response
sendSuccess(res, data, 'Operation successful', 200);
```

## 📈 **Database and API Operation Logging**

### Implementation

**Database Operation Logging:**
```javascript
// Automatic logging for database operations
const { data, error } = await dbOperation('INSERT', 'bookings', () =>
  supabase.from('bookings').insert(bookingData),
  { requestId: req.requestId, userId: req.user.id }
);
```

**External API Call Logging:**
```javascript
// Automatic logging for external API calls
const response = await apiCall('razorpay', 'POST', '/orders', () =>
  razorpay.orders.create(orderData),
  { requestId: req.requestId, amount: orderData.amount }
);
```

## 🚀 **Integration with Express App**

### Implementation

**File:** `server/src/app.ts`

**Middleware Integration:**
```javascript
const express = require('express');
const { initializeSentry, errorHandler, requestIdMiddleware } = require('./lib/sentry');
const logger = require('./lib/logger');
const {
  requestLoggingMiddleware,
  performanceMiddleware,
  securityLoggingMiddleware,
  businessLoggingMiddleware
} = require('./lib/loggingMiddleware');

// Initialize Sentry first
initializeSentry();

const app = express();

// Request ID middleware (must be early)
app.use(requestIdMiddleware);

// Logging middleware
app.use(requestLoggingMiddleware);
app.use(performanceMiddleware);
app.use(securityLoggingMiddleware);
app.use(businessLoggingMiddleware);

// Global error handler (must be last)
app.use(errorHandler);
```

## 📋 **Environment Configuration**

### Required Environment Variables

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here

# Logging Configuration
LOG_LEVEL=info
NODE_ENV=production

# Application Configuration
npm_package_version=1.0.0
FRONTEND_URL=https://your-frontend.com

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# External Services
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SENDGRID_API_KEY=your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## 🎯 **Key Benefits**

### Security & Privacy
- ✅ **Server-Side Only**: Sensitive errors never reach frontend
- ✅ **Generic Messages**: User-friendly error responses
- ✅ **Request Correlation**: Request IDs for debugging
- ✅ **Security Monitoring**: Automatic threat detection

### Monitoring & Debugging
- ✅ **Complete Visibility**: All errors tracked and logged
- ✅ **Performance Metrics**: Request timing and memory usage
- ✅ **Business Intelligence**: Event tracking for analytics
- ✅ **Health Monitoring**: System status and availability

### Production Readiness
- ✅ **Error Tracking**: Sentry integration for production monitoring
- ✅ **Structured Logging**: Winston for comprehensive logging
- ✅ **Health Checks**: Kubernetes-ready health endpoints
- ✅ **Performance Monitoring**: Slow request detection
- ✅ **Security Logging**: Threat detection and prevention

### Developer Experience
- ✅ **Custom Error Classes**: Type-safe error handling
- ✅ **Async Error Wrappers**: Simplified error handling
- ✅ **Database Logging**: Automatic operation tracking
- ✅ **API Logging**: External service monitoring
- ✅ **Business Logging**: Event tracking for analytics

## 🏁 **Implementation Status: COMPLETE ✅**

The comprehensive logging and error handling system is fully implemented with:

- ✅ **Server-side error logging with Sentry**
- ✅ **Generic error responses to frontend**
- ✅ **Structured logging with Winston**
- ✅ **Comprehensive health check system**
- ✅ **Request/response logging middleware**
- ✅ **Performance monitoring middleware**
- ✅ **Security event logging**
- ✅ **Business event logging**
- ✅ **Custom error classes and handlers**
- ✅ **Database and API operation logging**
- ✅ **Production-ready error handling**

This implementation provides enterprise-grade logging, monitoring, and error handling capabilities that ensure the travel booking application is production-ready with comprehensive visibility into system behavior, security events, and business operations.
