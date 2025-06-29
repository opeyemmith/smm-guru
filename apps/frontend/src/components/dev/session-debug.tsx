"use client";

import { useEffect, useState } from "react";
import { useSessionContext } from "@/context/session-provider";

interface RequestLog {
  timestamp: number;
  url: string;
  method: string;
}

/**
 * Development-only component to monitor session API requests
 * Only shows in development mode
 */
export function SessionDebug() {
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { data, isPending } = useSessionContext();

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") return;

    // Intercept fetch requests to monitor session calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url] = args;
      const urlString = typeof url === "string" ? url : url.toString();
      
      // Log session-related requests
      if (urlString.includes("/api/auth/get-session")) {
        setRequests(prev => [
          ...prev.slice(-9), // Keep only last 10 requests
          {
            timestamp: Date.now(),
            url: urlString,
            method: "GET",
          }
        ]);
      }
      
      return originalFetch(...args);
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-mono"
      >
        Session Debug ({requests.length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-black text-green-400 p-4 rounded-md shadow-lg max-w-md font-mono text-xs">
          <div className="mb-2">
            <strong>Session Status:</strong> {isPending ? "Loading..." : data ? "Authenticated" : "Not authenticated"}
          </div>
          
          <div className="mb-2">
            <strong>Recent Session Requests:</strong>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="text-gray-400">No requests logged</div>
            ) : (
              requests.map((req, index) => (
                <div key={index} className="mb-1">
                  <div className="text-yellow-400">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-blue-400 truncate">
                    {req.method} {req.url}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setRequests([])}
            className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
