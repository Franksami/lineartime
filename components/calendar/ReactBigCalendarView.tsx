'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarViewProps, CalendarEvent } from './providers/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface ReactBigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  color?: string;
  priority?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

interface ReactBigCalendarViewProps extends CalendarViewProps {
  defaultView?: View;
  showToolbar?: boolean;
  enableDragDrop?: boolean;
  height?: number;
}

const ReactBigCalendarView: React.FC<ReactBigCalendarViewProps> = ({
  events = [],
  selectedDate,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateChange,
  theme = 'light',
  loading = false,
  className,
  defaultView = Views.MONTH,
  showToolbar = true,
  enableDragDrop = true,
  height = 600,
}) => {
  const [currentView, setCurrentView] = useState<View>(defaultView);
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Transform events for react-big-calendar
  const calendarEvents: ReactBigCalendarEvent[] = useMemo(() => {
    return events.map((event: CalendarEvent) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay || false,
      resource: {
        id: event.id,
        priority: event.priority,
        description: event.description,
        location: event.location,
        attendees: event.attendees,
        category: event.category,
      },
      color: event.backgroundColor || getPriorityColor(event.priority),
      priority: event.priority,
      description: event.description,
      location: event.location,
      attendees: event.attendees,
    }));
  }, [events]);

  function getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6366f1';
    }
  }

  // Event handlers
  const handleSelectSlot = useCallback(async ({ start, end, action }: { start: Date; end: Date; action: string }) => {
    if (action === 'select') {
      try {
        await onEventCreate({
          title: 'New Event',
          start,
          end,
          allDay: end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000,
        });
      } catch (error) {
        console.error('Failed to create event:', error);
      }
    }
  }, [onEventCreate]);

  const handleSelectEvent = useCallback((event: ReactBigCalendarEvent) => {
    // Handle event selection - could open a modal or sidebar for editing
    console.log('Selected event:', event);
  }, []);

  const handleEventDrop = useCallback(async ({ event, start, end }: { event: ReactBigCalendarEvent; start: Date; end: Date }) => {
    if (!enableDragDrop) return;
    
    try {
      await onEventUpdate(event.id, {
        start,
        end,
      });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  }, [enableDragDrop, onEventUpdate]);

  const handleEventResize = useCallback(async ({ event, start, end }: { event: ReactBigCalendarEvent; start: Date; end: Date }) => {
    if (!enableDragDrop) return;
    
    try {
      await onEventUpdate(event.id, {
        start,
        end,
      });
    } catch (error) {
      console.error('Failed to resize event:', error);
    }
  }, [enableDragDrop, onEventUpdate]);

  // Navigation handlers
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
    onDateChange(date);
  }, [onDateChange]);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: ReactBigCalendarEvent }) => (
    <div className="rbc-event-content">
      <div className="flex items-center gap-1 text-xs">
        {event.priority && (
          <Badge 
            variant="secondary" 
            className="text-xs px-1 py-0"
            style={{ backgroundColor: event.color, color: 'white' }}
          >
            {event.priority}
          </Badge>
        )}
        <span className="truncate">{event.title}</span>
      </div>
      {event.location && (
        <div className="flex items-center gap-1 text-xs opacity-75">
          <MapPin size={10} />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  );

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView, views }: any) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
          disabled={loading}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
          disabled={loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-4">{label}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={currentView} onValueChange={onView}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Views.MONTH}>Month</SelectItem>
            <SelectItem value={Views.WEEK}>Week</SelectItem>
            <SelectItem value={Views.DAY}>Day</SelectItem>
            <SelectItem value={Views.AGENDA}>Agenda</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => handleSelectSlot({ 
            start: currentDate, 
            end: new Date(currentDate.getTime() + 60 * 60 * 1000),
            action: 'select'
          })}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </div>
    </div>
  );

  // Event style getter
  const eventStyleGetter = useCallback((event: ReactBigCalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
      }
    };
  }, []);

  // Slot style getter for theming
  const slotStyleGetter = useCallback((date: Date) => {
    const today = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;
    
    return {
      style: {
        backgroundColor: isToday 
          ? theme === 'dark' ? '#1f2937' : '#f3f4f6'
          : isWeekend 
            ? theme === 'dark' ? '#111827' : '#fafafa'
            : theme === 'dark' ? '#0f172a' : '#ffffff',
      }
    };
  }, [theme]);

  const calendarStyle = useMemo(() => ({
    height,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...(theme === 'dark' && {
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
    }),
  }), [height, theme]);

  return (
    <div className={cn('react-big-calendar-view', className)}>
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading events...</span>
          </div>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={calendarStyle}
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={enableDragDrop ? handleEventDrop : undefined}
        onEventResize={enableDragDrop ? handleEventResize : undefined}
        selectable
        resizable={enableDragDrop}
        dragAndDropAccessor={{ draggable: enableDragDrop }}
        components={{
          toolbar: showToolbar ? CustomToolbar : () => null,
          event: EventComponent,
        }}
        eventPropGetter={eventStyleGetter}
        slotPropGetter={slotStyleGetter}
        formats={{
          dayFormat: 'dd',
          dayHeaderFormat: 'eeee MMM dd',
          dayRangeHeaderFormat: ({ start, end }) => 
            `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`,
          monthHeaderFormat: 'MMMM yyyy',
          weekdayFormat: 'eee',
          timeGutterFormat: 'HH:mm',
          eventTimeRangeFormat: ({ start, end }) => 
            `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
        }}
        messages={{
          allDay: 'All Day',
          previous: 'Previous',
          next: 'Next',
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Time',
          event: 'Event',
          noEventsInRange: 'No events in this date range.',
          showMore: (total: number) => `+${total} more`,
        }}
        popup
        popupOffset={30}
        className={cn(
          'rbc-calendar',
          theme === 'dark' && 'rbc-calendar-dark',
          'border border-border rounded-lg'
        )}
      />
    </div>
  );
};

export default ReactBigCalendarView;