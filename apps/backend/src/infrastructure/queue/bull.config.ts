/**
 * BullMQ Queue Configuration
 * Centralized configuration for all queue operations
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Define our own options interfaces based on BullMQ's expected structure
interface QueueOptions {
  connection?: IORedis;
  defaultJobOptions?: {
    removeOnComplete?: number;
    removeOnFail?: number;
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
    priority?: number;
    delay?: number;
  };
}

interface WorkerOptions {
  connection?: IORedis;
  concurrency?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

// Redis connection configuration for queues
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_QUEUE_DB || '1'), // Use separate DB for queues
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
};

// Create Redis connection for queues
export const queueRedisConnection = new IORedis(redisConfig);

// Default queue options
export const defaultQueueOptions: QueueOptions = {
  connection: queueRedisConnection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
};

// Default worker options
export const defaultWorkerOptions: WorkerOptions = {
  connection: queueRedisConnection,
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
  removeOnComplete: 100,
  removeOnFail: 50,
};

// Queue names enum for type safety
export enum QueueNames {
  ORDER_PROCESSING = 'order-processing',
  EMAIL_NOTIFICATIONS = 'email-notifications',
  ANALYTICS = 'analytics',
  CLEANUP = 'cleanup',
  PROVIDER_SYNC = 'provider-sync',
}

// Job types enum for type safety
export enum JobTypes {
  // Order processing jobs
  PROCESS_ORDER = 'process-order',
  UPDATE_ORDER_STATUS = 'update-order-status',
  CANCEL_ORDER = 'cancel-order',
  REFUND_ORDER = 'refund-order',
  
  // Email notification jobs
  SEND_WELCOME_EMAIL = 'send-welcome-email',
  SEND_ORDER_CONFIRMATION = 'send-order-confirmation',
  SEND_ORDER_UPDATE = 'send-order-update',
  SEND_PASSWORD_RESET = 'send-password-reset',
  
  // Analytics jobs
  CALCULATE_METRICS = 'calculate-metrics',
  GENERATE_REPORT = 'generate-report',
  UPDATE_DASHBOARD = 'update-dashboard',
  
  // Cleanup jobs
  CLEANUP_EXPIRED_SESSIONS = 'cleanup-expired-sessions',
  CLEANUP_OLD_LOGS = 'cleanup-old-logs',
  CLEANUP_TEMP_FILES = 'cleanup-temp-files',
  
  // Provider sync jobs
  SYNC_PROVIDER_SERVICES = 'sync-provider-services',
  SYNC_PROVIDER_RATES = 'sync-provider-rates',
  CHECK_PROVIDER_STATUS = 'check-provider-status',
}

// Job priority levels
export enum JobPriority {
  CRITICAL = 1,    // Immediate processing (order cancellations, refunds)
  HIGH = 5,        // High priority (order processing, payment confirmations)
  NORMAL = 10,     // Normal priority (email notifications, analytics)
  LOW = 15,        // Low priority (cleanup, sync operations)
}

// Job data interfaces
export interface OrderProcessingJobData {
  orderId: string;
  userId: string;
  serviceId: string;
  providerId: string;
  quantity: number;
  targetUrl: string;
  priority: JobPriority;
}

export interface EmailJobData {
  to: string;
  template: string;
  data: Record<string, any>;
  priority: JobPriority;
}

export interface AnalyticsJobData {
  type: 'metrics' | 'report' | 'dashboard';
  timeRange: {
    start: Date;
    end: Date;
  };
  userId?: string;
  priority: JobPriority;
}

export interface CleanupJobData {
  type: 'sessions' | 'logs' | 'files';
  olderThan: Date;
  priority: JobPriority;
}

export interface ProviderSyncJobData {
  providerId: string;
  type: 'services' | 'rates' | 'status';
  priority: JobPriority;
}

// Queue configuration factory
export class QueueConfigFactory {
  /**
   * Create a new queue with default configuration
   */
  static createQueue(name: QueueNames, options?: Partial<QueueOptions>): Queue {
    return new Queue(name, {
      ...defaultQueueOptions,
      ...options,
    });
  }

  /**
   * Create a new worker with default configuration
   */
  static createWorker(
    name: QueueNames, 
    processor: string | ((job: any) => Promise<any>),
    options?: Partial<WorkerOptions>
  ): Worker {
    return new Worker(name, processor, {
      ...defaultWorkerOptions,
      ...options,
    });
  }

  /**
   * Get queue-specific options
   */
  static getQueueOptions(queueName: QueueNames): QueueOptions {
    const baseOptions = { ...defaultQueueOptions };

    switch (queueName) {
      case QueueNames.ORDER_PROCESSING:
        return {
          ...baseOptions,
          defaultJobOptions: {
            ...baseOptions.defaultJobOptions,
            priority: JobPriority.HIGH,
            delay: 0, // Process immediately
          },
        };

      case QueueNames.EMAIL_NOTIFICATIONS:
        return {
          ...baseOptions,
          defaultJobOptions: {
            ...baseOptions.defaultJobOptions,
            priority: JobPriority.NORMAL,
            delay: 1000, // 1 second delay to batch emails
          },
        };

      case QueueNames.ANALYTICS:
        return {
          ...baseOptions,
          defaultJobOptions: {
            ...baseOptions.defaultJobOptions,
            priority: JobPriority.LOW,
            delay: 5000, // 5 second delay
          },
        };

      case QueueNames.CLEANUP:
        return {
          ...baseOptions,
          defaultJobOptions: {
            ...baseOptions.defaultJobOptions,
            priority: JobPriority.LOW,
            delay: 60000, // 1 minute delay
          },
        };

      case QueueNames.PROVIDER_SYNC:
        return {
          ...baseOptions,
          defaultJobOptions: {
            ...baseOptions.defaultJobOptions,
            priority: JobPriority.NORMAL,
            delay: 30000, // 30 second delay
          },
        };

      default:
        return baseOptions;
    }
  }
}

// Health check for queue system
export async function checkQueueHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}> {
  try {
    // Test Redis connection
    await queueRedisConnection.ping();
    
    return {
      status: 'healthy',
      details: {
        redis: 'connected',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Graceful shutdown for queues
export async function shutdownQueues(): Promise<void> {
  console.log('🛑 Shutting down queue system...');
  
  try {
    await queueRedisConnection.quit();
    console.log('✅ Queue Redis connection closed');
  } catch (error) {
    console.error('❌ Error closing queue Redis connection:', error);
  }
}

export default QueueConfigFactory;
