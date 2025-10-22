import Redis from 'ioredis';
import { logger } from '../lib/logger';

// =============================================================================
// 1. REDIS SERVICE CLASS
// =============================================================================

export class RedisService {
  private static instance: RedisService;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  // =============================================================================
  // 2. SINGLETON PATTERN
  // =============================================================================

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // =============================================================================
  // 3. BASIC OPERATIONS
  // =============================================================================

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error });
      return false;
    }
  }

  async setex(key: string, ttlSeconds: number, value: any): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error });
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error', { key, error });
      return -1;
    }
  }

  // =============================================================================
  // 4. HASH OPERATIONS
  // =============================================================================

  async hget(key: string, field: string): Promise<any> {
    try {
      const value = await this.redis.hget(key, field);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error });
      return null;
    }
  }

  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error });
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, any> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error });
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.redis.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Redis HDEL error', { key, field, error });
      return false;
    }
  }

  // =============================================================================
  // 5. LIST OPERATIONS
  // =============================================================================

  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Redis LPUSH error', { key, error });
      return 0;
    }
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.rpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Redis RPUSH error', { key, error });
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
    } catch (error) {
      logger.error('Redis LRANGE error', { key, start, stop, error });
      return [];
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.redis.llen(key);
    } catch (error) {
      logger.error('Redis LLEN error', { key, error });
      return 0;
    }
  }

  // =============================================================================
  // 6. SET OPERATIONS
  // =============================================================================

  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.redis.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error('Redis SADD error', { key, error });
      return 0;
    }
  }

  async smembers(key: string): Promise<any[]> {
    try {
      const members = await this.redis.smembers(key);
      return members.map(m => {
        try {
          return JSON.parse(m);
        } catch {
          return m;
        }
      });
    } catch (error) {
      logger.error('Redis SMEMBERS error', { key, error });
      return [];
    }
  }

  async sismember(key: string, member: any): Promise<boolean> {
    try {
      const serializedMember = JSON.stringify(member);
      const result = await this.redis.sismember(key, serializedMember);
      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER error', { key, error });
      return false;
    }
  }

  // =============================================================================
  // 7. PATTERN OPERATIONS
  // =============================================================================

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error', { pattern, error });
      return [];
    }
  }

  async scan(cursor: number = 0, pattern?: string, count?: number): Promise<{ cursor: number; keys: string[] }> {
    try {
      const args: any[] = [cursor];
      if (pattern) args.push('MATCH', pattern);
      if (count) args.push('COUNT', count);
      
      const result = await this.redis.scan(...args);
      return {
        cursor: parseInt(result[0]),
        keys: result[1]
      };
    } catch (error) {
      logger.error('Redis SCAN error', { cursor, pattern, count, error });
      return { cursor: 0, keys: [] };
    }
  }

  // =============================================================================
  // 8. CACHE UTILITIES
  // =============================================================================

  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug('Cache hit', { key });
        return cached;
      }

      // If not in cache, fetch from source
      logger.debug('Cache miss, fetching from source', { key });
      const data = await fetchFunction();
      
      // Store in cache
      await this.set(key, data, ttlSeconds);
      
      return data;
    } catch (error) {
      logger.error('Redis getOrSet error', { key, error });
      // If cache fails, still try to fetch from source
      return await fetchFunction();
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      logger.info('Cache pattern invalidated', { pattern, deletedCount: result });
      return result;
    } catch (error) {
      logger.error('Redis invalidatePattern error', { pattern, error });
      return 0;
    }
  }

  // =============================================================================
  // 9. HEALTH CHECK
  // =============================================================================

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error', error);
      return false;
    }
  }

  async getInfo(): Promise<any> {
    try {
      return await this.redis.info();
    } catch (error) {
      logger.error('Redis info error', error);
      return null;
    }
  }

  // =============================================================================
  // 10. CONNECTION MANAGEMENT
  // =============================================================================

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error('Redis connect error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
    } catch (error) {
      logger.error('Redis disconnect error', error);
    }
  }

  // =============================================================================
  // 11. STATIC METHODS FOR CONVENIENCE
  // =============================================================================

  static async get(key: string): Promise<any> {
    return RedisService.getInstance().get(key);
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    return RedisService.getInstance().set(key, value, ttlSeconds);
  }

  static async setex(key: string, ttlSeconds: number, value: any): Promise<boolean> {
    return RedisService.getInstance().setex(key, ttlSeconds, value);
  }

  static async del(key: string): Promise<boolean> {
    return RedisService.getInstance().del(key);
  }

  static async exists(key: string): Promise<boolean> {
    return RedisService.getInstance().exists(key);
  }

  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    return RedisService.getInstance().expire(key, ttlSeconds);
  }

  static async ttl(key: string): Promise<number> {
    return RedisService.getInstance().ttl(key);
  }

  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    return RedisService.getInstance().getOrSet(key, fetchFunction, ttlSeconds);
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    return RedisService.getInstance().invalidatePattern(pattern);
  }

  static async ping(): Promise<boolean> {
    return RedisService.getInstance().ping();
  }
}
