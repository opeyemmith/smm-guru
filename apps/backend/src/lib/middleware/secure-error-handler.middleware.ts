import type { Context } from "hono";
import type { HTTPException } from "hono/http-exception";

/**
 * Secure Error Handler
 * Prevents information disclosure while providing useful error information
 */

interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine if we should expose detailed error information
 */
function shouldExposeDetails(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Sanitize error message to prevent information disclosure
 */
function sanitizeErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Database-related errors
  if (message.includes('database') || message.includes('sql') || message.includes('postgres')) {
    return 'A database error occurred. Please try again later.';
  }
  
  // File system errors
  if (message.includes('enoent') || message.includes('file') || message.includes('directory')) {
    return 'A file system error occurred. Please contact support.';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    return 'A network error occurred. Please check your connection and try again.';
  }
  
  // Authentication errors (these can be more specific)
  if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('token')) {
    return error.message; // These are safe to expose
  }
  
  // Validation errors (these can be more specific)
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return error.message; // These are safe to expose
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Log error securely (without exposing sensitive information in logs)
 */
function logError(error: Error, context: Context, requestId: string): void {
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: context.req.method,
    path: context.req.path,
    userAgent: context.req.header('user-agent'),
    ip: context.req.header('x-forwarded-for') || context.req.header('x-real-ip') || 'unknown',
    userId: context.get('user')?.id || 'anonymous',
    error: {
      name: error.name,
      message: error.message,
      stack: shouldExposeDetails() ? error.stack : '[REDACTED]'
    }
  };

  // In production, send to your logging service (e.g., Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    console.error('Application Error:', JSON.stringify(logData, null, 2));
    // TODO: Send to external logging service
    // await sendToLoggingService(logData);
  } else {
    console.error('Development Error:', logData);
  }
}

/**
 * Secure error handler middleware
 */
export const secureErrorHandler = (error: Error | HTTPException, c: Context) => {
  const requestId = generateRequestId();
  
  // Log the error securely
  logError(error, c, requestId);

  // Handle HTTP exceptions (from Hono)
  if ('status' in error && 'message' in error) {
    const httpError = error as HTTPException;
    
    const response: ErrorResponse = {
      error: httpError.name || 'HTTP Error',
      message: httpError.message,
      timestamp: new Date().toISOString(),
      requestId: shouldExposeDetails() ? requestId : undefined
    };

    return c.json(response, httpError.status);
  }

  // Handle regular errors
  const isClientError = error.name === 'ValidationError' || 
                       error.message.includes('validation') ||
                       error.message.includes('invalid') ||
                       error.message.includes('unauthorized');

  const statusCode = isClientError ? 400 : 500;
  
  const response: ErrorResponse = {
    error: isClientError ? 'Validation Error' : 'Internal Server Error',
    message: isClientError ? error.message : sanitizeErrorMessage(error),
    timestamp: new Date().toISOString(),
    requestId: shouldExposeDetails() ? requestId : undefined
  };

  // Add detailed error information in development
  if (shouldExposeDetails()) {
    response.details = {
      name: error.name,
      stack: error.stack,
      originalMessage: error.message
    };
  }

  return c.json(response, statusCode);
};

/**
 * Validation error handler for Zod and other validation libraries
 */
export const validationErrorHandler = (error: any, c: Context) => {
  const requestId = generateRequestId();
  
  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: 'Invalid input data provided',
      timestamp: new Date().toISOString(),
      requestId: shouldExposeDetails() ? requestId : undefined,
      details: shouldExposeDetails() ? error.errors : undefined
    };

    return c.json(response, 400);
  }

  // Fallback to secure error handler
  return secureErrorHandler(error, c);
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (c: Context, retryAfter: number) => {
  const response: ErrorResponse = {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString()
  };

  c.header('Retry-After', retryAfter.toString());
  return c.json(response, 429);
};

/**
 * CSRF error handler
 */
export const csrfErrorHandler = (c: Context, message: string) => {
  const response: ErrorResponse = {
    error: 'CSRF Protection',
    message,
    timestamp: new Date().toISOString()
  };

  return c.json(response, 403);
};

export default secureErrorHandler;
