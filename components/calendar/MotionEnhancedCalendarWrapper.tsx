'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearCalendarHorizontal } from './LinearCalendarHorizontal';
import TouchGestureHandler, {
  type GestureEvent,
  type TouchGestureHandlerRef,
  useTouchGestures,
} from './TouchGestureHandler';

// Context and hooks
import { useCalendarContext } from '@/contexts/CalendarContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useI18n } from '@/hooks/useI18n';

// Types
import type { Event } from '@/types/calendar';

interface MotionEnhancedCalendarWrapperProps {
  year: number;
  events: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  enableInfiniteCanvas?: boolean;
  dayContent?: (ctx: any) => React.ReactNode;

  // Enhanced gesture options
  enableAdvancedGestures?: boolean;
  enableGestureAnimations?: boolean;
  gestureThreshold?: number;
}

// Zoom level mappings for gesture integration
const ZOOM_LEVELS = ['fullYear', 'year', 'quarter', 'month', 'week', 'day'] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

// Animation presets
const ANIMATION_PRESETS = {
  zoomIn: {
    scale: 1.1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  zoomOut: {
    scale: 0.9,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  panLeft: {
    x: -50,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
  panRight: {
    x: 50,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
  reset: {
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 25 },
  },
} as const;

/**
 * MotionEnhancedCalendarWrapper
 *
 * Wraps LinearCalendarHorizontal with advanced touch gesture capabilities:
 * - Multi-touch gesture recognition
 * - Smooth motion animations
 * - Haptic feedback integration
 * - Performance optimization
 * - Accessibility compliance
 */
export function MotionEnhancedCalendarWrapper({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  enableInfiniteCanvas = true,
  dayContent,
  enableAdvancedGestures = true,
  enableGestureAnimations = true,
  gestureThreshold = 0.1,
}: MotionEnhancedCalendarWrapperProps) {
  // Context and hooks
  const { state, setZoomLevel, selectDate, selectEvent, announceMessage } = useCalendarContext();
  const { playSound, settings } = useSettingsContext();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const i18n = useI18n();

  // Refs
  const gestureHandlerRef = useRef<TouchGestureHandlerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [gestureAnimation, setGestureAnimation] = useState<keyof typeof ANIMATION_PRESETS | null>(
    null
  );
  const [currentZoomIndex, setCurrentZoomIndex] = useState(0); // fullYear = 0
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Performance tracking
  const [gestureMetrics, setGestureMetrics] = useState({
    totalGestures: 0,
    averageResponseTime: 0,
    lastGestureType: null as string | null,
  });

  // Check for reduced motion
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Enhanced gesture handlers with calendar integration
  const handlePanGesture = useCallback(
    (event: GestureEvent) => {
      if (!enableAdvancedGestures) return;

      const { deltaX, deltaY, velocity } = event.data;

      // Horizontal pan for navigation
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const threshold = 100; // Pixels needed for month navigation

        if (Math.abs(deltaX) > threshold && velocity > 0.5) {
          const direction = deltaX > 0 ? 'right' : 'left';

          // Navigate months based on pan direction
          if (direction === 'right') {
            // Pan right - go to previous period
            setGestureAnimation('panRight');
            announceMessage(
              i18n.t('Calendar.gesture.panToPrevious', 'Navigating to previous period')
            );
          } else {
            // Pan left - go to next period
            setGestureAnimation('panLeft');
            announceMessage(i18n.t('Calendar.gesture.panToNext', 'Navigating to next period'));
          }

          playSound('notification');
        }
      }

      // Update pan offset for smooth scrolling
      if (!prefersReducedMotion) {
        setPanOffset({ x: deltaX * 0.5, y: deltaY * 0.5 });
      }

      // Announce pan gesture for screen readers
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        announceMessage(i18n.t('Calendar.gesture.panning', 'Panning calendar view'));
      }
    },
    [enableAdvancedGestures, prefersReducedMotion, announceMessage, playSound, i18n]
  );

  const handlePinchGesture = useCallback(
    (event: GestureEvent) => {
      if (!enableAdvancedGestures) return;

      const { scale: gestureScale } = event.data;

      if (!gestureScale) return;

      // Determine zoom direction
      const scaleThreshold = 0.1;
      const scaleDelta = gestureScale - 1;

      if (Math.abs(scaleDelta) > scaleThreshold) {
        if (scaleDelta > 0) {
          // Zoom in
          const nextZoomIndex = Math.min(currentZoomIndex + 1, ZOOM_LEVELS.length - 1);
          if (nextZoomIndex !== currentZoomIndex) {
            setCurrentZoomIndex(nextZoomIndex);
            setZoomLevel(ZOOM_LEVELS[nextZoomIndex]);
            setGestureAnimation('zoomIn');

            announceMessage(
              i18n.t(
                'Calendar.gesture.zoomIn',
                {
                  level: ZOOM_LEVELS[nextZoomIndex],
                },
                `Zooming in to ${ZOOM_LEVELS[nextZoomIndex]} view`
              )
            );

            playSound('success');
          }
        } else {
          // Zoom out
          const nextZoomIndex = Math.max(currentZoomIndex - 1, 0);
          if (nextZoomIndex !== currentZoomIndex) {
            setCurrentZoomIndex(nextZoomIndex);
            setZoomLevel(ZOOM_LEVELS[nextZoomIndex]);
            setGestureAnimation('zoomOut');

            announceMessage(
              i18n.t(
                'Calendar.gesture.zoomOut',
                {
                  level: ZOOM_LEVELS[nextZoomIndex],
                },
                `Zooming out to ${ZOOM_LEVELS[nextZoomIndex]} view`
              )
            );

            playSound('success');
          }
        }
      }

      // Update scale for visual feedback (but don't break calendar layout)
      if (!prefersReducedMotion && enableGestureAnimations) {
        const visualScale = 1 + scaleDelta * 0.1; // Subtle visual feedback
        setScale(Math.max(0.8, Math.min(1.2, visualScale)));
      }
    },
    [
      enableAdvancedGestures,
      currentZoomIndex,
      setZoomLevel,
      announceMessage,
      playSound,
      i18n,
      prefersReducedMotion,
      enableGestureAnimations,
    ]
  );

  const handleTapGesture = useCallback(
    (event: GestureEvent) => {
      const target = event.target;
      if (!target) return;

      // Check if tap is on a calendar day
      const dayElement = target.closest('[data-date]');
      if (dayElement) {
        const dateString = dayElement.getAttribute('data-date');
        if (dateString) {
          const date = new Date(dateString);
          selectDate(date);
          onDateSelect?.(date);

          announceMessage(
            i18n.t(
              'Calendar.gesture.daySelected',
              {
                date: date.toLocaleDateString(),
              },
              `Selected ${date.toLocaleDateString()}`
            )
          );

          playSound('success');
        }
      }

      // Check if tap is on an event
      const eventElement = target.closest('[data-event-id]');
      if (eventElement) {
        const eventId = eventElement.getAttribute('data-event-id');
        const event = events.find((e) => e.id === eventId);
        if (event) {
          selectEvent(event);
          onEventClick?.(event);

          announceMessage(
            i18n.t(
              'Calendar.gesture.eventSelected',
              {
                title: event.title,
              },
              `Selected event: ${event.title}`
            )
          );

          playSound('notification');
        }
      }
    },
    [selectDate, selectEvent, onDateSelect, onEventClick, events, announceMessage, playSound, i18n]
  );

  const handleDoubleTapGesture = useCallback(
    (_event: GestureEvent) => {
      if (!enableAdvancedGestures) return;

      // Double tap to toggle zoom level
      const nextZoomIndex = currentZoomIndex === 0 ? 3 : 0; // Toggle between fullYear and month
      setCurrentZoomIndex(nextZoomIndex);
      setZoomLevel(ZOOM_LEVELS[nextZoomIndex]);

      setGestureAnimation(nextZoomIndex > currentZoomIndex ? 'zoomIn' : 'zoomOut');

      announceMessage(
        i18n.t(
          'Calendar.gesture.doubleTapZoom',
          {
            level: ZOOM_LEVELS[nextZoomIndex],
          },
          `Double tap: switched to ${ZOOM_LEVELS[nextZoomIndex]} view`
        )
      );

      playSound('success');
    },
    [enableAdvancedGestures, currentZoomIndex, setZoomLevel, announceMessage, playSound, i18n]
  );

  const handleLongPressGesture = useCallback(
    (event: GestureEvent) => {
      const target = event.target;
      if (!target) return;

      // Long press on a day to create new event
      const dayElement = target.closest('[data-date]');
      if (dayElement) {
        const dateString = dayElement.getAttribute('data-date');
        if (dateString) {
          const date = new Date(dateString);

          // Create new event
          const newEvent: Partial<Event> = {
            title: i18n.t('Calendar.newEvent.defaultTitle', 'New Event'),
            startDate: date,
            endDate: date,
            category: 'personal',
          };

          onEventCreate?.(newEvent);

          announceMessage(
            i18n.t(
              'Calendar.gesture.eventCreated',
              {
                date: date.toLocaleDateString(),
              },
              `Created new event for ${date.toLocaleDateString()}`
            )
          );

          playSound('success');
        }
      }
    },
    [onEventCreate, announceMessage, playSound, i18n]
  );

  const handleSwipeGesture = useCallback(
    (event: GestureEvent) => {
      if (!enableAdvancedGestures) return;

      const { direction } = event.data;
      if (!direction) return;

      let navigationAction = null;

      switch (direction) {
        case 'left':
          // Swipe left - next month/period
          navigationAction = 'next';
          setGestureAnimation('panLeft');
          break;
        case 'right':
          // Swipe right - previous month/period
          navigationAction = 'previous';
          setGestureAnimation('panRight');
          break;
        case 'up':
          // Swipe up - zoom out
          if (currentZoomIndex > 0) {
            const nextZoomIndex = currentZoomIndex - 1;
            setCurrentZoomIndex(nextZoomIndex);
            setZoomLevel(ZOOM_LEVELS[nextZoomIndex]);
            setGestureAnimation('zoomOut');
          }
          break;
        case 'down':
          // Swipe down - zoom in
          if (currentZoomIndex < ZOOM_LEVELS.length - 1) {
            const nextZoomIndex = currentZoomIndex + 1;
            setCurrentZoomIndex(nextZoomIndex);
            setZoomLevel(ZOOM_LEVELS[nextZoomIndex]);
            setGestureAnimation('zoomIn');
          }
          break;
      }

      if (navigationAction) {
        announceMessage(
          i18n.t(
            'Calendar.gesture.swipeNavigation',
            {
              direction: navigationAction,
            },
            `Swiped to ${navigationAction} period`
          )
        );
      }

      playSound('notification');
    },
    [enableAdvancedGestures, currentZoomIndex, setZoomLevel, announceMessage, playSound, i18n]
  );

  // Use the gesture hooks for additional functionality
  const { isGestureActive: hookGestureActive, gestureHandlers } = useTouchGestures({
    onPan: handlePanGesture,
    onPinch: handlePinchGesture,
    onTap: handleTapGesture,
    onDoubleTap: handleDoubleTapGesture,
    onLongPress: handleLongPressGesture,
    onSwipe: handleSwipeGesture,
  });

  // Update gesture activity state
  useEffect(() => {
    setIsGestureActive(hookGestureActive);
  }, [hookGestureActive]);

  // Auto-reset gesture animations
  useEffect(() => {
    if (gestureAnimation) {
      const timer = setTimeout(() => {
        setGestureAnimation(null);
        if (!prefersReducedMotion) {
          setPanOffset({ x: 0, y: 0 });
          setScale(1);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [gestureAnimation, prefersReducedMotion]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = gestureHandlerRef.current?.getMetrics();
      if (metrics) {
        setGestureMetrics({
          totalGestures: metrics.totalGestures,
          averageResponseTime: metrics.averageResponseTime,
          lastGestureType: metrics.lastGestureType,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animation variants for gesture feedback
  const containerVariants = {
    idle: {
      scale: 1,
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 25 },
    },
    gesture: {
      scale: scale,
      x: panOffset.x,
      y: panOffset.y,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    animation: gestureAnimation ? ANIMATION_PRESETS[gestureAnimation] : {},
  };

  return (
    <TouchGestureHandler
      ref={gestureHandlerRef}
      className={cn(
        'motion-enhanced-calendar-wrapper',
        'relative w-full h-full',
        isGestureActive && 'gesture-active',
        className
      )}
      onPan={gestureHandlers.onPan}
      onPinch={gestureHandlers.onPinch}
      onTap={gestureHandlers.onTap}
      onDoubleTap={gestureHandlers.onDoubleTap}
      onLongPress={gestureHandlers.onLongPress}
      onSwipe={gestureHandlers.onSwipe}
      enablePan={enableAdvancedGestures}
      enablePinch={enableAdvancedGestures}
      enableTap={true}
      enableSwipe={enableAdvancedGestures}
      enableHaptic={settings.notifications?.sound ?? true}
      preventScroll={isMobile}
      debugMode={process.env.NODE_ENV === 'development'}
    >
      <motion.div
        ref={containerRef}
        className="w-full h-full"
        variants={containerVariants}
        animate={
          prefersReducedMotion
            ? 'idle'
            : gestureAnimation
              ? 'animation'
              : isGestureActive
                ? 'gesture'
                : 'idle'
        }
        style={{
          transformOrigin: 'center center',
        }}
      >
        <LinearCalendarHorizontal
          year={year}
          events={events}
          className="w-full h-full"
          onDateSelect={onDateSelect}
          onEventClick={onEventClick}
          onEventUpdate={onEventUpdate}
          onEventCreate={onEventCreate}
          onEventDelete={onEventDelete}
          enableInfiniteCanvas={enableInfiniteCanvas}
          dayContent={dayContent}
        />
      </motion.div>

      {/* Gesture feedback overlay */}
      <AnimatePresence>
        {isGestureActive && enableGestureAnimations && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 pointer-events-none rounded-lg"
            style={{ zIndex: 1 }}
          />
        )}
      </AnimatePresence>

      {/* Performance overlay (development only) */}
      {process.env.NODE_ENV === 'development' && gestureMetrics.averageResponseTime > 0 && (
        <motion.div
          className="absolute bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div>Gestures: {gestureMetrics.totalGestures}</div>
          <div>Response: {gestureMetrics.averageResponseTime.toFixed(1)}ms</div>
          {gestureMetrics.lastGestureType && <div>Last: {gestureMetrics.lastGestureType}</div>}
        </motion.div>
      )}

      {/* Accessibility live region for gesture announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {/* Screen reader announcements are handled by CalendarContext */}
      </div>
    </TouchGestureHandler>
  );
}

export default MotionEnhancedCalendarWrapper;

// Export gesture configuration for customization
export { GESTURE_THRESHOLDS } from './TouchGestureHandler';
export { ANIMATION_PRESETS };

// Hook for gesture-aware calendar components
export function useCalendarGestures(options?: {
  enableZoomGestures?: boolean;
  enableNavigationGestures?: boolean;
  enableSelectionGestures?: boolean;
}) {
  const { state, setZoomLevel, announceMessage } = useCalendarContext();
  const { playSound } = useSettingsContext();

  const handleGestureZoom = useCallback(
    (direction: 'in' | 'out') => {
      if (!options?.enableZoomGestures) return;

      const currentLevel = state.zoomLevel;
      const levels = ZOOM_LEVELS;
      const currentIndex = levels.indexOf(currentLevel as any);

      let nextIndex = currentIndex;
      if (direction === 'in' && currentIndex < levels.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (direction === 'out' && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }

      if (nextIndex !== currentIndex) {
        setZoomLevel(levels[nextIndex]);
        announceMessage(`Zoomed ${direction} to ${levels[nextIndex]} view`);
        playSound('success');
        return true;
      }

      return false;
    },
    [state.zoomLevel, setZoomLevel, announceMessage, playSound, options?.enableZoomGestures]
  );

  return {
    handleGestureZoom,
    currentZoomLevel: state.zoomLevel,
    canZoomIn: ZOOM_LEVELS.indexOf(state.zoomLevel as any) < ZOOM_LEVELS.length - 1,
    canZoomOut: ZOOM_LEVELS.indexOf(state.zoomLevel as any) > 0,
  };
}
