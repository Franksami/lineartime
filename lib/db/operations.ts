/**
 * Core Database Operations for IndexedDB
 * Provides CRUD operations and utilities for offline storage
 */

import { db, StoredEvent, StoredCategory, StoredCalendar, StoredPreferences, SyncQueueItem } from './schema';
import { Collection } from 'dexie';

/**
 * Event Operations
 */
export class EventOperations {
  /**
   * Create a new event
   */
  static async create(event: Omit<StoredEvent, 'id'>): Promise<number> {
    const start = performance.now();
    try {
      const id = await db.events.add(event);
      
      // Log performance metric
      await db.metrics.add({
        operation: 'event.create',
        duration: performance.now() - start,
        timestamp: Date.now(),
        success: true,
        recordCount: 1,
      });
      
      return id;
    } catch (error) {
      await db.metrics.add({
        operation: 'event.create',
        duration: performance.now() - start,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get events by date range
   */
  static async getByDateRange(
    userId: string,
    startTime: number,
    endTime: number
  ): Promise<StoredEvent[]> {
    return await db.events
      .where('[userId+startTime]')
      .between([userId, startTime], [userId, endTime])
      .and(event => !event.isDeleted)
      .toArray();
  }

  /**
   * Get events by category
   */
  static async getByCategory(
    userId: string,
    categoryId: string
  ): Promise<StoredEvent[]> {
    return await db.events
      .where('[userId+categoryId]')
      .equals([userId, categoryId])
      .and(event => !event.isDeleted)
      .toArray();
  }

  /**
   * Get events needing sync
   */
  static async getPendingSync(userId: string): Promise<StoredEvent[]> {
    return await db.events
      .where('[userId+syncStatus]')
      .equals([userId, 'pending'])
      .or('[userId+syncStatus]')
      .equals([userId, 'local'])
      .toArray();
  }

  /**
   * Update an event
   */
  static async update(id: number, updates: Partial<StoredEvent>): Promise<void> {
    const start = performance.now();
    try {
      await db.events.update(id, updates);
      
      await db.metrics.add({
        operation: 'event.update',
        duration: performance.now() - start,
        timestamp: Date.now(),
        success: true,
        recordCount: 1,
      });
    } catch (error) {
      await db.metrics.add({
        operation: 'event.update',
        duration: performance.now() - start,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Soft delete an event
   */
  static async softDelete(id: number): Promise<void> {
    await db.events.update(id, {
      isDeleted: true,
      syncStatus: 'pending',
      updatedAt: Date.now(),
    });
  }

  /**
   * Search events by title
   */
  static async search(
    userId: string,
    searchTerm: string,
    limit = 20
  ): Promise<StoredEvent[]> {
    const searchLower = searchTerm.toLowerCase();
    
    return await db.events
      .where('userId')
      .equals(userId)
      .filter(event => 
        !event.isDeleted &&
        (event.title.toLowerCase().includes(searchLower) ||
         event.description?.toLowerCase().includes(searchLower) ||
         event.location?.toLowerCase().includes(searchLower))
      )
      .limit(limit)
      .toArray();
  }

  /**
   * Get recurring events
   */
  static async getRecurring(userId: string): Promise<StoredEvent[]> {
    return await db.events
      .where('userId')
      .equals(userId)
      .filter(event => !event.isDeleted && event.recurrence !== undefined)
      .toArray();
  }
}

/**
 * Category Operations
 */
export class CategoryOperations {
  /**
   * Create a new category
   */
  static async create(category: Omit<StoredCategory, 'id'>): Promise<number> {
    return await db.categories.add(category);
  }

  /**
   * Get all categories for a user
   */
  static async getByUser(userId: string): Promise<StoredCategory[]> {
    return await db.categories
      .where('userId')
      .equals(userId)
      .toArray();
  }

  /**
   * Update a category
   */
  static async update(id: number, updates: Partial<StoredCategory>): Promise<void> {
    await db.categories.update(id, updates);
  }

  /**
   * Delete a category and optionally reassign events
   */
  static async delete(
    id: number,
    reassignToCategory?: string
  ): Promise<void> {
    await db.transaction('rw', db.categories, db.events, async () => {
      const category = await db.categories.get(id);
      if (!category) return;

      // Reassign or clear category from events
      if (reassignToCategory) {
        await db.events
          .where('categoryId')
          .equals(category.convexId || '')
          .modify({ categoryId: reassignToCategory });
      } else {
        await db.events
          .where('categoryId')
          .equals(category.convexId || '')
          .modify({ categoryId: undefined });
      }

      await db.categories.delete(id);
    });
  }
}

/**
 * Calendar Operations
 */
export class CalendarOperations {
  /**
   * Create a new calendar
   */
  static async create(calendar: Omit<StoredCalendar, 'id'>): Promise<number> {
    // If this is set as default, unset other defaults
    if (calendar.isDefault) {
      await db.calendars
        .where('[userId+isDefault]')
        .equals([calendar.userId, true])
        .modify({ isDefault: false });
    }
    
    return await db.calendars.add(calendar);
  }

  /**
   * Get all calendars for a user
   */
  static async getByUser(userId: string): Promise<StoredCalendar[]> {
    return await db.calendars
      .where('userId')
      .equals(userId)
      .toArray();
  }

  /**
   * Get default calendar
   */
  static async getDefault(userId: string): Promise<StoredCalendar | undefined> {
    const calendars = await db.calendars
      .where('[userId+isDefault]')
      .equals([userId, true])
      .first();
    
    // If no default, return the first calendar
    if (!calendars) {
      return await db.calendars
        .where('userId')
        .equals(userId)
        .first();
    }
    
    return calendars;
  }

  /**
   * Update a calendar
   */
  static async update(id: number, updates: Partial<StoredCalendar>): Promise<void> {
    // If setting as default, unset others
    if (updates.isDefault) {
      const calendar = await db.calendars.get(id);
      if (calendar) {
        await db.calendars
          .where('[userId+isDefault]')
          .equals([calendar.userId, true])
          .modify({ isDefault: false });
      }
    }
    
    await db.calendars.update(id, updates);
  }
}

/**
 * Preferences Operations
 */
export class PreferencesOperations {
  /**
   * Get user preferences
   */
  static async get(userId: string): Promise<StoredPreferences | undefined> {
    return await db.preferences
      .where('userId')
      .equals(userId)
      .first();
  }

  /**
   * Save user preferences
   */
  static async save(preferences: StoredPreferences): Promise<void> {
    const existing = await this.get(preferences.userId);
    
    if (existing && existing.id) {
      await db.preferences.update(existing.id, preferences);
    } else {
      await db.preferences.add(preferences);
    }
  }

  /**
   * Update specific preference fields
   */
  static async update(
    userId: string,
    updates: Partial<StoredPreferences>
  ): Promise<void> {
    const existing = await this.get(userId);
    
    if (existing && existing.id) {
      await db.preferences.update(existing.id, updates);
    } else {
      await db.preferences.add({
        ...this.getDefaults(),
        ...updates,
        userId,
      });
    }
  }

  /**
   * Get default preferences
   */
  static getDefaults(): Omit<StoredPreferences, 'id' | 'userId'> {
    return {
      theme: 'auto',
      firstDayOfWeek: 0,
      timeFormat: '12',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultEventDuration: 60,
      weekendDays: [0, 6],
      workingHours: {
        start: '09:00',
        end: '17:00',
      },
      offlineMode: false,
      autoSync: true,
      syncInterval: 5, // 5 minutes
    };
  }
}

/**
 * Sync Queue Operations
 */
export class SyncQueueOperations {
  /**
   * Add item to sync queue
   */
  static async add(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    return await db.syncQueue.add({
      ...item,
      attempts: 0,
      createdAt: Date.now(),
    });
  }

  /**
   * Get pending sync items
   */
  static async getPending(userId: string, limit = 50): Promise<SyncQueueItem[]> {
    return await db.syncQueue
      .where('userId')
      .equals(userId)
      .filter(item => item.attempts < 3)
      .limit(limit)
      .toArray();
  }

  /**
   * Mark sync item as attempted
   */
  static async markAttempted(
    id: number,
    error?: string
  ): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (!item) return;

    await db.syncQueue.update(id, {
      attempts: item.attempts + 1,
      lastAttempt: Date.now(),
      error,
    });
  }

  /**
   * Remove successfully synced item
   */
  static async remove(id: number): Promise<void> {
    await db.syncQueue.delete(id);
  }

  /**
   * Clear all sync items for a user
   */
  static async clearAll(userId: string): Promise<void> {
    await db.syncQueue
      .where('userId')
      .equals(userId)
      .delete();
  }

  /**
   * Get sync queue statistics
   */
  static async getStats(userId: string): Promise<{
    total: number;
    pending: number;
    failed: number;
    byOperation: Record<string, number>;
  }> {
    const items = await db.syncQueue
      .where('userId')
      .equals(userId)
      .toArray();

    const byOperation: Record<string, number> = {};
    let failed = 0;

    items.forEach(item => {
      if (item.attempts >= 3) failed++;
      byOperation[item.operation] = (byOperation[item.operation] || 0) + 1;
    });

    return {
      total: items.length,
      pending: items.filter(i => i.attempts < 3).length,
      failed,
      byOperation,
    };
  }
}

/**
 * Cache Operations
 */
export class CacheOperations {
  /**
   * Get cached data
   */
  static async get<T = any>(key: string): Promise<T | null> {
    const entry = await db.cache
      .where('key')
      .equals(key)
      .first();

    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await db.cache.delete(entry.id!);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  static async set(
    key: string,
    data: any,
    ttl = 300000, // 5 minutes default
    tags?: string[]
  ): Promise<void> {
    const existing = await db.cache
      .where('key')
      .equals(key)
      .first();

    const entry = {
      key,
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      tags,
    };

    if (existing && existing.id) {
      await db.cache.update(existing.id, entry);
    } else {
      await db.cache.add(entry);
    }
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    const entries = await db.cache
      .where('tags')
      .anyOf(tags)
      .toArray();

    await db.cache.bulkDelete(entries.map(e => e.id!));
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    await db.cache.clear();
  }
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  /**
   * Get performance metrics
   */
  static async getMetrics(
    operation?: string,
    limit = 100
  ): Promise<any[]> {
    let query = db.metrics.orderBy('timestamp').reverse();
    
    if (operation) {
      query = db.metrics
        .where('operation')
        .equals(operation)
        .reverse();
    }
    
    return await query.limit(limit).toArray();
  }

  /**
   * Get average operation time
   */
  static async getAverageTime(operation: string): Promise<number> {
    const metrics = await db.metrics
      .where('operation')
      .equals(operation)
      .and(m => m.success)
      .toArray();

    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  /**
   * Clear old metrics
   */
  static async clearOld(daysToKeep = 7): Promise<void> {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await db.metrics
      .where('timestamp')
      .below(cutoff)
      .delete();
  }
}