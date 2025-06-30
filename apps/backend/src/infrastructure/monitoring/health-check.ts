/**
 * Health Check System
 * Comprehensive health monitoring for all system components
 */

import { DatabaseConnection } from '../database/connection.js';
import { RedisClient } from '../cache/redis.client.js';
import { getServiceFactory } from '../../core/services/service.factory.js';
import { Logger } from './logger.js';
import { appConfig } from '../../config/app.config.js';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    serviceLayer: ServiceHealth;
    external: ServiceHealth;
  };
  metrics: {
    memoryUsage: MemoryMetrics;
    cpuUsage: number;
    activeConnections: number;
    requestCount: number;
    errorRate: number;
  };
  details?: Record<string, any>;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private logger: Logger;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;

  private constructor() {
    this.logger = Logger.getInstance();
    this.startTime = Date.now();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting comprehensive health check');

      // Perform all health checks in parallel
      const [
        databaseHealth,
        redisHealth,
        serviceLayerHealth,
        externalHealth
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkServiceLayerHealth(),
        this.checkExternalServicesHealth()
      ]);

      // Determine overall status
      const services = {
        database: this.getResultValue(databaseHealth),
        redis: this.getResultValue(redisHealth),
        serviceLayer: this.getResultValue(serviceLayerHealth),
        external: this.getResultValue(externalHealth),
      };

      const overallStatus = this.determineOverallStatus(services);
      const metrics = await this.collectMetrics();

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: appConfig.app.version,
        environment: appConfig.app.environment,
        services,
        metrics,
      };

      const responseTime = Date.now() - startTime;
      this.logger.info('Health check completed', {
        status: overallStatus,
        responseTime,
        services: Object.entries(services).map(([name, health]) => ({
          name,
          status: health.status,
          responseTime: health.responseTime
        }))
      });

      return result;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: appConfig.app.version,
        environment: appConfig.app.environment,
        services: {
          database: { status: 'down', responseTime: 0, lastCheck: new Date().toISOString() },
          redis: { status: 'down', responseTime: 0, lastCheck: new Date().toISOString() },
          serviceLayer: { status: 'down', responseTime: 0, lastCheck: new Date().toISOString() },
          external: { status: 'down', responseTime: 0, lastCheck: new Date().toISOString() },
        },
        metrics: await this.collectMetrics(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const dbConnection = DatabaseConnection.getInstance();
      const healthStatus = await dbConnection.getHealthStatus();
      
      if (!healthStatus.isConnected) {
        throw new Error(healthStatus.error || 'Database not connected');
      }

      // Test a simple query
      const db = dbConnection.getDatabase();
      await dbConnection.getSql()`SELECT 1 as health_check`;

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: {
          connectionCount: healthStatus.connectionCount,
          activeConnections: healthStatus.activeConnections,
          idleConnections: healthStatus.idleConnections,
        }
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const redisClient = RedisClient.getInstance();
      const isConnected = await redisClient.ping();
      
      if (!isConnected) {
        throw new Error('Redis ping failed');
      }

      const info = await redisClient.getInfo();

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: info
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      };
    }
  }

  /**
   * Check service layer health
   */
  private async checkServiceLayerHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const serviceFactory = getServiceFactory();
      const serviceHealth = await serviceFactory.healthCheck();
      
      const hasUnhealthyServices = Object.values(serviceHealth.services)
        .some(status => status === 'down');

      return {
        status: hasUnhealthyServices ? 'degraded' : 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: serviceHealth.services
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Service layer error'
      };
    }
  }

  /**
   * Check external services health
   */
  private async checkExternalServicesHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // This would check external APIs, payment providers, etc.
      // For now, we'll simulate the check
      const externalChecks = await Promise.allSettled([
        this.checkExternalAPI('https://httpbin.org/status/200', 'httpbin'),
        // Add more external service checks as needed
      ]);

      const failedChecks = externalChecks.filter(result => result.status === 'rejected');
      const status = failedChecks.length === 0 ? 'up' : 
                   failedChecks.length < externalChecks.length ? 'degraded' : 'down';

      return {
        status,
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: {
          totalChecks: externalChecks.length,
          failedChecks: failedChecks.length,
        }
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'External services error'
      };
    }
  }

  /**
   * Check external API
   */
  private async checkExternalAPI(url: string, name: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (!response.ok) {
        throw new Error(`${name} returned ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`External API check failed for ${name}`, { url, error });
      throw error;
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<HealthCheckResult['metrics']> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
      cpuUsage: cpuUsage.user / 1000000, // Convert to seconds
      activeConnections: 0, // This would be tracked by connection manager
      requestCount: this.requestCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
    };
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(services: HealthCheckResult['services']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.every(status => status === 'up')) {
      return 'healthy';
    }
    
    if (statuses.some(status => status === 'down')) {
      // Critical services down
      if (services.database.status === 'down') {
        return 'unhealthy';
      }
      return 'degraded';
    }
    
    return 'degraded';
  }

  /**
   * Get result value from Promise.allSettled
   */
  private getResultValue<T>(result: PromiseSettledResult<T>): T {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    // Return default error state
    return {
      status: 'down',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
    } as T;
  }

  /**
   * Increment request counter
   */
  public incrementRequestCount(): void {
    this.requestCount++;
  }

  /**
   * Increment error counter
   */
  public incrementErrorCount(): void {
    this.errorCount++;
  }

  /**
   * Get simple health status
   */
  public async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const fullHealth = await this.performHealthCheck();
      return {
        status: fullHealth.status,
        timestamp: fullHealth.timestamp
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    HealthCheckService.instance = undefined as any;
  }
}

// Export singleton getter
export const getHealthCheckService = () => HealthCheckService.getInstance();
