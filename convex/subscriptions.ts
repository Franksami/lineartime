/**
 * Real-time Subscriptions for Convex
 * These queries provide real-time updates when used with useQuery hook
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Subscribe to all events for a user within a time range
 * Updates in real-time when events are added, modified, or deleted
 */
export const subscribeToEvents = query({
  args: {
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    includeRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_and_time", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), args.startTime),
          q.lte(q.field("startTime"), args.endTime)
        )
      )
      .collect();

    // Optionally include recurring events that might span into this range
    if (args.includeRecurring) {
      const recurringEvents = events.filter(event => event.recurrence !== undefined);
      // Process recurring events to generate occurrences within the range
      // This is simplified - in production, you'd expand recurring events properly
    }

    return events;
  },
});

/**
 * Subscribe to a specific event by ID
 * Updates when the event is modified or deleted
 */
export const subscribeToEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    
    if (!event) {
      return null;
    }

    // Include related data for complete event information
    const category = event.categoryId 
      ? await ctx.db.get(event.categoryId)
      : null;

    return {
      ...event,
      category,
    };
  },
});

/**
 * Subscribe to calendar sync status updates
 * Useful for showing sync progress in the UI
 */
export const subscribeToSyncStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all sync queue items for the user
    const syncQueue = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();

    // Get provider status
    const providers = await ctx.db
      .query("calendarProviders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const providerStatus = await Promise.all(
      providers.map(async (provider) => {
        const lastSync = provider.lastSyncAt 
          ? new Date(provider.lastSyncAt).toISOString()
          : null;
        
        const pendingOperations = syncQueue.filter(
          item => item.provider === provider.provider
        ).length;

        return {
          provider: provider.provider,
          isConnected: true,
          lastSync,
          pendingOperations,
          syncEnabled: provider.settings.syncDirection !== undefined,
        };
      })
    );

    return {
      providers: providerStatus,
      syncQueue: syncQueue.slice(0, 10), // Return latest 10 items
      totalPending: syncQueue.filter(q => q.status === "pending").length,
      totalProcessing: syncQueue.filter(q => q.status === "processing").length,
    };
  },
});

/**
 * Subscribe to conflict resolution updates
 * Notifies when there are sync conflicts that need user attention
 */
export const subscribeToConflicts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user's providers
    const providers = await ctx.db
      .query("calendarProviders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const providerIds = providers.map(p => p._id);

    // Get all conflicts for user's events
    const conflicts = await ctx.db
      .query("eventSync")
      .withIndex("by_sync_status", (q) => q.eq("syncStatus", "conflict"))
      .filter((q) => 
        providerIds.some(id => q.eq(q.field("providerId"), id))
      )
      .collect();

    // Enrich conflict data with event details
    const enrichedConflicts = await Promise.all(
      conflicts.map(async (conflict) => {
        const localEvent = await ctx.db.get(conflict.localEventId);
        return {
          ...conflict,
          localEvent,
          provider: providers.find(p => p._id === conflict.providerId)?.provider,
        };
      })
    );

    return {
      conflicts: enrichedConflicts,
      totalConflicts: enrichedConflicts.length,
      hasConflicts: enrichedConflicts.length > 0,
    };
  },
});

/**
 * Subscribe to user preferences changes
 * Updates when user settings are modified
 */
export const subscribeToUserPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    return {
      preferences: user.preferences || {
        theme: "auto",
        firstDayOfWeek: 0,
        timeFormat: "12",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultEventDuration: 60,
        weekendDays: [0, 6],
        workingHours: {
          start: "09:00",
          end: "17:00",
        },
      },
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  },
});

/**
 * Subscribe to category updates for a user
 * Updates when categories are added, modified, or deleted
 */
export const subscribeToCategories = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Include event counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const eventCount = (
          await ctx.db
            .query("events")
            .withIndex("by_category", (q) => q.eq("categoryId", category._id))
            .collect()
        ).length;

        return {
          ...category,
          eventCount,
        };
      })
    );

    return categoriesWithCounts;
  },
});

/**
 * Subscribe to calendar updates
 * Updates when calendars are added, modified, or deleted
 */
export const subscribeToCalendars = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const calendars = await ctx.db
      .query("calendars")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Include event counts and sync status for each calendar
    const enrichedCalendars = await Promise.all(
      calendars.map(async (calendar) => {
        // This is simplified - in production, you'd count events per calendar
        const isSyncing = calendar.syncSettings?.syncEnabled || false;
        const lastSync = calendar.syncSettings?.lastSync 
          ? new Date(calendar.syncSettings.lastSync).toISOString()
          : null;

        return {
          ...calendar,
          isSyncing,
          lastSync,
        };
      })
    );

    return enrichedCalendars;
  },
});

/**
 * Subscribe to recent activity for a user
 * Shows recently modified events and sync activities
 */
export const subscribeToRecentActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get recently updated events
    const recentEvents = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get recent sync activities
    const recentSync = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Combine and sort by timestamp
    const activities = [
      ...recentEvents.map(event => ({
        type: "event" as const,
        timestamp: event.updatedAt,
        data: event,
      })),
      ...recentSync.map(sync => ({
        type: "sync" as const,
        timestamp: sync.createdAt,
        data: sync,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return activities;
  },
});

/**
 * Subscribe to upcoming events with reminders
 * Useful for notification systems
 */
export const subscribeToUpcomingReminders = query({
  args: {
    userId: v.id("users"),
    windowMinutes: v.optional(v.number()), // How far ahead to look for reminders
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const window = (args.windowMinutes || 60) * 60 * 1000; // Default 1 hour window
    const endTime = now + window;

    // Get events that have reminders and are coming up
    const upcomingEvents = await ctx.db
      .query("events")
      .withIndex("by_user_and_time", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), now),
          q.lte(q.field("startTime"), endTime)
        )
      )
      .collect();

    // Filter events with reminders and calculate when they should fire
    const eventsWithReminders = upcomingEvents
      .filter(event => event.reminders && event.reminders.length > 0)
      .flatMap(event => {
        return event.reminders!.map(reminder => {
          const reminderTime = event.startTime - (reminder.minutesBefore * 60 * 1000);
          return {
            eventId: event._id,
            eventTitle: event.title,
            eventStartTime: event.startTime,
            reminderType: reminder.type,
            reminderTime,
            minutesBefore: reminder.minutesBefore,
            shouldFireNow: reminderTime <= now && reminderTime > now - 60000, // Within last minute
          };
        });
      })
      .filter(reminder => reminder.reminderTime <= endTime)
      .sort((a, b) => a.reminderTime - b.reminderTime);

    return {
      reminders: eventsWithReminders,
      nextReminder: eventsWithReminders[0] || null,
      totalUpcoming: eventsWithReminders.length,
    };
  },
});

/**
 * Subscribe to shared calendar updates
 * For calendars that are shared with other users
 */
export const subscribeToSharedCalendars = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get calendars shared with the user
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const sharedCalendars = await ctx.db
      .query("calendars")
      .filter((q) => 
        q.and(
          q.eq(q.field("isShared"), true),
          q.neq(q.field("userId"), args.userId)
        )
      )
      .collect();

    // Filter calendars that are actually shared with this user
    const accessibleCalendars = sharedCalendars.filter(calendar => {
      const shareSettings = calendar.shareSettings;
      if (!shareSettings) return false;
      
      // Check if user email is in the sharedWith array
      return shareSettings.sharedWith?.includes(user.email) || false;
    });

    // Enrich with owner information
    const enrichedCalendars = await Promise.all(
      accessibleCalendars.map(async (calendar) => {
        const owner = await ctx.db.get(calendar.userId);
        return {
          ...calendar,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown",
          ownerEmail: owner?.email,
          permissions: calendar.shareSettings?.permissions || "view",
        };
      })
    );

    return enrichedCalendars;
  },
});