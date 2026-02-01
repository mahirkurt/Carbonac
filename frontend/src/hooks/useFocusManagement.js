/**
 * useFocusManagement Hook
 * 
 * Comprehensive focus management utilities for accessibility:
 * - Focus indicators
 * - Focus restoration
 * - Skip link management
 * - Roving tabindex
 */

import { useRef, useCallback, useEffect } from 'react';

const useFocusManagement = () => ({
  useFocusRestoration,
  useRovingTabIndex,
  useSkipLink,
  useFocusVisible,
  useAnnounce,
});

/**
 * Focus restoration hook
 * Stores and restores focus when a component mounts/unmounts
 * 
 * @param {boolean} shouldRestore - Whether to restore focus on unmount
 * @returns {object} - Focus controls
 */
export function useFocusRestoration(shouldRestore = true) {
  const previousElement = useRef(null);

  // Store current focus
  const storeFocus = useCallback(() => {
    previousElement.current = document.activeElement;
  }, []);

  // Restore focus
  const restoreFocus = useCallback(() => {
    if (previousElement.current && previousElement.current.focus) {
      previousElement.current.focus();
    }
  }, []);

  // Automatically restore focus on unmount
  useEffect(() => {
    storeFocus();
    
    return () => {
      if (shouldRestore) {
        restoreFocus();
      }
    };
  }, [shouldRestore, storeFocus, restoreFocus]);

  return {
    storeFocus,
    restoreFocus,
    previousElement,
  };
}

/**
 * Roving tabindex hook
 * Manages focus within a group of elements using arrow keys
 * 
 * @param {object} options - Configuration options
 * @param {number} options.itemCount - Number of items in the group
 * @param {string} options.orientation - 'horizontal' | 'vertical' | 'both'
 * @param {boolean} options.loop - Whether to loop at boundaries
 * @returns {object} - Focus controls and current index
 */
export function useRovingTabIndex({
  itemCount,
  orientation = 'horizontal',
  loop = true,
} = {}) {
  const currentIndex = useRef(0);
  const itemRefs = useRef([]);

  // Set ref for an item
  const setItemRef = useCallback((index) => (element) => {
    itemRefs.current[index] = element;
  }, []);

  // Focus an item by index
  const focusItem = useCallback((index) => {
    const element = itemRefs.current[index];
    if (element && element.focus) {
      element.focus();
      currentIndex.current = index;
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    let nextIndex = currentIndex.current;

    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    if ((key === 'ArrowRight' && isHorizontal) || (key === 'ArrowDown' && isVertical)) {
      event.preventDefault();
      nextIndex = currentIndex.current + 1;
      if (nextIndex >= itemCount) {
        nextIndex = loop ? 0 : itemCount - 1;
      }
    } else if ((key === 'ArrowLeft' && isHorizontal) || (key === 'ArrowUp' && isVertical)) {
      event.preventDefault();
      nextIndex = currentIndex.current - 1;
      if (nextIndex < 0) {
        nextIndex = loop ? itemCount - 1 : 0;
      }
    } else if (key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (key === 'End') {
      event.preventDefault();
      nextIndex = itemCount - 1;
    }

    if (nextIndex !== currentIndex.current) {
      focusItem(nextIndex);
    }
  }, [itemCount, orientation, loop, focusItem]);

  // Get props for an item
  const getItemProps = useCallback((index) => ({
    ref: setItemRef(index),
    tabIndex: index === currentIndex.current ? 0 : -1,
    onKeyDown: handleKeyDown,
    onFocus: () => {
      currentIndex.current = index;
    },
  }), [setItemRef, handleKeyDown]);

  return {
    currentIndex: currentIndex.current,
    focusItem,
    getItemProps,
  };
}

/**
 * Skip link hook
 * Creates and manages skip links for keyboard navigation
 * 
 * @param {string} targetId - ID of the target element to skip to
 * @param {string} label - Label for the skip link
 * @returns {object} - Skip link props and target props
 */
export function useSkipLink(targetId, label = 'Ana içeriğe geç') {
  const targetRef = useRef(null);

  // Focus the target element
  const skipToTarget = useCallback((event) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  // Props for the skip link
  const skipLinkProps = {
    href: `#${targetId}`,
    onClick: skipToTarget,
    className: 'skip-link',
    children: label,
  };

  // Props for the target element
  const targetProps = {
    id: targetId,
    tabIndex: -1,
    ref: targetRef,
  };

  return {
    skipLinkProps,
    targetProps,
  };
}

/**
 * Focus visible hook
 * Tracks whether focus should be visible (keyboard vs mouse)
 * 
 * @returns {boolean} - Whether focus indicators should be visible
 */
export function useFocusVisible() {
  const hadKeyboardEvent = useRef(false);
  const hadFocusVisibleRecently = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.altKey || event.ctrlKey) return;
      hadKeyboardEvent.current = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEvent.current = false;
    };

    const handleFocus = () => {
      if (hadKeyboardEvent.current) {
        hadFocusVisibleRecently.current = true;
      }
    };

    const handleBlur = () => {
      hadFocusVisibleRecently.current = false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return hadFocusVisibleRecently.current;
}

/**
 * Announce to screen readers hook
 * Uses aria-live regions to announce messages
 * 
 * @param {string} politeness - 'polite' | 'assertive'
 * @returns {function} - Announce function
 */
export function useAnnounce(politeness = 'polite') {
  const announce = useCallback((message) => {
    // Find or create the announcer element
    let announcer = document.getElementById(`announcer-${politeness}`);
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = `announcer-${politeness}`;
      announcer.setAttribute('aria-live', politeness);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'visually-hidden';
      document.body.appendChild(announcer);
    }

    // Clear and set the message
    announcer.textContent = '';
    
    // Use setTimeout to ensure the DOM updates
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }, [politeness]);

  return announce;
}

export default useFocusManagement;
