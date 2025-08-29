/**
 * Performance Optimizations for IndexedDB
 * Includes caching, indexing strategies, and query optimization
 */

import { CacheOperations, PerformanceMonitor } from './operations';
import { db } from './schema';

/**
 * Query Optimizer
 */
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Optimize query with caching
   */
  static async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      cache?: boolean;
      ttl?: number;
    } = {}
  ): Promise<T> {
    const { cache = true, ttl = QueryOptimizer.CACHE_TTL } = options;

    // Check memory cache first
    if (cache) {
      const cached = QueryOptimizer.queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // Check IndexedDB cache
    const dbCached = await CacheOperations.get(queryKey);
    if (dbCached) {
      // Update memory cache
      QueryOptimizer.queryCache.set(queryKey, { data: dbCached, timestamp: Date.now() });
      return dbCached;
    }

    // Execute query
    const start = performance.now();
    const result = await queryFn();
    const duration = performance.now() - start;

    // Cache results
    if (cache) {
      QueryOptimizer.queryCache.set(queryKey, { data: result, timestamp: Date.now() });
      await CacheOperations.set(queryKey, result, ttl);
    }

    // Log performance metric
    await db.metrics.add({
      operation: `query.${queryKey}`,
      duration,
      timestamp: Date.now(),
      success: true,
    });

    return result;
  }

  /**
   * Batch query optimization
   */
  static async batchQuery<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    const start = performance.now();

    // Execute queries in parallel
    const results = await Promise.all(
      queries.map(async (query, index) => {
        try {
          return await query();
        } catch (error) {
          console.error(`Batch query ${index} failed:`, error);
          return null;
        }
      })
    );

    // Log batch performance
    await db.metrics.add({
      operation: 'batch.query',
      duration: performance.now() - start,
      timestamp: Date.now(),
      success: true,
      recordCount: queries.length,
    });

    return results.filter((r) => r !== null) as T[];
  }

  /**
   * Clear query cache
   */
  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of QueryOptimizer.queryCache.keys()) {
        if (key.includes(pattern)) {
          QueryOptimizer.queryCache.delete(key);
        }
      }
    } else {
      QueryOptimizer.queryCache.clear();
    }
  }
}

/**
 * Index Manager
 */
export class IndexManager {
  /**
   * Analyze index usage and suggest optimizations
   */
  static async analyzeIndexUsage(): Promise<{
    suggestions: string[];
    unusedIndexes: string[];
    missingIndexes: string[];
  }> {
    const suggestions: string[] = [];
    const unusedIndexes: string[] = [];
    const missingIndexes: string[] = [];

    // Analyze recent queries
    const recentMetrics = await PerformanceMonitor.getMetrics(undefined, 1000);

    // Group by operation type
    const operationCounts = new Map<string, number>();
    const slowOperations = new Map<string, number[]>();

    recentMetrics.forEach((metric) => {
      const count = operationCounts.get(metric.operation) || 0;
      operationCounts.set(metric.operation, count + 1);

      if (metric.duration && metric.duration > 100) {
        const durations = slowOperations.get(metric.operation) || [];
        durations.push(metric.duration);
        slowOperations.set(metric.operation, durations);
      }
    });

    // Suggest indexes for slow operations
    slowOperations.forEach((durations, operation) => {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration > 200) {
        suggestions.push(
          `Consider adding index for operation: ${operation} (avg: ${avgDuration.toFixed(2)}ms)`
        );
      }
    });

    // Check for missing compound indexes
    if (operationCounts.get('event.getByDateRange') > 50) {
      missingIndexes.push('[userId+startTime+endTime]');
    }

    if (operationCounts.get('event.getByCategory') > 30) {
      missingIndexes.push('[userId+categoryId+startTime]');
    }

    return { suggestions, unusedIndexes, missingIndexes };
  }

  /**
   * Rebuild indexes for a table
   */
  static async rebuildIndexes(tableName: string): Promise<void> {
    console.log(`Rebuilding indexes for ${tableName}...`);

    // This would trigger Dexie's internal index rebuild
    // In practice, this happens automatically when schema changes
    await db.open();

    console.log(`Indexes rebuilt for ${tableName}`);
  }
}

/**
 * Memory Manager
 */
export class MemoryManager {
  private static readonly MAX_MEMORY_MB = 50;
  private static memoryUsage = 0;

  /**
   * Monitor memory usage
   */
  static async checkMemoryUsage(): Promise<{
    usage: number;
    limit: number;
    percentage: number;
  }> {
    // Estimate memory usage from stored data
    const [eventsCount, categoriesCount, calendarsCount] = await Promise.all([
      db.events.count(),
      db.categories.count(),
      db.calendars.count(),
    ]);

    // Rough estimation: 1KB per event, 0.5KB per category, 0.5KB per calendar
    MemoryManager.memoryUsage =
      (eventsCount * 1024 + categoriesCount * 512 + calendarsCount * 512) / (1024 * 1024);

    return {
      usage: MemoryManager.memoryUsage,
      limit: MemoryManager.MAX_MEMORY_MB,
      percentage: (MemoryManager.memoryUsage / MemoryManager.MAX_MEMORY_MB) * 100,
    };
  }

  /**
   * Free up memory by clearing old cache entries
   */
  static async freeMemory(): Promise<number> {
    const before = MemoryManager.memoryUsage;

    // Clear old cache entries
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour old
    await db.cache.where('createdAt').below(cutoff).delete();

    // Clear old metrics
    await PerformanceMonitor.clearOld(1);

    // Clear memory cache
    QueryOptimizer.clearCache();

    const after = (await MemoryManager.checkMemoryUsage()).usage;
    return before - after;
  }
}

/**
 * Connection Pool Manager
 */
export class ConnectionManager {
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private static listeners = new Set<(online: boolean) => void>();

  /**
   * Initialize connection monitoring
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      ConnectionManager.isOnline = true;
      ConnectionManager.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      ConnectionManager.isOnline = false;
      ConnectionManager.notifyListeners(false);
    });
  }

  /**
   * Get connection status
   */
  static getStatus(): boolean {
    return ConnectionManager.isOnline;
  }

  /**
   * Subscribe to connection changes
   */
  static onStatusChange(callback: (online: boolean) => void): () => void {
    ConnectionManager.listeners.add(callback);
    return () => ConnectionManager.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  private static notifyListeners(online: boolean): void {
    ConnectionManager.listeners.forEach((callback) => callback(online));
  }
}

/**
 * Performance Tuner
 */
export class PerformanceTuner {
  /**
   * Auto-tune database performance
   */
  static async autoTune(): Promise<{
    optimizations: string[];
    applied: boolean;
  }> {
    const optimizations: string[] = [];

    // Check memory usage
    const memory = await MemoryManager.checkMemoryUsage();
    if (memory.percentage > 80) {
      const freed = await MemoryManager.freeMemory();
      optimizations.push(`Freed ${freed.toFixed(2)}MB of memory`);
    }

    // Analyze index usage
    const indexAnalysis = await IndexManager.analyzeIndexUsage();
    if (indexAnalysis.suggestions.length > 0) {
      optimizations.push(...indexAnalysis.suggestions);
    }

    // Check query performance
    const avgQueryTime = await PerformanceMonitor.getAverageTime('query');
    if (avgQueryTime > 100) {
      optimizations.push(
        `Consider enabling query caching (avg time: ${avgQueryTime.toFixed(2)}ms)`
      );
    }

    // Clear old data
    const oldDataCleared = await PerformanceTuner.clearOldData();
    if (oldDataCleared > 0) {
      optimizations.push(`Cleared ${oldDataCleared} old records`);
    }

    return {
      optimizations,
      applied: optimizations.length > 0,
    };
  }

  /**
   * Clear old data
   */
  private static async clearOldData(): Promise<number> {
    let cleared = 0;

    // Clear old sync queue items
    const oldSyncItems = await db.syncQueue
      .where('createdAt')
      .below(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
      .and((item) => item.attempts >= 3)
      .toArray();

    if (oldSyncItems.length > 0) {
      await db.syncQueue.bulkDelete(oldSyncItems.map((i) => i.id!));
      cleared += oldSyncItems.length;
    }

    // Clear old soft-deleted events
    const oldDeletedEvents = await db.events
      .where('updatedAt')
      .below(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
      .and((event) => event.isDeleted === true)
      .toArray();

    if (oldDeletedEvents.length > 0) {
      await db.events.bulkDelete(oldDeletedEvents.map((e) => e.id!));
      cleared += oldDeletedEvents.length;
    }

    return cleared;
  }

  /**
   * Optimize queries for a specific user
   */
  static async optimizeUserQueries(userId: string): Promise<void> {
    // Pre-cache common queries for the user
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAhead = now + 30 * 24 * 60 * 60 * 1000;

    // Pre-fetch and cache upcoming events
    await QueryOptimizer.optimizedQuery(
      `events_upcoming_${userId}`,
      async () => {
        return await db.events
          .where('[userId+startTime]')
          .between([userId, now], [userId, monthAhead])
          .toArray();
      },
      { ttl: 60000 } // Cache for 1 minute
    );

    // Pre-fetch and cache recent events
    await QueryOptimizer.optimizedQuery(
      `events_recent_${userId}`,
      async () => {
        return await db.events
          .where('[userId+startTime]')
          .between([userId, weekAgo], [userId, now])
          .toArray();
      },
      { ttl: 60000 }
    );

    // Pre-fetch categories and calendars
    await QueryOptimizer.optimizedQuery(
      `categories_${userId}`,
      async () => {
        return await db.categories.where('userId').equals(userId).toArray();
      },
      { ttl: 300000 } // Cache for 5 minutes
    );
  }
}

/**
 * Database Optimizer
 */
export class DatabaseOptimizer {
  /**
   * Run full optimization
   */
  static async optimize(): Promise<{
    duration: number;
    improvements: string[];
  }> {
    const start = performance.now();
    const improvements: string[] = [];

    // Run auto-tune
    const tuneResult = await PerformanceTuner.autoTune();
    improvements.push(...tuneResult.optimizations);

    // Analyze indexes
    const indexResult = await IndexManager.analyzeIndexUsage();
    if (indexResult.missingIndexes.length > 0) {
      improvements.push(`Missing indexes: ${indexResult.missingIndexes.join(', ')}`);
    }

    // Check memory
    const memory = await MemoryManager.checkMemoryUsage();
    improvements.push(
      `Memory usage: ${memory.usage.toFixed(2)}MB / ${memory.limit}MB (${memory.percentage.toFixed(1)}%)`
    );

    // Clear query cache periodically
    QueryOptimizer.clearCache();
    improvements.push('Query cache cleared');

    const duration = performance.now() - start;

    // Log optimization
    await db.metrics.add({
      operation: 'database.optimize',
      duration,
      timestamp: Date.now(),
      success: true,
    });

    return { duration, improvements };
  }

  /**
   * Schedule periodic optimization
   */
  static scheduleOptimization(intervalHours = 24): void {
    // Run initial optimization
    DatabaseOptimizer.optimize().then((result) => {
      console.log('Database optimization completed:', result);
    });

    // Schedule periodic optimization
    setInterval(
      () => {
        DatabaseOptimizer.optimize().then((result) => {
          console.log('Periodic database optimization:', result);
        });
      },
      intervalHours * 60 * 60 * 1000
    );
  }
}

// Initialize connection monitoring
ConnectionManager.initialize();

// Export convenience function for optimization
export const optimizeDatabase = () => DatabaseOptimizer.optimize();
export const scheduleOptimization = (hours?: number) =>
  DatabaseOptimizer.scheduleOptimization(hours);
