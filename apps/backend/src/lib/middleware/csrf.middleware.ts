import type { Context, Next } from "hono";
import crypto from "crypto";

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

// In-memory token store (use Redis in production)
const tokenStore = new Map<string, { token: string; expires: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now > value.expires) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface CSRFOptions {
  tokenLength?: number;
  tokenExpiry?: number; // in milliseconds
  headerName?: string;
  cookieName?: string;
  skipMethods?: string[];
  skipPaths?: string[];
}

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCSRFToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Get session identifier for CSRF token storage
 */
function getSessionId(c: Context): string {
  const user = c.get('user');
  if (user?.id) {
    return `user:${user.id}`;
  }
  
  // Fallback to IP-based identifier for anonymous users
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
}

/**
 * CSRF Protection Middleware Factory
 */
export function createCSRFProtection(options: CSRFOptions = {}) {
  const {
    tokenLength = 32,
    tokenExpiry = 60 * 60 * 1000, // 1 hour
    headerName = 'x-csrf-token',
    cookieName = 'csrf-token',
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    skipPaths = ['/api/auth/', '/api/v1/webhook/']
  } = options;

  return async (c: Context, next: Next) => {
    const method = c.req.method;
    const path = c.req.path;

    // Skip CSRF protection for safe methods and specified paths
    if (skipMethods.includes(method) || skipPaths.some(p => path.startsWith(p))) {
      return next();
    }

    const sessionId = getSessionId(c);
    
    // For state-changing requests, verify CSRF token
    if (!skipMethods.includes(method)) {
      const tokenFromHeader = c.req.header(headerName);
      const tokenFromBody = await getTokenFromBody(c);
      const submittedToken = tokenFromHeader || tokenFromBody;

      if (!submittedToken) {
        return c.json({
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request'
        }, 403);
      }

      const storedTokenData = tokenStore.get(sessionId);
      
      if (!storedTokenData || Date.now() > storedTokenData.expires) {
        return c.json({
          error: 'CSRF token expired',
          message: 'CSRF token has expired, please refresh the page'
        }, 403);
      }

      if (storedTokenData.token !== submittedToken) {
        return c.json({
          error: 'Invalid CSRF token',
          message: 'CSRF token validation failed'
        }, 403);
      }
    }

    await next();
  };
}

/**
 * Middleware to generate and provide CSRF tokens
 */
export function provideCSRFToken(options: CSRFOptions = {}) {
  const {
    tokenLength = 32,
    tokenExpiry = 60 * 60 * 1000, // 1 hour
    cookieName = 'csrf-token'
  } = options;

  return async (c: Context, next: Next) => {
    const sessionId = getSessionId(c);
    
    // Generate new token or use existing valid token
    let tokenData = tokenStore.get(sessionId);
    
    if (!tokenData || Date.now() > tokenData.expires) {
      const newToken = generateCSRFToken(tokenLength);
      tokenData = {
        token: newToken,
        expires: Date.now() + tokenExpiry
      };
      tokenStore.set(sessionId, tokenData);
    }

    // Set CSRF token in response headers and cookie
    c.header('X-CSRF-Token', tokenData.token);
    
    // Set secure cookie with CSRF token
    const cookieOptions = [
      `${cookieName}=${tokenData.token}`,
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(tokenExpiry / 1000)}`,
      'Path=/'
    ];

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure');
    }

    c.header('Set-Cookie', cookieOptions.join('; '));

    await next();
  };
}

/**
 * Extract CSRF token from request body
 */
async function getTokenFromBody(c: Context): Promise<string | null> {
  try {
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      return body._csrf || body.csrfToken || null;
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await c.req.formData();
      return formData.get('_csrf') as string || formData.get('csrfToken') as string || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get CSRF token for current session
 * Use this in your frontend to get the token for requests
 */
export async function getCSRFToken(c: Context): Promise<string | null> {
  const sessionId = getSessionId(c);
  const tokenData = tokenStore.get(sessionId);
  
  if (!tokenData || Date.now() > tokenData.expires) {
    return null;
  }
  
  return tokenData.token;
}

/**
 * Pre-configured CSRF protection for different use cases
 */

// Standard CSRF protection for web forms
export const webCSRFProtection = createCSRFProtection({
  tokenLength: 32,
  tokenExpiry: 60 * 60 * 1000, // 1 hour
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token'
});

// API CSRF protection with longer expiry
export const apiCSRFProtection = createCSRFProtection({
  tokenLength: 32,
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  headerName: 'x-csrf-token',
  skipPaths: ['/api/auth/', '/api/v1/webhook/', '/api/v1/services/']
});

export default createCSRFProtection;
