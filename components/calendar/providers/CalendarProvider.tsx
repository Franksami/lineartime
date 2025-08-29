'use client';

import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useSyncedCalendar } from '@/hooks/useSyncedCalendar';
import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import type {
  CalendarContextType,
  CalendarEvent,
  CalendarLibrary,
  CalendarProviderProps,
  CalendarTheme,
  CalendarView,
} from './types';

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children, initialLibrary = 'linear' }: CalendarProviderProps) {
  const [selectedLibrary, setSelectedLibrary] = useState<CalendarLibrary>(initialLibrary);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [theme, setTheme] = useState<CalendarTheme>('light');

  // Use existing hooks for data management
  const { events, createEvent, updateEvent, deleteEvent, loading } = useCalendarEvents();
  const { syncStatus, syncCalendar, providers } = useSyncedCalendar();

  const switchLibrary = useCallback((library: CalendarLibrary) => {
    setSelectedLibrary(library);
  }, []);

  const switchView = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  const switchTheme = useCallback((newTheme: CalendarTheme) => {
    setTheme(newTheme);
  }, []);

  const navigateToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Event handlers that work across all libraries
  const handleEventCreate = useCallback(
    async (eventData: Partial<CalendarEvent>) => {
      try {
        await createEvent(eventData);
      } catch (error) {
        console.error('Failed to create event:', error);
        throw error;
      }
    },
    [createEvent]
  );

  const handleEventUpdate = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      try {
        await updateEvent(eventId, updates);
      } catch (error) {
        console.error('Failed to update event:', error);
        throw error;
      }
    },
    [updateEvent]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
        throw error;
      }
    },
    [deleteEvent]
  );

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    (): CalendarContextType => ({
      // Library management
      selectedLibrary,
      switchLibrary,

      // View management
      currentView,
      switchView,

      // Date management
      selectedDate,
      navigateToDate,

      // Theme management
      theme,
      switchTheme,

      // Event management
      events,
      onEventCreate: handleEventCreate,
      onEventUpdate: handleEventUpdate,
      onEventDelete: handleEventDelete,
      loading,

      // Sync management
      syncStatus,
      syncCalendar,
      providers,
    }),
    [
      selectedLibrary,
      switchLibrary,
      currentView,
      switchView,
      selectedDate,
      navigateToDate,
      theme,
      switchTheme,
      events,
      handleEventCreate,
      handleEventUpdate,
      handleEventDelete,
      loading,
      syncStatus,
      syncCalendar,
      providers,
    ]
  );

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
}

export function useCalendarProvider(): CalendarContextType {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarProvider must be used within a CalendarProvider');
  }
  return context;
}
