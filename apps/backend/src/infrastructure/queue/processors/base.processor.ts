/**
 * Base Queue Processor
 * Abstract base class for all queue processors with common functionality
 */

import { Job, Worker } from 'bullmq';
import { QueueNames, JobTypes, queueRedisConnection } from '../bull.config.js';

// Base job data interface
export interface BaseJobData {
  id?: string;
  timestamp?: string;
  userId?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

// Job result interface
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

// Processor options
export interface ProcessorOptions {
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Abstract base processor class
 */
export abstract class BaseProcessor<T extends BaseJobData = BaseJobData> {
  protected worker: Worker;
  protected queueName: QueueNames;
  protected options: ProcessorOptions;

  constructor(
    queueName: QueueNames,
    options: ProcessorOptions = {}
  ) {
    this.queueName = queueName;
    this.options = {
      concurrency: 5,
      maxRetries: 3,
      retryDelay: 2000,
      timeout: 30000,
      ...options,
    };

    // Create worker with bound processor method
    this.worker = new Worker(
      queueName,
      this.processJob.bind(this),
      {
        connection: queueRedisConnection,
        concurrency: this.options.concurrency,
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Abstract method to be implemented by concrete processors
   */
  protected abstract processJobData(jobData: T): Promise<any>;

  /**
   * Main job processing method with error handling and logging
   */
  private async processJob(job: Job<T>): Promise<JobResult> {
    const startTime = Date.now();
    const jobId = job.id || 'unknown';
    
    try {
      console.log(`🔄 Processing job ${jobId} in queue ${this.queueName}`);
      
      // Validate job data
      this.validateJobData(job.data);
      
      // Add metadata
      const enrichedData = this.enrichJobData(job.data);
      
      // Process the job
      const result = await this.processJobData(enrichedData);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Job ${jobId} completed successfully in ${duration}ms`);
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Job ${jobId} failed after ${duration}ms:`, errorMessage);
      
      // Determine if job should be retried
      const shouldRetry = this.shouldRetryJob(job, error);
      
      if (!shouldRetry) {
        console.error(`🚫 Job ${jobId} will not be retried`);
      }
      
      return {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate job data before processing
   */
  protected validateJobData(data: T): void {
    if (!data) {
      throw new Error('Job data is required');
    }
    
    // Add specific validation in concrete classes
  }

  /**
   * Enrich job data with metadata
   */
  protected enrichJobData(data: T): T {
    return {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: {
        ...data.metadata,
        processor: this.constructor.name,
        queueName: this.queueName,
      },
    };
  }

  /**
   * Determine if a failed job should be retried
   */
  protected shouldRetryJob(job: Job<T>, error: any): boolean {
    // Don't retry if max attempts reached
    if (job.attemptsMade >= (this.options.maxRetries || 3)) {
      return false;
    }

    // Don't retry validation errors
    if (error instanceof ValidationError) {
      return false;
    }

    // Don't retry authentication errors
    if (error instanceof AuthenticationError) {
      return false;
    }

    // Retry network errors, temporary failures, etc.
    return true;
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed in queue ${this.queueName}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed in queue ${this.queueName}:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error(`🚨 Worker error in queue ${this.queueName}:`, err);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`⏰ Job ${jobId} stalled in queue ${this.queueName}`);
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Update job progress
   */
  protected async updateProgress(job: Job, progress: number): Promise<void> {
    await job.updateProgress(progress);
  }

  /**
   * Get worker statistics (placeholder - implement with queue manager)
   */
  async getStats(): Promise<{
    processed: number;
    failed: number;
    active: number;
    waiting: number;
  }> {
    // Note: Worker doesn't have direct access to queue stats
    // This should be implemented through the queue manager
    return {
      processed: 0,
      failed: 0,
      active: 0,
      waiting: 0,
    };
  }

  /**
   * Gracefully close the worker
   */
  async close(): Promise<void> {
    console.log(`🛑 Closing worker for queue ${this.queueName}`);
    await this.worker.close();
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    console.log(`⏸️ Pausing worker for queue ${this.queueName}`);
    await this.worker.pause();
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    console.log(`▶️ Resuming worker for queue ${this.queueName}`);
    this.worker.resume();
  }
}

// Custom error classes for better error handling
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public readonly retryable: boolean = true) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export default BaseProcessor;
