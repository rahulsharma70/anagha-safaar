# Backend Security Infrastructure - Anagha Safaar

This directory contains the backend security infrastructure for the Anagha Safaar travel booking platform. These files are designed for Node.js/Express backend environments and should not be included in frontend builds.

## 📁 **Directory Structure**

```
backend/
├── lib/
│   ├── security-middleware.ts    # Authentication, authorization, and security middleware
│   ├── monitoring.ts            # Logging, monitoring, and health check services
│   └── config.ts               # Environment validation and secrets management
└── tests/
    └── security.test.ts        # Comprehensive security test suite
```

## 🔧 **Files Overview**

### `lib/security-middleware.ts`
- **JWT Authentication**: Token validation and refresh token management
- **Role-Based Authorization**: Admin/user permission system
- **Rate Limiting**: Multi-tier request throttling
- **Security Headers**: Helmet.js implementation with CSP, HSTS
- **Input Validation**: Zod schema validation and sanitization
- **Encryption Service**: AES-256-GCM data encryption
- **Session Management**: Secure session handling with blacklisting

### `lib/monitoring.ts`
- **Structured Logging**: Winston-based logging with correlation IDs
- **Sentry Integration**: Error tracking and performance monitoring
- **Security Event Logging**: Comprehensive security event tracking
- **Health Checks**: Database and external service monitoring
- **Performance Metrics**: Response time and resource usage tracking
- **Fraud Detection**: Suspicious activity monitoring

### `lib/config.ts`
- **Environment Validation**: Comprehensive Zod schema validation
- **Secrets Management**: Encrypted storage and rotation
- **Configuration Templates**: Pre-configured environment templates
- **Runtime Validation**: Pre-startup configuration validation
- **Key Generation**: Secure random key generation utilities

### `tests/security.test.ts`
- **Authentication Tests**: Token validation and session management
- **Authorization Tests**: Role-based access control validation
- **Rate Limiting Tests**: Request throttling validation
- **Input Validation Tests**: Data sanitization and validation
- **Security Monitoring Tests**: Threat detection and logging
- **Integration Tests**: Complete security flow testing

## 🚀 **Usage**

### Installation
```bash
# Install backend dependencies
npm install express jsonwebtoken winston helmet express-rate-limit bcrypt argon2 supertest
npm install --save-dev @types/express @types/jsonwebtoken @types/bcrypt @types/supertest
```

### Environment Setup
```bash
# Copy environment template
cp ENVIRONMENT_CONFIG.md .env.local

# Configure required environment variables
NODE_ENV=production
JWT_SECRET=your_32_character_jwt_secret
JWT_REFRESH_SECRET=your_32_character_refresh_secret
ENCRYPTION_KEY=your_32_character_encryption_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Express.js Integration
```typescript
import express from 'express';
import { securityMiddleware } from './backend/lib/security-middleware';
import { LoggingService, MonitoringService } from './backend/lib/monitoring';

const app = express();

// Apply security middleware
app.use(securityMiddleware.requestLogger);
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.securityMonitor);

// Protected routes
app.get('/api/protected', 
  securityMiddleware.authenticateToken,
  securityMiddleware.requireUser,
  (req, res) => {
    res.json({ message: 'Protected data', user: req.user });
  }
);

// Admin routes
app.get('/api/admin', 
  securityMiddleware.authenticateToken,
  securityMiddleware.requireAdmin,
  (req, res) => {
    res.json({ message: 'Admin data' });
  }
);
```

### Testing
```bash
# Run security tests
npm test backend/tests/security.test.ts

# Run with coverage
npm run test:coverage
```

## 🔒 **Security Features**

### Authentication & Authorization
- JWT token validation with refresh token rotation
- Role-based access control (admin/user)
- Session management with timeout controls
- Token blacklisting for secure logout

### Input Validation & Sanitization
- Comprehensive Zod schema validation
- XSS and injection attack prevention
- Request sanitization and validation
- SQL injection protection

### Rate Limiting & Monitoring
- Multi-tier rate limiting (per user, IP, route)
- Real-time security event logging
- Suspicious activity detection
- Performance monitoring and alerting

### Data Protection
- AES-256-GCM encryption for sensitive data
- Secure secrets management with rotation
- PCI DSS compliance for payment data
- GDPR compliance with data deletion rights

## 📊 **Monitoring & Logging**

### Structured Logging
```typescript
import { LoggingService } from './backend/lib/monitoring';

// Log security events
LoggingService.securityEvent('auth_failure', 'medium', 
  'Authentication failed', { userId, ip, reason });

// Log audit events
LoggingService.auditEvent('CREATE', 'booking', bookingId, 
  null, bookingData, { userId, sessionId });

// Log performance metrics
LoggingService.performanceMetric('api_response_time', 
  duration, 'ms', { endpoint, method });
```

### Health Checks
```typescript
import { HealthCheckService } from './backend/lib/monitoring';

// Check database connectivity
const dbHealth = await HealthCheckService.checkDatabase();

// Check external services
const servicesHealth = await HealthCheckService.checkExternalServices();

// Get system metrics
const metrics = HealthCheckService.getSystemMetrics();
```

## 🛠️ **Configuration**

### Environment Variables
All required environment variables are validated at startup:

```bash
# Required variables
NODE_ENV=production
JWT_SECRET=your_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_refresh_secret_32_chars_minimum
ENCRYPTION_KEY=your_encryption_key_exactly_32_chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional variables with defaults
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000
```

### Security Configuration
```typescript
import { ConfigurationValidator } from './backend/lib/config';

// Validate all configuration at startup
ConfigurationValidator.validateAll();

// Generate secure keys
const jwtSecret = ConfigurationUtils.generateJWTSecret();
const encryptionKey = ConfigurationUtils.generateEncryptionKey();
```

## 🧪 **Testing**

### Test Categories
- **Authentication Tests**: Token validation and session management
- **Authorization Tests**: Role-based access control
- **Rate Limiting Tests**: Request throttling validation
- **Input Validation Tests**: Data sanitization and validation
- **Security Monitoring Tests**: Threat detection and logging
- **Integration Tests**: Complete security flow testing

### Running Tests
```bash
# Run all security tests
npm test backend/tests/security.test.ts

# Run specific test suites
npm test -- --grep "Authentication"
npm test -- --grep "Authorization"
npm test -- --grep "Rate Limiting"
```

## 📚 **Documentation**

- **Security Implementation**: See `SECURITY_HARDENING_COMPLETE.md`
- **Environment Configuration**: See `ENVIRONMENT_CONFIG.md`
- **API Documentation**: See individual file comments
- **Test Documentation**: See test file comments

## ⚠️ **Important Notes**

1. **Backend Only**: These files are designed for Node.js/Express backends only
2. **Environment Variables**: All sensitive data must be in environment variables
3. **Secrets Management**: Use proper secrets management in production
4. **Monitoring**: Set up proper monitoring and alerting
5. **Testing**: Run security tests before deployment
6. **Updates**: Keep dependencies updated for security patches

## 🔗 **Related Files**

- `supabase/migrations/20250122000003_database_security_hardening.sql` - Database security
- `SECURITY_HARDENING_COMPLETE.md` - Complete security documentation
- `ENVIRONMENT_CONFIG.md` - Environment configuration guide
- `package.json` - Backend dependencies

---

**Last Updated**: January 22, 2025  
**Version**: 1.0  
**Maintainer**: Anagha Safaar Security Team
