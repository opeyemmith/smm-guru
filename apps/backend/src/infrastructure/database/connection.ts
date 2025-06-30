/**
 * Database Connection Manager
 * Singleton pattern for managing database connections with pooling and health monitoring
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '../../config/app.config.js';
import { Logger } from '../monitoring/logger.js';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  ssl: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface ConnectionHealth {
  isConnected: boolean;
  connectionCount: number;
  idleConnections: number;
  activeConnections: number;
  lastHealthCheck: Date;
  error?: string;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private sql: postgres.Sql;
  private db: ReturnType<typeof drizzle>;
  private config: DatabaseConfig;
  private logger: Logger;
  private healthStatus: ConnectionHealth;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = this.loadConfig();
    this.healthStatus = {
      isConnected: false,
      connectionCount: 0,
      idleConnections: 0,
      activeConnections: 0,
      lastHealthCheck: new Date(),
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection with retry logic
   */
  public async initialize(): Promise<void> {
    let attempt = 0;
    const maxAttempts = this.config.retryAttempts;

    while (attempt < maxAttempts) {
      try {
        await this.connect();
        this.logger.info('Database connection established successfully', {
          attempt: attempt + 1,
          maxConnections: this.config.maxConnections,
          ssl: this.config.ssl,
        });
        
        // Start health monitoring
        this.startHealthMonitoring();
        return;
      } catch (error) {
        attempt++;
        this.logger.error('Database connection failed', {
          attempt,
          maxAttempts,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempt >= maxAttempts) {
          throw new Error(`Failed to connect to database after ${maxAttempts} attempts`);
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  /**
   * Establish database connection
   */
  private async connect(): Promise<void> {
    this.sql = postgres(this.config.url, {
      max: this.config.maxConnections,
      idle_timeout: this.config.idleTimeout,
      connect_timeout: this.config.connectionTimeout,
      ssl: this.config.ssl ? 'require' : false,
      onnotice: (notice) => {
        this.logger.debug('Database notice', { notice });
      },
      onparameter: (key, value) => {
        this.logger.debug('Database parameter', { key, value });
      },
    });

    // Initialize Drizzle ORM
    this.db = drizzle(this.sql);

    // Test connection
    await this.testConnection();
    this.healthStatus.isConnected = true;
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.sql`SELECT 1 as test`;
      this.logger.debug('Database connection test successful');
    } catch (error) {
      this.logger.error('Database connection test failed', { error });
      throw error;
    }
  }

  /**
   * Get database instance
   */
  public getDatabase(): ReturnType<typeof drizzle> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Get raw SQL instance for advanced queries
   */
  public getSql(): postgres.Sql {
    if (!this.sql) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sql;
  }

  /**
   * Execute transaction
   */
  public async transaction<T>(
    callback: (tx: ReturnType<typeof drizzle>) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return await this.db.transaction(callback);
  }

  /**
   * Get connection health status
   */
  public async getHealthStatus(): Promise<ConnectionHealth> {
    try {
      // Update connection statistics
      const stats = await this.getConnectionStats();
      
      this.healthStatus = {
        isConnected: true,
        connectionCount: stats.total,
        idleConnections: stats.idle,
        activeConnections: stats.active,
        lastHealthCheck: new Date(),
      };
    } catch (error) {
      this.healthStatus = {
        isConnected: false,
        connectionCount: 0,
        idleConnections: 0,
        activeConnections: 0,
        lastHealthCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return { ...this.healthStatus };
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats(): Promise<{
    total: number;
    idle: number;
    active: number;
  }> {
    try {
      // Query PostgreSQL for connection statistics
      const result = await this.sql`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'active') as active
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      return {
        total: Number(result[0]?.total || 0),
        idle: Number(result[0]?.idle || 0),
        active: Number(result[0]?.active || 0),
      };
    } catch (error) {
      this.logger.warn('Failed to get connection statistics', { error });
      return { total: 0, idle: 0, active: 0 };
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getHealthStatus();
        this.logger.debug('Database health check completed', this.healthStatus);
      } catch (error) {
        this.logger.error('Database health check failed', { error });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Graceful shutdown
   */
  public async close(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.sql) {
        await this.sql.end();
        this.logger.info('Database connection closed gracefully');
      }

      this.healthStatus.isConnected = false;
    } catch (error) {
      this.logger.error('Error closing database connection', { error });
      throw error;
    }
  }

  /**
   * Load database configuration
   */
  private loadConfig(): DatabaseConfig {
    return {
      url: appConfig.database.url,
      maxConnections: appConfig.database.maxConnections,
      idleTimeout: appConfig.database.idleTimeout,
      connectionTimeout: 30000, // 30 seconds
      ssl: appConfig.database.ssl,
      retryAttempts: 5,
      retryDelay: 1000, // 1 second
    };
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    if (DatabaseConnection.instance) {
      DatabaseConnection.instance.close().catch(console.error);
    }
    DatabaseConnection.instance = undefined as any;
  }
}

// Export singleton getter
export const getDatabaseConnection = () => DatabaseConnection.getInstance();

// Export database instance getter
export const getDatabase = () => getDatabaseConnection().getDatabase();
