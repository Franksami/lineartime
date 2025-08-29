'use node';

import { v } from 'convex/values';
import { google } from 'googleapis';
import { api, internal } from '../_generated/api';
import { type Doc, Id } from '../_generated/dataModel';
import { action, internalAction } from '../_generated/server';
// Removed: import { decryptToken } from '../utils/encryption'; - now using inline decryption

/**
 * Create OAuth2 client with decrypted tokens (implementation)
 */
async function createOAuth2ClientImpl(
  ctx: any,
  provider: Doc<'calendarProviders'>
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );

  // Decrypt tokens using internal action
  const accessToken = await ctx.runAction(internal.calendar.encryption.decryptToken, {
    encryptedToken: provider.accessToken,
  });

  const refreshToken = provider.refreshToken
    ? await ctx.runAction(internal.calendar.encryption.decryptToken, {
        encryptedToken: provider.refreshToken,
      })
    : undefined;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: provider.expiresAt,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    console.log(
      'Google tokens refreshed:',
      tokens.access_token ? 'New access token received' : 'No new token'
    );
    if (tokens.access_token) {
      // Update encrypted tokens in database
      await ctx.runAction(internal.calendar.encryption.updateProviderTokens, {
        providerId: provider._id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date,
      });
    }
  });

  return oauth2Client;
}

/**
 * Create OAuth2 client for a provider (reusable function)
 */
export const createOAuth2Client = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
  },
  handler: async (ctx, args): Promise<InstanceType<typeof google.auth.OAuth2>> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    return await createOAuth2ClientImpl(provider);
  },
});

/**
 * Create a new event in Google Calendar (implementation)
 */
async function createEventImpl(
  provider: Doc<'calendarProviders'>,
  eventData: {
    title: string;
    description?: string;
    startTime: number;
    endTime?: number;
    allDay?: boolean;
    location?: string;
    attendees?: string[];
  }
): Promise<{
  success: boolean;
  googleEventId?: string;
  htmlLink?: string;
}> {
  const oauth2Client = await createOAuth2ClientImpl(provider);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Find the primary calendar ID
  const primaryCalendarId =
    provider.settings.calendars.find((c: { isPrimary?: boolean; id: string }) => c.isPrimary)?.id ||
    'primary';

  // Prepare Google Calendar event format
  const googleEvent = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: new Date(eventData.startTime).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(eventData.endTime || eventData.startTime + 3600000).toISOString(),
      timeZone: 'UTC',
    },
    attendees: eventData.attendees?.map((email) => ({ email })),
  };

  const response = await calendar.events.insert({
    calendarId: primaryCalendarId,
    requestBody: googleEvent,
  });

  return {
    success: true,
    googleEventId: response.data.id || undefined,
    htmlLink: response.data.htmlLink || undefined,
  };
}

/**
 * Create a new event in Google Calendar
 */
export const createEvent = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
    eventData: v.object({
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      allDay: v.optional(v.boolean()),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
    }),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    googleEventId?: string;
    htmlLink?: string;
  }> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    return await createEventImpl(provider, args.eventData);
  },
});

/**
 * Update an existing event in Google Calendar (implementation)
 */
async function updateEventImpl(
  provider: Doc<'calendarProviders'>,
  eventData: {
    googleEventId: string;
    calendarId?: string;
    title: string;
    description?: string;
    startTime: number;
    endTime?: number;
    allDay?: boolean;
    location?: string;
    attendees?: string[];
  }
): Promise<{
  success: boolean;
  googleEventId?: string;
  htmlLink?: string;
}> {
  const oauth2Client = await createOAuth2ClientImpl(provider);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const calendarId = eventData.calendarId || 'primary';

  // Prepare Google Calendar event format
  const googleEvent = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: new Date(eventData.startTime).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(eventData.endTime || eventData.startTime + 3600000).toISOString(),
      timeZone: 'UTC',
    },
    attendees: eventData.attendees?.map((email) => ({ email })),
  };

  const response = await calendar.events.update({
    calendarId: calendarId,
    eventId: eventData.googleEventId,
    requestBody: googleEvent,
  });

  return {
    success: true,
    googleEventId: response.data.id || undefined,
    htmlLink: response.data.htmlLink || undefined,
  };
}

/**
 * Update an existing event in Google Calendar
 */
export const updateEvent = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
    eventData: v.object({
      googleEventId: v.string(),
      calendarId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      allDay: v.optional(v.boolean()),
      location: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
    }),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    googleEventId?: string;
    htmlLink?: string;
  }> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    return await updateEventImpl(provider, args.eventData);
  },
});

/**
 * Delete an event from Google Calendar (implementation)
 */
async function deleteEventImpl(
  provider: Doc<'calendarProviders'>,
  eventId: string,
  calendarId?: string
): Promise<{
  success: boolean;
  deletedEventId: string;
}> {
  const oauth2Client = await createOAuth2ClientImpl(provider);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const finalCalendarId = calendarId || 'primary';

  await calendar.events.delete({
    calendarId: finalCalendarId,
    eventId: eventId,
  });

  return {
    success: true,
    deletedEventId: eventId,
  };
}

/**
 * Delete an event from Google Calendar
 */
export const deleteEvent = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
    eventId: v.string(),
    calendarId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    deletedEventId: string;
  }> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    return await deleteEventImpl(provider, args.eventId, args.calendarId);
  },
});

/**
 * Renew Google Calendar webhook channel
 */
export const renewWebhookChannel = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
    channelId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    const oauth2Client = await createOAuth2ClientImpl(ctx, provider);

    // Find the primary calendar ID
    const primaryCalendarId =
      provider.settings.calendars.find((c: { isPrimary?: boolean; id: string }) => c.isPrimary)
        ?.id || 'primary';

    // Renew the webhook channel
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const watchResponse = await calendar.events.watch({
        calendarId: primaryCalendarId,
        requestBody: {
          id: args.channelId,
          type: 'web_hook',
          address: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/webhooks/google`,
          token: process.env.GOOGLE_WEBHOOK_TOKEN,
        },
      });

      // Update webhook expiry in provider
      if (watchResponse.data.expiration) {
        await ctx.runMutation(internal.calendar.providers.updateProviderWebhookExpiry, {
          providerId: args.providerId,
          webhookId: args.channelId,
          webhookExpiry: Number.parseInt(watchResponse.data.expiration),
        });
      }

      console.log('Successfully renewed Google webhook channel:', args.channelId);
    } catch (error) {
      console.error('Failed to renew Google webhook channel:', error);
      throw error;
    }
  },
});

/**
 * Perform full sync with Google Calendar
 */
export const performFullSync = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
  },
  handler: async (ctx, args) => {
    // Get provider details
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google') {
      throw new Error('Invalid Google provider');
    }

    const oauth2Client = await createOAuth2ClientImpl(provider);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get all calendars for this user
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const allEvents = [];

    // Sync each enabled calendar
    for (const cal of calendars) {
      const isEnabled = provider.settings.calendars.find(
        (c: any) => c.id === cal.id && c.syncEnabled
      );

      if (!isEnabled) continue;

      console.log(`Syncing calendar: ${cal.summary} (${cal.id})`);

      let pageToken: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response: any = await calendar.events.list({
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
        const transformedEvents = events.map((event: any) => ({
          providerId: args.providerId,
          providerEventId: event.id!,
          calendarId: cal.id!,
          title: event.summary || 'Untitled',
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          location: event.location,
          attendees: event.attendees?.map((a: any) => a.email).filter(Boolean),
          recurrence: event.recurrence,
          etag: event.etag,
          metadata: {
            googleEventId: event.id,
            htmlLink: event.htmlLink,
            status: event.status,
            colorId: event.colorId,
            reminders: event.reminders,
          },
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
      syncToken: undefined,
    });

    // Update provider with new sync token
    await ctx.runMutation(internal.calendar.providers.updateSyncTokenInternal, {
      providerId: args.providerId,
      syncToken: syncTokenResponse.data.nextSyncToken || undefined,
    });

    // Process all events - store them in the database
    await ctx.runMutation(internal.calendar.events.syncEvents, {
      providerId: args.providerId,
      events: allEvents,
    });

    return {
      success: true,
      eventsCount: allEvents.length,
      calendarsCount: calendars.length,
    };
  },
});

/**
 * Perform incremental sync with Google Calendar
 */
export const performIncrementalSync = internalAction({
  args: {
    providerId: v.id('calendarProviders'),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    changesCount?: number;
  }> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId,
    });

    if (!provider || provider.provider !== 'google' || !provider.syncToken) {
      // Fall back to full sync if no sync token
      return await ctx.runAction(internal.calendar.google.performFullSync, {
        providerId: args.providerId,
      });
    }

    const oauth2Client = await createOAuth2ClientImpl(provider);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const changedEvents = [];
    let syncToken = provider.syncToken;

    try {
      let pageToken: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response: any = await calendar.events.list({
          calendarId: 'primary',
          syncToken: pageToken ? undefined : syncToken,
          pageToken,
          maxResults: 250,
        });

        const events = response.data.items || [];

        // Process changed events
        const transformedEvents = events.map(
          (event: {
            id?: string;
            summary?: string;
            description?: string;
            start?: { dateTime?: string; date?: string };
            end?: { dateTime?: string; date?: string };
            location?: string;
            attendees?: Array<{ email: string }>;
            recurrence?: string[];
            etag?: string;
            status?: string;
            colorId?: string;
            htmlLink?: string;
            reminders?: any;
          }) => ({
            providerId: args.providerId,
            providerEventId: event.id!,
            title: event.summary || 'Untitled',
            description: event.description,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            allDay: !event.start?.dateTime,
            location: event.location,
            attendees: event.attendees?.map((a: any) => a.email).filter(Boolean),
            recurrence: event.recurrence,
            etag: event.etag,
            status: event.status, // 'confirmed', 'tentative', 'cancelled'
            metadata: {
              googleEventId: event.id,
              htmlLink: event.htmlLink,
              colorId: event.colorId,
              reminders: event.reminders,
            },
          })
        );

        changedEvents.push(...transformedEvents);

        pageToken = response.data.nextPageToken;
        syncToken = response.data.nextSyncToken;
        hasMore = !!pageToken;
      }

      // Update sync token
      if (syncToken) {
        await ctx.runMutation(internal.calendar.providers.updateSyncTokenInternal, {
          providerId: args.providerId,
          syncToken,
        });
      }

      // Process changed events
      await ctx.runMutation(internal.calendar.events.processIncrementalChanges, {
        providerId: args.providerId,
        events: changedEvents,
      });

      console.log(`Incremental sync completed. Processed ${changedEvents.length} changes`);

      return {
        success: true,
        changesCount: changedEvents.length,
      };
    } catch (error: any) {
      if (error.code === 410) {
        // Sync token invalid, perform full sync
        console.log('Sync token invalid, performing full sync');
        return await ctx.runAction(internal.calendar.google.performFullSync, {
          providerId: args.providerId,
        });
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
  handler: async (
    ctx,
    _args
  ): Promise<{
    success: boolean;
    channelId: string;
    webhookUrl: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get provider
    const provider = await ctx.runQuery(api.calendar.providers.getProviderByType, {
      provider: 'google',
    });

    if (!provider) {
      throw new Error('Google Calendar not connected');
    }

    // This would be called from the client or server to set up the webhook
    // The actual implementation would use the Google Calendar API
    // to register a webhook for the specified calendar

    const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/google`;
    const channelId = `channel-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const _channelToken = process.env.GOOGLE_WEBHOOK_TOKEN;

    // In a real implementation, you would:
    // 1. Call Google Calendar API to register the webhook
    // 2. Store the channel ID and expiration
    // 3. Return success

    return {
      success: true,
      channelId,
      webhookUrl,
    };
  },
});
