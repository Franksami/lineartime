/**
 * Offline Sync Queue System
 * Manages data synchronization between IndexedDB and Convex
 */

import { db, StoredEvent, SyncQueueItem } from './schema';
import { EventOperations, SyncQueueOperations, CacheOperations } from './operations';

/**
 * Sync status types
 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Sync result interface
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  timestamp: number;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictStrategy {
  LOCAL_WINS = 'local_wins',
  REMOTE_WINS = 'remote_wins',
  NEWEST_WINS = 'newest_wins',
  MANUAL = 'manual',
}

/**
 * Offline Sync Manager
 */
export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private syncInProgress = false;
  private syncInterval: number | null = null;
  private status: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Get singleton instance
   */
  static getInstance(): OfflineSyncManager {
    if (!this.instance) {
      this.instance = new OfflineSyncManager();
    }
    return this.instance;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalMinutes = 5): void {
    this.stopAutoSync();
    
    // Initial sync
    this.sync();
    
    // Set up interval
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, intervalMinutes * 60 * 1000);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('Connection restored, starting sync...');
    this.setStatus('idle');
    this.sync();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('Connection lost, entering offline mode');
    this.setStatus('offline');
  };

  /**
   * Main sync function
   */
  async sync(userId?: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    if (!navigator.onLine) {
      this.setStatus('offline');
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['No internet connection'],
        timestamp: Date.now(),
      };
    }

    this.syncInProgress = true;
    this.setStatus('syncing');

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Process sync queue
      const queueResult = await this.processSyncQueue(userId);
      result.synced += queueResult.synced;
      result.failed += queueResult.failed;
      result.errors.push(...queueResult.errors);

      // Sync pending events
      const eventsResult = await this.syncPendingEvents(userId);
      result.synced += eventsResult.synced;
      result.failed += eventsResult.failed;
      result.errors.push(...eventsResult.errors);

      // Pull remote changes
      const pullResult = await this.pullRemoteChanges(userId);
      result.synced += pullResult.synced;

      result.success = result.failed === 0;
      this.setStatus(result.success ? 'idle' : 'error');
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.setStatus('error');
    } finally {
      this.syncInProgress = false;
    }

    // Log sync result
    await db.metrics.add({
      operation: 'sync',
      duration: Date.now() - result.timestamp,
      timestamp: result.timestamp,
      success: result.success,
      recordCount: result.synced,
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    });

    return result;
  }

  /**
   * Process sync queue items
   */
  private async processSyncQueue(userId?: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    // Get pending items from queue
    const items = userId 
      ? await SyncQueueOperations.getPending(userId)
      : await db.syncQueue.filter(item => item.attempts < 3).toArray();

    for (const item of items) {
      try {
        await this.processSyncItem(item);
        await SyncQueueOperations.remove(item.id!);
        result.synced++;
      } catch (error) {
        await SyncQueueOperations.markAttempted(
          item.id!,
          error instanceof Error ? error.message : 'Unknown error'
        );
        result.failed++;
        result.errors.push(`Failed to sync ${item.entity} ${item.entityId}`);
      }
    }

    return result;
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with Convex API
    // For now, simulate the sync
    console.log('Processing sync item:', item);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync failure');
    }

    // Update sync status in local DB
    switch (item.entity) {
      case 'event':
        if (typeof item.entityId === 'number') {
          await db.events.update(item.entityId, { syncStatus: 'synced' });
        }
        break;
      case 'category':
        if (typeof item.entityId === 'number') {
          await db.categories.update(item.entityId, { syncStatus: 'synced' });
        }
        break;
      case 'calendar':
        if (typeof item.entityId === 'number') {
          await db.calendars.update(item.entityId, { syncStatus: 'synced' });
        }
        break;
    }
  }

  /**
   * Sync pending events
   */
  private async syncPendingEvents(userId?: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    // Get events that need syncing
    const pendingEvents = userId
      ? await EventOperations.getPendingSync(userId)
      : await db.events
          .where('syncStatus')
          .anyOf(['local', 'pending'])
          .toArray();

    for (const event of pendingEvents) {
      try {
        // This would sync with Convex
        console.log('Syncing event:', event.id);
        
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Mark as synced
        await db.events.update(event.id!, { 
          syncStatus: 'synced',
          convexId: `convex_${event.id}`, // Simulated Convex ID
        });
        
        result.synced++;
      } catch (error) {
        // Add to sync queue for retry
        await SyncQueueOperations.add({
          userId: event.userId,
          operation: event.convexId ? 'update' : 'create',
          entity: 'event',
          entityId: event.id!,
          data: event,
        });
        
        result.failed++;
        result.errors.push(`Failed to sync event ${event.id}`);
      }
    }

    return result;
  }

  /**
   * Pull remote changes from Convex
   */
  private async pullRemoteChanges(userId?: string): Promise<{
    synced: number;
  }> {
    // This would fetch changes from Convex
    // For now, simulate pulling changes
    console.log('Pulling remote changes...');

    // Get last sync time
    const preferences = userId 
      ? await db.preferences.where('userId').equals(userId).first()
      : await db.preferences.toArray().then(prefs => prefs[0]);

    const lastSync = preferences?.lastSyncTime || 0;

    // Simulate fetching remote changes
    await new Promise(resolve => setTimeout(resolve, 200));

    // Update last sync time
    if (preferences && preferences.id) {
      await db.preferences.update(preferences.id, {
        lastSyncTime: Date.now(),
      });
    }

    return { synced: 0 }; // No remote changes in simulation
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    localEvent: StoredEvent,
    remoteEvent: any,
    strategy: ConflictStrategy = ConflictStrategy.NEWEST_WINS
  ): Promise<StoredEvent> {
    switch (strategy) {
      case ConflictStrategy.LOCAL_WINS:
        return localEvent;
        
      case ConflictStrategy.REMOTE_WINS:
        return {
          ...localEvent,
          ...remoteEvent,
          id: localEvent.id,
          syncStatus: 'synced',
        };
        
      case ConflictStrategy.NEWEST_WINS:
        const localTime = localEvent.lastModified || localEvent.updatedAt;
        const remoteTime = remoteEvent.lastModified || remoteEvent.updatedAt;
        
        if (localTime > remoteTime) {
          return localEvent;
        } else {
          return {
            ...localEvent,
            ...remoteEvent,
            id: localEvent.id,
            syncStatus: 'synced',
          };
        }
        
      case ConflictStrategy.MANUAL:
        // Store conflict for manual resolution
        await db.events.update(localEvent.id!, {
          syncStatus: 'conflict',
          metadata: {
            ...localEvent.metadata,
            conflictData: remoteEvent,
          },
        });
        return localEvent;
        
      default:
        return localEvent;
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Set sync status
   */
  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.notifyListeners();
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.status));
  }

  /**
   * Clear all sync data for a user
   */
  async clearUserSyncData(userId: string): Promise<void> {
    await db.transaction('rw', 
      db.events,
      db.categories,
      db.calendars,
      db.syncQueue,
      async () => {
        // Reset sync status for all entities
        await db.events
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'local', convexId: undefined });

        await db.categories
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'local', convexId: undefined });

        await db.calendars
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'local', convexId: undefined });

        // Clear sync queue
        await SyncQueueOperations.clearAll(userId);
      }
    );
  }
}

/**
 * Sync utilities
 */
export class SyncUtils {
  /**
   * Calculate sync checksum for data integrity
   */
  static async calculateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Batch sync operations for efficiency
   */
  static async batchSync<T>(
    items: T[],
    syncFn: (item: T) => Promise<void>,
    batchSize = 10
  ): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(item => 
        syncFn(item)
          .then(() => results.success++)
          .catch(() => results.failed++)
      );
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(userId: string): Promise<{
    pendingSync: number;
    queueSize: number;
    lastSync: number | null;
    conflicts: number;
  }> {
    const [pendingEvents, queueStats, preferences, conflicts] = await Promise.all([
      EventOperations.getPendingSync(userId).then(e => e.length),
      SyncQueueOperations.getStats(userId),
      db.preferences.where('userId').equals(userId).first(),
      db.events
        .where({ userId, syncStatus: 'conflict' })
        .count(),
    ]);

    return {
      pendingSync: pendingEvents,
      queueSize: queueStats.total,
      lastSync: preferences?.lastSyncTime || null,
      conflicts,
    };
  }
}

// Export singleton instance
export const syncManager = OfflineSyncManager.getInstance();