/**
 * Health Check Controller
 * Provides health check endpoints for monitoring and load balancers
 */

import type { Context } from 'hono';
import { getHealthCheckService } from '../../infrastructure/monitoring/health-check.js';
import { sendSuccess, sendError } from '../../shared/utils/response.util.js';

export class HealthController {
  private healthCheckService = getHealthCheckService();

  /**
   * Simple health check endpoint
   * GET /health
   */
  async simpleHealth(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.getSimpleHealth();
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      return c.json({
        status: health.status,
        timestamp: health.timestamp,
      }, statusCode);
    } catch (error) {
      return c.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 503);
    }
  }

  /**
   * Detailed health check endpoint
   * GET /health/detailed
   */
  async detailedHealth(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.performHealthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      return sendSuccess(
        c,
        'HEALTH_CHECK_COMPLETED',
        'Health check completed successfully',
        health,
        statusCode
      );
    } catch (error) {
      return sendError(
        c,
        'HEALTH_CHECK_FAILED',
        'Health check failed',
        503,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Readiness probe endpoint
   * GET /health/ready
   */
  async readinessProbe(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.performHealthCheck();
      
      // Service is ready if database is up (minimum requirement)
      const isReady = health.services.database.status === 'up';
      
      return c.json({
        ready: isReady,
        timestamp: health.timestamp,
        services: {
          database: health.services.database.status,
          redis: health.services.redis.status,
        }
      }, isReady ? 200 : 503);
    } catch (error) {
      return c.json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 503);
    }
  }

  /**
   * Liveness probe endpoint
   * GET /health/live
   */
  async livenessProbe(c: Context): Promise<Response> {
    try {
      // Simple check to see if the application is running
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      // Consider unhealthy if memory usage is too high
      const memoryThreshold = 1024 * 1024 * 1024; // 1GB
      const isLive = memoryUsage.heapUsed < memoryThreshold;
      
      return c.json({
        live: isLive,
        uptime,
        timestamp: new Date().toISOString(),
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        }
      }, isLive ? 200 : 503);
    } catch (error) {
      return c.json({
        live: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 503);
    }
  }

  /**
   * Database health check endpoint
   * GET /health/database
   */
  async databaseHealth(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.performHealthCheck();
      const dbHealth = health.services.database;
      
      return sendSuccess(
        c,
        'DATABASE_HEALTH_CHECK',
        'Database health check completed',
        dbHealth,
        dbHealth.status === 'up' ? 200 : 503
      );
    } catch (error) {
      return sendError(
        c,
        'DATABASE_HEALTH_CHECK_FAILED',
        'Database health check failed',
        503,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Redis health check endpoint
   * GET /health/redis
   */
  async redisHealth(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.performHealthCheck();
      const redisHealth = health.services.redis;
      
      return sendSuccess(
        c,
        'REDIS_HEALTH_CHECK',
        'Redis health check completed',
        redisHealth,
        redisHealth.status === 'up' ? 200 : 503
      );
    } catch (error) {
      return sendError(
        c,
        'REDIS_HEALTH_CHECK_FAILED',
        'Redis health check failed',
        503,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * System metrics endpoint
   * GET /health/metrics
   */
  async systemMetrics(c: Context): Promise<Response> {
    try {
      const health = await this.healthCheckService.performHealthCheck();
      
      return sendSuccess(
        c,
        'SYSTEM_METRICS',
        'System metrics retrieved successfully',
        {
          uptime: health.uptime,
          version: health.version,
          environment: health.environment,
          metrics: health.metrics,
          timestamp: health.timestamp,
        }
      );
    } catch (error) {
      return sendError(
        c,
        'SYSTEM_METRICS_FAILED',
        'Failed to retrieve system metrics',
        500,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}
