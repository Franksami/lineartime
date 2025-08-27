'use client';

import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Settings, Users } from 'lucide-react';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { CalendarEvent, CalendarViewProps } from './providers/types';

// Import PrimeReact CSS
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface PrimeReactCalendarViewProps extends CalendarViewProps {
  showTime?: boolean;
  showButtonBar?: boolean;
  showIcon?: boolean;
  inline?: boolean;
  selectionMode?: 'single' | 'multiple' | 'range';
  numberOfMonths?: number;
  view?: 'date' | 'month' | 'year';
}

const PrimeReactCalendarView: React.FC<PrimeReactCalendarViewProps> = ({
  events = [],
  selectedDate,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateChange,
  theme = 'light',
  loading = false,
  className,
  showTime = false,
  showButtonBar = true,
  showIcon = true,
  inline = true,
  selectionMode = 'single',
  numberOfMonths = 1,
  view = 'date',
}) => {
  const [selectedDates, setSelectedDates] = useState<Date | Date[] | null>(selectedDate);
  const [currentView, setCurrentView] = useState<'date' | 'month' | 'year'>(view);
  const [showEventPanel, setShowEventPanel] = useState(true);

  // Process events by date for easy lookup
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

  // Handle date selection
  const handleDateSelect = useCallback(
    (e: { value: Date | Date[] | null }) => {
      setSelectedDates(e.value);

      if (e.value && !Array.isArray(e.value)) {
        onDateChange(e.value);
      }
    },
    [onDateChange]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(
    async (date?: Date) => {
      try {
        const eventDate =
          date || (Array.isArray(selectedDates) ? selectedDates[0] : selectedDates) || new Date();
        const start = new Date(eventDate);
        const end = new Date(eventDate);

        if (showTime) {
          end.setHours(start.getHours() + 1);
        } else {
          end.setDate(start.getDate());
          start.setHours(9, 0, 0, 0);
          end.setHours(17, 0, 0, 0);
        }

        await onEventCreate({
          title: 'New Event',
          start,
          end,
          allDay: !showTime,
        });
      } catch (error) {
        console.error('Failed to create event:', error);
      }
    },
    [selectedDates, showTime, onEventCreate]
  );

  // Get priority color
  const getPriorityColor = useCallback((priority?: string): string => {
    switch (priority) {
      case 'critical':
        return '#e53e3e';
      case 'high':
        return '#dd6b20';
      case 'medium':
        return '#d69e2e';
      case 'low':
        return '#38a169';
      default:
        return '#3182ce';
    }
  }, []);

  // Custom date template with event indicators
  const dateTemplate = useCallback(
    (date: Date) => {
      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateKey) || [];
      const hasEvents = dayEvents.length > 0;

      return (
        <div className={cn('relative p-2 text-center', hasEvents && 'font-semibold')}>
          <span>{date.getDate()}</span>
          {hasEvents && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getPriorityColor(event.priority) }}
                  data-pr-tooltip={event.title}
                  data-pr-position="top"
                />
              ))}
              {dayEvents.length > 3 && (
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center"
                  data-pr-tooltip={`+${dayEvents.length - 3} more events`}
                  data-pr-position="top"
                >
                  +
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    [eventsByDate, getPriorityColor]
  );

  // Get events for selected date
  const getSelectedDateEvents = useCallback(() => {
    const date = Array.isArray(selectedDates) ? selectedDates[0] : selectedDates;
    if (!date) return [];

    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate.get(dateKey) || [];
  }, [selectedDates, eventsByDate]);

  const selectedDateEvents = getSelectedDateEvents();

  // Menu items for calendar actions
  const _menuItems = [
    {
      label: 'Add Event',
      icon: 'pi pi-plus',
      command: () => handleCreateEvent(),
    },
    {
      label: 'View Options',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Date View',
          icon: 'pi pi-calendar',
          command: () => setCurrentView('date'),
        },
        {
          label: 'Month View',
          icon: 'pi pi-th-large',
          command: () => setCurrentView('month'),
        },
        {
          label: 'Year View',
          icon: 'pi pi-calendar-times',
          command: () => setCurrentView('year'),
        },
      ],
    },
    {
      separator: true,
    },
    {
      label: showEventPanel ? 'Hide Events' : 'Show Events',
      icon: showEventPanel ? 'pi pi-eye-slash' : 'pi pi-eye',
      command: () => setShowEventPanel(!showEventPanel),
    },
  ];

  return (
    <div className={cn('primereact-calendar-view', className)}>
      <Tooltip target=".event-indicator" />

      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <i className="pi pi-spin pi-spinner text-2xl text-blue-500" />
            <span className="text-sm text-gray-600">Loading events...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Card className="mb-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">PrimeReact Calendar</h2>
            <Badge value={events.length} severity={events.length > 0 ? 'info' : 'secondary'} />
          </div>

          <div className="flex items-center gap-2">
            <ShadcnButton
              variant="outline"
              size="sm"
              onClick={() => setShowEventPanel(!showEventPanel)}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-1" />
              {showEventPanel ? 'Hide' : 'Show'} Events
            </ShadcnButton>

            <ShadcnButton
              variant="default"
              size="sm"
              onClick={() => handleCreateEvent()}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </ShadcnButton>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className={cn('lg:col-span-2', !showEventPanel && 'lg:col-span-3')}>
          <Card>
            <div className="p-4">
              <Calendar
                value={selectedDates}
                onChange={handleDateSelect}
                dateTemplate={dateTemplate}
                showTime={showTime}
                showButtonBar={showButtonBar}
                showIcon={!inline && showIcon}
                inline={inline}
                selectionMode={selectionMode}
                numberOfMonths={numberOfMonths}
                view={currentView}
                dateFormat={showTime ? 'mm/dd/yy' : 'mm/dd/yy'}
                placeholder="Select a date"
                readOnlyInput
                showOtherMonths
                selectOtherMonths
                showWeek
                className={cn(
                  'w-full',
                  theme === 'dark' && 'p-dark-theme',
                  loading && 'opacity-50 pointer-events-none'
                )}
                panelClassName="shadow-lg border border-gray-200"
                inputClassName="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </Card>
        </div>

        {/* Events Sidebar */}
        {showEventPanel && (
          <div className="space-y-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedDates
                      ? Array.isArray(selectedDates)
                        ? `${selectedDates.length} dates selected`
                        : selectedDates.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                      : 'No date selected'}
                  </h3>
                  <Badge value={selectedDateEvents.length} severity="info" />
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="pi pi-calendar text-4xl mb-3 block opacity-50" />
                    <p className="text-sm mb-3">No events for this date</p>
                    <Button
                      label="Add Event"
                      icon="pi pi-plus"
                      size="small"
                      onClick={() => handleCreateEvent()}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm truncate">{event.title}</h4>
                              {event.priority && (
                                <Badge
                                  value={event.priority}
                                  severity={
                                    event.priority === 'critical'
                                      ? 'danger'
                                      : event.priority === 'high'
                                        ? 'warning'
                                        : event.priority === 'medium'
                                          ? 'info'
                                          : 'success'
                                  }
                                  className="text-xs"
                                />
                              )}
                            </div>

                            {event.description && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-xs text-gray-500">
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
                                  <span>{event.attendees.length}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            icon="pi pi-times"
                            className="p-button-text p-button-danger p-button-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventDelete(event.id);
                            }}
                            disabled={loading}
                            tooltip="Delete event"
                            tooltipOptions={{ position: 'top' }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Statistics Card */}
            <Card>
              <div className="p-4">
                <h4 className="font-medium mb-3">Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <Badge value={events.length} severity="info" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Priority</span>
                    <Badge
                      value={
                        events.filter((e) => e.priority === 'high' || e.priority === 'critical')
                          .length
                      }
                      severity="warning"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <Badge
                      value={
                        events.filter((event) => {
                          const now = new Date();
                          return (
                            event.start.getMonth() === now.getMonth() &&
                            event.start.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                      severity="success"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimeReactCalendarView;
