/**
 * Metrics Collection System
 * Performance metrics, business metrics, and system monitoring
 */

import { Logger } from './logger.js';

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface BusinessMetric {
  event: string;
  value: number;
  unit: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemMetric {
  name: string;
  value: number;
  timestamp: Date;
  system: string;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private logger: Logger;
  private metrics: Map<string, MetricData[]> = new Map();
  private performanceMetrics: PerformanceMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private metricsRetentionMs = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.logger = Logger.getInstance();
    this.startMetricsCleanup();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record a custom metric
   */
  public recordMetric(metric: Omit<MetricData, 'timestamp'>): void {
    const metricData: MetricData = {
      ...metric,
      timestamp: new Date(),
    };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    this.metrics.get(metric.name)!.push(metricData);

    this.logger.debug('Metric recorded', {
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
    });
  }

  /**
   * Record performance metric
   */
  public recordPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(performanceMetric);

    this.logger.logPerformance(metric.operation, metric.duration, {
      success: metric.success,
      tags: metric.tags,
    });
  }

  /**
   * Record business metric
   */
  public recordBusinessMetric(metric: Omit<BusinessMetric, 'timestamp'>): void {
    const businessMetric: BusinessMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.businessMetrics.push(businessMetric);

    this.logger.logBusinessEvent(metric.event, {
      value: metric.value,
      unit: metric.unit,
      userId: metric.userId,
      metadata: metric.metadata,
    });
  }

  /**
   * Record system metric
   */
  public recordSystemMetric(metric: Omit<SystemMetric, 'timestamp'>): void {
    const systemMetric: SystemMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.systemMetrics.push(systemMetric);

    this.logger.debug('System metric recorded', {
      name: metric.name,
      value: metric.value,
      system: metric.system,
    });
  }

  /**
   * Time an operation and record performance metric
   */
  public async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.recordPerformance({
        operation,
        duration,
        success,
        tags,
      });
    }
  }

  /**
   * Time a synchronous operation
   */
  public timeSync<T>(
    operation: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const startTime = Date.now();
    let success = false;

    try {
      const result = fn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.recordPerformance({
        operation,
        duration,
        success,
        tags,
      });
    }
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(
    name: string,
    value = 1,
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      unit: 'count',
      tags,
    });
  }

  /**
   * Record a gauge metric (current value)
   */
  public recordGauge(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      unit,
      tags,
    });
  }

  /**
   * Record a histogram metric (distribution of values)
   */
  public recordHistogram(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name: `${name}_histogram`,
      value,
      unit,
      tags,
    });
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(): {
    totalMetrics: number;
    performanceMetrics: number;
    businessMetrics: number;
    systemMetrics: number;
    timeRange: { start: Date; end: Date };
  } {
    const allMetrics = Array.from(this.metrics.values()).flat();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - this.metricsRetentionMs);

    return {
      totalMetrics: allMetrics.length,
      performanceMetrics: this.performanceMetrics.length,
      businessMetrics: this.businessMetrics.length,
      systemMetrics: this.systemMetrics.length,
      timeRange: {
        start: oneDayAgo,
        end: now,
      },
    };
  }

  /**
   * Get performance metrics for a specific operation
   */
  public getPerformanceMetrics(
    operation?: string,
    timeRangeMs = 60 * 60 * 1000 // 1 hour
  ): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - timeRangeMs);
    
    return this.performanceMetrics
      .filter(metric => 
        metric.timestamp >= cutoff &&
        (!operation || metric.operation === operation)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get business metrics
   */
  public getBusinessMetrics(
    event?: string,
    timeRangeMs = 60 * 60 * 1000 // 1 hour
  ): BusinessMetric[] {
    const cutoff = new Date(Date.now() - timeRangeMs);
    
    return this.businessMetrics
      .filter(metric => 
        metric.timestamp >= cutoff &&
        (!event || metric.event === event)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get average response time for an operation
   */
  public getAverageResponseTime(
    operation: string,
    timeRangeMs = 60 * 60 * 1000 // 1 hour
  ): number {
    const metrics = this.getPerformanceMetrics(operation, timeRangeMs);
    
    if (metrics.length === 0) {
      return 0;
    }

    const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / metrics.length;
  }

  /**
   * Get success rate for an operation
   */
  public getSuccessRate(
    operation: string,
    timeRangeMs = 60 * 60 * 1000 // 1 hour
  ): number {
    const metrics = this.getPerformanceMetrics(operation, timeRangeMs);
    
    if (metrics.length === 0) {
      return 100; // Assume 100% if no data
    }

    const successCount = metrics.filter(metric => metric.success).length;
    return (successCount / metrics.length) * 100;
  }

  /**
   * Get error rate for an operation
   */
  public getErrorRate(
    operation: string,
    timeRangeMs = 60 * 60 * 1000 // 1 hour
  ): number {
    return 100 - this.getSuccessRate(operation, timeRangeMs);
  }

  /**
   * Collect system metrics
   */
  public collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    this.recordSystemMetric({
      name: 'memory_heap_used',
      value: memoryUsage.heapUsed,
      system: 'nodejs',
    });

    this.recordSystemMetric({
      name: 'memory_heap_total',
      value: memoryUsage.heapTotal,
      system: 'nodejs',
    });

    this.recordSystemMetric({
      name: 'memory_external',
      value: memoryUsage.external,
      system: 'nodejs',
    });

    // CPU metrics
    this.recordSystemMetric({
      name: 'cpu_user',
      value: cpuUsage.user,
      system: 'nodejs',
    });

    this.recordSystemMetric({
      name: 'cpu_system',
      value: cpuUsage.system,
      system: 'nodejs',
    });

    // Process metrics
    this.recordSystemMetric({
      name: 'uptime',
      value: process.uptime(),
      system: 'nodejs',
    });
  }

  /**
   * Start automatic system metrics collection
   */
  public startSystemMetricsCollection(intervalMs = 60000): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);
  }

  /**
   * Clean up old metrics
   */
  private startMetricsCleanup(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - this.metricsRetentionMs);

      // Clean up custom metrics
      for (const [name, metrics] of this.metrics.entries()) {
        const filteredMetrics = metrics.filter(metric => metric.timestamp >= cutoff);
        this.metrics.set(name, filteredMetrics);
      }

      // Clean up performance metrics
      this.performanceMetrics = this.performanceMetrics.filter(
        metric => metric.timestamp >= cutoff
      );

      // Clean up business metrics
      this.businessMetrics = this.businessMetrics.filter(
        metric => metric.timestamp >= cutoff
      );

      // Clean up system metrics
      this.systemMetrics = this.systemMetrics.filter(
        metric => metric.timestamp >= cutoff
      );

      this.logger.debug('Metrics cleanup completed', {
        retentionMs: this.metricsRetentionMs,
        cutoff: cutoff.toISOString(),
      });
    }, 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    MetricsCollector.instance = undefined as any;
  }
}

// Export singleton getter
export const getMetricsCollector = () => MetricsCollector.getInstance();

// Export convenience instance
export const metrics = MetricsCollector.getInstance();
