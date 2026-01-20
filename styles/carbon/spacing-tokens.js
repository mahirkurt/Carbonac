/**
 * IBM Carbon Design System - Spacing Tokens
 * Based on 8px base unit
 * @see https://carbondesignsystem.com/elements/spacing/overview/
 */

// Base unit: 8px
export const baseUnit = 8;

// Spacing Scale (rem values)
export const spacing = {
  '01': '0.125rem',  // 2px
  '02': '0.25rem',   // 4px
  '03': '0.5rem',    // 8px  - Base unit
  '04': '0.75rem',   // 12px
  '05': '1rem',      // 16px
  '06': '1.5rem',    // 24px
  '07': '2rem',      // 32px
  '08': '2.5rem',    // 40px
  '09': '3rem',      // 48px
  '10': '4rem',      // 64px
  '11': '5rem',      // 80px
  '12': '6rem',      // 96px
  '13': '10rem'      // 160px
};

// Spacing Scale (pixel values)
export const spacingPx = {
  '01': 2,
  '02': 4,
  '03': 8,
  '04': 12,
  '05': 16,
  '06': 24,
  '07': 32,
  '08': 40,
  '09': 48,
  '10': 64,
  '11': 80,
  '12': 96,
  '13': 160
};

// Fluid Spacing (responsive spacing)
export const fluidSpacing = {
  '01': {
    min: '0.125rem',    // 2px
    max: '0.125rem',    // 2px
    preferred: '0vw'
  },
  '02': {
    min: '0.25rem',     // 4px
    max: '0.25rem',     // 4px
    preferred: '0vw'
  },
  '03': {
    min: '0.5rem',      // 8px
    max: '0.5rem',      // 8px
    preferred: '0vw'
  },
  '04': {
    min: '0.75rem',     // 12px
    max: '1rem',        // 16px
    preferred: '0.5vw'
  },
  '05': {
    min: '1rem',        // 16px
    max: '1.5rem',      // 24px
    preferred: '1vw'
  },
  '06': {
    min: '1.5rem',      // 24px
    max: '2rem',        // 32px
    preferred: '1.5vw'
  },
  '07': {
    min: '2rem',        // 32px
    max: '2.5rem',      // 40px
    preferred: '2vw'
  },
  '08': {
    min: '2.5rem',      // 40px
    max: '3rem',        // 48px
    preferred: '2.5vw'
  },
  '09': {
    min: '3rem',        // 48px
    max: '4rem',        // 64px
    preferred: '3vw'
  },
  '10': {
    min: '4rem',        // 64px
    max: '5rem',        // 80px
    preferred: '4vw'
  },
  '11': {
    min: '5rem',        // 80px
    max: '6rem',        // 96px
    preferred: '5vw'
  },
  '12': {
    min: '6rem',        // 96px
    max: '8rem',        // 128px
    preferred: '6vw'
  },
  '13': {
    min: '10rem',       // 160px
    max: '12rem',       // 192px
    preferred: '10vw'
  }
};

// Layout spacing (common patterns)
export const layoutSpacing = {
  // Component internal spacing
  componentPaddingSmall: spacing['03'],    // 8px
  componentPaddingMedium: spacing['05'],   // 16px
  componentPaddingLarge: spacing['07'],    // 32px

  // Component external spacing
  componentMarginSmall: spacing['05'],     // 16px
  componentMarginMedium: spacing['07'],    // 32px
  componentMarginLarge: spacing['09'],     // 48px

  // Section spacing
  sectionSpacingSmall: spacing['07'],      // 32px
  sectionSpacingMedium: spacing['09'],     // 48px
  sectionSpacingLarge: spacing['12'],      // 96px

  // Container padding
  containerPaddingMobile: spacing['05'],   // 16px
  containerPaddingTablet: spacing['06'],   // 24px
  containerPaddingDesktop: spacing['07'],  // 32px

  // Grid gaps
  gridGapSmall: spacing['03'],             // 8px
  gridGapMedium: spacing['05'],            // 16px
  gridGapLarge: spacing['07'],             // 32px

  // List spacing
  listItemSpacing: spacing['04'],          // 12px
  listSpacing: spacing['06']               // 24px
};

// Vertical rhythm (for typography)
export const verticalRhythm = {
  paragraphSpacing: spacing['06'],         // 24px
  headingMarginTop: spacing['09'],         // 48px
  headingMarginBottom: spacing['05'],      // 16px
  listMarginBottom: spacing['06'],         // 24px
  blockquoteMargin: spacing['07'],         // 32px
  codeBlockMargin: spacing['06'],          // 24px
  tableMargin: spacing['07'],              // 32px
  figureMargin: spacing['08']              // 40px
};

// Container widths (from 2x grid)
export const containerWidths = {
  sm: '20rem',      // 320px
  md: '42rem',      // 672px
  lg: '66rem',      // 1056px
  xlg: '82rem',     // 1312px
  max: '99rem'      // 1584px
};

// Helper function to get spacing value
export function getSpacing(token) {
  return spacing[token] || spacing['05'];
}

// Helper function to get pixel value
export function getSpacingPx(token) {
  return spacingPx[token] || 16;
}

// Helper function to calculate custom spacing
export function calculateSpacing(multiplier) {
  return `${multiplier * 0.5}rem`; // multiplier * 8px
}

// Helper function for fluid spacing
export function getFluidSpacing(token) {
  const fluid = fluidSpacing[token];
  if (!fluid) return spacing[token];

  return `clamp(${fluid.min}, ${fluid.preferred}, ${fluid.max})`;
}

// Margin/Padding utilities generator
export function generateSpacingUtilities() {
  const utilities = {};

  Object.keys(spacing).forEach(token => {
    utilities[`spacing-${token}`] = {
      margin: spacing[token],
      padding: spacing[token]
    };

    utilities[`margin-${token}`] = spacing[token];
    utilities[`padding-${token}`] = spacing[token];

    utilities[`margin-top-${token}`] = spacing[token];
    utilities[`margin-bottom-${token}`] = spacing[token];
    utilities[`margin-left-${token}`] = spacing[token];
    utilities[`margin-right-${token}`] = spacing[token];

    utilities[`padding-top-${token}`] = spacing[token];
    utilities[`padding-bottom-${token}`] = spacing[token];
    utilities[`padding-left-${token}`] = spacing[token];
    utilities[`padding-right-${token}`] = spacing[token];
  });

  return utilities;
}

// Export all
export default {
  baseUnit,
  spacing,
  spacingPx,
  fluidSpacing,
  layoutSpacing,
  verticalRhythm,
  containerWidths,
  getSpacing,
  getSpacingPx,
  calculateSpacing,
  getFluidSpacing,
  generateSpacingUtilities
};
