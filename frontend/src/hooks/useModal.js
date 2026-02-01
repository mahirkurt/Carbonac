/**
 * useModal Hook
 * 
 * Comprehensive modal management with:
 * - Open/close state
 * - Focus trapping
 * - Escape key handling
 * - Body scroll locking
 * - Return focus on close
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Modal state and controls
 * @param {object} options - Configuration options
 * @param {boolean} options.initialOpen - Initial open state
 * @param {function} options.onOpen - Callback when modal opens
 * @param {function} options.onClose - Callback when modal closes
 * @returns {object} - Modal controls and state
 */
export function useModal({
  initialOpen = false,
  onOpen,
  onClose,
} = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const previousActiveElement = useRef(null);

  // Open modal
  const open = useCallback(() => {
    // Store the currently focused element
    previousActiveElement.current = document.activeElement;
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    
    // Return focus to the previously focused element
    if (previousActiveElement.current && previousActiveElement.current.focus) {
      previousActiveElement.current.focus();
    }
  }, [onClose]);

  // Toggle modal
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Focus trap hook for modals
 * Keeps focus within a container element
 * 
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {boolean} isActive - Whether focus trap is active
 */
export function useFocusTrap(containerRef, isActive = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

/**
 * Click outside hook for modals
 * Calls callback when clicking outside the container
 * 
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {function} callback - Function to call on outside click
 * @param {boolean} isActive - Whether listener is active
 */
export function useClickOutside(containerRef, callback, isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        callback(event);
      }
    };

    // Use mousedown to capture the click before other handlers
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [containerRef, callback, isActive]);
}

export default useModal;
