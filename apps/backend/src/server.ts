/**
 * SMM Guru Backend Server
 * Simple working server based on proven app.ts components with /api/v1 routing
 */

import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PORT } from "./lib/env.js";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { addSession, errorHandler } from "@smm-guru/utils";
import { auth } from "./lib/better-auth/auth.js";
import routes from "./routes/routes.config.js";
import configCors from "./lib/middleware/cors.middleware.js";
import sessionValidator from "./lib/middleware/unauthorized-access.middleware.js";
import securityHeaders from "./lib/middleware/security-headers.middleware.js";
import { generalRateLimit } from "./lib/middleware/rate-limit.middleware.js";
import { initializeEnvironment } from "./lib/env-validation.js";

// Initialize and validate environment variables
initializeEnvironment();

const app = new Hono();

// ENTERPRISE SECURITY MIDDLEWARE STACK (order is critical for security!)
app.use(logger());
app.use(securityHeaders); // Security headers first
app.use(configCors); // CORS configuration

// 1. PAYLOAD SIZE VALIDATION FIRST (prevents DoS attacks and info disclosure)
app.use(
  bodyLimit({
    maxSize: 50 * 1024, // 50KB limit for testing (enterprise can be higher in production)
    onError: (c) => {
      console.log('🚨 bodyLimit triggered - payload too large');
      return c.json(
        {
          success: false,
          error: "Payload Too Large",
          message: "Request payload exceeds maximum allowed size",
          maxSize: "50KB",
          details: {
            timestamp: new Date().toISOString(),
            path: c.req.path,
            method: c.req.method
          }
        },
        413
      );
    },
  })
);

// 2. Rate limiting (after payload validation)
app.use(generalRateLimit);

// 3. Session management
app.use((c, n) => {
  console.log('🔐 Session middleware executing for:', c.req.method, c.req.path);
  return addSession(c, n, auth);
});

// 4. Authentication/authorization LAST
app.use((c, n) => {
  console.log('🛡️ Authentication middleware executing for:', c.req.method, c.req.path);
  return sessionValidator(c, n);
});

// Routes setup
app.get("/health", (c) => {
  return c.json({
    status: "pass"
  }, 200);
});

app.get("/ready", (c) => {
  return c.json({
    status: "ready"
  }, 200);
});

app.get("/api/version", (c) => {
  return c.json({
    version: "1.0.0",
    api: "SMM Guru Backend"
  }, 200);
});

// Auth Routes - Better Auth handler
app.all("/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});

// API v1 routes (migrated from /v2)
app.route("/api/v1", routes);

// 404 handler for undefined routes
app.notFound((c) => {
  return c.json({
    success: false,
    name: 'ROUTE_NOT_FOUND',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    result: null,
  }, 404);
});

// Error handling
app.onError(errorHandler);

// Start the server
serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

export default app;
