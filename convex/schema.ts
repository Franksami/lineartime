import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        theme: v.union(v.literal('light'), v.literal('dark'), v.literal('auto')),
        firstDayOfWeek: v.number(),
        timeFormat: v.union(v.literal('12'), v.literal('24')),
        timezone: v.string(),
        defaultEventDuration: v.number(),
        weekendDays: v.array(v.number()),
        workingHours: v.object({
          start: v.string(),
          end: v.string(),
        }),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

  events: defineTable({
    userId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    color: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    location: v.optional(v.string()),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal('daily'),
          v.literal('weekly'),
          v.literal('monthly'),
          v.literal('yearly')
        ),
        interval: v.optional(v.number()),
        count: v.optional(v.number()),
        until: v.optional(v.number()),
        byDay: v.optional(v.array(v.string())),
        byMonth: v.optional(v.array(v.number())),
        byMonthDay: v.optional(v.array(v.number())),
      })
    ),
    reminders: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal('notification'), v.literal('email')),
          minutesBefore: v.number(),
        })
      )
    ),
    attendees: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_start_time', ['startTime'])
    .index('by_user_and_time', ['userId', 'startTime'])
    .index('by_category', ['categoryId'])
    .index('by_user_and_category', ['userId', 'categoryId'])
    .index('by_updated', ['updatedAt'])
    .index('by_user_updated', ['userId', 'updatedAt'])
    // Performance optimization indexes
    .index('by_user_time_range', ['userId', 'startTime', 'endTime'])
    .index('by_user_category_time', ['userId', 'categoryId', 'startTime'])
    .index('by_user_all_day', ['userId', 'allDay', 'startTime']),

  categories: defineTable({
    userId: v.id('users'),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_name', ['name'])
    .index('by_user_and_name', ['userId', 'name']),

  calendars: defineTable({
    userId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    isDefault: v.boolean(),
    isShared: v.boolean(),
    shareSettings: v.optional(
      v.object({
        publicUrl: v.optional(v.string()),
        sharedWith: v.optional(v.array(v.string())),
        permissions: v.optional(v.union(v.literal('view'), v.literal('edit'), v.literal('admin'))),
      })
    ),
    syncSettings: v.optional(
      v.object({
        provider: v.union(
          v.literal('google'),
          v.literal('microsoft'),
          v.literal('apple'),
          v.literal('caldav')
        ),
        syncEnabled: v.boolean(),
        lastSync: v.optional(v.number()),
        syncToken: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_default', ['userId', 'isDefault'])
    .index('by_shared', ['isShared'])
    .index('by_updated', ['updatedAt']),

  aiSchedulingSessions: defineTable({
    userId: v.id('users'),
    query: v.string(),
    suggestions: v.array(
      v.object({
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        reason: v.string(),
        confidence: v.number(),
      })
    ),
    selectedSuggestion: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_created', ['createdAt']),

  // Calendar provider integrations
  calendarProviders: defineTable({
    userId: v.id('users'),
    provider: v.union(
      v.literal('google'),
      v.literal('microsoft'),
      v.literal('apple'),
      v.literal('caldav'),
      v.literal('notion'),
      v.literal('obsidian')
    ),
    // Encrypted tokens
    accessToken: v.object({
      encrypted: v.string(),
      iv: v.string(),
      tag: v.string(),
    }),
    refreshToken: v.optional(
      v.object({
        encrypted: v.string(),
        iv: v.string(),
        tag: v.string(),
      })
    ),
    expiresAt: v.optional(v.number()),
    providerAccountId: v.string(),
    // Sync metadata
    syncToken: v.optional(v.string()), // For incremental sync
    deltaLink: v.optional(v.string()), // For Microsoft delta queries
    webhookId: v.optional(v.string()), // For push notifications
    webhookExpiry: v.optional(v.number()), // Webhook renewal time
    lastSyncAt: v.optional(v.number()),
    // Provider-specific settings
    settings: v.object({
      calendars: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          color: v.string(),
          syncEnabled: v.boolean(),
          isPrimary: v.optional(v.boolean()),
          ctag: v.optional(v.string()), // For CalDAV sync
          syncToken: v.optional(v.string()), // Per-calendar sync token
        })
      ),
      syncDirection: v.optional(
        v.union(
          v.literal('pull'), // Only pull from provider
          v.literal('push'), // Only push to provider
          v.literal('bidirectional') // Two-way sync
        )
      ),
      conflictResolution: v.optional(
        v.union(
          v.literal('local'), // Local changes win
          v.literal('remote'), // Remote changes win
          v.literal('newest'), // Most recent change wins
          v.literal('manual') // Ask user
        )
      ),
      // CalDAV-specific settings
      serverUrl: v.optional(v.string()),
      username: v.optional(v.string()),
      // Google/Microsoft-specific settings
      domain: v.optional(v.string()),
      timezone: v.optional(v.string()),
      // Microsoft Graph subscription settings
      subscriptions: v.optional(
        v.array(
          v.object({
            id: v.string(),
            resource: v.string(),
            expirationDateTime: v.string(),
            createdAt: v.number(),
          })
        )
      ),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_provider', ['userId', 'provider'])
    .index('by_webhook', ['webhookId']),

  // Sync queue for background processing
  syncQueue: defineTable({
    userId: v.id('users'),
    provider: v.string(),
    operation: v.union(
      v.literal('full_sync'),
      v.literal('incremental_sync'),
      v.literal('webhook_update'),
      v.literal('webhook_renewal'),
      v.literal('event_create'),
      v.literal('event_update'),
      v.literal('event_delete')
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    priority: v.number(), // 1-10, higher is more urgent
    data: v.optional(v.any()), // Operation-specific data
    attempts: v.number(),
    lastAttempt: v.optional(v.number()),
    nextRetry: v.optional(v.number()), // For exponential backoff
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_status', ['status', 'priority'])
    .index('by_user', ['userId'])
    .index('by_provider', ['provider', 'status'])
    .index('by_next_retry', ['nextRetry', 'status'])
    .index('by_priority_pending', ['priority', 'status'])
    .index('by_created', ['createdAt'])
    // Performance optimization indexes for sync operations
    .index('by_user_provider_status', ['userId', 'provider', 'status'])
    .index('by_provider_created', ['provider', 'createdAt']),

  // Event sync mapping for conflict resolution
  eventSync: defineTable({
    localEventId: v.id('events'),
    providerId: v.id('calendarProviders'),
    providerEventId: v.string(),
    provider: v.string(),
    etag: v.optional(v.string()), // For optimistic concurrency
    vectorClock: v.optional(v.any()), // For conflict resolution
    lastModifiedLocal: v.number(),
    lastModifiedRemote: v.number(),
    syncStatus: v.union(
      v.literal('synced'),
      v.literal('pending_local'),
      v.literal('pending_remote'),
      v.literal('conflict')
    ),
    conflictData: v.optional(
      v.object({
        localVersion: v.any(),
        remoteVersion: v.any(),
        baseVersion: v.optional(v.any()), // For three-way merge
        detectedAt: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_provider', ['provider', 'providerEventId'])
    .index('by_local_event', ['localEventId'])
    .index('by_sync_status', ['syncStatus'])
    .index('by_provider_id', ['providerId'])
    // Performance optimization indexes
    .index('by_provider_status', ['provider', 'syncStatus'])
    .index('by_user_provider', ['providerId', 'syncStatus']),

  // Webhook verification tokens
  webhookTokens: defineTable({
    token: v.string(),
    provider: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index('by_token', ['token'])
    .index('by_expiry', ['expiresAt']),

  // Billing and subscription management
  subscriptions: defineTable({
    userId: v.id('users'),
    // Stripe identifiers
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeProductId: v.optional(v.string()),
    // Subscription status
    status: v.union(
      v.literal('active'),
      v.literal('canceled'),
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      v.literal('past_due'),
      v.literal('paused'),
      v.literal('trialing'),
      v.literal('unpaid')
    ),
    // Plan details
    planName: v.string(), // "Free", "Pro", "Enterprise"
    planType: v.union(v.literal('free'), v.literal('monthly'), v.literal('yearly')),
    // Billing periods
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    // Cancellation
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    // Trial information
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    // Usage limits based on plan
    limits: v.object({
      maxEvents: v.number(), // -1 for unlimited
      maxCalendars: v.number(),
      maxProviders: v.number(), // Calendar sync providers
      aiSchedulingRequests: v.number(), // Per month
      storageGB: v.number(),
    }),
    // Usage tracking
    usage: v.object({
      currentEvents: v.number(),
      currentCalendars: v.number(),
      currentProviders: v.number(),
      aiRequestsThisMonth: v.number(),
      storageUsedMB: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_stripe_customer', ['stripeCustomerId'])
    .index('by_stripe_subscription', ['stripeSubscriptionId'])
    .index('by_status', ['status'])
    .index('by_plan', ['planType', 'status']),

  // Payment history and invoices
  payments: defineTable({
    userId: v.id('users'),
    subscriptionId: v.id('subscriptions'),
    // Stripe payment details
    stripePaymentIntentId: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    // Payment information
    amount: v.number(), // Amount in cents
    currency: v.string(),
    status: v.union(
      v.literal('succeeded'),
      v.literal('failed'),
      v.literal('pending'),
      v.literal('canceled'),
      v.literal('refunded')
    ),
    paymentMethod: v.optional(v.string()), // "card", "bank_account", etc.
    // Metadata
    description: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    refundedAmount: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_subscription', ['subscriptionId'])
    .index('by_stripe_payment_intent', ['stripePaymentIntentId'])
    .index('by_status', ['status'])
    .index('by_date', ['createdAt']),

  // AI chat persistence
  aiChats: defineTable({
    userId: v.id('users'),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_updated', ['userId', 'updatedAt']),

  aiMessages: defineTable({
    chatId: v.id('aiChats'),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    parts: v.array(v.any()),
    createdAt: v.number(),
  })
    .index('by_chat', ['chatId'])
    .index('by_chat_created', ['chatId', 'createdAt']),

  aiEvents: defineTable({
    userId: v.optional(v.id('users')),
    chatId: v.optional(v.id('aiChats')),
    eventType: v.string(), // e.g. "rate", "copy", "regenerate", "applySuggestion"
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventType'])
    .index('by_user_event', ['userId', 'eventType'])
    .index('by_user_created', ['userId', 'createdAt']),

  // Usage analytics and limits enforcement
  usageAnalytics: defineTable({
    userId: v.id('users'),
    // Time period (YYYY-MM format for monthly tracking)
    period: v.string(),
    // Usage metrics
    eventsCreated: v.number(),
    eventsUpdated: v.number(),
    eventsDeleted: v.number(),
    aiSchedulingRequests: v.number(),
    calendarSyncOperations: v.number(),
    storageUsedMB: v.number(),
    // API usage
    apiRequestsTotal: v.number(),
    webhookEventsProcessed: v.number(),
    // Feature usage
    featuresUsed: v.array(v.string()), // ["calendar_sync", "ai_scheduling", "analytics"]
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_period', ['period'])
    .index('by_user_period', ['userId', 'period']),

  // Feature flags and plan permissions
  planPermissions: defineTable({
    planType: v.union(v.literal('free'), v.literal('monthly'), v.literal('yearly')), // Changed from v.string() to match subscriptions table
    // Feature permissions
    features: v.object({
      maxEvents: v.number(),
      maxCalendars: v.number(),
      maxProviders: v.number(),
      aiScheduling: v.boolean(),
      calendarSync: v.boolean(),
      analytics: v.boolean(),
      prioritySupport: v.boolean(),
      customThemes: v.boolean(),
      exportData: v.boolean(),
      teamSharing: v.boolean(),
      apiAccess: v.boolean(),
    }),
    // Pricing
    priceMonthly: v.optional(v.number()), // In cents
    priceYearly: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    // Metadata
    displayName: v.string(),
    description: v.string(),
    popular: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_plan', ['planType'])
    .index('by_popular', ['popular']),

  // A/B Testing Framework Tables
  abTests: defineTable({
    testId: v.string(),
    name: v.string(),
    hypothesis: v.string(),
    description: v.optional(v.string()),
    // Test configuration
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        weight: v.number(), // 0-100 percentage
        config: v.any(), // Test-specific configuration
      })
    ),
    // Targeting criteria
    criteria: v.object({
      userSegment: v.optional(v.array(v.string())), // ['early_adopter', 'power_user', 'traditional']
      geography: v.optional(v.array(v.string())), // Country codes
      deviceType: v.optional(v.array(v.string())), // ['mobile', 'desktop', 'tablet']
      returningUser: v.optional(v.boolean()),
      minAccountAge: v.optional(v.number()), // Days
      planType: v.optional(v.array(v.string())), // ['free', 'pro', 'enterprise']
    }),
    // Metrics configuration
    primaryMetric: v.string(),
    secondaryMetrics: v.array(v.string()),
    // Test lifecycle
    status: v.union(
      v.literal('draft'),
      v.literal('running'),
      v.literal('paused'),
      v.literal('completed'),
      v.literal('archived')
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    // Sample size and power analysis
    targetSampleSize: v.number(),
    currentSampleSize: v.number(),
    minDetectableEffect: v.number(), // Minimum effect size to detect
    statisticalPower: v.number(), // Desired statistical power (0.8 = 80%)
    // Results and analysis
    results: v.optional(
      v.object({
        winner: v.optional(v.string()), // Winning variant ID
        confidence: v.number(), // Statistical confidence level
        effect: v.number(), // Measured effect size
        pValue: v.number(), // Statistical significance
        completedAt: v.number(),
        recommendation: v.string(), // Action recommendation
      })
    ),
    // Metadata
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_test_id', ['testId'])
    .index('by_created_by', ['createdBy'])
    .index('by_start_date', ['startDate'])
    .index('by_current_sample', ['currentSampleSize'])
    .index('by_active_tests', ['status', 'startDate']),

  // A/B Test User Assignments
  abTestAssignments: defineTable({
    userId: v.id('users'),
    testId: v.string(),
    variantId: v.string(),
    // Assignment context
    assignmentCriteria: v.object({
      userSegment: v.optional(v.string()),
      deviceType: v.optional(v.string()),
      geography: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      referrer: v.optional(v.string()),
    }),
    // Consistency hash for stable assignments
    hash: v.string(), // Stable hash for user+test combination
    // Assignment metadata
    assignedAt: v.number(),
    firstExposure: v.optional(v.number()), // When user first saw the variant
    lastInteraction: v.optional(v.number()),
    // Exclusions and overrides
    excluded: v.boolean(),
    exclusionReason: v.optional(v.string()),
    forcedVariant: v.optional(v.string()), // Manual override for QA/testing
    // Quality assurance
    isBot: v.boolean(),
    isInternal: v.boolean(), // Internal user/employee
  })
    .index('by_user', ['userId'])
    .index('by_test', ['testId'])
    .index('by_variant', ['testId', 'variantId'])
    .index('by_user_test', ['userId', 'testId'])
    .index('by_assignment_date', ['assignedAt'])
    .index('by_active_assignments', ['excluded', 'assignedAt'])
    // Performance optimization indexes
    .index('by_test_variant_user', ['testId', 'variantId', 'userId'])
    .index('by_hash', ['hash']),

  // A/B Test Events and Metrics
  abTestEvents: defineTable({
    userId: v.id('users'),
    testId: v.string(),
    variantId: v.string(),
    // Event details
    eventType: v.string(), // 'exposure', 'conversion', 'custom'
    eventName: v.string(), // Specific event name
    value: v.number(), // Numeric value for metric calculation
    // Event metadata
    properties: v.optional(v.any()), // Additional event properties
    sessionId: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    referrer: v.optional(v.string()),
    // Technical context
    deviceType: v.optional(v.string()),
    browserType: v.optional(v.string()),
    osType: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    // Timing
    timestamp: v.number(),
    serverTimestamp: v.number(), // Server-side timestamp for accuracy
    // Data quality
    isValid: v.boolean(), // False if event should be excluded from analysis
    invalidationReason: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_test', ['testId'])
    .index('by_test_variant', ['testId', 'variantId'])
    .index('by_user_test', ['userId', 'testId'])
    .index('by_event_type', ['eventType'])
    .index('by_event_name', ['eventName'])
    .index('by_timestamp', ['timestamp'])
    .index('by_test_timestamp', ['testId', 'timestamp'])
    // Analysis optimization indexes
    .index('by_test_variant_timestamp', ['testId', 'variantId', 'timestamp'])
    .index('by_valid_events', ['isValid', 'testId', 'timestamp'])
    .index('by_conversion_events', ['eventType', 'testId', 'timestamp']),

  // A/B Test Configuration Presets
  abTestConfigs: defineTable({
    configId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(), // 'ui', 'feature', 'onboarding', 'pricing'
    // Template configuration
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
      expectedDuration: v.number(), // Days
    }),
    // Usage tracking
    usageCount: v.number(),
    lastUsed: v.optional(v.number()),
    // Access control
    isPublic: v.boolean(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_config_id', ['configId'])
    .index('by_category', ['category'])
    .index('by_usage', ['usageCount'])
    .index('by_public', ['isPublic'])
    .index('by_created_by', ['createdBy']),

  // A/B Test Analytics Cache for Performance
  abTestAnalytics: defineTable({
    testId: v.string(),
    variantId: v.optional(v.string()), // null for test-wide metrics
    metric: v.string(),
    // Aggregated metrics
    totalUsers: v.number(),
    totalEvents: v.number(),
    conversionRate: v.number(),
    averageValue: v.number(),
    standardDeviation: v.number(),
    // Time-series data (hourly/daily buckets)
    timeBucket: v.string(), // 'YYYY-MM-DD-HH' or 'YYYY-MM-DD'
    bucketType: v.union(v.literal('hourly'), v.literal('daily')),
    // Statistical analysis
    confidenceInterval: v.object({
      lower: v.number(),
      upper: v.number(),
      level: v.number(), // 0.95 for 95% confidence
    }),
    // Cache metadata
    calculatedAt: v.number(),
    validUntil: v.number(), // TTL for cache invalidation
  })
    .index('by_test', ['testId'])
    .index('by_test_variant', ['testId', 'variantId'])
    .index('by_test_metric', ['testId', 'metric'])
    .index('by_time_bucket', ['testId', 'timeBucket'])
    .index('by_cache_expiry', ['validUntil'])
    // Performance optimization
    .index('by_test_variant_metric', ['testId', 'variantId', 'metric']),

  // User Engagement Analytics for Timeline Validation
  engagementSessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    totalDuration: v.optional(v.number()),
    viewMode: v.union(v.literal('horizontal'), v.literal('traditional'), v.literal('hybrid')),
    // Session outcomes
    eventsCreated: v.number(),
    eventsModified: v.number(),
    monthsNavigated: v.number(),
    totalScrollDistance: v.number(),
    focusTime: v.number(),
    satisfactionScore: v.optional(v.number()), // 1-10 rating
    taskCompleted: v.boolean(),
    exitReason: v.optional(
      v.union(
        v.literal('natural'),
        v.literal('frustrated'),
        v.literal('distracted'),
        v.literal('completed')
      )
    ),
    // Demographics
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
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_session', ['sessionId'])
    .index('by_view_mode', ['viewMode'])
    .index('by_user_view', ['userId', 'viewMode'])
    .index('by_start_time', ['startTime'])
    .index('by_user_time', ['userId', 'startTime'])
    .index('by_device_type', ['deviceType'])
    .index('by_user_segment', ['userSegment'])
    // Performance optimization indexes for real-time analytics
    .index('by_active_sessions', ['endTime', 'startTime'])
    .index('by_recent_sessions', ['createdAt', 'viewMode']),

  // Timeline Interactions for detailed user behavior analysis
  timelineInteractions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
    interactionId: v.string(),
    timestamp: v.number(),
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
    // Target information
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
    // Metadata
    currentView: v.union(v.literal('horizontal'), v.literal('traditional'), v.literal('hybrid')),
    timelinePosition: v.number(), // 0-1 position on timeline
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
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_session', ['sessionId'])
    .index('by_action', ['action'])
    .index('by_timestamp', ['timestamp'])
    .index('by_user_action', ['userId', 'action'])
    .index('by_session_action', ['sessionId', 'action'])
    .index('by_target_type', ['targetType'])
    .index('by_view_mode', ['currentView'])
    // Performance optimization for real-time streaming
    .index('by_recent_interactions', ['timestamp', 'action'])
    .index('by_user_recent', ['userId', 'timestamp'])
    .index('by_session_recent', ['sessionId', 'timestamp']),

  // Engagement Analytics Cache for real-time dashboard performance
  engagementAnalytics: defineTable({
    metric: v.string(),
    timeframe: v.union(v.literal('hour'), v.literal('day'), v.literal('week'), v.literal('month')),
    bucketTime: v.string(), // ISO timestamp for the bucket (hour/day/week start)
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
    userSegment: v.optional(
      v.union(
        v.literal('early_adopter'),
        v.literal('traditional'),
        v.literal('power_user'),
        v.literal('casual'),
        v.literal('all')
      )
    ),
    // Metric values
    totalSessions: v.number(),
    averageSessionDuration: v.number(),
    eventCreationRate: v.number(),
    monthNavigationRate: v.number(),
    timelineScrollRate: v.number(),
    userSatisfactionScore: v.number(),
    taskCompletionRate: v.number(),
    bounceRate: v.number(),
    retentionRate: v.optional(
      v.object({
        day1: v.number(),
        day7: v.number(),
        day30: v.number(),
      })
    ),
    // Aggregated statistics
    uniqueUsers: v.number(),
    totalInteractions: v.number(),
    averageFocusTime: v.number(),
    // Timeline-specific metrics
    horizontalTimelineUsage: v.number(),
    traditionalViewUsage: v.number(),
    hybridViewUsage: v.number(),
    monthlyEngagementHeatMap: v.optional(v.array(v.number())), // 12-element array for month engagement
    // Cache metadata
    calculatedAt: v.number(),
    validUntil: v.number(),
  })
    .index('by_metric', ['metric'])
    .index('by_timeframe', ['timeframe', 'bucketTime'])
    .index('by_view_mode', ['viewMode', 'timeframe'])
    .index('by_device', ['deviceType', 'timeframe'])
    .index('by_segment', ['userSegment', 'timeframe'])
    .index('by_cache_expiry', ['validUntil'])
    // Performance optimization for dashboard queries
    .index('by_metric_timeframe', ['metric', 'timeframe', 'bucketTime'])
    .index('by_recent_metrics', ['calculatedAt', 'metric']),
});
