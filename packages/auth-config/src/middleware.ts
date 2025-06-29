import type { Context, Next } from "hono";
import type { AuthMiddleware } from "./types";

/**
 * Session middleware factory that adds session data to Hono context
 */
export function createSessionMiddleware(auth: any): AuthMiddleware {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);

    return next();
  };
}

/**
 * Authorization middleware factory for protecting routes
 */
export function createAuthorizationMiddleware(
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    allowedRoles?: string[];
  },
  errorUtils?: {
    ValidationError: any;
    UNAUTHORIZED: number;
  }
): AuthMiddleware {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const path = c.req.path;

    // Check if authentication is required
    if (options.requireAuth && !user) {
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "Authentication required to access this resource.",
          {
            action: "access_protected_resource",
            requiredPermission: "authenticated_user",
            receivedPermission: "anonymous",
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("Authentication required to access this resource.");
      }
    }

    // Check admin access
    if (options.requireAdmin && user?.role !== "admin") {
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "Admin access required to access this resource.",
          {
            action: "access_protected_resource",
            requiredPermission: "admin",
            receivedPermission: user?.role || "user",
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("Admin access required to access this resource.");
      }
    }

    // Check role-based access
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const userRole = user?.role || "user";
      if (!options.allowedRoles.includes(userRole)) {
        if (errorUtils) {
          throw new errorUtils.ValidationError(
            `Access denied. Required roles: ${options.allowedRoles.join(", ")}`,
            {
              action: "access_protected_resource",
              requiredPermission: options.allowedRoles.join("|"),
              receivedPermission: userRole,
            },
            errorUtils.UNAUTHORIZED
          );
        } else {
          throw new Error(`Access denied. Required roles: ${options.allowedRoles.join(", ")}`);
        }
      }
    }

    return next();
  };
}

/**
 * API Key validation middleware for backend routes
 */
export function createApiKeyMiddleware(
  db: any,
  schemas: any,
  errorUtils?: {
    ValidationError: any;
    UNAUTHORIZED: number;
  }
): AuthMiddleware {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const user = c.get("user");
    let body;

    try {
      body = await c.req.json();
    } catch (error) {
      // No JSON body
    }

    const apiKey = body?.key;

    // Skip API key validation for user routes if user is authenticated
    if (path.startsWith("/v2/api-key") && !user) {
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "Unauthorized access attempt detected.",
          {
            action: "access_protected_resource",
            requiredPermission: "user",
            receivedPermission: "unauthorized",
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("Unauthorized access attempt detected.");
      }
    }

    if (path.startsWith("/v2/api-key") && user) {
      return next();
    }

    // Require API key for handler routes
    if (!apiKey) {
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "API key is missing.",
          {
            action: "provide_api_key",
            requiredPermission: "api_key",
            receivedPermission: "none",
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("API key is missing.");
      }
    }

    // Verify API key
    const { valid, error, key } = await verifyApiKey(apiKey, db, schemas);

    if (!valid || !key?.userId) {
      c.set("user-id", null);
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "Invalid API key detected!",
          {
            action: "access_protected_resource",
            requiredPermission: "valid_api_key",
            receivedPermission: "invalid_api_key",
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("Invalid API key detected!");
      }
    }

    c.set("user-id", key.userId);

    if (path.startsWith("/v2/handler") && !valid) {
      if (errorUtils) {
        throw new errorUtils.ValidationError(
          "Unauthorized access attempt.",
          {
            action: "access_protected_resource",
            requiredPermission: "valid_api_key",
            receivedPermission: "invalid_api_key",
            apiKeyError: error,
          },
          errorUtils.UNAUTHORIZED
        );
      } else {
        throw new Error("Unauthorized access attempt.");
      }
    }

    return next();
  };
}

/**
 * Verify API key helper function
 */
async function verifyApiKey(
  key: string,
  db: any,
  schemas: any
): Promise<{
  valid: boolean;
  error: string | null;
  key: any | null;
}> {
  try {
    const keyInfo = await db.query.apikey.findFirst({
      where: schemas.eq(schemas.apikey.key, key),
    });

    if (!keyInfo) {
      return {
        valid: false,
        error: "API key not found",
        key: null,
      };
    }

    return {
      valid: true,
      error: null,
      key: keyInfo,
    };
  } catch (error) {
    return {
      valid: false,
      error: "Database error",
      key: null,
    };
  }
}
