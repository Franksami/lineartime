'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { YearViewData, CalendarDay, MonthData, NavigatorData, CalendarViewport, TimelineEvent } from '@/types';
import { DateCell } from './DateCell';
import { ActivityHeatmap } from './ActivityHeatmap';
import { Navigator } from './Navigator';
import { cn } from '@/lib/utils';

interface LinearCalendarViewProps {
  year?: number;
  events?: TimelineEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  selectedDate?: Date;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function LinearCalendarView({
  year = new Date().getFullYear(),
  events = [],
  onDateClick,
  onEventClick,
  selectedDate,
  className
}: LinearCalendarViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewport, setViewport] = useState<CalendarViewport>({
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 11, 31),
    visibleMonths: [],
    scrollProgress: 0
  });

  // Generate year data with events distribution
  const yearData = useMemo<YearViewData>(() => {
    const months: MonthData[] = [];
    let totalEvents = 0;
    let maxEventsPerDay = 0;

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const days: CalendarDay[] = [];
      let monthTotalEvents = 0;

      for (let day = 1; day <= 31; day++) {
        const date = new Date(year, monthIndex, day);
        const isValidDay = day <= daysInMonth;
        
        if (isValidDay) {
          // Filter events for this specific day
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startTime);
            return (
              eventDate.getFullYear() === year &&
              eventDate.getMonth() === monthIndex &&
              eventDate.getDate() === day
            );
          });

          const eventCount = dayEvents.length;
          maxEventsPerDay = Math.max(maxEventsPerDay, eventCount);
          monthTotalEvents += eventCount;
          totalEvents += eventCount;

          days.push({
            date,
            isToday: isToday(date),
            isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
            isCurrentMonth: true,
            events: dayEvents,
            eventDensity: eventCount
          });
        } else {
          // Add placeholder for non-existent days to maintain grid structure
          days.push({
            date: new Date(year, monthIndex, day),
            isToday: false,
            isSelected: false,
            isCurrentMonth: false,
            events: [],
            eventDensity: 0
          });
        }
      }

      months.push({
        month: monthIndex,
        year,
        name: MONTH_NAMES[monthIndex],
        abbreviation: MONTH_ABBREVIATIONS[monthIndex],
        days,
        totalEvents: monthTotalEvents
      });
    }

    // Normalize event densities based on max events per day
    if (maxEventsPerDay > 0) {
      months.forEach(month => {
        month.days.forEach(day => {
          day.eventDensity = day.eventDensity / maxEventsPerDay;
        });
      });
    }

    return {
      year,
      months,
      totalEvents,
      maxEventsPerDay
    };
  }, [year, events, selectedDate]);

  // Generate navigator data
  const navigatorData = useMemo<NavigatorData>(() => {
    const monthSummaries = yearData.months.map(month => ({
      month: month.month,
      eventCount: month.totalEvents,
      density: month.totalEvents / Math.max(yearData.maxEventsPerDay * new Date(year, month.month + 1, 0).getDate(), 1)
    }));

    return {
      year,
      monthSummaries,
      currentViewport: viewport
    };
  }, [yearData, viewport, year]);

  // Handle scroll updates
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    setScrollPosition(scrollLeft);
    setViewport(prev => ({
      ...prev,
      scrollProgress: progress
    }));
  }, []);

  // Handle navigator viewport change
  const handleViewportChange = useCallback((position: number) => {
    if (!scrollContainerRef.current) return;
    
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const targetScroll = position * maxScroll;
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  // Scroll to today on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const today = new Date();
    if (today.getFullYear() === year) {
      const monthProgress = today.getMonth() / 12;
      const dayProgress = today.getDate() / 31;
      const totalProgress = (monthProgress + dayProgress / 12) * 0.8; // Don't scroll to the very end
      
      setTimeout(() => handleViewportChange(totalProgress), 100);
    }
  }, [year, handleViewportChange]);

  return (
    <div 
      className={cn('flex flex-col h-full', className)}
      role="application"
      aria-label={`Linear calendar view for ${year}`}
    >
      {/* Timeline header */}
      <div className="glass rounded-glass p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-glass-accent to-glass-secondary bg-clip-text text-transparent">
              {year} Linear Timeline
            </h2>
            <p className="text-sm text-oklch-gray-600 mt-1">
              {yearData.totalEvents.toLocaleString()} events • {yearData.months.length} months
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-sm text-oklch-gray-600">Scroll horizontally to navigate</div>
            <div className="text-xs text-oklch-gray-500 mt-1 hidden sm:block">Click dates to select • Click event bars for details</div>
          </div>
        </div>
      </div>

      {/* Main timeline container */}
      <div className="flex-1 glass-heavy rounded-glass p-4 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-auto overflow-y-hidden no-scrollbar"
          onScroll={handleScroll}
          role="grid"
          aria-label={`Calendar grid for ${year}`}
          tabIndex={0}
        >
          <div className="flex flex-col gap-4" style={{ width: '3100px' }}> {/* 100px per month approx */}
            {yearData.months.map((month) => (
              <div key={month.month} className="flex items-start gap-3">
                {/* Month label */}
                <div className="w-24 flex-shrink-0 py-2 sticky left-0 z-10">
                  <div className="glass-light rounded-glass p-3 text-center">
                    <div className="font-semibold text-sm text-oklch-gray-800">
                      {month.abbreviation}
                    </div>
                    <div className="text-xs text-oklch-gray-600 mt-1">
                      {month.totalEvents} events
                    </div>
                  </div>
                </div>

                {/* Month content */}
                <div className="flex-1 min-w-0">
                  {/* Activity heatmap */}
                  <ActivityHeatmap 
                    month={month} 
                    maxDensity={1}
                    className="mb-2"
                  />
                  
                  {/* Date grid */}
                  <div className="flex gap-px glass-light rounded-glass p-1">
                    {month.days.map((day, index) => (
                      <DateCell
                        key={`${day.date.getTime()}-${index}`}
                        day={day}
                        onDateClick={onDateClick}
                        onEventClick={onEventClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigator */}
      <div className="mt-4">
        <Navigator
          data={navigatorData}
          onViewportChange={handleViewportChange}
        />
      </div>
    </div>
  );
}

// Helper functions
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}