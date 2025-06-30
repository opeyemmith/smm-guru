/**
 * Health Check Routes
 * Provides various health check endpoints for monitoring
 */

import { Hono } from 'hono';
import { HealthController } from './health.controller.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware.js';

export function createHealthRoutes() {
  const health = new Hono();
  const healthController = new HealthController();

  // Apply rate limiting to prevent abuse
  health.use('*', rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many health check requests',
  }));

  /**
   * @route   GET /health
   * @desc    Simple health check for load balancers
   * @access  Public
   */
  health.get('/', async (c) => healthController.simpleHealth(c));

  /**
   * @route   GET /health/detailed
   * @desc    Comprehensive health check with all service details
   * @access  Public
   */
  health.get('/detailed', async (c) => healthController.detailedHealth(c));

  /**
   * @route   GET /health/ready
   * @desc    Kubernetes readiness probe
   * @access  Public
   */
  health.get('/ready', async (c) => healthController.readinessProbe(c));

  /**
   * @route   GET /health/live
   * @desc    Kubernetes liveness probe
   * @access  Public
   */
  health.get('/live', async (c) => healthController.livenessProbe(c));

  /**
   * @route   GET /health/database
   * @desc    Database-specific health check
   * @access  Public
   */
  health.get('/database', async (c) => healthController.databaseHealth(c));

  /**
   * @route   GET /health/redis
   * @desc    Redis-specific health check
   * @access  Public
   */
  health.get('/redis', async (c) => healthController.redisHealth(c));

  /**
   * @route   GET /health/metrics
   * @desc    System metrics and performance data
   * @access  Public
   */
  health.get('/metrics', async (c) => healthController.systemMetrics(c));

  return health;
}

// Export default for backward compatibility
export default createHealthRoutes;
