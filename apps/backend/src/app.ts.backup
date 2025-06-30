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

// Debug middleware to log payload size
app.use(async (c, next) => {
  const contentLength = c.req.header('content-length');
  console.log('📊 Request details:', {
    method: c.req.method,
    path: c.req.path,
    contentLength: contentLength ? `${contentLength} bytes` : 'unknown',
    contentType: c.req.header('content-type')
  });
  return next();
});

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
            action: "reduce_payload_size",
            limit: "51200 bytes"
          }
        },
        413 // HTTP 413 Payload Too Large (RFC 7231)
      );
    }
  })
);

// 2. Rate limiting (after payload validation)
app.use(generalRateLimit);
app.onError(errorHandler);

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

// RFC 3986 compliant health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "pass"
  }, 200);
});

// Kubernetes-style readiness probe
app.get("/ready", (c) => {
  return c.json({
    status: "ready"
  }, 200);
});

// API version endpoint (common enterprise pattern)
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

app.route("/v2", routes);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
