"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the component has hydrated on the client.
 * Useful for components that depend on persisted state (localStorage)
 * to avoid hydration mismatches in Next.js.
 */
export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
