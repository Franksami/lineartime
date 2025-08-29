/**
 * AnalyticsBackgroundSync - Background synchronization for drag-and-drop analytics
 * Integrates with service worker and provides offline-first analytics collection
 */

import { useDragDropAnalytics } from './dragDropAnalytics';
import type { DragDropEvent, DragDropMetrics } from './dragDropAnalytics';

export interface AnalyticsQueueItem {
  id: string;
  type: 'drag_drop_event' | 'analytics_batch' | 'performance_metric';
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
}

export interface BackgroundSyncConfig {
  // Sync intervals
  highPriorityInterval: number; // 30 seconds
  mediumPriorityInterval: number; // 2 minutes
  lowPriorityInterval: number; // 10 minutes

  // Batch settings
  batchSize: number; // Events per batch
  maxQueueSize: number; // Max items in queue

  // Retry settings
  maxRetries: number; // Max retry attempts
  retryBackoff: number; // Backoff multiplier

  // Data retention
  retentionDays: number; // Days to keep data
  compressionThreshold: number; // Compress after N items
}

export class AnalyticsBackgroundSync {
  private config: BackgroundSyncConfig;
  private syncQueue: AnalyticsQueueItem[] = [];
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
  private syncInProgress = false;
  private intervals: { [key: string]: NodeJS.Timeout } = {};
  private dragDropAnalytics = useDragDropAnalytics();

  constructor(config: Partial<BackgroundSyncConfig> = {}) {
    this.config = {
      highPriorityInterval: 30000, // 30 seconds
      mediumPriorityInterval: 120000, // 2 minutes
      lowPriorityInterval: 600000, // 10 minutes
      batchSize: 50,
      maxQueueSize: 1000,
      maxRetries: 3,
      retryBackoff: 2,
      retentionDays: 30,
      compressionThreshold: 100,
      ...config,
    };

    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    // Only initialize on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Load persisted queue
    await this.loadPersistedQueue();

    // Set up sync intervals
    this.setupSyncIntervals();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }

    // Listen for service worker messages
    this.setupServiceWorkerCommunication();

    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    console.log('[AnalyticsBG] Background sync initialized');
  }

  private setupSyncIntervals(): void {
    // High priority sync (critical events)
    this.intervals.high = setInterval(() => {
      this.syncPriorityQueue('high');
    }, this.config.highPriorityInterval);

    // Medium priority sync (user interactions)
    this.intervals.medium = setInterval(() => {
      this.syncPriorityQueue('medium');
    }, this.config.mediumPriorityInterval);

    // Low priority sync (bulk data)
    this.intervals.low = setInterval(() => {
      this.syncPriorityQueue('low');
    }, this.config.lowPriorityInterval);
  }

  private setupServiceWorkerCommunication(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'ANALYTICS_SYNC_SUCCESS':
            this.handleSyncSuccess(payload);
            break;

          case 'ANALYTICS_SYNC_FAILED':
            this.handleSyncFailure(payload);
            break;

          case 'ANALYTICS_QUEUE_REQUEST':
            this.sendQueueToServiceWorker();
            break;
        }
      });
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    console.log('[AnalyticsBG] Coming online - triggering sync');

    // Immediately sync high priority items
    this.syncPriorityQueue('high');

    // Register background sync with service worker
    this.registerBackgroundSync();
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('[AnalyticsBG] Going offline - queuing analytics');
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.isOnline) {
      // App became visible and we're online - sync important data
      setTimeout(() => {
        this.syncPriorityQueue('high');
        this.syncPriorityQueue('medium');
      }, 1000);
    } else if (document.visibilityState === 'hidden') {
      // App is being backgrounded - persist queue
      this.persistQueue();
    }
  }

  // Public API - Add analytics events to sync queue
  public queueDragDropEvent(
    event: DragDropEvent,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    const item: AnalyticsQueueItem = {
      id: `dd-${event.id}-${Date.now()}`,
      type: 'drag_drop_event',
      data: event,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.addToQueue(item);
  }

  public queueAnalyticsBatch(
    metrics: DragDropMetrics,
    priority: 'low' | 'medium' | 'high' = 'low'
  ): void {
    const item: AnalyticsQueueItem = {
      id: `batch-${Date.now()}`,
      type: 'analytics_batch',
      data: metrics,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.addToQueue(item);
  }

  public queuePerformanceMetric(metric: any, priority: 'low' | 'medium' | 'high' = 'low'): void {
    const item: AnalyticsQueueItem = {
      id: `perf-${Date.now()}`,
      type: 'performance_metric',
      data: metric,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.addToQueue(item);
  }

  private addToQueue(item: AnalyticsQueueItem): void {
    // Check queue size limit
    if (this.syncQueue.length >= this.config.maxQueueSize) {
      // Remove oldest low priority items
      this.syncQueue = this.syncQueue
        .filter((item) => item.priority !== 'low')
        .slice(0, this.config.maxQueueSize - 1);
    }

    this.syncQueue.push(item);

    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    });

    // If online and high priority, sync immediately
    if (this.isOnline && item.priority === 'high') {
      this.syncPriorityQueue('high');
    }

    // Auto-persist queue periodically
    if (this.syncQueue.length % 10 === 0) {
      this.persistQueue();
    }
  }

  private async syncPriorityQueue(priority: 'low' | 'medium' | 'high'): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    const itemsToSync = this.syncQueue
      .filter((item) => item.priority === priority)
      .slice(0, this.config.batchSize);

    if (itemsToSync.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      console.log(`[AnalyticsBG] Syncing ${itemsToSync.length} ${priority} priority items`);

      // Group by type for efficient processing
      const groupedItems = this.groupItemsByType(itemsToSync);

      // Sync each group
      for (const [type, items] of Object.entries(groupedItems)) {
        await this.syncItemGroup(type, items);
      }

      // Remove synced items from queue
      this.syncQueue = this.syncQueue.filter(
        (item) => !itemsToSync.some((synced) => synced.id === item.id)
      );

      console.log(`[AnalyticsBG] Successfully synced ${itemsToSync.length} items`);
    } catch (error) {
      console.error('[AnalyticsBG] Sync failed:', error);

      // Increment retry count for failed items
      itemsToSync.forEach((item) => {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          console.warn(`[AnalyticsBG] Item ${item.id} exceeded max retries, removing`);
          this.syncQueue = this.syncQueue.filter((q) => q.id !== item.id);
        }
      });
    } finally {
      this.syncInProgress = false;
      await this.persistQueue();
    }
  }

  private groupItemsByType(items: AnalyticsQueueItem[]): { [type: string]: AnalyticsQueueItem[] } {
    return items.reduce(
      (groups, item) => {
        if (!groups[item.type]) {
          groups[item.type] = [];
        }
        groups[item.type].push(item);
        return groups;
      },
      {} as { [type: string]: AnalyticsQueueItem[] }
    );
  }

  private async syncItemGroup(type: string, items: AnalyticsQueueItem[]): Promise<void> {
    switch (type) {
      case 'drag_drop_event':
        await this.syncDragDropEvents(items);
        break;

      case 'analytics_batch':
        await this.syncAnalyticsBatches(items);
        break;

      case 'performance_metric':
        await this.syncPerformanceMetrics(items);
        break;

      default:
        console.warn(`[AnalyticsBG] Unknown item type: ${type}`);
    }
  }

  private async syncDragDropEvents(items: AnalyticsQueueItem[]): Promise<void> {
    const events = items.map((item) => item.data);

    try {
      const response = await fetch('/api/analytics/drag-drop/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Drag-drop events sync failed: ${response.status}`);
      }

      console.log(`[AnalyticsBG] Synced ${events.length} drag-drop events`);
    } catch (error) {
      // Try service worker background sync as fallback
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('drag-drop-sync');
      }
      throw error;
    }
  }

  private async syncAnalyticsBatches(items: AnalyticsQueueItem[]): Promise<void> {
    const batches = items.map((item) => item.data);

    try {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches }),
      });

      if (!response.ok) {
        throw new Error(`Analytics batch sync failed: ${response.status}`);
      }

      console.log(`[AnalyticsBG] Synced ${batches.length} analytics batches`);
    } catch (error) {
      // Try service worker background sync as fallback
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('analytics-sync');
      }
      throw error;
    }
  }

  private async syncPerformanceMetrics(items: AnalyticsQueueItem[]): Promise<void> {
    const metrics = items.map((item) => item.data);

    try {
      const response = await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error(`Performance metrics sync failed: ${response.status}`);
      }

      console.log(`[AnalyticsBG] Synced ${metrics.length} performance metrics`);
    } catch (error) {
      console.error('[AnalyticsBG] Performance sync failed:', error);
      throw error;
    }
  }

  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('analytics-sync');
        await registration.sync.register('drag-drop-sync');
        console.log('[AnalyticsBG] Background sync registered with service worker');
      } catch (error) {
        console.error('[AnalyticsBG] Background sync registration failed:', error);
      }
    }
  }

  private async sendQueueToServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'ANALYTICS_QUEUE_DATA',
          payload: {
            queue: this.syncQueue,
            config: this.config,
          },
        });
      }
    }
  }

  private handleSyncSuccess(payload: any): void {
    const { syncedIds } = payload;

    // Remove synced items from queue
    this.syncQueue = this.syncQueue.filter((item) => !syncedIds.includes(item.id));

    this.persistQueue();
    console.log(`[AnalyticsBG] Service worker synced ${syncedIds.length} items`);
  }

  private handleSyncFailure(payload: any): void {
    const { failedIds, error } = payload;

    // Increment retry count for failed items
    this.syncQueue.forEach((item) => {
      if (failedIds.includes(item.id)) {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          console.warn(`[AnalyticsBG] Item ${item.id} exceeded max retries`);
        }
      }
    });

    // Remove items that exceeded max retries
    this.syncQueue = this.syncQueue.filter((item) => item.retryCount < item.maxRetries);

    this.persistQueue();
    console.error('[AnalyticsBG] Service worker sync failed:', error);
  }

  // Queue persistence
  private async persistQueue(): Promise<void> {
    try {
      const queueData = {
        items: this.syncQueue,
        timestamp: Date.now(),
      };

      localStorage.setItem('analytics-sync-queue', JSON.stringify(queueData));

      // Also persist to IndexedDB for reliability
      await this.persistToIndexedDB(queueData);
    } catch (error) {
      console.error('[AnalyticsBG] Failed to persist queue:', error);
    }
  }

  private async loadPersistedQueue(): Promise<void> {
    try {
      // Try IndexedDB first
      const indexedDBData = await this.loadFromIndexedDB();
      if (indexedDBData) {
        this.syncQueue = indexedDBData.items || [];
        return;
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('analytics-sync-queue');
      if (stored) {
        const queueData = JSON.parse(stored);
        const age = Date.now() - queueData.timestamp;

        // Only load if data is less than retention period
        if (age < this.config.retentionDays * 24 * 60 * 60 * 1000) {
          this.syncQueue = queueData.items || [];
        }
      }

      console.log(`[AnalyticsBG] Loaded ${this.syncQueue.length} items from persistent storage`);
    } catch (error) {
      console.error('[AnalyticsBG] Failed to load persisted queue:', error);
      this.syncQueue = [];
    }
  }

  private async persistToIndexedDB(data: any): Promise<void> {
    // Only access indexedDB on client-side
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('Command Center CalendarAnalytics', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');

        const putRequest = store.put({ id: 'main', ...data });
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      };
    });
  }

  private async loadFromIndexedDB(): Promise<any> {
    // Only access indexedDB on client-side
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return null;
    }

    return new Promise((resolve, _reject) => {
      const request = indexedDB.open('Command Center CalendarAnalytics', 1);

      request.onerror = () => resolve(null); // Fail gracefully
      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains('sync_queue')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['sync_queue'], 'readonly');
        const store = transaction.objectStore('sync_queue');
        const getRequest = store.get('main');

        getRequest.onerror = () => resolve(null);
        getRequest.onsuccess = () => resolve(getRequest.result);
      };
    });
  }

  // Public methods for monitoring
  public getQueueStatus(): {
    size: number;
    byPriority: { high: number; medium: number; low: number };
    oldestItem: number | null;
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    const byPriority = this.syncQueue.reduce(
      (acc, item) => {
        acc[item.priority]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    const oldestItem =
      this.syncQueue.length > 0 ? Math.min(...this.syncQueue.map((item) => item.timestamp)) : null;

    return {
      size: this.syncQueue.length,
      byPriority,
      oldestItem,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  public async forceSync(): Promise<void> {
    console.log('[AnalyticsBG] Force sync requested');

    await Promise.all([
      this.syncPriorityQueue('high'),
      this.syncPriorityQueue('medium'),
      this.syncPriorityQueue('low'),
    ]);
  }

  public clearQueue(): void {
    this.syncQueue = [];
    this.persistQueue();
    console.log('[AnalyticsBG] Queue cleared');
  }

  public updateConfig(newConfig: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart intervals if timing changed
    if (
      newConfig.highPriorityInterval ||
      newConfig.mediumPriorityInterval ||
      newConfig.lowPriorityInterval
    ) {
      Object.values(this.intervals).forEach((interval) => clearInterval(interval));
      this.setupSyncIntervals();
    }
  }

  public destroy(): void {
    // Clean up intervals
    Object.values(this.intervals).forEach((interval) => clearInterval(interval));

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Final persist
    this.persistQueue();

    console.log('[AnalyticsBG] Background sync destroyed');
  }
}

// Singleton instance
export const analyticsBackgroundSync = new AnalyticsBackgroundSync();

// Integration with existing drag-drop analytics
export function initializeAnalyticsBackgroundSync(): void {
  // Hook into existing drag-drop analytics
  const originalTrackEvent = useDragDropAnalytics().trackEvent;

  // Wrap trackEvent to also queue for background sync
  useDragDropAnalytics().trackEvent = function (event: DragDropEvent) {
    // Call original tracking
    originalTrackEvent.call(this, event);

    // Queue for background sync
    const priority = event.eventType === 'drop_success' ? 'medium' : 'low';
    analyticsBackgroundSync.queueDragDropEvent(event, priority);
  };

  console.log('[AnalyticsBG] Integration with drag-drop analytics initialized');
}
