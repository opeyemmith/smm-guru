/**
 * Service Domain Entity
 * Rich domain model with pricing logic and business rules
 */

import { BusinessLogicException, ValidationException } from '../../shared/exceptions/base.exception.js';

export type ServiceStatus = 'active' | 'inactive' | 'maintenance' | 'deprecated';
export type ServiceCategory = 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin' | 'other';
export type ServiceType = 'followers' | 'likes' | 'views' | 'comments' | 'shares' | 'subscribers' | 'other';

export interface ServiceEntityData {
  id: number;
  name: string;
  description?: string;
  category: ServiceCategory;
  type: ServiceType;
  rate: number; // Rate per 1000 units
  min: number; // Minimum quantity
  max: number; // Maximum quantity
  profit?: number; // Profit margin to add
  status: ServiceStatus;
  providerId: string;
  providerServiceId: string;
  averageTime?: string; // Average completion time
  dripFeed: boolean; // Supports drip feed
  refill: boolean; // Supports refill
  cancel: boolean; // Supports cancellation
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceEntity {
  private constructor(private data: ServiceEntityData) {
    this.validate();
  }

  /**
   * Create new service entity
   */
  public static create(data: Omit<ServiceEntityData, 'id' | 'createdAt' | 'updatedAt'>): ServiceEntity {
    const now = new Date();
    
    const serviceData: ServiceEntityData = {
      ...data,
      id: Math.floor(Math.random() * 1000000), // Temporary ID generation
      status: data.status || 'active',
      profit: data.profit || 0,
      dripFeed: data.dripFeed || false,
      refill: data.refill || false,
      cancel: data.cancel || false,
      createdAt: now,
      updatedAt: now,
    };

    return new ServiceEntity(serviceData);
  }

  /**
   * Create from existing data
   */
  public static fromData(data: ServiceEntityData): ServiceEntity {
    return new ServiceEntity(data);
  }

  // Getters
  public get id(): number { return this.data.id; }
  public get name(): string { return this.data.name; }
  public get description(): string | undefined { return this.data.description; }
  public get category(): ServiceCategory { return this.data.category; }
  public get type(): ServiceType { return this.data.type; }
  public get rate(): number { return this.data.rate; }
  public get min(): number { return this.data.min; }
  public get max(): number { return this.data.max; }
  public get profit(): number { return this.data.profit || 0; }
  public get status(): ServiceStatus { return this.data.status; }
  public get providerId(): string { return this.data.providerId; }
  public get providerServiceId(): string { return this.data.providerServiceId; }
  public get averageTime(): string | undefined { return this.data.averageTime; }
  public get dripFeed(): boolean { return this.data.dripFeed; }
  public get refill(): boolean { return this.data.refill; }
  public get cancel(): boolean { return this.data.cancel; }
  public get tags(): string[] { return this.data.tags || []; }
  public get createdAt(): Date { return this.data.createdAt; }
  public get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business Rules
   */

  /**
   * Check if service is available for ordering
   */
  public isAvailable(): boolean {
    return this.data.status === 'active';
  }

  /**
   * Check if service is in maintenance
   */
  public isInMaintenance(): boolean {
    return this.data.status === 'maintenance';
  }

  /**
   * Calculate price for given quantity
   */
  public calculatePrice(quantity: number): number {
    this.validateQuantity(quantity);
    
    const basePrice = (this.data.rate / 1000) * quantity; // Rate is per 1000 units
    const profitAmount = this.data.profit || 0;
    
    return Number((basePrice + profitAmount).toFixed(4));
  }

  /**
   * Calculate price with custom profit margin
   */
  public calculatePriceWithProfit(quantity: number, profitMargin: number): number {
    this.validateQuantity(quantity);
    
    const basePrice = (this.data.rate / 1000) * quantity;
    const profitAmount = (basePrice * profitMargin) / 100;
    
    return Number((basePrice + profitAmount).toFixed(4));
  }

  /**
   * Validate quantity against service limits
   */
  public validateQuantity(quantity: number): void {
    if (quantity < this.data.min) {
      throw new ValidationException(
        `Quantity ${quantity} is below minimum ${this.data.min} for service ${this.data.name}`
      );
    }

    if (quantity > this.data.max) {
      throw new ValidationException(
        `Quantity ${quantity} exceeds maximum ${this.data.max} for service ${this.data.name}`
      );
    }
  }

  /**
   * Check if quantity is within limits
   */
  public isQuantityValid(quantity: number): boolean {
    return quantity >= this.data.min && quantity <= this.data.max;
  }

  /**
   * Get suggested quantities (min, recommended, max)
   */
  public getSuggestedQuantities(): { min: number; recommended: number; max: number } {
    const recommended = Math.min(
      Math.max(this.data.min * 10, 1000), // At least 10x min or 1000
      this.data.max
    );

    return {
      min: this.data.min,
      recommended,
      max: this.data.max,
    };
  }

  /**
   * Check if service supports feature
   */
  public supportsFeature(feature: 'dripFeed' | 'refill' | 'cancel'): boolean {
    switch (feature) {
      case 'dripFeed':
        return this.data.dripFeed;
      case 'refill':
        return this.data.refill;
      case 'cancel':
        return this.data.cancel;
      default:
        return false;
    }
  }

  /**
   * Actions
   */

  /**
   * Update service status
   */
  public updateStatus(status: ServiceStatus): void {
    this.data.status = status;
    this.data.updatedAt = new Date();
  }

  /**
   * Update pricing
   */
  public updatePricing(rate: number, profit?: number): void {
    if (rate <= 0) {
      throw new ValidationException('Rate must be greater than 0');
    }

    this.data.rate = rate;
    if (profit !== undefined) {
      this.data.profit = profit;
    }
    this.data.updatedAt = new Date();
  }

  /**
   * Update quantity limits
   */
  public updateLimits(min: number, max: number): void {
    if (min <= 0) {
      throw new ValidationException('Minimum quantity must be greater than 0');
    }

    if (max <= min) {
      throw new ValidationException('Maximum quantity must be greater than minimum');
    }

    this.data.min = min;
    this.data.max = max;
    this.data.updatedAt = new Date();
  }

  /**
   * Update service features
   */
  public updateFeatures(features: {
    dripFeed?: boolean;
    refill?: boolean;
    cancel?: boolean;
  }): void {
    if (features.dripFeed !== undefined) this.data.dripFeed = features.dripFeed;
    if (features.refill !== undefined) this.data.refill = features.refill;
    if (features.cancel !== undefined) this.data.cancel = features.cancel;
    
    this.data.updatedAt = new Date();
  }

  /**
   * Add tag to service
   */
  public addTag(tag: string): void {
    if (!this.data.tags) {
      this.data.tags = [];
    }

    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Remove tag from service
   */
  public removeTag(tag: string): void {
    if (this.data.tags) {
      const index = this.data.tags.indexOf(tag);
      if (index > -1) {
        this.data.tags.splice(index, 1);
        this.data.updatedAt = new Date();
      }
    }
  }

  /**
   * Get data for persistence
   */
  public toData(): ServiceEntityData {
    return { ...this.data };
  }

  /**
   * Get public data (safe for API responses)
   */
  public toPublicData(): Omit<ServiceEntityData, 'providerId' | 'providerServiceId' | 'profit'> {
    const { providerId, providerServiceId, profit, ...publicData } = this.data;
    return publicData;
  }

  /**
   * Validate service data
   */
  private validate(): void {
    if (!this.data.name || this.data.name.trim().length === 0) {
      throw new ValidationException('Service name is required');
    }

    if (this.data.rate <= 0) {
      throw new ValidationException('Service rate must be greater than 0');
    }

    if (this.data.min <= 0) {
      throw new ValidationException('Minimum quantity must be greater than 0');
    }

    if (this.data.max <= this.data.min) {
      throw new ValidationException('Maximum quantity must be greater than minimum');
    }

    if (!this.data.providerId || this.data.providerId.trim().length === 0) {
      throw new ValidationException('Provider ID is required');
    }

    if (!this.data.providerServiceId || this.data.providerServiceId.trim().length === 0) {
      throw new ValidationException('Provider service ID is required');
    }
  }
}
