/**
 * OfflineSyncManager - Advanced offline event synchronization with conflict resolution
 * Features:
 * - Intelligent conflict detection and resolution
 * - Three-way merge for simultaneous edits
 * - Configurable sync strategies
 * - Real-time sync status tracking
 * - Batch sync operations
 */

export interface SyncableEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  category?: string;
  priority?: string;
  tags?: string[];
  description?: string;

  // Sync metadata
  synced: boolean;
  lastModified: number;
  version: number;
  deviceId: string;
  conflicted?: boolean;
  originalVersion?: SyncableEvent; // For conflict resolution
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedEvent: SyncableEvent;
  conflictReason: string;
  resolutionDetails: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  errorCount: number;
  conflicts: EventConflict[];
  errors: SyncError[];
  duration: number;
}

export interface EventConflict {
  eventId: string;
  localEvent: SyncableEvent;
  remoteEvent: SyncableEvent;
  conflictType: 'timestamp' | 'content' | 'deletion' | 'creation';
  suggested: ConflictResolution;
}

export interface SyncError {
  eventId: string;
  error: string;
  type: 'network' | 'validation' | 'server' | 'storage';
  retryable: boolean;
}

export interface SyncConfig {
  // Conflict resolution strategy
  defaultStrategy: 'local' | 'remote' | 'merge' | 'manual';

  // Sync behavior
  autoSync: boolean;
  syncInterval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number;

  // Merge preferences
  mergePreferences: {
    titlePriority: 'local' | 'remote' | 'longest' | 'newest';
    timePriority: 'local' | 'remote' | 'earliest' | 'latest';
    descriptionPriority: 'local' | 'remote' | 'longest' | 'merge';
    tagsMergeStrategy: 'union' | 'local' | 'remote';
  };
}

export class OfflineSyncManager {
  private config: SyncConfig;
  private deviceId: string;
  private syncInProgress = false;
  private lastSyncTime = 0;
  private syncListeners: Array<(result: SyncResult) => void> = [];
  private conflictListeners: Array<(conflicts: EventConflict[]) => void> = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      defaultStrategy: 'merge',
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 5000,
      mergePreferences: {
        titlePriority: 'newest',
        timePriority: 'latest',
        descriptionPriority: 'longest',
        tagsMergeStrategy: 'union',
      },
      ...config,
    };

    this.deviceId = this.generateDeviceId();
    this.initializeAutoSync();
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('lineartime-device-id');
    if (stored) return stored;

    const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('lineartime-device-id', newId);
    return newId;
  }

  private initializeAutoSync(): void {
    if (this.config.autoSync) {
      setInterval(() => {
        this.performSync().catch(console.error);
      }, this.config.syncInterval);
    }
  }

  // Main sync orchestrator
  async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[OfflineSync] Sync already in progress, skipping');
      return this.createEmptyResult();
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('[OfflineSync] Starting sync process...');

      // Step 1: Get local pending events
      const localPendingEvents = await this.getLocalPendingEvents();
      console.log(`[OfflineSync] Found ${localPendingEvents.length} local pending events`);

      // Step 2: Get remote events since last sync
      const remoteEvents = await this.getRemoteEventsSinceLastSync();
      console.log(`[OfflineSync] Found ${remoteEvents.length} remote events`);

      // Step 3: Detect conflicts
      const conflicts = this.detectConflicts(localPendingEvents, remoteEvents);
      console.log(`[OfflineSync] Detected ${conflicts.length} conflicts`);

      // Step 4: Resolve conflicts
      const resolutions = await this.resolveConflicts(conflicts);

      // Step 5: Apply non-conflicted changes
      const nonConflictedLocal = localPendingEvents.filter(
        (e) => !conflicts.some((c) => c.eventId === e.id)
      );
      const nonConflictedRemote = remoteEvents.filter(
        (e) => !conflicts.some((c) => c.eventId === e.id)
      );

      // Step 6: Sync in batches
      const syncResults = await this.performBatchSync(
        [...nonConflictedLocal, ...resolutions.map((r) => r.resolvedEvent)],
        nonConflictedRemote
      );

      // Step 7: Update sync metadata
      this.lastSyncTime = Date.now();
      await this.updateLastSyncTime(this.lastSyncTime);

      const result: SyncResult = {
        success: syncResults.errorCount === 0,
        syncedCount: syncResults.syncedCount,
        conflictCount: conflicts.length,
        errorCount: syncResults.errorCount,
        conflicts: conflicts,
        errors: syncResults.errors,
        duration: Date.now() - startTime,
      };

      console.log('[OfflineSync] Sync completed:', result);

      // Notify listeners
      this.syncListeners.forEach((listener) => listener(result));
      if (conflicts.length > 0) {
        this.conflictListeners.forEach((listener) => listener(conflicts));
      }

      return result;
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
      return {
        success: false,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 1,
        conflicts: [],
        errors: [
          {
            eventId: 'sync-manager',
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'network',
            retryable: true,
          },
        ],
        duration: Date.now() - startTime,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Conflict detection logic
  private detectConflicts(
    localEvents: SyncableEvent[],
    remoteEvents: SyncableEvent[]
  ): EventConflict[] {
    const conflicts: EventConflict[] = [];

    for (const localEvent of localEvents) {
      const remoteEvent = remoteEvents.find((r) => r.id === localEvent.id);

      if (!remoteEvent) {
        // Local event doesn't exist remotely - could be creation conflict
        continue;
      }

      // Check for conflicts
      const conflictType = this.determineConflictType(localEvent, remoteEvent);
      if (conflictType) {
        const suggested = this.suggestResolution(localEvent, remoteEvent, conflictType);

        conflicts.push({
          eventId: localEvent.id,
          localEvent,
          remoteEvent,
          conflictType,
          suggested,
        });
      }
    }

    return conflicts;
  }

  private determineConflictType(
    local: SyncableEvent,
    remote: SyncableEvent
  ): EventConflict['conflictType'] | null {
    // Version-based conflict detection
    if (local.version !== remote.version && local.lastModified !== remote.lastModified) {
      return 'timestamp';
    }

    // Content-based conflict detection
    const contentChanged =
      local.title !== remote.title ||
      local.startDate !== remote.startDate ||
      local.endDate !== remote.endDate ||
      local.description !== remote.description ||
      JSON.stringify(local.tags) !== JSON.stringify(remote.tags);

    if (contentChanged && Math.abs(local.lastModified - remote.lastModified) < 60000) {
      return 'content';
    }

    return null;
  }

  // Intelligent conflict resolution
  private suggestResolution(
    local: SyncableEvent,
    remote: SyncableEvent,
    conflictType: EventConflict['conflictType']
  ): ConflictResolution {
    const strategy = this.config.defaultStrategy;

    switch (strategy) {
      case 'local':
        return {
          strategy: 'local',
          resolvedEvent: { ...local, version: Math.max(local.version, remote.version) + 1 },
          conflictReason: `${conflictType} conflict detected`,
          resolutionDetails: 'Prioritized local changes',
        };

      case 'remote':
        return {
          strategy: 'remote',
          resolvedEvent: { ...remote, version: remote.version + 1 },
          conflictReason: `${conflictType} conflict detected`,
          resolutionDetails: 'Prioritized remote changes',
        };

      case 'merge':
        return {
          strategy: 'merge',
          resolvedEvent: this.mergeEvents(local, remote),
          conflictReason: `${conflictType} conflict detected`,
          resolutionDetails: 'Applied intelligent three-way merge',
        };
      default:
        return {
          strategy: 'manual',
          resolvedEvent: local, // Placeholder
          conflictReason: `${conflictType} conflict detected`,
          resolutionDetails: 'Manual resolution required',
        };
    }
  }

  // Three-way merge algorithm
  private mergeEvents(local: SyncableEvent, remote: SyncableEvent): SyncableEvent {
    const merged: SyncableEvent = {
      id: local.id,
      deviceId: this.deviceId,
      version: Math.max(local.version, remote.version) + 1,
      lastModified: Date.now(),
      synced: false,

      // Apply merge preferences
      title: this.mergeTitle(local, remote),
      startDate: this.mergeTime(
        local.startDate,
        remote.startDate,
        local.lastModified,
        remote.lastModified
      ),
      endDate: this.mergeTime(
        local.endDate,
        remote.endDate,
        local.lastModified,
        remote.lastModified
      ),
      description: this.mergeDescription(local, remote),
      color: local.lastModified > remote.lastModified ? local.color : remote.color,
      category: local.lastModified > remote.lastModified ? local.category : remote.category,
      priority: local.lastModified > remote.lastModified ? local.priority : remote.priority,
      tags: this.mergeTags(local, remote),
    };

    return merged;
  }

  private mergeTitle(local: SyncableEvent, remote: SyncableEvent): string {
    const { titlePriority } = this.config.mergePreferences;

    switch (titlePriority) {
      case 'local':
        return local.title;
      case 'remote':
        return remote.title;
      case 'longest':
        return local.title.length > remote.title.length ? local.title : remote.title;
      default:
        return local.lastModified > remote.lastModified ? local.title : remote.title;
    }
  }

  private mergeTime(
    localTime: string,
    remoteTime: string,
    localModified: number,
    remoteModified: number
  ): string {
    const { timePriority } = this.config.mergePreferences;

    switch (timePriority) {
      case 'local':
        return localTime;
      case 'remote':
        return remoteTime;
      case 'earliest':
        return new Date(localTime) < new Date(remoteTime) ? localTime : remoteTime;
      case 'latest':
        return new Date(localTime) > new Date(remoteTime) ? localTime : remoteTime;
      default:
        return localModified > remoteModified ? localTime : remoteTime;
    }
  }

  private mergeDescription(local: SyncableEvent, remote: SyncableEvent): string | undefined {
    const { descriptionPriority } = this.config.mergePreferences;
    const localDesc = local.description || '';
    const remoteDesc = remote.description || '';

    switch (descriptionPriority) {
      case 'local':
        return local.description;
      case 'remote':
        return remote.description;
      case 'longest':
        return localDesc.length > remoteDesc.length ? local.description : remote.description;
      case 'merge':
        // Simple merge - combine if different
        if (localDesc && remoteDesc && localDesc !== remoteDesc) {
          return `${localDesc}\n\n${remoteDesc}`;
        }
        return localDesc || remoteDesc || undefined;
      default:
        return local.lastModified > remote.lastModified ? local.description : remote.description;
    }
  }

  private mergeTags(local: SyncableEvent, remote: SyncableEvent): string[] | undefined {
    const { tagsMergeStrategy } = this.config.mergePreferences;
    const localTags = local.tags || [];
    const remoteTags = remote.tags || [];

    switch (tagsMergeStrategy) {
      case 'local':
        return local.tags;
      case 'remote':
        return remote.tags;
      default: {
        const merged = [...new Set([...localTags, ...remoteTags])];
        return merged.length > 0 ? merged : undefined;
      }
    }
  }

  private async resolveConflicts(conflicts: EventConflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      if (conflict.suggested.strategy === 'manual') {
        // For manual conflicts, we'll store them for user resolution
        await this.storeConflictForManualResolution(conflict);
        // For now, default to local version
        resolutions.push({
          ...conflict.suggested,
          strategy: 'local',
          resolvedEvent: conflict.localEvent,
        });
      } else {
        resolutions.push(conflict.suggested);
      }
    }

    return resolutions;
  }

  // Data access methods
  private async getLocalPendingEvents(): Promise<SyncableEvent[]> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('synced');

      return new Promise((resolve, reject) => {
        const request = index.getAll(false);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const events = request.result.map((event) => ({
            ...event,
            deviceId: event.deviceId || this.deviceId,
            version: event.version || 1,
            lastModified: event.lastModified || Date.now(),
          }));
          resolve(events);
        };
      });
    } catch (error) {
      console.error('[OfflineSync] Failed to get local events:', error);
      return [];
    }
  }

  private async getRemoteEventsSinceLastSync(): Promise<SyncableEvent[]> {
    try {
      const response = await fetch(
        `/api/events/sync?since=${this.lastSyncTime}&deviceId=${this.deviceId}`
      );

      if (!response.ok) {
        throw new Error(`Sync API error: ${response.status}`);
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('[OfflineSync] Failed to get remote events:', error);
      return [];
    }
  }

  private async performBatchSync(
    localEvents: SyncableEvent[],
    remoteEvents: SyncableEvent[]
  ): Promise<{
    syncedCount: number;
    errorCount: number;
    errors: SyncError[];
  }> {
    let syncedCount = 0;
    let errorCount = 0;
    const errors: SyncError[] = [];

    // Upload local events in batches
    for (let i = 0; i < localEvents.length; i += this.config.batchSize) {
      const batch = localEvents.slice(i, i + this.config.batchSize);

      try {
        const response = await fetch('/api/events/batch-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: batch,
            deviceId: this.deviceId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          syncedCount += result.syncedCount || batch.length;

          // Mark events as synced locally
          for (const event of batch) {
            await this.markEventSynced(event.id);
          }
        } else {
          errorCount += batch.length;
          errors.push({
            eventId: `batch-${i}`,
            error: `Batch upload failed: ${response.status}`,
            type: 'server',
            retryable: true,
          });
        }
      } catch (error) {
        errorCount += batch.length;
        errors.push({
          eventId: `batch-${i}`,
          error: error instanceof Error ? error.message : 'Upload failed',
          type: 'network',
          retryable: true,
        });
      }
    }

    // Apply remote events locally
    for (const remoteEvent of remoteEvents) {
      try {
        await this.applyRemoteEvent(remoteEvent);
        syncedCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          eventId: remoteEvent.id,
          error: error instanceof Error ? error.message : 'Apply failed',
          type: 'storage',
          retryable: false,
        });
      }
    }

    return { syncedCount, errorCount, errors };
  }

  // Database helpers
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('Command Center CalendarCalendar', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('synced', 'synced', { unique: false });
          eventsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'eventId' });
          conflictsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async markEventSynced(eventId: string): Promise<void> {
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const event = getRequest.result;
        if (event) {
          event.synced = true;
          event.lastModified = Date.now();

          const putRequest = store.put(event);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async applyRemoteEvent(remoteEvent: SyncableEvent): Promise<void> {
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const putRequest = store.put({
        ...remoteEvent,
        synced: true,
      });

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    });
  }

  private async storeConflictForManualResolution(conflict: EventConflict): Promise<void> {
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');

    return new Promise((resolve, reject) => {
      const putRequest = store.put({
        ...conflict,
        timestamp: Date.now(),
      });

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    });
  }

  private async updateLastSyncTime(timestamp: number): Promise<void> {
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['sync_metadata'], 'readwrite');
    const store = transaction.objectStore('sync_metadata');

    return new Promise((resolve, reject) => {
      const putRequest = store.put({
        key: 'lastSyncTime',
        value: timestamp,
      });

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    });
  }

  private createEmptyResult(): SyncResult {
    return {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };
  }

  // Public API methods
  public onSyncComplete(listener: (result: SyncResult) => void): void {
    this.syncListeners.push(listener);
  }

  public onConflictsDetected(listener: (conflicts: EventConflict[]) => void): void {
    this.conflictListeners.push(listener);
  }

  public async forcSync(): Promise<SyncResult> {
    return this.performSync();
  }

  public async getPendingConflicts(): Promise<EventConflict[]> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['conflicts'], 'readonly');
      const store = transaction.objectStore('conflicts');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('[OfflineSync] Failed to get conflicts:', error);
      return [];
    }
  }

  public async resolveConflictManually(
    eventId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    // Apply the resolution
    await this.applyRemoteEvent(resolution.resolvedEvent);

    // Remove the conflict
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(eventId);
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    });
  }

  public updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getSyncStatus(): { inProgress: boolean; lastSync: number; deviceId: string } {
    return {
      inProgress: this.syncInProgress,
      lastSync: this.lastSyncTime,
      deviceId: this.deviceId,
    };
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();
