import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Create or update user from Clerk webhook
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      
      return existingUser._id;
    } else {
      // Create new user with default preferences
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkUserId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        preferences: {
          theme: "auto",
          firstDayOfWeek: 0, // Sunday
          timeFormat: "12",
          timezone: "America/New_York", // Default timezone
          defaultEventDuration: 60, // 60 minutes
          weekendDays: [0, 6], // Sunday and Saturday
          workingHours: {
            start: "09:00",
            end: "17:00",
          },
        },
        createdAt: now,
        updatedAt: now,
      });

      // Create default calendar for the user
      await ctx.db.insert("calendars", {
        userId,
        name: "Personal",
        description: "My personal calendar",
        color: "oklch(75% 0.15 320)", // Purple color
        isDefault: true,
        isShared: false,
        createdAt: now,
        updatedAt: now,
      });

      return userId;
    }
  },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      console.warn(`User with Clerk ID ${args.clerkUserId} not found for deletion`);
      return;
    }

    // Delete user's events
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete user's categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    // Delete user's calendars
    const calendars = await ctx.db
      .query("calendars")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const calendar of calendars) {
      await ctx.db.delete(calendar._id);
    }

    // Delete user's calendar providers
    const providers = await ctx.db
      .query("calendarProviders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const provider of providers) {
      await ctx.db.delete(provider._id);
    }

    // Delete user's sync queue items
    const syncItems = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const item of syncItems) {
      await ctx.db.delete(item._id);
    }

    // Delete user's AI scheduling sessions
    const aiSessions = await ctx.db
      .query("aiSchedulingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const session of aiSessions) {
      await ctx.db.delete(session._id);
    }

    // Finally, delete the user
    await ctx.db.delete(user._id);
  },
});

/**
 * Get user by Clerk ID (for authentication)
 */
export const getUserByClerkId = internalQuery({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
  },
});

