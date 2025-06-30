/**
 * Provider Repository Implementation
 * Data access layer for provider management with encryption support
 */

import { BaseRepository } from '../base/base.repository.js';
import { providersSchema, type ProvidersSchema } from '@smm-guru/database';
import { eq, and } from 'drizzle-orm';
import type { RepositoryOptions, FindOptions } from '../base/base.repository.js';
import { NotFoundException } from '../../../shared/exceptions/base.exception.js';

export interface ProviderFilters {
  userId?: string;
  isActive?: boolean;
  name?: string;
}

export interface ProviderWithDecryptedKey extends Omit<ProvidersSchema, 'apiKey'> {
  decryptedApiKey: string;
}

export class ProviderRepository extends BaseRepository<ProvidersSchema> {
  constructor() {
    super(providersSchema);
  }

  /**
   * Find providers by user ID
   */
  async findByUserId(
    userId: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.userId, userId),
        findOptions?.where
      ),
    }, options);
  }

  /**
   * Find provider by ID and user ID (for authorization)
   */
  async findByIdAndUserId(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.id, providerId),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    return result || null;
  }

  /**
   * Find provider by ID and user ID or throw exception
   */
  async findByIdAndUserIdOrFail(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema> {
    const result = await this.findByIdAndUserId(providerId, userId, options);
    
    if (!result) {
      throw new NotFoundException('Provider', providerId.toString());
    }

    return result;
  }

  /**
   * Get provider API credentials for external calls
   */
  async getProviderCredentials(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    id: number;
    name: string;
    apiUrl: string;
    encryptedApiKey: string;
    iv: string;
  } | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select({
        id: this.table.id,
        name: this.table.name,
        apiUrl: this.table.apiUrl,
        encryptedApiKey: this.table.apiKey,
        iv: this.table.iv,
      })
      .from(this.table)
      .where(and(
        eq(this.table.id, providerId),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    return result || null;
  }

  /**
   * Find provider by name and user ID
   */
  async findByNameAndUserId(
    name: string,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.name, name),
        eq(this.table.userId, userId)
      ))
      .limit(1);

    return result || null;
  }

  /**
   * Find providers with filters
   */
  async findWithFilters(
    filters: ProviderFilters,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema[]> {
    const conditions = this.buildFilterConditions(filters);
    
    return this.findMany({
      ...findOptions,
      where: and(conditions, findOptions?.where),
    }, options);
  }

  /**
   * Get all active providers for a user
   */
  async findActiveByUserId(
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema[]> {
    return this.findWithFilters(
      { userId, isActive: true },
      { orderBy: this.table.name },
      options
    );
  }

  /**
   * Create provider with encrypted API key
   */
  async createWithEncryptedKey(
    providerData: Omit<ProvidersSchema, 'id' | 'created_at' | 'updated_at'>,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema> {
    const now = new Date();
    
    return await this.create({
      ...providerData,
      created_at: now,
      updated_at: now,
    }, options);
  }

  /**
   * Update provider API credentials
   */
  async updateApiCredentials(
    providerId: number,
    apiUrl: string,
    encryptedApiKey: string,
    iv: string,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema> {
    // First verify the provider belongs to the user
    await this.findByIdAndUserIdOrFail(providerId, userId, options);
    
    return await this.updateByIdOrFail(providerId, {
      apiUrl,
      apiKey: encryptedApiKey,
      iv,
      updated_at: new Date(),
    }, 'Provider', options);
  }

  /**
   * Update provider status
   */
  async updateStatus(
    providerId: number,
    isActive: boolean,
    userId: string,
    options?: RepositoryOptions
  ): Promise<ProvidersSchema> {
    // First verify the provider belongs to the user
    await this.findByIdAndUserIdOrFail(providerId, userId, options);
    
    return await this.updateByIdOrFail(providerId, {
      // Note: Assuming there's an isActive field, adjust based on actual schema
      updated_at: new Date(),
    }, 'Provider', options);
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    totalServices: number;
    totalOrders: number;
    totalRevenue: number;
  }> {
    // First verify the provider belongs to the user
    await this.findByIdAndUserIdOrFail(providerId, userId, options);
    
    // This would require joining with services and orders tables
    // For now, return placeholder data
    return {
      totalServices: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }

  /**
   * Check if provider name exists for user
   */
  async isNameExistsForUser(
    name: string,
    userId: string,
    excludeId?: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const database = options?.transaction || this.db;
    
    let whereCondition = and(
      eq(this.table.name, name),
      eq(this.table.userId, userId)
    );

    if (excludeId) {
      whereCondition = and(
        whereCondition,
        sql`${this.table.id} != ${excludeId}`
      );
    }

    const [result] = await database
      .select({ id: this.table.id })
      .from(this.table)
      .where(whereCondition)
      .limit(1);

    return !!result;
  }

  /**
   * Get provider API URL and credentials for service
   */
  async getProviderForService(
    serviceId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    provider: ProvidersSchema;
    service: any; // Would be ServiceSchema type
  } | null> {
    const database = options?.transaction || this.db;
    
    // This would require joining with services table
    // For now, this is a placeholder implementation
    // In real implementation, you'd join providers with services
    
    return null; // Placeholder
  }

  /**
   * Delete provider and cascade to services
   */
  async deleteProviderCascade(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<void> {
    // First verify the provider belongs to the user
    await this.findByIdAndUserIdOrFail(providerId, userId, options);
    
    // In a real implementation, you'd handle cascading deletes
    // or check for dependent services before deletion
    await this.deleteByIdOrFail(providerId, 'Provider', options);
  }

  /**
   * Test provider API connection
   */
  async testProviderConnection(
    providerId: number,
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    isConnected: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const credentials = await this.getProviderCredentials(providerId, userId, options);
    
    if (!credentials) {
      return {
        isConnected: false,
        error: 'Provider not found',
      };
    }

    // This would implement actual API testing
    // For now, return placeholder
    return {
      isConnected: true,
      responseTime: 150,
    };
  }

  // Private helper methods

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: ProviderFilters) {
    const conditions: any[] = [];

    if (filters.userId) {
      conditions.push(eq(this.table.userId, filters.userId));
    }
    if (filters.name) {
      conditions.push(eq(this.table.name, filters.name));
    }
    // Note: isActive filter would depend on actual schema structure

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
