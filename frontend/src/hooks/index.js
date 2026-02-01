/**
 * Hooks Index - Export all custom hooks
 */

// Media queries and responsive design
export {
  useMediaQuery,
  useBreakpoint,
  useBreakpointDown,
  useCurrentBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  BREAKPOINTS,
} from './useMediaQuery';

// Accessibility - Motion preferences
export {
  usePrefersReducedMotion,
  useAnimationDuration,
  useMotionSafeProps,
} from './usePrefersReducedMotion';

// Modal and focus trap
export {
  useModal,
  useFocusTrap,
  useClickOutside,
} from './useModal';

// Focus management
export {
  useFocusRestoration,
  useRovingTabIndex,
  useSkipLink,
  useFocusVisible,
  useAnnounce,
} from './useFocusManagement';

// Local storage
export { useLocalStorage } from './useLocalStorage';

// Intersection Observer - Viewport detection
export {
  useIntersectionObserver,
  useLazyLoad,
  useAnimateOnScroll,
} from './useIntersectionObserver';

// Stagger animations
export {
  useStaggerAnimation,
  usePageLoadSequence,
  calculateStaggerDelay,
} from './useStaggerAnimation';

// Debounce and throttle
export {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useThrottledCallback,
  useSearchInput,
} from './useDebounce';
