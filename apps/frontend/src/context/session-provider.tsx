"use client";

import React, { createContext, useContext } from "react";
import { useSessionQuery } from "@/hooks/use-session-query";
import { Session } from "@/lib/better-auth/type.auth";

interface SessionContextType {
  data: Session | null;
  isPending: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Use React Query-powered session hook for better caching
  const { data, isPending, isLoading, error, refetch } = useSessionQuery();

  const contextValue: SessionContextType = {
    data,
    isPending,
    isLoading,
    error: error as Error | null,
    refetch,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Custom hook to use session data from context
 * This replaces direct useSession calls throughout the app
 */
export function useSessionContext(): SessionContextType {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  
  return context;
}

/**
 * Hook for components that need session data but can handle loading states
 */
export function useOptionalSession() {
  const context = useContext(SessionContext);
  return context || {
    data: null,
    isPending: true,
    isLoading: true,
    error: null,
    refetch: () => {},
  };
}
