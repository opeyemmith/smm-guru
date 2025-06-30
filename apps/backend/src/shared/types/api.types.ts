/**
 * Common API Types for SMM Guru Backend
 * Centralized type definitions for API requests and responses
 */

// Base API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  name: string;
  message: string;
  result: T | null;
  timestamp?: string;
  requestId?: string;
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    emailVerified: boolean;
  };
}

// Order Related Types
export interface OrderStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startCount?: number;
  remains?: number;
  updatedAt: Date;
}

export interface ServiceRequest {
  action: 'services' | 'add' | 'status' | 'balance';
  service?: number;
  link?: string;
  quantity?: number;
  order?: string;
}

// Provider API Types
export interface ProviderApiRequest {
  key: string;
  action: string;
  service?: number;
  link?: string;
  quantity?: number;
  order?: string;
}

export interface ProviderApiResponse {
  order?: string;
  status?: string;
  charge?: number;
  start_count?: number;
  remains?: number;
  currency?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Filter and Search Types
export interface FilterQuery {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  providerId?: string;
}

// Bulk Operation Types
export interface BulkOperation<T> {
  action: 'update' | 'delete' | 'activate' | 'deactivate';
  items: T[];
  options?: Record<string, any>;
}

// Analytics Types
export interface AnalyticsQuery {
  timeRange: '7d' | '30d' | '90d' | '1y';
  metrics: string[];
  groupBy?: 'day' | 'week' | 'month';
  filters?: FilterQuery;
}

export interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

// Webhook Types
export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

// File Upload Types
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    queue: 'up' | 'down';
    external: 'up' | 'down' | 'partial';
  };
  metrics?: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

// Export utility type for Hono context with authentication
export interface HonoAuthContext {
  user: AuthenticatedRequest['user'];
  'user-id': string;
}
