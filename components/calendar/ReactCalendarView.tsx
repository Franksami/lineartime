'use client';

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import type { CalendarEvent, CalendarViewProps } from './providers/types';

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

interface ReactCalendarViewProps extends CalendarViewProps {
  selectRange?: boolean;
  showDoubleView?: boolean;
  showNeighboringMonth?: boolean;
  showWeekNumbers?: boolean;
  navigationLabel?: (props: { date: Date; view: string; label: string }) => string | JSX.Element;
  tileClassName?: string | ((props: { date: Date; view: string }) => string | null);
  minDetail?: 'month' | 'year' | 'decade' | 'century';
  maxDetail?: 'month' | 'year' | 'decade' | 'century';
}

const ReactCalendarView: React.FC<ReactCalendarViewProps> = ({
  events = [],
  selectedDate,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateChange,
  theme = 'light',
  loading = false,
  className,
  selectRange = false,
  showDoubleView = false,
  showNeighboringMonth = true,
  showWeekNumbers = false,
  minDetail = 'month',
  maxDetail = 'month',
}) => {
  const [calendarValue, setCalendarValue] = useState<CalendarValue>(selectedDate);
  const [showEvents, setShowEvents] = useState(true);
  const [activeStartDate, setActiveStartDate] = useState<Date>(selectedDate);

  // Process events by date
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, []);
      }
      eventMap.get(dateKey)?.push(event);
    });

    return eventMap;
  }, [events]);

  // Handle date change
  const handleDateChange = useCallback(
    (value: CalendarValue) => {
      setCalendarValue(value);

      if (value && !Array.isArray(value)) {
        onDateChange(value);
      } else if (Array.isArray(value) && value[0]) {
        onDateChange(value[0]);
      }
    },
    [onDateChange]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(
    async (date?: Date) => {
      try {
        const eventDate =
          date || (Array.isArray(calendarValue) ? calendarValue[0] : calendarValue) || new Date();
        const start = new Date(eventDate);
        const end = new Date(eventDate);

        start.setHours(9, 0, 0, 0);
        end.setHours(10, 0, 0, 0);

        await onEventCreate({
          title: 'New Event',
          start,
          end,
          allDay: false,
        });
      } catch (error) {
        console.error('Failed to create event:', error);
      }
    },
    [calendarValue, onEventCreate]
  );

  // Get priority color
  const getPriorityColor = useCallback((priority?: string): string => {
    switch (priority) {
      case 'critical':
        return 'hsl(var(--destructive))';
      case 'high':
        return 'hsl(var(--warning))';
      case 'medium':
        return 'hsl(var(--primary))';
      case 'low':
        return 'hsl(var(--success))';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  }, []);

  // Tile content - shows event indicators
  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return null;

      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateKey) || [];

      if (dayEvents.length === 0) return null;

      return (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {dayEvents.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getPriorityColor(event.priority) }}
              title={event.title}
            />
          ))}
          {dayEvents.length > 3 && (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex items-center justify-center">
              <span className="text-[6px] text-white font-bold">+</span>
            </div>
          )}
        </div>
      );
    },
    [eventsByDate, getPriorityColor]
  );

  // Tile class name for styling
  const tileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return null;

      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateKey) || [];
      const hasEvents = dayEvents.length > 0;

      const baseClasses = 'relative flex flex-col items-center justify-center p-1';

      if (hasEvents) {
        return cn(baseClasses, 'font-semibold');
      }

      return baseClasses;
    },
    [eventsByDate]
  );

  // Navigation label
  const navigationLabel = useCallback(
    ({ date, view, label }: { date: Date; view: string; label: string }) => {
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="font-medium">{label}</span>
        </div>
      );
    },
    []
  );

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const date = Array.isArray(calendarValue) ? calendarValue[0] : calendarValue;
    if (!date) return [];

    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate.get(dateKey) || [];
  }, [calendarValue, eventsByDate]);

  // Get display date for selected events
  const displayDate = useMemo(() => {
    const date = Array.isArray(calendarValue) ? calendarValue[0] : calendarValue;
    return date || new Date();
  }, [calendarValue]);

  return (
    <div className={cn('react-calendar-view', className)}>
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Loading events...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <CardTitle>React Calendar</CardTitle>
              <Badge variant="secondary">{events.length} events</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEvents(!showEvents)}
                disabled={loading}
              >
                {showEvents ? (
                  <Eye className="h-4 w-4 mr-1" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-1" />
                )}
                {showEvents ? 'Hide' : 'Show'} Events
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleCreateEvent()}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className={cn('lg:col-span-2', !showEvents && 'lg:col-span-3')}>
          <Card>
            <CardContent className="p-4">
              <div
                className={cn(
                  'react-calendar-container',
                  theme === 'dark' && 'dark-theme',
                  loading && 'opacity-50 pointer-events-none'
                )}
              >
                <Calendar
                  value={calendarValue}
                  onChange={handleDateChange}
                  onActiveStartDateChange={({ activeStartDate }) =>
                    activeStartDate && setActiveStartDate(activeStartDate)
                  }
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  navigationLabel={navigationLabel}
                  selectRange={selectRange}
                  showDoubleView={showDoubleView}
                  showNeighboringMonth={showNeighboringMonth}
                  showWeekNumbers={showWeekNumbers}
                  minDetail={minDetail}
                  maxDetail={maxDetail}
                  prev2Label={null}
                  next2Label={null}
                  prevLabel={<ChevronLeft className="h-4 w-4" />}
                  nextLabel={<ChevronRight className="h-4 w-4" />}
                  className="w-full border-0 bg-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(new Date())}
              disabled={loading}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDateChange(new Date(activeStartDate.getTime() - 30 * 24 * 60 * 60 * 1000))
              }
              disabled={loading}
            >
              Previous Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDateChange(new Date(activeStartDate.getTime() + 30 * 24 * 60 * 60 * 1000))
              }
              disabled={loading}
            >
              Next Month
            </Button>
          </div>
        </div>

        {/* Events Sidebar */}
        {showEvents && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {displayDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </CardTitle>
                <Badge variant="outline">{selectedDateEvents.length} events</Badge>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-3">No events for this date</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateEvent()}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => console.log('Edit event:', event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{event.title}</h4>
                              {event.priority && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0.5"
                                  style={{
                                    backgroundColor: getPriorityColor(event.priority),
                                    color: 'white',
                                  }}
                                >
                                  {event.priority}
                                </Badge>
                              )}
                            </div>

                            {event.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}

                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.allDay ? (
                                  <span>All day</span>
                                ) : (
                                  <span>
                                    {event.start.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}{' '}
                                    -{' '}
                                    {event.end.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>

                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}

                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{event.attendees.length} attendee(s)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventDelete(event.id);
                            }}
                            disabled={loading}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Events</span>
                    <Badge variant="secondary">{events.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">High Priority</span>
                    <Badge variant="destructive">
                      {
                        events.filter((e) => e.priority === 'high' || e.priority === 'critical')
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Month</span>
                    <Badge variant="default">
                      {
                        events.filter((event) => {
                          return (
                            event.start.getMonth() === displayDate.getMonth() &&
                            event.start.getFullYear() === displayDate.getFullYear()
                          );
                        }).length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Upcoming</span>
                    <Badge variant="outline">
                      {events.filter((event) => event.start > new Date()).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style jsx global>{`
        .react-calendar-view .react-calendar {
          background: transparent;
          border: none;
          font-family: inherit;
        }
        
        .react-calendar-view .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 1rem;
        }
        
        .react-calendar-view .react-calendar__navigation button {
          min-width: 44px;
          background: transparent;
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          color: hsl(var(--foreground));
          font-size: 16px;
          font-weight: 500;
          margin: 0 2px;
        }
        
        .react-calendar-view .react-calendar__navigation button:hover,
        .react-calendar-view .react-calendar__navigation button:focus {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        
        .react-calendar-view .react-calendar__navigation button:disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        
        .react-calendar-view .react-calendar__viewContainer {
          margin-top: 1rem;
        }
        
        .react-calendar-view .react-calendar__month-view__weekdays {
          font-size: 12px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          text-align: center;
        }
        
        .react-calendar-view .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .react-calendar-view .react-calendar__month-view__days {
          gap: 1px;
        }
        
        .react-calendar-view .react-calendar__tile {
          max-width: 100%;
          background: transparent;
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          height: 60px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 4px;
          font-size: 14px;
        }
        
        .react-calendar-view .react-calendar__tile:hover,
        .react-calendar-view .react-calendar__tile:focus {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        
        .react-calendar-view .react-calendar__tile--active {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        .react-calendar-view .react-calendar__tile--now {
          background: hsl(var(--secondary));
          color: hsl(var(--secondary-foreground));
        }
        
        .react-calendar-view .react-calendar__tile--neighboringMonth {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
};

export default ReactCalendarView;
