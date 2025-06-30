/**
 * Global Error Handler Middleware
 * Centralized error handling for all API endpoints
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { BaseException, isOperationalError, createErrorResponse } from '../exceptions/base.exception.js';
import { logger } from '../../infrastructure/monitoring/logger.js';

export interface ErrorHandlerOptions {
  enableStackTrace?: boolean;
  enableDetailedErrors?: boolean;
  logErrors?: boolean;
}

/**
 * Global error handler middleware
 */
export function errorHandlerMiddleware(options: ErrorHandlerOptions = {}) {
  const {
    enableStackTrace = process.env.NODE_ENV === 'development',
    enableDetailedErrors = process.env.NODE_ENV === 'development',
    logErrors = true,
  } = options;

  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      // Log the error
      if (logErrors) {
        logError(error, c);
      }

      // Handle different types of errors
      if (error instanceof BaseException) {
        return handleBaseException(c, error, enableStackTrace);
      }

      if (error instanceof HTTPException) {
        return handleHTTPException(c, error);
      }

      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return handleJSONParseError(c);
      }

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return handleValidationError(c, error);
      }

      // Handle database errors
      if (isDatabaseError(error)) {
        return handleDatabaseError(c, error, enableDetailedErrors);
      }

      // Handle unknown errors
      return handleUnknownError(c, error, enableStackTrace, enableDetailedErrors);
    }
  };
}

/**
 * Handle BaseException errors
 */
function handleBaseException(c: Context, error: BaseException, includeStack: boolean): Response {
  const response = error.toJSON();
  
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return c.json(response, error.statusCode);
}

/**
 * Handle Hono HTTPException errors
 */
function handleHTTPException(c: Context, error: HTTPException): Response {
  return c.json({
    success: false,
    name: 'HTTP_EXCEPTION',
    message: error.message,
    statusCode: error.status,
    timestamp: new Date().toISOString(),
    result: null,
  }, error.status);
}

/**
 * Handle JSON parsing errors
 */
function handleJSONParseError(c: Context): Response {
  return c.json({
    success: false,
    name: 'INVALID_JSON',
    message: 'Invalid JSON in request body',
    statusCode: 400,
    timestamp: new Date().toISOString(),
    result: null,
  }, 400);
}

/**
 * Handle validation errors (Zod, etc.)
 */
function handleValidationError(c: Context, error: any): Response {
  let message = 'Validation failed';
  let details: any = undefined;

  // Handle Zod errors
  if (error.name === 'ZodError') {
    message = 'Request validation failed';
    details = {
      issues: error.issues.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  return c.json({
    success: false,
    name: 'VALIDATION_ERROR',
    message,
    statusCode: 400,
    timestamp: new Date().toISOString(),
    details,
    result: null,
  }, 400);
}

/**
 * Handle database errors
 */
function handleDatabaseError(c: Context, error: any, includeDetails: boolean): Response {
  let message = 'Database operation failed';
  let statusCode = 500;
  let details: any = undefined;

  // Handle specific database errors
  if (error.code === '23505') { // Unique constraint violation
    message = 'Resource already exists';
    statusCode = 409;
  } else if (error.code === '23503') { // Foreign key constraint violation
    message = 'Referenced resource not found';
    statusCode = 400;
  } else if (error.code === '23502') { // Not null constraint violation
    message = 'Required field is missing';
    statusCode = 400;
  }

  if (includeDetails) {
    details = {
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
    };
  }

  return c.json({
    success: false,
    name: 'DATABASE_ERROR',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    details,
    result: null,
  }, statusCode);
}

/**
 * Handle unknown errors
 */
function handleUnknownError(
  c: Context, 
  error: any, 
  includeStack: boolean, 
  includeDetails: boolean
): Response {
  const response: any = {
    success: false,
    name: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    result: null,
  };

  if (includeDetails && error.message) {
    response.details = { originalMessage: error.message };
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return c.json(response, 500);
}

/**
 * Log error with context information
 */
function logError(error: any, c: Context): void {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    url: c.req.url,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    timestamp: new Date().toISOString(),
    userId: c.get('user')?.id,
  };

  if (isOperationalError(error)) {
    logger.warn('Operational error occurred', errorInfo);
  } else {
    logger.error('Unexpected error occurred', errorInfo);
  }
}

/**
 * Check if error is a database error
 */
function isDatabaseError(error: any): boolean {
  return (
    error.code && 
    (error.code.startsWith('23') || // Constraint violations
     error.code.startsWith('42') || // Syntax errors
     error.code.startsWith('08'))   // Connection errors
  ) || 
  error.name === 'DatabaseError' ||
  error.name === 'QueryFailedError';
}

/**
 * Create a custom error response for specific scenarios
 */
export function createCustomErrorResponse(
  name: string,
  message: string,
  statusCode: number,
  details?: any
) {
  return {
    success: false,
    name,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    details,
    result: null,
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncErrorHandler(
  handler: (c: Context, next: Next) => Promise<Response | void>
) {
  return async (c: Context, next: Next) => {
    try {
      return await handler(c, next);
    } catch (error) {
      throw error; // Let the global error handler catch it
    }
  };
}

/**
 * Rate limit error handler
 */
export function handleRateLimitError(c: Context, retryAfter?: number): Response {
  const response = createCustomErrorResponse(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests, please try again later',
    429,
    { retryAfter }
  );

  if (retryAfter) {
    c.header('Retry-After', retryAfter.toString());
  }

  return c.json(response, 429);
}

/**
 * CORS error handler
 */
export function handleCORSError(c: Context): Response {
  return c.json(createCustomErrorResponse(
    'CORS_ERROR',
    'Cross-origin request blocked',
    403
  ), 403);
}

/**
 * Authentication error handler
 */
export function handleAuthError(c: Context, message = 'Authentication required'): Response {
  return c.json(createCustomErrorResponse(
    'AUTHENTICATION_ERROR',
    message,
    401
  ), 401);
}

/**
 * Authorization error handler
 */
export function handleAuthorizationError(c: Context, message = 'Insufficient permissions'): Response {
  return c.json(createCustomErrorResponse(
    'AUTHORIZATION_ERROR',
    message,
    403
  ), 403);
}
