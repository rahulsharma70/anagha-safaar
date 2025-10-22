// Analytics dashboard and reporting endpoints
const express = require('express');
const router = express.Router();
const sentryService = require('../lib/sentryService');
const mixpanelService = require('../lib/mixpanelService');
const errorTrackingMiddleware = require('../lib/errorTrackingMiddleware');
const { asyncHandler, sendSuccess, sendError } = require('../lib/errorHandlers');
const logger = require('../lib/logger');

// Analytics dashboard routes
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    const analyticsData = errorTrackingMiddleware.getAnalyticsData();
    
    logger.info('Analytics dashboard accessed', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, analyticsData, 'Analytics dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Analytics dashboard error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Error statistics endpoint
router.get('/errors', asyncHandler(async (req, res) => {
  try {
    const errorStats = errorTrackingMiddleware.getErrorStats();
    
    logger.info('Error statistics requested', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, errorStats, 'Error statistics retrieved successfully');
  } catch (error) {
    logger.error('Error statistics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Performance statistics endpoint
router.get('/performance', asyncHandler(async (req, res) => {
  try {
    const performanceStats = errorTrackingMiddleware.getPerformanceStats();
    
    logger.info('Performance statistics requested', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, performanceStats, 'Performance statistics retrieved successfully');
  } catch (error) {
    logger.error('Performance statistics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// User analytics endpoint
router.get('/users/:userId', asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user session data
    const sessionData = mixpanelService.getUserSession(userId);
    
    logger.info('User analytics requested', {
      requestId: req.requestId,
      targetUserId: userId,
      requesterUserId: req.user?.id || null
    });
    
    sendSuccess(res, {
      userId,
      sessionData,
      timestamp: new Date().toISOString()
    }, 'User analytics retrieved successfully');
  } catch (error) {
    logger.error('User analytics error', {
      requestId: req.requestId,
      userId: req.params.userId,
      error: error.message
    });
    throw error;
  }
}));

// Event tracking endpoint
router.post('/events', asyncHandler(async (req, res) => {
  try {
    const { eventName, properties, userId } = req.body;
    
    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    const targetUserId = userId || req.user?.id;
    
    if (targetUserId) {
      mixpanelService.trackUserEvent(targetUserId, eventName, properties);
    } else {
      mixpanelService.track(eventName, properties);
    }
    
    logger.info('Custom event tracked', {
      requestId: req.requestId,
      eventName,
      userId: targetUserId,
      requesterUserId: req.user?.id || null
    });
    
    sendSuccess(res, {
      eventName,
      userId: targetUserId,
      tracked: true,
      timestamp: new Date().toISOString()
    }, 'Event tracked successfully');
  } catch (error) {
    logger.error('Event tracking error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// User properties endpoint
router.post('/users/:userId/properties', asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const properties = req.body;
    
    mixpanelService.setUserProperties(userId, properties);
    
    logger.info('User properties updated', {
      requestId: req.requestId,
      userId,
      properties,
      requesterUserId: req.user?.id || null
    });
    
    sendSuccess(res, {
      userId,
      properties,
      updated: true,
      timestamp: new Date().toISOString()
    }, 'User properties updated successfully');
  } catch (error) {
    logger.error('User properties update error', {
      requestId: req.requestId,
      userId: req.params.userId,
      error: error.message
    });
    throw error;
  }
}));

// Search analytics endpoint
router.get('/search', asyncHandler(async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;
    
    // This would typically query Mixpanel's API for search analytics
    // For now, we'll return a mock response
    const searchAnalytics = {
      totalSearches: 1250,
      uniqueUsers: 450,
      averageResultsPerSearch: 12.5,
      topSearches: [
        { query: 'Mumbai hotels', count: 150 },
        { query: 'Delhi flights', count: 120 },
        { query: 'Goa tours', count: 100 },
        { query: 'Bangalore hotels', count: 90 },
        { query: 'Chennai flights', count: 80 }
      ],
      searchTypes: {
        hotels: 600,
        flights: 400,
        tours: 250
      },
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('Search analytics requested', {
      requestId: req.requestId,
      type,
      startDate,
      endDate,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, searchAnalytics, 'Search analytics retrieved successfully');
  } catch (error) {
    logger.error('Search analytics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Booking analytics endpoint
router.get('/bookings', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Mock booking analytics data
    const bookingAnalytics = {
      totalBookings: 850,
      totalRevenue: 1250000,
      averageBookingValue: 1470,
      bookingTypes: {
        hotels: 500,
        flights: 250,
        tours: 100
      },
      conversionRate: 0.15,
      topDestinations: [
        { destination: 'Mumbai', bookings: 150, revenue: 225000 },
        { destination: 'Delhi', bookings: 120, revenue: 180000 },
        { destination: 'Goa', bookings: 100, revenue: 150000 },
        { destination: 'Bangalore', bookings: 90, revenue: 135000 },
        { destination: 'Chennai', bookings: 80, revenue: 120000 }
      ],
      monthlyTrend: [
        { month: 'Jan', bookings: 70, revenue: 105000 },
        { month: 'Feb', bookings: 80, revenue: 120000 },
        { month: 'Mar', bookings: 90, revenue: 135000 },
        { month: 'Apr', bookings: 85, revenue: 127500 },
        { month: 'May', bookings: 95, revenue: 142500 }
      ],
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('Booking analytics requested', {
      requestId: req.requestId,
      startDate,
      endDate,
      type,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, bookingAnalytics, 'Booking analytics retrieved successfully');
  } catch (error) {
    logger.error('Booking analytics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// User behavior analytics endpoint
router.get('/behavior', asyncHandler(async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    // Mock user behavior analytics
    const behaviorAnalytics = {
      userId: userId || 'all_users',
      totalSessions: 1250,
      averageSessionDuration: 1800, // 30 minutes
      pageViews: 5600,
      bounceRate: 0.35,
      topPages: [
        { page: '/hotels', views: 1200, uniqueVisitors: 800 },
        { page: '/flights', views: 1000, uniqueVisitors: 600 },
        { page: '/tours', views: 800, uniqueVisitors: 500 },
        { page: '/dashboard', views: 600, uniqueVisitors: 400 },
        { page: '/auth', views: 500, uniqueVisitors: 300 }
      ],
      userJourney: [
        { step: 'Landing Page', users: 1000, conversion: 1.0 },
        { step: 'Search', users: 800, conversion: 0.8 },
        { step: 'View Details', users: 400, conversion: 0.5 },
        { step: 'Add to Cart', users: 200, conversion: 0.25 },
        { step: 'Checkout', users: 150, conversion: 0.15 },
        { step: 'Booking Complete', users: 120, conversion: 0.12 }
      ],
      deviceBreakdown: {
        desktop: 0.6,
        mobile: 0.35,
        tablet: 0.05
      },
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('User behavior analytics requested', {
      requestId: req.requestId,
      userId,
      startDate,
      endDate,
      requesterUserId: req.user?.id || null
    });
    
    sendSuccess(res, behaviorAnalytics, 'User behavior analytics retrieved successfully');
  } catch (error) {
    logger.error('User behavior analytics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Revenue analytics endpoint
router.get('/revenue', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, breakdown } = req.query;
    
    // Mock revenue analytics
    const revenueAnalytics = {
      totalRevenue: 2500000,
      monthlyRevenue: 500000,
      dailyRevenue: 16667,
      revenueBreakdown: {
        hotels: 1500000,
        flights: 750000,
        tours: 250000
      },
      paymentMethods: {
        credit_card: 0.6,
        debit_card: 0.25,
        upi: 0.1,
        net_banking: 0.05
      },
      refunds: {
        totalRefunds: 50000,
        refundRate: 0.02,
        averageRefundAmount: 1000
      },
      revenueTrend: [
        { date: '2024-01-01', revenue: 45000 },
        { date: '2024-01-02', revenue: 52000 },
        { date: '2024-01-03', revenue: 48000 },
        { date: '2024-01-04', revenue: 55000 },
        { date: '2024-01-05', revenue: 60000 }
      ],
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('Revenue analytics requested', {
      requestId: req.requestId,
      startDate,
      endDate,
      breakdown,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, revenueAnalytics, 'Revenue analytics retrieved successfully');
  } catch (error) {
    logger.error('Revenue analytics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Performance analytics endpoint
router.get('/performance-metrics', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, metric } = req.query;
    
    // Mock performance analytics
    const performanceAnalytics = {
      averageResponseTime: 250,
      p95ResponseTime: 800,
      p99ResponseTime: 1500,
      errorRate: 0.02,
      uptime: 0.998,
      throughput: 1000, // requests per minute
      slowQueries: 15,
      cacheHitRate: 0.85,
      databaseConnections: 25,
      memoryUsage: 0.75,
      cpuUsage: 0.45,
      metrics: {
        apiResponseTime: {
          average: 250,
          p95: 800,
          p99: 1500
        },
        databaseQueryTime: {
          average: 150,
          p95: 500,
          p99: 1000
        },
        cachePerformance: {
          hitRate: 0.85,
          missRate: 0.15,
          averageHitTime: 10,
          averageMissTime: 200
        }
      },
      dateRange: {
        startDate: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('Performance metrics requested', {
      requestId: req.requestId,
      startDate,
      endDate,
      metric,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, performanceAnalytics, 'Performance metrics retrieved successfully');
  } catch (error) {
    logger.error('Performance metrics error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Analytics export endpoint
router.get('/export', asyncHandler(async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Export type is required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    // Mock export data
    const exportData = {
      type,
      format,
      data: [],
      exportedAt: new Date().toISOString(),
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };
    
    logger.info('Analytics export requested', {
      requestId: req.requestId,
      type,
      format,
      startDate,
      endDate,
      userId: req.user?.id || null
    });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.csv"`);
      // CSV export logic would go here
      res.send('CSV data would be here');
    } else {
      sendSuccess(res, exportData, 'Analytics data exported successfully');
    }
  } catch (error) {
    logger.error('Analytics export error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Analytics health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const sentryStats = sentryService.getStats();
    const mixpanelStats = mixpanelService.getStats();
    
    const health = {
      sentry: {
        status: sentryStats.initialized ? 'healthy' : 'unhealthy',
        ...sentryStats
      },
      mixpanel: {
        status: mixpanelStats.initialized ? 'healthy' : 'unhealthy',
        ...mixpanelStats
      },
      overall: sentryStats.initialized && mixpanelStats.initialized ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    };
    
    logger.info('Analytics health check', {
      requestId: req.requestId,
      health: health.overall,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, health, 'Analytics health check completed');
  } catch (error) {
    logger.error('Analytics health check error', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

module.exports = router;
