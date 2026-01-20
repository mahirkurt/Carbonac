import * as colors from '@carbon/colors';
import * as themes from '@carbon/themes';

// IBM Carbon Design System Theme Configuration
export const carbonTheme = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: colors.blue60,
    primaryHover: colors.blue70,
    primaryActive: colors.blue80,

    // Secondary Colors
    secondary: colors.gray60,
    secondaryHover: colors.gray70,
    secondaryActive: colors.gray80,

    // UI Colors
    uiBackground: colors.white,
    ui01: colors.gray10,
    ui02: colors.gray20,
    ui03: colors.gray30,
    ui04: colors.gray50,
    ui05: colors.gray100,

    // Text Colors
    textPrimary: colors.gray100,
    textSecondary: colors.gray70,
    textHelper: colors.gray60,
    textError: colors.red60,
    textSuccess: colors.green60,
    textWarning: colors.yellow30,

    // Interactive Colors
    interactive: colors.blue60,
    danger: colors.red60,
    success: colors.green60,
    warning: colors.yellow30,

    // Borders
    border01: colors.gray20,
    border02: colors.gray30,
    border03: colors.gray50,

    // Code Highlighting
    code: {
      background: colors.gray10,
      text: colors.blue70,
      comment: colors.gray60,
      keyword: colors.purple60,
      string: colors.green60,
      function: colors.blue60,
      variable: colors.cyan60,
    }
  },

  // Typography - IBM Plex Font Families
  typography: {
    fontFamily: {
      sans: 'IBM Plex Sans, system-ui, -apple-system, sans-serif',
      serif: 'IBM Plex Serif, Georgia, serif',
      mono: 'IBM Plex Mono, Menlo, monospace',
    },

    // Type Scale
    scale: {
      h1: {
        fontSize: '3.5rem',      // 56px
        fontWeight: 300,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
      },
      h2: {
        fontSize: '2.625rem',    // 42px
        fontWeight: 300,
        lineHeight: 1.25,
        letterSpacing: '-0.005em',
      },
      h3: {
        fontSize: '2rem',        // 32px
        fontWeight: 400,
        lineHeight: 1.25,
        letterSpacing: '0em',
      },
      h4: {
        fontSize: '1.75rem',     // 28px
        fontWeight: 400,
        lineHeight: 1.29,
        letterSpacing: '0em',
      },
      h5: {
        fontSize: '1.5rem',      // 24px
        fontWeight: 400,
        lineHeight: 1.33,
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1.25rem',     // 20px
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0em',
      },
      body: {
        fontSize: '1rem',        // 16px
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0em',
      },
      caption: {
        fontSize: '0.875rem',    // 14px
        fontWeight: 400,
        lineHeight: 1.43,
        letterSpacing: '0.01em',
      },
      code: {
        fontSize: '0.875rem',    // 14px
        fontWeight: 400,
        lineHeight: 1.43,
        fontFamily: 'IBM Plex Mono, monospace',
      }
    }
  },

  // Layout & Spacing
  layout: {
    // Spacing Scale (based on 8px grid)
    spacing: {
      '01': '0.125rem',   // 2px
      '02': '0.25rem',    // 4px
      '03': '0.5rem',     // 8px
      '04': '0.75rem',    // 12px
      '05': '1rem',       // 16px
      '06': '1.5rem',     // 24px
      '07': '2rem',       // 32px
      '08': '2.5rem',     // 40px
      '09': '3rem',       // 48px
      '10': '4rem',       // 64px
      '11': '5rem',       // 80px
      '12': '6rem',       // 96px
      '13': '10rem',      // 160px
    },

    // Container Widths
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },

    // Page Margins
    pageMargin: '2.5rem',
  },

  // Shadows
  shadows: {
    small: '0 1px 2px 0 rgba(0,0,0,0.1)',
    medium: '0 2px 4px 0 rgba(0,0,0,0.1)',
    large: '0 4px 8px 0 rgba(0,0,0,0.15)',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    small: '2px',
    medium: '4px',
    large: '8px',
  }
};

// Export theme variants
export const whiteTheme = themes.white;
export const g10Theme = themes.g10;
export const g90Theme = themes.g90;
export const g100Theme = themes.g100;

export default carbonTheme;
