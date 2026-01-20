/**
 * IBM Carbon Design System - Extended Color Palette
 * Full 10-shade palettes for all colors
 * @see https://carbondesignsystem.com/elements/color/tokens/
 */

export const carbonColors = {
  // Blue Family
  blue: {
    10: '#edf5ff',
    20: '#d0e2ff',
    30: '#a6c8ff',
    40: '#78a9ff',
    50: '#4589ff',
    60: '#0f62fe', // Primary interactive
    70: '#0043ce',
    80: '#002d9c',
    90: '#001d6c',
    100: '#001141'
  },

  // Gray Family (Neutral)
  gray: {
    10: '#f4f4f4',
    20: '#e0e0e0',
    30: '#c6c6c6',
    40: '#a8a8a8',
    50: '#8d8d8d',
    60: '#6f6f6f',
    70: '#525252',
    80: '#393939',
    90: '#262626',
    100: '#161616' // Text primary
  },

  // Red Family (Danger/Error)
  red: {
    10: '#fff1f1',
    20: '#ffd7d9',
    30: '#ffb3b8',
    40: '#ff8389',
    50: '#fa4d56',
    60: '#da1e28', // Error
    70: '#a2191f',
    80: '#750e13',
    90: '#520408',
    100: '#2d0709'
  },

  // Magenta Family
  magenta: {
    10: '#fff0f7',
    20: '#ffd6e8',
    30: '#ffafd2',
    40: '#ff7eb6',
    50: '#ee5396',
    60: '#d02670',
    70: '#9f1853',
    80: '#740937',
    90: '#510224',
    100: '#2a0a18'
  },

  // Purple Family
  purple: {
    10: '#f6f2ff',
    20: '#e8daff',
    30: '#d4bbff',
    40: '#be95ff',
    50: '#a56eff',
    60: '#8a3ffc', // Code keywords
    70: '#6929c4',
    80: '#491d8b',
    90: '#31135e',
    100: '#1c0f30'
  },

  // Cyan Family
  cyan: {
    10: '#e5f6ff',
    20: '#bae6ff',
    30: '#82cfff',
    40: '#33b1ff',
    50: '#1192e8', // Links
    60: '#0072c3',
    70: '#00539a',
    80: '#003a6d',
    90: '#012749',
    100: '#061727'
  },

  // Teal Family
  teal: {
    10: '#d9fbfb',
    20: '#9ef0f0',
    30: '#3ddbd9',
    40: '#08bdba',
    50: '#009d9a',
    60: '#007d79',
    70: '#005d5d',
    80: '#004144',
    90: '#022b30',
    100: '#081a1c'
  },

  // Green Family (Success)
  green: {
    10: '#defbe6',
    20: '#a7f0ba',
    30: '#6fdc8c',
    40: '#42be65',
    50: '#24a148', // Success
    60: '#198038',
    70: '#0e6027',
    80: '#044317',
    90: '#022d0d',
    100: '#071908'
  },

  // Cool Gray Family
  coolGray: {
    10: '#f2f4f8',
    20: '#dde1e6',
    30: '#c1c7cd',
    40: '#a2a9b0',
    50: '#878d96',
    60: '#697077',
    70: '#4d5358',
    80: '#343a3f',
    90: '#21272a',
    100: '#121619'
  },

  // Warm Gray Family
  warmGray: {
    10: '#f7f3f2',
    20: '#e5e0df',
    30: '#cac5c4',
    40: '#ada8a8',
    50: '#8f8b8b',
    60: '#726e6e',
    70: '#565151',
    80: '#3c3838',
    90: '#272525',
    100: '#171414'
  },

  // Special Colors
  white: '#ffffff',
  black: '#000000',

  // Alert Colors (most commonly used shades)
  alert: {
    error: '#da1e28',      // red-60
    warning: '#f1c21b',    // yellow-30
    success: '#24a148',    // green-50
    info: '#0f62fe'        // blue-60
  }
};

// Data Visualization - Categorical Palette (14 colors)
export const dataVizCategorical = [
  '#6929c4', // purple-70
  '#1192e8', // cyan-50
  '#005d5d', // teal-70
  '#9f1853', // magenta-70
  '#fa4d56', // red-50
  '#520408', // red-90
  '#198038', // green-60
  '#002d9c', // blue-80
  '#ee5396', // magenta-50
  '#a56eff', // purple-50
  '#009d9a', // teal-50
  '#012749', // cyan-90
  '#4589ff', // blue-50
  '#6fdc8c'  // green-30
];

// Data Visualization - Sequential Palettes
export const dataVizSequential = {
  blue: [
    '#edf5ff',
    '#a6c8ff',
    '#4589ff',
    '#0f62fe',
    '#0043ce',
    '#001d6c'
  ],
  cyan: [
    '#e5f6ff',
    '#82cfff',
    '#1192e8',
    '#0072c3',
    '#00539a',
    '#012749'
  ],
  teal: [
    '#d9fbfb',
    '#3ddbd9',
    '#009d9a',
    '#007d79',
    '#005d5d',
    '#022b30'
  ],
  green: [
    '#defbe6',
    '#6fdc8c',
    '#24a148',
    '#198038',
    '#0e6027',
    '#022d0d'
  ],
  purple: [
    '#f6f2ff',
    '#d4bbff',
    '#a56eff',
    '#8a3ffc',
    '#6929c4',
    '#31135e'
  ],
  magenta: [
    '#fff0f7',
    '#ffafd2',
    '#ee5396',
    '#d02670',
    '#9f1853',
    '#510224'
  ],
  red: [
    '#fff1f1',
    '#ffb3b8',
    '#fa4d56',
    '#da1e28',
    '#a2191f',
    '#520408'
  ]
};

// Data Visualization - Diverging Palettes
export const dataVizDiverging = {
  redToGreen: [
    '#da1e28', // red-60
    '#fa4d56', // red-50
    '#ffb3b8', // red-30
    '#ffffff', // white (center)
    '#6fdc8c', // green-30
    '#24a148', // green-50
    '#198038'  // green-60
  ],
  purpleToTeal: [
    '#8a3ffc', // purple-60
    '#be95ff', // purple-40
    '#d4bbff', // purple-30
    '#ffffff', // white (center)
    '#3ddbd9', // teal-30
    '#009d9a', // teal-50
    '#007d79'  // teal-60
  ],
  blueToMagenta: [
    '#0f62fe', // blue-60
    '#4589ff', // blue-50
    '#a6c8ff', // blue-30
    '#ffffff', // white (center)
    '#ffafd2', // magenta-30
    '#ee5396', // magenta-50
    '#d02670'  // magenta-60
  ]
};

// Theme Color Tokens
export const themeTokens = {
  white: {
    background: carbonColors.white,
    layer01: carbonColors.gray[10],
    layer02: carbonColors.white,
    layer03: carbonColors.gray[10],
    field01: carbonColors.gray[10],
    field02: carbonColors.white,
    borderSubtle: carbonColors.gray[20],
    borderStrong: carbonColors.gray[50],
    textPrimary: carbonColors.gray[100],
    textSecondary: carbonColors.gray[70],
    textPlaceholder: carbonColors.gray[40],
    textHelper: carbonColors.gray[60],
    textError: carbonColors.alert.error,
    linkPrimary: carbonColors.blue[60],
    interactive: carbonColors.blue[60],
    focus: carbonColors.blue[60],
    inverse: carbonColors.gray[100]
  },

  g10: {
    background: carbonColors.gray[10],
    layer01: carbonColors.white,
    layer02: carbonColors.gray[10],
    layer03: carbonColors.white,
    field01: carbonColors.white,
    field02: carbonColors.gray[10],
    borderSubtle: carbonColors.gray[20],
    borderStrong: carbonColors.gray[50],
    textPrimary: carbonColors.gray[100],
    textSecondary: carbonColors.gray[70],
    textPlaceholder: carbonColors.gray[40],
    textHelper: carbonColors.gray[60],
    textError: carbonColors.alert.error,
    linkPrimary: carbonColors.blue[60],
    interactive: carbonColors.blue[60],
    focus: carbonColors.blue[60],
    inverse: carbonColors.gray[100]
  },

  g90: {
    background: carbonColors.gray[90],
    layer01: carbonColors.gray[80],
    layer02: carbonColors.gray[70],
    layer03: carbonColors.gray[60],
    field01: carbonColors.gray[80],
    field02: carbonColors.gray[70],
    borderSubtle: carbonColors.gray[70],
    borderStrong: carbonColors.gray[50],
    textPrimary: carbonColors.gray[10],
    textSecondary: carbonColors.gray[30],
    textPlaceholder: carbonColors.gray[50],
    textHelper: carbonColors.gray[40],
    textError: '#ff8389',
    linkPrimary: '#78a9ff',
    interactive: '#78a9ff',
    focus: carbonColors.white,
    inverse: carbonColors.gray[10]
  },

  g100: {
    background: carbonColors.gray[100],
    layer01: carbonColors.gray[90],
    layer02: carbonColors.gray[80],
    layer03: carbonColors.gray[70],
    field01: carbonColors.gray[90],
    field02: carbonColors.gray[80],
    borderSubtle: carbonColors.gray[80],
    borderStrong: carbonColors.gray[50],
    textPrimary: carbonColors.gray[10],
    textSecondary: carbonColors.gray[30],
    textPlaceholder: carbonColors.gray[50],
    textHelper: carbonColors.gray[40],
    textError: '#ff8389',
    linkPrimary: '#78a9ff',
    interactive: '#78a9ff',
    focus: carbonColors.white,
    inverse: carbonColors.gray[10]
  }
};

// Helper function to get color
export function getColor(family, shade) {
  return carbonColors[family]?.[shade] || carbonColors.gray[50];
}

// Helper function to get theme token
export function getThemeToken(theme, token) {
  return themeTokens[theme]?.[token] || themeTokens.white[token];
}

// Export default
export default {
  carbonColors,
  dataVizCategorical,
  dataVizSequential,
  dataVizDiverging,
  themeTokens,
  getColor,
  getThemeToken
};
