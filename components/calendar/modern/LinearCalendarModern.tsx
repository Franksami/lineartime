'use client';

/**
 * LinearCalendarModern - Phase 5.0 Comprehensive Integration
 *
 * The modernized calendar component preserving the immutable ASCII horizontal foundation
 * while integrating all 12+ systems for ultimate user experience.
 *
 * FOUNDATION LOCKED: 12-month horizontal layout with ASCII grid structure
 * Integration Level: Complete system integration with all Phase 4.5+ enhancements
 */

import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { useGesture } from '@use-gesture/react';
import {
  addDays,
  addMonths,
  differenceInDays,
  endOfDay,
  format,
  getDaysInMonth,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { Activity, Globe, GripVertical, Menu, Minus, Plus, Shield, X, Zap } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5.0 SYSTEM INTEGRATIONS - Complete Integration Architecture
// ═══════════════════════════════════════════════════════════════════════════

import { useEnhancedTheme } from '@/lib/design-system/enhanced-theme';
import { TokenResolver } from '@/lib/design-system/token-resolver';
// 🎨 Design Token System (550+ tokens)
import { TokenBridge, useDesignTokens } from '@/lib/design-system/utils/token-bridge';

// 🎬 Motion & Animation System
import { useMotionSystem, useSyncedMotion } from '@/lib/motion';
import { MotionChoreographer } from '@/lib/motion/choreographer';
import {
  useButtonAnimation,
  useModalAnimation,
  useScrollAnimation,
} from '@/lib/motion/motion-hooks';

import { AccessibilityProvider } from '@/components/accessibility/RadixPrimitiveIntegration';
import { ScreenReaderOptimizer } from '@/components/accessibility/ScreenReaderOptimization';
// ♿ Accessibility AAA System
import {
  useAccessibilityAAA,
  useFocusManagementAAA,
  useScreenReaderOptimization,
} from '@/lib/accessibility';

// 🌍 Internationalization & RTL
import { useI18n, useRTLStyles } from '@/hooks/useI18n';

import { PerformanceSLOProvider } from '@/components/dashboard/PerformanceSLOProvider';
import { useObjectPool } from '@/hooks/use-object-pool';
// 🚀 Performance Monitoring & Optimization
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import { PerformanceOverlay } from '../performance-overlay';

// 🤖 AI Enhancement System
import { useAIEnhancedDragDrop } from '@/hooks/use-ai-enhanced-drag-drop';
import { AISuggestionsPanel } from '../ai-suggestions-panel';
import { AICapacityRibbon } from './AICapacityRibbon';
import { AIConflictDetector } from './AIConflictDetector';

// 📱 Multi-Device Support
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileOptimizer } from './MobileOptimizer';
import { TouchGestureHandler } from './TouchGestureHandler';

// 🔗 Calendar Provider Integration
import { CalendarProviderSyncStatus } from './CalendarProviderSyncStatus';
import { MultiProviderEventCreator } from './MultiProviderEventCreator';
import { ProviderConflictModal } from './ProviderConflictModal';

// 📚 Library Ecosystem Integration
import { CalendarLibrarySwitcher } from './CalendarLibrarySwitcher';
import { LibraryTransitionAnimator } from './LibraryTransitionAnimator';

// 🔄 Real-Time Data Integration
import { useConvexRealTime } from '@/hooks/use-convex-realtime';
import { WebSocketSyncManager } from './WebSocketSyncManager';

// 🎵 Sound Effects System (Phase 4.5)
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { SoundService } from '@/lib/sound-service';

// 🏛️ Governance System Integration
import { useGovernanceValidation } from '@/hooks/use-governance-validation';
import { GovernanceOverlay } from './GovernanceOverlay';

// 📊 Analytics & Telemetry
import { useAnalytics } from '@/hooks/use-analytics';
import { TelemetryReporter } from '@/lib/telemetry-reporter';

// ⚙️ Settings & Preferences
import { useSettingsContext } from '@/contexts/SettingsContext';

import { RollingDigits } from '@/components/ui/rolling-digits';
// 📐 Foundation Components (Preserving ASCII Layout)
import { EventModal } from '../EventModal';
import { type DayContentContext, DotDayContent, NumberDayContent } from '../slots';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface LinearCalendarModernProps {
  year: number;
  events: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  enableInfiniteCanvas?: boolean;
  dayContent?: (ctx: DayContentContext) => React.ReactNode;

  // Phase 5.0 Enhanced Props
  enableAIFeatures?: boolean;
  enableProviderSync?: boolean;
  enableLibrarySwitching?: boolean;
  enableGovernanceOverlay?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableAnalytics?: boolean;
  theme?: 'auto' | 'light' | 'dark' | 'system';
  locale?: string;
  maxEvents?: number;
  virtualScrolling?: boolean;
}

interface SystemIntegrationState {
  designTokensLoaded: boolean;
  motionSystemReady: boolean;
  accessibilityEnabled: boolean;
  i18nInitialized: boolean;
  performanceMonitorActive: boolean;
  aiSystemOnline: boolean;
  providerSyncEnabled: boolean;
  librarySystemReady: boolean;
  governanceActive: boolean;
  analyticsEnabled: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMMUTABLE FOUNDATION CONSTANTS (ASCII Layout Preserved)
// ═══════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_SHORT = [
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

// Responsive zoom levels with token-based sizing
const ZOOM_LEVELS = {
  fullYear: -1, // Dynamic calculation for 42×12 ASCII grid
  year: 3, // 3px per day - full year view
  quarter: 8, // 8px per day - quarter view
  month: 24, // 24px per day - month view
  week: 60, // 60px per day - week view
  day: 150, // 150px per day - day detail view
};

const MOBILE_ZOOM_LEVELS = {
  fullYear: -1,
  year: 2,
  quarter: 6,
  month: 18,
  week: 45,
  day: 100,
};

type ZoomLevel = keyof typeof ZOOM_LEVELS;

// Enhanced touch thresholds with AI optimization
const _TOUCH_THRESHOLDS = {
  longPressDelay: 400,
  swipeVelocity: 0.3,
  pinchScale: 0.015,
  doubleTapDelay: 250,
  minimumSwipeDistance: 20,
  aiGestureThreshold: 0.8, // AI gesture confidence threshold
};

// ═══════════════════════════════════════════════════════════════════════════
// FULL YEAR GRID COMPONENT (42×12 ASCII Foundation)
// ═══════════════════════════════════════════════════════════════════════════

interface FullYearGridModernProps {
  year: number;
  dayWidth: number;
  monthHeight: number;
  headerWidth: number;
  headerHeight: number;
  hoveredDate: Date | null;
  selectedDate: Date | null;
  onDateSelect?: (date: Date) => void;
  setHoveredDate: (date: Date | null) => void;
  setSelectedDate: (date: Date | null) => void;
  handleDayClick: (date: Date) => void;
  format: (date: Date, formatString: string) => string;
  isSameDay: (dateLeft: Date, dateRight: Date) => boolean;
  dayContent?: (ctx: DayContentContext) => React.ReactNode;
  displayPreviewUpTo?: (date: Date) => boolean;

  // Modern integrations
  tokenBridge: TokenBridge;
  motionSystem: any;
  aiCapacities?: Map<string, number>;
  providerConflicts?: Event[];
  isRTL?: boolean;
}

function FullYearGridModern({
  year,
  dayWidth,
  monthHeight,
  headerWidth,
  headerHeight,
  hoveredDate,
  selectedDate,
  onDateSelect,
  setHoveredDate,
  setSelectedDate,
  handleDayClick,
  format,
  isSameDay,
  dayContent,
  displayPreviewUpTo,
  tokenBridge,
  motionSystem,
  aiCapacities,
  providerConflicts,
  isRTL = false,
}: FullYearGridModernProps) {
  const i18n = useI18n();
  const { playSuccess, playNotification } = useSoundEffects();

  const localizedDayNames = [
    i18n.calendar.dayNames.short.su,
    i18n.calendar.dayNames.short.mo,
    i18n.calendar.dayNames.short.tu,
    i18n.calendar.dayNames.short.we,
    i18n.calendar.dayNames.short.th,
    i18n.calendar.dayNames.short.fr,
    i18n.calendar.dayNames.short.sa,
  ];

  const localizedMonthShort = [
    i18n.calendar.monthNames.short.jan,
    i18n.calendar.monthNames.short.feb,
    i18n.calendar.monthNames.short.mar,
    i18n.calendar.monthNames.short.apr,
    i18n.calendar.monthNames.short.may,
    i18n.calendar.monthNames.short.jun,
    i18n.calendar.monthNames.short.jul,
    i18n.calendar.monthNames.short.aug,
    i18n.calendar.monthNames.short.sep,
    i18n.calendar.monthNames.short.oct,
    i18n.calendar.monthNames.short.nov,
    i18n.calendar.monthNames.short.dec,
  ];

  // Calculate year details
  const yearStart = startOfYear(new Date(year, 0, 1));
  const _jan1DayOfWeek = yearStart.getDay();

  // Helper function to get date for a specific cell in each month row
  const getDateForCell = (monthRow: number, col: number): Date | null => {
    const monthDate = new Date(year, monthRow, 1);
    const firstDayOfWeek = monthDate.getDay();
    const daysInThisMonth = getDaysInMonth(monthDate);
    const dayNumber = col - firstDayOfWeek + 1;

    if (dayNumber < 1 || dayNumber > daysInThisMonth) {
      return null;
    }

    return new Date(year, monthRow, dayNumber);
  };

  // Enhanced day header with token-based styling
  const dayHeadersTop = (
    <div
      className="absolute top-0 left-0 right-0 border-b flex z-20"
      style={{
        height: headerHeight,
        backgroundColor: tokenBridge.getColorValue('calendar.header.background'),
        borderColor: tokenBridge.getColorValue('calendar.border.primary'),
      }}
    >
      <div style={{ width: headerWidth }} className="border-r" />
      {Array.from({ length: 42 }).map((_, col) => {
        const dayOfWeek = col % 7;
        const dayName = isRTL ? localizedDayNames[6 - dayOfWeek] : localizedDayNames[dayOfWeek];

        return (
          <div
            key={`header-top-${col}`}
            className={cn(
              'flex items-center justify-center text-[10px] font-medium relative transition-colors',
              col % 7 === 6 && 'border-r-2',
              dayOfWeek === 0 && col > 0 && 'border-l',
              isRTL && 'flex-row-reverse'
            )}
            style={{
              width: dayWidth,
              color: tokenBridge.getColorValue('calendar.header.foreground'),
              borderColor: tokenBridge.getColorValue('calendar.border.week'),
            }}
          >
            {dayName}
          </div>
        );
      })}
      <div style={{ width: headerWidth }} className="border-l" />
    </div>
  );

  // Mirror header at bottom
  const dayHeadersBottom = (
    <div
      className="absolute bottom-0 left-0 right-0 border-t flex z-20"
      style={{
        height: headerHeight,
        backgroundColor: tokenBridge.getColorValue('calendar.header.background'),
        borderColor: tokenBridge.getColorValue('calendar.border.primary'),
      }}
    >
      <div style={{ width: headerWidth }} className="border-r" />
      {Array.from({ length: 42 }).map((_, col) => {
        const dayOfWeek = col % 7;
        const dayName = localizedDayNames[dayOfWeek];

        return (
          <div
            key={`header-bottom-${col}`}
            className="flex items-center justify-center text-[10px] font-medium transition-colors"
            style={{
              width: dayWidth,
              color: tokenBridge.getColorValue('calendar.header.foreground'),
            }}
          >
            {dayName}
          </div>
        );
      })}
      <div style={{ width: headerWidth }} className="border-l" />
    </div>
  );

  // Enhanced month labels with RTL support
  const monthLabelsLeft = (
    <div
      className={cn(
        'absolute z-10 transition-colors',
        isRTL ? 'right-0 border-l' : 'left-0 border-r'
      )}
      style={{
        width: headerWidth,
        top: headerHeight,
        bottom: headerHeight,
        backgroundColor: tokenBridge.getColorValue('calendar.sidebar.background'),
        borderColor: tokenBridge.getColorValue('calendar.border.primary'),
      }}
    >
      {localizedMonthShort.map((month, idx) => (
        <div
          key={`left-${month}`}
          className="absolute flex items-center justify-center font-medium text-sm transition-colors"
          style={{
            top: idx * monthHeight,
            height: monthHeight,
            width: headerWidth,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            transformOrigin: 'center',
            color: tokenBridge.getColorValue('calendar.sidebar.foreground'),
          }}
        >
          {month}
        </div>
      ))}
    </div>
  );

  const monthLabelsRight = (
    <div
      className={cn(
        'absolute z-10 transition-colors',
        isRTL ? 'left-0 border-r' : 'right-0 border-l'
      )}
      style={{
        width: headerWidth,
        top: headerHeight,
        bottom: headerHeight,
        backgroundColor: tokenBridge.getColorValue('calendar.sidebar.background'),
        borderColor: tokenBridge.getColorValue('calendar.border.primary'),
      }}
    >
      {localizedMonthShort.map((month, idx) => (
        <div
          key={`right-${month}`}
          className="absolute flex items-center justify-center font-medium text-sm transition-colors"
          style={{
            top: idx * monthHeight,
            height: monthHeight,
            width: headerWidth,
            writingMode: 'vertical-rl',
            color: tokenBridge.getColorValue('calendar.sidebar.foreground'),
          }}
        >
          {month}
        </div>
      ))}
    </div>
  );

  // Generate enhanced grid cells with modern features
  const gridCells = [];
  for (let monthRow = 0; monthRow < 12; monthRow++) {
    for (let col = 0; col < 42; col++) {
      const date = getDateForCell(monthRow, col);
      const dayOfWeek = col % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isCurrentDay = date && isToday(date);
      const isSelected = date && selectedDate && isSameDay(date, selectedDate);
      const isHovered = date && hoveredDate && isSameDay(date, hoveredDate);
      const isEmpty = !date;

      // AI capacity integration
      const dayCapacity = date && aiCapacities ? aiCapacities.get(format(date, 'yyyy-MM-dd')) : 0;
      const hasHighCapacity = dayCapacity && dayCapacity > 0.8;
      const hasLowCapacity = dayCapacity && dayCapacity < 0.3;

      // Provider conflict detection
      const hasConflict =
        date && providerConflicts
          ? providerConflicts.some((event) => isSameDay(event.startDate, date))
          : false;

      gridCells.push(
        <div
          key={`${monthRow}-${col}`}
          data-date={date ? format(date, 'yyyy-MM-dd') : undefined}
          data-day={date ? format(date, 'd') : undefined}
          className={cn(
            'absolute transition-all duration-200 day-cell cursor-pointer',
            col % 7 === 6 && 'border-r-2',
            isWeekend && 'bg-opacity-20',
            isEmpty && 'bg-transparent cursor-default pointer-events-none',
            hasHighCapacity && 'ring-1 ring-green-400 /* TODO: Use semantic token *//50',
            hasLowCapacity && 'ring-1 ring-yellow-400 /* TODO: Use semantic token *//50',
            hasConflict && 'ring-2 ring-red-400 /* TODO: Use semantic token */'
          )}
          style={{
            left: headerWidth + col * dayWidth,
            top: headerHeight + monthRow * monthHeight,
            width: dayWidth,
            height: monthHeight,
            backgroundColor: isEmpty
              ? 'transparent'
              : isWeekend
                ? tokenBridge.getColorValue('calendar.weekend.background')
                : tokenBridge.getColorValue('calendar.day.background'),
            borderColor: tokenBridge.getColorValue('calendar.border.day'),
          }}
          onMouseEnter={() => {
            if (date && !isEmpty) {
              setHoveredDate(date);
              playNotification(); // Subtle hover sound
            }
          }}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (date && !isEmpty) {
              onDateSelect?.(date);
              handleDayClick(date);
              playSuccess(); // Success sound on selection

              // Motion feedback
              motionSystem.animateDayClick(e.target, {
                duration: tokenBridge.getValueByPath('motion.durations.interaction'),
                easing: tokenBridge.getValueByPath('motion.easings.bounce'),
              });
            }
          }}
          title={date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
          aria-label={
            date
              ? `${format(date, 'EEEE, MMMM d, yyyy')}${hasHighCapacity ? ' - High capacity' : ''}${hasLowCapacity ? ' - Low capacity' : ''}${hasConflict ? ' - Sync conflict' : ''}`
              : undefined
          }
        >
          <div
            className={cn(
              'm-[2px] h-[calc(100%-4px)] rounded-sm border transition-all',
              isEmpty ? 'border-transparent' : '',
              isSelected && 'ring-2',
              isHovered && !isEmpty && 'bg-opacity-30'
            )}
            style={{
              borderColor: isEmpty
                ? 'transparent'
                : tokenBridge.getColorValue('calendar.border.cell'),
              backgroundColor:
                isHovered && !isEmpty
                  ? tokenBridge.getColorValue('calendar.hover.background')
                  : 'transparent',
              ringColor: isSelected
                ? tokenBridge.getColorValue('calendar.selected.ring')
                : undefined,
            }}
          >
            <div className="w-full h-full flex items-center justify-center relative">
              {dayContent?.({
                date,
                isEmpty,
                isToday: isCurrentDay,
                isSelected: !!isSelected,
                isWeekend,
                isHovered: !!isHovered,
                displayPreviewUpTo: displayPreviewUpTo && date ? displayPreviewUpTo(date) : false,
                onSelect: () => {
                  if (date && !isEmpty) {
                    setSelectedDate(date);
                    onDateSelect?.(date);
                  }
                },
                onPreview: () => {
                  if (date && !isEmpty) {
                    setHoveredDate(date);
                  }
                },
                dataAttrs: {
                  'data-date': date ? format(date, 'yyyy-MM-dd') : undefined,
                  'data-day': date ? format(date, 'd') : undefined,
                },
              })}

              {/* AI Capacity Indicator */}
              {hasHighCapacity && (
                <div
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: tokenBridge.getColorValue('ai.capacity.high') }}
                  aria-hidden="true"
                />
              )}

              {/* Conflict Indicator */}
              {hasConflict && (
                <div
                  className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: tokenBridge.getColorValue('provider.conflict.indicator'),
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative w-full h-full">
      {dayHeadersTop}
      {dayHeadersBottom}
      {monthLabelsLeft}
      {monthLabelsRight}
      <div
        className="absolute inset-0"
        style={{ paddingTop: headerHeight, paddingBottom: headerHeight }}
      >
        {gridCells}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LINEAR CALENDAR MODERN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LinearCalendarModern({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  enableInfiniteCanvas = true,
  dayContent: customDayContent,

  // Phase 5.0 Enhanced Props
  enableAIFeatures = true,
  enableProviderSync = true,
  enableLibrarySwitching = true,
  enableGovernanceOverlay = false,
  enablePerformanceMonitoring = true,
  enableAnalytics = true,
  theme = 'auto',
  locale = 'en',
  maxEvents = 10000,
  virtualScrolling = true,
}: LinearCalendarModernProps) {
  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM INTEGRATION INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // 🎨 Design Token System Integration
  const tokens = useDesignTokens();
  const enhancedTheme = useEnhancedTheme();
  const tokenBridge = useMemo(() => new TokenBridge(enhancedTheme.theme), [enhancedTheme.theme]);
  const tokenResolver = useMemo(() => new TokenResolver(tokens), [tokens]);

  // 🎬 Motion & Animation System
  const motionSystem = useMotionSystem({
    enablePerformanceMonitoring: enablePerformanceMonitoring,
    audioSettings: {
      success: { enabled: true, volume: 0.1 },
      error: { enabled: true, volume: 0.2 },
      notification: { enabled: true, volume: 0.05 },
    },
  });

  const motionChoreographer = useMemo(
    () => new MotionChoreographer(motionSystem, tokenBridge),
    [motionSystem, tokenBridge]
  );

  // Enhanced button animations with sound sync
  const { ref: zoomInRef, handlePress: handleZoomInPress } = useButtonAnimation({
    category: 'feedback',
    audio: { sound: 'success', syncTiming: true, volume: 0.1 },
  });
  const { ref: zoomOutRef, handlePress: handleZoomOutPress } = useButtonAnimation({
    category: 'feedback',
    audio: { sound: 'success', syncTiming: true, volume: 0.1 },
  });

  // Modal animations with enhanced accessibility
  const {
    modalRef,
    backdropRef,
    open: openEventModal,
    close: closeEventModal,
  } = useModalAnimation();

  // ♿ Accessibility AAA System
  const {
    colorSystem: aaaColors,
    announceToScreenReader,
    getAccessibleLabel,
    validateContrast,
  } = useAccessibilityAAA();

  const { focusProps, handleKeyNavigation, announceFocus, trapFocus, releaseFocus } =
    useFocusManagementAAA({
      regionId: 'calendar-modern',
      enableRegionCycling: true,
      contextualHelp: true,
    });

  const { optimizeForScreenReader, createLiveAnnouncement, enhanceAriaLabels } =
    useScreenReaderOptimization({
      language: locale,
      enableContextualInstructions: true,
    });

  // 🌍 Internationalization & RTL
  const i18n = useI18n();
  const rtlStyles = useRTLStyles();
  const isRTL = i18n.isRTL;

  // 🚀 Performance Monitoring & Optimization
  const { metrics, startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor(
    events.length
  );
  const objectPool = useObjectPool(
    () => ({ id: '', title: '', startDate: new Date(), endDate: new Date(), category: 'personal' }),
    (obj) => {
      obj.id = '';
      obj.title = '';
      obj.startDate = new Date();
      obj.endDate = new Date();
      obj.category = 'personal';
    },
    100 // Increased pool size for modern performance
  );
  const poolStats = objectPool.getPoolStats();

  // 🤖 AI Enhancement System
  const {
    aiSuggestions,
    isAnalyzing,
    dragFeedback,
    handleDragStart: handleAIDragStart,
    handleDragMove: handleAIDragMove,
    handleDrop: handleAIDrop,
    clearAISuggestions,
  } = useAIEnhancedDragDrop(
    events as any,
    (updatedEvents) => {
      console.log('AI optimized events:', updatedEvents);
    },
    {
      enableAI: enableAIFeatures,
      realTimeAnalysis: true,
      autoOptimize: false,
    }
  );

  // 📱 Multi-Device Support
  const isMobile = useMediaQuery('(max-width: 768px)');
  const _isTablet = useMediaQuery('(max-width: 1024px)');

  // 🔗 Calendar Provider Integration
  const providerSyncStatus = useConvexRealTime(enableProviderSync);

  // 📚 Library Ecosystem (handled by separate components)

  // 🎵 Sound Effects System
  const { playSuccess, playError, playNotification } = useSoundEffects();

  // 🏛️ Governance System
  const { validate, getScore, isCompliant } = useGovernanceValidation();

  // 📊 Analytics & Telemetry
  const analytics = useAnalytics(enableAnalytics);

  // ⚙️ Settings & Preferences
  const { settings } = useSettingsContext();

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENT STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fullYear');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventManagementPosition, setEventManagementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Enhanced state for modern features
  const [systemIntegrationState, setSystemIntegrationState] = useState<SystemIntegrationState>({
    designTokensLoaded: false,
    motionSystemReady: false,
    accessibilityEnabled: false,
    i18nInitialized: false,
    performanceMonitorActive: false,
    aiSystemOnline: false,
    providerSyncEnabled: false,
    librarySystemReady: false,
    governanceActive: false,
    analyticsEnabled: false,
  });

  const [keyboardMode, setKeyboardMode] = useState(false);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [announceMessage, setAnnounceMessage] = useState<string>('');

  // Mobile state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Performance state
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);

  // AI state
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiCapacities, setAICapacities] = useState<Map<string, number>>(new Map());

  // Provider state
  const [providerConflicts, setProviderConflicts] = useState<Event[]>([]);
  const [showProviderConflicts, setShowProviderConflicts] = useState(false);

  // Library state
  const [currentLibrary, setCurrentLibrary] = useState('linear-horizontal');
  const [showLibrarySwitcher, setShowLibrarySwitcher] = useState(false);

  // Governance state
  const [governanceScore, setGovernanceScore] = useState(0);
  const [showGovernanceOverlay, setShowGovernanceOverlay] = useState(enableGovernanceOverlay);

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM INITIALIZATION & HEALTH MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  // Initialize all systems and monitor health
  useEffect(() => {
    let mounted = true;

    const initializeSystems = async () => {
      if (!mounted) return;

      try {
        // Design Token System
        setSystemIntegrationState((prev) => ({
          ...prev,
          designTokensLoaded: !!tokens && Object.keys(tokens).length > 0,
        }));

        // Motion System
        if (motionSystem) {
          await motionSystem.initialize?.();
          setSystemIntegrationState((prev) => ({ ...prev, motionSystemReady: true }));
        }

        // Accessibility System
        setSystemIntegrationState((prev) => ({ ...prev, accessibilityEnabled: true }));

        // I18n System
        setSystemIntegrationState((prev) => ({ ...prev, i18nInitialized: !!i18n }));

        // Performance Monitoring
        if (enablePerformanceMonitoring) {
          setSystemIntegrationState((prev) => ({ ...prev, performanceMonitorActive: true }));
        }

        // AI System
        if (enableAIFeatures) {
          setSystemIntegrationState((prev) => ({ ...prev, aiSystemOnline: true }));
        }

        // Provider Sync
        if (enableProviderSync) {
          setSystemIntegrationState((prev) => ({ ...prev, providerSyncEnabled: true }));
        }

        // Library System
        if (enableLibrarySwitching) {
          setSystemIntegrationState((prev) => ({ ...prev, librarySystemReady: true }));
        }

        // Governance System
        if (enableGovernanceOverlay) {
          const score = await getScore();
          setGovernanceScore(score);
          setSystemIntegrationState((prev) => ({ ...prev, governanceActive: true }));
        }

        // Analytics System
        if (enableAnalytics) {
          analytics.track('calendar_modern_initialized', {
            year,
            eventCount: events.length,
            features: {
              ai: enableAIFeatures,
              providers: enableProviderSync,
              libraries: enableLibrarySwitching,
            },
          });
          setSystemIntegrationState((prev) => ({ ...prev, analyticsEnabled: true }));
        }
      } catch (error) {
        console.error('System initialization error:', error);
        announceToScreenReader('Some advanced features may not be available');
      }
    };

    initializeSystems();

    return () => {
      mounted = false;
    };
  }, [
    tokens,
    motionSystem,
    i18n,
    enablePerformanceMonitoring,
    enableAIFeatures,
    enableProviderSync,
    enableLibrarySwitching,
    enableGovernanceOverlay,
    enableAnalytics,
    events.length,
    year,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWPORT & RESPONSIVE CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const headerWidth = isMobile
    ? tokenResolver.resolve('calendar.sidebar.width.mobile') || 50
    : tokenResolver.resolve('calendar.sidebar.width.desktop') || 80;
  const headerHeight = tokenResolver.resolve('calendar.header.height') || 24;

  useEffect(() => {
    const updateSize = () => {
      const width = scrollRef.current?.clientWidth || window.innerWidth;
      const height = scrollRef.current?.clientHeight || window.innerHeight;
      setViewportWidth(width);
      setViewportHeight(height);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate day width with token-based responsive design
  const calculateFullYearDayWidth = useCallback(() => {
    if (viewportWidth === 0) {
      return tokenResolver.resolve('calendar.day.width.fallback') || 20;
    }
    const availableWidth = viewportWidth - headerWidth * 2;
    const minWidth = tokenResolver.resolve('calendar.day.width.minimum') || 18;
    return Math.max(minWidth, availableWidth / 42);
  }, [viewportWidth, headerWidth, tokenResolver]);

  const isFullYearZoom = zoomLevel === 'fullYear';
  const dayWidth = isFullYearZoom
    ? calculateFullYearDayWidth()
    : isMobile
      ? MOBILE_ZOOM_LEVELS[zoomLevel]
      : ZOOM_LEVELS[zoomLevel];

  const monthHeight = isFullYearZoom
    ? Math.max(
        tokenResolver.resolve('calendar.month.height.minimum') || 44,
        Math.floor((viewportHeight - headerHeight * 2) / 12)
      )
    : isMobile
      ? tokenResolver.resolve('calendar.month.height.mobile') || 60
      : tokenResolver.resolve('calendar.month.height.desktop') || 80;

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR DATA PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  const calendarData = useMemo(() => {
    const months = [];
    const yearStart = startOfYear(new Date(year, 0, 1));

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = addMonths(yearStart, monthIndex);
      const daysInMonth = getDaysInMonth(monthDate);
      const monthStart = startOfMonth(monthDate);

      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        days.push({
          date,
          day,
          isToday: isToday(date),
          dayOfYear: differenceInDays(date, yearStart) + 1,
        });
      }

      const startDayOfYear = differenceInDays(monthStart, yearStart) + 1;
      const endDayOfYear = startDayOfYear + daysInMonth - 1;

      months.push({
        index: monthIndex,
        name: MONTH_NAMES[monthIndex],
        shortName: MONTH_SHORT[monthIndex],
        days,
        daysInMonth,
        startDayOfYear,
        endDayOfYear,
      });
    }

    return months;
  }, [year]);

  // Process events with enhanced positioning
  const processedEvents = useMemo(() => {
    return events.map((event) => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const jan1DayOfWeek = yearStart.getDay();
      const startDay = differenceInDays(startOfDay(event.startDate), yearStart) + 1;
      const endDay = differenceInDays(endOfDay(event.endDate), yearStart) + 1;
      const duration = endDay - startDay + 1;
      const eventMonth = event.startDate.getMonth();

      let left;
      let width;
      let top;

      if (isFullYearZoom) {
        const startCol = jan1DayOfWeek + startDay - 1;
        const endCol = jan1DayOfWeek + endDay - 1;
        left = startCol * dayWidth + headerWidth;
        width = (endCol - startCol + 1) * dayWidth - 2;
        top = eventMonth * monthHeight + headerHeight + 4;
      } else {
        left = (startDay - 1) * dayWidth + headerWidth;
        width = duration * dayWidth - 2;
        top = eventMonth * monthHeight + 25;
      }

      return {
        ...event,
        startDay,
        endDay,
        duration,
        month: eventMonth,
        left,
        width,
        top,
        height: tokenResolver.resolve('calendar.event.height') || 20,
      };
    });
  }, [
    events,
    dayWidth,
    year,
    isFullYearZoom,
    monthHeight,
    headerWidth,
    headerHeight,
    tokenResolver,
  ]);

  // Virtual scrolling for performance
  const visibleEvents = useMemo(() => {
    if (!containerRef.current || processedEvents.length === 0 || !virtualScrolling) {
      return processedEvents;
    }

    if (processedEvents.length < maxEvents * 0.1) return processedEvents;

    try {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buffer = Math.max(containerRect.width * 0.5, 1000);
      const leftBound = scrollLeft - buffer;
      const rightBound = scrollLeft + containerRect.width + buffer;
      const topBound = scrollTop - buffer;
      const bottomBound = scrollTop + containerRect.height + buffer;

      return processedEvents.filter((event) => {
        const eventLeft = event.left;
        const eventRight = event.left + event.width;
        const eventTop = event.top;
        const eventBottom = event.top + event.height;

        const horizontalVisible = eventRight >= leftBound && eventLeft <= rightBound;
        const verticalVisible = eventBottom >= topBound && eventTop <= bottomBound;

        return horizontalVisible && verticalVisible;
      });
    } catch (error) {
      console.warn('Virtual scrolling calculation failed:', error);
      return processedEvents;
    }
  }, [processedEvents, scrollLeft, scrollTop, virtualScrolling, maxEvents]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DAY CONTENT RENDERING LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  const dayContent = useMemo(() => {
    if (customDayContent) {
      return customDayContent;
    }

    const style = settings.calendar.calendarDayStyle;
    if (style === 'dot') {
      return (ctx: DayContentContext) => <DotDayContent context={ctx} />;
    }
    return (ctx: DayContentContext) => <NumberDayContent context={ctx} />;
  }, [customDayContent, settings.calendar.calendarDayStyle]);

  // Display preview logic for dot mode
  const displayPreviewUpTo = useCallback(
    (date: Date): boolean => {
      if (settings.calendar.calendarDayStyle !== 'dot' || !date) {
        return true;
      }

      const today = startOfDay(new Date());
      const targetDate = startOfDay(date);

      if (date.getFullYear() === today.getFullYear()) {
        const compareDate = hoveredDate && hoveredDate > today ? startOfDay(hoveredDate) : today;
        return targetDate <= compareDate;
      }

      if (date.getFullYear() < today.getFullYear()) {
        return true;
      }

      if (hoveredDate && hoveredDate.getFullYear() === date.getFullYear()) {
        return targetDate <= startOfDay(hoveredDate);
      }

      return false;
    },
    [settings.calendar.calendarDayStyle, hoveredDate]
  );

  // Days left calculation for dot mode
  const daysLeft = useMemo(() => {
    if (settings.calendar.calendarDayStyle !== 'dot') {
      return 0;
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    if (year !== currentYear) {
      return 0;
    }

    const isLeapYear =
      currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    const startOfCurrentYear = new Date(currentYear, 0, 1);
    const dayOfYear = differenceInDays(startOfDay(today), startOfDay(startOfCurrentYear)) + 1;

    if (hoveredDate && hoveredDate > today && hoveredDate.getFullYear() === currentYear) {
      const hoveredDayOfYear =
        differenceInDays(startOfDay(hoveredDate), startOfDay(startOfCurrentYear)) + 1;
      return Math.max(0, totalDays - hoveredDayOfYear);
    }

    return Math.max(0, totalDays - dayOfYear);
  }, [settings.calendar.calendarDayStyle, year, hoveredDate]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS & INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Enhanced zoom handlers with motion and audio feedback
  const handleZoomIn = useCallback(async () => {
    const levels: ZoomLevel[] = ['fullYear', 'year', 'quarter', 'month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      await handleZoomInPress();

      setZoomLevel(levels[currentIndex + 1]);

      const newLevel = levels[currentIndex + 1];
      announceToScreenReader(i18n.t('Calendar.zoomLevelChanged', { level: newLevel }));

      motionChoreographer.orchestrateZoomTransition('in', {
        duration: tokenResolver.resolve('motion.duration.interface'),
        easing: tokenResolver.resolve('motion.easing.spring'),
      });

      // Analytics tracking
      analytics.track('calendar_zoom_in', { from: zoomLevel, to: newLevel });

      playSuccess();
    }
  }, [
    zoomLevel,
    handleZoomInPress,
    announceToScreenReader,
    i18n,
    motionChoreographer,
    tokenResolver,
    analytics,
    playSuccess,
  ]);

  const handleZoomOut = useCallback(async () => {
    const levels: ZoomLevel[] = ['fullYear', 'year', 'quarter', 'month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      await handleZoomOutPress();

      setZoomLevel(levels[currentIndex - 1]);

      const newLevel = levels[currentIndex - 1];
      announceToScreenReader(i18n.t('Calendar.zoomLevelChanged', { level: newLevel }));

      motionChoreographer.orchestrateZoomTransition('out', {
        duration: tokenResolver.resolve('motion.duration.interface'),
        easing: tokenResolver.resolve('motion.easing.spring'),
      });

      analytics.track('calendar_zoom_out', { from: zoomLevel, to: newLevel });

      playSuccess();
    }
  }, [
    zoomLevel,
    handleZoomOutPress,
    announceToScreenReader,
    i18n,
    motionChoreographer,
    tokenResolver,
    analytics,
    playSuccess,
  ]);

  // Enhanced day click handler
  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedEvent(null);
      setEventManagementPosition(null);
      setSelectedDate(date);
      setShowEventModal(true);

      // AI capacity analysis for clicked date
      if (enableAIFeatures && aiCapacities.has(format(date, 'yyyy-MM-dd'))) {
        const capacity = aiCapacities.get(format(date, 'yyyy-MM-dd'));
        if (capacity && capacity < 0.3) {
          announceToScreenReader(`Low capacity day: ${format(date, 'MMMM d')}`);
        }
      }

      analytics.track('calendar_day_click', {
        date: format(date, 'yyyy-MM-dd'),
        zoomLevel,
        hasEvents: events.some((e) => isSameDay(e.startDate, date)),
      });
    },
    [
      setSelectedEvent,
      setEventManagementPosition,
      setSelectedDate,
      setShowEventModal,
      enableAIFeatures,
      aiCapacities,
      announceToScreenReader,
      analytics,
      zoomLevel,
      events,
    ]
  );

  // Enhanced event save handler
  const handleEventSave = useCallback(
    (eventData: Partial<Event>) => {
      if (eventData.id) {
        onEventUpdate?.(eventData as Event);
      } else {
        onEventCreate?.(eventData);
      }
      setShowEventModal(false);
      setSelectedDate(null);
      setSelectedEvent(null);

      // Play success sound and motion feedback
      playSuccess();
      motionSystem.playAudioFeedback?.('success');

      analytics.track('calendar_event_save', {
        isNew: !eventData.id,
        category: eventData.category,
        duration:
          eventData.startDate && eventData.endDate
            ? differenceInDays(new Date(eventData.endDate), new Date(eventData.startDate)) + 1
            : 1,
      });
    },
    [onEventUpdate, onEventCreate, playSuccess, motionSystem, analytics]
  );

  // Check for overlapping events with enhanced logic
  const checkForOverlaps = useCallback(
    (start: Date, end: Date, excludeId?: string) => {
      return events.filter((event) => {
        if (excludeId && event.id === excludeId) return false;

        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        return (start <= eventEnd && end >= eventStart) || (eventStart <= end && eventEnd >= start);
      });
    },
    [events]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION & ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════════════

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedDate && (e.key === 'Tab' || e.key === 'Enter')) {
        setFocusedDate(new Date());
        setKeyboardMode(true);
        setAnnounceMessage('Entered calendar navigation mode');
        return;
      }

      if (!focusedDate) return;

      let newDate = focusedDate;
      let handled = false;

      switch (e.key) {
        case 'ArrowLeft':
          newDate = addDays(focusedDate, isRTL ? 1 : -1);
          handled = true;
          break;
        case 'ArrowRight':
          newDate = addDays(focusedDate, isRTL ? -1 : 1);
          handled = true;
          break;
        case 'ArrowUp':
          newDate = addDays(focusedDate, -7);
          handled = true;
          break;
        case 'ArrowDown':
          newDate = addDays(focusedDate, 7);
          handled = true;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedDate) {
            setSelectedDate(focusedDate);
            onDateSelect?.(focusedDate);
            setAnnounceMessage(`Selected ${format(focusedDate, 'MMMM d, yyyy')}`);
            playSuccess();
          }
          handled = true;
          break;
        case 'Escape':
          setFocusedDate(null);
          setKeyboardMode(false);
          setAnnounceMessage('Exited calendar navigation');
          handled = true;
          break;
        case 't':
        case 'T': {
          const today = new Date();
          setFocusedDate(today);
          setAnnounceMessage(`Navigated to today: ${format(today, 'MMMM d, yyyy')}`);
          handled = true;
          break;
        }
      }

      if (handled) {
        e.preventDefault();
        if (newDate !== focusedDate) {
          setFocusedDate(newDate);
          setAnnounceMessage(`${format(newDate, 'EEEE, MMMM d, yyyy')}`);
        }
      }
    },
    [focusedDate, onDateSelect, isRTL, playSuccess]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTURE HANDLING & MOBILE SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════

  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y] }) => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = -x;
          scrollRef.current.scrollTop = -y;
        }
      },
      onWheel: ({ event, delta: [dx, dy] }) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (dy < 0) handleZoomIn();
          else handleZoomOut();
        } else if (scrollRef.current) {
          scrollRef.current.scrollLeft += dx;
          scrollRef.current.scrollTop += dy;
        }
      },
    },
    {
      drag: {
        from: () =>
          scrollRef.current
            ? [-scrollRef.current.scrollLeft, -scrollRef.current.scrollTop]
            : [0, 0],
      },
      wheel: { preventDefault: true },
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE MONITORING & EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Performance measurement
  useEffect(() => {
    if (events.length > 0 && enablePerformanceMonitoring) {
      startRenderMeasurement();
      const rafId = requestAnimationFrame(() => {
        endRenderMeasurement();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [events, enablePerformanceMonitoring, startRenderMeasurement, endRenderMeasurement]);

  // Scroll tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      setScrollLeft(containerRef.current.scrollLeft);
      setScrollTop(containerRef.current.scrollTop);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Screen reader announcements
  useEffect(() => {
    if (announceMessage && liveRegionRef.current) {
      liveRegionRef.current.textContent = announceMessage;
    }
  }, [announceMessage]);

  // Initialize position to start of year
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, top: 0 });
    }
  }, [year]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER MAIN COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <PerformanceSLOProvider
      targetMetrics={{
        loadTime: 500,
        renderTime: 100,
        memoryUsage: 100 * 1024 * 1024, // 100MB
        fps: 60,
      }}
    >
      <div
        ref={containerRef}
        className={cn('relative focus:outline-none transition-all duration-200', className)}
        style={{
          backgroundColor: tokenBridge.getColorValue('calendar.background'),
          color: tokenBridge.getColorValue('calendar.foreground'),
          ...aaaColors.getContrastSafeStyles('calendar', 'background'),
          paddingInlineStart: tokenResolver.resolve('calendar.padding.inline'),
          paddingInlineEnd: tokenResolver.resolve('calendar.padding.inline'),
        }}
        onKeyDown={(e) => {
          handleKeyNavigation(e);
          handleKeyDown(e);
        }}
        data-testid="linear-calendar-modern"
        aria-label={getAccessibleLabel(
          'calendar',
          `${i18n.calendar.title(year)}. ${i18n.calendar.navigationInstructions}`
        )}
        {...focusProps}
        role="application"
        aria-roledescription={i18n.calendar.roleDescription}
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Screen reader live region */}
        <div
          ref={liveRegionRef}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />

        {/* Enhanced Header with System Status */}
        <div
          className="absolute top-0 left-0 right-0 z-30 border-b transition-all"
          style={{
            backgroundColor: tokenBridge.getColorValue('calendar.header.background'),
            borderColor: tokenBridge.getColorValue('calendar.border.primary'),
          }}
        >
          <div className="flex items-center justify-between px-6 py-3">
            {/* Year title with RTL support */}
            <div className="flex items-center gap-4">
              <h1
                className={cn(
                  'text-xl font-semibold transition-colors',
                  rtlStyles.classes.textAlign
                )}
              >
                {i18n.calendar.title(year)}
              </h1>

              {/* System Status Indicators */}
              <div className="flex items-center gap-2">
                {systemIntegrationState.aiSystemOnline && (
                  <div className="flex items-center gap-1 text-xs text-green-600 /* TODO: Use semantic token */">
                    <Zap className="w-3 h-3" />
                    <span>AI</span>
                  </div>
                )}
                {systemIntegrationState.providerSyncEnabled && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 /* TODO: Use semantic token */">
                    <Globe className="w-3 h-3" />
                    <span>Sync</span>
                  </div>
                )}
                {systemIntegrationState.governanceActive && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 /* TODO: Use semantic token */">
                    <Shield className="w-3 h-3" />
                    <span>{Math.round(governanceScore)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side content */}
            <div className="flex items-center gap-6">
              {/* Days left counter (dot mode only) */}
              {settings.calendar.calendarDayStyle === 'dot' &&
                settings.calendar.showDaysLeft &&
                year === new Date().getFullYear() && (
                  <div className="flex items-baseline gap-2">
                    <RollingDigits
                      value={daysLeft}
                      className="text-base font-medium"
                      style={{ color: tokenBridge.getColorValue('calendar.accent') }}
                      aria-label={`${daysLeft} days remaining in ${year}`}
                    />
                    <span className="text-sm opacity-75">{i18n.t('Calendar.daysLeftLabel')}</span>
                  </div>
                )}

              {/* Tagline with RTL support */}
              <p className={cn('text-sm opacity-75 italic', rtlStyles.classes.textAlign)}>
                {i18n.calendar.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Provider Sync Status Bar */}
        {enableProviderSync && (
          <CalendarProviderSyncStatus
            syncStatus={providerSyncStatus}
            onConflictClick={() => setShowProviderConflicts(true)}
            className="sticky top-16 z-20"
          />
        )}

        {/* Library Switcher */}
        {enableLibrarySwitching && (
          <CalendarLibrarySwitcher
            currentLibrary={currentLibrary}
            onLibraryChange={setCurrentLibrary}
            show={showLibrarySwitcher}
            onToggle={setShowLibrarySwitcher}
            className="absolute top-20 right-4 z-20"
          />
        )}

        {/* AI Capacity Ribbon */}
        {enableAIFeatures && (
          <AICapacityRibbon
            year={year}
            capacities={aiCapacities}
            onCapacityUpdate={setAICapacities}
            className="absolute top-24 left-4 right-4 z-10"
          />
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="absolute top-4 right-4 z-30 p-2 rounded-lg transition-all"
            style={{
              backgroundColor: tokenBridge.getColorValue('button.background'),
              color: tokenBridge.getColorValue('button.foreground'),
              borderColor: tokenBridge.getColorValue('button.border'),
            }}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu-modern"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}

        {/* Enhanced Zoom Controls */}
        <div
          id="mobile-menu-modern"
          className={cn(
            'absolute z-20 rounded-lg shadow-lg transition-all',
            isFullYearZoom
              ? 'hidden'
              : isMobile
                ? isMobileMenuOpen
                  ? 'top-16 right-4 flex flex-col gap-2 p-3'
                  : 'hidden'
                : 'top-4 right-4 flex items-center gap-2 p-1'
          )}
          style={{
            backgroundColor: tokenBridge.getColorValue('controls.background'),
            borderColor: tokenBridge.getColorValue('controls.border'),
          }}
          role="toolbar"
          aria-label="Zoom controls"
        >
          <button
            ref={zoomOutRef}
            onClick={handleZoomOut}
            className={cn(
              'rounded transition-all focus:outline-none focus:ring-3 focus:ring-offset-1',
              aaaColors.focusRing.className,
              isMobile ? 'p-2 w-full flex items-center justify-center gap-2' : 'p-1'
            )}
            style={{
              backgroundColor: tokenBridge.getColorValue('button.background'),
              color: tokenBridge.getColorValue('button.foreground'),
              borderRadius: tokenResolver.resolve('button.radius'),
              ...aaaColors.getContrastSafeStyles('button', 'background'),
            }}
            disabled={zoomLevel === 'fullYear'}
            aria-label={getAccessibleLabel('zoomOut', i18n.calendar.zoomOut)}
            aria-disabled={zoomLevel === 'fullYear'}
            {...focusProps}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
            {isMobile && <span className="text-sm">{i18n.calendar.zoomOut}</span>}
          </button>

          <span
            className={cn(
              'text-xs font-medium capitalize transition-colors',
              isMobile ? 'text-center py-1' : 'px-2'
            )}
            role="status"
            aria-live="polite"
            aria-label={`Current zoom level: ${zoomLevel}`}
            style={{ color: tokenBridge.getColorValue('text.muted') }}
          >
            {zoomLevel}
          </span>

          <button
            ref={zoomInRef}
            onClick={handleZoomIn}
            className={cn(
              'rounded transition-all focus:outline-none focus:ring-3 focus:ring-offset-1',
              aaaColors.focusRing.className,
              isMobile ? 'p-2 w-full flex items-center justify-center gap-2' : 'p-1'
            )}
            style={{
              backgroundColor: tokenBridge.getColorValue('button.background'),
              color: tokenBridge.getColorValue('button.foreground'),
              borderRadius: tokenResolver.resolve('button.radius'),
              ...aaaColors.getContrastSafeStyles('button', 'background'),
            }}
            disabled={zoomLevel === 'day'}
            aria-label={getAccessibleLabel('zoomIn', i18n.calendar.zoomIn)}
            aria-disabled={zoomLevel === 'day'}
            {...focusProps}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isMobile && <span className="text-sm">{i18n.calendar.zoomIn}</span>}
          </button>
        </div>

        {/* Main Calendar Container */}
        <div
          ref={scrollRef}
          className="h-full relative overflow-hidden transition-all"
          style={{
            cursor: enableInfiniteCanvas ? 'grab' : 'default',
            paddingTop: enableProviderSync ? '120px' : '80px', // Account for headers
          }}
          {...bind()}
          onClick={(e) => {
            if (
              (e.target as HTMLElement).closest('[role="grid"]') &&
              !(e.target as HTMLElement).closest('[class*="bg-"]')
            ) {
              setSelectedEvent(null);
              setEventManagementPosition(null);
            }
          }}
          role="grid"
          aria-label={`Calendar grid for ${year}. ${keyboardMode ? 'Keyboard navigation active.' : 'Press Enter to activate keyboard navigation.'}`}
          aria-rowcount={12}
          aria-colcount={42}
        >
          <div
            className="relative transition-all"
            style={{
              width: isFullYearZoom ? '100%' : 42 * dayWidth + headerWidth * 2,
              height: isFullYearZoom ? 12 * monthHeight + headerHeight * 2 : 12 * monthHeight,
              minWidth: '100%',
            }}
          >
            {/* Render Full Year Grid or Traditional Layout */}
            {isFullYearZoom ? (
              <FullYearGridModern
                year={year}
                dayWidth={dayWidth}
                monthHeight={monthHeight}
                headerWidth={headerWidth}
                headerHeight={headerHeight}
                hoveredDate={hoveredDate}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                setHoveredDate={setHoveredDate}
                setSelectedDate={setSelectedDate}
                handleDayClick={handleDayClick}
                format={format}
                isSameDay={isSameDay}
                dayContent={dayContent}
                displayPreviewUpTo={displayPreviewUpTo}
                tokenBridge={tokenBridge}
                motionSystem={motionSystem}
                aiCapacities={aiCapacities}
                providerConflicts={providerConflicts}
                isRTL={isRTL}
              />
            ) : (
              // Traditional month rows layout (preserved for other zoom levels)
              <>
                {calendarData.map((month, monthIndex) => (
                  <div
                    key={month.index}
                    className="absolute left-0 right-0 border-b transition-colors"
                    style={{
                      top: monthIndex * monthHeight,
                      height: monthHeight,
                      borderColor: tokenBridge.getColorValue('calendar.border.month'),
                    }}
                  >
                    {/* Month Name (Fixed Left) */}
                    <div
                      className="absolute left-0 top-0 border-r flex items-center justify-center font-medium text-sm transition-all"
                      style={{
                        width: headerWidth,
                        height: monthHeight,
                        zIndex: 10,
                        backgroundColor: tokenBridge.getColorValue('calendar.sidebar.background'),
                        borderColor: tokenBridge.getColorValue('calendar.border.primary'),
                        color: tokenBridge.getColorValue('calendar.sidebar.foreground'),
                      }}
                    >
                      {month.shortName}
                    </div>

                    {/* Days Grid */}
                    <div
                      className="absolute"
                      style={{
                        left: headerWidth,
                        right: 0,
                        top: 0,
                        height: monthHeight,
                      }}
                    >
                      {month.days.map(({ date, day, isToday: isCurrentDay, dayOfYear }) => {
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isHovered = hoveredDate && isSameDay(date, hoveredDate);

                        return (
                          <div
                            key={day}
                            className={cn(
                              'absolute top-0 border-r hover:bg-opacity-10 transition-all cursor-pointer',
                              isCurrentDay && 'ring-1',
                              isSelected && 'ring-2',
                              isHovered && 'bg-opacity-10'
                            )}
                            style={{
                              left: (dayOfYear - month.startDayOfYear) * dayWidth,
                              width: dayWidth,
                              height: monthHeight,
                              backgroundColor: isCurrentDay
                                ? tokenBridge.getColorValue('calendar.today.background')
                                : tokenBridge.getColorValue('calendar.day.background'),
                              borderColor: tokenBridge.getColorValue('calendar.border.day'),
                              ringColor: isCurrentDay
                                ? tokenBridge.getColorValue('calendar.today.ring')
                                : isSelected
                                  ? tokenBridge.getColorValue('calendar.selected.ring')
                                  : undefined,
                            }}
                            onMouseEnter={() => setHoveredDate(date)}
                            onMouseLeave={() => setHoveredDate(null)}
                            onClick={(e) => {
                              e.preventDefault();
                              onDateSelect?.(date);
                              handleDayClick(date);
                            }}
                            title={format(date, 'EEEE, MMMM d, yyyy')}
                          >
                            {/* Day Number */}
                            {dayWidth >= 20 && (
                              <div
                                className="absolute top-1 left-1 text-xs transition-colors"
                                style={{ color: tokenBridge.getColorValue('calendar.day.number') }}
                              >
                                {day}
                              </div>
                            )}

                            {/* Today indicator for narrow views */}
                            {dayWidth < 20 && isCurrentDay && (
                              <div
                                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                style={{
                                  backgroundColor: tokenBridge.getColorValue(
                                    'calendar.today.indicator'
                                  ),
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Enhanced Event Bars with modern styling */}
            <div
              className="absolute inset-0 pointer-events-none transition-all"
              style={{ marginLeft: isFullYearZoom ? 0 : headerWidth }}
            >
              {visibleEvents.map((event, index) => {
                const stackRow = (event as any).stackRow || 0;
                const categoryColors = {
                  personal: {
                    background: tokenBridge.getColorValue('event.personal.background'),
                    foreground: tokenBridge.getColorValue('event.personal.foreground'),
                    hover: tokenBridge.getColorValue('event.personal.hover'),
                  },
                  work: {
                    background: tokenBridge.getColorValue('event.work.background'),
                    foreground: tokenBridge.getColorValue('event.work.foreground'),
                    hover: tokenBridge.getColorValue('event.work.hover'),
                  },
                  effort: {
                    background: tokenBridge.getColorValue('event.effort.background'),
                    foreground: tokenBridge.getColorValue('event.effort.foreground'),
                    hover: tokenBridge.getColorValue('event.effort.hover'),
                  },
                  note: {
                    background: tokenBridge.getColorValue('event.note.background'),
                    foreground: tokenBridge.getColorValue('event.note.foreground'),
                    hover: tokenBridge.getColorValue('event.note.hover'),
                  },
                } as const;

                const eventColors =
                  categoryColors[event.category as keyof typeof categoryColors] ||
                  categoryColors.personal;
                const isSelected = selectedEvent?.id === event.id;
                const eventHeight = tokenResolver.resolve('calendar.event.height') || 20;
                const eventMargin = tokenResolver.resolve('calendar.event.margin') || 2;

                return (
                  <div
                    key={event.id || index}
                    className={cn(
                      'absolute pointer-events-auto rounded-sm flex items-center transition-all group cursor-pointer',
                      isSelected && 'ring-2 ring-offset-1 z-20 shadow-lg'
                    )}
                    style={{
                      left: isFullYearZoom ? event.left : event.left - headerWidth,
                      top:
                        event.top +
                        stackRow * (eventHeight + eventMargin) +
                        (isFullYearZoom ? 0 : 4),
                      width: Math.max(event.width - 2, isFullYearZoom ? 10 : 30),
                      height: eventHeight,
                      backgroundColor: eventColors.background,
                      color: eventColors.foreground,
                      borderRadius: tokenResolver.resolve('event.radius'),
                      ringColor: isSelected
                        ? tokenBridge.getColorValue('event.selected.ring')
                        : undefined,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Event: ${event.title}. From ${format(event.startDate, 'MMM d')} to ${format(event.endDate, 'MMM d')}. Category: ${event.category}. Press Enter to select, Delete to remove.`}
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedEvent(event);
                        onEventClick?.(event);
                        setAnnounceMessage(`Selected event: ${event.title}`);
                        playSuccess();
                      } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        e.preventDefault();
                        if (event.id) {
                          onEventDelete?.(event.id);
                          setAnnounceMessage(`Deleted event: ${event.title}`);
                          playSuccess();
                        }
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);

                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setEventManagementPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });

                      onEventClick?.(event);
                      playNotification();
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                    title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
                  >
                    {/* Event content with enhanced styling */}
                    <div className="flex items-center gap-1 px-2 flex-1 min-w-0">
                      {event.width > 60 && (
                        <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-70 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{event.title}</span>
                      {event.width > 120 && (
                        <span className="text-xs opacity-75 truncate">
                          {format(event.startDate, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Event Modal with Full Integration */}
        <AccessibilityProvider>
          <ScreenReaderOptimizer>
            <div ref={modalRef}>
              <EventModal
                open={showEventModal}
                onOpenChange={(open) => {
                  if (open) {
                    openEventModal();
                    trapFocus('event-modal-modern');
                  } else {
                    closeEventModal();
                    releaseFocus();
                  }
                  setShowEventModal(open);
                }}
                event={selectedEvent}
                selectedDate={selectedDate}
                selectedRange={null}
                onSave={handleEventSave}
                onDelete={(eventId) => {
                  onEventDelete?.(eventId);
                  playSuccess();
                  analytics.track('calendar_event_delete', { eventId });
                }}
                checkOverlaps={checkForOverlaps}
                events={events}
                aria-describedby="event-modal-modern-instructions"
                {...enhanceAriaLabels({
                  modal: 'Event Management Modal',
                  instructions: 'Use Tab to navigate, Escape to close',
                })}
              />
            </div>
          </ScreenReaderOptimizer>
        </AccessibilityProvider>

        {/* Modern Feature Panels & Overlays */}

        {/* AI Conflict Detection */}
        {enableAIFeatures && (
          <AIConflictDetector
            events={visibleEvents}
            onConflictDetected={setProviderConflicts}
            className="absolute top-0 left-0 right-0 z-5"
          />
        )}

        {/* Provider Conflict Modal */}
        {enableProviderSync && (
          <ProviderConflictModal
            open={showProviderConflicts}
            onOpenChange={setShowProviderConflicts}
            conflicts={providerConflicts}
            onResolve={(resolution) => {
              // Handle conflict resolution
              console.log('Conflict resolved:', resolution);
              setProviderConflicts([]);
              playSuccess();
            }}
          />
        )}

        {/* Multi-Provider Event Creator */}
        {enableProviderSync && selectedDate && (
          <MultiProviderEventCreator
            date={selectedDate}
            providers={['google', 'microsoft', 'apple', 'caldav']}
            onEventCreate={(event, provider) => {
              handleEventSave(event);
              analytics.track('calendar_multi_provider_create', { provider });
            }}
          />
        )}

        {/* Library Transition Animator */}
        {enableLibrarySwitching && (
          <LibraryTransitionAnimator
            fromLibrary="linear-horizontal"
            toLibrary={currentLibrary}
            isTransitioning={currentLibrary !== 'linear-horizontal'}
            onTransitionComplete={() => {
              console.log('Library transition complete');
            }}
          />
        )}

        {/* Performance Overlay */}
        {enablePerformanceMonitoring && (
          <PerformanceOverlay
            metrics={metrics}
            poolStats={poolStats}
            visible={showPerformanceOverlay}
            onClose={() => setShowPerformanceOverlay(false)}
            systemHealth={systemIntegrationState}
          />
        )}

        {/* AI Suggestions Panel */}
        {enableAIFeatures && (
          <AISuggestionsPanel
            suggestions={aiSuggestions}
            dragFeedback={dragFeedback}
            isAnalyzing={isAnalyzing}
            onClear={clearAISuggestions}
            onApplySuggestion={(suggestion) => {
              // Apply AI suggestion
              console.log('Applying AI suggestion:', suggestion);
              playSuccess();
            }}
            className="mb-20"
          />
        )}

        {/* Governance Overlay */}
        {enableGovernanceOverlay && (
          <GovernanceOverlay
            score={governanceScore}
            compliance={isCompliant()}
            visible={showGovernanceOverlay}
            onClose={() => setShowGovernanceOverlay(false)}
            recommendations={validate().recommendations || []}
          />
        )}

        {/* WebSocket Sync Manager */}
        {enableProviderSync && (
          <WebSocketSyncManager
            providers={['google', 'microsoft', 'apple', 'caldav']}
            onSyncUpdate={(updates) => {
              // Handle real-time sync updates
              console.log('Sync updates received:', updates);
            }}
          />
        )}

        {/* Touch Gesture Handler for Mobile */}
        {isMobile && (
          <TouchGestureHandler
            onGesture={(gesture) => {
              switch (gesture.type) {
                case 'pinch':
                  if (gesture.scale > 1.1) handleZoomIn();
                  else if (gesture.scale < 0.9) handleZoomOut();
                  break;
                case 'longPress':
                  if (gesture.date) handleDayClick(gesture.date);
                  break;
                case 'doubleTap':
                  if (gesture.date) {
                    setSelectedDate(gesture.date);
                    setShowEventModal(true);
                  }
                  break;
              }
            }}
          />
        )}

        {/* Mobile Optimizer */}
        {isMobile && (
          <MobileOptimizer
            containerRef={containerRef}
            zoomLevel={zoomLevel}
            onOptimizationApplied={(optimization) => {
              console.log('Mobile optimization applied:', optimization);
            }}
          />
        )}

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
            <button
              onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
              className="p-2 rounded-full shadow-lg transition-all"
              style={{
                backgroundColor: tokenBridge.getColorValue('dev.tools.background'),
                color: tokenBridge.getColorValue('dev.tools.foreground'),
              }}
              title="Toggle Performance Monitor"
              aria-label="Toggle Performance Monitor"
            >
              <Activity className="w-4 h-4" />
            </button>

            {enableGovernanceOverlay && (
              <button
                onClick={() => setShowGovernanceOverlay(!showGovernanceOverlay)}
                className="p-2 rounded-full shadow-lg transition-all"
                style={{
                  backgroundColor: tokenBridge.getColorValue('dev.tools.background'),
                  color: tokenBridge.getColorValue('dev.tools.foreground'),
                }}
                title="Toggle Governance Overlay"
                aria-label="Toggle Governance Overlay"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {enableAIFeatures && (
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="p-2 rounded-full shadow-lg transition-all"
                style={{
                  backgroundColor: tokenBridge.getColorValue('dev.tools.background'),
                  color: tokenBridge.getColorValue('dev.tools.foreground'),
                }}
                title="Toggle AI Suggestions"
                aria-label="Toggle AI Suggestions"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Simple Event Management Panel */}
        {selectedEvent && eventManagementPosition && (
          <div
            className="fixed rounded-lg shadow-lg p-3 z-50 transition-all"
            style={{
              left: eventManagementPosition.x,
              top: eventManagementPosition.y,
              backgroundColor: tokenBridge.getColorValue('popup.background'),
              borderColor: tokenBridge.getColorValue('popup.border'),
              color: tokenBridge.getColorValue('popup.foreground'),
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{selectedEvent.title}</h4>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setEventManagementPosition(null);
                }}
                className="ml-auto opacity-75 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEventModal(true)}
                className="px-2 py-1 text-xs rounded transition-all"
                style={{
                  backgroundColor: tokenBridge.getColorValue('button.primary.background'),
                  color: tokenBridge.getColorValue('button.primary.foreground'),
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onEventDelete?.(selectedEvent.id);
                  setSelectedEvent(null);
                  setEventManagementPosition(null);
                  playSuccess();
                }}
                className="px-2 py-1 text-xs rounded transition-all"
                style={{
                  backgroundColor: tokenBridge.getColorValue('button.destructive.background'),
                  color: tokenBridge.getColorValue('button.destructive.foreground'),
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </PerformanceSLOProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT & TYPE DECLARATIONS
// ═══════════════════════════════════════════════════════════════════════════

export type { LinearCalendarModernProps, SystemIntegrationState };
export default LinearCalendarModern;
