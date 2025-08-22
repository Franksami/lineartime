'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useGesture } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfYear, getDaysInYear, differenceInDays, startOfMonth, endOfMonth, isToday, isSameMonth, isSameDay } from 'date-fns';

/**
 * Timeline Configuration
 */
export interface TimelineConfig {
  startDate?: Date;
  endDate?: Date;
  initialZoomLevel?: ZoomLevel;
  enableGestures?: boolean;
  enableKeyboardNavigation?: boolean;
  showHeatMap?: boolean;
  // Deprecated - kept for backwards compatibility
  glassmorphic?: boolean;
  monthRowHeight?: number;
  dayColumnWidth?: number;
  minDayWidth?: number;
  maxDayWidth?: number;
}

/**
 * Zoom Levels for Semantic Zooming
 */
export enum ZoomLevel {
  YEAR = 'year',       // 365 days view with heat map
  QUARTER = 'quarter', // 90 days view
  MONTH = 'month',     // 30 days view
  WEEK = 'week',       // 7 days view
  DAY = 'day'          // Single day focus
}

/**
 * Day Data Interface
 */
export interface DayData {
  date: Date;
  eventCount: number;
  events?: any[];
  isToday: boolean;
  isWeekend: boolean;
  month: string;
  heat?: number; // 0-1 for heat map intensity
}

/**
 * Timeline Props
 */
export interface TimelineContainerProps {
  className?: string;
  config?: TimelineConfig;
  events?: any[];
  onDayClick?: (date: Date) => void;
  onDayHover?: (date: Date | null) => void;
  onZoomChange?: (level: ZoomLevel) => void;
  currentDate?: Date;
}

/**
 * Get zoom level configuration
 */
const getZoomConfig = (level: ZoomLevel) => {
  switch (level) {
    case ZoomLevel.YEAR:
      return { dayWidth: 4, showDetails: false, showHeatMap: true };
    case ZoomLevel.QUARTER:
      return { dayWidth: 12, showDetails: false, showHeatMap: true };
    case ZoomLevel.MONTH:
      return { dayWidth: 36, showDetails: true, showHeatMap: false };
    case ZoomLevel.WEEK:
      return { dayWidth: 120, showDetails: true, showHeatMap: false };
    case ZoomLevel.DAY:
      return { dayWidth: 300, showDetails: true, showHeatMap: false };
    default:
      return { dayWidth: 36, showDetails: true, showHeatMap: false };
  }
};

/**
 * Timeline Container Component
 */
export const TimelineContainer: React.FC<TimelineContainerProps> = ({
  className,
  config = {},
  events = [],
  onDayClick,
  onDayHover,
  onZoomChange,
  currentDate = new Date()
}) => {
  // Configuration with defaults
  const {
    startDate = startOfYear(currentDate),
    endDate = addDays(startDate, 364),
    initialZoomLevel = ZoomLevel.MONTH,
    enableGestures = true,
    enableKeyboardNavigation = true,
    showHeatMap = true,
    glassmorphic = false, // Disabled by default for better performance
    monthRowHeight = 120,
    minDayWidth = 4,
    maxDayWidth = 300
  } = config;

  // State
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(initialZoomLevel);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate zoom configuration
  const zoomConfig = useMemo(() => getZoomConfig(zoomLevel), [zoomLevel]);
  const dayColumnWidth = Math.max(minDayWidth, Math.min(maxDayWidth, zoomConfig.dayWidth));

  // Calculate days data
  const daysData = useMemo<DayData[]>(() => {
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const days: DayData[] = [];

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      const dayEvents = events.filter(event => 
        isSameDay(new Date(event.date || event.startTime), date)
      );

      days.push({
        date,
        eventCount: dayEvents.length,
        events: dayEvents,
        isToday: isToday(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        month: format(date, 'MMM'),
        heat: dayEvents.length / 10 // Normalize to 0-1 range
      });
    }

    return days;
  }, [startDate, endDate, events]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    horizontal: true,
    count: daysData.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback(() => dayColumnWidth, [dayColumnWidth]),
    overscan: 10,
  });

  // Handle zoom changes
  const handleZoomChange = useCallback((newLevel: ZoomLevel) => {
    setZoomLevel(newLevel);
    onZoomChange?.(newLevel);
  }, [onZoomChange]);

  // Zoom with keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    const zoomLevels = Object.values(ZoomLevel);
    const currentIndex = zoomLevels.indexOf(zoomLevel);

    switch (e.key) {
      case '+':
      case '=':
        if (currentIndex > 0) {
          handleZoomChange(zoomLevels[currentIndex - 1]);
        }
        break;
      case '-':
      case '_':
        if (currentIndex < zoomLevels.length - 1) {
          handleZoomChange(zoomLevels[currentIndex + 1]);
        }
        break;
      case 'ArrowLeft':
        scrollRef.current?.scrollBy({ left: -dayColumnWidth * 7, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        scrollRef.current?.scrollBy({ left: dayColumnWidth * 7, behavior: 'smooth' });
        break;
      case 'Home':
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        scrollRef.current?.scrollTo({ 
          left: scrollRef.current.scrollWidth, 
          behavior: 'smooth' 
        });
        break;
    }
  }, [enableKeyboardNavigation, zoomLevel, handleZoomChange, dayColumnWidth]);

  // Setup keyboard listeners
  useEffect(() => {
    if (enableKeyboardNavigation) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enableKeyboardNavigation]);

  // Gesture controls for pinch-to-zoom
  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      if (!enableGestures) return;
      
      const zoomLevels = Object.values(ZoomLevel);
      const currentIndex = zoomLevels.indexOf(zoomLevel);
      
      if (scale > 1.2 && currentIndex > 0) {
        handleZoomChange(zoomLevels[currentIndex - 1]);
      } else if (scale < 0.8 && currentIndex < zoomLevels.length - 1) {
        handleZoomChange(zoomLevels[currentIndex + 1]);
      }
    },
    onWheel: ({ event, delta: [, dy] }) => {
      if (!enableGestures || !event.ctrlKey) return;
      event.preventDefault();
      
      const zoomLevels = Object.values(ZoomLevel);
      const currentIndex = zoomLevels.indexOf(zoomLevel);
      
      if (dy < 0 && currentIndex > 0) {
        handleZoomChange(zoomLevels[currentIndex - 1]);
      } else if (dy > 0 && currentIndex < zoomLevels.length - 1) {
        handleZoomChange(zoomLevels[currentIndex + 1]);
      }
    }
  }, {
    pinch: { scaleBounds: { min: 0.5, max: 2 } },
    wheel: { preventScroll: true }
  });

  // Calculate heat map color
  const getHeatColor = (heat: number) => {
    const intensity = Math.min(1, Math.max(0, heat));
    const hue = 240 - (intensity * 60); // Blue to red
    const saturation = 50 + (intensity * 50);
    const lightness = 95 - (intensity * 35);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Render day column
  const renderDayColumn = (day: DayData, index: number) => {
    const isCurrentMonth = isSameMonth(day.date, currentDate);
    const showDetails = zoomConfig.showDetails;
    const showHeat = zoomConfig.showHeatMap && showHeatMap;

    return (
      <div
        key={index}
        className={cn(
          'relative flex flex-col items-center justify-start transition-all duration-200',
          'border-r border-border',
          'hover:bg-accent/50 cursor-pointer transition-colors',
          'hover:shadow-lg',
          day.isToday && [
            'bg-blue-500/20',
            'border-blue-500/30',
            'shadow-lg'
          ],
          day.isWeekend && 'bg-muted/10',
          !isCurrentMonth && 'opacity-40'
        )}
        style={{
          width: `${dayColumnWidth}px`,
          minWidth: `${dayColumnWidth}px`,
          backgroundColor: showHeat ? getHeatColor(day.heat || 0) : undefined,
          backdropFilter: glassmorphic ? 'blur(2px)' : undefined // Reduced blur for performance
        }}
        onClick={() => onDayClick?.(day.date)}
        onMouseEnter={() => {
          setHoveredDate(day.date);
          onDayHover?.(day.date);
        }}
        onMouseLeave={() => {
          setHoveredDate(null);
          onDayHover?.(null);
        }}
      >
        {/* Day number */}
        <div className={cn(
          'font-medium p-1',
          day.isToday && [
            'text-blue-600 dark:text-blue-400',
            'font-bold',
            'text-shadow-sm'
          ],
          showDetails ? 'text-sm' : 'text-[10px]',
          'text-foreground'
        )}>
          {showDetails ? format(day.date, 'd') : ''}
        </div>

        {/* Event indicator or details */}
        {showDetails && day.eventCount > 0 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              'shadow-sm',
              'bg-blue-500',
              day.eventCount > 3 && 'bg-orange-500',
              day.eventCount > 5 && 'bg-red-500'
            )} />
          </div>
        )}

        {/* Event count badge */}
        {showDetails && day.eventCount > 0 && dayColumnWidth >= 36 && (
          <div className={cn(
            'absolute top-6 right-1 text-[10px] px-1 rounded-md',
            'bg-blue-500/20',
            'border border-blue-500/30',
            'text-blue-500 font-semibold'
          )}>
            {day.eventCount}
          </div>
        )}
      </div>
    );
  };

  // Group days by month
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: DayData[] }[] = [];
    let currentMonth = '';
    let currentGroup: DayData[] = [];

    daysData.forEach(day => {
      const monthKey = format(day.date, 'yyyy-MM');
      if (monthKey !== currentMonth) {
        if (currentGroup.length > 0) {
          groups.push({ 
            month: format(currentGroup[0].date, 'MMMM yyyy'), 
            days: currentGroup 
          });
        }
        currentMonth = monthKey;
        currentGroup = [day];
      } else {
        currentGroup.push(day);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ 
        month: format(currentGroup[0].date, 'MMMM yyyy'), 
        days: currentGroup 
      });
    }

    return groups;
  }, [daysData]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl',
        glassmorphic && [
          'backdrop-blur-sm', // Reduced blur for performance
          'bg-gradient-to-br from-muted/20 to-muted/5',
          'border border-border',
          'shadow-lg',
          'before:absolute before:inset-0 before:rounded-2xl',
          'before:bg-gradient-to-br before:from-muted/10 before:to-transparent',
          'before:pointer-events-none'
        ],
        className
      )}
      {...bind()}
    >
      {/* Zoom controls - positioned as fixed bottom-right to avoid any overlap */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1.5 shadow-lg">
        <button
          onClick={() => {
            const zoomLevels = Object.values(ZoomLevel);
            const currentIndex = zoomLevels.indexOf(zoomLevel);
            if (currentIndex > 0) {
              handleZoomChange(zoomLevels[currentIndex - 1]);
            }
          }}
          className={cn(
            'h-8 w-8 p-0 rounded transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            'active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          disabled={zoomLevel === ZoomLevel.YEAR}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <div className="text-xs text-center py-1 font-medium text-muted-foreground">
          {Math.round(getZoomConfig(zoomLevel).dayWidth / 36 * 100)}%
        </div>
        <button
          onClick={() => {
            const zoomLevels = Object.values(ZoomLevel);
            const currentIndex = zoomLevels.indexOf(zoomLevel);
            if (currentIndex < zoomLevels.length - 1) {
              handleZoomChange(zoomLevels[currentIndex + 1]);
            }
          }}
          className={cn(
            'h-8 w-8 p-0 rounded transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            'active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          disabled={zoomLevel === ZoomLevel.DAY}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Month labels */}
      <div className={cn(
        'sticky top-0 z-10 border-b',
        glassmorphic && [
          'bg-gradient-to-r from-muted/15 via-muted/10 to-muted/15',
          'backdrop-blur-sm', // Reduced blur for performance
          'border-white/30',
          'shadow-[0_2px_12px_0_rgba(31,38,135,0.15)]'
        ]
      )}>
        <div className="flex h-10">
          {monthGroups.map((group, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-shrink-0 px-2 flex items-center justify-center',
                'text-xs font-semibold tracking-wider',
                'text-gray-700 dark:text-gray-300',
                'border-r border-white/10'
              )}
              style={{ width: `${group.days.length * dayColumnWidth}px` }}
            >
              {group.month}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-x-auto overflow-y-hidden',
          'scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent',
          glassmorphic && 'scrollbar-thumb-muted/30'
        )}
        style={{ height: `${monthRowHeight}px` }}
      >
        <div
          style={{
            width: `${virtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map(virtualItem => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${virtualItem.size}px`,
                height: '100%',
                transform: `translateX(${virtualItem.start}px)`
              }}
            >
              {renderDayColumn(daysData[virtualItem.index], virtualItem.index)}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDate && zoomConfig.showDetails && (
        <div className={cn(
          'absolute bottom-4 left-4 z-20 p-3 rounded-xl',
          'bg-card/90',
          'backdrop-blur-sm', // Reduced blur for performance
          'border border-border',
          'shadow-lg',
          'text-foreground text-sm font-medium'
        )}>
          {format(hoveredDate, 'EEEE, MMMM d, yyyy')}
        </div>
      )}
    </div>
  );
};