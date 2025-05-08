"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.apikey = exports.verification = exports.account = exports.session = exports.transactionFeeRelations = exports.transactionFee = exports.transactionRelations = exports.transaction = exports.walletRelations = exports.wallet = exports.ordersRelation = exports.orderSchema = exports.servicesRelation = exports.servicesSchema = exports.servicesCatRelation = exports.servicesCatSchema = exports.providersRelation = exports.providersSchema = exports.userRelation = exports.user = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const t = __importStar(require("drizzle-orm/pg-core"));
const timestamps = {
    updated_at: t.timestamp(),
    created_at: t.timestamp().defaultNow().notNull(),
};
exports.user = t.pgTable("user", {
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
exports.userRelation = (0, drizzle_orm_1.relations)(exports.user, ({ many, one }) => ({
    providers: many(exports.providersSchema),
    servicesCategories: many(exports.servicesCatSchema),
    services: many(exports.servicesSchema),
    orders: many(exports.orderSchema),
    wallet: one(exports.wallet),
    transactions: many(exports.transaction),
}));
exports.providersSchema = t.pgTable("providers_schema", {
    id: t.serial("id").primaryKey(),
    name: t.text("name").notNull(),
    apiUrl: t.text("api_url").notNull(),
    apiKey: t.text("api_key").notNull(),
    iv: t.text("iv").notNull(),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.providersRelation = (0, drizzle_orm_1.relations)(exports.providersSchema, ({ one, many }) => ({
    userId: one(exports.user, {
        fields: [exports.providersSchema.userId],
        references: [exports.user.id],
    }),
    services: many(exports.servicesSchema),
}));
exports.servicesCatSchema = t.pgTable("services_category", {
    id: t.serial("id").primaryKey(),
    name: t.text("name").notNull(),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.servicesCatRelation = (0, drizzle_orm_1.relations)(exports.servicesCatSchema, ({ many, one }) => ({
    services: many(exports.servicesSchema),
    userId: one(exports.user, {
        fields: [exports.servicesCatSchema.userId],
        references: [exports.user.id],
    }),
}));
exports.servicesSchema = t.pgTable("services", {
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
        .references(() => exports.servicesCatSchema.id, { onDelete: "cascade" }),
    providerId: t
        .integer("provider_id")
        .notNull()
        .references(() => exports.providersSchema.id, { onDelete: "cascade" }),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.servicesRelation = (0, drizzle_orm_1.relations)(exports.servicesSchema, ({ one, many }) => ({
    userId: one(exports.user, {
        fields: [exports.servicesSchema.userId],
        references: [exports.user.id],
    }),
    providerId: one(exports.providersSchema, {
        fields: [exports.servicesSchema.providerId],
        references: [exports.providersSchema.id],
    }),
    categoryId: one(exports.servicesCatSchema, {
        fields: [exports.servicesSchema.categoryId],
        references: [exports.servicesCatSchema.id],
    }),
    order: many(exports.orderSchema),
}));
exports.orderSchema = t.pgTable("orders", {
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
        .references(() => exports.servicesSchema.id, { onDelete: "cascade" }),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.ordersRelation = (0, drizzle_orm_1.relations)(exports.orderSchema, ({ one }) => ({
    userId: one(exports.user, {
        fields: [exports.orderSchema.userId],
        references: [exports.user.id],
    }),
    service: one(exports.servicesSchema, {
        fields: [exports.orderSchema.service],
        references: [exports.servicesSchema.id],
    }),
}));
// Wallet core schemas
exports.wallet = t.pgTable("wallet", {
    id: t.serial("id").primaryKey(),
    userId: t
        .text("user_id")
        .notNull()
        .unique()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    balance: t
        .numeric("balance", { precision: 20, scale: 2 })
        .default("0")
        .notNull(),
    currency: t.text("currency").default("USD").notNull(),
    status: t
        .text("status")
        .$type()
        .default("active"),
    ...timestamps,
});
exports.walletRelations = (0, drizzle_orm_1.relations)(exports.wallet, ({ one, many }) => ({
    user: one(exports.user, {
        fields: [exports.wallet.userId],
        references: [exports.user.id],
    }),
    outgoingTransactions: many(exports.transaction, {
        relationName: "from_wallet",
    }),
    incomingTransactions: many(exports.transaction, {
        relationName: "to_wallet",
    }),
    transactionFee: many(exports.transactionFee),
}));
exports.transaction = t.pgTable("transaction", {
    id: t.serial("id").primaryKey(),
    amount: t.numeric("amount", { precision: 20, scale: 2 }).notNull(),
    type: t
        .text("type")
        .$type()
        .notNull(),
    status: t
        .text("status")
        .$type()
        .default("pending"),
    metadata: t.jsonb("metadata").$type(),
    reference: t.text("reference").unique(),
    fromWalletId: t.integer("from_wallet_id").references(() => exports.wallet.id),
    toWalletId: t.integer("to_wallet_id").references(() => exports.wallet.id),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.transactionRelations = (0, drizzle_orm_1.relations)(exports.transaction, ({ one }) => ({
    user: one(exports.user, {
        fields: [exports.transaction.userId],
        references: [exports.user.id],
    }),
    fromWallet: one(exports.wallet, {
        fields: [exports.transaction.fromWalletId],
        references: [exports.wallet.id],
        relationName: "from_wallet", // Matches wallet's outgoingTransactions
    }),
    toWallet: one(exports.wallet, {
        fields: [exports.transaction.toWalletId],
        references: [exports.wallet.id],
        relationName: "to_wallet", // Matches wallet's incomingTransactions
    }),
    transactionFee: one(exports.transactionFee),
}));
// Fee handling schema (for agent commissions etc.)
exports.transactionFee = t.pgTable("transaction_fee", {
    id: t.text("id").primaryKey(),
    transactionId: t
        .integer("transaction_id")
        .notNull()
        .references(() => exports.transaction.id, { onDelete: "cascade" }),
    feeType: t.text("fee_type").notNull(),
    amount: t.numeric("amount", { precision: 20, scale: 2 }).notNull(),
    recipientWalletId: t
        .integer("recipient_wallet_id")
        .references(() => exports.wallet.id),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
    ...timestamps,
});
exports.transactionFeeRelations = (0, drizzle_orm_1.relations)(exports.transactionFee, ({ one }) => ({
    user: one(exports.user, {
        fields: [exports.transactionFee.userId],
        references: [exports.user.id],
    }),
    transaction: one(exports.transaction, {
        fields: [exports.transactionFee.transactionId], // Fixed field reference
        references: [exports.transaction.id],
        relationName: "transaction_fees", // Added matching relation name
    }),
    recipientWallet: one(exports.wallet, {
        fields: [exports.transactionFee.recipientWalletId],
        references: [exports.wallet.id],
        relationName: "fee_recipient", // Added unique relation name
    }),
}));
exports.session = t.pgTable("session", {
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
        .references(() => exports.user.id, { onDelete: "cascade" }),
    impersonatedBy: t.text("impersonated_by"),
});
exports.account = t.pgTable("account", {
    id: t.text("id").primaryKey(),
    accountId: t.text("account_id").notNull(),
    providerId: t.text("provider_id").notNull(),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
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
exports.verification = t.pgTable("verification", {
    id: t.text("id").primaryKey(),
    identifier: t.text("identifier").notNull(),
    value: t.text("value").notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
    createdAt: t.timestamp("created_at"),
    updatedAt: t.timestamp("updated_at"),
});
exports.apikey = t.pgTable("apikey", {
    id: t.text("id").primaryKey(),
    name: t.text("name"),
    start: t.text("start"),
    prefix: t.text("prefix"),
    key: t.text("key").notNull(),
    userId: t
        .text("user_id")
        .notNull()
        .references(() => exports.user.id, { onDelete: "cascade" }),
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
//# sourceMappingURL=schema.js.map