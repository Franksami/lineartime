/**
 * Token Bridge Utility
 * Bridges Style Dictionary tokens with existing theme systems
 * Provides seamless integration without breaking existing components
 */

import { BaseTheme } from '../../theme/unified-theme';

// Import the generated tokens (will be available after build)
let generatedTokens: any = {};
try {
  generatedTokens = require('../tokens/tokens.json');
} catch (_error) {
  console.warn('Generated tokens not found. Run `npm run build:tokens` first.');
}

/**
 * Token resolver that handles references and fallbacks
 */
export class TokenResolver {
  private tokens: Map<string, any>;
  private resolvedCache: Map<string, string>;

  constructor(tokens: any) {
    this.tokens = new Map();
    this.resolvedCache = new Map();
    this.flattenTokens(tokens, '');
  }

  private flattenTokens(obj: any, prefix: string): void {
    Object.keys(obj).forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value && typeof value === 'object' && value.value !== undefined) {
        // This is a token
        this.tokens.set(path, value);
      } else if (value && typeof value === 'object') {
        // This is a group, recurse
        this.flattenTokens(value, path);
      }
    });
  }

  /**
   * Resolve a token path to its final value
   */
  resolve(tokenPath: string): string {
    if (this.resolvedCache.has(tokenPath)) {
      return this.resolvedCache.get(tokenPath)!;
    }

    const token = this.tokens.get(tokenPath);
    if (!token) {
      console.warn(`Token not found: ${tokenPath}`);
      return tokenPath; // Return the path as fallback
    }

    let value = token.value;

    // Handle references
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const referencePath = value.slice(1, -1);
      value = this.resolve(referencePath);
    }

    this.resolvedCache.set(tokenPath, value);
    return value;
  }

  /**
   * Get all tokens matching a pattern
   */
  getTokensByPattern(pattern: RegExp): Map<string, string> {
    const result = new Map();
    this.tokens.forEach((_token, path) => {
      if (pattern.test(path)) {
        result.set(path, this.resolve(path));
      }
    });
    return result;
  }

  /**
   * Get token with theme-aware fallback
   */
  getWithFallback(tokenPath: string, fallback: string, isDark = false): string {
    const token = this.tokens.get(tokenPath);
    if (!token) return fallback;

    // Check for dark mode variant
    if (isDark && token.darkValue) {
      return typeof token.darkValue === 'string' && token.darkValue.startsWith('{')
        ? this.resolve(token.darkValue.slice(1, -1))
        : token.darkValue;
    }

    return this.resolve(tokenPath);
  }
}

// Global token resolver instance
export const tokenResolver = new TokenResolver(generatedTokens);

/**
 * Enhanced theme bridge that combines generated tokens with existing CSS variables
 */
export class ThemeBridge {
  private resolver: TokenResolver;
  private cssVariables: Map<string, string>;

  constructor() {
    this.resolver = tokenResolver;
    this.cssVariables = new Map();
    this.loadCSSVariables();
  }

  private loadCSSVariables(): void {
    if (typeof window === 'undefined') return;

    const computedStyle = getComputedStyle(document.documentElement);
    const variables = [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--destructive-foreground',
      '--border',
      '--input',
      '--ring',
      '--radius',
    ];

    variables.forEach((variable) => {
      const value = computedStyle.getPropertyValue(variable).trim();
      if (value) {
        this.cssVariables.set(variable.substring(2), value); // Remove -- prefix
      }
    });
  }

  /**
   * Get a design system value with intelligent fallback
   * 1. Try generated tokens
   * 2. Try CSS variables
   * 3. Use provided fallback
   */
  getValue(tokenPath: string, fallback?: string, isDark = false): string {
    // Try token resolver first
    const resolved = this.resolver.getWithFallback(tokenPath, '', isDark);
    if (resolved && resolved !== tokenPath) {
      return resolved;
    }

    // Try CSS variables
    const cssVar = this.cssVariables.get(tokenPath);
    if (cssVar) {
      return cssVar;
    }

    // Use fallback or return path
    return fallback || tokenPath;
  }

  /**
   * Get semantic color with theme awareness
   */
  getSemanticColor(semantic: string, variant = 'default', isDark = false): string {
    const tokenPath = `semantic.color.${semantic}.${variant}`;
    const fallbackPath = semantic.replace('.', '-');

    return this.getValue(tokenPath, this.cssVariables.get(fallbackPath), isDark);
  }

  /**
   * Get component token with fallback to base tokens
   */
  getComponentToken(
    component: string,
    property: string,
    variant = 'default',
    isDark = false
  ): string {
    const componentPath = `component.${component}.${property}.${variant}`;
    const semanticPath = `semantic.${property}.${variant}`;

    let value = this.getValue(componentPath, '', isDark);
    if (!value || value === componentPath) {
      value = this.getValue(semanticPath, '', isDark);
    }

    return value;
  }

  /**
   * Create CSS custom properties from tokens
   */
  generateCSSVariables(prefix = 'ds'): string {
    const variables: string[] = [];

    this.resolver.tokens.forEach((_token, path) => {
      const cssVarName = `--${prefix}-${path.replace(/\./g, '-')}`;
      const value = this.resolver.resolve(path);
      variables.push(`  ${cssVarName}: ${value};`);
    });

    return `:root {\n${variables.join('\n')}\n}`;
  }
}

// Global theme bridge instance
export const themeBridge = new ThemeBridge();

/**
 * Backward compatibility helpers for existing components
 */
export const tokenHelpers = {
  /**
   * Get color token with automatic dark mode support
   */
  color: (path: string, isDark = false): string => {
    return themeBridge.getValue(`semantic.color.${path}`, undefined, isDark);
  },

  /**
   * Get spacing token
   */
  spacing: (size: string): string => {
    return themeBridge.getValue(`spacing.${size}`, `${size}rem`);
  },

  /**
   * Get typography token
   */
  typography: (category: string, property: string): string => {
    return themeBridge.getValue(`semantic.typography.${category}.${property}`, undefined);
  },

  /**
   * Get elevation token (shadow, radius, etc.)
   */
  elevation: (type: string, size: string): string => {
    return themeBridge.getValue(`elevation.${type}.${size}`, undefined);
  },

  /**
   * Get motion token
   */
  motion: (category: string, property: string): string => {
    return themeBridge.getValue(`motion.${category}.${property}`, undefined);
  },

  /**
   * Get component-specific token
   */
  component: (component: string, property: string, variant = 'default', isDark = false): string => {
    return themeBridge.getComponentToken(component, property, variant, isDark);
  },
};

/**
 * Hook for React components to use tokens
 */
export function useTokens() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return {
    isDark,
    get: (path: string, fallback?: string) => themeBridge.getValue(path, fallback, isDark),
    getSemanticColor: (semantic: string, variant?: string) =>
      themeBridge.getSemanticColor(semantic, variant, isDark),
    getComponentToken: (component: string, property: string, variant?: string) =>
      themeBridge.getComponentToken(component, property, variant, isDark),
    helpers: tokenHelpers,
  };
}

// React import check
let React: any;
try {
  React = require('react');
} catch {
  // React not available in Node environment
}

// Backward compatibility exports for existing components
export const TokenBridge = ThemeBridge;
export const useDesignTokens = React ? useTokens : undefined;

export default {
  tokenResolver,
  themeBridge,
  tokenHelpers,
  useTokens: React ? useTokens : undefined,
  // Backward compatibility
  TokenBridge,
  useDesignTokens,
};
