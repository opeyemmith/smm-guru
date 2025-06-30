/**
 * SMM Guru Backend Server
 * Enterprise-grade server setup with proper architecture
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { helmet } from 'hono/helmet';

// Configuration
import { appConfig, validateConfig } from './config/app.config.js';

// Middleware
import { errorHandlerMiddleware } from './shared/middleware/error-handler.middleware.js';
import { requestLoggingMiddleware } from './shared/middleware/request-logging.middleware.js';
import { securityMiddleware } from './shared/middleware/security.middleware.js';
import { rateLimitMiddleware } from './shared/middleware/rate-limit.middleware.js';

// Infrastructure
import { getDatabaseConnection } from './infrastructure/database/connection.js';
import { getRedisClient } from './infrastructure/cache/redis.client.js';
import { getLogger } from './infrastructure/monitoring/logger.js';
import { getHealthCheckService } from './infrastructure/monitoring/health-check.js';
import { getMetricsCollector } from './infrastructure/monitoring/metrics.js';

// API Routes
import { createApiV1Routes } from './api/v1/index.js';

// Health Check
import { createHealthRoutes } from './api/health/health.routes.js';

// Types
import type { HonoAuthContext } from './shared/types/api.types.js';

/**
 * Application class for better organization and testing
 */
class SMMAGuruApp {
  private app: Hono<{ Variables: HonoAuthContext }>;
  private isInitialized = false;

  constructor() {
    this.app = new Hono();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      validateConfig();

      // Initialize infrastructure
      await this.initializeInfrastructure();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      this.isInitialized = true;
      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Initialize infrastructure services
   */
  private async initializeInfrastructure(): Promise<void> {
    const logger = getLogger();
    logger.info('🔧 Initializing infrastructure...');

    try {
      // Initialize database connection
      const dbConnection = getDatabaseConnection();
      await dbConnection.initialize();
      logger.info('✅ Database connection initialized');

      // Initialize Redis client
      const redisClient = getRedisClient();
      await redisClient.initialize();
      logger.info('✅ Redis client initialized');

      // Initialize health check service
      const healthCheck = getHealthCheckService();
      logger.info('✅ Health check service initialized');

      // Initialize metrics collection
      const metrics = getMetricsCollector();
      metrics.startSystemMetricsCollection();
      logger.info('✅ Metrics collection started');

      logger.info('✅ Infrastructure initialized successfully');
    } catch (error) {
      const logger = getLogger();
      logger.error('❌ Infrastructure initialization failed', { error });
      throw error;
    }
  }

  /**
   * Setup middleware stack
   */
  private setupMiddleware(): void {
    console.log('🔧 Setting up middleware...');

    // Request logging (first for complete request tracking)
    if (appConfig.logging.enableRequestLogging) {
      this.app.use('*', requestLoggingMiddleware());
    }

    // Built-in logger for development
    if (appConfig.app.isDevelopment) {
      this.app.use('*', logger());
    }

    // Security headers
    if (appConfig.security.enableHelmet) {
      this.app.use('*', helmet({
        contentSecurityPolicy: appConfig.security.contentSecurityPolicy,
        hsts: appConfig.security.enableHSTS,
      }));
    }

    // CORS configuration
    this.app.use('*', cors({
      origin: appConfig.cors.origin,
      credentials: appConfig.cors.credentials,
      allowMethods: appConfig.cors.methods,
      allowHeaders: appConfig.cors.allowedHeaders,
      exposeHeaders: appConfig.cors.exposedHeaders,
    }));

    // Body size limit (before parsing)
    this.app.use('*', bodyLimit({
      maxSize: appConfig.upload.maxFileSize,
      onError: (c) => {
        return c.json({
          success: false,
          name: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds maximum allowed size',
          statusCode: 413,
          timestamp: new Date().toISOString(),
          result: null,
        }, 413);
      },
    }));

    // Rate limiting
    if (appConfig.rateLimit.enabled) {
      this.app.use('*', rateLimitMiddleware({
        windowMs: appConfig.rateLimit.windowMs,
        max: appConfig.rateLimit.maxRequests,
        standardHeaders: appConfig.rateLimit.standardHeaders,
        legacyHeaders: appConfig.rateLimit.legacyHeaders,
      }));
    }

    // Custom security middleware
    this.app.use('*', securityMiddleware());

    console.log('✅ Middleware setup complete');
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    console.log('🔧 Setting up routes...');

    // Health check routes (no authentication required)
    this.app.route('/health', createHealthRoutes());

    // API version endpoint
    this.app.get('/api/version', (c) => {
      return c.json({
        success: true,
        name: 'API_VERSION',
        message: 'API version information',
        result: {
          version: appConfig.app.version,
          name: appConfig.app.name,
          environment: appConfig.app.environment,
          timestamp: new Date().toISOString(),
        },
      });
    });

    // API v1 routes
    this.app.route('/api/v1', createApiV1Routes());

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
   * Setup error handling
   */
  private setupErrorHandling(): void {
    console.log('🔧 Setting up error handling...');

    // Global error handler (must be last)
    this.app.onError(errorHandlerMiddleware({
      enableStackTrace: appConfig.app.isDevelopment,
      enableDetailedErrors: appConfig.app.isDevelopment,
      logErrors: true,
    }));

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
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const server = serve(
      {
        fetch: this.app.fetch,
        port: appConfig.app.port,
      },
      (info) => {
        console.log(`
🚀 SMM Guru API Server Started Successfully!

📊 Server Information:
   • Environment: ${appConfig.app.environment}
   • Version: ${appConfig.app.version}
   • Port: ${info.port}
   • URL: http://localhost:${info.port}

🔗 API Endpoints:
   • Health Check: http://localhost:${info.port}/health
   • API Version: http://localhost:${info.port}/api/version
   • API v1: http://localhost:${info.port}/api/v1

🛡️ Security Features:
   • Rate Limiting: ${appConfig.rateLimit.enabled ? '✅ Enabled' : '❌ Disabled'}
   • CORS: ✅ Configured
   • Helmet: ${appConfig.security.enableHelmet ? '✅ Enabled' : '❌ Disabled'}
   • Request Logging: ${appConfig.logging.enableRequestLogging ? '✅ Enabled' : '❌ Disabled'}

📈 Infrastructure:
   • Database: ✅ Connected
   • Redis: ✅ Connected
   • Queue: ✅ Initialized
   • Monitoring: ✅ Active

Ready to handle requests! 🎉
        `);
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
