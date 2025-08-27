/**
 * Convex Backend Functions for A/B Testing Framework
 * Integrates with LinearTime's existing infrastructure for production-ready testing
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { action, mutation, query } from './_generated/server';

/**
 * Assign user to A/B test variant with stable hashing
 */
export const assignUserToTest = mutation({
  args: {
    userId: v.id('users'),
    testId: v.string(),
    assignmentCriteria: v.object({
      userSegment: v.optional(v.string()),
      deviceType: v.optional(v.string()),
      geography: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      referrer: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, testId, assignmentCriteria } = args;

    // Check if user already has an assignment for this test
    const existingAssignment = await ctx.db
      .query('abTestAssignments')
      .withIndex('by_user_test', (q) => q.eq('userId', userId).eq('testId', testId))
      .first();

    if (existingAssignment) {
      return {
        variantId: existingAssignment.variantId,
        isNew: false,
        assignment: existingAssignment,
      };
    }

    // Get test configuration
    const test = await ctx.db
      .query('abTests')
      .withIndex('by_test_id', (q) => q.eq('testId', testId))
      .first();

    if (!test || test.status !== 'running') {
      return null;
    }

    // Generate stable hash for consistent variant assignment
    const hashInput = `${userId}:${testId}`;
    const hash = await generateStableHash(hashInput);

    // Select variant based on weight distribution
    const variantId = selectVariantByWeight(test.variants, hash);

    // Detect bot and internal users
    const user = await ctx.db.get(userId);
    const isBot = detectBot(assignmentCriteria.userAgent);
    const isInternal = user?.email?.endsWith('@lineartime.app') || false;

    // Create assignment record
    const assignment = await ctx.db.insert('abTestAssignments', {
      userId,
      testId,
      variantId,
      assignmentCriteria,
      hash: hashInput,
      assignedAt: Date.now(),
      excluded: isBot,
      exclusionReason: isBot ? 'bot_detected' : undefined,
      isBot,
      isInternal,
    });

    // Update test sample size
    await ctx.db.patch(test._id, {
      currentSampleSize: test.currentSampleSize + 1,
      updatedAt: Date.now(),
    });

    return {
      variantId,
      isNew: true,
      assignment: await ctx.db.get(assignment),
    };
  },
});

/**
 * Track A/B test event (conversion, engagement, etc.)
 */
export const trackTestEvent = mutation({
  args: {
    userId: v.id('users'),
    testId: v.string(),
    eventType: v.string(),
    eventName: v.string(),
    value: v.optional(v.number()),
    properties: v.optional(v.any()),
    sessionId: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    referrer: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    browserType: v.optional(v.string()),
    osType: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('abTestAssignments')
      .withIndex('by_user_test', (q) => q.eq('userId', args.userId).eq('testId', args.testId))
      .first();

    if (!assignment || assignment.excluded) {
      return null;
    }

    // Record first exposure if this is an exposure event
    if (args.eventType === 'exposure' && !assignment.firstExposure) {
      await ctx.db.patch(assignment._id, {
        firstExposure: Date.now(),
      });
    }

    // Update last interaction
    await ctx.db.patch(assignment._id, {
      lastInteraction: Date.now(),
    });

    // Create event record
    return await ctx.db.insert('abTestEvents', {
      userId: args.userId,
      testId: args.testId,
      variantId: assignment.variantId,
      eventType: args.eventType,
      eventName: args.eventName,
      value: args.value || 1,
      properties: args.properties,
      sessionId: args.sessionId,
      pageUrl: args.pageUrl,
      referrer: args.referrer,
      deviceType: args.deviceType,
      browserType: args.browserType,
      osType: args.osType,
      screenResolution: args.screenResolution,
      timestamp: Date.now(),
      serverTimestamp: Date.now(),
      isValid: true,
    });
  },
});

/**
 * Get user's test assignment and variant configuration
 */
export const getUserTestAssignment = query({
  args: {
    userId: v.id('users'),
    testId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('abTestAssignments')
      .withIndex('by_user_test', (q) => q.eq('userId', args.userId).eq('testId', args.testId))
      .first();

    if (!assignment) {
      return null;
    }

    // Get test configuration
    const test = await ctx.db
      .query('abTests')
      .withIndex('by_test_id', (q) => q.eq('testId', args.testId))
      .first();

    if (!test) {
      return null;
    }

    // Find variant configuration
    const variant = test.variants.find((v) => v.id === assignment.variantId);

    return {
      assignment,
      variant,
      testConfig: test,
    };
  },
});

/**
 * Get active A/B tests for a user
 */
export const getActiveTests = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get all running tests
    const activeTests = await ctx.db
      .query('abTests')
      .withIndex('by_status', (q) => q.eq('status', 'running'))
      .collect();

    // Get user's assignments for these tests
    const assignments = await ctx.db
      .query('abTestAssignments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const assignmentMap = new Map(assignments.map((a) => [a.testId, a]));

    return activeTests.map((test) => ({
      test,
      assignment: assignmentMap.get(test.testId) || null,
    }));
  },
});

/**
 * Calculate real-time test analytics
 */
export const calculateTestAnalytics = action({
  args: {
    testId: v.string(),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { testId, forceRefresh } = args;

    // Check if cached analytics exist and are fresh
    const cacheExpiry = Date.now() - (forceRefresh ? 0 : 5 * 60 * 1000); // 5 minutes cache
    const cached = await ctx.runQuery(api.abTesting.getCachedAnalytics, {
      testId,
      validAfter: cacheExpiry,
    });

    if (cached && cached.length > 0) {
      return formatAnalyticsResponse(cached);
    }

    // Calculate fresh analytics
    const test = await ctx.runQuery(api.abTesting.getTestById, { testId });
    if (!test) return null;

    const analytics = [];

    for (const variant of test.variants) {
      const variantAnalytics = await calculateVariantMetrics(ctx, testId, variant.id);
      analytics.push(variantAnalytics);

      // Cache the results
      await ctx.runMutation(api.abTesting.cacheAnalytics, {
        testId,
        variantId: variant.id,
        analytics: variantAnalytics,
      });
    }

    return formatAnalyticsResponse(analytics);
  },
});

/**
 * Get test by ID
 */
export const getTestById = query({
  args: { testId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('abTests')
      .withIndex('by_test_id', (q) => q.eq('testId', args.testId))
      .first();
  },
});

/**
 * Get cached analytics
 */
export const getCachedAnalytics = query({
  args: {
    testId: v.string(),
    validAfter: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('abTestAnalytics')
      .withIndex('by_test', (q) => q.eq('testId', args.testId))
      .filter((q) => q.gt(q.field('calculatedAt'), args.validAfter))
      .collect();
  },
});

/**
 * Cache analytics results
 */
export const cacheAnalytics = mutation({
  args: {
    testId: v.string(),
    variantId: v.optional(v.string()),
    analytics: v.any(),
  },
  handler: async (ctx, args) => {
    const { testId, variantId, analytics } = args;
    const now = Date.now();
    const validUntil = now + 15 * 60 * 1000; // 15 minutes TTL

    return await ctx.db.insert('abTestAnalytics', {
      testId,
      variantId: variantId || null,
      metric: analytics.primaryMetric || 'conversion',
      totalUsers: analytics.totalUsers || 0,
      totalEvents: analytics.totalEvents || 0,
      conversionRate: analytics.conversionRate || 0,
      averageValue: analytics.averageValue || 0,
      standardDeviation: analytics.standardDeviation || 0,
      timeBucket: new Date(now).toISOString().slice(0, 13), // YYYY-MM-DD-HH
      bucketType: 'hourly',
      confidenceInterval: analytics.confidenceInterval || {
        lower: 0,
        upper: 0,
        level: 0.95,
      },
      calculatedAt: now,
      validUntil,
    });
  },
});

/**
 * Create new A/B test
 */
export const createTest = mutation({
  args: {
    testId: v.string(),
    name: v.string(),
    hypothesis: v.string(),
    description: v.optional(v.string()),
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        weight: v.number(),
        config: v.any(),
      })
    ),
    criteria: v.object({
      userSegment: v.optional(v.array(v.string())),
      geography: v.optional(v.array(v.string())),
      deviceType: v.optional(v.array(v.string())),
      returningUser: v.optional(v.boolean()),
      minAccountAge: v.optional(v.number()),
      planType: v.optional(v.array(v.string())),
    }),
    primaryMetric: v.string(),
    secondaryMetrics: v.array(v.string()),
    targetSampleSize: v.number(),
    minDetectableEffect: v.number(),
    statisticalPower: v.number(),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert('abTests', {
      ...args,
      status: 'draft',
      startDate: now,
      currentSampleSize: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Start a test (set status to running)
 */
export const startTest = mutation({
  args: {
    testId: v.string(),
  },
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query('abTests')
      .withIndex('by_test_id', (q) => q.eq('testId', args.testId))
      .first();

    if (!test) {
      throw new Error('Test not found');
    }

    await ctx.db.patch(test._id, {
      status: 'running',
      startDate: Date.now(),
      updatedAt: Date.now(),
    });

    return test;
  },
});

// Helper functions

function generateStableHash(input: string): Promise<string> {
  // Simple deterministic hash function
  // In production, consider using a more robust hashing algorithm
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Promise.resolve(Math.abs(hash).toString());
}

function selectVariantByWeight(variants: any[], hash: string): string {
  const hashNum = Number.parseInt(hash) % 100;
  let currentWeight = 0;

  for (const variant of variants) {
    currentWeight += variant.weight;
    if (hashNum < currentWeight) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return variants[0]?.id || 'control';
}

function detectBot(userAgent?: string): boolean {
  if (!userAgent) return false;

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /googlebot/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

async function calculateVariantMetrics(ctx: any, testId: string, variantId: string) {
  // Get all events for this variant
  const events = await ctx.runQuery(api.abTesting.getVariantEvents, {
    testId,
    variantId,
  });

  const users = new Set(events.map((e: any) => e.userId));
  const conversions = events.filter((e: any) => e.eventType === 'conversion');
  const exposures = events.filter((e: any) => e.eventType === 'exposure');

  const totalUsers = users.size;
  const totalEvents = events.length;
  const conversionRate = totalUsers > 0 ? (conversions.length / exposures.length) * 100 : 0;
  const averageValue =
    events.length > 0
      ? events.reduce((sum: number, e: any) => sum + e.value, 0) / events.length
      : 0;

  // Calculate confidence interval (simplified)
  const standardError = Math.sqrt(
    ((conversionRate / 100) * (1 - conversionRate / 100)) / totalUsers
  );
  const marginOfError = 1.96 * standardError * 100; // 95% confidence

  return {
    variantId,
    totalUsers,
    totalEvents,
    conversionRate,
    averageValue,
    standardDeviation: standardError * 100,
    confidenceInterval: {
      lower: Math.max(0, conversionRate - marginOfError),
      upper: Math.min(100, conversionRate + marginOfError),
      level: 0.95,
    },
  };
}

/**
 * Get events for a specific variant
 */
export const getVariantEvents = query({
  args: {
    testId: v.string(),
    variantId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('abTestEvents')
      .withIndex('by_test_variant', (q) =>
        q.eq('testId', args.testId).eq('variantId', args.variantId)
      )
      .filter((q) => q.eq(q.field('isValid'), true))
      .collect();
  },
});

function formatAnalyticsResponse(analytics: any[]) {
  return {
    variants: analytics.reduce((acc, a) => {
      acc[a.variantId] = a;
      return acc;
    }, {}),
    summary: {
      totalUsers: analytics.reduce((sum, a) => sum + a.totalUsers, 0),
      totalEvents: analytics.reduce((sum, a) => sum + a.totalEvents, 0),
      calculatedAt: Date.now(),
    },
  };
}
