/**
 * Orders Controller - API Layer
 * Handles HTTP requests and responses for order management
 */

import type { Context } from 'hono';
import { OrderService } from '../../../core/services/order/order.service.js';
import { 
  sendSuccess, 
  sendError, 
  sendPaginated, 
  handleException,
  validatePagination,
  validateSorting 
} from '../../../shared/utils/response.util.js';
import { 
  ValidationException,
  UnauthorizedException,
  ForbiddenException 
} from '../../../shared/exceptions/base.exception.js';
import type { HonoAuthContext } from '../../../shared/types/api.types.js';

export class OrdersController {
  constructor(private orderService: OrderService) {}

  /**
   * Create a new order
   * POST /api/v1/orders
   */
  async createOrder(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const body = await c.req.json();
      
      // Validate required fields
      if (!body.serviceId || !body.link || !body.quantity) {
        throw new ValidationException('Missing required fields: serviceId, link, quantity');
      }

      // Validate quantity is positive
      if (body.quantity <= 0) {
        throw new ValidationException('Quantity must be greater than 0');
      }

      // Validate link format (basic URL validation)
      try {
        new URL(body.link);
      } catch {
        throw new ValidationException('Invalid URL format for link');
      }

      const orderData = {
        userId: user.id,
        serviceId: parseInt(body.serviceId),
        link: body.link,
        quantity: parseInt(body.quantity),
        priority: body.priority || 'medium',
        notes: body.notes,
      };

      const order = await this.orderService.createOrder(orderData);

      return sendSuccess(
        c,
        'ORDER_CREATED',
        'Order created successfully',
        {
          id: order.id,
          status: order.status,
          charge: order.charge,
          quantity: order.quantity,
          createdAt: order.createdAt,
        },
        201
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get user's orders with pagination and filtering
   * GET /api/v1/orders
   */
  async getUserOrders(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      // Extract and validate pagination parameters
      const { page, limit } = validatePagination(
        c.req.query('page'),
        c.req.query('limit')
      );

      // Extract and validate sorting parameters
      const { sortBy, sortOrder } = validateSorting(
        c.req.query('sortBy'),
        c.req.query('sortOrder')
      );

      // Extract filters
      const filters = {
        status: c.req.query('status'),
        serviceId: c.req.query('serviceId') ? parseInt(c.req.query('serviceId')!) : undefined,
        search: c.req.query('search'),
        dateFrom: c.req.query('dateFrom'),
        dateTo: c.req.query('dateTo'),
      };

      const result = await this.orderService.getOrders(
        { page, limit, sortBy, sortOrder },
        filters,
        user.id // User can only see their own orders
      );

      return sendPaginated(
        c,
        result.data.map(order => ({
          id: order.id,
          serviceId: order.serviceId,
          status: order.status,
          priority: order.priority,
          quantity: order.quantity,
          charge: order.charge,
          link: order.link,
          startCount: order.startCount,
          remains: order.remains,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          completedAt: order.completedAt,
        })),
        result.page,
        result.limit,
        result.total,
        'ORDERS_RETRIEVED',
        'Orders retrieved successfully'
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get specific order by ID
   * GET /api/v1/orders/:id
   */
  async getOrderById(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const orderId = c.req.param('id');
      if (!orderId) {
        throw new ValidationException('Order ID is required');
      }

      const order = await this.orderService.getOrderById(
        orderId,
        user.role === 'admin' ? undefined : user.id
      );

      return sendSuccess(
        c,
        'ORDER_RETRIEVED',
        'Order retrieved successfully',
        {
          id: order.id,
          userId: order.userId,
          serviceId: order.serviceId,
          providerId: order.providerId,
          providerOrderId: order.providerOrderId,
          status: order.status,
          priority: order.priority,
          quantity: order.quantity,
          charge: order.charge,
          link: order.link,
          startCount: order.startCount,
          remains: order.remains,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          completedAt: order.completedAt,
          completionPercentage: order.getCompletionPercentage(),
          estimatedCompletion: order.getEstimatedCompletionTime(),
          canBeCancelled: order.canBeCancelled(),
        }
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Cancel an order
   * POST /api/v1/orders/:id/cancel
   */
  async cancelOrder(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const orderId = c.req.param('id');
      if (!orderId) {
        throw new ValidationException('Order ID is required');
      }

      const body = await c.req.json().catch(() => ({}));
      const reason = body.reason || 'Cancelled by user';

      const order = await this.orderService.cancelOrder(
        orderId,
        user.role === 'admin' ? undefined : user.id,
        reason
      );

      return sendSuccess(
        c,
        'ORDER_CANCELLED',
        'Order cancelled successfully',
        {
          id: order.id,
          status: order.status,
          cancelledAt: order.cancelledAt,
        }
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get order statistics (admin only)
   * GET /api/v1/orders/stats
   */
  async getOrderStats(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      // Extract filters for stats
      const filters = {
        userId: c.req.query('userId'),
        status: c.req.query('status'),
        serviceId: c.req.query('serviceId') ? parseInt(c.req.query('serviceId')!) : undefined,
        dateFrom: c.req.query('dateFrom'),
        dateTo: c.req.query('dateTo'),
      };

      const stats = await this.orderService.getOrderStats(filters);

      return sendSuccess(
        c,
        'ORDER_STATS_RETRIEVED',
        'Order statistics retrieved successfully',
        stats
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Update order status (admin only)
   * PATCH /api/v1/orders/:id/status
   */
  async updateOrderStatus(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      const orderId = c.req.param('id');
      if (!orderId) {
        throw new ValidationException('Order ID is required');
      }

      const body = await c.req.json();
      if (!body.status) {
        throw new ValidationException('Status is required');
      }

      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        throw new ValidationException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const order = await this.orderService.updateOrderStatus(
        orderId,
        body.status,
        body.metadata
      );

      return sendSuccess(
        c,
        'ORDER_STATUS_UPDATED',
        'Order status updated successfully',
        {
          id: order.id,
          status: order.status,
          updatedAt: order.updatedAt,
        }
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Bulk update orders (admin only)
   * PATCH /api/v1/orders/bulk
   */
  async bulkUpdateOrders(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      const body = await c.req.json();
      if (!body.orderIds || !Array.isArray(body.orderIds) || body.orderIds.length === 0) {
        throw new ValidationException('orderIds array is required and cannot be empty');
      }

      if (body.orderIds.length > 100) {
        throw new ValidationException('Cannot update more than 100 orders at once');
      }

      const updates = {
        status: body.status,
        priority: body.priority,
        notes: body.notes,
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationException('At least one update field is required');
      }

      const orders = await this.orderService.bulkUpdateOrders(body.orderIds, updates);

      return sendSuccess(
        c,
        'ORDERS_BULK_UPDATED',
        `${orders.length} orders updated successfully`,
        {
          updatedCount: orders.length,
          orderIds: orders.map(order => order.id),
        }
      );
    } catch (error) {
      return handleException(c, error);
    }
  }
}
