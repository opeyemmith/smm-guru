import { NextRequest } from "next/server";
import { Session } from "@/lib/better-auth/type.auth";

/**
 * Server-side session utilities that work with middleware caching
 * This prevents duplicate session fetches in API routes
 */

// Session cache shared with middleware
declare global {
  var __sessionCache: Map<string, { session: Session | null; timestamp: number }> | undefined;
}

const getSessionCache = () => {
  if (!global.__sessionCache) {
    global.__sessionCache = new Map();
  }
  return global.__sessionCache;
};

/**
 * Get session from request headers (optimized for API routes)
 * This uses the same caching mechanism as middleware
 */
export async function getServerSession(req: NextRequest): Promise<Session | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const sessionToken = extractSessionToken(cookieHeader);
  const cacheKey = sessionToken || `anonymous-${req.ip || 'unknown'}`;
  
  const cache = getSessionCache();
  const cached = cache.get(cacheKey);
  
  // Return cached session if available and fresh (within 1 minute)
  if (cached && Date.now() - cached.timestamp < 60 * 1000) {
    return cached.session;
  }

  // If no cached session, try to get it from auth API
  try {
    const { auth } = await import("@/lib/better-auth/auth");
    const session = await auth.api.getSession({
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Cache the result
    cache.set(cacheKey, {
      session,
      timestamp: Date.now(),
    });

    return session;
  } catch (error) {
    console.warn("Failed to get server session:", error);
    return null;
  }
}

/**
 * Get session from Next.js API route context
 */
export async function getApiRouteSession(request: Request): Promise<Session | null> {
  try {
    const { auth } = await import("@/lib/better-auth/auth");
    return await auth.api.getSession({
      headers: Object.fromEntries(new Headers(request.headers).entries()),
    });
  } catch (error) {
    console.warn("Failed to get API route session:", error);
    return null;
  }
}

/**
 * Require authentication in API routes
 */
export async function requireAuth(request: Request): Promise<Session> {
  const session = await getApiRouteSession(request);
  
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  
  return session;
}

/**
 * Require admin role in API routes
 */
export async function requireAdmin(request: Request): Promise<Session> {
  const session = await requireAuth(request);
  
  if (session.user.role !== "admin") {
    throw new Error("Admin access required");
  }
  
  return session;
}

/**
 * Extract session token from cookie header
 */
function extractSessionToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Middleware to add session to API route context
 */
export function withAuth<T extends any[]>(
  handler: (session: Session | null, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const session = await getApiRouteSession(request);
      return await handler(session, ...args);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return new Response(
        JSON.stringify({
          title: "Authentication error",
          message: "Failed to verify authentication",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Middleware to require authentication in API routes
 */
export function withRequiredAuth<T extends any[]>(
  handler: (session: Session, ...args: T) => Promise<Response>
) {
  return withAuth(async (session: Session | null, ...args: T) => {
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          title: "Authentication required",
          message: "You must be signed in to access this resource",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return await handler(session, ...args);
  });
}

/**
 * Middleware to require admin role in API routes
 */
export function withRequiredAdmin<T extends any[]>(
  handler: (session: Session, ...args: T) => Promise<Response>
) {
  return withRequiredAuth(async (session: Session, ...args: T) => {
    if (session.user.role !== "admin") {
      return new Response(
        JSON.stringify({
          title: "Admin access required",
          message: "You must have admin privileges to access this resource",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return await handler(session, ...args);
  });
}
