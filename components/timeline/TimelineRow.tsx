'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TimelineDay } from './TimelineDay';

interface TimelineRowProps {
  year: number;
  month: number;
  monthName: string;
  dayWidth: number;
  events: any[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  zoomLevel: number;
}

export function TimelineRow({
  year,
  month,
  monthName,
  dayWidth,
  events,
  onDateClick,
  onEventClick,
  zoomLevel
}: TimelineRowProps) {
  // Generate days for the month
  const days = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dayOfWeek = (firstDay + i) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = 
        date.toDateString() === new Date().toDateString();
      
      // Get events for this day
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.startTime);
        return eventDate.getDate() === day;
      });
      
      return {
        day,
        date,
        dayOfWeek,
        isWeekend,
        isToday,
        events: dayEvents
      };
    });
  }, [year, month, events]);

  // Calculate heat map intensity
  const getHeatMapColor = (eventCount: number) => {
    if (eventCount === 0) return 'transparent';
    const intensity = Math.min(eventCount / 5, 1); // Max intensity at 5 events
    return `rgba(139, 92, 246, ${intensity * 0.3})`; // Purple with varying opacity
  };

  return (
    <div 
      className="flex border-b border-glass-border/10 relative group"
      style={{ height: zoomLevel > 50 ? '80px' : '40px' }}
    >
      {/* Month Label (appears on hover) */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-oklch-gray-500 pointer-events-none">
        {monthName.slice(0, 3)}
      </div>
      
      {/* Days */}
      {days.map(({ day, date, isWeekend, isToday, events }) => (
        <TimelineDay
          key={day}
          date={date}
          day={day}
          width={dayWidth}
          isWeekend={isWeekend}
          isToday={isToday}
          eventCount={events.length}
          events={events}
          heatMapColor={getHeatMapColor(events.length)}
          zoomLevel={zoomLevel}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}