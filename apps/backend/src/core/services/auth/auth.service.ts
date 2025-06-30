/**
 * Authentication Service
 * Business logic for user authentication and authorization
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../../repositories/user/user.repository.js';
import { UserEntity, type UserRole } from '../../entities/user.entity.js';
import { BusinessLogicException, ValidationException, UnauthorizedException } from '../../../shared/exceptions/base.exception.js';
import { getLogger } from '../../../infrastructure/monitoring/logger.js';
import { getRedisClient } from '../../../infrastructure/cache/redis.client.js';
import { appConfig } from '../../../config/app.config.js';

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  language?: string;
}

export interface AuthResult {
  user: UserEntity;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  roles: UserRole[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export class AuthService {
  private logger = getLogger();
  private redis = getRedisClient();

  constructor(private userRepository: UserRepository) {}

  /**
   * Authenticate user with email/username and password
   */
  async authenticate(identifier: string, password: string, rememberMe = false): Promise<AuthResult> {
    try {
      this.logger.info('Authentication attempt', { identifier });

      // Find user by email or username
      const user = await this.userRepository.findByEmailOrUsername(identifier);
      
      if (!user) {
        this.logger.warn('Authentication failed: user not found', { identifier });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user can login
      if (!user.canLogin()) {
        this.logger.warn('Authentication failed: user cannot login', { 
          userId: user.id, 
          status: user.status,
          isLocked: user.isLocked()
        });
        
        if (user.isLocked()) {
          throw new UnauthorizedException('Account is temporarily locked due to multiple failed login attempts');
        }
        
        throw new UnauthorizedException('Account is not active');
      }

      // Get password hash
      const passwordHash = await this.userRepository.getPasswordHash(user.id);
      
      if (!passwordHash) {
        this.logger.error('Password hash not found for user', { userId: user.id });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      
      if (!isPasswordValid) {
        this.logger.warn('Authentication failed: invalid password', { userId: user.id });
        
        // Increment login attempts
        user.incrementLoginAttempts();
        await this.userRepository.update(user.id, user);
        
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      user.updateLastLogin();
      await this.userRepository.update(user.id, user);

      // Generate tokens
      const sessionId = this.generateSessionId();
      const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
      
      const token = this.generateAccessToken(user, sessionId);
      const refreshToken = this.generateRefreshToken(user.id, sessionId, expiresIn);

      // Store session in Redis
      await this.storeSession(sessionId, user.id, expiresIn);

      this.logger.info('Authentication successful', { 
        userId: user.id, 
        sessionId,
        rememberMe 
      });

      return {
        user,
        token,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Authentication error', { identifier, error });
      throw new BusinessLogicException('Authentication failed');
    }
  }

  /**
   * Register new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResult> {
    try {
      this.logger.info('User registration attempt', { 
        email: registerData.email, 
        username: registerData.username 
      });

      // Validate input
      await this.validateRegistrationData(registerData);

      // Hash password
      const passwordHash = await this.hashPassword(registerData.password);

      // Create user
      const user = await this.userRepository.create({
        email: registerData.email.toLowerCase(),
        username: registerData.username.toLowerCase(),
        passwordHash,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        timezone: registerData.timezone,
        language: registerData.language || 'en',
        roles: ['user'],
        status: 'pending_verification',
        emailVerified: false,
      });

      // Generate tokens
      const sessionId = this.generateSessionId();
      const expiresIn = 7 * 24 * 60 * 60; // 7 days
      
      const token = this.generateAccessToken(user, sessionId);
      const refreshToken = this.generateRefreshToken(user.id, sessionId, expiresIn);

      // Store session in Redis
      await this.storeSession(sessionId, user.id, expiresIn);

      this.logger.info('User registration successful', { 
        userId: user.id, 
        email: registerData.email 
      });

      return {
        user,
        token,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Registration error', { 
        email: registerData.email, 
        username: registerData.username, 
        error 
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);
      
      // Check if session exists
      const sessionExists = await this.sessionExists(payload.sessionId);
      
      if (!sessionExists) {
        throw new UnauthorizedException('Session expired');
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user || !user.canLogin()) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new access token
      const token = this.generateAccessToken(user, payload.sessionId);
      const expiresIn = 60 * 60; // 1 hour

      this.logger.info('Token refreshed successfully', { 
        userId: user.id, 
        sessionId: payload.sessionId 
      });

      return { token, expiresIn };
    } catch (error) {
      this.logger.error('Token refresh error', { error });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await this.removeSession(sessionId);
      this.logger.info('User logged out successfully', { sessionId });
    } catch (error) {
      this.logger.error('Logout error', { sessionId, error });
      throw error;
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<UserEntity> {
    try {
      const payload = this.verifyAccessToken(token);
      
      // Check if session exists
      const sessionExists = await this.sessionExists(payload.sessionId);
      
      if (!sessionExists) {
        throw new UnauthorizedException('Session expired');
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user || !user.canLogin()) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Update last active
      user.updateLastActive();
      await this.userRepository.update(user.id, user);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Token verification error', { error });
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new BusinessLogicException('User not found');
      }

      // Verify current password
      const currentPasswordHash = await this.userRepository.getPasswordHash(userId);
      
      if (!currentPasswordHash) {
        throw new BusinessLogicException('Current password not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
      
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await this.userRepository.updatePasswordHash(userId, newPasswordHash);

      // Update password changed timestamp
      user.updatePasswordChanged();
      await this.userRepository.update(userId, user);

      this.logger.info('Password changed successfully', { userId });
    } catch (error) {
      this.logger.error('Password change error', { userId, error });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate registration data
   */
  private async validateRegistrationData(data: RegisterRequest): Promise<void> {
    // Check email format
    if (!this.isValidEmail(data.email)) {
      throw new ValidationException('Invalid email format');
    }

    // Check username format
    if (!this.isValidUsername(data.username)) {
      throw new ValidationException('Username must be 3-30 characters and contain only letters, numbers, and underscores');
    }

    // Check password strength
    this.validatePassword(data.password);

    // Check if email exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new ValidationException('Email already exists');
    }

    // Check if username exists
    const usernameExists = await this.userRepository.usernameExists(data.username);
    if (usernameExists) {
      throw new ValidationException('Username already exists');
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationException('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new ValidationException('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new ValidationException('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new ValidationException('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new ValidationException('Password must contain at least one special character (@$!%*?&)');
    }
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, appConfig.auth.bcryptRounds);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: UserEntity, sessionId: string): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      sessionId,
    };

    return jwt.sign(payload, appConfig.auth.jwtSecret, {
      expiresIn: '1h',
      issuer: appConfig.app.name,
      audience: appConfig.app.name,
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string, sessionId: string, expiresIn: number): string {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      sessionId,
      type: 'refresh',
    };

    return jwt.sign(payload, appConfig.auth.jwtSecret, {
      expiresIn,
      issuer: appConfig.app.name,
      audience: appConfig.app.name,
    });
  }

  /**
   * Verify access token
   */
  private verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, appConfig.auth.jwtSecret, {
      issuer: appConfig.app.name,
      audience: appConfig.app.name,
    }) as TokenPayload;
  }

  /**
   * Verify refresh token
   */
  private verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, appConfig.auth.jwtSecret, {
      issuer: appConfig.app.name,
      audience: appConfig.app.name,
    }) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }

  /**
   * Store session in Redis
   */
  private async storeSession(sessionId: string, userId: string, expiresIn: number): Promise<void> {
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(
      `session:${sessionId}`,
      sessionData,
      { ttl: expiresIn, fallbackToMemory: true }
    );
  }

  /**
   * Check if session exists
   */
  private async sessionExists(sessionId: string): Promise<boolean> {
    return await this.redis.exists(`session:${sessionId}`, { fallbackToMemory: true });
  }

  /**
   * Remove session
   */
  private async removeSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`, { fallbackToMemory: true });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   */
  private isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }
}
