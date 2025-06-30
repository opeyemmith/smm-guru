/**
 * Base Repository Pattern Implementation
 * Provides common database operations with type safety
 */

import { getDatabaseConnection } from '../../../infrastructure/database/connection.js';
import type { PgTable } from 'drizzle-orm/pg-core';
import { eq, and, or, desc, asc, count, sql } from 'drizzle-orm';
import type { PaginationQuery, FilterQuery } from '../../types/api.types.js';
import { NotFoundException } from '../../exceptions/base.exception.js';

export interface RepositoryOptions {
  transaction?: any; // Drizzle transaction type
}

export interface FindOptions {
  where?: any;
  orderBy?: any;
  limit?: number;
  offset?: number;
  columns?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends Record<string, any>> {
  protected table: PgTable;
  protected get db() {
    return getDatabaseConnection().getDatabase();
  }

  constructor(table: PgTable) {
    this.table = table;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string | number, options?: RepositoryOptions): Promise<T | null> {
    const database = options?.transaction || this.db;
    
    const result = await database
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a single record by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string | number, resourceName: string, options?: RepositoryOptions): Promise<T> {
    const result = await this.findById(id, options);
    
    if (!result) {
      throw new NotFoundException(resourceName, String(id));
    }

    return result;
  }

  /**
   * Find multiple records with optional filtering
   */
  async findMany(findOptions?: FindOptions, options?: RepositoryOptions): Promise<T[]> {
    const database = options?.transaction || this.db;
    
    let query = database.select(findOptions?.columns).from(this.table);

    if (findOptions?.where) {
      query = query.where(findOptions.where);
    }

    if (findOptions?.orderBy) {
      query = query.orderBy(findOptions.orderBy);
    }

    if (findOptions?.limit) {
      query = query.limit(findOptions.limit);
    }

    if (findOptions?.offset) {
      query = query.offset(findOptions.offset);
    }

    return await query;
  }

  /**
   * Find all records
   */
  async findAll(options?: RepositoryOptions): Promise<T[]> {
    return this.findMany({}, options);
  }

  /**
   * Find records with pagination
   */
  async findPaginated(
    pagination: PaginationQuery,
    findOptions?: Omit<FindOptions, 'limit' | 'offset'>,
    options?: RepositoryOptions
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    const database = options?.transaction || this.db;

    // Get total count
    let countQuery = database.select({ count: count() }).from(this.table);
    if (findOptions?.where) {
      countQuery = countQuery.where(findOptions.where);
    }
    const [{ count: total }] = await countQuery;

    // Get paginated data
    const data = await this.findMany({
      ...findOptions,
      limit,
      offset,
    }, options);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, options?: RepositoryOptions): Promise<T> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .insert(this.table)
      .values(data)
      .returning();

    return result;
  }

  /**
   * Create multiple records
   */
  async createMany(data: Partial<T>[], options?: RepositoryOptions): Promise<T[]> {
    const database = options?.transaction || this.db;
    
    return await database
      .insert(this.table)
      .values(data)
      .returning();
  }

  /**
   * Update a record by ID
   */
  async updateById(
    id: string | number,
    data: Partial<T>,
    options?: RepositoryOptions
  ): Promise<T | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();

    return result || null;
  }

  /**
   * Update a record by ID or throw NotFoundException
   */
  async updateByIdOrFail(
    id: string | number,
    data: Partial<T>,
    resourceName: string,
    options?: RepositoryOptions
  ): Promise<T> {
    const result = await this.updateById(id, data, options);
    
    if (!result) {
      throw new NotFoundException(resourceName, String(id));
    }

    return result;
  }

  /**
   * Update multiple records
   */
  async updateMany(
    where: any,
    data: Partial<T>,
    options?: RepositoryOptions
  ): Promise<T[]> {
    const database = options?.transaction || this.db;
    
    return await database
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(where)
      .returning();
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id: string | number, options?: RepositoryOptions): Promise<boolean> {
    const database = options?.transaction || this.db;
    
    const result = await database
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Delete a record by ID or throw NotFoundException
   */
  async deleteByIdOrFail(
    id: string | number,
    resourceName: string,
    options?: RepositoryOptions
  ): Promise<void> {
    const deleted = await this.deleteById(id, options);
    
    if (!deleted) {
      throw new NotFoundException(resourceName, String(id));
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMany(where: any, options?: RepositoryOptions): Promise<number> {
    const database = options?.transaction || this.db;
    
    const result = await database
      .delete(this.table)
      .where(where)
      .returning();

    return result.length;
  }

  /**
   * Check if a record exists
   */
  async exists(id: string | number, options?: RepositoryOptions): Promise<boolean> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return !!result;
  }

  /**
   * Count records with optional filtering
   */
  async count(where?: any, options?: RepositoryOptions): Promise<number> {
    const database = options?.transaction || this.db;
    
    let query = database.select({ count: count() }).from(this.table);
    
    if (where) {
      query = query.where(where);
    }

    const [{ count: total }] = await query;
    return total;
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(
    callback: (tx: any) => Promise<R>
  ): Promise<R> {
    return await getDatabaseConnection().transaction(callback);
  }

  /**
   * Build order by clause from pagination query
   */
  protected buildOrderBy(pagination: PaginationQuery) {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    
    if (!(sortBy in this.table)) {
      return desc(this.table.createdAt);
    }

    const column = this.table[sortBy];
    return sortOrder === 'asc' ? asc(column) : desc(column);
  }

  /**
   * Build search conditions for text fields
   */
  protected buildSearchConditions(search: string, searchFields: string[]) {
    if (!search || !searchFields.length) {
      return undefined;
    }

    const conditions = searchFields
      .filter(field => field in this.table)
      .map(field => sql`${this.table[field]} ILIKE ${`%${search}%`}`);

    return conditions.length > 0 ? or(...conditions) : undefined;
  }
}
