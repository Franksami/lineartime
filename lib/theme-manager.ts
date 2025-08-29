'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  typography: {
    fontSans: string;
    fontSerif: string;
    fontMono: string;
    fontSize: 'sm' | 'md' | 'lg';
    lineHeight: 'tight' | 'normal' | 'relaxed';
  };
  layout: {
    radius: string;
    spacing: 'compact' | 'normal' | 'spacious';
  };
}

export const presetThemes: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      background: 'oklch(0.99 0 0)',
      foreground: 'oklch(0 0 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0 0 0)',
      popover: 'oklch(0.99 0 0)',
      popoverForeground: 'oklch(0 0 0)',
      primary: 'oklch(0.59 0.15 200.12)',
      primaryForeground: 'oklch(1 0 0)',
      secondary: 'oklch(0.94 0 0)',
      secondaryForeground: 'oklch(0 0 0)',
      muted: 'oklch(0.97 0 0)',
      mutedForeground: 'oklch(0.44 0 0)',
      accent: 'oklch(0.64 0.15 264.53)',
      accentForeground: 'oklch(1 0 0)',
      destructive: 'oklch(0.63 0.19 23.03)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.92 0 0)',
      input: 'oklch(0.94 0 0)',
      ring: 'oklch(0.59 0.15 200.12)',
    },
    typography: {
      fontSans: 'Geist, sans-serif',
      fontSerif: 'Georgia, serif',
      fontMono: 'Geist Mono, monospace',
      fontSize: 'md',
      lineHeight: 'normal',
    },
    layout: {
      radius: '0.5rem',
      spacing: 'normal',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: 'oklch(0 0 0)',
      foreground: 'oklch(1 0 0)',
      card: 'oklch(0.14 0 0)',
      cardForeground: 'oklch(1 0 0)',
      popover: 'oklch(0.18 0 0)',
      popoverForeground: 'oklch(1 0 0)',
      primary: 'oklch(0.7 0.15 200.12)',
      primaryForeground: 'oklch(0 0 0)',
      secondary: 'oklch(0.25 0 0)',
      secondaryForeground: 'oklch(1 0 0)',
      muted: 'oklch(0.23 0 0)',
      mutedForeground: 'oklch(0.72 0 0)',
      accent: 'oklch(0.74 0.15 264.53)',
      accentForeground: 'oklch(0 0 0)',
      destructive: 'oklch(0.69 0.2 23.91)',
      destructiveForeground: 'oklch(0 0 0)',
      border: 'oklch(0.26 0 0)',
      input: 'oklch(0.32 0 0)',
      ring: 'oklch(0.72 0 0)',
    },
    typography: {
      fontSans: 'Geist, sans-serif',
      fontSerif: 'Georgia, serif',
      fontMono: 'Geist Mono, monospace',
      fontSize: 'md',
      lineHeight: 'normal',
    },
    layout: {
      radius: '0.5rem',
      spacing: 'normal',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: 'oklch(0.97 0.02 220)',
      foreground: 'oklch(0.15 0.05 220)',
      card: 'oklch(0.99 0.01 220)',
      cardForeground: 'oklch(0.15 0.05 220)',
      popover: 'oklch(0.99 0.01 220)',
      popoverForeground: 'oklch(0.15 0.05 220)',
      primary: 'oklch(0.55 0.18 220)',
      primaryForeground: 'oklch(0.99 0.01 220)',
      secondary: 'oklch(0.85 0.05 220)',
      secondaryForeground: 'oklch(0.15 0.05 220)',
      muted: 'oklch(0.92 0.03 220)',
      mutedForeground: 'oklch(0.45 0.08 220)',
      accent: 'oklch(0.65 0.15 200)',
      accentForeground: 'oklch(0.99 0.01 220)',
      destructive: 'oklch(0.63 0.19 23.03)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.88 0.04 220)',
      input: 'oklch(0.94 0.02 220)',
      ring: 'oklch(0.55 0.18 220)',
    },
    typography: {
      fontSans: 'Geist, sans-serif',
      fontSerif: 'Georgia, serif',
      fontMono: 'Geist Mono, monospace',
      fontSize: 'md',
      lineHeight: 'normal',
    },
    layout: {
      radius: '0.75rem',
      spacing: 'normal',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: 'oklch(0.96 0.02 140)',
      foreground: 'oklch(0.15 0.05 140)',
      card: 'oklch(0.98 0.01 140)',
      cardForeground: 'oklch(0.15 0.05 140)',
      popover: 'oklch(0.98 0.01 140)',
      popoverForeground: 'oklch(0.15 0.05 140)',
      primary: 'oklch(0.45 0.15 140)',
      primaryForeground: 'oklch(0.98 0.01 140)',
      secondary: 'oklch(0.85 0.05 140)',
      secondaryForeground: 'oklch(0.15 0.05 140)',
      muted: 'oklch(0.91 0.03 140)',
      mutedForeground: 'oklch(0.45 0.08 140)',
      accent: 'oklch(0.55 0.12 120)',
      accentForeground: 'oklch(0.98 0.01 140)',
      destructive: 'oklch(0.63 0.19 23.03)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.87 0.04 140)',
      input: 'oklch(0.93 0.02 140)',
      ring: 'oklch(0.45 0.15 140)',
    },
    typography: {
      fontSans: 'Geist, sans-serif',
      fontSerif: 'Georgia, serif',
      fontMono: 'Geist Mono, monospace',
      fontSize: 'md',
      lineHeight: 'normal',
    },
    layout: {
      radius: '0.5rem',
      spacing: 'normal',
    },
  },
];

export function useThemeManager() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(presetThemes[0]);
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedThemeId = localStorage.getItem('linear-calendar-theme');
    const savedCustomThemes = localStorage.getItem('linear-calendar-custom-themes');

    if (savedCustomThemes) {
      try {
        const parsed = JSON.parse(savedCustomThemes);
        setCustomThemes(parsed);
      } catch (error) {
        console.error('Failed to parse custom themes:', error);
      }
    }

    if (savedThemeId) {
      const allThemes = [...presetThemes, ...customThemes];
      const theme = allThemes.find((t) => t.id === savedThemeId);
      if (theme) {
        setCurrentTheme(theme);
        applyTheme(theme);
      }
    }
  }, [customThemes]);

  const applyTheme = useCallback((theme: ThemeConfig) => {
    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply typography variables
    root.style.setProperty('--font-sans', theme.typography.fontSans);
    root.style.setProperty('--font-serif', theme.typography.fontSerif);
    root.style.setProperty('--font-mono', theme.typography.fontMono);

    // Apply layout variables
    root.style.setProperty('--radius', theme.layout.radius);

    // Apply font size class
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (theme.typography.fontSize) {
      case 'sm':
        root.classList.add('text-sm');
        break;
      case 'lg':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }

    // Apply spacing class
    root.classList.remove('spacing-compact', 'spacing-normal', 'spacing-spacious');
    root.classList.add(`spacing-${theme.layout.spacing}`);
  }, []);

  const switchTheme = useCallback(
    (themeId: string) => {
      const allThemes = [...presetThemes, ...customThemes];
      const theme = allThemes.find((t) => t.id === themeId);
      if (theme) {
        setCurrentTheme(theme);
        applyTheme(theme);
        localStorage.setItem('linear-calendar-theme', themeId);
      }
    },
    [customThemes, applyTheme]
  );

  const saveCustomTheme = useCallback(
    (theme: ThemeConfig) => {
      const updatedCustomThemes = [...customThemes, theme];
      setCustomThemes(updatedCustomThemes);
      localStorage.setItem('linear-calendar-custom-themes', JSON.stringify(updatedCustomThemes));
    },
    [customThemes]
  );

  const deleteCustomTheme = useCallback(
    (themeId: string) => {
      const updatedCustomThemes = customThemes.filter((t) => t.id !== themeId);
      setCustomThemes(updatedCustomThemes);
      localStorage.setItem('linear-calendar-custom-themes', JSON.stringify(updatedCustomThemes));

      // If the deleted theme was active, switch to light theme
      if (currentTheme.id === themeId) {
        switchTheme('light');
      }
    },
    [customThemes, currentTheme.id, switchTheme]
  );

  return {
    currentTheme,
    presetThemes,
    customThemes,
    switchTheme,
    saveCustomTheme,
    deleteCustomTheme,
    applyTheme,
  };
}
