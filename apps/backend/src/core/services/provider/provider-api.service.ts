/**
 * Provider API Service
 * Handles external provider API interactions with proper error handling
 */

import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  ExternalServiceException, 
  ProviderApiException,
  BusinessLogicException 
} from '../../../shared/exceptions/base.exception.js';
import { appConfig } from '../../../config/app.config.js';

export interface ProviderApiRequest {
  key: string;
  action: 'add' | 'status' | 'services' | 'balance';
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
  error?: string;
  balance?: string;
  services?: any[];
}

export interface ProviderOrderStatus {
  orderId: string;
  status: string;
  startCount?: number;
  remains?: number;
  charge?: number;
}

export class ProviderApiService {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    this.timeout = appConfig.services.providers.timeout;
    this.maxRetries = appConfig.services.providers.retries;
    this.retryDelay = appConfig.services.providers.backoffDelay;
  }

  /**
   * Submit order to provider API
   */
  async submitOrder(
    apiUrl: string,
    orderData: ProviderApiRequest
  ): Promise<ProviderApiResponse> {
    try {
      const response = await this.makeApiRequest(apiUrl, {
        ...orderData,
        action: 'add',
      });

      // Validate response
      if (response.error) {
        throw new ProviderApiException('Provider', response.error);
      }

      if (!response.order) {
        throw new ProviderApiException('Provider', 'No order ID returned from provider');
      }

      return response;
    } catch (error) {
      if (error instanceof ProviderApiException) {
        throw error;
      }
      throw new ProviderApiException('Provider', `Order submission failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get order status from provider
   */
  async getOrderStatus(
    apiUrl: string,
    apiKey: string,
    providerOrderId: string
  ): Promise<ProviderOrderStatus> {
    try {
      const response = await this.makeApiRequest(apiUrl, {
        key: apiKey,
        action: 'status',
        order: providerOrderId,
      });

      if (response.error) {
        throw new ProviderApiException('Provider', response.error);
      }

      return {
        orderId: providerOrderId,
        status: response.status || 'unknown',
        startCount: response.start_count,
        remains: response.remains,
        charge: response.charge,
      };
    } catch (error) {
      if (error instanceof ProviderApiException) {
        throw error;
      }
      throw new ProviderApiException('Provider', `Status check failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get provider balance
   */
  async getProviderBalance(
    apiUrl: string,
    apiKey: string
  ): Promise<{ balance: number; currency: string }> {
    try {
      const response = await this.makeApiRequest(apiUrl, {
        key: apiKey,
        action: 'balance',
      });

      if (response.error) {
        throw new ProviderApiException('Provider', response.error);
      }

      return {
        balance: parseFloat(response.balance || '0'),
        currency: response.currency || 'USD',
      };
    } catch (error) {
      if (error instanceof ProviderApiException) {
        throw error;
      }
      throw new ProviderApiException('Provider', `Balance check failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get services from provider
   */
  async getProviderServices(
    apiUrl: string,
    apiKey: string
  ): Promise<any[]> {
    try {
      const response = await this.makeApiRequest(apiUrl, {
        key: apiKey,
        action: 'services',
      });

      if (response.error) {
        throw new ProviderApiException('Provider', response.error);
      }

      return response.services || [];
    } catch (error) {
      if (error instanceof ProviderApiException) {
        throw error;
      }
      throw new ProviderApiException('Provider', `Services fetch failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel order with provider
   */
  async cancelOrder(
    apiUrl: string,
    apiKey: string,
    providerOrderId: string
  ): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(apiUrl, {
        key: apiKey,
        action: 'cancel',
        order: providerOrderId,
      });

      if (response.error) {
        throw new ProviderApiException('Provider', response.error);
      }

      return true;
    } catch (error) {
      // Log error but don't throw - cancellation might not be supported
      console.warn(`Order cancellation failed for ${providerOrderId}:`, this.getErrorMessage(error));
      return false;
    }
  }

  /**
   * Test provider API connection
   */
  async testConnection(
    apiUrl: string,
    apiKey: string
  ): Promise<{
    isConnected: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.makeApiRequest(apiUrl, {
        key: apiKey,
        action: 'balance',
      }, 1); // Single retry for testing

      const responseTime = Date.now() - startTime;
      
      return {
        isConnected: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        isConnected: false,
        responseTime,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Bulk status check for multiple orders
   */
  async bulkStatusCheck(
    apiUrl: string,
    apiKey: string,
    providerOrderIds: string[]
  ): Promise<ProviderOrderStatus[]> {
    const results: ProviderOrderStatus[] = [];
    
    // Process in batches to avoid overwhelming the provider
    const batchSize = 10;
    for (let i = 0; i < providerOrderIds.length; i += batchSize) {
      const batch = providerOrderIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (orderId) => {
        try {
          return await this.getOrderStatus(apiUrl, apiKey, orderId);
        } catch (error) {
          // Return error status for failed checks
          return {
            orderId,
            status: 'error',
            error: this.getErrorMessage(error),
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < providerOrderIds.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  // Private helper methods

  /**
   * Make HTTP request to provider API with retry logic
   */
  private async makeApiRequest(
    apiUrl: string,
    data: ProviderApiRequest,
    maxRetries = this.maxRetries
  ): Promise<ProviderApiResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response: AxiosResponse<ProviderApiResponse> = await axios.post(
          apiUrl,
          data,
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SMM-Guru-API/1.0',
            },
            validateStatus: (status) => status < 500, // Don't throw on 4xx errors
          }
        );

        // Handle HTTP error status codes
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    throw new ExternalServiceException('Provider API', lastError!.message);
  }

  /**
   * Check if error is a client error (4xx)
   */
  private isClientError(error: any): boolean {
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return true;
    }
    return false;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.statusText) {
      return error.response.statusText;
    }
    return 'Unknown error occurred';
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate provider API response format
   */
  private validateResponse(response: any): boolean {
    return response && typeof response === 'object';
  }
}
