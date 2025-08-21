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
    .index("by_category", ["categoryId"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

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
    .index("by_user_default", ["userId", "isDefault"]),

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
    .index("by_next_retry", ["nextRetry", "status"]),

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
    .index("by_provider_id", ["providerId"]),

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
});