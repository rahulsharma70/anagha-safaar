// src/lib/cache/redis.ts
import { logger } from '../logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export class RedisCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000;
  private defaultTTL: number = 3600000; // 1 hour in milliseconds

  constructor(maxSize: number = 1000, defaultTTL: number = 3600000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        logger.debug(`Cache miss for key: ${key}`);
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        logger.debug(`Cache expired for key: ${key}`);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return entry.data as T;
    } catch (error) {
      logger.error('Error getting from cache:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      // Remove oldest entries if cache is full
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }

      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      const entry: CacheEntry<T> = {
        data,
        expiresAt,
        createdAt: Date.now(),
      };

      this.cache.set(key, entry);
      logger.debug(`Cached data for key: ${key}, TTL: ${ttl || this.defaultTTL}ms`);
    } catch (error) {
      logger.error('Error setting cache:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      logger.debug(`Deleted cache entry for key: ${key}`);
    } catch (error) {
      logger.error('Error deleting from cache:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.createdAt,
      expiresIn: entry.expiresAt - Date.now(),
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for real hit rate
      entries,
    };
  }
}

// Singleton instance
export const redisCache = new RedisCache();

// Cache key generators
export const cacheKeys = {
  hotels: (city: string, checkIn: string, checkOut: string) => 
    `hotels:${city}:${checkIn}:${checkOut}`,
  flights: (origin: string, destination: string, date: string) => 
    `flights:${origin}:${destination}:${date}`,
  tours: (location: string, duration: number) => 
    `tours:${location}:${duration}`,
  user: (userId: string) => `user:${userId}`,
  booking: (bookingId: string) => `booking:${bookingId}`,
  itinerary: (destination: string, budget: string, interests: string) => 
    `itinerary:${destination}:${budget}:${interests}`,
};
