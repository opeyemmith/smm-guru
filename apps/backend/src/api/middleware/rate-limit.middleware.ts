/**
 * Rate Limiting Middleware
 * Implements rate limiting using Redis with fallback to memory
 */

import type { Context, Next } from 'hono';
import { getRedisClient } from '../../infrastructure/cache/redis.client.js';
import { getLogger } from '../../infrastructure/monitoring/logger.js';
import { sendError } from '../../shared/utils/response.util.js';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code for rate limit exceeded
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (c: Context) => string; // Custom key generator
  skip?: (c: Context) => boolean; // Skip rate limiting for certain requests
  onLimitReached?: (c: Context, info: RateLimitInfo) => void; // Callback when limit is reached
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsInWindow: number;
  remainingPoints: number;
  msBeforeNext: number;
  isFirstInWindow: boolean;
}

export class RateLimiter {
  private redis = getRedisClient();
  private logger = getLogger();
  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  constructor(private options: RateLimitOptions) {
    // Set default values
    this.options = {
      statusCode: 429,
      message: 'Too many requests, please try again later',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options,
    };

    // Clean up memory store periodically
    setInterval(() => {
      this.cleanupMemoryStore();
    }, 60000); // Clean up every minute
  }

  /**
   * Rate limiting middleware
   */
  middleware() {
    return async (c: Context, next: Next) => {
      try {
        // Check if request should be skipped
        if (this.options.skip && this.options.skip(c)) {
          await next();
          return;
        }

        // Generate key for this request
        const key = this.generateKey(c);
        
        // Check rate limit
        const rateLimitInfo = await this.checkRateLimit(key);

        // Set rate limit headers
        this.setRateLimitHeaders(c, rateLimitInfo);

        // Check if limit exceeded
        if (rateLimitInfo.remainingPoints <= 0) {
          this.logger.warn('Rate limit exceeded', {
            key,
            ip: this.getClientIP(c),
            path: c.req.path,
            method: c.req.method,
            totalHits: rateLimitInfo.totalHits,
            windowMs: this.options.windowMs,
            max: this.options.max,
          });

          // Call onLimitReached callback if provided
          if (this.options.onLimitReached) {
            this.options.onLimitReached(c, rateLimitInfo);
          }

          return sendError(
            c,
            'RATE_LIMIT_EXCEEDED',
            this.options.message!,
            this.options.statusCode!,
            {
              retryAfter: Math.ceil(rateLimitInfo.msBeforeNext / 1000),
              limit: this.options.max,
              remaining: rateLimitInfo.remainingPoints,
              resetTime: new Date(Date.now() + rateLimitInfo.msBeforeNext).toISOString(),
            }
          );
        }

        // Store original response status for post-processing
        const originalStatus = c.res.status;

        await next();

        // Post-process: check if we should count this request
        const shouldCount = this.shouldCountRequest(c, originalStatus);
        
        if (!shouldCount) {
          // Decrement the counter if we shouldn't count this request
          await this.decrementCounter(key);
        }
      } catch (error) {
        this.logger.error('Rate limiting error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: c.req.path,
          method: c.req.method,
        });

        // Continue with request if rate limiting fails
        await next();
      }
    };
  }

  /**
   * Check rate limit for a key
   */
  private async checkRateLimit(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    try {
      // Try Redis first
      const result = await this.checkRateLimitRedis(key, now, windowStart);
      if (result) {
        return result;
      }
    } catch (error) {
      this.logger.warn('Redis rate limiting failed, falling back to memory', { error });
    }

    // Fallback to memory store
    return this.checkRateLimitMemory(key, now, windowStart);
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRateLimitRedis(
    key: string,
    now: number,
    windowStart: number
  ): Promise<RateLimitInfo | null> {
    try {
      const redisKey = `rate_limit:${key}`;
      
      // Use Redis sorted set to store timestamps
      const pipeline = [
        // Remove old entries
        ['zremrangebyscore', redisKey, '-inf', windowStart.toString()],
        // Add current timestamp
        ['zadd', redisKey, now.toString(), now.toString()],
        // Count entries in window
        ['zcard', redisKey],
        // Set expiration
        ['expire', redisKey, Math.ceil(this.options.windowMs / 1000)],
      ];

      // Execute pipeline (this would need to be implemented based on your Redis client)
      // For now, we'll use individual commands
      
      await this.redis.getSql().unsafe(`
        EVAL "
          redis.call('zremrangebyscore', KEYS[1], '-inf', ARGV[1])
          redis.call('zadd', KEYS[1], ARGV[2], ARGV[2])
          local count = redis.call('zcard', KEYS[1])
          redis.call('expire', KEYS[1], ARGV[3])
          return count
        " 1 ${redisKey} ${windowStart} ${now} ${Math.ceil(this.options.windowMs / 1000)}
      `);

      // Get count from Redis (simplified for this implementation)
      const countStr = await this.redis.get(`count:${key}`, { fallbackToMemory: true });
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      // Increment count
      await this.redis.set(
        `count:${key}`,
        (count + 1).toString(),
        { ttl: Math.ceil(this.options.windowMs / 1000), fallbackToMemory: true }
      );

      const totalHits = count + 1;
      const remainingPoints = Math.max(0, this.options.max - totalHits);
      const resetTime = now + this.options.windowMs;
      const msBeforeNext = resetTime - now;

      return {
        totalHits,
        totalHitsInWindow: totalHits,
        remainingPoints,
        msBeforeNext,
        isFirstInWindow: count === 0,
      };
    } catch (error) {
      this.logger.error('Redis rate limit check failed', { error });
      return null;
    }
  }

  /**
   * Check rate limit using memory store
   */
  private checkRateLimitMemory(
    key: string,
    now: number,
    windowStart: number
  ): RateLimitInfo {
    const entry = this.memoryStore.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // First request in window or window expired
      const resetTime = now + this.options.windowMs;
      this.memoryStore.set(key, { count: 1, resetTime });
      
      return {
        totalHits: 1,
        totalHitsInWindow: 1,
        remainingPoints: this.options.max - 1,
        msBeforeNext: this.options.windowMs,
        isFirstInWindow: true,
      };
    }

    // Increment count
    entry.count++;
    const remainingPoints = Math.max(0, this.options.max - entry.count);
    const msBeforeNext = entry.resetTime - now;

    return {
      totalHits: entry.count,
      totalHitsInWindow: entry.count,
      remainingPoints,
      msBeforeNext,
      isFirstInWindow: false,
    };
  }

  /**
   * Decrement counter (for requests that shouldn't be counted)
   */
  private async decrementCounter(key: string): Promise<void> {
    try {
      // Try Redis first
      const countStr = await this.redis.get(`count:${key}`, { fallbackToMemory: true });
      if (countStr) {
        const count = Math.max(0, parseInt(countStr, 10) - 1);
        await this.redis.set(
          `count:${key}`,
          count.toString(),
          { ttl: Math.ceil(this.options.windowMs / 1000), fallbackToMemory: true }
        );
        return;
      }
    } catch (error) {
      this.logger.warn('Failed to decrement Redis counter', { error });
    }

    // Fallback to memory store
    const entry = this.memoryStore.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  /**
   * Generate key for rate limiting
   */
  private generateKey(c: Context): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(c);
    }

    // Default key generation based on IP address
    const ip = this.getClientIP(c);
    const path = c.req.path;
    const method = c.req.method;
    
    return `${ip}:${method}:${path}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(c: Context): string {
    return (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      c.req.header('x-client-ip') ||
      'unknown'
    );
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(c: Context, info: RateLimitInfo): void {
    c.header('X-RateLimit-Limit', this.options.max.toString());
    c.header('X-RateLimit-Remaining', info.remainingPoints.toString());
    c.header('X-RateLimit-Reset', new Date(Date.now() + info.msBeforeNext).toISOString());
    
    if (info.remainingPoints <= 0) {
      c.header('Retry-After', Math.ceil(info.msBeforeNext / 1000).toString());
    }
  }

  /**
   * Check if request should be counted
   */
  private shouldCountRequest(c: Context, originalStatus: number): boolean {
    const currentStatus = c.res.status;
    
    // Check skip options
    if (this.options.skipSuccessfulRequests && currentStatus < 400) {
      return false;
    }
    
    if (this.options.skipFailedRequests && currentStatus >= 400) {
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired entries from memory store
   */
  private cleanupMemoryStore(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.resetTime <= now) {
        this.memoryStore.delete(key);
      }
    }
  }
}

/**
 * Rate limiting middleware factory
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const rateLimiter = new RateLimiter(options);
  return rateLimiter.middleware();
}

/**
 * Predefined rate limiters
 */
export const strictRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests, please try again later',
});

export const moderateRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
});

export const lenientRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Too many requests, please try again later',
});

// Export default
export default rateLimitMiddleware;
