import type { Event, FilterState } from '@/types/calendar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineEvents } from './useIndexedDB';

interface CalendarRange {
  from: Date;
  to: Date;
}

export function useCommandCenterCalendar(year: number, userId = 'default-user') {
  // Use IndexedDB for persistent storage
  const {
    events: dbEvents,
    createEvent: dbCreateEvent,
    updateEvent: dbUpdateEvent,
    deleteEvent: dbDeleteEvent,
    loading: dbLoading,
  } = useOfflineEvents(userId);

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
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // Convert IndexedDB events to calendar Event type and filter by year
  const events = useMemo(() => {
    if (!dbEvents) return [];

    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

    return dbEvents
      .filter((e) => {
        const eventStart = e.startTime;
        const eventEnd = e.endTime || e.startTime;
        // Include events that overlap with this year
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
  }, [dbEvents, year]);

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
    async (event: Partial<Event>) => {
      if (event.id) {
        // Update existing event in IndexedDB
        const dbEvent = dbEvents?.find((e) => e.convexId === event.id || String(e.id) === event.id);
        if (dbEvent?.id) {
          await dbUpdateEvent(dbEvent.id, {
            title: event.title!,
            description: event.description,
            startTime: event.startDate?.getTime(),
            endTime: event.endDate?.getTime(),
            categoryId: event.category,
            location: event.location,
            allDay: event.allDay,
            recurrence: event.recurrence as any,
          });
        }
      } else {
        // Add new event to IndexedDB
        await dbCreateEvent({
          userId,
          title: event.title || '',
          description: event.description,
          startTime: (event.startDate || new Date()).getTime(),
          endTime: (event.endDate || event.startDate || new Date()).getTime(),
          categoryId: event.category || 'personal',
          location: event.location,
          allDay: event.allDay,
          recurrence: event.recurrence as any,
          syncStatus: 'local',
          lastModified: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    },
    [dbEvents, dbCreateEvent, dbUpdateEvent, userId]
  );

  const handleEventDelete = useCallback(
    async (id: string) => {
      const dbEvent = dbEvents?.find((e) => e.convexId === id || String(e.id) === id);
      if (dbEvent?.id) {
        await dbDeleteEvent(dbEvent.id);
      }
    },
    [dbEvents, dbDeleteEvent]
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

  const startSelection = useCallback((date: Date) => {
    setIsSelecting(true);
    setSelectionStart(date);
    setSelectedDate(null);
    setSelectedRange(null);
  }, []);

  const updateSelection = useCallback(
    (date: Date) => {
      if (isSelecting && selectionStart) {
        setSelectedRange({
          from: selectionStart < date ? selectionStart : date,
          to: selectionStart > date ? selectionStart : date,
        });
      }
    },
    [isSelecting, selectionStart]
  );

  const endSelection = useCallback(() => {
    if (isSelecting && selectedRange) {
      setIsSelecting(false);
      setSelectionStart(null);
      setCurrentEvent(null);
      setShowEventModal(true);
    }
  }, [isSelecting, selectedRange]);

  const scrollToToday = useCallback(
    (scrollArea: HTMLDivElement | null) => {
      if (!scrollArea) return;

      const today = new Date();
      const monthIndex = today.getMonth();
      const dayOfMonth = today.getDate();

      // Calculate approximate scroll position
      const cellWidth = viewMode === 'compact' ? 30 : 40;
      let scrollPosition = 0;

      // Add up days from previous months
      for (let i = 0; i < monthIndex; i++) {
        const daysInMonth = new Date(year, i + 1, 0).getDate();
        scrollPosition += daysInMonth * cellWidth;
      }

      // Add days from current month
      scrollPosition += (dayOfMonth - 15) * cellWidth; // Center the current day

      // Find the scroll container and scroll
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollLeft = Math.max(0, scrollPosition);
      }
    },
    [year, viewMode]
  );

  const checkForOverlaps = useCallback(
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

  return {
    events,
    filters,
    selectedDate,
    selectedRange,
    hoveredDate,
    isSelecting,
    selectionStart,
    viewMode,
    showEventModal,
    showReflectionModal,
    currentEvent,
    handleDateSelect,
    handleRangeSelect,
    handleEventSave,
    handleEventDelete,
    handleFilterChange,
    setHoveredDate,
    setShowEventModal,
    setShowReflectionModal,
    setCurrentEvent,
    startSelection,
    updateSelection,
    endSelection,
    scrollToToday,
    checkForOverlaps,
    loading: dbLoading,
  };
}

// Generate sample events for demonstration
function generateSampleEvents(year: number): Event[] {
  return [
    {
      id: '1',
      title: 'New Year Planning',
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 0, 5),
      category: 'personal',
      description: 'Annual goal setting and planning',
    },
    {
      id: '2',
      title: 'Q1 Sprint',
      startDate: new Date(year, 0, 8),
      endDate: new Date(year, 0, 26),
      category: 'work',
      description: 'First quarter development sprint',
    },
    {
      id: '3',
      title: 'Fitness Challenge',
      startDate: new Date(year, 0, 15),
      endDate: new Date(year, 1, 15),
      category: 'effort',
      description: '30-day fitness transformation',
    },
    {
      id: '4',
      title: 'Conference',
      startDate: new Date(year, 2, 10),
      endDate: new Date(year, 2, 12),
      category: 'work',
      description: 'Annual tech conference',
    },
    {
      id: '5',
      title: 'Vacation',
      startDate: new Date(year, 5, 15),
      endDate: new Date(year, 5, 25),
      category: 'personal',
      description: 'Summer vacation',
    },
    {
      id: '6',
      title: 'Product Launch',
      startDate: new Date(year, 8, 1),
      endDate: new Date(year, 8, 3),
      category: 'work',
      description: 'Major product release',
    },
    {
      id: '7',
      title: 'Learning Sprint',
      startDate: new Date(year, 9, 10),
      endDate: new Date(year, 9, 20),
      category: 'effort',
      description: 'Intensive learning period',
    },
    {
      id: '8',
      title: 'Year Review',
      startDate: new Date(year, 11, 26),
      endDate: new Date(year, 11, 31),
      category: 'note',
      description: 'Annual review and reflection',
    },
  ];
}
