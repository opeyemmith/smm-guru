/**
 * Authentication Middleware
 * JWT token validation and user session management
 */

import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { AuthService, type TokenPayload } from '../../core/services/auth/auth.service.js';
import { UserRepository } from '../../core/repositories/user/user.repository.js';
import { UnauthorizedException } from '../../shared/exceptions/base.exception.js';
import { sendError } from '../../shared/utils/response.util.js';
import { getLogger } from '../../infrastructure/monitoring/logger.js';
import { getRedisClient } from '../../infrastructure/cache/redis.client.js';
import { appConfig } from '../../config/app.config.js';
import type { UserRole } from '../../core/entities/user.entity.js';

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: UserRole[];
  permissions?: string[];
}

/**
 * Authentication middleware factory
 */
export function authMiddleware(options: AuthMiddlewareOptions = { required: true }) {
  const logger = getLogger();
  const redis = getRedisClient();
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository);

  return async (c: Context, next: Next) => {
    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          logger.warn('Authentication required but no token provided', {
            path: c.req.path,
            method: c.req.method,
            ip: c.req.header('x-forwarded-for') || 'unknown'
          });
          
          return sendError(c, 'AUTHENTICATION_REQUIRED', 'Authentication token required', 401);
        }
        
        // Token not required, continue without authentication
        await next();
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Verify and decode token
        const payload = jwt.verify(token, appConfig.auth.jwtSecret, {
          issuer: appConfig.app.name,
          audience: appConfig.app.name,
        }) as TokenPayload;

        // Check if session exists in Redis
        const sessionExists = await redis.exists(`session:${payload.sessionId}`, { 
          fallbackToMemory: true 
        });

        if (!sessionExists) {
          logger.warn('Session not found or expired', {
            sessionId: payload.sessionId,
            userId: payload.userId,
            path: c.req.path
          });
          
          return sendError(c, 'SESSION_EXPIRED', 'Session has expired', 401);
        }

        // Get user from database
        const user = await userRepository.findById(payload.userId);

        if (!user) {
          logger.warn('User not found for valid token', {
            userId: payload.userId,
            sessionId: payload.sessionId
          });
          
          return sendError(c, 'USER_NOT_FOUND', 'User not found', 401);
        }

        // Check if user can still login (account status, etc.)
        if (!user.canLogin()) {
          logger.warn('User cannot login', {
            userId: user.id,
            status: user.status,
            isLocked: user.isLocked()
          });
          
          // Remove session since user can't login
          await redis.del(`session:${payload.sessionId}`, { fallbackToMemory: true });
          
          if (user.isLocked()) {
            return sendError(c, 'ACCOUNT_LOCKED', 'Account is temporarily locked', 401);
          }
          
          return sendError(c, 'ACCOUNT_INACTIVE', 'Account is not active', 401);
        }

        // Check role-based access if roles are specified
        if (options.roles && options.roles.length > 0) {
          const hasRequiredRole = user.hasAnyRole(options.roles);
          
          if (!hasRequiredRole) {
            logger.warn('Insufficient permissions', {
              userId: user.id,
              userRoles: user.roles,
              requiredRoles: options.roles,
              path: c.req.path
            });
            
            return sendError(c, 'INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
          }
        }

        // Update last active timestamp
        user.updateLastActive();
        await userRepository.update(user.id, user);

        // Extend session TTL in Redis
        await redis.expire(`session:${payload.sessionId}`, 7 * 24 * 60 * 60, { 
          fallbackToMemory: true 
        }); // 7 days

        // Set user and session info in context
        c.set('user', user);
        c.set('sessionId', payload.sessionId);
        c.set('tokenPayload', payload);

        logger.debug('Authentication successful', {
          userId: user.id,
          username: user.username,
          sessionId: payload.sessionId,
          path: c.req.path
        });

        await next();
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          logger.warn('Token expired', {
            path: c.req.path,
            error: jwtError.message
          });
          
          return sendError(c, 'TOKEN_EXPIRED', 'Token has expired', 401);
        }

        if (jwtError instanceof jwt.JsonWebTokenError) {
          logger.warn('Invalid token', {
            path: c.req.path,
            error: jwtError.message
          });
          
          return sendError(c, 'INVALID_TOKEN', 'Invalid token', 401);
        }

        throw jwtError;
      }
    } catch (error) {
      logger.error('Authentication middleware error', {
        path: c.req.path,
        method: c.req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return sendError(c, 'AUTHENTICATION_ERROR', 'Authentication error', 500);
    }
  };
}

/**
 * Optional authentication middleware
 * Authenticates user if token is provided, but doesn't require it
 */
export const optionalAuthMiddleware = authMiddleware({ required: false });

/**
 * Admin-only authentication middleware
 * Requires authentication and admin role
 */
export const adminAuthMiddleware = authMiddleware({ 
  required: true, 
  roles: ['admin'] 
});

/**
 * Moderator or admin authentication middleware
 * Requires authentication and moderator or admin role
 */
export const moderatorAuthMiddleware = authMiddleware({ 
  required: true, 
  roles: ['admin', 'moderator'] 
});

/**
 * User authentication middleware (default)
 * Requires authentication but any role is acceptable
 */
export const userAuthMiddleware = authMiddleware({ required: true });

/**
 * Extract user from context helper
 */
export function getAuthenticatedUser(c: Context) {
  return c.get('user');
}

/**
 * Extract session ID from context helper
 */
export function getSessionId(c: Context): string | undefined {
  return c.get('sessionId');
}

/**
 * Extract token payload from context helper
 */
export function getTokenPayload(c: Context): TokenPayload | undefined {
  return c.get('tokenPayload');
}

/**
 * Check if user has specific role
 */
export function hasRole(c: Context, role: UserRole): boolean {
  const user = getAuthenticatedUser(c);
  return user ? user.hasRole(role) : false;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(c: Context, roles: UserRole[]): boolean {
  const user = getAuthenticatedUser(c);
  return user ? user.hasAnyRole(roles) : false;
}

/**
 * Check if user is admin
 */
export function isAdmin(c: Context): boolean {
  return hasRole(c, 'admin');
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(c: Context): boolean {
  const user = getAuthenticatedUser(c);
  return user ? user.canAccessAdmin() : false;
}

// Export the default middleware
export default authMiddleware;
