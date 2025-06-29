# @smm-guru/auth-config

Shared authentication configuration package for SMM Guru application. This package provides a centralized way to configure Better Auth across frontend and backend applications.

## Features

- 🔧 **Unified Configuration**: Single source of truth for auth setup
- 🛡️ **Security Middleware**: Built-in session validation and authorization
- 🔑 **API Key Management**: Integrated API key validation
- 📧 **Email Integration**: Password reset functionality
- 🎯 **Role-Based Access**: Admin and user role management
- 🚀 **Environment Aware**: Different configs for frontend/backend

## Installation

This package is part of the SMM Guru monorepo and is automatically available to other packages.

```bash
# Install dependencies
pnpm install
```

## Usage

### Frontend Configuration

```typescript
import { createAuthConfig, createWalletHook } from "@smm-guru/auth-config";
import { db } from "../database/db";
import { allSchemas } from "@smm-guru/database";

export const auth = createAuthConfig(db, allSchemas, {
  environment: 'frontend',
  env: {
    DATABASE_URL: process.env.DATABASE_URL!,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    AUTH_DELIVERY_EMAIL: process.env.AUTH_DELIVERY_EMAIL,
    PROJECT_NAME: process.env.PROJECT_NAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  enableEmailPassword: true,
  enableGitHubOAuth: true,
  enableAdmin: true,
  customHooks: {
    afterSignIn: createWalletHook,
  },
});
```

### Backend Configuration

```typescript
import { createAuthConfig } from "@smm-guru/auth-config";
import { db } from "../database/db";
import { allSchemas } from "@smm-guru/database";

export const auth = createAuthConfig(db, allSchemas, {
  environment: 'backend',
  env: {
    DATABASE_URL: process.env.DATABASE_URL!,
    CLIENT_DOMAIN: process.env.CLIENT_DOMAIN,
  },
  enableApiKey: true,
  enableEmailPassword: false,
  enableGitHubOAuth: false,
});
```

### Middleware Usage

```typescript
import { 
  createSessionMiddleware, 
  createAuthorizationMiddleware,
  createApiKeyMiddleware 
} from "@smm-guru/auth-config";

// Session middleware
app.use(createSessionMiddleware(auth));

// Authorization middleware
app.use("/admin/*", createAuthorizationMiddleware({ 
  requireAdmin: true 
}));

app.use("/dashboard/*", createAuthorizationMiddleware({ 
  requireAuth: true 
}));

// API key middleware for backend
app.use("/v2/*", createApiKeyMiddleware(db, allSchemas));
```

### Utility Functions

```typescript
import { 
  getSessionFromContext, 
  getUserIdFromContext,
  requireAuth,
  requireAdmin 
} from "@smm-guru/auth-config";

// In your route handlers
app.get("/profile", (c) => {
  const user = requireAuth(c);
  return c.json({ user });
});

app.get("/admin/users", (c) => {
  const admin = requireAdmin(c);
  // Admin-only logic
});
```

## Configuration Options

### AuthConfigOptions

| Option | Type | Description |
|--------|------|-------------|
| `environment` | `'frontend' \| 'backend'` | Target environment |
| `env` | `AuthEnvironment` | Environment variables |
| `appName` | `string` | Application name (default: "SMM Guru") |
| `enableEmailPassword` | `boolean` | Enable email/password auth |
| `enableGitHubOAuth` | `boolean` | Enable GitHub OAuth |
| `enableApiKey` | `boolean` | Enable API key plugin |
| `enableAdmin` | `boolean` | Enable admin plugin |
| `customHooks` | `object` | Custom auth hooks |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth client secret |
| `AUTH_DELIVERY_EMAIL` | ❌ | Email sender address |
| `PROJECT_NAME` | ❌ | Project name for emails |
| `RESEND_API_KEY` | ❌ | Resend API key for emails |
| `REDIS_URL` | ❌ | Redis connection string |
| `CLIENT_DOMAIN` | ❌ | Client domain for CORS |

## Middleware Types

### Session Middleware
Adds user and session data to Hono context.

### Authorization Middleware
Protects routes based on authentication and roles.

### API Key Middleware
Validates API keys for backend routes.

## Development

```bash
# Build the package
pnpm build

# Watch for changes
pnpm build --watch
```

## License

Private - SMM Guru Project
