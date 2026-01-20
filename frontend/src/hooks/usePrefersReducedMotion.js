/**
 * usePrefersReducedMotion Hook
 * 
 * Detects user's motion preference for accessibility.
 * Returns true if user prefers reduced motion.
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - True if reduced motion is preferred
 */
export function usePrefersReducedMotion() {
  // SSR support - default to false (no preference)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(QUERY).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(QUERY);
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Create listener
    const handler = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on motion preference
 * Returns 0 if reduced motion is preferred, otherwise returns the provided duration
 * 
 * @param {number} duration - Animation duration in ms
 * @returns {number} - Adjusted duration
 */
export function useAnimationDuration(duration) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return prefersReducedMotion ? 0 : duration;
}

/**
 * Get motion-safe CSS properties
 * Returns animation props only if user doesn't prefer reduced motion
 * 
 * @param {object} motionProps - CSS animation/transition properties
 * @param {object} fallbackProps - Fallback properties for reduced motion
 * @returns {object} - Appropriate CSS properties
 */
export function useMotionSafeProps(motionProps, fallbackProps = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return prefersReducedMotion ? fallbackProps : motionProps;
}

export default usePrefersReducedMotion;
