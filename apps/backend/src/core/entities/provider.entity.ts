/**
 * Provider Domain Entity
 * Rich domain model with API validation and business rules
 */

import { BusinessLogicException, ValidationException } from '../../shared/exceptions/base.exception.js';

export type ProviderStatus = 'active' | 'inactive' | 'maintenance' | 'suspended';
export type ProviderType = 'api' | 'manual' | 'hybrid';

export interface ProviderCredentials {
  apiUrl: string;
  apiKey: string;
  additionalHeaders?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

export interface ProviderEntityData {
  id: string;
  name: string;
  description?: string;
  type: ProviderType;
  status: ProviderStatus;
  credentials: ProviderCredentials;
  balance?: number;
  currency: string;
  priority: number; // Higher number = higher priority
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  features: {
    supportsStatus: boolean;
    supportsCancel: boolean;
    supportsRefill: boolean;
    supportsDripFeed: boolean;
    supportsMultipleOrders: boolean;
  };
  statistics: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    averageResponseTime: number;
    lastSuccessfulRequest?: Date;
    lastFailedRequest?: Date;
  };
  healthCheck: {
    isHealthy: boolean;
    lastCheck?: Date;
    consecutiveFailures: number;
    responseTime?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ProviderEntity {
  private constructor(private data: ProviderEntityData) {
    this.validate();
  }

  /**
   * Create new provider entity
   */
  public static create(data: Omit<ProviderEntityData, 'id' | 'createdAt' | 'updatedAt'>): ProviderEntity {
    const now = new Date();
    
    const providerData: ProviderEntityData = {
      ...data,
      id: crypto.randomUUID(),
      status: data.status || 'inactive',
      currency: data.currency || 'USD',
      priority: data.priority || 1,
      statistics: data.statistics || {
        totalOrders: 0,
        successfulOrders: 0,
        failedOrders: 0,
        averageResponseTime: 0,
      },
      healthCheck: data.healthCheck || {
        isHealthy: false,
        consecutiveFailures: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    return new ProviderEntity(providerData);
  }

  /**
   * Create from existing data
   */
  public static fromData(data: ProviderEntityData): ProviderEntity {
    return new ProviderEntity(data);
  }

  // Getters
  public get id(): string { return this.data.id; }
  public get name(): string { return this.data.name; }
  public get description(): string | undefined { return this.data.description; }
  public get type(): ProviderType { return this.data.type; }
  public get status(): ProviderStatus { return this.data.status; }
  public get credentials(): ProviderCredentials { return { ...this.data.credentials }; }
  public get balance(): number | undefined { return this.data.balance; }
  public get currency(): string { return this.data.currency; }
  public get priority(): number { return this.data.priority; }
  public get rateLimit(): ProviderEntityData['rateLimit'] { return this.data.rateLimit; }
  public get features(): ProviderEntityData['features'] { return { ...this.data.features }; }
  public get statistics(): ProviderEntityData['statistics'] { return { ...this.data.statistics }; }
  public get healthCheck(): ProviderEntityData['healthCheck'] { return { ...this.data.healthCheck }; }
  public get createdAt(): Date { return this.data.createdAt; }
  public get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business Rules
   */

  /**
   * Check if provider is available for orders
   */
  public isAvailable(): boolean {
    return this.data.status === 'active' && this.data.healthCheck.isHealthy;
  }

  /**
   * Check if provider is healthy
   */
  public isHealthy(): boolean {
    return this.data.healthCheck.isHealthy && this.data.healthCheck.consecutiveFailures < 5;
  }

  /**
   * Check if provider supports feature
   */
  public supportsFeature(feature: keyof ProviderEntityData['features']): boolean {
    return this.data.features[feature];
  }

  /**
   * Get success rate percentage
   */
  public getSuccessRate(): number {
    if (this.data.statistics.totalOrders === 0) {
      return 100; // No orders yet, assume 100%
    }

    return (this.data.statistics.successfulOrders / this.data.statistics.totalOrders) * 100;
  }

  /**
   * Get failure rate percentage
   */
  public getFailureRate(): number {
    return 100 - this.getSuccessRate();
  }

  /**
   * Check if provider has sufficient balance
   */
  public hasSufficientBalance(requiredAmount: number): boolean {
    if (this.data.balance === undefined) {
      return true; // Unknown balance, assume sufficient
    }

    return this.data.balance >= requiredAmount;
  }

  /**
   * Check if provider is within rate limits
   */
  public isWithinRateLimit(requestsInPeriod: {
    minute?: number;
    hour?: number;
    day?: number;
  }): boolean {
    if (!this.data.rateLimit) {
      return true; // No rate limit defined
    }

    if (requestsInPeriod.minute && requestsInPeriod.minute >= this.data.rateLimit.requestsPerMinute) {
      return false;
    }

    if (requestsInPeriod.hour && requestsInPeriod.hour >= this.data.rateLimit.requestsPerHour) {
      return false;
    }

    if (requestsInPeriod.day && requestsInPeriod.day >= this.data.rateLimit.requestsPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Actions
   */

  /**
   * Update provider status
   */
  public updateStatus(status: ProviderStatus): void {
    this.data.status = status;
    this.data.updatedAt = new Date();
  }

  /**
   * Update credentials
   */
  public updateCredentials(credentials: Partial<ProviderCredentials>): void {
    this.data.credentials = {
      ...this.data.credentials,
      ...credentials,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Update balance
   */
  public updateBalance(balance: number): void {
    if (balance < 0) {
      throw new ValidationException('Balance cannot be negative');
    }

    this.data.balance = balance;
    this.data.updatedAt = new Date();
  }

  /**
   * Update priority
   */
  public updatePriority(priority: number): void {
    if (priority < 1) {
      throw new ValidationException('Priority must be at least 1');
    }

    this.data.priority = priority;
    this.data.updatedAt = new Date();
  }

  /**
   * Record successful order
   */
  public recordSuccessfulOrder(responseTime: number): void {
    this.data.statistics.totalOrders++;
    this.data.statistics.successfulOrders++;
    this.data.statistics.lastSuccessfulRequest = new Date();
    
    // Update average response time
    this.updateAverageResponseTime(responseTime);
    
    // Reset consecutive failures on success
    this.data.healthCheck.consecutiveFailures = 0;
    this.data.healthCheck.isHealthy = true;
    
    this.data.updatedAt = new Date();
  }

  /**
   * Record failed order
   */
  public recordFailedOrder(responseTime?: number): void {
    this.data.statistics.totalOrders++;
    this.data.statistics.failedOrders++;
    this.data.statistics.lastFailedRequest = new Date();
    
    if (responseTime) {
      this.updateAverageResponseTime(responseTime);
    }
    
    // Increment consecutive failures
    this.data.healthCheck.consecutiveFailures++;
    
    // Mark as unhealthy after 3 consecutive failures
    if (this.data.healthCheck.consecutiveFailures >= 3) {
      this.data.healthCheck.isHealthy = false;
    }
    
    this.data.updatedAt = new Date();
  }

  /**
   * Update health check status
   */
  public updateHealthCheck(isHealthy: boolean, responseTime?: number): void {
    this.data.healthCheck.isHealthy = isHealthy;
    this.data.healthCheck.lastCheck = new Date();
    
    if (responseTime !== undefined) {
      this.data.healthCheck.responseTime = responseTime;
    }
    
    if (isHealthy) {
      this.data.healthCheck.consecutiveFailures = 0;
    } else {
      this.data.healthCheck.consecutiveFailures++;
    }
    
    this.data.updatedAt = new Date();
  }

  /**
   * Update features
   */
  public updateFeatures(features: Partial<ProviderEntityData['features']>): void {
    this.data.features = {
      ...this.data.features,
      ...features,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Update rate limits
   */
  public updateRateLimit(rateLimit: ProviderEntityData['rateLimit']): void {
    this.data.rateLimit = rateLimit;
    this.data.updatedAt = new Date();
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.data.statistics = {
      totalOrders: 0,
      successfulOrders: 0,
      failedOrders: 0,
      averageResponseTime: 0,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Get data for persistence
   */
  public toData(): ProviderEntityData {
    return { ...this.data };
  }

  /**
   * Get public data (safe for API responses)
   */
  public toPublicData(): Omit<ProviderEntityData, 'credentials'> {
    const { credentials, ...publicData } = this.data;
    return publicData;
  }

  /**
   * Get masked credentials for display
   */
  public getMaskedCredentials(): Partial<ProviderCredentials> {
    return {
      apiUrl: this.data.credentials.apiUrl,
      apiKey: this.maskApiKey(this.data.credentials.apiKey),
      timeout: this.data.credentials.timeout,
      retryAttempts: this.data.credentials.retryAttempts,
    };
  }

  // Private helper methods

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalOrders = this.data.statistics.totalOrders;
    const currentAverage = this.data.statistics.averageResponseTime;
    
    // Calculate new average using incremental formula
    this.data.statistics.averageResponseTime = 
      ((currentAverage * (totalOrders - 1)) + responseTime) / totalOrders;
  }

  /**
   * Mask API key for display
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }
    
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(apiKey.length - 8);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Validate provider data
   */
  private validate(): void {
    if (!this.data.name || this.data.name.trim().length === 0) {
      throw new ValidationException('Provider name is required');
    }

    if (!this.data.credentials.apiUrl || !this.isValidUrl(this.data.credentials.apiUrl)) {
      throw new ValidationException('Valid API URL is required');
    }

    if (!this.data.credentials.apiKey || this.data.credentials.apiKey.trim().length === 0) {
      throw new ValidationException('API key is required');
    }

    if (this.data.priority < 1) {
      throw new ValidationException('Priority must be at least 1');
    }

    if (this.data.balance !== undefined && this.data.balance < 0) {
      throw new ValidationException('Balance cannot be negative');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
