/**
 * Repository Interface Definitions
 * Contracts for data access layer implementations
 */

import type { OrderSchema, ServicesSchema, ProvidersSchema, WalletSchema, TransactionSchema } from '@smm-guru/database';
import type { RepositoryOptions, FindOptions, PaginatedResult } from './base.repository.js';
import type { PaginationQuery } from '../../types/api.types.js';

// Base Repository Interface
export interface IBaseRepository<T> {
  findById(id: string | number, options?: RepositoryOptions): Promise<T | null>;
  findByIdOrFail(id: string | number, resourceName: string, options?: RepositoryOptions): Promise<T>;
  findMany(findOptions?: FindOptions, options?: RepositoryOptions): Promise<T[]>;
  findAll(options?: RepositoryOptions): Promise<T[]>;
  findPaginated(pagination: PaginationQuery, findOptions?: Omit<FindOptions, 'limit' | 'offset'>, options?: RepositoryOptions): Promise<PaginatedResult<T>>;
  create(data: Partial<T>, options?: RepositoryOptions): Promise<T>;
  createMany(data: Partial<T>[], options?: RepositoryOptions): Promise<T[]>;
  updateById(id: string | number, data: Partial<T>, options?: RepositoryOptions): Promise<T | null>;
  updateByIdOrFail(id: string | number, data: Partial<T>, resourceName: string, options?: RepositoryOptions): Promise<T>;
  updateMany(where: any, data: Partial<T>, options?: RepositoryOptions): Promise<T[]>;
  deleteById(id: string | number, options?: RepositoryOptions): Promise<boolean>;
  deleteByIdOrFail(id: string | number, resourceName: string, options?: RepositoryOptions): Promise<void>;
  deleteMany(where: any, options?: RepositoryOptions): Promise<number>;
  exists(id: string | number, options?: RepositoryOptions): Promise<boolean>;
  count(where?: any, options?: RepositoryOptions): Promise<number>;
  transaction<R>(callback: (tx: any) => Promise<R>): Promise<R>;
}

// Order Repository Interface
export interface IOrderRepository extends IBaseRepository<OrderSchema> {
  findByUserId(userId: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<OrderSchema[]>;
  findByIdAndUserId(orderId: string, userId: string, options?: RepositoryOptions): Promise<OrderSchema | null>;
  findByIdAndUserIdOrFail(orderId: string, userId: string, options?: RepositoryOptions): Promise<OrderSchema>;
  findByProviderOrderId(providerOrderId: number, options?: RepositoryOptions): Promise<OrderSchema | null>;
  findByStatus(status: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<OrderSchema[]>;
  findByServiceId(serviceId: number, findOptions?: FindOptions, options?: RepositoryOptions): Promise<OrderSchema[]>;
  findWithFilters(filters: any, findOptions?: FindOptions, options?: RepositoryOptions): Promise<OrderSchema[]>;
  getOrderStats(filters?: any, options?: RepositoryOptions): Promise<any>;
  getTotalRevenue(filters?: any, options?: RepositoryOptions): Promise<number>;
  findPendingOrders(limit?: number, options?: RepositoryOptions): Promise<OrderSchema[]>;
  updateStatus(orderId: string, status: string, metadata?: Record<string, any>, options?: RepositoryOptions): Promise<OrderSchema>;
  updateProgress(orderId: string, startCount?: number, remains?: number, options?: RepositoryOptions): Promise<OrderSchema>;
  findByIds(orderIds: string[], options?: RepositoryOptions): Promise<OrderSchema[]>;
  getRecentOrdersByUserId(userId: string, limit?: number, options?: RepositoryOptions): Promise<OrderSchema[]>;
  countByUserAndStatus(userId: string, status: string, options?: RepositoryOptions): Promise<number>;
}

// Service Repository Interface
export interface IServiceRepository extends IBaseRepository<ServicesSchema> {
  findAllWithCalculatedPricing(options?: RepositoryOptions): Promise<any[]>;
  findByUserId(userId: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ServicesSchema[]>;
  findByIdAndUserId(serviceId: number, userId: string, options?: RepositoryOptions): Promise<ServicesSchema | null>;
  findByIdAndUserIdOrFail(serviceId: number, userId: string, options?: RepositoryOptions): Promise<ServicesSchema>;
  findByProviderId(providerId: number, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ServicesSchema[]>;
  findByCategory(category: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ServicesSchema[]>;
  findWithFilters(filters: any, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ServicesSchema[]>;
  getServiceDetailsForOrder(serviceId: number, userId: string, options?: RepositoryOptions): Promise<any>;
  calculateOrderCost(serviceId: number, quantity: number, userId: string, options?: RepositoryOptions): Promise<any>;
  validateQuantityLimits(serviceId: number, quantity: number, userId: string, options?: RepositoryOptions): Promise<any>;
  getPopularServices(limit?: number, options?: RepositoryOptions): Promise<any[]>;
  findByCurrency(currency: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ServicesSchema[]>;
  updatePricing(serviceId: number, rate: number, profit?: number, options?: RepositoryOptions): Promise<ServicesSchema>;
  getCategories(options?: RepositoryOptions): Promise<string[]>;
}

// Provider Repository Interface
export interface IProviderRepository extends IBaseRepository<ProvidersSchema> {
  findByUserId(userId: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ProvidersSchema[]>;
  findByIdAndUserId(providerId: number, userId: string, options?: RepositoryOptions): Promise<ProvidersSchema | null>;
  findByIdAndUserIdOrFail(providerId: number, userId: string, options?: RepositoryOptions): Promise<ProvidersSchema>;
  getProviderCredentials(providerId: number, userId: string, options?: RepositoryOptions): Promise<any>;
  findByNameAndUserId(name: string, userId: string, options?: RepositoryOptions): Promise<ProvidersSchema | null>;
  findWithFilters(filters: any, findOptions?: FindOptions, options?: RepositoryOptions): Promise<ProvidersSchema[]>;
  findActiveByUserId(userId: string, options?: RepositoryOptions): Promise<ProvidersSchema[]>;
  createWithEncryptedKey(providerData: any, options?: RepositoryOptions): Promise<ProvidersSchema>;
  updateApiCredentials(providerId: number, apiUrl: string, encryptedApiKey: string, iv: string, userId: string, options?: RepositoryOptions): Promise<ProvidersSchema>;
  updateStatus(providerId: number, isActive: boolean, userId: string, options?: RepositoryOptions): Promise<ProvidersSchema>;
  getProviderStats(providerId: number, userId: string, options?: RepositoryOptions): Promise<any>;
  isNameExistsForUser(name: string, userId: string, excludeId?: number, options?: RepositoryOptions): Promise<boolean>;
  getProviderForService(serviceId: number, userId: string, options?: RepositoryOptions): Promise<any>;
  deleteProviderCascade(providerId: number, userId: string, options?: RepositoryOptions): Promise<void>;
  testProviderConnection(providerId: number, userId: string, options?: RepositoryOptions): Promise<any>;
}

// Wallet Repository Interface
export interface IWalletRepository extends IBaseRepository<WalletSchema> {
  findByUserId(userId: string, options?: RepositoryOptions): Promise<WalletSchema | null>;
  findByUserIdOrFail(userId: string, options?: RepositoryOptions): Promise<WalletSchema>;
  getUserBalance(userId: string, options?: RepositoryOptions): Promise<number>;
  getWalletBalance(userId: string, options?: RepositoryOptions): Promise<any>;
  updateBalance(userId: string, newBalance: number, options?: RepositoryOptions): Promise<WalletSchema>;
  addFunds(userId: string, amount: number, options?: RepositoryOptions): Promise<WalletSchema>;
  deductFunds(userId: string, amount: number, options?: RepositoryOptions): Promise<WalletSchema>;
  hasSufficientBalance(userId: string, requiredAmount: number, options?: RepositoryOptions): Promise<boolean>;
  createWalletForUser(userId: string, initialBalance?: number, currency?: string, options?: RepositoryOptions): Promise<WalletSchema>;
  getWalletStats(userId: string, options?: RepositoryOptions): Promise<any>;
}

// Transaction Repository Interface
export interface ITransactionRepository extends IBaseRepository<TransactionSchema> {
  createTransaction(transactionData: any, options?: RepositoryOptions): Promise<TransactionSchema>;
  findByUserId(userId: string, findOptions?: FindOptions, options?: RepositoryOptions): Promise<TransactionSchema[]>;
  findWithFilters(filters: any, findOptions?: FindOptions, options?: RepositoryOptions): Promise<TransactionSchema[]>;
  getRecentTransactions(userId: string, limit?: number, options?: RepositoryOptions): Promise<TransactionSchema[]>;
  updateStatus(transactionId: string, status: string, options?: RepositoryOptions): Promise<TransactionSchema>;
  findByReference(reference: string, options?: RepositoryOptions): Promise<TransactionSchema | null>;
  getTransactionSummary(userId: string, dateFrom?: Date, dateTo?: Date, options?: RepositoryOptions): Promise<any>;
}

// User Repository Interface (placeholder for future implementation)
export interface IUserRepository extends IBaseRepository<any> {
  findByEmail(email: string, options?: RepositoryOptions): Promise<any>;
  findByIdOrFail(id: string, options?: RepositoryOptions): Promise<any>;
  updateLastLogin(userId: string, options?: RepositoryOptions): Promise<any>;
  updateStatus(userId: string, status: string, options?: RepositoryOptions): Promise<any>;
  findActiveUsers(findOptions?: FindOptions, options?: RepositoryOptions): Promise<any[]>;
  getUserStats(userId: string, options?: RepositoryOptions): Promise<any>;
}
