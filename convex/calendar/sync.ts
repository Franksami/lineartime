import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Schedule a sync operation
 */
export const scheduleSync = mutation({
  args: {
    provider: v.string(),
    operation: v.union(
      v.literal("full_sync"),
      v.literal("incremental_sync"),
      v.literal("webhook_update"),
      v.literal("event_create"),
      v.literal("event_update"),
      v.literal("event_delete")
    ),
    priority: v.number(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Add to sync queue
    const queueId = await ctx.db.insert("syncQueue", {
      userId: user._id,
      provider: args.provider,
      operation: args.operation,
      status: "pending",
      priority: args.priority,
      data: args.data,
      attempts: 0,
      createdAt: now,
    });

    // Schedule the sync processor
    await ctx.scheduler.runAfter(0, internal.calendar.sync.processSyncQueue);

    return queueId;
  },
});

/**
 * Process sync queue items
 */
export const processSyncQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get highest priority pending item
    const queueItem = await ctx.db
      .query("syncQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .first();

    if (!queueItem) {
      return;
    }

    // Mark as processing
    await ctx.db.patch(queueItem._id, {
      status: "processing",
      lastAttempt: Date.now(),
      attempts: queueItem.attempts + 1,
    });

    try {
      // Process based on operation type
      switch (queueItem.operation) {
        case "full_sync":
          await processFullSync(ctx, queueItem);
          break;
        case "incremental_sync":
          await processIncrementalSync(ctx, queueItem);
          break;
        case "webhook_update":
          await processWebhookUpdate(ctx, queueItem);
          break;
        case "event_create":
        case "event_update":
        case "event_delete":
          await processEventOperation(ctx, queueItem);
          break;
      }

      // Mark as completed
      await ctx.db.patch(queueItem._id, {
        status: "completed",
        completedAt: Date.now(),
      });
    } catch (error) {
      console.error("Sync processing error:", error);
      
      // Calculate exponential backoff
      const backoffMs = Math.min(
        1000 * Math.pow(2, queueItem.attempts),
        300000 // Max 5 minutes
      );
      
      const nextRetry = Date.now() + backoffMs;

      // Update queue item with error
      await ctx.db.patch(queueItem._id, {
        status: queueItem.attempts >= 5 ? "failed" : "pending",
        error: error instanceof Error ? error.message : "Unknown error",
        nextRetry: queueItem.attempts < 5 ? nextRetry : undefined,
      });

      // Schedule retry if not exceeded max attempts
      if (queueItem.attempts < 5) {
        await ctx.scheduler.runAt(nextRetry, internal.calendar.sync.processSyncQueue);
      }
    }

    // Process next item
    await ctx.scheduler.runAfter(100, internal.calendar.sync.processSyncQueue);
  },
});

/**
 * Process full sync for a provider
 */
async function processFullSync(
  ctx: any,
  queueItem: Doc<"syncQueue">
) {
  const provider = await ctx.db
    .query("calendarProviders")
    .withIndex("by_user", (q) => q.eq("userId", queueItem.userId))
    .filter((q) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found");
  }

  // This would call the appropriate provider-specific sync function
  // For now, we'll just update the last sync time
  await ctx.db.patch(provider._id, {
    lastSyncAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Process incremental sync
 */
async function processIncrementalSync(
  ctx: any,
  queueItem: Doc<"syncQueue">
) {
  const provider = await ctx.db
    .query("calendarProviders")
    .withIndex("by_user", (q) => q.eq("userId", queueItem.userId))
    .filter((q) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Use sync token or delta link for incremental sync
  // This would call the appropriate provider-specific sync function
  await ctx.db.patch(provider._id, {
    lastSyncAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Process webhook update
 */
async function processWebhookUpdate(
  ctx: any,
  queueItem: Doc<"syncQueue">
) {
  // Process webhook data
  const webhookData = queueItem.data;
  
  if (!webhookData) {
    throw new Error("No webhook data provided");
  }

  // This would process the webhook update
  // For now, we'll just log it
  console.log("Processing webhook update:", webhookData);
}

/**
 * Process event operations (create, update, delete)
 */
async function processEventOperation(
  ctx: any,
  queueItem: Doc<"syncQueue">
) {
  const eventData = queueItem.data;
  
  if (!eventData) {
    throw new Error("No event data provided");
  }

  // This would sync the event operation to the provider
  console.log(`Processing ${queueItem.operation}:`, eventData);
}

/**
 * Get sync queue status
 */
export const getSyncQueueStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        items: [],
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        items: [],
      };
    }

    const queueItems = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    const pending = queueItems.filter(item => item.status === "pending").length;
    const processing = queueItems.filter(item => item.status === "processing").length;
    const completed = queueItems.filter(item => item.status === "completed").length;
    const failed = queueItems.filter(item => item.status === "failed").length;

    return {
      pending,
      processing,
      completed,
      failed,
      items: queueItems,
    };
  },
});

/**
 * Clear completed sync queue items
 */
export const clearCompletedSyncItems = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const completedItems = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    for (const item of completedItems) {
      await ctx.db.delete(item._id);
    }

    return completedItems.length;
  },
});

/**
 * Perform periodic sync for all providers
 */
export const performPeriodicSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all calendar providers
    const providers = await ctx.db
      .query("calendarProviders")
      .collect();

    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);

    for (const provider of providers) {
      // Skip if synced recently
      if (provider.lastSyncAt && provider.lastSyncAt > thirtyMinutesAgo) {
        continue;
      }

      // Schedule incremental sync
      await ctx.db.insert("syncQueue", {
        userId: provider.userId,
        provider: provider.provider,
        operation: "incremental_sync",
        status: "pending",
        priority: 5, // Medium priority for periodic sync
        attempts: 0,
        createdAt: now,
      });
    }

    // Trigger processing
    if (providers.length > 0) {
      await ctx.scheduler.runAfter(0, internal.calendar.sync.processSyncQueue);
    }
  },
});

/**
 * Check and renew expiring webhooks
 */
export const checkAndRenewWebhooks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayFromNow = now + (24 * 60 * 60 * 1000);

    // Find providers with expiring webhooks
    const providers = await ctx.db
      .query("calendarProviders")
      .collect();

    for (const provider of providers) {
      if (provider.webhookExpiry && provider.webhookExpiry < oneDayFromNow) {
        // Schedule webhook renewal
        await ctx.db.insert("syncQueue", {
          userId: provider.userId,
          provider: provider.provider,
          operation: "webhook_renewal",
          status: "pending",
          priority: 10, // High priority for webhook renewal
          data: {
            providerId: provider._id,
            webhookId: provider.webhookId,
          },
          attempts: 0,
          createdAt: now,
        });
      }
    }
  },
});

/**
 * Cleanup completed sync items older than 7 days
 */
export const cleanupCompletedSyncItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    const oldCompletedItems = await ctx.db
      .query("syncQueue")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "completed"),
          q.lt(q.field("completedAt"), sevenDaysAgo)
        )
      )
      .collect();

    for (const item of oldCompletedItems) {
      await ctx.db.delete(item._id);
    }

    return oldCompletedItems.length;
  },
});

/**
 * Retry failed sync items
 */
export const retryFailedSyncItems = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const failedItems = await ctx.db
      .query("syncQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    for (const item of failedItems) {
      await ctx.db.patch(item._id, {
        status: "pending",
        attempts: 0,
        error: undefined,
        nextRetry: undefined,
      });
    }

    // Trigger processing
    if (failedItems.length > 0) {
      await ctx.scheduler.runAfter(0, internal.calendar.sync.processSyncQueue);
    }

    return failedItems.length;
  },
});