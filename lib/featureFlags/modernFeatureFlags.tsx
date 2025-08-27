/**
 * Modern Feature Flag System - Optimized for LinearTime
 * Replaces deprecated @vercel/flags with lightweight, performant solution
 */

'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

// Feature flag configuration type
interface FeatureFlagConfig {
  [key: string]: boolean | number | string;
}

// Default feature flags for LinearTime
const DEFAULT_FLAGS: FeatureFlagConfig = {
  // AI Enhancement Components (Phase 5.0)
  ENABLE_AI_CAPACITY_RIBBON: true,
  ENABLE_AI_CONFLICT_DETECTOR: true,
  ENABLE_AI_NLP_INPUT: true,
  ENABLE_AI_SMART_SCHEDULING: true,
  ENABLE_AI_INSIGHT_PANEL: true,

  // Motion System Components
  ENABLE_MOTION_ENHANCED_WRAPPER: true,
  ENABLE_TOUCH_GESTURE_HANDLER: true,
  ENABLE_LIBRARY_TRANSITION_ANIMATOR: true,

  // Real-time Collaboration
  ENABLE_WEBSOCKET_SYNC_MANAGER: true,
  ENABLE_OPTIMISTIC_UPDATE_HANDLER: true,
  ENABLE_LIVE_COLLABORATION_LAYER: true,

  // Phase 6.0 Market Validation
  ENABLE_MARKET_VALIDATION_DASHBOARD: true,
  ENABLE_AB_TESTING_FRAMEWORK: true,
  ENABLE_USER_ENGAGEMENT_ANALYTICS: true,
  ENABLE_COMPETITIVE_ANALYSIS: true,

  // Performance and Infrastructure
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ADVANCED_CACHING: true,
  ENABLE_VIRTUAL_SCROLLING: true,

  // Horizontal Timeline Features
  HORIZONTAL_TIMELINE_ENABLED: true,
  SHOW_TIMELINE_ANALYTICS: true,
  ENABLE_TIMELINE_OPTIMIZATION: true,
};

// Feature flag context
interface FeatureFlagContextType {
  flags: FeatureFlagConfig;
  getFlag: (key: string) => any;
  setFlag: (key: string, value: any) => void;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

// Feature flag provider
interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlagConfig>;
  environment?: 'development' | 'staging' | 'production';
}

export function FeatureFlagProvider({
  children,
  initialFlags = {},
  environment = 'production',
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlagConfig>({
    ...DEFAULT_FLAGS,
    ...initialFlags,
  });

  // Load flags from localStorage in browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lineartime-feature-flags');
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        setFlags((prev) => ({ ...prev, ...parsedFlags }));
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error);
    }
  }, []);

  // Save flags to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('lineartime-feature-flags', JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error);
    }
  }, [flags]);

  const getFlag = (key: string) => {
    return flags[key];
  };

  const setFlag = (key: string, value: any) => {
    setFlags((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isEnabled = (key: string): boolean => {
    const value = flags[key];
    return Boolean(value);
  };

  const contextValue: FeatureFlagContextType = {
    flags,
    getFlag,
    setFlag,
    isEnabled,
  };

  return <FeatureFlagContext.Provider value={contextValue}>{children}</FeatureFlagContext.Provider>;
}

// Hook to use feature flags
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

// Simple flag hook for individual flags
export function useFlag(key: string, defaultValue: any = false) {
  const { getFlag } = useFeatureFlags();
  return getFlag(key) ?? defaultValue;
}

// Server-side feature flag utilities (for App Router)
export async function getServerFeatureFlags(): Promise<FeatureFlagConfig> {
  // In production, this could connect to a feature flag service
  // For now, return defaults
  return DEFAULT_FLAGS;
}

// Export helper for checking flags in components
export const flags = {
  isEnabled: (key: string, fallback = false) => {
    if (typeof window === 'undefined') {
      return DEFAULT_FLAGS[key] ?? fallback;
    }

    try {
      const stored = localStorage.getItem('lineartime-feature-flags');
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        return parsedFlags[key] ?? DEFAULT_FLAGS[key] ?? fallback;
      }
    } catch {
      // Ignore storage errors
    }

    return DEFAULT_FLAGS[key] ?? fallback;
  },

  get: (key: string) => {
    if (typeof window === 'undefined') {
      return DEFAULT_FLAGS[key];
    }

    try {
      const stored = localStorage.getItem('lineartime-feature-flags');
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        return parsedFlags[key] ?? DEFAULT_FLAGS[key];
      }
    } catch {
      // Ignore storage errors
    }

    return DEFAULT_FLAGS[key];
  },
};

// Backward compatibility for existing Vercel Flags usage
export function flag(name: string, defaultValue: any = false) {
  return {
    get: () => flags.get(name) ?? defaultValue,
    enabled: () => flags.isEnabled(name, defaultValue),
  };
}

export const dedupe = (fn: any) => fn; // Simple passthrough for backward compatibility
