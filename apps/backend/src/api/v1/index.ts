/**
 * API v1 Routes Index
 * Central configuration for all v1 API routes with service integration
 */

import { Hono } from 'hono';
import { getServiceFactory } from '../../core/services/service.factory.js';
import createHandlerRoutes from './handler/handler.routes.js';
import createAuthRoutes from './auth/auth.routes.js';
import type { HonoAuthContext } from '../../shared/types/api.types.js';

// Import existing routes for backward compatibility
import apiKeyRoute from '../../routes/api-keys/api-keys.route.js';
import orderCronRoute from '../../routes/cron/order.cron.js';

/**
 * Create API v1 routes with proper service integration
 */
export function createApiV1Routes() {
  const api = new Hono<{ Variables: HonoAuthContext }>();
  
  // Get service factory instance
  const serviceFactory = getServiceFactory();

  // Health check endpoint for the entire API
  api.get('/health', async (c) => {
    try {
      const healthStatus = await serviceFactory.healthCheck();
      
      return c.json({
        success: true,
        name: 'API_HEALTH_CHECK',
        message: 'API health status',
        result: {
          api: {
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
          services: healthStatus,
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        name: 'API_HEALTH_ERROR',
        message: 'Health check failed',
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  });

  // Authentication routes
  api.route('/auth', createAuthRoutes());

  // Migrated handler routes (new service layer)
  api.route('/handler', createHandlerRoutes(serviceFactory.getHandlerController()));

  // Existing routes for backward compatibility
  api.route('/api-key', apiKeyRoute);
  api.route('/cron/order', orderCronRoute);

  // API information endpoint
  api.get('/info', (c) => {
    return c.json({
      success: true,
      name: 'API_INFO',
      message: 'SMM Guru API v1 Information',
      result: {
        version: '1.0.0',
        name: 'SMM Guru API',
        description: 'Social Media Marketing automation platform API',
        features: [
          'Order Management',
          'Service Catalog',
          'Provider Integration',
          'Wallet Management',
          'Real-time Notifications',
          'Analytics & Reporting'
        ],
        endpoints: {
          auth: '/api/v1/auth',
          handler: '/api/v1/handler',
          apiKeys: '/api/v1/api-key',
          cron: '/api/v1/cron/order',
          health: '/api/v1/health',
          info: '/api/v1/info'
        },
        documentation: 'https://docs.smmguru.com/api/v1',
        support: 'support@smmguru.com'
      },
    });
  });

  return api;
}

// Export default for backward compatibility
export default createApiV1Routes;
