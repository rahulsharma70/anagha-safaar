// Enhanced flight routes with Redis caching and optimized queries
const express = require('express');
const router = express.Router();
const { createCacheMiddleware, createCacheInvalidationMiddleware, cacheConfigs } = require('../lib/cachingMiddleware');
const OptimizedQueryService = require('../lib/optimizedQueryService');
const { asyncHandler, sendSuccess, sendError } = require('../lib/errorHandlers');
const logger = require('../lib/logger');

// Initialize optimized query service
let optimizedQueryService;

// Middleware to initialize query service
const initQueryService = (req, res, next) => {
  if (!optimizedQueryService) {
    optimizedQueryService = new OptimizedQueryService(req.app.locals.supabase);
  }
  req.queryService = optimizedQueryService;
  next();
};

// Apply middleware
router.use(initQueryService);

// ==============================================
// FLIGHT ROUTES WITH CACHING
// ==============================================

// Flight search with caching
router.get('/', 
  createCacheMiddleware(cacheConfigs.flightSearch),
  asyncHandler(async (req, res) => {
    const params = req.query;
    
    logger.business('flight_search_requested', {
      requestId: req.requestId,
      params,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchFlights(params);
      
      logger.business('flight_search_completed', {
        requestId: req.requestId,
        resultCount: result.flights.length,
        totalCount: result.pagination.total,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Flights fetched successfully');
    } catch (error) {
      logger.error('Flight search failed', {
        requestId: req.requestId,
        params,
        error: error.message
      });
      throw error;
    }
  })
);

// Flight details with caching
router.get('/:id', 
  createCacheMiddleware({
    ttl: 3600,
    keyGenerator: (req) => {
      const { id } = req.params;
      return req.queryService.redisCacheService.generateKey('flight_details', { id });
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    logger.business('flight_details_requested', {
      requestId: req.requestId,
      flightId: id,
      userId: req.user?.id || null
    });
    
    try {
      const flight = await req.queryService.getItemById('flights', id);
      
      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Flight not found',
          errorType: 'not_found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      logger.business('flight_details_completed', {
        requestId: req.requestId,
        flightId: id,
        flightNumber: flight.flight_number,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, flight, 'Flight details fetched successfully');
    } catch (error) {
      logger.error('Flight details fetch failed', {
        requestId: req.requestId,
        flightId: id,
        error: error.message
      });
      throw error;
    }
  })
);

// Featured flights with caching
router.get('/featured/list', 
  createCacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => {
      const { limit = 10 } = req.query;
      return req.queryService.redisCacheService.generateKey('featured_flights', { limit });
    }
  }),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    logger.business('featured_flights_requested', {
      requestId: req.requestId,
      limit: parseInt(limit),
      userId: req.user?.id || null
    });
    
    try {
      const flights = await req.queryService.getFeaturedItems('flights', parseInt(limit));
      
      logger.business('featured_flights_completed', {
        requestId: req.requestId,
        resultCount: flights.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, flights, 'Featured flights fetched successfully');
    } catch (error) {
      logger.error('Featured flights fetch failed', {
        requestId: req.requestId,
        error: error.message
      });
      throw error;
    }
  })
);

// Flight search by route with caching
router.get('/search/route', 
  createCacheMiddleware({
    ttl: 900, // 15 minutes for route searches
    keyGenerator: (req) => {
      const { origin, destination, departure_date, return_date, passengers } = req.query;
      return req.queryService.redisCacheService.generateKey('flight_route_search', {
        origin, destination, departure_date, return_date, passengers
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { origin, destination, departure_date, return_date, passengers = 1 } = req.query;
    
    if (!origin || !destination || !departure_date) {
      return res.status(400).json({
        success: false,
        error: 'Origin, destination, and departure date are required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    logger.business('flight_route_search_requested', {
      requestId: req.requestId,
      origin, destination, departure_date, return_date, passengers,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchFlights({
        origin, destination, departure_date, return_date,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('flight_route_search_completed', {
        requestId: req.requestId,
        resultCount: result.flights.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Flights by route fetched successfully');
    } catch (error) {
      logger.error('Flight route search failed', {
        requestId: req.requestId,
        origin, destination, departure_date,
        error: error.message
      });
      throw error;
    }
  })
);

// Flight search by price range with caching
router.get('/search/price', 
  createCacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => {
      const { min_price, max_price, origin, destination } = req.query;
      return req.queryService.redisCacheService.generateKey('flight_price_search', {
        min_price, max_price, origin, destination
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { min_price, max_price, origin, destination } = req.query;
    
    if (!min_price || !max_price) {
      return res.status(400).json({
        success: false,
        error: 'Min price and max price are required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    logger.business('flight_price_search_requested', {
      requestId: req.requestId,
      min_price, max_price, origin, destination,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchFlights({
        min_price, max_price, origin, destination,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('flight_price_search_completed', {
        requestId: req.requestId,
        resultCount: result.flights.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Flights by price range fetched successfully');
    } catch (error) {
      logger.error('Flight price search failed', {
        requestId: req.requestId,
        min_price, max_price,
        error: error.message
      });
      throw error;
    }
  })
);

// Flight search by airline with caching
router.get('/search/airline', 
  createCacheMiddleware({
    ttl: 3600, // 1 hour for airline searches
    keyGenerator: (req) => {
      const { airline, origin, destination } = req.query;
      return req.queryService.redisCacheService.generateKey('flight_airline_search', {
        airline, origin, destination
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { airline, origin, destination } = req.query;
    
    if (!airline) {
      return res.status(400).json({
        success: false,
        error: 'Airline is required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    logger.business('flight_airline_search_requested', {
      requestId: req.requestId,
      airline, origin, destination,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchFlights({
        airline, origin, destination,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('flight_airline_search_completed', {
        requestId: req.requestId,
        resultCount: result.flights.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Flights by airline fetched successfully');
    } catch (error) {
      logger.error('Flight airline search failed', {
        requestId: req.requestId,
        airline,
        error: error.message
      });
      throw error;
    }
  })
);

// Full-text search for flights
router.get('/search/text', 
  createCacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => {
      const { q, origin, destination, min_price, max_price } = req.query;
      return req.queryService.redisCacheService.generateKey('flight_text_search', {
        q, origin, destination, min_price, max_price
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { q, origin, destination, min_price, max_price } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        errorType: 'validation_error',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    logger.business('flight_text_search_requested', {
      requestId: req.requestId,
      query: q,
      origin, destination, min_price, max_price,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.fullTextSearch('flights', q, {
        origin, destination, min_price, max_price,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('flight_text_search_completed', {
        requestId: req.requestId,
        query: q,
        resultCount: result.results.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Flight text search completed successfully');
    } catch (error) {
      logger.error('Flight text search failed', {
        requestId: req.requestId,
        query: q,
        error: error.message
      });
      throw error;
    }
  })
);

// ==============================================
// ADMIN ROUTES WITH CACHE INVALIDATION
// ==============================================

// Create flight with cache invalidation
router.post('/', 
  createCacheInvalidationMiddleware(cacheConfigs.flightSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const flightData = req.body;
    
    logger.business('flight_creation_requested', {
      requestId: req.requestId,
      flightNumber: flightData.flight_number,
      userId: req.user?.id || null
    });
    
    try {
      const { data: newFlight, error } = await req.app.locals.supabase
        .from('flights')
        .insert({
          ...flightData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      logger.business('flight_created', {
        requestId: req.requestId,
        flightId: newFlight.id,
        flightNumber: newFlight.flight_number,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, newFlight, 'Flight created successfully', 201);
    } catch (error) {
      logger.error('Flight creation failed', {
        requestId: req.requestId,
        flightData,
        error: error.message
      });
      throw error;
    }
  })
);

// Update flight with cache invalidation
router.put('/:id', 
  createCacheInvalidationMiddleware(cacheConfigs.flightSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.business('flight_update_requested', {
      requestId: req.requestId,
      flightId: id,
      userId: req.user?.id || null
    });
    
    try {
      const { data: updatedFlight, error } = await req.app.locals.supabase
        .from('flights')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Flight not found',
            errorType: 'not_found',
            statusCode: 404,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
          });
        }
        throw error;
      }
      
      logger.business('flight_updated', {
        requestId: req.requestId,
        flightId: id,
        flightNumber: updatedFlight.flight_number,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, updatedFlight, 'Flight updated successfully');
    } catch (error) {
      logger.error('Flight update failed', {
        requestId: req.requestId,
        flightId: id,
        updateData,
        error: error.message
      });
      throw error;
    }
  })
);

// Delete flight with cache invalidation
router.delete('/:id', 
  createCacheInvalidationMiddleware(cacheConfigs.flightSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    logger.business('flight_deletion_requested', {
      requestId: req.requestId,
      flightId: id,
      userId: req.user?.id || null
    });
    
    try {
      const { error } = await req.app.locals.supabase
        .from('flights')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      logger.business('flight_deleted', {
        requestId: req.requestId,
        flightId: id,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, { id }, 'Flight deleted successfully');
    } catch (error) {
      logger.error('Flight deletion failed', {
        requestId: req.requestId,
        flightId: id,
        error: error.message
      });
      throw error;
    }
  })
);

// ==============================================
// PERFORMANCE MONITORING ROUTES
// ==============================================

// Get flight query performance statistics
router.get('/admin/performance/stats', asyncHandler(async (req, res) => {
  try {
    const stats = req.queryService.getQueryStats();
    const slowQueries = req.queryService.getSlowQueries();
    
    logger.info('Flight performance stats requested', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, {
      queryStats: stats,
      slowQueries,
      timestamp: new Date().toISOString()
    }, 'Flight performance statistics fetched successfully');
  } catch (error) {
    logger.error('Flight performance stats fetch failed', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

module.exports = router;
