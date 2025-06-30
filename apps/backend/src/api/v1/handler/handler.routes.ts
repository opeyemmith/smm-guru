/**
 * Handler Routes - Migrated and Enhanced
 * Maintains backward compatibility while adding new enterprise features
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HandlerController } from './handler.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';
import type { HonoAuthContext } from '../../../shared/types/api.types.js';

// Validation schemas for backward compatibility
const handlerRequestSchema = z.object({
  action: z.enum(['services', 'add', 'status', 'balance']),
  service: z.number().int().positive().optional(),
  link: z.string().url().optional(),
  quantity: z.number().int().positive().optional(),
  order: z.string().uuid().optional(),
});

// Query parameter schemas
const recentOrdersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export function createHandlerRoutes(handlerController: HandlerController) {
  const handler = new Hono<{ Variables: HonoAuthContext }>();

  // Apply authentication middleware to all routes
  handler.use('*', authMiddleware);

  // Apply rate limiting with different limits for different operations
  handler.use('*', rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Higher limit for handler endpoints
    message: 'Too many requests from this user, please try again later.',
  }));

  /**
   * @route   POST /handler
   * @desc    Main handler endpoint (backward compatibility)
   * @access  Private (authenticated users)
   * @body    { action: 'services' | 'add' | 'status' | 'balance', ... }
   */
  handler.post(
    '/',
    // More restrictive rate limiting for order creation
    rateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 requests per minute
      message: 'Too many handler requests, please try again later.',
      keyGenerator: (c) => {
        const body = c.get('parsedBody') || {};
        const user = c.get('user');
        // Different limits for different actions
        if (body.action === 'add') {
          return `order_creation_${user?.id}`;
        }
        return `handler_${user?.id}`;
      },
    }),
    zValidator('json', handlerRequestSchema),
    async (c) => handlerController.handleRequest(c)
  );

  /**
   * @route   GET /handler/health
   * @desc    Health check for handler service
   * @access  Private (authenticated users)
   */
  handler.get(
    '/health',
    async (c) => handlerController.healthCheck(c)
  );

  /**
   * @route   GET /handler/orders/:id
   * @desc    Get detailed order information
   * @access  Private (authenticated users - own orders only)
   */
  handler.get(
    '/orders/:id',
    async (c) => handlerController.getOrderDetails(c)
  );

  /**
   * @route   GET /handler/orders/recent
   * @desc    Get user's recent orders
   * @access  Private (authenticated users)
   */
  handler.get(
    '/orders/recent',
    zValidator('query', recentOrdersQuerySchema),
    async (c) => handlerController.getRecentOrders(c)
  );

  /**
   * @route   GET /handler/stats
   * @desc    Get user order statistics
   * @access  Private (authenticated users)
   */
  handler.get(
    '/stats',
    async (c) => handlerController.getOrderStats(c)
  );

  return handler;
}

// Export route factory function
export default createHandlerRoutes;
