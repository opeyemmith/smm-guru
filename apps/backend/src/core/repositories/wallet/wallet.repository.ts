/**
 * Wallet Repository Implementation
 * Data access layer for wallet and transaction management
 */

import { BaseRepository } from '../base/base.repository.js';
import { wallet, transaction, type WalletSchema, type TransactionSchema } from '@smm-guru/database';
import { eq, and, desc, sum, sql } from 'drizzle-orm';
import type { RepositoryOptions, FindOptions } from '../base/base.repository.js';
import { NotFoundException } from '../../../shared/exceptions/base.exception.js';

export interface TransactionFilters {
  userId?: string;
  type?: 'credit' | 'debit';
  status?: 'pending' | 'completed' | 'failed';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class WalletRepository extends BaseRepository<WalletSchema> {
  constructor() {
    super(wallet);
  }

  /**
   * Find wallet by user ID
   */
  async findByUserId(
    userId: string,
    options?: RepositoryOptions
  ): Promise<WalletSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId))
      .limit(1);

    return result || null;
  }

  /**
   * Find wallet by user ID or throw exception
   */
  async findByUserIdOrFail(
    userId: string,
    options?: RepositoryOptions
  ): Promise<WalletSchema> {
    const result = await this.findByUserId(userId, options);
    
    if (!result) {
      throw new NotFoundException('Wallet', userId);
    }

    return result;
  }

  /**
   * Get user balance
   */
  async getUserBalance(
    userId: string,
    options?: RepositoryOptions
  ): Promise<number> {
    const userWallet = await this.findByUserIdOrFail(userId, options);
    return Number(userWallet.balance);
  }

  /**
   * Get wallet balance with currency info
   */
  async getWalletBalance(
    userId: string,
    options?: RepositoryOptions
  ): Promise<WalletBalance> {
    const userWallet = await this.findByUserIdOrFail(userId, options);
    
    return {
      balance: Number(userWallet.balance),
      currency: userWallet.currency || 'USD',
      lastUpdated: userWallet.updated_at || userWallet.created_at,
    };
  }

  /**
   * Update wallet balance
   */
  async updateBalance(
    userId: string,
    newBalance: number,
    options?: RepositoryOptions
  ): Promise<WalletSchema> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .update(this.table)
      .set({
        balance: newBalance.toString(),
        updated_at: new Date(),
      })
      .where(eq(this.table.userId, userId))
      .returning();

    if (!result) {
      throw new NotFoundException('Wallet', userId);
    }

    return result;
  }

  /**
   * Add funds to wallet
   */
  async addFunds(
    userId: string,
    amount: number,
    options?: RepositoryOptions
  ): Promise<WalletSchema> {
    const currentBalance = await this.getUserBalance(userId, options);
    const newBalance = currentBalance + amount;
    
    return await this.updateBalance(userId, newBalance, options);
  }

  /**
   * Deduct funds from wallet
   */
  async deductFunds(
    userId: string,
    amount: number,
    options?: RepositoryOptions
  ): Promise<WalletSchema> {
    const currentBalance = await this.getUserBalance(userId, options);
    
    if (currentBalance < amount) {
      throw new Error(`Insufficient balance. Available: ${currentBalance}, Required: ${amount}`);
    }
    
    const newBalance = currentBalance - amount;
    return await this.updateBalance(userId, newBalance, options);
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(
    userId: string,
    requiredAmount: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const currentBalance = await this.getUserBalance(userId, options);
    return currentBalance >= requiredAmount;
  }

  /**
   * Create wallet for new user
   */
  async createWalletForUser(
    userId: string,
    initialBalance = 0,
    currency = 'USD',
    options?: RepositoryOptions
  ): Promise<WalletSchema> {
    const now = new Date();
    
    return await this.create({
      userId,
      balance: initialBalance.toString(),
      currency,
      created_at: now,
      updated_at: now,
    }, options);
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(
    userId: string,
    options?: RepositoryOptions
  ): Promise<{
    currentBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
  }> {
    const database = options?.transaction || this.db;
    
    const currentBalance = await this.getUserBalance(userId, options);
    
    // Get transaction statistics
    const [stats] = await database
      .select({
        totalCredits: sql<number>`COALESCE(SUM(CASE WHEN type = 'credit' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalDebits: sql<number>`COALESCE(SUM(CASE WHEN type = 'debit' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transaction)
      .where(eq(transaction.userId, userId));

    return {
      currentBalance,
      totalCredits: stats.totalCredits,
      totalDebits: stats.totalDebits,
      transactionCount: stats.transactionCount,
    };
  }
}

/**
 * Transaction Repository for managing wallet transactions
 */
export class TransactionRepository extends BaseRepository<TransactionSchema> {
  constructor() {
    super(transaction);
  }

  /**
   * Create a transaction record
   */
  async createTransaction(
    transactionData: {
      userId: string;
      amount: number;
      type: 'credit' | 'debit';
      status: 'pending' | 'completed' | 'failed';
      reference: string;
      fromWalletId?: string;
      toWalletId?: string;
      description?: string;
    },
    options?: RepositoryOptions
  ): Promise<TransactionSchema> {
    const now = new Date();
    
    return await this.create({
      ...transactionData,
      amount: transactionData.amount.toString(),
      created_at: now,
      updated_at: now,
    }, options);
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(
    userId: string,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<TransactionSchema[]> {
    return this.findMany({
      ...findOptions,
      where: and(
        eq(this.table.userId, userId),
        findOptions?.where
      ),
      orderBy: desc(this.table.created_at),
    }, options);
  }

  /**
   * Find transactions with filters
   */
  async findWithFilters(
    filters: TransactionFilters,
    findOptions?: FindOptions,
    options?: RepositoryOptions
  ): Promise<TransactionSchema[]> {
    const conditions = this.buildFilterConditions(filters);
    
    return this.findMany({
      ...findOptions,
      where: and(conditions, findOptions?.where),
      orderBy: desc(this.table.created_at),
    }, options);
  }

  /**
   * Get recent transactions for user
   */
  async getRecentTransactions(
    userId: string,
    limit = 10,
    options?: RepositoryOptions
  ): Promise<TransactionSchema[]> {
    return this.findMany({
      where: eq(this.table.userId, userId),
      orderBy: desc(this.table.created_at),
      limit,
    }, options);
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed',
    options?: RepositoryOptions
  ): Promise<TransactionSchema> {
    return await this.updateByIdOrFail(transactionId, {
      status,
      updated_at: new Date(),
    }, 'Transaction', options);
  }

  /**
   * Get transaction by reference
   */
  async findByReference(
    reference: string,
    options?: RepositoryOptions
  ): Promise<TransactionSchema | null> {
    const database = options?.transaction || this.db;
    
    const [result] = await database
      .select()
      .from(this.table)
      .where(eq(this.table.reference, reference))
      .limit(1);

    return result || null;
  }

  /**
   * Get transaction summary for user
   */
  async getTransactionSummary(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
    options?: RepositoryOptions
  ): Promise<{
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
  }> {
    const database = options?.transaction || this.db;
    
    let whereCondition = eq(this.table.userId, userId);
    
    if (dateFrom) {
      whereCondition = and(whereCondition, sql`${this.table.created_at} >= ${dateFrom}`);
    }
    if (dateTo) {
      whereCondition = and(whereCondition, sql`${this.table.created_at} <= ${dateTo}`);
    }

    const [summary] = await database
      .select({
        totalCredits: sql<number>`COALESCE(SUM(CASE WHEN type = 'credit' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalDebits: sql<number>`COALESCE(SUM(CASE WHEN type = 'debit' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(this.table)
      .where(whereCondition);

    const netAmount = summary.totalCredits - summary.totalDebits;

    return {
      totalCredits: summary.totalCredits,
      totalDebits: summary.totalDebits,
      netAmount,
      transactionCount: summary.transactionCount,
    };
  }

  // Private helper methods

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: TransactionFilters) {
    const conditions: any[] = [];

    if (filters.userId) {
      conditions.push(eq(this.table.userId, filters.userId));
    }
    if (filters.type) {
      conditions.push(eq(this.table.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(this.table.status, filters.status));
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
