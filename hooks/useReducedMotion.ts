import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if the user prefers reduced motion
 * @returns {boolean} true if the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Check the initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get CSS animation duration based on reduced motion preference
 * @param {number} normalDuration - Normal animation duration in ms
 * @param {boolean} prefersReducedMotion - Whether user prefers reduced motion
 * @returns {number} Adjusted animation duration
 */
export function getAnimationDuration(
  normalDuration: number,
  prefersReducedMotion: boolean
): number {
  return prefersReducedMotion ? 0 : normalDuration;
}

/**
 * Get CSS transition string based on reduced motion preference
 * @param {string} property - CSS property to transition
 * @param {number} duration - Duration in ms
 * @param {string} easing - Easing function
 * @param {boolean} prefersReducedMotion - Whether user prefers reduced motion
 * @returns {string} CSS transition string
 */
export function getTransition(
  property: string,
  duration: number,
  easing: string = 'ease',
  prefersReducedMotion: boolean
): string {
  if (prefersReducedMotion) {
    return 'none';
  }
  return `${property} ${duration}ms ${easing}`;
}