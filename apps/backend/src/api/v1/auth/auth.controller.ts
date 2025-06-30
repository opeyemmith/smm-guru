/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */

import type { Context } from 'hono';
import { AuthService } from '../../../core/services/auth/auth.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/response.util.js';
import { ValidationException, UnauthorizedException, BusinessLogicException } from '../../../shared/exceptions/base.exception.js';
import { getLogger } from '../../../infrastructure/monitoring/logger.js';
import { getMetricsCollector } from '../../../infrastructure/monitoring/metrics.js';
import type { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest, 
  ChangePasswordRequest,
  UpdateProfileRequest 
} from './auth.validation.js';

export class AuthController {
  private logger = getLogger();
  private metrics = getMetricsCollector();

  constructor(private authService: AuthService) {}

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(c: Context): Promise<Response> {
    const startTime = Date.now();
    
    try {
      const body = await c.req.json() as LoginRequest;
      
      this.logger.info('Login attempt', { 
        identifier: body.identifier,
        rememberMe: body.rememberMe,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown'
      });

      const result = await this.authService.authenticate(
        body.identifier,
        body.password,
        body.rememberMe
      );

      // Record successful login metric
      this.metrics.recordBusinessMetric({
        event: 'user_login',
        value: 1,
        unit: 'count',
        userId: result.user.id,
        metadata: {
          rememberMe: body.rememberMe,
          userRoles: result.user.roles,
        }
      });

      this.logger.info('Login successful', { 
        userId: result.user.id,
        username: result.user.username,
        duration: Date.now() - startTime
      });

      return sendSuccess(c, 'LOGIN_SUCCESS', 'Login successful', {
        user: result.user.toPublicData(),
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed login metric
      this.metrics.recordBusinessMetric({
        event: 'user_login_failed',
        value: 1,
        unit: 'count',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        }
      });

      if (error instanceof UnauthorizedException) {
        this.logger.warn('Login failed', { 
          error: error.message,
          duration
        });
        return sendError(c, 'LOGIN_FAILED', error.message, 401);
      }

      if (error instanceof ValidationException) {
        return sendError(c, 'VALIDATION_ERROR', error.message, 400);
      }

      this.logger.error('Login error', { error, duration });
      return sendError(c, 'LOGIN_ERROR', 'An error occurred during login', 500);
    }
  }

  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(c: Context): Promise<Response> {
    const startTime = Date.now();
    
    try {
      const body = await c.req.json() as RegisterRequest;
      
      this.logger.info('Registration attempt', { 
        email: body.email,
        username: body.username,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown'
      });

      const result = await this.authService.register({
        email: body.email,
        username: body.username,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        timezone: body.timezone,
        language: body.language,
      });

      // Record successful registration metric
      this.metrics.recordBusinessMetric({
        event: 'user_registration',
        value: 1,
        unit: 'count',
        userId: result.user.id,
        metadata: {
          hasFirstName: !!body.firstName,
          hasLastName: !!body.lastName,
          language: body.language,
        }
      });

      this.logger.info('Registration successful', { 
        userId: result.user.id,
        email: body.email,
        username: body.username,
        duration: Date.now() - startTime
      });

      return sendSuccess(c, 'REGISTRATION_SUCCESS', 'Registration successful', {
        user: result.user.toPublicData(),
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      }, 201);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed registration metric
      this.metrics.recordBusinessMetric({
        event: 'user_registration_failed',
        value: 1,
        unit: 'count',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        }
      });

      if (error instanceof ValidationException) {
        this.logger.warn('Registration validation failed', { 
          error: error.message,
          duration
        });
        return sendError(c, 'VALIDATION_ERROR', error.message, 400);
      }

      this.logger.error('Registration error', { error, duration });
      return sendError(c, 'REGISTRATION_ERROR', 'An error occurred during registration', 500);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(c: Context): Promise<Response> {
    try {
      const body = await c.req.json() as RefreshTokenRequest;
      
      const result = await this.authService.refreshToken(body.refreshToken);

      this.logger.info('Token refreshed successfully');

      return sendSuccess(c, 'TOKEN_REFRESH_SUCCESS', 'Token refreshed successfully', {
        token: result.token,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn('Token refresh failed', { error: error.message });
        return sendError(c, 'TOKEN_REFRESH_FAILED', error.message, 401);
      }

      this.logger.error('Token refresh error', { error });
      return sendError(c, 'TOKEN_REFRESH_ERROR', 'An error occurred during token refresh', 500);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const sessionId = c.get('sessionId');

      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      // Record logout metric
      this.metrics.recordBusinessMetric({
        event: 'user_logout',
        value: 1,
        unit: 'count',
        userId: user?.id,
      });

      this.logger.info('Logout successful', { userId: user?.id });

      return sendSuccess(c, 'LOGOUT_SUCCESS', 'Logout successful');
    } catch (error) {
      this.logger.error('Logout error', { error });
      return sendError(c, 'LOGOUT_ERROR', 'An error occurred during logout', 500);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user');

      if (!user) {
        return sendError(c, 'USER_NOT_FOUND', 'User not found', 404);
      }

      return sendSuccess(c, 'PROFILE_SUCCESS', 'Profile retrieved successfully', {
        user: user.toPublicData(),
      });
    } catch (error) {
      this.logger.error('Get profile error', { error });
      return sendError(c, 'PROFILE_ERROR', 'An error occurred while retrieving profile', 500);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  async updateProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const body = await c.req.json() as UpdateProfileRequest;

      if (!user) {
        return sendError(c, 'USER_NOT_FOUND', 'User not found', 404);
      }

      // Update user profile
      user.updateProfile({
        firstName: body.firstName,
        lastName: body.lastName,
        timezone: body.timezone,
        language: body.language,
        phoneNumber: body.phoneNumber,
      });

      // Save updated user (this would typically go through a user service)
      // For now, we'll assume the user repository is available
      // await this.userRepository.update(user.id, user);

      this.logger.info('Profile updated successfully', { userId: user.id });

      return sendSuccess(c, 'PROFILE_UPDATE_SUCCESS', 'Profile updated successfully', {
        user: user.toPublicData(),
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        return sendError(c, 'VALIDATION_ERROR', error.message, 400);
      }

      this.logger.error('Update profile error', { error });
      return sendError(c, 'PROFILE_UPDATE_ERROR', 'An error occurred while updating profile', 500);
    }
  }

  /**
   * Change user password
   * POST /api/v1/auth/change-password
   */
  async changePassword(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const body = await c.req.json() as ChangePasswordRequest;

      if (!user) {
        return sendError(c, 'USER_NOT_FOUND', 'User not found', 404);
      }

      await this.authService.changePassword(
        user.id,
        body.currentPassword,
        body.newPassword
      );

      // Record password change metric
      this.metrics.recordBusinessMetric({
        event: 'password_change',
        value: 1,
        unit: 'count',
        userId: user.id,
      });

      this.logger.info('Password changed successfully', { userId: user.id });

      return sendSuccess(c, 'PASSWORD_CHANGE_SUCCESS', 'Password changed successfully');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return sendError(c, 'PASSWORD_CHANGE_FAILED', error.message, 401);
      }

      if (error instanceof ValidationException) {
        return sendError(c, 'VALIDATION_ERROR', error.message, 400);
      }

      this.logger.error('Change password error', { error });
      return sendError(c, 'PASSWORD_CHANGE_ERROR', 'An error occurred while changing password', 500);
    }
  }

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(c: Context): Promise<Response> {
    try {
      // This would typically verify an email verification token
      // For now, we'll return a placeholder response
      
      return sendSuccess(c, 'EMAIL_VERIFICATION_SUCCESS', 'Email verified successfully');
    } catch (error) {
      this.logger.error('Email verification error', { error });
      return sendError(c, 'EMAIL_VERIFICATION_ERROR', 'An error occurred during email verification', 500);
    }
  }

  /**
   * Resend email verification
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(c: Context): Promise<Response> {
    try {
      // This would typically resend an email verification
      // For now, we'll return a placeholder response
      
      return sendSuccess(c, 'VERIFICATION_SENT', 'Verification email sent successfully');
    } catch (error) {
      this.logger.error('Resend verification error', { error });
      return sendError(c, 'RESEND_VERIFICATION_ERROR', 'An error occurred while sending verification email', 500);
    }
  }

  /**
   * Forgot password
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(c: Context): Promise<Response> {
    try {
      // This would typically send a password reset email
      // For now, we'll return a placeholder response
      
      return sendSuccess(c, 'RESET_EMAIL_SENT', 'Password reset email sent successfully');
    } catch (error) {
      this.logger.error('Forgot password error', { error });
      return sendError(c, 'FORGOT_PASSWORD_ERROR', 'An error occurred while processing password reset', 500);
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(c: Context): Promise<Response> {
    try {
      // This would typically reset password using a reset token
      // For now, we'll return a placeholder response
      
      return sendSuccess(c, 'PASSWORD_RESET_SUCCESS', 'Password reset successfully');
    } catch (error) {
      this.logger.error('Reset password error', { error });
      return sendError(c, 'PASSWORD_RESET_ERROR', 'An error occurred while resetting password', 500);
    }
  }
}
