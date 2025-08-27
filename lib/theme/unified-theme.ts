/**
 * Unified Theme System
 * Integrates multiple UI libraries with a consistent design system
 */

import type { MantineColorsTuple } from '@mantine/core';

// Base theme tokens from CSS variables
export interface BaseTheme {
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
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Function to get CSS variable value with fallbacks
function getCSSVariable(variable: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

// Get current theme values from CSS variables
export function getCurrentTheme(): BaseTheme {
  return {
    colors: {
      background: getCSSVariable('--background'),
      foreground: getCSSVariable('--foreground'),
      card: getCSSVariable('--card'),
      cardForeground: getCSSVariable('--card-foreground'),
      popover: getCSSVariable('--popover'),
      popoverForeground: getCSSVariable('--popover-foreground'),
      primary: getCSSVariable('--primary'),
      primaryForeground: getCSSVariable('--primary-foreground'),
      secondary: getCSSVariable('--secondary'),
      secondaryForeground: getCSSVariable('--secondary-foreground'),
      muted: getCSSVariable('--muted'),
      mutedForeground: getCSSVariable('--muted-foreground'),
      accent: getCSSVariable('--accent'),
      accentForeground: getCSSVariable('--accent-foreground'),
      destructive: getCSSVariable('--destructive'),
      destructiveForeground: getCSSVariable('--destructive-foreground'),
      border: getCSSVariable('--border'),
      input: getCSSVariable('--input'),
      ring: getCSSVariable('--ring'),
      chart1: getCSSVariable('--chart-1'),
      chart2: getCSSVariable('--chart-2'),
      chart3: getCSSVariable('--chart-3'),
      chart4: getCSSVariable('--chart-4'),
      chart5: getCSSVariable('--chart-5'),
    },
    fonts: {
      sans: getCSSVariable('--font-sans', 'Geist, sans-serif'),
      serif: getCSSVariable('--font-serif', 'Geist, serif'),
      mono: getCSSVariable('--font-mono', 'Geist Mono, monospace'),
    },
    radii: {
      sm: getCSSVariable('--radius-sm'),
      md: getCSSVariable('--radius-md'),
      lg: getCSSVariable('--radius-lg'),
      xl: getCSSVariable('--radius-xl'),
    },
    shadows: {
      xs: getCSSVariable('--shadow-xs'),
      sm: getCSSVariable('--shadow-sm'),
      md: getCSSVariable('--shadow-md'),
      lg: getCSSVariable('--shadow-lg'),
      xl: getCSSVariable('--shadow-xl'),
      '2xl': getCSSVariable('--shadow-2xl'),
    },
  };
}

// Convert OKLCH to hex for libraries that need hex colors
function oklchToHex(oklch: string): string {
  // This is a simplified conversion for fallback
  // In production, you'd want a proper OKLCH to hex conversion
  if (!oklch.startsWith('oklch(')) return '#000000';

  // Extract lightness value and convert to grayscale hex for now
  const match = oklch.match(/oklch\(([0-9.]+)/);
  if (!match) return '#000000';

  const lightness = Number.parseFloat(match[1]);
  const gray = Math.round(lightness * 255);
  return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
}

// Mantine theme configuration
export function createMantineTheme(baseTheme: BaseTheme) {
  // Convert CSS variables to Mantine format
  const primary: MantineColorsTuple = [
    '#f0f9ff',
    '#e0f2fe',
    '#bae6fd',
    '#7dd3fc',
    '#38bdf8',
    '#0ea5e9',
    '#0284c7',
    '#0369a1',
    '#075985',
    '#0c4a6e',
  ];

  return {
    primaryColor: 'blue',
    colors: {
      blue: primary,
    },
    fontFamily: baseTheme.fonts.sans || 'Geist, sans-serif',
    fontFamilyMonospace: baseTheme.fonts.mono || 'Geist Mono, monospace',
    headings: { fontFamily: baseTheme.fonts.sans || 'Geist, sans-serif' },
    defaultRadius: baseTheme.radii.md || 'md',
    shadows: {
      xs: baseTheme.shadows.xs || '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      sm: baseTheme.shadows.sm || '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      md: baseTheme.shadows.md || '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: baseTheme.shadows.lg || '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: baseTheme.shadows.xl || '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: baseTheme.radii.md,
            fontFamily: baseTheme.fonts.sans,
          },
        },
      },
      Card: {
        styles: {
          root: {
            borderRadius: baseTheme.radii.lg,
            border: `1px solid ${baseTheme.colors.border}`,
          },
        },
      },
    },
  };
}

// Ant Design theme configuration
export function createAntdTheme(baseTheme: BaseTheme) {
  return {
    token: {
      colorPrimary: oklchToHex(baseTheme.colors.primary) || '#1677ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: oklchToHex(baseTheme.colors.destructive) || '#ff4d4f',
      colorInfo: '#1677ff',
      colorBgContainer: oklchToHex(baseTheme.colors.card) || '#ffffff',
      colorBgElevated: oklchToHex(baseTheme.colors.popover) || '#ffffff',
      colorBorder: oklchToHex(baseTheme.colors.border) || '#d9d9d9',
      colorBorderSecondary: oklchToHex(baseTheme.colors.muted) || '#f0f0f0',
      borderRadius: Number.parseInt(baseTheme.radii.md.replace('rem', '')) * 16 || 6,
      fontFamily: baseTheme.fonts.sans || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      fontSize: 14,
      colorText: oklchToHex(baseTheme.colors.foreground) || '#000000d9',
      colorTextSecondary: oklchToHex(baseTheme.colors.mutedForeground) || '#00000073',
      colorTextTertiary: oklchToHex(baseTheme.colors.mutedForeground) || '#00000040',
      colorTextDisabled: oklchToHex(baseTheme.colors.mutedForeground) || '#00000040',
    },
    components: {
      Button: {
        borderRadius: Number.parseInt(baseTheme.radii.md.replace('rem', '')) * 16 || 6,
      },
      Card: {
        borderRadius: Number.parseInt(baseTheme.radii.lg.replace('rem', '')) * 16 || 8,
      },
      Input: {
        borderRadius: Number.parseInt(baseTheme.radii.sm.replace('rem', '')) * 16 || 4,
      },
      DatePicker: {
        borderRadius: Number.parseInt(baseTheme.radii.md.replace('rem', '')) * 16 || 6,
      },
    },
  };
}

// Chakra UI theme configuration
export function createChakraTheme(_baseTheme: BaseTheme) {
  // Import extendTheme if available, otherwise return undefined to skip ChakraProvider
  try {
    // This is a simplified approach - in production you'd import extendTheme from @chakra-ui/react
    // For now, return undefined to bypass ChakraProvider until proper theme is configured
    return undefined;
  } catch (_error) {
    return undefined;
  }
}

// Theme utilities
export const themeUtils = {
  getCurrentTheme,
  createMantineTheme,
  createAntdTheme,
  createChakraTheme,
};

export default themeUtils;
