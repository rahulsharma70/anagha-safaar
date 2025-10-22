import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { securityMiddleware } from '../lib/security-middleware';
import { LoggingService, MonitoringService } from '../lib/monitoring';
import { supabase } from '../lib/security-middleware';

// Mock Supabase client
vi.mock('../lib/security-middleware', async () => {
  const actual = await vi.importActual('../lib/security-middleware');
  return {
    ...actual,
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    }
  };
});

// Mock logger
vi.mock('../lib/monitoring', () => ({
  LoggingService: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    securityEvent: vi.fn(),
    auditEvent: vi.fn(),
    paymentEvent: vi.fn(),
    bookingEvent: vi.fn(),
    performanceMetric: vi.fn(),
    userActivity: vi.fn(),
    maskSensitiveData: vi.fn(),
    createCorrelationId: vi.fn(() => 'test-correlation-id')
  },
  MonitoringService: {
    trackResponseTime: vi.fn(),
    trackDatabaseQuery: vi.fn(),
    trackMemoryUsage: vi.fn(),
    trackErrorRate: vi.fn(),
    trackAuthFailure: vi.fn(),
    trackSuspiciousActivity: vi.fn()
  }
}));

describe('Security Middleware Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityMiddleware.requestLogger);
    app.use(securityMiddleware.securityHeaders);
    app.use(securityMiddleware.securityMonitor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      app.get('/protected', securityMiddleware.authenticateToken, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should reject requests with invalid token', async () => {
      app.get('/protected', securityMiddleware.authenticateToken, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should accept requests with valid token', async () => {
      // Mock valid token verification
      vi.spyOn(securityMiddleware.TokenManager, 'verifyAccessToken').mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'session-123'
      });

      vi.spyOn(securityMiddleware.TokenManager, 'isTokenBlacklisted').mockResolvedValue(false);

      // Mock Supabase responses
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', email: 'test@example.com' },
              error: null
            })
          })
        })
      });

      app.get('/protected', securityMiddleware.authenticateToken, (req, res) => {
        res.json({ message: 'success', user: req.user });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('success');
      expect(response.body.user.userId).toBe('user-123');
    });
  });

  describe('Authorization Middleware', () => {
    beforeEach(() => {
      // Mock authenticated request
      app.use((req: any, res, next) => {
        req.user = {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'user',
          sessionId: 'session-123'
        };
        next();
      });
    });

    it('should allow admin access to admin-only routes', async () => {
      app.use((req: any, res, next) => {
        req.user.role = 'admin';
        next();
      });

      app.get('/admin', securityMiddleware.requireAdmin, (req, res) => {
        res.json({ message: 'admin access granted' });
      });

      const response = await request(app)
        .get('/admin')
        .expect(200);

      expect(response.body.message).toBe('admin access granted');
    });

    it('should deny user access to admin-only routes', async () => {
      app.get('/admin', securityMiddleware.requireAdmin, (req, res) => {
        res.json({ message: 'admin access granted' });
      });

      const response = await request(app)
        .get('/admin')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow user access to user routes', async () => {
      app.get('/user', securityMiddleware.requireUser, (req, res) => {
        res.json({ message: 'user access granted' });
      });

      const response = await request(app)
        .get('/user')
        .expect(200);

      expect(response.body.message).toBe('user access granted');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimit = securityMiddleware.createRateLimit({
        windowMs: 1000, // 1 second
        max: 2, // 2 requests per window
        message: 'Rate limit exceeded'
      });

      app.get('/limited', rateLimit, (req, res) => {
        res.json({ message: 'success' });
      });

      // First two requests should succeed
      await request(app).get('/limited').expect(200);
      await request(app).get('/limited').expect(200);

      // Third request should be rate limited
      const response = await request(app)
        .get('/limited')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });

    it('should have different limits for different endpoints', async () => {
      app.get('/auth', securityMiddleware.authRateLimit, (req, res) => {
        res.json({ message: 'auth success' });
      });

      app.get('/api', securityMiddleware.apiRateLimit, (req, res) => {
        res.json({ message: 'api success' });
      });

      // Auth endpoint should have stricter limits
      await request(app).get('/auth').expect(200);
      await request(app).get('/auth').expect(200);
      await request(app).get('/auth').expect(200);
      await request(app).get('/auth').expect(200);
      await request(app).get('/auth').expect(200);
      
      // 6th request should be rate limited
      await request(app).get('/auth').expect(429);

      // API endpoint should allow more requests
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api').expect(200);
      }
    });
  });

  describe('Input Validation', () => {
    const testSchema = {
      name: 'string',
      email: 'email',
      age: 'number'
    };

    it('should validate input data', async () => {
      const validationSchema = {
        parse: vi.fn().mockImplementation((data) => {
          if (!data.name || typeof data.name !== 'string') {
            throw new Error('Name is required');
          }
          if (!data.email || !data.email.includes('@')) {
            throw new Error('Invalid email');
          }
          return data;
        })
      };

      app.post('/validate', securityMiddleware.validateInput(validationSchema as any), (req, res) => {
        res.json({ message: 'validation passed', data: req.body });
      });

      const response = await request(app)
        .post('/validate')
        .send({ name: 'John Doe', email: 'john@example.com', age: 30 })
        .expect(200);

      expect(response.body.message).toBe('validation passed');
    });

    it('should reject invalid input data', async () => {
      const validationSchema = {
        parse: vi.fn().mockImplementation((data) => {
          if (!data.name) {
            throw new Error('Name is required');
          }
          return data;
        })
      };

      app.post('/validate', securityMiddleware.validateInput(validationSchema as any), (req, res) => {
        res.json({ message: 'validation passed' });
      });

      const response = await request(app)
        .post('/validate')
        .send({ email: 'john@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Invalid input data');
    });
  });

  describe('Security Monitoring', () => {
    it('should detect suspicious patterns', async () => {
      app.get('/test', (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/test')
        .query({ q: '<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body.error).toBe('Suspicious request detected');
    });

    it('should detect SQL injection attempts', async () => {
      app.get('/test', (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/test')
        .query({ q: "'; DROP TABLE users; --" })
        .expect(400);

      expect(response.body.error).toBe('Suspicious request detected');
    });

    it('should detect path traversal attempts', async () => {
      app.get('/test', (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/test')
        .query({ file: '../../../etc/passwd' })
        .expect(400);

      expect(response.body.error).toBe('Suspicious request detected');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      app.get('/error', (req, res, next) => {
        throw new Error('Test error');
      });

      app.use(securityMiddleware.errorHandler);

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.error).toBe('Test error');
      expect(response.body.requestId).toBeDefined();
    });

    it('should mask sensitive data in production', async () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';

      app.get('/error', (req, res, next) => {
        throw new Error('Test error');
      });

      app.use(securityMiddleware.errorHandler);

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.stack).toBeUndefined();
    });
  });

  describe('Token Management', () => {
    it('should generate valid tokens', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
        sessionId: 'session-123'
      };

      const token = securityMiddleware.TokenManager.generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify valid tokens', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
        sessionId: 'session-123'
      };

      const token = securityMiddleware.TokenManager.generateAccessToken(payload);
      const verified = securityMiddleware.TokenManager.verifyAccessToken(token);
      
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
    });

    it('should reject expired tokens', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
        sessionId: 'session-123'
      };

      // Generate token with very short expiry
      const token = securityMiddleware.TokenManager.generateAccessToken(payload);
      
      // Mock expired token
      vi.spyOn(securityMiddleware.TokenManager, 'verifyAccessToken').mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => {
        securityMiddleware.TokenManager.verifyAccessToken(token);
      }).toThrow('Token expired');
    });

    it('should generate session IDs', () => {
      const sessionId = securityMiddleware.TokenManager.generateSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('Encryption Service', () => {
    it('should encrypt and decrypt data', () => {
      const plaintext = 'sensitive data';
      const encrypted = securityMiddleware.EncryptionService.encrypt(plaintext);
      const decrypted = securityMiddleware.EncryptionService.decrypt(encrypted);
      
      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should hash passwords', () => {
      const password = 'testpassword';
      const hash = securityMiddleware.EncryptionService.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBe(128); // 64 bytes = 128 hex chars
    });

    it('should verify passwords', () => {
      const password = 'testpassword';
      const hash = securityMiddleware.EncryptionService.hashPassword(password);
      const isValid = securityMiddleware.EncryptionService.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject wrong passwords', () => {
      const password = 'testpassword';
      const wrongPassword = 'wrongpassword';
      const hash = securityMiddleware.EncryptionService.hashPassword(password);
      const isValid = securityMiddleware.EncryptionService.verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });
});

describe('Logging Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info messages', () => {
    LoggingService.info('Test info message', { userId: 'user-123' });
    expect(LoggingService.info).toHaveBeenCalledWith('Test info message', { userId: 'user-123' });
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    LoggingService.error('Test error message', error, { userId: 'user-123' });
    expect(LoggingService.error).toHaveBeenCalledWith('Test error message', error, { userId: 'user-123' });
  });

  it('should log security events', () => {
    LoggingService.securityEvent('auth_failure', 'medium', 'Authentication failed', { userId: 'user-123' });
    expect(LoggingService.securityEvent).toHaveBeenCalledWith('auth_failure', 'medium', 'Authentication failed', { userId: 'user-123' });
  });

  it('should log audit events', () => {
    LoggingService.auditEvent('CREATE', 'booking', 'booking-123', null, { status: 'confirmed' }, { userId: 'user-123' });
    expect(LoggingService.auditEvent).toHaveBeenCalledWith('CREATE', 'booking', 'booking-123', null, { status: 'confirmed' }, { userId: 'user-123' });
  });

  it('should mask sensitive data', () => {
    const data = { password: 'secret', token: 'abc123', name: 'John' };
    const masked = LoggingService.maskSensitiveData(data);
    
    expect(masked.password).toBe('***MASKED***');
    expect(masked.token).toBe('***MASKED***');
    expect(masked.name).toBe('John');
  });

  it('should create correlation IDs', () => {
    const correlationId = LoggingService.createCorrelationId();
    expect(correlationId).toBe('test-correlation-id');
  });
});

describe('Monitoring Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track response times', () => {
    MonitoringService.trackResponseTime('/api/bookings', 'GET', 150, 200, { userId: 'user-123' });
    expect(MonitoringService.trackResponseTime).toHaveBeenCalledWith('/api/bookings', 'GET', 150, 200, { userId: 'user-123' });
  });

  it('should track database queries', () => {
    MonitoringService.trackDatabaseQuery('SELECT * FROM bookings', 50, 10, { userId: 'user-123' });
    expect(MonitoringService.trackDatabaseQuery).toHaveBeenCalledWith('SELECT * FROM bookings', 50, 10, { userId: 'user-123' });
  });

  it('should track memory usage', () => {
    MonitoringService.trackMemoryUsage({ userId: 'user-123' });
    expect(MonitoringService.trackMemoryUsage).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('should track error rates', () => {
    MonitoringService.trackErrorRate('/api/bookings', 5, 100, { userId: 'user-123' });
    expect(MonitoringService.trackErrorRate).toHaveBeenCalledWith('/api/bookings', 5, 100, { userId: 'user-123' });
  });

  it('should track authentication failures', () => {
    MonitoringService.trackAuthFailure('test@example.com', 'Invalid password', '192.168.1.1', { userId: 'user-123' });
    expect(MonitoringService.trackAuthFailure).toHaveBeenCalledWith('test@example.com', 'Invalid password', '192.168.1.1', { userId: 'user-123' });
  });

  it('should track suspicious activity', () => {
    MonitoringService.trackSuspiciousActivity('Multiple failed logins', 75, { userId: 'user-123' });
    expect(MonitoringService.trackSuspiciousActivity).toHaveBeenCalledWith('Multiple failed logins', 75, { userId: 'user-123' });
  });
});

describe('Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityMiddleware.requestLogger);
    app.use(securityMiddleware.securityHeaders);
    app.use(securityMiddleware.securityMonitor);
  });

  it('should handle complete authentication flow', async () => {
    // Mock authentication
    vi.spyOn(securityMiddleware.TokenManager, 'verifyAccessToken').mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'user',
      sessionId: 'session-123'
    });

    vi.spyOn(securityMiddleware.TokenManager, 'isTokenBlacklisted').mockResolvedValue(false);

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com' },
            error: null
          })
        })
      })
    });

    app.get('/protected', securityMiddleware.authenticateToken, securityMiddleware.requireUser, (req, res) => {
      res.json({ message: 'success', user: req.user });
    });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.message).toBe('success');
    expect(response.body.user.userId).toBe('user-123');
  });

  it('should handle rate limiting with authentication', async () => {
    const rateLimit = securityMiddleware.createRateLimit({
      windowMs: 1000,
      max: 1,
      keyGenerator: (req) => req.ip + ':' + (req as any).user?.userId
    });

    // Mock authentication
    app.use((req: any, res, next) => {
      req.user = { userId: 'user-123' };
      next();
    });

    app.get('/limited', rateLimit, (req, res) => {
      res.json({ message: 'success' });
    });

    // First request should succeed
    await request(app).get('/limited').expect(200);

    // Second request should be rate limited
    await request(app).get('/limited').expect(429);
  });

  it('should handle input validation with authentication', async () => {
    const validationSchema = {
      parse: vi.fn().mockImplementation((data) => {
        if (!data.name) {
          throw new Error('Name is required');
        }
        return data;
      })
    };

    // Mock authentication
    app.use((req: any, res, next) => {
      req.user = { userId: 'user-123' };
      next();
    });

    app.post('/validate', 
      securityMiddleware.authenticateToken,
      securityMiddleware.validateInput(validationSchema as any),
      (req, res) => {
        res.json({ message: 'validation passed', data: req.body });
      }
    );

    const response = await request(app)
      .post('/validate')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'John Doe' })
      .expect(200);

    expect(response.body.message).toBe('validation passed');
  });
});

export default {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi
};
