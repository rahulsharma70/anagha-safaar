// Comprehensive error tracking and analytics middleware
const sentryService = require('./sentryService');
const mixpanelService = require('./mixpanelService');
const logger = require('./logger');

class ErrorTrackingMiddleware {
  constructor() {
    this.errorPatterns = new Map();
    this.errorCounts = new Map();
    this.performanceMetrics = new Map();
  }
  
  // Create error tracking middleware
  createErrorTrackingMiddleware() {
    return (error, req, res, next) => {
      const userId = req.user?.id;
      const requestId = req.requestId;
      const startTime = req.startTime || Date.now();
      const duration = Date.now() - startTime;
      
      // Track error in Sentry
      sentryService.captureError(error, {
        tags: {
          component: 'express_middleware',
          requestId,
          userId: userId || 'anonymous',
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        },
        extra: {
          requestBody: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        },
        user: userId ? {
          id: userId,
          email: req.user?.email,
          role: req.user?.role
        } : null,
        fingerprint: [error.name, req.method, req.url]
      });
      
      // Track error in Mixpanel
      if (userId) {
        mixpanelService.trackError(userId, error.name, error.message, {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          stack: error.stack?.substring(0, 500) // Limit stack trace length
        });
      }
      
      // Track error patterns
      this.trackErrorPattern(error, req);
      
      // Log error details
      logger.error('Request error tracked', {
        requestId,
        userId,
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      });
      
      next(error);
    };
  }
  
  // Create performance tracking middleware
  createPerformanceTrackingMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const requestId = req.requestId;
      const startTime = Date.now();
      
      req.startTime = startTime;
      
      // Track API request in Sentry
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        sentryService.captureApiRequest(req, res, duration);
        
        // Track performance in Mixpanel
        if (userId) {
          mixpanelService.trackPerformance(userId, 'api_response_time', duration, {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            requestId
          });
        }
        
        // Track slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            requestId,
            userId,
            method: req.method,
            url: req.url,
            duration,
            statusCode: res.statusCode
          });
          
          if (userId) {
            mixpanelService.trackPerformance(userId, 'slow_request', duration, {
              endpoint: req.path,
              method: req.method,
              threshold: 1000,
              requestId
            });
          }
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics(req.path, duration, res.statusCode);
      });
      
      next();
    };
  }
  
  // Create analytics middleware
  createAnalyticsMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const requestId = req.requestId;
      
      // Track page views
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        if (userId) {
          mixpanelService.trackPageView(userId, req.path, {
            url: req.url,
            referrer: req.get('Referrer'),
            userAgent: req.get('User-Agent')
          });
        }
      }
      
      // Track API usage
      if (req.path.startsWith('/api/')) {
        const startTime = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          
          if (userId) {
            mixpanelService.trackApiUsage(userId, req.path, req.method, duration, res.statusCode, {
              requestId,
              userAgent: req.get('User-Agent'),
              ip: req.ip
            });
          }
        });
      }
      
      // Track business events based on route
      this.trackBusinessEvents(req, userId);
      
      next();
    };
  }
  
  // Track business events based on route
  trackBusinessEvents(req, userId) {
    if (!userId) return;
    
    const { method, path } = req;
    
    // Track search events
    if (method === 'GET' && path.includes('/search')) {
      const searchType = path.split('/')[2]; // Extract search type from path
      mixpanelService.trackSearch(userId, searchType, req.query.q || '', 0, req.query);
    }
    
    // Track booking events
    if (path.includes('/bookings')) {
      if (method === 'POST') {
        mixpanelService.trackBooking(userId, 'booking_created', req.body);
      } else if (method === 'PUT') {
        mixpanelService.trackBooking(userId, 'booking_updated', req.body);
      } else if (method === 'DELETE') {
        mixpanelService.trackBooking(userId, 'booking_cancelled', { id: req.params.id });
      }
    }
    
    // Track payment events
    if (path.includes('/payments')) {
      if (method === 'POST') {
        mixpanelService.trackPayment(userId, 'payment_initiated', req.body);
      }
    }
    
    // Track authentication events
    if (path.includes('/auth')) {
      if (method === 'POST') {
        if (path.includes('/login')) {
          mixpanelService.trackLogin(userId, { method: 'email' });
        } else if (path.includes('/register')) {
          mixpanelService.trackRegistration(userId, { method: 'email', ...req.body });
        } else if (path.includes('/logout')) {
          mixpanelService.trackLogout(userId, 0); // Session duration would need to be tracked separately
        }
      }
    }
    
    // Track feature usage
    if (path.includes('/ai/itinerary')) {
      mixpanelService.trackFeatureUsage(userId, 'ai_itinerary', { method, path });
    }
  }
  
  // Track error patterns
  trackErrorPattern(error, req) {
    const pattern = `${error.name}:${req.method}:${req.url}`;
    const count = this.errorCounts.get(pattern) || 0;
    this.errorCounts.set(pattern, count + 1);
    
    // Alert on frequent errors
    if (count > 10) {
      logger.warn('Frequent error pattern detected', {
        pattern,
        count: count + 1,
        error: error.message
      });
      
      sentryService.captureMessage(`Frequent error pattern: ${pattern}`, 'warning', {
        tags: {
          component: 'error_pattern_detection',
          pattern,
          count: count + 1
        },
        extra: {
          error: error.message,
          stack: error.stack
        }
      });
    }
  }
  
  // Update performance metrics
  updatePerformanceMetrics(endpoint, duration, statusCode) {
    const key = `${endpoint}:${statusCode}`;
    const metrics = this.performanceMetrics.get(key) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0
    };
    
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    
    this.performanceMetrics.set(key, metrics);
  }
  
  // Get error statistics
  getErrorStats() {
    return {
      errorPatterns: Array.from(this.errorCounts.entries()).map(([pattern, count]) => ({
        pattern,
        count
      })),
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniquePatterns: this.errorCounts.size
    };
  }
  
  // Get performance statistics
  getPerformanceStats() {
    return Array.from(this.performanceMetrics.entries()).map(([key, metrics]) => ({
      endpoint: key,
      ...metrics
    }));
  }
  
  // Create user session tracking middleware
  createSessionTrackingMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      
      if (userId) {
        // Track session data
        mixpanelService.trackSession(userId, {
          last_activity: new Date().toISOString(),
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        });
        
        // Set user context in Sentry
        sentryService.setUser({
          id: userId,
          email: req.user?.email,
          role: req.user?.role
        });
      }
      
      next();
    };
  }
  
  // Create funnel tracking middleware
  createFunnelTrackingMiddleware(funnelName, steps) {
    return (req, res, next) => {
      const userId = req.user?.id;
      
      if (userId && steps.includes(req.path)) {
        const stepIndex = steps.indexOf(req.path);
        mixpanelService.trackFunnel(userId, funnelName, stepIndex + 1, {
          step_name: req.path,
          total_steps: steps.length
        });
      }
      
      next();
    };
  }
  
  // Create A/B test tracking middleware
  createABTestTrackingMiddleware(testName, variants) {
    return (req, res, next) => {
      const userId = req.user?.id;
      
      if (userId) {
        // Simple A/B test assignment based on user ID hash
        const hash = this.hashUserId(userId);
        const variant = variants[hash % variants.length];
        
        req.abTestVariant = variant;
        
        mixpanelService.trackABTest(userId, testName, variant, 'assigned', {
          test_name: testName,
          variant,
          user_id: userId
        });
      }
      
      next();
    };
  }
  
  // Hash user ID for consistent A/B test assignment
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Create privacy-compliant analytics middleware
  createPrivacyCompliantMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const consent = req.headers['x-analytics-consent'];
      
      // Only track if user has given consent
      if (userId && consent === 'true') {
        // Track with privacy compliance
        mixpanelService.trackUserEvent(userId, 'Privacy Compliant Event', {
          consent_given: true,
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    };
  }
  
  // Get comprehensive analytics data
  getAnalyticsData() {
    return {
      sentry: sentryService.getStats(),
      mixpanel: mixpanelService.getStats(),
      errors: this.getErrorStats(),
      performance: this.getPerformanceStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const errorTrackingMiddleware = new ErrorTrackingMiddleware();

module.exports = errorTrackingMiddleware;
