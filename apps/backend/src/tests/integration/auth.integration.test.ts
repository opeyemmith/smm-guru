/**
 * Authentication Integration Tests
 * Tests the complete authentication flow including registration, login, and protected routes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import { createApiV1Routes } from '../../api/v1/index.js';
import { getDatabaseConnection } from '../../infrastructure/database/connection.js';
import { getRedisClient } from '../../infrastructure/cache/redis.client.js';
import { UserRepository } from '../../core/repositories/user/user.repository.js';

describe('Authentication Integration Tests', () => {
  let app: Hono;
  let client: ReturnType<typeof testClient>;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Initialize test app
    app = new Hono();
    app.route('/api/v1', createApiV1Routes());
    client = testClient(app);

    // Initialize infrastructure
    await getDatabaseConnection().initialize();
    await getRedisClient().initialize();
    
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    // Cleanup
    await getDatabaseConnection().close();
    await getRedisClient().close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    // In a real test environment, you'd use a test database
    // For now, we'll skip cleanup to avoid affecting real data
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        acceptTerms: true,
      };

      const response = await client.api.v1.auth.register.$post({
        json: userData,
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.name).toBe('REGISTRATION_SUCCESS');
      expect(data.result.user).toBeDefined();
      expect(data.result.token).toBeDefined();
      expect(data.result.refreshToken).toBeDefined();
      expect(data.result.user.email).toBe(userData.email);
      expect(data.result.user.username).toBe(userData.username);
      expect(data.result.user.emailVerified).toBe(false);
      expect(data.result.user.status).toBe('pending_verification');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser2',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: true,
      };

      const response = await client.api.v1.auth.register.$post({
        json: userData,
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'testuser3',
        password: 'weak',
        confirmPassword: 'weak',
        acceptTerms: true,
      };

      const response = await client.api.v1.auth.register.$post({
        json: userData,
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        email: 'test3@example.com',
        username: 'testuser4',
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
        acceptTerms: true,
      };

      const response = await client.api.v1.auth.register.$post({
        json: userData,
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('VALIDATION_ERROR');
    });
  });

  describe('User Login', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        email: 'login-test@example.com',
        username: 'logintest',
        password: 'LoginTest123!',
        confirmPassword: 'LoginTest123!',
        acceptTerms: true,
      };

      const response = await client.api.v1.auth.register.$post({
        json: userData,
      });

      const data = await response.json();
      testUser = data.result.user;
    });

    it('should login with email successfully', async () => {
      const loginData = {
        identifier: 'login-test@example.com',
        password: 'LoginTest123!',
      };

      const response = await client.api.v1.auth.login.$post({
        json: loginData,
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.name).toBe('LOGIN_SUCCESS');
      expect(data.result.user).toBeDefined();
      expect(data.result.token).toBeDefined();
      expect(data.result.refreshToken).toBeDefined();
    });

    it('should login with username successfully', async () => {
      const loginData = {
        identifier: 'logintest',
        password: 'LoginTest123!',
      };

      const response = await client.api.v1.auth.login.$post({
        json: loginData,
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.name).toBe('LOGIN_SUCCESS');
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        identifier: 'login-test@example.com',
        password: 'WrongPassword123!',
      };

      const response = await client.api.v1.auth.login.$post({
        json: loginData,
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('LOGIN_FAILED');
    });

    it('should reject login with non-existent user', async () => {
      const loginData = {
        identifier: 'nonexistent@example.com',
        password: 'TestPassword123!',
      };

      const response = await client.api.v1.auth.login.$post({
        json: loginData,
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('LOGIN_FAILED');
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Register and login to get auth token
      const userData = {
        email: 'protected-test@example.com',
        username: 'protectedtest',
        password: 'ProtectedTest123!',
        confirmPassword: 'ProtectedTest123!',
        acceptTerms: true,
      };

      const registerResponse = await client.api.v1.auth.register.$post({
        json: userData,
      });

      const registerData = await registerResponse.json();
      authToken = registerData.result.token;
      testUser = registerData.result.user;
    });

    it('should access profile with valid token', async () => {
      const response = await client.api.v1.auth.me.$get(
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result.user).toBeDefined();
      expect(data.result.user.id).toBe(testUser.id);
    });

    it('should reject access without token', async () => {
      const response = await client.api.v1.auth.me.$get();

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject access with invalid token', async () => {
      const response = await client.api.v1.auth.me.$get(
        {},
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('INVALID_TOKEN');
    });

    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        timezone: 'America/New_York',
      };

      const response = await client.api.v1.auth.profile.$put(
        {
          json: updateData,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result.user.firstName).toBe(updateData.firstName);
      expect(data.result.user.lastName).toBe(updateData.lastName);
      expect(data.result.user.timezone).toBe(updateData.timezone);
    });

    it('should logout successfully', async () => {
      const response = await client.api.v1.auth.logout.$post(
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.name).toBe('LOGOUT_SUCCESS');

      // Verify token is invalidated
      const profileResponse = await client.api.v1.auth.me.$get(
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(profileResponse.status).toBe(401);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      const userData = {
        email: 'refresh-test@example.com',
        username: 'refreshtest',
        password: 'RefreshTest123!',
        confirmPassword: 'RefreshTest123!',
        acceptTerms: true,
      };

      const registerResponse = await client.api.v1.auth.register.$post({
        json: userData,
      });

      const registerData = await registerResponse.json();
      refreshToken = registerData.result.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await client.api.v1.auth.refresh.$post({
        json: { refreshToken },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.name).toBe('TOKEN_REFRESH_SUCCESS');
      expect(data.result.token).toBeDefined();
      expect(data.result.expiresIn).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await client.api.v1.auth.refresh.$post({
        json: { refreshToken: 'invalid-refresh-token' },
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.name).toBe('TOKEN_REFRESH_FAILED');
    });
  });
});
