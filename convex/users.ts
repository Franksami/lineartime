import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with default preferences
    const userId = await ctx.db.insert("users", {
      ...args,
      preferences: {
        theme: "auto",
        firstDayOfWeek: 0, // Sunday
        timeFormat: "12",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultEventDuration: 60, // 60 minutes
        weekendDays: [0, 6], // Sunday and Saturday
        workingHours: {
          start: "09:00",
          end: "17:00",
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create default calendar for the user
    await ctx.db.insert("calendars", {
      userId,
      name: "Personal",
      description: "My personal calendar",
      color: "oklch(75% 0.15 320)",
      isDefault: true,
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return userId;
  },
});

export const updateUserPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
      firstDayOfWeek: v.optional(v.number()),
      timeFormat: v.optional(v.union(v.literal("12"), v.literal("24"))),
      timezone: v.optional(v.string()),
      defaultEventDuration: v.optional(v.number()),
      weekendDays: v.optional(v.array(v.number())),
      workingHours: v.optional(v.object({
        start: v.string(),
        end: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, preferences } = args;
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const current = user.preferences ?? {
      theme: "auto" as const,
      firstDayOfWeek: 0,
      timeFormat: "12" as const,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultEventDuration: 60,
      weekendDays: [0, 6],
      workingHours: { start: "09:00", end: "17:00" },
    };

    await ctx.db.patch(userId, {
      preferences: {
        theme: preferences.theme ?? current.theme,
        firstDayOfWeek: preferences.firstDayOfWeek ?? current.firstDayOfWeek,
        timeFormat: preferences.timeFormat ?? current.timeFormat,
        timezone: preferences.timezone ?? current.timezone,
        defaultEventDuration: preferences.defaultEventDuration ?? current.defaultEventDuration,
        weekendDays: preferences.weekendDays ?? current.weekendDays,
        workingHours: preferences.workingHours ?? current.workingHours,
      },
      updatedAt: Date.now(),
    });
    
    return userId;
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete all user's events
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete all user's categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    // Delete all user's calendars
    const calendars = await ctx.db
      .query("calendars")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const calendar of calendars) {
      await ctx.db.delete(calendar._id);
    }

    // Delete all user's calendar providers
    const providers = await ctx.db
      .query("calendarProviders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const provider of providers) {
      // Delete all event sync mappings for this provider
      const eventSyncs = await ctx.db
        .query("eventSync")
        .withIndex("by_provider_id", (q) => q.eq("providerId", provider._id))
        .collect();
      
      for (const sync of eventSyncs) {
        await ctx.db.delete(sync._id);
      }
      
      await ctx.db.delete(provider._id);
    }

    // Delete all user's sync queue items
    const syncItems = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const item of syncItems) {
      await ctx.db.delete(item._id);
    }

    // Delete the user
    await ctx.db.delete(args.userId);
  },
});