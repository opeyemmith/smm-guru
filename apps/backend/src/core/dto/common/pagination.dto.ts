/**
 * Pagination DTOs
 * Common pagination and filtering data transfer objects
 */

import { z } from 'zod';

// Base pagination schema
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Order filters schema
export const orderFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  serviceId: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Service filters schema
export const serviceFiltersSchema = z.object({
  category: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
  providerId: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
});

// Provider filters schema
export const providerFiltersSchema = z.object({
  name: z.string().max(100).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().max(100).optional(),
});

// Combined pagination with filters
export const orderPaginationSchema = paginationSchema.merge(orderFiltersSchema);
export const servicePaginationSchema = paginationSchema.merge(serviceFiltersSchema);
export const providerPaginationSchema = paginationSchema.merge(providerFiltersSchema);

// Type definitions
export type PaginationDto = z.infer<typeof paginationSchema>;
export type OrderFiltersDto = z.infer<typeof orderFiltersSchema>;
export type ServiceFiltersDto = z.infer<typeof serviceFiltersSchema>;
export type ProviderFiltersDto = z.infer<typeof providerFiltersSchema>;
export type OrderPaginationDto = z.infer<typeof orderPaginationSchema>;
export type ServicePaginationDto = z.infer<typeof servicePaginationSchema>;
export type ProviderPaginationDto = z.infer<typeof providerPaginationSchema>;

// Pagination response interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Validation functions
export function validatePagination(data: unknown): PaginationDto {
  return paginationSchema.parse(data);
}

export function validateOrderFilters(data: unknown): OrderFiltersDto {
  return orderFiltersSchema.parse(data);
}

export function validateServiceFilters(data: unknown): ServiceFiltersDto {
  return serviceFiltersSchema.parse(data);
}

export function validateProviderFilters(data: unknown): ProviderFiltersDto {
  return providerFiltersSchema.parse(data);
}

export function validateOrderPagination(data: unknown): OrderPaginationDto {
  return orderPaginationSchema.parse(data);
}

export function validateServicePagination(data: unknown): ServicePaginationDto {
  return servicePaginationSchema.parse(data);
}

export function validateProviderPagination(data: unknown): ProviderPaginationDto {
  return providerPaginationSchema.parse(data);
}

// Helper function to create pagination response
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Helper function to extract pagination parameters
export function extractPaginationParams(query: Record<string, string | undefined>) {
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = Math.min(query.limit ? parseInt(query.limit, 10) : 20, 100);
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';

  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    sortBy,
    sortOrder,
    offset: (Math.max(1, page) - 1) * Math.max(1, limit),
  };
}

// Helper function to extract filter parameters
export function extractOrderFilters(query: Record<string, string | undefined>): OrderFiltersDto {
  return {
    status: query.status as any,
    priority: query.priority as any,
    serviceId: query.serviceId ? parseInt(query.serviceId, 10) : undefined,
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
}

export function extractServiceFilters(query: Record<string, string | undefined>): ServiceFiltersDto {
  return {
    category: query.category,
    currency: query.currency,
    providerId: query.providerId ? parseInt(query.providerId, 10) : undefined,
    search: query.search,
  };
}

export function extractProviderFilters(query: Record<string, string | undefined>): ProviderFiltersDto {
  return {
    name: query.name,
    isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    search: query.search,
  };
}
