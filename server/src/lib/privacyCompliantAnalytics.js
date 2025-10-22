// Privacy-compliant analytics and GDPR compliance
const mixpanelService = require('./mixpanelService');
const logger = require('./logger');

class PrivacyCompliantAnalytics {
  constructor() {
    this.consentStorage = new Map();
    this.dataRetentionDays = 365; // 1 year default
    this.anonymizationEnabled = true;
  }
  
  // Check user consent
  hasConsent(userId) {
    const consent = this.consentStorage.get(userId);
    return consent && consent.analytics === true && !this.isConsentExpired(consent);
  }
  
  // Record user consent
  recordConsent(userId, consentData) {
    const consent = {
      userId,
      analytics: consentData.analytics || false,
      marketing: consentData.marketing || false,
      personalization: consentData.personalization || false,
      timestamp: new Date().toISOString(),
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent
    };
    
    this.consentStorage.set(userId, consent);
    
    logger.info('User consent recorded', {
      userId,
      consent,
      timestamp: new Date().toISOString()
    });
    
    return consent;
  }
  
  // Check if consent is expired
  isConsentExpired(consent) {
    const consentDate = new Date(consent.timestamp);
    const expiryDate = new Date(consentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    return new Date() > expiryDate;
  }
  
  // Track event with privacy compliance
  trackEvent(userId, eventName, properties = {}) {
    if (!this.hasConsent(userId)) {
      logger.debug('Event tracking skipped - no consent', {
        userId,
        eventName
      });
      return false;
    }
    
    // Anonymize sensitive data
    const anonymizedProperties = this.anonymizeData(properties);
    
    mixpanelService.trackUserEvent(userId, eventName, anonymizedProperties);
    
    logger.debug('Privacy-compliant event tracked', {
      userId,
      eventName,
      anonymized: this.anonymizationEnabled
    });
    
    return true;
  }
  
  // Anonymize sensitive data
  anonymizeData(data) {
    if (!this.anonymizationEnabled) {
      return data;
    }
    
    const anonymized = { ...data };
    
    // Remove or hash sensitive fields
    const sensitiveFields = [
      'email', 'phone', 'address', 'creditCard', 'ssn', 'passport',
      'aadhaar', 'pan', 'bankAccount', 'ipAddress'
    ];
    
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.hashValue(anonymized[field]);
      }
    });
    
    // Remove nested sensitive data
    Object.keys(anonymized).forEach(key => {
      if (typeof anonymized[key] === 'object' && anonymized[key] !== null) {
        anonymized[key] = this.anonymizeData(anonymized[key]);
      }
    });
    
    return anonymized;
  }
  
  // Hash sensitive values
  hashValue(value) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(value)).digest('hex').substring(0, 8);
  }
  
  // Data export for GDPR compliance
  exportUserData(userId) {
    if (!this.hasConsent(userId)) {
      throw new Error('No consent for data export');
    }
    
    const userData = {
      userId,
      consent: this.consentStorage.get(userId),
      exportedAt: new Date().toISOString(),
      dataTypes: [
        'analytics_events',
        'user_properties',
        'session_data',
        'consent_records'
      ]
    };
    
    logger.info('User data export requested', {
      userId,
      exportedAt: userData.exportedAt
    });
    
    return userData;
  }
  
  // Data deletion for GDPR compliance
  deleteUserData(userId) {
    // Remove from consent storage
    this.consentStorage.delete(userId);
    
    // Request data deletion from Mixpanel
    // Note: This would typically require calling Mixpanel's API
    logger.info('User data deletion requested', {
      userId,
      deletedAt: new Date().toISOString()
    });
    
    return {
      userId,
      deletedAt: new Date().toISOString(),
      dataTypes: [
        'analytics_events',
        'user_properties',
        'session_data',
        'consent_records'
      ]
    };
  }
  
  // Data retention cleanup
  cleanupExpiredData() {
    const cutoffDate = new Date(Date.now() - (this.dataRetentionDays * 24 * 60 * 60 * 1000));
    let cleanedCount = 0;
    
    for (const [userId, consent] of this.consentStorage.entries()) {
      if (new Date(consent.timestamp) < cutoffDate) {
        this.consentStorage.delete(userId);
        cleanedCount++;
      }
    }
    
    logger.info('Data retention cleanup completed', {
      cleanedCount,
      cutoffDate: cutoffDate.toISOString()
    });
    
    return cleanedCount;
  }
  
  // Privacy-compliant analytics middleware
  createPrivacyMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const consent = req.headers['x-analytics-consent'];
      
      if (userId) {
        // Check consent
        if (consent === 'true') {
          req.analyticsConsent = true;
        } else if (consent === 'false') {
          req.analyticsConsent = false;
        } else {
          req.analyticsConsent = this.hasConsent(userId);
        }
        
        // Add privacy headers
        res.setHeader('X-Analytics-Consent', req.analyticsConsent ? 'true' : 'false');
        res.setHeader('X-Data-Retention', `${this.dataRetentionDays} days`);
      }
      
      next();
    };
  }
  
  // Create consent management middleware
  createConsentMiddleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      
      if (userId && req.method === 'POST' && req.path.includes('/consent')) {
        const consentData = {
          ...req.body,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        const consent = this.recordConsent(userId, consentData);
        
        res.json({
          success: true,
          consent,
          message: 'Consent recorded successfully'
        });
        
        return;
      }
      
      next();
    };
  }
  
  // Get privacy statistics
  getPrivacyStats() {
    const totalUsers = this.consentStorage.size;
    const consentedUsers = Array.from(this.consentStorage.values())
      .filter(consent => consent.analytics === true).length;
    
    return {
      totalUsers,
      consentedUsers,
      consentRate: totalUsers > 0 ? consentedUsers / totalUsers : 0,
      dataRetentionDays: this.dataRetentionDays,
      anonymizationEnabled: this.anonymizationEnabled,
      lastCleanup: new Date().toISOString()
    };
  }
}

// Create singleton instance
const privacyCompliantAnalytics = new PrivacyCompliantAnalytics();

module.exports = privacyCompliantAnalytics;
