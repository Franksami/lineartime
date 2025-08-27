'use client';

import { cn } from '@/lib/utils';
import { GestureResponderEvent, useGesture } from '@use-gesture/react';
import { AnimatePresence, PanInfo, motion, useMotionValue, useTransform } from 'framer-motion';
import type React from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

// Hooks and Context Integration
import { useCalendarContext } from '@/contexts/CalendarContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useI18n } from '@/hooks/useI18n';

// Type Definitions
import type { Event } from '@/types/calendar';

// Constants for gesture thresholds and performance targets
const GESTURE_THRESHOLDS = {
  // Pan gesture configuration
  pan: {
    threshold: 8, // Minimum distance before pan starts
    velocity: 0.3, // Minimum velocity for momentum
    momentum: 0.85, // Momentum decay factor
    maxVelocity: 2000, // Maximum velocity cap
    edgeTension: 0.1, // Boundary tension
  },

  // Pinch/zoom configuration
  pinch: {
    threshold: 0.05, // Minimum scale change
    minScale: 0.5, // Minimum zoom level
    maxScale: 3.0, // Maximum zoom level
    sensitivity: 0.015, // Zoom sensitivity
    snapThreshold: 0.1, // Snap to zoom level threshold
  },

  // Tap gesture configuration
  tap: {
    maxDuration: 200, // Maximum tap duration (ms)
    maxDistance: 10, // Maximum movement during tap
    doubleTapDelay: 300, // Double tap detection window
    longPressDelay: 400, // Long press duration
  },

  // Swipe gesture configuration
  swipe: {
    minVelocity: 0.5, // Minimum swipe velocity
    minDistance: 30, // Minimum swipe distance
    maxDuration: 500, // Maximum swipe duration
    directionThreshold: 45, // Angle threshold for direction
  },

  // Performance targets
  performance: {
    responseTime: 50, // Target response time (ms)
    frameRate: 112, // Target frame rate (fps)
    memoryLimit: 100, // Memory usage limit (MB)
    cpuThreshold: 30, // CPU usage threshold (%)
  },
} as const;

// Gesture type definitions
export type GestureType = 'pan' | 'pinch' | 'tap' | 'longPress' | 'swipe' | 'doubleTap';

export interface GestureEvent {
  type: GestureType;
  target?: HTMLElement;
  data: GestureData;
  preventDefault: () => void;
  stopPropagation: () => void;
  timestamp: number;
}

export interface GestureData {
  // Common properties
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  duration: number;

  // Pinch-specific
  scale?: number;
  rotation?: number;
  center?: { x: number; y: number };

  // Swipe-specific
  direction?: 'left' | 'right' | 'up' | 'down';

  // Touch points
  touches?: number;
}

export interface TouchGestureHandlerProps {
  children: React.ReactNode;
  className?: string;

  // Gesture callbacks
  onPan?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onTap?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onSwipe?: (event: GestureEvent) => void;

  // Configuration
  disabled?: boolean;
  enablePan?: boolean;
  enablePinch?: boolean;
  enableTap?: boolean;
  enableSwipe?: boolean;
  enableHaptic?: boolean;

  // Advanced options
  preventScroll?: boolean;
  captureEvents?: boolean;
  debugMode?: boolean;

  // Performance options
  throttleMs?: number;
  enableOptimizations?: boolean;
}

export interface TouchGestureHandlerRef {
  reset: () => void;
  getMetrics: () => GestureMetrics;
  calibrate: () => void;
  setEnabled: (enabled: boolean) => void;
}

interface GestureMetrics {
  totalGestures: number;
  averageResponseTime: number;
  memoryUsage: number;
  frameRate: number;
  errorCount: number;
  lastGestureType: GestureType | null;
}

interface InternalGestureState {
  isActive: boolean;
  startTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  scale: number;
  rotation: number;
  touchCount: number;
  lastTapTime: number;
  longPressTimer: NodeJS.Timeout | null;
}

// Haptic feedback interface
interface HapticFeedback {
  light: () => void;
  medium: () => void;
  heavy: () => void;
}

// Create haptic feedback system
const createHapticFeedback = (): HapticFeedback => {
  const vibrate = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate(pattern);
      } catch (error) {
        console.debug('Haptic feedback not available:', error);
      }
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(50),
  };
};

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: GestureMetrics = {
    totalGestures: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    frameRate: 0,
    errorCount: 0,
    lastGestureType: null,
  };

  private responseTimeHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private lastFrameTime = performance.now();

  startGesture(type: GestureType): number {
    this.metrics.totalGestures++;
    this.metrics.lastGestureType = type;
    return performance.now();
  }

  endGesture(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.responseTimeHistory.push(responseTime);

    // Keep only last 100 measurements
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }

    // Calculate average
    this.metrics.averageResponseTime =
      this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  updateFrameRate(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    const averageFrameTime =
      this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    this.metrics.frameRate = 1000 / averageFrameTime;

    this.lastFrameTime = currentTime;
  }

  updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
  }

  getMetrics(): GestureMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalGestures: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      frameRate: 0,
      errorCount: 0,
      lastGestureType: null,
    };
    this.responseTimeHistory = [];
    this.frameTimeHistory = [];
  }
}

/**
 * TouchGestureHandler - Advanced touch gesture recognition system
 *
 * Features:
 * - Multi-touch gesture recognition (pan, pinch, tap, long-press, swipe)
 * - Performance optimization with <50ms response time
 * - Accessibility compliance with reduced motion support
 * - Haptic feedback integration for iOS/Android
 * - Memory-efficient gesture state management
 * - Cross-browser compatibility
 * - Integration with LinearCalendarHorizontal
 */
export const TouchGestureHandler = forwardRef<TouchGestureHandlerRef, TouchGestureHandlerProps>(
  (
    {
      children,
      className,
      onPan,
      onPinch,
      onTap,
      onDoubleTap,
      onLongPress,
      onSwipe,
      disabled = false,
      enablePan = true,
      enablePinch = true,
      enableTap = true,
      enableSwipe = true,
      enableHaptic = true,
      preventScroll = false,
      captureEvents = false,
      debugMode = false,
      throttleMs = 16, // ~60fps
      enableOptimizations = true,
    },
    ref
  ) => {
    // Hooks and context
    const { state, announceMessage } = useCalendarContext();
    const { settings, playSound } = useSettingsContext();
    const _isMobile = useMediaQuery('(max-width: 768px)');
    const _isTablet = useMediaQuery('(max-width: 1024px)');
    const i18n = useI18n();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const gestureStateRef = useRef<InternalGestureState>({
      isActive: false,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      touchCount: 0,
      lastTapTime: 0,
      longPressTimer: null,
    });

    // State
    const [isEnabled, setIsEnabled] = useState(!disabled);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Performance monitoring
    const performanceMonitor = useMemo(() => new PerformanceMonitor(), []);

    // Haptic feedback
    const haptic = useMemo(() => createHapticFeedback(), []);

    // Motion values for smooth animations
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(1);
    const rotate = useMotionValue(0);

    // Transform values for performance
    const transform = useTransform(
      [x, y, scale, rotate],
      ([xVal, yVal, scaleVal, rotateVal]) =>
        `translate3d(${xVal}px, ${yVal}px, 0) scale(${scaleVal}) rotate(${rotateVal}deg)`
    );

    // Check for reduced motion preference
    const prefersReducedMotion = useMemo(() => {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      return false;
    }, []);

    // Throttled callback wrapper
    const createThrottledCallback = useCallback((callback: Function, delay: number) => {
      let lastCall = 0;
      return (...args: any[]) => {
        const now = performance.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return callback(...args);
        }
      };
    }, []);

    // Create gesture event from internal state
    const createGestureEvent = useCallback(
      (
        type: GestureType,
        target?: HTMLElement,
        additionalData?: Partial<GestureData>
      ): GestureEvent => {
        const state = gestureStateRef.current;
        const now = performance.now();

        return {
          type,
          target: target || containerRef.current || undefined,
          data: {
            startX: state.startPosition.x,
            startY: state.startPosition.y,
            currentX: state.currentPosition.x,
            currentY: state.currentPosition.y,
            deltaX: state.currentPosition.x - state.startPosition.x,
            deltaY: state.currentPosition.y - state.startPosition.y,
            velocity: Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2),
            duration: now - state.startTime,
            scale: state.scale,
            rotation: state.rotation,
            touches: state.touchCount,
            ...additionalData,
          },
          preventDefault: () => {}, // Will be overridden by actual event
          stopPropagation: () => {},
          timestamp: now,
        };
      },
      []
    );

    // Haptic feedback handler
    const triggerHaptic = useCallback(
      (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
        if (!enableHaptic || prefersReducedMotion) return;

        try {
          haptic[intensity]();
        } catch (error) {
          console.debug('Haptic feedback failed:', error);
        }
      },
      [enableHaptic, prefersReducedMotion, haptic]
    );

    // Sound feedback integration
    const triggerSoundFeedback = useCallback(
      (type: 'success' | 'error' | 'notification' = 'notification') => {
        if (prefersReducedMotion) return;

        try {
          playSound(type);
        } catch (error) {
          console.debug('Sound feedback failed:', error);
        }
      },
      [playSound, prefersReducedMotion]
    );

    // Gesture handlers with performance optimization
    const handlePanStart = useCallback(
      (event: any) => {
        if (!isEnabled || !enablePan) return;

        const startTime = performanceMonitor.startGesture('pan');
        const state = gestureStateRef.current;

        state.isActive = true;
        state.startTime = startTime;
        state.startPosition = { x: event.point[0], y: event.point[1] };
        state.currentPosition = { x: event.point[0], y: event.point[1] };
        state.velocity = { x: 0, y: 0 };

        triggerHaptic('light');

        if (debugMode) {
          console.debug('Pan started:', { x: event.point[0], y: event.point[1] });
        }
      },
      [isEnabled, enablePan, performanceMonitor, triggerHaptic, debugMode]
    );

    const handlePanMove = useCallback(
      createThrottledCallback((event: any) => {
        if (!isEnabled || !enablePan) return;

        const state = gestureStateRef.current;
        if (!state.isActive) return;

        const [currentX, currentY] = event.point;
        const [deltaX, deltaY] = event.delta;
        const [velocityX, velocityY] = event.velocity;

        // Update internal state
        state.currentPosition = { x: currentX, y: currentY };
        state.velocity = { x: velocityX, y: velocityY };

        // Update motion values for smooth animation
        if (!prefersReducedMotion) {
          x.set(deltaX);
          y.set(deltaY);
        }

        // Trigger pan callback
        if (onPan) {
          const gestureEvent = createGestureEvent('pan');
          gestureEvent.preventDefault = event.event.preventDefault.bind(event.event);
          gestureEvent.stopPropagation = event.event.stopPropagation.bind(event.event);

          onPan(gestureEvent);
        }

        if (debugMode) {
          setDebugInfo({ type: 'pan', delta: [deltaX, deltaY], velocity: [velocityX, velocityY] });
        }
      }, throttleMs),
      [
        isEnabled,
        enablePan,
        onPan,
        createGestureEvent,
        prefersReducedMotion,
        x,
        y,
        debugMode,
        throttleMs,
      ]
    );

    const handlePanEnd = useCallback(
      (_event: any) => {
        if (!isEnabled || !enablePan) return;

        const state = gestureStateRef.current;
        if (!state.isActive) return;

        performanceMonitor.endGesture(state.startTime);
        state.isActive = false;

        // Apply momentum if velocity is significant
        const velocityMagnitude = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
        if (velocityMagnitude > GESTURE_THRESHOLDS.pan.velocity && !prefersReducedMotion) {
          const momentumX = state.velocity.x * GESTURE_THRESHOLDS.pan.momentum;
          const momentumY = state.velocity.y * GESTURE_THRESHOLDS.pan.momentum;

          // Animate to momentum position
          x.set(momentumX, { type: 'spring', damping: 20, stiffness: 100 });
          y.set(momentumY, { type: 'spring', damping: 20, stiffness: 100 });
        }

        triggerSoundFeedback('notification');

        if (debugMode) {
          console.debug('Pan ended:', { velocity: velocityMagnitude });
        }
      },
      [
        isEnabled,
        enablePan,
        performanceMonitor,
        triggerSoundFeedback,
        prefersReducedMotion,
        x,
        y,
        debugMode,
      ]
    );

    // Pinch gesture handlers
    const handlePinchStart = useCallback(
      (_event: any) => {
        if (!isEnabled || !enablePinch) return;

        const startTime = performanceMonitor.startGesture('pinch');
        const state = gestureStateRef.current;

        state.isActive = true;
        state.startTime = startTime;
        state.scale = 1;
        state.touchCount = 2;

        triggerHaptic('medium');

        if (debugMode) {
          console.debug('Pinch started');
        }
      },
      [isEnabled, enablePinch, performanceMonitor, triggerHaptic, debugMode]
    );

    const handlePinchMove = useCallback(
      createThrottledCallback((event: any) => {
        if (!isEnabled || !enablePinch) return;

        const state = gestureStateRef.current;
        if (!state.isActive) return;

        const scaleValue = event.scale;
        state.scale = scaleValue;

        // Clamp scale within bounds
        const clampedScale = Math.max(
          GESTURE_THRESHOLDS.pinch.minScale,
          Math.min(GESTURE_THRESHOLDS.pinch.maxScale, scaleValue)
        );

        // Update motion value
        if (!prefersReducedMotion) {
          scale.set(clampedScale);
        }

        // Trigger pinch callback
        if (onPinch) {
          const gestureEvent = createGestureEvent('pinch', undefined, {
            scale: clampedScale,
            center: event.origin,
          });
          gestureEvent.preventDefault =
            event.event?.preventDefault?.bind(event.event) || (() => {});
          gestureEvent.stopPropagation =
            event.event?.stopPropagation?.bind(event.event) || (() => {});

          onPinch(gestureEvent);
        }

        if (debugMode) {
          setDebugInfo({ type: 'pinch', scale: clampedScale });
        }
      }, throttleMs),
      [
        isEnabled,
        enablePinch,
        onPinch,
        createGestureEvent,
        prefersReducedMotion,
        scale,
        debugMode,
        throttleMs,
      ]
    );

    const handlePinchEnd = useCallback(
      (_event: any) => {
        if (!isEnabled || !enablePinch) return;

        const state = gestureStateRef.current;
        if (!state.isActive) return;

        performanceMonitor.endGesture(state.startTime);
        state.isActive = false;
        state.touchCount = 0;

        // Snap to nearest zoom level if within threshold
        const currentScale = state.scale;
        const snapLevels = [0.5, 1.0, 1.5, 2.0, 3.0];
        const nearestLevel = snapLevels.reduce((prev, curr) =>
          Math.abs(curr - currentScale) < Math.abs(prev - currentScale) ? curr : prev
        );

        if (
          Math.abs(nearestLevel - currentScale) < GESTURE_THRESHOLDS.pinch.snapThreshold &&
          !prefersReducedMotion
        ) {
          scale.set(nearestLevel, { type: 'spring', damping: 25, stiffness: 200 });
        }

        triggerSoundFeedback('success');

        if (debugMode) {
          console.debug('Pinch ended:', { scale: currentScale, snappedTo: nearestLevel });
        }
      },
      [
        isEnabled,
        enablePinch,
        performanceMonitor,
        triggerSoundFeedback,
        prefersReducedMotion,
        scale,
        debugMode,
      ]
    );

    // Tap gesture handlers
    const handleTap = useCallback(
      (event: any) => {
        if (!isEnabled || !enableTap) return;

        const startTime = performanceMonitor.startGesture('tap');
        const state = gestureStateRef.current;
        const now = performance.now();

        // Check for double tap
        const isDoubleTap = now - state.lastTapTime < GESTURE_THRESHOLDS.tap.doubleTapDelay;
        state.lastTapTime = now;

        triggerHaptic('light');

        if (isDoubleTap && onDoubleTap) {
          const gestureEvent = createGestureEvent('doubleTap', event.target);
          gestureEvent.preventDefault = event.event.preventDefault.bind(event.event);
          gestureEvent.stopPropagation = event.event.stopPropagation.bind(event.event);

          onDoubleTap(gestureEvent);
          triggerSoundFeedback('success');

          if (debugMode) {
            console.debug('Double tap detected');
          }
        } else if (onTap) {
          const gestureEvent = createGestureEvent('tap', event.target);
          gestureEvent.preventDefault = event.event.preventDefault.bind(event.event);
          gestureEvent.stopPropagation = event.event.stopPropagation.bind(event.event);

          onTap(gestureEvent);

          if (debugMode) {
            console.debug('Single tap detected');
          }
        }

        performanceMonitor.endGesture(startTime);
      },
      [
        isEnabled,
        enableTap,
        onTap,
        onDoubleTap,
        performanceMonitor,
        triggerHaptic,
        triggerSoundFeedback,
        createGestureEvent,
        debugMode,
      ]
    );

    // Long press handler
    const handleLongPressStart = useCallback(
      (event: any) => {
        if (!isEnabled || !onLongPress) return;

        const state = gestureStateRef.current;

        // Clear existing timer
        if (state.longPressTimer) {
          clearTimeout(state.longPressTimer);
        }

        // Set new timer
        state.longPressTimer = setTimeout(() => {
          const startTime = performanceMonitor.startGesture('longPress');

          triggerHaptic('heavy');

          const gestureEvent = createGestureEvent('longPress', event.target);
          onLongPress(gestureEvent);

          triggerSoundFeedback('notification');
          performanceMonitor.endGesture(startTime);

          if (debugMode) {
            console.debug('Long press detected');
          }
        }, GESTURE_THRESHOLDS.tap.longPressDelay);
      },
      [
        isEnabled,
        onLongPress,
        performanceMonitor,
        triggerHaptic,
        triggerSoundFeedback,
        createGestureEvent,
        debugMode,
      ]
    );

    const handleLongPressEnd = useCallback(() => {
      const state = gestureStateRef.current;

      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
    }, []);

    // Swipe handler
    const handleSwipe = useCallback(
      (event: any) => {
        if (!isEnabled || !enableSwipe || !onSwipe) return;

        const startTime = performanceMonitor.startGesture('swipe');
        const [deltaX, deltaY] = event.delta;
        const [velocityX, velocityY] = event.velocity;

        const velocity = Math.sqrt(velocityX ** 2 + velocityY ** 2);
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        // Check if swipe meets minimum requirements
        if (
          velocity < GESTURE_THRESHOLDS.swipe.minVelocity ||
          distance < GESTURE_THRESHOLDS.swipe.minDistance
        ) {
          return;
        }

        // Determine swipe direction
        const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
        let direction: 'left' | 'right' | 'up' | 'down';

        if (Math.abs(angle) < GESTURE_THRESHOLDS.swipe.directionThreshold) {
          direction = 'right';
        } else if (
          Math.abs(angle - 180) < GESTURE_THRESHOLDS.swipe.directionThreshold ||
          Math.abs(angle + 180) < GESTURE_THRESHOLDS.swipe.directionThreshold
        ) {
          direction = 'left';
        } else if (angle > 45 && angle < 135) {
          direction = 'down';
        } else if (angle < -45 && angle > -135) {
          direction = 'up';
        } else {
          return; // Ambiguous direction
        }

        triggerHaptic('medium');

        const gestureEvent = createGestureEvent('swipe', event.target, { direction });
        gestureEvent.preventDefault = event.event.preventDefault.bind(event.event);
        gestureEvent.stopPropagation = event.event.stopPropagation.bind(event.event);

        onSwipe(gestureEvent);
        triggerSoundFeedback('notification');

        performanceMonitor.endGesture(startTime);

        if (debugMode) {
          console.debug('Swipe detected:', { direction, velocity, distance });
        }
      },
      [
        isEnabled,
        enableSwipe,
        onSwipe,
        performanceMonitor,
        triggerHaptic,
        triggerSoundFeedback,
        createGestureEvent,
        debugMode,
      ]
    );

    // Configure gesture binding
    const bind = useGesture(
      {
        // Pan gestures
        onDragStart: handlePanStart,
        onDrag: handlePanMove,

        // Pinch gestures
        onPinchStart: handlePinchStart,
        onPinch: handlePinchMove,
        onPinchEnd: handlePinchEnd,

        // Tap gestures
        onClick: handleTap,

        // Long press
        onPointerDown: handleLongPressStart,
        onPointerUp: handleLongPressEnd,
        onPointerLeave: handleLongPressEnd,

        // Swipe gestures (using drag with velocity detection)
        onDragEnd: (event) => {
          handlePanEnd(event);
          handleSwipe(event);
        },
      },
      {
        // Configuration options
        drag: {
          threshold: GESTURE_THRESHOLDS.pan.threshold,
          preventDefault: preventScroll,
          filterTaps: true,
          rubberband: true,
        },
        pinch: {
          threshold: GESTURE_THRESHOLDS.pinch.threshold,
          preventDefault: true,
          rubberband: true,
        },
        eventOptions: {
          capture: captureEvents,
          passive: !preventScroll,
        },
      }
    );

    // Performance monitoring effects
    useEffect(() => {
      if (!enableOptimizations) return;

      const interval = setInterval(() => {
        performanceMonitor.updateFrameRate();
        performanceMonitor.updateMemoryUsage();
      }, 1000);

      return () => clearInterval(interval);
    }, [enableOptimizations, performanceMonitor]);

    // Accessibility announcements
    useEffect(() => {
      if (!state.announceMessage) return;

      const message = state.announceMessage;
      announceMessage(message);
    }, [state.announceMessage, announceMessage]);

    // Cleanup effect
    useEffect(() => {
      return () => {
        const state = gestureStateRef.current;
        if (state.longPressTimer) {
          clearTimeout(state.longPressTimer);
        }
      };
    }, []);

    // Imperative API
    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          const state = gestureStateRef.current;

          // Clear timers
          if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = null;
          }

          // Reset state
          state.isActive = false;
          state.startTime = 0;
          state.touchCount = 0;
          state.lastTapTime = 0;

          // Reset motion values
          x.set(0);
          y.set(0);
          scale.set(1);
          rotate.set(0);

          // Reset performance metrics
          performanceMonitor.reset();

          if (debugMode) {
            console.debug('TouchGestureHandler reset');
          }
        },

        getMetrics: () => performanceMonitor.getMetrics(),

        calibrate: () => {
          // Recalibrate gesture thresholds based on device
          // This is a placeholder for future device-specific calibration
          if (debugMode) {
            console.debug('TouchGestureHandler calibrated');
          }
        },

        setEnabled: (enabled: boolean) => {
          setIsEnabled(enabled);
        },
      }),
      [x, y, scale, rotate, performanceMonitor, debugMode]
    );

    // Render component
    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'touch-gesture-handler',
          'relative w-full h-full overflow-hidden',
          disabled && 'pointer-events-none',
          className
        )}
        style={{
          transform: prefersReducedMotion ? undefined : transform,
          touchAction: preventScroll ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        {...bind()}
        role="application"
        aria-label={i18n.t(
          'TouchGestures.containerLabel',
          'Interactive calendar with touch gestures'
        )}
        aria-describedby="touch-gesture-instructions"
      >
        {children}

        {/* Screen reader instructions */}
        <div
          id="touch-gesture-instructions"
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {i18n.t(
            'TouchGestures.instructions',
            'Use pan to scroll, pinch to zoom, tap to select, long press for menu, swipe to navigate'
          )}
        </div>

        {/* Debug overlay */}
        <AnimatePresence>
          {debugMode && debugInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50"
            >
              <div>Gesture: {debugInfo.type}</div>
              {debugInfo.delta && (
                <div>
                  Delta: [{debugInfo.delta[0].toFixed(1)}, {debugInfo.delta[1].toFixed(1)}]
                </div>
              )}
              {debugInfo.velocity && (
                <div>
                  Velocity: [{debugInfo.velocity[0].toFixed(1)}, {debugInfo.velocity[1].toFixed(1)}]
                </div>
              )}
              {debugInfo.scale && <div>Scale: {debugInfo.scale.toFixed(2)}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance indicator (development only) */}
        {debugMode && process.env.NODE_ENV === 'development' && (
          <motion.div
            className="absolute top-4 right-4 bg-green-500/80 text-white p-1 rounded text-xs z-50"
            animate={{
              backgroundColor:
                performanceMonitor.getMetrics().averageResponseTime <
                GESTURE_THRESHOLDS.performance.responseTime
                  ? '#10b981'
                  : '#ef4444',
            }}
          >
            {performanceMonitor.getMetrics().averageResponseTime.toFixed(1)}ms
          </motion.div>
        )}
      </motion.div>
    );
  }
);

TouchGestureHandler.displayName = 'TouchGestureHandler';

export default TouchGestureHandler;

// Export utilities for advanced usage
export { GESTURE_THRESHOLDS, PerformanceMonitor, createHapticFeedback };

// Hook for using gesture handler in other components
export function useTouchGestures(options?: Partial<TouchGestureHandlerProps>) {
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);

  const handleGesture = useCallback((event: GestureEvent) => {
    setIsGestureActive(true);
    setLastGesture(event);

    // Auto-reset after gesture completes
    setTimeout(() => setIsGestureActive(false), 100);
  }, []);

  const gestureHandlers = useMemo(
    () => ({
      onPan: (event: GestureEvent) => {
        handleGesture(event);
        options?.onPan?.(event);
      },
      onPinch: (event: GestureEvent) => {
        handleGesture(event);
        options?.onPinch?.(event);
      },
      onTap: (event: GestureEvent) => {
        handleGesture(event);
        options?.onTap?.(event);
      },
      onSwipe: (event: GestureEvent) => {
        handleGesture(event);
        options?.onSwipe?.(event);
      },
      onLongPress: (event: GestureEvent) => {
        handleGesture(event);
        options?.onLongPress?.(event);
      },
      onDoubleTap: (event: GestureEvent) => {
        handleGesture(event);
        options?.onDoubleTap?.(event);
      },
    }),
    [handleGesture, options]
  );

  return {
    isGestureActive,
    lastGesture,
    gestureHandlers,
  };
}
