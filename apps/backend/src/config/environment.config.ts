/**
 * Environment Configuration Management
 * Type-safe configuration loading and validation using Zod schemas
 */

import { z } from 'zod';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Environment validation schema
const environmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('8080'),
  APP_NAME: z.string().default('SMM Guru API'),
  APP_VERSION: z.string().default('1.0.0'),
  API_PREFIX: z.string().default('/api'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_MAX_CONNECTIONS: z.string().regex(/^\d+$/).transform(Number).default('20'),
  DATABASE_IDLE_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  DATABASE_SSL: z.string().transform(val => val === 'true').default('false'),
  
  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  REDIS_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).default('3'),
  REDIS_RETRY_DELAY: z.string().regex(/^\d+$/).transform(Number).default('1000'),
  REDIS_MAX_RETRIES_PER_REQUEST: z.string().regex(/^\d+$/).transform(Number).default('3'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default('12'),
  
  // Encryption
  AES_SECRET_KEY: z.string().min(32, 'AES_SECRET_KEY must be at least 32 characters'),
  AES_IV_LENGTH: z.string().regex(/^\d+$/).transform(Number).default('16'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_SKIP_SUCCESSFUL: z.string().transform(val => val === 'true').default('false'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10485760'), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // External Services
  RESEND_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring & Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  ENABLE_REQUEST_LOGGING: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  ENABLE_HELMET: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  TRUSTED_PROXIES: z.string().default(''),
  
  // Provider APIs
  PROVIDER_API_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  PROVIDER_API_RETRIES: z.string().regex(/^\d+$/).transform(Number).default('3'),
  
  // Queue Processing
  QUEUE_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default('5'),
  QUEUE_MAX_ATTEMPTS: z.string().regex(/^\d+$/).transform(Number).default('3'),
  QUEUE_BACKOFF_DELAY: z.string().regex(/^\d+$/).transform(Number).default('5000'),
  
  // Health Check
  HEALTH_CHECK_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('5000'),
  HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  
  // Cache
  CACHE_DEFAULT_TTL: z.string().regex(/^\d+$/).transform(Number).default('300'), // 5 minutes
  CACHE_MAX_TTL: z.string().regex(/^\d+$/).transform(Number).default('3600'), // 1 hour
  CACHE_KEY_PREFIX: z.string().default('smmguru:'),
});

// Type definition for validated environment
export type Environment = z.infer<typeof environmentSchema>;

export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: Environment;
  private validationErrors: z.ZodError | null = null;

  private constructor() {
    this.validateAndLoad();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  /**
   * Validate and load environment configuration
   */
  private validateAndLoad(): void {
    try {
      this.config = environmentSchema.parse(process.env);
      this.logConfigurationSummary();
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error;
        this.handleValidationErrors(error);
      } else {
        throw new Error(`Configuration loading failed: ${error}`);
      }
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationErrors(error: z.ZodError): void {
    const errorMessages = error.errors.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });

    console.error('❌ Environment configuration validation failed:');
    errorMessages.forEach(message => console.error(`  - ${message}`));

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // In development, provide helpful guidance
    console.warn('⚠️  Using default values for missing configuration');
    console.warn('💡 Create a .env file with the required variables');
    
    // Try to parse with defaults
    try {
      this.config = environmentSchema.parse({});
    } catch {
      console.error('❌ Failed to load even with defaults. Exiting...');
      process.exit(1);
    }
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    console.log('✅ Environment configuration loaded successfully');
    console.log(`📊 Configuration Summary:`);
    console.log(`   • Environment: ${this.config.NODE_ENV}`);
    console.log(`   • Port: ${this.config.PORT}`);
    console.log(`   • Database: ${this.maskUrl(this.config.DATABASE_URL)}`);
    console.log(`   • Redis: ${this.maskUrl(this.config.REDIS_URL)}`);
    console.log(`   • Log Level: ${this.config.LOG_LEVEL}`);
    console.log(`   • Rate Limiting: ${this.config.ENABLE_RATE_LIMITING ? 'Enabled' : 'Disabled'}`);
    console.log(`   • Request Logging: ${this.config.ENABLE_REQUEST_LOGGING ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Mask sensitive URLs for logging
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return 'Invalid URL';
    }
  }

  /**
   * Get configuration value
   */
  public get<K extends keyof Environment>(key: K): Environment[K] {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  public getAll(): Environment {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return { ...this.config };
  }

  /**
   * Check if configuration is valid
   */
  public isValid(): boolean {
    return this.validationErrors === null;
  }

  /**
   * Get validation errors
   */
  public getValidationErrors(): z.ZodError | null {
    return this.validationErrors;
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Check if running in test
   */
  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  /**
   * Check if running in staging
   */
  public isStaging(): boolean {
    return this.config.NODE_ENV === 'staging';
  }

  /**
   * Get database configuration
   */
  public getDatabaseConfig() {
    return {
      url: this.config.DATABASE_URL,
      maxConnections: this.config.DATABASE_MAX_CONNECTIONS,
      idleTimeout: this.config.DATABASE_IDLE_TIMEOUT,
      ssl: this.config.DATABASE_SSL,
    };
  }

  /**
   * Get Redis configuration
   */
  public getRedisConfig() {
    return {
      url: this.config.REDIS_URL,
      maxRetries: this.config.REDIS_MAX_RETRIES,
      retryDelay: this.config.REDIS_RETRY_DELAY,
      maxRetriesPerRequest: this.config.REDIS_MAX_RETRIES_PER_REQUEST,
    };
  }

  /**
   * Get authentication configuration
   */
  public getAuthConfig() {
    return {
      jwtSecret: this.config.JWT_SECRET,
      jwtExpiresIn: this.config.JWT_EXPIRES_IN,
      jwtRefreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
      bcryptRounds: this.config.BCRYPT_ROUNDS,
    };
  }

  /**
   * Get cache configuration
   */
  public getCacheConfig() {
    return {
      defaultTTL: this.config.CACHE_DEFAULT_TTL,
      maxTTL: this.config.CACHE_MAX_TTL,
      keyPrefix: this.config.CACHE_KEY_PREFIX,
    };
  }

  /**
   * Reload configuration (for testing)
   */
  public reload(): void {
    this.validateAndLoad();
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    EnvironmentConfig.instance = undefined as any;
  }
}

// Export singleton getter
export const getEnvironmentConfig = () => EnvironmentConfig.getInstance();

// Export validated environment
export const env = getEnvironmentConfig().getAll();
