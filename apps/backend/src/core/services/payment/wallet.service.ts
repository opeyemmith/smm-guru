/**
 * Wallet Service
 * Handles wallet operations, balance management, and transaction processing
 */

import { WalletRepository, TransactionRepository } from '../../repositories/wallet/wallet.repository.js';
import {
  NotFoundException,
  BusinessLogicException,
  InsufficientFundsException,
} from '../../../shared/exceptions/base.exception.js';
import type { RepositoryOptions } from '../../repositories/base/base.repository.js';

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export interface TransactionData {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reference: string;
  description?: string;
  fromWalletId?: string;
  toWalletId?: string;
  metadata?: Record<string, any>;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletStats {
  currentBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  lastTransactionDate?: Date;
}

export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private transactionRepository: TransactionRepository
  ) {}

  /**
   * Get user wallet balance
   */
  async getUserBalance(userId: string, options?: RepositoryOptions): Promise<number> {
    try {
      return await this.walletRepository.getUserBalance(userId, options);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Create wallet if it doesn't exist
        await this.createWalletForUser(userId, 0, 'USD', options);
        return 0;
      }
      throw new BusinessLogicException('Failed to retrieve wallet balance');
    }
  }

  /**
   * Get detailed wallet balance information
   */
  async getWalletBalance(userId: string, options?: RepositoryOptions): Promise<WalletBalance> {
    try {
      return await this.walletRepository.getWalletBalance(userId, options);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Create wallet if it doesn't exist
        await this.createWalletForUser(userId, 0, 'USD', options);
        return {
          balance: 0,
          currency: 'USD',
          lastUpdated: new Date(),
        };
      }
      throw new BusinessLogicException('Failed to retrieve wallet information');
    }
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(
    userId: string,
    requiredAmount: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    try {
      return await this.walletRepository.hasSufficientBalance(userId, requiredAmount, options);
    } catch (error) {
      return false; // Assume insufficient balance on error
    }
  }

  /**
   * Validate user balance for order
   */
  async validateBalance(
    userId: string,
    requiredAmount: number,
    options?: RepositoryOptions
  ): Promise<void> {
    const currentBalance = await this.getUserBalance(userId, options);
    
    if (currentBalance < requiredAmount) {
      throw new InsufficientFundsException(requiredAmount, currentBalance);
    }
  }

  /**
   * Add funds to user wallet
   */
  async addFunds(
    userId: string,
    amount: number,
    reference: string,
    description?: string,
    options?: RepositoryOptions
  ): Promise<WalletBalance> {
    if (amount <= 0) {
      throw new BusinessLogicException('Amount must be greater than 0');
    }

    return await this.walletRepository.transaction(async (tx) => {
      try {
        // Update wallet balance
        await this.walletRepository.addFunds(userId, amount, { transaction: tx });

        // Create transaction record
        await this.transactionRepository.createTransaction({
          userId,
          amount,
          type: 'credit',
          status: 'completed',
          reference,
          description: description || `Funds added: ${reference}`,
        }, { transaction: tx });

        // Return updated balance
        return await this.walletRepository.getWalletBalance(userId, { transaction: tx });
      } catch (error) {
        throw new BusinessLogicException(`Failed to add funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Deduct funds from user wallet
   */
  async deductFunds(
    userId: string,
    amount: number,
    reference: string,
    description?: string,
    options?: RepositoryOptions
  ): Promise<WalletBalance> {
    if (amount <= 0) {
      throw new BusinessLogicException('Amount must be greater than 0');
    }

    return await this.walletRepository.transaction(async (tx) => {
      try {
        // Validate sufficient balance
        await this.validateBalance(userId, amount, { transaction: tx });

        // Deduct from wallet
        await this.walletRepository.deductFunds(userId, amount, { transaction: tx });

        // Create transaction record
        await this.transactionRepository.createTransaction({
          userId,
          amount,
          type: 'debit',
          status: 'completed',
          reference,
          description: description || `Funds deducted: ${reference}`,
        }, { transaction: tx });

        // Return updated balance
        return await this.walletRepository.getWalletBalance(userId, { transaction: tx });
      } catch (error) {
        if (error instanceof InsufficientFundsException) {
          throw error;
        }
        throw new BusinessLogicException(`Failed to deduct funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Transfer funds between users
   */
  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number,
    reference: string,
    description?: string,
    options?: RepositoryOptions
  ): Promise<{
    fromBalance: WalletBalance;
    toBalance: WalletBalance;
  }> {
    if (amount <= 0) {
      throw new BusinessLogicException('Transfer amount must be greater than 0');
    }

    if (fromUserId === toUserId) {
      throw new BusinessLogicException('Cannot transfer funds to the same user');
    }

    return await this.walletRepository.transaction(async (tx) => {
      try {
        // Validate sender has sufficient balance
        await this.validateBalance(fromUserId, amount, { transaction: tx });

        // Get wallet IDs for transaction records
        const fromWallet = await this.walletRepository.findByUserIdOrFail(fromUserId, { transaction: tx });
        const toWallet = await this.walletRepository.findByUserIdOrFail(toUserId, { transaction: tx });

        // Deduct from sender
        await this.walletRepository.deductFunds(fromUserId, amount, { transaction: tx });

        // Add to recipient
        await this.walletRepository.addFunds(toUserId, amount, { transaction: tx });

        // Create transaction records
        const transferDescription = description || `Transfer: ${reference}`;
        
        await this.transactionRepository.createTransaction({
          userId: fromUserId,
          amount,
          type: 'debit',
          status: 'completed',
          reference,
          description: `${transferDescription} (sent)`,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
        }, { transaction: tx });

        await this.transactionRepository.createTransaction({
          userId: toUserId,
          amount,
          type: 'credit',
          status: 'completed',
          reference,
          description: `${transferDescription} (received)`,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
        }, { transaction: tx });

        // Return updated balances
        const fromBalance = await this.walletRepository.getWalletBalance(fromUserId, { transaction: tx });
        const toBalance = await this.walletRepository.getWalletBalance(toUserId, { transaction: tx });

        return { fromBalance, toBalance };
      } catch (error) {
        if (error instanceof InsufficientFundsException || error instanceof NotFoundException) {
          throw error;
        }
        throw new BusinessLogicException(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Create wallet for new user
   */
  async createWalletForUser(
    userId: string,
    initialBalance = 0,
    currency = 'USD',
    options?: RepositoryOptions
  ): Promise<WalletBalance> {
    try {
      const wallet = await this.walletRepository.createWalletForUser(
        userId,
        initialBalance,
        currency,
        options
      );

      // Create initial transaction if there's a starting balance
      if (initialBalance > 0) {
        await this.transactionRepository.createTransaction({
          userId,
          amount: initialBalance,
          type: 'credit',
          status: 'completed',
          reference: 'INITIAL_BALANCE',
          description: 'Initial wallet balance',
        }, options);
      }

      return {
        balance: Number(wallet.balance),
        currency: wallet.currency || 'USD',
        lastUpdated: wallet.created_at,
      };
    } catch (error) {
      throw new BusinessLogicException(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit = 50,
    offset = 0,
    options?: RepositoryOptions
  ): Promise<WalletTransaction[]> {
    try {
      const transactions = await this.transactionRepository.findByUserId(
        userId,
        { limit, offset },
        options
      );

      return transactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type as 'credit' | 'debit',
        status: tx.status as 'pending' | 'completed' | 'failed',
        reference: tx.reference,
        description: tx.description,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
      }));
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve transaction history');
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string, options?: RepositoryOptions): Promise<WalletStats> {
    try {
      const stats = await this.walletRepository.getWalletStats(userId, options);
      const recentTransactions = await this.transactionRepository.getRecentTransactions(userId, 1, options);

      return {
        currentBalance: stats.currentBalance,
        totalCredits: stats.totalCredits,
        totalDebits: stats.totalDebits,
        transactionCount: stats.transactionCount,
        lastTransactionDate: recentTransactions[0]?.created_at,
      };
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve wallet statistics');
    }
  }

  /**
   * Get transaction summary for a date range
   */
  async getTransactionSummary(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
    options?: RepositoryOptions
  ): Promise<{
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
  }> {
    try {
      return await this.transactionRepository.getTransactionSummary(
        userId,
        dateFrom,
        dateTo,
        options
      );
    } catch (error) {
      throw new BusinessLogicException('Failed to retrieve transaction summary');
    }
  }
}
