import type { Context, Next } from "hono";
import { UNAUTHORIZED } from "@smm-guru/utils";
import { ValidationError } from "@smm-guru/utils";

const sessionValidator = (c: Context, next: Next) => {
  const user = c.get("user");
  const path = c.req.path;

  // Debug logging for security testing
  console.log(`🔒 Security Check - Path: ${path}, User: ${user ? 'authenticated' : 'unauthenticated'}`);

  // Check for admin routes - require admin role
  if (path.includes("/admin")) {
    if (!user) {
      throw new ValidationError(
        "Authentication required. Please log in to access admin resources.",
        {
          action: "access_protected_resource",
          requiredPermission: "admin",
          receivedPermission: "unauthenticated",
        },
        UNAUTHORIZED
      );
    }

    if (user.role !== "admin") {
      throw new ValidationError(
        "Admin access required. Insufficient permissions.",
        {
          action: "access_protected_resource",
          requiredPermission: "admin",
          receivedPermission: user.role || "user",
        },
        UNAUTHORIZED
      );
    }
  }

  // Check for dashboard routes - require any authenticated user
  if (path.includes("/dashboard")) {
    if (!user) {
      throw new ValidationError(
        "Authentication required. Please log in to access dashboard resources.",
        {
          action: "access_protected_resource",
          requiredPermission: "user",
          receivedPermission: "unauthenticated",
        },
        UNAUTHORIZED
      );
    }
  }

  return next();
};

export default sessionValidator;
