/**
 * WeekView - Primary calendar view for Command Workspace
 * Research validation: Schedule X keyboard patterns + existing calendar integration
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import { ViewScaffold, useViewScaffold } from '@/components/_deprecated/ViewScaffold';
import { useViewKeyboard } from '@/lib/keyboard/KeyboardManager';
import { useCalendarEvents } from '@/hooks/useCalendarEvents'; // Preserve backend integration
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * Week View State Management
 */
interface WeekViewState {
  currentDate: Date;
  selectedTimeSlot: { date: Date; hour: number } | null;
  selectedEvent: any | null;
  viewMode: 'week' | 'workweek' | 'compact';
  showWeekends: boolean;
}

function useWeekView() {
  const [state, setState] = useState<WeekViewState>({
    currentDate: new Date(),
    selectedTimeSlot: null,
    selectedEvent: null,
    viewMode: 'week',
    showWeekends: true,
  });

  // Preserve existing calendar integration
  const { events, createEvent, updateEvent, deleteEvent } = useCalendarEvents();

  // Performance monitoring
  const { measureRender, announceViewChange } = useViewScaffold('Week');

  // Keyboard navigation (research: Schedule X patterns)
  const { setupViewShortcuts } = useViewKeyboard('week');

  useEffect(() => {
    announceViewChange();
    measureRender();
  }, []);

  // Week navigation
  const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
    setState((prev) => {
      let newDate: Date;

      switch (direction) {
        case 'prev':
          newDate = subWeeks(prev.currentDate, 1);
          break;
        case 'next':
          newDate = addWeeks(prev.currentDate, 1);
          break;
        case 'today':
        default:
          newDate = new Date();
          break;
      }

      return { ...prev, currentDate: newDate };
    });
  };

  // Double-click event creation (research: Schedule X onDoubleClickDateTime pattern)
  const handleDoubleClickTimeSlot = async (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    try {
      // Performance target: <120ms for event creation response
      const creationStart = performance.now();

      await createEvent({
        title: 'New Event',
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        allDay: false,
      });

      const creationTime = performance.now() - creationStart;

      // Validate against research target
      if (creationTime > 120) {
        console.warn(`⚠️ Event creation: ${creationTime.toFixed(2)}ms (target: <120ms)`);
      } else {
        console.log(`✅ Event creation: ${creationTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Keyboard shortcuts setup (research: Schedule X keyboard patterns)
  setupViewShortcuts({
    PREV_WEEK: () => navigateWeek('prev'),
    NEXT_WEEK: () => navigateWeek('next'),
    TODAY: () => navigateWeek('today'),
    CREATE_EVENT_AT_TIME: () => {
      if (state.selectedTimeSlot) {
        handleDoubleClickTimeSlot(state.selectedTimeSlot.date, state.selectedTimeSlot.hour);
      }
    },
  });

  return {
    state,
    setState,
    events,
    navigateWeek,
    handleDoubleClickTimeSlot,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

/**
 * Week View Header Component
 */
function WeekViewHeader({
  currentDate,
  onNavigate,
  viewMode,
  onViewModeChange,
}: {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  viewMode: WeekViewState['viewMode'];
  onViewModeChange: (mode: WeekViewState['viewMode']) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div
      data-testid="view-header"
      className="flex items-center justify-between p-4 border-b border-border bg-background"
    >
      {/* Week navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('today')}
            className="h-8 px-3 text-sm font-medium"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('next')}
            className="h-8 w-8 p-0"
            data-testid="next-week-button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week range display */}
        <div className="text-lg font-semibold" data-testid="week-display">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
      </div>

      {/* View controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="w-64 pl-10 h-8" />
        </div>

        {/* View mode selector */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {(['week', 'workweek', 'compact'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange(mode)}
              className="h-6 px-2 text-xs"
            >
              {mode === 'workweek' ? '5 Day' : mode === 'compact' ? 'Compact' : 'Week'}
            </Button>
          ))}
        </div>

        {/* Quick actions */}
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>
    </div>
  );
}

/**
 * Week Grid Component with Schedule X patterns
 */
function WeekGrid({
  currentDate,
  events,
  onDoubleClickTimeSlot,
  selectedTimeSlot,
  onSelectTimeSlot,
  viewMode,
  showWeekends,
}: {
  currentDate: Date;
  events: any[];
  onDoubleClickTimeSlot: (date: Date, hour: number) => void;
  selectedTimeSlot: { date: Date; hour: number } | null;
  onSelectTimeSlot: (date: Date, hour: number) => void;
  viewMode: WeekViewState['viewMode'];
  showWeekends: boolean;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Generate days for the week
  const weekDays = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    if (viewMode === 'workweek') {
      return days.filter((day) => {
        const dayOfWeek = day.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends
      });
    }

    if (!showWeekends) {
      return days.filter((day) => {
        const dayOfWeek = day.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      });
    }

    return days;
  }, [weekStart, weekEnd, viewMode, showWeekends]);

  // Generate hours (business hours focus)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const businessHours = hours.filter((hour) => hour >= 8 && hour <= 18);
  const displayHours = viewMode === 'compact' ? businessHours : hours;

  return (
    <div className="flex-1 overflow-auto" data-testid="view-content">
      <div className="min-w-full" data-testid="week-grid">
        {/* Day headers */}
        <div className="sticky top-0 bg-background border-b border-border z-10">
          <div className="grid grid-cols-[80px_1fr] h-12">
            <div></div> {/* Time column spacer */}
            <div className={cn('grid gap-px', `grid-cols-${weekDays.length}`)}>
              {weekDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  data-testid={`day-column-${index}`}
                  className="flex flex-col items-center justify-center p-2 bg-muted/20"
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                        'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time column */}
          <div className="bg-muted/10">
            {displayHours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border/50 flex items-start justify-end pr-3 pt-1"
              >
                <span className="text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={cn('grid gap-px bg-border/20', `grid-cols-${weekDays.length}`)}>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="bg-background">
                {displayHours.map((hour) => {
                  const isSelected =
                    selectedTimeSlot?.date.getTime() === day.getTime() &&
                    selectedTimeSlot?.hour === hour;

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      data-testid="time-slot"
                      className={cn(
                        'h-16 border-b border-border/30 relative cursor-pointer',
                        'hover:bg-muted/30 transition-colors',
                        isSelected && 'bg-primary/10 ring-1 ring-primary'
                      )}
                      onClick={() => onSelectTimeSlot(day, hour)}
                      onDoubleClick={() => onDoubleClickTimeSlot(day, hour)}
                    >
                      {/* Event rendering area */}
                      <div className="absolute inset-0 p-1">
                        {/* TODO: Render events for this time slot */}
                        {events
                          .filter((event) => {
                            const eventDate = new Date(event.start);
                            return (
                              format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
                              eventDate.getHours() === hour
                            );
                          })
                          .map((event, index) => (
                            <div
                              key={event.id || index}
                              data-testid="new-event"
                              className={cn(
                                'absolute inset-x-1 bg-primary/80 text-primary-foreground',
                                'rounded px-2 py-1 text-xs truncate',
                                'border-l-2 border-primary'
                              )}
                              style={{
                                top: '2px',
                                height: '56px', // Fill most of hour slot
                                zIndex: 10,
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {event.location && (
                                <div className="text-xs opacity-80 truncate">
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Week View Quick Actions
 */
function WeekViewActions() {
  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" className="shadow-lg">
        <Plus className="h-4 w-4 mr-2" />
        Quick Event
      </Button>

      <Button variant="outline" size="sm" className="shadow-lg">
        <Clock className="h-4 w-4 mr-2" />
        Focus Block
      </Button>
    </div>
  );
}

/**
 * Main WeekView Component
 */
export function WeekView() {
  const { state, setState, events, navigateWeek, handleDoubleClickTimeSlot } = useWeekView();

  const weekViewEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.VIEWS_WEEK);

  if (!weekViewEnabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Week View</h3>
          <p className="text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline">views.week</Badge>
        </div>
      </div>
    );
  }

  return (
    <ViewScaffold
      header={
        <WeekViewHeader
          currentDate={state.currentDate}
          onNavigate={navigateWeek}
          viewMode={state.viewMode}
          onViewModeChange={(mode) => setState((prev) => ({ ...prev, viewMode: mode }))}
        />
      }
      content={
        <WeekGrid
          currentDate={state.currentDate}
          events={events || []} // Preserve backend integration
          onDoubleClickTimeSlot={handleDoubleClickTimeSlot}
          selectedTimeSlot={state.selectedTimeSlot}
          onSelectTimeSlot={(date, hour) =>
            setState((prev) => ({
              ...prev,
              selectedTimeSlot: { date, hour },
            }))
          }
          viewMode={state.viewMode}
          showWeekends={state.showWeekends}
        />
      }
      actions={<WeekViewActions />}
      contextPanels={['conflicts', 'capacity', 'details']}
      scrollable={false} // Custom scroll handling for calendar grid
    />
  );
}

/**
 * Week View Performance Hook
 */
export function useWeekViewPerformance() {
  const [renderMetrics, setRenderMetrics] = useState({
    gridRenderTime: 0,
    eventRenderTime: 0,
    totalRenderTime: 0,
  });

  return {
    measureGridRender: () => {
      const start = performance.now();
      // Measure in useEffect after render
      requestAnimationFrame(() => {
        const time = performance.now() - start;
        setRenderMetrics((prev) => ({ ...prev, gridRenderTime: time }));

        // Research target: <200ms for view switches
        if (time > 200) {
          console.warn(`⚠️ Week grid render: ${time.toFixed(2)}ms (target: <200ms)`);
        }
      });
    },

    metrics: renderMetrics,
    isPerformant: renderMetrics.totalRenderTime < 200,
  };
}
