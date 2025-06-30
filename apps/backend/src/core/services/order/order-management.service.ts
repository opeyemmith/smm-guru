/**
 * Order Management Service
 * Migrated business logic from handler.route.ts with enterprise patterns
 */

import { OrderRepository } from '../../repositories/order/order.repository.js';
import { ServiceRepository } from '../../repositories/service/service.repository.js';
import { ProviderRepository } from '../../repositories/provider/provider.repository.js';
import { WalletRepository, TransactionRepository } from '../../repositories/wallet/wallet.repository.js';
import { ProviderApiService } from '../provider/provider-api.service.js';
import {
  NotFoundException,
  BusinessLogicException,
  InsufficientFundsException,
  ServiceLimitException,
  OrderProcessingException,
} from '../../../shared/exceptions/base.exception.js';
// Note: These would be imported from actual utility packages
// import { decrypt } from '@smm-guru/utils';
// For now, we'll create a placeholder
const decrypt = (encryptedData: string, iv: string, key: string): string => {
  // Placeholder implementation - replace with actual decryption
  return encryptedData;
};

const AES_SECRET_KEY = process.env.AES_SECRET_KEY || 'default-secret-key';

export interface CreateOrderRequest {
  userId: string;
  service: number;
  link: string;
  quantity: number;
}

export interface OrderStatusRequest {
  userId: string;
  order: string;
}

export interface ServiceListResponse {
  service: number;
  cancel: boolean;
  category: string;
  currency: string;
  dripfeed: boolean;
  max: number;
  min: number;
  name: string;
  refill: boolean;
  rate: number;
}

export interface OrderResponse {
  order: string;
}

export interface OrderStatusResponse {
  charge: number;
  status: string;
  currency: string;
}

export interface BalanceResponse {
  balance: string;
  currency: string;
}

export class OrderManagementService {
  constructor(
    private orderRepository: OrderRepository,
    private serviceRepository: ServiceRepository,
    private providerRepository: ProviderRepository,
    private walletRepository: WalletRepository,
    private transactionRepository: TransactionRepository,
    private providerApiService: ProviderApiService
  ) {}

  /**
   * Get all services with calculated pricing
   * Migrated from: body.action === "services"
   */
  async getServicesWithPricing(): Promise<ServiceListResponse[]> {
    try {
      const services = await this.serviceRepository.findAllWithCalculatedPricing();
      
      return services.map(service => ({
        service: service.id,
        cancel: service.cancel,
        category: service.category,
        currency: service.currency,
        dripfeed: service.dripfeed,
        max: service.max,
        min: service.min,
        name: service.name,
        refill: service.refill,
        rate: service.calculatedRate, // rate + profit
      }));
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve services');
    }
  }

  /**
   * Create a new order with full validation and processing
   * Migrated from: body.action === "add"
   */
  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    return await this.orderRepository.transaction(async (tx) => {
      try {
        // 1. Validate and get service details
        const serviceDetails = await this.serviceRepository.findByIdAndUserId(
          request.service,
          request.userId,
          { transaction: tx }
        );

        if (!serviceDetails) {
          throw new NotFoundException('Service', request.service.toString());
        }

        // 2. Get provider details
        const providerDetails = await this.providerRepository.findByIdAndUserId(
          serviceDetails.providerId,
          request.userId,
          { transaction: tx }
        );

        if (!providerDetails) {
          throw new NotFoundException('Provider', serviceDetails.providerId.toString());
        }

        // 3. Decrypt provider API key
        const decryptedApiKey = decrypt(
          providerDetails.apiKey,
          providerDetails.iv,
          AES_SECRET_KEY
        );

        // 4. Get detailed service info for pricing
        const serviceInfo = await this.serviceRepository.findById(
          request.service,
          { transaction: tx }
        );

        if (!serviceInfo) {
          throw new NotFoundException('Service', request.service.toString());
        }

        // 5. Calculate order cost
        const calcPrice = ((serviceInfo.rate + (serviceInfo.profit || 0)) / 1000) * request.quantity;

        // 6. Validate user wallet and balance
        const userWallet = await this.walletRepository.findByUserIdOrFail(
          request.userId,
          { transaction: tx }
        );

        if (Number(userWallet.balance) < calcPrice) {
          throw new InsufficientFundsException(calcPrice, Number(userWallet.balance));
        }

        // 7. Prepare provider API payload
        const orderPayload = {
          key: decryptedApiKey,
          action: "add",
          service: serviceInfo.service,
          link: request.link,
          quantity: request.quantity,
        };

        // 8. Submit order to provider
        const providerResponse = await this.providerApiService.submitOrder(
          providerDetails.apiUrl,
          orderPayload
        );

        if (providerResponse.error) {
          throw new OrderProcessingException(
            'temp-order',
            `Provider error: ${providerResponse.error}`
          );
        }

        // 9. Deduct funds from wallet
        await this.walletRepository.deductFunds(
          request.userId,
          calcPrice,
          { transaction: tx }
        );

        // 10. Create transaction record
        await this.transactionRepository.createTransaction({
          userId: request.userId,
          amount: calcPrice,
          type: "debit",
          status: "completed",
          reference: `ORDER-${providerResponse.order}`,
          fromWalletId: userWallet.id,
          description: `Order for ${serviceInfo.name}`,
        }, { transaction: tx });

        // 11. Create order record
        const orderData = {
          link: request.link,
          service: request.service,
          userId: request.userId,
          price: calcPrice,
          refill: serviceInfo.refill,
          providerOrderId: Number(providerResponse.order),
          serviceName: serviceInfo.name,
          status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        };

        const [createdOrder] = await this.orderRepository.createMany([orderData], { transaction: tx });

        return {
          order: createdOrder.id,
        };

      } catch (error) {
        // Re-throw known exceptions
        if (error instanceof NotFoundException || 
            error instanceof InsufficientFundsException || 
            error instanceof OrderProcessingException) {
          throw error;
        }

        // Handle unknown errors
        throw new OrderProcessingException(
          'temp-order',
          `Order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  /**
   * Get order status by ID
   * Migrated from: body.action === "status"
   */
  async getOrderStatus(request: OrderStatusRequest): Promise<OrderStatusResponse> {
    try {
      const order = await this.orderRepository.findByIdAndUserId(
        request.order,
        request.userId
      );

      if (!order) {
        throw new NotFoundException('Order', request.order);
      }

      return {
        charge: order.price,
        status: order.status,
        currency: order.currency || 'USD',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BusinessLogicException('Failed to retrieve order status');
    }
  }

  /**
   * Get user wallet balance
   * Migrated from: body.action === "balance"
   */
  async getUserBalance(userId: string): Promise<BalanceResponse> {
    try {
      const walletBalance = await this.walletRepository.getWalletBalance(userId);

      return {
        balance: walletBalance.balance.toString(),
        currency: walletBalance.currency,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BusinessLogicException('Failed to retrieve wallet balance');
    }
  }

  /**
   * Validate order request data
   */
  private validateOrderRequest(request: CreateOrderRequest): void {
    if (!request.service || request.service <= 0) {
      throw new BusinessLogicException('Invalid service ID');
    }

    if (!request.link || !this.isValidUrl(request.link)) {
      throw new BusinessLogicException('Invalid or missing link URL');
    }

    if (!request.quantity || request.quantity <= 0) {
      throw new BusinessLogicException('Quantity must be greater than 0');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get order details with service and provider info
   */
  async getOrderDetails(orderId: string, userId: string): Promise<any> {
    try {
      const order = await this.orderRepository.findByIdAndUserIdOrFail(orderId, userId);
      
      // Get service details
      const service = await this.serviceRepository.findById(order.service);
      
      // Get provider details (without sensitive data)
      const provider = service ? await this.providerRepository.findById(service.providerId) : null;

      return {
        ...order,
        service: service ? {
          id: service.id,
          name: service.name,
          category: service.category,
          min: service.min,
          max: service.max,
        } : null,
        provider: provider ? {
          id: provider.id,
          name: provider.name,
        } : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BusinessLogicException('Failed to retrieve order details');
    }
  }

  /**
   * Get user's recent orders
   */
  async getUserRecentOrders(userId: string, limit = 10): Promise<any[]> {
    try {
      return await this.orderRepository.getRecentOrdersByUserId(userId, limit);
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve recent orders');
    }
  }

  /**
   * Get order statistics for user
   */
  async getUserOrderStats(userId: string): Promise<any> {
    try {
      return await this.orderRepository.getOrderStats({ userId });
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve order statistics');
    }
  }
}
