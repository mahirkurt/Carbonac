/**
 * Theme Context - Carbon Design System Theme Management
 * 
 * Provides comprehensive theme management with:
 * - 4 Carbon themes (white, g10, g90, g100)
 * - localStorage persistence
 * - System preference detection
 * - Smooth theme transitions
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

// ============================================================================
// Theme Configuration
// ============================================================================

export const THEMES = {
  WHITE: 'white',
  G10: 'g10',
  G90: 'g90',
  G100: 'g100',
};

export const THEME_LABELS = {
  [THEMES.WHITE]: 'White (Açık)',
  [THEMES.G10]: 'Gray 10 (Açık)',
  [THEMES.G90]: 'Gray 90 (Koyu)',
  [THEMES.G100]: 'Gray 100 (Koyu)',
};

// Light themes
export const LIGHT_THEMES = [THEMES.WHITE, THEMES.G10];
// Dark themes
export const DARK_THEMES = [THEMES.G90, THEMES.G100];

// Default theme
const DEFAULT_THEME = THEMES.WHITE;
const STORAGE_KEY = 'carbonac-theme';
const SYSTEM_PREFERENCE_KEY = 'carbonac-use-system-preference';

// ============================================================================
// Theme Context
// ============================================================================

const ThemeContext = createContext(null);

// ============================================================================
// Theme Provider Component
// ============================================================================

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }) {
  // State
  const [theme, setThemeState] = useState(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && Object.values(THEMES).includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [useSystemPreference, setUseSystemPreference] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SYSTEM_PREFERENCE_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Detect system color scheme preference
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.G100
        : THEMES.WHITE;
    }
    return DEFAULT_THEME;
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newTheme) => {
    if (typeof document !== 'undefined') {
      // Remove old theme classes
      document.documentElement.removeAttribute('data-carbon-theme');
      document.body.classList.remove(
        'cds--white',
        'cds--g10',
        'cds--g90',
        'cds--g100'
      );
      
      // Apply new theme
      document.documentElement.setAttribute('data-carbon-theme', newTheme);
      document.body.classList.add(`cds--${newTheme}`);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      const isDark = DARK_THEMES.includes(newTheme);
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#161616' : '#ffffff');
      }
    }
  }, []);

  // Set theme with persistence
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`);
      return;
    }
    
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const isDark = DARK_THEMES.includes(theme);
    const newTheme = isDark ? THEMES.WHITE : THEMES.G100;
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Cycle through all themes
  const cycleTheme = useCallback(() => {
    const themeOrder = [THEMES.WHITE, THEMES.G10, THEMES.G90, THEMES.G100];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [theme, setTheme]);

  // Toggle system preference
  const toggleSystemPreference = useCallback(() => {
    const newValue = !useSystemPreference;
    setUseSystemPreference(newValue);
    localStorage.setItem(SYSTEM_PREFERENCE_KEY, String(newValue));
    
    if (newValue) {
      setTheme(getSystemTheme());
    }
  }, [useSystemPreference, getSystemTheme, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!useSystemPreference || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newTheme = e.matches ? THEMES.G100 : THEMES.WHITE;
      setTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [useSystemPreference, setTheme]);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Computed values
  const isDark = useMemo(() => DARK_THEMES.includes(theme), [theme]);
  const isLight = useMemo(() => LIGHT_THEMES.includes(theme), [theme]);

  // Context value
  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    cycleTheme,
    isDark,
    isLight,
    useSystemPreference,
    toggleSystemPreference,
    themes: THEMES,
    themeLabels: THEME_LABELS,
  }), [
    theme,
    setTheme,
    toggleTheme,
    cycleTheme,
    isDark,
    isLight,
    useSystemPreference,
    toggleSystemPreference,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// useTheme Hook
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// ============================================================================
// Theme Utilities
// ============================================================================

/**
 * Get appropriate logo variant based on theme
 */
export function getLogoVariant(theme) {
  return DARK_THEMES.includes(theme) ? 'light' : 'dark';
}

/**
 * Get contrasting text color for theme
 */
export function getTextColor(theme) {
  return DARK_THEMES.includes(theme) ? '#f4f4f4' : '#161616';
}

/**
 * Get background color for theme
 */
export function getBackgroundColor(theme) {
  switch (theme) {
    case THEMES.WHITE:
      return '#ffffff';
    case THEMES.G10:
      return '#f4f4f4';
    case THEMES.G90:
      return '#262626';
    case THEMES.G100:
      return '#161616';
    default:
      return '#ffffff';
  }
}

export default ThemeContext;
