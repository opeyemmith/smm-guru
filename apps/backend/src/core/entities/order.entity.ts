/**
 * Order Entity - Domain Model for Order Management
 * Represents the core business logic and rules for orders
 */

import { BusinessLogicException, ValidationException } from '../../shared/exceptions/base.exception.js';
import type {
  OrderStatus,
  OrderPriority
} from '../../shared/constants/order.constants.js';
import {
  isValidStatusTransition,
  canBeCancelled,
  canBeRefunded,
  isCompletedStatus,
  isFailedStatus
} from '../../shared/constants/order.constants.js';

export interface OrderEntityData {
  id: string;
  userId: string;
  service: number; // Maps to serviceId in database
  providerId: number;
  providerOrderId?: number; // Provider's order ID
  link: string;
  quantity: number;
  startCount?: number;
  remains?: number;
  price: number; // Maps to charge
  status: OrderStatus;
  priority: OrderPriority;
  serviceName?: string;
  refill?: boolean;
  currency?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  failed_at?: Date;
  cancelled_at?: Date;
  metadata?: Record<string, any>;
}

export class OrderEntity {
  private data: OrderEntityData;

  constructor(data: OrderEntityData) {
    this.data = { ...data };
    this.validate();
  }

  // Getters
  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get serviceId(): number { return this.data.service; }
  get providerId(): number { return this.data.providerId; }
  get providerOrderId(): number | undefined { return this.data.providerOrderId; }
  get link(): string { return this.data.link; }
  get quantity(): number { return this.data.quantity; }
  get startCount(): number | undefined { return this.data.startCount; }
  get remains(): number | undefined { return this.data.remains; }
  get price(): number { return this.data.price; }
  get status(): OrderStatus { return this.data.status; }
  get priority(): OrderPriority { return this.data.priority; }
  get notes(): string | undefined { return this.data.notes; }
  get createdAt(): Date { return this.data.created_at; }
  get updatedAt(): Date { return this.data.updated_at; }
  get completedAt(): Date | undefined { return this.data.completed_at; }
  get failedAt(): Date | undefined { return this.data.failed_at; }
  get cancelledAt(): Date | undefined { return this.data.cancelled_at; }
  get metadata(): Record<string, any> | undefined { return this.data.metadata; }

  // Business Logic Methods

  /**
   * Check if order can be cancelled using business rules
   */
  canBeCancelled(): boolean {
    return canBeCancelled(this.data.status);
  }

  /**
   * Check if order is in progress
   */
  isInProgress(): boolean {
    return this.data.status === 'pending' || this.data.status === 'processing';
  }

  /**
   * Check if order is completed using business rules
   */
  isCompleted(): boolean {
    return isCompletedStatus(this.data.status);
  }

  /**
   * Check if order has failed using business rules
   */
  hasFailed(): boolean {
    return isFailedStatus(this.data.status);
  }

  /**
   * Check if order is cancelled
   */
  isCancelled(): boolean {
    return this.data.status === 'cancelled';
  }

  /**
   * Check if order can be refunded using business rules
   */
  canBeRefunded(): boolean {
    return canBeRefunded(this.data.status);
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    if (!this.data.startCount || !this.data.remains) {
      return this.isCompleted() ? 100 : 0;
    }

    const delivered = this.data.quantity - this.data.remains;
    return Math.min(100, Math.max(0, (delivered / this.data.quantity) * 100));
  }

  /**
   * Get estimated completion time based on current progress
   */
  getEstimatedCompletionTime(): Date | null {
    if (this.isCompleted() || this.hasFailed() || this.isCancelled()) {
      return null;
    }

    const completionPercentage = this.getCompletionPercentage();
    if (completionPercentage === 0) {
      return null;
    }

    const elapsedTime = Date.now() - this.data.created_at.getTime();
    const estimatedTotalTime = elapsedTime / (completionPercentage / 100);
    const remainingTime = estimatedTotalTime - elapsedTime;

    return new Date(Date.now() + remainingTime);
  }

  /**
   * Update order status with validation
   */
  updateStatus(newStatus: OrderStatus, metadata?: Record<string, any>): void {
    this.validateStatusTransition(this.data.status, newStatus);
    
    const now = new Date();
    this.data.status = newStatus;
    this.data.updated_at = now;

    // Set completion timestamps
    switch (newStatus) {
      case 'completed':
        this.data.completed_at = now;
        this.data.remains = 0;
        break;
      case 'failed':
        this.data.failed_at = now;
        break;
      case 'cancelled':
        this.data.cancelled_at = now;
        break;
    }

    if (metadata) {
      this.data.metadata = { ...this.data.metadata, ...metadata };
    }
  }

  /**
   * Update order progress
   */
  updateProgress(startCount?: number, remains?: number): void {
    if (startCount !== undefined) {
      this.data.startCount = startCount;
    }
    if (remains !== undefined) {
      this.data.remains = Math.max(0, remains);
    }
    this.data.updated_at = new Date();

    // Auto-complete if no remains
    if (this.data.remains === 0 && this.data.status === 'processing') {
      this.updateStatus('completed');
    }
  }

  /**
   * Set provider order ID
   */
  setProviderOrderId(providerOrderId: number): void {
    this.data.providerOrderId = providerOrderId;
    this.data.updated_at = new Date();
  }

  /**
   * Add notes to the order
   */
  addNotes(notes: string): void {
    this.data.notes = notes;
    this.data.updated_at = new Date();
  }

  /**
   * Update priority
   */
  updatePriority(priority: OrderPriority): void {
    this.data.priority = priority;
    this.data.updated_at = new Date();
  }

  /**
   * Get order duration in milliseconds
   */
  getDuration(): number {
    const endTime = this.data.completed_at || this.data.failed_at || this.data.cancelled_at || new Date();
    return endTime.getTime() - this.data.created_at.getTime();
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): OrderEntityData {
    return { ...this.data };
  }

  /**
   * Create a copy of the order
   */
  clone(): OrderEntity {
    return new OrderEntity({ ...this.data });
  }

  // Private Methods

  /**
   * Validate order data
   */
  private validate(): void {
    if (!this.data.id) {
      throw new Error('Order ID is required');
    }
    if (!this.data.userId) {
      throw new Error('User ID is required');
    }
    if (!this.data.service) {
      throw new Error('Service ID is required');
    }
    if (!this.data.link) {
      throw new Error('Link is required');
    }
    if (this.data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (this.data.price < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new BusinessLogicException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  // Static Factory Methods

  /**
   * Create a new order
   */
  static create(data: Omit<OrderEntityData, 'id' | 'createdAt' | 'updatedAt'>): OrderEntity {
    const now = new Date();
    return new OrderEntity({
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    });
  }

  /**
   * Create from database record
   */
  static fromDatabase(data: OrderEntityData): OrderEntity {
    return new OrderEntity(data);
  }
}
