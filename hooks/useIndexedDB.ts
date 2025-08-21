/**
 * React Hooks for IndexedDB Integration
 * Provides easy-to-use hooks for offline storage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, StoredEvent, StoredCategory, StoredCalendar, StoredPreferences } from '@/lib/db/schema';
import { 
  EventOperations, 
  CategoryOperations, 
  CalendarOperations, 
  PreferencesOperations,
  SyncQueueOperations,
  CacheOperations,
  PerformanceMonitor
} from '@/lib/db/operations';
import { OfflineSyncManager, SyncStatus, SyncResult } from '@/lib/db/sync';
import { BackupManager, BackupData } from '@/lib/db/backup';
import { LocalStorageMigration } from '@/lib/db/migration';
import { QueryOptimizer, DatabaseOptimizer } from '@/lib/db/performance';
import { BulkEventOperations } from '@/lib/db/bulk';

/**
 * Hook for managing events with offline support
 */
export function useOfflineEvents(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live query for events
  const events = useLiveQuery(
    () => userId ? db.events
      .where('userId')
      .equals(userId)
      .and(event => !event.isDeleted)
      .toArray() : [],
    [userId]
  );

  // Create event
  const createEvent = useCallback(async (event: Omit<StoredEvent, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await EventOperations.create(event);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update event
  const updateEvent = useCallback(async (id: number, updates: Partial<StoredEvent>) => {
    setLoading(true);
    setError(null);
    try {
      await EventOperations.update(id, {
        ...updates,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (id: number, hard = false) => {
    setLoading(true);
    setError(null);
    try {
      if (hard) {
        await db.events.delete(id);
      } else {
        await EventOperations.softDelete(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get events by date range
  const getEventsByDateRange = useCallback(async (startTime: number, endTime: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await QueryOptimizer.optimizedQuery(
        `events_range_${userId}_${startTime}_${endTime}`,
        () => EventOperations.getByDateRange(userId, startTime, endTime),
        { ttl: 30000 } // Cache for 30 seconds
      );
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get events');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Search events
  const searchEvents = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      return await EventOperations.search(userId, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search events');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Bulk create events
  const bulkCreateEvents = useCallback(async (events: Omit<StoredEvent, 'id'>[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await BulkEventOperations.bulkCreate(events);
      if (result.failed > 0) {
        setError(`${result.failed} events failed to create`);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk create failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDateRange,
    searchEvents,
    bulkCreateEvents,
  };
}

/**
 * Hook for managing categories
 */
export function useOfflineCategories(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live query for categories
  const categories = useLiveQuery(
    () => userId ? CategoryOperations.getByUser(userId) : [],
    [userId]
  );

  // Create category
  const createCategory = useCallback(async (category: Omit<StoredCategory, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      return await CategoryOperations.create(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: number, updates: Partial<StoredCategory>) => {
    setLoading(true);
    setError(null);
    try {
      await CategoryOperations.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: number, reassignTo?: string) => {
    setLoading(true);
    setError(null);
    try {
      await CategoryOperations.delete(id, reassignTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

/**
 * Hook for managing calendars
 */
export function useOfflineCalendars(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live query for calendars
  const calendars = useLiveQuery(
    () => userId ? CalendarOperations.getByUser(userId) : [],
    [userId]
  );

  // Get default calendar
  const defaultCalendar = useLiveQuery(
    () => userId ? CalendarOperations.getDefault(userId) : undefined,
    [userId]
  );

  // Create calendar
  const createCalendar = useCallback(async (calendar: Omit<StoredCalendar, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      return await CalendarOperations.create(calendar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calendar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update calendar
  const updateCalendar = useCallback(async (id: number, updates: Partial<StoredCalendar>) => {
    setLoading(true);
    setError(null);
    try {
      await CalendarOperations.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update calendar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calendars,
    defaultCalendar,
    loading,
    error,
    createCalendar,
    updateCalendar,
  };
}

/**
 * Hook for managing user preferences
 */
export function useOfflinePreferences(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live query for preferences
  const preferences = useLiveQuery(
    () => userId ? PreferencesOperations.get(userId) : undefined,
    [userId]
  );

  // Save preferences
  const savePreferences = useCallback(async (prefs: StoredPreferences) => {
    setLoading(true);
    setError(null);
    try {
      await PreferencesOperations.save(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update specific preferences
  const updatePreferences = useCallback(async (updates: Partial<StoredPreferences>) => {
    setLoading(true);
    setError(null);
    try {
      await PreferencesOperations.update(userId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    preferences: preferences || PreferencesOperations.getDefaults(),
    loading,
    error,
    savePreferences,
    updatePreferences,
  };
}

/**
 * Hook for offline sync management
 */
export function useOfflineSync(userId: string) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const syncManager = useRef(OfflineSyncManager.getInstance());

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncManager.current.onStatusChange(setStatus);

    // Start auto-sync if online
    if (navigator.onLine) {
      syncManager.current.startAutoSync(5); // Sync every 5 minutes
    }

    return () => {
      unsubscribe();
      syncManager.current.stopAutoSync();
    };
  }, []);

  // Manual sync
  const sync = useCallback(async () => {
    const result = await syncManager.current.sync(userId);
    setSyncResult(result);
    if (result.success) {
      setLastSync(Date.now());
    }
    return result;
  }, [userId]);

  // Get sync queue stats
  const syncQueueStats = useLiveQuery(
    () => userId ? SyncQueueOperations.getStats(userId) : null,
    [userId]
  );

  return {
    status,
    lastSync,
    syncResult,
    syncQueueStats,
    sync,
    isOnline: navigator.onLine,
  };
}

/**
 * Hook for backup and restore
 */
export function useBackup(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List backups
  const backups = useLiveQuery(
    () => userId ? BackupManager.listBackups(userId) : [],
    [userId]
  );

  // Create backup
  const createBackup = useCallback(async (options?: {
    compress?: boolean;
    includeDeleted?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const backup = await BackupManager.createBackup(userId, options);
      return backup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Restore backup
  const restoreBackup = useCallback(async (
    backupData: BackupData | string,
    options?: {
      overwrite?: boolean;
      merge?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await BackupManager.restoreBackup(backupData, options);
      if (!result.success) {
        setError(result.errors.join(', '));
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export to file
  const exportToFile = useCallback(async (filename?: string) => {
    setLoading(true);
    setError(null);
    try {
      const backup = await BackupManager.createBackup(userId);
      await BackupManager.exportToFile(backup, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Import from file
  const importFromFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const backup = await BackupManager.importFromFile(file);
      const result = await BackupManager.restoreBackup(backup);
      if (!result.success) {
        setError(result.errors.join(', '));
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    backups,
    loading,
    error,
    createBackup,
    restoreBackup,
    exportToFile,
    importFromFile,
  };
}

/**
 * Hook for database migration
 */
export function useMigration(userId: string) {
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  useEffect(() => {
    // Check if migration is needed
    LocalStorageMigration.isNeeded().then(setMigrationNeeded);
  }, []);

  const migrate = useCallback(async () => {
    setMigrating(true);
    try {
      const result = await LocalStorageMigration.migrate(userId);
      setMigrationResult(result);
      setMigrationNeeded(false);
      return result;
    } catch (err) {
      console.error('Migration failed:', err);
      throw err;
    } finally {
      setMigrating(false);
    }
  }, [userId]);

  return {
    migrationNeeded,
    migrating,
    migrationResult,
    migrate,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMetrics = useCallback(async (operation?: string, limit = 100) => {
    setLoading(true);
    try {
      const data = await PerformanceMonitor.getMetrics(operation, limit);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAverageTime = useCallback(async (operation: string) => {
    return await PerformanceMonitor.getAverageTime(operation);
  }, []);

  const clearOldMetrics = useCallback(async (daysToKeep = 7) => {
    await PerformanceMonitor.clearOld(daysToKeep);
    await loadMetrics();
  }, [loadMetrics]);

  const optimizeDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const result = await DatabaseOptimizer.optimize();
      console.log('Database optimization result:', result);
      return result;
    } catch (err) {
      console.error('Database optimization failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    loading,
    loadMetrics,
    getAverageTime,
    clearOldMetrics,
    optimizeDatabase,
  };
}

/**
 * Hook for cache management
 */
export function useCache() {
  const getCache = useCallback(async <T = any>(key: string): Promise<T | null> => {
    return await CacheOperations.get<T>(key);
  }, []);

  const setCache = useCallback(async (
    key: string,
    data: any,
    ttl?: number,
    tags?: string[]
  ) => {
    await CacheOperations.set(key, data, ttl, tags);
  }, []);

  const invalidateByTags = useCallback(async (tags: string[]) => {
    await CacheOperations.invalidateByTags(tags);
  }, []);

  const clearCache = useCallback(async () => {
    await CacheOperations.clear();
  }, []);

  return {
    getCache,
    setCache,
    invalidateByTags,
    clearCache,
  };
}

/**
 * Main hook for IndexedDB integration
 */
export function useIndexedDB(userId: string) {
  const events = useOfflineEvents(userId);
  const categories = useOfflineCategories(userId);
  const calendars = useOfflineCalendars(userId);
  const preferences = useOfflinePreferences(userId);
  const sync = useOfflineSync(userId);
  const backup = useBackup(userId);
  const migration = useMigration(userId);
  const performance = usePerformanceMonitor();
  const cache = useCache();

  return {
    events,
    categories,
    calendars,
    preferences,
    sync,
    backup,
    migration,
    performance,
    cache,
    db, // Export database instance for direct access if needed
  };
}