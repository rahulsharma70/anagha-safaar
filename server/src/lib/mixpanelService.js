// Mixpanel analytics service for comprehensive usage tracking
const Mixpanel = require('mixpanel');
const logger = require('./logger');

class MixpanelService {
  constructor() {
    this.mixpanel = null;
    this.isInitialized = false;
    this.config = {
      token: process.env.MIXPANEL_TOKEN,
      debug: process.env.NODE_ENV === 'development',
      batch: true,
      batch_size: 50,
      flush_interval: 10000 // 10 seconds
    };
    
    this.eventQueue = [];
    this.userProperties = new Map();
    this.sessionData = new Map();
  }
  
  // Initialize Mixpanel
  initialize() {
    if (!this.config.token) {
      logger.warn('Mixpanel token not configured, analytics disabled');
      return false;
    }
    
    try {
      this.mixpanel = Mixpanel.init(this.config.token, {
        debug: this.config.debug,
        batch: this.config.batch,
        batch_size: this.config.batch_size,
        flush_interval: this.config.flush_interval
      });
      
      this.isInitialized = true;
      
      logger.info('Mixpanel initialized successfully', {
        debug: this.config.debug,
        batch: this.config.batch,
        batch_size: this.config.batch_size
      });
      
      return true;
    } catch (error) {
      logger.error('Mixpanel initialization failed', { error: error.message });
      return false;
    }
  }
  
  // Track event
  track(eventName, properties = {}, userId = null) {
    if (!this.isInitialized) {
      logger.debug('Mixpanel not initialized, queuing event', { eventName, properties });
      this.eventQueue.push({ eventName, properties, userId, timestamp: new Date() });
      return;
    }
    
    try {
      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        service: 'travel-booking-api'
      };
      
      if (userId) {
        this.mixpanel.track(eventName, eventData, { distinct_id: userId });
      } else {
        this.mixpanel.track(eventName, eventData);
      }
      
      logger.debug('Event tracked to Mixpanel', { eventName, userId, properties: eventData });
    } catch (error) {
      logger.error('Failed to track event to Mixpanel', { 
        eventName, 
        userId, 
        error: error.message 
      });
    }
  }
  
  // Track user event
  trackUserEvent(userId, eventName, properties = {}) {
    this.track(eventName, {
      ...properties,
      user_id: userId
    }, userId);
  }
  
  // Set user properties
  setUserProperties(userId, properties) {
    if (!this.isInitialized) {
      logger.debug('Mixpanel not initialized, storing user properties locally', { userId, properties });
      this.userProperties.set(userId, { ...this.userProperties.get(userId), ...properties });
      return;
    }
    
    try {
      this.mixpanel.people.set(userId, {
        ...properties,
        last_seen: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      
      logger.debug('User properties set in Mixpanel', { userId, properties });
    } catch (error) {
      logger.error('Failed to set user properties in Mixpanel', { 
        userId, 
        properties, 
        error: error.message 
      });
    }
  }
  
  // Increment user property
  incrementUserProperty(userId, property, value = 1) {
    if (!this.isInitialized) {
      logger.debug('Mixpanel not initialized, incrementing property locally', { userId, property, value });
      return;
    }
    
    try {
      this.mixpanel.people.increment(userId, property, value);
      logger.debug('User property incremented in Mixpanel', { userId, property, value });
    } catch (error) {
      logger.error('Failed to increment user property in Mixpanel', { 
        userId, 
        property, 
        value, 
        error: error.message 
      });
    }
  }
  
  // Track page view
  trackPageView(userId, page, properties = {}) {
    this.trackUserEvent(userId, 'Page View', {
      page,
      url: properties.url,
      referrer: properties.referrer,
      user_agent: properties.userAgent,
      ...properties
    });
  }
  
  // Track API usage
  trackApiUsage(userId, endpoint, method, duration, statusCode, properties = {}) {
    this.trackUserEvent(userId, 'API Usage', {
      endpoint,
      method,
      duration,
      status_code: statusCode,
      success: statusCode < 400,
      ...properties
    });
  }
  
  // Track search events
  trackSearch(userId, searchType, query, resultsCount, filters = {}) {
    this.trackUserEvent(userId, 'Search', {
      search_type: searchType,
      query,
      results_count: resultsCount,
      filters,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track booking events
  trackBooking(userId, eventType, bookingData) {
    this.trackUserEvent(userId, 'Booking Event', {
      event_type: eventType,
      booking_id: bookingData.id,
      item_type: bookingData.itemType,
      item_id: bookingData.itemId,
      amount: bookingData.amount,
      currency: bookingData.currency,
      ...bookingData
    });
  }
  
  // Track payment events
  trackPayment(userId, eventType, paymentData) {
    this.trackUserEvent(userId, 'Payment Event', {
      event_type: eventType,
      payment_id: paymentData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.method,
      success: paymentData.success,
      ...paymentData
    });
  }
  
  // Track user authentication
  trackAuth(userId, eventType, properties = {}) {
    this.trackUserEvent(userId, 'Authentication', {
      event_type: eventType,
      ...properties
    });
  }
  
  // Track user registration
  trackRegistration(userId, userData) {
    this.trackUserEvent(userId, 'User Registration', {
      registration_method: userData.method,
      email: userData.email,
      role: userData.role,
      ...userData
    });
    
    // Set initial user properties
    this.setUserProperties(userId, {
      email: userData.email,
      role: userData.role,
      registration_date: new Date().toISOString(),
      registration_method: userData.method
    });
  }
  
  // Track user login
  trackLogin(userId, loginData) {
    this.trackUserEvent(userId, 'User Login', {
      login_method: loginData.method,
      ...loginData
    });
    
    // Update last login
    this.setUserProperties(userId, {
      last_login: new Date().toISOString(),
      login_count: 1 // This will be incremented
    });
    
    this.incrementUserProperty(userId, 'login_count');
  }
  
  // Track user logout
  trackLogout(userId, sessionDuration) {
    this.trackUserEvent(userId, 'User Logout', {
      session_duration: sessionDuration
    });
  }
  
  // Track feature usage
  trackFeatureUsage(userId, featureName, properties = {}) {
    this.trackUserEvent(userId, 'Feature Usage', {
      feature_name: featureName,
      ...properties
    });
    
    // Increment feature usage count
    this.incrementUserProperty(userId, `feature_${featureName}_count`);
  }
  
  // Track error events
  trackError(userId, errorType, errorMessage, context = {}) {
    this.trackUserEvent(userId, 'Error Event', {
      error_type: errorType,
      error_message: errorMessage,
      ...context
    });
    
    // Increment error count
    this.incrementUserProperty(userId, 'error_count');
  }
  
  // Track performance metrics
  trackPerformance(userId, metricName, value, context = {}) {
    this.trackUserEvent(userId, 'Performance Metric', {
      metric_name: metricName,
      value,
      ...context
    });
  }
  
  // Track business events
  trackBusinessEvent(userId, eventName, businessData) {
    this.trackUserEvent(userId, 'Business Event', {
      event_name: eventName,
      ...businessData
    });
  }
  
  // Track session data
  trackSession(userId, sessionData) {
    this.sessionData.set(userId, {
      ...this.sessionData.get(userId),
      ...sessionData,
      last_activity: new Date().toISOString()
    });
  }
  
  // Get user session data
  getUserSession(userId) {
    return this.sessionData.get(userId) || {};
  }
  
  // Track funnel events
  trackFunnel(userId, funnelName, step, properties = {}) {
    this.trackUserEvent(userId, 'Funnel Event', {
      funnel_name: funnelName,
      step,
      ...properties
    });
  }
  
  // Track cohort events
  trackCohort(userId, cohortName, action, properties = {}) {
    this.trackUserEvent(userId, 'Cohort Event', {
      cohort_name: cohortName,
      action,
      ...properties
    });
  }
  
  // Track A/B test events
  trackABTest(userId, testName, variant, action, properties = {}) {
    this.trackUserEvent(userId, 'A/B Test Event', {
      test_name: testName,
      variant,
      action,
      ...properties
    });
  }
  
  // Flush pending events
  flush() {
    if (!this.isInitialized) {
      logger.debug('Mixpanel not initialized, cannot flush events');
      return;
    }
    
    try {
      this.mixpanel.flush();
      logger.debug('Mixpanel events flushed');
    } catch (error) {
      logger.error('Failed to flush Mixpanel events', { error: error.message });
    }
  }
  
  // Process queued events
  processQueuedEvents() {
    if (!this.isInitialized || this.eventQueue.length === 0) {
      return;
    }
    
    logger.info('Processing queued Mixpanel events', { count: this.eventQueue.length });
    
    this.eventQueue.forEach(({ eventName, properties, userId, timestamp }) => {
      this.track(eventName, properties, userId);
    });
    
    this.eventQueue = [];
  }
  
  // Get analytics statistics
  getStats() {
    return {
      initialized: this.isInitialized,
      queuedEvents: this.eventQueue.length,
      userProperties: this.userProperties.size,
      activeSessions: this.sessionData.size,
      config: {
        debug: this.config.debug,
        batch: this.config.batch,
        batch_size: this.config.batch_size
      }
    };
  }
  
  // Create analytics middleware
  createAnalyticsMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const startTime = Date.now();
      
      // Track API request
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        if (userId) {
          this.trackApiUsage(userId, req.path, req.method, duration, res.statusCode, {
            user_agent: req.get('User-Agent'),
            ip: req.ip,
            request_id: req.requestId
          });
        }
      });
      
      next();
    };
  }
}

// Create singleton instance
const mixpanelService = new MixpanelService();

module.exports = mixpanelService;
