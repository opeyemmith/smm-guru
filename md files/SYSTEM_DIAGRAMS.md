# SMM Guru - System Architecture Diagrams

This document contains comprehensive visual diagrams that illustrate the SMM Guru system architecture, user flows, and technical implementation. These diagrams provide a clear understanding of how the application works at different levels.

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [User Journey Flow](#user-journey-flow)
3. [Order Processing Flow (Technical)](#order-processing-flow-technical)
4. [Database Entity Relationship](#database-entity-relationship)
5. [Data Flow Architecture](#data-flow-architecture)

---

## System Architecture Overview

This diagram shows the high-level system components and their relationships across the SMM Guru application.

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend (Next.js)"
        UI[User Interface]
        AUTH[Auth Pages]
        DASH[Dashboard]
        ADMIN[Admin Panel]
        API_PROXY[API Proxy]
    end

    %% Backend Services Layer
    subgraph "Backend (Hono)"
        API[REST API]
        AUTH_SVC[Auth Service]
        ORDER_SVC[Order Service]
        PROVIDER_SVC[Provider Service]
        WALLET_SVC[Wallet Service]
    end

    %% Background Processing
    subgraph "Background Jobs"
        QUEUE[BullMQ Queue]
        CRON[Cron Jobs]
        ORDER_MONITOR[Order Monitor]
    end

    %% Data Layer
    subgraph "Data Storage"
        DB[(PostgreSQL)]
        REDIS[(Redis)]
        MIGRATIONS[Drizzle Migrations]
    end

    %% External Services
    subgraph "External Services"
        SMM_PROVIDERS[SMM Providers]
        EMAIL_SVC[Email Service]
        GITHUB[GitHub OAuth]
    end

    %% Shared Packages
    subgraph "Shared Packages"
        DB_PKG[Database Package]
        UTILS_PKG[Utils Package]
        TYPES[Shared Types]
    end

    %% Connections
    UI --> API_PROXY
    AUTH --> AUTH_SVC
    DASH --> API_PROXY
    ADMIN --> API_PROXY
    
    API_PROXY --> API
    API --> AUTH_SVC
    API --> ORDER_SVC
    API --> PROVIDER_SVC
    API --> WALLET_SVC
    
    ORDER_SVC --> QUEUE
    QUEUE --> ORDER_MONITOR
    ORDER_MONITOR --> SMM_PROVIDERS
    
    AUTH_SVC --> EMAIL_SVC
    AUTH_SVC --> GITHUB
    
    API --> DB
    QUEUE --> REDIS
    AUTH_SVC --> DB
    
    DB_PKG --> DB
    UTILS_PKG --> API
    UTILS_PKG --> API_PROXY
    
    MIGRATIONS --> DB

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef external fill:#fff3e0
    classDef shared fill:#fce4ec
    
    class UI,AUTH,DASH,ADMIN,API_PROXY frontend
    class API,AUTH_SVC,ORDER_SVC,PROVIDER_SVC,WALLET_SVC backend
    class DB,REDIS,MIGRATIONS data
    class SMM_PROVIDERS,EMAIL_SVC,GITHUB external
    class DB_PKG,UTILS_PKG,TYPES shared
```

**Key Components:**
- **Frontend Layer**: Next.js application with different UI sections
- **Backend Layer**: Hono-based API services handling business logic
- **Background Jobs**: BullMQ for asynchronous processing
- **Data Storage**: PostgreSQL for persistent data, Redis for caching/queues
- **External Services**: Third-party integrations for SMM providers and authentication
- **Shared Packages**: Common code shared between frontend and backend

---

## User Journey Flow

This diagram illustrates the complete user experience from registration to order completion, including both user and admin flows.

```mermaid
graph TD
    %% User Registration & Authentication
    START([User Visits SMM Guru]) --> REGISTER{New User?}
    REGISTER -->|Yes| SIGNUP[Sign Up Page]
    REGISTER -->|No| LOGIN[Login Page]
    
    SIGNUP --> AUTH_METHOD{Choose Auth Method}
    AUTH_METHOD -->|Email/Password| EMAIL_AUTH[Email Registration]
    AUTH_METHOD -->|GitHub| GITHUB_AUTH[GitHub OAuth]
    
    EMAIL_AUTH --> VERIFY[Email Verification]
    GITHUB_AUTH --> CREATE_PROFILE[Create Profile]
    VERIFY --> CREATE_PROFILE
    
    LOGIN --> AUTH_CHECK[Authenticate User]
    AUTH_CHECK --> SESSION[Create Session]
    CREATE_PROFILE --> WALLET_SETUP[Create User Wallet]
    WALLET_SETUP --> SESSION
    
    %% Dashboard Access
    SESSION --> DASHBOARD[Dashboard Access]
    DASHBOARD --> ROLE_CHECK{User Role?}
    
    %% User Flow
    ROLE_CHECK -->|User| USER_DASH[User Dashboard]
    USER_DASH --> USER_ACTIONS{Choose Action}
    
    USER_ACTIONS -->|New Order| ORDER_FLOW[Order Placement Flow]
    USER_ACTIONS -->|View Orders| ORDER_HISTORY[Order History]
    USER_ACTIONS -->|Browse Services| SERVICE_CATALOG[Service Catalog]
    USER_ACTIONS -->|Manage Wallet| WALLET_MGMT[Wallet Management]
    USER_ACTIONS -->|API Access| API_KEYS[API Key Management]
    
    %% Admin Flow
    ROLE_CHECK -->|Admin| ADMIN_DASH[Admin Dashboard]
    ADMIN_DASH --> ADMIN_ACTIONS{Choose Action}
    
    ADMIN_ACTIONS -->|Manage Providers| PROVIDER_MGMT[Provider Management]
    ADMIN_ACTIONS -->|Manage Services| SERVICE_MGMT[Service Management]
    ADMIN_ACTIONS -->|Manage Users| USER_MGMT[User Management]
    ADMIN_ACTIONS -->|View Analytics| ANALYTICS[System Analytics]
    
    %% Order Processing Flow
    ORDER_FLOW --> SELECT_SERVICE[Select Service]
    SELECT_SERVICE --> ENTER_DETAILS[Enter Order Details]
    ENTER_DETAILS --> BALANCE_CHECK{Sufficient Balance?}
    
    BALANCE_CHECK -->|No| ADD_FUNDS[Add Funds to Wallet]
    ADD_FUNDS --> BALANCE_CHECK
    BALANCE_CHECK -->|Yes| PLACE_ORDER[Place Order]
    
    PLACE_ORDER --> ORDER_PROCESSING[Order Processing]
    ORDER_PROCESSING --> PROVIDER_API[Send to Provider]
    PROVIDER_API --> ORDER_CREATED[Order Created]
    ORDER_CREATED --> ORDER_TRACKING[Order Tracking]
    
    %% Background Processing
    ORDER_TRACKING --> BG_MONITOR[Background Monitoring]
    BG_MONITOR --> STATUS_UPDATE[Status Updates]
    STATUS_UPDATE --> ORDER_COMPLETE[Order Complete]
    
    %% Wallet Flow
    WALLET_MGMT --> WALLET_ACTIONS{Wallet Action}
    WALLET_ACTIONS -->|Deposit| DEPOSIT_FUNDS[Deposit Funds]
    WALLET_ACTIONS -->|Withdraw| WITHDRAW_FUNDS[Withdraw Funds]
    WALLET_ACTIONS -->|History| TRANSACTION_HISTORY[Transaction History]
    
    %% Service Management (Admin)
    SERVICE_MGMT --> SERVICE_ACTIONS{Service Action}
    SERVICE_ACTIONS -->|Add Service| ADD_SERVICE[Add New Service]
    SERVICE_ACTIONS -->|Edit Service| EDIT_SERVICE[Edit Service]
    SERVICE_ACTIONS -->|Sync Services| SYNC_SERVICES[Sync from Provider]
    
    %% Provider Management (Admin)
    PROVIDER_MGMT --> PROVIDER_ACTIONS{Provider Action}
    PROVIDER_ACTIONS -->|Add Provider| ADD_PROVIDER[Add New Provider]
    PROVIDER_ACTIONS -->|Configure API| CONFIG_API[Configure API Keys]
    PROVIDER_ACTIONS -->|Test Connection| TEST_PROVIDER[Test Provider Connection]

    %% Styling
    classDef startEnd fill:#4caf50,stroke:#2e7d32,color:#fff
    classDef process fill:#2196f3,stroke:#1565c0,color:#fff
    classDef decision fill:#ff9800,stroke:#ef6c00,color:#fff
    classDef admin fill:#9c27b0,stroke:#6a1b9a,color:#fff
    classDef external fill:#f44336,stroke:#c62828,color:#fff
    
    class START,ORDER_COMPLETE startEnd
    class SIGNUP,LOGIN,DASHBOARD,ORDER_FLOW,WALLET_MGMT process
    class REGISTER,AUTH_METHOD,ROLE_CHECK,USER_ACTIONS,ADMIN_ACTIONS,BALANCE_CHECK decision
    class ADMIN_DASH,PROVIDER_MGMT,SERVICE_MGMT,USER_MGMT admin
    class PROVIDER_API,GITHUB_AUTH external
```

**Key User Flows:**
- **Authentication**: Multiple authentication methods (email/password, GitHub OAuth)
- **Role-based Access**: Different experiences for users and administrators
- **Order Management**: Complete order lifecycle from placement to completion
- **Financial Management**: Wallet operations and transaction handling
- **Admin Operations**: Provider and service management capabilities

---

## Order Processing Flow (Technical)

This sequence diagram shows the detailed technical flow of order processing, including all service interactions and database operations.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant OS as Order Service
    participant WS as Wallet Service
    participant DB as Database
    participant Q as Job Queue
    participant P as SMM Provider
    participant M as Monitor Service

    %% Order Placement
    U->>F: Place Order Request
    F->>A: POST /api/v1/dashboard/orders
    A->>OS: Process Order
    
    %% Validation Phase
    OS->>DB: Validate Service Exists
    DB-->>OS: Service Details
    OS->>WS: Check Wallet Balance
    WS->>DB: Query User Wallet
    DB-->>WS: Wallet Balance
    WS-->>OS: Balance Sufficient
    
    %% Transaction Phase
    OS->>DB: Begin Transaction
    OS->>P: Create Order at Provider
    P-->>OS: Provider Order ID
    
    %% Database Updates
    OS->>DB: Insert Order Record
    OS->>DB: Update Wallet Balance
    OS->>DB: Create Transaction Record
    OS->>DB: Commit Transaction
    
    %% Response
    OS-->>A: Order Created Successfully
    A-->>F: Order Confirmation
    F-->>U: Order Placed Successfully
    
    %% Background Processing
    OS->>Q: Queue Status Check Job
    Q->>M: Schedule Order Monitoring
    
    %% Status Monitoring Loop
    loop Every 5 minutes
        M->>P: Check Order Status
        P-->>M: Current Status
        alt Status Changed
            M->>DB: Update Order Status
            M->>F: Send Real-time Update
            F->>U: Status Notification
        end
    end
    
    %% Order Completion
    alt Order Completed
        M->>DB: Mark Order Complete
        M->>F: Send Completion Notification
        F->>U: Order Completed
    end
```

**Technical Process:**
1. **Validation Phase**: Service existence and wallet balance verification
2. **Transaction Phase**: Atomic database operations with provider API calls
3. **Background Processing**: Asynchronous order monitoring and status updates
4. **Real-time Updates**: Live status notifications to users

---

## Database Entity Relationship

This entity-relationship diagram shows the complete database schema with all tables, fields, and relationships.

```mermaid
erDiagram
    %% User Management
    USER {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
        text role
        boolean banned
        text ban_reason
        timestamp ban_expires
    }

    ACCOUNT {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        timestamp created_at
        timestamp updated_at
    }

    SESSION {
        text id PK
        timestamp expires_at
        text token UK
        text user_id FK
        text ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    APIKEY {
        serial id PK
        text name
        text key UK
        timestamp expires_at
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% SMM Service Management
    PROVIDERS_SCHEMA {
        serial id PK
        text name
        text api_url
        text api_key
        text iv
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    SERVICES_CATEGORY {
        serial id PK
        text name
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    SERVICES {
        serial id PK
        text service
        text name
        text type
        real rate
        real profit
        integer min
        integer max
        boolean dripfeed
        boolean refill
        boolean cancel
        text category
        text currency
        integer category_id FK
        integer provider_id FK
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% Order Management
    ORDERS {
        serial id PK
        text link
        boolean refill
        text service_name
        real price
        text currency
        integer provider_order_id
        text status
        integer service FK
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% Financial System
    WALLET {
        serial id PK
        text user_id FK UK
        numeric balance
        text currency
        text status
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION {
        serial id PK
        numeric amount
        text type
        text status
        jsonb metadata
        text reference UK
        integer from_wallet_id FK
        integer to_wallet_id FK
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_FEE {
        serial id PK
        integer transaction_id FK
        numeric fee_amount
        text fee_type
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ SESSION : "has"
    USER ||--o{ APIKEY : "owns"
    USER ||--o{ PROVIDERS_SCHEMA : "manages"
    USER ||--o{ SERVICES_CATEGORY : "creates"
    USER ||--o{ SERVICES : "owns"
    USER ||--o{ ORDERS : "places"
    USER ||--|| WALLET : "has"
    USER ||--o{ TRANSACTION : "initiates"

    PROVIDERS_SCHEMA ||--o{ SERVICES : "provides"
    SERVICES_CATEGORY ||--o{ SERVICES : "contains"
    SERVICES ||--o{ ORDERS : "generates"

    WALLET ||--o{ TRANSACTION : "from_wallet"
    WALLET ||--o{ TRANSACTION : "to_wallet"
    TRANSACTION ||--o{ TRANSACTION_FEE : "incurs"
```

**Database Structure:**
- **User Management**: Authentication, sessions, and API key management
- **SMM Services**: Provider integration and service catalog management
- **Order Processing**: Order lifecycle and tracking
- **Financial System**: Wallet operations and transaction management
- **Relationships**: Proper foreign key constraints ensuring data integrity

---

## Data Flow Architecture

This diagram shows the complete data flow architecture from user interactions to external service integrations.

```mermaid
graph LR
    %% User Interactions
    subgraph "User Layer"
        WEB[Web Browser]
        MOBILE[Mobile App]
        API_CLIENT[API Client]
    end

    %% Frontend Layer
    subgraph "Frontend Layer"
        NEXTJS[Next.js App]
        AUTH_UI[Auth Components]
        DASH_UI[Dashboard UI]
        ADMIN_UI[Admin UI]
    end

    %% API Gateway Layer
    subgraph "API Gateway"
        PROXY[API Proxy]
        MIDDLEWARE[Middleware Stack]
        VALIDATION[Request Validation]
    end

    %% Backend Services
    subgraph "Backend Services"
        AUTH_API[Auth API]
        ORDER_API[Order API]
        PROVIDER_API[Provider API]
        WALLET_API[Wallet API]
        ADMIN_API[Admin API]
    end

    %% Business Logic Layer
    subgraph "Business Logic"
        ORDER_PROC[Order Processor]
        PAYMENT_PROC[Payment Processor]
        PROVIDER_MGR[Provider Manager]
        USER_MGR[User Manager]
    end

    %% Background Processing
    subgraph "Background Jobs"
        JOB_QUEUE[Job Queue]
        ORDER_MONITOR[Order Monitor]
        STATUS_SYNC[Status Sync]
        NOTIFICATIONS[Notifications]
    end

    %% Data Layer
    subgraph "Data Storage"
        POSTGRES[(PostgreSQL)]
        REDIS_CACHE[(Redis Cache)]
        REDIS_QUEUE[(Redis Queue)]
    end

    %% External Services
    subgraph "External APIs"
        SMM_API1[SMM Provider 1]
        SMM_API2[SMM Provider 2]
        SMM_API3[SMM Provider N]
        EMAIL_API[Email Service]
        OAUTH[OAuth Providers]
    end

    %% Data Flow Connections
    WEB --> NEXTJS
    MOBILE --> NEXTJS
    API_CLIENT --> PROXY

    NEXTJS --> AUTH_UI
    NEXTJS --> DASH_UI
    NEXTJS --> ADMIN_UI

    AUTH_UI --> PROXY
    DASH_UI --> PROXY
    ADMIN_UI --> PROXY

    PROXY --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> AUTH_API
    VALIDATION --> ORDER_API
    VALIDATION --> PROVIDER_API
    VALIDATION --> WALLET_API
    VALIDATION --> ADMIN_API

    AUTH_API --> USER_MGR
    ORDER_API --> ORDER_PROC
    PROVIDER_API --> PROVIDER_MGR
    WALLET_API --> PAYMENT_PROC
    ADMIN_API --> USER_MGR

    ORDER_PROC --> JOB_QUEUE
    ORDER_PROC --> POSTGRES
    PAYMENT_PROC --> POSTGRES
    PROVIDER_MGR --> POSTGRES
    USER_MGR --> POSTGRES

    JOB_QUEUE --> REDIS_QUEUE
    JOB_QUEUE --> ORDER_MONITOR
    ORDER_MONITOR --> STATUS_SYNC
    STATUS_SYNC --> SMM_API1
    STATUS_SYNC --> SMM_API2
    STATUS_SYNC --> SMM_API3

    ORDER_MONITOR --> NOTIFICATIONS
    NOTIFICATIONS --> EMAIL_API

    AUTH_API --> OAUTH
    USER_MGR --> REDIS_CACHE
    ORDER_PROC --> REDIS_CACHE

    %% Styling
    classDef user fill:#e3f2fd
    classDef frontend fill:#f3e5f5
    classDef api fill:#e8f5e8
    classDef business fill:#fff3e0
    classDef background fill:#fce4ec
    classDef data fill:#e0f2f1
    classDef external fill:#ffebee

    class WEB,MOBILE,API_CLIENT user
    class NEXTJS,AUTH_UI,DASH_UI,ADMIN_UI frontend
    class PROXY,MIDDLEWARE,VALIDATION,AUTH_API,ORDER_API,PROVIDER_API,WALLET_API,ADMIN_API api
    class ORDER_PROC,PAYMENT_PROC,PROVIDER_MGR,USER_MGR business
    class JOB_QUEUE,ORDER_MONITOR,STATUS_SYNC,NOTIFICATIONS background
    class POSTGRES,REDIS_CACHE,REDIS_QUEUE data
    class SMM_API1,SMM_API2,SMM_API3,EMAIL_API,OAUTH external
```

**Architecture Layers:**
- **User Layer**: Multiple client types (web, mobile, API)
- **Frontend Layer**: Next.js application with component-based UI
- **API Gateway**: Request routing, middleware, and validation
- **Backend Services**: Microservice-style API endpoints
- **Business Logic**: Core application logic and processing
- **Background Jobs**: Asynchronous processing and monitoring
- **Data Storage**: PostgreSQL for persistence, Redis for caching/queues
- **External APIs**: Third-party service integrations

---

## How to Use These Diagrams

### **Viewing the Diagrams**
These Mermaid diagrams can be viewed in several ways:

1. **GitHub/GitLab**: Most Git platforms render Mermaid diagrams automatically
2. **VS Code**: Use the "Mermaid Preview" extension
3. **Online Viewers**: Copy the diagram code to [mermaid.live](https://mermaid.live)
4. **Documentation Sites**: Platforms like GitBook, Notion, and others support Mermaid

### **Updating the Diagrams**
When the system architecture changes:

1. **Update the relevant diagram** in this file
2. **Test the diagram** using an online Mermaid editor
3. **Commit the changes** to keep documentation in sync
4. **Reference the diagrams** in pull requests and design discussions

### **Integration with Development Workflow**
- **Code Reviews**: Reference these diagrams when reviewing architectural changes
- **Feature Planning**: Use the user journey flow for feature development
- **Onboarding**: Share these diagrams with new team members
- **Documentation**: Include diagram references in technical specifications

### **Maintenance Guidelines**
- **Keep diagrams updated** with code changes
- **Use consistent styling** across all diagrams
- **Add new diagrams** for new major features or architectural changes
- **Validate diagram syntax** before committing changes

---

## Additional Resources

- **Mermaid Documentation**: [https://mermaid-js.github.io/mermaid/](https://mermaid-js.github.io/mermaid/)
- **Diagram Syntax Guide**: [https://mermaid-js.github.io/mermaid/#/flowchart](https://mermaid-js.github.io/mermaid/#/flowchart)
- **Live Editor**: [https://mermaid.live](https://mermaid.live)
- **VS Code Extension**: Search for "Mermaid Preview" in the extension marketplace

These diagrams serve as living documentation that should evolve with the SMM Guru application. They provide valuable insights for developers, stakeholders, and anyone working with or evaluating the system architecture.
