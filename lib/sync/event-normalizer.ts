import type { VectorClock } from './vector-clock';

/**
 * Normalized event interface that works across all calendar providers
 */
export interface NormalizedEvent {
  // Core identifiers
  id: string; // Local event ID
  providerId: string; // Provider ID
  providerEventId: string; // Provider's event ID
  providerType: 'google' | 'microsoft' | 'apple' | 'caldav' | 'notion' | 'obsidian' | 'local';

  // Event data
  title: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  allDay: boolean;
  timezone?: string;

  // Location
  location?: string;
  locationUrl?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Participants
  organizer?: {
    email: string;
    name?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    optional?: boolean;
  }>;

  // Recurrence
  recurrence?: {
    rule: string; // RRULE format
    exceptions?: string[]; // Exception dates
    originalStartTime?: string; // For recurring event instances
  };

  // Reminders
  reminders?: Array<{
    type: 'email' | 'notification' | 'sms';
    minutesBefore: number;
  }>;

  // Visual
  color?: string;
  transparency?: 'opaque' | 'transparent';
  visibility?: 'public' | 'private' | 'confidential';

  // Metadata
  status?: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
  etag?: string; // For optimistic concurrency
  vectorClock?: VectorClock | Record<string, number>;

  // Provider-specific metadata
  metadata: Record<string, any>;
}

/**
 * Normalize a Google Calendar event
 */
export function normalizeGoogleEvent(googleEvent: any, providerId: string): NormalizedEvent {
  const startDate = googleEvent.start?.dateTime || googleEvent.start?.date;
  const endDate = googleEvent.end?.dateTime || googleEvent.end?.date;
  const allDay = !googleEvent.start?.dateTime;

  return {
    id: '', // Will be assigned by database
    providerId,
    providerEventId: googleEvent.id,
    providerType: 'google',

    title: googleEvent.summary || 'Untitled',
    description: googleEvent.description,
    startDate: startDate,
    endDate: endDate,
    allDay,
    timezone: googleEvent.start?.timeZone,

    location: googleEvent.location,

    organizer: googleEvent.organizer
      ? {
          email: googleEvent.organizer.email,
          name: googleEvent.organizer.displayName,
        }
      : undefined,

    attendees: googleEvent.attendees?.map((a: any) => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus as any,
      optional: a.optional,
    })),

    recurrence: googleEvent.recurrence
      ? {
          rule: googleEvent.recurrence[0], // Google stores RRULE as array
          originalStartTime: googleEvent.originalStartTime,
        }
      : undefined,

    reminders:
      googleEvent.reminders?.overrides?.map((r: any) => ({
        type: r.method === 'popup' ? 'notification' : r.method,
        minutesBefore: r.minutes,
      })) ||
      (googleEvent.reminders?.useDefault
        ? [
            {
              type: 'notification',
              minutesBefore: 10,
            },
          ]
        : []),

    color: getGoogleColor(googleEvent.colorId),
    transparency: googleEvent.transparency,
    visibility: googleEvent.visibility,

    status: googleEvent.status as any,
    created: googleEvent.created,
    updated: googleEvent.updated,
    etag: googleEvent.etag,

    metadata: {
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink,
      iCalUID: googleEvent.iCalUID,
      sequence: googleEvent.sequence,
      hangoutLink: googleEvent.hangoutLink,
      conferenceData: googleEvent.conferenceData,
    },
  };
}

/**
 * Normalize a Microsoft Graph event
 */
export function normalizeMicrosoftEvent(msEvent: any, providerId: string): NormalizedEvent {
  return {
    id: '',
    providerId,
    providerEventId: msEvent.id,
    providerType: 'microsoft',

    title: msEvent.subject || 'Untitled',
    description: msEvent.bodyPreview || msEvent.body?.content,
    startDate: msEvent.start?.dateTime,
    endDate: msEvent.end?.dateTime,
    allDay: msEvent.isAllDay || false,
    timezone: msEvent.start?.timeZone || msEvent.originalStartTimeZone,

    location: msEvent.location?.displayName,
    locationUrl: msEvent.location?.locationUri,
    coordinates: msEvent.location?.coordinates
      ? {
          latitude: msEvent.location.coordinates.latitude,
          longitude: msEvent.location.coordinates.longitude,
        }
      : undefined,

    organizer: msEvent.organizer?.emailAddress
      ? {
          email: msEvent.organizer.emailAddress.address,
          name: msEvent.organizer.emailAddress.name,
        }
      : undefined,

    attendees: msEvent.attendees?.map((a: any) => ({
      email: a.emailAddress?.address,
      name: a.emailAddress?.name,
      status: mapMicrosoftResponseStatus(a.status?.response),
      optional: a.type === 'optional',
    })),

    recurrence: msEvent.recurrence
      ? {
          rule: convertMicrosoftRecurrence(msEvent.recurrence),
          originalStartTime: msEvent.originalStart,
        }
      : undefined,

    reminders: msEvent.isReminderOn
      ? [
          {
            type: 'notification',
            minutesBefore: msEvent.reminderMinutesBeforeStart,
          },
        ]
      : [],

    color: msEvent.categories?.[0], // Use first category as color
    transparency: msEvent.showAs === 'free' ? 'transparent' : 'opaque',
    visibility: msEvent.sensitivity === 'normal' ? 'public' : 'private',

    status: msEvent.isCancelled ? 'cancelled' : 'confirmed',
    created: msEvent.createdDateTime,
    updated: msEvent.lastModifiedDateTime,
    etag: msEvent['@odata.etag'],

    metadata: {
      microsoftEventId: msEvent.id,
      webLink: msEvent.webLink,
      onlineMeeting: msEvent.onlineMeeting,
      responseRequested: msEvent.responseRequested,
      importance: msEvent.importance,
      sensitivity: msEvent.sensitivity,
      showAs: msEvent.showAs,
    },
  };
}

/**
 * Normalize a CalDAV event (Apple, etc.)
 */
export function normalizeCalDAVEvent(caldavEvent: any, providerId: string): NormalizedEvent {
  // CalDAV events come as VEVENT in iCalendar format
  // This is a simplified version - you'd use a proper iCal parser
  return {
    id: '',
    providerId,
    providerEventId: caldavEvent.uid,
    providerType: 'caldav',

    title: caldavEvent.summary || 'Untitled',
    description: caldavEvent.description,
    startDate: caldavEvent.dtstart,
    endDate: caldavEvent.dtend,
    allDay: caldavEvent.dtstart?.includes('VALUE=DATE'),
    timezone: caldavEvent.tzid,

    location: caldavEvent.location,

    organizer: caldavEvent.organizer
      ? {
          email: caldavEvent.organizer.replace('mailto:', ''),
          name: caldavEvent.organizerName,
        }
      : undefined,

    attendees: caldavEvent.attendee?.map((a: any) => ({
      email: typeof a === 'string' ? a.replace('mailto:', '') : a.email,
      name: a.cn,
      status: a.partstat?.toLowerCase(),
      optional: a.role === 'OPT-PARTICIPANT',
    })),

    recurrence: caldavEvent.rrule
      ? {
          rule: caldavEvent.rrule,
          exceptions: caldavEvent.exdate,
        }
      : undefined,

    reminders: caldavEvent.valarm
      ? [
          {
            type: 'notification',
            minutesBefore: parseAlarmTrigger(caldavEvent.valarm),
          },
        ]
      : [],

    transparency: caldavEvent.transp?.toLowerCase(),
    visibility: caldavEvent.class?.toLowerCase(),

    status: caldavEvent.status?.toLowerCase() as any,
    created: caldavEvent.created,
    updated: caldavEvent.lastModified || caldavEvent.dtstamp,
    etag: caldavEvent.etag,

    metadata: {
      caldavUID: caldavEvent.uid,
      sequence: caldavEvent.sequence,
      url: caldavEvent.url,
      categories: caldavEvent.categories,
    },
  };
}

/**
 * Normalize a Notion calendar event
 */
export function normalizeNotionEvent(notionPage: any, providerId: string): NormalizedEvent {
  // Extract properties based on common Notion calendar database schemas
  const properties = notionPage.properties;

  return {
    id: '',
    providerId,
    providerEventId: notionPage.id,
    providerType: 'notion',

    title: extractNotionTitle(properties.Name || properties.Title),
    description: extractNotionText(properties.Description),
    startDate: properties.Date?.date?.start || new Date().toISOString(),
    endDate: properties.Date?.date?.end || properties.Date?.date?.start || new Date().toISOString(),
    allDay: !properties.Date?.date?.start?.includes('T'),

    location: extractNotionText(properties.Location),

    attendees: extractNotionPeople(properties.Attendees || properties.People),

    reminders: properties.Reminder
      ? [
          {
            type: 'notification',
            minutesBefore: 15, // Default, Notion doesn't specify
          },
        ]
      : [],

    color: properties.Category?.select?.color || properties.Tag?.select?.color,

    status: properties.Status?.select?.name === 'Cancelled' ? 'cancelled' : 'confirmed',
    created: notionPage.created_time,
    updated: notionPage.last_edited_time,

    metadata: {
      notionPageId: notionPage.id,
      notionUrl: notionPage.url,
      icon: notionPage.icon,
      cover: notionPage.cover,
      archived: notionPage.archived,
      properties: properties,
    },
  };
}

// Helper functions

function getGoogleColor(colorId?: string): string {
  const googleColors: Record<string, string> = {
    '1': '#7986CB', // Lavender
    '2': '#33B679', // Sage
    '3': '#8E24AA', // Grape
    '4': '#E67C73', // Flamingo
    '5': '#F6BF26', // Banana
    '6': '#F4511E', // Tangerine
    '7': '#039BE5', // Peacock
    '8': '#616161', // Graphite
    '9': '#3F51B5', // Blueberry
    '10': '#0B8043', // Basil
    '11': '#D50000', // Tomato
  };
  return colorId ? googleColors[colorId] || '#4285F4' : '#4285F4';
}

function mapMicrosoftResponseStatus(
  status?: string
): 'accepted' | 'declined' | 'tentative' | 'needsAction' {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentativelyaccepted':
      return 'tentative';
    default:
      return 'needsAction';
  }
}

function convertMicrosoftRecurrence(recurrence: any): string {
  // Convert Microsoft recurrence pattern to RRULE
  // This is a simplified version
  const pattern = recurrence.pattern;
  const range = recurrence.range;

  let rrule = 'RRULE:';

  switch (pattern.type) {
    case 'daily':
      rrule += `FREQ=DAILY;INTERVAL=${pattern.interval}`;
      break;
    case 'weekly':
      rrule += `FREQ=WEEKLY;INTERVAL=${pattern.interval}`;
      if (pattern.daysOfWeek) {
        rrule += `;BYDAY=${pattern.daysOfWeek.join(',')}`;
      }
      break;
    case 'absoluteMonthly':
      rrule += `FREQ=MONTHLY;INTERVAL=${pattern.interval};BYMONTHDAY=${pattern.dayOfMonth}`;
      break;
    case 'absoluteYearly':
      rrule += `FREQ=YEARLY;INTERVAL=${pattern.interval}`;
      break;
  }

  if (range.type === 'numbered') {
    rrule += `;COUNT=${range.numberOfOccurrences}`;
  } else if (range.type === 'endDate') {
    rrule += `;UNTIL=${range.endDate.replace(/-/g, '')}`;
  }

  return rrule;
}

function parseAlarmTrigger(valarm: any): number {
  // Parse VALARM trigger to minutes
  // Format: -PT15M (15 minutes before)
  if (typeof valarm === 'string') {
    const match = valarm.match(/PT(\d+)([HMS])/);
    if (match) {
      const value = Number.parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'H':
          return value * 60;
        case 'M':
          return value;
        case 'S':
          return Math.floor(value / 60);
      }
    }
  }
  return 15; // Default 15 minutes
}

function extractNotionTitle(property: any): string {
  if (!property) return 'Untitled';
  if (property.title) {
    return property.title.map((t: any) => t.plain_text).join('');
  }
  return 'Untitled';
}

function extractNotionText(property: any): string | undefined {
  if (!property) return undefined;
  if (property.rich_text) {
    return property.rich_text.map((t: any) => t.plain_text).join('');
  }
  return undefined;
}

function extractNotionPeople(property: any): Array<{ email: string; name?: string }> | undefined {
  if (!property?.people) return undefined;
  return property.people.map((p: any) => ({
    email: p.person?.email || p.email,
    name: p.name,
  }));
}

/**
 * Convert a normalized event back to provider format
 */
export function denormalizeEvent(
  event: NormalizedEvent,
  targetProvider: 'google' | 'microsoft' | 'caldav' | 'notion'
): any {
  switch (targetProvider) {
    case 'google':
      return {
        summary: event.title,
        description: event.description,
        start: event.allDay
          ? {
              date: event.startDate.split('T')[0],
            }
          : {
              dateTime: event.startDate,
              timeZone: event.timezone,
            },
        end: event.allDay
          ? {
              date: event.endDate.split('T')[0],
            }
          : {
              dateTime: event.endDate,
              timeZone: event.timezone,
            },
        location: event.location,
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          displayName: a.name,
          responseStatus: a.status,
          optional: a.optional,
        })),
        reminders: event.reminders
          ? {
              useDefault: false,
              overrides: event.reminders.map((r) => ({
                method: r.type === 'notification' ? 'popup' : r.type,
                minutes: r.minutesBefore,
              })),
            }
          : { useDefault: true },
      };

    // Add other provider conversions as needed
    default:
      return event;
  }
}
