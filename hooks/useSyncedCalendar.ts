import { notify } from '@/components/ui/notify';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { Event, FilterState } from '@/types/calendar';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CalendarRange {
  from: Date;
  to: Date;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSync?: Date;
  provider?: string;
  error?: string;
}

interface SyncedEvent extends Event {
  syncStatus?: 'synced' | 'pending' | 'conflict' | 'local';
  providerId?: Id<'calendarProviders'>;
  providerEventId?: string;
  lastSyncedAt?: Date;
}

export function useSyncedCalendar(year: number) {
  const { playSound } = useSettingsContext();
  const [filters, setFilters] = useState<FilterState>({
    personal: true,
    work: true,
    efforts: true,
    notes: true,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<CalendarRange | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SyncedEvent | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isSyncing: false });
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  // Convex queries
  const convexEvents = useQuery(api.events.getEventsByDateRange, {
    startDate: new Date(year, 0, 1).toISOString(),
    endDate: new Date(year, 11, 31, 23, 59, 59).toISOString(),
  });

  const providers = useQuery(api.calendar.providers.getConnectedProviders);
  const syncQueue = useQuery(api.calendar.sync.getSyncQueueStatus);
  const conflicts = useQuery(api.calendar.events.getUnresolvedConflicts);

  // Convex mutations
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const scheduleSync = useMutation(api.calendar.sync.scheduleSync);
  const resolveConflict = useMutation(api.calendar.events.resolveSyncConflict);

  // Convert Convex events to the expected format
  const events = useMemo<SyncedEvent[]>(() => {
    if (!convexEvents) return [];

    return convexEvents.map((event) => ({
      id: event._id,
      title: event.title,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      category: event.category as 'personal' | 'work' | 'effort' | 'note',
      description: event.description,
      // Sync-specific fields
      syncStatus: event.syncStatus as 'synced' | 'pending' | 'conflict' | 'local' | undefined,
      providerId: event.providerId,
      providerEventId: event.providerEventId,
      lastSyncedAt: event.lastSyncedAt ? new Date(event.lastSyncedAt) : undefined,
    }));
  }, [convexEvents]);

  // Update sync status based on queue
  useEffect(() => {
    if (syncQueue) {
      const isProcessing = syncQueue.processing > 0 || syncQueue.pending > 0;
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: isProcessing,
        lastSync: syncQueue.items?.[0]?.completedAt
          ? new Date(syncQueue.items[0].completedAt)
          : prev.lastSync,
      }));
    }
  }, [syncQueue]);

  // Check for conflicts
  useEffect(() => {
    if (conflicts && conflicts.length > 0) {
      const firstConflict = conflicts[0];
      setCurrentConflict(firstConflict);
      setShowConflictModal(true);
    }
  }, [conflicts]);

  // Trigger sync for all providers
  const triggerSync = useCallback(
    async (provider?: string) => {
      try {
        if (provider) {
          await scheduleSync({
            provider,
            operation: 'incremental_sync',
            priority: 5,
          });
          notify.info(`Syncing ${provider} calendar...`);
          playSound('notification');
        } else if (providers) {
          // Sync all providers
          for (const p of providers) {
            await scheduleSync({
              provider: p.provider,
              operation: 'incremental_sync',
              priority: 5,
            });
          }
          notify.info('Syncing all calendars...');
          playSound('notification');
        }
      } catch (error) {
        console.error('Sync error:', error);
        notify.error('Failed to start sync');
        playSound('error');
      }
    },
    [providers, scheduleSync, playSound]
  );

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedRange(null);
    setCurrentEvent(null);
    setShowEventModal(true);
  }, []);

  const handleRangeSelect = useCallback((range: CalendarRange) => {
    setSelectedRange(range);
    setSelectedDate(null);
    setCurrentEvent(null);
    setShowEventModal(true);
  }, []);

  const handleEventSave = useCallback(
    async (event: Partial<SyncedEvent>) => {
      try {
        if (event.id) {
          // Update existing event
          await updateEvent({
            id: event.id as Id<'events'>,
            title: event.title,
            description: event.description,
            startDate: event.startDate?.toISOString(),
            endDate: event.endDate?.toISOString(),
            category: event.category,
          });
          notify.success('Event updated');
          playSound('success');

          // Trigger sync if event is synced
          if (event.providerId) {
            const provider = providers?.find((p) => p._id === event.providerId);
            if (provider) {
              await scheduleSync({
                provider: provider.provider,
                operation: 'event_update',
                priority: 10,
                data: { eventId: event.id },
              });
            }
          }
        } else {
          // Add new event
          await createEvent({
            title: event.title || '',
            startDate: event.startDate?.toISOString() || new Date().toISOString(),
            endDate: event.endDate?.toISOString() || new Date().toISOString(),
            category: event.category || 'personal',
            description: event.description,
          });
          notify.success('Event created');
          playSound('success');

          // Trigger sync for new events
          if (providers && providers.length > 0) {
            await scheduleSync({
              provider: providers[0].provider,
              operation: 'event_create',
              priority: 10,
            });
          }
        }
      } catch (error) {
        console.error('Error saving event:', error);
        notify.error('Failed to save event');
        playSound('error');
      }
    },
    [createEvent, updateEvent, providers, scheduleSync, playSound]
  );

  const handleEventDelete = useCallback(
    async (id: string) => {
      try {
        const event = events.find((e) => e.id === id);

        await deleteEvent({ id: id as Id<'events'> });
        notify.success('Event deleted');
        playSound('success');

        // Trigger sync if event was synced
        if (event?.providerId) {
          const provider = providers?.find((p) => p._id === event.providerId);
          if (provider) {
            await scheduleSync({
              provider: provider.provider,
              operation: 'event_delete',
              priority: 10,
              data: { eventId: id, providerEventId: event.providerEventId },
            });
          }
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        notify.error('Failed to delete event');
        playSound('error');
      }
    },
    [deleteEvent, events, providers, scheduleSync, playSound]
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterState | { viewOptions: { compactMode: boolean } }) => {
      if ('viewOptions' in newFilters && newFilters.viewOptions) {
        setViewMode(newFilters.viewOptions.compactMode ? 'compact' : 'full');
      }
      if ('personal' in newFilters) {
        setFilters(newFilters as FilterState);
      }
    },
    []
  );

  const handleConflictResolved = useCallback(() => {
    setShowConflictModal(false);
    setCurrentConflict(null);
    notify.success('Conflict resolved');
    playSound('success');
  }, [playSound]);

  const startSelection = useCallback((date: Date) => {
    setIsSelecting(true);
    setSelectionStart(date);
    setHoveredDate(date);
  }, []);

  const updateSelection = useCallback(
    (date: Date) => {
      if (isSelecting && selectionStart) {
        setHoveredDate(date);
      }
    },
    [isSelecting, selectionStart]
  );

  const endSelection = useCallback(
    (date: Date) => {
      if (isSelecting && selectionStart) {
        const start = selectionStart < date ? selectionStart : date;
        const end = selectionStart < date ? date : selectionStart;
        handleRangeSelect({ from: start, to: end });
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setHoveredDate(null);
    },
    [isSelecting, selectionStart, handleRangeSelect]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const categoryMap: Record<string, keyof FilterState> = {
        personal: 'personal',
        work: 'work',
        effort: 'efforts',
        note: 'notes',
      };
      const filterKey = categoryMap[event.category];
      return filters[filterKey];
    });
  }, [events, filters]);

  return {
    // Event data
    events: filteredEvents,
    allEvents: events,
    filters,

    // Selection state
    selectedDate,
    selectedRange,
    hoveredDate,
    isSelecting,
    selectionStart,

    // UI state
    viewMode,
    showEventModal,
    showReflectionModal,
    currentEvent,
    showConflictModal,
    currentConflict,

    // Sync state
    syncStatus,
    providers,
    syncQueue,
    conflicts,

    // Actions
    handleDateSelect,
    handleRangeSelect,
    handleEventSave,
    handleEventDelete,
    handleFilterChange,
    setShowEventModal,
    setShowReflectionModal,
    setCurrentEvent,
    startSelection,
    updateSelection,
    endSelection,
    triggerSync,
    setShowConflictModal,
    handleConflictResolved,
    resolveConflict,
  };
}
