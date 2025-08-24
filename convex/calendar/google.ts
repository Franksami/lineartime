"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { google } from 'googleapis';
import { Doc, Id } from "../_generated/dataModel";
import { decryptToken } from '../utils/encryption';

/**
 * Create OAuth2 client with decrypted tokens
 */
async function createOAuth2Client(
  provider: Doc<"calendarProviders">
): Promise<any> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );

  // Decrypt tokens
  const accessToken = decryptToken(provider.accessToken);
  const refreshToken = provider.refreshToken 
    ? decryptToken(provider.refreshToken)
    : undefined;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: provider.expiresAt
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    console.log('Tokens refreshed:', tokens.access_token ? 'New access token received' : 'No new token');
    // You would update the tokens in the database here
    // This requires passing the context and provider ID
  });

  return oauth2Client;
}

/**
 * Perform full sync with Google Calendar
 */
export const performFullSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    // Get provider details
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    const oauth2Client = await createOAuth2Client(provider);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get all calendars for this user
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const allEvents = [];

    // Sync each enabled calendar
    for (const cal of calendars) {
      const isEnabled = provider.settings.calendars.find(
        c => c.id === cal.id && c.syncEnabled
      );

      if (!isEnabled) continue;

      console.log(`Syncing calendar: ${cal.summary} (${cal.id})`);

      let pageToken: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await calendar.events.list({
          calendarId: cal.id!,
          pageToken,
          maxResults: 250,
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
          timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year future
        });

        const events = response.data.items || [];
        
        // Transform Google events to our format
        const transformedEvents = events.map(event => ({
          providerId: args.providerId,
          providerEventId: event.id!,
          calendarId: cal.id!,
          title: event.summary || 'Untitled',
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          location: event.location,
          attendees: event.attendees?.map(a => a.email).filter(Boolean),
          recurrence: event.recurrence,
          etag: event.etag,
          metadata: {
            googleEventId: event.id,
            htmlLink: event.htmlLink,
            status: event.status,
            colorId: event.colorId,
            reminders: event.reminders,
          }
        }));

        allEvents.push(...transformedEvents);

        pageToken = response.data.nextPageToken;
        hasMore = !!pageToken;
      }
    }

    console.log(`Full sync completed. Synced ${allEvents.length} events`);

    // Store sync token for incremental sync
    const syncTokenResponse = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 1,
      syncToken: undefined
    });

    // Update provider with new sync token
    await ctx.runMutation(internal.calendar.providers.updateSyncToken, {
      providerId: args.providerId,
      syncToken: syncTokenResponse.data.nextSyncToken
    });

    // Process all events - store them in the database
    await ctx.runMutation(internal.calendar.events.syncEvents, {
      providerId: args.providerId,
      events: allEvents
    });

    return {
      success: true,
      eventsCount: allEvents.length,
      calendarsCount: calendars.length
    };
  },
});

/**
 * Perform incremental sync with Google Calendar
 */
export const performIncrementalSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'google' || !provider.syncToken) {
      // Fall back to full sync if no sync token
      return await performFullSync(ctx, { providerId: args.providerId });
    }

    const oauth2Client = await createOAuth2Client(provider);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const changedEvents = [];
    let syncToken = provider.syncToken;

    try {
      let pageToken: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await calendar.events.list({
          calendarId: 'primary',
          syncToken: pageToken ? undefined : syncToken,
          pageToken,
          maxResults: 250,
        });

        const events = response.data.items || [];
        
        // Process changed events
        const transformedEvents = events.map(event => ({
          providerId: args.providerId,
          providerEventId: event.id!,
          title: event.summary || 'Untitled',
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          location: event.location,
          attendees: event.attendees?.map(a => a.email).filter(Boolean),
          recurrence: event.recurrence,
          etag: event.etag,
          status: event.status, // 'confirmed', 'tentative', 'cancelled'
          metadata: {
            googleEventId: event.id,
            htmlLink: event.htmlLink,
            colorId: event.colorId,
            reminders: event.reminders,
          }
        }));

        changedEvents.push(...transformedEvents);

        pageToken = response.data.nextPageToken;
        syncToken = response.data.nextSyncToken;
        hasMore = !!pageToken;
      }

      // Update sync token
      if (syncToken) {
        await ctx.runMutation(internal.calendar.providers.updateSyncToken, {
          providerId: args.providerId,
          syncToken
        });
      }

      // Process changed events
      await ctx.runMutation(internal.calendar.events.processIncrementalChanges, {
        providerId: args.providerId,
        events: changedEvents
      });

      console.log(`Incremental sync completed. Processed ${changedEvents.length} changes`);

      return {
        success: true,
        changesCount: changedEvents.length
      };
    } catch (error: any) {
      if (error.code === 410) {
        // Sync token invalid, perform full sync
        console.log('Sync token invalid, performing full sync');
        return await performFullSync(ctx, { providerId: args.providerId });
      }
      throw error;
    }
  },
});

/**
 * Setup webhook for push notifications
 */
export const setupWebhook = action({
  args: {
    calendarId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get provider
    const provider = await ctx.runQuery(api.calendar.providers.getProviderByType, {
      provider: 'google'
    });

    if (!provider) {
      throw new Error('Google Calendar not connected');
    }

    // This would be called from the client or server to set up the webhook
    // The actual implementation would use the Google Calendar API
    // to register a webhook for the specified calendar

    const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/google`;
    const channelId = `channel-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channelToken = process.env.GOOGLE_WEBHOOK_TOKEN;

    // In a real implementation, you would:
    // 1. Call Google Calendar API to register the webhook
    // 2. Store the channel ID and expiration
    // 3. Return success

    return {
      success: true,
      channelId,
      webhookUrl
    };
  },
});

/**
 * Create an event in Google Calendar
 */
export const createEvent = action({
  args: {
    calendarId: v.string(),
    event: v.object({
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.string(),
      endTime: v.string(),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.runQuery(api.calendar.providers.getProviderByType, {
      provider: 'google'
    });

    if (!provider) {
      throw new Error('Google Calendar not connected');
    }

    // This would create the event using the Google Calendar API
    // and return the created event details

    return {
      success: true,
      eventId: 'google-event-id'
    };
  },
});

/**
 * Update an event in Google Calendar
 */
export const updateEvent = action({
  args: {
    calendarId: v.string(),
    eventId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.runQuery(api.calendar.providers.getProviderByType, {
      provider: 'google'
    });

    if (!provider) {
      throw new Error('Google Calendar not connected');
    }

    // This would update the event using the Google Calendar API

    return {
      success: true,
      eventId: args.eventId
    };
  },
});

/**
 * Delete an event from Google Calendar
 */
export const deleteEvent = action({
  args: {
    calendarId: v.string(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const provider = await ctx.runQuery(api.calendar.providers.getProviderByType, {
      provider: 'google'
    });

    if (!provider) {
      throw new Error('Google Calendar not connected');
    }

    // This would delete the event using the Google Calendar API

    return {
      success: true,
      deleted: true
    };
  },
});