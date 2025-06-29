import type { Context, Next } from "hono";

/**
 * Security headers middleware to protect against common attacks
 * Implements OWASP recommended security headers
 */
export const securityHeaders = async (c: Context, next: Next) => {
  // Strict Transport Security (HSTS)
  // Forces HTTPS connections for 1 year, including subdomains
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME type sniffing
  // Stops browsers from trying to guess content types
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  // Denies embedding in frames/iframes
  c.header('X-Frame-Options', 'DENY');

  // XSS Protection (legacy but still useful)
  // Enables browser's built-in XSS protection
  c.header('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  // Prevents XSS and data injection attacks
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  c.header('Content-Security-Policy', csp);

  // Referrer Policy
  // Controls how much referrer information is sent
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  // Disables potentially dangerous browser features
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  
  c.header('Permissions-Policy', permissionsPolicy);

  // Cross-Origin Embedder Policy
  // Helps enable cross-origin isolation
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin Opener Policy
  // Prevents cross-origin attacks via window.opener
  c.header('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin Resource Policy
  // Controls which origins can embed this resource
  c.header('Cross-Origin-Resource-Policy', 'same-origin');

  // Remove server information
  // Prevents server fingerprinting
  c.header('Server', '');
  c.header('X-Powered-By', '');

  await next();
};

/**
 * API-specific security headers
 * More relaxed CSP for API endpoints
 */
export const apiSecurityHeaders = async (c: Context, next: Next) => {
  // Basic security headers for APIs
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API-specific CSP (more permissive)
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  
  // Remove server information
  c.header('Server', '');
  c.header('X-Powered-By', '');

  await next();
};

export default securityHeaders;
