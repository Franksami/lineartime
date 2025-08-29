/**
 * Design Tokens Hook
 *
 * Provides access to Command Center design token system with semantic tokens
 * and dynamic theme management for professional interface consistency.
 *
 * @version 2.0.0 (Command Center Design System)
 */

'use client';

import { useCallback } from 'react';

interface DesignTokens {
  // Semantic color tokens
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

  // Spacing tokens
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };

  // Typography tokens
  typography: {
    fontSans: string;
    fontMono: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };

  // Border radius tokens
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  // Animation tokens
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };

  // Utility functions
  getToken: (path: string) => string;
  getCSSVariable: (name: string) => string;
  applyTokens: (element: HTMLElement, tokens: Record<string, string>) => void;
}

export function useDesignTokens(): DesignTokens {
  // Get CSS variable value
  const getCSSVariable = useCallback((name: string): string => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    return '';
  }, []);

  // Get token by path (e.g., 'colors.primary')
  const getToken = useCallback(
    (path: string): string => {
      const pathParts = path.split('.');

      if (pathParts[0] === 'colors') {
        return `hsl(var(--${pathParts[1]}))`;
      }

      if (pathParts[0] === 'spacing') {
        const spacingMap: Record<string, string> = {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '3rem',
          '2xl': '6rem',
          '3xl': '12rem',
        };
        return spacingMap[pathParts[1]] || '1rem';
      }

      return getCSSVariable(`--${pathParts.join('-')}`);
    },
    [getCSSVariable]
  );

  // Apply tokens to element
  const applyTokens = useCallback((element: HTMLElement, tokens: Record<string, string>) => {
    Object.entries(tokens).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  }, []);

  return {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))',
      cardForeground: 'hsl(var(--card-foreground))',
      popover: 'hsl(var(--popover))',
      popoverForeground: 'hsl(var(--popover-foreground))',
      primary: 'hsl(var(--primary))',
      primaryForeground: 'hsl(var(--primary-foreground))',
      secondary: 'hsl(var(--secondary))',
      secondaryForeground: 'hsl(var(--secondary-foreground))',
      muted: 'hsl(var(--muted))',
      mutedForeground: 'hsl(var(--muted-foreground))',
      accent: 'hsl(var(--accent))',
      accentForeground: 'hsl(var(--accent-foreground))',
      destructive: 'hsl(var(--destructive))',
      destructiveForeground: 'hsl(var(--destructive-foreground))',
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
    },

    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '3rem',
      '2xl': '6rem',
      '3xl': '12rem',
    },

    typography: {
      fontSans: 'var(--font-sans)',
      fontMono: 'var(--font-mono)',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625',
      },
    },

    radius: {
      sm: 'calc(var(--radius) - 4px)',
      md: 'calc(var(--radius) - 2px)',
      lg: 'var(--radius)',
      xl: 'calc(var(--radius) + 4px)',
      full: '9999px',
    },

    animation: {
      duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
      easing: {
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },

    getToken,
    getCSSVariable,
    applyTokens,
  };
}
