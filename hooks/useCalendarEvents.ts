import { useCalendarContext } from '@/contexts/CalendarContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import type { Event } from '@/types/calendar';
import { useCallback, useMemo, useState } from 'react';
import { useOfflineEvents } from './useIndexedDB';

interface UseCalendarEventsOptions {
  userId?: string;
  enableOptimisticUpdates?: boolean;
  enableConflictDetection?: boolean;
}

interface EventConflict {
  event: Event;
  conflictingEvents: Event[];
  severity: 'minor' | 'major' | 'blocking';
}

export function useCalendarEvents(options: UseCalendarEventsOptions = {}) {
  const {
    userId = 'default-user',
    enableOptimisticUpdates = true,
    enableConflictDetection = true,
  } = options;
  const { state } = useCalendarContext();
  const { playSound } = useSettingsContext();
  const {
    events: dbEvents,
    createEvent: dbCreateEvent,
    updateEvent: dbUpdateEvent,
    deleteEvent: dbDeleteEvent,
    loading,
  } = useOfflineEvents(userId);

  // Optimistic state for immediate UI updates
  const [optimisticEvents, setOptimisticEvents] = useState<Map<string, Event>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Convert IndexedDB events to calendar events and merge with optimistic updates
  const events = useMemo(() => {
    if (!dbEvents) return [];

    const yearEnd = new Date(state.year, 11, 31, 23, 59, 59).getTime();

    // Base events from database
    let calendarEvents = dbEvents
      .filter((e) => {
        const eventStart = e.startTime;
        const eventEnd = e.endTime || e.startTime;
        return eventStart <= yearEnd && eventEnd >= yearStart;
      })
      .map((e) => ({
        id: e.convexId || String(e.id),
        title: e.title,
        startDate: new Date(e.startTime),
        endDate: e.endTime ? new Date(e.endTime) : new Date(e.startTime),
        category: (e.categoryId || 'personal') as any,
        description: e.description,
        location: e.location,
        allDay: e.allDay,
        recurrence: e.recurrence,
      }));

    // Apply optimistic updates
    if (enableOptimisticUpdates && optimisticEvents.size > 0) {
      const optimisticMap = new Map(calendarEvents.map((e) => [e.id, e]));

      // Apply optimistic updates
      optimisticEvents.forEach((optimisticEvent, id) => {
        optimisticMap.set(id, optimisticEvent);
      });

      calendarEvents = Array.from(optimisticMap.values());
    }

    return calendarEvents;
  }, [dbEvents, state.year, optimisticEvents, enableOptimisticUpdates]);

  // Conflict detection
  const conflicts = useMemo(() => {
    if (!enableConflictDetection) return [];

    const eventConflicts: EventConflict[] = [];

    events.forEach((event) => {
      const conflictingEvents = events.filter((other) => {
        if (other.id === event.id) return false;

        // Check for time overlap
        const eventStart = event.startDate.getTime();
        const eventEnd = event.endDate.getTime();
        const otherStart = other.startDate.getTime();
        const otherEnd = other.endDate.getTime();

        return eventStart < otherEnd && eventEnd > otherStart;
      });

      if (conflictingEvents.length > 0) {
        // Determine severity based on overlap amount
        const overlapDuration = conflictingEvents.reduce((max, other) => {
          const overlapStart = Math.max(event.startDate.getTime(), other.startDate.getTime());
          const overlapEnd = Math.min(event.endDate.getTime(), other.endDate.getTime());
          return Math.max(max, overlapEnd - overlapStart);
        }, 0);

        const eventDuration = event.endDate.getTime() - event.startDate.getTime();
        const overlapRatio = overlapDuration / eventDuration;

        let severity: 'minor' | 'major' | 'blocking' = 'minor';
        if (overlapRatio > 0.8) severity = 'blocking';
        else if (overlapRatio > 0.5) severity = 'major';

        eventConflicts.push({ event, conflictingEvents, severity });
      }
    });

    return eventConflicts;
  }, [events, enableConflictDetection]);

  // Create event with optimistic update
  const createEvent = useCallback(
    async (eventData: Partial<Event>) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticEvent: Event = {
        id: tempId,
        title: eventData.title || 'New Event',
        startDate: eventData.startDate || new Date(),
        endDate: eventData.endDate || eventData.startDate || new Date(),
        category: eventData.category || 'personal',
        description: eventData.description,
        location: eventData.location,
        allDay: eventData.allDay,
        recurrence: eventData.recurrence,
      };

      try {
        // Optimistic update
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => new Map(prev).set(tempId, optimisticEvent));
          setPendingOperations((prev) => new Set(prev).add(tempId));
        }

        // Database operation
        const dbEventData = {
          userId,
          title: optimisticEvent.title,
          description: optimisticEvent.description,
          startTime: optimisticEvent.startDate.getTime(),
          endTime: optimisticEvent.endDate.getTime(),
          categoryId: optimisticEvent.category,
          location: optimisticEvent.location,
          allDay: optimisticEvent.allDay,
          recurrence: optimisticEvent.recurrence as any,
          syncStatus: 'local' as const,
          lastModified: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await dbCreateEvent(dbEventData);

        // Play success sound
        playSound('success');

        // Clean up optimistic state
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(tempId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
          });
        }

        return optimisticEvent;
      } catch (error) {
        // Play error sound
        playSound('error');

        // Rollback optimistic update on error
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(tempId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
          });
        }
        throw error;
      }
    },
    [userId, dbCreateEvent, enableOptimisticUpdates, playSound]
  );

  // Update event with optimistic update
  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<Event>) => {
      const existingEvent = events.find((e) => e.id === eventId);
      if (!existingEvent) throw new Error('Event not found');

      const optimisticEvent = { ...existingEvent, ...updates };

      try {
        // Optimistic update
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => new Map(prev).set(eventId, optimisticEvent));
          setPendingOperations((prev) => new Set(prev).add(eventId));
        }

        // Find database event
        const dbEvent = dbEvents?.find((e) => e.convexId === eventId || String(e.id) === eventId);
        if (!dbEvent?.id) throw new Error('Database event not found');

        // Database operation
        await dbUpdateEvent(dbEvent.id, {
          title: optimisticEvent.title,
          description: optimisticEvent.description,
          startTime: optimisticEvent.startDate.getTime(),
          endTime: optimisticEvent.endDate.getTime(),
          categoryId: optimisticEvent.category,
          location: optimisticEvent.location,
          allDay: optimisticEvent.allDay,
          recurrence: optimisticEvent.recurrence as any,
          updatedAt: Date.now(),
        });

        // Play success sound
        playSound('success');

        // Clean up optimistic state
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(eventId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        }

        return optimisticEvent;
      } catch (error) {
        // Play error sound
        playSound('error');

        // Rollback optimistic update on error
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(eventId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        }
        throw error;
      }
    },
    [events, dbEvents, dbUpdateEvent, enableOptimisticUpdates, playSound]
  );

  // Delete event with optimistic update
  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        // Optimistic update (remove from display)
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            // Remove the event entirely for proper optimistic deletion
            next.delete(eventId);
            return next;
          });
          setPendingOperations((prev) => new Set(prev).add(eventId));
        }

        // Find database event
        const dbEvent = dbEvents?.find((e) => e.convexId === eventId || String(e.id) === eventId);
        if (!dbEvent?.id) throw new Error('Database event not found');

        // Database operation
        await dbDeleteEvent(dbEvent.id);

        // Play success sound
        playSound('success');

        // Clean up optimistic state
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(eventId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        }
      } catch (error) {
        // Play error sound
        playSound('error');

        // Rollback optimistic update on error
        if (enableOptimisticUpdates) {
          setOptimisticEvents((prev) => {
            const next = new Map(prev);
            next.delete(eventId);
            return next;
          });
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        }
        throw error;
      }
    },
    [events, dbEvents, dbDeleteEvent, enableOptimisticUpdates, playSound]
  );

  // Check for overlapping events
  const checkOverlaps = useCallback(
    (start: Date, end: Date, excludeId?: string) => {
      return events.filter((event) => {
        if (excludeId && event.id === excludeId) return false;

        // Check if the date ranges overlap
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        return (start <= eventEnd && end >= eventStart) || (eventStart <= end && eventEnd >= start);
      });
    },
    [events]
  );

  // Get events for specific date range
  const getEventsInRange = useCallback(
    (start: Date, end: Date) => {
      return events.filter((event) => {
        const eventStart = event.startDate.getTime();
        const eventEnd = event.endDate.getTime();
        const rangeStart = start.getTime();
        const rangeEnd = end.getTime();

        return eventStart <= rangeEnd && eventEnd >= rangeStart;
      });
    },
    [events]
  );

  // Smart scheduling suggestion
  const suggestAvailableSlot = useCallback(
    (duration: number, preferredStart?: Date, maxDays = 30) => {
      const initialStart = preferredStart || new Date();

      // Prevent infinite recursion with a maximum search limit
      for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
        const currentDay = new Date(initialStart);
        currentDay.setDate(currentDay.getDate() + dayOffset);

        const dayStart = new Date(currentDay);
        dayStart.setHours(9, 0, 0, 0); // 9 AM start
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(17, 0, 0, 0); // 5 PM end

        // Get events for the day
        const dayEvents = getEventsInRange(dayStart, dayEnd).sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
        );

        // Find gaps between events
        let currentTime = dayStart.getTime();

        for (const event of dayEvents) {
          const gap = event.startDate.getTime() - currentTime;
          if (gap >= duration) {
            return {
              start: new Date(currentTime),
              end: new Date(currentTime + duration),
            };
          }
          currentTime = Math.max(currentTime, event.endDate.getTime());
        }

        // Check if there's space at the end of the day
        const remainingTime = dayEnd.getTime() - currentTime;
        if (remainingTime >= duration) {
          return {
            start: new Date(currentTime),
            end: new Date(currentTime + duration),
          };
        }
      }

      // No slot found within the search window
      console.warn(`No available slot found within ${maxDays} days for duration ${duration}ms`);
      return null;
    },
    [getEventsInRange]
  );

  return {
    // Data
    events,
    conflicts,
    loading: loading || pendingOperations.size > 0,
    pendingOperations: Array.from(pendingOperations),

    // Operations
    createEvent,
    updateEvent,
    deleteEvent,

    // Utilities
    checkOverlaps,
    getEventsInRange,
    suggestAvailableSlot,

    // State
    isOptimistic: (eventId: string) => optimisticEvents.has(eventId),
    isPending: (eventId: string) => pendingOperations.has(eventId),
  };
}
