import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation, action, internalAction } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";
// Note: encryptToken import moved to dynamic import inside action

// Encryption functions moved to convex/calendar/encryption.ts

/**
 * Internal mutation to store encrypted provider tokens (called by action)
 */
export const connectProviderInternal = internalMutation({
  args: {
    clerkId: v.string(),
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
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
    settings: v.object({
      calendars: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        syncEnabled: v.boolean(),
        isPrimary: v.optional(v.boolean()),
      })),
      syncDirection: v.optional(v.union(
        v.literal("pull"),
        v.literal("push"),
        v.literal("bidirectional")
      )),
      conflictResolution: v.optional(v.union(
        v.literal("local"),
        v.literal("remote"),
        v.literal("newest"),
        v.literal("manual")
      )),
    }),
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if provider already exists
    const existingProvider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();

    if (existingProvider) {
      // Update existing provider
      await ctx.db.patch(existingProvider._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        providerAccountId: args.providerAccountId,
        settings: args.settings,
        updatedAt: now,
      });
      
      return existingProvider._id;
    } else {
      // Create new provider connection
      const providerId = await ctx.db.insert("calendarProviders", {
        userId: user._id,
        provider: args.provider,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        providerAccountId: args.providerAccountId,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
      
      return providerId;
    }
  },
});

/**
 * Connect a new calendar provider or update existing connection
 */
export const connectProvider = mutation({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
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
    settings: v.object({
      calendars: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        syncEnabled: v.boolean(),
        isPrimary: v.optional(v.boolean()),
      })),
      syncDirection: v.optional(v.union(
        v.literal("pull"),
        v.literal("push"),
        v.literal("bidirectional")
      )),
      conflictResolution: v.optional(v.union(
        v.literal("local"),
        v.literal("remote"),
        v.literal("newest"),
        v.literal("manual")
      )),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if provider already exists
    const existingProvider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();

    if (existingProvider) {
      // Update existing provider
      await ctx.db.patch(existingProvider._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        providerAccountId: args.providerAccountId,
        settings: args.settings,
        updatedAt: now,
      });
      
      return existingProvider._id;
    } else {
      // Create new provider connection
      const providerId = await ctx.db.insert("calendarProviders", {
        userId: user._id,
        provider: args.provider,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        providerAccountId: args.providerAccountId,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
      
      return providerId;
    }
  },
});

/**
 * Disconnect a calendar provider
 */
export const disconnectProvider = mutation({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
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

    const provider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .first();

    if (provider) {
      // Delete all event sync mappings for this provider
      const eventSyncs = await ctx.db
        .query("eventSync")
        .withIndex("by_provider_id", (q) => q.eq("providerId", provider._id))
        .collect();
      
      for (const sync of eventSyncs) {
        await ctx.db.delete(sync._id);
      }

      // Delete the provider connection
      await ctx.db.delete(provider._id);
    }
  },
});

/**
 * Get all connected providers for the current user
 */
export const getConnectedProviders = query({
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

    const providers = await ctx.db
      .query("calendarProviders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Don't return encrypted tokens to the client
    return providers.map(provider => ({
      _id: provider._id,
      provider: provider.provider,
      providerAccountId: provider.providerAccountId,
      lastSyncAt: provider.lastSyncAt,
      settings: provider.settings,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      hasRefreshToken: !!provider.refreshToken,
      tokenExpiresAt: provider.expiresAt,
      webhookExpiry: provider.webhookExpiry,
    }));
  },
});

/**
 * Update provider settings (calendar selection, sync direction, etc.)
 */
export const updateProviderSettings = mutation({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
    settings: v.object({
      calendars: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        syncEnabled: v.boolean(),
        isPrimary: v.optional(v.boolean()),
      })),
      syncDirection: v.optional(v.union(
        v.literal("pull"),
        v.literal("push"),
        v.literal("bidirectional")
      )),
      conflictResolution: v.optional(v.union(
        v.literal("local"),
        v.literal("remote"),
        v.literal("newest"),
        v.literal("manual")
      )),
    }),
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

    const provider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .first();

    if (!provider) {
      throw new Error("Provider not connected");
    }

    await ctx.db.patch(provider._id, {
      settings: args.settings,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Store sync token for incremental sync
 */
export const updateSyncToken = mutation({
  args: {
    provider: v.string(),
    syncToken: v.optional(v.string()),
    deltaLink: v.optional(v.string()),
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

    const provider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider as "google" | "microsoft" | "apple" | "caldav" | "notion" | "obsidian")
      )
      .first();

    if (!provider) {
      throw new Error("Provider not connected");
    }

    const updates: Partial<Doc<"calendarProviders">> = {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (args.syncToken !== undefined) {
      updates.syncToken = args.syncToken;
    }
    
    if (args.deltaLink !== undefined) {
      updates.deltaLink = args.deltaLink;
    }

    await ctx.db.patch(provider._id, updates);
  },
});

/**
 * Get provider by ID (internal use)
 */
export const getProviderById = internalQuery({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    return provider;
  },
});

/**
 * Update sync token (internal use)
 */
export const updateSyncTokenInternal = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    syncToken: v.optional(v.string()),
    deltaLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (args.syncToken !== undefined) {
      updates.syncToken = args.syncToken;
    }
    
    if (args.deltaLink !== undefined) {
      updates.deltaLink = args.deltaLink;
    }

    await ctx.db.patch(args.providerId, updates);
  },
});

/**
 * Update provider settings (internal use)
 */
export const updateProviderSettingsInternal = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      settings: args.settings,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update last sync time (internal use)
 */
export const updateLastSyncInternal = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    lastSyncAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      lastSyncAt: args.lastSyncAt || Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get provider by type for internal use
 */
export const getProviderByType = query({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const provider = await ctx.db
      .query("calendarProviders")
      .withIndex("by_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .first();

    if (!provider) {
      return null;
    }

    // Return provider without sensitive data
    return {
      _id: provider._id,
      provider: provider.provider,
      providerAccountId: provider.providerAccountId,
      lastSyncAt: provider.lastSyncAt,
      syncToken: provider.syncToken,
      deltaLink: provider.deltaLink,
      settings: provider.settings,
      webhookId: provider.webhookId,
      webhookExpiry: provider.webhookExpiry,
    };
  },
});

/**
 * Get provider by Microsoft Graph subscription ID
 */
export const getProviderBySubscriptionId = internalQuery({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    // First try to find by subscription ID in settings
    const providers = await ctx.db
      .query("calendarProviders")
      .filter((q) => q.eq(q.field("provider"), "microsoft"))
      .collect();

    for (const provider of providers) {
      if (provider.settings?.subscriptions) {
        for (const sub of provider.settings.subscriptions) {
          if (sub.id === args.subscriptionId) {
            return provider;
          }
        }
      }
    }

    return null;
  },
});

/**
 * Update Microsoft Graph subscription for a provider
 */
export const updateMicrosoftSubscription = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    subscriptionId: v.string(),
    expirationDateTime: v.string(),
    resource: v.string(),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.provider !== 'microsoft') {
      throw new Error('Invalid Microsoft provider');
    }

    const subscriptions = provider.settings?.subscriptions || [];
    const existingIndex = subscriptions.findIndex((sub: any) => sub.resource === args.resource);

    const subscription = {
      id: args.subscriptionId,
      resource: args.resource,
      expirationDateTime: args.expirationDateTime,
      createdAt: Date.now()
    };

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    await ctx.db.patch(args.providerId, {
      settings: {
        ...provider.settings,
        subscriptions
      },
      updatedAt: Date.now()
    });
  },
});

/**
 * Update provider tokens internally (called by action)
 */
export const updateProviderTokensInternal = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update provider webhook expiry
 */
export const updateProviderWebhookExpiry = internalMutation({
  args: {
    providerId: v.id("calendarProviders"),
    webhookId: v.string(),
    webhookExpiry: v.number(),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    await ctx.db.patch(args.providerId, {
      webhookId: args.webhookId,
      webhookExpiry: args.webhookExpiry,
      updatedAt: Date.now(),
    });
  },
});

// Decryption function moved to convex/calendar/encryption.ts