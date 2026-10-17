"use client";

import { useEffect, useState } from "react";

/**
 * Reliable prefers-reduced-motion detection (framer's `useReducedMotion`
 * returned stale values in our environment). Defaults to `false` so the first
 * client render matches the server render, then syncs after mount.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
