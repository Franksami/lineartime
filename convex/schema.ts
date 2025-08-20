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
});