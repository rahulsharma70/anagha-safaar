// Health check routes
const express = require('express');
const router = express.Router();
const healthCheckService = require('../lib/healthCheck');
const logger = require('../lib/logger');

// Basic health check endpoint
router.get('/', async (req, res) => {
  try {
    const health = healthCheckService.getBasicHealth();
    
    logger.info('Basic health check requested', {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed', {
      requestId: req.requestId,
      error: error.message
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const health = await healthCheckService.runChecks();
    
    logger.info('Detailed health check requested', {
      requestId: req.requestId,
      status: health.status,
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Set appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed', {
      requestId: req.requestId,
      error: error.message
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Readiness probe endpoint
router.get('/ready', async (req, res) => {
  try {
    const health = await healthCheckService.runChecks();
    
    // Only return 200 if all critical checks pass
    const criticalChecks = Object.values(health.checks)
      .filter(check => check.critical);
    
    const allCriticalHealthy = criticalChecks.every(check => 
      check.status === 'healthy'
    );
    
    if (allCriticalHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        failedChecks: criticalChecks.filter(check => 
          check.status !== 'healthy'
        ).map(check => check.name)
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', {
      requestId: req.requestId,
      error: error.message
    });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

// Liveness probe endpoint
router.get('/live', (req, res) => {
  // Simple liveness check - just verify the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    logger.info('Metrics requested', {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics request failed', {
      requestId: req.requestId,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to retrieve metrics'
    });
  }
});

// Custom health check endpoint
router.post('/custom', async (req, res) => {
  try {
    const { name, checkFunction, options = {} } = req.body;
    
    if (!name || !checkFunction) {
      return res.status(400).json({
        error: 'Name and checkFunction are required'
      });
    }
    
    // Add custom check
    healthCheckService.addCheck(name, eval(`(${checkFunction})`), options);
    
    logger.info('Custom health check added', {
      requestId: req.requestId,
      name,
      critical: options.critical || false
    });
    
    res.json({
      message: 'Custom health check added successfully',
      name,
      options
    });
  } catch (error) {
    logger.error('Custom health check addition failed', {
      requestId: req.requestId,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to add custom health check'
    });
  }
});

module.exports = router;
