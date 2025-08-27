/**
 * Enhanced Theme System
 * Integrates Style Dictionary tokens with existing theme infrastructure
 * Provides enhanced theming capabilities for all UI libraries
 */

import { type BaseTheme, createAntdTheme, createMantineTheme } from '../theme/unified-theme';
import { type TokenResolver, themeBridge, tokenHelpers } from './utils/token-bridge';

// Enhanced theme interface with token support
export interface EnhancedTheme extends BaseTheme {
  tokens: {
    color: Record<string, string>;
    spacing: Record<string, string>;
    typography: Record<string, any>;
    elevation: Record<string, any>;
    motion: Record<string, any>;
    component: Record<string, any>;
  };
  semanticColors: {
    background: Record<string, string>;
    surface: Record<string, string>;
    border: Record<string, string>;
    text: Record<string, string>;
    action: Record<string, any>;
    feedback: Record<string, any>;
  };
  componentTokens: Record<string, any>;
}

/**
 * Enhanced theme generator that combines CSS variables with design tokens
 */
class EnhancedThemeGenerator {
  private tokenResolver: TokenResolver;
  private isDark = false;

  constructor() {
    this.tokenResolver = require('./utils/token-bridge').tokenResolver;
    this.detectTheme();
  }

  private detectTheme(): void {
    if (typeof window === 'undefined') return;

    this.isDark =
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Generate enhanced theme object
   */
  generateTheme(): EnhancedTheme {
    const baseTheme = this.getBaseTheme();
    const tokens = this.extractTokenCategories();
    const semanticColors = this.getSemanticColors();
    const componentTokens = this.getComponentTokens();

    return {
      ...baseTheme,
      tokens,
      semanticColors,
      componentTokens,
    };
  }

  private getBaseTheme(): BaseTheme {
    return {
      colors: {
        background: themeBridge.getValue('semantic.color.background.primary', 'white', this.isDark),
        foreground: themeBridge.getValue('semantic.color.text.primary', 'black', this.isDark),
        card: themeBridge.getValue('semantic.color.surface.default', 'white', this.isDark),
        cardForeground: themeBridge.getValue('semantic.color.text.primary', 'black', this.isDark),
        popover: themeBridge.getValue('semantic.color.surface.elevated', 'white', this.isDark),
        popoverForeground: themeBridge.getValue(
          'semantic.color.text.primary',
          'black',
          this.isDark
        ),
        primary: themeBridge.getValue(
          'semantic.color.action.primary.default',
          '#3b82f6',
          this.isDark
        ),
        primaryForeground: themeBridge.getValue(
          'semantic.color.text.inverse',
          'white',
          this.isDark
        ),
        secondary: themeBridge.getValue(
          'semantic.color.action.secondary.default',
          '#6b7280',
          this.isDark
        ),
        secondaryForeground: themeBridge.getValue(
          'semantic.color.text.primary',
          'black',
          this.isDark
        ),
        muted: themeBridge.getValue('semantic.color.background.secondary', '#f3f4f6', this.isDark),
        mutedForeground: themeBridge.getValue(
          'semantic.color.text.secondary',
          '#6b7280',
          this.isDark
        ),
        accent: themeBridge.getValue('semantic.color.background.tertiary', '#f1f5f9', this.isDark),
        accentForeground: themeBridge.getValue('semantic.color.text.primary', 'black', this.isDark),
        destructive: themeBridge.getValue(
          'semantic.color.feedback.error.default',
          '#ef4444',
          this.isDark
        ),
        destructiveForeground: themeBridge.getValue(
          'semantic.color.text.inverse',
          'white',
          this.isDark
        ),
        border: themeBridge.getValue('semantic.color.border.default', '#e5e7eb', this.isDark),
        input: themeBridge.getValue('semantic.color.border.default', '#e5e7eb', this.isDark),
        ring: themeBridge.getValue('semantic.color.focus.default', '#3b82f6', this.isDark),
        chart1: tokenHelpers.color('action.primary.default', this.isDark),
        chart2: tokenHelpers.color('feedback.success.default', this.isDark),
        chart3: tokenHelpers.color('feedback.warning.default', this.isDark),
        chart4: tokenHelpers.color('feedback.info.default', this.isDark),
        chart5: tokenHelpers.color('feedback.error.default', this.isDark),
      },
      fonts: {
        sans: themeBridge.getValue('typography.fontFamily.sans', 'system-ui, sans-serif'),
        serif: themeBridge.getValue('typography.fontFamily.serif', 'serif'),
        mono: themeBridge.getValue('typography.fontFamily.mono', 'monospace'),
      },
      radii: {
        sm: tokenHelpers.elevation('borderRadius', 'sm'),
        md: tokenHelpers.elevation('borderRadius', 'md'),
        lg: tokenHelpers.elevation('borderRadius', 'lg'),
        xl: tokenHelpers.elevation('borderRadius', 'xl'),
      },
      shadows: {
        xs: tokenHelpers.elevation('shadow', 'xs'),
        sm: tokenHelpers.elevation('shadow', 'sm'),
        md: tokenHelpers.elevation('shadow', 'md'),
        lg: tokenHelpers.elevation('shadow', 'lg'),
        xl: tokenHelpers.elevation('shadow', 'xl'),
        '2xl': tokenHelpers.elevation('shadow', '2xl'),
      },
    };
  }

  private extractTokenCategories() {
    const colorTokens = this.tokenResolver.getTokensByPattern(/^color\./);
    const spacingTokens = this.tokenResolver.getTokensByPattern(/^spacing\./);
    const typographyTokens = this.tokenResolver.getTokensByPattern(/^typography\./);
    const elevationTokens = this.tokenResolver.getTokensByPattern(/^elevation\./);
    const motionTokens = this.tokenResolver.getTokensByPattern(/^motion\./);
    const componentTokens = this.tokenResolver.getTokensByPattern(/^component\./);

    return {
      color: Object.fromEntries(colorTokens),
      spacing: Object.fromEntries(spacingTokens),
      typography: Object.fromEntries(typographyTokens),
      elevation: Object.fromEntries(elevationTokens),
      motion: Object.fromEntries(motionTokens),
      component: Object.fromEntries(componentTokens),
    };
  }

  private getSemanticColors() {
    return {
      background: {
        primary: tokenHelpers.color('background.primary', this.isDark),
        secondary: tokenHelpers.color('background.secondary', this.isDark),
        tertiary: tokenHelpers.color('background.tertiary', this.isDark),
      },
      surface: {
        default: tokenHelpers.color('surface.default', this.isDark),
        elevated: tokenHelpers.color('surface.elevated', this.isDark),
        sunken: tokenHelpers.color('surface.sunken', this.isDark),
      },
      border: {
        default: tokenHelpers.color('border.default', this.isDark),
        subtle: tokenHelpers.color('border.subtle', this.isDark),
        strong: tokenHelpers.color('border.strong', this.isDark),
      },
      text: {
        primary: tokenHelpers.color('text.primary', this.isDark),
        secondary: tokenHelpers.color('text.secondary', this.isDark),
        tertiary: tokenHelpers.color('text.tertiary', this.isDark),
        disabled: tokenHelpers.color('text.disabled', this.isDark),
        inverse: tokenHelpers.color('text.inverse', this.isDark),
      },
      action: {
        primary: {
          default: tokenHelpers.color('action.primary.default', this.isDark),
          hover: tokenHelpers.color('action.primary.hover', this.isDark),
          active: tokenHelpers.color('action.primary.active', this.isDark),
          disabled: tokenHelpers.color('action.primary.disabled', this.isDark),
        },
        secondary: {
          default: tokenHelpers.color('action.secondary.default', this.isDark),
          hover: tokenHelpers.color('action.secondary.hover', this.isDark),
          active: tokenHelpers.color('action.secondary.active', this.isDark),
          disabled: tokenHelpers.color('action.secondary.disabled', this.isDark),
        },
      },
      feedback: {
        success: {
          default: tokenHelpers.color('feedback.success.default', this.isDark),
          subtle: tokenHelpers.color('feedback.success.subtle', this.isDark),
        },
        warning: {
          default: tokenHelpers.color('feedback.warning.default', this.isDark),
          subtle: tokenHelpers.color('feedback.warning.subtle', this.isDark),
        },
        error: {
          default: tokenHelpers.color('feedback.error.default', this.isDark),
          subtle: tokenHelpers.color('feedback.error.subtle', this.isDark),
        },
        info: {
          default: tokenHelpers.color('feedback.info.default', this.isDark),
          subtle: tokenHelpers.color('feedback.info.subtle', this.isDark),
        },
      },
    };
  }

  private getComponentTokens() {
    const components = ['button', 'input', 'calendar'];
    const tokens: Record<string, any> = {};

    components.forEach((component) => {
      const componentTokens = this.tokenResolver.getTokensByPattern(
        new RegExp(`^component\\.${component}\\.`)
      );

      if (componentTokens.size > 0) {
        tokens[component] = Object.fromEntries(componentTokens);
      }
    });

    return tokens;
  }

  /**
   * Update theme when system theme changes
   */
  updateTheme(isDark?: boolean): EnhancedTheme {
    if (isDark !== undefined) {
      this.isDark = isDark;
    } else {
      this.detectTheme();
    }

    return this.generateTheme();
  }
}

// Global theme generator instance
const themeGenerator = new EnhancedThemeGenerator();

/**
 * Get current enhanced theme
 */
export function getCurrentEnhancedTheme(): EnhancedTheme {
  return themeGenerator.generateTheme();
}

/**
 * Enhanced Mantine theme with token integration
 */
export function createEnhancedMantineTheme(enhancedTheme: EnhancedTheme) {
  const baseTheme = createMantineTheme(enhancedTheme);

  return {
    ...baseTheme,
    other: {
      // Add token helpers for easy access in Mantine components
      tokens: enhancedTheme.tokens,
      semanticColors: enhancedTheme.semanticColors,
      componentTokens: enhancedTheme.componentTokens,
    },
    components: {
      ...baseTheme.components,
      Button: {
        styles: {
          root: {
            borderRadius: tokenHelpers.component('button', 'borderRadius'),
            fontSize: tokenHelpers.component('button', 'fontSize'),
            fontWeight: tokenHelpers.component('button', 'fontWeight'),
            transition: `${tokenHelpers.motion('transition.button.hover', 'duration')} ${tokenHelpers.motion('transition.button.hover', 'easing')}`,
          },
        },
      },
      TextInput: {
        styles: {
          input: {
            borderRadius: tokenHelpers.component('input', 'borderRadius'),
            fontSize: tokenHelpers.component('input.text', 'fontSize'),
            padding: `${tokenHelpers.component('input.text.padding', 'vertical')} ${tokenHelpers.component('input.text.padding', 'horizontal')}`,
          },
        },
      },
    },
  };
}

/**
 * Enhanced Ant Design theme with token integration
 */
export function createEnhancedAntdTheme(enhancedTheme: EnhancedTheme) {
  const baseTheme = createAntdTheme(enhancedTheme);

  return {
    ...baseTheme,
    token: {
      ...baseTheme.token,
      // Motion tokens
      motionDurationFast: tokenHelpers.motion('duration', 'fast'),
      motionDurationMid: tokenHelpers.motion('duration', 'normal'),
      motionDurationSlow: tokenHelpers.motion('duration', 'slow'),
      motionEaseInOut: tokenHelpers.motion('easing', 'easeInOut'),
      motionEaseOut: tokenHelpers.motion('easing', 'easeOut'),

      // Enhanced spacing
      paddingXS: tokenHelpers.spacing('1'),
      paddingSM: tokenHelpers.spacing('2'),
      padding: tokenHelpers.spacing('4'),
      paddingMD: tokenHelpers.spacing('4'),
      paddingLG: tokenHelpers.spacing('6'),
      paddingXL: tokenHelpers.spacing('8'),

      // Enhanced typography
      fontSizeSM: tokenHelpers.typography('body.small', 'fontSize'),
      fontSize: tokenHelpers.typography('body.normal', 'fontSize'),
      fontSizeLG: tokenHelpers.typography('body.large', 'fontSize'),
      fontSizeXL: tokenHelpers.typography('heading.h5', 'fontSize'),
      fontSizeHeading1: tokenHelpers.typography('heading.h1', 'fontSize'),
      fontSizeHeading2: tokenHelpers.typography('heading.h2', 'fontSize'),
      fontSizeHeading3: tokenHelpers.typography('heading.h3', 'fontSize'),
    },
    components: {
      ...baseTheme.components,
      Button: {
        ...baseTheme.components?.Button,
        algorithm: true, // Enable token algorithm
        token: {
          paddingInline: tokenHelpers.component('button.primary.padding', 'horizontal'),
          paddingBlock: tokenHelpers.component('button.primary.padding', 'vertical'),
          borderRadius: tokenHelpers.component('button.primary', 'borderRadius'),
          fontWeight: tokenHelpers.component('button.primary', 'fontWeight'),
        },
      },
      Input: {
        token: {
          paddingInline: tokenHelpers.component('input.text.padding', 'horizontal'),
          paddingBlock: tokenHelpers.component('input.text.padding', 'vertical'),
          borderRadius: tokenHelpers.component('input.text', 'borderRadius'),
          fontSize: tokenHelpers.component('input.text', 'fontSize'),
        },
      },
    },
  };
}

/**
 * Theme provider hook for React components
 */
export function useEnhancedTheme() {
  const [theme, setTheme] = React.useState<EnhancedTheme>(() => getCurrentEnhancedTheme());
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const updateTheme = () => {
      const newIsDark = document.documentElement.classList.contains('dark');
      setIsDark(newIsDark);
      setTheme(themeGenerator.updateTheme(newIsDark));
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Watch for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  return {
    theme,
    isDark,
    mantineTheme: createEnhancedMantineTheme(theme),
    antdTheme: createEnhancedAntdTheme(theme),
    tokens: theme.tokens,
    semanticColors: theme.semanticColors,
    componentTokens: theme.componentTokens,
  };
}

// React import check
let React: any;
try {
  React = require('react');
} catch {
  // React not available in Node environment
}

export default {
  getCurrentEnhancedTheme,
  createEnhancedMantineTheme,
  createEnhancedAntdTheme,
  useEnhancedTheme: React ? useEnhancedTheme : undefined,
  themeGenerator,
};
