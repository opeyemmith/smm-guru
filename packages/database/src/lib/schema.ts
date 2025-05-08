import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

const timestamps = {
  updated_at: t.timestamp(),
  created_at: t.timestamp().defaultNow().notNull(),
};

export const user = t.pgTable("user", {
  id: t.text("id").primaryKey(),
  name: t.text("name").notNull(),
  email: t.text("email").notNull().unique(),
  emailVerified: t.boolean("email_verified").notNull(),
  image: t.text("image"),
  createdAt: t.timestamp("created_at").notNull(),
  updatedAt: t.timestamp("updated_at").notNull(),
  role: t.text("role"),
  banned: t.boolean("banned"),
  banReason: t.text("ban_reason"),
  banExpires: t.timestamp("ban_expires"),
});

export const userRelation = relations(user, ({ many, one }) => ({
  providers: many(providersSchema),
  servicesCategories: many(servicesCatSchema),
  services: many(servicesSchema),
  orders: many(orderSchema),
  wallet: one(wallet),
  transactions: many(transaction),
}));

export const providersSchema = t.pgTable("providers_schema", {
  id: t.serial("id").primaryKey(),
  name: t.text("name").notNull(),
  apiUrl: t.text("api_url").notNull(),
  apiKey: t.text("api_key").notNull(),
  iv: t.text("iv").notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const providersRelation = relations(
  providersSchema,
  ({ one, many }) => ({
    userId: one(user, {
      fields: [providersSchema.userId],
      references: [user.id],
    }),
    services: many(servicesSchema),
  })
);

export const servicesCatSchema = t.pgTable("services_category", {
  id: t.serial("id").primaryKey(),
  name: t.text("name").notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const servicesCatRelation = relations(
  servicesCatSchema,
  ({ many, one }) => ({
    services: many(servicesSchema),
    userId: one(user, {
      fields: [servicesCatSchema.userId],
      references: [user.id],
    }),
  })
);

export const servicesSchema = t.pgTable("services", {
  id: t.serial("id").primaryKey(),
  service: t.text("service").notNull(),
  name: t.text("name").notNull(),
  type: t.text("type").notNull(),
  rate: t.real("rate").notNull(),
  profit: t.real("profit"),
  min: t.integer("min").notNull(),
  max: t.integer("max").notNull(),
  dripfeed: t.boolean("dripfeed").notNull(),
  refill: t.boolean("refill").notNull(),
  cancel: t.boolean("cancel").notNull(),
  category: t.text("category").notNull(),
  currency: t.text("currency").default("USD").notNull(),
  categoryId: t
    .integer("category_id")
    .notNull()
    .references(() => servicesCatSchema.id, { onDelete: "cascade" }),
  providerId: t
    .integer("provider_id")
    .notNull()
    .references(() => providersSchema.id, { onDelete: "cascade" }),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const servicesRelation = relations(servicesSchema, ({ one, many }) => ({
  userId: one(user, {
    fields: [servicesSchema.userId],
    references: [user.id],
  }),
  providerId: one(providersSchema, {
    fields: [servicesSchema.providerId],
    references: [providersSchema.id],
  }),
  categoryId: one(servicesCatSchema, {
    fields: [servicesSchema.categoryId],
    references: [servicesCatSchema.id],
  }),
  order: many(orderSchema),
}));

export const orderSchema = t.pgTable("orders", {
  id: t.serial("id").primaryKey(),
  link: t.text("link").notNull(),
  refill: t.boolean("refill").notNull(),
  serviceName: t.text("service_name").notNull(),
  price: t.real("price").notNull(),
  currency: t.text("currency").default("USD").notNull(),
  providerOrderId: t.integer("provider_order_id").notNull(),
  status: t.text("status").default("PENDING").notNull(),
  service: t
    .integer("service")
    .notNull()
    .references(() => servicesSchema.id, { onDelete: "cascade" }),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const ordersRelation = relations(orderSchema, ({ one }) => ({
  userId: one(user, {
    fields: [orderSchema.userId],
    references: [user.id],
  }),
  service: one(servicesSchema, {
    fields: [orderSchema.service],
    references: [servicesSchema.id],
  }),
}));

// Wallet core schemas
export const wallet = t.pgTable("wallet", {
  id: t.serial("id").primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: t
    .numeric("balance", { precision: 20, scale: 2 })
    .default("0")
    .notNull(),
  currency: t.text("currency").default("USD").notNull(),
  status: t
    .text("status")
    .$type<"active" | "frozen" | "suspended">()
    .default("active"),
  ...timestamps,
});

export const walletRelations = relations(wallet, ({ one, many }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
  }),
  outgoingTransactions: many(transaction, {
    relationName: "from_wallet",
  }),
  incomingTransactions: many(transaction, {
    relationName: "to_wallet",
  }),
  transactionFee: many(transactionFee),
}));

export const transaction = t.pgTable("transaction", {
  id: t.serial("id").primaryKey(),
  amount: t.numeric("amount", { precision: 20, scale: 2 }).notNull(),
  type: t
    .text("type")
    .$type<"deposit" | "withdrawal" | "transfer" | "fee" | "debit">()
    .notNull(),
  status: t
    .text("status")
    .$type<"pending" | "completed" | "failed" | "reversed">()
    .default("pending"),
  metadata: t.jsonb("metadata").$type<{
    paytmReference?: string;
  }>(),
  reference: t.text("reference").unique(),
  fromWalletId: t.integer("from_wallet_id").references(() => wallet.id),
  toWalletId: t.integer("to_wallet_id").references(() => wallet.id),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  fromWallet: one(wallet, {
    fields: [transaction.fromWalletId],
    references: [wallet.id],
    relationName: "from_wallet", // Matches wallet's outgoingTransactions
  }),
  toWallet: one(wallet, {
    fields: [transaction.toWalletId],
    references: [wallet.id],
    relationName: "to_wallet", // Matches wallet's incomingTransactions
  }),
  transactionFee: one(transactionFee),
}));

// Fee handling schema (for agent commissions etc.)
export const transactionFee = t.pgTable("transaction_fee", {
  id: t.text("id").primaryKey(),
  transactionId: t
    .integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  feeType: t.text("fee_type").notNull(),
  amount: t.numeric("amount", { precision: 20, scale: 2 }).notNull(),
  recipientWalletId: t
    .integer("recipient_wallet_id")
    .references(() => wallet.id),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const transactionFeeRelations = relations(transactionFee, ({ one }) => ({
  user: one(user, {
    fields: [transactionFee.userId],
    references: [user.id],
  }),
  transaction: one(transaction, {
    fields: [transactionFee.transactionId], // Fixed field reference
    references: [transaction.id],
    relationName: "transaction_fees", // Added matching relation name
  }),
  recipientWallet: one(wallet, {
    fields: [transactionFee.recipientWalletId],
    references: [wallet.id],
    relationName: "fee_recipient", // Added unique relation name
  }),
}));

export const session = t.pgTable("session", {
  id: t.text("id").primaryKey(),
  expiresAt: t.timestamp("expires_at").notNull(),
  token: t.text("token").notNull().unique(),
  createdAt: t.timestamp("created_at").notNull(),
  updatedAt: t.timestamp("updated_at").notNull(),
  ipAddress: t.text("ip_address"),
  userAgent: t.text("user_agent"),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: t.text("impersonated_by"),
});

export const account = t.pgTable("account", {
  id: t.text("id").primaryKey(),
  accountId: t.text("account_id").notNull(),
  providerId: t.text("provider_id").notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: t.text("access_token"),
  refreshToken: t.text("refresh_token"),
  idToken: t.text("id_token"),
  accessTokenExpiresAt: t.timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at"),
  scope: t.text("scope"),
  password: t.text("password"),
  createdAt: t.timestamp("created_at").notNull(),
  updatedAt: t.timestamp("updated_at").notNull(),
});

export const verification = t.pgTable("verification", {
  id: t.text("id").primaryKey(),
  identifier: t.text("identifier").notNull(),
  value: t.text("value").notNull(),
  expiresAt: t.timestamp("expires_at").notNull(),
  createdAt: t.timestamp("created_at"),
  updatedAt: t.timestamp("updated_at"),
});

export const apikey = t.pgTable("apikey", {
  id: t.text("id").primaryKey(),
  name: t.text("name"),
  start: t.text("start"),
  prefix: t.text("prefix"),
  key: t.text("key").notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  refillInterval: t.integer("refill_interval"),
  refillAmount: t.integer("refill_amount"),
  lastRefillAt: t.timestamp("last_refill_at"),
  enabled: t.boolean("enabled"),
  rateLimitEnabled: t.boolean("rate_limit_enabled"),
  rateLimitTimeWindow: t.integer("rate_limit_time_window"),
  rateLimitMax: t.integer("rate_limit_max"),
  requestCount: t.integer("request_count"),
  remaining: t.integer("remaining"),
  lastRequest: t.timestamp("last_request"),
  expiresAt: t.timestamp("expires_at"),
  createdAt: t.timestamp("created_at").notNull(),
  updatedAt: t.timestamp("updated_at").notNull(),
  permissions: t.text("permissions"),
  metadata: t.text("metadata"),
});
