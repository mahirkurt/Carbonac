/**
 * RippleButton Component
 * 
 * Button with Material-inspired ripple effect using Carbon motion tokens.
 * Implements Section 4.2.1 - Micro-interactions
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@carbon/react';
import { usePrefersReducedMotion } from '../../hooks';
import './RippleButton.scss';

/**
 * Calculate ripple position and size
 */
function calculateRipple(event, buttonElement) {
  const rect = buttonElement.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  
  const x = event.clientX - rect.left - (size / 2);
  const y = event.clientY - rect.top - (size / 2);
  
  return { x, y, size };
}

/**
 * RippleButton - Button with ripple effect
 */
export function RippleButton({
  children,
  onClick,
  disabled = false,
  className = '',
  kind = 'primary',
  size = 'md',
  rippleColor,
  ...props
}) {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Generate unique key for each ripple
  const rippleIdRef = useRef(0);

  const handleClick = useCallback((event) => {
    // Trigger original onClick
    if (onClick) {
      onClick(event);
    }

    // Skip ripple if reduced motion preferred
    if (prefersReducedMotion || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const { x, y, size } = calculateRipple(event, button);
    const id = rippleIdRef.current++;

    // Add new ripple
    setRipples(prev => [...prev, { id, x, y, size }]);

    // Remove ripple after animation (500ms = ripple duration)
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 500);
  }, [onClick, prefersReducedMotion, disabled]);

  const rippleStyle = rippleColor ? { '--ripple-color': rippleColor } : {};

  return (
    <Button
      ref={buttonRef}
      className={`ripple-button ${className}`}
      onClick={handleClick}
      disabled={disabled}
      kind={kind}
      size={size}
      style={rippleStyle}
      {...props}
    >
      <span className="ripple-button__content">{children}</span>
      
      {/* Ripple container */}
      <span className="ripple-button__ripple-container" aria-hidden="true">
        {ripples.map(({ id, x, y, size }) => (
          <span
            key={id}
            className="ripple-button__ripple"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        ))}
      </span>
    </Button>
  );
}

export default RippleButton;
