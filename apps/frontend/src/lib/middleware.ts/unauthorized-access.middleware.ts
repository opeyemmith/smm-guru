import type { Context, Next } from "hono";
import { UNAUTHORIZED } from "@smm-guru/utils";
import { ValidationError } from "@smm-guru/utils";

const sessionValidator = (c: Context, next: Next) => {
  const user = c.get("user");
  const path = c.req.path;

  if (path.startsWith("/admin") && user.role !== "admin") {
    throw new ValidationError(
      "Unauthorized access attempt. Please log in to access admin resources.",
      {
        action: "access_protected_resource",
        requiredPermission: "admin",
        receivedPermission: "unauthorized",
      },
      UNAUTHORIZED
    );
  }

  if (path.startsWith("/dashboard") && !user) {
    throw new ValidationError(
      "Unauthorized access attempt detected.",
      {
        action: "access_protected_resource",
        requiredPermission: "user",
        receivedPermission: "unauthorized",
      },
      UNAUTHORIZED
    );
  }

  return next();
};

export default sessionValidator;
