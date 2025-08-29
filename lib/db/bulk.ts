/**
 * Bulk Operations for IndexedDB
 * Efficient batch processing for large data sets
 */

import { SyncQueueOperations } from './operations';
import { StoredCalendar, type StoredCategory, type StoredEvent, db } from './schema';

/**
 * Bulk operation result
 */
export interface BulkResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  duration: number;
}

/**
 * Bulk Event Operations
 */
export class BulkEventOperations {
  /**
   * Bulk create events
   */
  static async bulkCreate(
    events: Omit<StoredEvent, 'id'>[],
    options: {
      batchSize?: number;
      validateDuplicates?: boolean;
    } = {}
  ): Promise<BulkResult> {
    const { batchSize = 100, validateDuplicates = false } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Validate duplicates if requested
    if (validateDuplicates) {
      const existingEvents = await db.events
        .where('userId')
        .equals(events[0]?.userId || '')
        .toArray();

      const existingSet = new Set(existingEvents.map((e) => `${e.title}_${e.startTime}`));

      events = events.filter((e) => !existingSet.has(`${e.title}_${e.startTime}`));
    }

    // Process in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      try {
        await db.transaction('rw', db.events, async () => {
          for (let j = 0; j < batch.length; j++) {
            try {
              await db.events.add(batch[j]);
              result.success++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                index: i + j,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
        });
      } catch (_error) {
        // Transaction failed, all items in batch failed
        for (let j = 0; j < batch.length; j++) {
          result.failed++;
          result.errors.push({
            index: i + j,
            error: 'Transaction failed',
          });
        }
      }
    }

    result.duration = performance.now() - start;

    // Log performance metric
    await db.metrics.add({
      operation: 'bulk.events.create',
      duration: result.duration,
      timestamp: Date.now(),
      success: result.failed === 0,
      recordCount: result.success,
    });

    return result;
  }

  /**
   * Bulk update events
   */
  static async bulkUpdate(
    updates: Array<{ id: number; changes: Partial<StoredEvent> }>,
    options: {
      batchSize?: number;
      skipSync?: boolean;
    } = {}
  ): Promise<BulkResult> {
    const { batchSize = 100, skipSync = false } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Process in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await db.transaction('rw', db.events, db.syncQueue, async () => {
        for (const update of batch) {
          try {
            const event = await db.events.get(update.id);
            if (!event) {
              throw new Error('Event not found');
            }

            // Update event
            await db.events.update(update.id, {
              ...update.changes,
              updatedAt: Date.now(),
              syncStatus: skipSync ? event.syncStatus : 'pending',
            });

            // Add to sync queue if not skipping
            if (!skipSync && event.syncStatus === 'synced') {
              await SyncQueueOperations.add({
                userId: event.userId,
                operation: 'update',
                entity: 'event',
                entityId: update.id,
                data: update.changes,
              });
            }

            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + batch.indexOf(update),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;

    // Log performance metric
    await db.metrics.add({
      operation: 'bulk.events.update',
      duration: result.duration,
      timestamp: Date.now(),
      success: result.failed === 0,
      recordCount: result.success,
    });

    return result;
  }

  /**
   * Bulk delete events
   */
  static async bulkDelete(
    ids: number[],
    options: {
      batchSize?: number;
      hardDelete?: boolean;
    } = {}
  ): Promise<BulkResult> {
    const { batchSize = 100, hardDelete = false } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Process in batches
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      await db.transaction('rw', db.events, db.syncQueue, async () => {
        for (const id of batch) {
          try {
            if (hardDelete) {
              await db.events.delete(id);
            } else {
              const event = await db.events.get(id);
              if (!event) {
                throw new Error('Event not found');
              }

              // Soft delete
              await db.events.update(id, {
                isDeleted: true,
                updatedAt: Date.now(),
                syncStatus: 'pending',
              });

              // Add to sync queue
              if (event.syncStatus === 'synced') {
                await SyncQueueOperations.add({
                  userId: event.userId,
                  operation: 'delete',
                  entity: 'event',
                  entityId: id,
                  data: { id },
                });
              }
            }
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + batch.indexOf(id),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;

    // Log performance metric
    await db.metrics.add({
      operation: 'bulk.events.delete',
      duration: result.duration,
      timestamp: Date.now(),
      success: result.failed === 0,
      recordCount: result.success,
    });

    return result;
  }

  /**
   * Bulk import events from external source
   */
  static async bulkImport(
    events: Array<Partial<StoredEvent>>,
    userId: string,
    options: {
      deduplicate?: boolean;
      mapFields?: (event: any) => Partial<StoredEvent>;
    } = {}
  ): Promise<BulkResult> {
    const { deduplicate = true, mapFields } = options;

    // Map fields if custom mapper provided
    const mappedEvents: Omit<StoredEvent, 'id'>[] = events.map((event) => {
      const mapped = mapFields ? mapFields(event) : event;
      return {
        ...mapped,
        userId,
        syncStatus: 'local',
        createdAt: mapped.createdAt || Date.now(),
        updatedAt: mapped.updatedAt || Date.now(),
        lastModified: Date.now(),
      } as Omit<StoredEvent, 'id'>;
    });

    return await BulkEventOperations.bulkCreate(mappedEvents, {
      validateDuplicates: deduplicate,
    });
  }
}

/**
 * Bulk Category Operations
 */
export class BulkCategoryOperations {
  /**
   * Bulk create categories
   */
  static async bulkCreate(
    categories: Omit<StoredCategory, 'id'>[],
    options: { batchSize?: number } = {}
  ): Promise<BulkResult> {
    const { batchSize = 50 } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);

      await db.transaction('rw', db.categories, async () => {
        for (let j = 0; j < batch.length; j++) {
          try {
            await db.categories.add(batch[j]);
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + j,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;
    return result;
  }

  /**
   * Bulk update event categories
   */
  static async bulkUpdateEventCategories(
    eventIds: number[],
    categoryId: string,
    options: { batchSize?: number } = {}
  ): Promise<BulkResult> {
    const { batchSize = 100 } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batch = eventIds.slice(i, i + batchSize);

      await db.transaction('rw', db.events, async () => {
        for (const id of batch) {
          try {
            await db.events.update(id, {
              categoryId,
              updatedAt: Date.now(),
              syncStatus: 'pending',
            });
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + batch.indexOf(id),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;
    return result;
  }
}

/**
 * Bulk Calendar Operations
 */
export class BulkCalendarOperations {
  /**
   * Bulk assign events to calendar
   */
  static async bulkAssignToCalendar(
    eventIds: number[],
    calendarId: number,
    options: { batchSize?: number } = {}
  ): Promise<BulkResult> {
    const { batchSize = 100 } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Get calendar to verify it exists
    const calendar = await db.calendars.get(calendarId);
    if (!calendar) {
      result.errors.push({
        index: 0,
        error: 'Calendar not found',
      });
      result.duration = performance.now() - start;
      return result;
    }

    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batch = eventIds.slice(i, i + batchSize);

      await db.transaction('rw', db.events, async () => {
        for (const id of batch) {
          try {
            await db.events.update(id, {
              metadata: {
                calendarId: calendar.convexId || calendarId,
              },
              updatedAt: Date.now(),
              syncStatus: 'pending',
            });
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + batch.indexOf(id),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;
    return result;
  }

  /**
   * Bulk share calendars
   */
  static async bulkShareCalendars(
    calendarIds: number[],
    _shareWith: string[],
    options: { batchSize?: number } = {}
  ): Promise<BulkResult> {
    const { batchSize = 20 } = options;
    const start = performance.now();
    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    for (let i = 0; i < calendarIds.length; i += batchSize) {
      const batch = calendarIds.slice(i, i + batchSize);

      await db.transaction('rw', db.calendars, async () => {
        for (const id of batch) {
          try {
            const calendar = await db.calendars.get(id);
            if (!calendar) {
              throw new Error('Calendar not found');
            }

            await db.calendars.update(id, {
              isShared: true,
              updatedAt: Date.now(),
              syncStatus: 'pending',
            });
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + batch.indexOf(id),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    result.duration = performance.now() - start;
    return result;
  }
}

/**
 * Bulk utility functions
 */
export class BulkUtils {
  /**
   * Chunk array into batches
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Process in parallel batches
   */
  static async processParallelBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R>,
    options: {
      batchSize?: number;
      maxParallel?: number;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 100, maxParallel = 3 } = options;
    const batches = BulkUtils.chunk(items, batchSize);
    const results: R[] = [];

    for (let i = 0; i < batches.length; i += maxParallel) {
      const parallelBatches = batches.slice(i, i + maxParallel);
      const parallelResults = await Promise.all(parallelBatches.map((batch) => processor(batch)));
      results.push(...parallelResults);
    }

    return results;
  }

  /**
   * Optimize batch size based on performance
   */
  static async findOptimalBatchSize(
    testSizes: number[],
    testOperation: (size: number) => Promise<number>
  ): Promise<number> {
    const results: Array<{ size: number; avgTime: number }> = [];

    for (const size of testSizes) {
      const times: number[] = [];

      // Run 3 tests for each size
      for (let i = 0; i < 3; i++) {
        const time = await testOperation(size);
        times.push(time / size); // Time per item
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      results.push({ size, avgTime });
    }

    // Find size with best performance (lowest time per item)
    results.sort((a, b) => a.avgTime - b.avgTime);
    return results[0].size;
  }
}
