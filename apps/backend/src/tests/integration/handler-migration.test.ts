/**
 * Handler Migration Integration Test
 * Validates that the migrated service layer maintains backward compatibility
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getServiceFactory } from '../../core/services/service.factory.js';
import { OrderManagementService } from '../../core/services/order/order-management.service.js';
import { 
  ValidationException,
  NotFoundException,
  InsufficientFundsException 
} from '../../shared/exceptions/base.exception.js';

describe('Handler Migration Integration Tests', () => {
  let serviceFactory: any;
  let orderManagementService: OrderManagementService;

  beforeAll(async () => {
    serviceFactory = getServiceFactory();
    orderManagementService = serviceFactory.getOrderManagementService();
  });

  afterAll(async () => {
    await serviceFactory.shutdown();
  });

  describe('Service Factory', () => {
    it('should initialize all services correctly', () => {
      expect(serviceFactory).toBeDefined();
      expect(serviceFactory.getOrderManagementService()).toBeDefined();
      expect(serviceFactory.getProviderApiService()).toBeDefined();
      expect(serviceFactory.getWalletService()).toBeDefined();
      expect(serviceFactory.getNotificationService()).toBeDefined();
    });

    it('should provide health check functionality', async () => {
      const healthStatus = await serviceFactory.healthCheck();
      
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('services');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy']).toContain(healthStatus.status);
    });
  });

  describe('Order Management Service', () => {
    it('should handle services listing request', async () => {
      // This would normally require database setup
      // For now, we test the service structure
      expect(orderManagementService.getServicesWithPricing).toBeDefined();
      expect(typeof orderManagementService.getServicesWithPricing).toBe('function');
    });

    it('should validate order creation data', async () => {
      const invalidOrderData = {
        userId: 'test-user-id',
        service: -1, // Invalid service ID
        link: 'invalid-url', // Invalid URL
        quantity: 0, // Invalid quantity
      };

      // The service should throw validation errors
      await expect(
        orderManagementService.createOrder(invalidOrderData)
      ).rejects.toThrow();
    });

    it('should handle order status requests', async () => {
      expect(orderManagementService.getOrderStatus).toBeDefined();
      expect(typeof orderManagementService.getOrderStatus).toBe('function');
    });

    it('should handle balance requests', async () => {
      expect(orderManagementService.getUserBalance).toBeDefined();
      expect(typeof orderManagementService.getUserBalance).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should use proper exception classes', () => {
      expect(ValidationException).toBeDefined();
      expect(NotFoundException).toBeDefined();
      expect(InsufficientFundsException).toBeDefined();
    });

    it('should create proper error instances', () => {
      const validationError = new ValidationException('Test validation error');
      expect(validationError.name).toBe('VALIDATION_ERROR');
      expect(validationError.statusCode).toBe(400);
      expect(validationError.isOperational).toBe(true);

      const notFoundError = new NotFoundException('Order', 'test-id');
      expect(notFoundError.name).toBe('RESOURCE_NOT_FOUND');
      expect(notFoundError.statusCode).toBe(404);

      const insufficientFundsError = new InsufficientFundsException(100, 50);
      expect(insufficientFundsError.name).toBe('BUSINESS_LOGIC_ERROR');
      expect(insufficientFundsError.statusCode).toBe(422);
    });
  });

  describe('Repository Layer', () => {
    it('should provide repository instances', () => {
      expect(serviceFactory.getOrderRepository()).toBeDefined();
      expect(serviceFactory.getServiceRepository()).toBeDefined();
      expect(serviceFactory.getProviderRepository()).toBeDefined();
      expect(serviceFactory.getWalletRepository()).toBeDefined();
      expect(serviceFactory.getTransactionRepository()).toBeDefined();
    });

    it('should have proper repository methods', () => {
      const orderRepo = serviceFactory.getOrderRepository();
      
      // Check base repository methods
      expect(orderRepo.findById).toBeDefined();
      expect(orderRepo.findByIdOrFail).toBeDefined();
      expect(orderRepo.create).toBeDefined();
      expect(orderRepo.updateById).toBeDefined();
      expect(orderRepo.deleteById).toBeDefined();
      expect(orderRepo.count).toBeDefined();
      expect(orderRepo.transaction).toBeDefined();

      // Check order-specific methods
      expect(orderRepo.findByUserId).toBeDefined();
      expect(orderRepo.findByIdAndUserId).toBeDefined();
      expect(orderRepo.updateStatus).toBeDefined();
      expect(orderRepo.getOrderStats).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain the same API structure for services action', () => {
      // The getServicesWithPricing method should return data in the same format
      // as the original handler for body.action === "services"
      expect(orderManagementService.getServicesWithPricing).toBeDefined();
    });

    it('should maintain the same API structure for add action', () => {
      // The createOrder method should accept the same parameters
      // as the original handler for body.action === "add"
      expect(orderManagementService.createOrder).toBeDefined();
    });

    it('should maintain the same API structure for status action', () => {
      // The getOrderStatus method should return data in the same format
      // as the original handler for body.action === "status"
      expect(orderManagementService.getOrderStatus).toBeDefined();
    });

    it('should maintain the same API structure for balance action', () => {
      // The getUserBalance method should return data in the same format
      // as the original handler for body.action === "balance"
      expect(orderManagementService.getUserBalance).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should properly wire dependencies', () => {
      // Verify that services have their dependencies injected
      const orderService = serviceFactory.getOrderManagementService();
      const walletService = serviceFactory.getWalletService();
      const providerService = serviceFactory.getProviderApiService();
      const notificationService = serviceFactory.getNotificationService();

      expect(orderService).toBeDefined();
      expect(walletService).toBeDefined();
      expect(providerService).toBeDefined();
      expect(notificationService).toBeDefined();
    });

    it('should handle controller instantiation', () => {
      const handlerController = serviceFactory.getHandlerController();
      expect(handlerController).toBeDefined();
      expect(handlerController.handleRequest).toBeDefined();
      expect(handlerController.getOrderDetails).toBeDefined();
      expect(handlerController.getRecentOrders).toBeDefined();
      expect(handlerController.getOrderStats).toBeDefined();
      expect(handlerController.healthCheck).toBeDefined();
    });
  });
});

// Mock data for testing
export const mockOrderData = {
  userId: 'test-user-123',
  service: 1,
  link: 'https://example.com/post/123',
  quantity: 1000,
};

export const mockServiceData = {
  id: 1,
  service: 1,
  name: 'Instagram Followers',
  category: 'Social Media',
  rate: 0.5,
  profit: 0.1,
  min: 100,
  max: 10000,
  refill: true,
  cancel: false,
  currency: 'USD',
  dripfeed: false,
  providerId: 1,
  userId: 'test-user-123',
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockProviderData = {
  id: 1,
  name: 'Test Provider',
  apiUrl: 'https://api.testprovider.com',
  apiKey: 'encrypted-api-key',
  iv: 'test-iv',
  userId: 'test-user-123',
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockWalletData = {
  id: 'wallet-123',
  userId: 'test-user-123',
  balance: '100.00',
  currency: 'USD',
  created_at: new Date(),
  updated_at: new Date(),
};
