/**
 * IBM Carbon Design System - Typography Scale
 * Complete type tokens with productive and expressive sets
 * @see https://carbondesignsystem.com/elements/typography/overview/
 */

// IBM Plex Font Stack
export const fontFamilies = {
  sans: '"IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: '"IBM Plex Serif", Georgia, "Times New Roman", serif',
  mono: '"IBM Plex Mono", "Menlo", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Courier, monospace',
  condensed: '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif'
};

// Font Weights
export const fontWeights = {
  thin: 100,
  extraLight: 200,
  light: 300,
  regular: 400,
  text: 450,
  medium: 500,
  semiBold: 600,
  bold: 700
};

// Line Heights
export const lineHeights = {
  tight: 1.125,    // 18px at 16px base
  default: 1.5,    // 24px at 16px base
  loose: 1.75      // 28px at 16px base
};

// Letter Spacing (tracking)
export const letterSpacing = {
  tightest: '-0.02em',
  tighter: '-0.01em',
  tight: '-0.005em',
  normal: '0em',
  wide: '0.01em',
  wider: '0.02em',
  widest: '0.04em'
};

// ============================================
// PRODUCTIVE TYPE SET
// For product interfaces and applications
// ============================================

export const productiveTypeScale = {
  // Code styles
  code01: {
    fontSize: '0.75rem',      // 12px
    fontWeight: fontWeights.regular,
    lineHeight: 1.33333,      // 16px
    letterSpacing: '0.32px',
    fontFamily: fontFamilies.mono
  },

  code02: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.42857,      // 20px
    letterSpacing: '0.32px',
    fontFamily: fontFamilies.mono
  },

  // Label styles
  label01: {
    fontSize: '0.75rem',      // 12px
    fontWeight: fontWeights.regular,
    lineHeight: 1.33333,      // 16px
    letterSpacing: '0.32px',
    fontFamily: fontFamilies.sans
  },

  label02: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.14286,      // 16px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  // Helper text
  helperText01: {
    fontSize: '0.75rem',      // 12px
    fontWeight: fontWeights.regular,
    lineHeight: 1.33333,      // 16px
    letterSpacing: '0.32px',
    fontFamily: fontFamilies.sans,
    fontStyle: 'italic'
  },

  helperText02: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.14286,      // 16px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans,
    fontStyle: 'italic'
  },

  // Legal text
  legal01: {
    fontSize: '0.75rem',      // 12px
    fontWeight: fontWeights.regular,
    lineHeight: 1.33333,      // 16px
    letterSpacing: '0.32px',
    fontFamily: fontFamilies.sans
  },

  legal02: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.28571,      // 18px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  // Body text - short (3 lines or less)
  bodyShort01: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.28571,      // 18px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  bodyShort02: {
    fontSize: '1rem',         // 16px
    fontWeight: fontWeights.regular,
    lineHeight: 1.375,        // 22px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  // Body text - long (more than 3 lines)
  bodyLong01: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.42857,      // 20px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  bodyLong02: {
    fontSize: '1rem',         // 16px
    fontWeight: fontWeights.regular,
    lineHeight: 1.5,          // 24px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  // Headings
  heading01: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.28571,      // 18px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  heading02: {
    fontSize: '1rem',         // 16px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.375,        // 22px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  heading03: {
    fontSize: '1.25rem',      // 20px
    fontWeight: fontWeights.regular,
    lineHeight: 1.4,          // 28px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  heading04: {
    fontSize: '1.75rem',      // 28px
    fontWeight: fontWeights.regular,
    lineHeight: 1.28571,      // 36px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  heading05: {
    fontSize: '2rem',         // 32px
    fontWeight: fontWeights.regular,
    lineHeight: 1.25,         // 40px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  heading06: {
    fontSize: '2.625rem',     // 42px
    fontWeight: fontWeights.light,
    lineHeight: 1.19048,      // 50px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  },

  heading07: {
    fontSize: '3.375rem',     // 54px
    fontWeight: fontWeights.light,
    lineHeight: 1.11111,      // 60px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans
  }
};

// ============================================
// EXPRESSIVE TYPE SET
// For web, marketing, and editorial
// ============================================

export const expressiveTypeScale = {
  // Display styles (large headers)
  display01: {
    fontSize: '2.625rem',     // 42px
    fontWeight: fontWeights.light,
    lineHeight: 1.19048,      // 50px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '3.375rem', // 54px
        lineHeight: 1.11111   // 60px
      },
      lg: {
        fontSize: '3.75rem',  // 60px
        lineHeight: 1.06667   // 64px
      },
      xlg: {
        fontSize: '3.75rem',
        lineHeight: 1.06667
      },
      max: {
        fontSize: '4.75rem',  // 76px
        lineHeight: 1.05263   // 80px
      }
    }
  },

  display02: {
    fontSize: '2.625rem',     // 42px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.19048,      // 50px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '3.375rem', // 54px
        lineHeight: 1.11111   // 60px
      },
      lg: {
        fontSize: '3.75rem',  // 60px
        lineHeight: 1.06667   // 64px
      },
      xlg: {
        fontSize: '4.75rem',  // 76px
        lineHeight: 1.05263   // 80px
      },
      max: {
        fontSize: '6rem',     // 96px
        lineHeight: 1.04167   // 100px
      }
    }
  },

  display03: {
    fontSize: '2.625rem',     // 42px
    fontWeight: fontWeights.light,
    lineHeight: 1.19048,      // 50px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '4.25rem',  // 68px
        lineHeight: 1.05882   // 72px
      },
      lg: {
        fontSize: '5.25rem',  // 84px
        lineHeight: 1.04762   // 88px
      },
      xlg: {
        fontSize: '6rem',     // 96px
        lineHeight: 1.04167   // 100px
      },
      max: {
        fontSize: '7.625rem', // 122px
        lineHeight: 1.03279   // 126px
      }
    }
  },

  display04: {
    fontSize: '2.625rem',     // 42px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.19048,      // 50px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '4.25rem',  // 68px
        lineHeight: 1.05882   // 72px
      },
      lg: {
        fontSize: '5.75rem',  // 92px
        lineHeight: 1.04348   // 96px
      },
      xlg: {
        fontSize: '7.625rem', // 122px
        lineHeight: 1.03279   // 126px
      },
      max: {
        fontSize: '9.75rem',  // 156px
        lineHeight: 1.02564   // 160px
      }
    }
  },

  // Expressive headings (responsive)
  expressiveHeading01: {
    fontSize: '0.875rem',     // 14px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.28571,      // 18px
    letterSpacing: '0.16px',
    fontFamily: fontFamilies.sans
  },

  expressiveHeading02: {
    fontSize: '1rem',         // 16px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.5,          // 24px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      xlg: {
        fontSize: '1.125rem', // 18px
        lineHeight: 1.33333   // 24px
      },
      max: {
        fontSize: '1.125rem',
        lineHeight: 1.33333
      }
    }
  },

  expressiveHeading03: {
    fontSize: '1.25rem',      // 20px
    fontWeight: fontWeights.regular,
    lineHeight: 1.4,          // 28px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '1.25rem',
        lineHeight: 1.4
      },
      lg: {
        fontSize: '1.25rem',
        lineHeight: 1.4
      },
      xlg: {
        fontSize: '1.5rem',   // 24px
        lineHeight: 1.33333   // 32px
      },
      max: {
        fontSize: '1.5rem',
        lineHeight: 1.33333
      }
    }
  },

  expressiveHeading04: {
    fontSize: '1.75rem',      // 28px
    fontWeight: fontWeights.regular,
    lineHeight: 1.28571,      // 36px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      xlg: {
        fontSize: '2rem',     // 32px
        lineHeight: 1.25      // 40px
      },
      max: {
        fontSize: '2rem',
        lineHeight: 1.25
      }
    }
  },

  expressiveHeading05: {
    fontSize: '2rem',         // 32px
    fontWeight: fontWeights.regular,
    lineHeight: 1.25,         // 40px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '2.25rem',  // 36px
        lineHeight: 1.22222   // 44px
      },
      lg: {
        fontSize: '2.625rem', // 42px
        lineHeight: 1.19048   // 50px
      },
      xlg: {
        fontSize: '3rem',     // 48px
        lineHeight: 1.16667   // 56px
      },
      max: {
        fontSize: '3.75rem',  // 60px
        lineHeight: 1.13333   // 68px
      }
    }
  },

  expressiveHeading06: {
    fontSize: '2rem',         // 32px
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.25,         // 40px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      md: {
        fontSize: '2.25rem',  // 36px
        lineHeight: 1.22222   // 44px
      },
      lg: {
        fontSize: '2.625rem', // 42px
        lineHeight: 1.19048   // 50px
      },
      xlg: {
        fontSize: '3rem',     // 48px
        lineHeight: 1.16667   // 56px
      },
      max: {
        fontSize: '3.75rem',  // 60px
        lineHeight: 1.13333   // 68px
      }
    }
  },

  // Expressive paragraphs
  expressiveParagraph01: {
    fontSize: '1.5rem',       // 24px
    fontWeight: fontWeights.light,
    lineHeight: 1.33333,      // 32px
    letterSpacing: '0px',
    fontFamily: fontFamilies.sans,
    breakpoints: {
      lg: {
        fontSize: '1.75rem',  // 28px
        lineHeight: 1.28571   // 36px
      },
      max: {
        fontSize: '2rem',     // 32px
        lineHeight: 1.25      // 40px
      }
    }
  },

  // Quotations
  quotation01: {
    fontSize: '1.25rem',      // 20px
    fontWeight: fontWeights.regular,
    lineHeight: 1.6,          // 32px
    letterSpacing: '0px',
    fontFamily: fontFamilies.serif,
    breakpoints: {
      md: {
        fontSize: '1.25rem',
        lineHeight: 1.6
      },
      lg: {
        fontSize: '1.5rem',   // 24px
        lineHeight: 1.5       // 36px
      },
      xlg: {
        fontSize: '1.75rem',  // 28px
        lineHeight: 1.42857   // 40px
      },
      max: {
        fontSize: '2rem',     // 32px
        lineHeight: 1.375     // 44px
      }
    }
  },

  quotation02: {
    fontSize: '2rem',         // 32px
    fontWeight: fontWeights.light,
    lineHeight: 1.375,        // 44px
    letterSpacing: '0px',
    fontFamily: fontFamilies.serif,
    breakpoints: {
      md: {
        fontSize: '2.25rem',  // 36px
        lineHeight: 1.33333   // 48px
      },
      lg: {
        fontSize: '2.625rem', // 42px
        lineHeight: 1.28571   // 54px
      },
      xlg: {
        fontSize: '3rem',     // 48px
        lineHeight: 1.25      // 60px
      },
      max: {
        fontSize: '3.75rem',  // 60px
        lineHeight: 1.2       // 72px
      }
    }
  }
};

// Helper function to generate CSS
export function generateTypeStyle(token, typeSet = 'productive') {
  const scale = typeSet === 'productive' ? productiveTypeScale : expressiveTypeScale;
  const style = scale[token];

  if (!style) return {};

  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    fontStyle: style.fontStyle || 'normal'
  };
}

// Export all
export default {
  fontFamilies,
  fontWeights,
  lineHeights,
  letterSpacing,
  productiveTypeScale,
  expressiveTypeScale,
  generateTypeStyle
};
