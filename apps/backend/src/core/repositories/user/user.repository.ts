/**
 * User Repository
 * Data access layer for user management with security features
 */

import { eq, and, or, desc, asc, count, sql } from 'drizzle-orm';
import { BaseRepository } from '../base/base.repository.js';
import { UserEntity, UserEntityData, type UserRole, type UserStatus } from '../../entities/user.entity.js';
import { userSchema } from '../../../infrastructure/database/schema.js';
import { BusinessLogicException, NotFoundException } from '../../../shared/exceptions/base.exception.js';
import { getLogger } from '../../../infrastructure/monitoring/logger.js';

export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  emailVerified?: boolean;
  search?: string; // Search in email, username, firstName, lastName
}

export interface UserCreateData {
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roles?: UserRole[];
  status?: UserStatus;
  emailVerified?: boolean;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
}

export class UserRepository extends BaseRepository<UserEntityData> {
  private logger = getLogger();

  constructor() {
    super(userSchema);
  }

  /**
   * Create new user
   */
  async create(userData: UserCreateData): Promise<UserEntity> {
    try {
      const userEntity = UserEntity.create({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles || ['user'],
        status: userData.status || 'pending_verification',
        emailVerified: userData.emailVerified || false,
        phoneNumber: userData.phoneNumber,
        phoneVerified: false,
        timezone: userData.timezone,
        language: userData.language || 'en',
        loginAttempts: 0,
        twoFactorEnabled: false,
        apiKeyEnabled: false,
      });

      const [insertedUser] = await this.db
        .insert(userSchema)
        .values({
          ...userEntity.toData(),
          passwordHash: userData.passwordHash,
        })
        .returning();

      this.logger.info('User created successfully', {
        userId: insertedUser.id,
        email: userData.email,
        username: userData.username,
      });

      return UserEntity.fromData(insertedUser);
    } catch (error) {
      this.logger.error('Failed to create user', {
        email: userData.email,
        username: userData.username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, id))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      return UserEntity.fromData(user[0]);
    } catch (error) {
      this.logger.error('Failed to find user by ID', { userId: id, error });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, email.toLowerCase()))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      return UserEntity.fromData(user[0]);
    } catch (error) {
      this.logger.error('Failed to find user by email', { email, error });
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    try {
      const user = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.username, username.toLowerCase()))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      return UserEntity.fromData(user[0]);
    } catch (error) {
      this.logger.error('Failed to find user by username', { username, error });
      throw error;
    }
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string): Promise<UserEntity | null> {
    try {
      const user = await this.db
        .select()
        .from(userSchema)
        .where(
          or(
            eq(userSchema.email, identifier.toLowerCase()),
            eq(userSchema.username, identifier.toLowerCase())
          )
        )
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      return UserEntity.fromData(user[0]);
    } catch (error) {
      this.logger.error('Failed to find user by email or username', { identifier, error });
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id: string, userEntity: UserEntity): Promise<UserEntity> {
    try {
      const userData = userEntity.toData();
      
      const [updatedUser] = await this.db
        .update(userSchema)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.info('User updated successfully', { userId: id });

      return UserEntity.fromData(updatedUser);
    } catch (error) {
      this.logger.error('Failed to update user', { userId: id, error });
      throw error;
    }
  }

  /**
   * Update user password hash
   */
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    try {
      const [updatedUser] = await this.db
        .update(userSchema)
        .set({
          passwordHash,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.info('User password updated successfully', { userId: id });
    } catch (error) {
      this.logger.error('Failed to update user password', { userId: id, error });
      throw error;
    }
  }

  /**
   * Get user password hash for authentication
   */
  async getPasswordHash(id: string): Promise<string | null> {
    try {
      const user = await this.db
        .select({ passwordHash: userSchema.passwordHash })
        .from(userSchema)
        .where(eq(userSchema.id, id))
        .limit(1);

      return user.length > 0 ? user[0].passwordHash : null;
    } catch (error) {
      this.logger.error('Failed to get user password hash', { userId: id, error });
      throw error;
    }
  }

  /**
   * Find users with filters and pagination
   */
  async findMany(
    filters: UserFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ users: UserEntity[]; total: number; page: number; limit: number }> {
    try {
      const conditions = [];

      // Apply filters
      if (filters.status) {
        conditions.push(eq(userSchema.status, filters.status));
      }

      if (filters.emailVerified !== undefined) {
        conditions.push(eq(userSchema.emailVerified, filters.emailVerified));
      }

      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${userSchema.email}) LIKE ${searchTerm}`,
            sql`LOWER(${userSchema.username}) LIKE ${searchTerm}`,
            sql`LOWER(${userSchema.firstName}) LIKE ${searchTerm}`,
            sql`LOWER(${userSchema.lastName}) LIKE ${searchTerm}`
          )
        );
      }

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(userSchema)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult[0]?.count || 0;

      // Get paginated results
      const offset = (pagination.page - 1) * pagination.limit;
      
      const users = await this.db
        .select()
        .from(userSchema)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(userSchema.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const userEntities = users.map(user => UserEntity.fromData(user));

      return {
        users: userEntities,
        total,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      this.logger.error('Failed to find users', { filters, pagination, error });
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const conditions = [eq(userSchema.email, email.toLowerCase())];
      
      if (excludeUserId) {
        conditions.push(sql`${userSchema.id} != ${excludeUserId}`);
      }

      const result = await this.db
        .select({ count: count() })
        .from(userSchema)
        .where(and(...conditions));

      return (result[0]?.count || 0) > 0;
    } catch (error) {
      this.logger.error('Failed to check email existence', { email, error });
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const conditions = [eq(userSchema.username, username.toLowerCase())];
      
      if (excludeUserId) {
        conditions.push(sql`${userSchema.id} != ${excludeUserId}`);
      }

      const result = await this.db
        .select({ count: count() })
        .from(userSchema)
        .where(and(...conditions));

      return (result[0]?.count || 0) > 0;
    } catch (error) {
      this.logger.error('Failed to check username existence', { username, error });
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to inactive)
   */
  async delete(id: string): Promise<void> {
    try {
      const [updatedUser] = await this.db
        .update(userSchema)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.info('User soft deleted successfully', { userId: id });
    } catch (error) {
      this.logger.error('Failed to delete user', { userId: id, error });
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<UserEntity[]> {
    try {
      const users = await this.db
        .select()
        .from(userSchema)
        .where(sql`${role} = ANY(${userSchema.roles})`)
        .orderBy(asc(userSchema.username));

      return users.map(user => UserEntity.fromData(user));
    } catch (error) {
      this.logger.error('Failed to find users by role', { role, error });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    emailVerified: number;
  }> {
    try {
      const stats = await this.db
        .select({
          total: count(),
          active: count(sql`CASE WHEN ${userSchema.status} = 'active' THEN 1 END`),
          pending: count(sql`CASE WHEN ${userSchema.status} = 'pending_verification' THEN 1 END`),
          suspended: count(sql`CASE WHEN ${userSchema.status} = 'suspended' THEN 1 END`),
          emailVerified: count(sql`CASE WHEN ${userSchema.emailVerified} = true THEN 1 END`),
        })
        .from(userSchema);

      return stats[0] || {
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
        emailVerified: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get user statistics', { error });
      throw error;
    }
  }
}
