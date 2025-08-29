/**
 * Backup and Recovery System for IndexedDB
 * Handles data backup, restore, and versioning
 */

import { DataPortability } from './migration';
import {
  type BackupMetadata,
  type StoredCalendar,
  type StoredCategory,
  type StoredEvent,
  type StoredPreferences,
  db,
} from './schema';

/**
 * Backup format interface
 */
export interface BackupData {
  metadata: {
    version: number;
    timestamp: string;
    userId: string;
    appVersion?: string;
    compressed: boolean;
    checksum: string;
  };
  data: {
    events: StoredEvent[];
    categories: StoredCategory[];
    calendars: StoredCalendar[];
    preferences: StoredPreferences | null;
  };
  stats: {
    totalRecords: number;
    eventCount: number;
    categoryCount: number;
    calendarCount: number;
  };
}

/**
 * Backup Manager
 */
export class BackupManager {
  private static readonly MAX_BACKUPS = 10;
  private static readonly COMPRESSION_THRESHOLD = 1024 * 100; // 100KB

  /**
   * Create a backup
   */
  static async createBackup(
    userId: string,
    options: {
      compress?: boolean;
      includeDeleted?: boolean;
      encrypt?: boolean;
      password?: string;
    } = {}
  ): Promise<BackupData> {
    const { compress = true, includeDeleted = false } = options;
    const start = performance.now();

    // Fetch all data
    let events = await db.events.where('userId').equals(userId).toArray();

    if (!includeDeleted) {
      events = events.filter((e) => !e.isDeleted);
    }

    const categories = await db.categories.where('userId').equals(userId).toArray();

    const calendars = await db.calendars.where('userId').equals(userId).toArray();

    const preferences = (await db.preferences.where('userId').equals(userId).first()) || null;

    // Prepare backup data
    const backupData: BackupData = {
      metadata: {
        version: db.verno,
        timestamp: new Date().toISOString(),
        userId,
        compressed: false,
        checksum: '',
      },
      data: {
        events,
        categories,
        calendars,
        preferences,
      },
      stats: {
        totalRecords: events.length + categories.length + calendars.length + (preferences ? 1 : 0),
        eventCount: events.length,
        categoryCount: categories.length,
        calendarCount: calendars.length,
      },
    };

    // Calculate size
    const dataStr = JSON.stringify(backupData);
    const size = new Blob([dataStr]).size;

    // Compress if needed
    let finalData = dataStr;
    if (compress && size > BackupManager.COMPRESSION_THRESHOLD) {
      finalData = await BackupManager.compressData(dataStr);
      backupData.metadata.compressed = true;
    }

    // Calculate checksum
    backupData.metadata.checksum = await BackupManager.calculateChecksum(finalData);

    // Encrypt if requested
    if (options.encrypt && options.password) {
      finalData = await BackupManager.encryptData(finalData, options.password);
    }

    // Store backup metadata
    await db.backups.add({
      userId,
      timestamp: Date.now(),
      version: db.verno,
      size,
      tables: ['events', 'categories', 'calendars', 'preferences'],
      recordCount: backupData.stats.totalRecords,
      compressed: backupData.metadata.compressed,
    });

    // Clean old backups
    await BackupManager.cleanOldBackups(userId);

    // Log performance
    await db.metrics.add({
      operation: 'backup.create',
      duration: performance.now() - start,
      timestamp: Date.now(),
      success: true,
      recordCount: backupData.stats.totalRecords,
    });

    return backupData;
  }

  /**
   * Restore from backup
   */
  static async restoreBackup(
    backupData: BackupData | string,
    options: {
      overwrite?: boolean;
      merge?: boolean;
      decrypt?: boolean;
      password?: string;
    } = {}
  ): Promise<{
    success: boolean;
    restored: {
      events: number;
      categories: number;
      calendars: number;
      preferences: boolean;
    };
    errors: string[];
  }> {
    const { overwrite = false, merge = false } = options;
    const start = performance.now();
    const result = {
      success: true,
      restored: {
        events: 0,
        categories: 0,
        calendars: 0,
        preferences: false,
      },
      errors: [] as string[],
    };

    try {
      // Parse backup data if string
      let backup: BackupData;
      if (typeof backupData === 'string') {
        // Decrypt if needed
        let data = backupData;
        if (options.decrypt && options.password) {
          data = await BackupManager.decryptData(data, options.password);
        }

        // Decompress if needed
        backup = JSON.parse(data);
        if (backup.metadata.compressed) {
          const decompressed = await BackupManager.decompressData(data);
          backup = JSON.parse(decompressed);
        }
      } else {
        backup = backupData;
      }

      // Verify checksum
      const checksum = await BackupManager.calculateChecksum(JSON.stringify(backup));
      if (backup.metadata.checksum && backup.metadata.checksum !== checksum) {
        console.warn('Backup checksum mismatch - data may be corrupted');
      }

      // Start transaction
      await db.transaction(
        'rw',
        db.events,
        db.categories,
        db.calendars,
        db.preferences,
        async () => {
          const userId = backup.metadata.userId;

          // Clear existing data if overwrite
          if (overwrite) {
            await db.events.where('userId').equals(userId).delete();
            await db.categories.where('userId').equals(userId).delete();
            await db.calendars.where('userId').equals(userId).delete();
            await db.preferences.where('userId').equals(userId).delete();
          }

          // Restore events
          if (backup.data.events) {
            for (const event of backup.data.events) {
              try {
                if (merge) {
                  // Check for existing event
                  const existing = await db.events
                    .where('[userId+startTime]')
                    .equals([userId, event.startTime])
                    .and((e) => e.title === event.title)
                    .first();

                  if (!existing) {
                    await db.events.add({
                      ...event,
                      id: undefined,
                      userId,
                    });
                    result.restored.events++;
                  }
                } else {
                  await db.events.add({
                    ...event,
                    id: undefined,
                    userId,
                  });
                  result.restored.events++;
                }
              } catch (error) {
                result.errors.push(`Event restore failed: ${error}`);
              }
            }
          }

          // Restore categories
          if (backup.data.categories) {
            for (const category of backup.data.categories) {
              try {
                await db.categories.add({
                  ...category,
                  id: undefined,
                  userId,
                });
                result.restored.categories++;
              } catch (error) {
                result.errors.push(`Category restore failed: ${error}`);
              }
            }
          }

          // Restore calendars
          if (backup.data.calendars) {
            for (const calendar of backup.data.calendars) {
              try {
                await db.calendars.add({
                  ...calendar,
                  id: undefined,
                  userId,
                });
                result.restored.calendars++;
              } catch (error) {
                result.errors.push(`Calendar restore failed: ${error}`);
              }
            }
          }

          // Restore preferences
          if (backup.data.preferences) {
            try {
              await db.preferences.add({
                ...backup.data.preferences,
                id: undefined,
                userId,
              });
              result.restored.preferences = true;
            } catch (error) {
              result.errors.push(`Preferences restore failed: ${error}`);
            }
          }
        }
      );

      result.success = result.errors.length === 0;

      // Log performance
      await db.metrics.add({
        operation: 'backup.restore',
        duration: performance.now() - start,
        timestamp: Date.now(),
        success: result.success,
        recordCount:
          result.restored.events + result.restored.categories + result.restored.calendars,
      });
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * List available backups
   */
  static async listBackups(userId: string): Promise<BackupMetadata[]> {
    return await db.backups.where('userId').equals(userId).reverse().sortBy('timestamp');
  }

  /**
   * Delete a backup
   */
  static async deleteBackup(backupId: number): Promise<void> {
    await db.backups.delete(backupId);
  }

  /**
   * Clean old backups
   */
  private static async cleanOldBackups(userId: string): Promise<void> {
    const backups = await BackupManager.listBackups(userId);

    if (backups.length > BackupManager.MAX_BACKUPS) {
      const toDelete = backups.slice(BackupManager.MAX_BACKUPS);
      await db.backups.bulkDelete(toDelete.map((b) => b.id!));
    }
  }

  /**
   * Export backup to file
   */
  static async exportToFile(backupData: BackupData, filename?: string): Promise<void> {
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `lineartime-backup-${backupData.metadata.timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import backup from file
   */
  static async importFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (_error) {
          reject(new Error('Invalid backup file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Compress data
   */
  private static async compressData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(dataBytes);
    writer.close();

    const compressedBytes = await new Response(cs.readable).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(compressedBytes)));
  }

  /**
   * Decompress data
   */
  private static async decompressData(data: string): Promise<string> {
    const compressedBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(compressedBytes);
    writer.close();

    const decompressedBytes = await new Response(ds.readable).arrayBuffer();
    const decoder = new TextDecoder();
    return decoder.decode(decompressedBytes);
  }

  /**
   * Calculate checksum
   */
  private static async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data (simplified - use proper encryption in production)
   */
  private static async encryptData(data: string, password: string): Promise<string> {
    // This is a simplified example - use proper encryption library in production
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const passwordBytes = encoder.encode(password);

    // Simple XOR encryption (NOT secure - for demo only)
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ passwordBytes[i % passwordBytes.length];
    }

    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt data (simplified - use proper decryption in production)
   */
  private static async decryptData(data: string, password: string): Promise<string> {
    // This is a simplified example - use proper decryption library in production
    const encryptedBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Simple XOR decryption (NOT secure - for demo only)
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ passwordBytes[i % passwordBytes.length];
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

/**
 * Auto-backup scheduler
 */
export class AutoBackupScheduler {
  private static interval: number | null = null;

  /**
   * Start auto-backup
   */
  static start(userId: string, intervalHours = 24): void {
    AutoBackupScheduler.stop();

    // Initial backup
    BackupManager.createBackup(userId).catch(console.error);

    // Schedule regular backups
    AutoBackupScheduler.interval = window.setInterval(
      () => {
        BackupManager.createBackup(userId).catch(console.error);
      },
      intervalHours * 60 * 60 * 1000
    );
  }

  /**
   * Stop auto-backup
   */
  static stop(): void {
    if (AutoBackupScheduler.interval) {
      clearInterval(AutoBackupScheduler.interval);
      AutoBackupScheduler.interval = null;
    }
  }
}
