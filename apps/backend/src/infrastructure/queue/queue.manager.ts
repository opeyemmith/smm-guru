/**
 * Queue Manager
 * Centralized management for all queues and workers
 */

import { Queue, QueueEvents } from 'bullmq';
import { QueueConfigFactory, QueueNames, JobTypes, checkQueueHealth, shutdownQueues } from './bull.config.js';
import { OrderProcessor } from './processors/order.processor.js';
import { BaseProcessor } from './processors/base.processor.js';

// Queue manager interface
export interface QueueManagerOptions {
  enableOrderProcessing?: boolean;
  enableEmailNotifications?: boolean;
  enableAnalytics?: boolean;
  enableCleanup?: boolean;
  enableProviderSync?: boolean;
}

/**
 * Queue Manager class for coordinating all queue operations
 */
export class QueueManager {
  private queues: Map<QueueNames, Queue> = new Map();
  private processors: Map<QueueNames, BaseProcessor> = new Map();
  private queueEvents: Map<QueueNames, QueueEvents> = new Map();
  private isInitialized = false;
  private options: QueueManagerOptions;

  constructor(options: QueueManagerOptions = {}) {
    this.options = {
      enableOrderProcessing: true,
      enableEmailNotifications: true,
      enableAnalytics: true,
      enableCleanup: true,
      enableProviderSync: true,
      ...options,
    };
  }

  /**
   * Initialize all queues and processors
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Queue manager already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing queue manager...');

      // Check queue health before initialization
      const healthCheck = await checkQueueHealth();
      if (healthCheck.status === 'unhealthy') {
        throw new Error(`Queue health check failed: ${JSON.stringify(healthCheck.details)}`);
      }

      // Initialize queues based on options
      if (this.options.enableOrderProcessing) {
        await this.initializeOrderProcessing();
      }

      if (this.options.enableEmailNotifications) {
        await this.initializeEmailNotifications();
      }

      if (this.options.enableAnalytics) {
        await this.initializeAnalytics();
      }

      if (this.options.enableCleanup) {
        await this.initializeCleanup();
      }

      if (this.options.enableProviderSync) {
        await this.initializeProviderSync();
      }

      this.isInitialized = true;
      console.log('✅ Queue manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize queue manager:', error);
      throw error;
    }
  }

  /**
   * Initialize order processing queue
   */
  private async initializeOrderProcessing(): Promise<void> {
    console.log('🔧 Initializing order processing queue...');

    // Create queue
    const queue = QueueConfigFactory.createQueue(
      QueueNames.ORDER_PROCESSING,
      QueueConfigFactory.getQueueOptions(QueueNames.ORDER_PROCESSING)
    );

    // Create processor
    const processor = new OrderProcessor();

    // Create queue events
    const queueEvents = new QueueEvents(QueueNames.ORDER_PROCESSING);

    // Store references
    this.queues.set(QueueNames.ORDER_PROCESSING, queue);
    this.processors.set(QueueNames.ORDER_PROCESSING, processor);
    this.queueEvents.set(QueueNames.ORDER_PROCESSING, queueEvents);

    // Setup event handlers
    this.setupQueueEventHandlers(QueueNames.ORDER_PROCESSING, queueEvents);

    console.log('✅ Order processing queue initialized');
  }

  /**
   * Initialize email notifications queue (placeholder)
   */
  private async initializeEmailNotifications(): Promise<void> {
    console.log('🔧 Initializing email notifications queue...');

    const queue = QueueConfigFactory.createQueue(
      QueueNames.EMAIL_NOTIFICATIONS,
      QueueConfigFactory.getQueueOptions(QueueNames.EMAIL_NOTIFICATIONS)
    );

    this.queues.set(QueueNames.EMAIL_NOTIFICATIONS, queue);

    console.log('✅ Email notifications queue initialized (processor pending)');
  }

  /**
   * Initialize analytics queue (placeholder)
   */
  private async initializeAnalytics(): Promise<void> {
    console.log('🔧 Initializing analytics queue...');

    const queue = QueueConfigFactory.createQueue(
      QueueNames.ANALYTICS,
      QueueConfigFactory.getQueueOptions(QueueNames.ANALYTICS)
    );

    this.queues.set(QueueNames.ANALYTICS, queue);

    console.log('✅ Analytics queue initialized (processor pending)');
  }

  /**
   * Initialize cleanup queue (placeholder)
   */
  private async initializeCleanup(): Promise<void> {
    console.log('🔧 Initializing cleanup queue...');

    const queue = QueueConfigFactory.createQueue(
      QueueNames.CLEANUP,
      QueueConfigFactory.getQueueOptions(QueueNames.CLEANUP)
    );

    this.queues.set(QueueNames.CLEANUP, queue);

    console.log('✅ Cleanup queue initialized (processor pending)');
  }

  /**
   * Initialize provider sync queue (placeholder)
   */
  private async initializeProviderSync(): Promise<void> {
    console.log('🔧 Initializing provider sync queue...');

    const queue = QueueConfigFactory.createQueue(
      QueueNames.PROVIDER_SYNC,
      QueueConfigFactory.getQueueOptions(QueueNames.PROVIDER_SYNC)
    );

    this.queues.set(QueueNames.PROVIDER_SYNC, queue);

    console.log('✅ Provider sync queue initialized (processor pending)');
  }

  /**
   * Setup event handlers for queue monitoring
   */
  private setupQueueEventHandlers(queueName: QueueNames, queueEvents: QueueEvents): void {
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`✅ Job ${jobId} completed in ${queueName}:`, returnvalue);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed in ${queueName}:`, failedReason);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⏰ Job ${jobId} stalled in ${queueName}`);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📊 Job ${jobId} progress in ${queueName}:`, data);
    });
  }

  /**
   * Add a job to a specific queue
   */
  async addJob(
    queueName: QueueNames,
    jobType: JobTypes,
    data: any,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    }
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    const job = await queue.add(jobType, data, options);
    console.log(`📤 Job ${job.id} added to ${queueName} queue`);
    
    return job.id!;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueNames): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<QueueNames, any>> {
    const stats: Record<string, any> = {};

    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        stats[queueName] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return stats;
  }

  /**
   * Pause a specific queue
   */
  async pauseQueue(queueName: QueueNames): Promise<void> {
    const processor = this.processors.get(queueName);
    if (processor) {
      await processor.pause();
    }
    console.log(`⏸️ Queue ${queueName} paused`);
  }

  /**
   * Resume a specific queue
   */
  async resumeQueue(queueName: QueueNames): Promise<void> {
    const processor = this.processors.get(queueName);
    if (processor) {
      await processor.resume();
    }
    console.log(`▶️ Queue ${queueName} resumed`);
  }

  /**
   * Get queue health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    queues: Record<string, any>;
    redis: any;
  }> {
    const queueHealth = await checkQueueHealth();
    const queueStats = await this.getAllQueueStats();

    return {
      status: queueHealth.status,
      queues: queueStats,
      redis: queueHealth.details,
    };
  }

  /**
   * Gracefully shutdown all queues
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down queue manager...');

    try {
      // Close all processors
      for (const [queueName, processor] of this.processors) {
        console.log(`🛑 Closing processor for ${queueName}`);
        await processor.close();
      }

      // Close all queue events
      for (const [queueName, queueEvents] of this.queueEvents) {
        console.log(`🛑 Closing events for ${queueName}`);
        await queueEvents.close();
      }

      // Close all queues
      for (const [queueName, queue] of this.queues) {
        console.log(`🛑 Closing queue ${queueName}`);
        await queue.close();
      }

      // Shutdown Redis connections
      await shutdownQueues();

      this.isInitialized = false;
      console.log('✅ Queue manager shutdown complete');

    } catch (error) {
      console.error('❌ Error during queue manager shutdown:', error);
      throw error;
    }
  }

  /**
   * Check if queue manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

/**
 * Get the singleton queue manager instance
 */
export function getQueueManager(options?: QueueManagerOptions): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager(options);
  }
  return queueManagerInstance;
}

export default QueueManager;
