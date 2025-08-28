'use client';

import Calendar from '@toast-ui/react-calendar';
import React, { useEffect, useRef, useCallback, useMemo } from 'react';

// Import CSS only on the client side to prevent SSR issues
if (typeof window !== 'undefined') {
  require('@toast-ui/calendar/dist/toastui-calendar.min.css');
  require('tui-date-picker/dist/tui-date-picker.css');
  require('tui-time-picker/dist/tui-time-picker.css');
}
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Grid,
  List,
  MapPin,
  Plus,
  Settings,
  Upload,
  Users,
} from 'lucide-react';
import type { CalendarEvent } from '../providers/types';

interface ToastUICalendarViewProps {
  year: number;
  events: CalendarEvent[];
  onEventCreate: (event: Partial<CalendarEvent>) => void;
  onEventUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onEventDelete: (id: string) => void;
  className?: string;
  defaultView?: 'month' | 'week' | 'day';
}

interface ToastUIEvent {
  id: string;
  calendarId: string;
  title: string;
  body?: string;
  start: Date | string;
  end: Date | string;
  category: 'time' | 'allday' | 'milestone' | 'task';
  isAllday?: boolean;
  location?: string;
  attendees?: string[];
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  dragBackgroundColor?: string;
  isReadOnly?: boolean;
  isPrivate?: boolean;
  state?: 'Busy' | 'Free';
}

export function ToastUICalendarView({
  year,
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className,
  defaultView = 'month',
}: ToastUICalendarViewProps) {
  const calendarRef = useRef<any>(null);
  const { categories, priorities } = useCalendarEvents();
  const [currentView, setCurrentView] = React.useState(defaultView);
  const [currentDate, setCurrentDate] = React.useState(new Date(year, 0, 1));
  const [showSidebar, setShowSidebar] = React.useState(true);

  // Calendar configuration
  const calendars = useMemo(
    () => [
      {
        id: 'primary',
        name: 'Primary Calendar',
        backgroundColor: '#03bd9e',
        borderColor: '#03bd9e',
        dragBackgroundColor: '#03bd9e',
      },
      {
        id: 'personal',
        name: 'Personal',
        backgroundColor: '#00a9ff',
        borderColor: '#00a9ff',
        dragBackgroundColor: '#00a9ff',
      },
      {
        id: 'work',
        name: 'Work',
        backgroundColor: '#ff5722',
        borderColor: '#ff5722',
        dragBackgroundColor: '#ff5722',
      },
    ],
    []
  );

  // Transform events to Toast UI format
  const toastUIEvents = useMemo(() => {
    return events.map(
      (event): ToastUIEvent => ({
        id: event.id || String(Date.now()),
        calendarId: event.category || 'primary',
        title: event.title || 'Untitled Event',
        body: event.description || '',
        start: event.start,
        end: event.end,
        category: event.allDay ? 'allday' : 'time',
        isAllday: event.allDay || false,
        location: event.location || '',
        attendees: event.attendees || [],
        backgroundColor: getCategoryColor(event.category),
        borderColor: getCategoryColor(event.category),
        color: '#ffffff',
        dragBackgroundColor: getCategoryColor(event.category, 0.7),
        isReadOnly: false,
        isPrivate: event.isPrivate || false,
        state: 'Busy',
      })
    );
  }, [events]);

  // Get category color helper
  function getCategoryColor(category?: string, opacity = 1): string {
    const colors: Record<string, string> = {
      work: '#ff5722',
      personal: '#00a9ff',
      health: '#4caf50',
      travel: '#9c27b0',
      education: '#ff9800',
      entertainment: '#e91e63',
      finance: '#795548',
    };

    const color = colors[category || 'primary'] || '#03bd9e';
    if (opacity < 1) {
      // Convert hex to rgba with opacity
      const r = Number.parseInt(color.slice(1, 3), 16);
      const g = Number.parseInt(color.slice(3, 5), 16);
      const b = Number.parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  // Calendar instance methods
  const getCalendarInstance = useCallback(() => {
    return calendarRef.current?.getInstance();
  }, []);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    const instance = getCalendarInstance();
    if (instance) {
      instance.prev();
      setCurrentDate(instance.getDate());
    }
  }, [getCalendarInstance]);

  const handleNext = useCallback(() => {
    const instance = getCalendarInstance();
    if (instance) {
      instance.next();
      setCurrentDate(instance.getDate());
    }
  }, [getCalendarInstance]);

  const handleToday = useCallback(() => {
    const instance = getCalendarInstance();
    if (instance) {
      instance.today();
      setCurrentDate(instance.getDate());
    }
  }, [getCalendarInstance]);

  const handleViewChange = useCallback(
    (view: 'month' | 'week' | 'day') => {
      const instance = getCalendarInstance();
      if (instance) {
        instance.changeView(view);
        setCurrentView(view);
      }
    },
    [getCalendarInstance]
  );

  // Event handlers
  const handleBeforeCreateEvent = useCallback(
    (eventData: any) => {
      const newEvent: Partial<CalendarEvent> = {
        id: `toast-ui-${Date.now()}`,
        title: eventData.title || 'New Event',
        start: eventData.start,
        end: eventData.end,
        allDay: eventData.isAllday || false,
        category: eventData.calendarId || 'primary',
        description: eventData.body || '',
        location: eventData.location || '',
        attendees: eventData.attendees || [],
      };

      onEventCreate(newEvent);

      // Create the event in Toast UI
      const instance = getCalendarInstance();
      if (instance) {
        instance.createEvents([
          {
            ...eventData,
            id: newEvent.id,
            backgroundColor: getCategoryColor(newEvent.category),
            borderColor: getCategoryColor(newEvent.category),
            dragBackgroundColor: getCategoryColor(newEvent.category, 0.7),
          },
        ]);
      }
    },
    [onEventCreate, getCalendarInstance]
  );

  const handleBeforeUpdateEvent = useCallback(
    ({ event, changes }: any) => {
      const updates: Partial<CalendarEvent> = {};

      if (changes.title) updates.title = changes.title;
      if (changes.start) updates.start = changes.start;
      if (changes.end) updates.end = changes.end;
      if (changes.isAllday !== undefined) updates.allDay = changes.isAllday;
      if (changes.body) updates.description = changes.body;
      if (changes.location) updates.location = changes.location;
      if (changes.attendees) updates.attendees = changes.attendees;
      if (changes.calendarId) updates.category = changes.calendarId;

      onEventUpdate(event.id, updates);

      // Update the event in Toast UI
      const instance = getCalendarInstance();
      if (instance) {
        instance.updateEvent(event.id, event.calendarId, {
          ...changes,
          backgroundColor: getCategoryColor(changes.calendarId),
          borderColor: getCategoryColor(changes.calendarId),
          dragBackgroundColor: getCategoryColor(changes.calendarId, 0.7),
        });
      }
    },
    [onEventUpdate, getCalendarInstance]
  );

  const handleBeforeDeleteEvent = useCallback(
    (eventData: any) => {
      onEventDelete(eventData.id);

      // Delete the event from Toast UI
      const instance = getCalendarInstance();
      if (instance) {
        instance.deleteEvent(eventData.id, eventData.calendarId);
      }
    },
    [onEventDelete, getCalendarInstance]
  );

  const handleClickEvent = useCallback((eventInfo: any) => {
    console.log('Event clicked:', eventInfo.event);
  }, []);

  // Template configuration for customized rendering
  const template = useMemo(
    () => ({
      milestone(event: ToastUIEvent) {
        return `<span style="color: #fff; background-color: ${event.backgroundColor}; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
        📍 ${event.title}
      </span>`;
      },
      milestoneTitle() {
        return '<span style="color: #333; font-weight: bold;">🏁 Milestones</span>';
      },
      task(event: ToastUIEvent) {
        return `<span style="color: #333; font-size: 12px;">
        ✓ ${event.title}
      </span>`;
      },
      taskTitle() {
        return '<span style="color: #333; font-weight: bold;">📋 Tasks</span>';
      },
      allday(event: ToastUIEvent) {
        return `<span style="color: #fff; background-color: ${event.backgroundColor}; padding: 1px 4px; border-radius: 2px; font-size: 11px;">
        📅 ${event.title}
      </span>`;
      },
      alldayTitle() {
        return '<span style="color: #333; font-weight: bold;">📅 All Day</span>';
      },
      time(event: ToastUIEvent) {
        const timeStr = new Date(event.start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `<span style="color: #333; font-size: 11px; font-weight: 500;">
        🕐 ${timeStr} ${event.title}
      </span>`;
      },
      monthMoreTitleDate(date: Date) {
        return `<span style="color: #333; font-weight: bold;">${date.toLocaleDateString()}</span>`;
      },
      monthMoreClose() {
        return '<span style="color: #999; cursor: pointer;">✕</span>';
      },
      monthGridHeader(model: any) {
        const dayName = model.label || '';
        return `<span style="color: #666; font-weight: 500; font-size: 12px;">${dayName}</span>`;
      },
      monthGridHeaderExceed(hiddenEvents: number) {
        return `<span style="color: #999; font-size: 10px;">+${hiddenEvents} more</span>`;
      },
      monthGridFooter() {
        return '';
      },
      monthGridFooterExceed() {
        return '';
      },
      weekDayname(model: any) {
        return `<span style="color: #333; font-weight: 500;">${model.label}</span>`;
      },
      weekGridFooterExceed() {
        return '';
      },
    }),
    []
  );

  // Calendar options
  const calendarOptions = useMemo(
    () => ({
      defaultView: currentView,
      height: '100%',
      useFormPopup: true,
      useDetailPopup: true,
      calendars,
      template,
      theme: {
        common: {
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          gridSelection: {
            backgroundColor: 'rgba(3, 189, 158, 0.1)',
            border: '1px solid #03bd9e',
          },
        },
        month: {
          dayExceptThisMonth: {
            color: '#d1d5db',
          },
          holidayExceptThisMonth: {
            color: '#d1d5db',
          },
        },
        week: {
          today: {
            color: '#03bd9e',
          },
          pastDay: {
            color: '#9ca3af',
          },
        },
      },
      gridSelection: {
        enableDblClick: true,
        enableClick: true,
      },
      timezone: {
        zones: [
          {
            timezoneName: 'America/New_York',
            displayLabel: 'EST',
            tooltip: 'Eastern Standard Time',
          },
        ],
      },
      week: {
        startDayOfWeek: 0, // Sunday
        dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        narrowWeekend: false,
        workweek: false,
        showNowIndicator: true,
        showTimezoneCollapseButton: false,
        timezonesCollapsed: false,
        hourStart: 0,
        hourEnd: 24,
        eventView: ['time', 'allday'],
        taskView: ['task'],
      },
      month: {
        startDayOfWeek: 0,
        dayNames: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        visibleWeeksCount: 6,
        workweek: false,
        narrowWeekend: false,
        isAlways6Weeks: false,
        visibleEventCount: 6,
      },
      usageStatistics: false,
    }),
    [calendars, template, currentView]
  );

  // Statistics calculation
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const upcomingEvents = events.filter((event) => new Date(event.start) > new Date()).length;
    const todayEvents = events.filter((event) => {
      const eventDate = new Date(event.start);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length;
    const completedEvents = events.filter(
      (event) => event.completed && new Date(event.start) <= new Date()
    ).length;

    return {
      total: totalEvents,
      upcoming: upcomingEvents,
      today: todayEvents,
      completed: completedEvents,
    };
  }, [events]);

  const formatCurrentDate = useCallback(() => {
    const options: Intl.DateTimeFormatOptions =
      currentView === 'month'
        ? { month: 'long', year: 'numeric' }
        : currentView === 'week'
          ? { month: 'short', day: 'numeric', year: 'numeric' }
          : { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };

    return currentDate.toLocaleDateString('en-US', options);
  }, [currentDate, currentView]);

  return (
    <div className={cn('h-full w-full bg-background text-foreground', className)}>
      <div className="flex h-full gap-4">
        {/* Enhanced Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-card border-r border-border overflow-hidden"
            >
              <div className="h-full flex flex-col p-4 space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      Toast UI Calendar Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-blue-600 /* TODO: Use semantic token */">{stats.upcoming}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600 /* TODO: Use semantic token */">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Categories */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Calendars</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {calendars.map((cal) => (
                      <div
                        key={cal.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: cal.backgroundColor }}
                        />
                        <span className="text-sm font-medium flex-1">{cal.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {events.filter((e) => (e.category || 'primary') === cal.id).length}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Drag & Drop Features */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Drag & Drop Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-2">
                      <p>• Drag events to reschedule</p>
                      <p>• Resize events by dragging edges</p>
                      <p>• Create events by dragging on grid</p>
                      <p>• Drop events between calendars</p>
                      <p>• Visual feedback during operations</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => {
                        const instance = getCalendarInstance();
                        if (instance) {
                          // Trigger creation popup
                          const today = new Date();
                          instance.openCreationPopup({
                            start: today,
                            end: new Date(today.getTime() + 60 * 60 * 1000), // 1 hour later
                            isAllday: false,
                          });
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Create Event
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={handleToday}
                    >
                      <Clock className="h-3 w-3" />
                      Go to Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      <Settings className="h-3 w-3" />
                      Toggle Sidebar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Toolbar */}
          <motion.div
            className="bg-card border-b border-border p-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              {/* Navigation Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handlePrevious} className="p-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNext} className="p-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="px-3 py-1.5 text-xs font-medium"
                >
                  Today
                </Button>

                <div className="h-6 w-px bg-border mx-2" />

                <h2 className="text-lg font-semibold text-foreground">{formatCurrentDate()}</h2>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-muted rounded-lg p-1">
                  {(['month', 'week', 'day'] as const).map((view) => (
                    <Button
                      key={view}
                      variant={currentView === view ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewChange(view)}
                      className="px-3 py-1.5 text-xs font-medium capitalize"
                    >
                      {view === 'month' && <Grid className="h-3 w-3 mr-1.5" />}
                      {view === 'week' && <List className="h-3 w-3 mr-1.5" />}
                      {view === 'day' && <Clock className="h-3 w-3 mr-1.5" />}
                      {view}
                    </Button>
                  ))}
                </div>

                <div className="h-6 w-px bg-border" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Toast UI Calendar */}
          <motion.div
            className="flex-1 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="h-full bg-background rounded-lg border border-border overflow-hidden">
              <Calendar
                ref={calendarRef}
                {...calendarOptions}
                events={toastUIEvents}
                onBeforeCreateEvent={handleBeforeCreateEvent}
                onBeforeUpdateEvent={handleBeforeUpdateEvent}
                onBeforeDeleteEvent={handleBeforeDeleteEvent}
                onClickEvent={handleClickEvent}
                onSelectDateTime={(info) => {
                  console.log('Date/time selected:', info);
                }}
                onClickMoreEventsBtn={(info) => {
                  console.log('More events button clicked:', info);
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ToastUICalendarView;
