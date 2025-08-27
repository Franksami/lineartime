'use client';

import type { Event } from '@/types/calendar';
import type React from 'react';
import { type ReactNode, createContext, useCallback, useContext, useReducer } from 'react';

/**
 * Events Context - Manages event CRUD operations, filtering, and sync state
 * Centralizes all event-related operations and state management
 */

export interface EventFilter {
  categories: string[];
  dateRange: { start: Date; end: Date } | null;
  search: string;
  completed: boolean | 'all';
  providers: string[];
}

export interface SyncStatus {
  isSync: boolean;
  lastSync: Date | null;
  provider: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error?: string;
}

export interface EventsState {
  // Event Storage
  events: Event[];
  selectedEventId: string | null;

  // CRUD Operations State
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  // Filtering
  filters: EventFilter;
  filteredEvents: Event[];
  searchQuery: string;

  // Sync State
  syncStatus: {
    google: SyncStatus;
    microsoft: SyncStatus;
    apple: SyncStatus;
    generic: SyncStatus;
  };

  // Conflict Resolution
  conflicts: Array<{
    id: string;
    eventId: string;
    type: 'time' | 'duplicate' | 'provider';
    description: string;
    resolved: boolean;
  }>;

  // Bulk Operations
  selectedEventIds: string[];
  bulkOperation: {
    type: 'delete' | 'update' | 'export' | null;
    progress: number;
    total: number;
  };

  // Performance Optimizations
  virtualization: {
    enabled: boolean;
    visibleRange: { start: number; end: number };
    itemHeight: number;
  };

  // Event Statistics
  stats: {
    total: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, number>;
    completionRate: number;
  };
}

export type EventsAction =
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<Event> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'SET_UPDATING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<EventFilter> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'APPLY_FILTERS' }
  | {
      type: 'UPDATE_SYNC_STATUS';
      payload: { provider: keyof EventsState['syncStatus']; status: Partial<SyncStatus> };
    }
  | { type: 'ADD_CONFLICT'; payload: EventsState['conflicts'][0] }
  | { type: 'RESOLVE_CONFLICT'; payload: string }
  | { type: 'SET_SELECTED_EVENT_IDS'; payload: string[] }
  | { type: 'START_BULK_OPERATION'; payload: EventsState['bulkOperation'] }
  | { type: 'UPDATE_BULK_PROGRESS'; payload: { progress: number; total: number } }
  | { type: 'END_BULK_OPERATION' }
  | { type: 'SET_VIRTUALIZATION'; payload: Partial<EventsState['virtualization']> }
  | { type: 'UPDATE_STATS' }
  | { type: 'BATCH_UPDATE'; payload: Partial<EventsState> };

const initialEventFilter: EventFilter = {
  categories: [],
  dateRange: null,
  search: '',
  completed: 'all',
  providers: [],
};

const initialSyncStatus: SyncStatus = {
  isSync: false,
  lastSync: null,
  provider: '',
  status: 'idle',
};

const initialEventsState: EventsState = {
  events: [],
  selectedEventId: null,

  creating: false,
  updating: false,
  deleting: false,

  filters: initialEventFilter,
  filteredEvents: [],
  searchQuery: '',

  syncStatus: {
    google: { ...initialSyncStatus, provider: 'google' },
    microsoft: { ...initialSyncStatus, provider: 'microsoft' },
    apple: { ...initialSyncStatus, provider: 'apple' },
    generic: { ...initialSyncStatus, provider: 'generic' },
  },

  conflicts: [],

  selectedEventIds: [],
  bulkOperation: {
    type: null,
    progress: 0,
    total: 0,
  },

  virtualization: {
    enabled: false,
    visibleRange: { start: 0, end: 100 },
    itemHeight: 60,
  },

  stats: {
    total: 0,
    byCategory: {},
    byMonth: {},
    completionRate: 0,
  },
};

// Helper functions for filtering and stats
function applyFilters(events: Event[], filters: EventFilter, searchQuery: string): Event[] {
  let filtered = [...events];

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((event) =>
      filters.categories.includes(event.category || 'personal')
    );
  }

  // Date range filter
  if (filters.dateRange) {
    filtered = filtered.filter(
      (event) =>
        event.startDate >= filters.dateRange?.start && event.startDate <= filters.dateRange?.end
    );
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
    );
  }

  // Provider filter
  if (filters.providers.length > 0) {
    filtered = filtered.filter((event) => filters.providers.includes(event.provider || 'local'));
  }

  return filtered;
}

function calculateStats(events: Event[]): EventsState['stats'] {
  const stats: EventsState['stats'] = {
    total: events.length,
    byCategory: {},
    byMonth: {},
    completionRate: 0,
  };

  events.forEach((event) => {
    // Category stats
    const category = event.category || 'personal';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Month stats
    const month = event.startDate.toISOString().slice(0, 7); // YYYY-MM
    stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
  });

  // Completion rate (for events with completion status)
  const completableEvents = events.filter((event) => event.completed !== undefined);
  if (completableEvents.length > 0) {
    const completedEvents = completableEvents.filter((event) => event.completed);
    stats.completionRate = completedEvents.length / completableEvents.length;
  }

  return stats;
}

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'SET_EVENTS': {
      const filteredEvents = applyFilters(action.payload, state.filters, state.searchQuery);
      const stats = calculateStats(action.payload);
      return {
        ...state,
        events: action.payload,
        filteredEvents,
        stats,
      };
    }

    case 'ADD_EVENT': {
      const newEvents = [...state.events, action.payload];
      const filteredEvents = applyFilters(newEvents, state.filters, state.searchQuery);
      const stats = calculateStats(newEvents);
      return {
        ...state,
        events: newEvents,
        filteredEvents,
        stats,
      };
    }

    case 'UPDATE_EVENT': {
      const updatedEvents = state.events.map((event) =>
        event.id === action.payload.id ? { ...event, ...action.payload.updates } : event
      );
      const filteredEvents = applyFilters(updatedEvents, state.filters, state.searchQuery);
      const stats = calculateStats(updatedEvents);
      return {
        ...state,
        events: updatedEvents,
        filteredEvents,
        stats,
      };
    }

    case 'DELETE_EVENT': {
      const filteredEvents = state.events.filter((event) => event.id !== action.payload);
      const filtered = applyFilters(filteredEvents, state.filters, state.searchQuery);
      const stats = calculateStats(filteredEvents);
      return {
        ...state,
        events: filteredEvents,
        filteredEvents: filtered,
        stats,
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
      };
    }

    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload };

    case 'SET_CREATING':
      return { ...state, creating: action.payload };

    case 'SET_UPDATING':
      return { ...state, updating: action.payload };

    case 'SET_DELETING':
      return { ...state, deleting: action.payload };

    case 'SET_FILTERS': {
      const newFilters = { ...state.filters, ...action.payload };
      const filteredEvents = applyFilters(state.events, newFilters, state.searchQuery);
      return {
        ...state,
        filters: newFilters,
        filteredEvents,
      };
    }

    case 'SET_SEARCH_QUERY': {
      const filteredEvents = applyFilters(state.events, state.filters, action.payload);
      return {
        ...state,
        searchQuery: action.payload,
        filteredEvents,
      };
    }

    case 'APPLY_FILTERS': {
      const filteredEvents = applyFilters(state.events, state.filters, state.searchQuery);
      return {
        ...state,
        filteredEvents,
      };
    }

    case 'UPDATE_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.payload.provider]: {
            ...state.syncStatus[action.payload.provider],
            ...action.payload.status,
          },
        },
      };

    case 'ADD_CONFLICT':
      return {
        ...state,
        conflicts: [...state.conflicts, action.payload],
      };

    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.map((conflict) =>
          conflict.id === action.payload ? { ...conflict, resolved: true } : conflict
        ),
      };

    case 'SET_SELECTED_EVENT_IDS':
      return { ...state, selectedEventIds: action.payload };

    case 'START_BULK_OPERATION':
      return { ...state, bulkOperation: action.payload };

    case 'UPDATE_BULK_PROGRESS':
      return {
        ...state,
        bulkOperation: {
          ...state.bulkOperation,
          progress: action.payload.progress,
          total: action.payload.total,
        },
      };

    case 'END_BULK_OPERATION':
      return {
        ...state,
        bulkOperation: {
          type: null,
          progress: 0,
          total: 0,
        },
      };

    case 'SET_VIRTUALIZATION':
      return {
        ...state,
        virtualization: {
          ...state.virtualization,
          ...action.payload,
        },
      };

    case 'UPDATE_STATS': {
      const stats = calculateStats(state.events);
      return { ...state, stats };
    }

    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export interface EventsContextValue {
  state: EventsState;
  dispatch: React.Dispatch<EventsAction>;

  // Event CRUD operations
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  selectEvent: (id: string | null) => void;

  // Filtering & Search
  setFilters: (filters: Partial<EventFilter>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Sync operations
  updateSyncStatus: (
    provider: keyof EventsState['syncStatus'],
    status: Partial<SyncStatus>
  ) => void;

  // Conflict management
  addConflict: (conflict: EventsState['conflicts'][0]) => void;
  resolveConflict: (conflictId: string) => void;

  // Bulk operations
  selectMultipleEvents: (ids: string[]) => void;
  startBulkOperation: (type: EventsState['bulkOperation']['type'], total: number) => void;
  updateBulkProgress: (progress: number, total: number) => void;
  endBulkOperation: () => void;

  // Utility methods
  getEventById: (id: string) => Event | undefined;
  getEventsByCategory: (category: string) => Event[];
  getEventsByDateRange: (start: Date, end: Date) => Event[];
  batchUpdate: (updates: Partial<EventsState>) => void;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export interface EventsProviderProps {
  children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps) {
  const [state, dispatch] = useReducer(eventsReducer, initialEventsState);

  // Event CRUD operations
  const addEvent = useCallback((event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  }, []);

  const selectEvent = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: id });
  }, []);

  // Filtering & Search
  const setFilters = useCallback((filters: Partial<EventFilter>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_FILTERS', payload: initialEventFilter });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
  }, []);

  // Sync operations
  const updateSyncStatus = useCallback(
    (provider: keyof EventsState['syncStatus'], status: Partial<SyncStatus>) => {
      dispatch({ type: 'UPDATE_SYNC_STATUS', payload: { provider, status } });
    },
    []
  );

  // Conflict management
  const addConflict = useCallback((conflict: EventsState['conflicts'][0]) => {
    dispatch({ type: 'ADD_CONFLICT', payload: conflict });
  }, []);

  const resolveConflict = useCallback((conflictId: string) => {
    dispatch({ type: 'RESOLVE_CONFLICT', payload: conflictId });
  }, []);

  // Bulk operations
  const selectMultipleEvents = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_EVENT_IDS', payload: ids });
  }, []);

  const startBulkOperation = useCallback(
    (type: EventsState['bulkOperation']['type'], total: number) => {
      dispatch({ type: 'START_BULK_OPERATION', payload: { type, progress: 0, total } });
    },
    []
  );

  const updateBulkProgress = useCallback((progress: number, total: number) => {
    dispatch({ type: 'UPDATE_BULK_PROGRESS', payload: { progress, total } });
  }, []);

  const endBulkOperation = useCallback(() => {
    dispatch({ type: 'END_BULK_OPERATION' });
  }, []);

  // Utility methods
  const getEventById = useCallback(
    (id: string) => {
      return state.events.find((event) => event.id === id);
    },
    [state.events]
  );

  const getEventsByCategory = useCallback(
    (category: string) => {
      return state.events.filter((event) => event.category === category);
    },
    [state.events]
  );

  const getEventsByDateRange = useCallback(
    (start: Date, end: Date) => {
      return state.events.filter((event) => event.startDate >= start && event.startDate <= end);
    },
    [state.events]
  );

  const batchUpdate = useCallback((updates: Partial<EventsState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates });
  }, []);

  const contextValue: EventsContextValue = {
    state,
    dispatch,
    addEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
    setFilters,
    setSearchQuery,
    clearFilters,
    updateSyncStatus,
    addConflict,
    resolveConflict,
    selectMultipleEvents,
    startBulkOperation,
    updateBulkProgress,
    endBulkOperation,
    getEventById,
    getEventsByCategory,
    getEventsByDateRange,
    batchUpdate,
  };

  return <EventsContext.Provider value={contextValue}>{children}</EventsContext.Provider>;
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEventsContext must be used within an EventsProvider');
  }
  return context;
}

// Specialized hooks for specific event concerns
export function useEventsCRUD() {
  const { addEvent, updateEvent, deleteEvent, selectEvent, state } = useEventsContext();
  return {
    events: state.events,
    selectedEvent: state.selectedEventId
      ? state.events.find((e) => e.id === state.selectedEventId)
      : null,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    addEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
  };
}

export function useEventsFilter() {
  const { state, setFilters, setSearchQuery, clearFilters } = useEventsContext();
  return {
    filters: state.filters,
    filteredEvents: state.filteredEvents,
    searchQuery: state.searchQuery,
    setFilters,
    setSearchQuery,
    clearFilters,
  };
}

export function useEventsSync() {
  const { state, updateSyncStatus } = useEventsContext();
  return {
    syncStatus: state.syncStatus,
    updateSyncStatus,
    isAnySyncing: Object.values(state.syncStatus).some((status) => status.status === 'syncing'),
  };
}

export function useEventsStats() {
  const { state } = useEventsContext();
  return {
    stats: state.stats,
    totalEvents: state.stats.total,
    eventsByCategory: state.stats.byCategory,
    eventsByMonth: state.stats.byMonth,
    completionRate: state.stats.completionRate,
  };
}
