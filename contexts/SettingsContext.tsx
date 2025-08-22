'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { UserSettings } from '@/lib/settings/types';

/**
 * Settings Context Type
 */
interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateCategory: <K extends keyof UserSettings>(
    category: K,
    updates: Partial<UserSettings[K]>
  ) => void;
  resetSettings: () => void;
  resetCategory: <K extends keyof UserSettings>(category: K) => void;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<boolean>;
  toggleSetting: <K extends keyof UserSettings>(
    category: K,
    key: keyof UserSettings[K]
  ) => void;
  setTheme: (theme: UserSettings['appearance']['theme']) => void;
  setTimeFormat: (format: UserSettings['time']['format']) => void;
  setDateFormat: (dateFormat: UserSettings['time']['dateFormat']) => void;
  setDefaultView: (defaultView: UserSettings['calendar']['defaultView']) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  getEffectiveTheme: () => 'light' | 'dark';
}

/**
 * Settings Context
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Settings Provider Props
 */
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Settings Provider Component
 * Provides global access to user settings throughout the app
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 * Must be used within SettingsProvider
 */
export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}

/**
 * HOC to inject settings props into a component
 */
export function withSettings<P extends object>(
  Component: React.ComponentType<P & { settings: UserSettings }>
) {
  return function WithSettingsComponent(props: P) {
    const { settings } = useSettingsContext();
    return <Component {...props} settings={settings} />;
  };
}