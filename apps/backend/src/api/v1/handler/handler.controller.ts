/**
 * Handler Controller - Migrated from handler.route.ts
 * Maintains backward compatibility while using new service layer
 */

import type { Context } from 'hono';
import { OrderManagementService } from '../../../core/services/order/order-management.service.js';
import { 
  sendSuccess, 
  sendError, 
  handleException 
} from '../../../shared/utils/response.util.js';
import { 
  ValidationException,
  UnauthorizedException 
} from '../../../shared/exceptions/base.exception.js';
import type { HonoAuthContext } from '../../../shared/types/api.types.js';
import { 
  validateCreateOrderDto,
  type CreateOrderRequest 
} from '../../../core/dto/order/create-order.dto.js';
import {
  validateOrderStatusRequest,
  type OrderStatusRequest,
  type ServiceListResponse,
  type OrderStatusResponse,
  type BalanceResponse
} from '../../../core/dto/order/order-response.dto.js';

export class HandlerController {
  constructor(
    private orderManagementService: OrderManagementService
  ) {}

  /**
   * Main handler endpoint - maintains backward compatibility
   * POST /api/v1/handler
   */
  async handleRequest(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const body = await c.req.json();
      
      if (!body.action) {
        throw new ValidationException('Action is required');
      }

      // Route to appropriate service method based on action
      switch (body.action) {
        case 'services':
          return await this.getServices(c);
          
        case 'add':
          return await this.createOrder(c, body, user.id);
          
        case 'status':
          return await this.getOrderStatus(c, body, user.id);
          
        case 'balance':
          return await this.getBalance(c, user.id);
          
        default:
          throw new ValidationException(`Unknown action: ${body.action}`);
      }
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get all services with calculated pricing
   * Migrated from: body.action === "services"
   */
  private async getServices(c: Context): Promise<Response> {
    try {
      const services = await this.orderManagementService.getServicesWithPricing();
      
      return sendSuccess(
        c,
        'SERVICES_RETRIEVED',
        'Services retrieved successfully',
        services
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Create a new order
   * Migrated from: body.action === "add"
   */
  private async createOrder(c: Context, body: any, userId: string): Promise<Response> {
    try {
      // Validate required fields
      if (!body.service || !body.link || !body.quantity) {
        throw new ValidationException('Missing required fields: service, link, quantity');
      }

      // Validate data types and constraints
      const orderData = validateCreateOrderDto({
        service: Number(body.service),
        link: body.link,
        quantity: Number(body.quantity),
        priority: body.priority || 'medium',
        notes: body.notes,
      });

      // Create order request with user context
      const createOrderRequest: CreateOrderRequest = {
        ...orderData,
        userId,
      };

      // Process order through service layer
      const result = await this.orderManagementService.createOrder(createOrderRequest);

      return sendSuccess(
        c,
        'ORDER_CREATED',
        'Order created successfully',
        result,
        201
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get order status by ID
   * Migrated from: body.action === "status"
   */
  private async getOrderStatus(c: Context, body: any, userId: string): Promise<Response> {
    try {
      // Validate required fields
      if (!body.order) {
        throw new ValidationException('Order ID is required');
      }

      // Validate order ID format
      const statusRequest = validateOrderStatusRequest({
        order: body.order,
      });

      // Get order status through service layer
      const orderStatus = await this.orderManagementService.getOrderStatus({
        ...statusRequest,
        userId,
      });

      return sendSuccess(
        c,
        'ORDER_STATUS_RETRIEVED',
        'Order status retrieved successfully',
        orderStatus
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get user wallet balance
   * Migrated from: body.action === "balance"
   */
  private async getBalance(c: Context, userId: string): Promise<Response> {
    try {
      const balance = await this.orderManagementService.getUserBalance(userId);

      return sendSuccess(
        c,
        'BALANCE_RETRIEVED',
        'Balance retrieved successfully',
        balance
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get order details (new endpoint)
   * GET /api/v1/handler/orders/:id
   */
  async getOrderDetails(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const orderId = c.req.param('id');
      if (!orderId) {
        throw new ValidationException('Order ID is required');
      }

      const orderDetails = await this.orderManagementService.getOrderDetails(orderId, user.id);

      return sendSuccess(
        c,
        'ORDER_DETAILS_RETRIEVED',
        'Order details retrieved successfully',
        orderDetails
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get user's recent orders (new endpoint)
   * GET /api/v1/handler/orders/recent
   */
  async getRecentOrders(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 10;
      const validLimit = Math.min(Math.max(1, limit), 50); // Between 1 and 50

      const recentOrders = await this.orderManagementService.getUserRecentOrders(
        user.id,
        validLimit
      );

      return sendSuccess(
        c,
        'RECENT_ORDERS_RETRIEVED',
        'Recent orders retrieved successfully',
        recentOrders
      );
    } catch (error) {
      return handleException(c, error);
    }
  }

  /**
   * Get user order statistics (new endpoint)
   * GET /api/v1/handler/stats
   */
  async getOrderStats(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as HonoAuthContext['user'];
      if (!user) {
        throw new UnauthorizedException();
      }

      const stats = await this.orderManagementService.getUserOrderStats(user.id);

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
   * Health check for handler service
   * GET /api/v1/handler/health
   */
  async healthCheck(c: Context): Promise<Response> {
    try {
      return sendSuccess(
        c,
        'HANDLER_HEALTH_OK',
        'Handler service is healthy',
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0', // Updated version after migration
          features: [
            'order_creation',
            'order_status_check',
            'balance_inquiry',
            'service_listing',
            'order_details',
            'recent_orders',
            'order_statistics'
          ]
        }
      );
    } catch (error) {
      return handleException(c, error);
    }
  }
}
