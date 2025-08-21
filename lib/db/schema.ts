/**
 * IndexedDB Database Schema using Dexie.js
 * Defines the structure for offline storage and caching
 */

import Dexie, { Table } from 'dexie';

/**
 * Event interface for IndexedDB storage
 */
export interface StoredEvent {
  id?: number; // Auto-incremented primary key
  convexId?: string; // Reference to Convex event ID
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
  allDay?: boolean;
  color?: string;
  categoryId?: string;
  location?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    count?: number;
    until?: number;
    byDay?: string[];
    byMonth?: number[];
    byMonthDay?: number[];
  };
  reminders?: Array<{
    type: 'notification' | 'email';
    minutesBefore: number;
  }>;
  attendees?: string[];
  metadata?: any;
  syncStatus: 'local' | 'synced' | 'pending' | 'conflict';
  lastModified: number;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
}

/**
 * Category interface for IndexedDB
 */
export interface StoredCategory {
  id?: number;
  convexId?: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  syncStatus: 'local' | 'synced' | 'pending';
  createdAt: number;
  updatedAt: number;
}

/**
 * Calendar interface for IndexedDB
 */
export interface StoredCalendar {
  id?: number;
  convexId?: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isShared: boolean;
  syncStatus: 'local' | 'synced' | 'pending';
  createdAt: number;
  updatedAt: number;
}

/**
 * User preferences for offline storage
 */
export interface StoredPreferences {
  id?: number;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  firstDayOfWeek: number;
  timeFormat: '12' | '24';
  timezone: string;
  defaultEventDuration: number;
  weekendDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
  lastSyncTime?: number;
  offlineMode?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // in minutes
}

/**
 * Sync queue for offline operations
 */
export interface SyncQueueItem {
  id?: number;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'event' | 'category' | 'calendar' | 'preferences';
  entityId: string | number;
  data: any;
  attempts: number;
  lastAttempt?: number;
  error?: string;
  createdAt: number;
}

/**
 * Cache entry for API responses
 */
export interface CacheEntry {
  id?: number;
  key: string;
  data: any;
  expiresAt: number;
  createdAt: number;
  tags?: string[];
}

/**
 * Migration log for tracking schema updates
 */
export interface MigrationLog {
  id?: number;
  version: number;
  appliedAt: number;
  success: boolean;
  error?: string;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id?: number;
  userId: string;
  timestamp: number;
  version: number;
  size: number;
  tables: string[];
  recordCount: number;
  compressed?: boolean;
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetric {
  id?: number;
  operation: string;
  duration: number;
  recordCount?: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Main Database Class
 */
export class LinearTimeDB extends Dexie {
  // Tables
  events!: Table<StoredEvent>;
  categories!: Table<StoredCategory>;
  calendars!: Table<StoredCalendar>;
  preferences!: Table<StoredPreferences>;
  syncQueue!: Table<SyncQueueItem>;
  cache!: Table<CacheEntry>;
  migrations!: Table<MigrationLog>;
  backups!: Table<BackupMetadata>;
  metrics!: Table<PerformanceMetric>;

  constructor() {
    super('LinearTimeDB');

    // Define schema versions
    this.version(1).stores({
      events: '++id, convexId, userId, startTime, endTime, categoryId, syncStatus, [userId+startTime], [userId+categoryId], [userId+syncStatus], lastModified',
      categories: '++id, convexId, userId, name, syncStatus, [userId+name]',
      calendars: '++id, convexId, userId, name, isDefault, syncStatus, [userId+isDefault]',
      preferences: '++id, userId, lastSyncTime',
      syncQueue: '++id, userId, operation, entity, entityId, createdAt, [userId+entity]',
      cache: '++id, key, expiresAt, *tags',
      migrations: '++id, version, appliedAt',
      backups: '++id, userId, timestamp',
      metrics: '++id, operation, timestamp, success'
    });

    // Version 2: Add compound indexes for better query performance
    this.version(2).stores({
      events: '++id, convexId, userId, startTime, endTime, categoryId, syncStatus, [userId+startTime], [userId+endTime], [userId+categoryId], [userId+syncStatus], [userId+startTime+endTime], lastModified, isDeleted',
      categories: '++id, convexId, userId, name, syncStatus, [userId+name], [userId+syncStatus]',
      calendars: '++id, convexId, userId, name, isDefault, syncStatus, [userId+isDefault], [userId+syncStatus]',
      preferences: '++id, userId, lastSyncTime, offlineMode',
      syncQueue: '++id, userId, operation, entity, entityId, createdAt, attempts, [userId+entity], [userId+operation]',
      cache: '++id, key, expiresAt, *tags, createdAt',
      migrations: '++id, version, appliedAt, success',
      backups: '++id, userId, timestamp, version',
      metrics: '++id, operation, timestamp, success, duration'
    });

    // Version 3: Add support for recurring events and advanced features
    this.version(3).stores({
      events: '++id, convexId, userId, title, startTime, endTime, categoryId, syncStatus, [userId+startTime], [userId+endTime], [userId+categoryId], [userId+syncStatus], [userId+startTime+endTime], [userId+title], lastModified, isDeleted, allDay',
      categories: '++id, convexId, userId, name, color, syncStatus, [userId+name], [userId+syncStatus]',
      calendars: '++id, convexId, userId, name, isDefault, isShared, syncStatus, [userId+isDefault], [userId+syncStatus], [userId+isShared]',
      preferences: '++id, userId, theme, timeFormat, timezone, lastSyncTime, offlineMode, autoSync',
      syncQueue: '++id, userId, operation, entity, entityId, createdAt, attempts, lastAttempt, [userId+entity], [userId+operation], [attempts+lastAttempt]',
      cache: '++id, key, expiresAt, *tags, createdAt, [key+expiresAt]',
      migrations: '++id, version, appliedAt, success',
      backups: '++id, userId, timestamp, version, size, compressed',
      metrics: '++id, operation, timestamp, success, duration, recordCount, [operation+timestamp]'
    });

    // Hooks for automatic timestamps
    this.events.hook('creating', (primKey, obj) => {
      const now = Date.now();
      obj.createdAt = obj.createdAt || now;
      obj.updatedAt = now;
      obj.lastModified = now;
      obj.syncStatus = obj.syncStatus || 'local';
    });

    this.events.hook('updating', (modifications, primKey, obj) => {
      modifications.updatedAt = Date.now();
      modifications.lastModified = Date.now();
      if (!obj.syncStatus || obj.syncStatus === 'synced') {
        modifications.syncStatus = 'pending';
      }
    });

    this.categories.hook('creating', (primKey, obj) => {
      const now = Date.now();
      obj.createdAt = obj.createdAt || now;
      obj.updatedAt = now;
      obj.syncStatus = obj.syncStatus || 'local';
    });

    this.categories.hook('updating', (modifications) => {
      modifications.updatedAt = Date.now();
      if (modifications.syncStatus !== 'local') {
        modifications.syncStatus = 'pending';
      }
    });

    this.calendars.hook('creating', (primKey, obj) => {
      const now = Date.now();
      obj.createdAt = obj.createdAt || now;
      obj.updatedAt = now;
      obj.syncStatus = obj.syncStatus || 'local';
    });

    this.calendars.hook('updating', (modifications) => {
      modifications.updatedAt = Date.now();
      if (modifications.syncStatus !== 'local') {
        modifications.syncStatus = 'pending';
      }
    });
  }

  /**
   * Clear all data (useful for logout)
   */
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map(table => table.clear()));
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    events: number;
    categories: number;
    calendars: number;
    syncQueueSize: number;
    cacheSize: number;
    totalSize: number;
  }> {
    const [events, categories, calendars, syncQueue, cache] = await Promise.all([
      this.events.count(),
      this.categories.count(),
      this.calendars.count(),
      this.syncQueue.count(),
      this.cache.count(),
    ]);

    return {
      events,
      categories,
      calendars,
      syncQueueSize: syncQueue,
      cacheSize: cache,
      totalSize: events + categories + calendars + syncQueue + cache,
    };
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    const now = Date.now();
    const expired = await this.cache.where('expiresAt').below(now).toArray();
    await this.cache.bulkDelete(expired.map(e => e.id!));
    return expired.length;
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus(userId: string): Promise<{
    localEvents: number;
    pendingEvents: number;
    syncedEvents: number;
    queueSize: number;
  }> {
    const [local, pending, synced, queue] = await Promise.all([
      this.events.where({ userId, syncStatus: 'local' }).count(),
      this.events.where({ userId, syncStatus: 'pending' }).count(),
      this.events.where({ userId, syncStatus: 'synced' }).count(),
      this.syncQueue.where({ userId }).count(),
    ]);

    return {
      localEvents: local,
      pendingEvents: pending,
      syncedEvents: synced,
      queueSize: queue,
    };
  }
}

// Create and export database instance
export const db = new LinearTimeDB();

// Export database types
export type { Table } from 'dexie';