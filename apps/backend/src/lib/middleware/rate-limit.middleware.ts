import type { Context, Next } from "hono";
import { UNAUTHORIZED } from "@smm-guru/utils";

/**
 * In-memory rate limiting store
 * In production, use Redis for distributed rate limiting
 */
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Clean up expired entries
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs
    });
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key);
    
    if (!existing) {
      const data = { count: 1, resetTime: Date.now() + windowMs };
      this.store.set(key, data);
      return data;
    }
    
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, data] of entries) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new MemoryRateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;      // Don't count successful requests
  skipFailedRequests?: boolean;          // Don't count failed requests
  message?: string;      // Custom error message
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (c: Context) => getClientIP(c),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = "Too many requests, please try again later."
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const { count, resetTime } = await rateLimitStore.increment(key, windowMs);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString());
    c.header('X-RateLimit-Reset', new Date(resetTime).toISOString());

    // Check if rate limit exceeded
    if (count > maxRequests) {
      c.header('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
      
      return c.json({
        error: "Rate limit exceeded",
        message,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      }, 429);
    }

    await next();

    // Optionally skip counting based on response status
    const status = c.res.status;
    const shouldSkip = 
      (skipSuccessfulRequests && status < 400) ||
      (skipFailedRequests && status >= 400);

    if (shouldSkip) {
      // Decrement the count if we're skipping this request
      const current = await rateLimitStore.get(key);
      if (current && current.count > 0) {
        await rateLimitStore.set(key, current.count - 1, windowMs);
      }
    }
  };
}

/**
 * Get client IP address from various headers
 */
function getClientIP(c: Context): string {
  // Check various headers for the real IP
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = c.req.header('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = c.req.header('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default if no IP can be determined
  return 'unknown';
}

/**
 * Pre-configured rate limiters for common use cases
 */

// General API rate limiting: 100 requests per 15 minutes
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Too many API requests, please try again in 15 minutes."
});

// Authentication rate limiting: 5 attempts per 15 minutes
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (c: Context) => `auth:${getClientIP(c)}`,
  message: "Too many authentication attempts, please try again in 15 minutes."
});

// Strict rate limiting for sensitive operations: 10 requests per hour
export const strictRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: "Rate limit exceeded for sensitive operations, please try again in 1 hour."
});

// API key creation rate limiting: 3 per day
export const apiKeyCreationRateLimit = createRateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 3,
  keyGenerator: (c: Context) => `api-key:${c.get('user')?.id || getClientIP(c)}`,
  message: "Too many API key creation attempts, please try again tomorrow."
});
