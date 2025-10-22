// Optimized database query service with performance monitoring
const logger = require('./logger');
const redisCacheService = require('./redisCache');

class OptimizedQueryService {
  constructor(supabase) {
    this.supabase = supabase;
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }
  
  // Track query performance
  async trackQueryPerformance(queryName, queryFn, params = {}) {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log query performance
      logger.db(queryName, 'performance', duration, {
        params,
        success: true,
        resultCount: Array.isArray(result) ? result.length : (result?.data?.length || 0)
      });
      
      // Track slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryName,
          duration: `${duration}ms`,
          params,
          threshold: `${this.slowQueryThreshold}ms`
        });
      }
      
      // Update query statistics
      this.updateQueryStats(queryName, duration, true);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Query failed', {
        queryName,
        duration: `${duration}ms`,
        params,
        error: error.message
      });
      
      this.updateQueryStats(queryName, duration, false);
      throw error;
    }
  }
  
  // Update query statistics
  updateQueryStats(queryName, duration, success) {
    if (!this.queryStats.has(queryName)) {
      this.queryStats.set(queryName, {
        count: 0,
        totalDuration: 0,
        successCount: 0,
        failureCount: 0,
        minDuration: Infinity,
        maxDuration: 0
      });
    }
    
    const stats = this.queryStats.get(queryName);
    stats.count++;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
  }
  
  // Optimized hotel search with caching and performance tracking
  async searchHotels(params, useCache = true) {
    const queryName = 'hotel_search';
    const cacheKey = redisCacheService.generateKey('hotel_search', params);
    
    // Try cache first
    if (useCache) {
      const cachedResult = await redisCacheService.get(cacheKey);
      if (cachedResult) {
        logger.info('Hotel search cache hit', { params, cacheKey });
        return cachedResult;
      }
    }
    
    // Execute optimized query
    const result = await this.trackQueryPerformance(queryName, async () => {
      let query = this.supabase
        .from('hotels')
        .select(`
          id, name, slug, description, location_city, location_state, 
          location_country, price_per_night, star_rating, amenities, 
          images, is_featured, available_rooms, total_rooms, created_at
        `, { count: 'exact' });
      
      // Apply filters using optimized indices
      if (params.city) {
        query = query.ilike('location_city', `%${params.city}%`);
      }
      
      if (params.state) {
        query = query.eq('location_state', params.state);
      }
      
      if (params.country) {
        query = query.eq('location_country', params.country);
      }
      
      if (params.min_price) {
        query = query.gte('price_per_night', params.min_price);
      }
      
      if (params.max_price) {
        query = query.lte('price_per_night', params.max_price);
      }
      
      if (params.star_rating) {
        query = query.eq('star_rating', params.star_rating);
      }
      
      if (params.featured === 'true') {
        query = query.eq('is_featured', true);
      }
      
      // Only show hotels with available rooms
      query = query.gt('available_rooms', 0);
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = Math.min(parseInt(params.limit) || 10, 50); // Max 50 per page
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Apply sorting
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        hotels: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    }, params);
    
    // Cache result
    if (useCache && result) {
      await redisCacheService.set(cacheKey, result, 1800); // 30 minutes
    }
    
    return result;
  }
  
  // Optimized tour search with caching
  async searchTours(params, useCache = true) {
    const queryName = 'tour_search';
    const cacheKey = redisCacheService.generateKey('tour_search', params);
    
    if (useCache) {
      const cachedResult = await redisCacheService.get(cacheKey);
      if (cachedResult) {
        logger.info('Tour search cache hit', { params, cacheKey });
        return cachedResult;
      }
    }
    
    const result = await this.trackQueryPerformance(queryName, async () => {
      let query = this.supabase
        .from('tours')
        .select(`
          id, name, slug, description, location_city, location_state, 
          location_country, price_per_person, duration_days, difficulty_level, 
          tour_type, highlights, images, is_featured, created_at
        `, { count: 'exact' });
      
      // Apply filters using optimized indices
      if (params.city) {
        query = query.ilike('location_city', `%${params.city}%`);
      }
      
      if (params.state) {
        query = query.eq('location_state', params.state);
      }
      
      if (params.country) {
        query = query.eq('location_country', params.country);
      }
      
      if (params.min_price) {
        query = query.gte('price_per_person', params.min_price);
      }
      
      if (params.max_price) {
        query = query.lte('price_per_person', params.max_price);
      }
      
      if (params.duration) {
        query = query.eq('duration_days', params.duration);
      }
      
      if (params.difficulty) {
        query = query.eq('difficulty_level', params.difficulty);
      }
      
      if (params.tour_type) {
        query = query.eq('tour_type', params.tour_type);
      }
      
      if (params.featured === 'true') {
        query = query.eq('is_featured', true);
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = Math.min(parseInt(params.limit) || 10, 50);
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Apply sorting
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        tours: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    }, params);
    
    if (useCache && result) {
      await redisCacheService.set(cacheKey, result, 3600); // 1 hour
    }
    
    return result;
  }
  
  // Optimized flight search with caching
  async searchFlights(params, useCache = true) {
    const queryName = 'flight_search';
    const cacheKey = redisCacheService.generateKey('flight_search', params);
    
    if (useCache) {
      const cachedResult = await redisCacheService.get(cacheKey);
      if (cachedResult) {
        logger.info('Flight search cache hit', { params, cacheKey });
        return cachedResult;
      }
    }
    
    const result = await this.trackQueryPerformance(queryName, async () => {
      let query = this.supabase
        .from('flights')
        .select(`
          id, airline_name, airline_code, flight_number, 
          origin_airport_code, origin_airport_name, origin_city,
          destination_airport_code, destination_airport_name, destination_city,
          departure_date, arrival_date, departure_time, arrival_time,
          price, currency, class, is_featured, created_at
        `, { count: 'exact' });
      
      // Apply filters using optimized indices
      if (params.origin) {
        query = query.eq('origin_airport_code', params.origin);
      }
      
      if (params.destination) {
        query = query.eq('destination_airport_code', params.destination);
      }
      
      if (params.departure_date) {
        query = query.gte('departure_date', params.departure_date);
      }
      
      if (params.return_date) {
        query = query.lte('arrival_date', params.return_date);
      }
      
      if (params.min_price) {
        query = query.gte('price', params.min_price);
      }
      
      if (params.max_price) {
        query = query.lte('price', params.max_price);
      }
      
      if (params.airline) {
        query = query.eq('airline_code', params.airline);
      }
      
      if (params.class) {
        query = query.eq('class', params.class);
      }
      
      if (params.featured === 'true') {
        query = query.eq('is_featured', true);
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = Math.min(parseInt(params.limit) || 10, 50);
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Apply sorting
      const sortBy = params.sort_by || 'price';
      const sortOrder = params.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        flights: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    }, params);
    
    if (useCache && result) {
      await redisCacheService.set(cacheKey, result, 900); // 15 minutes
    }
    
    return result;
  }
  
  // Optimized single item fetch
  async getItemById(table, id, fields = '*') {
    const queryName = `${table}_get_by_id`;
    const cacheKey = redisCacheService.generateKey(`${table}_details`, { id });
    
    // Try cache first
    const cachedResult = await redisCacheService.get(cacheKey);
    if (cachedResult) {
      logger.info(`${table} details cache hit`, { id, cacheKey });
      return cachedResult;
    }
    
    const result = await this.trackQueryPerformance(queryName, async () => {
      const { data, error } = await this.supabase
        .from(table)
        .select(fields)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }
      
      return data;
    }, { id });
    
    // Cache result
    if (result) {
      await redisCacheService.set(cacheKey, result, 7200); // 2 hours
    }
    
    return result;
  }
  
  // Optimized featured items fetch
  async getFeaturedItems(type, limit = 10) {
    const queryName = `featured_${type}`;
    const cacheKey = redisCacheService.generateKey('featured', { type, limit });
    
    const cachedResult = await redisCacheService.get(cacheKey);
    if (cachedResult) {
      logger.info(`Featured ${type} cache hit`, { limit, cacheKey });
      return cachedResult;
    }
    
    const result = await this.trackQueryPerformance(queryName, async () => {
      const { data, error } = await this.supabase
        .from(type)
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }, { type, limit });
    
    await redisCacheService.set(cacheKey, result, 1800); // 30 minutes
    return result;
  }
  
  // Full-text search with optimization
  async fullTextSearch(table, searchTerm, params = {}) {
    const queryName = `${table}_fulltext_search`;
    const cacheKey = redisCacheService.generateKey(`${table}_search`, { 
      term: searchTerm, 
      ...params 
    });
    
    const cachedResult = await redisCacheService.get(cacheKey);
    if (cachedResult) {
      logger.info(`${table} fulltext search cache hit`, { searchTerm, cacheKey });
      return cachedResult;
    }
    
    const result = await this.trackQueryPerformance(queryName, async () => {
      let query = this.supabase
        .from(table)
        .select('*', { count: 'exact' })
        .textSearch('fts_vector', searchTerm);
      
      // Apply additional filters
      if (params.city) {
        query = query.ilike('location_city', `%${params.city}%`);
      }
      
      if (params.min_price) {
        const priceField = table === 'hotels' ? 'price_per_night' : 'price_per_person';
        query = query.gte(priceField, params.min_price);
      }
      
      if (params.max_price) {
        const priceField = table === 'hotels' ? 'price_per_night' : 'price_per_person';
        query = query.lte(priceField, params.max_price);
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = Math.min(parseInt(params.limit) || 10, 50);
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        results: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    }, { searchTerm, ...params });
    
    await redisCacheService.set(cacheKey, result, 1800); // 30 minutes
    return result;
  }
  
  // Get query performance statistics
  getQueryStats() {
    const stats = {};
    
    for (const [queryName, data] of this.queryStats.entries()) {
      stats[queryName] = {
        ...data,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        successRate: data.count > 0 ? (data.successCount / data.count) * 100 : 0
      };
    }
    
    return stats;
  }
  
  // Clear query statistics
  clearQueryStats() {
    this.queryStats.clear();
    logger.info('Query statistics cleared');
  }
  
  // Get slow queries
  getSlowQueries(threshold = this.slowQueryThreshold) {
    const slowQueries = [];
    
    for (const [queryName, data] of this.queryStats.entries()) {
      if (data.avgDuration > threshold) {
        slowQueries.push({
          queryName,
          avgDuration: data.avgDuration,
          count: data.count,
          successRate: (data.successCount / data.count) * 100
        });
      }
    }
    
    return slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);
  }
}

module.exports = OptimizedQueryService;
