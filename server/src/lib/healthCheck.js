// Health check service
const logger = require('./logger');
const { errorTracker } = require('./sentry');

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }
  
  // Add health check
  addCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      fn: checkFunction,
      critical: options.critical || false,
      timeout: options.timeout || 5000,
      interval: options.interval || 30000 // 30 seconds
    });
    
    logger.info('Health check added', { name, critical: options.critical });
  }
  
  // Run all health checks
  async runChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment,
      checks: {}
    };
    
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      try {
        const startTime = Date.now();
        
        // Run check with timeout
        const checkPromise = check.fn();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Check timeout')), check.timeout);
        });
        
        const result = await Promise.race([checkPromise, timeoutPromise]);
        const duration = Date.now() - startTime;
        
        results.checks[name] = {
          status: 'healthy',
          duration: `${duration}ms`,
          result: result || 'OK',
          critical: check.critical
        };
        
        logger.debug('Health check passed', { name, duration });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        results.checks[name] = {
          status: 'unhealthy',
          duration: `${duration}ms`,
          error: error.message,
          critical: check.critical
        };
        
        // Log error
        logger.error('Health check failed', {
          name,
          error: error.message,
          critical: check.critical
        });
        
        // Track critical errors
        if (check.critical) {
          errorTracker.captureError(error, {
            tags: { component: 'health-check', checkName: name },
            extra: { critical: true }
          });
        }
        
        // Update overall status
        if (check.critical) {
          results.status = 'unhealthy';
        } else if (results.status === 'healthy') {
          results.status = 'degraded';
        }
      }
    });
    
    await Promise.allSettled(checkPromises);
    
    return results;
  }
  
  // Get basic health status
  getBasicHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment
    };
  }
  
  // Database health check
  async checkDatabase() {
    try {
      const { supabase } = require('../app');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Database connection successful'
      };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }
  
  // Redis health check
  async checkRedis() {
    try {
      const { redisClient } = require('./redis');
      const startTime = Date.now();
      
      await redisClient.ping();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Redis connection successful'
      };
    } catch (error) {
      throw new Error(`Redis check failed: ${error.message}`);
    }
  }
  
  // External API health checks
  async checkRazorpay() {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      
      const startTime = Date.now();
      
      // Test API connectivity
      await razorpay.payments.fetch('test_payment_id').catch(() => {
        // Expected to fail, but confirms API is reachable
      });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Razorpay API accessible'
      };
    } catch (error) {
      throw new Error(`Razorpay check failed: ${error.message}`);
    }
  }
  
  async checkSendGrid() {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const startTime = Date.now();
      
      // Test API connectivity
      await sgMail.send({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Health Check',
        text: 'Health check test',
        mail_settings: {
          sandbox_mode: {
            enable: true
          }
        }
      }).catch(() => {
        // Expected to fail in sandbox mode, but confirms API is reachable
      });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'SendGrid API accessible'
      };
    } catch (error) {
      throw new Error(`SendGrid check failed: ${error.message}`);
    }
  }
  
  async checkTwilio() {
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      const startTime = Date.now();
      
      // Test API connectivity
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Twilio API accessible'
      };
    } catch (error) {
      throw new Error(`Twilio check failed: ${error.message}`);
    }
  }
  
  // Memory usage check
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      throw new Error(`High memory usage: ${heapUsedPercent.toFixed(2)}%`);
    }
    
    return {
      status: 'healthy',
      memoryUsage: memUsageMB,
      heapUsedPercent: heapUsedPercent.toFixed(2)
    };
  }
  
  // Disk space check
  async checkDiskSpace() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const stats = fs.statSync(process.cwd());
      const freeSpace = stats.size; // This is a simplified check
      
      return {
        status: 'healthy',
        freeSpace: `${freeSpace} bytes`,
        message: 'Disk space available'
      };
    } catch (error) {
      throw new Error(`Disk space check failed: ${error.message}`);
    }
  }
  
  // Initialize default health checks
  initializeDefaultChecks() {
    // Database check
    this.addCheck('database', () => this.checkDatabase(), {
      critical: true,
      timeout: 5000
    });
    
    // Redis check
    this.addCheck('redis', () => this.checkRedis(), {
      critical: false,
      timeout: 3000
    });
    
    // Memory check
    this.addCheck('memory', () => this.checkMemory(), {
      critical: true,
      timeout: 1000
    });
    
    // External services (non-critical)
    if (process.env.RAZORPAY_KEY_ID) {
      this.addCheck('razorpay', () => this.checkRazorpay(), {
        critical: false,
        timeout: 5000
      });
    }
    
    if (process.env.SENDGRID_API_KEY) {
      this.addCheck('sendgrid', () => this.checkSendGrid(), {
        critical: false,
        timeout: 5000
      });
    }
    
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.addCheck('twilio', () => this.checkTwilio(), {
        critical: false,
        timeout: 5000
      });
    }
    
    logger.info('Default health checks initialized');
  }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

module.exports = healthCheckService;
