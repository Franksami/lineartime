"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Renew Microsoft Graph subscription
 */
export const renewSubscription = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
    subscriptionId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'microsoft') {
      throw new Error('Invalid Microsoft provider');
    }

    // Decrypt access token
    const accessToken = await ctx.runAction(internal.calendar.encryption.decryptToken, {
      encryptedToken: provider.accessToken
    });

    const { Client } = await import('@microsoft/microsoft-graph-client');
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    try {
      // Renew the subscription by updating it
      const renewedSubscription = await graphClient.api(`/subscriptions/${args.subscriptionId}`).patch({
        expirationDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

      // Update subscription in provider settings
      if (renewedSubscription.expirationDateTime) {
        await ctx.runMutation(internal.calendar.providers.updateMicrosoftSubscription, {
          providerId: args.providerId,
          subscriptionId: args.subscriptionId,
          expirationDateTime: renewedSubscription.expirationDateTime,
          resource: '/me/events' // Assuming calendar events resource
        });
      }

      console.log('Successfully renewed Microsoft subscription:', args.subscriptionId);
    } catch (error) {
      console.error('Failed to renew Microsoft subscription:', error);
      throw error;
    }
  }
});

/**
 * Perform full sync with Microsoft Graph
 */
export const performFullSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'microsoft') {
      throw new Error('Invalid Microsoft provider');
    }

    // Decrypt access token
    const accessToken = await ctx.runAction(internal.calendar.encryption.decryptToken, {
      encryptedToken: provider.accessToken
    });

    const { Client } = await import('@microsoft/microsoft-graph-client');
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    try {
      // Fetch all events from Microsoft Graph
      let allEvents: any[] = [];
      let nextLink = '/me/events?$select=id,subject,body,start,end,location,attendees,categories,lastModifiedDateTime&$top=100';
      
      while (nextLink) {
        const response = await graphClient.api(nextLink).get();
        allEvents = allEvents.concat(response.value || []);
        nextLink = response['@odata.nextLink'];
      }

      // Convert events to our format
      const changes = allEvents.map(event => ({
        action: 'upsert' as const,
        providerEventId: event.id,
        eventData: {
          providerId: args.providerId,
          providerEventId: event.id,
          title: event.subject || 'Untitled Event',
          description: event.body?.content || '',
          startTime: new Date(event.start.dateTime).toISOString(),
          endTime: new Date(event.end.dateTime).toISOString(),
          allDay: event.isAllDay || false,
          location: event.location?.displayName || '',
          attendees: event.attendees?.map((attendee: any) => attendee.emailAddress.address) || [],
          category: event.categories?.[0] || 'personal',
          etag: event['@odata.etag'],
          status: 'confirmed',
          metadata: {
            lastModified: new Date(event.lastModifiedDateTime).getTime(),
            provider: 'microsoft'
          }
        }
      }));

      // Store the events
      if (changes.length > 0) {
        await ctx.runMutation(internal.calendar.events.syncEvents, {
          events: changes,
          providerId: args.providerId
        });
      }

      // Update last sync time
      await ctx.runMutation(internal.calendar.providers.updateLastSyncInternal, {
        providerId: args.providerId,
        lastSyncAt: Date.now()
      });

      return { success: true, eventCount: changes.length };
    } catch (error) {
      console.error('Microsoft full sync error:', error);
      throw error;
    }
  }
});

/**
 * Perform incremental sync with Microsoft Graph
 */
export const performIncrementalSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'microsoft') {
      throw new Error('Invalid Microsoft provider');
    }

    // Decrypt access token
    const accessToken = await ctx.runAction(internal.calendar.encryption.decryptToken, {
      encryptedToken: provider.accessToken
    });

    const { Client } = await import('@microsoft/microsoft-graph-client');
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    try {
      // Use delta link if available for incremental sync
      const deltaLink = provider.settings?.deltaLink;
      const apiUrl = deltaLink || '/me/events/delta?$select=id,subject,body,start,end,location,attendees,categories,lastModifiedDateTime';
      
      const response = await graphClient.api(apiUrl).get();
      const events = response.value || [];
      const newDeltaLink = response['@odata.deltaLink'];

      // Process changes
      const changes = events.map((event: any) => {
        if (event['@removed']) {
          return {
            action: 'delete' as const,
            providerEventId: event.id
          };
        } else {
          return {
            action: 'upsert' as const,
            providerEventId: event.id,
            eventData: {
              providerId: args.providerId,
              providerEventId: event.id,
              title: event.subject || 'Untitled Event',
              description: event.body?.content || '',
              startTime: new Date(event.start.dateTime).toISOString(),
              endTime: new Date(event.end.dateTime).toISOString(),
              allDay: event.isAllDay || false,
              location: event.location?.displayName || '',
              attendees: event.attendees?.map((attendee: any) => attendee.emailAddress.address) || [],
              category: event.categories?.[0] || 'personal',
              etag: event['@odata.etag'],
              status: 'confirmed',
              metadata: {
                lastModified: new Date(event.lastModifiedDateTime).getTime(),
                provider: 'microsoft'
              }
            }
          };
        }
      });

      // Store the changes
      if (changes.length > 0) {
        await ctx.runMutation(internal.calendar.events.syncEvents, {
          events: changes,
          providerId: args.providerId
        });
      }

      // Update provider with new delta link and sync time
      await ctx.runMutation(internal.calendar.providers.updateProviderSettingsInternal, {
        providerId: args.providerId,
        settings: {
          ...provider.settings,
          deltaLink: newDeltaLink
        }
      });

      await ctx.runMutation(internal.calendar.providers.updateLastSyncInternal, {
        providerId: args.providerId,
        lastSyncAt: Date.now()
      });

      return { success: true, changeCount: changes.length };
    } catch (error) {
      console.error('Microsoft incremental sync error:', error);
      throw error;
    }
  }
});

/**
 * Process Microsoft webhook notification
 */
export const processWebhookNotification = action({
  args: {
    notification: v.any(),
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args): Promise<void> => {
    const provider = await ctx.runQuery(internal.calendar.providers.getProviderById, {
      providerId: args.providerId
    });

    if (!provider || provider.provider !== 'microsoft') {
      throw new Error('Invalid Microsoft provider');
    }

    // Decrypt access token
    const accessToken = await ctx.runAction(internal.calendar.encryption.decryptToken, {
      encryptedToken: provider.accessToken
    });

    const { Client } = await import('@microsoft/microsoft-graph-client');
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Extract event ID from notification resource URL
    const resourceUrl = args.notification.resource;
    const eventIdMatch = resourceUrl.match(/events\/([^\/]+)/);
    if (!eventIdMatch) {
      console.warn('Could not extract event ID from resource URL:', resourceUrl);
      return;
    }

    const eventId = eventIdMatch[1];

    try {
      // Get the updated event from Microsoft Graph
      const event = await graphClient
        .api(`/me/events/${eventId}`)
        .select('id,subject,body,start,end,location,attendees,categories,lastModifiedDateTime')
        .get();

      if (!event) {
        console.warn('Event not found in Microsoft Graph:', eventId);
        return;
      }

      // Convert Microsoft event to our format and process
      const convertedEvent = {
        providerEventId: event.id,
        title: event.subject || 'Untitled Event',
        description: event.body?.content || '',
        startDate: new Date(event.start.dateTime).toISOString(),
        endDate: new Date(event.end.dateTime).toISOString(),
        location: event.location?.displayName || '',
        attendees: event.attendees?.map((attendee: any) => ({
          email: attendee.emailAddress.address,
          name: attendee.emailAddress.name,
          status: attendee.status.response
        })) || [],
        category: event.categories?.[0] || 'personal',
        lastModified: new Date(event.lastModifiedDateTime).getTime(),
        provider: 'microsoft'
      };

      // Process the webhook update
      await ctx.runMutation(internal.calendar.events.processWebhookUpdate, {
        providerId: args.providerId,
        eventData: convertedEvent,
        operation: args.notification.changeType?.toLowerCase() || 'updated'
      });

      console.log('Successfully processed Microsoft webhook notification for event:', eventId);
    } catch (error) {
      console.error('Error processing Microsoft webhook notification:', error);
      throw error;
    }
  }
});
