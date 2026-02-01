/**
 * useIntersectionObserver Hook
 * 
 * Lazy loading and animation triggering with Intersection Observer API.
 * Used for viewport-based animations and lazy content loading.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Intersection Observer hook for detecting element visibility
 * @param {object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Root margin
 * @param {boolean} options.triggerOnce - Only trigger once
 * @param {boolean} options.freezeOnceVisible - Freeze state once visible
 * @returns {object} - { ref, isVisible, entry }
 */
export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false,
  freezeOnceVisible = false,
} = {}) {
  const [entry, setEntry] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const frozen = useRef(false);

  const updateEntry = useCallback(([newEntry]) => {
    setEntry(newEntry);
    
    const visible = newEntry.isIntersecting;
    
    if (freezeOnceVisible && visible) {
      frozen.current = true;
    }
    
    if (!frozen.current) {
      setIsVisible(visible);
    }
  }, [freezeOnceVisible]);

  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || typeof IntersectionObserver !== 'function') {
      return;
    }

    // Don't observe if already frozen
    if (frozen.current) return;

    const observer = new IntersectionObserver(updateEntry, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, updateEntry, triggerOnce]);

  // Disconnect after first trigger if triggerOnce is true
  useEffect(() => {
    if (triggerOnce && isVisible) {
      frozen.current = true;
    }
  }, [triggerOnce, isVisible]);

  return {
    ref: elementRef,
    isVisible,
    entry,
  };
}

/**
 * Hook for lazy loading images and content
 * @param {string} src - Image source URL
 * @param {object} options - Intersection observer options
 * @returns {object} - { ref, isLoaded, currentSrc }
 */
export function useLazyLoad(src, options = {}) {
  const { ref, isVisible } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: '200px',
    ...options,
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isVisible, src]);

  return {
    ref,
    isLoaded,
    currentSrc,
    isVisible,
  };
}

/**
 * Hook for triggering animations when element enters viewport
 * @param {object} options - Options
 * @returns {object} - { ref, shouldAnimate, hasAnimated }
 */
export function useAnimateOnScroll(options = {}) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
    ...options,
  });
  
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isVisible, hasAnimated]);

  return {
    ref,
    shouldAnimate: isVisible,
    hasAnimated,
  };
}

export default useIntersectionObserver;
