import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Sync events from a provider
 */
export const syncEvents = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    events: v.array(v.object({
      providerId: v.id("calendarProviders"),
      providerEventId: v.string(),
      calendarId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      allDay: v.optional(v.boolean()),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
      recurrence: v.optional(v.any()),
      etag: v.optional(v.string()),
      metadata: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const now = Date.now();

    for (const eventData of args.events) {
      // Check if event already exists
      const existingSync = await ctx.db
        .query("eventSync")
        .withIndex("by_provider", (q) =>
          q.eq("provider", provider.provider).eq("providerEventId", eventData.providerEventId)
        )
        .first();

      // Parse dates
      const startDate = eventData.startTime ? new Date(eventData.startTime) : new Date();
      const endDate = eventData.endTime ? new Date(eventData.endTime) : startDate;

      if (existingSync) {
        // Update existing event
        const localEvent = await ctx.db.get(existingSync.localEventId);
        if (localEvent) {
          await ctx.db.patch(localEvent._id, {
            title: eventData.title,
            description: eventData.description,
            startTime: startDate.getTime(),
            endTime: endDate.getTime(),
            allDay: eventData.allDay,
            location: eventData.location,
            attendees: eventData.attendees,
            metadata: eventData.metadata,
            updatedAt: now,
          });

          // Update sync mapping
          await ctx.db.patch(existingSync._id, {
            etag: eventData.etag,
            lastModifiedRemote: now,
            syncStatus: "synced",
            updatedAt: now,
          });
        }
      } else {
        // Create new event
        const newEventId = await ctx.db.insert("events", {
          userId: provider.userId,
          title: eventData.title,
          description: eventData.description,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          allDay: eventData.allDay,
          color: "#4285F4", // Default Google blue
          location: eventData.location,
          attendees: eventData.attendees,
          metadata: eventData.metadata,
          createdAt: now,
          updatedAt: now,
        });

        // Create sync mapping
        await ctx.db.insert("eventSync", {
          localEventId: newEventId,
          providerId: args.providerId,
          providerEventId: eventData.providerEventId,
          provider: provider.provider,
          etag: eventData.etag,
          lastModifiedLocal: now,
          lastModifiedRemote: now,
          syncStatus: "synced",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

/**
 * Process webhook update from a provider
 */
export const processWebhookUpdate = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    eventData: v.object({
      providerEventId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.any())),
      category: v.optional(v.string()),
      lastModified: v.number(),
      provider: v.string(),
    }),
    operation: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.operation === 'deleted') {
      // Delete local event
      const existingSync = await ctx.db
        .query("eventSync")
        .withIndex("by_provider", (q) =>
          q.eq("provider", args.eventData.provider).eq("providerEventId", args.eventData.providerEventId)
        )
        .first();

      if (existingSync) {
        await ctx.db.delete(existingSync.localEventId);
        await ctx.db.delete(existingSync._id);
      }
      return;
    }

    // Convert dates
    const startDate = new Date(args.eventData.startDate);
    const endDate = new Date(args.eventData.endDate);

    // Check if event already exists
    const existingSync = await ctx.db
      .query("eventSync")
      .withIndex("by_provider", (q) =>
        q.eq("provider", args.eventData.provider).eq("providerEventId", args.eventData.providerEventId)
      )
      .first();

    if (existingSync) {
      // Update existing event
      const localEvent = await ctx.db.get(existingSync.localEventId);
      if (localEvent) {
        await ctx.db.patch(localEvent._id, {
          title: args.eventData.title,
          description: args.eventData.description,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          location: args.eventData.location,
          attendees: args.eventData.attendees?.map((a: any) => a.email || a),
          metadata: args.eventData,
          updatedAt: now,
        });

        // Update sync mapping
        await ctx.db.patch(existingSync._id, {
          lastModifiedRemote: args.eventData.lastModified,
          syncStatus: "synced",
          updatedAt: now,
        });
      }
    } else {
      // Create new event
      const newEventId = await ctx.db.insert("events", {
        userId: (await ctx.db.get(args.providerId))!.userId,
        title: args.eventData.title,
        description: args.eventData.description,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        allDay: false,
        color: args.eventData.provider === 'microsoft' ? '#0078d4' : '#4285F4',
        location: args.eventData.location,
        attendees: args.eventData.attendees?.map((a: any) => a.email || a),
        metadata: args.eventData,
        createdAt: now,
        updatedAt: now,
      });

      // Create sync mapping
      await ctx.db.insert("eventSync", {
        localEventId: newEventId,
        providerId: args.providerId,
        providerEventId: args.eventData.providerEventId,
        provider: args.eventData.provider,
        lastModifiedLocal: now,
        lastModifiedRemote: args.eventData.lastModified,
        syncStatus: "synced",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Process incremental changes from a provider
 */
export const processIncrementalChanges = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    events: v.array(v.object({
      providerId: v.id("calendarProviders"),
      providerEventId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      allDay: v.optional(v.boolean()),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
      recurrence: v.optional(v.any()),
      etag: v.optional(v.string()),
      status: v.optional(v.string()),
      metadata: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const now = Date.now();

    for (const eventData of args.events) {
      const existingSync = await ctx.db
        .query("eventSync")
        .withIndex("by_provider", (q) =>
          q.eq("provider", provider.provider).eq("providerEventId", eventData.providerEventId)
        )
        .first();

      // Handle deleted events
      if (eventData.status === 'cancelled') {
        if (existingSync) {
          // Delete local event
          await ctx.db.delete(existingSync.localEventId);
          // Delete sync mapping
          await ctx.db.delete(existingSync._id);
        }
        continue;
      }

      // Parse dates
      const startDate = eventData.startTime ? new Date(eventData.startTime) : new Date();
      const endDate = eventData.endTime ? new Date(eventData.endTime) : startDate;

      if (existingSync) {
        // Check for conflicts using etag
        if (existingSync.etag !== eventData.etag) {
          // Update local event
          const localEvent = await ctx.db.get(existingSync.localEventId);
          if (localEvent) {
            // Check if local changes exist
            if (existingSync.lastModifiedLocal > existingSync.lastModifiedRemote) {
              // Conflict detected
              await ctx.db.patch(existingSync._id, {
                syncStatus: "conflict",
                conflictData: {
                  localVersion: localEvent,
                  remoteVersion: eventData,
                  detectedAt: now,
                },
                updatedAt: now,
              });
            } else {
              // No conflict, update local
              await ctx.db.patch(localEvent._id, {
                title: eventData.title,
                description: eventData.description,
                startTime: startDate.getTime(),
                endTime: endDate.getTime(),
                allDay: eventData.allDay,
                location: eventData.location,
                attendees: eventData.attendees,
                metadata: eventData.metadata,
                updatedAt: now,
              });

              await ctx.db.patch(existingSync._id, {
                etag: eventData.etag,
                lastModifiedRemote: now,
                syncStatus: "synced",
                updatedAt: now,
              });
            }
          }
        }
      } else {
        // New event from provider
        const newEventId = await ctx.db.insert("events", {
          userId: provider.userId,
          title: eventData.title,
          description: eventData.description,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          allDay: eventData.allDay,
          color: "#4285F4",
          location: eventData.location,
          attendees: eventData.attendees,
          metadata: eventData.metadata,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.insert("eventSync", {
          localEventId: newEventId,
          providerId: args.providerId,
          providerEventId: eventData.providerEventId,
          provider: provider.provider,
          etag: eventData.etag,
          lastModifiedLocal: now,
          lastModifiedRemote: now,
          syncStatus: "synced",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

/**
 * Get events with sync status
 */
export const getEventsWithSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get sync status for each event
    const eventsWithSync = await Promise.all(
      events.map(async (event) => {
        const syncStatus = await ctx.db
          .query("eventSync")
          .withIndex("by_local_event", (q) => q.eq("localEventId", event._id))
          .first();

        return {
          ...event,
          syncStatus: syncStatus?.syncStatus || "local",
          provider: syncStatus?.provider,
          hasConflict: syncStatus?.syncStatus === "conflict",
        };
      })
    );

    return eventsWithSync;
  },
});

/**
 * Resolve sync conflict
 */
export const resolveSyncConflict = mutation({
  args: {
    eventSyncId: v.id("eventSync"),
    resolution: v.union(
      v.literal("local"), // Keep local version
      v.literal("remote"), // Use remote version
      v.literal("merge") // Merge changes
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const eventSync = await ctx.db.get(args.eventSyncId);
    if (!eventSync || eventSync.syncStatus !== "conflict") {
      throw new Error("No conflict to resolve");
    }

    const now = Date.now();

    switch (args.resolution) {
      case "local":
        // Keep local version, mark for push to remote
        await ctx.db.patch(eventSync._id, {
          syncStatus: "pending_remote",
          conflictData: undefined,
          updatedAt: now,
        });
        break;

      case "remote":
        // Use remote version
        if (eventSync.conflictData?.remoteVersion) {
          const remoteData = eventSync.conflictData.remoteVersion;
          const startDate = remoteData.startTime ? new Date(remoteData.startTime) : new Date();
          const endDate = remoteData.endTime ? new Date(remoteData.endTime) : startDate;

          await ctx.db.patch(eventSync.localEventId, {
            title: remoteData.title,
            description: remoteData.description,
            startTime: startDate.getTime(),
            endTime: endDate.getTime(),
            allDay: remoteData.allDay,
            location: remoteData.location,
            attendees: remoteData.attendees,
            metadata: remoteData.metadata,
            updatedAt: now,
          });

          await ctx.db.patch(eventSync._id, {
            syncStatus: "synced",
            conflictData: undefined,
            lastModifiedLocal: now,
            lastModifiedRemote: now,
            updatedAt: now,
          });
        }
        break;

      case "merge":
        // Merge changes (custom logic based on your requirements)
        // This is a simplified version - you might want more sophisticated merging
        const localEvent = await ctx.db.get(eventSync.localEventId);
        if (localEvent && eventSync.conflictData?.remoteVersion) {
          const remoteData = eventSync.conflictData.remoteVersion;
          
          // Example merge: keep local title, use remote times
          const startDate = remoteData.startTime ? new Date(remoteData.startTime) : new Date(localEvent.startTime);
          const endDate = remoteData.endTime ? new Date(remoteData.endTime) : new Date(localEvent.endTime || localEvent.startTime);

          await ctx.db.patch(eventSync.localEventId, {
            // Keep local title
            // Use remote times
            startTime: startDate.getTime(),
            endTime: endDate.getTime(),
            // Merge description
            description: `${localEvent.description || ''}\n\n[Remote]: ${remoteData.description || ''}`.trim(),
            updatedAt: now,
          });

          await ctx.db.patch(eventSync._id, {
            syncStatus: "pending_remote",
            conflictData: undefined,
            lastModifiedLocal: now,
            updatedAt: now,
          });
        }
        break;
    }
  },
});

/**
 * Get conflicts that need resolution
 */
export const getConflicts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const conflicts = await ctx.db
      .query("eventSync")
      .withIndex("by_sync_status", (q) => q.eq("syncStatus", "conflict"))
      .collect();

    // Get event details for each conflict
    const conflictsWithDetails = await Promise.all(
      conflicts.map(async (conflict) => {
        const localEvent = await ctx.db.get(conflict.localEventId);
        const provider = await ctx.db.get(conflict.providerId);
        
        return {
          ...conflict,
          localEvent,
          provider: provider?.provider,
        };
      })
    );

    // Filter to only user's conflicts
    return conflictsWithDetails.filter(
      (conflict) => conflict.localEvent?.userId === user._id
    );
  },
});