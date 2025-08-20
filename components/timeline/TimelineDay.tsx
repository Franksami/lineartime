'use client';

import { cn } from '@/lib/utils';

interface TimelineDayProps {
  date: Date;
  day: number;
  width: number;
  isWeekend: boolean;
  isToday: boolean;
  eventCount: number;
  events: any[];
  heatMapColor: string;
  zoomLevel: number;
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
}

export function TimelineDay({
  date,
  day,
  width,
  isWeekend,
  isToday,
  eventCount,
  events,
  heatMapColor,
  zoomLevel,
  onDateClick,
  onEventClick
}: TimelineDayProps) {
  const showDayNumber = width > 15;
  const showEventDetails = zoomLevel > 60;
  const showEventTitles = zoomLevel > 40;

  return (
    <div
      className={cn(
        'relative border-r border-glass-border/5 cursor-pointer transition-all',
        'hover:bg-glass-accent/5',
        isWeekend && 'bg-glass-secondary/5',
        isToday && 'ring-2 ring-glass-accent ring-inset'
      )}
      style={{ 
        width: `${width}px`, 
        minWidth: `${width}px`,
        backgroundColor: heatMapColor || undefined
      }}
      onClick={() => onDateClick?.(date)}
      title={`${date.toLocaleDateString()} - ${eventCount} events`}
    >
      {/* Day Number */}
      {showDayNumber && (
        <div className={cn(
          'absolute top-1 left-1 text-xs',
          isToday ? 'text-glass-accent font-bold' : 'text-oklch-gray-500'
        )}>
          {day}
        </div>
      )}
      
      {/* Event Indicators */}
      {eventCount > 0 && (
        <>
          {/* Simple dot for zoomed out view */}
          {!showEventTitles && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
              <div className={cn(
                'w-1 h-1 rounded-full',
                eventCount === 1 && 'bg-glass-primary',
                eventCount === 2 && 'bg-glass-accent',
                eventCount >= 3 && 'bg-glass-secondary'
              )} />
            </div>
          )}
          
          {/* Event titles for medium zoom */}
          {showEventTitles && !showEventDetails && (
            <div className="absolute bottom-1 left-1 right-1 text-xs">
              <div className="truncate text-oklch-gray-600">
                {eventCount} event{eventCount !== 1 && 's'}
              </div>
            </div>
          )}
          
          {/* Full event details for high zoom */}
          {showEventDetails && (
            <div className="absolute top-6 left-1 right-1 bottom-1 overflow-hidden">
              {events.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id}
                  className="text-xs truncate hover:text-glass-accent cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event.id);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {events.length > 3 && (
                <div className="text-xs text-oklch-gray-500">
                  +{events.length - 3} more
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}