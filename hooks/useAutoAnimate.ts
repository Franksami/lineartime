/**
 * React hook for AutoAnimate integration
 * Provides easy-to-use AutoAnimate functionality for React components
 */

import autoAnimate, {
  type AutoAnimateOptions,
  type AutoAnimationPlugin,
} from '@formkit/auto-animate';
import { useEffect, useRef } from 'react';

export interface UseAutoAnimateOptions extends AutoAnimateOptions {
  // Additional options specific to our use case
  disabled?: boolean;
  dependencies?: React.DependencyList;
}

export function useAutoAnimate<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoAnimateOptions = {}
) {
  const { disabled = false, dependencies = [], ...autoAnimateOptions } = options;
  const ref = useRef<T>(null);
  const controllerRef = useRef<{ enable: () => void; disable: () => void } | null>(null);

  useEffect(() => {
    if (!ref.current || disabled) return;

    // Initialize AutoAnimate
    const controller = autoAnimate(ref.current, {
      duration: 250, // Default duration for smooth animations
      easing: 'ease-out', // Default easing
      ...autoAnimateOptions,
    });

    controllerRef.current = controller;

    // Cleanup
    return () => {
      if (controllerRef.current) {
        controllerRef.current.disable();
      }
    };
  }, [disabled, ...dependencies]);

  // Manual control methods
  const enable = () => {
    if (controllerRef.current) {
      controllerRef.current.enable();
    }
  };

  const disable = () => {
    if (controllerRef.current) {
      controllerRef.current.disable();
    }
  };

  return [ref, { enable, disable }] as const;
}

// Specialized hooks for common use cases

/**
 * Hook for animating lists (most common use case)
 */
export function useAutoAnimateList<T extends HTMLElement = HTMLUListElement>(
  options: UseAutoAnimateOptions = {}
) {
  return useAutoAnimate<T>({
    duration: 200,
    easing: 'ease-in-out',
    ...options,
  });
}

/**
 * Hook for animating modals and dialogs
 */
export function useAutoAnimateModal<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoAnimateOptions = {}
) {
  return useAutoAnimate<T>({
    duration: 300,
    easing: 'ease-out',
    ...options,
  });
}

/**
 * Hook for animating calendar events and cards
 */
export function useAutoAnimateCards<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoAnimateOptions = {}
) {
  return useAutoAnimate<T>({
    duration: 250,
    easing: 'ease-in-out',
    ...options,
  });
}

/**
 * Hook for animating dropdowns and menus
 */
export function useAutoAnimateDropdown<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoAnimateOptions = {}
) {
  return useAutoAnimate<T>({
    duration: 150,
    easing: 'ease-out',
    ...options,
  });
}

/**
 * Hook for animating form elements and inputs
 */
export function useAutoAnimateForm<T extends HTMLElement = HTMLFormElement>(
  options: UseAutoAnimateOptions = {}
) {
  return useAutoAnimate<T>({
    duration: 200,
    easing: 'ease-in-out',
    ...options,
  });
}

// Custom animation presets for Command Center Calendar

/**
 * Smooth slide animations for calendar transitions
 */
export const calendarSlidePreset: AutoAnimateOptions = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design easing
};

/**
 * Quick animations for interactive elements
 */
export const interactivePreset: AutoAnimateOptions = {
  duration: 150,
  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease-out-quad
};

/**
 * Gentle animations for content changes
 */
export const contentPreset: AutoAnimateOptions = {
  duration: 250,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Ease-out-quint
};

/**
 * Performance-optimized preset for large lists
 */
export const performancePreset: AutoAnimateOptions = {
  duration: 150,
  easing: 'ease-out',
};
