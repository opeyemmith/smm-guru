# SMM Guru Documentation

Welcome to the SMM Guru documentation! This directory contains comprehensive documentation for understanding, developing, and maintaining the SMM Guru application.

## 📋 Documentation Index

### Core Documentation
- **[../CODEBASE_ANALYSIS.md](../CODEBASE_ANALYSIS.md)** - Complete technical analysis and architecture overview
- **[../SYSTEM_DIAGRAMS.md](../SYSTEM_DIAGRAMS.md)** - Visual system architecture and flow diagrams

### Quick Start Guides
- **[Getting Started](#getting-started)** - How to set up and run the application
- **[Development Workflow](#development-workflow)** - Development best practices and workflows
- **[API Documentation](#api-documentation)** - API endpoints and usage examples

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd smm-guru

# Install dependencies
pnpm install

# Set up environment variables
cp apps/frontend/env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env

# Set up the database
pnpm db:push

# Start development servers
pnpm dev
```

### Environment Variables

#### Frontend (.env.local)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/smm_guru
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
AUTH_DELIVERY_EMAIL=noreply@yourdomain.com
PROJECT_NAME=SMM Guru
REDIS_URL=redis://localhost:6379
```

#### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/smm_guru
REDIS_URL=redis://localhost:6379
AES_SECRET_KEY=your_32_character_secret_key
```

## Development Workflow

### Project Structure
```
smm-guru/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Hono API server
├── packages/
│   ├── database/          # Shared database schemas
│   └── utils/             # Shared utilities
├── docs/                  # Documentation
└── drizzle/              # Database migrations
```

### Development Commands
```bash
# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Database operations
pnpm db:gen      # Generate migrations
pnpm db:push     # Push schema to database
pnpm db:studio   # Open Drizzle Studio
```

### Code Organization Guidelines

#### File Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: kebab-case (`new-orders/page.tsx`)
- **Utilities**: kebab-case (`auth-client.ts`)
- **Types**: kebab-case with `.type.ts` suffix
- **Schemas**: kebab-case with `.zod.ts` suffix

#### Import Organization
```typescript
// 1. React and Next.js imports
import React from "react"
import { NextPage } from "next"

// 2. Third-party library imports
import { useQuery } from "@tanstack/react-query"

// 3. Internal imports (absolute paths)
import { useSession } from "@/lib/better-auth/auth-client"

// 4. Relative imports
import OrderCard from "./order-card"
```

## API Documentation

### Authentication
The API uses session-based authentication with Better-Auth. Include session cookies in requests or use API keys for programmatic access.

### Base URLs
- **Frontend API**: `http://localhost:3000/api/v1`
- **Backend API**: `http://localhost:3001/v2`

### Common Endpoints

#### Authentication
```http
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
GET  /api/auth/session
```

#### Orders
```http
GET    /api/v1/dashboard/orders     # Get user orders
POST   /api/v1/dashboard/orders     # Create new order
GET    /api/v1/dashboard/orders/:id # Get specific order
```

#### Services
```http
GET /api/v1/public/services         # Get available services
GET /api/v1/public/services/:id     # Get service details
```

#### Wallet
```http
GET  /api/v1/dashboard/wallet       # Get wallet balance
POST /api/v1/dashboard/wallet/fund  # Add funds to wallet
GET  /api/v1/dashboard/wallet/transactions # Get transaction history
```

#### Admin (Requires admin role)
```http
GET    /api/v1/admin/providers      # Get all providers
POST   /api/v1/admin/providers      # Add new provider
GET    /api/v1/admin/services       # Get all services
POST   /api/v1/admin/services       # Add new service
```

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "name": "OPERATION_NAME",
  "message": "Human readable message",
  "result": { /* Response data */ }
}
```

### Error Handling
Error responses include:
```json
{
  "success": false,
  "name": "ERROR_NAME",
  "message": "Error description",
  "result": null
}
```

## Architecture Overview

### System Components
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Backend**: Hono framework with Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Queue**: Redis for caching and job processing
- **Background Jobs**: BullMQ for order processing
- **Authentication**: Better-Auth with multiple providers

### Key Features
- **Order Processing**: Automated SMM service order handling
- **Provider Integration**: Multiple SMM provider support
- **Wallet System**: Built-in financial management
- **Admin Panel**: Comprehensive administration interface
- **API Access**: RESTful API for developers
- **Real-time Updates**: Live order status monitoring

### Security Features
- **Authentication**: Multi-provider authentication
- **Authorization**: Role-based access control
- **Data Encryption**: Encrypted storage of sensitive data
- **Input Validation**: Comprehensive request validation
- **Session Management**: Secure session handling

## Deployment

### Production Build
```bash
# Build all packages
pnpm build

# Start production servers
pnpm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure Redis instance
3. Set environment variables
4. Run database migrations
5. Start application services

### Monitoring
- **Application Logs**: Check application logs for errors
- **Database Performance**: Monitor query performance
- **Redis Usage**: Monitor cache hit rates and queue processing
- **External APIs**: Monitor SMM provider API responses

## Contributing

### Before Contributing
1. Read the [CODEBASE_ANALYSIS.md](../CODEBASE_ANALYSIS.md) for system understanding
2. Review the [SYSTEM_DIAGRAMS.md](../SYSTEM_DIAGRAMS.md) for architecture overview
3. Set up the development environment
4. Familiarize yourself with the codebase structure

### Development Process
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes following the coding conventions
4. **Test** your changes thoroughly
5. **Update** documentation if needed
6. **Submit** a pull request

### Code Quality
- Follow TypeScript best practices
- Write comprehensive tests
- Use proper error handling
- Follow the established patterns
- Update documentation for architectural changes

## Support

For questions, issues, or contributions:
1. Check existing documentation
2. Search through existing issues
3. Create a new issue with detailed information
4. Follow the project's contribution guidelines

## Additional Resources

- **Mermaid Documentation**: [https://mermaid-js.github.io/mermaid/](https://mermaid-js.github.io/mermaid/)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Hono Documentation**: [https://hono.dev/](https://hono.dev/)
- **Drizzle ORM**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **Better-Auth**: [https://www.better-auth.com/](https://www.better-auth.com/)
