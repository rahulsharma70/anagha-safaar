import { 
  SecurityHeadersService, 
  RateLimitService, 
  ValidationService, 
  FraudDetectionService,
  SessionSecurityService,
  EncryptionService 
} from './security';
import { logger } from './logger';

// Security middleware for API routes
export class SecurityMiddleware {
  static applySecurityHeaders(req: any, res: any, next: any) {
    try {
      const headers = SecurityHeadersService.getSecurityHeaders();
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      next();
    } catch (error) {
      logger.error('Failed to apply security headers', error);
      next(error);
    }
  }

  static rateLimit(req: any, res: any, next: any) {
    try {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const rateLimitResult = RateLimitService.checkRateLimit(identifier);
      
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      
      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', { identifier, remaining: rateLimitResult.remaining });
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error', error);
      next(error);
    }
  }

  static validateInput(req: any, res: any, next: any) {
    try {
      // Sanitize request body
      if (req.body) {
        req.body = ValidationService.sanitizeInput(req.body);
      }
      
      // Sanitize query parameters
      if (req.query) {
        req.query = ValidationService.sanitizeInput(req.query);
      }
      
      // Sanitize URL parameters
      if (req.params) {
        req.params = ValidationService.sanitizeInput(req.params);
      }
      
      next();
    } catch (error) {
      logger.error('Input validation error', error);
      res.status(400).json({
        error: 'Invalid input',
        message: 'Request contains invalid or malicious data'
      });
    }
  }

  static fraudDetection(req: any, res: any, next: any) {
    try {
      const activity = {
        requestCount: req.session?.requestCount || 1,
        timeWindow: Date.now() - (req.session?.firstRequest || Date.now()),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        location: req.session?.location,
        paymentAmount: req.body?.amount || req.body?.total_amount,
        currentTime: Date.now(),
        previousTime: req.session?.lastRequestTime,
        previousLocation: req.session?.previousLocation
      };
      
      const fraudCheck = FraudDetectionService.detectSuspiciousActivity(activity);
      
      if (fraudCheck.isSuspicious) {
        logger.warn('Suspicious activity detected', {
          riskScore: fraudCheck.riskScore,
          reasons: fraudCheck.reasons,
          ip: activity.ipAddress,
          userAgent: activity.userAgent
        });
        
        // For high-risk activities, block the request
        if (fraudCheck.riskScore > 80) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Suspicious activity detected. Please contact support if you believe this is an error.'
          });
        }
        
        // For medium-risk activities, add additional verification
        req.requiresAdditionalVerification = true;
        req.fraudRiskScore = fraudCheck.riskScore;
      }
      
      // Update session tracking
      if (req.session) {
        req.session.requestCount = (req.session.requestCount || 0) + 1;
        req.session.lastRequestTime = Date.now();
        if (!req.session.firstRequest) {
          req.session.firstRequest = Date.now();
        }
      }
      
      next();
    } catch (error) {
      logger.error('Fraud detection error', error);
      next(error);
    }
  }

  static sessionSecurity(req: any, res: any, next: any) {
    try {
      // Check for valid session
      if (req.session) {
        const sessionValidation = SessionSecurityService.validateSession(req.session);
        
        if (!sessionValidation.isValid) {
          logger.warn('Invalid session detected', {
            errors: sessionValidation.errors,
            sessionId: req.session.id,
            userId: req.session.user_id
          });
          
          // Clear invalid session
          req.session.destroy();
          
          return res.status(401).json({
            error: 'Invalid session',
            message: 'Your session has expired or is invalid. Please log in again.'
          });
        }
        
        // Update last activity
        req.session.last_activity = new Date().toISOString();
      }
      
      next();
    } catch (error) {
      logger.error('Session security error', error);
      next(error);
    }
  }

  static csrfProtection(req: any, res: any, next: any) {
    try {
      // Skip CSRF for GET requests and API endpoints
      if (req.method === 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;
      
      if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        logger.warn('CSRF token mismatch', {
          providedToken: csrfToken,
          sessionToken: sessionToken,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          error: 'CSRF token mismatch',
          message: 'Invalid security token. Please refresh the page and try again.'
        });
      }
      
      next();
    } catch (error) {
      logger.error('CSRF protection error', error);
      next(error);
    }
  }

  static generateCSRFToken(req: any, res: any, next: any) {
    try {
      if (req.session && !req.session.csrfToken) {
        req.session.csrfToken = SessionSecurityService.generateCSRFToken();
      }
      
      // Add CSRF token to response headers for frontend
      if (req.session?.csrfToken) {
        res.setHeader('X-CSRF-Token', req.session.csrfToken);
      }
      
      next();
    } catch (error) {
      logger.error('CSRF token generation error', error);
      next(error);
    }
  }

  static auditLog(req: any, res: any, next: any) {
    try {
      const startTime = Date.now();
      
      // Log request
      logger.info('API request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.session?.user_id,
        sessionId: req.session?.id,
        timestamp: new Date().toISOString()
      });
      
      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding: any) {
        const duration = Date.now() - startTime;
        
        logger.info('API response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: duration,
          userId: req.session?.user_id,
          sessionId: req.session?.id,
          timestamp: new Date().toISOString()
        });
        
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    } catch (error) {
      logger.error('Audit logging error', error);
      next(error);
    }
  }

  static errorHandler(error: any, req: any, res: any, next: any) {
    try {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.session?.user_id,
        timestamp: new Date().toISOString()
      });
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack })
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }
}

// CAPTCHA verification middleware
export class CaptchaMiddleware {
  static async verifyCaptcha(req: any, res: any, next: any) {
    try {
      const captchaToken = req.body.captcha_token || req.headers['x-captcha-token'];
      
      if (!captchaToken) {
        return res.status(400).json({
          error: 'CAPTCHA required',
          message: 'Please complete the CAPTCHA verification'
        });
      }
      
      // Verify CAPTCHA with Google reCAPTCHA
      const captchaSecret = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;
      if (!captchaSecret) {
        logger.warn('reCAPTCHA secret key not configured');
        return next(); // Skip verification if not configured
      }
      
      const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: captchaSecret,
          response: captchaToken,
          remoteip: req.ip
        })
      });
      
      const verificationResult = await verificationResponse.json();
      
      if (!verificationResult.success) {
        logger.warn('CAPTCHA verification failed', {
          errors: verificationResult['error-codes'],
          ip: req.ip
        });
        
        return res.status(400).json({
          error: 'CAPTCHA verification failed',
          message: 'Please complete the CAPTCHA verification correctly'
        });
      }
      
      // Check score for reCAPTCHA v3
      if (verificationResult.score && verificationResult.score < 0.5) {
        logger.warn('Low CAPTCHA score', {
          score: verificationResult.score,
          ip: req.ip
        });
        
        return res.status(400).json({
          error: 'CAPTCHA verification failed',
          message: 'Please complete the CAPTCHA verification correctly'
        });
      }
      
      next();
    } catch (error) {
      logger.error('CAPTCHA verification error', error);
      next(error);
    }
  }
}

// Payment security middleware
export class PaymentSecurityMiddleware {
  static validatePaymentData(req: any, res: any, next: any) {
    try {
      const paymentData = req.body;
      
      // Validate required fields
      const requiredFields = ['amount', 'currency', 'order_id'];
      const missingFields = requiredFields.filter(field => !paymentData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: `Missing fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate amount
      if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Payment amount must be a positive number'
        });
      }
      
      // Validate currency
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
      if (!validCurrencies.includes(paymentData.currency)) {
        return res.status(400).json({
          error: 'Invalid currency',
          message: 'Unsupported currency'
        });
      }
      
      // Sanitize payment data
      req.body = ValidationService.sanitizeInput(paymentData);
      
      next();
    } catch (error) {
      logger.error('Payment validation error', error);
      res.status(400).json({
        error: 'Payment validation failed',
        message: 'Invalid payment data'
      });
    }
  }

  static encryptPaymentData(req: any, res: any, next: any) {
    try {
      if (req.body.sensitive_data) {
        // Encrypt sensitive payment data
        req.body.sensitive_data = EncryptionService.encrypt(JSON.stringify(req.body.sensitive_data));
      }
      
      next();
    } catch (error) {
      logger.error('Payment encryption error', error);
      res.status(500).json({
        error: 'Payment processing error',
        message: 'Failed to process payment data securely'
      });
    }
  }
}

export default SecurityMiddleware;
