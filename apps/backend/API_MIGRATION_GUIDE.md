# API Migration Guide - v2 to v1 Routing Update

## Overview

The SMM Guru Backend API has been updated to use consistent REST API versioning patterns. All business endpoints have been migrated from `/v2/*` to `/api/v1/*` to maintain consistency with authentication and system endpoints.

## Breaking Changes

### Route Path Changes

All business API endpoints have changed their base path:

```
OLD: /v2/*
NEW: /api/v1/*
```

### Detailed Endpoint Mapping

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|--------|
| `GET /v2/api-keys` | `GET /api/v1/api-keys` | ✅ Updated |
| `POST /v2/api-keys` | `POST /api/v1/api-keys` | ✅ Updated |
| `PATCH /v2/api-keys` | `PATCH /api/v1/api-keys` | ✅ Updated |
| `DELETE /v2/api-keys/:id` | `DELETE /api/v1/api-keys/:id` | ✅ Updated |
| `POST /v2/handler` | `POST /api/v1/handler` | ✅ Updated |
| `GET /v2/orders` | `GET /api/v1/orders` | ✅ Updated |
| `GET /v2/orders/:id` | `GET /api/v1/orders/:id` | ✅ Updated |
| `POST /v2/orders` | `POST /api/v1/orders` | ✅ Updated |
| `PATCH /v2/orders/:id` | `PATCH /api/v1/orders/:id` | ✅ Updated |
| `DELETE /v2/orders/:id` | `DELETE /api/v1/orders/:id` | ✅ Updated |
| `GET /v2/providers` | `GET /api/v1/providers` | ✅ Updated |
| `POST /v2/providers` | `POST /api/v1/providers` | ✅ Updated |
| `PATCH /v2/providers/:id` | `PATCH /api/v1/providers/:id` | ✅ Updated |
| `DELETE /v2/providers/:id` | `DELETE /api/v1/providers/:id` | ✅ Updated |
| `GET /v2/services` | `GET /api/v1/services` | ✅ Updated |
| `POST /v2/services` | `POST /api/v1/services` | ✅ Updated |
| `PATCH /v2/services/:id` | `PATCH /api/v1/services/:id` | ✅ Updated |
| `DELETE /v2/services/:id` | `DELETE /api/v1/services/:id` | ✅ Updated |
| `GET /v2/transactions` | `GET /api/v1/transactions` | ✅ Updated |
| `POST /v2/transactions` | `POST /api/v1/transactions` | ✅ Updated |
| `GET /v2/users` | `GET /api/v1/users` | ✅ Updated |
| `GET /v2/users/:id` | `GET /api/v1/users/:id` | ✅ Updated |
| `PATCH /v2/users/:id` | `PATCH /api/v1/users/:id` | ✅ Updated |
| `DELETE /v2/users/:id` | `DELETE /api/v1/users/:id` | ✅ Updated |
| `GET /v2/wallet` | `GET /api/v1/wallet` | ✅ Updated |
| `PATCH /v2/wallet` | `PATCH /api/v1/wallet` | ✅ Updated |

### Unchanged Endpoints

These endpoints remain the same:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | ✅ No Change | System health check |
| `GET /ready` | ✅ No Change | Kubernetes readiness probe |
| `GET /api/version` | ✅ No Change | API version information |
| `ALL /api/auth/*` | ✅ No Change | Better Auth endpoints |

## Migration Steps

### For Frontend Applications

1. **Update Base URL Configuration**
   ```javascript
   // OLD
   const API_BASE_URL = 'http://localhost:3000/v2';
   
   // NEW
   const API_BASE_URL = 'http://localhost:3000/api/v1';
   ```

2. **Update API Client Configuration**
   ```javascript
   // Example with Axios
   const apiClient = axios.create({
     baseURL: 'http://localhost:3000/api/v1', // Changed from /v2
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

3. **Update Individual API Calls**
   ```javascript
   // OLD
   fetch('/v2/orders')
   
   // NEW  
   fetch('/api/v1/orders')
   ```

### For Mobile Applications

1. **Update API Constants**
   ```swift
   // iOS Swift Example
   // OLD
   let baseURL = "https://api.smmguru.com/v2"
   
   // NEW
   let baseURL = "https://api.smmguru.com/api/v1"
   ```

2. **Update Network Layer**
   ```kotlin
   // Android Kotlin Example
   // OLD
   private const val BASE_URL = "https://api.smmguru.com/v2/"
   
   // NEW
   private const val BASE_URL = "https://api.smmguru.com/api/v1/"
   ```

### For Third-Party Integrations

1. **Update Webhook URLs**
   ```
   OLD: https://api.smmguru.com/v2/handler
   NEW: https://api.smmguru.com/api/v1/handler
   ```

2. **Update API Documentation References**
   - Update all documentation to reference new endpoints
   - Update integration guides
   - Update SDK examples

## Testing Your Migration

### 1. Health Check Test
```bash
curl -X GET http://localhost:3000/health
# Should return: {"status":"pass"}
```

### 2. API Version Test
```bash
curl -X GET http://localhost:3000/api/version
# Should return: {"version":"1.0.0","api":"SMM Guru Backend"}
```

### 3. Business Endpoint Test
```bash
# Test new API v1 endpoint
curl -X GET http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Authentication Test
```bash
# Auth endpoints remain unchanged
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Rollback Plan

If you need to temporarily rollback:

1. **Server-side**: Change the route mounting in `server.ts`:
   ```typescript
   // Rollback to v2
   this.app.route("/v2", routes);
   ```

2. **Client-side**: Revert your base URL changes back to `/v2`

## Timeline

- **Effective Date**: Immediate
- **Deprecation Period**: None (breaking change)
- **Support**: Old `/v2` endpoints are no longer available

## Support

If you encounter issues during migration:

1. Check the [ROUTING_AUDIT.md](./ROUTING_AUDIT.md) for detailed endpoint mapping
2. Verify your authentication tokens are still valid
3. Test endpoints using the provided curl examples
4. Check server logs for any routing errors

## Future Improvements

This migration sets the foundation for:

- **Route Organization**: Future separation into admin/dashboard/public categories
- **Better Documentation**: OpenAPI specification updates
- **Enhanced Security**: Route-specific security policies
- **Monitoring**: Better API usage analytics

## Changelog

- **2024-12-30**: Migrated all business endpoints from `/v2/*` to `/api/v1/*`
- **2024-12-30**: Updated server routing configuration
- **2024-12-30**: Created migration documentation
