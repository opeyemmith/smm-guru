/**
 * Centralized Logging System
 * Winston-based structured logging with correlation IDs and performance tracking
 */

import winston from 'winston';
import { appConfig } from '../../config/app.config.js';
import { randomUUID } from 'crypto';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

export interface LogMetadata extends LogContext {
  timestamp: string;
  level: string;
  service: string;
  version: string;
  environment: string;
}

export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;
  private defaultContext: Partial<LogContext>;

  private constructor() {
    this.defaultContext = {
      service: appConfig.app.name,
      version: appConfig.app.version,
      environment: appConfig.app.environment,
    };
    
    this.winston = this.createWinstonLogger();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Create Winston logger instance
   */
  private createWinstonLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label']
      }),
      this.createCustomFormat()
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: appConfig.logging.level,
        format: appConfig.app.isDevelopment 
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : logFormat
      })
    ];

    // Add file transports for production
    if (appConfig.app.isProduction) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
        })
      );
    }

    return winston.createLogger({
      level: appConfig.logging.level,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Create custom log format
   */
  private createCustomFormat() {
    return winston.format.printf((info) => {
      const metadata: LogMetadata = {
        timestamp: info.timestamp,
        level: info.level,
        service: this.defaultContext.service!,
        version: this.defaultContext.version!,
        environment: this.defaultContext.environment!,
        ...info.metadata,
      };

      if (appConfig.app.isDevelopment) {
        return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message} ${
          Object.keys(metadata).length > 5 ? JSON.stringify(metadata, null, 2) : ''
        }`;
      }

      return JSON.stringify({
        message: info.message,
        ...metadata,
        stack: info.stack,
      });
    });
  }

  /**
   * Log error message
   */
  public error(message: string, context: LogContext = {}): void {
    this.winston.error(message, this.enrichContext(context));
  }

  /**
   * Log warning message
   */
  public warn(message: string, context: LogContext = {}): void {
    this.winston.warn(message, this.enrichContext(context));
  }

  /**
   * Log info message
   */
  public info(message: string, context: LogContext = {}): void {
    this.winston.info(message, this.enrichContext(context));
  }

  /**
   * Log debug message
   */
  public debug(message: string, context: LogContext = {}): void {
    this.winston.debug(message, this.enrichContext(context));
  }

  /**
   * Log HTTP request
   */
  public logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.winston.log(level, `${method} ${url} ${statusCode} - ${duration}ms`, 
      this.enrichContext({
        ...context,
        method,
        url,
        statusCode,
        duration,
        type: 'http_request',
      })
    );
  }

  /**
   * Log business event
   */
  public logBusinessEvent(
    event: string,
    data: Record<string, any>,
    context: LogContext = {}
  ): void {
    this.info(`Business Event: ${event}`, 
      this.enrichContext({
        ...context,
        event,
        data,
        type: 'business_event',
      })
    );
  }

  /**
   * Log security event
   */
  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: LogContext = {}
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.winston.log(level, `Security Event: ${event}`, 
      this.enrichContext({
        ...context,
        event,
        severity,
        type: 'security_event',
      })
    );
  }

  /**
   * Log performance metric
   */
  public logPerformance(
    operation: string,
    duration: number,
    context: LogContext = {}
  ): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, 
      this.enrichContext({
        ...context,
        operation,
        duration,
        type: 'performance',
      })
    );
  }

  /**
   * Log database query
   */
  public logDatabaseQuery(
    query: string,
    duration: number,
    rowCount?: number,
    context: LogContext = {}
  ): void {
    this.debug(`Database Query: ${query.substring(0, 100)}...`, 
      this.enrichContext({
        ...context,
        query: query.substring(0, 500), // Limit query length
        duration,
        rowCount,
        type: 'database_query',
      })
    );
  }

  /**
   * Log external API call
   */
  public logExternalApiCall(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.winston.log(level, `External API: ${service} ${method} ${url} ${statusCode} - ${duration}ms`, 
      this.enrichContext({
        ...context,
        service,
        method,
        url,
        statusCode,
        duration,
        type: 'external_api',
      })
    );
  }

  /**
   * Create child logger with persistent context
   */
  public child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }

  /**
   * Generate correlation ID
   */
  public generateCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Enrich context with default values
   */
  private enrichContext(context: LogContext): LogContext {
    return {
      ...this.defaultContext,
      correlationId: context.correlationId || this.generateCorrelationId(),
      ...context,
    };
  }

  /**
   * Set default context
   */
  public setDefaultContext(context: Partial<LogContext>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Get current log level
   */
  public getLevel(): string {
    return this.winston.level;
  }

  /**
   * Set log level
   */
  public setLevel(level: string): void {
    this.winston.level = level;
  }

  /**
   * Flush logs (useful for testing)
   */
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.on('finish', resolve);
      this.winston.end();
    });
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    Logger.instance = undefined as any;
  }
}

// Export singleton getter
export const getLogger = () => Logger.getInstance();

// Export convenience functions
export const logger = Logger.getInstance();
