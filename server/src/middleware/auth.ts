import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../app';
import { logger } from '../lib/logger';

// =============================================================================
// 1. INTERFACES
// =============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    profile?: any;
  };
}

interface JWTPayload {
  sub: string;
  email: string;
  role?: string;
  iat: number;
  exp: number;
}

// =============================================================================
// 2. AUTHENTICATION MIDDLEWARE
// =============================================================================

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        code: 'SERVER_ERROR'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        first_name,
        last_name,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      logger.warn('User not found during authentication', { userId: decoded.sub, error });
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user is active
    if (user.role === 'banned') {
      logger.warn('Banned user attempted access', { userId: user.id });
      return res.status(403).json({
        success: false,
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user
    };

    logger.debug('User authenticated', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', { error: error.message });
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    logger.error('Authentication error', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// =============================================================================
// 3. ROLE-BASED AUTHORIZATION MIDDLEWARE
// =============================================================================

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        url: req.url,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles
      });
    }

    next();
  };
};

// =============================================================================
// 4. ADMIN ONLY MIDDLEWARE
// =============================================================================

export const requireAdmin = requireRole(['admin', 'super_admin']);

// =============================================================================
// 5. OPTIONAL AUTHENTICATION MIDDLEWARE
// =============================================================================

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    const { data: user } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        first_name,
        last_name,
        phone,
        avatar_url
      `)
      .eq('id', decoded.sub)
      .single();

    if (user && user.role !== 'banned') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    logger.debug('Optional auth failed, continuing without auth', { error: error.message });
    next();
  }
};

// =============================================================================
// 6. RESOURCE OWNERSHIP MIDDLEWARE
// =============================================================================

export const requireOwnership = (resourceType: string, idParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    try {
      const resourceId = req.params[idParam];
      
      // Check if user owns the resource
      const { data: resource, error } = await supabase
        .from(resourceType)
        .select('user_id')
        .eq('id', resourceId)
        .single();

      if (error || !resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resource.user_id !== req.user.id) {
        logger.warn('Unauthorized resource access attempt', {
          userId: req.user.id,
          resourceId,
          resourceType,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_ERROR'
      });
    }
  };
};

// =============================================================================
// 7. API KEY MIDDLEWARE
// =============================================================================

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.error('API_KEY not configured');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      code: 'SERVER_ERROR'
    });
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', {
      providedKey: apiKey ? '***' + apiKey.slice(-4) : 'none',
      ip: req.ip,
      url: req.url,
      method: req.method
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// =============================================================================
// 8. RATE LIMITING BY USER
// =============================================================================

export const userRateLimit = (windowMs: number, max: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated users
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [id, data] of userRequests.entries()) {
      if (data.resetTime < windowStart) {
        userRequests.delete(id);
      }
    }

    // Get or create entry for this user
    let data = userRequests.get(userId);
    if (!data || data.resetTime < windowStart) {
      data = { count: 0, resetTime: now + windowMs };
      userRequests.set(userId, data);
    }

    // Check if limit exceeded
    if (data.count >= max) {
      logger.warn('User rate limit exceeded', {
        userId,
        count: data.count,
        max,
        windowMs,
        url: req.url,
        method: req.method
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }

    // Increment counter
    data.count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count));
    res.setHeader('X-RateLimit-Reset', new Date(data.resetTime).toISOString());

    next();
  };
};

// =============================================================================
// 9. TOKEN REFRESH MIDDLEWARE
// =============================================================================

export const refreshTokenMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.headers['x-refresh-token'] as string;
    
    if (!refreshToken) {
      return next(); // No refresh token provided
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(refreshToken, jwtSecret) as JWTPayload;
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Set new token in response header
    res.setHeader('X-New-Access-Token', newAccessToken);

    logger.debug('Access token refreshed', { userId: decoded.sub });

    next();
  } catch (error) {
    logger.debug('Token refresh failed', { error: error.message });
    next(); // Continue even if refresh fails
  }
};

// =============================================================================
// 10. SESSION VALIDATION MIDDLEWARE
// =============================================================================

export const validateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next();
  }

  try {
    // Check if user session is still valid in Supabase
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('id, expires_at')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      logger.warn('Invalid session detected', { userId: req.user.id });
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    next();
  } catch (error) {
    logger.error('Session validation error', error);
    return res.status(500).json({
      success: false,
      error: 'Session validation failed',
      code: 'SESSION_ERROR'
    });
  }
};
