/**
 * Database Schema Definitions
 * Consolidated schema - single source of truth for the entire monorepo
 */

import { pgTable, text, integer, decimal, boolean, timestamp, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from "drizzle-orm";

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'pending_verification']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'moderator']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 
  'processing', 
  'in_progress', 
  'completed', 
  'partial', 
  'cancelled', 
  'refunded', 
  'failed'
]);
export const orderPriorityEnum = pgEnum('order_priority', ['low', 'medium', 'high', 'urgent']);
export const serviceStatusEnum = pgEnum('service_status', ['active', 'inactive', 'maintenance', 'deprecated']);
export const serviceCategoryEnum = pgEnum('service_category', [
  'instagram', 
  'facebook', 
  'twitter', 
  'youtube', 
  'tiktok', 
  'linkedin', 
  'other'
]);
export const serviceTypeEnum = pgEnum('service_type', [
  'followers', 
  'likes', 
  'views', 
  'comments', 
  'shares', 
  'subscribers', 
  'other'
]);
export const providerStatusEnum = pgEnum('provider_status', ['active', 'inactive', 'maintenance', 'suspended']);
export const providerTypeEnum = pgEnum('provider_type', ['api', 'manual', 'hybrid']);
export const walletStatusEnum = pgEnum('wallet_status', ['active', 'suspended', 'frozen', 'closed']);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit', 
  'withdrawal', 
  'order', 
  'refund', 
  'bonus', 
  'penalty', 
  'transfer'
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending', 
  'completed', 
  'failed', 
  'cancelled', 
  'processing'
]);

/**
 * Users table
 */
export const user = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatar: text('avatar'),
  roles: userRoleEnum('roles').array().notNull().default(['user']),
  status: userStatusEnum('status').notNull().default('pending_verification'),
  emailVerified: boolean('email_verified').notNull().default(false),
  phoneNumber: text('phone_number'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  timezone: text('timezone'),
  language: text('language').notNull().default('en'),
  lastLoginAt: timestamp('last_login_at'),
  lastActiveAt: timestamp('last_active_at'),
  loginAttempts: integer('login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  passwordChangedAt: timestamp('password_changed_at'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: text('two_factor_secret'),
  apiKeyEnabled: boolean('api_key_enabled').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Providers table
 */
export const providersSchema = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: providerTypeEnum('type').notNull(),
  status: providerStatusEnum('status').notNull().default('inactive'),
  apiUrl: text('api_url').notNull(),
  apiKey: text('api_key').notNull(),
  additionalHeaders: jsonb('additional_headers'),
  timeout: integer('timeout'),
  retryAttempts: integer('retry_attempts'),
  balance: decimal('balance', { precision: 10, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  priority: integer('priority').notNull().default(1),
  rateLimit: jsonb('rate_limit'),
  features: jsonb('features').notNull().default('{}'),
  statistics: jsonb('statistics').notNull().default('{}'),
  healthCheck: jsonb('health_check').notNull().default('{}'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Services table
 */
export const servicesSchema = pgTable('services', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: serviceCategoryEnum('category').notNull(),
  type: serviceTypeEnum('type').notNull(),
  rate: decimal('rate', { precision: 10, scale: 4 }).notNull(),
  min: integer('min').notNull(),
  max: integer('max').notNull(),
  profit: decimal('profit', { precision: 10, scale: 4 }),
  status: serviceStatusEnum('status').notNull().default('active'),
  providerId: uuid('provider_id').notNull(),
  providerServiceId: text('provider_service_id').notNull(),
  averageTime: text('average_time'),
  dripFeed: boolean('drip_feed').notNull().default(false),
  refill: boolean('refill').notNull().default(false),
  cancel: boolean('cancel').notNull().default(false),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Orders table
 */
export const orderSchema = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  service: integer('service').notNull(),
  providerId: integer('provider_id').notNull(),
  providerOrderId: integer('provider_order_id'),
  link: text('link').notNull(),
  quantity: integer('quantity').notNull(),
  startCount: integer('start_count'),
  remains: integer('remains'),
  price: decimal('price', { precision: 10, scale: 4 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  priority: orderPriorityEnum('priority').notNull().default('medium'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  failedAt: timestamp('failed_at'),
  cancelledAt: timestamp('cancelled_at'),
});

/**
 * Wallets table
 */
export const wallet = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  balance: decimal('balance', { precision: 10, scale: 4 }).notNull().default('0'),
  currency: text('currency').notNull().default('USD'),
  status: walletStatusEnum('status').notNull().default('active'),
  dailySpendLimit: decimal('daily_spend_limit', { precision: 10, scale: 2 }),
  monthlySpendLimit: decimal('monthly_spend_limit', { precision: 10, scale: 2 }),
  totalSpentToday: decimal('total_spent_today', { precision: 10, scale: 4 }).notNull().default('0'),
  totalSpentThisMonth: decimal('total_spent_this_month', { precision: 10, scale: 4 }).notNull().default('0'),
  lastTransactionAt: timestamp('last_transaction_at'),
  freezeReason: text('freeze_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Transactions table
 */
export const transaction = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: transactionStatusEnum('status').notNull().default('pending'),
  description: text('description').notNull(),
  reference: text('reference'), // External reference (order ID, payment ID, etc.)
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * API Keys table (for backward compatibility)
 */
export const apikey = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  permissions: text('permissions').array(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Sessions table (for JWT session management)
 */
export const session = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  token: text('token').notNull().unique(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isActive: boolean('is_active').notNull().default(true),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export all schemas
export const schemas = {
  users: user,
  services: servicesSchema,
  providers: providersSchema,
  orders: orderSchema,
  wallets: wallet,
  transactions: transaction,
  apiKeys: apikey,
  sessions: session,
};

// Export types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Service = typeof servicesSchema.$inferSelect;
export type NewService = typeof servicesSchema.$inferInsert;
export type Provider = typeof providersSchema.$inferSelect;
export type NewProvider = typeof providersSchema.$inferInsert;
export type Order = typeof orderSchema.$inferSelect;
export type NewOrder = typeof orderSchema.$inferInsert;
export type Wallet = typeof wallet.$inferSelect;
export type NewWallet = typeof wallet.$inferInsert;
export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
export type ApiKey = typeof apikey.$inferSelect;
export type NewApiKey = typeof apikey.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// Type aliases for backward compatibility
export type TUser = User;
export type TService = Service;
export type TProvider = Provider;
export type TOrder = Order;
export type TWallet = Wallet;
export type TTransaction = Transaction;
export type TApiKey = ApiKey;
export type TSession = Session;
export type TCategory = { id: number; name: string; }; // Simplified category type
