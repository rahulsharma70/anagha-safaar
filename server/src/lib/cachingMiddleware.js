// Caching middleware for API endpoints
const redisCacheService = require('./redisCache');
const logger = require('./logger');

// Cache middleware factory
const createCacheMiddleware = (options = {}) => {
  const {
    ttl = 3600, // 1 hour default
    keyGenerator = null,
    skipCache = false,
    cacheCondition = null,
    invalidateOn = []
  } = options;
  
  return async (req, res, next) => {
    // Skip caching if disabled
    if (skipCache || process.env.DISABLE_CACHE === 'true') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      generateDefaultCacheKey(req);
    
    // Check cache condition
    if (cacheCondition && !cacheCondition(req)) {
      return next();
    }
    
    try {
      // Try to get from cache
      const cachedData = await redisCacheService.get(cacheKey);
      
      if (cachedData !== null) {
        logger.info('Cache hit', {
          key: cacheKey,
          method: req.method,
          url: req.url,
          userId: req.user?.id || null
        });
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      logger.debug('Cache miss', {
        key: cacheKey,
        method: req.method,
        url: req.url
      });
      
      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (data.success !== false && res.statusCode < 400) {
          redisCacheService.set(cacheKey, data.data || data, ttl)
            .then(() => {
              logger.debug('Response cached', {
                key: cacheKey,
                statusCode: res.statusCode
              });
            })
            .catch(error => {
              logger.error('Failed to cache response', {
                key: cacheKey,
                error: error.message
              });
            });
        }
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        key: cacheKey,
        error: error.message
      });
      next();
    }
  };
};

// Default cache key generator
const generateDefaultCacheKey = (req) => {
  const { method, url, query, user } = req;
  
  // Include user ID in cache key for user-specific data
  const userId = user?.id || 'anonymous';
  
  // Create deterministic key from request parameters
  const keyData = {
    method: method.toLowerCase(),
    path: url.split('?')[0], // Remove query string from path
    query: query,
    userId: userId
  };
  
  return redisCacheService.generateKey('api', keyData);
};

// Cache invalidation middleware
const createCacheInvalidationMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to invalidate cache after successful operations
    res.json = function(data) {
      // Only invalidate on successful operations
      if (data.success !== false && res.statusCode < 400) {
        // Invalidate cache patterns
        patterns.forEach(async (pattern) => {
          try {
            const keysDeleted = await redisCacheService.delPattern(pattern);
            if (keysDeleted > 0) {
              logger.info('Cache invalidated', {
                pattern,
                keysDeleted,
                method: req.method,
                url: req.url
              });
            }
          } catch (error) {
            logger.error('Cache invalidation failed', {
              pattern,
              error: error.message
            });
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Specific cache configurations for different endpoints
const cacheConfigs = {
  // Hotel search cache
  hotelSearch: {
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => {
      const { city, state, country, min_price, max_price, star_rating, amenities, featured, page, limit } = req.query;
      return redisCacheService.generateKey('hotel_search', {
        city, state, country, min_price, max_price, star_rating, amenities, featured, page, limit
      });
    },
    invalidatePatterns: ['hotel_search:*', 'hotels:*']
  },
  
  // Flight search cache
  flightSearch: {
    ttl: 900, // 15 minutes (flights change frequently)
    keyGenerator: (req) => {
      const { origin, destination, departure_date, return_date, adults, children, infants, class } = req.query;
      return redisCacheService.generateKey('flight_search', {
        origin, destination, departure_date, return_date, adults, children, infants, class
      });
    },
    invalidatePatterns: ['flight_search:*', 'flights:*']
  },
  
  // Tour search cache
  tourSearch: {
    ttl: 3600, // 1 hour
    keyGenerator: (req) => {
      const { city, state, country, min_price, max_price, duration, difficulty, tour_type, featured, page, limit } = req.query;
      return redisCacheService.generateKey('tour_search', {
        city, state, country, min_price, max_price, duration, difficulty, tour_type, featured, page, limit
      });
    },
    invalidatePatterns: ['tour_search:*', 'tours:*']
  },
  
  // Hotel details cache
  hotelDetails: {
    ttl: 7200, // 2 hours
    keyGenerator: (req) => {
      const { id } = req.params;
      return redisCacheService.generateKey('hotel_details', { id });
    },
    invalidatePatterns: [`hotel_details:${req.params.id}`, 'hotels:*']
  },
  
  // Tour details cache
  tourDetails: {
    ttl: 7200, // 2 hours
    keyGenerator: (req) => {
      const { id } = req.params;
      return redisCacheService.generateKey('tour_details', { id });
    },
    invalidatePatterns: [`tour_details:${req.params.id}`, 'tours:*']
  },
  
  // Featured items cache
  featuredItems: {
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => {
      const { type, limit } = req.query;
      return redisCacheService.generateKey('featured', { type, limit });
    },
    invalidatePatterns: ['featured:*']
  },
  
  // Location search cache
  locationSearch: {
    ttl: 86400, // 24 hours (locations don't change often)
    keyGenerator: (req) => {
      const { q, type } = req.query;
      return redisCacheService.generateKey('location_search', { q, type });
    },
    invalidatePatterns: ['location_search:*']
  }
};

// Cache warming utilities
const cacheWarmingService = {
  // Warm hotel search cache
  async warmHotelSearchCache(commonSearches) {
    logger.info('Starting hotel search cache warming', { 
      searchCount: commonSearches.length 
    });
    
    const keys = commonSearches.map(search => 
      redisCacheService.generateKey('hotel_search', search)
    );
    
    const fallbackFn = async (key) => {
      // Extract search parameters from key
      const keyParts = key.split(':').slice(1);
      const searchParams = {};
      
      keyParts.forEach(part => {
        const [param, value] = part.split('|');
        if (value && value !== 'undefined') {
          searchParams[param] = value;
        }
      });
      
      // Execute hotel search with these parameters
      const { supabase } = require('../app');
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .ilike('location_city', `%${searchParams.city || ''}%`)
        .gte('price_per_night', searchParams.min_price || 0)
        .lte('price_per_night', searchParams.max_price || 999999)
        .eq('is_featured', searchParams.featured === 'true')
        .limit(parseInt(searchParams.limit) || 10);
      
      if (error) throw error;
      return data;
    };
    
    return await redisCacheService.warmCache(keys, fallbackFn, 1800);
  },
  
  // Warm flight search cache
  async warmFlightSearchCache(commonRoutes) {
    logger.info('Starting flight search cache warming', { 
      routeCount: commonRoutes.length 
    });
    
    const keys = commonRoutes.map(route => 
      redisCacheService.generateKey('flight_search', route)
    );
    
    const fallbackFn = async (key) => {
      // Extract search parameters from key
      const keyParts = key.split(':').slice(1);
      const searchParams = {};
      
      keyParts.forEach(part => {
        const [param, value] = part.split('|');
        if (value && value !== 'undefined') {
          searchParams[param] = value;
        }
      });
      
      // Execute flight search with these parameters
      const { amadeusService } = require('./amadeusService');
      return await amadeusService.searchFlights(searchParams);
    };
    
    return await redisCacheService.warmCache(keys, fallbackFn, 900);
  }
};

// Cache statistics endpoint
const getCacheStats = async (req, res) => {
  try {
    const stats = await redisCacheService.getStats();
    const health = await redisCacheService.healthCheck();
    
    res.json({
      success: true,
      data: {
        stats,
        health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics'
    });
  }
};

// Cache management endpoints
const clearCache = async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern is required'
      });
    }
    
    const keysDeleted = await redisCacheService.delPattern(pattern);
    
    logger.info('Cache cleared', { 
      pattern, 
      keysDeleted,
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: {
        pattern,
        keysDeleted,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
};

module.exports = {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  cacheConfigs,
  cacheWarmingService,
  getCacheStats,
  clearCache,
  redisCacheService
};
