'use client';

import { notify } from '@/components/ui/notify';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import { cn } from '@/lib/utils';
import { CALENDAR_LAYERS } from '@/lib/z-index';
import type { Event } from '@/types/calendar';
import {
  CalendarOptions,
  type DateSelectArg,
  EventApi,
  type EventClickArg,
  type EventDropArg,
  type EventInput,
  type EventResizeArg,
  type ViewApi,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable, type DropArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { format, isValid, parseISO } from 'date-fns';
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useTransition,
  startTransition,
  useDeferredValue,
} from 'react';
import LinearYearPlugin from './plugins/LinearYearPlugin';

interface LinearCalendarProProps {
  year: number;
  events: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  enableInfiniteCanvas?: boolean;
  view?: 'linearYear' | 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth';

  // Enhanced Pro features
  enableVirtualRendering?: boolean;
  enableCollisionDetection?: boolean;
  enableAdvancedDragDrop?: boolean;
  onViewChange?: (view: string) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;

  // Performance optimization
  maxEvents?: number;
  eventRenderMode?: 'standard' | 'virtual' | 'lazy';
}

export function LinearCalendarPro({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  enableInfiniteCanvas = true,
  view = 'linearYear',
  enableVirtualRendering = true,
  enableCollisionDetection = true,
  enableAdvancedDragDrop = true,
  onViewChange,
  onDateRangeChange,
  maxEvents = 10000,
  eventRenderMode = 'virtual',
}: LinearCalendarProProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Set<string>>(new Set());
  const { startRenderMeasurement, endRenderMeasurement, metrics } = usePerformanceMonitor(
    events.length
  );

  // React 19: Deferred value for expensive computations
  const deferredEvents = useDeferredValue(events);

  // Convert LinearTime events to FullCalendar format with enhanced props
  const fullCalendarEvents: EventInput[] = useMemo(() => {
    const eventsToProcess = enableVirtualRendering ? deferredEvents : events;

    return eventsToProcess.slice(0, maxEvents).map((event, index) => {
      const isOverlapping = overlappingEvents.has(event.id);

      return {
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        allDay: true, // LinearTime events are typically all-day by default
        extendedProps: {
          category: event.category,
          description: event.description,
          originalEvent: event,
          isOverlapping,
          renderIndex: index, // For virtual rendering
        },
        backgroundColor: getCategoryColor(event.category, isOverlapping),
        borderColor: getCategoryColor(event.category, isOverlapping),
        className: cn(
          `event-category-${event.category}`,
          isOverlapping && 'event-overlapping',
          'event-pro-enhanced'
        ),
        // Enhanced drag/resize constraints
        editable: enableAdvancedDragDrop,
        startEditable: enableAdvancedDragDrop,
        durationEditable: enableAdvancedDragDrop,
        overlap: !enableCollisionDetection,
        constraint: enableCollisionDetection ? 'businessHours' : undefined,
      };
    });
  }, [
    events,
    deferredEvents,
    overlappingEvents,
    maxEvents,
    enableVirtualRendering,
    enableCollisionDetection,
    enableAdvancedDragDrop,
  ]);

  // React 19: Enhanced date selection with async transitions
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      const { start, end, view } = selectInfo;

      startTransition(() => {
        // Validate dates
        if (!isValid(start) || !isValid(end)) {
          notify.error('Invalid date selection');
          return;
        }

        // Check for conflicts if collision detection is enabled
        if (enableCollisionDetection) {
          const conflictingEvents = checkDateConflicts(start, end, events);
          if (conflictingEvents.length > 0) {
            notify.warning(`Potential conflict with ${conflictingEvents.length} existing event(s)`);
          }
        }

        // Create event via callback
        if (onEventCreate) {
          const newEvent = {
            title: 'New Event',
            startDate: start,
            endDate: end,
            allDay: true,
            category: 'personal' as const,
            description: `Created in ${view.type} view`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          onEventCreate(newEvent);
        }

        // Show success notification
        notify.success(`Event created on ${format(start, 'MMM d, yyyy')}`);
      });

      // Clear the selection
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.unselect();
      }
    },
    [onEventCreate, enableCollisionDetection, events]
  );

  // React 19: Enhanced event click with performance tracking
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const originalEvent = clickInfo.event.extendedProps.originalEvent as Event;
      const isOverlapping = clickInfo.event.extendedProps.isOverlapping;

      startTransition(() => {
        // Performance measurement
        performance.mark('event-click-start');

        if (onEventClick) {
          onEventClick(originalEvent);
        }

        // Enhanced notification with overlap info
        const message = isOverlapping
          ? `Selected: ${clickInfo.event.title} (has conflicts)`
          : `Selected: ${clickInfo.event.title}`;

        notify.info(message);

        performance.mark('event-click-end');
        performance.measure('event-click', 'event-click-start', 'event-click-end');
      });
    },
    [onEventClick]
  );

  // React 19: Enhanced event drag & drop with collision detection
  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      const { event, oldEvent, delta, revert } = dropInfo;
      const originalEvent = event.extendedProps.originalEvent as Event;

      startTransition(() => {
        // Validate the drop
        if (!event.start) {
          revert();
          notify.error('Invalid drop target');
          return;
        }

        // Check for conflicts if collision detection is enabled
        if (enableCollisionDetection) {
          const newStart = event.start;
          const newEnd = event.end || event.start;
          const conflictingEvents = checkDateConflicts(newStart, newEnd, events, event.id);

          if (conflictingEvents.length > 0) {
            // Update overlapping events tracking
            setOverlappingEvents((prev) => {
              const newSet = new Set(prev);
              newSet.add(event.id);
              conflictingEvents.forEach((e) => newSet.add(e.id));
              return newSet;
            });

            notify.warning(
              `Event moved but conflicts with ${conflictingEvents.length} other event(s)`
            );
          } else {
            // Remove from overlapping if no conflicts
            setOverlappingEvents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(event.id);
              return newSet;
            });
          }
        }

        // Update event with new dates and metadata
        const updatedEvent: Event = {
          ...originalEvent,
          startDate: event.start!,
          endDate: event.end || event.start!,
          updatedAt: new Date(),
          lastModifiedBy: 'drag-drop',
        };

        if (onEventUpdate) {
          onEventUpdate(updatedEvent);
        }

        notify.success(`Moved "${event.title}" to ${format(event.start!, 'MMM d, yyyy')}`);
      });
    },
    [onEventUpdate, enableCollisionDetection, events]
  );

  // React 19: Enhanced event resize with validation
  const handleEventResize = useCallback(
    (resizeInfo: EventResizeArg) => {
      const { event, startDelta, endDelta, revert } = resizeInfo;
      const originalEvent = event.extendedProps.originalEvent as Event;

      startTransition(() => {
        // Validate the resize
        if (!event.end || event.end <= event.start!) {
          revert();
          notify.error('Invalid event duration');
          return;
        }

        // Check for conflicts after resize
        if (enableCollisionDetection) {
          const conflictingEvents = checkDateConflicts(event.start!, event.end, events, event.id);

          if (conflictingEvents.length > 0) {
            setOverlappingEvents((prev) => {
              const newSet = new Set(prev);
              newSet.add(event.id);
              conflictingEvents.forEach((e) => newSet.add(e.id));
              return newSet;
            });

            notify.warning(
              `Event resized but conflicts with ${conflictingEvents.length} other event(s)`
            );
          } else {
            setOverlappingEvents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(event.id);
              return newSet;
            });
          }
        }

        // Update event with new end date and metadata
        const updatedEvent: Event = {
          ...originalEvent,
          startDate: event.start!,
          endDate: event.end,
          updatedAt: new Date(),
          lastModifiedBy: 'resize',
        };

        if (onEventUpdate) {
          onEventUpdate(updatedEvent);
        }

        notify.success(`Resized "${event.title}" to ${format(event.end, 'MMM d, yyyy')}`);
      });
    },
    [onEventUpdate, enableCollisionDetection, events]
  );

  // React 19: Enhanced date click with view awareness
  const handleDateClick = useCallback(
    (dateClickInfo: any) => {
      const { date, view, dayEl } = dateClickInfo;

      startTransition(() => {
        if (onDateSelect) {
          onDateSelect(date);
        }

        // Enhanced notification with context
        const viewName = view.type === 'linearYear' ? 'Linear Year' : view.title;
        notify.info(`Selected ${format(date, 'EEEE, MMMM d, yyyy')} in ${viewName} view`);

        // Visual feedback
        if (dayEl) {
          dayEl.style.animation = 'pulse 0.3s ease-in-out';
          setTimeout(() => {
            if (dayEl.style) {
              dayEl.style.animation = '';
            }
          }, 300);
        }
      });
    },
    [onDateSelect]
  );

  // Enhanced performance and state management
  useEffect(() => {
    startRenderMeasurement();

    // Detect overlapping events on events change
    if (enableCollisionDetection) {
      const overlaps = detectOverlappingEvents(events);
      setOverlappingEvents(new Set(overlaps.map((e) => e.id)));
    }

    return () => {
      endRenderMeasurement();
    };
  }, [events, startRenderMeasurement, endRenderMeasurement, enableCollisionDetection]);

  // Handle view changes
  const handleViewDidMount = useCallback(
    (info: { view: ViewApi }) => {
      const { view } = info;

      if (onViewChange) {
        onViewChange(view.type);
      }

      // Notify about view change
      notify.info(`Switched to ${view.title} view`);
    },
    [onViewChange]
  );

  // Handle date range changes
  const handleDatesSet = useCallback(
    (info: { start: Date; end: Date; view: ViewApi }) => {
      const { start, end, view } = info;

      if (onDateRangeChange) {
        onDateRangeChange(start, end);
      }

      // Performance tracking for large date ranges
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        console.warn(`Large date range: ${daysDiff} days. Consider virtual rendering.`);
      }
    },
    [onDateRangeChange]
  );

  return (
    <div
      className={cn(
        'linear-calendar-pro h-full w-full',
        isPending && 'opacity-90 pointer-events-none',
        isLoading && 'cursor-wait',
        className
      )}
    >
      {/* Performance CSS for z-index management */}
      <style jsx>{`
        .fc {
          height: 100%;
          font-family: inherit;
          --fc-border-color: hsl(var(--border));
          --fc-button-text-color: hsl(var(--foreground));
          --fc-button-bg-color: hsl(var(--background));
          --fc-button-border-color: hsl(var(--border));
          --fc-button-hover-bg-color: hsl(var(--accent));
          --fc-button-active-bg-color: hsl(var(--primary));
        }
        .fc-event {
          z-index: ${CALENDAR_LAYERS.EVENTS};
          transition: all 0.2s ease-in-out;
        }
        .fc-event:hover {
          z-index: ${CALENDAR_LAYERS.SELECTED_EVENT};
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .fc-event.event-overlapping {
          border-style: dashed;
          border-width: 2px;
        }
        .fc-event.event-pro-enhanced {
          border-radius: 4px;
          font-weight: 500;
        }
        .linear-year-calendar {
          height: 100%;
          overflow-y: auto;
        }
        ${
          isPending
            ? `
          .fc-event {
            opacity: 0.8;
          }
        `
            : ''
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, LinearYearPlugin]}
        initialView={view}
        initialDate={new Date(year, 0, 1)}
        events={fullCalendarEvents}
        // Selection and interaction
        selectable={true}
        selectMirror={true}
        select={handleDateSelect}
        // Event interactions
        eventClick={handleEventClick}
        editable={enableAdvancedDragDrop}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        // Date interactions
        dateClick={handleDateClick}
        // Responsive behavior
        height="100%"
        contentHeight="auto"
        aspectRatio={1.35}
        // Header toolbar configuration
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'linearYear,dayGridMonth,timeGridWeek,listMonth',
        }}
        // Business hours (optional - can be enabled later)
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: '09:00',
          endTime: '17:00',
        }}
        // Enhanced event display settings
        eventDisplay="block"
        dayMaxEvents={eventRenderMode === 'virtual' ? false : 3}
        moreLinkClick="popover"
        eventMaxStack={eventRenderMode === 'virtual' ? 10 : 3}
        // Virtual rendering settings (preparation for v7.1)
        lazyFetching={eventRenderMode === 'lazy'}
        eventSourceFailure={(error) => {
          console.error('Event source failed:', error);
          notify.error('Failed to load some events');
        }}
        // Styling
        eventClassNames={(arg) => {
          const category = arg.event.extendedProps.category;
          return [`event-${category}`, 'transition-all', 'duration-200', 'hover:shadow-md'];
        }}
        // Enhanced drag-and-drop features with collision detection
        eventOverlap={!enableCollisionDetection} // Controlled by collision detection setting
        selectOverlap={false} // Prevent selecting over events
        eventConstraint={
          enableCollisionDetection
            ? {
                start: '00:00',
                end: '24:00',
              }
            : undefined
        }
        droppable={enableAdvancedDragDrop}
        eventDurationEditable={enableAdvancedDragDrop}
        eventStartEditable={enableAdvancedDragDrop}
        eventResourceEditable={enableAdvancedDragDrop}
        // React 19: Enhanced event handlers
        viewDidMount={handleViewDidMount}
        datesSet={handleDatesSet}
        eventResize={handleEventResize}
        // Enhanced external drag-and-drop with validation
        drop={(info: DropArg) => {
          startTransition(() => {
            console.log('External element dropped:', info);

            // Validate drop
            if (!info.date) {
              notify.error('Invalid drop target');
              return;
            }

            // Check for conflicts
            if (enableCollisionDetection) {
              const conflicts = checkDateConflicts(info.date, info.date, events);
              if (conflicts.length > 0) {
                notify.warning(`Dropped on date with ${conflicts.length} existing event(s)`);
              }
            }

            // Handle external drag-and-drop events
            if (onEventCreate) {
              onEventCreate({
                title: 'New Event',
                startDate: info.date,
                endDate: info.date,
                category: 'personal',
                description: 'Created via drag & drop',
                createdAt: new Date(),
              });
            }
          });
        }}
        // Enhanced event receive from external source
        eventReceive={(info) => {
          console.log('Event received from external:', info);
          notify.success(`Event "${info.event.title}" added to calendar`);

          // Track external events for analytics
          performance.mark('external-event-received');
        }}
        // Enhanced loading state with React 19 transitions
        loading={(loading) => {
          if (loading !== isLoading) {
            setIsLoading(loading);
            if (loading) {
              notify.loading('Loading calendar...');
            }
          }
        }}
      />
    </div>
  );
}

// Helper function to get category colors with overlap indication
function getCategoryColor(category: string, isOverlapping = false): string {
  const colors = {
    personal: 'hsl(var(--primary))',
    work: 'hsl(var(--secondary))',
    effort: 'hsl(var(--accent))',
    note: 'hsl(var(--muted))',
  };

  const baseColor = colors[category as keyof typeof colors] || colors.personal;

  // Modify color for overlapping events
  if (isOverlapping) {
    return baseColor.replace(')', ' / 0.7)'); // Add transparency
  }

  return baseColor;
}

// Helper function to check for date conflicts
function checkDateConflicts(start: Date, end: Date, events: Event[], excludeId?: string): Event[] {
  return events.filter((event) => {
    if (excludeId && event.id === excludeId) return false;

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    // Check for date range overlap
    return start < eventEnd && end > eventStart;
  });
}

// Helper function to detect all overlapping events
function detectOverlappingEvents(events: Event[]): Event[] {
  const overlapping: Event[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];

      const start1 = new Date(event1.startDate);
      const end1 = new Date(event1.endDate);
      const start2 = new Date(event2.startDate);
      const end2 = new Date(event2.endDate);

      // Check for overlap
      if (start1 < end2 && start2 < end1) {
        if (!overlapping.find((e) => e.id === event1.id)) {
          overlapping.push(event1);
        }
        if (!overlapping.find((e) => e.id === event2.id)) {
          overlapping.push(event2);
        }
      }
    }
  }

  return overlapping;
}
