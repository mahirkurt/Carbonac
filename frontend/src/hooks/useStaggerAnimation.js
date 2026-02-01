/**
 * useStaggerAnimation Hook
 * 
 * Coordinated stagger animations for lists and grids.
 * Implements Section 4.2 of CARBONAC-WEB-DESIGN.md
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Calculate stagger delay based on item index
 * @param {number} index - Item index
 * @param {number} totalItems - Total number of items
 * @param {number} totalDuration - Maximum total duration in ms
 * @returns {number} - Delay in ms
 */
export function calculateStaggerDelay(index, totalItems, totalDuration = 500) {
  // Cap at 500ms total duration
  const maxDelay = Math.min(totalDuration, 500);
  
  // Calculate delay per item (min 20ms, max 40ms)
  const delayPerItem = Math.min(40, Math.max(20, maxDelay / totalItems));
  
  return index * delayPerItem;
}

/**
 * Stagger animation hook for list items
 * @param {object} options - Configuration
 * @param {number} options.itemCount - Number of items to animate
 * @param {number} options.baseDelay - Base delay between items (20-40ms)
 * @param {number} options.staggerDelay - Delay multiplier
 * @param {boolean} options.triggerOnMount - Trigger on mount vs scroll
 * @returns {object} - Animation controls
 */
export function useStaggerAnimation({
  itemCount = 0,
  baseDelay = 30,
  staggerDelay = 30,
  triggerOnMount = false,
} = {}) {
  const [visibleItems, setVisibleItems] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timeoutRefs = useRef([]);

  // Intersection observer for scroll-triggered animation
  const { ref: containerRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Trigger animation
  const startAnimation = useCallback(() => {
    if (prefersReducedMotion) {
      // Show all items immediately if reduced motion
      setVisibleItems(Array.from({ length: itemCount }, (_, i) => i));
      return;
    }

    setIsAnimating(true);
    
    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    // Stagger each item
    for (let i = 0; i < itemCount; i++) {
      const delay = baseDelay + (i * staggerDelay);
      
      const timeoutId = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
        
        // Mark animation complete after last item
        if (i === itemCount - 1) {
          setTimeout(() => setIsAnimating(false), 240); // moderate-02 duration
        }
      }, delay);
      
      timeoutRefs.current.push(timeoutId);
    }
  }, [itemCount, baseDelay, staggerDelay, prefersReducedMotion]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setVisibleItems([]);
    setIsAnimating(false);
  }, []);

  // Trigger based on visibility or mount
  useEffect(() => {
    if (triggerOnMount) {
      startAnimation();
    } else if (isVisible) {
      startAnimation();
    }
  }, [isVisible, triggerOnMount, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Get animation props for an item
  const getItemProps = useCallback((index) => {
    const isItemVisible = visibleItems.includes(index);
    const delay = calculateStaggerDelay(index, itemCount);
    
    return {
      'data-stagger-index': index,
      'data-stagger-visible': isItemVisible,
      style: {
        opacity: isItemVisible ? 1 : 0,
        transform: isItemVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: prefersReducedMotion 
          ? 'none' 
          : `opacity 240ms cubic-bezier(0, 0, 0.3, 1), transform 240ms cubic-bezier(0, 0, 0.3, 1)`,
        transitionDelay: `${delay}ms`,
      },
    };
  }, [visibleItems, itemCount, prefersReducedMotion]);

  // Get CSS class for item visibility
  const getItemClassName = useCallback((index) => {
    return visibleItems.includes(index) ? 'stagger-visible' : 'stagger-hidden';
  }, [visibleItems]);

  return {
    containerRef,
    isAnimating,
    visibleItems,
    startAnimation,
    resetAnimation,
    getItemProps,
    getItemClassName,
    isAllVisible: visibleItems.length === itemCount,
  };
}

/**
 * Hook for page load sequence animation
 * Implements Section 4.3.1 - Entry Sequence
 */
export function usePageLoadSequence() {
  const [stage, setStage] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setStage(5); // Skip to final stage
      return;
    }

    const stages = [
      { delay: 0, stage: 1 },     // Background
      { delay: 50, stage: 2 },    // Navigation
      { delay: 100, stage: 3 },   // Title
      { delay: 150, stage: 4 },   // Primary content
      { delay: 200, stage: 5 },   // Secondary content
    ];

    const timeouts = stages.map(({ delay, stage: s }) => 
      setTimeout(() => setStage(s), delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  return {
    stage,
    isComplete: stage >= 5,
    isBackgroundVisible: stage >= 1,
    isNavVisible: stage >= 2,
    isTitleVisible: stage >= 3,
    isPrimaryVisible: stage >= 4,
    isSecondaryVisible: stage >= 5,
  };
}

export default useStaggerAnimation;
