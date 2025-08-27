/**
 * Accessibility AAA Compliance Hook
 *
 * Provides WCAG 2.1 AAA level accessibility features for CheatCal components.
 * Includes color contrast validation, focus management, and screen reader support.
 *
 * @version 2.0.0 (CheatCal AAA Accessibility)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface AccessibilityAAA {
  // Contrast and color accessibility
  validateColorContrast: (foreground: string, background: string) => boolean;
  getHighContrastColor: (baseColor: string) => string;

  // Focus management
  manageFocus: () => {
    trapFocus: (element: HTMLElement) => () => void;
    restoreFocus: () => void;
    announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  };

  // Screen reader optimization
  screenReader: {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    setLabel: (element: HTMLElement, label: string) => void;
    setDescription: (element: HTMLElement, description: string) => void;
  };

  // Reduced motion detection
  prefersReducedMotion: boolean;

  // Keyboard navigation
  handleKeyNavigation: (event: KeyboardEvent, actions: Record<string, () => void>) => void;
}

export function useAccessibilityAAA(): AccessibilityAAA {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Color contrast validation (WCAG AAA requires 7:1 ratio)
  const validateColorContrast = useCallback((foreground: string, background: string): boolean => {
    // Simplified contrast calculation - in production use a proper contrast library
    const getLuminance = (hex: string) => {
      // Convert hex to RGB and calculate luminance
      const rgb = hex.match(/\w\w/g)?.map((x) => Number.parseInt(x, 16)) || [0, 0, 0];
      const [r, g, b] = rgb.map((val) => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return contrast >= 7; // AAA standard
  }, []);

  // Get high contrast version of color
  const getHighContrastColor = useCallback((baseColor: string): string => {
    // Return high contrast version - in production use proper color manipulation
    const colorMap: Record<string, string> = {
      'hsl(var(--primary))': 'hsl(var(--foreground))',
      'hsl(var(--muted))': 'hsl(var(--foreground))',
      'hsl(var(--accent))': 'hsl(var(--foreground))',
    };
    return colorMap[baseColor] || 'hsl(var(--foreground))';
  }, []);

  // Focus management
  const manageFocus = useCallback(() => {
    const trapFocus = (element: HTMLElement) => {
      lastFocusedElement.current = document.activeElement as HTMLElement;

      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }

        if (e.key === 'Escape') {
          restoreFocus();
        }
      };

      element.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        element.removeEventListener('keydown', handleKeyDown);
      };
    };

    const restoreFocus = () => {
      lastFocusedElement.current?.focus();
      lastFocusedElement.current = null;
    };

    const announceToScreenReader = (
      message: string,
      priority: 'polite' | 'assertive' = 'polite'
    ) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    };

    return { trapFocus, restoreFocus, announceToScreenReader };
  }, []);

  // Screen reader utilities
  const screenReader = {
    announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },

    setLabel: (element: HTMLElement, label: string) => {
      element.setAttribute('aria-label', label);
    },

    setDescription: (element: HTMLElement, description: string) => {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      const descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = description;

      document.body.appendChild(descElement);
      element.setAttribute('aria-describedby', descId);
    },
  };

  // Keyboard navigation helper
  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent, actions: Record<string, () => void>) => {
      const key = event.key.toLowerCase();
      const action = actions[key] || actions[event.code?.toLowerCase()];

      if (action) {
        event.preventDefault();
        action();
      }
    },
    []
  );

  return {
    validateColorContrast,
    getHighContrastColor,
    manageFocus,
    screenReader,
    prefersReducedMotion,
    handleKeyNavigation,
  };
}
