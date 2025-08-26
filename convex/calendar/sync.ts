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
      v.literal("webhook_renewal"),
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
        case "webhook_renewal":
          await processWebhookRenewal(ctx, queueItem);
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
    .withIndex("by_user", (q: any) => q.eq("userId", queueItem.userId))
    .filter((q: any) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Call the appropriate provider-specific sync function
  if (queueItem.provider === 'google') {
    await ctx.runAction(internal.calendar.google.performFullSync, {
      providerId: provider._id
    });
  } else if (queueItem.provider === 'microsoft') {
    await handleMicrosoftFullSync(ctx, provider);
  } else if (queueItem.provider === 'apple' || queueItem.provider === 'caldav') {
    await ctx.runAction(internal.calendar.caldav.performFullSync, {
      providerId: provider._id
    });
  } else {
    throw new Error(`Unsupported provider: ${queueItem.provider}`);
  }

  // Update last sync time
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
    .withIndex("by_user", (q: any) => q.eq("userId", queueItem.userId))
    .filter((q: any) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Call the appropriate provider-specific sync function
  if (queueItem.provider === 'google') {
    await ctx.runAction(internal.calendar.google.performIncrementalSync, {
      providerId: provider._id
    });
  } else if (queueItem.provider === 'microsoft') {
    await handleMicrosoftIncrementalSync(ctx, provider);
  } else if (queueItem.provider === 'apple' || queueItem.provider === 'caldav') {
    await ctx.runAction(internal.calendar.caldav.performIncrementalSync, {
      providerId: provider._id
    });
  } else {
    throw new Error(`Unsupported provider: ${queueItem.provider}`);
  }

  // Update last sync time
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

  // Find the provider that received this webhook
  const provider = await ctx.db
    .query("calendarProviders")
    .withIndex("by_user", (q: any) => q.eq("userId", queueItem.userId))
    .filter((q: any) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found for webhook");
  }

  // Call the appropriate provider-specific webhook handler
  if (queueItem.provider === 'google') {
    // Process Google webhook - typically triggers incremental sync
    await ctx.runAction(internal.calendar.google.performIncrementalSync, {
      providerId: provider._id
    });
  } else if (queueItem.provider === 'microsoft') {
    await handleMicrosoftWebhookUpdate(ctx, queueItem, webhookData);
  } else {
    throw new Error(`Unsupported provider for webhook: ${queueItem.provider}`);
  }

  console.log(`Successfully processed ${queueItem.provider} webhook:`, webhookData);
}

/**
 * Process webhook renewal
 */
async function processWebhookRenewal(
  ctx: any,
  queueItem: Doc<"syncQueue">
) {
  const { providerId, webhookId } = queueItem.data;

  if (!providerId || !webhookId) {
    throw new Error("Missing providerId or webhookId for renewal");
  }

  // Get provider details
  const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
    providerId
  });

  if (!provider) {
    throw new Error("Provider not found for renewal");
  }

  // Call the appropriate provider-specific renewal handler
  if (provider.provider === 'google') {
    await ctx.runAction(internal.calendar.google.renewWebhookChannel, {
      providerId,
      channelId: webhookId
    });
  } else if (provider.provider === 'microsoft') {
    await ctx.runAction(internal.calendar.microsoft.renewSubscription, {
      providerId,
      subscriptionId: webhookId
    });
  } else {
    throw new Error(`Unsupported provider for renewal: ${provider.provider}`);
  }

  console.log(`Successfully renewed ${provider.provider} webhook:`, webhookId);
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

  // Find the provider
  const provider = await ctx.db
    .query("calendarProviders")
    .withIndex("by_user", (q: any) => q.eq("userId", queueItem.userId))
    .filter((q: any) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found for event operation");
  }

  // Call the appropriate provider-specific event operation handler
  if (queueItem.provider === 'google') {
    await handleGoogleEventOperation(ctx, queueItem.operation, eventData, provider);
  } else if (queueItem.provider === 'microsoft') {
    await handleMicrosoftEventOperation(ctx, queueItem.operation, eventData, provider);
  } else if (queueItem.provider === 'apple' || queueItem.provider === 'caldav') {
    await handleCalDAVEventOperation(ctx, queueItem.operation, eventData, provider);
  } else {
    throw new Error(`Unsupported provider for event operation: ${queueItem.provider}`);
  }

  console.log(`Successfully processed ${queueItem.operation} for ${queueItem.provider}:`, eventData);
}

/**
 * Handle Google Calendar event operations
 */
async function handleGoogleEventOperation(
  ctx: any,
  operation: string,
  eventData: any,
  provider: Doc<"calendarProviders">
) {
  // Create OAuth2 client
  const oauth2Client = await ctx.runAction(internal.calendar.google.createOAuth2Client, {
    providerId: provider._id
  });

  // Call Google Calendar API based on operation
  switch (operation) {
    case 'event_create':
      // Create event in Google Calendar
      const createResponse = await ctx.runAction(internal.calendar.google.createEvent, {
        providerId: provider._id,
        eventData: eventData
      });
      console.log('Created Google event:', createResponse);
      break;

    case 'event_update':
      // Update event in Google Calendar
      const updateResponse = await ctx.runAction(internal.calendar.google.updateEvent, {
        providerId: provider._id,
        eventData: eventData
      });
      console.log('Updated Google event:', updateResponse);
      break;

    case 'event_delete':
      // Delete event from Google Calendar
      const deleteResponse = await ctx.runAction(internal.calendar.google.deleteEvent, {
        providerId: provider._id,
        eventId: eventData.eventId
      });
      console.log('Deleted Google event:', deleteResponse);
      break;

    default:
      throw new Error(`Unsupported event operation: ${operation}`);
  }
}

/**
 * Handle Microsoft full sync
 */
async function handleMicrosoftFullSync(
  ctx: any,
  provider: Doc<"calendarProviders">
) {
  // Decrypt the access token
  const accessToken = await ctx.runAction(internal.calendar.providers.decryptToken, {
    encryptedToken: provider.accessToken
  });

  // Create Microsoft Graph client
  const { Client } = await import('@microsoft/microsoft-graph-client');
  const graphClient = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Get all calendars
  const calendars = await graphClient
    .api('/me/calendars')
    .get();

  // Sync events from each calendar
  for (const calendar of calendars.value || []) {
    if (!provider.settings?.calendars?.some((c: any) => c.syncEnabled && c.id === calendar.id)) {
      continue; // Skip disabled calendars
    }

    // Get events from the last 30 days to current + 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const events = await graphClient
      .api(`/me/calendars/${calendar.id}/events`)
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $top: 1000
      })
      .get();

    // Process and store events
    for (const event of events.value || []) {
      await processMicrosoftEvent(ctx, event, provider);
    }
  }
}

/**
 * Handle Microsoft incremental sync
 */
async function handleMicrosoftIncrementalSync(
  ctx: any,
  provider: Doc<"calendarProviders">
) {
  // Decrypt the access token
  const accessToken = await ctx.runAction(internal.calendar.providers.decryptToken, {
    encryptedToken: provider.accessToken
  });

  // Create Microsoft Graph client
  const { Client } = await import('@microsoft/microsoft-graph-client');
  const graphClient = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Use delta link if available, otherwise fall back to full sync
  if (provider.deltaLink) {
    try {
      const deltaResponse = await graphClient
        .api(provider.deltaLink)
        .get();

      // Process delta changes
      for (const change of deltaResponse.value || []) {
        if (change['@removed']) {
          // Event was deleted
          const syncMapping = await ctx.db
            .query("eventSync")
            .withIndex("by_provider_event", (q: any) =>
              q.eq("providerId", provider._id).eq("providerEventId", change.id)
            )
            .first();

          if (syncMapping) {
            await ctx.db.delete(syncMapping._id);
          }
        } else {
          // Event was created or updated
          await processMicrosoftEvent(ctx, change, provider);
        }
      }

      // Store new delta link
      if (deltaResponse['@odata.deltaLink']) {
        await ctx.db.patch(provider._id, {
          deltaLink: deltaResponse['@odata.deltaLink'],
          lastSyncAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Delta sync failed, falling back to full sync:', error);
      await handleMicrosoftFullSync(ctx, provider);
    }
  } else {
    await handleMicrosoftFullSync(ctx, provider);
  }
}

/**
 * Process a single Microsoft Graph event
 */
async function processMicrosoftEvent(
  ctx: any,
  msEvent: any,
  provider: Doc<"calendarProviders">
) {
  // Check if event already exists
  const existingSync = await ctx.db
    .query("eventSync")
    .withIndex("by_provider_event", (q: any) =>
      q.eq("providerId", provider._id).eq("providerEventId", msEvent.id)
    )
    .first();

  // Convert Microsoft event to our format
  const eventData = {
    title: msEvent.subject || 'Untitled Event',
    description: msEvent.body?.content || '',
    startDate: new Date(msEvent.start.dateTime).toISOString(),
    endDate: new Date(msEvent.end.dateTime).toISOString(),
    location: msEvent.location?.displayName || '',
    category: msEvent.categories?.[0] || 'personal',
    provider: 'microsoft' as const,
    providerEventId: msEvent.id,
    lastModified: new Date(msEvent.lastModifiedDateTime).getTime()
  };

  if (existingSync) {
    // Update existing event
    await ctx.db.patch(existingSync.localEventId, eventData);
    await ctx.db.patch(existingSync._id, {
      lastSyncAt: Date.now(),
      syncStatus: 'synced'
    });
  } else {
    // Create new event
    const eventId = await ctx.db.insert("events", {
      ...eventData,
      userId: provider.userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Create sync mapping
    await ctx.db.insert("eventSync", {
      localEventId: eventId,
      providerId: provider._id,
      providerEventId: msEvent.id,
      syncStatus: 'synced',
      lastSyncAt: Date.now(),
      createdAt: Date.now()
    });
  }
}

/**
 * Handle Microsoft Graph event operations
 */
async function handleMicrosoftEventOperation(
  ctx: any,
  operation: string,
  eventData: any,
  provider: Doc<"calendarProviders">
) {
  // Decrypt the access token
  const accessToken = await ctx.runAction(internal.calendar.providers.decryptToken, {
    encryptedToken: provider.accessToken
  });

  // Create Microsoft Graph client
  const { Client } = await import('@microsoft/microsoft-graph-client');
  const graphClient = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Call Microsoft Graph API based on operation
  switch (operation) {
    case 'event_create':
      const createResponse = await graphClient
        .api('/me/events')
        .post({
          subject: eventData.title,
          body: {
            contentType: 'text',
            content: eventData.description || ''
          },
          start: {
            dateTime: eventData.startDate,
            timeZone: 'UTC'
          },
          end: {
            dateTime: eventData.endDate,
            timeZone: 'UTC'
          },
          location: eventData.location ? {
            displayName: eventData.location
          } : undefined,
          categories: eventData.category ? [eventData.category] : []
        });
      console.log('Created Microsoft event:', createResponse.id);
      break;

    case 'event_update':
      const updateResponse = await graphClient
        .api(`/me/events/${eventData.eventId}`)
        .patch({
          subject: eventData.title,
          body: {
            contentType: 'text',
            content: eventData.description || ''
          },
          start: {
            dateTime: eventData.startDate,
            timeZone: 'UTC'
          },
          end: {
            dateTime: eventData.endDate,
            timeZone: 'UTC'
          },
          location: eventData.location ? {
            displayName: eventData.location
          } : undefined,
          categories: eventData.category ? [eventData.category] : []
        });
      console.log('Updated Microsoft event:', eventData.eventId);
      break;

    case 'event_delete':
      await graphClient
        .api(`/me/events/${eventData.eventId}`)
        .delete();
      console.log('Deleted Microsoft event:', eventData.eventId);
      break;

    default:
      throw new Error(`Unsupported Microsoft event operation: ${operation}`);
  }
}

/**
 * Handle CalDAV event operations
 */
async function handleCalDAVEventOperation(
  ctx: any,
  operation: string,
  eventData: any,
  provider: Doc<"calendarProviders">
) {
  switch (operation) {
    case 'event_create':
      await ctx.runAction(internal.calendar.caldav.createEvent, {
        providerId: provider._id,
        eventData,
        calendarId: eventData.calendarId
      });
      break;
    
    case 'event_update':
      await ctx.runAction(internal.calendar.caldav.updateEvent, {
        providerId: provider._id,
        providerEventId: eventData.providerEventId,
        eventData,
        calendarId: eventData.calendarId
      });
      break;
    
    case 'event_delete':
      await ctx.runAction(internal.calendar.caldav.deleteEvent, {
        providerId: provider._id,
        providerEventId: eventData.providerEventId,
        calendarId: eventData.calendarId
      });
      break;
    
    default:
      throw new Error(`Unsupported CalDAV operation: ${operation}`);
  }
}

/**
 * Handle Microsoft webhook updates
 */
async function handleMicrosoftWebhookUpdate(
  ctx: any,
  queueItem: Doc<"syncQueue">,
  webhookData: any
) {
  // For Microsoft webhooks, we typically trigger an incremental sync
  // since the webhook indicates that data has changed
  const provider = await ctx.db
    .query("calendarProviders")
    .withIndex("by_user", (q: any) => q.eq("userId", queueItem.userId))
    .filter((q: any) => q.eq(q.field("provider"), queueItem.provider))
    .first();

  if (!provider) {
    throw new Error("Provider not found for webhook");
  }

  // Trigger incremental sync to get the latest changes
  await handleMicrosoftIncrementalSync(ctx, provider);
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