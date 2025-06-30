# 🏗️ SMM Guru Backend Architecture

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Folder Structure](#folder-structure)
- [Layer Responsibilities](#layer-responsibilities)
- [Design Patterns](#design-patterns)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## 🎯 Overview

This document outlines the enterprise-grade architecture for the SMM Guru backend application. The architecture follows **Clean Architecture** principles with **Domain-Driven Design (DDD)** patterns, ensuring scalability, maintainability, and testability.

### Key Improvements
- ✅ **Proper Separation of Concerns** - Clear boundaries between layers
- ✅ **Repository Pattern** - Abstracted data access layer
- ✅ **Service Layer** - Centralized business logic
- ✅ **Controller Layer** - HTTP request/response handling
- ✅ **Entity Models** - Rich domain models with business rules
- ✅ **Centralized Error Handling** - Consistent error responses
- ✅ **Configuration Management** - Environment-based configuration
- ✅ **Dependency Injection** - Loose coupling between components

## 🏛️ Architecture Principles

### 1. **Clean Architecture**
```
┌─────────────────────────────────────────┐
│                API Layer                │ ← Controllers, Routes, Middleware
├─────────────────────────────────────────┤
│             Business Layer              │ ← Services, Use Cases
├─────────────────────────────────────────┤
│              Domain Layer               │ ← Entities, Value Objects
├─────────────────────────────────────────┤
│           Infrastructure Layer          │ ← Database, External APIs, Queue
└─────────────────────────────────────────┘
```

### 2. **Dependency Direction**
- **Inward Dependencies**: Outer layers depend on inner layers
- **Interface Segregation**: Use interfaces for external dependencies
- **Dependency Inversion**: Depend on abstractions, not concretions

### 3. **Single Responsibility**
- Each class/module has one reason to change
- Clear separation of concerns
- Focused, cohesive components

## 📁 Folder Structure

```
apps/backend/
├── src/
│   ├── api/                           # 🌐 API Layer (Controllers & Routes)
│   │   ├── v1/                        # API versioning
│   │   │   ├── auth/                  # Authentication endpoints
│   │   │   ├── admin/                 # Admin management
│   │   │   ├── dashboard/             # User dashboard
│   │   │   ├── public/                # Public endpoints
│   │   │   └── webhooks/              # External webhooks
│   │   ├── middleware/                # API-specific middleware
│   │   └── health/                    # Health check endpoints
│   │
│   ├── core/                          # 🧠 Business Logic Layer
│   │   ├── services/                  # Business services
│   │   │   ├── auth/                  # Authentication services
│   │   │   ├── order/                 # Order management
│   │   │   ├── payment/               # Payment processing
│   │   │   ├── provider/              # Provider integration
│   │   │   └── notification/          # Notification services
│   │   ├── repositories/              # Data access layer
│   │   │   ├── base/                  # Base repository pattern
│   │   │   ├── user/                  # User data access
│   │   │   ├── order/                 # Order data access
│   │   │   └── service/               # Service data access
│   │   ├── entities/                  # Domain models
│   │   │   ├── user.entity.ts         # User domain model
│   │   │   ├── order.entity.ts        # Order domain model
│   │   │   └── service.entity.ts      # Service domain model
│   │   └── dto/                       # Data transfer objects
│   │       ├── auth/                  # Authentication DTOs
│   │       ├── order/                 # Order DTOs
│   │       └── common/                # Common DTOs
│   │
│   ├── infrastructure/                # 🔧 Infrastructure Layer
│   │   ├── database/                  # Database connections
│   │   ├── cache/                     # Redis caching
│   │   ├── queue/                     # Background job processing
│   │   ├── external/                  # External service clients
│   │   └── monitoring/                # Logging and metrics
│   │
│   ├── shared/                        # 🔄 Shared Utilities
│   │   ├── types/                     # TypeScript type definitions
│   │   ├── utils/                     # Utility functions
│   │   ├── exceptions/                # Custom exception classes
│   │   ├── constants/                 # Application constants
│   │   └── middleware/                # Global middleware
│   │
│   ├── config/                        # ⚙️ Configuration
│   │   ├── app.config.ts              # Application configuration
│   │   ├── database.config.ts         # Database configuration
│   │   └── redis.config.ts            # Redis configuration
│   │
│   ├── tests/                         # 🧪 Test Files
│   │   ├── unit/                      # Unit tests
│   │   ├── integration/               # Integration tests
│   │   └── e2e/                       # End-to-end tests
│   │
│   ├── server.ts                      # 🚀 Server entry point
│   └── app.ts                         # Application setup
│
├── docs/                              # 📚 Documentation
├── scripts/                           # 🔨 Build & deployment scripts
├── Dockerfile                         # 🐳 Docker configuration
└── package.json                       # 📦 Dependencies
```

## 🎯 Layer Responsibilities

### 1. **API Layer** (`src/api/`)
**Responsibility**: Handle HTTP requests and responses
- Route definitions and middleware
- Request validation and sanitization
- Response formatting
- Authentication and authorization
- Rate limiting and CORS

**Example**:
```typescript
// orders.controller.ts
export class OrdersController {
  constructor(private orderService: OrderService) {}

  async createOrder(c: Context): Promise<Response> {
    const body = await c.req.json();
    const order = await this.orderService.createOrder(body);
    return sendSuccess(c, 'ORDER_CREATED', 'Order created', order);
  }
}
```

### 2. **Core/Business Layer** (`src/core/`)
**Responsibility**: Implement business logic and rules
- Business services and use cases
- Domain entities with business rules
- Repository interfaces
- Data transfer objects

**Example**:
```typescript
// order.service.ts
export class OrderService {
  async createOrder(data: CreateOrderData): Promise<OrderEntity> {
    // Business validation
    await this.validateOrderData(data);
    
    // Business logic
    const order = OrderEntity.create(data);
    
    // Persist through repository
    return await this.orderRepository.save(order);
  }
}
```

### 3. **Infrastructure Layer** (`src/infrastructure/`)
**Responsibility**: Handle external concerns
- Database connections and queries
- External API integrations
- File system operations
- Queue and cache management

**Example**:
```typescript
// order.repository.ts
export class OrderRepository extends BaseRepository<Order> {
  async findByUserId(userId: string): Promise<Order[]> {
    return await this.findMany({ where: eq(this.table.userId, userId) });
  }
}
```

### 4. **Shared Layer** (`src/shared/`)
**Responsibility**: Provide common utilities
- Type definitions
- Utility functions
- Exception classes
- Constants and enums

## 🎨 Design Patterns

### 1. **Repository Pattern**
```typescript
interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  delete(id: string): Promise<void>;
}

class OrderRepository implements IOrderRepository {
  // Implementation
}
```

### 2. **Service Layer Pattern**
```typescript
class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private paymentService: IPaymentService
  ) {}
  
  async processOrder(data: OrderData): Promise<Order> {
    // Business logic here
  }
}
```

### 3. **Entity Pattern**
```typescript
class OrderEntity {
  private constructor(private data: OrderData) {}
  
  static create(data: CreateOrderData): OrderEntity {
    // Validation and business rules
    return new OrderEntity(data);
  }
  
  updateStatus(status: OrderStatus): void {
    // Business rules for status transitions
  }
}
```

### 4. **Factory Pattern**
```typescript
class ProviderFactory {
  static create(type: ProviderType): IProvider {
    switch (type) {
      case 'instagram': return new InstagramProvider();
      case 'facebook': return new FacebookProvider();
      default: throw new Error('Unknown provider');
    }
  }
}
```

## 🔄 Migration Guide

### Phase 1: Foundation (Week 1)
1. ✅ Create new folder structure
2. ✅ Implement base repository pattern
3. ✅ Create entity models
4. ✅ Setup configuration management
5. ✅ Implement error handling

### Phase 2: Core Services (Week 2)
1. Migrate order management logic
2. Implement user service
3. Create payment service
4. Setup provider integration
5. Add notification service

### Phase 3: API Layer (Week 3)
1. Refactor route handlers to controllers
2. Implement proper validation
3. Add comprehensive middleware
4. Setup API versioning
5. Improve error responses

### Phase 4: Infrastructure (Week 4)
1. Optimize database layer
2. Implement caching strategy
3. Setup queue processing
4. Add monitoring and logging
5. Performance optimization

## 📋 Best Practices

### 1. **Code Organization**
- One class per file
- Descriptive file and folder names
- Consistent naming conventions
- Clear import/export structure

### 2. **Error Handling**
- Use custom exception classes
- Centralized error handling
- Consistent error responses
- Proper logging

### 3. **Testing**
- Unit tests for business logic
- Integration tests for repositories
- E2E tests for API endpoints
- Mock external dependencies

### 4. **Security**
- Input validation at API layer
- Business rule validation in services
- Proper authentication/authorization
- Rate limiting and CORS

### 5. **Performance**
- Database query optimization
- Caching strategy
- Async/await best practices
- Connection pooling

## 🚀 Benefits of New Architecture

### ✅ **Maintainability**
- Clear separation of concerns
- Easy to locate and modify code
- Reduced coupling between components

### ✅ **Testability**
- Isolated business logic
- Mockable dependencies
- Clear interfaces

### ✅ **Scalability**
- Modular architecture
- Easy to add new features
- Horizontal scaling support

### ✅ **Team Collaboration**
- Clear code organization
- Consistent patterns
- Self-documenting structure

### ✅ **Production Ready**
- Enterprise-grade patterns
- Proper error handling
- Comprehensive logging
- Security best practices
