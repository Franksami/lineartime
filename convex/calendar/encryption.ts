"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Connect a new calendar provider with plain tokens (encrypts server-side)
 * This is an action because it needs Node.js crypto for encryption
 */
export const connectProviderWithTokens = action({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("microsoft"),
      v.literal("apple"),
      v.literal("caldav"),
      v.literal("notion"),
      v.literal("obsidian")
    ),
    accessToken: v.string(), // Plain token - will be encrypted server-side
    refreshToken: v.optional(v.string()), // Plain token - will be encrypted server-side
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
  handler: async (ctx, args): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Import crypto directly in action (Node.js environment)
    const crypto = await import("crypto");
    
    // Encrypt tokens server-side using inline crypto
    const algorithm = 'aes-256-gcm';
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
    }
    const key = Buffer.from(keyHex, 'hex');

    // Encrypt access token
    const iv1 = crypto.default.randomBytes(16);
    const cipher1 = crypto.default.createCipheriv(algorithm, key, iv1);
    let encrypted1 = cipher1.update(args.accessToken, 'utf8', 'hex');
    encrypted1 += cipher1.final('hex');
    const tag1 = cipher1.getAuthTag();
    
    const encryptedAccessToken = {
      encrypted: encrypted1,
      iv: iv1.toString('hex'),
      tag: tag1.toString('hex')
    };

    // Encrypt refresh token if present
    let encryptedRefreshToken;
    if (args.refreshToken) {
      const iv2 = crypto.default.randomBytes(16);
      const cipher2 = crypto.default.createCipheriv(algorithm, key, iv2);
      let encrypted2 = cipher2.update(args.refreshToken, 'utf8', 'hex');
      encrypted2 += cipher2.final('hex');
      const tag2 = cipher2.getAuthTag();
      
      encryptedRefreshToken = {
        encrypted: encrypted2,
        iv: iv2.toString('hex'),
        tag: tag2.toString('hex')
      };
    }

    // Call internal mutation to store the encrypted tokens
    return await ctx.runMutation(internal.calendar.providers.connectProviderInternal, {
      clerkId: identity.subject,
      provider: args.provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt,
      providerAccountId: args.providerAccountId,
      settings: args.settings,
    });
  },
});

/**
 * Update provider tokens (encrypts new tokens server-side)
 * This is an action because it needs Node.js crypto for encryption
 */
export const updateProviderTokens = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    // Import crypto directly in action (Node.js environment)
    const crypto = await import("crypto");

    // Encrypt tokens server-side using inline crypto
    const algorithm = 'aes-256-gcm';
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
    }
    const key = Buffer.from(keyHex, 'hex');

    // Encrypt access token
    const iv1 = crypto.default.randomBytes(16);
    const cipher1 = crypto.default.createCipheriv(algorithm, key, iv1);
    let encrypted1 = cipher1.update(args.accessToken, 'utf8', 'hex');
    encrypted1 += cipher1.final('hex');
    const tag1 = cipher1.getAuthTag();

    const encryptedAccessToken = {
      encrypted: encrypted1,
      iv: iv1.toString('hex'),
      tag: tag1.toString('hex')
    };

    // Encrypt refresh token if present
    let encryptedRefreshToken;
    if (args.refreshToken) {
      const iv2 = crypto.default.randomBytes(16);
      const cipher2 = crypto.default.createCipheriv(algorithm, key, iv2);
      let encrypted2 = cipher2.update(args.refreshToken, 'utf8', 'hex');
      encrypted2 += cipher2.final('hex');
      const tag2 = cipher2.getAuthTag();

      encryptedRefreshToken = {
        encrypted: encrypted2,
        iv: iv2.toString('hex'),
        tag: tag2.toString('hex')
      };
    }

    // Update provider with new encrypted tokens
    await ctx.runMutation(internal.calendar.providers.updateProviderTokensInternal, {
      providerId: args.providerId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt
    });
  },
});

/**
 * Decrypt token for internal use (used by sync operations)
 * This is an action because it needs Node.js crypto for decryption
 */
export const decryptToken = internalAction({
  args: {
    encryptedToken: v.object({
      encrypted: v.string(),
      iv: v.string(),
      tag: v.string(),
    }),
  },
  handler: async (ctx: any, args: any): Promise<string> => {
    // Import crypto directly in action (Node.js environment)
    const crypto = await import("crypto");

    // Decrypt token using inline crypto
    const algorithm = 'aes-256-gcm';
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
    }
    const key = Buffer.from(keyHex, 'hex');

    const decipher = crypto.default.createDecipheriv(
      algorithm,
      key,
      Buffer.from(args.encryptedToken.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(args.encryptedToken.tag, 'hex'));

    let decrypted = decipher.update(args.encryptedToken.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },
});
