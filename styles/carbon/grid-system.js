/**
 * IBM Carbon Design System - 2x Grid System
 * 16-column responsive grid with 5 breakpoints
 * @see https://carbondesignsystem.com/elements/2x-grid/usage/
 */

// Breakpoints (in pixels)
export const breakpoints = {
  sm: 320,    // Small (mobile)
  md: 672,    // Medium (tablet)
  lg: 1056,   // Large (desktop)
  xlg: 1312,  // Extra large
  max: 1584   // Maximum
};

// Breakpoint ranges
export const breakpointRanges = {
  sm: { min: 0, max: 671 },
  md: { min: 672, max: 1055 },
  lg: { min: 1056, max: 1311 },
  xlg: { min: 1312, max: 1583 },
  max: { min: 1584, max: Infinity }
};

// Grid columns
export const columns = 16;

// Gutter modes
export const gutterModes = {
  wide: {
    sm: '32px',
    md: '32px',
    lg: '32px',
    xlg: '32px',
    max: '32px'
  },
  narrow: {
    sm: '16px',
    md: '16px',
    lg: '16px',
    xlg: '16px',
    max: '16px'
  },
  condensed: {
    sm: '1px',
    md: '1px',
    lg: '1px',
    xlg: '1px',
    max: '1px'
  }
};

// Page margins
export const margins = {
  sm: '16px',
  md: '16px',
  lg: '16px',
  xlg: '16px',
  max: '24px'
};

// Container max widths
export const containerMaxWidths = {
  sm: '100%',
  md: '100%',
  lg: '100%',
  xlg: '100%',
  max: '1584px'
};

// Column spans (percentage-based)
export function calculateColumnWidth(span, totalColumns = 16) {
  return `${(span / totalColumns) * 100}%`;
}

// Grid configuration object
export const gridConfig = {
  // Default configuration
  columns: 16,
  gutter: '32px',
  margin: '16px',
  maxWidth: '1584px',

  // Responsive configurations
  responsive: {
    sm: {
      columns: 4,
      gutter: gutterModes.wide.sm,
      margin: margins.sm,
      maxWidth: containerMaxWidths.sm
    },
    md: {
      columns: 8,
      gutter: gutterModes.wide.md,
      margin: margins.md,
      maxWidth: containerMaxWidths.md
    },
    lg: {
      columns: 16,
      gutter: gutterModes.wide.lg,
      margin: margins.lg,
      maxWidth: containerMaxWidths.lg
    },
    xlg: {
      columns: 16,
      gutter: gutterModes.wide.xlg,
      margin: margins.xlg,
      maxWidth: containerMaxWidths.xlg
    },
    max: {
      columns: 16,
      gutter: gutterModes.wide.max,
      margin: margins.max,
      maxWidth: containerMaxWidths.max
    }
  }
};

// Aspect ratios (for content modules)
export const aspectRatios = {
  '1x1': { width: 1, height: 1 },
  '2x1': { width: 2, height: 1 },
  '2x3': { width: 2, height: 3 },
  '3x2': { width: 3, height: 2 },
  '4x3': { width: 4, height: 3 },
  '16x9': { width: 16, height: 9 },
  '9x16': { width: 9, height: 16 }
};

// Helper: Generate media query
export function mediaQuery(breakpoint, type = 'min') {
  const bp = breakpoints[breakpoint];
  if (!bp) return '';

  if (type === 'min') {
    return `@media (min-width: ${bp}px)`;
  } else if (type === 'max') {
    return `@media (max-width: ${bp - 1}px)`;
  } else if (type === 'only') {
    const range = breakpointRanges[breakpoint];
    return `@media (min-width: ${range.min}px) and (max-width: ${range.max}px)`;
  }

  return '';
}

// Helper: Calculate column span
export function columnSpan(span, gutterMode = 'wide') {
  const gutter = gutterModes[gutterMode]?.lg || '32px';
  const width = calculateColumnWidth(span);

  return {
    width,
    marginRight: gutter,
    marginLeft: gutter
  };
}

// Helper: Generate grid CSS
export function generateGridCSS(options = {}) {
  const {
    columns = 16,
    gutter = '32px',
    margin = '16px',
    maxWidth = '1584px'
  } = options;

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gutter,
    padding: `0 ${margin}`,
    maxWidth: maxWidth,
    margin: '0 auto'
  };
}

// Helper: Generate column CSS
export function generateColumnCSS(span, offset = 0) {
  return {
    gridColumn: `${offset + 1} / span ${span}`
  };
}

// Layout modules (common grid patterns)
export const layoutModules = {
  // Full width
  fullWidth: {
    sm: 4,
    md: 8,
    lg: 16,
    xlg: 16,
    max: 16
  },

  // Three quarters
  threeQuarters: {
    sm: 4,
    md: 6,
    lg: 12,
    xlg: 12,
    max: 12
  },

  // Two thirds
  twoThirds: {
    sm: 4,
    md: 5,
    lg: 10,
    xlg: 10,
    max: 10
  },

  // Half
  half: {
    sm: 4,
    md: 4,
    lg: 8,
    xlg: 8,
    max: 8
  },

  // One third
  oneThird: {
    sm: 4,
    md: 3,
    lg: 5,
    xlg: 5,
    max: 5
  },

  // One quarter
  oneQuarter: {
    sm: 4,
    md: 2,
    lg: 4,
    xlg: 4,
    max: 4
  },

  // Sidebar + content
  sidebarLeft: {
    sidebar: {
      sm: 4,
      md: 2,
      lg: 4,
      xlg: 4,
      max: 4
    },
    content: {
      sm: 4,
      md: 6,
      lg: 12,
      xlg: 12,
      max: 12
    }
  },

  // Content + sidebar
  sidebarRight: {
    content: {
      sm: 4,
      md: 6,
      lg: 12,
      xlg: 12,
      max: 12
    },
    sidebar: {
      sm: 4,
      md: 2,
      lg: 4,
      xlg: 4,
      max: 4
    }
  },

  // Three column layout
  threeColumn: {
    left: {
      sm: 4,
      md: 2,
      lg: 4,
      xlg: 4,
      max: 4
    },
    center: {
      sm: 4,
      md: 4,
      lg: 8,
      xlg: 8,
      max: 8
    },
    right: {
      sm: 4,
      md: 2,
      lg: 4,
      xlg: 4,
      max: 4
    }
  }
};

// Helper: Get responsive column span
export function getResponsiveSpan(module, breakpoint) {
  return layoutModules[module]?.[breakpoint] || layoutModules.fullWidth[breakpoint];
}

// Helper: Check if breakpoint is active
export function isBreakpointActive(breakpoint, width) {
  const range = breakpointRanges[breakpoint];
  return width >= range.min && width <= range.max;
}

// Helper: Get current breakpoint
export function getCurrentBreakpoint(width) {
  if (width >= breakpoints.max) return 'max';
  if (width >= breakpoints.xlg) return 'xlg';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}

// Export all
export default {
  breakpoints,
  breakpointRanges,
  columns,
  gutterModes,
  margins,
  containerMaxWidths,
  gridConfig,
  aspectRatios,
  layoutModules,
  calculateColumnWidth,
  mediaQuery,
  columnSpan,
  generateGridCSS,
  generateColumnCSS,
  getResponsiveSpan,
  isBreakpointActive,
  getCurrentBreakpoint
};
