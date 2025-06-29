"use client";

import { useEffect } from "react";

/**
 * Component to handle browser extension conflicts
 * Prevents wallet extensions from breaking the application
 */
export function ExtensionConflictHandler() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Handle ethereum property redefinition errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if it's an ethereum property redefinition error
      if (
        error instanceof TypeError &&
        error.message.includes('Cannot redefine property: ethereum')
      ) {
        console.warn('Extension conflict detected: ethereum property redefinition prevented');
        event.preventDefault();
        return false;
      }
    };

    // Add error listener
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
