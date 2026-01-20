/**
 * SkeletonLoader Component
 * 
 * Skeleton loading states for content placeholders.
 * Implements Carbon skeleton patterns with proper motion.
 */

import React from 'react';
import {
  SkeletonText,
  SkeletonPlaceholder,
} from '@carbon/react';
import './SkeletonLoader.scss';

/**
 * Card skeleton for loading state
 */
export function CardSkeleton({ 
  withImage = false,
  lines = 3,
  className = '' 
}) {
  return (
    <div className={`skeleton-card ${className}`}>
      {withImage && (
        <SkeletonPlaceholder className="skeleton-card__image" />
      )}
      <div className="skeleton-card__content">
        <SkeletonText heading width="60%" />
        <SkeletonText paragraph lineCount={lines} />
      </div>
    </div>
  );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ 
  withIcon = true,
  withAction = false,
  className = '' 
}) {
  return (
    <div className={`skeleton-list-item ${className}`}>
      {withIcon && (
        <SkeletonPlaceholder className="skeleton-list-item__icon" />
      )}
      <div className="skeleton-list-item__content">
        <SkeletonText width="80%" />
        <SkeletonText width="50%" />
      </div>
      {withAction && (
        <SkeletonPlaceholder className="skeleton-list-item__action" />
      )}
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ 
  columns = 4,
  className = '' 
}) {
  return (
    <tr className={`skeleton-table-row ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="skeleton-table-row__cell">
          <SkeletonText width={`${60 + Math.random() * 30}%`} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'skeleton-avatar--sm',
    md: 'skeleton-avatar--md',
    lg: 'skeleton-avatar--lg',
  };
  
  return (
    <SkeletonPlaceholder 
      className={`skeleton-avatar ${sizeClasses[size]} ${className}`} 
    />
  );
}

/**
 * Panel skeleton - full content area placeholder
 */
export function PanelSkeleton({ 
  withHeader = true,
  contentBlocks = 3,
  className = '' 
}) {
  return (
    <div className={`skeleton-panel ${className}`}>
      {withHeader && (
        <div className="skeleton-panel__header">
          <SkeletonText heading width="40%" />
          <SkeletonPlaceholder className="skeleton-panel__header-action" />
        </div>
      )}
      <div className="skeleton-panel__content">
        {Array.from({ length: contentBlocks }).map((_, i) => (
          <div key={i} className="skeleton-panel__block">
            <SkeletonText paragraph lineCount={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Editor skeleton
 */
export function EditorSkeleton({ className = '' }) {
  return (
    <div className={`skeleton-editor ${className}`}>
      <div className="skeleton-editor__toolbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPlaceholder 
            key={i} 
            className="skeleton-editor__toolbar-btn" 
          />
        ))}
      </div>
      <div className="skeleton-editor__content">
        <SkeletonText paragraph lineCount={8} />
      </div>
    </div>
  );
}

/**
 * Preview skeleton for PDF preview area
 */
export function PreviewSkeleton({ className = '' }) {
  return (
    <div className={`skeleton-preview ${className}`}>
      <SkeletonPlaceholder className="skeleton-preview__document" />
    </div>
  );
}

/**
 * Sidebar skeleton
 */
export function SidebarSkeleton({ 
  itemCount = 6,
  className = '' 
}) {
  return (
    <div className={`skeleton-sidebar ${className}`}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <ListItemSkeleton key={i} withIcon />
      ))}
    </div>
  );
}

/**
 * Main SkeletonLoader wrapper with animation control
 */
export function SkeletonLoader({ 
  isLoading = true,
  children,
  fallback,
  delay = 0,
  className = '',
}) {
  const [showSkeleton, setShowSkeleton] = React.useState(delay === 0);
  
  React.useEffect(() => {
    if (delay > 0 && isLoading) {
      const timer = setTimeout(() => setShowSkeleton(true), delay);
      return () => clearTimeout(timer);
    }
    if (!isLoading) {
      setShowSkeleton(false);
    }
  }, [isLoading, delay]);

  if (!isLoading) {
    return <>{children}</>;
  }

  if (!showSkeleton) {
    return null;
  }

  return (
    <div className={`skeleton-loader ${className}`} aria-busy="true" aria-live="polite">
      {fallback}
    </div>
  );
}

export default SkeletonLoader;
