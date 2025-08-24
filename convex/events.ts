import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const createEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Require authentication and get user
    const { user } = await requireAuth(ctx);
    
    const eventId = await ctx.db.insert("events", {
      ...args,
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return eventId;
  },
});

export const getEvents = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication and get user
    const { user } = await requireAuth(ctx);
    
    let q = ctx.db
      .query("events")
      .withIndex("by_user_and_time", (qb) => qb.eq("userId", user._id));

    if (args.startTime !== undefined) {
      q = q.filter((fb) => fb.gte(fb.field("startTime"), args.startTime!));
    }

    const events = args.limit ? await q.take(args.limit) : await q.collect();

    // Filter by endTime if provided
    if (args.endTime) {
      return events.filter(event => event.startTime <= args.endTime!);
    }

    return events;
  },
});

export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
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
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    
    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return eventId;
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
  },
});

export const getEventsByCategory = query({
  args: {
    userId: v.id("users"),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

export const searchEvents = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    
    return events.filter(event => 
      event.title.toLowerCase().includes(searchLower) ||
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.location && event.location.toLowerCase().includes(searchLower))
    );
  },
});

// Function to create recurring events
export const createRecurringEvents = mutation({
  args: {
    userId: v.id("users"),
    baseEvent: v.object({
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      allDay: v.optional(v.boolean()),
      color: v.optional(v.string()),
      categoryId: v.optional(v.id("categories")),
      location: v.optional(v.string()),
      metadata: v.optional(v.any()),
      reminders: v.optional(v.array(v.object({
        type: v.union(v.literal("notification"), v.literal("email")),
        minutesBefore: v.number(),
      }))),
      attendees: v.optional(v.array(v.string())),
    }),
    recurrence: v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      ),
      interval: v.optional(v.number()),
      count: v.optional(v.number()),
      until: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, baseEvent, recurrence } = args;
    const events = [];
    const interval = recurrence.interval || 1;
    const maxOccurrences = recurrence.count || 100;
    const until = recurrence.until || Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year from now

    let currentStart = baseEvent.startTime;
    let currentEnd = baseEvent.endTime;
    let occurrenceCount = 0;

    while (occurrenceCount < maxOccurrences && currentStart <= until) {
      const eventId = await ctx.db.insert("events", {
        ...baseEvent,
        userId,
        startTime: currentStart,
        endTime: currentEnd,
        recurrence,
        metadata: {
          ...baseEvent.metadata,
          recurrenceIndex: occurrenceCount,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      events.push(eventId);
      occurrenceCount++;

      // Calculate next occurrence
      const currentDate = new Date(currentStart);
      switch (recurrence.frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }
      
      const timeDiff = currentEnd ? currentEnd - currentStart : 0;
      currentStart = currentDate.getTime();
      currentEnd = currentEnd ? currentStart + timeDiff : undefined;
    }

    return events;
  },
});