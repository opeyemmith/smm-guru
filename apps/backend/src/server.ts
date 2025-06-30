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
// import { getQueueManager } from "./infrastructure/queue/queue.manager.js";

// Initialize and validate environment variables
initializeEnvironment();

// TODO: Initialize queue manager (temporarily disabled for testing)
// const queueManager = getQueueManager({
//   enableOrderProcessing: true,
//   enableEmailNotifications: false, // Will be implemented later
//   enableAnalytics: false,          // Will be implemented later
//   enableCleanup: false,            // Will be implemented later
//   enableProviderSync: false,       // Will be implemented later
// });

// Initialize queues (async)
// queueManager.initialize().catch((error) => {
//   console.error('❌ Failed to initialize queue manager:', error);
//   // Don't exit the process, just log the error for now
// });

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

// TODO: Queue health endpoint (temporarily disabled)
// app.get("/api/queue/health", async (c) => {
//   try {
//     const healthStatus = await queueManager.getHealthStatus();
//     return c.json(healthStatus, healthStatus.status === 'healthy' ? 200 : 503);
//   } catch (error) {
//     return c.json({
//       status: 'unhealthy',
//       error: error instanceof Error ? error.message : 'Unknown error',
//       timestamp: new Date().toISOString(),
//     }, 503);
//   }
// });

// TODO: Queue statistics endpoint (temporarily disabled)
// app.get("/api/queue/stats", async (c) => {
//   try {
//     const stats = await queueManager.getAllQueueStats();
//     return c.json({
//       success: true,
//       data: stats,
//       timestamp: new Date().toISOString(),
//     }, 200);
//   } catch (error) {
//     return c.json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//       timestamp: new Date().toISOString(),
//     }, 500);
//   }
// });

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

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

  try {
    // TODO: Shutdown queue manager (temporarily disabled)
    // if (queueManager.isReady()) {
    //   console.log('🛑 Shutting down queue manager...');
    //   await queueManager.shutdown();
    // }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    console.log(`Queue system: ⏳ Will be implemented next`);
  }
);

export default app;
