# Migration Notes - app.ts to server.ts Consolidation

## Current app.ts Middleware Stack (Order is Critical)

### 1. Basic Middleware
- `logger()` - Hono built-in request logging
- `securityHeaders` - Custom security headers middleware
- `configCors` - CORS configuration middleware

### 2. Debug Middleware
- Custom payload size logging middleware
- Logs request method, path, content-length, and content-type

### 3. Security Middleware (Critical Order)
- `bodyLimit()` - 50KB payload size limit (prevents DoS attacks)
- `generalRateLimit` - Rate limiting middleware
- `errorHandler` - Global error handling

### 4. Authentication Middleware
- `addSession()` - Session management with Better Auth
- `sessionValidator()` - Authentication/authorization validation

### 5. Route Handlers
- `/health` - RFC 3986 compliant health check
- `/ready` - Kubernetes-style readiness probe  
- `/api/version` - API version information
- `/api/auth/*` - Better Auth handler
- `/v2` - Main application routes (NEEDS MIGRATION TO /api/v1)

## Custom Configurations in app.ts

### Body Limit Configuration
```typescript
bodyLimit({
  maxSize: 50 * 1024, // 50KB limit
  onError: (c) => {
    // Custom error response with detailed information
    return c.json({
      success: false,
      error: "Payload Too Large",
      message: "Request payload exceeds maximum allowed size",
      maxSize: "50KB",
      details: {
        action: "reduce_payload_size",
        limit: "51200 bytes"
      }
    }, 413);
  }
})
```

### Session Management
- Uses `@smm-guru/utils` addSession function
- Integrates with Better Auth
- Includes debug logging

### Authentication Flow
- Session middleware executes first
- Authentication validator runs last
- Debug logging for both steps

## Dependencies Used in app.ts
- `@hono/node-server` - Server implementation
- `hono` - Web framework
- `hono/logger` - Built-in logging
- `hono/body-limit` - Payload size limiting
- `@smm-guru/utils` - Custom utilities (addSession, errorHandler)
- `./lib/env.js` - Environment configuration
- `./lib/better-auth/auth.js` - Authentication setup
- `./routes/routes.config.js` - Route configurations
- `./lib/middleware/*` - Custom middleware implementations
- `./lib/env-validation.js` - Environment validation

## Critical Items to Migrate to server.ts

### 1. Environment Initialization
- `initializeEnvironment()` call must be preserved
- Environment validation is critical for startup

### 2. Middleware Order
- Security middleware order is critical and well-documented
- Payload validation MUST come before authentication
- Rate limiting MUST come after payload validation

### 3. Custom Route Handlers
- Health check endpoints with specific response formats
- Better Auth integration with `/api/auth/*` pattern
- API version endpoint

### 4. Debug Logging
- Request details logging middleware
- Session and authentication debug logs

### 5. Error Handling
- Custom body limit error response format
- Global error handler integration

## Routes to Migrate from /v2 to /api/v1
- Current: `app.route("/v2", routes)`
- Target: Move to `/api/v1` structure in server.ts
- Requires updating `./routes/routes.config.js` imports

## Verification Checklist
- [ ] All middleware present in server.ts
- [ ] Middleware order preserved
- [ ] Custom configurations migrated
- [ ] Route handlers migrated
- [ ] Debug logging preserved
- [ ] Error handling maintained
- [ ] Environment initialization preserved
- [ ] Better Auth integration working
- [ ] Health checks functional
- [ ] API version endpoint working
