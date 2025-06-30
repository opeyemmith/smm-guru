/**
 * Authentication Validation Schemas
 * Zod schemas for authentication request validation
 */

import { z } from 'zod';

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier must be at least 3 characters')
    .max(100, 'Identifier must not exceed 100 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z
    .boolean()
    .optional()
    .default(false),
});

export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Registration request validation schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform(email => email.toLowerCase().trim()),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform(username => username.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  timezone: z
    .string()
    .max(50, 'Timezone must not exceed 50 characters')
    .optional(),
  language: z
    .string()
    .length(2, 'Language must be a 2-character code')
    .optional()
    .default('en'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * Refresh token request validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

/**
 * Change password request validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must not exceed 128 characters')
    .regex(/(?=.*[a-z])/, 'New password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'New password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'New password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'New password must contain at least one special character (@$!%*?&)'),
  confirmNewPassword: z
    .string()
    .min(1, 'New password confirmation is required'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform(email => email.toLowerCase().trim()),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request validation schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

/**
 * Verify email request validation schema
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required'),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification email request validation schema
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform(email => email.toLowerCase().trim()),
});

export type ResendVerificationRequest = z.infer<typeof resendVerificationSchema>;

/**
 * Update profile request validation schema
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  timezone: z
    .string()
    .max(50, 'Timezone must not exceed 50 characters')
    .optional(),
  language: z
    .string()
    .length(2, 'Language must be a 2-character code')
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

/**
 * Two-factor authentication setup request validation schema
 */
export const setupTwoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d{6}$/, 'Two-factor code must contain only digits'),
});

export type SetupTwoFactorRequest = z.infer<typeof setupTwoFactorSchema>;

/**
 * Two-factor authentication verification request validation schema
 */
export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d{6}$/, 'Two-factor code must contain only digits'),
});

export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorSchema>;

/**
 * Common validation helpers
 */
export const commonValidation = {
  /**
   * Validate password strength
   */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),

  /**
   * Validate email format
   */
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform(email => email.toLowerCase().trim()),

  /**
   * Validate username format
   */
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform(username => username.toLowerCase().trim()),

  /**
   * Validate name fields
   */
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),

  /**
   * Validate phone number
   */
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  /**
   * Validate timezone
   */
  timezone: z
    .string()
    .max(50, 'Timezone must not exceed 50 characters'),

  /**
   * Validate language code
   */
  language: z
    .string()
    .length(2, 'Language must be a 2-character code'),

  /**
   * Validate two-factor code
   */
  twoFactorCode: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d{6}$/, 'Two-factor code must contain only digits'),
};
