"use client";

import { useState, useEffect } from "react";

// Breakpoints matching Tailwind config
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Hook to detect current breakpoint
 * @returns object with boolean flags for each breakpoint (min-width based)
 */
export function useBreakpoint() {
  const isXs = useMediaQuery(`(min-width: ${breakpoints.xs}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints["2xl"]}px)`);

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    // Convenience helpers
    isMobile: !isMd, // < 768px
    isTablet: isMd && !isLg, // 768px - 1023px
    isDesktop: isLg, // >= 1024px
  };
}

/**
 * Hook to check if viewport is at or above a specific breakpoint
 * @param breakpoint - breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is at or above the breakpoint
 */
export function useMinWidth(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}

/**
 * Hook to check if viewport is below a specific breakpoint
 * @param breakpoint - breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is below the breakpoint
 */
export function useMaxWidth(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[breakpoint] - 1}px)`);
}
