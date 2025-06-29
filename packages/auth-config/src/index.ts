// Main exports
export { createAuthConfig, createWalletHookFactory } from "./config";
export {
  createSessionMiddleware,
  createAuthorizationMiddleware,
  createApiKeyMiddleware,
} from "./middleware";
export * from "./types";

// Re-export commonly used Better Auth types and utilities
export type { BetterAuthOptions } from "better-auth";
export { betterAuth } from "better-auth";
export { drizzleAdapter } from "better-auth/adapters/drizzle";
export { nextCookies } from "better-auth/next-js";
export { admin, apiKey, createAuthMiddleware } from "better-auth/plugins";
export { createAuthClient } from "better-auth/react";
export { adminClient } from "better-auth/client/plugins";

// Utility functions for common auth operations
export function getSessionFromContext(c: any) {
  return {
    user: c.get("user"),
    session: c.get("session"),
  };
}

export function getUserIdFromContext(c: any): string | null {
  const user = c.get("user");
  return user?.id || c.get("user-id") || null;
}

export function requireAuth(c: any) {
  const user = c.get("user");
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function requireAdmin(c: any) {
  const user = requireAuth(c);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}
