/**
 * useMediaQuery Hook
 * 
 * Reactive media query hook with SSR support.
 * Uses matchMedia API to detect viewport changes.
 */

import { useState, useEffect, useCallback } from 'react';

// Carbon Design System breakpoints
export const BREAKPOINTS = {
  sm: 320,
  md: 672,
  lg: 1056,
  xlg: 1312,
  max: 1584,
};

/**
 * Check if a media query matches
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the query matches
 */
export function useMediaQuery(query) {
  // SSR support - default to false
  const getMatches = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  }, [query]);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener
    const handler = (event) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query, getMatches]);

  return matches;
}

/**
 * Check if viewport is at or above a breakpoint
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xlg, max)
 * @returns {boolean}
 */
export function useBreakpoint(breakpoint) {
  const width = BREAKPOINTS[breakpoint] || breakpoint;
  return useMediaQuery(`(min-width: ${width}px)`);
}

/**
 * Check if viewport is below a breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean}
 */
export function useBreakpointDown(breakpoint) {
  const width = BREAKPOINTS[breakpoint] || breakpoint;
  return useMediaQuery(`(max-width: ${width - 1}px)`);
}

/**
 * Get current breakpoint name
 * @returns {string} - Current breakpoint (sm, md, lg, xlg, max)
 */
export function useCurrentBreakpoint() {
  const isMax = useBreakpoint('max');
  const isXlg = useBreakpoint('xlg');
  const isLg = useBreakpoint('lg');
  const isMd = useBreakpoint('md');

  if (isMax) return 'max';
  if (isXlg) return 'xlg';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  return 'sm';
}

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export function useIsMobile() {
  return useBreakpointDown('md');
}

/**
 * Check if device is tablet
 * @returns {boolean}
 */
export function useIsTablet() {
  const isMd = useBreakpoint('md');
  const isLg = useBreakpointDown('lg');
  return isMd && isLg;
}

/**
 * Check if device is desktop
 * @returns {boolean}
 */
export function useIsDesktop() {
  return useBreakpoint('lg');
}

export default useMediaQuery;
