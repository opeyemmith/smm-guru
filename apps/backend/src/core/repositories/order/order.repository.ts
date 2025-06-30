/**
 * Order Repository Implementation
 * Data access layer for order management with enterprise patterns
 */

import { BaseRepository } from '../base/base.repository.js';
import { orderSchema, type OrderSchema } from '@smm-guru/database';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import type { RepositoryOptions, FindOptions } from '../base/base.repository.js';
import { NotFoundException } from '../../../shared/exceptions/base.exception.js';

export interface OrderFilters {
  userId?: string;
  status?: string;
  serviceId?: number;
  providerId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface OrderStats {
  total: number;
  totalRevenue: number;
  statusCounts: Record<string, number>;
}

export class OrderRepository extends BaseRepository<OrderSchema> {
  constructor() {
    super(orderSchema);
  }

  /**
   * Find orders by user ID with pagination
   */
  async findByUserId(
    userId: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.userId, userId),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find order by ID and user ID (for authorization)
   */
  async findByIdAndUserId(
    orderId: string,
    userId: string,
    options?: RepositoryOptions
  ): Promise<OrderSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.id, orderId),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    return result || null;
  }

  /**
   * Find order by ID and user ID or throw exception
   */
  async findByIdAndUserIdOrFail(
    orderId: string,
    userId: string,
    options?: RepositoryOptions
  ): Promise<OrderSchema> {
    const result = await this.findByIdAndUserId(orderId, userId, options);
    
    if (!result) {
      throw new NotFoundException('Order', orderId);
    }

    return result;
  }

  /**
   * Find orders by provider order ID
   */
  async findByProviderOrderId(
    providerOrderId: number,
    options?: RepositoryOptions
  ): Promise<OrderSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(eq(this.table.providerOrderId, providerOrderId))
      .limit(1);

    return result || null;
  }

  /**
   * Find orders by status
   */
  async findByStatus(
    status: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.status, status),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find orders by service ID
   */
  async findByServiceId(
    serviceId: number,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.service, serviceId),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find orders with filters
   */
  async findWithFilters(
    filters: OrderFilters,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    const conditions = this.buildFilterConditions(filters);
    
    return this.findMany({
      ...findOptions,
      where: and(conditions, findOptions?.where),
    }, options);
  }

  /**
   * Get order statistics
   */
  async getOrderStats(
    filters: OrderFilters = {},
    options?: RepositoryOptions
  ): Promise<OrderStats> {
    const database = options?.transaction || this.db;
    const conditions = this.buildFilterConditions(filters);

    // Get total count and revenue
    const [totalResult] = await database
      .select({
        total: count(),
        totalRevenue: sql<number>`COALESCE(SUM(${this.table.price}), 0)`,
      })
      .from(this.table)
      .where(conditions);

    // Get status counts
    const statusResults = await database
      .select({
        status: this.table.status,
        count: count(),
      })
      .from(this.table)
      .where(conditions)
      .groupBy(this.table.status);

    const statusCounts = statusResults.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalResult.total,
      totalRevenue: totalResult.totalRevenue,
      statusCounts,
    };
  }

  /**
   * Get total revenue for completed orders
   */
  async getTotalRevenue(
    filters: OrderFilters = {},
    options?: RepositoryOptions
  ): Promise<number> {
    const database = options?.transaction || this.db;
    const conditions = and(
      eq(this.table.status, 'COMPLETED'),
      this.buildFilterConditions(filters)
    );

    const [result] = await database
      .select({
        revenue: sql<number>`COALESCE(SUM(${this.table.price}), 0)`,
      })
      .from(this.table)
      .where(conditions);

    return result.revenue;
  }

  /**
   * Find pending orders for status updates
   */
  async findPendingOrders(
    limit?: number,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    return this.findMany({
      where: eq(this.table.status, 'PENDING'),
      orderBy: asc(this.table.created_at),
      limit: limit || 100,
    }, options);
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    status: string,
    metadata?: Record<string, any>,
    options?: RepositoryOptions
  ): Promise<OrderSchema> {
    const updateData: Partial<OrderSchema> = {
      status,
      updated_at: new Date(),
    };

    // Add status-specific fields
    if (status === 'COMPLETED') {
      updateData.completed_at = new Date();
    } else if (status === 'FAILED') {
      updateData.failed_at = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date();
    }

    return await this.updateByIdOrFail(orderId, updateData, 'Order', options);
  }

  /**
   * Update order progress
   */
  async updateProgress(
    orderId: string,
    startCount?: number,
    remains?: number,
    options?: RepositoryOptions
  ): Promise<OrderSchema> {
    const updateData: Partial<OrderSchema> = {
      updated_at: new Date(),
    };

    if (startCount !== undefined) {
      updateData.start_count = startCount;
    }
    if (remains !== undefined) {
      updateData.remains = remains;
    }

    return await this.updateByIdOrFail(orderId, updateData, 'Order', options);
  }

  /**
   * Find orders by multiple IDs
   */
  async findByIds(
    orderIds: string[],
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    const database = options?.transaction || this.db;
    
    return await database
      .select()
      .from(this.table)
      .where(sql`${this.table.id} = ANY(${orderIds})`);
  }

  /**
   * Get recent orders for a user
   */
  async getRecentOrdersByUserId(
    userId: string,
    limit = 10,
    options?: RepositoryOptions
  ): Promise<OrderSchema[]> {
    return this.findMany({
      where: eq(this.table.userId, userId),
      orderBy: desc(this.table.created_at),
      limit,
    }, options);
  }

  /**
   * Count orders by user and status
   */
  async countByUserAndStatus(
    userId: string,
    status: string,
    options?: RepositoryOptions
  ): Promise<number> {
    return this.count(
      and(
        eq(this.table.userId, userId),
        eq(this.table.status, status)
      ),
      options
    );
  }

  // Private helper methods

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: OrderFilters) {
    const conditions: any[] = [];

    if (filters.userId) {
      conditions.push(eq(this.table.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(this.table.status, filters.status));
    }
    if (filters.serviceId) {
      conditions.push(eq(this.table.service, filters.serviceId));
    }
    if (filters.dateFrom) {
      conditions.push(sql`${this.table.created_at} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${this.table.created_at} <= ${filters.dateTo}`);
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
