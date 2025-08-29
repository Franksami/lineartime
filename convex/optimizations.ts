/**
 * Database Optimization and Performance Configuration
 * Implements indexing strategies, query optimization, and performance monitoring
 */

import { v } from 'convex/values';
import { Doc, type Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

/**
 * Performance Monitoring Queries
 */

// Monitor database statistics
export const getDatabaseStats = internalQuery({
  handler: async (ctx) => {
    const [userCount, eventCount, categoryCount, calendarCount, providerCount, syncQueueCount] =
      await Promise.all([
        ctx.db
          .query('users')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('events')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('categories')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('calendars')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('calendarProviders')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('syncQueue')
          .collect()
          .then((r) => r.length),
      ]);

    return {
      tables: {
        users: userCount,
        events: eventCount,
        categories: categoryCount,
        calendars: calendarCount,
        providers: providerCount,
        syncQueue: syncQueueCount,
      },
      totalDocuments:
        userCount + eventCount + categoryCount + calendarCount + providerCount + syncQueueCount,
      timestamp: Date.now(),
    };
  },
});

// Monitor query performance for events
export const getEventQueryPerformance = internalQuery({
  args: {
    userId: v.id('users'),
    iterations: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const iterations = args.iterations || 10;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      // Test different query patterns
      const start = Date.now();

      // Query 1: By user index
      const t1Start = Date.now();
      await ctx.db
        .query('events')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .take(100);
      const t1End = Date.now();

      // Query 2: By user and time compound index
      const t2Start = Date.now();
      const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 1 week ago
      await ctx.db
        .query('events')
        .withIndex('by_user_and_time', (q) =>
          q.eq('userId', args.userId).gte('startTime', startTime)
        )
        .take(100);
      const t2End = Date.now();

      // Query 3: Full table scan with filter (worst case)
      const t3Start = Date.now();
      await ctx.db
        .query('events')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .take(100);
      const t3End = Date.now();

      results.push({
        iteration: i + 1,
        byUserIndex: t1End - t1Start,
        byUserAndTimeIndex: t2End - t2Start,
        fullTableScan: t3End - t3Start,
        total: Date.now() - start,
      });
    }

    // Calculate averages
    const avgByUser = results.reduce((sum, r) => sum + r.byUserIndex, 0) / iterations;
    const avgByUserAndTime = results.reduce((sum, r) => sum + r.byUserAndTimeIndex, 0) / iterations;
    const avgFullScan = results.reduce((sum, r) => sum + r.fullTableScan, 0) / iterations;

    return {
      results,
      averages: {
        byUserIndex: avgByUser,
        byUserAndTimeIndex: avgByUserAndTime,
        fullTableScan: avgFullScan,
      },
      recommendation:
        avgByUserAndTime < avgByUser
          ? 'Use compound index for time-based queries'
          : 'Simple user index is sufficient',
    };
  },
});

/**
 * Optimized Query Helpers
 */

// Batch fetch events with optimal pagination
export const getEventsBatch = query({
  args: {
    userId: v.id('users'),
    startTime: v.number(),
    endTime: v.number(),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 50; // Optimal batch size

    let query = ctx.db
      .query('events')
      .withIndex('by_user_and_time', (q) =>
        q.eq('userId', args.userId).gte('startTime', args.startTime).lte('startTime', args.endTime)
      );

    // Apply cursor for pagination if provided
    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor as Id<'events'>);
      if (cursorDoc) {
        query = query.filter((q) => q.gt(q.field('startTime'), cursorDoc.startTime));
      }
    }

    const events = await query.take(batchSize + 1); // Take one extra to check if there are more
    const hasMore = events.length > batchSize;
    const results = hasMore ? events.slice(0, batchSize) : events;
    const nextCursor = hasMore ? results[results.length - 1]._id : null;

    return {
      events: results,
      hasMore,
      nextCursor,
      count: results.length,
    };
  },
});

// Optimized search with caching hints
export const searchEventsOptimized = query({
  args: {
    userId: v.id('users'),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    searchFields: v.optional(
      v.array(v.union(v.literal('title'), v.literal('description'), v.literal('location')))
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const fields = args.searchFields || ['title', 'description', 'location'];
    const searchLower = args.searchTerm.toLowerCase();

    // Use index to narrow down first
    const events = await ctx.db
      .query('events')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Then filter in memory (more efficient for text search)
    const filtered = events.filter((event) => {
      if (fields.includes('title') && event.title.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (
        fields.includes('description') &&
        event.description?.toLowerCase().includes(searchLower)
      ) {
        return true;
      }
      if (fields.includes('location') && event.location?.toLowerCase().includes(searchLower)) {
        return true;
      }
      return false;
    });

    return filtered.slice(0, limit);
  },
});

/**
 * Database Maintenance Functions
 */

// Clean up old sync queue entries
export const cleanupSyncQueue = internalMutation({
  args: {
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.olderThanDays || 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const oldEntries = await ctx.db
      .query('syncQueue')
      .withIndex('by_status', (q) => q.eq('status', 'completed'))
      .filter((q) => q.lt(q.field('completedAt'), cutoff))
      .collect();

    let deleted = 0;
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return {
      deleted,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

// Archive old AI scheduling sessions
export const archiveOldAISessions = internalMutation({
  args: {
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.olderThanDays || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const oldSessions = await ctx.db
      .query('aiSchedulingSessions')
      .withIndex('by_created', (q) => q.lt('createdAt', cutoff))
      .collect();

    let archived = 0;
    for (const session of oldSessions) {
      // In production, you might want to move to an archive table
      // For now, we'll just delete old sessions
      await ctx.db.delete(session._id);
      archived++;
    }

    return {
      archived,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

// Optimize webhook tokens table
export const cleanupExpiredWebhookTokens = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    const expiredTokens = await ctx.db
      .query('webhookTokens')
      .withIndex('by_expiry', (q) => q.lt('expiresAt', now))
      .collect();

    let deleted = 0;
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
      deleted++;
    }

    return {
      deleted,
      timestamp: new Date(now).toISOString(),
    };
  },
});

/**
 * Index Optimization Recommendations
 */

export const getIndexRecommendations = internalQuery({
  handler: async (ctx) => {
    const recommendations = [];

    // Analyze event queries
    const events = await ctx.db.query('events').take(1000);
    const eventsByUser = new Map<string, number>();
    const eventsByCategory = new Map<string, number>();

    events.forEach((event) => {
      const userCount = eventsByUser.get(event.userId) || 0;
      eventsByUser.set(event.userId, userCount + 1);

      if (event.categoryId) {
        const catCount = eventsByCategory.get(event.categoryId) || 0;
        eventsByCategory.set(event.categoryId, catCount + 1);
      }
    });

    // Check for hot users (lots of events)
    const hotUsers = Array.from(eventsByUser.entries())
      .filter(([_, count]) => count > 100)
      .map(([userId, count]) => ({ userId, count }));

    if (hotUsers.length > 0) {
      recommendations.push({
        type: 'partition',
        table: 'events',
        reason: `${hotUsers.length} users have >100 events. Consider partitioning.`,
        impact: 'high',
      });
    }

    // Check sync queue performance
    const syncQueue = await ctx.db.query('syncQueue').take(100);
    const pendingCount = syncQueue.filter((s) => s.status === 'pending').length;

    if (pendingCount > 50) {
      recommendations.push({
        type: 'index',
        table: 'syncQueue',
        field: 'priority',
        reason: 'High pending count. Priority index would help processing.',
        impact: 'medium',
      });
    }

    // Check for missing compound indexes
    const calendarProviders = await ctx.db.query('calendarProviders').collect();
    if (calendarProviders.length > 10) {
      recommendations.push({
        type: 'compound_index',
        table: 'eventSync',
        fields: ['providerId', 'syncStatus'],
        reason: 'Multiple providers active. Compound index would optimize sync queries.',
        impact: 'medium',
      });
    }

    return {
      recommendations,
      stats: {
        hotUsers: hotUsers.length,
        totalEvents: events.length,
        pendingSyncItems: pendingCount,
        activeProviders: calendarProviders.length,
      },
      timestamp: Date.now(),
    };
  },
});

/**
 * Query Plan Analyzer
 */

export const analyzeQueryPlan = internalQuery({
  args: {
    queryType: v.union(
      v.literal('events_by_date'),
      v.literal('events_by_category'),
      v.literal('sync_status'),
      v.literal('conflicts')
    ),
    userId: v.optional(v.id('users')),
  },
  handler: async (_ctx, args) => {
    const plans = [];

    switch (args.queryType) {
      case 'events_by_date': {
        // Analyze date range query
        const plan1 = {
          query: "events.withIndex('by_user_and_time')",
          indexUsed: 'by_user_and_time',
          scanType: 'index_scan',
          estimatedCost: 'low',
          recommendation: 'Optimal for date range queries',
        };

        const plan2 = {
          query: "events.withIndex('by_user').filter(date)",
          indexUsed: 'by_user',
          scanType: 'index_scan_with_filter',
          estimatedCost: 'medium',
          recommendation: 'Less optimal, requires post-filtering',
        };

        plans.push(plan1, plan2);
        break;
      }

      case 'events_by_category': {
        const plan = {
          query: "events.withIndex('by_category')",
          indexUsed: 'by_category',
          scanType: 'index_scan',
          estimatedCost: 'low',
          recommendation: 'Direct index usage, optimal',
        };
        plans.push(plan);
        break;
      }

      case 'sync_status': {
        const plan = {
          query: "syncQueue.withIndex('by_status')",
          indexUsed: 'by_status',
          scanType: 'index_scan',
          estimatedCost: 'low',
          recommendation: 'Consider compound index with priority for better ordering',
        };
        plans.push(plan);
        break;
      }

      case 'conflicts': {
        const plan = {
          query: "eventSync.withIndex('by_sync_status').eq('conflict')",
          indexUsed: 'by_sync_status',
          scanType: 'index_scan',
          estimatedCost: 'low',
          recommendation: 'Optimal for conflict detection',
        };
        plans.push(plan);
        break;
      }
    }

    return {
      queryType: args.queryType,
      plans,
      bestPlan: plans[0],
      timestamp: Date.now(),
    };
  },
});

/**
 * Bulk Operations Optimizer
 */

// Batch create events with optimal transaction handling
export const batchCreateEvents = mutation({
  args: {
    userId: v.id('users'),
    events: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.optional(v.number()),
        allDay: v.optional(v.boolean()),
        color: v.optional(v.string()),
        categoryId: v.optional(v.id('categories')),
        location: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const createdIds = [];
    const now = Date.now();

    // Process in optimal batch size to avoid transaction limits
    const batchSize = 50;
    for (let i = 0; i < args.events.length; i += batchSize) {
      const batch = args.events.slice(i, i + batchSize);

      const batchIds = await Promise.all(
        batch.map((event) =>
          ctx.db.insert('events', {
            ...event,
            userId: args.userId,
            createdAt: now,
            updatedAt: now,
          })
        )
      );

      createdIds.push(...batchIds);
    }

    return {
      created: createdIds.length,
      ids: createdIds,
    };
  },
});

// Batch update events
export const batchUpdateEvents = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('events'),
        fields: v.object({
          title: v.optional(v.string()),
          description: v.optional(v.string()),
          startTime: v.optional(v.number()),
          endTime: v.optional(v.number()),
          categoryId: v.optional(v.id('categories')),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let updated = 0;

    // Process updates in batches
    const batchSize = 50;
    for (let i = 0; i < args.updates.length; i += batchSize) {
      const batch = args.updates.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (update) => {
          await ctx.db.patch(update.id, {
            ...update.fields,
            updatedAt: now,
          });
          updated++;
        })
      );
    }

    return {
      updated,
      timestamp: now,
    };
  },
});

/**
 * Cache Warming Functions
 */

// Pre-load commonly accessed data
export const warmCache = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const warmed = {
      events: 0,
      categories: 0,
      calendars: 0,
    };

    // Warm events cache (upcoming week)
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query('events')
      .withIndex('by_user_and_time', (q) =>
        q.eq('userId', args.userId).gte('startTime', now).lte('startTime', weekFromNow)
      )
      .collect();
    warmed.events = events.length;

    // Warm categories
    const categories = await ctx.db
      .query('categories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    warmed.categories = categories.length;

    // Warm calendars
    const calendars = await ctx.db
      .query('calendars')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    warmed.calendars = calendars.length;

    return {
      warmed,
      timestamp: now,
    };
  },
});
