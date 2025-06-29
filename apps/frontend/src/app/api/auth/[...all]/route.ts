import { auth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting for authentication endpoints
interface RateLimitData {
  count: number;
  resetTime: number;
}

class AuthRateLimiter {
  private store = new Map<string, RateLimitData>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async checkRateLimit(request: NextRequest, path: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    // Only apply rate limiting to sign-in attempts
    if (!path.includes('/sign-in/email')) {
      return { allowed: true, remaining: this.maxAttempts, resetTime: Date.now() + this.windowMs };
    }

    const clientIP = this.getClientIP(request);
    const key = `auth:${clientIP}`;
    const now = Date.now();

    // Cleanup expired entries
    this.cleanup();

    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // First request or expired window
      const resetTime = now + this.windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime
      };
    }

    // Increment count
    existing.count++;
    this.store.set(key, existing);

    const remaining = Math.max(0, this.maxAttempts - existing.count);
    const allowed = existing.count <= this.maxAttempts;

    return {
      allowed,
      remaining,
      resetTime: existing.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((existing.resetTime - now) / 1000)
    };
  }
}

const rateLimiter = new AuthRateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  // Access private cleanup method through instance
  (rateLimiter as any).cleanup();
}, 5 * 60 * 1000);

// Security headers for auth endpoints
const addSecurityHeaders = (response: NextResponse) => {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy for auth endpoints
  response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (HTTP Strict Transport Security)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Remove server information
  response.headers.set('Server', '');
  response.headers.delete('X-Powered-By');

  return response;
};

// Sanitize error messages for security
const sanitizeErrorMessage = (responseText: string): string => {
  try {
    const data = JSON.parse(responseText);

    // Check if this is an error response
    if (data.error || data.message) {
      // Replace specific error messages with generic ones
      if (data.error && typeof data.error === 'string') {
        if (data.error.toLowerCase().includes('password') ||
            data.error.toLowerCase().includes('email') ||
            data.error.toLowerCase().includes('user')) {
          data.error = 'Invalid credentials';
        }
      }

      if (data.message && typeof data.message === 'string') {
        if (data.message.toLowerCase().includes('password') ||
            data.message.toLowerCase().includes('email') ||
            data.message.toLowerCase().includes('user')) {
          data.message = 'Invalid credentials';
        }
      }
    }

    return JSON.stringify(data);
  } catch {
    // If not JSON, return as is
    return responseText;
  }
};

// Wrap the auth handlers with security headers and error sanitization
const { GET: originalGET, POST: originalPOST } = toNextJsHandler(auth.handler);

export const GET = async (request: NextRequest) => {
  // Apply rate limiting to authentication requests
  const path = request.nextUrl.pathname;
  const rateLimit = await rateLimiter.checkRateLimit(request, path);

  // Add rate limit headers for GET requests too
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', '5');
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  const response = await originalGET(request);

  // Add rate limit headers to responses
  for (const [key, value] of headers.entries()) {
    response.headers.set(key, value);
  }

  // Sanitize error messages if this is an error response
  if (response.status >= 400) {
    const responseText = await response.text();
    const sanitizedText = sanitizeErrorMessage(responseText);

    const newResponse = new NextResponse(sanitizedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    return addSecurityHeaders(newResponse);
  }

  return addSecurityHeaders(response);
};

export const POST = async (request: NextRequest) => {
  // Apply rate limiting to authentication requests
  const path = request.nextUrl.pathname;
  const rateLimit = await rateLimiter.checkRateLimit(request, path);

  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', '5');
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  // Check if rate limit exceeded
  if (!rateLimit.allowed) {
    headers.set('Retry-After', rateLimit.retryAfter!.toString());

    const rateLimitResponse = new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many authentication attempts, please try again in 15 minutes.",
        retryAfter: rateLimit.retryAfter
      }),
      {
        status: 429,
        headers
      }
    );

    return addSecurityHeaders(rateLimitResponse);
  }

  const response = await originalPOST(request);

  // Add rate limit headers to successful responses too
  for (const [key, value] of headers.entries()) {
    response.headers.set(key, value);
  }

  // Sanitize error messages if this is an error response
  if (response.status >= 400) {
    const responseText = await response.text();
    const sanitizedText = sanitizeErrorMessage(responseText);

    const newResponse = new NextResponse(sanitizedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    return addSecurityHeaders(newResponse);
  }

  return addSecurityHeaders(response);
};