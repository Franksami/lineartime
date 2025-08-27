'use client';

import {
  applyAppearanceSettings,
  getSystemReducedMotion,
  setupReducedMotionListener,
  setupThemeListener,
} from '@/lib/settings/theme-manager';
import type React from 'react';
import { useEffect } from 'react';
import { useSettingsContext } from './SettingsContext';

/**
 * Theme Provider Component
 * Applies theme settings and listens for changes
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateCategory } = useSettingsContext();

  // Apply appearance settings on mount and when they change
  useEffect(() => {
    applyAppearanceSettings(settings.appearance);
  }, [settings.appearance]);

  // Listen for system theme changes
  useEffect(() => {
    const cleanup = setupThemeListener(settings.appearance.theme, () => {
      // Re-apply theme when system preference changes
      if (settings.appearance.theme === 'system') {
        applyAppearanceSettings(settings.appearance);
      }
    });

    return cleanup;
  }, [settings.appearance]);

  // Listen for system reduced motion preference
  useEffect(() => {
    // Only sync if user hasn't explicitly set a preference
    if (!localStorage.getItem('lineartime-settings')) {
      const cleanup = setupReducedMotionListener((prefers) => {
        updateCategory('appearance', { reducedMotion: prefers });
      });

      // Set initial value
      const systemPref = getSystemReducedMotion();
      if (systemPref !== settings.appearance.reducedMotion) {
        updateCategory('appearance', { reducedMotion: systemPref });
      }

      return cleanup;
    }
  }, [updateCategory, settings.appearance.reducedMotion]);

  return <>{children}</>;
}
