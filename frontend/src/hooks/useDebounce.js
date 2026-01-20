/**
 * useDebounce and useThrottle Hooks
 * 
 * Performance optimization utilities for limiting function execution frequency.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce a value - delays updating until value stops changing
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in ms
 * @returns {*} - Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param {function} callback - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {function} - Debounced function
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref on change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cancel function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return useMemo(() => ({
    callback: debouncedCallback,
    cancel,
  }), [debouncedCallback, cancel]);
}

/**
 * Throttle a value - limits update frequency
 * @param {*} value - Value to throttle
 * @param {number} interval - Minimum interval between updates in ms
 * @returns {*} - Throttled value
 */
export function useThrottle(value, interval = 100) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(handler);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Throttle a callback function
 * @param {function} callback - Function to throttle
 * @param {number} interval - Minimum interval between calls in ms
 * @returns {function} - Throttled function
 */
export function useThrottledCallback(callback, interval = 100) {
  const lastRun = useRef(0);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref on change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= interval) {
      lastRun.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callbackRef.current(...args);
      }, interval - timeSinceLastRun);
    }
  }, [interval]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Search input hook with debounced value
 * @param {string} initialValue - Initial search value
 * @param {number} delay - Debounce delay
 * @returns {object} - { value, debouncedValue, onChange, clear }
 */
export function useSearchInput(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const onChange = useCallback((e) => {
    const newValue = typeof e === 'string' ? e : e.target.value;
    setValue(newValue);
  }, []);

  const clear = useCallback(() => {
    setValue('');
  }, []);

  return {
    value,
    debouncedValue,
    onChange,
    clear,
    isEmpty: value.length === 0,
  };
}

export default useDebounce;
