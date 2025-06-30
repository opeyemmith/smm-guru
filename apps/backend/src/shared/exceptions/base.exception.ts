/**
 * Base Exception Classes for SMM Guru Backend
 * Centralized error handling with proper HTTP status codes
 */

export abstract class BaseException extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    name: string,
    isOperational = true,
    details?: any
  ) {
    super(message);
    
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
      result: null,
    };
  }
}

// 400 Bad Request
export class ValidationException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

// 401 Unauthorized
export class UnauthorizedException extends BaseException {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED_ACCESS', true);
  }
}

// 403 Forbidden
export class ForbiddenException extends BaseException {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN_ACCESS', true);
  }
}

// 404 Not Found
export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'RESOURCE_NOT_FOUND', true, { resource, identifier });
  }
}

// 409 Conflict
export class ConflictException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, 409, 'RESOURCE_CONFLICT', true, details);
  }
}

// 422 Unprocessable Entity
export class BusinessLogicException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', true, details);
  }
}

// 429 Too Many Requests
export class RateLimitException extends BaseException {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
  }
}

// 500 Internal Server Error
export class InternalServerException extends BaseException {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
  }
}

// 502 Bad Gateway
export class ExternalServiceException extends BaseException {
  constructor(service: string, message?: string) {
    const errorMessage = message || `External service '${service}' is unavailable`;
    super(errorMessage, 502, 'EXTERNAL_SERVICE_ERROR', true, { service });
  }
}

// 503 Service Unavailable
export class ServiceUnavailableException extends BaseException {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE', true);
  }
}

// SMM-specific exceptions
export class InsufficientFundsException extends BusinessLogicException {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds. Required: $${required}, Available: $${available}`,
      { required, available }
    );
  }
}

export class OrderProcessingException extends BusinessLogicException {
  constructor(orderId: string, reason: string) {
    super(`Order ${orderId} processing failed: ${reason}`, { orderId, reason });
  }
}

export class ProviderApiException extends ExternalServiceException {
  constructor(provider: string, apiError: string) {
    super(provider, `Provider API error: ${apiError}`);
  }
}

export class ServiceLimitException extends BusinessLogicException {
  constructor(serviceId: number, min: number, max: number, requested: number) {
    super(
      `Service quantity out of range. Min: ${min}, Max: ${max}, Requested: ${requested}`,
      { serviceId, min, max, requested }
    );
  }
}

// Utility function to check if error is operational
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseException) {
    return error.isOperational;
  }
  return false;
}

// Utility function to create API error response
export function createErrorResponse(error: BaseException | Error) {
  if (error instanceof BaseException) {
    return error.toJSON();
  }

  // Handle unknown errors
  return {
    success: false,
    name: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    result: null,
  };
}
