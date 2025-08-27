/**
 * Component Token Registry
 *
 * Centralized system for component-specific design tokens that reference
 * base design system tokens using composite token patterns.
 *
 * Based on Design Tokens Community Group standards for:
 * - Composite token types with {token.reference} syntax
 * - Gradual migration with fallback patterns
 * - Component-specific token organization
 *
 * @see https://design-tokens.github.io/community-group/format/#composite-types
 */

import { useDesignTokens } from '@/lib/design-system/utils/token-bridge';

// Core Types for Component Token System
export interface ComponentTokenValue {
  /** Token reference using {token.path} syntax or direct value */
  value: string;
  /** Fallback value if token reference fails */
  fallback?: string;
  /** Description for documentation */
  description?: string;
}

export interface CompositeToken {
  /** Token type for validation */
  $type: string;
  /** Composite value structure */
  $value: Record<string, ComponentTokenValue | string>;
  /** Token description */
  $description?: string;
}

// Component Token Categories
export interface ComponentTokenRegistry {
  // Interactive Component Tokens
  button: ButtonTokens;
  card: CardTokens;
  modal: ModalTokens;

  // Calendar Component Tokens
  event: EventTokens;
  calendar: CalendarTokens;

  // Layout Component Tokens
  container: ContainerTokens;
  grid: GridTokens;

  // Form Component Tokens
  input: InputTokens;
  select: SelectTokens;
}

// Button Component Tokens
export interface ButtonTokens {
  variant: {
    primary: CompositeToken;
    secondary: CompositeToken;
    destructive: CompositeToken;
    ghost: CompositeToken;
    outline: CompositeToken;
  };
  size: {
    default: CompositeToken;
    sm: CompositeToken;
    lg: CompositeToken;
    icon: CompositeToken;
  };
  state: {
    hover: CompositeToken;
    active: CompositeToken;
    disabled: CompositeToken;
    focus: CompositeToken;
  };
}

// Event Component Tokens (for EventCard migration)
export interface EventTokens {
  category: {
    personal: CompositeToken;
    work: CompositeToken;
    effort: CompositeToken;
    note: CompositeToken;
  };
  state: {
    default: CompositeToken;
    hover: CompositeToken;
    selected: CompositeToken;
    dragging: CompositeToken;
  };
  size: {
    compact: CompositeToken;
    default: CompositeToken;
    expanded: CompositeToken;
  };
}

// Card Component Tokens
export interface CardTokens {
  variant: {
    default: CompositeToken;
    elevated: CompositeToken;
    outlined: CompositeToken;
    ghost: CompositeToken;
  };
  interactive: {
    hover: CompositeToken;
    active: CompositeToken;
    focus: CompositeToken;
  };
}

// Modal Component Tokens
export interface ModalTokens {
  overlay: CompositeToken;
  container: CompositeToken;
  header: CompositeToken;
  content: CompositeToken;
  footer: CompositeToken;
}

// Calendar Component Tokens
export interface CalendarTokens {
  grid: CompositeToken;
  cell: {
    default: CompositeToken;
    today: CompositeToken;
    selected: CompositeToken;
    outside: CompositeToken;
  };
  navigation: CompositeToken;
}

// Container Component Tokens
export interface ContainerTokens {
  page: CompositeToken;
  section: CompositeToken;
  card: CompositeToken;
}

// Grid Component Tokens
export interface GridTokens {
  container: CompositeToken;
  item: CompositeToken;
  gap: CompositeToken;
}

// Input Component Tokens
export interface InputTokens {
  variant: {
    default: CompositeToken;
    error: CompositeToken;
    success: CompositeToken;
    disabled: CompositeToken;
  };
  size: {
    sm: CompositeToken;
    default: CompositeToken;
    lg: CompositeToken;
  };
}

// Select Component Tokens
export interface SelectTokens {
  trigger: CompositeToken;
  content: CompositeToken;
  item: CompositeToken;
  separator: CompositeToken;
}

/**
 * Component Token Registry Implementation
 *
 * Creates composite tokens that reference base design system tokens
 * following the {token.reference} pattern from Design Tokens Community Group
 */
export const createComponentTokenRegistry = (): ComponentTokenRegistry => {
  return {
    // Button Component Tokens
    button: {
      variant: {
        primary: {
          $type: 'composite',
          $description: 'Primary button styling with brand colors',
          $value: {
            background: '{colors.primary}',
            foreground: '{colors.primary-foreground}',
            border: 'transparent',
            shadow: '{shadows.sm}',
            hoverBackground: '{colors.primary/90}',
            hoverShadow: '{shadows.md}',
          },
        },
        secondary: {
          $type: 'composite',
          $description: 'Secondary button styling',
          $value: {
            background: '{colors.secondary}',
            foreground: '{colors.secondary-foreground}',
            border: 'transparent',
            shadow: '{shadows.xs}',
            hoverBackground: '{colors.secondary/80}',
            hoverShadow: '{shadows.sm}',
          },
        },
        destructive: {
          $type: 'composite',
          $description: 'Destructive action button styling',
          $value: {
            background: '{colors.destructive}',
            foreground: '{colors.white}',
            border: 'transparent',
            shadow: '{shadows.xs}',
            hoverBackground: '{colors.destructive/90}',
            focusRing: '{colors.destructive/20}',
          },
        },
        ghost: {
          $type: 'composite',
          $description: 'Ghost button with minimal styling',
          $value: {
            background: 'transparent',
            foreground: '{colors.foreground}',
            border: 'transparent',
            hoverBackground: '{colors.accent}',
            hoverForeground: '{colors.accent-foreground}',
          },
        },
        outline: {
          $type: 'composite',
          $description: 'Outlined button variant',
          $value: {
            background: '{colors.background}',
            foreground: '{colors.foreground}',
            border: '{colors.border}',
            shadow: '{shadows.xs}',
            hoverBackground: '{colors.accent}',
            hoverForeground: '{colors.accent-foreground}',
          },
        },
      },
      size: {
        default: {
          $type: 'composite',
          $description: 'Default button size (44px minimum for touch targets)',
          $value: {
            height: '{spacing.11}', // 44px
            paddingX: '{spacing.4}',
            paddingY: '{spacing.2}',
            fontSize: '{typography.text-sm}',
            borderRadius: '{radii.md}',
          },
        },
        sm: {
          $type: 'composite',
          $description: 'Small button size',
          $value: {
            height: '{spacing.10}', // 40px
            paddingX: '{spacing.3}',
            paddingY: '{spacing.1.5}',
            fontSize: '{typography.text-sm}',
            borderRadius: '{radii.md}',
          },
        },
        lg: {
          $type: 'composite',
          $description: 'Large button size',
          $value: {
            height: '{spacing.12}', // 48px
            paddingX: '{spacing.6}',
            paddingY: '{spacing.2}',
            fontSize: '{typography.text-base}',
            borderRadius: '{radii.md}',
          },
        },
        icon: {
          $type: 'composite',
          $description: 'Square icon button (44px minimum)',
          $value: {
            width: '{spacing.11}', // 44px
            height: '{spacing.11}', // 44px
            padding: '0',
            borderRadius: '{radii.md}',
          },
        },
      },
      state: {
        hover: {
          $type: 'composite',
          $description: 'Hover state transformations',
          $value: {
            transform: 'scale(1.02) translateY(-0.5px)',
            transition: '{motion.transitions.hover}',
            shadow: '{shadows.md}',
          },
        },
        active: {
          $type: 'composite',
          $description: 'Active/pressed state',
          $value: {
            transform: 'scale(0.98)',
            transition: '{motion.transitions.press}',
            shadow: '{shadows.xs}',
          },
        },
        disabled: {
          $type: 'composite',
          $description: 'Disabled button state',
          $value: {
            opacity: '{opacity.50}',
            pointerEvents: 'none',
            cursor: 'not-allowed',
          },
        },
        focus: {
          $type: 'composite',
          $description: 'Focus ring for accessibility',
          $value: {
            outline: 'none',
            ring: '3px',
            ringColor: '{colors.ring/50}',
            ringOffset: '1px',
          },
        },
      },
    },

    // Event Component Tokens (EventCard migration)
    event: {
      category: {
        personal: {
          $type: 'composite',
          $description: 'Personal event category styling',
          $value: {
            background: '{colors.primary/10}',
            border: '{colors.primary/20}',
            accent: '{colors.primary}',
            foreground: '{colors.primary-foreground}',
          },
        },
        work: {
          $type: 'composite',
          $description: 'Work event category styling',
          $value: {
            background: '{colors.secondary/10}',
            border: '{colors.secondary/20}',
            accent: '{colors.secondary}',
            foreground: '{colors.secondary-foreground}',
          },
        },
        effort: {
          $type: 'composite',
          $description: 'Effort/task event category styling',
          $value: {
            background: '{colors.accent/10}',
            border: '{colors.accent/20}',
            accent: '{colors.accent}',
            foreground: '{colors.accent-foreground}',
          },
        },
        note: {
          $type: 'composite',
          $description: 'Note event category styling',
          $value: {
            background: '{colors.muted}',
            border: '{colors.border}',
            accent: '{colors.muted-foreground}',
            foreground: '{colors.muted-foreground}',
          },
        },
      },
      state: {
        default: {
          $type: 'composite',
          $description: 'Default event card state',
          $value: {
            shadow: '{shadows.sm}',
            borderRadius: '{radii.xl}',
            transition: '{motion.transitions.all}',
          },
        },
        hover: {
          $type: 'composite',
          $description: 'Event card hover state',
          $value: {
            shadow: '{shadows.md}',
            transform: 'scale(1.02) translateY(-0.5px)',
            transition: '{motion.transitions.hover}',
          },
        },
        selected: {
          $type: 'composite',
          $description: 'Selected event card state',
          $value: {
            ring: '2px',
            ringColor: '{colors.primary}',
            ringOffset: '2px',
            shadow: '{shadows.lg}',
          },
        },
        dragging: {
          $type: 'composite',
          $description: 'Event card being dragged',
          $value: {
            opacity: '{opacity.50}',
            transform: 'scale(0.95) rotate(2deg)',
            shadow: '{shadows.lg}',
            zIndex: '{zIndices.50}',
          },
        },
      },
      size: {
        compact: {
          $type: 'composite',
          $description: 'Compact event card for dense views',
          $value: {
            padding: '{spacing.2}',
            borderRadius: '{radii.md}',
            fontSize: '{typography.text-xs}',
          },
        },
        default: {
          $type: 'composite',
          $description: 'Default event card size',
          $value: {
            padding: '{spacing.4}',
            borderRadius: '{radii.xl}',
            fontSize: '{typography.text-sm}',
          },
        },
        expanded: {
          $type: 'composite',
          $description: 'Expanded event card with full details',
          $value: {
            padding: '{spacing.6}',
            borderRadius: '{radii.2xl}',
            fontSize: '{typography.text-base}',
          },
        },
      },
    },

    // Card Component Tokens
    card: {
      variant: {
        default: {
          $type: 'composite',
          $description: 'Default card styling',
          $value: {
            background: '{colors.card}',
            foreground: '{colors.card-foreground}',
            border: '{colors.border}',
            borderRadius: '{radii.xl}',
            shadow: '{shadows.sm}',
          },
        },
        elevated: {
          $type: 'composite',
          $description: 'Elevated card with stronger shadow',
          $value: {
            background: '{colors.card}',
            foreground: '{colors.card-foreground}',
            border: '{colors.border}',
            borderRadius: '{radii.xl}',
            shadow: '{shadows.lg}',
          },
        },
        outlined: {
          $type: 'composite',
          $description: 'Outlined card variant',
          $value: {
            background: '{colors.card}',
            foreground: '{colors.card-foreground}',
            border: '2px solid {colors.border}',
            borderRadius: '{radii.xl}',
            shadow: 'none',
          },
        },
        ghost: {
          $type: 'composite',
          $description: 'Ghost card with minimal styling',
          $value: {
            background: 'transparent',
            foreground: '{colors.foreground}',
            border: 'transparent',
            borderRadius: '{radii.xl}',
            shadow: 'none',
          },
        },
      },
      interactive: {
        hover: {
          $type: 'composite',
          $description: 'Card hover state',
          $value: {
            shadow: '{shadows.md}',
            transform: 'translateY(-1px)',
            transition: '{motion.transitions.hover}',
          },
        },
        active: {
          $type: 'composite',
          $description: 'Card active state',
          $value: {
            shadow: '{shadows.sm}',
            transform: 'translateY(0)',
            transition: '{motion.transitions.press}',
          },
        },
        focus: {
          $type: 'composite',
          $description: 'Card focus state',
          $value: {
            ring: '2px',
            ringColor: '{colors.ring}',
            ringOffset: '2px',
          },
        },
      },
    },

    // Modal Component Tokens
    modal: {
      overlay: {
        $type: 'composite',
        $description: 'Modal overlay/backdrop',
        $value: {
          background: '{colors.background/80}',
          backdropFilter: 'blur(8px)',
          zIndex: '{zIndices.50}',
        },
      },
      container: {
        $type: 'composite',
        $description: 'Modal container/dialog',
        $value: {
          background: '{colors.card}',
          foreground: '{colors.card-foreground}',
          border: '{colors.border}',
          borderRadius: '{radii.xl}',
          shadow: '{shadows.xl}',
          maxWidth: '90vw',
          maxHeight: '90vh',
        },
      },
      header: {
        $type: 'composite',
        $description: 'Modal header section',
        $value: {
          padding: '{spacing.6}',
          borderBottom: '1px solid {colors.border}',
          fontSize: '{typography.text-lg}',
          fontWeight: '{typography.font-semibold}',
        },
      },
      content: {
        $type: 'composite',
        $description: 'Modal content section',
        $value: {
          padding: '{spacing.6}',
          fontSize: '{typography.text-sm}',
          lineHeight: '{typography.leading-relaxed}',
        },
      },
      footer: {
        $type: 'composite',
        $description: 'Modal footer section',
        $value: {
          padding: '{spacing.6}',
          borderTop: '1px solid {colors.border}',
          display: 'flex',
          gap: '{spacing.3}',
          justifyContent: 'flex-end',
        },
      },
    },

    // Calendar Component Tokens
    calendar: {
      grid: {
        $type: 'composite',
        $description: 'Calendar grid container',
        $value: {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '{spacing.1}',
          padding: '{spacing.4}',
        },
      },
      cell: {
        default: {
          $type: 'composite',
          $description: 'Default calendar cell',
          $value: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '{spacing.10}',
            borderRadius: '{radii.md}',
            fontSize: '{typography.text-sm}',
            cursor: 'pointer',
            transition: '{motion.transitions.all}',
          },
        },
        today: {
          $type: 'composite',
          $description: "Today's date cell",
          $value: {
            background: '{colors.primary}',
            color: '{colors.primary-foreground}',
            fontWeight: '{typography.font-semibold}',
          },
        },
        selected: {
          $type: 'composite',
          $description: 'Selected calendar cell',
          $value: {
            background: '{colors.accent}',
            color: '{colors.accent-foreground}',
            ring: '2px',
            ringColor: '{colors.ring}',
          },
        },
        outside: {
          $type: 'composite',
          $description: 'Outside month calendar cell',
          $value: {
            color: '{colors.muted-foreground}',
            opacity: '{opacity.50}',
          },
        },
      },
      navigation: {
        $type: 'composite',
        $description: 'Calendar navigation controls',
        $value: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '{spacing.4}',
          background: '{colors.muted/30}',
          borderRadius: '{radii.lg}',
        },
      },
    },

    // Container Component Tokens
    container: {
      page: {
        $type: 'composite',
        $description: 'Page-level container',
        $value: {
          maxWidth: '1200px',
          margin: '0 auto',
          paddingX: '{spacing.4}',
          paddingY: '{spacing.8}',
        },
      },
      section: {
        $type: 'composite',
        $description: 'Section container',
        $value: {
          padding: '{spacing.6}',
          marginY: '{spacing.8}',
          borderRadius: '{radii.xl}',
        },
      },
      card: {
        $type: 'composite',
        $description: 'Card container',
        $value: {
          background: '{colors.card}',
          border: '{colors.border}',
          borderRadius: '{radii.xl}',
          padding: '{spacing.6}',
          shadow: '{shadows.sm}',
        },
      },
    },

    // Grid Component Tokens
    grid: {
      container: {
        $type: 'composite',
        $description: 'Grid container',
        $value: {
          display: 'grid',
          gap: '{spacing.4}',
          width: '100%',
        },
      },
      item: {
        $type: 'composite',
        $description: 'Grid item',
        $value: {
          display: 'flex',
          flexDirection: 'column',
        },
      },
      gap: {
        $type: 'composite',
        $description: 'Grid gap variations',
        $value: {
          none: '0',
          xs: '{spacing.1}',
          sm: '{spacing.2}',
          md: '{spacing.4}',
          lg: '{spacing.6}',
          xl: '{spacing.8}',
        },
      },
    },

    // Input Component Tokens
    input: {
      variant: {
        default: {
          $type: 'composite',
          $description: 'Default input styling',
          $value: {
            background: '{colors.background}',
            border: '{colors.border}',
            borderRadius: '{radii.md}',
            padding: '{spacing.2} {spacing.3}',
            fontSize: '{typography.text-sm}',
            focusRing: '2px',
            focusRingColor: '{colors.ring}',
          },
        },
        error: {
          $type: 'composite',
          $description: 'Error state input',
          $value: {
            borderColor: '{colors.destructive}',
            focusRingColor: '{colors.destructive/20}',
            color: '{colors.foreground}',
          },
        },
        success: {
          $type: 'composite',
          $description: 'Success state input',
          $value: {
            borderColor: '{colors.success}',
            focusRingColor: '{colors.success/20}',
            color: '{colors.foreground}',
          },
        },
        disabled: {
          $type: 'composite',
          $description: 'Disabled input state',
          $value: {
            background: '{colors.muted}',
            color: '{colors.muted-foreground}',
            cursor: 'not-allowed',
            opacity: '{opacity.50}',
          },
        },
      },
      size: {
        sm: {
          $type: 'composite',
          $description: 'Small input size',
          $value: {
            height: '{spacing.8}',
            fontSize: '{typography.text-xs}',
            padding: '{spacing.1} {spacing.2}',
          },
        },
        default: {
          $type: 'composite',
          $description: 'Default input size',
          $value: {
            height: '{spacing.10}',
            fontSize: '{typography.text-sm}',
            padding: '{spacing.2} {spacing.3}',
          },
        },
        lg: {
          $type: 'composite',
          $description: 'Large input size',
          $value: {
            height: '{spacing.12}',
            fontSize: '{typography.text-base}',
            padding: '{spacing.3} {spacing.4}',
          },
        },
      },
    },

    // Select Component Tokens
    select: {
      trigger: {
        $type: 'composite',
        $description: 'Select trigger button',
        $value: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '{colors.background}',
          border: '{colors.border}',
          borderRadius: '{radii.md}',
          padding: '{spacing.2} {spacing.3}',
          fontSize: '{typography.text-sm}',
          cursor: 'pointer',
          focusRing: '2px',
          focusRingColor: '{colors.ring}',
        },
      },
      content: {
        $type: 'composite',
        $description: 'Select dropdown content',
        $value: {
          background: '{colors.popover}',
          border: '{colors.border}',
          borderRadius: '{radii.md}',
          shadow: '{shadows.lg}',
          padding: '{spacing.1}',
          zIndex: '{zIndices.50}',
        },
      },
      item: {
        $type: 'composite',
        $description: 'Select dropdown item',
        $value: {
          display: 'flex',
          alignItems: 'center',
          padding: '{spacing.2} {spacing.3}',
          borderRadius: '{radii.sm}',
          fontSize: '{typography.text-sm}',
          cursor: 'pointer',
          hoverBackground: '{colors.accent}',
          hoverColor: '{colors.accent-foreground}',
        },
      },
      separator: {
        $type: 'composite',
        $description: 'Select dropdown separator',
        $value: {
          height: '1px',
          background: '{colors.border}',
          marginY: '{spacing.1}',
        },
      },
    },
  };
};

/**
 * Hook for accessing component tokens
 *
 * Provides type-safe access to component tokens with fallback handling
 */
export const useComponentTokens = () => {
  const registry = createComponentTokenRegistry();
  const { resolveToken } = useDesignTokens();

  const getComponentToken = (tokenPath: string): string => {
    try {
      // Parse token path (e.g., "button.variant.primary.background")
      const parts = tokenPath.split('.');
      let current: any = registry;

      for (const part of parts) {
        current = current?.[part];
      }

      if (current && typeof current === 'object' && current.$value) {
        const value = current.$value;
        if (typeof value === 'string') {
          return resolveToken(value);
        }
        // For composite values, return the object
        return value;
      }

      // Fallback to direct token resolution
      return resolveToken(tokenPath);
    } catch (error) {
      console.warn(`Failed to resolve component token: ${tokenPath}`, error);
      return tokenPath; // Return original path as fallback
    }
  };

  return {
    registry,
    getComponentToken,
    tokens: registry,
  };
};

/**
 * CSS-in-JS helper for component tokens
 *
 * Generates CSS classes from component token definitions
 */
export const createComponentClasses = (tokenDefinition: CompositeToken): Record<string, string> => {
  const classes: Record<string, string> = {};

  if (tokenDefinition.$value && typeof tokenDefinition.$value === 'object') {
    Object.entries(tokenDefinition.$value).forEach(([property, value]) => {
      if (typeof value === 'string') {
        // Convert token references to CSS custom properties
        if (value.startsWith('{') && value.endsWith('}')) {
          const tokenName = value.slice(1, -1).replace(/\./g, '-');
          classes[property] = `var(--${tokenName})`;
        } else {
          classes[property] = value;
        }
      }
    });
  }

  return classes;
};

export default createComponentTokenRegistry;
