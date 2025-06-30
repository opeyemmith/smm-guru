/**
 * Request Logging Middleware
 * Comprehensive request/response logging for monitoring and debugging
 */

import type { Context, Next } from 'hono';

export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  timestamp: string;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  error?: string;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client IP address from various headers
 */
function getClientIP(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-client-ip') ||
    'unknown'
  );
}

/**
 * Sanitize sensitive data from URLs and headers
 */
function sanitizeUrl(url: string): string {
  // Remove sensitive query parameters
  const urlObj = new URL(url);
  const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth'];
  
  sensitiveParams.forEach(param => {
    if (urlObj.searchParams.has(param)) {
      urlObj.searchParams.set(param, '[REDACTED]');
    }
  });
  
  return urlObj.toString();
}

/**
 * Determine if request should be logged (skip health checks, etc.)
 */
function shouldLogRequest(path: string): boolean {
  const skipPaths = ['/health', '/ready', '/favicon.ico'];
  return !skipPaths.some(skipPath => path.startsWith(skipPath));
}

/**
 * Format log message for console output
 */
function formatLogMessage(data: RequestLogData): string {
  const { method, url, statusCode, duration, ip, userId } = data;
  
  // Color coding for status codes
  let statusColor = '';
  if (statusCode) {
    if (statusCode >= 200 && statusCode < 300) statusColor = '\x1b[32m'; // Green
    else if (statusCode >= 300 && statusCode < 400) statusColor = '\x1b[33m'; // Yellow
    else if (statusCode >= 400 && statusCode < 500) statusColor = '\x1b[31m'; // Red
    else if (statusCode >= 500) statusColor = '\x1b[35m'; // Magenta
  }
  const resetColor = '\x1b[0m';

  const userInfo = userId ? ` [User: ${userId}]` : '';
  const durationInfo = duration ? ` ${duration}ms` : '';
  const ipInfo = ip && ip !== 'unknown' ? ` ${ip}` : '';

  return `${statusColor}${method} ${url} ${statusCode}${resetColor}${durationInfo}${ipInfo}${userInfo}`;
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Add request ID to context for use in other middleware/handlers
    c.set('requestId', requestId);
    
    const logData: RequestLogData = {
      requestId,
      method: c.req.method,
      url: sanitizeUrl(c.req.url),
      userAgent: c.req.header('user-agent'),
      ip: getClientIP(c),
      timestamp: new Date().toISOString(),
    };

    // Skip logging for certain paths
    if (!shouldLogRequest(c.req.path)) {
      await next();
      return;
    }

    try {
      // Log incoming request
      console.log(`📥 ${logData.method} ${logData.url} [${requestId}]`);

      // Process request
      await next();

      // Calculate response time
      const duration = Date.now() - startTime;
      logData.duration = duration;
      logData.statusCode = c.res.status;

      // Get user ID if available (from auth context)
      const user = c.get('user');
      if (user?.id) {
        logData.userId = user.id;
      }

      // Get response size if available
      const contentLength = c.res.headers.get('content-length');
      if (contentLength) {
        logData.responseSize = parseInt(contentLength, 10);
      }

      // Log completed request
      console.log(`📤 ${formatLogMessage(logData)}`);

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        console.warn(`🐌 Slow request detected: ${logData.method} ${logData.url} took ${duration}ms`);
      }

    } catch (error) {
      // Calculate response time even for errors
      const duration = Date.now() - startTime;
      logData.duration = duration;
      logData.error = error instanceof Error ? error.message : 'Unknown error';
      logData.statusCode = 500;

      // Log error
      console.error(`❌ ${formatLogMessage(logData)} - Error: ${logData.error}`);

      // Re-throw error to be handled by error middleware
      throw error;
    }
  };
}

/**
 * Enhanced request logging with structured logging
 * (For future integration with logging services like Winston, Pino, etc.)
 */
export function structuredRequestLogging() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    c.set('requestId', requestId);
    
    const logData: RequestLogData = {
      requestId,
      method: c.req.method,
      url: sanitizeUrl(c.req.url),
      userAgent: c.req.header('user-agent'),
      ip: getClientIP(c),
      timestamp: new Date().toISOString(),
    };

    if (!shouldLogRequest(c.req.path)) {
      await next();
      return;
    }

    try {
      await next();

      logData.duration = Date.now() - startTime;
      logData.statusCode = c.res.status;
      
      const user = c.get('user');
      if (user?.id) {
        logData.userId = user.id;
      }

      // Structured log output (JSON format for log aggregation)
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
          level: 'info',
          type: 'request',
          ...logData
        }));
      } else {
        console.log(`📤 ${formatLogMessage(logData)}`);
      }

    } catch (error) {
      logData.duration = Date.now() - startTime;
      logData.error = error instanceof Error ? error.message : 'Unknown error';
      logData.statusCode = 500;

      // Structured error log
      if (process.env.NODE_ENV === 'production') {
        console.error(JSON.stringify({
          level: 'error',
          type: 'request_error',
          ...logData
        }));
      } else {
        console.error(`❌ ${formatLogMessage(logData)} - Error: ${logData.error}`);
      }

      throw error;
    }
  };
}

/**
 * Simple request counter middleware
 */
export function requestCounterMiddleware() {
  let requestCount = 0;
  
  return async (c: Context, next: Next) => {
    requestCount++;
    c.set('requestCount', requestCount);
    
    // Log request count every 100 requests
    if (requestCount % 100 === 0) {
      console.log(`📊 Request milestone: ${requestCount} requests processed`);
    }
    
    await next();
  };
}

export default requestLoggingMiddleware;
