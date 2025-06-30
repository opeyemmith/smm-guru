/**
 * Notification Service
 * Handles email notifications, SMS, and in-app notifications
 */

import { OrderEntity } from '../../entities/order.entity.js';
import { BusinessLogicException } from '../../../shared/exceptions/base.exception.js';
import { appConfig } from '../../../config/app.config.js';

export interface NotificationTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateData?: Record<string, any>;
}

export interface SMSNotification {
  to: string;
  message: string;
  templateData?: Record<string, any>;
}

export interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export class NotificationService {
  private emailService: any; // Would be injected email service (Resend, SendGrid, etc.)
  private smsService: any; // Would be injected SMS service (Twilio, etc.)

  constructor(
    emailService?: any,
    smsService?: any
  ) {
    this.emailService = emailService;
    this.smsService = smsService;
  }

  /**
   * Send order created notification
   */
  async sendOrderCreatedNotification(
    userEmail: string,
    order: any
  ): Promise<void> {
    try {
      const template = this.getOrderCreatedTemplate(order);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send order created notification:', error);
      // Don't throw - notification failures shouldn't break order creation
    }
  }

  /**
   * Send order completed notification
   */
  async sendOrderCompletedNotification(order: OrderEntity): Promise<void> {
    try {
      // Would get user email from user service
      const userEmail = await this.getUserEmail(order.userId);
      
      const template = this.getOrderCompletedTemplate(order);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send order completed notification:', error);
    }
  }

  /**
   * Send order failed notification
   */
  async sendOrderFailedNotification(order: OrderEntity): Promise<void> {
    try {
      const userEmail = await this.getUserEmail(order.userId);
      
      const template = this.getOrderFailedTemplate(order);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send order failed notification:', error);
    }
  }

  /**
   * Send order cancelled notification
   */
  async sendOrderCancelledNotification(order: OrderEntity): Promise<void> {
    try {
      const userEmail = await this.getUserEmail(order.userId);
      
      const template = this.getOrderCancelledTemplate(order);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send order cancelled notification:', error);
    }
  }

  /**
   * Send wallet balance low notification
   */
  async sendLowBalanceNotification(
    userEmail: string,
    currentBalance: number,
    threshold: number
  ): Promise<void> {
    try {
      const template = this.getLowBalanceTemplate(currentBalance, threshold);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send low balance notification:', error);
    }
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(
    userEmail: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    try {
      const template = this.getPaymentConfirmationTemplate(amount, transactionId);
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkNotification(
    userEmails: string[],
    template: NotificationTemplate
  ): Promise<void> {
    const batchSize = 50; // Send in batches to avoid rate limits
    
    for (let i = 0; i < userEmails.length; i += batchSize) {
      const batch = userEmails.slice(i, i + batchSize);
      
      const promises = batch.map(email => 
        this.sendEmail({
          to: email,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
        }).catch(error => {
          console.error(`Failed to send notification to ${email}:`, error);
        })
      );

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < userEmails.length) {
        await this.delay(1000);
      }
    }
  }

  // Private helper methods

  /**
   * Send email notification
   */
  private async sendEmail(notification: EmailNotification): Promise<void> {
    if (!this.emailService) {
      console.warn('Email service not configured');
      return;
    }

    try {
      await this.emailService.send({
        from: appConfig.services.resend.fromEmail,
        to: notification.to,
        subject: notification.subject,
        html: notification.htmlContent,
        text: notification.textContent,
      });
    } catch (error) {
      throw new BusinessLogicException(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: SMSNotification): Promise<void> {
    if (!this.smsService) {
      console.warn('SMS service not configured');
      return;
    }

    try {
      await this.smsService.send({
        to: notification.to,
        body: notification.message,
      });
    } catch (error) {
      throw new BusinessLogicException(`SMS sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user email (would integrate with user service)
   */
  private async getUserEmail(userId: string): Promise<string> {
    // Placeholder - would integrate with user repository/service
    return 'user@example.com';
  }

  /**
   * Get order created email template
   */
  private getOrderCreatedTemplate(order: any): NotificationTemplate {
    return {
      subject: `Order Confirmation - #${order.id}`,
      htmlContent: `
        <h2>Order Confirmation</h2>
        <p>Your order has been successfully created and is being processed.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Service:</strong> ${order.serviceName}</p>
          <p><strong>Quantity:</strong> ${order.quantity?.toLocaleString()}</p>
          <p><strong>Amount:</strong> $${order.price?.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <p>You will receive updates as your order progresses.</p>
        <p>Thank you for choosing SMM Guru!</p>
      `,
      textContent: `
        Order Confirmation - #${order.id}
        
        Your order has been successfully created and is being processed.
        
        Order Details:
        Order ID: #${order.id}
        Service: ${order.serviceName}
        Quantity: ${order.quantity?.toLocaleString()}
        Amount: $${order.price?.toFixed(2)}
        Status: ${order.status}
        
        You will receive updates as your order progresses.
        Thank you for choosing SMM Guru!
      `,
    };
  }

  /**
   * Get order completed email template
   */
  private getOrderCompletedTemplate(order: OrderEntity): NotificationTemplate {
    return {
      subject: `Order Completed - #${order.id}`,
      htmlContent: `
        <h2>Order Completed Successfully!</h2>
        <p>Great news! Your order has been completed.</p>
        <div style="background: #e8f5e8; padding: 15px; margin: 15px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Quantity:</strong> ${order.quantity.toLocaleString()}</p>
          <p><strong>Amount:</strong> $${order.charge.toFixed(2)}</p>
          <p><strong>Completed:</strong> ${order.completedAt?.toLocaleDateString()}</p>
        </div>
        <p>Thank you for your business!</p>
      `,
      textContent: `
        Order Completed Successfully!
        
        Great news! Your order has been completed.
        
        Order Details:
        Order ID: #${order.id}
        Quantity: ${order.quantity.toLocaleString()}
        Amount: $${order.charge.toFixed(2)}
        Completed: ${order.completedAt?.toLocaleDateString()}
        
        Thank you for your business!
      `,
    };
  }

  /**
   * Get order failed email template
   */
  private getOrderFailedTemplate(order: OrderEntity): NotificationTemplate {
    return {
      subject: `Order Failed - #${order.id}`,
      htmlContent: `
        <h2>Order Processing Failed</h2>
        <p>We're sorry, but your order could not be completed.</p>
        <div style="background: #ffe8e8; padding: 15px; margin: 15px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Amount:</strong> $${order.charge.toFixed(2)}</p>
          <p><strong>Status:</strong> Failed</p>
        </div>
        <p>Your account has been refunded the full amount.</p>
        <p>Please contact support if you need assistance.</p>
      `,
      textContent: `
        Order Processing Failed
        
        We're sorry, but your order could not be completed.
        
        Order Details:
        Order ID: #${order.id}
        Amount: $${order.charge.toFixed(2)}
        Status: Failed
        
        Your account has been refunded the full amount.
        Please contact support if you need assistance.
      `,
    };
  }

  /**
   * Get order cancelled email template
   */
  private getOrderCancelledTemplate(order: OrderEntity): NotificationTemplate {
    return {
      subject: `Order Cancelled - #${order.id}`,
      htmlContent: `
        <h2>Order Cancelled</h2>
        <p>Your order has been cancelled as requested.</p>
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Amount:</strong> $${order.charge.toFixed(2)}</p>
          <p><strong>Cancelled:</strong> ${order.cancelledAt?.toLocaleDateString()}</p>
        </div>
        <p>Your account has been refunded the full amount.</p>
      `,
      textContent: `
        Order Cancelled
        
        Your order has been cancelled as requested.
        
        Order Details:
        Order ID: #${order.id}
        Amount: $${order.charge.toFixed(2)}
        Cancelled: ${order.cancelledAt?.toLocaleDateString()}
        
        Your account has been refunded the full amount.
      `,
    };
  }

  /**
   * Get low balance email template
   */
  private getLowBalanceTemplate(currentBalance: number, threshold: number): NotificationTemplate {
    return {
      subject: 'Low Wallet Balance Alert',
      htmlContent: `
        <h2>Low Wallet Balance Alert</h2>
        <p>Your wallet balance is running low.</p>
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0;">
          <p><strong>Current Balance:</strong> $${currentBalance.toFixed(2)}</p>
          <p><strong>Alert Threshold:</strong> $${threshold.toFixed(2)}</p>
        </div>
        <p>Please add funds to continue placing orders.</p>
      `,
      textContent: `
        Low Wallet Balance Alert
        
        Your wallet balance is running low.
        
        Current Balance: $${currentBalance.toFixed(2)}
        Alert Threshold: $${threshold.toFixed(2)}
        
        Please add funds to continue placing orders.
      `,
    };
  }

  /**
   * Get payment confirmation email template
   */
  private getPaymentConfirmationTemplate(amount: number, transactionId: string): NotificationTemplate {
    return {
      subject: 'Payment Confirmation',
      htmlContent: `
        <h2>Payment Confirmed</h2>
        <p>Your payment has been successfully processed.</p>
        <div style="background: #e8f5e8; padding: 15px; margin: 15px 0;">
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Thank you for your payment!</p>
      `,
      textContent: `
        Payment Confirmed
        
        Your payment has been successfully processed.
        
        Amount: $${amount.toFixed(2)}
        Transaction ID: ${transactionId}
        Date: ${new Date().toLocaleDateString()}
        
        Thank you for your payment!
      `,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
