/**
 * Authentication Routes
 * Route configuration for authentication endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthController } from './auth.controller.js';
import { AuthService } from '../../../core/services/auth/auth.service.js';
import { UserRepository } from '../../../core/repositories/user/user.repository.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from './auth.validation.js';

export function createAuthRoutes() {
  const auth = new Hono();
  
  // Initialize dependencies
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  // Rate limiting for authentication endpoints
  const authRateLimit = rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
  });

  const generalRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests, please try again later',
  });

  /**
   * @route   POST /auth/login
   * @desc    Authenticate user with email/username and password
   * @access  Public
   */
  auth.post(
    '/login',
    authRateLimit,
    zValidator('json', loginSchema),
    async (c) => authController.login(c)
  );

  /**
   * @route   POST /auth/register
   * @desc    Register new user account
   * @access  Public
   */
  auth.post(
    '/register',
    authRateLimit,
    zValidator('json', registerSchema),
    async (c) => authController.register(c)
  );

  /**
   * @route   POST /auth/refresh
   * @desc    Refresh access token using refresh token
   * @access  Public
   */
  auth.post(
    '/refresh',
    generalRateLimit,
    zValidator('json', refreshTokenSchema),
    async (c) => authController.refreshToken(c)
  );

  /**
   * @route   POST /auth/logout
   * @desc    Logout user and invalidate session
   * @access  Private
   */
  auth.post(
    '/logout',
    authMiddleware,
    async (c) => authController.logout(c)
  );

  /**
   * @route   GET /auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  auth.get(
    '/me',
    authMiddleware,
    async (c) => authController.getProfile(c)
  );

  /**
   * @route   PUT /auth/profile
   * @desc    Update user profile information
   * @access  Private
   */
  auth.put(
    '/profile',
    authMiddleware,
    generalRateLimit,
    zValidator('json', updateProfileSchema),
    async (c) => authController.updateProfile(c)
  );

  /**
   * @route   POST /auth/change-password
   * @desc    Change user password
   * @access  Private
   */
  auth.post(
    '/change-password',
    authMiddleware,
    authRateLimit,
    zValidator('json', changePasswordSchema),
    async (c) => authController.changePassword(c)
  );

  /**
   * @route   POST /auth/forgot-password
   * @desc    Request password reset email
   * @access  Public
   */
  auth.post(
    '/forgot-password',
    authRateLimit,
    zValidator('json', forgotPasswordSchema),
    async (c) => authController.forgotPassword(c)
  );

  /**
   * @route   POST /auth/reset-password
   * @desc    Reset password using reset token
   * @access  Public
   */
  auth.post(
    '/reset-password',
    authRateLimit,
    zValidator('json', resetPasswordSchema),
    async (c) => authController.resetPassword(c)
  );

  /**
   * @route   POST /auth/verify-email
   * @desc    Verify email address using verification token
   * @access  Public
   */
  auth.post(
    '/verify-email',
    generalRateLimit,
    zValidator('json', verifyEmailSchema),
    async (c) => authController.verifyEmail(c)
  );

  /**
   * @route   POST /auth/resend-verification
   * @desc    Resend email verification
   * @access  Public
   */
  auth.post(
    '/resend-verification',
    authRateLimit,
    zValidator('json', resendVerificationSchema),
    async (c) => authController.resendVerification(c)
  );

  return auth;
}

// Export default for backward compatibility
export default createAuthRoutes;
