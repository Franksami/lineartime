import type { Config } from 'tailwindcss';
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      },
      colors: {
        // OKLCH-based glass morphism color system - Blue theme
        glass: {
          primary: 'oklch(58% 0.22 240 / <alpha-value>)',
          secondary: 'oklch(65% 0.15 220 / <alpha-value>)',
          accent: 'oklch(70% 0.18 200 / <alpha-value>)',
          surface: 'oklch(95% 0.005 240 / <alpha-value>)',
          overlay: 'oklch(10% 0.01 240 / <alpha-value>)',
          border: 'oklch(85% 0.01 240 / <alpha-value>)',
        },
        // Additional OKLCH colors for UI elements - Blue theme
        oklch: {
          white: 'oklch(100% 0 0)',
          black: 'oklch(0% 0 0)',
          gray: {
            50: 'oklch(98% 0.005 240)',
            100: 'oklch(95% 0.008 240)',
            200: 'oklch(90% 0.01 240)',
            300: 'oklch(80% 0.012 240)',
            400: 'oklch(65% 0.015 240)',
            500: 'oklch(50% 0.018 240)',
            600: 'oklch(40% 0.02 240)',
            700: 'oklch(30% 0.022 240)',
            800: 'oklch(20% 0.025 240)',
            900: 'oklch(15% 0.028 240)',
          },
        },
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, oklch(95% 0.01 240 / 0.1) 0%, oklch(85% 0.02 220 / 0.05) 100%)',
        'liquid-gradient': 'radial-gradient(circle at 30% 30%, oklch(70% 0.18 200 / 0.2) 0%, transparent 70%)',
        'aurora-gradient': 'linear-gradient(45deg, oklch(58% 0.22 240) 0%, oklch(65% 0.15 220) 50%, oklch(70% 0.18 200) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
        '4xl': '80px',
      },
      backdropSaturate: {
        200: '2',
        300: '3',
      },
      animation: {
        'liquid-float': 'liquidFloat 20s ease-in-out infinite',
        'glass-shimmer': 'glassShimmer 8s ease-in-out infinite',
        'aurora-shift': 'auroraShift 15s ease-in-out infinite',
        'smooth-pulse': 'smoothPulse 4s ease-in-out infinite',
        'glass-ripple': 'glassRipple 0.6s ease-out',
      },
      keyframes: {
        liquidFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '33%': { transform: 'translateY(-10px) scale(1.02)' },
          '66%': { transform: 'translateY(5px) scale(0.98)' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '-200% 50%' },
        },
        auroraShift: {
          '0%, 100%': { opacity: '0.7', transform: 'rotate(0deg) scale(1)' },
          '50%': { opacity: '1', transform: 'rotate(180deg) scale(1.1)' },
        },
        smoothPulse: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        glassRipple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      // Custom utilities for glass morphism
      borderRadius: {
        glass: '24px',
      },
      zIndex: {
        'calendar-grid': '0',
        'calendar-events': '1',
        'calendar-drag': '10',
        'calendar-toolbar': '20',
        'calendar-dropdown': '30',
        'calendar-tooltip': '40',
        'calendar-modal': '50',
        'calendar-toast': '60',
      },
      boxShadow: {
        glass: '0 8px 32px 0 oklch(10% 0.02 240 / 0.18)',
        'glass-hover': '0 12px 48px 0 oklch(10% 0.02 240 / 0.25)',
        'glass-inset': 'inset 0 2px 8px 0 oklch(100% 0 0 / 0.15)',
        liquid: '0 20px 60px -10px oklch(58% 0.22 240 / 0.3)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Custom plugin for glass morphism utilities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
      const glassUtilities = {
        '.glass': {
          background: 'oklch(10% 0.01 240 / 0.2)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid oklch(100% 0 0 / 0.18)',
        },
        '.glass-heavy': {
          background: 'oklch(10% 0.01 240 / 0.4)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid oklch(100% 0 0 / 0.25)',
        },
        '.glass-light': {
          background: 'oklch(15% 0.005 240 / 0.1)',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
          border: '1px solid oklch(100% 0 0 / 0.12)',
        },
        '.glass-frosted': {
          background: 'oklch(100% 0 0 / 0.6)',
          backdropFilter: 'blur(80px) saturate(100%)',
          WebkitBackdropFilter: 'blur(80px) saturate(100%)',
          border: '1px solid oklch(100% 0 0 / 0.3)',
        },
        '.liquid-surface': {
          background: 'radial-gradient(circle at 30% 30%, oklch(70% 0.18 200 / 0.2) 0%, transparent 70%)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        },
        '.no-scrollbar': {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
      };
      addUtilities(glassUtilities);
    },
  ],
};

export default config;