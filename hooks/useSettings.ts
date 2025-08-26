'use client'

import { useState, useEffect, useCallback } from 'react';
import { UserSettings, createDefaultSettings } from '@/lib/settings/types';
import { settingsStorage } from '@/lib/settings/storage';

/**
 * React hook for managing user settings
 * Provides settings state and update functions with automatic persistence
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => 
    settingsStorage.getSettings()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsStorage.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  // Update entire settings object
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    try {
      setError(null);
      settingsStorage.updateSettings(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      console.error('Settings update error:', err);
    }
  }, []);

  // Update nested settings category
  const updateCategory = useCallback(<K extends keyof UserSettings>(
    category: K,
    updates: Partial<UserSettings[K]>
  ) => {
    try {
      setError(null);
      settingsStorage.updateNestedSettings(category, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      console.error('Settings update error:', err);
    }
  }, []);

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    try {
      setError(null);
      if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
        settingsStorage.resetSettings();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      console.error('Settings reset error:', err);
    }
  }, []);

  // Reset specific category to defaults
  const resetCategory = useCallback(<K extends keyof UserSettings>(category: K) => {
    try {
      setError(null);
      settingsStorage.resetCategory(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset category');
      console.error('Settings reset error:', err);
    }
  }, []);

  // Export settings as JSON
  const exportSettings = useCallback((): void => {
    try {
      setError(null);
      const json = settingsStorage.exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lineartime-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export settings');
      console.error('Settings export error:', err);
    }
  }, []);

  // Import settings from JSON file
  const importSettings = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsLoading(true);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const success = settingsStorage.importSettings(json);
          if (!success) {
            setError('Invalid settings file format');
          }
          resolve(success);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to import settings');
          console.error('Settings import error:', err);
          resolve(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read settings file');
        setIsLoading(false);
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  }, []);

  // Toggle boolean settings
  const toggleSetting = useCallback(<K extends keyof UserSettings>(
    category: K,
    key: keyof UserSettings[K]
  ) => {
    const currentValue = settings[category][key];
    if (typeof currentValue === 'boolean') {
      updateCategory(category, { [key]: !currentValue } as Partial<UserSettings[K]>);
    }
  }, [settings, updateCategory]);

  // Update theme (convenience method)
  const setTheme = useCallback((theme: UserSettings['appearance']['theme']) => {
    updateCategory('appearance', { theme });
  }, [updateCategory]);

  // Update time format (convenience method)
  const setTimeFormat = useCallback((format: UserSettings['time']['format']) => {
    updateCategory('time', { format });
  }, [updateCategory]);

  // Update date format (convenience method)
  const setDateFormat = useCallback((dateFormat: UserSettings['time']['dateFormat']) => {
    updateCategory('time', { dateFormat });
  }, [updateCategory]);

  // Update default view (convenience method)
  const setDefaultView = useCallback((defaultView: UserSettings['calendar']['defaultView']) => {
    updateCategory('calendar', { defaultView });
  }, [updateCategory]);

  // Update calendar day style (convenience method)
  const setCalendarDayStyle = useCallback((calendarDayStyle: UserSettings['calendar']['calendarDayStyle']) => {
    updateCategory('calendar', { calendarDayStyle });
  }, [updateCategory]);

  // Toggle days left counter (convenience method)
  const toggleDaysLeftCounter = useCallback(() => {
    updateCategory('calendar', { showDaysLeft: !settings.calendar.showDaysLeft });
  }, [updateCategory, settings.calendar.showDaysLeft]);

  // Check if high contrast is enabled
  const isHighContrast = settings.appearance.highContrast;

  // Check if reduced motion is enabled
  const isReducedMotion = settings.appearance.reducedMotion;

  // Get effective theme (resolving 'system' to actual theme)
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (settings.appearance.theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return settings.appearance.theme;
  }, [settings.appearance.theme]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateCategory,
    resetSettings,
    resetCategory,
    exportSettings,
    importSettings,
    toggleSetting,
    setTheme,
    setTimeFormat,
    setDateFormat,
    setDefaultView,
    setCalendarDayStyle,
    toggleDaysLeftCounter,
    isHighContrast,
    isReducedMotion,
    getEffectiveTheme,
  };
}