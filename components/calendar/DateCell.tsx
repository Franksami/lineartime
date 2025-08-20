'use client';

import { memo } from 'react';
import { CalendarDay } from '@/types';
import { cn } from '@/lib/utils';

interface DateCellProps {
  day: CalendarDay;
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export const DateCell = memo<DateCellProps>(({ 
  day, 
  onDateClick, 
  onEventClick, 
  className 
}) => {
  const handleDateClick = () => {
    onDateClick?.(day.date);
  };

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(eventId);
  };

  return (
    <div
      className={cn(
        'group relative h-20 w-14 cursor-pointer transition-all duration-200',
        'border-r border-glass-border/10 hover:bg-glass-surface/20',
        'focus:outline-none focus:ring-2 focus:ring-glass-accent/50 focus:ring-offset-1',
        day.isToday && 'bg-glass-accent/10 border-glass-accent/30',
        day.isSelected && 'bg-glass-primary/20 border-glass-primary/40',
        !day.isCurrentMonth && 'opacity-30',
        className
      )}
      onClick={handleDateClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDateClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${day.date.toLocaleDateString()} - ${day.events.length} events`}
      aria-pressed={day.isSelected}
      aria-current={day.isToday ? 'date' : undefined}
    >
      {/* Date number */}
      <div className={cn(
        'absolute top-1 left-1 text-xs font-medium transition-colors',
        day.isToday ? 'text-glass-accent font-bold' : 'text-oklch-gray-700',
        !day.isCurrentMonth && 'text-oklch-gray-500'
      )}>
        {day.date.getDate()}
      </div>

      {/* Event indicators */}
      <div className="absolute inset-x-1 bottom-1 top-6 overflow-hidden">
        {day.events.slice(0, 4).map((event, index) => (
          <div
            key={event.id}
            className={cn(
              'mb-0.5 h-1.5 rounded-sm cursor-pointer transition-all duration-150',
              'hover:h-2 hover:shadow-sm',
              index >= 3 && 'opacity-60'
            )}
            style={{
              backgroundColor: event.color || 'oklch(75% 0.15 320)',
              width: event.allDay ? '100%' : '80%',
            }}
            onClick={(e) => handleEventClick(event.id, e)}
            title={event.title}
          />
        ))}
        
        {/* More events indicator */}
        {day.events.length > 4 && (
          <div className="text-[10px] text-oklch-gray-600 font-medium">
            +{day.events.length - 4} more
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className={cn(
        'absolute inset-0 glass-light rounded-sm opacity-0 transition-opacity duration-200',
        'group-hover:opacity-100 pointer-events-none'
      )} />
    </div>
  );
});

DateCell.displayName = 'DateCell';