/**
 * Infrastructure Module Index
 * Centralized infrastructure initialization and management
 */

import { getDatabaseConnection } from './database/connection.js';
import { getRedisClient } from './cache/redis.client.js';
import { getLogger } from './monitoring/logger.js';
import { getHealthCheckService } from './monitoring/health-check.js';
import { getMetricsCollector } from './monitoring/metrics.js';

export interface InfrastructureStatus {
  database: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'error';
  logging: 'active' | 'inactive';
  monitoring: 'active' | 'inactive';
  metrics: 'active' | 'inactive';
}

export class InfrastructureManager {
  private static instance: InfrastructureManager;
  private isInitialized = false;
  private logger = getLogger();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): InfrastructureManager {
    if (!InfrastructureManager.instance) {
      InfrastructureManager.instance = new InfrastructureManager();
    }
    return InfrastructureManager.instance;
  }

  /**
   * Initialize all infrastructure components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Infrastructure already initialized');
      return;
    }

    try {
      this.logger.info('🚀 Starting infrastructure initialization...');

      // Initialize in order of dependency
      await this.initializeDatabase();
      await this.initializeRedis();
      await this.initializeMonitoring();
      await this.initializeMetrics();

      this.isInitialized = true;
      this.logger.info('✅ Infrastructure initialization completed successfully');
    } catch (error) {
      this.logger.error('❌ Infrastructure initialization failed', { error });
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const dbConnection = getDatabaseConnection();
      await dbConnection.initialize();
      this.logger.info('✅ Database connection established');
    } catch (error) {
      this.logger.error('❌ Database initialization failed', { error });
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize Redis client
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      await redisClient.initialize();
      this.logger.info('✅ Redis client connected');
    } catch (error) {
      this.logger.error('❌ Redis initialization failed', { error });
      // Redis is not critical, so we don't throw
      this.logger.warn('⚠️ Continuing without Redis - caching will be disabled');
    }
  }

  /**
   * Initialize monitoring services
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      const healthCheck = getHealthCheckService();
      this.logger.info('✅ Health check service initialized');
    } catch (error) {
      this.logger.error('❌ Monitoring initialization failed', { error });
      throw new Error(`Monitoring initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize metrics collection
   */
  private async initializeMetrics(): Promise<void> {
    try {
      const metrics = getMetricsCollector();
      metrics.startSystemMetricsCollection(60000); // Every minute
      this.logger.info('✅ Metrics collection started');
    } catch (error) {
      this.logger.error('❌ Metrics initialization failed', { error });
      // Metrics are not critical, so we don't throw
      this.logger.warn('⚠️ Continuing without metrics collection');
    }
  }

  /**
   * Get infrastructure status
   */
  public async getStatus(): Promise<InfrastructureStatus> {
    const status: InfrastructureStatus = {
      database: 'disconnected',
      redis: 'disconnected',
      logging: 'inactive',
      monitoring: 'inactive',
      metrics: 'inactive',
    };

    try {
      // Check database
      const dbConnection = getDatabaseConnection();
      const dbHealth = await dbConnection.getHealthStatus();
      status.database = dbHealth.isConnected ? 'connected' : 'disconnected';
    } catch {
      status.database = 'error';
    }

    try {
      // Check Redis
      const redisClient = getRedisClient();
      const isRedisConnected = await redisClient.ping();
      status.redis = isRedisConnected ? 'connected' : 'disconnected';
    } catch {
      status.redis = 'error';
    }

    // Logging is always active if we can call this method
    status.logging = 'active';
    status.monitoring = 'active';
    status.metrics = 'active';

    return status;
  }

  /**
   * Graceful shutdown of all infrastructure
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Infrastructure not initialized, nothing to shutdown');
      return;
    }

    try {
      this.logger.info('🛑 Starting graceful infrastructure shutdown...');

      // Shutdown in reverse order
      await this.shutdownMetrics();
      await this.shutdownMonitoring();
      await this.shutdownRedis();
      await this.shutdownDatabase();

      this.isInitialized = false;
      this.logger.info('✅ Infrastructure shutdown completed');
    } catch (error) {
      this.logger.error('❌ Error during infrastructure shutdown', { error });
      throw error;
    }
  }

  /**
   * Shutdown database connection
   */
  private async shutdownDatabase(): Promise<void> {
    try {
      const dbConnection = getDatabaseConnection();
      await dbConnection.close();
      this.logger.info('✅ Database connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing database connection', { error });
    }
  }

  /**
   * Shutdown Redis client
   */
  private async shutdownRedis(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      await redisClient.close();
      this.logger.info('✅ Redis connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing Redis connection', { error });
    }
  }

  /**
   * Shutdown monitoring services
   */
  private async shutdownMonitoring(): Promise<void> {
    try {
      // Health check service doesn't need explicit shutdown
      this.logger.info('✅ Monitoring services stopped');
    } catch (error) {
      this.logger.error('❌ Error stopping monitoring services', { error });
    }
  }

  /**
   * Shutdown metrics collection
   */
  private async shutdownMetrics(): Promise<void> {
    try {
      // Metrics collector doesn't need explicit shutdown
      this.logger.info('✅ Metrics collection stopped');
    } catch (error) {
      this.logger.error('❌ Error stopping metrics collection', { error });
    }
  }

  /**
   * Check if infrastructure is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    InfrastructureManager.instance = undefined as any;
  }
}

// Export singleton getter
export const getInfrastructureManager = () => InfrastructureManager.getInstance();

// Export individual components for convenience
export {
  getDatabaseConnection,
  getRedisClient,
  getLogger,
  getHealthCheckService,
  getMetricsCollector,
};

// Export types
export type { InfrastructureStatus };
