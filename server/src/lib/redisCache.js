// Redis caching service with comprehensive cache management
const Redis = require('ioredis');
const logger = require('./logger');

class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
    this.cachePrefix = 'travel_booking:';
    
    this.initializeClient();
  }
  
  initializeClient() {
    try {
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        keyPrefix: this.cachePrefix
      });
      
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully');
      });
      
      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis cache connection error', { error: error.message });
      });
      
      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis cache connection closed');
      });
      
    } catch (error) {
      logger.error('Redis cache initialization failed', { error: error.message });
    }
  }
  
  // Generate cache key
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
  
  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set', { key });
      return false;
    }
    
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl: ttl
      });
      
      await this.client.setex(key, ttl, serializedValue);
      
      logger.debug('Cache set successfully', { 
        key, 
        ttl, 
        size: serializedValue.length 
      });
      
      return true;
    } catch (error) {
      logger.error('Cache set failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }
  
  // Get cache value
  async get(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get', { key });
      return null;
    }
    
    try {
      const cachedValue = await this.client.get(key);
      
      if (!cachedValue) {
        logger.debug('Cache miss', { key });
        return null;
      }
      
      const parsedValue = JSON.parse(cachedValue);
      
      // Check if cache is expired
      const now = Date.now();
      const cacheAge = now - parsedValue.timestamp;
      
      if (cacheAge > parsedValue.ttl * 1000) {
        logger.debug('Cache expired', { key, age: cacheAge });
        await this.client.del(key);
        return null;
      }
      
      logger.debug('Cache hit', { 
        key, 
        age: cacheAge,
        ttl: parsedValue.ttl
      });
      
      return parsedValue.data;
    } catch (error) {
      logger.error('Cache get failed', { 
        key, 
        error: error.message 
      });
      return null;
    }
  }
  
  // Delete cache key
  async del(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete', { key });
      return false;
    }
    
    try {
      const result = await this.client.del(key);
      logger.debug('Cache deleted', { key, result });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }
  
  // Delete multiple keys with pattern
  async delPattern(pattern) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache pattern delete', { pattern });
      return 0;
    }
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.client.del(...keys);
      logger.info('Cache pattern deleted', { pattern, keysDeleted: result });
      return result;
    } catch (error) {
      logger.error('Cache pattern delete failed', { 
        pattern, 
        error: error.message 
      });
      return 0;
    }
  }
  
  // Check if key exists
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }
  
  // Get cache statistics
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      logger.error('Cache stats failed', { error: error.message });
      return { connected: false, error: error.message };
    }
  }
  
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }
  
  // Cache with fallback function
  async cache(key, fallbackFn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cachedValue = await this.get(key);
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // Cache miss, execute fallback function
      logger.debug('Cache miss, executing fallback', { key });
      const result = await fallbackFn();
      
      // Store result in cache
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      logger.error('Cache with fallback failed', { 
        key, 
        error: error.message 
      });
      
      // If cache fails, still try to execute fallback
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        logger.error('Fallback function failed', { 
          key, 
          error: fallbackError.message 
        });
        throw fallbackError;
      }
    }
  }
  
  // Batch cache operations
  async mget(keys) {
    if (!this.isConnected || keys.length === 0) {
      return keys.map(() => null);
    }
    
    try {
      const values = await this.client.mget(...keys);
      return values.map(value => {
        if (!value) return null;
        
        try {
          const parsedValue = JSON.parse(value);
          const now = Date.now();
          const cacheAge = now - parsedValue.timestamp;
          
          if (cacheAge > parsedValue.ttl * 1000) {
            return null; // Expired
          }
          
          return parsedValue.data;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Batch cache get failed', { 
        keys, 
        error: error.message 
      });
      return keys.map(() => null);
    }
  }
  
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    if (!this.isConnected || keyValuePairs.length === 0) {
      return false;
    }
    
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, value] of keyValuePairs) {
        const serializedValue = JSON.stringify({
          data: value,
          timestamp: Date.now(),
          ttl: ttl
        });
        pipeline.setex(key, ttl, serializedValue);
      }
      
      await pipeline.exec();
      logger.debug('Batch cache set completed', { 
        count: keyValuePairs.length 
      });
      
      return true;
    } catch (error) {
      logger.error('Batch cache set failed', { 
        error: error.message 
      });
      return false;
    }
  }
  
  // Cache warming
  async warmCache(keys, fallbackFn, ttl = this.defaultTTL) {
    logger.info('Starting cache warming', { keyCount: keys.length });
    
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (key) => {
        try {
          const value = await fallbackFn(key);
          await this.set(key, value, ttl);
          return { key, success: true };
        } catch (error) {
          logger.error('Cache warming failed for key', { 
            key, 
            error: error.message 
          });
          return { key, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info('Cache warming completed', { 
      total: keys.length, 
      success: successCount,
      failed: keys.length - successCount
    });
    
    return results;
  }
  
  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        message: 'Redis not connected'
      };
    }
    
    try {
      const startTime = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        message: 'Redis cache is responsive'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis health check failed: ${error.message}`
      };
    }
  }
}

// Create singleton instance
const redisCacheService = new RedisCacheService();

module.exports = redisCacheService;
