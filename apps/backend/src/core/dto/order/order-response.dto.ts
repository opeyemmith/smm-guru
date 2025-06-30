/**
 * Order Response DTOs
 * Standardized response formats for order-related endpoints
 */

import { z } from 'zod';

// Order status response DTO
export interface OrderStatusResponse {
  charge: number;
  status: string;
  currency: string;
  start_count?: number;
  remains?: number;
}

// Detailed order response DTO
export interface OrderDetailResponse {
  id: string;
  userId: string;
  service: number;
  serviceName: string;
  link: string;
  quantity: number;
  price: number;
  status: string;
  priority: string;
  startCount?: number;
  remains?: number;
  refill: boolean;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionPercentage: number;
  estimatedCompletion?: string;
  canBeCancelled: boolean;
  provider?: {
    id: number;
    name: string;
  };
}

// Order list item response DTO
export interface OrderListItemResponse {
  id: string;
  service: number;
  serviceName: string;
  status: string;
  priority: string;
  quantity: number;
  price: number;
  link: string;
  startCount?: number;
  remains?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionPercentage: number;
}

// Service list response DTO
export interface ServiceListResponse {
  service: number;
  cancel: boolean;
  category: string;
  currency: string;
  dripfeed: boolean;
  max: number;
  min: number;
  name: string;
  refill: boolean;
  rate: number;
}

// Balance response DTO
export interface BalanceResponse {
  balance: string;
  currency: string;
}

// Order statistics response DTO
export interface OrderStatsResponse {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Validation schemas
export const orderStatusRequestSchema = z.object({
  order: z.string().uuid('Order ID must be a valid UUID'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  metadata: z.record(z.any()).optional(),
});

export const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(500).optional(),
});

// Type definitions
export type OrderStatusRequest = z.infer<typeof orderStatusRequestSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type BulkOrderUpdateDto = z.infer<typeof bulkOrderUpdateSchema>;

// Validation functions
export function validateOrderStatusRequest(data: unknown): OrderStatusRequest {
  return orderStatusRequestSchema.parse(data);
}

export function validateUpdateOrderStatus(data: unknown): UpdateOrderStatusDto {
  return updateOrderStatusSchema.parse(data);
}

export function validateBulkOrderUpdate(data: unknown): BulkOrderUpdateDto {
  return bulkOrderUpdateSchema.parse(data);
}
