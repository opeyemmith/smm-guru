"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession as useBetterAuthSession } from "@/lib/better-auth/auth-client";
import { Session } from "@/lib/better-auth/type.auth";
import { useEffect } from "react";

/**
 * React Query-powered session hook with advanced caching
 * This provides better request deduplication and caching than the default useSession
 */
export function useSessionQuery() {
  const queryClient = useQueryClient();
  
  // Use Better Auth's session hook but with React Query caching
  const betterAuthSession = useBetterAuthSession();

  // Create a React Query for session data
  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: async (): Promise<Session | null> => {
      // Return the current session data from Better Auth
      return betterAuthSession.data || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    // Only enable query when Better Auth session is not pending
    enabled: !betterAuthSession.isPending,
  });

  // Update React Query cache when Better Auth session changes
  useEffect(() => {
    if (!betterAuthSession.isPending && betterAuthSession.data !== undefined) {
      queryClient.setQueryData(["auth-session"], betterAuthSession.data);
    }
  }, [betterAuthSession.data, betterAuthSession.isPending, queryClient]);

  return {
    data: sessionQuery.data || betterAuthSession.data,
    isPending: betterAuthSession.isPending || sessionQuery.isLoading,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error || betterAuthSession.error,
    refetch: () => {
      betterAuthSession.refetch?.();
      sessionQuery.refetch();
    },
  };
}

/**
 * Hook to invalidate session cache (useful after sign in/out)
 */
export function useInvalidateSession() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ["auth-session"] });
  };
}
