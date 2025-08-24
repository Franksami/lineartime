"use node";

import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { createDAVClient } from 'tsdav';
import { decryptToken } from '../utils/encryption';
import ICAL from 'ical.js';

/**
 * Perform full sync with CalDAV server
 */
export const performFullSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    // Get provider details
    const provider = await ctx.runQuery(
      internal.calendar.providers.getProviderById,
      { providerId: args.providerId }
    );

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Decrypt credentials
    const password = decryptToken({
      encrypted: provider.accessToken.encrypted,
      iv: provider.accessToken.iv,
      tag: provider.accessToken.tag
    });

    // Create CalDAV client
    const client = new createDAVClient({
      serverUrl: provider.settings.serverUrl,
      credentials: {
        username: provider.settings.username,
        password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      await client.login();
      
      // Fetch all calendars
      const calendars = await client.fetchCalendars();
      
      // Process each calendar
      for (const calendar of calendars) {
        // Check if this calendar is enabled for sync
        const calendarConfig = provider.settings.calendars.find(
          (cal: any) => cal.id === calendar.url
        );
        
        if (!calendarConfig?.syncEnabled) {
          continue;
        }

        // Fetch events from this calendar
        const events = await client.fetchCalendarObjects({
          calendar,
        });

        const changes: any[] = [];

        for (const event of events) {
          if (!event.data) continue;

          try {
            // Parse iCalendar data
            const jcalData = ICAL.parse(event.data);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');

            for (const vevent of vevents) {
              const icalEvent = new ICAL.Event(vevent);
              
              // Convert to normalized format
              const normalizedEvent = {
                providerEventId: icalEvent.uid,
                title: icalEvent.summary || 'Untitled',
                description: icalEvent.description || undefined,
                startDate: icalEvent.startDate.toJSDate().toISOString(),
                endDate: icalEvent.endDate.toJSDate().toISOString(),
                allDay: icalEvent.startDate.isDate,
                location: icalEvent.location || undefined,
                status: mapICalStatus(icalEvent.status),
                recurrence: icalEvent.isRecurring() ? {
                  rule: vevent.getFirstPropertyValue('rrule')?.toString(),
                  exceptions: vevent.getAllProperties('exdate').map(
                    (ex: any) => ex.getFirstValue().toJSDate().toISOString()
                  ),
                } : undefined,
                reminders: extractReminders(vevent),
                attendees: extractAttendees(vevent),
                organizer: extractOrganizer(vevent),
                transparency: icalEvent.transparency,
                created: event.etag ? new Date().toISOString() : undefined,
                updated: event.etag ? new Date().toISOString() : undefined,
                etag: event.etag,
                metadata: {
                  caldavUrl: event.url,
                  caldavEtag: event.etag,
                  calendarId: calendar.url,
                  calendarName: calendar.displayName,
                }
              };

              changes.push({
                action: 'upsert' as const,
                providerEventId: normalizedEvent.providerEventId,
                eventData: normalizedEvent,
              });
            }
          } catch (parseError) {
            console.error('Error parsing CalDAV event:', parseError);
            continue;
          }
        }

        // Store the changes
        if (changes.length > 0) {
          await ctx.runMutation(internal.calendar.events.syncEvents, {
            providerId: args.providerId,
            changes,
            syncToken: calendar.syncToken || undefined,
          });
        }

        // Update calendar sync token
        await ctx.runMutation(
          internal.calendar.providers.updateProviderSettings,
          {
            providerId: args.providerId,
            settings: {
              ...provider.settings,
              calendars: provider.settings.calendars.map((cal: any) =>
                cal.id === calendar.url
                  ? { ...cal, syncToken: calendar.syncToken, ctag: calendar.ctag }
                  : cal
              ),
            },
          }
        );
      }

      // Update last sync time
      await ctx.runMutation(
        internal.calendar.providers.updateLastSync,
        {
          providerId: args.providerId,
          lastSyncAt: Date.now(),
        }
      );

      return { success: true };
    } catch (error) {
      console.error('CalDAV sync error:', error);
      throw error;
    }
  },
});

/**
 * Perform incremental sync with CalDAV server
 */
export const performIncrementalSync = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
  },
  handler: async (ctx, args) => {
    // Get provider details
    const provider = await ctx.runQuery(
      internal.calendar.providers.getProviderById,
      { providerId: args.providerId }
    );

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Decrypt credentials
    const password = decryptToken({
      encrypted: provider.accessToken.encrypted,
      iv: provider.accessToken.iv,
      tag: provider.accessToken.tag
    });

    // Create CalDAV client
    const client = new createDAVClient({
      serverUrl: provider.settings.serverUrl,
      credentials: {
        username: provider.settings.username,
        password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      await client.login();
      
      // Fetch calendars to check for changes
      const calendars = await client.fetchCalendars();
      
      for (const calendar of calendars) {
        const calendarConfig = provider.settings.calendars.find(
          (cal: any) => cal.id === calendar.url
        );
        
        if (!calendarConfig?.syncEnabled) {
          continue;
        }

        // Check if calendar has changed using ctag
        if (calendarConfig.ctag === calendar.ctag) {
          continue; // No changes in this calendar
        }

        // If sync token is available, use it for incremental sync
        if (calendarConfig.syncToken) {
          try {
            // Perform sync-collection report for changes
            const syncResults = await client.syncCollection({
              url: calendar.url,
              syncToken: calendarConfig.syncToken,
            });

            // Process the changes
            await processCalDAVSyncResults(ctx, args.providerId, syncResults, calendar);
            
            // Update sync token
            await ctx.runMutation(
              internal.calendar.providers.updateProviderSettings,
              {
                providerId: args.providerId,
                settings: {
                  ...provider.settings,
                  calendars: provider.settings.calendars.map((cal: any) =>
                    cal.id === calendar.url
                      ? { ...cal, syncToken: syncResults.syncToken, ctag: calendar.ctag }
                      : cal
                  ),
                },
              }
            );
          } catch (syncError) {
            console.error('Incremental sync failed, falling back to full sync:', syncError);
            // Fall back to full sync for this calendar
            await performFullSync(ctx, args);
            return { success: true };
          }
        } else {
          // No sync token, perform full sync
          await performFullSync(ctx, args);
          return { success: true };
        }
      }

      // Update last sync time
      await ctx.runMutation(
        internal.calendar.providers.updateLastSync,
        {
          providerId: args.providerId,
          lastSyncAt: Date.now(),
        }
      );

      return { success: true };
    } catch (error) {
      console.error('CalDAV incremental sync error:', error);
      throw error;
    }
  },
});

/**
 * Create or update an event on CalDAV server
 */
export const createOrUpdateEvent = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
    event: v.object({
      id: v.optional(v.id("events")),
      providerEventId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      allDay: v.boolean(),
      location: v.optional(v.string()),
      calendarId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(
      internal.calendar.providers.getProviderById,
      { providerId: args.providerId }
    );

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Decrypt credentials
    const password = decryptToken({
      encrypted: provider.accessToken.encrypted,
      iv: provider.accessToken.iv,
      tag: provider.accessToken.tag
    });

    // Create CalDAV client
    const client = new createDAVClient({
      serverUrl: provider.settings.serverUrl,
      credentials: {
        username: provider.settings.username,
        password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      await client.login();

      // Determine which calendar to use
      const calendarId = args.event.calendarId || 
        provider.settings.calendars.find((cal: any) => cal.isPrimary)?.id ||
        provider.settings.calendars[0]?.id;

      if (!calendarId) {
        throw new Error("No calendar available for creating event");
      }

      // Create iCalendar event
      const vcalendar = new ICAL.Component(['vcalendar', [], []]);
      vcalendar.addPropertyWithValue('version', '2.0');
      vcalendar.addPropertyWithValue('prodid', '-//LinearTime//CalDAV Client//EN');

      const vevent = new ICAL.Component('vevent');
      const uid = args.event.providerEventId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@lineartime`;
      
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', args.event.title);
      
      if (args.event.description) {
        vevent.addPropertyWithValue('description', args.event.description);
      }
      
      if (args.event.location) {
        vevent.addPropertyWithValue('location', args.event.location);
      }

      // Set dates
      const startDate = ICAL.Time.fromJSDate(new Date(args.event.startDate), !args.event.allDay);
      const endDate = ICAL.Time.fromJSDate(new Date(args.event.endDate), !args.event.allDay);
      
      if (args.event.allDay) {
        startDate.isDate = true;
        endDate.isDate = true;
      }

      vevent.addPropertyWithValue('dtstart', startDate);
      vevent.addPropertyWithValue('dtend', endDate);
      vevent.addPropertyWithValue('dtstamp', ICAL.Time.now());

      vcalendar.addSubcomponent(vevent);

      // Create or update the event
      const eventUrl = `${calendarId}${uid}.ics`;
      
      await client.createCalendarObject({
        calendar: { url: calendarId },
        filename: `${uid}.ics`,
        iCalString: vcalendar.toString(),
      });

      return { 
        success: true,
        providerEventId: uid,
        eventUrl 
      };
    } catch (error) {
      console.error('CalDAV create/update event error:', error);
      throw error;
    }
  },
});

/**
 * Delete an event from CalDAV server
 */
export const deleteEvent = internalAction({
  args: {
    providerId: v.id("calendarProviders"),
    providerEventId: v.string(),
    calendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(
      internal.calendar.providers.getProviderById,
      { providerId: args.providerId }
    );

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Decrypt credentials
    const password = decryptToken({
      encrypted: provider.accessToken.encrypted,
      iv: provider.accessToken.iv,
      tag: provider.accessToken.tag
    });

    // Create CalDAV client
    const client = new createDAVClient({
      serverUrl: provider.settings.serverUrl,
      credentials: {
        username: provider.settings.username,
        password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      await client.login();

      const calendarId = args.calendarId || 
        provider.settings.calendars.find((cal: any) => cal.isPrimary)?.id ||
        provider.settings.calendars[0]?.id;

      if (!calendarId) {
        throw new Error("No calendar available");
      }

      const eventUrl = `${calendarId}${args.providerEventId}.ics`;
      
      await client.deleteCalendarObject({
        calendarObject: { url: eventUrl, etag: '' },
      });

      return { success: true };
    } catch (error) {
      console.error('CalDAV delete event error:', error);
      throw error;
    }
  },
});

// Helper functions

function mapICalStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' | undefined {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED': return 'confirmed';
    case 'TENTATIVE': return 'tentative';
    case 'CANCELLED': return 'cancelled';
    default: return undefined;
  }
}

function extractReminders(vevent: ICAL.Component): any[] {
  const reminders: any[] = [];
  const valarms = vevent.getAllSubcomponents('valarm');
  
  for (const valarm of valarms) {
    const trigger = valarm.getFirstPropertyValue('trigger');
    if (trigger) {
      const duration = trigger as ICAL.Duration;
      const minutes = Math.abs(duration.toSeconds() / 60);
      reminders.push({
        type: 'notification',
        minutesBefore: minutes,
      });
    }
  }
  
  return reminders;
}

function extractAttendees(vevent: ICAL.Component): any[] {
  const attendees: any[] = [];
  const attendeeProps = vevent.getAllProperties('attendee');
  
  for (const prop of attendeeProps) {
    const value = prop.getFirstValue();
    const params = prop.toJSON()[1];
    
    attendees.push({
      email: value.replace('mailto:', ''),
      name: params.cn,
      status: mapAttendeeStatus(params.partstat),
      optional: params.role === 'OPT-PARTICIPANT',
    });
  }
  
  return attendees;
}

function extractOrganizer(vevent: ICAL.Component): any {
  const organizer = vevent.getFirstProperty('organizer');
  if (organizer) {
    const value = organizer.getFirstValue();
    const params = organizer.toJSON()[1];
    
    return {
      email: value.replace('mailto:', ''),
      name: params.cn,
    };
  }
  return undefined;
}

function mapAttendeeStatus(partstat?: string): 'accepted' | 'declined' | 'tentative' | 'needsAction' {
  switch (partstat?.toUpperCase()) {
    case 'ACCEPTED': return 'accepted';
    case 'DECLINED': return 'declined';
    case 'TENTATIVE': return 'tentative';
    default: return 'needsAction';
  }
}

async function processCalDAVSyncResults(
  ctx: any,
  providerId: Id<"calendarProviders">,
  syncResults: any,
  calendar: any
) {
  const changes: any[] = [];

  // Process added and modified events
  for (const item of syncResults.added || []) {
    // Fetch the full event data
    // Parse and normalize the event
    // Add to changes array with action: 'upsert'
  }

  for (const item of syncResults.modified || []) {
    // Similar to added
  }

  // Process deleted events
  for (const item of syncResults.deleted || []) {
    changes.push({
      action: 'delete' as const,
      providerEventId: item.href.split('/').pop()?.replace('.ics', ''),
    });
  }

  // Store the changes
  if (changes.length > 0) {
    await ctx.runMutation(internal.calendar.events.syncEvents, {
      providerId,
      changes,
      syncToken: syncResults.syncToken,
    });
  }
}