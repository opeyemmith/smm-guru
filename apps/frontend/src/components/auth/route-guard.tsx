"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@/context/session-provider";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
  fallbackPath?: string;
}

/**
 * Client-side route guard that works with our session context
 * This provides a fallback when middleware session checking fails
 */
export function RouteGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  allowedRoles = [],
  fallbackPath = "/sign-in",
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSessionContext();

  useEffect(() => {
    // Don't redirect while session is loading
    if (isPending) return;

    // Check authentication requirement
    if (requireAuth && !session?.user) {
      console.warn("Client-side auth guard: redirecting unauthenticated user");
      router.push(fallbackPath);
      return;
    }

    // Check admin requirement
    if (requireAdmin && session?.user?.role !== "admin") {
      console.warn("Client-side auth guard: redirecting non-admin user");
      router.push("/dashboard/new-orders");
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && session?.user) {
      const userRole = session.user.role || "user";
      if (!allowedRoles.includes(userRole)) {
        console.warn(`Client-side auth guard: user role ${userRole} not in allowed roles`);
        router.push("/dashboard/new-orders");
        return;
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/sign-") && session?.user) {
      router.push("/dashboard/new-orders");
      return;
    }
  }, [session, isPending, requireAuth, requireAdmin, allowedRoles, router, pathname, fallbackPath]);

  // Show loading skeleton while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !session?.user) {
    return null;
  }

  if (requireAdmin && session?.user?.role !== "admin") {
    return null;
  }

  if (allowedRoles.length > 0 && session?.user) {
    const userRole = session.user.role || "user";
    if (!allowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, "children">
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthGuard() {
  const { data: session, isPending } = useSessionContext();
  
  return {
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.role === "admin",
    user: session?.user || null,
    isLoading: isPending,
    hasRole: (role: string) => session?.user?.role === role,
    hasAnyRole: (roles: string[]) => {
      const userRole = session?.user?.role || "user";
      return roles.includes(userRole);
    },
  };
}
