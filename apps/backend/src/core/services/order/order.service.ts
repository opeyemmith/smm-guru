/**
 * Order Service - Business Logic Layer
 * Handles all order-related business operations
 */

import { OrderEntity, type OrderStatus, type OrderPriority } from '../../entities/order.entity.js';
import type { IOrderRepository } from '../../repositories/base/repository.interface.js';
import type { IServiceRepository } from '../../repositories/base/repository.interface.js';
import type { IWalletRepository } from '../../repositories/base/repository.interface.js';
import type { IProviderRepository } from '../../repositories/base/repository.interface.js';
import type { ITransactionRepository } from '../../repositories/base/repository.interface.js';
import {
  NotFoundException,
  BusinessLogicException,
  InsufficientFundsException,
  ServiceLimitException,
  OrderProcessingException,
} from '../../../shared/exceptions/base.exception.js';
import type { PaginationQuery, FilterQuery } from '../../../shared/types/api.types.js';

export interface CreateOrderData {
  userId: string;
  serviceId: number;
  link: string;
  quantity: number;
  priority?: OrderPriority;
  notes?: string;
}

export interface OrderFilters extends FilterQuery {
  userId?: string;
  status?: OrderStatus;
  serviceId?: number;
  providerId?: number;
  priority?: OrderPriority;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private serviceRepository: ServiceRepository,
    private userRepository: UserRepository,
    private walletService: WalletService,
    private providerApiService: ProviderApiService,
    private notificationService: NotificationService
  ) {}

  /**
   * Create a new order with full validation and processing
   */
  async createOrder(data: CreateOrderData): Promise<OrderEntity> {
    return await this.orderRepository.transaction(async (tx) => {
      // 1. Validate user exists and is active
      const user = await this.userRepository.findByIdOrFail(data.userId, 'User', { transaction: tx });
      if (user.status !== 'active') {
        throw new BusinessLogicException('User account is not active');
      }

      // 2. Validate service exists and get details
      const service = await this.serviceRepository.findByIdOrFail(data.serviceId, 'Service', { transaction: tx });
      if (!service.isActive) {
        throw new BusinessLogicException('Service is not available');
      }

      // 3. Validate quantity limits
      if (data.quantity < service.min || data.quantity > service.max) {
        throw new ServiceLimitException(service.id, service.min, service.max, data.quantity);
      }

      // 4. Calculate total cost
      const totalCost = this.calculateOrderCost(service.rate, service.profit || 0, data.quantity);

      // 5. Check user balance
      const userBalance = await this.walletService.getUserBalance(data.userId, { transaction: tx });
      if (userBalance < totalCost) {
        throw new InsufficientFundsException(totalCost, userBalance);
      }

      // 6. Create order entity
      const orderEntity = OrderEntity.create({
        userId: data.userId,
        serviceId: data.serviceId,
        providerId: service.providerId,
        link: data.link,
        quantity: data.quantity,
        charge: totalCost,
        status: 'pending',
        priority: data.priority || 'medium',
        notes: data.notes,
      });

      // 7. Save order to database
      const savedOrder = await this.orderRepository.create(orderEntity.toJSON(), { transaction: tx });

      // 8. Deduct amount from user wallet
      await this.walletService.deductFunds(
        data.userId,
        totalCost,
        `Order #${savedOrder.id}`,
        { transaction: tx }
      );

      // 9. Submit order to provider (async)
      this.submitOrderToProvider(savedOrder.id).catch(error => {
        console.error(`Failed to submit order ${savedOrder.id} to provider:`, error);
        // Handle provider submission failure
        this.handleProviderSubmissionFailure(savedOrder.id, error.message);
      });

      // 10. Send notification
      await this.notificationService.sendOrderCreatedNotification(user.email, savedOrder);

      return OrderEntity.fromDatabase(savedOrder);
    });
  }

  /**
   * Get order by ID with authorization check
   */
  async getOrderById(orderId: string, userId?: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findByIdOrFail(orderId, 'Order');
    
    // Check authorization (users can only see their own orders, admins can see all)
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Order', orderId);
    }

    return OrderEntity.fromDatabase(order);
  }

  /**
   * Get paginated orders with filtering
   */
  async getOrders(
    pagination: PaginationQuery,
    filters: OrderFilters = {},
    userId?: string
  ) {
    // Add user filter for non-admin users
    if (userId) {
      filters.userId = userId;
    }

    const whereConditions = this.buildOrderFilters(filters);
    
    return await this.orderRepository.findPaginated(
      pagination,
      { where: whereConditions, orderBy: this.orderRepository.buildOrderBy(pagination) }
    );
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    metadata?: Record<string, any>
  ): Promise<OrderEntity> {
    return await this.orderRepository.transaction(async (tx) => {
      const orderData = await this.orderRepository.findByIdOrFail(orderId, 'Order', { transaction: tx });
      const orderEntity = OrderEntity.fromDatabase(orderData);

      // Validate status transition
      orderEntity.updateStatus(newStatus, metadata);

      // Handle status-specific logic
      await this.handleStatusChange(orderEntity, tx);

      // Save updated order
      const updatedOrder = await this.orderRepository.updateById(
        orderId,
        orderEntity.toJSON(),
        { transaction: tx }
      );

      return OrderEntity.fromDatabase(updatedOrder!);
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId?: string, reason?: string): Promise<OrderEntity> {
    return await this.orderRepository.transaction(async (tx) => {
      const orderData = await this.orderRepository.findByIdOrFail(orderId, 'Order', { transaction: tx });
      const orderEntity = OrderEntity.fromDatabase(orderData);

      // Check authorization
      if (userId && orderEntity.userId !== userId) {
        throw new NotFoundException('Order', orderId);
      }

      // Check if order can be cancelled
      if (!orderEntity.canBeCancelled()) {
        throw new BusinessLogicException(`Order cannot be cancelled in ${orderEntity.status} status`);
      }

      // Update order status
      orderEntity.updateStatus('cancelled', { reason });

      // Refund user
      await this.walletService.addFunds(
        orderEntity.userId,
        orderEntity.charge,
        `Refund for cancelled order #${orderId}`,
        { transaction: tx }
      );

      // Cancel with provider if order was submitted
      if (orderEntity.providerOrderId) {
        this.cancelOrderWithProvider(orderEntity.providerOrderId, orderEntity.providerId)
          .catch(error => {
            console.error(`Failed to cancel order ${orderId} with provider:`, error);
          });
      }

      // Save updated order
      const updatedOrder = await this.orderRepository.updateById(
        orderId,
        orderEntity.toJSON(),
        { transaction: tx }
      );

      return OrderEntity.fromDatabase(updatedOrder!);
    });
  }

  /**
   * Get order statistics
   */
  async getOrderStats(filters: OrderFilters = {}): Promise<OrderStats> {
    const whereConditions = this.buildOrderFilters(filters);
    
    const [
      total,
      pending,
      processing,
      completed,
      failed,
      cancelled,
      revenueResult
    ] = await Promise.all([
      this.orderRepository.count(whereConditions),
      this.orderRepository.count({ ...whereConditions, status: 'pending' }),
      this.orderRepository.count({ ...whereConditions, status: 'processing' }),
      this.orderRepository.count({ ...whereConditions, status: 'completed' }),
      this.orderRepository.count({ ...whereConditions, status: 'failed' }),
      this.orderRepository.count({ ...whereConditions, status: 'cancelled' }),
      this.orderRepository.getTotalRevenue(whereConditions),
    ]);

    const totalRevenue = revenueResult || 0;
    const averageOrderValue = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      cancelled,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(
    orderIds: string[],
    updates: Partial<{ status: OrderStatus; priority: OrderPriority; notes: string }>,
    userId?: string
  ): Promise<OrderEntity[]> {
    return await this.orderRepository.transaction(async (tx) => {
      const orders = await this.orderRepository.findByIds(orderIds, { transaction: tx });
      
      // Check authorization
      if (userId) {
        const unauthorizedOrder = orders.find(order => order.userId !== userId);
        if (unauthorizedOrder) {
          throw new NotFoundException('Order', unauthorizedOrder.id);
        }
      }

      const updatedOrders: OrderEntity[] = [];

      for (const orderData of orders) {
        const orderEntity = OrderEntity.fromDatabase(orderData);
        
        // Apply updates
        if (updates.status) {
          orderEntity.updateStatus(updates.status);
        }
        if (updates.priority) {
          orderEntity.updatePriority(updates.priority);
        }
        if (updates.notes) {
          orderEntity.addNotes(updates.notes);
        }

        const updatedOrder = await this.orderRepository.updateById(
          orderEntity.id,
          orderEntity.toJSON(),
          { transaction: tx }
        );

        updatedOrders.push(OrderEntity.fromDatabase(updatedOrder!));
      }

      return updatedOrders;
    });
  }

  // Private helper methods

  private calculateOrderCost(rate: number, profit: number, quantity: number): number {
    return (rate + profit) * quantity;
  }

  private async submitOrderToProvider(orderId: string): Promise<void> {
    try {
      const orderData = await this.orderRepository.findByIdOrFail(orderId, 'Order');
      const orderEntity = OrderEntity.fromDatabase(orderData);

      const providerOrderId = await this.providerApiService.submitOrder({
        serviceId: orderEntity.serviceId,
        link: orderEntity.link,
        quantity: orderEntity.quantity,
        providerId: orderEntity.providerId,
      });

      // Update order with provider order ID and set to processing
      orderEntity.setProviderOrderId(providerOrderId);
      orderEntity.updateStatus('processing');

      await this.orderRepository.updateById(orderId, orderEntity.toJSON());
    } catch (error) {
      throw new OrderProcessingException(orderId, error.message);
    }
  }

  private async handleProviderSubmissionFailure(orderId: string, reason: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'failed', { reason });
    
    // Refund user
    const orderData = await this.orderRepository.findById(orderId);
    if (orderData) {
      await this.walletService.addFunds(
        orderData.userId,
        orderData.charge,
        `Refund for failed order #${orderId}`
      );
    }
  }

  private async cancelOrderWithProvider(providerOrderId: string, providerId: number): Promise<void> {
    try {
      await this.providerApiService.cancelOrder(providerOrderId, providerId);
    } catch (error) {
      console.error(`Failed to cancel order ${providerOrderId} with provider ${providerId}:`, error);
    }
  }

  private async handleStatusChange(orderEntity: OrderEntity, tx: any): Promise<void> {
    // Handle status-specific business logic
    switch (orderEntity.status) {
      case 'completed':
        await this.notificationService.sendOrderCompletedNotification(orderEntity);
        break;
      case 'failed':
        await this.notificationService.sendOrderFailedNotification(orderEntity);
        break;
      case 'cancelled':
        await this.notificationService.sendOrderCancelledNotification(orderEntity);
        break;
    }
  }

  private buildOrderFilters(filters: OrderFilters) {
    // Implementation would build Drizzle where conditions based on filters
    // This is a simplified version
    const conditions: any[] = [];

    if (filters.userId) {
      conditions.push(eq(this.orderRepository.table.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(this.orderRepository.table.status, filters.status));
    }
    if (filters.serviceId) {
      conditions.push(eq(this.orderRepository.table.serviceId, filters.serviceId));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
