/**
 * Redis Client
 * Centralized Redis connection and caching operations with fallback mechanisms
 */

import Redis from 'ioredis';
import { Logger } from '../monitoring/logger.js';
import { appConfig } from '../../config/app.config.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
  fallbackToMemory?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export class RedisClient {
  private static instance: RedisClient;
  private redis: Redis;
  private logger: Logger;
  private isConnected = false;
  private memoryFallback = new Map<string, { value: any; expires: number }>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.redis = this.createRedisConnection();
    this.setupEventHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Create Redis connection
   */
  private createRedisConnection(): Redis {
    const redis = new Redis(appConfig.redis.url, {
      maxRetriesPerRequest: appConfig.redis.maxRetriesPerRequest,
      retryDelayOnFailover: appConfig.redis.retryDelay,
      lazyConnect: appConfig.redis.lazyConnect,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    return redis;
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.info('Redis connected successfully');
    });

    this.redis.on('ready', () => {
      this.logger.info('Redis ready for operations');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      this.stats.errors++;
      this.logger.error('Redis connection error', { error: error.message });
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', (delay) => {
      this.logger.info('Redis reconnecting', { delay });
    });
  }

  /**
   * Initialize Redis connection
   */
  public async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      this.isConnected = true;
      this.logger.info('Redis initialization successful');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Redis initialization failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  public async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected) {
        const value = await this.redis.get(fullKey);
        
        if (value !== null) {
          this.stats.hits++;
          this.updateHitRate();
          return this.deserialize<T>(value);
        }
      }

      // Fallback to memory cache
      if (options.fallbackToMemory) {
        const memoryValue = this.getFromMemory<T>(fullKey);
        if (memoryValue !== null) {
          this.stats.hits++;
          this.updateHitRate();
          return memoryValue;
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis get operation failed', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Fallback to memory cache on error
      if (options.fallbackToMemory) {
        const memoryValue = this.getFromMemory<T>(fullKey);
        if (memoryValue !== null) {
          this.stats.hits++;
          this.updateHitRate();
          return memoryValue;
        }
      }

      return null;
    }
  }

  /**
   * Set value in cache
   */
  public async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || appConfig.cache.defaultTTL;
    const serializedValue = this.serialize(value);

    try {
      if (this.isConnected) {
        if (ttl > 0) {
          await this.redis.setex(fullKey, ttl, serializedValue);
        } else {
          await this.redis.set(fullKey, serializedValue);
        }
      }

      // Also set in memory fallback
      if (options.fallbackToMemory) {
        this.setInMemory(fullKey, value, ttl);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis set operation failed', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Fallback to memory cache on error
      if (options.fallbackToMemory) {
        this.setInMemory(fullKey, value, ttl);
        return true;
      }

      return false;
    }
  }

  /**
   * Delete value from cache
   */
  public async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected) {
        await this.redis.del(fullKey);
      }

      // Also delete from memory fallback
      this.memoryFallback.delete(fullKey);

      this.stats.deletes++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis delete operation failed', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected) {
        const result = await this.redis.exists(fullKey);
        return result === 1;
      }

      // Check memory fallback
      return this.memoryFallback.has(fullKey);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis exists operation failed', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Set expiration for a key
   */
  public async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected) {
        const result = await this.redis.expire(fullKey, ttl);
        return result === 1;
      }

      return false;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis expire operation failed', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get multiple values
   */
  public async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.buildKey(key, options.prefix));

    try {
      if (this.isConnected) {
        const values = await this.redis.mget(...fullKeys);
        return values.map(value => value ? this.deserialize<T>(value) : null);
      }

      // Fallback to memory cache
      return fullKeys.map(key => this.getFromMemory<T>(key));
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis mget operation failed', { 
        keys: fullKeys, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  public async mset(
    keyValuePairs: Record<string, any>, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      if (this.isConnected) {
        const pairs: string[] = [];
        
        for (const [key, value] of Object.entries(keyValuePairs)) {
          const fullKey = this.buildKey(key, options.prefix);
          pairs.push(fullKey, this.serialize(value));
        }

        await this.redis.mset(...pairs);

        // Set TTL for each key if specified
        if (options.ttl) {
          const expirePromises = Object.keys(keyValuePairs).map(key => 
            this.expire(key, options.ttl!, options)
          );
          await Promise.all(expirePromises);
        }
      }

      this.stats.sets += Object.keys(keyValuePairs).length;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis mset operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Ping Redis server
   */
  public async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Redis info
   */
  public async getInfo(): Promise<Record<string, any>> {
    try {
      if (!this.isConnected) {
        return { connected: false };
      }

      const info = await this.redis.info();
      const memory = await this.redis.info('memory');
      
      return {
        connected: this.isConnected,
        info: this.parseRedisInfo(info),
        memory: this.parseRedisInfo(memory),
        stats: this.getStats(),
      };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache
   */
  public async clear(pattern?: string): Promise<boolean> {
    try {
      if (this.isConnected) {
        if (pattern) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.flushdb();
        }
      }

      // Clear memory fallback
      if (pattern) {
        for (const key of this.memoryFallback.keys()) {
          if (key.includes(pattern)) {
            this.memoryFallback.delete(key);
          }
        }
      } else {
        this.memoryFallback.clear();
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Redis clear operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    try {
      await this.redis.quit();
      this.isConnected = false;
      this.logger.info('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Error closing Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Private helper methods

  private buildKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || appConfig.cache.keyPrefix;
    return `${keyPrefix}${key}`;
  }

  private serialize(value: any): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string): T {
    return JSON.parse(value);
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryFallback.get(key);
    
    if (!item) {
      return null;
    }

    if (item.expires > 0 && Date.now() > item.expires) {
      this.memoryFallback.delete(key);
      return null;
    }

    return item.value;
  }

  private setInMemory(key: string, value: any, ttl: number): void {
    const expires = ttl > 0 ? Date.now() + (ttl * 1000) : 0;
    this.memoryFallback.set(key, { value, expires });
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    if (RedisClient.instance) {
      RedisClient.instance.close().catch(console.error);
    }
    RedisClient.instance = undefined as any;
  }
}

// Export singleton getter
export const getRedisClient = () => RedisClient.getInstance();
