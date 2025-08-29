/**
 * Command Center Controversial Theme System
 *
 * Sophisticated design system combining Timepage award-winning excellence
 * with Andrew Tate controversial positioning for money-focused professionals.
 *
 * Design Philosophy: "Sophisticated controversy for elite results"
 * Visual Strategy: Professional polish + polarizing edge + money focus
 *
 * @version 1.0.0 (Revolutionary Theme Release)
 * @author Command Center Design Team
 */

// ASCII Theme System Architecture
const CHEATCAL_THEME_ARCHITECTURE = `
CHEATCAL CONTROVERSIAL THEME SYSTEM ARCHITECTURE
═══════════════════════════════════════════════════════════════════

SOPHISTICATED CONTROVERSY DESIGN PRINCIPLES:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ 🏆 TIMEPAGE EXCELLENCE FOUNDATION:                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Typography: Numerical emphasis + sophisticated hierarchy    │ │
│ │ Color Theory: Professional psychology + award-winning      │ │
│ │ Animations: Physics-based smoothness + delightful polish   │ │
│ │ Layout: Perfect alignment + elegant spacing systems        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ 💀 CONTROVERSIAL INTEGRATION:                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Brand Identity: Skull + crown + money symbols              │ │
│ │ Color Palette: Danger red + stealth black + success green  │ │
│ │ Messaging: "Productivity cheating" + "money over privacy"  │ │
│ │ Typography: Bold controversy + elite professional polish   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ 💰 MONEY-FOCUSED EXCELLENCE:                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Metrics: Revenue impact + ROI tracking + value creation    │ │
│ │ Success: Achievement celebrations + milestone animations    │ │
│ │ Elite Status: Premium indicators + sophistication markers  │ │
│ │ Professional: Enterprise quality + money-getter messaging  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
`;

/**
 * Command Center Theme Configuration Interface
 */
export interface CheatCalTheme {
  name: string;
  displayName: string;
  controversy_level: 'minimal' | 'moderate' | 'maximum' | 'chaos';
  target_audience: 'enterprise' | 'entrepreneurs' | 'money_getters' | 'elite_professionals';

  // Color System (Sophisticated + Controversial)
  colors: {
    // Primary controversial colors
    controversy_red: string; // Danger, urgency, power
    stealth_black: string; // Mystery, authority, elite
    success_green: string; // Money, growth, optimization
    warning_orange: string; // Attention, caution, action
    value_gold: string; // Wealth, premium, achievement

    // Professional sophistication colors
    intelligence_blue: string; // Trust, data, AI systems
    premium_purple: string; // Luxury, exclusivity, power
    tech_silver: string; // Precision, quality, future
    elite_white: string; // Purity, sophistication, premium

    // Semantic color applications
    background: string;
    foreground: string;
    card: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };

  // Typography System (Timepage-Inspired Excellence)
  typography: {
    // Font families
    display: string; // Headlines and brand elements
    body: string; // Content and interface text
    mono: string; // Code, data, technical elements

    // Font feature settings
    numerical_emphasis: boolean; // Tabular numbers for money/metrics
    sophisticated_ligatures: boolean; // Professional typography features

    // Hierarchy system
    scale: {
      display_large: string; // 48px - Controversial headers
      display_medium: string; // 32px - Section titles
      headline_large: string; // 24px - Component headers
      body_large: string; // 16px - Primary content
      body_small: string; // 14px - Secondary content
      caption: string; // 12px - Labels and metadata
    };
  };

  // Animation System (60+ FPS Excellence)
  animations: {
    // Timing functions
    smooth: string; // General transitions
    micro: string; // Hover and click feedback
    dramatic: string; // Value celebrations
    invisible: string; // Overlay appearances

    // Spring physics
    spring_gentle: any; // Subtle interactions
    spring_snappy: any; // Responsive feedback
    spring_dramatic: any; // Success celebrations

    // Controversy-specific
    monitoring_pulse: any; // Privacy monitoring indicators
    success_explosion: any; // Achievement celebrations
    danger_shake: any; // Warning animations
  };

  // Controversial Elements
  controversy: {
    monitoring_indicators: boolean; // Show privacy monitoring status
    success_celebrations: boolean; // Bold achievement animations
    money_focus_messaging: boolean; // Revenue-focused copy
    elite_positioning: boolean; // Exclusive professional messaging
    surveillance_transparency: boolean; // Honest about monitoring
  };
}

/**
 * Command Center Theme Definitions
 */

// STEALTH MODE: Professional discretion with controlled controversy
export const STEALTH_THEME: CheatCalTheme = {
  name: 'stealth',
  displayName: '👻 Stealth Elite',
  controversy_level: 'minimal',
  target_audience: 'enterprise',

  colors: {
    controversy_red: '#DC2626', // Subdued red for warnings
    stealth_black: '#0A0A0A', // Deep professional black
    success_green: '#059669', // Professional success green
    warning_orange: '#D97706', // Controlled warning orange
    value_gold: '#CA8A04', // Sophisticated gold
    intelligence_blue: '#2563EB', // Trust and intelligence
    premium_purple: '#7C3AED', // Luxury and exclusivity
    tech_silver: '#64748B', // Technical sophistication
    elite_white: '#F8FAFC', // Pure professional white

    // Semantic applications
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    card: '#F8FAFC',
    border: '#E2E8F0',
    primary: '#1E293B',
    secondary: '#64748B',
    accent: '#7C3AED',
    muted: '#F1F5F9',
  },

  typography: {
    display: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    numerical_emphasis: true,
    sophisticated_ligatures: true,

    scale: {
      display_large: '3rem', // 48px
      display_medium: '2rem', // 32px
      headline_large: '1.5rem', // 24px
      body_large: '1rem', // 16px
      body_small: '0.875rem', // 14px
      caption: '0.75rem', // 12px
    },
  },

  animations: {
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    micro: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    invisible: 'cubic-bezier(0.16, 1, 0.3, 1)',

    spring_gentle: { stiffness: 300, damping: 30, mass: 0.8 },
    spring_snappy: { stiffness: 400, damping: 25, mass: 0.6 },
    spring_dramatic: { stiffness: 500, damping: 20, mass: 1.0 },

    monitoring_pulse: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    success_explosion: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] },
    danger_shake: { duration: 0.5, ease: 'easeInOut' },
  },

  controversy: {
    monitoring_indicators: false, // Minimal monitoring visibility
    success_celebrations: true, // Professional success feedback
    money_focus_messaging: true, // Money-focused but professional
    elite_positioning: true, // Sophisticated exclusivity
    surveillance_transparency: false, // Discrete about monitoring
  },
};

// AGGRESSIVE MODE: Andrew Tate controversial positioning with sophistication
export const AGGRESSIVE_THEME: CheatCalTheme = {
  name: 'aggressive',
  displayName: '🔥 Aggressive Elite',
  controversy_level: 'moderate',
  target_audience: 'entrepreneurs',

  colors: {
    controversy_red: '#EF4444', // Bold controversial red
    stealth_black: '#0A0A0A', // Authority black
    success_green: '#10B981', // Vibrant success green
    warning_orange: '#F59E0B', // Attention-grabbing orange
    value_gold: '#F59E0B', // Premium wealth gold
    intelligence_blue: '#3B82F6', // AI and data intelligence
    premium_purple: '#8B5CF6', // Power and exclusivity
    tech_silver: '#94A3B8', // Sophisticated technology
    elite_white: '#FFFFFF', // Pure elite white

    // Semantic applications with controversy
    background: '#FFFFFF',
    foreground: '#111827',
    card: '#F9FAFB',
    border: '#D1D5DB',
    primary: '#EF4444', // Controversial red primary
    secondary: '#F59E0B', // Wealth gold secondary
    accent: '#10B981', // Success green accent
    muted: '#F3F4F6',
  },

  typography: {
    display: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    numerical_emphasis: true,
    sophisticated_ligatures: true,

    scale: {
      display_large: '3rem', // Bold controversial headers
      display_medium: '2.25rem', // Prominent section titles
      headline_large: '1.75rem', // Strong component headers
      body_large: '1rem', // Clear content
      body_small: '0.875rem', // Supporting text
      caption: '0.75rem', // Fine print and labels
    },
  },

  animations: {
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    micro: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Snappier feedback
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // More dramatic
    invisible: 'cubic-bezier(0.16, 1, 0.3, 1)',

    spring_gentle: { stiffness: 350, damping: 28, mass: 0.7 },
    spring_snappy: { stiffness: 450, damping: 22, mass: 0.5 },
    spring_dramatic: { stiffness: 550, damping: 18, mass: 1.2 },

    monitoring_pulse: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    success_explosion: { duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] },
    danger_shake: { duration: 0.4, ease: 'easeInOut' },
  },

  controversy: {
    monitoring_indicators: true, // Show monitoring status clearly
    success_celebrations: true, // Bold achievement feedback
    money_focus_messaging: true, // Direct money-focused copy
    elite_positioning: true, // Strong elite messaging
    surveillance_transparency: true, // Honest about monitoring capabilities
  },
};

// MAXIMUM CHAOS MODE: Full controversial power for maximum money-getters
export const MAXIMUM_CHAOS_THEME: CheatCalTheme = {
  name: 'maximum_chaos',
  displayName: '💀 Maximum Chaos',
  controversy_level: 'chaos',
  target_audience: 'money_getters',

  colors: {
    controversy_red: '#DC2626', // Maximum danger red
    stealth_black: '#000000', // Pure authority black
    success_green: '#00FF88', // Toxic success green
    warning_orange: '#FF8C00', // Maximum warning orange
    value_gold: '#FFD700', // Pure wealth gold
    intelligence_blue: '#00BFFF', // Electric AI blue
    premium_purple: '#8A2BE2', // Royal power purple
    tech_silver: '#C0C0C0', // Precision silver
    elite_white: '#FFFFFF', // Pure elite white

    // High-contrast controversial semantics
    background: '#000000', // Black authority background
    foreground: '#FFFFFF', // Pure white text
    card: '#111111', // Dark authority cards
    border: '#333333', // Subtle dark borders
    primary: '#FF2B2B', // Maximum controversy red
    secondary: '#FFD700', // Wealth gold
    accent: '#00FF88', // Toxic success green
    muted: '#222222', // Dark muted areas
  },

  typography: {
    display: '"JetBrains Mono", monospace', // Tech/hacker aesthetic
    body: '"Inter", system-ui, sans-serif',
    mono: '"Fira Code", monospace', // Code-focused typography
    numerical_emphasis: true,
    sophisticated_ligatures: true,

    scale: {
      display_large: '3.5rem', // Maximum impact headers
      display_medium: '2.5rem', // Bold section titles
      headline_large: '2rem', // Strong component headers
      body_large: '1.125rem', // Prominent content
      body_small: '1rem', // Clear supporting text
      caption: '0.875rem', // Visible labels
    },
  },

  animations: {
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    micro: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy aggressive feedback
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Maximum drama
    invisible: 'cubic-bezier(0.16, 1, 0.3, 1)',

    spring_gentle: { stiffness: 400, damping: 25, mass: 0.6 },
    spring_snappy: { stiffness: 500, damping: 20, mass: 0.4 },
    spring_dramatic: { stiffness: 600, damping: 15, mass: 1.5 },

    monitoring_pulse: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    success_explosion: { duration: 1.0, ease: [0.68, -0.55, 0.265, 1.55] },
    danger_shake: { duration: 0.3, ease: 'easeInOut' },
  },

  controversy: {
    monitoring_indicators: true, // Full monitoring transparency
    success_celebrations: true, // Maximum achievement celebrations
    money_focus_messaging: true, // Direct money-focused messaging
    elite_positioning: true, // Elite exclusivity positioning
    surveillance_transparency: true, // Complete transparency about surveillance
  },
};

// ELITE SUCCESS MODE: Wealth-focused sophistication
export const ELITE_SUCCESS_THEME: CheatCalTheme = {
  name: 'elite_success',
  displayName: '👑 Elite Success',
  controversy_level: 'moderate',
  target_audience: 'elite_professionals',

  colors: {
    controversy_red: '#B91C1C', // Refined controversy red
    stealth_black: '#111827', // Sophisticated dark
    success_green: '#059669', // Professional success
    warning_orange: '#D97706', // Elegant warning
    value_gold: '#D97706', // Rich wealth gold
    intelligence_blue: '#1D4ED8', // Deep intelligence blue
    premium_purple: '#7C2D92', // Royal luxury purple
    tech_silver: '#9CA3AF', // Refined technology silver
    elite_white: '#F9FAFB', // Sophisticated white

    // Wealth-focused semantic colors
    background: '#F9FAFB',
    foreground: '#111827',
    card: '#FFFFFF',
    border: '#D1D5DB',
    primary: '#D97706', // Wealth gold primary
    secondary: '#059669', // Success green secondary
    accent: '#7C2D92', // Premium purple accent
    muted: '#F3F4F6',
  },

  typography: {
    display: '"SF Pro Display", system-ui, sans-serif', // Apple-quality typography
    body: '"SF Pro Text", system-ui, sans-serif',
    mono: '"SF Mono", "Monaco", monospace',
    numerical_emphasis: true,
    sophisticated_ligatures: true,

    scale: {
      display_large: '3rem', // Elegant sophisticated headers
      display_medium: '2.125rem', // Refined section titles
      headline_large: '1.625rem', // Premium component headers
      body_large: '1rem', // Sophisticated content
      body_small: '0.875rem', // Elegant supporting text
      caption: '0.75rem', // Refined labels
    },
  },

  animations: {
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    micro: 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Apple-like responsiveness
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    invisible: 'cubic-bezier(0.16, 1, 0.3, 1)',

    spring_gentle: { stiffness: 280, damping: 35, mass: 0.9 }, // Refined elegance
    spring_snappy: { stiffness: 380, damping: 28, mass: 0.7 }, // Professional response
    spring_dramatic: { stiffness: 480, damping: 22, mass: 1.1 }, // Sophisticated celebration

    monitoring_pulse: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    success_explosion: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    danger_shake: { duration: 0.4, ease: 'easeInOut' },
  },

  controversy: {
    monitoring_indicators: true, // Sophisticated monitoring display
    success_celebrations: true, // Elegant achievement feedback
    money_focus_messaging: true, // Wealth-focused but refined
    elite_positioning: true, // Premium exclusivity
    surveillance_transparency: true, // Professional honesty about capabilities
  },
};

/**
 * Command Center Theme System Manager
 */
export class CheatCalThemeSystem {
  private currentTheme: CheatCalTheme = AGGRESSIVE_THEME;
  private themeChangeCallbacks: ((theme: CheatCalTheme) => void)[] = [];

  constructor() {
    console.log('🎨 Command Center Theme System initializing...');
    console.log(CHEATCAL_THEME_ARCHITECTURE);
  }

  /**
   * Get Available Themes
   */
  getAvailableThemes(): CheatCalTheme[] {
    return [STEALTH_THEME, AGGRESSIVE_THEME, MAXIMUM_CHAOS_THEME, ELITE_SUCCESS_THEME];
  }

  /**
   * Get Current Theme
   */
  getCurrentTheme(): CheatCalTheme {
    return this.currentTheme;
  }

  /**
   * Switch Theme with Sophisticated Animation
   */
  switchTheme(themeName: string): void {
    const themes = this.getAvailableThemes();
    const newTheme = themes.find((theme) => theme.name === themeName);

    if (!newTheme) {
      throw new Error(`Theme '${themeName}' not found in Command Center theme system`);
    }

    console.log(
      `🎭 Switching to ${newTheme.displayName} theme (${newTheme.controversy_level} controversy)`
    );

    this.currentTheme = newTheme;
    this.applyThemeToDOM(newTheme);
    this.notifyThemeChange(newTheme);
  }

  /**
   * Apply Theme to DOM (CSS Custom Properties)
   */
  private applyThemeToDOM(theme: CheatCalTheme): void {
    const root = document.documentElement;

    // Apply color system
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--cheatcal-${key.replace('_', '-')}`, value);
    });

    // Apply typography system
    root.style.setProperty('--cheatcal-font-display', theme.typography.display);
    root.style.setProperty('--cheatcal-font-body', theme.typography.body);
    root.style.setProperty('--cheatcal-font-mono', theme.typography.mono);

    // Apply typography scale
    Object.entries(theme.typography.scale).forEach(([key, value]) => {
      root.style.setProperty(`--cheatcal-text-${key.replace('_', '-')}`, value);
    });

    // Apply animation timings
    Object.entries(theme.animations).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--cheatcal-ease-${key.replace('_', '-')}`, value);
      }
    });

    // Set theme class for conditional styling
    root.className = root.className.replace(/cheatcal-theme-\w+/g, '');
    root.classList.add(`cheatcal-theme-${theme.name}`);

    console.log(`✅ ${theme.displayName} theme applied to DOM`);
  }

  /**
   * Generate CSS Variables for Theme
   */
  generateCSSVariables(theme: CheatCalTheme): string {
    return `
/* Command Center ${theme.displayName} Theme Variables */
:root.cheatcal-theme-${theme.name} {
  /* Controversial Color System */
  --cheatcal-controversy-red: ${theme.colors.controversy_red};
  --cheatcal-stealth-black: ${theme.colors.stealth_black}; 
  --cheatcal-success-green: ${theme.colors.success_green};
  --cheatcal-warning-orange: ${theme.colors.warning_orange};
  --cheatcal-value-gold: ${theme.colors.value_gold};
  
  /* Professional Sophistication */
  --cheatcal-intelligence-blue: ${theme.colors.intelligence_blue};
  --cheatcal-premium-purple: ${theme.colors.premium_purple};
  --cheatcal-tech-silver: ${theme.colors.tech_silver};
  --cheatcal-elite-white: ${theme.colors.elite_white};
  
  /* Semantic Color Applications */
  --cheatcal-background: ${theme.colors.background};
  --cheatcal-foreground: ${theme.colors.foreground};
  --cheatcal-card: ${theme.colors.card};
  --cheatcal-border: ${theme.colors.border};
  --cheatcal-primary: ${theme.colors.primary};
  --cheatcal-secondary: ${theme.colors.secondary};
  --cheatcal-accent: ${theme.colors.accent};
  --cheatcal-muted: ${theme.colors.muted};
  
  /* Typography System */
  --cheatcal-font-display: ${theme.typography.display};
  --cheatcal-font-body: ${theme.typography.body};
  --cheatcal-font-mono: ${theme.typography.mono};
  
  /* Typography Scale */
  --cheatcal-text-display-large: ${theme.typography.scale.display_large};
  --cheatcal-text-display-medium: ${theme.typography.scale.display_medium};
  --cheatcal-text-headline-large: ${theme.typography.scale.headline_large};
  --cheatcal-text-body-large: ${theme.typography.scale.body_large};
  --cheatcal-text-body-small: ${theme.typography.scale.body_small};
  --cheatcal-text-caption: ${theme.typography.scale.caption};
  
  /* Animation Easing Functions */
  --cheatcal-ease-smooth: ${theme.animations.smooth};
  --cheatcal-ease-micro: ${theme.animations.micro};
  --cheatcal-ease-dramatic: ${theme.animations.dramatic};
  --cheatcal-ease-invisible: ${theme.animations.invisible};
}`;
  }

  /**
   * Get Theme-Appropriate Component Props
   */
  getComponentProps(componentType: string): Record<string, any> {
    const theme = this.currentTheme;

    switch (componentType) {
      case 'monitoring_indicator':
        return {
          visible: theme.controversy.monitoring_indicators,
          style: theme.controversy_level === 'chaos' ? 'maximum' : 'standard',
          color: theme.colors.controversy_red,
        };

      case 'success_celebration':
        return {
          enabled: theme.controversy.success_celebrations,
          intensity: theme.controversy_level === 'chaos' ? 'explosive' : 'elegant',
          duration: theme.controversy_level === 'chaos' ? 1000 : 600,
        };

      case 'money_metric':
        return {
          emphasis: theme.controversy.money_focus_messaging,
          color: theme.colors.success_green,
          typography: 'tabular-nums font-bold',
        };

      default:
        return {};
    }
  }

  /**
   * Subscribe to Theme Changes
   */
  onThemeChange(callback: (theme: CheatCalTheme) => void): void {
    this.themeChangeCallbacks.push(callback);
  }

  /**
   * Notify Theme Change Subscribers
   */
  private notifyThemeChange(theme: CheatCalTheme): void {
    this.themeChangeCallbacks.forEach((callback) => callback(theme));
  }

  /**
   * Get Controversy-Appropriate Messaging
   */
  getMessaging(messageType: string): string {
    const theme = this.currentTheme;

    const messagingMap = {
      privacy_warning: {
        minimal: 'Command Center optimizes your workflow through intelligent analysis',
        moderate: 'Command Center monitors your productivity to help you make more money',
        maximum: 'Command Center watches everything you do to maximize your wealth',
        chaos: 'Command Center surveils your entire workflow for maximum money-making optimization',
      },

      success_message: {
        minimal: 'Optimization successful - productivity improved',
        moderate: 'Productivity cheat successful - money impact tracked',
        maximum: 'Elite coordination cheating successful - serious money generated',
        chaos: 'Maximum controversy cheating successful - extraordinary wealth creation',
      },

      value_proposition: {
        minimal: 'AI-powered productivity optimization for professionals',
        moderate: 'Controversial productivity methods for money-focused professionals',
        maximum: 'The AI that cheats at productivity for people who get money',
        chaos: 'Surveillance-powered wealth optimization for elite money-getters',
      },
    };

    const messages = messagingMap[messageType as keyof typeof messagingMap];
    return messages?.[theme.controversy_level] || 'Command Center: Elite productivity optimization';
  }

  /**
   * Generate Theme-Specific CSS Classes
   */
  generateThemeClasses(): string {
    const theme = this.currentTheme;

    return `
/* Command Center ${theme.displayName} Theme Classes */

.cheatcal-controversial-header {
  background: linear-gradient(135deg, ${theme.colors.stealth_black}, ${theme.colors.controversy_red});
  color: ${theme.colors.elite_white};
  font-family: ${theme.typography.display};
  font-size: ${theme.typography.scale.display_large};
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cheatcal-money-metric {
  color: ${theme.colors.success_green};
  font-family: ${theme.typography.mono};
  font-size: ${theme.typography.scale.headline_large};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cheatcal-controversy-indicator {
  background: ${theme.colors.controversy_red}20;
  border: 1px solid ${theme.colors.controversy_red}30;
  color: ${theme.colors.controversy_red};
  ${theme.controversy.monitoring_indicators ? 'display: flex;' : 'display: none;'}
}

.cheatcal-elite-button {
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: ${theme.colors.elite_white};
  font-family: ${theme.typography.body};
  font-weight: 600;
  transition: all ${theme.animations.micro};
}

.cheatcal-elite-button:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px ${theme.colors.primary}40;
}

.cheatcal-success-animation {
  animation: cheatcal-success-pulse 0.6s ${theme.animations.dramatic};
}

@keyframes cheatcal-success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); background-color: ${theme.colors.success_green}; }
  100% { transform: scale(1); }
}`;
  }
}

/**
 * React Hook for Command Center Theme System
 */
export const useCheatCalTheme = () => {
  const [themeSystem] = useState(() => new CheatCalThemeSystem());
  const [currentTheme, setCurrentTheme] = useState(themeSystem.getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (theme: CheatCalTheme) => {
      setCurrentTheme(theme);
    };

    themeSystem.onThemeChange(handleThemeChange);

    return () => {
      // Cleanup if needed
    };
  }, [themeSystem]);

  return {
    currentTheme,
    switchTheme: (themeName: string) => themeSystem.switchTheme(themeName),
    getAvailableThemes: () => themeSystem.getAvailableThemes(),
    getComponentProps: (componentType: string) => themeSystem.getComponentProps(componentType),
    getMessaging: (messageType: string) => themeSystem.getMessaging(messageType),
    generateCSSClasses: () => themeSystem.generateThemeClasses(),
  };
};

// Export all themes for direct access
export { STEALTH_THEME, AGGRESSIVE_THEME, MAXIMUM_CHAOS_THEME, ELITE_SUCCESS_THEME };

export default CheatCalThemeSystem;
