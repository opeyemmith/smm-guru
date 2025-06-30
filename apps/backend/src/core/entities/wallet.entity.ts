/**
 * Wallet Domain Entity
 * Rich domain model with transaction rules and business logic
 */

import { BusinessLogicException, ValidationException } from '../../shared/exceptions/base.exception.js';

export type TransactionType = 'deposit' | 'withdrawal' | 'order' | 'refund' | 'bonus' | 'penalty' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';
export type WalletStatus = 'active' | 'suspended' | 'frozen' | 'closed';

export interface TransactionData {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  reference?: string; // External reference (order ID, payment ID, etc.)
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletEntityData {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  dailySpendLimit?: number;
  monthlySpendLimit?: number;
  totalSpentToday: number;
  totalSpentThisMonth: number;
  lastTransactionAt?: Date;
  freezeReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class WalletEntity {
  private constructor(private data: WalletEntityData) {
    this.validate();
  }

  /**
   * Create new wallet entity
   */
  public static create(data: Omit<WalletEntityData, 'id' | 'createdAt' | 'updatedAt'>): WalletEntity {
    const now = new Date();
    
    const walletData: WalletEntityData = {
      ...data,
      id: crypto.randomUUID(),
      balance: data.balance || 0,
      currency: data.currency || 'USD',
      status: data.status || 'active',
      totalSpentToday: data.totalSpentToday || 0,
      totalSpentThisMonth: data.totalSpentThisMonth || 0,
      createdAt: now,
      updatedAt: now,
    };

    return new WalletEntity(walletData);
  }

  /**
   * Create from existing data
   */
  public static fromData(data: WalletEntityData): WalletEntity {
    return new WalletEntity(data);
  }

  // Getters
  public get id(): string { return this.data.id; }
  public get userId(): string { return this.data.userId; }
  public get balance(): number { return this.data.balance; }
  public get currency(): string { return this.data.currency; }
  public get status(): WalletStatus { return this.data.status; }
  public get dailySpendLimit(): number | undefined { return this.data.dailySpendLimit; }
  public get monthlySpendLimit(): number | undefined { return this.data.monthlySpendLimit; }
  public get totalSpentToday(): number { return this.data.totalSpentToday; }
  public get totalSpentThisMonth(): number { return this.data.totalSpentThisMonth; }
  public get lastTransactionAt(): Date | undefined { return this.data.lastTransactionAt; }
  public get freezeReason(): string | undefined { return this.data.freezeReason; }
  public get createdAt(): Date { return this.data.createdAt; }
  public get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business Rules
   */

  /**
   * Check if wallet is active and can be used
   */
  public isActive(): boolean {
    return this.data.status === 'active';
  }

  /**
   * Check if wallet is frozen
   */
  public isFrozen(): boolean {
    return this.data.status === 'frozen';
  }

  /**
   * Check if wallet is suspended
   */
  public isSuspended(): boolean {
    return this.data.status === 'suspended';
  }

  /**
   * Check if user has sufficient balance
   */
  public hasSufficientBalance(amount: number): boolean {
    return this.isActive() && this.data.balance >= amount;
  }

  /**
   * Check if amount is within daily spending limit
   */
  public isWithinDailyLimit(amount: number): boolean {
    if (!this.data.dailySpendLimit) {
      return true; // No limit set
    }

    return (this.data.totalSpentToday + amount) <= this.data.dailySpendLimit;
  }

  /**
   * Check if amount is within monthly spending limit
   */
  public isWithinMonthlyLimit(amount: number): boolean {
    if (!this.data.monthlySpendLimit) {
      return true; // No limit set
    }

    return (this.data.totalSpentThisMonth + amount) <= this.data.monthlySpendLimit;
  }

  /**
   * Check if transaction is allowed
   */
  public canMakeTransaction(amount: number, type: TransactionType): boolean {
    if (!this.isActive()) {
      return false;
    }

    // For spending transactions, check limits and balance
    if (type === 'order' || type === 'withdrawal' || type === 'transfer') {
      return this.hasSufficientBalance(amount) &&
             this.isWithinDailyLimit(amount) &&
             this.isWithinMonthlyLimit(amount);
    }

    // For credit transactions, only check if wallet is active
    return true;
  }

  /**
   * Get available balance for spending
   */
  public getAvailableBalance(): number {
    if (!this.isActive()) {
      return 0;
    }

    let availableBalance = this.data.balance;

    // Consider daily limit
    if (this.data.dailySpendLimit) {
      const remainingDailyLimit = this.data.dailySpendLimit - this.data.totalSpentToday;
      availableBalance = Math.min(availableBalance, remainingDailyLimit);
    }

    // Consider monthly limit
    if (this.data.monthlySpendLimit) {
      const remainingMonthlyLimit = this.data.monthlySpendLimit - this.data.totalSpentThisMonth;
      availableBalance = Math.min(availableBalance, remainingMonthlyLimit);
    }

    return Math.max(0, availableBalance);
  }

  /**
   * Actions
   */

  /**
   * Add funds to wallet
   */
  public addFunds(amount: number, description: string, reference?: string): TransactionData {
    if (amount <= 0) {
      throw new ValidationException('Amount must be greater than 0');
    }

    if (!this.isActive()) {
      throw new BusinessLogicException('Cannot add funds to inactive wallet');
    }

    this.data.balance += amount;
    this.data.lastTransactionAt = new Date();
    this.data.updatedAt = new Date();

    return this.createTransaction('deposit', amount, 'completed', description, reference);
  }

  /**
   * Deduct funds from wallet
   */
  public deductFunds(amount: number, description: string, reference?: string): TransactionData {
    if (amount <= 0) {
      throw new ValidationException('Amount must be greater than 0');
    }

    if (!this.canMakeTransaction(amount, 'order')) {
      throw new BusinessLogicException('Insufficient funds or spending limit exceeded');
    }

    this.data.balance -= amount;
    this.data.totalSpentToday += amount;
    this.data.totalSpentThisMonth += amount;
    this.data.lastTransactionAt = new Date();
    this.data.updatedAt = new Date();

    return this.createTransaction('order', amount, 'completed', description, reference);
  }

  /**
   * Process refund
   */
  public processRefund(amount: number, description: string, reference?: string): TransactionData {
    if (amount <= 0) {
      throw new ValidationException('Refund amount must be greater than 0');
    }

    if (!this.isActive()) {
      throw new BusinessLogicException('Cannot process refund to inactive wallet');
    }

    this.data.balance += amount;
    
    // Adjust spending totals (but don't go below 0)
    this.data.totalSpentToday = Math.max(0, this.data.totalSpentToday - amount);
    this.data.totalSpentThisMonth = Math.max(0, this.data.totalSpentThisMonth - amount);
    
    this.data.lastTransactionAt = new Date();
    this.data.updatedAt = new Date();

    return this.createTransaction('refund', amount, 'completed', description, reference);
  }

  /**
   * Transfer funds to another wallet
   */
  public transferFunds(amount: number, description: string, reference?: string): TransactionData {
    if (amount <= 0) {
      throw new ValidationException('Transfer amount must be greater than 0');
    }

    if (!this.canMakeTransaction(amount, 'transfer')) {
      throw new BusinessLogicException('Insufficient funds or transfer not allowed');
    }

    this.data.balance -= amount;
    this.data.totalSpentToday += amount;
    this.data.totalSpentThisMonth += amount;
    this.data.lastTransactionAt = new Date();
    this.data.updatedAt = new Date();

    return this.createTransaction('transfer', amount, 'completed', description, reference);
  }

  /**
   * Freeze wallet
   */
  public freeze(reason: string): void {
    this.data.status = 'frozen';
    this.data.freezeReason = reason;
    this.data.updatedAt = new Date();
  }

  /**
   * Unfreeze wallet
   */
  public unfreeze(): void {
    this.data.status = 'active';
    this.data.freezeReason = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Suspend wallet
   */
  public suspend(): void {
    this.data.status = 'suspended';
    this.data.updatedAt = new Date();
  }

  /**
   * Activate wallet
   */
  public activate(): void {
    this.data.status = 'active';
    this.data.freezeReason = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Update spending limits
   */
  public updateSpendingLimits(dailyLimit?: number, monthlyLimit?: number): void {
    if (dailyLimit !== undefined) {
      if (dailyLimit < 0) {
        throw new ValidationException('Daily limit cannot be negative');
      }
      this.data.dailySpendLimit = dailyLimit;
    }

    if (monthlyLimit !== undefined) {
      if (monthlyLimit < 0) {
        throw new ValidationException('Monthly limit cannot be negative');
      }
      this.data.monthlySpendLimit = monthlyLimit;
    }

    this.data.updatedAt = new Date();
  }

  /**
   * Reset daily spending total (called at start of new day)
   */
  public resetDailySpending(): void {
    this.data.totalSpentToday = 0;
    this.data.updatedAt = new Date();
  }

  /**
   * Reset monthly spending total (called at start of new month)
   */
  public resetMonthlySpending(): void {
    this.data.totalSpentThisMonth = 0;
    this.data.updatedAt = new Date();
  }

  /**
   * Get data for persistence
   */
  public toData(): WalletEntityData {
    return { ...this.data };
  }

  /**
   * Get public data (safe for API responses)
   */
  public toPublicData(): Omit<WalletEntityData, 'freezeReason'> {
    const { freezeReason, ...publicData } = this.data;
    return publicData;
  }

  // Private helper methods

  /**
   * Create transaction record
   */
  private createTransaction(
    type: TransactionType,
    amount: number,
    status: TransactionStatus,
    description: string,
    reference?: string
  ): TransactionData {
    const now = new Date();
    
    return {
      id: crypto.randomUUID(),
      type,
      amount,
      currency: this.data.currency,
      status,
      description,
      reference,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Validate wallet data
   */
  private validate(): void {
    if (!this.data.userId || this.data.userId.trim().length === 0) {
      throw new ValidationException('User ID is required');
    }

    if (this.data.balance < 0) {
      throw new ValidationException('Balance cannot be negative');
    }

    if (this.data.totalSpentToday < 0) {
      throw new ValidationException('Total spent today cannot be negative');
    }

    if (this.data.totalSpentThisMonth < 0) {
      throw new ValidationException('Total spent this month cannot be negative');
    }

    if (this.data.dailySpendLimit !== undefined && this.data.dailySpendLimit < 0) {
      throw new ValidationException('Daily spend limit cannot be negative');
    }

    if (this.data.monthlySpendLimit !== undefined && this.data.monthlySpendLimit < 0) {
      throw new ValidationException('Monthly spend limit cannot be negative');
    }
  }
}
