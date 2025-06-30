/**
 * User Domain Entity
 * Rich domain model with business rules and validation
 */

import { BusinessLogicException, ValidationException } from '../../shared/exceptions/base.exception.js';

export type UserRole = 'admin' | 'user' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface UserEntityData {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  roles: UserRole[];
  status: UserStatus;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  timezone?: string;
  language: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  apiKeyEnabled: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  private constructor(private data: UserEntityData) {
    this.validate();
  }

  /**
   * Create new user entity
   */
  public static create(data: Omit<UserEntityData, 'id' | 'createdAt' | 'updatedAt'>): UserEntity {
    const now = new Date();
    
    const userData: UserEntityData = {
      ...data,
      id: crypto.randomUUID(),
      roles: data.roles.length > 0 ? data.roles : ['user'],
      status: data.status || 'pending_verification',
      emailVerified: data.emailVerified || false,
      phoneVerified: data.phoneVerified || false,
      language: data.language || 'en',
      loginAttempts: 0,
      twoFactorEnabled: false,
      apiKeyEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    return new UserEntity(userData);
  }

  /**
   * Create from existing data
   */
  public static fromData(data: UserEntityData): UserEntity {
    return new UserEntity(data);
  }

  /**
   * Validate user data
   */
  private validate(): void {
    if (!this.data.email || !this.isValidEmail(this.data.email)) {
      throw new ValidationException('Invalid email address');
    }

    if (!this.data.username || this.data.username.length < 3) {
      throw new ValidationException('Username must be at least 3 characters');
    }

    if (this.data.roles.length === 0) {
      throw new ValidationException('User must have at least one role');
    }

    if (this.data.loginAttempts < 0) {
      throw new ValidationException('Login attempts cannot be negative');
    }
  }

  // Getters
  public get id(): string { return this.data.id; }
  public get email(): string { return this.data.email; }
  public get username(): string { return this.data.username; }
  public get firstName(): string | undefined { return this.data.firstName; }
  public get lastName(): string | undefined { return this.data.lastName; }
  public get fullName(): string {
    if (this.data.firstName && this.data.lastName) {
      return `${this.data.firstName} ${this.data.lastName}`;
    }
    return this.data.firstName || this.data.lastName || this.data.username;
  }
  public get avatar(): string | undefined { return this.data.avatar; }
  public get roles(): UserRole[] { return [...this.data.roles]; }
  public get status(): UserStatus { return this.data.status; }
  public get emailVerified(): boolean { return this.data.emailVerified; }
  public get phoneNumber(): string | undefined { return this.data.phoneNumber; }
  public get phoneVerified(): boolean { return this.data.phoneVerified; }
  public get timezone(): string | undefined { return this.data.timezone; }
  public get language(): string { return this.data.language; }
  public get lastLoginAt(): Date | undefined { return this.data.lastLoginAt; }
  public get lastActiveAt(): Date | undefined { return this.data.lastActiveAt; }
  public get loginAttempts(): number { return this.data.loginAttempts; }
  public get lockedUntil(): Date | undefined { return this.data.lockedUntil; }
  public get passwordChangedAt(): Date | undefined { return this.data.passwordChangedAt; }
  public get twoFactorEnabled(): boolean { return this.data.twoFactorEnabled; }
  public get apiKeyEnabled(): boolean { return this.data.apiKeyEnabled; }
  public get metadata(): Record<string, any> | undefined { return this.data.metadata; }
  public get createdAt(): Date { return this.data.createdAt; }
  public get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business Rules
   */

  /**
   * Check if user can place orders
   */
  public canPlaceOrder(): boolean {
    return this.isActive() && this.data.emailVerified;
  }

  /**
   * Check if user is active
   */
  public isActive(): boolean {
    return this.data.status === 'active' && !this.isLocked();
  }

  /**
   * Check if user account is locked
   */
  public isLocked(): boolean {
    return this.data.lockedUntil ? this.data.lockedUntil > new Date() : false;
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: UserRole): boolean {
    return this.data.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.data.roles.includes(role));
  }

  /**
   * Check if user is admin
   */
  public isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user can access admin features
   */
  public canAccessAdmin(): boolean {
    return this.isActive() && (this.hasRole('admin') || this.hasRole('moderator'));
  }

  /**
   * Check if user needs to verify email
   */
  public needsEmailVerification(): boolean {
    return !this.data.emailVerified && this.data.status === 'pending_verification';
  }

  /**
   * Check if user can login
   */
  public canLogin(): boolean {
    return this.data.status !== 'suspended' && !this.isLocked();
  }

  /**
   * Check if password needs to be changed
   */
  public needsPasswordChange(): boolean {
    if (!this.data.passwordChangedAt) {
      return true; // Never changed password
    }

    // Require password change every 90 days for admin users
    if (this.isAdmin()) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return this.data.passwordChangedAt < ninetyDaysAgo;
    }

    return false;
  }

  /**
   * Actions
   */

  /**
   * Update last login timestamp
   */
  public updateLastLogin(): void {
    this.data.lastLoginAt = new Date();
    this.data.lastActiveAt = new Date();
    this.data.loginAttempts = 0; // Reset failed attempts on successful login
    this.data.updatedAt = new Date();
  }

  /**
   * Update last active timestamp
   */
  public updateLastActive(): void {
    this.data.lastActiveAt = new Date();
    this.data.updatedAt = new Date();
  }

  /**
   * Increment login attempts
   */
  public incrementLoginAttempts(): void {
    this.data.loginAttempts++;
    this.data.updatedAt = new Date();

    // Lock account after 5 failed attempts
    if (this.data.loginAttempts >= 5) {
      this.lockAccount(30); // Lock for 30 minutes
    }
  }

  /**
   * Reset login attempts
   */
  public resetLoginAttempts(): void {
    this.data.loginAttempts = 0;
    this.data.lockedUntil = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Lock user account
   */
  public lockAccount(minutes: number): void {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + minutes);
    this.data.lockedUntil = lockUntil;
    this.data.updatedAt = new Date();
  }

  /**
   * Unlock user account
   */
  public unlockAccount(): void {
    this.data.lockedUntil = undefined;
    this.data.loginAttempts = 0;
    this.data.updatedAt = new Date();
  }

  /**
   * Verify email
   */
  public verifyEmail(): void {
    this.data.emailVerified = true;
    if (this.data.status === 'pending_verification') {
      this.data.status = 'active';
    }
    this.data.updatedAt = new Date();
  }

  /**
   * Verify phone number
   */
  public verifyPhone(): void {
    this.data.phoneVerified = true;
    this.data.updatedAt = new Date();
  }

  /**
   * Update user status
   */
  public updateStatus(status: UserStatus): void {
    if (status === 'active' && !this.data.emailVerified) {
      throw new BusinessLogicException('Cannot activate user without email verification');
    }

    this.data.status = status;
    this.data.updatedAt = new Date();
  }

  /**
   * Add role to user
   */
  public addRole(role: UserRole): void {
    if (!this.data.roles.includes(role)) {
      this.data.roles.push(role);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Remove role from user
   */
  public removeRole(role: UserRole): void {
    const index = this.data.roles.indexOf(role);
    if (index > -1) {
      this.data.roles.splice(index, 1);
      
      // Ensure user always has at least one role
      if (this.data.roles.length === 0) {
        this.data.roles.push('user');
      }
      
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Update profile information
   */
  public updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
    language?: string;
    phoneNumber?: string;
  }): void {
    if (updates.firstName !== undefined) this.data.firstName = updates.firstName;
    if (updates.lastName !== undefined) this.data.lastName = updates.lastName;
    if (updates.avatar !== undefined) this.data.avatar = updates.avatar;
    if (updates.timezone !== undefined) this.data.timezone = updates.timezone;
    if (updates.language !== undefined) this.data.language = updates.language;
    if (updates.phoneNumber !== undefined) {
      this.data.phoneNumber = updates.phoneNumber;
      this.data.phoneVerified = false; // Reset verification when phone changes
    }

    this.data.updatedAt = new Date();
  }

  /**
   * Enable two-factor authentication
   */
  public enableTwoFactor(secret: string): void {
    this.data.twoFactorEnabled = true;
    this.data.twoFactorSecret = secret;
    this.data.updatedAt = new Date();
  }

  /**
   * Disable two-factor authentication
   */
  public disableTwoFactor(): void {
    this.data.twoFactorEnabled = false;
    this.data.twoFactorSecret = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Update password changed timestamp
   */
  public updatePasswordChanged(): void {
    this.data.passwordChangedAt = new Date();
    this.data.updatedAt = new Date();
  }

  /**
   * Get data for persistence
   */
  public toData(): UserEntityData {
    return { ...this.data };
  }

  /**
   * Get public data (safe for API responses)
   */
  public toPublicData(): Omit<UserEntityData, 'twoFactorSecret' | 'loginAttempts' | 'lockedUntil'> {
    const { twoFactorSecret, loginAttempts, lockedUntil, ...publicData } = this.data;
    return publicData;
  }

  // Private helper methods

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
