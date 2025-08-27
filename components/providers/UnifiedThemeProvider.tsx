'use client';

/**
 * Unified Theme Provider
 * Wraps all UI library providers with consistent theming
 */

import {
  createAntdTheme,
  createChakraTheme,
  createMantineTheme,
  getCurrentTheme,
} from '@/lib/theme/unified-theme';
import { ChakraProvider } from '@chakra-ui/react';
import { MantineProvider } from '@mantine/core';
import { ConfigProvider } from 'antd';
import React, { type ReactNode, useEffect, useState } from 'react';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';

interface UnifiedThemeProviderProps {
  children: ReactNode;
}

export function UnifiedThemeProvider({ children }: UnifiedThemeProviderProps) {
  // Initialize with server-safe defaults
  const [themeConfig, setThemeConfig] = useState(() => {
    const defaultTheme = {
      colors: {
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(240 10% 3.9%)',
        card: 'hsl(0 0% 100%)',
        cardForeground: 'hsl(240 10% 3.9%)',
        popover: 'hsl(0 0% 100%)',
        popoverForeground: 'hsl(240 10% 3.9%)',
        primary: 'hsl(240 5.9% 10%)',
        primaryForeground: 'hsl(0 0% 98%)',
        secondary: 'hsl(240 4.8% 95.9%)',
        secondaryForeground: 'hsl(240 5.9% 10%)',
        muted: 'hsl(240 4.8% 95.9%)',
        mutedForeground: 'hsl(240 3.8% 46.1%)',
        accent: 'hsl(240 4.8% 95.9%)',
        accentForeground: 'hsl(240 5.9% 10%)',
        destructive: 'hsl(0 84.2% 60.2%)',
        destructiveForeground: 'hsl(0 0% 98%)',
        border: 'hsl(240 5.9% 90%)',
        input: 'hsl(240 5.9% 90%)',
        ring: 'hsl(240 5.9% 10%)',
        chart1: 'hsl(12 76% 61%)',
        chart2: 'hsl(173 58% 39%)',
        chart3: 'hsl(197 37% 24%)',
        chart4: 'hsl(43 74% 66%)',
        chart5: 'hsl(27 87% 67%)',
      },
      fonts: {
        sans: 'Geist, sans-serif',
        serif: 'Geist, serif',
        mono: 'Geist Mono, monospace',
      },
      radii: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    };

    return {
      mantine: createMantineTheme(defaultTheme),
      antd: createAntdTheme(defaultTheme),
      chakra: createChakraTheme(defaultTheme),
    };
  });

  // Update theme configurations when CSS variables change (client-side only)
  useEffect(() => {
    const updateThemes = () => {
      if (typeof window === 'undefined') return;
      const baseTheme = getCurrentTheme();
      setThemeConfig({
        mantine: createMantineTheme(baseTheme),
        antd: createAntdTheme(baseTheme),
        chakra: createChakraTheme(baseTheme),
      });
    };

    // Initial update (client-side only)
    updateThemes();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          // Theme class changed, update configurations
          setTimeout(updateThemes, 0); // Defer to next tick
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for CSS variable changes (for dynamic theme switching)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      setTimeout(updateThemes, 0);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    }

    return () => {
      observer.disconnect();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      }
    };
  }, []);

  return (
    <MantineProvider theme={themeConfig.mantine}>
      <ConfigProvider theme={themeConfig.antd}>
        {themeConfig.chakra ? (
          <ChakraProvider theme={themeConfig.chakra}>{children}</ChakraProvider>
        ) : (
          children
        )}
      </ConfigProvider>
    </MantineProvider>
  );
}
