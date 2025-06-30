/**
 * Service Repository Implementation
 * Data access layer for service management
 */

import { BaseRepository } from '../base/base.repository.js';
import { servicesSchema, type ServicesSchema } from '@smm-guru/database';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import type { RepositoryOptions, FindOptions } from '../base/base.repository.js';

export interface ServiceFilters {
  userId?: string;
  category?: string;
  providerId?: number;
  isActive?: boolean;
  currency?: string;
}

export interface ServiceWithCalculatedPrice extends Omit<ServicesSchema, 'rate' | 'profit'> {
  calculatedRate: number;
  originalRate: number;
  profit: number;
}

export class ServiceRepository extends BaseRepository<ServicesSchema> {
  constructor() {
    super(servicesSchema);
  }

  /**
   * Find all services with calculated pricing
   */
  async findAllWithCalculatedPricing(
    options?: RepositoryOptions
  ): Promise<ServiceWithCalculatedPrice[]> {
    const database = options?.transaction || this.db;
    
    const services = await database
      .select({
        id: this.table.id,
        cancel: this.table.cancel,
        category: this.table.category,
        currency: this.table.currency,
        dripfeed: this.table.dripfeed,
        max: this.table.max,
        min: this.table.min,
        name: this.table.name,
        refill: this.table.refill,
        rate: this.table.rate,
        profit: this.table.profit,
        service: this.table.service,
        providerId: this.table.providerId,
        userId: this.table.userId,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
      })
      .from(this.table)
      .orderBy(asc(this.table.id));

    return services.map(service => ({
      ...service,
      calculatedRate: service.rate + (service.profit || 0),
      originalRate: service.rate,
      profit: service.profit || 0,
    }));
  }

  /**
   * Find services by user ID
   */
  async findByUserId(
    userId: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ServicesSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.userId, userId),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find service by ID and user ID (for authorization)
   */
  async findByIdAndUserId(
    serviceId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ServicesSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.id, serviceId),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    return result || null;
  }

  /**
   * Find service by ID and user ID or throw exception
   */
  async findByIdAndUserIdOrFail(
    serviceId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ServicesSchema> {
    const result = await this.findByIdAndUserId(serviceId, userId, options);
    
    if (!result) {
      throw new NotFoundException('Service', serviceId.toString());
    }

    return result;
  }

  /**
   * Find services by provider ID
   */
  async findByProviderId(
    providerId: number,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ServicesSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.providerId, providerId),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find services by category
   */
  async findByCategory(
    category: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ServicesSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.category, category),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find services with filters
   */
  async findWithFilters(
    filters: ServiceFilters,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ServicesSchema[]> {
    const conditions = this.buildFilterConditions(filters);
    
    return this.findMany({
      ...findOptions,
      where: and(conditions, findOptions?.where),
    }, options);
  }

  /**
   * Get service details for order creation
   */
  async getServiceDetailsForOrder(
    serviceId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    service: ServicesSchema;
    calculatedPrice: number;
    providerId: number;
  } | null> {
    const database = options?.transaction || this.db;
    
    const [service] = await database
      .select({
        id: this.table.id,
        service: this.table.service,
        name: this.table.name,
        rate: this.table.rate,
        profit: this.table.profit,
        min: this.table.min,
        max: this.table.max,
        refill: this.table.refill,
        providerId: this.table.providerId,
        currency: this.table.currency,
        category: this.table.category,
        cancel: this.table.cancel,
        dripfeed: this.table.dripfeed,
        userId: this.table.userId,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
      })
      .from(this.table)
      .where(and(
        eq(this.table.id, serviceId),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    if (!service) {
      return null;
    }

    return {
      service,
      calculatedPrice: service.rate + (service.profit || 0),
      providerId: service.providerId,
    };
  }

  /**
   * Calculate order cost for a service
   */
  async calculateOrderCost(
    serviceId: number,
    quantity: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    totalCost: number;
    unitCost: number;
    service: ServicesSchema;
  } | null> {
    const serviceDetails = await this.getServiceDetailsForOrder(serviceId, userId, options);
    
    if (!serviceDetails) {
      return null;
    }

    const unitCost = serviceDetails.calculatedPrice / 1000; // Price per 1000 units
    const totalCost = unitCost * quantity;

    return {
      totalCost,
      unitCost,
      service: serviceDetails.service,
    };
  }

  /**
   * Validate service quantity limits
   */
  async validateQuantityLimits(
    serviceId: number,
    quantity: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    isValid: boolean;
    min: number;
    max: number;
    service: ServicesSchema;
  } | null> {
    const service = await this.findByIdAndUserId(serviceId, userId, options);
    
    if (!service) {
      return null;
    }

    const isValid = quantity >= service.min && quantity <= service.max;

    return {
      isValid,
      min: service.min,
      max: service.max,
      service,
    };
  }

  /**
   * Get popular services by order count
   */
  async getPopularServices(
    limit = 10,
    options?: RepositoryOptions
  ): Promise<Array<ServicesSchema & { orderCount: number }>> {
    const database = options?.transaction || this.db;
    
    // This would require joining with orders table
    // For now, return services ordered by ID (placeholder)
    const services = await this.findMany({
      orderBy: desc(this.table.id),
      limit,
    }, options);

    // Add placeholder order count
    return services.map(service => ({
      ...service,
      orderCount: 0, // This would be calculated from actual orders
    }));
  }

  /**
   * Get services by currency
   */
  async findByCurrency(
    currency: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ServicesSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.currency, currency),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Update service pricing
   */
  async updatePricing(
    serviceId: number,
    rate: number,
    profit?: number,
    options?: RepositoryOptions
  ): Promise<ServicesSchema> {
    const updateData: Partial<ServicesSchema> = {
      rate,
      updated_at: new Date(),
    };

    if (profit !== undefined) {
      updateData.profit = profit;
    }

    return await this.updateByIdOrFail(serviceId, updateData, 'Service', options);
  }

  /**
   * Get service categories
   */
  async getCategories(options?: RepositoryOptions): Promise<string[]> {
    const database = options?.transaction || this.db;
    
    const categories = await database
      .selectDistinct({ category: this.table.category })
      .from(this.table)
      .where(sql`${this.table.category} IS NOT NULL`);

    return categories.map(row => row.category).filter(Boolean);
  }

  // Private helper methods

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: ServiceFilters) {
    const conditions: any[] = [];

    if (filters.userId) {
      conditions.push(eq(this.table.userId, filters.userId));
    }
    if (filters.category) {
      conditions.push(eq(this.table.category, filters.category));
    }
    if (filters.providerId) {
      conditions.push(eq(this.table.providerId, filters.providerId));
    }
    if (filters.currency) {
      conditions.push(eq(this.table.currency, filters.currency));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
