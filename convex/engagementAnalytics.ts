/**
 * Engagement Analytics Convex Functions
 * Real-time tracking system for horizontal timeline validation
 *
 * Performance targets:
 * - Tracking overhead: <50ms
 * - Real-time updates: <100ms latency
 * - Dashboard queries: <100ms response time
 * - Data retention: 90 days
 */

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

// ===== SESSION MANAGEMENT =====

/**
 * Start a new engagement session
 */
export const startEngagementSession = mutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    viewMode: v.union(v.literal('horizontal'), v.literal('traditional'), v.literal('hybrid')),
    userType: v.union(
      v.literal('new'),
      v.literal('returning'),
      v.literal('power'),
      v.literal('casual')
    ),
    experienceLevel: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('expert')),
    deviceType: v.union(v.literal('mobile'), v.literal('tablet'), v.literal('desktop')),
    geography: v.optional(v.string()),
    userSegment: v.optional(
      v.union(
        v.literal('early_adopter'),
        v.literal('traditional'),
        v.literal('power_user'),
        v.literal('casual')
      )
    ),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Create session record
    const sessionDoc = await ctx.db.insert('engagementSessions', {
      userId: args.userId,
      sessionId: args.sessionId,
      startTime,
      viewMode: args.viewMode,
      // Initialize outcomes
      eventsCreated: 0,
      eventsModified: 0,
      monthsNavigated: 0,
      totalScrollDistance: 0,
      focusTime: 0,
      taskCompleted: false,
      // Demographics
      userType: args.userType,
      experienceLevel: args.experienceLevel,
      deviceType: args.deviceType,
      geography: args.geography,
      userSegment: args.userSegment,
      createdAt: startTime,
    });

    // Log session start for development
    console.log(
      `📊 SESSION STARTED: ${args.sessionId.substring(0, 8)}... (${args.viewMode}, ${args.deviceType})`
    );

    return sessionDoc;
  },
});

/**
 * End an engagement session with outcomes
 */
export const endEngagementSession = mutation({
  args: {
    sessionId: v.string(),
    exitReason: v.optional(
      v.union(
        v.literal('natural'),
        v.literal('frustrated'),
        v.literal('distracted'),
        v.literal('completed')
      )
    ),
    satisfactionScore: v.optional(v.number()),
    taskCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const endTime = Date.now();

    // Find session by sessionId
    const session = await ctx.db
      .query('engagementSessions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    // Calculate session duration and focus time
    const totalDuration = endTime - session.startTime;

    // Calculate focus time from interactions
    const interactions = await ctx.db
      .query('timelineInteractions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();

    const focusTime = calculateFocusTime(interactions);

    // Update session with end data
    await ctx.db.patch(session._id, {
      endTime,
      totalDuration,
      focusTime,
      exitReason: args.exitReason,
      satisfactionScore: args.satisfactionScore,
      taskCompleted: args.taskCompleted ?? session.taskCompleted,
    });

    // Trigger analytics cache update asynchronously
    await ctx.scheduler.runAfter(0, internal.engagementAnalytics.updateAnalyticsCache, {
      triggerEvent: 'session_end',
      sessionId: args.sessionId,
    });

    console.log(
      `📊 SESSION ENDED: ${args.sessionId.substring(0, 8)}... (${Math.round(totalDuration / 1000)}s, ${interactions.length} interactions)`
    );

    return { sessionId: args.sessionId, totalDuration, interactions: interactions.length };
  },
});

// ===== INTERACTION TRACKING =====

/**
 * Track a timeline interaction with minimal latency
 */
export const trackTimelineInteraction = mutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    interactionId: v.string(),
    action: v.union(
      v.literal('timeline_scroll'),
      v.literal('month_navigation'),
      v.literal('event_hover'),
      v.literal('event_click'),
      v.literal('event_drag'),
      v.literal('event_create'),
      v.literal('view_switch'),
      v.literal('zoom_change'),
      v.literal('timeline_focus'),
      v.literal('temporal_navigation')
    ),
    targetType: v.union(
      v.literal('month'),
      v.literal('week'),
      v.literal('day'),
      v.literal('event'),
      v.literal('timeline'),
      v.literal('control')
    ),
    targetIdentifier: v.string(),
    coordinates: v.optional(v.object({ x: v.number(), y: v.number() })),
    viewport: v.optional(v.object({ width: v.number(), height: v.number() })),
    currentView: v.union(v.literal('horizontal'), v.literal('traditional'), v.literal('hybrid')),
    timelinePosition: v.number(),
    totalEventsVisible: v.number(),
    scrollDirection: v.optional(
      v.union(v.literal('left'), v.literal('right'), v.literal('up'), v.literal('down'))
    ),
    scrollDistance: v.optional(v.number()),
    duration: v.optional(v.number()),
    eventCount: v.optional(v.number()),
    monthsInView: v.optional(v.number()),
    deviceType: v.union(v.literal('mobile'), v.literal('tablet'), v.literal('desktop')),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Insert interaction with minimal processing for speed
    const interactionDoc = await ctx.db.insert('timelineInteractions', {
      ...args,
      timestamp,
      createdAt: timestamp,
    });

    // Update session outcomes in parallel (fire and forget for performance)
    ctx.scheduler.runAfter(0, internal.engagementAnalytics.updateSessionOutcomes, {
      sessionId: args.sessionId,
      action: args.action,
      scrollDistance: args.scrollDistance,
    });

    // Performance logging (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `⚡ TRACKED: ${args.action} (${args.targetType}:${args.targetIdentifier}) - ${Date.now() - timestamp}ms`
      );
    }

    return interactionDoc;
  },
});

/**
 * Batch track multiple interactions for performance
 */
export const batchTrackInteractions = mutation({
  args: {
    interactions: v.array(
      v.object({
        userId: v.id('users'),
        sessionId: v.string(),
        interactionId: v.string(),
        action: v.union(
          v.literal('timeline_scroll'),
          v.literal('month_navigation'),
          v.literal('event_hover'),
          v.literal('event_click'),
          v.literal('event_drag'),
          v.literal('event_create'),
          v.literal('view_switch'),
          v.literal('zoom_change'),
          v.literal('timeline_focus'),
          v.literal('temporal_navigation')
        ),
        targetType: v.union(
          v.literal('month'),
          v.literal('week'),
          v.literal('day'),
          v.literal('event'),
          v.literal('timeline'),
          v.literal('control')
        ),
        targetIdentifier: v.string(),
        coordinates: v.optional(v.object({ x: v.number(), y: v.number() })),
        currentView: v.union(
          v.literal('horizontal'),
          v.literal('traditional'),
          v.literal('hybrid')
        ),
        timelinePosition: v.number(),
        totalEventsVisible: v.number(),
        deviceType: v.union(v.literal('mobile'), v.literal('tablet'), v.literal('desktop')),
        userAgent: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const results = [];

    // Batch insert for performance
    for (const interaction of args.interactions) {
      const doc = await ctx.db.insert('timelineInteractions', {
        ...interaction,
        timestamp,
        createdAt: timestamp,
      });
      results.push(doc);
    }

    console.log(`📦 BATCH TRACKED: ${args.interactions.length} interactions`);
    return results;
  },
});

// ===== REAL-TIME ANALYTICS QUERIES =====

/**
 * Get real-time engagement metrics for live dashboard
 */
export const getLiveEngagementMetrics = query({
  args: {
    timeframe: v.union(v.literal('hour'), v.literal('day'), v.literal('week')),
    viewMode: v.optional(
      v.union(
        v.literal('horizontal'),
        v.literal('traditional'),
        v.literal('hybrid'),
        v.literal('all')
      )
    ),
    deviceType: v.optional(
      v.union(v.literal('mobile'), v.literal('tablet'), v.literal('desktop'), v.literal('all'))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoffTime = getTimeframeCutoff(args.timeframe);

    // Query recent sessions
    let sessionsQuery = ctx.db
      .query('engagementSessions')
      .withIndex('by_start_time')
      .filter((q) => q.gte(q.field('startTime'), cutoffTime));

    if (args.viewMode && args.viewMode !== 'all') {
      sessionsQuery = sessionsQuery.filter((q) => q.eq(q.field('viewMode'), args.viewMode));
    }

    if (args.deviceType && args.deviceType !== 'all') {
      sessionsQuery = sessionsQuery.filter((q) => q.eq(q.field('deviceType'), args.deviceType));
    }

    const sessions = await sessionsQuery.collect();

    // Query recent interactions for scroll rate calculation
    const interactions = await ctx.db
      .query('timelineInteractions')
      .withIndex('by_recent_interactions')
      .filter((q) => q.gte(q.field('timestamp'), cutoffTime))
      .collect();

    // Calculate metrics
    const metrics = calculateEngagementMetrics(sessions, interactions);

    return {
      ...metrics,
      timeframe: args.timeframe,
      calculatedAt: now,
      activeSessions: sessions.filter((s) => !s.endTime).length,
      totalSessions: sessions.length,
      lastUpdate: now,
    };
  },
});

/**
 * Get timeline interaction heatmap data
 */
export const getTimelineHeatMap = query({
  args: {
    timeframe: v.union(v.literal('day'), v.literal('week'), v.literal('month')),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const cutoffTime = getTimeframeCutoff(args.timeframe);

    let interactionsQuery = ctx.db
      .query('timelineInteractions')
      .withIndex('by_recent_interactions')
      .filter((q) => q.gte(q.field('timestamp'), cutoffTime))
      .filter((q) =>
        q.or(
          q.eq(q.field('action'), 'timeline_scroll'),
          q.eq(q.field('action'), 'month_navigation'),
          q.eq(q.field('action'), 'event_click')
        )
      );

    if (args.userId) {
      interactionsQuery = interactionsQuery.filter((q) => q.eq(q.field('userId'), args.userId));
    }

    const interactions = await interactionsQuery.collect();

    // Build month heatmap (12 months)
    const monthHeatMap = new Array(12).fill(0);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    interactions.forEach((interaction) => {
      if (interaction.targetType === 'month') {
        const monthIndex = months.indexOf(interaction.targetIdentifier);
        if (monthIndex !== -1) {
          monthHeatMap[monthIndex]++;
        }
      }
    });

    return {
      monthHeatMap,
      totalInteractions: interactions.length,
      timeframe: args.timeframe,
      calculatedAt: Date.now(),
    };
  },
});

/**
 * Get view mode comparison data
 */
export const getViewModeComparison = query({
  args: {
    timeframe: v.union(v.literal('day'), v.literal('week'), v.literal('month')),
  },
  handler: async (ctx, args) => {
    const cutoffTime = getTimeframeCutoff(args.timeframe);

    const sessions = await ctx.db
      .query('engagementSessions')
      .withIndex('by_start_time')
      .filter((q) => q.gte(q.field('startTime'), cutoffTime))
      .collect();

    // Group by view mode
    const horizontalSessions = sessions.filter((s) => s.viewMode === 'horizontal');
    const traditionalSessions = sessions.filter((s) => s.viewMode === 'traditional');
    const hybridSessions = sessions.filter((s) => s.viewMode === 'hybrid');

    return {
      horizontal: calculateSessionMetrics(horizontalSessions),
      traditional: calculateSessionMetrics(traditionalSessions),
      hybrid: calculateSessionMetrics(hybridSessions),
      totalSessions: sessions.length,
      viewModeDistribution: {
        horizontal: (horizontalSessions.length / sessions.length) * 100,
        traditional: (traditionalSessions.length / sessions.length) * 100,
        hybrid: (hybridSessions.length / sessions.length) * 100,
      },
      calculatedAt: Date.now(),
    };
  },
});

/**
 * Stream real-time interaction events for live monitoring
 */
export const streamRecentInteractions = query({
  args: {
    limit: v.optional(v.number()),
    sinceTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const since = args.sinceTimestamp ?? Date.now() - 60000; // Last minute by default

    const interactions = await ctx.db
      .query('timelineInteractions')
      .withIndex('by_recent_interactions')
      .filter((q) => q.gte(q.field('timestamp'), since))
      .order('desc')
      .take(limit);

    return {
      interactions,
      serverTimestamp: Date.now(),
      count: interactions.length,
    };
  },
});

// ===== INTERNAL FUNCTIONS =====

/**
 * Internal function to update session outcomes
 */
export const updateSessionOutcomes = internalMutation({
  args: {
    sessionId: v.string(),
    action: v.string(),
    scrollDistance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('engagementSessions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session) return;

    const updates: any = {};

    switch (args.action) {
      case 'event_create':
        updates.eventsCreated = session.eventsCreated + 1;
        break;
      case 'month_navigation':
        updates.monthsNavigated = session.monthsNavigated + 1;
        break;
      case 'timeline_scroll':
        if (args.scrollDistance) {
          updates.totalScrollDistance = session.totalScrollDistance + args.scrollDistance;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(session._id, updates);
    }
  },
});

/**
 * Internal function to update analytics cache
 */
export const updateAnalyticsCache = internalMutation({
  args: {
    triggerEvent: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // This would implement cache update logic
    // For now, just log the trigger
    console.log(`📈 ANALYTICS CACHE UPDATE: ${args.triggerEvent} (${args.sessionId})`);
  },
});

// ===== HELPER FUNCTIONS =====

function getTimeframeCutoff(timeframe: 'hour' | 'day' | 'week' | 'month'): number {
  const now = Date.now();
  switch (timeframe) {
    case 'hour':
      return now - 60 * 60 * 1000;
    case 'day':
      return now - 24 * 60 * 60 * 1000;
    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000;
  }
}

function calculateFocusTime(interactions: any[]): number {
  if (interactions.length < 2) return 0;

  const sortedInteractions = interactions.sort((a, b) => a.timestamp - b.timestamp);
  let focusTime = 0;

  for (let i = 1; i < sortedInteractions.length; i++) {
    const gap = sortedInteractions[i].timestamp - sortedInteractions[i - 1].timestamp;
    if (gap < 300000) {
      // Less than 5 minutes - likely focused time
      focusTime += gap;
    }
  }

  return focusTime;
}

function calculateEngagementMetrics(sessions: any[], interactions: any[]) {
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      averageSessionDuration: 0,
      eventCreationRate: 0,
      monthNavigationRate: 0,
      timelineScrollRate: 0,
      userSatisfactionScore: 5.0,
      taskCompletionRate: 0,
      bounceRate: 0,
      horizontalTimelineUsage: 0,
      traditionalViewUsage: 0,
      hybridViewUsage: 0,
    };
  }

  const totalDuration = sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
  const completedSessions = sessions.filter((s) => s.taskCompleted).length;
  const bounceSessions = sessions.filter((s) => (s.totalDuration || 0) < 30000).length;
  const ratedSessions = sessions.filter((s) => s.satisfactionScore !== undefined);

  // View mode usage
  const horizontalCount = sessions.filter((s) => s.viewMode === 'horizontal').length;
  const traditionalCount = sessions.filter((s) => s.viewMode === 'traditional').length;
  const hybridCount = sessions.filter((s) => s.viewMode === 'hybrid').length;

  // Scroll rate calculation
  const scrollInteractions = interactions.filter((i) => i.action === 'timeline_scroll');
  const totalMinutes = totalDuration / (1000 * 60);

  return {
    averageSessionDuration: Math.round(totalDuration / totalSessions / 1000), // seconds
    eventCreationRate: sessions.reduce((sum, s) => sum + s.eventsCreated, 0) / totalSessions,
    monthNavigationRate: sessions.reduce((sum, s) => sum + s.monthsNavigated, 0) / totalSessions,
    timelineScrollRate: totalMinutes > 0 ? scrollInteractions.length / totalMinutes : 0,
    userSatisfactionScore:
      ratedSessions.length > 0
        ? ratedSessions.reduce((sum, s) => sum + s.satisfactionScore, 0) / ratedSessions.length
        : 5.0,
    taskCompletionRate: (completedSessions / totalSessions) * 100,
    bounceRate: (bounceSessions / totalSessions) * 100,
    horizontalTimelineUsage: (horizontalCount / totalSessions) * 100,
    traditionalViewUsage: (traditionalCount / totalSessions) * 100,
    hybridViewUsage: (hybridCount / totalSessions) * 100,
  };
}

function calculateSessionMetrics(sessions: any[]) {
  if (sessions.length === 0) {
    return {
      avgDuration: 0,
      avgEventsCreated: 0,
      avgMonthNav: 0,
      avgSatisfaction: 5.0,
      completionRate: 0,
      deepSessionRate: 0,
      sessionCount: 0,
    };
  }

  const totalDuration = sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
  const deepSessions = sessions.filter((s) => (s.totalDuration || 0) > 600000).length;
  const ratedSessions = sessions.filter((s) => s.satisfactionScore !== undefined);
  const completedSessions = sessions.filter((s) => s.taskCompleted).length;

  return {
    avgDuration: totalDuration / sessions.length,
    avgEventsCreated: sessions.reduce((sum, s) => sum + s.eventsCreated, 0) / sessions.length,
    avgMonthNav: sessions.reduce((sum, s) => sum + s.monthsNavigated, 0) / sessions.length,
    avgSatisfaction:
      ratedSessions.length > 0
        ? ratedSessions.reduce((sum, s) => sum + s.satisfactionScore, 0) / ratedSessions.length
        : 5.0,
    completionRate: (completedSessions / sessions.length) * 100,
    deepSessionRate: (deepSessions / sessions.length) * 100,
    sessionCount: sessions.length,
  };
}
