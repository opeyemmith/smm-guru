/**
 * Orders Routes Configuration
 * Defines HTTP routes and middleware for order endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { OrdersController } from './orders.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';
import type { HonoAuthContext } from '../../../shared/types/api.types.js';

// Validation schemas
const createOrderSchema = z.object({
  serviceId: z.number().int().positive('Service ID must be a positive integer'),
  link: z.string().url('Link must be a valid URL'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  metadata: z.record(z.any()).optional(),
});

const bulkUpdateOrdersSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(500).optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
});

// Query parameter validation schemas
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const orderFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  serviceId: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

const statsFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  serviceId: z.string().regex(/^\d+$/).transform(Number).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export function createOrdersRoutes(ordersController: OrdersController) {
  const orders = new Hono<{ Variables: HonoAuthContext }>();

  // Apply authentication middleware to all routes
  orders.use('*', authMiddleware);

  // Apply rate limiting
  orders.use('*', rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each user to 100 requests per windowMs
    message: 'Too many requests from this user, please try again later.',
  }));

  /**
   * @route   POST /orders
   * @desc    Create a new order
   * @access  Private (authenticated users)
   */
  orders.post(
    '/',
    rateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // Limit order creation to 10 per minute
      message: 'Too many order creation attempts, please try again later.',
    }),
    zValidator('json', createOrderSchema),
    async (c) => ordersController.createOrder(c)
  );

  /**
   * @route   GET /orders
   * @desc    Get user's orders with pagination and filtering
   * @access  Private (authenticated users)
   */
  orders.get(
    '/',
    zValidator('query', paginationSchema.merge(orderFiltersSchema)),
    async (c) => ordersController.getUserOrders(c)
  );

  /**
   * @route   GET /orders/stats
   * @desc    Get order statistics
   * @access  Private (admin only)
   */
  orders.get(
    '/stats',
    zValidator('query', statsFiltersSchema),
    async (c) => ordersController.getOrderStats(c)
  );

  /**
   * @route   GET /orders/:id
   * @desc    Get specific order by ID
   * @access  Private (authenticated users - own orders, admin - all orders)
   */
  orders.get(
    '/:id',
    async (c) => ordersController.getOrderById(c)
  );

  /**
   * @route   POST /orders/:id/cancel
   * @desc    Cancel an order
   * @access  Private (authenticated users - own orders, admin - all orders)
   */
  orders.post(
    '/:id/cancel',
    zValidator('json', cancelOrderSchema),
    async (c) => ordersController.cancelOrder(c)
  );

  /**
   * @route   PATCH /orders/:id/status
   * @desc    Update order status
   * @access  Private (admin only)
   */
  orders.patch(
    '/:id/status',
    zValidator('json', updateOrderStatusSchema),
    async (c) => ordersController.updateOrderStatus(c)
  );

  /**
   * @route   PATCH /orders/bulk
   * @desc    Bulk update orders
   * @access  Private (admin only)
   */
  orders.patch(
    '/bulk',
    rateLimitMiddleware({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5, // Limit bulk operations to 5 per 5 minutes
      message: 'Too many bulk operations, please try again later.',
    }),
    zValidator('json', bulkUpdateOrdersSchema),
    async (c) => ordersController.bulkUpdateOrders(c)
  );

  return orders;
}

// Export route factory function
export default createOrdersRoutes;
