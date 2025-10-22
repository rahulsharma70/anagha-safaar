// Enhanced routes with Redis caching and optimized queries
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
// HOTEL ROUTES WITH CACHING
// ==============================================

// Hotel search with caching
router.get('/', 
  createCacheMiddleware(cacheConfigs.hotelSearch),
  asyncHandler(async (req, res) => {
    const params = req.query;
    
    logger.business('hotel_search_requested', {
      requestId: req.requestId,
      params,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchHotels(params);
      
      logger.business('hotel_search_completed', {
        requestId: req.requestId,
        resultCount: result.hotels.length,
        totalCount: result.pagination.total,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Hotels fetched successfully');
    } catch (error) {
      logger.error('Hotel search failed', {
        requestId: req.requestId,
        params,
        error: error.message
      });
      throw error;
    }
  })
);

// Hotel details with caching
router.get('/:id', 
  createCacheMiddleware(cacheConfigs.hotelDetails),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    logger.business('hotel_details_requested', {
      requestId: req.requestId,
      hotelId: id,
      userId: req.user?.id || null
    });
    
    try {
      const hotel = await req.queryService.getItemById('hotels', id);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: 'Hotel not found',
          errorType: 'not_found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      logger.business('hotel_details_completed', {
        requestId: req.requestId,
        hotelId: id,
        hotelName: hotel.name,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, hotel, 'Hotel details fetched successfully');
    } catch (error) {
      logger.error('Hotel details fetch failed', {
        requestId: req.requestId,
        hotelId: id,
        error: error.message
      });
      throw error;
    }
  })
);

// Featured hotels with caching
router.get('/featured/list', 
  createCacheMiddleware(cacheConfigs.featuredItems),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    logger.business('featured_hotels_requested', {
      requestId: req.requestId,
      limit: parseInt(limit),
      userId: req.user?.id || null
    });
    
    try {
      const hotels = await req.queryService.getFeaturedItems('hotels', parseInt(limit));
      
      logger.business('featured_hotels_completed', {
        requestId: req.requestId,
        resultCount: hotels.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, hotels, 'Featured hotels fetched successfully');
    } catch (error) {
      logger.error('Featured hotels fetch failed', {
        requestId: req.requestId,
        error: error.message
      });
      throw error;
    }
  })
);

// Hotel search by location with caching
router.get('/search/location', 
  createCacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => {
      const { city, state, country, radius } = req.query;
      return req.queryService.redisCacheService.generateKey('hotel_location_search', {
        city, state, country, radius
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { city, state, country, radius = 50 } = req.query;
    
    logger.business('hotel_location_search_requested', {
      requestId: req.requestId,
      city, state, country, radius,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.searchHotels({
        city, state, country,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('hotel_location_search_completed', {
        requestId: req.requestId,
        resultCount: result.hotels.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Hotels by location fetched successfully');
    } catch (error) {
      logger.error('Hotel location search failed', {
        requestId: req.requestId,
        city, state, country,
        error: error.message
      });
      throw error;
    }
  })
);

// Full-text search for hotels
router.get('/search/text', 
  createCacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => {
      const { q, city, min_price, max_price } = req.query;
      return req.queryService.redisCacheService.generateKey('hotel_text_search', {
        q, city, min_price, max_price
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { q, city, min_price, max_price } = req.query;
    
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
    
    logger.business('hotel_text_search_requested', {
      requestId: req.requestId,
      query: q,
      city, min_price, max_price,
      userId: req.user?.id || null
    });
    
    try {
      const result = await req.queryService.fullTextSearch('hotels', q, {
        city, min_price, max_price,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      });
      
      logger.business('hotel_text_search_completed', {
        requestId: req.requestId,
        query: q,
        resultCount: result.results.length,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, result, 'Hotel text search completed successfully');
    } catch (error) {
      logger.error('Hotel text search failed', {
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

// Create hotel with cache invalidation
router.post('/', 
  createCacheInvalidationMiddleware(cacheConfigs.hotelSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const hotelData = req.body;
    
    logger.business('hotel_creation_requested', {
      requestId: req.requestId,
      hotelName: hotelData.name,
      userId: req.user?.id || null
    });
    
    try {
      const { data: newHotel, error } = await req.app.locals.supabase
        .from('hotels')
        .insert({
          ...hotelData,
          available_rooms: hotelData.total_rooms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      logger.business('hotel_created', {
        requestId: req.requestId,
        hotelId: newHotel.id,
        hotelName: newHotel.name,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, newHotel, 'Hotel created successfully', 201);
    } catch (error) {
      logger.error('Hotel creation failed', {
        requestId: req.requestId,
        hotelData,
        error: error.message
      });
      throw error;
    }
  })
);

// Update hotel with cache invalidation
router.put('/:id', 
  createCacheInvalidationMiddleware(cacheConfigs.hotelSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.business('hotel_update_requested', {
      requestId: req.requestId,
      hotelId: id,
      userId: req.user?.id || null
    });
    
    try {
      const { data: updatedHotel, error } = await req.app.locals.supabase
        .from('hotels')
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
            error: 'Hotel not found',
            errorType: 'not_found',
            statusCode: 404,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
          });
        }
        throw error;
      }
      
      logger.business('hotel_updated', {
        requestId: req.requestId,
        hotelId: id,
        hotelName: updatedHotel.name,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, updatedHotel, 'Hotel updated successfully');
    } catch (error) {
      logger.error('Hotel update failed', {
        requestId: req.requestId,
        hotelId: id,
        updateData,
        error: error.message
      });
      throw error;
    }
  })
);

// Delete hotel with cache invalidation
router.delete('/:id', 
  createCacheInvalidationMiddleware(cacheConfigs.hotelSearch.invalidatePatterns),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    logger.business('hotel_deletion_requested', {
      requestId: req.requestId,
      hotelId: id,
      userId: req.user?.id || null
    });
    
    try {
      const { error } = await req.app.locals.supabase
        .from('hotels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      logger.business('hotel_deleted', {
        requestId: req.requestId,
        hotelId: id,
        userId: req.user?.id || null
      });
      
      sendSuccess(res, { id }, 'Hotel deleted successfully');
    } catch (error) {
      logger.error('Hotel deletion failed', {
        requestId: req.requestId,
        hotelId: id,
        error: error.message
      });
      throw error;
    }
  })
);

// ==============================================
// PERFORMANCE MONITORING ROUTES
// ==============================================

// Get query performance statistics
router.get('/admin/performance/stats', asyncHandler(async (req, res) => {
  try {
    const stats = req.queryService.getQueryStats();
    const slowQueries = req.queryService.getSlowQueries();
    
    logger.info('Performance stats requested', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, {
      queryStats: stats,
      slowQueries,
      timestamp: new Date().toISOString()
    }, 'Performance statistics fetched successfully');
  } catch (error) {
    logger.error('Performance stats fetch failed', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

// Clear query performance statistics
router.post('/admin/performance/clear', asyncHandler(async (req, res) => {
  try {
    req.queryService.clearQueryStats();
    
    logger.info('Performance stats cleared', {
      requestId: req.requestId,
      userId: req.user?.id || null
    });
    
    sendSuccess(res, { cleared: true }, 'Performance statistics cleared successfully');
  } catch (error) {
    logger.error('Performance stats clear failed', {
      requestId: req.requestId,
      error: error.message
    });
    throw error;
  }
}));

module.exports = router;
