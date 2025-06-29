import { useEffect, useState } from "react";

/**
 * Hook to prevent hydration mismatches by ensuring consistent server/client rendering
 * Returns false during SSR and initial client render, true after hydration
 */
export function useMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
