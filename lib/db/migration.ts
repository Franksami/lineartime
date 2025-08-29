/**
 * Migration System for IndexedDB
 * Handles data migration from LocalStorage and version upgrades
 */

import {
  CalendarOperations,
  CategoryOperations,
  EventOperations,
  PreferencesOperations,
} from './operations';
import {
  type StoredCalendar,
  type StoredCategory,
  type StoredEvent,
  type StoredPreferences,
  db,
} from './schema';

/**
 * Migration from LocalStorage to IndexedDB
 */
export class LocalStorageMigration {
  /**
   * Check if migration is needed
   */
  static async isNeeded(): Promise<boolean> {
    // Check if there's data in localStorage but not in IndexedDB
    const hasLocalStorageData = LocalStorageMigration.hasLocalStorageData();
    const hasIndexedDBData = await LocalStorageMigration.hasIndexedDBData();

    return hasLocalStorageData && !hasIndexedDBData;
  }

  /**
   * Check if localStorage has data
   */
  static hasLocalStorageData(): boolean {
    try {
      const keys = Object.keys(localStorage);
      return keys.some(
        (key) =>
          key.startsWith('events_') ||
          key.startsWith('categories_') ||
          key.startsWith('preferences_') ||
          key.startsWith('calendar_')
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if IndexedDB has data
   */
  static async hasIndexedDBData(): Promise<boolean> {
    const stats = await db.getStats();
    return stats.totalSize > 0;
  }

  /**
   * Migrate all data from localStorage
   */
  static async migrate(userId: string): Promise<{
    events: number;
    categories: number;
    calendars: number;
    preferences: boolean;
    errors: string[];
  }> {
    const results = {
      events: 0,
      categories: 0,
      calendars: 0,
      preferences: false,
      errors: [] as string[],
    };

    console.log('Starting migration from LocalStorage to IndexedDB...');

    // Start transaction for atomic migration
    await db.transaction(
      'rw',
      db.events,
      db.categories,
      db.calendars,
      db.preferences,
      db.migrations,
      async () => {
        // Migrate events
        try {
          const eventsKey = `events_${userId}`;
          const eventsData = localStorage.getItem(eventsKey);
          if (eventsData) {
            const events = JSON.parse(eventsData);
            if (Array.isArray(events)) {
              for (const event of events) {
                await EventOperations.create({
                  ...event,
                  userId,
                  syncStatus: 'local',
                  createdAt: event.createdAt || Date.now(),
                  updatedAt: event.updatedAt || Date.now(),
                  lastModified: Date.now(),
                });
                results.events++;
              }
            }
          }
        } catch (error) {
          results.errors.push(`Events migration failed: ${error}`);
        }

        // Migrate categories
        try {
          const categoriesKey = `categories_${userId}`;
          const categoriesData = localStorage.getItem(categoriesKey);
          if (categoriesData) {
            const categories = JSON.parse(categoriesData);
            if (Array.isArray(categories)) {
              for (const category of categories) {
                await CategoryOperations.create({
                  ...category,
                  userId,
                  syncStatus: 'local',
                  createdAt: category.createdAt || Date.now(),
                  updatedAt: category.updatedAt || Date.now(),
                });
                results.categories++;
              }
            }
          }
        } catch (error) {
          results.errors.push(`Categories migration failed: ${error}`);
        }

        // Migrate calendars
        try {
          const calendarsKey = `calendars_${userId}`;
          const calendarsData = localStorage.getItem(calendarsKey);
          if (calendarsData) {
            const calendars = JSON.parse(calendarsData);
            if (Array.isArray(calendars)) {
              for (const calendar of calendars) {
                await CalendarOperations.create({
                  ...calendar,
                  userId,
                  syncStatus: 'local',
                  createdAt: calendar.createdAt || Date.now(),
                  updatedAt: calendar.updatedAt || Date.now(),
                });
                results.calendars++;
              }
            }
          }
        } catch (error) {
          results.errors.push(`Calendars migration failed: ${error}`);
        }

        // Migrate preferences
        try {
          const prefsKey = `preferences_${userId}`;
          const prefsData = localStorage.getItem(prefsKey);
          if (prefsData) {
            const preferences = JSON.parse(prefsData);
            await PreferencesOperations.save({
              ...PreferencesOperations.getDefaults(),
              ...preferences,
              userId,
            });
            results.preferences = true;
          }
        } catch (error) {
          results.errors.push(`Preferences migration failed: ${error}`);
        }

        // Log migration
        await db.migrations.add({
          version: 1,
          appliedAt: Date.now(),
          success: results.errors.length === 0,
          error: results.errors.length > 0 ? results.errors.join('; ') : undefined,
        });
      }
    );

    // Archive localStorage data if migration was successful
    if (results.errors.length === 0) {
      LocalStorageMigration.archiveLocalStorageData(userId);
    }

    console.log('Migration completed:', results);
    return results;
  }

  /**
   * Archive localStorage data after successful migration
   */
  static archiveLocalStorageData(userId: string): void {
    const timestamp = new Date().toISOString();
    const keys = [
      `events_${userId}`,
      `categories_${userId}`,
      `calendars_${userId}`,
      `preferences_${userId}`,
    ];

    keys.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        // Archive with timestamp
        localStorage.setItem(`archived_${timestamp}_${key}`, data);
        // Remove original
        localStorage.removeItem(key);
      }
    });

    // Set migration flag
    localStorage.setItem('indexeddb_migration_completed', timestamp);
  }

  /**
   * Restore from localStorage archive if needed
   */
  static async restoreFromArchive(userId: string): Promise<boolean> {
    const migrationTimestamp = localStorage.getItem('indexeddb_migration_completed');
    if (!migrationTimestamp) return false;

    const keys = Object.keys(localStorage);
    const archiveKeys = keys.filter(
      (key) => key.startsWith(`archived_${migrationTimestamp}_`) && key.includes(userId)
    );

    if (archiveKeys.length === 0) return false;

    for (const archiveKey of archiveKeys) {
      const originalKey = archiveKey.replace(`archived_${migrationTimestamp}_`, '');
      const data = localStorage.getItem(archiveKey);
      if (data) {
        localStorage.setItem(originalKey, data);
      }
    }

    return true;
  }
}

/**
 * Schema version migration
 */
export class SchemaMigration {
  /**
   * Check and apply pending migrations
   */
  static async applyPendingMigrations(): Promise<void> {
    const currentVersion = db.verno;
    const lastMigration = await db.migrations.orderBy('version').reverse().first();

    const lastVersion = lastMigration?.version || 0;

    if (currentVersion > lastVersion) {
      // Apply migrations for versions between lastVersion and currentVersion
      for (let v = lastVersion + 1; v <= currentVersion; v++) {
        await SchemaMigration.applyMigration(v);
      }
    }
  }

  /**
   * Apply specific version migration
   */
  static async applyMigration(version: number): Promise<void> {
    console.log(`Applying migration for version ${version}...`);

    try {
      switch (version) {
        case 2:
          // Version 2: Added compound indexes
          // Indexes are automatically created by Dexie, just log
          console.log('Version 2: Compound indexes added');
          break;

        case 3:
          // Version 3: Added recurring events support
          await SchemaMigration.migrateToVersion3();
          break;

        default:
          console.log(`No specific migration needed for version ${version}`);
      }

      // Log successful migration
      await db.migrations.add({
        version,
        appliedAt: Date.now(),
        success: true,
      });
    } catch (error) {
      // Log failed migration
      await db.migrations.add({
        version,
        appliedAt: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Migrate to version 3 (recurring events)
   */
  static async migrateToVersion3(): Promise<void> {
    // Update existing events to have new fields if missing
    await db.events.toCollection().modify((event) => {
      if (event.allDay === undefined) {
        event.allDay = false;
      }
      if (!event.lastModified) {
        event.lastModified = event.updatedAt || Date.now();
      }
    });

    console.log('Version 3: Recurring events support added');
  }

  /**
   * Rollback to previous version
   */
  static async rollback(targetVersion: number): Promise<void> {
    // This would require keeping backup data
    // For now, just log the intention
    console.warn(`Rollback to version ${targetVersion} requested. Manual intervention required.`);

    // In production, you would:
    // 1. Restore from backup
    // 2. Downgrade schema
    // 3. Remove newer migration logs
  }
}

/**
 * Data Import/Export
 */
export class DataPortability {
  /**
   * Export all data to JSON
   */
  static async exportToJSON(userId: string): Promise<{
    version: number;
    timestamp: string;
    data: {
      events: StoredEvent[];
      categories: StoredCategory[];
      calendars: StoredCalendar[];
      preferences: StoredPreferences | undefined;
    };
  }> {
    const [events, categories, calendars, preferences] = await Promise.all([
      db.events.where('userId').equals(userId).toArray(),
      db.categories.where('userId').equals(userId).toArray(),
      db.calendars.where('userId').equals(userId).toArray(),
      PreferencesOperations.get(userId),
    ]);

    return {
      version: db.verno,
      timestamp: new Date().toISOString(),
      data: {
        events,
        categories,
        calendars,
        preferences,
      },
    };
  }

  /**
   * Import data from JSON
   */
  static async importFromJSON(
    userId: string,
    data: any,
    options: {
      merge?: boolean;
      overwrite?: boolean;
    } = {}
  ): Promise<{
    events: number;
    categories: number;
    calendars: number;
    preferences: boolean;
  }> {
    const results = {
      events: 0,
      categories: 0,
      calendars: 0,
      preferences: false,
    };

    await db.transaction('rw', db.events, db.categories, db.calendars, db.preferences, async () => {
      // Clear existing data if overwrite
      if (options.overwrite) {
        await db.events.where('userId').equals(userId).delete();
        await db.categories.where('userId').equals(userId).delete();
        await db.calendars.where('userId').equals(userId).delete();
      }

      // Import events
      if (data.data?.events) {
        for (const event of data.data.events) {
          await EventOperations.create({
            ...event,
            id: undefined, // Let DB assign new ID
            userId,
            syncStatus: 'local',
          });
          results.events++;
        }
      }

      // Import categories
      if (data.data?.categories) {
        for (const category of data.data.categories) {
          await CategoryOperations.create({
            ...category,
            id: undefined,
            userId,
            syncStatus: 'local',
          });
          results.categories++;
        }
      }

      // Import calendars
      if (data.data?.calendars) {
        for (const calendar of data.data.calendars) {
          await CalendarOperations.create({
            ...calendar,
            id: undefined,
            userId,
            syncStatus: 'local',
          });
          results.calendars++;
        }
      }

      // Import preferences
      if (data.data?.preferences) {
        await PreferencesOperations.save({
          ...data.data.preferences,
          userId,
        });
        results.preferences = true;
      }
    });

    return results;
  }

  /**
   * Export to CSV (events only)
   */
  static async exportToCSV(userId: string): Promise<string> {
    const events = await db.events.where('userId').equals(userId).toArray();

    const headers = [
      'Title',
      'Description',
      'Start Time',
      'End Time',
      'All Day',
      'Location',
      'Category',
    ];

    const rows = events.map((event) => [
      event.title,
      event.description || '',
      new Date(event.startTime).toISOString(),
      event.endTime ? new Date(event.endTime).toISOString() : '',
      event.allDay ? 'Yes' : 'No',
      event.location || '',
      event.categoryId || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}
