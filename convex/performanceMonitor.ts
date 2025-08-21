/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics and monitoring for Convex database
 */

import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Real-time Performance Dashboard
 */
export const getPerformanceDashboard = query({
  handler: async (ctx) => {
    // Get current database stats
    const [
      totalUsers,
      totalEvents,
      totalCategories,
      totalCalendars,
      totalProviders,
      pendingSync,
      processingSync,
      failedSync,
    ] = await Promise.all([
      ctx.db.query("users").collect().then(r => r.length),
      ctx.db.query("events").collect().then(r => r.length),
      ctx.db.query("categories").collect().then(r => r.length),
      ctx.db.query("calendars").collect().then(r => r.length),
      ctx.db.query("calendarProviders").collect().then(r => r.length),
      ctx.db.query("syncQueue")
        .withIndex("by_status", q => q.eq("status", "pending"))
        .collect()
        .then(r => r.length),
      ctx.db.query("syncQueue")
        .withIndex("by_status", q => q.eq("status", "processing"))
        .collect()
        .then(r => r.length),
      ctx.db.query("syncQueue")
        .withIndex("by_status", q => q.eq("status", "failed"))
        .collect()
        .then(r => r.length),
    ]);

    // Calculate sync queue health
    const totalSyncItems = pendingSync + processingSync + failedSync;
    const syncQueueHealth = totalSyncItems === 0 
      ? "healthy" 
      : failedSync > 10 
        ? "critical"
        : processingSync > 20
          ? "warning"
          : "healthy";

    // Get recent sync performance
    const recentSync = await ctx.db
      .query("syncQueue")
      .withIndex("by_created", q => q.gte("createdAt", Date.now() - 3600000)) // Last hour
      .collect();
    
    const avgSyncTime = recentSync
      .filter(s => s.completedAt)
      .reduce((sum, s) => {
        const duration = (s.completedAt || 0) - s.createdAt;
        return sum + duration;
      }, 0) / Math.max(1, recentSync.filter(s => s.completedAt).length);

    // Check for hot spots (users with lots of events)
    const events = await ctx.db.query("events").take(1000);
    const eventsByUser = new Map<string, number>();
    events.forEach(event => {
      const count = eventsByUser.get(event.userId) || 0;
      eventsByUser.set(event.userId, count + 1);
    });
    
    const hotUsers = Array.from(eventsByUser.entries())
      .filter(([_, count]) => count > 50)
      .length;

    return {
      stats: {
        users: totalUsers,
        events: totalEvents,
        categories: totalCategories,
        calendars: totalCalendars,
        providers: totalProviders,
      },
      syncQueue: {
        pending: pendingSync,
        processing: processingSync,
        failed: failedSync,
        health: syncQueueHealth,
        avgProcessingTime: Math.round(avgSyncTime),
      },
      performance: {
        hotUsers,
        indexEfficiency: calculateIndexEfficiency(totalEvents, totalUsers),
        estimatedQueryTime: estimateQueryTime(totalEvents),
      },
      recommendations: generateRecommendations({
        totalEvents,
        totalUsers,
        hotUsers,
        failedSync,
        processingSync,
      }),
      timestamp: Date.now(),
    };
  },
});

/**
 * Index Efficiency Calculator
 */
function calculateIndexEfficiency(totalEvents: number, totalUsers: number): string {
  if (totalUsers === 0) return "N/A";
  
  const eventsPerUser = totalEvents / totalUsers;
  
  if (eventsPerUser < 50) return "excellent";
  if (eventsPerUser < 200) return "good";
  if (eventsPerUser < 500) return "moderate";
  return "needs optimization";
}

/**
 * Query Time Estimator
 */
function estimateQueryTime(totalEvents: number): string {
  // Rough estimation based on document count
  if (totalEvents < 1000) return "<1ms";
  if (totalEvents < 10000) return "1-5ms";
  if (totalEvents < 100000) return "5-20ms";
  if (totalEvents < 1000000) return "20-100ms";
  return ">100ms";
}

/**
 * Generate Performance Recommendations
 */
function generateRecommendations(metrics: {
  totalEvents: number;
  totalUsers: number;
  hotUsers: number;
  failedSync: number;
  processingSync: number;
}): string[] {
  const recommendations: string[] = [];

  if (metrics.hotUsers > 5) {
    recommendations.push(
      `${metrics.hotUsers} users have >50 events. Consider implementing pagination or archiving old events.`
    );
  }

  if (metrics.failedSync > 10) {
    recommendations.push(
      `High number of failed sync operations (${metrics.failedSync}). Review error logs and retry logic.`
    );
  }

  if (metrics.processingSync > 20) {
    recommendations.push(
      `${metrics.processingSync} sync operations in progress. Consider increasing worker capacity.`
    );
  }

  if (metrics.totalEvents > 10000 && metrics.totalUsers < 100) {
    recommendations.push(
      "High event-to-user ratio. Ensure compound indexes are being used effectively."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Database performance is optimal. No immediate actions required.");
  }

  return recommendations;
}

/**
 * Query Performance Tracker
 */
export const trackQueryPerformance = query({
  args: {
    userId: v.id("users"),
    queryType: v.union(
      v.literal("simple"),
      v.literal("complex"),
      v.literal("aggregate")
    ),
  },
  handler: async (ctx, args) => {
    const results: any[] = [];
    
    // Simple query test
    if (args.queryType === "simple" || args.queryType === "aggregate") {
      const start = Date.now();
      const events = await ctx.db
        .query("events")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .take(10);
      results.push({
        type: "simple_user_events",
        duration: Date.now() - start,
        documents: events.length,
      });
    }

    // Complex query test
    if (args.queryType === "complex" || args.queryType === "aggregate") {
      const start = Date.now();
      const now = Date.now();
      const events = await ctx.db
        .query("events")
        .withIndex("by_user_and_time", q => 
          q.eq("userId", args.userId)
            .gte("startTime", now - 86400000)
            .lte("startTime", now + 86400000)
        )
        .collect();
      
      // Additional filtering
      const filtered = events.filter(e => 
        e.title.length > 0 && (!e.categoryId || e.categoryId !== null)
      );
      
      results.push({
        type: "complex_filtered_events",
        duration: Date.now() - start,
        documents: filtered.length,
      });
    }

    // Aggregate query test
    if (args.queryType === "aggregate") {
      const start = Date.now();
      
      // Get all categories for user
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      // Count events per category
      const eventCounts = await Promise.all(
        categories.map(async cat => {
          const events = await ctx.db
            .query("events")
            .withIndex("by_user_and_category", q => 
              q.eq("userId", args.userId).eq("categoryId", cat._id)
            )
            .collect();
          return { category: cat.name, count: events.length };
        })
      );
      
      results.push({
        type: "aggregate_events_by_category",
        duration: Date.now() - start,
        categories: eventCounts.length,
      });
    }

    // Calculate performance metrics
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    
    return {
      results,
      summary: {
        avgDuration: Math.round(avgDuration),
        maxDuration,
        performance: maxDuration < 10 ? "excellent" : maxDuration < 50 ? "good" : "needs optimization",
      },
      timestamp: Date.now(),
    };
  },
});

/**
 * Live Index Usage Monitor
 */
export const monitorIndexUsage = query({
  args: {
    duration: v.optional(v.number()), // Monitor duration in ms
  },
  handler: async (ctx, args) => {
    const monitorDuration = args.duration || 5000; // Default 5 seconds
    const startTime = Date.now();
    const indexUsage: Record<string, number> = {};

    // Simulate monitoring by running various queries
    const queries = [
      { name: "events.by_user", index: "by_user", table: "events" },
      { name: "events.by_user_and_time", index: "by_user_and_time", table: "events" },
      { name: "events.by_category", index: "by_category", table: "events" },
      { name: "categories.by_user", index: "by_user", table: "categories" },
      { name: "calendars.by_user", index: "by_user", table: "calendars" },
      { name: "syncQueue.by_status", index: "by_status", table: "syncQueue" },
    ];

    // Track which indexes are being used
    for (const query of queries) {
      indexUsage[query.name] = 0;
    }

    // Note: In a real implementation, this would hook into query execution
    // For demo purposes, we'll simulate index usage patterns
    const simulatedUsage = {
      "events.by_user": 45,
      "events.by_user_and_time": 30,
      "events.by_category": 10,
      "categories.by_user": 8,
      "calendars.by_user": 5,
      "syncQueue.by_status": 2,
    };

    // Identify unused or underutilized indexes
    const underutilized = Object.entries(simulatedUsage)
      .filter(([_, usage]) => usage < 5)
      .map(([index]) => index);

    const mostUsed = Object.entries(simulatedUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([index, usage]) => ({ index, usage }));

    return {
      monitorDuration,
      indexUsage: simulatedUsage,
      underutilized,
      mostUsed,
      recommendations: generateIndexRecommendations(simulatedUsage, underutilized),
      timestamp: Date.now(),
    };
  },
});

/**
 * Generate Index Recommendations
 */
function generateIndexRecommendations(
  usage: Record<string, number>,
  underutilized: string[]
): string[] {
  const recommendations: string[] = [];

  if (underutilized.length > 0) {
    recommendations.push(
      `Consider removing underutilized indexes: ${underutilized.join(", ")}`
    );
  }

  const totalUsage = Object.values(usage).reduce((sum, count) => sum + count, 0);
  const userIndexUsage = usage["events.by_user"] || 0;
  
  if (userIndexUsage / totalUsage > 0.5) {
    recommendations.push(
      "Heavy usage of user index. Consider partitioning data by user for better performance."
    );
  }

  const timeIndexUsage = usage["events.by_user_and_time"] || 0;
  if (timeIndexUsage / totalUsage > 0.3) {
    recommendations.push(
      "Frequent time-based queries detected. Ensure time indexes are optimized."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Index usage patterns are balanced. No changes recommended.");
  }

  return recommendations;
}