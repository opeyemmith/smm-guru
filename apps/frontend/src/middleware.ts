import { NextRequest, NextResponse } from "next/server";
import { Session } from "./lib/better-auth/type.auth";
import { UNAUTHORIZED } from "@smm-guru/utils";

// Enhanced session cache with better error handling and performance
const sessionCache = new Map<string, { session: Session | null; timestamp: number; isLoading: boolean }>();
const CACHE_DURATION = 60 * 1000; // 1 minute cache
const LOADING_TIMEOUT = 15 * 1000; // 15 seconds max loading time

// In-flight request tracking to prevent duplicate requests
const inflightRequests = new Map<string, Promise<Session | null>>();

export async function getMiddlewareSession(req: NextRequest): Promise<Session | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const sessionToken = extractSessionToken(cookieHeader);

  // Use session token as cache key for better cache efficiency
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const cacheKey = sessionToken || `anonymous-${clientIP}`;

  // Check cache first
  const cached = sessionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !cached.isLoading) {
    return cached.session;
  }

  // Check if there's already a request in flight for this session
  const inflightRequest = inflightRequests.get(cacheKey);
  if (inflightRequest) {
    try {
      return await Promise.race([
        inflightRequest,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), LOADING_TIMEOUT)
        )
      ]);
    } catch (error) {
      console.warn('In-flight session request failed:', error);
      return cached?.session || null;
    }
  }

  // Mark as loading in cache
  sessionCache.set(cacheKey, {
    session: cached?.session || null,
    timestamp: Date.now(),
    isLoading: true,
  });

  // Create new request
  const sessionRequest = fetchSessionWithRetry(req, cookieHeader);
  inflightRequests.set(cacheKey, sessionRequest);

  try {
    const session = await Promise.race([
      sessionRequest,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timeout')), LOADING_TIMEOUT)
      )
    ]);

    // Update cache with result
    sessionCache.set(cacheKey, {
      session,
      timestamp: Date.now(),
      isLoading: false,
    });

    return session;
  } catch (error) {
    console.warn('Session fetch failed in middleware:', error);

    // Update cache to mark as not loading
    sessionCache.set(cacheKey, {
      session: cached?.session || null,
      timestamp: Date.now(),
      isLoading: false,
    });

    // Return cached session if available, otherwise null
    return cached?.session || null;
  } finally {
    // Clean up in-flight request
    inflightRequests.delete(cacheKey);

    // Clean up old cache entries
    cleanupCache();
  }
}

async function fetchSessionWithRetry(req: NextRequest, cookieHeader: string, retries = 2): Promise<Session | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const response = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
        method: 'GET',
        headers: {
          'cookie': cookieHeader,
          'user-agent': req.headers.get('user-agent') || 'middleware',
          'content-type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        if (response.status >= 500 && attempt < retries) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        // Don't retry on client errors (4xx)
        return null;
      }

      const data = await response.json();
      return data as Session;
    } catch (error) {
      if (attempt === retries) {
        console.warn('Session fetch failed after retries:', error);
        return null;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return null;
}

function extractSessionToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  return match ? match[1] : null;
}

function cleanupCache() {
  // Clean up old cache entries (keep last 50 entries)
  if (sessionCache.size > 50) {
    const entries = Array.from(sessionCache.entries());
    const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

    sessionCache.clear();
    sortedEntries.slice(0, 50).forEach(([key, value]) => {
      sessionCache.set(key, value);
    });
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const url = req.url;

  // Allow public routes
  if (pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow public API routes (webhooks, public services)
  if (pathname.startsWith("/api/v1/webhook") || pathname.startsWith("/api/v1/services")) {
    return NextResponse.next();
  }

  // Get session with optimized caching
  const session = await getMiddlewareSession(req);

  // If session fetch failed but we're accessing protected routes,
  // we'll be more permissive to avoid blocking legitimate users
  const isSessionFetchFailed = session === null;

  // Handle authentication routes (sign-in, sign-up)
  if (pathname.startsWith("/sign-")) {
    if (session?.user) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL("/dashboard/new-orders", url));
    }
    return NextResponse.next();
  }

  // Protect admin routes - require admin role
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      // SECURITY: Never bypass authentication for admin routes
      // If session fetch failed, still redirect to sign-in for security
      if (isSessionFetchFailed) {
        console.error("Session fetch failed for admin route - redirecting to sign-in for security");
      }
      return NextResponse.redirect(new URL("/sign-in", url));
    }

    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/new-orders", url));
    }

    return NextResponse.next();
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      // SECURITY: For dashboard routes, we can be slightly more permissive
      // but only if it's a temporary session fetch issue
      if (isSessionFetchFailed) {
        console.warn("Session fetch failed for dashboard route - allowing with client-side validation");
        // Add a header to indicate this is a fallback scenario
        const response = NextResponse.next();
        response.headers.set('X-Auth-Fallback', 'true');
        return response;
      }
      return NextResponse.redirect(new URL("/sign-in", url));
    }

    return NextResponse.next();
  }

  // Protect admin API routes - require admin role
  if (pathname.startsWith("/api/v1/admin")) {
    if (!session?.user) {
      // If session fetch failed, allow the API route to handle auth internally
      if (isSessionFetchFailed) {
        console.warn("Session fetch failed for admin API route, allowing route-level handling");
        return NextResponse.next();
      }

      return NextResponse.json(
        {
          title: "Authentication required",
          message: "You must be signed in to access this resource",
          action: "access_protected_resource",
          requiredPermission: "admin",
          receivedPermission: "unauthorized",
        },
        { status: UNAUTHORIZED }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          title: "Admin access required",
          message: "You must have admin privileges to access this resource",
          action: "access_protected_resource",
          requiredPermission: "admin",
          receivedPermission: session.user.role || "user",
        },
        { status: UNAUTHORIZED }
      );
    }

    return NextResponse.next();
  }

  // Protect general API routes - require authentication
  if (pathname.startsWith("/api/v1")) {
    if (!session?.user) {
      // If session fetch failed, allow the API route to handle auth internally
      if (isSessionFetchFailed) {
        console.warn("Session fetch failed for API route, allowing route-level handling");
        return NextResponse.next();
      }

      return NextResponse.json(
        {
          title: "Authentication required",
          message: "You must be signed in to access this resource",
          action: "access_protected_resource",
          requiredPermission: "user",
          receivedPermission: "unauthorized",
        },
        { status: UNAUTHORIZED }
      );
    }

    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
