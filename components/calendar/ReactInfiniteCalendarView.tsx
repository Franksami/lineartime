'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CalendarViewProps, CalendarEvent } from './providers/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InfiniteCalendar from 'react-infinite-calendar';
import 'react-infinite-calendar/styles.css';

interface ReactInfiniteCalendarViewProps extends CalendarViewProps {
  showHeader?: boolean;
  showTodayHelper?: boolean;
  showOverlay?: boolean;
  minDate?: Date;
  maxDate?: Date;
  height?: number;
  width?: number;
}

const ReactInfiniteCalendarView: React.FC<ReactInfiniteCalendarViewProps> = ({
  events = [],
  selectedDate,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateChange,
  theme = 'light',
  loading = false,
  className,
  showHeader = true,
  showTodayHelper = true,
  showOverlay = true,
  minDate = new Date(2020, 0, 1),
  maxDate = new Date(2030, 11, 31),
  height = 600,
  width,
}) => {
  const [selectedDateLocal, setSelectedDateLocal] = useState(selectedDate);
  const [showEvents, setShowEvents] = useState(true);

  // Process events for display
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent[]>();
    
    events.forEach(event => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, []);
      }
      eventMap.get(dateKey)!.push(event);
    });
    
    return eventMap;
  }, [events]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDateLocal(date);
    onDateChange(date);
  }, [onDateChange]);

  // Handle event creation for selected date
  const handleCreateEvent = useCallback(async () => {
    try {
      const start = new Date(selectedDateLocal);
      const end = new Date(selectedDateLocal);
      end.setHours(start.getHours() + 1);
      
      await onEventCreate({
        title: 'New Event',
        start,
        end,
        allDay: true,
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  }, [selectedDateLocal, onEventCreate]);

  // Get priority color
  const getPriorityColor = useCallback((priority?: string): string => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6366f1';
    }
  }, []);

  // Custom theme for the infinite calendar
  const calendarTheme = useMemo(() => ({
    accentColor: theme === 'dark' ? '#6366f1' : '#4f46e5',
    floatingNav: {
      background: theme === 'dark' ? '#1f2937' : '#ffffff',
      color: theme === 'dark' ? '#f9fafb' : '#111827',
      chevron: theme === 'dark' ? '#9ca3af' : '#6b7280',
    },
    headerColor: theme === 'dark' ? '#1f2937' : '#f8fafc',
    selectionColor: theme === 'dark' ? '#4338ca' : '#6366f1',
    textColor: {
      default: theme === 'dark' ? '#f9fafb' : '#111827',
      active: '#ffffff',
    },
    todayColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    weekdayColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
  }), [theme]);

  // Day component with event indicators
  const DayComponent = ({ date, isSelected, ...props }: any) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateKey) || [];
    
    return (
      <div className={cn(
        'relative w-full h-full flex flex-col items-center justify-center',
        isSelected && 'bg-primary text-primary-foreground',
        dayEvents.length > 0 && 'font-semibold'
      )}>
        <span className="text-sm">{date.getDate()}</span>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPriorityColor(event.priority) }}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="w-2 h-2 rounded-full bg-muted-foreground flex items-center justify-center">
                <span className="text-xs text-white">+</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const selectedDateKey = selectedDateLocal.toISOString().split('T')[0];
  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];

  return (
    <div className={cn('react-infinite-calendar-view', className)}>
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading events...</span>
          </div>
        </div>
      )}

      {/* Custom Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Infinite Calendar</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEvents(!showEvents)}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-1" />
              {showEvents ? 'Hide' : 'Show'} Events
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateEvent}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-2">
          <div 
            className={cn(
              'infinite-calendar-container border border-border rounded-lg overflow-hidden',
              theme === 'dark' && 'bg-slate-900'
            )}
            style={{ height }}
          >
            <InfiniteCalendar
              selected={selectedDateLocal}
              onSelect={handleDateSelect}
              minDate={minDate}
              maxDate={maxDate}
              width={width}
              height={height}
              theme={calendarTheme}
              Component={showEvents ? DayComponent : undefined}
              showHeader={false}
              showTodayHelper={showTodayHelper}
              showOverlay={showOverlay}
              locale={{
                locale: 'en-US',
                headerFormat: 'dddd, MMM Do',
                weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                blank: 'Select a date above',
                todayLabel: {
                  long: 'Today',
                  short: 'Today',
                },
              }}
              className={cn(theme === 'dark' && 'dark-theme')}
            />
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              {selectedDateLocal.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No events for this date</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleCreateEvent}
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
                    className="p-3 bg-background border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => console.log('Edit event:', event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {event.title}
                          </h4>
                          {event.priority && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-1 py-0"
                              style={{ 
                                backgroundColor: getPriorityColor(event.priority), 
                                color: 'white' 
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
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.allDay ? (
                            <span>All day</span>
                          ) : (
                            <span>
                              {event.start.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })} - {event.end.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                          {event.location && (
                            <>
                              <span>•</span>
                              <span className="truncate">{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
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
          </div>
          
          {/* Event Summary */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h4 className="font-medium mb-2">Event Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events:</span>
                <span className="font-medium">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Today's Events:</span>
                <span className="font-medium">{selectedDateEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Month:</span>
                <span className="font-medium">
                  {events.filter(event => 
                    event.start.getMonth() === selectedDateLocal.getMonth() &&
                    event.start.getFullYear() === selectedDateLocal.getFullYear()
                  ).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-infinite-calendar-view .Cal__Container {
          background: ${theme === 'dark' ? '#0f172a' : '#ffffff'};
          color: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
        }
        
        .react-infinite-calendar-view .Cal__Header {
          background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
          border-bottom: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        
        .react-infinite-calendar-view .Cal__Day--today {
          background: ${theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
        
        .react-infinite-calendar-view .Cal__Day--selected {
          background: #6366f1 !important;
          color: white !important;
        }
        
        .react-infinite-calendar-view .Cal__Weekdays {
          background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
          color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
        }
      `}</style>
    </div>
  );
};

export default ReactInfiniteCalendarView;