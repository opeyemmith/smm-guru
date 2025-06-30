/**
 * Service Factory
 * Dependency injection container for service layer
 */

import { OrderRepository } from '../repositories/order/order.repository.js';
import { ServiceRepository } from '../repositories/service/service.repository.js';
import { ProviderRepository } from '../repositories/provider/provider.repository.js';
import { WalletRepository, TransactionRepository } from '../repositories/wallet/wallet.repository.js';

import { OrderManagementService } from './order/order-management.service.js';
import { ProviderApiService } from './provider/provider-api.service.js';
import { WalletService } from './payment/wallet.service.js';
import { NotificationService } from './notification/notification.service.js';

import { HandlerController } from '../../api/v1/handler/handler.controller.js';
import { AuthService } from './auth/auth.service.js';
import { UserRepository } from '../repositories/user/user.repository.js';
import { getInfrastructureManager } from '../../infrastructure/index.js';
import { getLogger } from '../../infrastructure/monitoring/logger.js';

/**
 * Service Factory Class
 * Manages service instantiation and dependency injection
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  // Repository instances
  private orderRepository!: OrderRepository;
  private serviceRepository!: ServiceRepository;
  private providerRepository!: ProviderRepository;
  private walletRepository!: WalletRepository;
  private transactionRepository!: TransactionRepository;
  private userRepository!: UserRepository;

  // Service instances
  private orderManagementService!: OrderManagementService;
  private providerApiService!: ProviderApiService;
  private walletService!: WalletService;
  private notificationService!: NotificationService;
  private authService!: AuthService;

  // Controller instances
  private handlerController!: HandlerController;

  private constructor() {
    const logger = getLogger();
    logger.info('Initializing Service Factory...');

    this.initializeRepositories();
    this.initializeServices();
    this.initializeControllers();

    logger.info('Service Factory initialized successfully');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Initialize repository instances
   */
  private initializeRepositories(): void {
    this.orderRepository = new OrderRepository();
    this.serviceRepository = new ServiceRepository();
    this.providerRepository = new ProviderRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Initialize service instances with proper dependency injection
   */
  private initializeServices(): void {
    // Initialize authentication service
    this.authService = new AuthService(this.userRepository);

    // Initialize provider API service (no dependencies)
    this.providerApiService = new ProviderApiService();

    // Initialize wallet service
    this.walletService = new WalletService(
      this.walletRepository,
      this.transactionRepository
    );

    // Initialize notification service
    this.notificationService = new NotificationService();

    // Initialize order management service with all dependencies
    this.orderManagementService = new OrderManagementService(
      this.orderRepository,
      this.serviceRepository,
      this.providerRepository,
      this.walletRepository,
      this.transactionRepository,
      this.providerApiService
    );
  }

  /**
   * Initialize controller instances
   */
  private initializeControllers(): void {
    this.handlerController = new HandlerController(
      this.orderManagementService
    );
  }

  // Repository getters
  public getOrderRepository(): OrderRepository {
    return this.orderRepository;
  }

  public getServiceRepository(): ServiceRepository {
    return this.serviceRepository;
  }

  public getProviderRepository(): ProviderRepository {
    return this.providerRepository;
  }

  public getWalletRepository(): WalletRepository {
    return this.walletRepository;
  }

  public getTransactionRepository(): TransactionRepository {
    return this.transactionRepository;
  }

  public getUserRepository(): UserRepository {
    return this.userRepository;
  }

  // Service getters
  public getOrderManagementService(): OrderManagementService {
    return this.orderManagementService;
  }

  public getProviderApiService(): ProviderApiService {
    return this.providerApiService;
  }

  public getWalletService(): WalletService {
    return this.walletService;
  }

  public getNotificationService(): NotificationService {
    return this.notificationService;
  }

  public getAuthService(): AuthService {
    return this.authService;
  }

  // Controller getters
  public getHandlerController(): HandlerController {
    return this.handlerController;
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: Record<string, 'up' | 'down'>;
    timestamp: string;
  }> {
    const logger = getLogger();
    const services: Record<string, 'up' | 'down'> = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    // Check infrastructure first
    try {
      const infraManager = getInfrastructureManager();
      const infraStatus = await infraManager.getStatus();

      if (infraStatus.database !== 'connected') {
        overallStatus = 'unhealthy';
      }
    } catch (error) {
      logger.error('Infrastructure health check failed', { error });
      overallStatus = 'unhealthy';
    }

    // Test repository connections
    const repositories = [
      { name: 'orderRepository', repo: this.orderRepository },
      { name: 'serviceRepository', repo: this.serviceRepository },
      { name: 'providerRepository', repo: this.providerRepository },
      { name: 'walletRepository', repo: this.walletRepository },
      { name: 'transactionRepository', repo: this.transactionRepository },
      { name: 'userRepository', repo: this.userRepository },
    ];

    for (const { name, repo } of repositories) {
      try {
        await repo.count();
        services[name] = 'up';
      } catch (error) {
        logger.warn(`Repository health check failed: ${name}`, { error });
        services[name] = 'down';
        overallStatus = 'unhealthy';
      }
    }

    // Test service layer (basic instantiation check)
    const serviceChecks = [
      { name: 'orderManagementService', service: this.orderManagementService },
      { name: 'walletService', service: this.walletService },
      { name: 'providerApiService', service: this.providerApiService },
      { name: 'notificationService', service: this.notificationService },
      { name: 'authService', service: this.authService },
    ];

    for (const { name, service } of serviceChecks) {
      try {
        if (service) {
          services[name] = 'up';
        } else {
          services[name] = 'down';
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        logger.warn(`Service health check failed: ${name}`, { error });
        services[name] = 'down';
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Graceful shutdown - cleanup resources
   */
  public async shutdown(): Promise<void> {
    try {
      // Close database connections if needed
      // await this.orderRepository.close();
      
      // Stop background services if any
      // await this.notificationService.stop();
      
      console.log('✅ Service factory shutdown completed');
    } catch (error) {
      console.error('❌ Error during service factory shutdown:', error);
      throw error;
    }
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static reset(): void {
    ServiceFactory.instance = undefined as any;
  }
}

// Export singleton instance getter
export const getServiceFactory = () => ServiceFactory.getInstance();
