/**
 * React hooks for real-time Convex subscriptions
 * These hooks provide real-time data updates throughout the application
 */

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

/**
 * Subscribe to events within a date range
 * Automatically updates when events change
 */
export function useRealtimeEvents(
  userId: Id<'users'> | undefined,
  startTime: number,
  endTime: number,
  includeRecurring = false
) {
  const events = useQuery(
    api.subscriptions.subscribeToEvents,
    userId
      ? {
          userId,
          startTime,
          endTime,
          includeRecurring,
        }
      : 'skip'
  );

  return {
    events: events || [],
    isLoading: events === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to a specific event
 * Updates when the event is modified
 */
export function useRealtimeEvent(eventId: Id<'events'> | undefined) {
  const event = useQuery(api.subscriptions.subscribeToEvent, eventId ? { eventId } : 'skip');

  return {
    event,
    isLoading: event === undefined && eventId !== undefined,
  };
}

/**
 * Subscribe to sync status updates
 * Shows real-time sync progress
 */
export function useRealtimeSyncStatus(userId: Id<'users'> | undefined) {
  const syncStatus = useQuery(
    api.subscriptions.subscribeToSyncStatus,
    userId ? { userId } : 'skip'
  );

  const isSyncing = useMemo(() => {
    if (!syncStatus) return false;
    return syncStatus.totalProcessing > 0;
  }, [syncStatus]);

  const hasPendingSync = useMemo(() => {
    if (!syncStatus) return false;
    return syncStatus.totalPending > 0;
  }, [syncStatus]);

  return {
    syncStatus,
    isSyncing,
    hasPendingSync,
    isLoading: syncStatus === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to conflict updates
 * Notifies about sync conflicts needing resolution
 */
export function useRealtimeConflicts(userId: Id<'users'> | undefined) {
  const conflictData = useQuery(
    api.subscriptions.subscribeToConflicts,
    userId ? { userId } : 'skip'
  );

  return {
    conflicts: conflictData?.conflicts || [],
    hasConflicts: conflictData?.hasConflicts || false,
    totalConflicts: conflictData?.totalConflicts || 0,
    isLoading: conflictData === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to user preferences
 * Updates when settings change
 */
export function useRealtimeUserPreferences(userId: Id<'users'> | undefined) {
  const preferences = useQuery(
    api.subscriptions.subscribeToUserPreferences,
    userId ? { userId } : 'skip'
  );

  return {
    preferences: preferences?.preferences,
    userInfo: preferences
      ? {
          email: preferences.email,
          firstName: preferences.firstName,
          lastName: preferences.lastName,
        }
      : null,
    isLoading: preferences === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to categories
 * Updates when categories change
 */
export function useRealtimeCategories(userId: Id<'users'> | undefined) {
  const categories = useQuery(
    api.subscriptions.subscribeToCategories,
    userId ? { userId } : 'skip'
  );

  const categoriesById = useMemo(() => {
    if (!categories) return {};
    return categories.reduce(
      (acc, cat) => {
        acc[cat._id] = cat;
        return acc;
      },
      {} as Record<string, (typeof categories)[0]>
    );
  }, [categories]);

  return {
    categories: categories || [],
    categoriesById,
    isLoading: categories === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to calendars
 * Updates when calendars change
 */
export function useRealtimeCalendars(userId: Id<'users'> | undefined) {
  const calendars = useQuery(api.subscriptions.subscribeToCalendars, userId ? { userId } : 'skip');

  const defaultCalendar = useMemo(() => {
    if (!calendars) return null;
    return calendars.find((cal) => cal.isDefault) || calendars[0] || null;
  }, [calendars]);

  return {
    calendars: calendars || [],
    defaultCalendar,
    isLoading: calendars === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to recent activity
 * Shows recent changes and sync activities
 */
export function useRealtimeActivity(userId: Id<'users'> | undefined, limit = 20) {
  const activity = useQuery(
    api.subscriptions.subscribeToRecentActivity,
    userId ? { userId, limit } : 'skip'
  );

  return {
    activities: activity || [],
    isLoading: activity === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to upcoming reminders
 * For notification systems
 */
export function useRealtimeReminders(userId: Id<'users'> | undefined, windowMinutes = 60) {
  const reminderData = useQuery(
    api.subscriptions.subscribeToUpcomingReminders,
    userId ? { userId, windowMinutes } : 'skip'
  );

  const hasUpcomingReminders = useMemo(() => {
    return (reminderData?.totalUpcoming || 0) > 0;
  }, [reminderData]);

  const nextReminder = useMemo(() => {
    return reminderData?.nextReminder || null;
  }, [reminderData]);

  return {
    reminders: reminderData?.reminders || [],
    nextReminder,
    hasUpcomingReminders,
    totalUpcoming: reminderData?.totalUpcoming || 0,
    isLoading: reminderData === undefined && userId !== undefined,
  };
}

/**
 * Subscribe to shared calendars
 * For collaborative features
 */
export function useRealtimeSharedCalendars(userId: Id<'users'> | undefined) {
  const sharedCalendars = useQuery(
    api.subscriptions.subscribeToSharedCalendars,
    userId ? { userId } : 'skip'
  );

  return {
    sharedCalendars: sharedCalendars || [],
    hasSharedCalendars: (sharedCalendars?.length || 0) > 0,
    isLoading: sharedCalendars === undefined && userId !== undefined,
  };
}

/**
 * Combined hook for all calendar-related subscriptions
 * Useful for dashboard or main calendar views
 */
export function useRealtimeCalendarData(
  userId: Id<'users'> | undefined,
  startTime: number,
  endTime: number
) {
  const events = useRealtimeEvents(userId, startTime, endTime, true);
  const categories = useRealtimeCategories(userId);
  const calendars = useRealtimeCalendars(userId);
  const syncStatus = useRealtimeSyncStatus(userId);
  const conflicts = useRealtimeConflicts(userId);
  const preferences = useRealtimeUserPreferences(userId);

  const isLoading =
    events.isLoading ||
    categories.isLoading ||
    calendars.isLoading ||
    syncStatus.isLoading ||
    conflicts.isLoading ||
    preferences.isLoading;

  return {
    events: events.events,
    categories: categories.categories,
    categoriesById: categories.categoriesById,
    calendars: calendars.calendars,
    defaultCalendar: calendars.defaultCalendar,
    syncStatus: syncStatus.syncStatus,
    isSyncing: syncStatus.isSyncing,
    conflicts: conflicts.conflicts,
    hasConflicts: conflicts.hasConflicts,
    preferences: preferences.preferences,
    isLoading,
  };
}

/**
 * Hook for monitoring real-time connection status
 * Useful for showing connection indicators
 */
export function useRealtimeConnectionStatus() {
  // This would integrate with Convex's connection status
  // For now, returning a mock implementation
  return {
    isConnected: true,
    connectionState: 'connected' as const,
    reconnect: () => {
      // Trigger reconnection
      console.log('Reconnecting to Convex...');
    },
  };
}
