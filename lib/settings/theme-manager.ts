/**
 * Theme Manager
 * Handles theme application and system preference detection
 */

import type { UserSettings } from './types';

/**
 * Apply theme to the document
 */
export function applyTheme(theme: UserSettings['appearance']['theme']) {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

/**
 * Apply high contrast mode
 */
export function applyHighContrast(enabled: boolean) {
  const root = document.documentElement;

  if (enabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

/**
 * Apply reduced motion preference
 */
export function applyReducedMotion(enabled: boolean) {
  const root = document.documentElement;

  if (enabled) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

/**
 * Apply font size preference
 */
export function applyFontSize(size: UserSettings['appearance']['fontSize']) {
  const root = document.documentElement;

  // Remove existing font size classes
  root.classList.remove('font-small', 'font-medium', 'font-large');

  // Apply new font size class
  root.classList.add(`font-${size}`);
}

/**
 * Apply color scheme
 */
export function applyColorScheme(scheme: UserSettings['appearance']['colorScheme']) {
  const root = document.documentElement;

  // Remove existing color scheme classes
  root.classList.remove(
    'theme-default',
    'theme-blue',
    'theme-green',
    'theme-purple',
    'theme-orange'
  );

  // Apply new color scheme class
  root.classList.add(`theme-${scheme}`);
}

/**
 * Apply all appearance settings
 */
export function applyAppearanceSettings(appearance: UserSettings['appearance']) {
  applyTheme(appearance.theme);
  applyHighContrast(appearance.highContrast);
  applyReducedMotion(appearance.reducedMotion);
  applyFontSize(appearance.fontSize);
  applyColorScheme(appearance.colorScheme);
}

/**
 * Setup system theme preference listener
 */
export function setupThemeListener(
  currentTheme: UserSettings['appearance']['theme'],
  onSystemThemeChange: () => void
) {
  if (currentTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
    }
    // Legacy browsers
    if (mediaQuery.addListener) {
      mediaQuery.addListener(onSystemThemeChange);
      return () => mediaQuery.removeListener(onSystemThemeChange);
    }
  }

  return () => {}; // No-op cleanup
}

/**
 * Setup reduced motion preference listener
 */
export function setupReducedMotionListener(onReducedMotionChange: (prefers: boolean) => void) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e: MediaQueryListEvent | MediaQueryList) => {
    onReducedMotionChange(e.matches);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  // Legacy browsers
  if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {}; // No-op cleanup
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get system reduced motion preference
 */
export function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get system high contrast preference
 */
export function getSystemHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}
