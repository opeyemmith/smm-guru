/**
 * Application Configuration
 * Centralized configuration management with environment validation
 */

import { getEnvironmentConfig } from './environment.config.js';

// Get validated environment configuration
const envConfig = getEnvironmentConfig();

/**
 * Application configuration object
 */
export const appConfig = {
  // Application settings
  app: {
    name: envConfig.get('APP_NAME'),
    version: envConfig.get('APP_VERSION'),
    environment: envConfig.get('NODE_ENV'),
    port: envConfig.get('PORT'),
    apiPrefix: envConfig.get('API_PREFIX'),
    isDevelopment: envConfig.isDevelopment(),
    isProduction: envConfig.isProduction(),
    isTest: envConfig.isTest(),
  },

  // Database configuration
  database: envConfig.getDatabaseConfig(),

  // Redis configuration
  redis: envConfig.getRedisConfig(),

  // Authentication configuration
  auth: envConfig.getAuthConfig(),

  // Logging configuration
  logging: {
    level: envConfig.get('LOG_LEVEL'),
    format: envConfig.get('LOG_FORMAT'),
    enableRequestLogging: envConfig.get('ENABLE_REQUEST_LOGGING'),
  },

  // External Services
  services: {
    resend: {
      apiKey: envConfig.get('RESEND_API_KEY'),
    },
  },
};

// Export default
export default appConfig;
