import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { requireAuth } from './auth';

/**
 * CLERK BILLING INTEGRATION
 *
 * This module now integrates with Clerk's billing system instead of direct Stripe.
 * - Subscription data comes from Clerk webhook events (user.updated with publicMetadata)
 * - Stripe customer IDs are stored in Clerk user privateMetadata
 * - Clerk handles all billing UI and Stripe integration internally
 *
 * Key changes:
 * - createOrUpdateSubscription() now handles Clerk webhook subscription updates
 * - Billing portal redirects to Clerk's PricingTable component
 * - Plan permissions still stored in Convex for feature gating
 */

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = query({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    subscription: Doc<'subscriptions'> | null;
    planPermissions: Doc<'planPermissions'> | null;
    isActive: boolean;
    daysUntilExpiry: number | null;
    usage: any;
  }> => {
    const { user } = await requireAuth(ctx);

    // Get user's current subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.neq(q.field('status'), 'canceled'))
      .first();

    if (!subscription) {
      // User has no subscription - return free plan
      const freePlan = await ctx.db
        .query('planPermissions')
        .withIndex('by_plan', (q) => q.eq('planType', 'free'))
        .first();

      return {
        subscription: null,
        planPermissions: freePlan,
        isActive: true, // Free plan is always active
        daysUntilExpiry: null,
        usage: {
          currentEvents: 0,
          currentCalendars: 0,
          currentProviders: 0,
          aiRequestsThisMonth: 0,
          storageUsedMB: 0,
        },
      };
    }

    // Get plan permissions
    const planPermissions = await ctx.db
      .query('planPermissions')
      .withIndex('by_plan', (q) => q.eq('planType', subscription.planType))
      .first();

    // Calculate days until expiry
    const now = Date.now();
    const daysUntilExpiry =
      subscription.currentPeriodEnd > now
        ? Math.ceil((subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))
        : 0;

    // Check if subscription is active
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return {
      subscription,
      planPermissions,
      isActive,
      daysUntilExpiry,
      usage: subscription.usage,
    };
  },
});

/**
 * Create or update subscription from Stripe webhook
 */
export const createOrUpdateSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeProductId: v.optional(v.string()),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<'subscriptions'>> => {
    const now = Date.now();

    // Determine plan type from price ID (you'd configure this mapping)
    const planMapping: Record<string, { name: string; type: 'free' | 'monthly' | 'yearly' }> = {
      price_monthly_pro: { name: 'Pro', type: 'monthly' },
      price_yearly_pro: { name: 'Pro', type: 'yearly' },
      price_monthly_enterprise: { name: 'Enterprise', type: 'monthly' },
      price_yearly_enterprise: { name: 'Enterprise', type: 'yearly' },
    };

    const planInfo = planMapping[args.stripePriceId] || { name: 'Unknown', type: 'monthly' };

    // Get plan permissions to set limits
    const planPermissions = await ctx.db
      .query('planPermissions')
      .withIndex('by_plan', (q) => q.eq('planType', planInfo.type))
      .first();

    const limits = planPermissions?.features
      ? {
          maxEvents: planPermissions.features.maxEvents,
          maxCalendars: planPermissions.features.maxCalendars,
          maxProviders: planPermissions.features.maxProviders,
          aiSchedulingRequests: 100, // Default monthly limit
          storageGB: 5, // Default storage limit
        }
      : {
          maxEvents: 1000,
          maxCalendars: 3,
          maxProviders: 2,
          aiSchedulingRequests: 100,
          storageGB: 5,
        };

    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripe_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId)
      )
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        status: args.status as
          | 'active'
          | 'canceled'
          | 'incomplete'
          | 'incomplete_expired'
          | 'past_due'
          | 'paused'
          | 'trialing'
          | 'unpaid',
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.canceledAt,
        trialStart: args.trialStart,
        trialEnd: args.trialEnd,
        updatedAt: now,
      });

      return existingSubscription._id;
    }
    // Create new subscription
    return await ctx.db.insert('subscriptions', {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripePriceId: args.stripePriceId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeProductId: args.stripeProductId,
      status: args.status as
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'paused'
        | 'trialing'
        | 'unpaid',
      planName: planInfo.name,
      planType: planInfo.type,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      canceledAt: args.canceledAt,
      trialStart: args.trialStart,
      trialEnd: args.trialEnd,
      limits,
      usage: {
        currentEvents: 0,
        currentCalendars: 0,
        currentProviders: 0,
        aiRequestsThisMonth: 0,
        storageUsedMB: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update subscription from Clerk webhook (user.updated event)
 * Clerk manages Stripe subscriptions and sends us simplified data via webhooks
 */
export const updateSubscriptionFromClerk = internalMutation({
  args: {
    userId: v.id('users'),
    subscription: v.optional(
      v.object({
        planName: v.string(), // "Free", "Pro", "Enterprise"
        planType: v.union(v.literal('free'), v.literal('monthly'), v.literal('yearly')), // Fixed: now properly typed to match schema
        status: v.union(
          v.literal('active'),
          v.literal('canceled'),
          v.literal('incomplete'),
          v.literal('incomplete_expired'),
          v.literal('past_due'),
          v.literal('paused'),
          v.literal('trialing'),
          v.literal('unpaid')
        ), // Fixed: now properly typed to match schema
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        cancelAtPeriodEnd: v.optional(v.boolean()),
        stripeCustomerId: v.optional(v.string()),
        stripeSubscriptionId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();

    // Get existing subscription for this user
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!args.subscription) {
      // User downgraded to free or subscription removed
      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, {
          status: 'canceled' as const,
          planName: 'Free',
          planType: 'free' as const,
          updatedAt: now,
        });
      }
      return;
    }

    const { subscription } = args;

    // Get plan permissions for limits
    const planPermissions = await ctx.db
      .query('planPermissions')
      .withIndex('by_plan', (q) => q.eq('planType', subscription.planType))
      .first();

    const limits = planPermissions?.features
      ? {
          maxEvents: planPermissions.features.maxEvents,
          maxCalendars: planPermissions.features.maxCalendars,
          maxProviders: planPermissions.features.maxProviders,
          aiSchedulingRequests: planPermissions.features.aiScheduling ? -1 : 0,
          storageGB: 10, // Generous storage for paid plans
        }
      : {
          maxEvents: 100,
          maxCalendars: 1,
          maxProviders: 1,
          aiSchedulingRequests: 0,
          storageGB: 1,
        };

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        status: subscription.status, // Fixed: no more type casting needed
        planName: subscription.planName,
        planType: subscription.planType, // Fixed: now properly typed
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        limits,
        updatedAt: now,
      });
    } else {
      // Create new subscription record
      await ctx.db.insert('subscriptions', {
        userId: args.userId,
        stripeCustomerId: subscription.stripeCustomerId || '',
        stripePriceId: '', // Not needed with Clerk billing
        stripeSubscriptionId: subscription.stripeSubscriptionId || '',
        stripeProductId: undefined,
        status: subscription.status, // Fixed: no more type casting needed
        planName: subscription.planName,
        planType: subscription.planType, // Fixed: now properly typed
        currentPeriodStart: subscription.currentPeriodStart || now,
        currentPeriodEnd: subscription.currentPeriodEnd || now + 30 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
        canceledAt: undefined,
        trialStart: undefined,
        trialEnd: undefined,
        limits,
        usage: {
          currentEvents: 0,
          currentCalendars: 0,
          currentProviders: 0,
          aiRequestsThisMonth: 0,
          storageUsedMB: 0,
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Record a payment from Stripe webhook
 */
export const recordPayment = internalMutation({
  args: {
    userId: v.id('users'),
    subscriptionId: v.id('subscriptions'),
    stripePaymentIntentId: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    paymentMethod: v.optional(v.string()),
    description: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<'payments'>> => {
    const now = Date.now();

    return await ctx.db.insert('payments', {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeInvoiceId: args.stripeInvoiceId,
      amount: args.amount,
      currency: args.currency,
      status: args.status as any,
      paymentMethod: args.paymentMethod,
      description: args.description,
      failureReason: args.failureReason,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    immediately: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    const { user } = await requireAuth(ctx);

    // Get user's current subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.neq(q.field('status'), 'canceled'))
      .first();

    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found',
      };
    }

    const now = Date.now();

    if (args.immediately) {
      // Cancel immediately
      await ctx.db.patch(subscription._id, {
        status: 'canceled',
        canceledAt: now,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });

      return {
        success: true,
        message: 'Subscription canceled immediately',
      };
    }
    // Cancel at period end
    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: true,
      canceledAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    };
  },
});

/**
 * Check usage limits for a user
 */
export const checkUsageLimits = query({
  args: {
    feature: v.string(), // "events", "calendars", "providers", "ai_scheduling"
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> => {
    const { user } = await requireAuth(ctx);

    // Get user's subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.neq(q.field('status'), 'canceled'))
      .first();

    // Default to free plan limits if no subscription
    const limits = subscription?.limits || {
      maxEvents: 100,
      maxCalendars: 1,
      maxProviders: 1,
      aiSchedulingRequests: 10,
      storageGB: 1,
    };

    const usage = subscription?.usage || {
      currentEvents: 0,
      currentCalendars: 0,
      currentProviders: 0,
      aiRequestsThisMonth: 0,
      storageUsedMB: 0,
    };

    let current = 0;
    let limit = 0;

    switch (args.feature) {
      case 'events':
        current = usage.currentEvents;
        limit = limits.maxEvents;
        break;
      case 'calendars':
        current = usage.currentCalendars;
        limit = limits.maxCalendars;
        break;
      case 'providers':
        current = usage.currentProviders;
        limit = limits.maxProviders;
        break;
      case 'ai_scheduling':
        current = usage.aiRequestsThisMonth;
        limit = limits.aiSchedulingRequests;
        break;
      default:
        return { allowed: false, current: 0, limit: 0, percentage: 0 };
    }

    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const allowed = limit === -1 || current < limit; // -1 means unlimited

    return {
      allowed,
      current,
      limit,
      percentage,
    };
  },
});

/**
 * Update usage statistics
 */
export const updateUsage = internalMutation({
  args: {
    userId: v.id('users'),
    feature: v.string(),
    increment: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Get user's subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.neq(q.field('status'), 'canceled'))
      .first();

    if (!subscription) {
      // Create a free plan subscription for the user
      const now = Date.now();
      const freeLimits = {
        maxEvents: 100,
        maxCalendars: 1,
        maxProviders: 1,
        aiSchedulingRequests: 10,
        storageGB: 1,
      };

      await ctx.db.insert('subscriptions', {
        userId: args.userId,
        stripeCustomerId: '', // Will be set when user subscribes
        stripePriceId: 'free',
        stripeSubscriptionId: 'free',
        status: 'active',
        planName: 'Free',
        planType: 'free',
        currentPeriodStart: now,
        currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000, // 1 year from now
        cancelAtPeriodEnd: false,
        limits: freeLimits,
        usage: {
          currentEvents: args.feature === 'events' ? args.increment : 0,
          currentCalendars: args.feature === 'calendars' ? args.increment : 0,
          currentProviders: args.feature === 'providers' ? args.increment : 0,
          aiRequestsThisMonth: args.feature === 'ai_scheduling' ? args.increment : 0,
          storageUsedMB: args.feature === 'storage' ? args.increment : 0,
        },
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    // Update usage
    const currentUsage = subscription.usage;
    const newUsage = { ...currentUsage };

    switch (args.feature) {
      case 'events':
        newUsage.currentEvents = Math.max(0, currentUsage.currentEvents + args.increment);
        break;
      case 'calendars':
        newUsage.currentCalendars = Math.max(0, currentUsage.currentCalendars + args.increment);
        break;
      case 'providers':
        newUsage.currentProviders = Math.max(0, currentUsage.currentProviders + args.increment);
        break;
      case 'ai_scheduling':
        newUsage.aiRequestsThisMonth = Math.max(
          0,
          currentUsage.aiRequestsThisMonth + args.increment
        );
        break;
      case 'storage':
        newUsage.storageUsedMB = Math.max(0, currentUsage.storageUsedMB + args.increment);
        break;
    }

    await ctx.db.patch(subscription._id, {
      usage: newUsage,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get available plans
 */
export const getAvailablePlans = query({
  args: {},
  handler: async (ctx): Promise<Doc<'planPermissions'>[]> => {
    return await ctx.db.query('planPermissions').collect();
  },
});

/**
 * Get user's payment history
 */
export const getPaymentHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<'payments'>[]> => {
    const { user } = await requireAuth(ctx);

    return await ctx.db
      .query('payments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit || 50);
  },
});

/**
 * Track usage analytics
 */
export const trackUsageAnalytics = internalMutation({
  args: {
    userId: v.id('users'),
    action: v.string(), // "event_created", "ai_request", etc.
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const currentPeriod = new Date(now).toISOString().substring(0, 7); // YYYY-MM format

    // Get or create usage analytics record for this period
    const analytics = await ctx.db
      .query('usageAnalytics')
      .withIndex('by_user_period', (q) => q.eq('userId', args.userId).eq('period', currentPeriod))
      .first();

    if (!analytics) {
      // Create new analytics record
      await ctx.db.insert('usageAnalytics', {
        userId: args.userId,
        period: currentPeriod,
        eventsCreated: args.action === 'event_created' ? 1 : 0,
        eventsUpdated: args.action === 'event_updated' ? 1 : 0,
        eventsDeleted: args.action === 'event_deleted' ? 1 : 0,
        aiSchedulingRequests: args.action === 'ai_request' ? 1 : 0,
        calendarSyncOperations: args.action === 'calendar_sync' ? 1 : 0,
        storageUsedMB: 0,
        apiRequestsTotal: 1,
        webhookEventsProcessed: args.action === 'webhook_processed' ? 1 : 0,
        featuresUsed: args.metadata?.feature ? [args.metadata.feature] : [],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing analytics
      const updates: any = { updatedAt: now };

      switch (args.action) {
        case 'event_created':
          updates.eventsCreated = analytics.eventsCreated + 1;
          break;
        case 'event_updated':
          updates.eventsUpdated = analytics.eventsUpdated + 1;
          break;
        case 'event_deleted':
          updates.eventsDeleted = analytics.eventsDeleted + 1;
          break;
        case 'ai_request':
          updates.aiSchedulingRequests = analytics.aiSchedulingRequests + 1;
          break;
        case 'calendar_sync':
          updates.calendarSyncOperations = analytics.calendarSyncOperations + 1;
          break;
        case 'webhook_processed':
          updates.webhookEventsProcessed = analytics.webhookEventsProcessed + 1;
          break;
      }

      updates.apiRequestsTotal = analytics.apiRequestsTotal + 1;

      // Add feature to featuresUsed if not already present
      if (args.metadata?.feature && !analytics.featuresUsed.includes(args.metadata.feature)) {
        updates.featuresUsed = [...analytics.featuresUsed, args.metadata.feature];
      }

      await ctx.db.patch(analytics._id, updates);
    }
  },
});

/**
 * Initialize user subscription (creates free tier for new users)
 */
export const initializeUserSubscription = internalMutation({
  args: {
    clerkUserId: v.string(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkUserId))
      .first();

    if (!user) {
      console.warn(
        `User with Clerk ID ${args.clerkUserId} not found for subscription initialization`
      );
      return;
    }

    // Check if user already has a subscription
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existingSubscription) {
      console.log(`User ${args.clerkUserId} already has a subscription, skipping initialization`);
      return;
    }

    // Create free plan subscription for the user
    const now = Date.now();
    const freeLimits = {
      maxEvents: 100,
      maxCalendars: 1,
      maxProviders: 1,
      aiSchedulingRequests: 10,
      storageGB: 1,
    };

    await ctx.db.insert('subscriptions', {
      userId: user._id,
      stripeCustomerId: args.stripeCustomerId || '',
      stripePriceId: 'free',
      stripeSubscriptionId: 'free',
      status: 'active',
      planName: 'Free',
      planType: 'free',
      currentPeriodStart: now,
      currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      cancelAtPeriodEnd: false,
      limits: freeLimits,
      usage: {
        currentEvents: 0,
        currentCalendars: 0,
        currentProviders: 0,
        aiRequestsThisMonth: 0,
        storageUsedMB: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Initialized free subscription for user: ${args.clerkUserId}`);
  },
});

/**
 * Initialize default plan permissions (run once)
 */
export const initializePlanPermissions = internalMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const now = Date.now();

    const plans = [
      {
        planType: 'free' as const,
        displayName: 'Free',
        description: 'Perfect for getting started',
        popular: false,
        features: {
          maxEvents: 100,
          maxCalendars: 1,
          maxProviders: 1,
          aiScheduling: false,
          calendarSync: true,
          analytics: false,
          prioritySupport: false,
          customThemes: false,
          exportData: false,
          teamSharing: false,
          apiAccess: false,
        },
      },
      {
        planType: 'monthly' as const,
        displayName: 'Pro',
        description: 'For power users who need more',
        popular: true,
        priceMonthly: 999, // $9.99
        stripePriceId: 'price_monthly_pro',
        features: {
          maxEvents: -1, // Unlimited
          maxCalendars: 10,
          maxProviders: 5,
          aiScheduling: true,
          calendarSync: true,
          analytics: true,
          prioritySupport: false,
          customThemes: true,
          exportData: true,
          teamSharing: false,
          apiAccess: false,
        },
      },
      {
        planType: 'yearly' as const,
        displayName: 'Pro (Yearly)',
        description: 'Save 20% with annual billing',
        popular: false,
        priceYearly: 9999, // $99.99 (save $20)
        stripePriceIdYearly: 'price_yearly_pro',
        features: {
          maxEvents: -1,
          maxCalendars: 10,
          maxProviders: 5,
          aiScheduling: true,
          calendarSync: true,
          analytics: true,
          prioritySupport: true,
          customThemes: true,
          exportData: true,
          teamSharing: true,
          apiAccess: true,
        },
      },
    ];

    // Check if plans already exist
    const existingPlans = await ctx.db.query('planPermissions').collect();

    if (existingPlans.length === 0) {
      // Insert default plans
      for (const plan of plans) {
        await ctx.db.insert('planPermissions', {
          ...plan,
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log('✅ Default plan permissions initialized');
    } else {
      console.log('📝 Plan permissions already exist, skipping initialization');
    }
  },
});
