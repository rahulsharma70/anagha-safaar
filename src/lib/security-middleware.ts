import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { Sentry } from './monitoring';

// =============================================================================
// 1. ENVIRONMENT VARIABLES VALIDATION
// =============================================================================

const envSchema = z.object({
  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // API Keys
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email(),
  
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),
  
  // Security Configuration
  ENCRYPTION_KEY: z.string().length(32),
  SESSION_SECRET: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);

// =============================================================================
// 2. SUPABASE CLIENT CONFIGURATION
// =============================================================================

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =============================================================================
// 3. JWT TOKEN MANAGEMENT
// =============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export class TokenManager {
  // Generate access token
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'anagha-safaar',
      audience: 'anagha-safaar-users'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'anagha-safaar',
      audience: 'anagha-safaar-refresh'
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'anagha-safaar',
        audience: 'anagha-safaar-users'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'anagha-safaar',
        audience: 'anagha-safaar-refresh'
      }) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Generate session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Blacklist token (store in database)
  static async blacklistToken(token: string, reason: string = 'logout'): Promise<void> {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      await supabase
        .from('blacklisted_tokens')
        .insert([{
          token_hash: crypto.createHash('sha256').update(token).digest('hex'),
          user_id: decoded.userId,
          session_id: decoded.sessionId,
          reason: reason,
          expires_at: new Date(decoded.exp! * 1000)
        }]);
    } catch (error) {
      logger.error('Failed to blacklist token', error);
    }
  }

  // Check if token is blacklisted
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const { data, error } = await supabase
        .from('blacklisted_tokens')
        .select('id')
        .eq('token_hash', tokenHash)
        .single();
      
      return !error && !!data;
    } catch (error) {
      logger.error('Failed to check token blacklist', error);
      return false;
    }
  }
}

// =============================================================================
// 4. AUTHENTICATION MIDDLEWARE
// =============================================================================

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
  sessionId: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Verify token
    const payload = TokenManager.verifyAccessToken(token);
    
    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Verify user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', payload.userId)
      .single();

    if (roleError || !userRole) {
      res.status(401).json({ error: 'User role not found' });
      return;
    }

    // Add user info to request
    req.user = {
      ...payload,
      role: userRole.role as 'admin' | 'user'
    };
    req.sessionId = payload.sessionId;

    // Log successful authentication
    logger.info('User authenticated', {
      userId: payload.userId,
      email: payload.email,
      role: userRole.role,
      sessionId: payload.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// =============================================================================
// 5. AUTHORIZATION MIDDLEWARE
// =============================================================================

export const requireRole = (roles: ('admin' | 'user')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });

      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireUser = requireRole(['user', 'admin']);

// =============================================================================
// 6. RATE LIMITING MIDDLEWARE
// =============================================================================

export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || parseInt(env.RATE_LIMIT_WINDOW_MS),
    max: options.max || parseInt(env.RATE_LIMIT_MAX_REQUESTS),
    message: options.message || 'Too many requests from this IP, please try again later.',
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(options.windowMs! / 1000)
      });
    }
  });
};

// Specific rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req: Request) => req.ip + ':' + req.body.email
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later.'
});

export const paymentRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 payment attempts per minute
  message: 'Too many payment attempts, please try again later.'
});

// =============================================================================
// 7. SECURITY HEADERS MIDDLEWARE
// =============================================================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://api.sendgrid.com"],
      frameSrc: ["'self'", "https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// =============================================================================
// 8. CORS CONFIGURATION
// =============================================================================

export const corsOptions = {
  origin: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-ID'],
  exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
};

// =============================================================================
// 9. INPUT VALIDATION MIDDLEWARE
// =============================================================================

export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Input validation failed', {
          errors: error.errors,
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });

        res.status(400).json({
          error: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      logger.error('Input validation error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Common validation schemas
export const bookingSchema = z.object({
  type: z.enum(['hotel', 'flight', 'tour']),
  itemId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  guestsCount: z.number().int().min(1).max(10),
  guestDetails: z.array(z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    idType: z.enum(['passport', 'aadhar', 'license']),
    idNumber: z.string().min(1).max(50)
  })).min(1),
  addOns: z.object({
    travelInsurance: z.boolean(),
    mealPlan: z.enum(['breakfast', 'half-board', 'full-board']).optional(),
    specialRequests: z.string().max(500).optional()
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Terms must be accepted'
  })
});

export const paymentSchema = z.object({
  amount: z.number().int().min(1),
  currency: z.string().default('INR'),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1)
});

// =============================================================================
// 10. REQUEST LOGGING MIDDLEWARE
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to headers
  res.setHeader('X-Request-ID', requestId);

  // Log request
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as AuthenticatedRequest).user?.userId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: (req as AuthenticatedRequest).user?.userId
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// =============================================================================
// 11. ERROR HANDLING MIDDLEWARE
// =============================================================================

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = res.getHeader('X-Request-ID') as string;

  // Log error
  logger.error('Request error', {
    requestId,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: (req as AuthenticatedRequest).user?.userId
  });

  // Send error to Sentry
  Sentry.captureException(error, {
    tags: {
      requestId,
      userId: (req as AuthenticatedRequest).user?.userId
    },
    extra: {
      method: req.method,
      url: req.url,
      ip: req.ip
    }
  });

  // Don't leak error details in production
  if (env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      requestId
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      requestId
    });
  }
};

// =============================================================================
// 12. SECURITY MONITORING MIDDLEWARE
// =============================================================================

export const securityMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /eval\(/i, // Code injection
    /exec\(/i, // Command injection
  ];

  const requestBody = JSON.stringify(req.body);
  const requestQuery = JSON.stringify(req.query);
  const requestParams = JSON.stringify(req.params);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestQuery) || pattern.test(requestParams)) {
      logger.warn('Suspicious request detected', {
        pattern: pattern.toString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as AuthenticatedRequest).user?.userId
      });

      // Log security event
      supabase
        .from('security_events')
        .insert([{
          user_id: (req as AuthenticatedRequest).user?.userId,
          event_type: 'suspicious_request',
          severity: 'medium',
          description: `Suspicious pattern detected: ${pattern.toString()}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          metadata: {
            pattern: pattern.toString(),
            method: req.method,
            url: req.url
          }
        }]);

      res.status(400).json({ error: 'Suspicious request detected' });
      return;
    }
  }

  next();
};

// =============================================================================
// 13. SESSION MANAGEMENT MIDDLEWARE
// =============================================================================

export const sessionManager = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    // Check session validity
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('id, expires_at, is_active')
      .eq('user_id', req.user.userId)
      .eq('session_id', req.sessionId)
      .single();

    if (error || !session || !session.is_active) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Mark session as expired
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Extend session if needed (last activity within 30 minutes)
    const lastActivity = new Date();
    const sessionExpiry = new Date(lastActivity.getTime() + 30 * 60 * 1000); // 30 minutes

    await supabase
      .from('user_sessions')
      .update({ 
        last_activity: lastActivity.toISOString(),
        expires_at: sessionExpiry.toISOString()
      })
      .eq('id', session.id);

    next();
  } catch (error) {
    logger.error('Session management error', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
};

// =============================================================================
// 14. DATA ENCRYPTION UTILITIES
// =============================================================================

export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static key = Buffer.from(env.ENCRYPTION_KEY, 'hex');

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('anagha-safaar', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('anagha-safaar', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, env.SESSION_SECRET, 100000, 64, 'sha512').toString('hex');
  }

  static verifyPassword(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(hash));
  }
}

// =============================================================================
// 15. EXPORT ALL MIDDLEWARE
// =============================================================================

export const securityMiddleware = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUser,
  createRateLimit,
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  securityHeaders,
  corsOptions,
  validateInput,
  requestLogger,
  errorHandler,
  securityMonitor,
  sessionManager,
  TokenManager,
  EncryptionService
};

export default securityMiddleware;
