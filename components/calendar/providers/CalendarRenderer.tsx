'use client';

import React, { Suspense } from 'react';
import { useCalendarProvider } from './CalendarProvider';
import { getCalendarAdapter } from './CalendarRegistry';
import { CalendarViewProps } from './types';

interface CalendarRendererProps {
  className?: string;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center h-full w-full bg-background border border-border rounded-lg">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <div className="text-muted-foreground">Loading calendar...</div>
    </div>
  </div>
);

export function CalendarRenderer({ className, fallback = <DefaultFallback /> }: CalendarRendererProps) {
  const {
    selectedLibrary,
    events,
    selectedDate,
    onEventCreate,
    onEventUpdate,
    onEventDelete,
    navigateToDate,
    theme,
    loading,
  } = useCalendarProvider();

  const adapter = getCalendarAdapter(selectedLibrary);
  const CalendarComponent = adapter.component;

  // Transform events for the specific library
  const transformedEvents = adapter.transformEvents(events);

  // Props to pass to the calendar component
  const calendarProps: CalendarViewProps = {
    events: transformedEvents,
    selectedDate,
    onEventCreate: async (eventData) => {
      const transformedEvent = adapter.transformEventBack(eventData, selectedLibrary);
      await onEventCreate(transformedEvent);
    },
    onEventUpdate: async (eventId, updates) => {
      const transformedUpdates = adapter.transformEventBack(updates, selectedLibrary);
      await onEventUpdate(eventId, transformedUpdates);
    },
    onEventDelete,
    onDateChange: navigateToDate,
    theme,
    loading,
    className,
  };

  return (
    <div className={`calendar-renderer ${className}`}>
      <Suspense fallback={fallback}>
        <CalendarComponent {...calendarProps} />
      </Suspense>
    </div>
  );
}

export default CalendarRenderer;