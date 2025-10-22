import { Request, Response, NextFunction } from 'express';
import { supabase } from '../app';
import { logger } from '../lib/logger';

// =============================================================================
// 1. ADMIN MIDDLEWARE
// =============================================================================

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has admin role
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (error || !userRole) {
      logger.warn('Non-admin user attempted to access admin route', {
        userId,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Add admin flag to request
    req.user = {
      ...req.user,
      isAdmin: true,
      role: 'admin'
    };

    logger.info('Admin access granted', {
      userId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in admin middleware', {
      userId: req.user?.id,
      error: error.message,
      path: req.path
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// =============================================================================
// 2. SUPER ADMIN MIDDLEWARE (for system-level operations)
// =============================================================================

export const superAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has super admin role
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single();

    if (error || !userRole) {
      logger.warn('Non-super-admin user attempted to access super admin route', {
        userId,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Super admin access required',
        code: 'SUPER_ADMIN_REQUIRED'
      });
    }

    // Add super admin flag to request
    req.user = {
      ...req.user,
      isAdmin: true,
      isSuperAdmin: true,
      role: 'super_admin'
    };

    logger.info('Super admin access granted', {
      userId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in super admin middleware', {
      userId: req.user?.id,
      error: error.message,
      path: req.path
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// =============================================================================
// 3. ROLE-BASED ACCESS CONTROL MIDDLEWARE
// =============================================================================

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check if user has any of the allowed roles
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', allowedRoles);

      if (error || !userRoles || userRoles.length === 0) {
        logger.warn('User attempted to access restricted route', {
          userId,
          allowedRoles,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Add role information to request
      req.user = {
        ...req.user,
        roles: userRoles.map(ur => ur.role),
        isAdmin: userRoles.some(ur => ur.role === 'admin' || ur.role === 'super_admin')
      };

      logger.info('Role-based access granted', {
        userId,
        roles: userRoles.map(ur => ur.role),
        path: req.path,
        method: req.method
      });

      next();

    } catch (error) {
      logger.error('Error in role-based middleware', {
        userId: req.user?.id,
        error: error.message,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// =============================================================================
// 4. CONTENT MODERATION MIDDLEWARE
// =============================================================================

export const contentModerationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has content moderation permissions
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin', 'content_moderator'])
      .single();

    if (error || !userRole) {
      logger.warn('User attempted to access content moderation route', {
        userId,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Content moderation access required',
        code: 'CONTENT_MODERATION_REQUIRED'
      });
    }

    // Add moderation flag to request
    req.user = {
      ...req.user,
      canModerateContent: true,
      role: userRole.role
    };

    logger.info('Content moderation access granted', {
      userId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in content moderation middleware', {
      userId: req.user?.id,
      error: error.message,
      path: req.path
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// =============================================================================
// 5. AUDIT LOGGING MIDDLEWARE
// =============================================================================

export const auditLoggingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response details
  res.send = function(data) {
    const duration = Date.now() - startTime;

    // Log admin actions for audit
    if (req.user?.isAdmin) {
      logger.info('Admin action performed', {
        userId: req.user.id,
        action: `${req.method} ${req.path}`,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    return originalSend.call(this, data);
  };

  next();
};
