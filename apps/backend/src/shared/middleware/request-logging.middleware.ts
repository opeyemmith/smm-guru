/**
 * Request Logging Middleware
 * Comprehensive HTTP request/response logging with correlation IDs and performance tracking
 */

import type { Context, Next } from 'hono';
import { Logger } from '../../infrastructure/monitoring/logger.js';
import { MetricsCollector } from '../../infrastructure/monitoring/metrics.js';
import { getHealthCheckService } from '../../infrastructure/monitoring/health-check.js';

export interface RequestLoggingOptions {
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  enablePerformanceLogging?: boolean;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  maxBodySize?: number;
  excludePaths?: string[];
  sensitiveHeaders?: string[];
}

const DEFAULT_OPTIONS: RequestLoggingOptions = {
  enableRequestLogging: true,
  enableResponseLogging: true,
  enablePerformanceLogging: true,
  logRequestBody: false,
  logResponseBody: false,
  maxBodySize: 1024, // 1KB
  excludePaths: ['/health', '/health/live', '/health/ready'],
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
};

export function requestLoggingMiddleware(options: RequestLoggingOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const logger = Logger.getInstance();
  const metrics = MetricsCollector.getInstance();
  const healthCheck = getHealthCheckService();

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const correlationId = logger.generateCorrelationId();
    const requestId = logger.generateCorrelationId();

    // Skip logging for excluded paths
    if (config.excludePaths?.some(path => c.req.path.startsWith(path))) {
      await next();
      return;
    }

    // Set correlation ID in context
    c.set('correlationId', correlationId);
    c.set('requestId', requestId);

    // Extract request information
    const method = c.req.method;
    const url = c.req.url;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent');
    const ip = c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    const contentLength = c.req.header('content-length');
    const user = c.get('user');

    // Create request context
    const requestContext = {
      correlationId,
      requestId,
      method,
      url,
      path,
      userAgent,
      ip,
      contentLength,
      userId: user?.id,
    };

    // Log request headers (excluding sensitive ones)
    const headers = Object.fromEntries(
      Object.entries(c.req.header()).filter(
        ([key]) => !config.sensitiveHeaders?.includes(key.toLowerCase())
      )
    );

    // Log incoming request
    if (config.enableRequestLogging) {
      let requestBody: any = undefined;
      
      if (config.logRequestBody && 
          method !== 'GET' && 
          contentLength && 
          parseInt(contentLength) <= (config.maxBodySize || 1024)) {
        try {
          // Clone request to read body without consuming it
          const clonedRequest = c.req.clone();
          requestBody = await clonedRequest.text();
          
          // Try to parse as JSON for better logging
          try {
            requestBody = JSON.parse(requestBody);
          } catch {
            // Keep as string if not valid JSON
          }
        } catch (error) {
          logger.warn('Failed to read request body for logging', { 
            correlationId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      logger.info(`Incoming request: ${method} ${path}`, {
        ...requestContext,
        headers,
        body: requestBody,
        type: 'http_request_start',
      });
    }

    // Increment request counter
    healthCheck.incrementRequestCount();
    metrics.incrementCounter('http_requests_total', 1, {
      method,
      path: this.normalizePath(path),
    });

    let statusCode = 200;
    let error: Error | undefined;

    try {
      await next();
      statusCode = c.res.status;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      statusCode = 500;
      
      // Increment error counter
      healthCheck.incrementErrorCount();
      metrics.incrementCounter('http_errors_total', 1, {
        method,
        path: this.normalizePath(path),
        status: statusCode.toString(),
      });

      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const responseSize = c.res.headers.get('content-length');

      // Create response context
      const responseContext = {
        ...requestContext,
        statusCode,
        duration,
        responseSize,
        error: error?.message,
      };

      // Log response
      if (config.enableResponseLogging) {
        let responseBody: any = undefined;
        
        if (config.logResponseBody && 
            responseSize && 
            parseInt(responseSize) <= (config.maxBodySize || 1024)) {
          try {
            // This is tricky with Hono - we'd need to intercept the response
            // For now, we'll skip response body logging
          } catch (error) {
            logger.warn('Failed to read response body for logging', { 
              correlationId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        const logLevel = statusCode >= 500 ? 'error' : 
                        statusCode >= 400 ? 'warn' : 'info';

        logger[logLevel](`Request completed: ${method} ${path} ${statusCode} - ${duration}ms`, {
          ...responseContext,
          body: responseBody,
          type: 'http_request_complete',
        });
      }

      // Record performance metrics
      if (config.enablePerformanceLogging) {
        metrics.recordPerformance({
          operation: `${method} ${this.normalizePath(path)}`,
          duration,
          success: statusCode < 400,
          tags: {
            method,
            path: this.normalizePath(path),
            status: statusCode.toString(),
          },
        });

        // Record response time histogram
        metrics.recordHistogram(
          'http_request_duration',
          duration,
          'milliseconds',
          {
            method,
            path: this.normalizePath(path),
            status: statusCode.toString(),
          }
        );
      }

      // Log slow requests
      const slowRequestThreshold = 1000; // 1 second
      if (duration > slowRequestThreshold) {
        logger.warn(`Slow request detected: ${method} ${path} took ${duration}ms`, {
          ...responseContext,
          type: 'slow_request',
          threshold: slowRequestThreshold,
        });
      }

      // Log errors with stack trace
      if (error) {
        logger.error(`Request failed: ${method} ${path}`, {
          ...responseContext,
          error: error.message,
          stack: error.stack,
          type: 'http_request_error',
        });
      }
    }
  };

  /**
   * Normalize path for metrics (remove IDs and dynamic segments)
   */
  function normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectid') // Replace MongoDB ObjectIDs
      .replace(/\?.*$/, ''); // Remove query parameters
  }
}

/**
 * Create child logger with request context
 */
export function createRequestLogger(c: Context): Logger {
  const logger = Logger.getInstance();
  const correlationId = c.get('correlationId');
  const requestId = c.get('requestId');
  const user = c.get('user');

  return logger.child({
    correlationId,
    requestId,
    userId: user?.id,
    method: c.req.method,
    path: c.req.path,
  });
}

/**
 * Get correlation ID from context
 */
export function getCorrelationId(c: Context): string {
  return c.get('correlationId') || 'unknown';
}

/**
 * Get request ID from context
 */
export function getRequestId(c: Context): string {
  return c.get('requestId') || 'unknown';
}
