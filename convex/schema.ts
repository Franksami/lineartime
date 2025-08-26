import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.union(v.literal("light"), v.literal("dark"), v.literal("auto")),
      firstDayOfWeek: v.number(),
      timeFormat: v.union(v.literal("12"), v.literal("24")),
      timezone: v.string(),
      defaultEventDuration: v.number(),
      weekendDays: v.array(v.number()),
      workingHours: v.object({
        start: v.string(),
        end: v.string(),
      }),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  events: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    color: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    location: v.optional(v.string()),
    recurrence: v.optional(v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      ),
      interval: v.optional(v.number()),
      count: v.optional(v.number()),
      until: v.optional(v.number()),
      byDay: v.optional(v.array(v.string())),
      byMonth: v.optional(v.array(v.number())),
      byMonthDay: v.optional(v.array(v.number())),
    })),
    reminders: v.optional(v.array(v.object({
      type: v.union(v.literal("notification"), v.literal("email")),
      minutesBefore: v.number(),
    }))),
    attendees: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_start_time", ["startTime"])
    .index("by_user_and_time", ["userId", "startTime"])
    .index("by_category", ["categoryId"])
    .index("by_user_and_category", ["userId", "categoryId"])
    .index("by_updated", ["updatedAt"])
    .index("by_user_updated", ["userId", "updatedAt"])
    // Performance optimization indexes
    .index("by_user_time_range", ["userId", "startTime", "endTime"])
    .index("by_user_category_time", ["userId", "categoryId", "startTime"])
    .index("by_user_all_day", ["userId", "allDay", "startTime"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"])
    .index("by_user_and_name", ["userId", "name"]),

  calendars: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    isDefault: v.boolean(),
    isShared: v.boolean(),
    shareSettings: v.optional(v.object({
      publicUrl: v.optional(v.string()),
      sharedWith: v.optional(v.array(v.string())),
      permissions: v.optional(v.union(
        v.literal("view"),
        v.literal("edit"),
        v.literal("admin")
      )),
    })),
    syncSettings: v.optional(v.object({
      provider: v.union(
        v.literal("google"),
        v.literal("microsoft"),
        v.literal("apple"),
        v.literal("caldav")
      ),
      syncEnabled: v.boolean(),
      lastSync: v.optional(v.number()),
      syncToken: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"])
    .index("by_shared", ["isShared"])
    .index("by_updated", ["updatedAt"]),

  aiSchedulingSessions: defineTable({
    userId: v.id("users"),
    query: v.string(),
    suggestions: v.array(v.object({
      title: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      reason: v.string(),
      confidence: v.number(),
    })),
    selectedSuggestion: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  // Calendar provider integrations
  calendarProviders: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
    // Encrypted tokens
    accessToken: v.object({
      encrypted: v.string(),
      iv: v.string(),
      tag: v.string(),
    }),
    refreshToken: v.optional(v.object({
      encrypted: v.string(),
      iv: v.string(),
      tag: v.string(),
    })),
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
      calendars: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        syncEnabled: v.boolean(),
        isPrimary: v.optional(v.boolean()),
        ctag: v.optional(v.string()), // For CalDAV sync
        syncToken: v.optional(v.string()), // Per-calendar sync token
      })),
      syncDirection: v.optional(v.union(
        v.literal("pull"), // Only pull from provider
        v.literal("push"), // Only push to provider
        v.literal("bidirectional") // Two-way sync
      )),
      conflictResolution: v.optional(v.union(
        v.literal("local"), // Local changes win
        v.literal("remote"), // Remote changes win
        v.literal("newest"), // Most recent change wins
        v.literal("manual") // Ask user
      )),
      // CalDAV-specific settings
      serverUrl: v.optional(v.string()),
      username: v.optional(v.string()),
      // Google/Microsoft-specific settings
      domain: v.optional(v.string()),
      timezone: v.optional(v.string()),
      // Microsoft Graph subscription settings
      subscriptions: v.optional(v.array(v.object({
        id: v.string(),
        resource: v.string(),
        expirationDateTime: v.string(),
        createdAt: v.number(),
      }))),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["userId", "provider"])
    .index("by_webhook", ["webhookId"]),

  // Sync queue for background processing
  syncQueue: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    operation: v.union(
      v.literal("full_sync"),
      v.literal("incremental_sync"),
      v.literal("webhook_update"),
      v.literal("webhook_renewal"),
      v.literal("event_create"),
      v.literal("event_update"),
      v.literal("event_delete")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
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
    .index("by_status", ["status", "priority"])
    .index("by_user", ["userId"])
    .index("by_provider", ["provider", "status"])
    .index("by_next_retry", ["nextRetry", "status"])
    .index("by_priority_pending", ["priority", "status"])
    .index("by_created", ["createdAt"])
    // Performance optimization indexes for sync operations
    .index("by_user_provider_status", ["userId", "provider", "status"])
    .index("by_provider_created", ["provider", "createdAt"]),

  // Event sync mapping for conflict resolution
  eventSync: defineTable({
    localEventId: v.id("events"),
    providerId: v.id("calendarProviders"),
    providerEventId: v.string(),
    provider: v.string(),
    etag: v.optional(v.string()), // For optimistic concurrency
    vectorClock: v.optional(v.any()), // For conflict resolution
    lastModifiedLocal: v.number(),
    lastModifiedRemote: v.number(),
    syncStatus: v.union(
      v.literal("synced"),
      v.literal("pending_local"),
      v.literal("pending_remote"),
      v.literal("conflict")
    ),
    conflictData: v.optional(v.object({
      localVersion: v.any(),
      remoteVersion: v.any(),
      baseVersion: v.optional(v.any()), // For three-way merge
      detectedAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["provider", "providerEventId"])
    .index("by_local_event", ["localEventId"])
    .index("by_sync_status", ["syncStatus"])
    .index("by_provider_id", ["providerId"])
    // Performance optimization indexes
    .index("by_provider_status", ["provider", "syncStatus"])
    .index("by_user_provider", ["providerId", "syncStatus"]),

  // Webhook verification tokens
  webhookTokens: defineTable({
    token: v.string(),
    provider: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_expiry", ["expiresAt"]),

  // Billing and subscription management
  subscriptions: defineTable({
    userId: v.id("users"),
    // Stripe identifiers
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeProductId: v.optional(v.string()),
    // Subscription status
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("past_due"),
      v.literal("paused"),
      v.literal("trialing"),
      v.literal("unpaid")
    ),
    // Plan details
    planName: v.string(), // "Free", "Pro", "Enterprise"
    planType: v.union(
      v.literal("free"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
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
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_status", ["status"])
    .index("by_plan", ["planType", "status"]),

  // Payment history and invoices
  payments: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    // Stripe payment details
    stripePaymentIntentId: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    // Payment information
    amount: v.number(), // Amount in cents
    currency: v.string(),
    status: v.union(
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("pending"),
      v.literal("canceled"),
      v.literal("refunded")
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
    .index("by_user", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"]),

  // AI chat persistence
  aiChats: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  aiMessages: defineTable({
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    parts: v.array(v.any()),
    createdAt: v.number(),
  })
    .index("by_chat", ["chatId"])
    .index("by_chat_created", ["chatId", "createdAt"]),

  aiEvents: defineTable({
    userId: v.optional(v.id("users")),
    chatId: v.optional(v.id("aiChats")),
    eventType: v.string(), // e.g. "rate", "copy", "regenerate", "applySuggestion"
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventType"])
    .index("by_user_event", ["userId", "eventType"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Usage analytics and limits enforcement
  usageAnalytics: defineTable({
    userId: v.id("users"),
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
    .index("by_user", ["userId"])
    .index("by_period", ["period"])
    .index("by_user_period", ["userId", "period"]),

  // Feature flags and plan permissions
  planPermissions: defineTable({
    planType: v.union(
      v.literal("free"),
      v.literal("monthly"),
      v.literal("yearly")
    ), // Changed from v.string() to match subscriptions table
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
    .index("by_plan", ["planType"])
    .index("by_popular", ["popular"]),
});