/**
 * FullCalendar Pro Integration View
 *
 * Professional calendar component using FullCalendar library with drag & drop,
 * multiple views, and enterprise features for CheatCal platform.
 *
 * Features:
 * - Multiple view types (month, week, day, list)
 * - Drag & drop event creation and editing
 * - External event dragging
 * - Real-time sync with calendar providers
 * - Professional styling with shadcn/ui integration
 *
 * @version 2.0.0 (CheatCal Integration)
 */

'use client';

import type {
  DateSelectArg,
  EventApi,
  EventClickArg,
  EventDropArg,
  EventResizeArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useRef, useEffect, useCallback, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';

interface FullCalendarViewProps {
  events: Event[];
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (event: Partial<Event>) => void;
  onEventDelete?: (eventId: string) => void;
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  className?: string;
  height?: string | number;
  editable?: boolean;
  selectable?: boolean;
  droppable?: boolean;
}

export default function FullCalendarView({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  initialView = 'dayGridMonth',
  className,
  height = '100%',
  editable = true,
  selectable = true,
  droppable = true,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Convert our events to FullCalendar format
  const fullCalendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.category ? getCategoryColor(event.category) : undefined,
    borderColor: event.category ? getCategoryColor(event.category) : undefined,
    extendedProps: {
      description: event.description,
      location: event.location,
      attendees: event.attendees,
      priority: event.priority,
      category: event.category,
    },
  }));

  // Category color mapping (using semantic tokens)
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: 'hsl(var(--primary))',
      personal: 'hsl(var(--chart-1))',
      meeting: 'hsl(var(--chart-2))',
      deadline: 'hsl(var(--destructive))',
      travel: 'hsl(var(--chart-3))',
      health: 'hsl(var(--chart-4))',
      social: 'hsl(var(--chart-5))',
    };
    return colors[category] || 'hsl(var(--muted))';
  };

  // Handle date selection for event creation
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (onEventCreate) {
        const title = prompt('Enter event title:');
        if (title) {
          onEventCreate({
            title,
            start: selectInfo.start,
            end: selectInfo.end,
            allDay: selectInfo.allDay,
          });
        }
      }
      selectInfo.view.calendar.unselect();
    },
    [onEventCreate]
  );

  // Handle event click
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = clickInfo.event;
      const shouldDelete = confirm(`Delete event "${event.title}"?`);

      if (shouldDelete && onEventDelete) {
        onEventDelete(event.id);
        event.remove();
      }
    },
    [onEventDelete]
  );

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      if (onEventUpdate) {
        const event = dropInfo.event;
        onEventUpdate({
          id: event.id,
          title: event.title,
          start: event.start!,
          end: event.end,
          allDay: event.allDay,
        });
      }
    },
    [onEventUpdate]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    (resizeInfo: EventResizeArg) => {
      if (onEventUpdate) {
        const event = resizeInfo.event;
        onEventUpdate({
          id: event.id,
          title: event.title,
          start: event.start!,
          end: event.end,
          allDay: event.allDay,
        });
      }
    },
    [onEventUpdate]
  );

  // Handle external event drop
  const handleExternalDrop = useCallback(
    (dropInfo: any) => {
      if (onEventCreate && dropInfo.draggedEl) {
        const title = dropInfo.draggedEl.getAttribute('data-event-title') || 'New Event';
        onEventCreate({
          title,
          start: dropInfo.date,
          allDay: dropInfo.allDay,
        });
      }
    },
    [onEventCreate]
  );

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading FullCalendar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardContent className="h-full p-0">
        <div className="h-full w-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            initialView={initialView}
            height={height}
            editable={editable}
            selectable={selectable}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            droppable={droppable}
            navLinks={true}
            nowIndicator={true}
            events={fullCalendarEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            drop={handleExternalDrop}
            eventContent={(arg) => (
              <div className="fc-event-content">
                <div className="fc-event-title text-sm font-medium">{arg.event.title}</div>
                {arg.event.extendedProps.priority === 'high' && (
                  <Badge variant="destructive" className="fc-event-badge text-xs ml-1">
                    High
                  </Badge>
                )}
              </div>
            )}
            dayCellContent={(arg) => (
              <div className="fc-daygrid-day-number text-foreground">{arg.dayNumberText}</div>
            )}
            // Custom styling integration with shadcn/ui
            themeSystem="standard"
            // Additional FullCalendar options for professional features
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
              startTime: '08:00',
              endTime: '18:00',
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            expandRows={true}
            handleWindowResize={true}
            aspectRatio={1.8}
            contentHeight="auto"
            eventDisplay="block"
            eventBackgroundColor="hsl(var(--primary))"
            eventBorderColor="hsl(var(--primary))"
            eventTextColor="hsl(var(--primary-foreground))"
            // Accessibility
            eventClassNames="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
