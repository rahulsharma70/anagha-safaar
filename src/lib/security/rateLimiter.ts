// src/lib/security/rateLimiter.ts
import { logger } from '../logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // API endpoints
    this.addConfig('api:hotels', { windowMs: 60000, maxRequests: 100 }); // 100 requests per minute
    this.addConfig('api:flights', { windowMs: 60000, maxRequests: 100 });
    this.addConfig('api:tours', { windowMs: 60000, maxRequests: 100 });
    this.addConfig('api:ai', { windowMs: 60000, maxRequests: 20 }); // Lower limit for AI
    this.addConfig('api:payment', { windowMs: 60000, maxRequests: 50 });
    
    // Authentication
    this.addConfig('auth:login', { windowMs: 900000, maxRequests: 5, blockDurationMs: 900000 }); // 5 attempts per 15 minutes
    this.addConfig('auth:register', { windowMs: 3600000, maxRequests: 3, blockDurationMs: 3600000 }); // 3 attempts per hour
    
    // General user actions
    this.addConfig('user:booking', { windowMs: 300000, maxRequests: 10 }); // 10 bookings per 5 minutes
    this.addConfig('user:search', { windowMs: 60000, maxRequests: 200 }); // 200 searches per minute
  }

  addConfig(key: string, config: RateLimitConfig) {
    this.configs.set(key, config);
    logger.info(`Added rate limit config for ${key}: ${config.maxRequests} requests per ${config.windowMs}ms`);
  }

  async checkLimit(identifier: string, limitKey: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const config = this.configs.get(limitKey);
    if (!config) {
      logger.warn(`No rate limit config found for ${limitKey}`);
      return { allowed: true, remaining: Infinity, resetTime: Date.now() };
    }

    const key = `${limitKey}:${identifier}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    // Clean up expired entries
    this.cleanupExpiredEntries();

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.limits.set(key, newEntry);

      logger.debug(`Rate limit check passed for ${identifier} (${limitKey}): 1/${config.maxRequests}`);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.blocked) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      logger.warn(`Rate limit blocked for ${identifier} (${limitKey}): retry after ${retryAfter}s`);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    if (entry.count >= config.maxRequests) {
      // Block the user if configured
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.resetTime = now + config.blockDurationMs;
      } else {
        entry.resetTime = now + config.windowMs;
      }

      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      logger.warn(`Rate limit exceeded for ${identifier} (${limitKey}): ${entry.count}/${config.maxRequests}`);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    logger.debug(`Rate limit check passed for ${identifier} (${limitKey}): ${entry.count}/${config.maxRequests}`);
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  async resetLimit(identifier: string, limitKey: string): Promise<void> {
    const key = `${limitKey}:${identifier}`;
    this.limits.delete(key);
    logger.info(`Rate limit reset for ${identifier} (${limitKey})`);
  }

  async getLimitInfo(identifier: string, limitKey: string): Promise<{
    count: number;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } | null> {
    const key = `${limitKey}:${identifier}`;
    const entry = this.limits.get(key);
    const config = this.configs.get(limitKey);

    if (!entry || !config) {
      return null;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return {
        count: 0,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        blocked: false,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked: entry.blocked,
    };
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  // Get all active limits for monitoring
  getAllLimits(): Array<{
    key: string;
    identifier: string;
    limitKey: string;
    count: number;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  }> {
    const now = Date.now();
    const activeLimits: Array<{
      key: string;
      identifier: string;
      limitKey: string;
      count: number;
      remaining: number;
      resetTime: number;
      blocked: boolean;
    }> = [];

    for (const [key, entry] of this.limits.entries()) {
      if (now <= entry.resetTime) {
        const [limitKey, identifier] = key.split(':', 2);
        const config = this.configs.get(limitKey);
        
        if (config) {
          activeLimits.push({
            key,
            identifier,
            limitKey,
            count: entry.count,
            remaining: Math.max(0, config.maxRequests - entry.count),
            resetTime: entry.resetTime,
            blocked: entry.blocked,
          });
        }
      }
    }

    return activeLimits;
  }

  // Clear all limits (useful for testing)
  clearAll(): void {
    this.limits.clear();
    logger.info('All rate limits cleared');
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // In a real application, you might use IP address, user ID, or session ID
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

// Middleware for rate limiting
export async function rateLimitMiddleware(
  request: Request,
  limitKey: string,
  identifier?: string
): Promise<Response | null> {
  const clientId = identifier || getClientIdentifier(request);
  
  const result = await rateLimiter.checkLimit(clientId, limitKey);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
  }

  return null; // Allow request to proceed
}
