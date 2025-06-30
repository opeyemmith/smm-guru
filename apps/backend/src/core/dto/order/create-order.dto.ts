/**
 * Create Order DTO
 * Data transfer object for order creation requests
 */

import { z } from 'zod';

// Validation schema for order creation
export const createOrderSchema = z.object({
  service: z.number().int().positive('Service ID must be a positive integer'),
  link: z.string().url('Link must be a valid URL'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

// TypeScript type derived from schema
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

// Extended DTO with user context
export interface CreateOrderRequest extends CreateOrderDto {
  userId: string; // Added by authentication middleware
}

// Response DTO for order creation
export interface CreateOrderResponse {
  order: string;
  status: string;
  message: string;
}

// Validation function
export function validateCreateOrderDto(data: unknown): CreateOrderDto {
  return createOrderSchema.parse(data);
}

// Type guard function
export function isValidCreateOrderDto(data: any): data is CreateOrderDto {
  try {
    createOrderSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
