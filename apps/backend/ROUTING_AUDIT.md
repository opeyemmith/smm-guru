# API Routing Audit - Current State Analysis

## Current Routing Structure

### 1. **app.ts (Legacy - Backed Up)**
```typescript
// Health endpoints
app.get("/health", ...)           // ✅ Standard
app.get("/ready", ...)            // ✅ Standard  
app.get("/api/version", ...)      // ✅ Standard

// Authentication
app.all("/api/auth/*", ...)       // ✅ Standard Better Auth

// Main API routes
app.route("/v2", routes)          // ❌ INCONSISTENT - Should be /api/v1
```

### 2. **server.ts (Current Enterprise)**
```typescript
// Health endpoints
this.app.get("/health", ...)      // ✅ Standard
this.app.get("/ready", ...)       // ✅ Standard
this.app.get("/api/version", ...) // ✅ Standard

// Authentication  
this.app.all("/api/auth/*", ...)  // ✅ Standard Better Auth

// Main API routes
this.app.route("/v2", routes)     // ❌ INCONSISTENT - Should be /api/v1
```

### 3. **routes.config.ts Structure**
```typescript
const routes = new Hono();

// Current route mappings:
routes.route("/api-keys", apiKeyRoute)     // Maps to: /v2/api-keys
routes.route("/handler", handlerRoute)     // Maps to: /v2/handler  
routes.route("/orders", orderRoute)        // Maps to: /v2/orders
routes.route("/providers", providerRoute)  // Maps to: /v2/providers
routes.route("/services", serviceRoute)    // Maps to: /v2/services
routes.route("/transactions", transactionRoute) // Maps to: /v2/transactions
routes.route("/users", userRoute)          // Maps to: /v2/users
routes.route("/wallet", walletRoute)       // Maps to: /v2/wallet
```

## Current API Endpoints (Full Mapping)

### **Health & System Endpoints** ✅ CORRECT
- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /api/version` - API version info

### **Authentication Endpoints** ✅ CORRECT  
- `ALL /api/auth/*` - Better Auth handler

### **Business API Endpoints** ❌ INCONSISTENT VERSIONING

#### API Keys Management
- `GET /v2/api-keys` - List user API keys
- `POST /v2/api-keys` - Create new API key
- `PATCH /v2/api-keys` - Update API key
- `DELETE /v2/api-keys/:id` - Delete API key

#### Handler (Core SMM Operations)
- `POST /v2/handler` - Main SMM operations (services, add, status, balance)

#### Orders Management
- `GET /v2/orders` - List user orders
- `GET /v2/orders/:id` - Get specific order
- `POST /v2/orders` - Create new order
- `PATCH /v2/orders/:id` - Update order
- `DELETE /v2/orders/:id` - Delete order

#### Providers Management
- `GET /v2/providers` - List providers
- `POST /v2/providers` - Create provider
- `PATCH /v2/providers/:id` - Update provider
- `DELETE /v2/providers/:id` - Delete provider

#### Services Management
- `GET /v2/services` - List services
- `POST /v2/services` - Create service
- `PATCH /v2/services/:id` - Update service
- `DELETE /v2/services/:id` - Delete service

#### Transactions
- `GET /v2/transactions` - List transactions
- `POST /v2/transactions` - Create transaction

#### Users Management
- `GET /v2/users` - List users
- `GET /v2/users/:id` - Get user details
- `PATCH /v2/users/:id` - Update user
- `DELETE /v2/users/:id` - Delete user

#### Wallet Management
- `GET /v2/wallet` - Get wallet details
- `PATCH /v2/wallet` - Update wallet

## Issues Identified

### 🚨 **Critical Issues**

1. **Inconsistent API Versioning**
   - Using `/v2` instead of standard `/api/v1`
   - Conflicts with existing `/api/auth` and `/api/version` patterns
   - Not following REST API versioning best practices

2. **Mixed Versioning Patterns**
   - `/api/auth/*` (correct)
   - `/api/version` (correct)  
   - `/v2/*` (incorrect)

3. **No API Namespace Consistency**
   - Should be `/api/v1/*` for all business endpoints
   - Current `/v2/*` doesn't follow `/api/*` pattern

### ⚠️ **Medium Priority Issues**

1. **Route Organization**
   - All routes in single config file
   - No separation by domain/feature
   - Missing admin vs user route separation

2. **Missing Route Categories**
   - No admin-specific routes
   - No public routes (non-authenticated)
   - No webhook routes

## Target Structure (Clean Architecture)

### **Proposed Migration Path**

```
Current:                    Target:
/v2/api-keys           →   /api/v1/dashboard/api-keys
/v2/handler            →   /api/v1/public/handler  
/v2/orders             →   /api/v1/dashboard/orders
/v2/providers          →   /api/v1/admin/providers
/v2/services           →   /api/v1/admin/services  
/v2/transactions       →   /api/v1/dashboard/transactions
/v2/users              →   /api/v1/admin/users
/v2/wallet             →   /api/v1/dashboard/wallet
```

### **New Route Categories**

1. **Admin Routes** (`/api/v1/admin/*`)
   - User management
   - Provider management  
   - Service management
   - System administration

2. **Dashboard Routes** (`/api/v1/dashboard/*`)
   - User orders
   - Wallet management
   - API keys
   - Transaction history
   - Profile management

3. **Public Routes** (`/api/v1/public/*`)
   - Service catalog
   - Handler (SMM operations)
   - Health checks

4. **Webhook Routes** (`/api/v1/webhooks/*`)
   - Payment webhooks
   - Provider webhooks

## Migration Strategy

### **Phase 1: Immediate (This Task)**
1. Change `/v2` to `/api/v1` in routes.config.ts
2. Update server.ts routing
3. Test all endpoints work
4. Update any frontend API calls

### **Phase 2: Route Organization (Later)**
1. Split routes by category (admin/dashboard/public)
2. Implement proper route structure
3. Add new webhook routes
4. Update API documentation

## Dependencies & Impact

### **Files to Update**
- `src/routes/routes.config.ts` - Main routing configuration
- `src/server.ts` - Route mounting
- Frontend applications - API endpoint URLs
- API documentation
- Postman collections

### **Testing Required**
- All existing API endpoints
- Authentication flows
- Better Auth integration
- Frontend integration
- Mobile app integration (if exists)

## Completion Criteria

✅ **Task 1.2.1 Complete When:**
- All current routes documented
- Issues identified and prioritized  
- Migration path defined
- Impact assessment complete
