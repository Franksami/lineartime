'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { UserSettings } from '@/lib/settings/types';
import { initializeSoundService, useSoundEffects, SoundType } from '@/lib/sound-service';

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
  setCalendarDayStyle: (style: UserSettings['calendar']['calendarDayStyle']) => void;
  toggleDaysLeftCounter: () => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  getEffectiveTheme: () => 'light' | 'dark';
  // Sound methods
  playSound: (type: SoundType) => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  toggleSoundType: (type: SoundType) => void;
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
  const { playSound } = useSoundEffects(settingsHook.settings.notifications);

  // Initialize sound service when settings change
  useEffect(() => {
    initializeSoundService(settingsHook.settings.notifications);
  }, [settingsHook.settings.notifications]);

  // Sound convenience methods
  const toggleSound = () => {
    settingsHook.updateCategory('notifications', { 
      sound: !settingsHook.settings.notifications.sound 
    });
  };

  const setSoundVolume = (soundVolume: number) => {
    settingsHook.updateCategory('notifications', { soundVolume });
  };

  const toggleSoundType = (type: SoundType) => {
    const currentValue = settingsHook.settings.notifications.soundTypes[type];
    settingsHook.updateCategory('notifications', {
      soundTypes: {
        ...settingsHook.settings.notifications.soundTypes,
        [type]: !currentValue
      }
    });
  };

  const contextValue = {
    ...settingsHook,
    playSound,
    toggleSound,
    setSoundVolume,
    toggleSoundType,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
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