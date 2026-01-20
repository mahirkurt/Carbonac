/**
 * SkipLink Component
 * 
 * Accessibility skip link for keyboard navigation.
 * Visible only on focus, allows users to skip to main content.
 */

import React from 'react';

function SkipLink({ 
  targetId = 'main-content', 
  children = 'Ana içeriğe geç' 
}) {
  const handleClick = (event) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default SkipLink;
