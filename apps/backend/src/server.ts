/**
 * SMM Guru Backend Server
 * Simplified working server using proven components from app.ts
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

/**
 * Application class for better organization and testing
 */
class SMMAGuruApp {
  private app: Hono;
  private isInitialized = false;

  constructor() {
    this.app = new Hono();
  }

  /**
   * Initialize the application (simplified working version)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize and validate environment variables (from app.ts)
      initializeEnvironment();

      // Setup middleware (using working components from app.ts)
      this.setupMiddleware();

      // Setup routes (using working components from app.ts)
      this.setupRoutes();

      // Setup error handling (using working components from app.ts)
      this.setupErrorHandling();

      this.isInitialized = true;
      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }



  /**
   * Setup middleware stack (hybrid approach using working app.ts middleware)
   */
  private setupMiddleware(): void {
    console.log('🔧 Setting up middleware...');

    // ENTERPRISE SECURITY MIDDLEWARE STACK (order is critical for security!)
    // Built-in logger for development
    this.app.use(logger());

    // Security headers first
    this.app.use(securityHeaders);

    // CORS configuration
    this.app.use(configCors);

    // Debug middleware to log payload size (from app.ts)
    this.app.use(async (c, next) => {
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
    this.app.use(
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
    this.app.use(generalRateLimit);

    // 3. Session management
    this.app.use((c, n) => {
      console.log('🔐 Session middleware executing for:', c.req.method, c.req.path);
      return addSession(c, n, auth);
    });

    // 4. Authentication/authorization LAST
    this.app.use((c, n) => {
      console.log('🛡️ Authentication middleware executing for:', c.req.method, c.req.path);
      return sessionValidator(c, n);
    });

    console.log('✅ Middleware setup complete');
  }

  /**
   * Setup API routes (hybrid approach including legacy routes)
   */
  private setupRoutes(): void {
    console.log('🔧 Setting up routes...');

    // RFC 3986 compliant health check endpoint (from app.ts)
    this.app.get("/health", (c) => {
      return c.json({
        status: "pass"
      }, 200);
    });

    // Kubernetes-style readiness probe (from app.ts)
    this.app.get("/ready", (c) => {
      return c.json({
        status: "ready"
      }, 200);
    });

    // API version endpoint (from app.ts)
    this.app.get("/api/version", (c) => {
      return c.json({
        version: "1.0.0",
        api: "SMM Guru Backend"
      }, 200);
    });

    // Auth Routes - Better Auth handler (from app.ts)
    this.app.all("/api/auth/*", async (c) => {
      return auth.handler(c.req.raw);
    });

    // API v1 routes (migrated from /v2)
    this.app.route("/api/v1", routes);

    // 404 handler for undefined routes
    this.app.notFound((c) => {
      return c.json({
        success: false,
        name: 'ROUTE_NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
        result: null,
      }, 404);
    });

    console.log('✅ Routes setup complete');
  }

  /**
   * Setup error handling (using working components from app.ts)
   */
  private setupErrorHandling(): void {
    console.log('🔧 Setting up error handling...');

    // Global error handler (from app.ts)
    this.app.onError(errorHandler);

    // Graceful shutdown handlers
    this.setupGracefulShutdown();

    console.log('✅ Error handling setup complete');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

      try {
        // Close database connections
        // await closeDatabaseConnections();

        // Close Redis connections
        // await closeRedisConnections();

        // Stop queue processing
        // await stopQueueProcessing();

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

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const server = serve(
      {
        fetch: this.app.fetch,
        port: PORT,
      },
      (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
      }
    );

    return server;
  }

  /**
   * Get the Hono app instance (for testing)
   */
  getApp(): Hono {
    return this.app;
  }
}

// Create and start the application
const smmGuruApp = new SMMAGuruApp();

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  smmGuruApp.start().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

// Export for testing and external use
export default smmGuruApp;
export { SMMAGuruApp };
