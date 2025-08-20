'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TimelineRow } from './TimelineRow';
import { TimelineControls } from './TimelineControls';
import { TimelineMiniMap } from './TimelineMiniMap';
import { useTimelineStore } from '@/stores/timelineStore';

interface TimelineContainerProps {
  year?: number;
  events?: any[];
  className?: string;
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function TimelineContainer({
  year = new Date().getFullYear(),
  events = [],
  className,
  onDateClick,
  onEventClick
}: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { 
    zoomLevel, 
    scrollPosition, 
    setScrollPosition,
    setZoomLevel 
  } = useTimelineStore();

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const progress = scrollLeft / (scrollWidth - clientWidth);
    setScrollPosition({ x: scrollLeft, y: 0 });
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set scrolling to false after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [setScrollPosition]);

  // Calculate day width based on zoom level
  const getDayWidth = useCallback(() => {
    // Zoom level 1-100 maps to day widths from 1px to 100px
    return Math.max(1, Math.floor(zoomLevel));
  }, [zoomLevel]);

  // Scroll to specific date
  const scrollToDate = useCallback((date: Date) => {
    if (!scrollContainerRef.current) return;
    
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const scrollPosition = dayOfYear * getDayWidth();
    
    scrollContainerRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }, [year, getDayWidth]);

  // Scroll to today on mount
  useEffect(() => {
    const today = new Date();
    if (today.getFullYear() === year) {
      scrollToDate(today);
    }
  }, [year, scrollToDate]);

  return (
    <div className={cn('relative h-full flex flex-col', className)}>
      {/* Controls */}
      <TimelineControls
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onTodayClick={() => scrollToDate(new Date())}
        year={year}
      />
      
      {/* Main Timeline */}
      <div className="flex-1 relative">
        <div 
          ref={scrollContainerRef}
          className={cn(
            'h-full overflow-x-auto overflow-y-hidden',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-glass-border/30',
            isScrolling && 'scrolling'
          )}
          onScroll={handleScroll}
        >
          {/* Timeline Content */}
          <div className="relative">
            {/* Month Headers */}
            <div className="sticky top-0 z-10 glass-heavy border-b border-glass-border/20">
              <div className="flex h-10">
                {MONTHS.map((month, index) => {
                  const daysInMonth = new Date(year, index + 1, 0).getDate();
                  const monthWidth = daysInMonth * getDayWidth();
                  
                  return (
                    <div
                      key={month}
                      className="flex items-center justify-center border-r border-glass-border/10 text-sm font-medium text-oklch-gray-300"
                      style={{ width: `${monthWidth}px`, minWidth: `${monthWidth}px` }}
                    >
                      {monthWidth > 60 ? month : month.slice(0, 3)}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Month Rows */}
            <div className="relative">
              {MONTHS.map((month, monthIndex) => (
                <TimelineRow
                  key={`${year}-${monthIndex}`}
                  year={year}
                  month={monthIndex}
                  monthName={month}
                  dayWidth={getDayWidth()}
                  events={events.filter(e => {
                    const eventDate = new Date(e.startTime);
                    return eventDate.getMonth() === monthIndex && 
                           eventDate.getFullYear() === year;
                  })}
                  onDateClick={onDateClick}
                  onEventClick={onEventClick}
                  zoomLevel={zoomLevel}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicators */}
        {isScrolling && (
          <div className="absolute top-2 right-2 glass rounded-glass px-3 py-1 text-xs">
            Scrolling...
          </div>
        )}
      </div>
      
      {/* Mini Map */}
      <TimelineMiniMap
        year={year}
        events={events}
        scrollPosition={scrollPosition.x}
        containerWidth={scrollContainerRef.current?.clientWidth || 0}
        totalWidth={365 * getDayWidth()}
        onNavigate={(position) => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              left: position,
              behavior: 'smooth'
            });
          }
        }}
      />
    </div>
  );
}