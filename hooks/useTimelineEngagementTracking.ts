/**
 * Timeline-Specific Engagement Tracking Hooks
 * Optimized for LinearCalendarHorizontal component integration
 *
 * Performance Requirements:
 * - Tracking overhead: <50ms per interaction
 * - Real-time updates: <100ms dashboard latency
 * - Memory usage: <10MB additional overhead
 * - Battery impact: Minimal on mobile devices
 */

import {
  performanceMonitor,
  useEngagementPerformanceMonitor,
} from '@/lib/performance/engagementPerformanceMonitor';
import {
  type EngagementSession,
  type TimelineInteraction,
  useEngagementTracking,
  useRealTimeEngagementDashboard,
} from '@/lib/research/userEngagementAnalytics';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TimelineTrackingConfig {
  enableScrollTracking?: boolean;
  enableHoverTracking?: boolean;
  enablePerformanceMonitoring?: boolean;
  batchingInterval?: number; // ms
  maxInteractionsPerBatch?: number;
  debugMode?: boolean;
}

interface TimelinePosition {
  month: string;
  position: number; // 0-1 relative position in timeline
  viewport: { width: number; height: number };
  eventsVisible: number;
}

interface TimelinePerformanceMetrics {
  trackingLatency: number;
  memoryUsage: number;
  interactionCount: number;
  lastTrackingTime: number;
}

/**
 * Hook for tracking engagement in LinearCalendarHorizontal component
 */
export function useTimelineEngagementTracking(config: TimelineTrackingConfig = {}) {
  const { userId } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<TimelinePerformanceMetrics>({
    trackingLatency: 0,
    memoryUsage: 0,
    interactionCount: 0,
    lastTrackingTime: 0,
  });

  // Integrate performance monitoring
  const performanceData = useEngagementPerformanceMonitor();

  // Refs for performance optimization
  const lastInteractionRef = useRef<number>(0);
  const interactionBatchRef = useRef<any[]>([]);
  const _batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Device detection
  const deviceType = useRef<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      deviceType.current = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    }
  }, []);

  // User demographic detection
  const demographics: EngagementSession['demographics'] = {
    userType: 'returning', // Would be determined from user data
    experienceLevel: 'intermediate', // Would be determined from usage patterns
    deviceType: deviceType.current,
    userSegment: 'power_user', // Would be determined from behavior analysis
  };

  // Initialize engagement tracking
  const { startSession, endSession, trackAction, isConnected } = useEngagementTracking(
    userId || 'anonymous',
    demographics
  );

  /**
   * Start timeline engagement session
   */
  const startTimelineSession = useCallback(
    async (viewMode: 'horizontal' | 'traditional' | 'hybrid' = 'horizontal') => {
      if (!userId || isSessionActive) return;

      try {
        const newSessionId = await startSession(viewMode);
        setSessionId(newSessionId);
        setIsSessionActive(true);

        if (config.debugMode) {
          console.log(`📊 TIMELINE SESSION STARTED: ${newSessionId.substring(0, 8)}...`);
        }
      } catch (error) {
        console.error('Failed to start timeline session:', error);
      }
    },
    [userId, isSessionActive, startSession, config.debugMode]
  );

  /**
   * End timeline engagement session
   */
  const endTimelineSession = useCallback(
    async (
      exitReason?: EngagementSession['outcomes']['exitReason'],
      satisfactionScore?: number
    ) => {
      if (!isSessionActive) return;

      try {
        // Flush any pending batched interactions
        if (interactionBatchRef.current.length > 0) {
          await flushInteractionBatch();
        }

        await endSession(exitReason, satisfactionScore);
        setIsSessionActive(false);
        setSessionId(null);

        if (config.debugMode) {
          console.log(`📊 TIMELINE SESSION ENDED: ${sessionId?.substring(0, 8)}...`);
        }
      } catch (error) {
        console.error('Failed to end timeline session:', error);
      }
    },
    [isSessionActive, sessionId, endSession, config.debugMode]
  );

  /**
   * Track timeline scroll interaction with performance optimization
   */
  const trackTimelineScroll = useCallback(
    async (
      scrollDirection: 'left' | 'right',
      scrollDistance: number,
      timelinePosition: TimelinePosition
    ) => {
      if (!isSessionActive || !config.enableScrollTracking) return;

      const now = performance.now();

      // Throttle scroll tracking to avoid performance issues
      if (now - lastInteractionRef.current < 100) return; // Max 10 FPS for scroll tracking
      lastInteractionRef.current = now;

      await trackTimelineInteraction('timeline_scroll', timelinePosition, {
        scrollDirection,
        scrollDistance,
        duration: now - performanceMetrics.lastTrackingTime,
      });
    },
    [isSessionActive, config.enableScrollTracking, performanceMetrics.lastTrackingTime]
  );

  /**
   * Track month navigation
   */
  const trackMonthNavigation = useCallback(
    async (
      targetMonth: string,
      navigationMethod: 'click' | 'keyboard' | 'gesture',
      timelinePosition: TimelinePosition
    ) => {
      if (!isSessionActive) return;

      await trackTimelineInteraction('month_navigation', timelinePosition, {
        eventCount: 1,
        duration: 0,
      });

      if (config.debugMode) {
        console.log(`📍 MONTH NAVIGATION: ${targetMonth} (${navigationMethod})`);
      }
    },
    [isSessionActive, config.debugMode]
  );

  /**
   * Track event interactions
   */
  const trackEventInteraction = useCallback(
    async (
      action: 'event_hover' | 'event_click' | 'event_drag' | 'event_create',
      _eventId: string,
      timelinePosition: TimelinePosition,
      duration?: number
    ) => {
      if (!isSessionActive) return;

      await trackTimelineInteraction(action, timelinePosition, {
        eventCount: 1,
        duration,
      });
    },
    [isSessionActive]
  );

  /**
   * Track view mode changes
   */
  const trackViewSwitch = useCallback(
    async (
      fromView: 'horizontal' | 'traditional' | 'hybrid',
      toView: 'horizontal' | 'traditional' | 'hybrid',
      timelinePosition: TimelinePosition
    ) => {
      if (!isSessionActive) return;

      await trackTimelineInteraction('view_switch', timelinePosition);

      if (config.debugMode) {
        console.log(`🔄 VIEW SWITCH: ${fromView} → ${toView}`);
      }
    },
    [isSessionActive, config.debugMode]
  );

  /**
   * Track zoom level changes
   */
  const trackZoomChange = useCallback(
    async (_zoomLevel: string, timelinePosition: TimelinePosition) => {
      if (!isSessionActive) return;

      await trackTimelineInteraction('zoom_change', timelinePosition);
    },
    [isSessionActive]
  );

  /**
   * Generic timeline interaction tracker with performance monitoring
   */
  const trackTimelineInteraction = useCallback(
    async (
      action: TimelineInteraction['action'],
      timelinePosition: TimelinePosition,
      metadata?: any
    ) => {
      // Use performance monitor for benchmarking
      return await performanceMonitor.benchmarkTracking(
        `timeline_${action}`,
        async () => {
          await trackAction(action, timelinePosition.month, {
            currentView: 'horizontal',
            timelinePosition: timelinePosition.position,
            totalEventsVisible: timelinePosition.eventsVisible,
            monthsInView: 12, // LinearCalendarHorizontal shows all 12 months
            deviceType: deviceType.current,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
            viewport: timelinePosition.viewport,
            ...metadata,
          });

          // Update local performance metrics
          setPerformanceMetrics((prev) => ({
            trackingLatency: performanceData.metrics?.trackingLatency || 0,
            memoryUsage: performanceData.metrics?.memoryUsage || 0,
            interactionCount: prev.interactionCount + 1,
            lastTrackingTime: performance.now(),
          }));
        },
        {
          action,
          timelinePosition,
          userId: `${userId?.substring(0, 8)}...`,
          sessionActive: isSessionActive,
        }
      );
    },
    [trackAction, performanceData.metrics, userId, isSessionActive]
  );

  /**
   * Flush pending batched interactions
   */
  const flushInteractionBatch = useCallback(async () => {
    if (interactionBatchRef.current.length === 0) return;

    const _batch = [...interactionBatchRef.current];
    interactionBatchRef.current = [];

    // TODO: Implement batch tracking if needed for performance
    // For now, individual tracking is sufficient
  }, []);

  // Auto-end session on component unmount
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        endTimelineSession('natural');
      }
    };
  }, [isSessionActive, endTimelineSession]);

  // Performance monitoring effect
  useEffect(() => {
    if (!config.enablePerformanceMonitoring) return;

    const interval = setInterval(() => {
      if (
        typeof window !== 'undefined' &&
        'performance' in window &&
        'memory' in (window.performance as any)
      ) {
        const memInfo = (window.performance as any).memory;
        setPerformanceMetrics((prev) => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [config.enablePerformanceMonitoring]);

  return {
    // Session management
    startTimelineSession,
    endTimelineSession,
    isSessionActive,
    sessionId,

    // Interaction tracking
    trackTimelineScroll,
    trackMonthNavigation,
    trackEventInteraction,
    trackViewSwitch,
    trackZoomChange,

    // Generic tracking
    trackTimelineInteraction,

    // Status and metrics
    isConnected,
    performanceMetrics,
    performanceData, // Advanced performance monitoring

    // Configuration
    config,
  };
}

/**
 * Hook for automatic timeline interaction detection
 */
export function useAutoTimelineTracking(
  containerRef: React.RefObject<HTMLElement>,
  config: TimelineTrackingConfig = {}
) {
  const tracking = useTimelineEngagementTracking(config);
  const lastScrollRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !tracking.isSessionActive) return;

    // Auto-detect scroll interactions
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const now = Date.now();

      // Throttle scroll tracking
      if (now - lastScrollRef.current < 100) return;
      lastScrollRef.current = now;

      const scrollLeft = target.scrollLeft;
      const scrollWidth = target.scrollWidth;
      const clientWidth = target.clientWidth;

      const scrollPosition = scrollLeft / (scrollWidth - clientWidth);
      const scrollDirection = scrollLeft > lastScrollRef.current ? 'right' : 'left';

      const timelinePosition: TimelinePosition = {
        month: getCurrentMonthFromScroll(scrollPosition),
        position: scrollPosition,
        viewport: { width: clientWidth, height: target.clientHeight },
        eventsVisible: getVisibleEventsCount(target),
      };

      tracking.trackTimelineScroll(
        scrollDirection,
        Math.abs(scrollLeft - lastScrollRef.current),
        timelinePosition
      );
    };

    // Auto-detect click interactions
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const monthElement = target.closest('[data-month]');

      if (monthElement) {
        const month = monthElement.getAttribute('data-month') || 'unknown';
        const rect = container.getBoundingClientRect();
        const position = (event.clientX - rect.left) / rect.width;

        const timelinePosition: TimelinePosition = {
          month,
          position,
          viewport: { width: rect.width, height: rect.height },
          eventsVisible: getVisibleEventsCount(container),
        };

        if (target.closest('[data-event]')) {
          tracking.trackEventInteraction(
            'event_click',
            target.closest('[data-event]')?.getAttribute('data-event') || 'unknown',
            timelinePosition
          );
        } else {
          tracking.trackMonthNavigation(month, 'click', timelinePosition);
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('click', handleClick);
    };
  }, [containerRef, tracking, tracking.isSessionActive]);

  return tracking;
}

/**
 * Helper function to determine current month from scroll position
 */
function getCurrentMonthFromScroll(scrollPosition: number): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthIndex = Math.floor(scrollPosition * 12);
  return months[Math.min(monthIndex, 11)];
}

/**
 * Helper function to count visible events in container
 */
function getVisibleEventsCount(container: HTMLElement): number {
  return container.querySelectorAll('[data-event]:not([style*="display: none"])').length;
}

/**
 * Hook for real-time timeline analytics dashboard
 */
export function useTimelineAnalyticsDashboard(refreshInterval = 30000) {
  const dashboard = useRealTimeEngagementDashboard(refreshInterval, 'day');
  const [timelineSpecificMetrics, setTimelineSpecificMetrics] = useState<any>(null);

  // Calculate timeline-specific insights
  useEffect(() => {
    if (dashboard.metrics) {
      const insights = {
        horizontalTimelineEffectiveness:
          dashboard.metrics.horizontalTimelineUsage > 60
            ? 'high'
            : dashboard.metrics.horizontalTimelineUsage > 40
              ? 'medium'
              : 'low',
        timelineEngagementScore:
          (dashboard.metrics.horizontalTimelineUsage * 0.4 +
            dashboard.metrics.userSatisfactionScore * 10 +
            dashboard.metrics.taskCompletionRate * 0.4 +
            (100 - dashboard.metrics.bounceRate) * 0.2) /
          4,
        monthNavigationEfficiency:
          dashboard.metrics.monthNavigationRate > 3
            ? 'high'
            : dashboard.metrics.monthNavigationRate > 1.5
              ? 'medium'
              : 'low',
        scrollBehaviorHealth:
          dashboard.metrics.timelineScrollRate > 10
            ? 'active'
            : dashboard.metrics.timelineScrollRate > 5
              ? 'moderate'
              : 'low',
      };

      setTimelineSpecificMetrics(insights);
    }
  }, [dashboard.metrics]);

  return {
    ...dashboard,
    timelineSpecificMetrics,

    // ASCII dashboard generator for development
    generateTimelineDashboard: () => {
      if (!dashboard.metrics || !timelineSpecificMetrics) return 'Loading...';

      return `
🔬 HORIZONTAL TIMELINE ANALYTICS DASHBOARD
═══════════════════════════════════════════════════════════════

📊 TIMELINE EFFECTIVENESS:
   Horizontal Usage: ${dashboard.metrics.horizontalTimelineUsage.toFixed(1)}%
   Engagement Score: ${timelineSpecificMetrics.timelineEngagementScore.toFixed(1)}/100
   Effectiveness: ${timelineSpecificMetrics.horizontalTimelineEffectiveness.toUpperCase()}

📈 USER BEHAVIOR PATTERNS:
   Month Navigation: ${dashboard.metrics.monthNavigationRate.toFixed(1)}/session (${timelineSpecificMetrics.monthNavigationEfficiency})
   Timeline Scrolling: ${dashboard.metrics.timelineScrollRate.toFixed(1)}/min (${timelineSpecificMetrics.scrollBehaviorHealth})
   Event Creation: ${dashboard.metrics.eventCreationRate.toFixed(1)}/session
   
⚡ PERFORMANCE METRICS:
   Active Sessions: ${dashboard.metrics.activeSessions}
   User Satisfaction: ${dashboard.metrics.userSatisfactionScore.toFixed(1)}/10
   Task Completion: ${dashboard.metrics.taskCompletionRate.toFixed(1)}%
   
🎯 TIMELINE VALIDATION STATUS:
   ${
     dashboard.metrics.horizontalTimelineUsage > 60
       ? '🟢 HORIZONTAL TIMELINE VALIDATED'
       : dashboard.metrics.horizontalTimelineUsage > 40
         ? '🟡 MIXED PREFERENCE DETECTED'
         : '🔴 TIMELINE EFFECTIVENESS NEEDS IMPROVEMENT'
   }

Last Updated: ${new Date(dashboard.lastUpdate).toLocaleTimeString()}
`;
    },
  };
}
