/**
 * Production A/B Test Configurations for Command Center Calendar
 * Horizontal Timeline Validation and User Experience Optimization
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import { mutation, query } from './_generated/server';

/**
 * Initialize production A/B test configurations
 */
export const initializeProductionTests = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    const userId = await ctx.auth.getUserIdentity();

    if (!userId) {
      throw new Error('Authentication required');
    }

    // Get or create system user for test creation
    const systemUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), 'system@lineartime.app'))
      .first();

    if (!systemUser) {
      throw new Error('System user not found - required for test initialization');
    }

    const tests = [
      {
        testId: 'horizontal_timeline_validation',
        name: 'Horizontal Timeline vs Traditional Month View',
        hypothesis:
          'Users will have better calendar overview and planning experience with horizontal timeline layout compared to traditional month view',
        description:
          'Validate the core Command Center Calendar value proposition: horizontal timeline provides superior calendar visualization and planning capabilities',
        variants: [
          {
            id: 'horizontal_timeline',
            name: 'Horizontal Timeline',
            description: '12-month continuous horizontal timeline layout',
            weight: 60, // 60% of users see the main feature
            config: {
              layout: 'horizontal',
              monthsVisible: 12,
              enableInfiniteCanvas: true,
              showYearOverview: true,
              enableZoomControls: true,
              timelineOrientation: 'horizontal',
            },
          },
          {
            id: 'traditional_month',
            name: 'Traditional Month View',
            description: 'Standard calendar month-by-month navigation',
            weight: 40, // 40% control group
            config: {
              layout: 'monthly',
              monthsVisible: 1,
              enableInfiniteCanvas: false,
              showYearOverview: false,
              enableZoomControls: false,
              timelineOrientation: 'vertical',
            },
          },
        ],
        criteria: {
          userSegment: ['early_adopter', 'power_user', 'traditional', 'casual'],
          geography: ['US', 'CA', 'GB', 'AU', 'DE'],
          deviceType: ['desktop', 'tablet', 'mobile'],
          returningUser: null, // Both new and returning users
          minAccountAge: null,
          planType: ['free', 'pro', 'enterprise'],
        },
        primaryMetric: 'calendar_engagement_rate',
        secondaryMetrics: [
          'session_duration',
          'event_creation_rate',
          'calendar_zoom_usage',
          'timeline_scroll_depth',
          'user_retention_7d',
          'feature_discovery_rate',
          'user_satisfaction_score',
        ],
        targetSampleSize: 10000,
        currentSampleSize: 0,
        minDetectableEffect: 0.05, // 5% improvement
        statisticalPower: 0.8, // 80% power
        createdBy: systemUser._id,
        status: 'running',
        startDate: now,
        createdAt: now,
        updatedAt: now,
      },

      {
        testId: 'onboarding_timeline_showcase',
        name: 'Timeline-First vs Traditional Onboarding',
        hypothesis:
          'New users who see horizontal timeline first in onboarding will have higher activation and retention rates',
        description:
          'Test whether showcasing horizontal timeline as the primary feature in onboarding improves user activation',
        variants: [
          {
            id: 'timeline_first_onboarding',
            name: 'Timeline-First Onboarding',
            description: 'Onboarding flow that showcases horizontal timeline as primary feature',
            weight: 50,
            config: {
              onboardingFlow: 'timeline_first',
              showTimelineDemo: true,
              highlightYearView: true,
              demoDataPreset: 'full_year',
              skipTraditionalCalendar: false,
            },
          },
          {
            id: 'traditional_onboarding',
            name: 'Traditional Onboarding',
            description: 'Standard onboarding flow with gradual feature introduction',
            weight: 50,
            config: {
              onboardingFlow: 'traditional',
              showTimelineDemo: false,
              highlightYearView: false,
              demoDataPreset: 'current_month',
              skipTraditionalCalendar: true,
            },
          },
        ],
        criteria: {
          userSegment: ['early_adopter', 'traditional', 'casual'], // Exclude power_user (they know what they want)
          returningUser: false, // New users only
          minAccountAge: 0,
          planType: ['free'], // New users start free
        },
        primaryMetric: 'onboarding_completion_rate',
        secondaryMetrics: [
          'time_to_first_event_creation',
          'feature_adoption_rate',
          'user_retention_24h',
          'user_retention_7d',
          'upgrade_conversion_rate',
          'support_ticket_rate',
        ],
        targetSampleSize: 5000,
        currentSampleSize: 0,
        minDetectableEffect: 0.1, // 10% improvement in onboarding
        statisticalPower: 0.8,
        createdBy: systemUser._id,
        status: 'running',
        startDate: now,
        createdAt: now,
        updatedAt: now,
      },

      {
        testId: 'pricing_timeline_value_prop',
        name: 'Timeline Hero vs Features List',
        hypothesis:
          'Showcasing horizontal timeline prominently on pricing page will increase conversion rates by demonstrating unique value',
        description:
          'Test whether featuring timeline as hero element on pricing page improves trial-to-paid conversion',
        variants: [
          {
            id: 'timeline_hero',
            name: 'Timeline Hero Section',
            description: 'Interactive timeline demo as hero element with clear value proposition',
            weight: 50,
            config: {
              heroType: 'timeline_demo',
              showInteractiveDemo: true,
              emphasizeYearView: true,
              valuePropsOrder: ['timeline', 'productivity', 'features'],
              demoAnimation: 'auto_scroll',
            },
          },
          {
            id: 'standard_features',
            name: 'Standard Features List',
            description: 'Traditional feature list with testimonials and pricing',
            weight: 50,
            config: {
              heroType: 'feature_list',
              showInteractiveDemo: false,
              emphasizeYearView: false,
              valuePropsOrder: ['features', 'productivity', 'testimonials'],
              demoAnimation: 'none',
            },
          },
        ],
        criteria: {
          userSegment: ['traditional', 'casual'], // Target users who need convincing
          planType: ['free'], // Only show to free users
          deviceType: ['desktop', 'tablet'], // Better demo experience on larger screens
        },
        primaryMetric: 'trial_to_paid_conversion_rate',
        secondaryMetrics: [
          'pricing_page_dwell_time',
          'demo_interaction_rate',
          'upgrade_button_click_rate',
          'feature_comparison_views',
          'support_pre_sale_inquiries',
        ],
        targetSampleSize: 3000,
        currentSampleSize: 0,
        minDetectableEffect: 0.15, // 15% improvement in conversion
        statisticalPower: 0.8,
        createdBy: systemUser._id,
        status: 'running',
        startDate: now,
        createdAt: now,
        updatedAt: now,
      },

      {
        testId: 'mobile_timeline_experience',
        name: 'Mobile Timeline Usability',
        hypothesis:
          'Optimized mobile horizontal timeline experience will improve mobile user engagement and reduce bounce rate',
        description:
          'Test mobile-specific timeline optimizations including touch gestures, responsive design, and simplified navigation',
        variants: [
          {
            id: 'optimized_mobile_timeline',
            name: 'Optimized Mobile Timeline',
            description:
              'Mobile-first timeline with touch gestures, pinch zoom, and responsive layout',
            weight: 60,
            config: {
              mobileOptimizations: true,
              touchGesturesEnabled: true,
              pinchZoomEnabled: true,
              responsiveMonthLayout: true,
              simplifiedNavigation: true,
              swipeToNavigate: true,
            },
          },
          {
            id: 'standard_mobile_view',
            name: 'Standard Mobile View',
            description: 'Current mobile implementation without specific optimizations',
            weight: 40,
            config: {
              mobileOptimizations: false,
              touchGesturesEnabled: false,
              pinchZoomEnabled: false,
              responsiveMonthLayout: false,
              simplifiedNavigation: false,
              swipeToNavigate: false,
            },
          },
        ],
        criteria: {
          deviceType: ['mobile'], // Mobile users only
          userSegment: ['casual', 'early_adopter', 'traditional'],
        },
        primaryMetric: 'mobile_session_duration',
        secondaryMetrics: [
          'mobile_bounce_rate',
          'mobile_event_creation_rate',
          'touch_interaction_rate',
          'zoom_usage_rate',
          'mobile_user_retention',
        ],
        targetSampleSize: 2000,
        currentSampleSize: 0,
        minDetectableEffect: 0.2, // 20% improvement in mobile engagement
        statisticalPower: 0.8,
        createdBy: systemUser._id,
        status: 'draft', // Start as draft for mobile testing
        startDate: now,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Insert all test configurations
    const testIds = [];
    for (const test of tests) {
      const existing = await ctx.db
        .query('abTests')
        .withIndex('by_test_id', (q) => q.eq('testId', test.testId))
        .first();

      if (!existing) {
        const testId = await ctx.db.insert('abTests', test);
        testIds.push(testId);
      }
    }

    return {
      message: 'Production A/B tests initialized',
      testsCreated: testIds.length,
      totalTests: tests.length,
    };
  },
});

/**
 * Get all active A/B test configurations
 */
export const getActiveTestConfigs = query({
  args: {},
  handler: async (ctx, _args) => {
    return await ctx.db
      .query('abTests')
      .withIndex('by_status', (q) => q.eq('status', 'running'))
      .collect();
  },
});

/**
 * Update test configuration
 */
export const updateTestConfig = mutation({
  args: {
    testId: v.string(),
    updates: v.object({
      status: v.optional(
        v.union(
          v.literal('draft'),
          v.literal('running'),
          v.literal('paused'),
          v.literal('completed'),
          v.literal('archived')
        )
      ),
      variants: v.optional(
        v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            description: v.string(),
            weight: v.number(),
            config: v.any(),
          })
        )
      ),
      targetSampleSize: v.optional(v.number()),
    }),
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
      ...args.updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(test._id);
  },
});

/**
 * Get test performance summary
 */
export const getTestPerformanceSummary = query({
  args: {},
  handler: async (ctx, _args) => {
    const activeTests = await ctx.db
      .query('abTests')
      .withIndex('by_status', (q) => q.eq('status', 'running'))
      .collect();

    const summary = [];

    for (const test of activeTests) {
      // Get assignment count
      const assignments = await ctx.db
        .query('abTestAssignments')
        .withIndex('by_test', (q) => q.eq('testId', test.testId))
        .collect();

      // Get event count
      const events = await ctx.db
        .query('abTestEvents')
        .withIndex('by_test', (q) => q.eq('testId', test.testId))
        .collect();

      const validEvents = events.filter((e) => e.isValid);
      const conversionEvents = validEvents.filter(
        (e) =>
          e.eventType === 'conversion' ||
          e.eventName.includes('conversion') ||
          e.eventName.includes('signup') ||
          e.eventName.includes('upgrade')
      );

      summary.push({
        testId: test.testId,
        name: test.name,
        status: test.status,
        totalUsers: assignments.length,
        totalEvents: validEvents.length,
        conversionEvents: conversionEvents.length,
        conversionRate:
          assignments.length > 0 ? (conversionEvents.length / assignments.length) * 100 : 0,
        sampleSizeProgress:
          test.targetSampleSize > 0 ? (assignments.length / test.targetSampleSize) * 100 : 0,
        daysRunning: Math.floor((Date.now() - test.startDate) / (1000 * 60 * 60 * 24)),
      });
    }

    return summary;
  },
});

/**
 * Create test configuration template
 */
export const createTestTemplate = mutation({
  args: {
    configId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    template: v.object({
      variants: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          defaultWeight: v.number(),
          config: v.any(),
        })
      ),
      defaultCriteria: v.any(),
      recommendedMetrics: v.array(v.string()),
      minSampleSize: v.number(),
      expectedDuration: v.number(),
    }),
    isPublic: v.boolean(),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert('abTestConfigs', {
      ...args,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Initialize default test templates
 */
export const initializeTestTemplates = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await ctx.auth.getUserIdentity();

    if (!userId) {
      throw new Error('Authentication required');
    }

    const systemUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), 'system@lineartime.app'))
      .first();

    if (!systemUser) {
      throw new Error('System user not found');
    }

    const templates = [
      {
        configId: 'ui_layout_test',
        name: 'UI Layout A/B Test',
        description: 'Template for testing different UI layouts and components',
        category: 'ui',
        template: {
          variants: [
            {
              name: 'New Design',
              description: 'Updated design with improved UX',
              defaultWeight: 50,
              config: { layoutVersion: 'new' },
            },
            {
              name: 'Current Design',
              description: 'Existing design as control',
              defaultWeight: 50,
              config: { layoutVersion: 'current' },
            },
          ],
          defaultCriteria: {
            userSegment: ['casual', 'early_adopter'],
            deviceType: ['desktop', 'mobile'],
          },
          recommendedMetrics: ['user_engagement_rate', 'session_duration', 'task_completion_rate'],
          minSampleSize: 1000,
          expectedDuration: 14,
        },
        isPublic: true,
        createdBy: systemUser._id,
      },
      {
        configId: 'onboarding_flow_test',
        name: 'Onboarding Flow Optimization',
        description: 'Template for testing different onboarding experiences',
        category: 'onboarding',
        template: {
          variants: [
            {
              name: 'Streamlined Onboarding',
              description: 'Simplified onboarding with fewer steps',
              defaultWeight: 50,
              config: { onboardingType: 'streamlined' },
            },
            {
              name: 'Comprehensive Onboarding',
              description: 'Detailed onboarding with full feature tour',
              defaultWeight: 50,
              config: { onboardingType: 'comprehensive' },
            },
          ],
          defaultCriteria: {
            returningUser: false,
            planType: ['free'],
          },
          recommendedMetrics: [
            'onboarding_completion_rate',
            'time_to_first_action',
            'user_retention_7d',
          ],
          minSampleSize: 2000,
          expectedDuration: 21,
        },
        isPublic: true,
        createdBy: systemUser._id,
      },
    ];

    const templateIds = [];
    for (const template of templates) {
      const existing = await ctx.db
        .query('abTestConfigs')
        .withIndex('by_config_id', (q) => q.eq('configId', template.configId))
        .first();

      if (!existing) {
        const templateId = await ctx.db.insert('abTestConfigs', template);
        templateIds.push(templateId);
      }
    }

    return {
      message: 'Test templates initialized',
      templatesCreated: templateIds.length,
    };
  },
});
