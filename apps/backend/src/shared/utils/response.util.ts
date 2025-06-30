/**
 * Response Utility Functions for SMM Guru Backend
 * Standardized API response formatting
 */

import type { Context } from 'hono';
import type { ApiResponse, PaginatedResponse } from '../types/api.types.js';
import { BaseException, createErrorResponse } from '../exceptions/base.exception.js';

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  name: string,
  message: string,
  result: T,
  statusCode = 200
): ApiResponse<T> {
  return {
    success: true,
    name,
    message,
    result,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponseUtil(
  name: string,
  message: string,
  statusCode = 500,
  details?: any
): ApiResponse<null> {
  return {
    success: false,
    name,
    message,
    result: null,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  name: string,
  message: string
): ApiResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  return createSuccessResponse(name, message, {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Send success response with Hono context
 */
export function sendSuccess<T>(
  c: Context,
  name: string,
  message: string,
  result: T,
  statusCode = 200
) {
  const response = createSuccessResponse(name, message, result, statusCode);
  return c.json(response, statusCode);
}

/**
 * Send error response with Hono context
 */
export function sendError(
  c: Context,
  name: string,
  message: string,
  statusCode = 500,
  details?: any
) {
  const response = createErrorResponseUtil(name, message, statusCode, details);
  return c.json(response, statusCode);
}

/**
 * Send paginated response with Hono context
 */
export function sendPaginated<T>(
  c: Context,
  data: T[],
  page: number,
  limit: number,
  total: number,
  name: string,
  message: string
) {
  const response = createPaginatedResponse(data, page, limit, total, name, message);
  return c.json(response, 200);
}

/**
 * Handle exceptions and send appropriate response
 */
export function handleException(c: Context, error: Error | BaseException) {
  console.error('API Error:', error);

  if (error instanceof BaseException) {
    return c.json(error.toJSON(), error.statusCode);
  }

  // Handle unknown errors
  const response = createErrorResponse(error);
  return c.json(response, 500);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: string, limit?: string) {
  const parsedPage = page ? parseInt(page, 10) : 1;
  const parsedLimit = limit ? parseInt(limit, 10) : 20;

  // Validate page
  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new Error('Page must be a positive integer');
  }

  // Validate limit (max 100 for performance)
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  };
}

/**
 * Extract and validate sort parameters
 */
export function validateSorting(sortBy?: string, sortOrder?: string) {
  const allowedSortFields = [
    'id', 'createdAt', 'updatedAt', 'name', 'email', 
    'status', 'amount', 'quantity', 'rate'
  ];
  
  const allowedSortOrders = ['asc', 'desc'];

  const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = sortOrder && allowedSortOrders.includes(sortOrder) ? sortOrder : 'desc';

  return {
    sortBy: validSortBy,
    sortOrder: validSortOrder as 'asc' | 'desc',
  };
}

/**
 * Create response for health check
 */
export function createHealthResponse(
  status: 'healthy' | 'unhealthy' | 'degraded',
  services: Record<string, 'up' | 'down' | 'partial'>,
  uptime: number,
  version: string
) {
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime,
    version,
    services,
    metrics: {
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000000, // seconds
      activeConnections: 0, // This would be tracked separately
    },
  };
}

/**
 * Format currency values consistently
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Sanitize sensitive data from responses
 */
export function sanitizeResponse<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[] = ['password', 'apiKey', 'secret', 'token']
): T {
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Create response with request tracking
 */
export function createTrackedResponse<T>(
  name: string,
  message: string,
  result: T,
  requestId?: string,
  statusCode = 200
): ApiResponse<T> {
  return {
    success: true,
    name,
    message,
    result,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}
