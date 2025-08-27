/**
 * Framer Motion Migration Utilities
 * Drop-in replacements for Framer Motion components
 * Enables gradual migration from Framer Motion to Motion library
 */

'use client';

import type React from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import { useModalAnimation, useMotion } from './motion-hooks';
import {
  type EnhancedAnimationOptions,
  type MotionCategory,
  animate,
  animateSpring,
  getMotionTokens,
} from './motion-system';

// Common Framer Motion prop types
interface BaseMotionProps {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: Record<string, any>;
  custom?: any;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onUpdate?: (latest: any) => void;
  whileHover?: any;
  whileTap?: any;
  whileFocus?: any;
  whileInView?: any;
  drag?: boolean | 'x' | 'y';
  dragConstraints?: any;
  onDrag?: (event: any, info: any) => void;
  onDragStart?: (event: any, info: any) => void;
  onDragEnd?: (event: any, info: any) => void;
  layout?: boolean | string;
  layoutId?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Convert Framer Motion transition to Motion library options
 */
function convertTransition(transition?: any): EnhancedAnimationOptions {
  if (!transition) return {};

  const tokens = getMotionTokens();
  const options: EnhancedAnimationOptions = {};

  if (transition.duration !== undefined) {
    options.duration = transition.duration;
  }

  if (transition.ease) {
    const easeMap: Record<string, any> = {
      linear: tokens.easings.linear,
      easeIn: tokens.easings.easeIn,
      easeOut: tokens.easings.easeOut,
      easeInOut: tokens.easings.easeInOut,
      backIn: tokens.easings.spring,
      backOut: tokens.easings.smooth,
      circIn: tokens.easings.easeIn,
      circOut: tokens.easings.easeOut,
    };
    options.easing = easeMap[transition.ease] || tokens.easings.easeOut;
  }

  if (transition.type === 'spring') {
    const _springType =
      transition.stiffness > 400
        ? 'bouncy'
        : transition.stiffness > 300
          ? 'normal'
          : transition.stiffness > 150
            ? 'gentle'
            : 'gentle';
    options.type = tokens.easings.spring;
  }

  if (transition.repeat !== undefined) {
    options.iterations =
      transition.repeat === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : transition.repeat + 1;
  }

  if (transition.delay !== undefined) {
    options.delay = transition.delay;
  }

  return options;
}

/**
 * Extract keyframes from Framer Motion animate prop
 */
function extractKeyframes(animate: any, _initial?: any) {
  if (!animate) return {};

  // Handle variants
  if (typeof animate === 'string') {
    // This would need variant resolution in real implementation
    return {};
  }

  // Direct keyframe object
  return animate;
}

/**
 * Drop-in replacement for motion.div
 */
export const motion = {
  div: forwardRef<HTMLDivElement, BaseMotionProps & React.HTMLAttributes<HTMLDivElement>>(
    (
      {
        initial,
        animate: animateProp,
        exit,
        transition,
        variants,
        custom,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        drag,
        dragConstraints,
        onDrag,
        onDragStart,
        onDragEnd,
        layout,
        layoutId,
        children,
        className,
        style,
        ...props
      },
      ref
    ) => {
      const internalRef = useRef<HTMLDivElement>(null);
      const elementRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
      const hasAnimated = useRef(false);

      // Handle initial animation
      useEffect(() => {
        if (!elementRef.current || hasAnimated.current) return;

        // Set initial state
        if (initial) {
          Object.entries(initial).forEach(([key, value]) => {
            if (elementRef.current) {
              (elementRef.current as any).style[key] = value;
            }
          });
        }

        // Trigger animation
        if (animateProp) {
          hasAnimated.current = true;
          onAnimationStart?.();

          const keyframes = extractKeyframes(animateProp, initial);
          const options = convertTransition(transition);

          animate(elementRef.current, keyframes, {
            ...options,
            onComplete: onAnimationComplete,
            onUpdate,
            category: 'interface' as MotionCategory,
          });
        }
      }, [animateProp, initial, transition, onAnimationStart, onAnimationComplete, onUpdate]);

      // Handle hover animations
      const handleMouseEnter = () => {
        if (whileHover && elementRef.current) {
          animate(elementRef.current, whileHover, {
            duration: 0.1,
            category: 'feedback' as MotionCategory,
          });
        }
      };

      const handleMouseLeave = () => {
        if (whileHover && elementRef.current) {
          const resetProps = Object.keys(whileHover).reduce((acc, key) => {
            acc[key] =
              animateProp?.[key] ||
              initial?.[key] ||
              (key === 'scale' ? 1 : key === 'opacity' ? 1 : 0);
            return acc;
          }, {} as any);

          animate(elementRef.current, resetProps, {
            duration: 0.1,
            category: 'feedback' as MotionCategory,
          });
        }
      };

      // Handle tap animations
      const handleMouseDown = () => {
        if (whileTap && elementRef.current) {
          animate(elementRef.current, whileTap, {
            duration: 0.05,
            category: 'feedback' as MotionCategory,
          });
        }
      };

      const handleMouseUp = () => {
        if (whileTap && elementRef.current) {
          const resetProps = Object.keys(whileTap).reduce((acc, key) => {
            acc[key] =
              whileHover?.[key] ||
              animateProp?.[key] ||
              initial?.[key] ||
              (key === 'scale' ? 1 : key === 'opacity' ? 1 : 0);
            return acc;
          }, {} as any);

          animate(elementRef.current, resetProps, {
            duration: 0.1,
            category: 'feedback' as MotionCategory,
          });
        }
      };

      return (
        <div
          ref={elementRef}
          className={className}
          style={style}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          {...props}
        >
          {children}
        </div>
      );
    }
  ),

  button: forwardRef<
    HTMLButtonElement,
    BaseMotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>
  >((props, ref) => {
    // Similar implementation for button
    const ButtonComponent = motion.div as any;
    return <ButtonComponent as="button" ref={ref} {...props} />;
  }),

  span: forwardRef<HTMLSpanElement, BaseMotionProps & React.HTMLAttributes<HTMLSpanElement>>(
    (props, ref) => {
      const SpanComponent = motion.div as any;
      return <SpanComponent as="span" ref={ref} {...props} />;
    }
  ),

  section: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const SectionComponent = motion.div as any;
      return <SectionComponent as="section" ref={ref} {...props} />;
    }
  ),

  nav: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const NavComponent = motion.div as any;
      return <NavComponent as="nav" ref={ref} {...props} />;
    }
  ),

  header: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const HeaderComponent = motion.div as any;
      return <HeaderComponent as="header" ref={ref} {...props} />;
    }
  ),

  main: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const MainComponent = motion.div as any;
      return <MainComponent as="main" ref={ref} {...props} />;
    }
  ),

  article: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const ArticleComponent = motion.div as any;
      return <ArticleComponent as="article" ref={ref} {...props} />;
    }
  ),

  aside: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const AsideComponent = motion.div as any;
      return <AsideComponent as="aside" ref={ref} {...props} />;
    }
  ),

  footer: forwardRef<HTMLElement, BaseMotionProps & React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      const FooterComponent = motion.div as any;
      return <FooterComponent as="footer" ref={ref} {...props} />;
    }
  ),
};

/**
 * AnimatePresence replacement for exit animations
 */
export function AnimatePresence({
  children,
  initial = true,
  exitBeforeEnter = false,
  onExitComplete,
}: {
  children: React.ReactNode;
  initial?: boolean;
  exitBeforeEnter?: boolean;
  onExitComplete?: () => void;
}) {
  // Simplified implementation - in real use, this would need to track
  // which children are entering/exiting and manage their animations
  return <>{children}</>;
}

/**
 * Motion values replacement
 */
export function useMotionValue(initial: number | string) {
  const value = useRef(initial);
  const subscribers = useRef(new Set<(value: any) => void>());

  const get = () => value.current;
  const set = (newValue: number | string) => {
    value.current = newValue;
    subscribers.current.forEach((callback) => callback(newValue));
  };

  const on = (callback: (value: any) => void) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  };

  return { get, set, on };
}

/**
 * Transform values for animations
 */
export const transform = {
  scale: (value: number) => `scale(${value})`,
  scaleX: (value: number) => `scaleX(${value})`,
  scaleY: (value: number) => `scaleY(${value})`,
  rotate: (value: number | string) => `rotate(${value}${typeof value === 'number' ? 'deg' : ''})`,
  rotateX: (value: number | string) => `rotateX(${value}${typeof value === 'number' ? 'deg' : ''})`,
  rotateY: (value: number | string) => `rotateY(${value}${typeof value === 'number' ? 'deg' : ''})`,
  rotateZ: (value: number | string) => `rotateZ(${value}${typeof value === 'number' ? 'deg' : ''})`,
  translateX: (value: number | string) =>
    `translateX(${value}${typeof value === 'number' ? 'px' : ''})`,
  translateY: (value: number | string) =>
    `translateY(${value}${typeof value === 'number' ? 'px' : ''})`,
  translateZ: (value: number | string) =>
    `translateZ(${value}${typeof value === 'number' ? 'px' : ''})`,
  translate3d: (x: number | string, y: number | string, z: number | string) =>
    `translate3d(${x}${typeof x === 'number' ? 'px' : ''}, ${y}${typeof y === 'number' ? 'px' : ''}, ${z}${typeof z === 'number' ? 'px' : ''})`,
};

/**
 * Variants system replacement
 */
export function createVariants(variants: Record<string, any>) {
  return variants;
}

/**
 * Drag controls replacement
 */
export function useDragControls() {
  const start = (event: React.PointerEvent, options?: any) => {
    // Simplified drag implementation
    console.log('Drag started', event, options);
  };

  return { start };
}

/**
 * Animation controls replacement
 */
export function useAnimationControls() {
  const elementRef = useRef<HTMLElement | null>(null);

  const start = async (animation: any, options?: any) => {
    if (!elementRef.current) return;

    const keyframes = typeof animation === 'string' ? {} : animation;
    const animationOptions = convertTransition(options);

    return animate(elementRef.current, keyframes, animationOptions);
  };

  const stop = () => {
    // Implementation would track and stop animations
  };

  const set = (values: any) => {
    if (!elementRef.current) return;

    Object.entries(values).forEach(([key, value]) => {
      if (elementRef.current) {
        (elementRef.current as any).style[key] = value;
      }
    });
  };

  return { start, stop, set, mount: (ref: HTMLElement) => (elementRef.current = ref) };
}

/**
 * Migration helper component
 */
export function MotionMigrationWrapper({
  children,
  enableFramerMotion = false,
}: {
  children: React.ReactNode;
  enableFramerMotion?: boolean;
}) {
  if (enableFramerMotion) {
    // Would import and use actual Framer Motion here during migration
    console.warn('Framer Motion fallback not implemented - using Motion library');
  }

  return <>{children}</>;
}

/**
 * Performance monitoring for migration
 */
export function useAnimationPerformance() {
  const metrics = useRef({
    animationCount: 0,
    averageFPS: 0,
    droppedFrames: 0,
  });

  const startMonitoring = () => {
    // Implementation would monitor animation performance
    console.log('Animation performance monitoring started');
  };

  const stopMonitoring = () => {
    // Implementation would stop monitoring and return metrics
    console.log('Animation performance monitoring stopped');
    return metrics.current;
  };

  return { startMonitoring, stopMonitoring, metrics: metrics.current };
}

export default {
  motion,
  AnimatePresence,
  useMotionValue,
  transform,
  createVariants,
  useDragControls,
  useAnimationControls,
  MotionMigrationWrapper,
  useAnimationPerformance,
};
