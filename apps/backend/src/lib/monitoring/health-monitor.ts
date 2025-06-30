/**
 * Health Monitoring System
 * Comprehensive health checks for production monitoring
 */

export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  componentId: string;
  componentType: string;
  time: string;
  output?: string;
  observedValue?: any;
  observedUnit?: string;
  targetValue?: any;
  targetUnit?: string;
  links?: Record<string, string>;
}

export interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  version: string;
  releaseId: string;
  notes: string[];
  output: string;
  serviceId: string;
  description: string;
  checks: Record<string, HealthCheckResult[]>;
  links: Record<string, string>;
}

/**
 * Health Monitor class for managing system health checks
 */
export class HealthMonitor {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(private options: {
    checkIntervalMs?: number;
    enablePeriodicChecks?: boolean;
  } = {}) {
    this.options = {
      checkIntervalMs: 30000, // 30 seconds
      enablePeriodicChecks: true,
      ...options
    };
  }

  /**
   * Register a health check
   */
  registerCheck(
    name: string, 
    checkFn: () => Promise<HealthCheckResult>
  ): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(): void {
    if (!this.options.enablePeriodicChecks || this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        console.error('Error during periodic health checks:', error);
      }
    }, this.options.checkIntervalMs);

    console.log(`🏥 Health monitoring started (interval: ${this.options.checkIntervalMs}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🏥 Health monitoring stopped');
    }
  }

  /**
   * Run all registered health checks
   */
  async runAllChecks(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results.set(name, result);
        this.lastResults.set(name, result);
      } catch (error) {
        const failResult: HealthCheckResult = {
          status: 'fail',
          componentId: name,
          componentType: 'unknown',
          time: new Date().toISOString(),
          output: error instanceof Error ? error.message : 'Unknown error'
        };
        results.set(name, failResult);
        this.lastResults.set(name, failResult);
      }
    }

    return results;
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const results = await this.runAllChecks();
    const checks: Record<string, HealthCheckResult[]> = {};

    // Group results by component type
    for (const [name, result] of results) {
      const componentType = result.componentType;
      if (!checks[componentType]) {
        checks[componentType] = [];
      }
      checks[componentType].push(result);
    }

    // Determine overall status
    let overallStatus: 'pass' | 'fail' | 'warn' = 'pass';
    const notes: string[] = [];

    for (const result of results.values()) {
      if (result.status === 'fail') {
        overallStatus = 'fail';
        notes.push(`${result.componentId}: ${result.output || 'Failed'}`);
      } else if (result.status === 'warn' && overallStatus === 'pass') {
        overallStatus = 'warn';
        notes.push(`${result.componentId}: ${result.output || 'Warning'}`);
      }
    }

    return {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      releaseId: process.env.RELEASE_ID || 'unknown',
      notes,
      output: overallStatus === 'pass' ? 'All systems operational' : 'Some systems have issues',
      serviceId: 'smm-guru-backend',
      description: 'SMM Guru Backend API Health Status',
      checks,
      links: {
        about: '/api/version',
        health: '/health'
      }
    };
  }

  /**
   * Get last known results without running checks
   */
  getLastResults(): Map<string, HealthCheckResult> {
    return new Map(this.lastResults);
  }
}

/**
 * Default health checks
 */

/**
 * Memory usage health check
 */
export async function memoryHealthCheck(): Promise<HealthCheckResult> {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  let status: 'pass' | 'fail' | 'warn' = 'pass';
  let output = `Heap usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent}%)`;

  if (heapUsagePercent > 90) {
    status = 'fail';
    output += ' - Critical memory usage';
  } else if (heapUsagePercent > 75) {
    status = 'warn';
    output += ' - High memory usage';
  }

  return {
    status,
    componentId: 'memory',
    componentType: 'system',
    time: new Date().toISOString(),
    output,
    observedValue: heapUsagePercent,
    observedUnit: 'percent',
    targetValue: 75,
    targetUnit: 'percent'
  };
}

/**
 * Uptime health check
 */
export async function uptimeHealthCheck(): Promise<HealthCheckResult> {
  const uptimeSeconds = process.uptime();
  const uptimeMinutes = Math.round(uptimeSeconds / 60);
  const uptimeHours = Math.round(uptimeMinutes / 60);

  let output: string;
  if (uptimeHours > 0) {
    output = `Uptime: ${uptimeHours}h ${uptimeMinutes % 60}m`;
  } else {
    output = `Uptime: ${uptimeMinutes}m`;
  }

  return {
    status: 'pass',
    componentId: 'uptime',
    componentType: 'system',
    time: new Date().toISOString(),
    output,
    observedValue: uptimeSeconds,
    observedUnit: 'seconds'
  };
}

/**
 * Environment health check
 */
export async function environmentHealthCheck(): Promise<HealthCheckResult> {
  const nodeVersion = process.version;
  const platform = process.platform;
  const arch = process.arch;
  const env = process.env.NODE_ENV || 'development';

  return {
    status: 'pass',
    componentId: 'environment',
    componentType: 'system',
    time: new Date().toISOString(),
    output: `Node.js ${nodeVersion} on ${platform}/${arch} (${env})`,
    observedValue: {
      nodeVersion,
      platform,
      arch,
      environment: env
    }
  };
}

/**
 * Create default health monitor with basic checks
 */
export function createDefaultHealthMonitor(): HealthMonitor {
  const monitor = new HealthMonitor();

  // Register default checks
  monitor.registerCheck('memory', memoryHealthCheck);
  monitor.registerCheck('uptime', uptimeHealthCheck);
  monitor.registerCheck('environment', environmentHealthCheck);

  return monitor;
}

export default HealthMonitor;
