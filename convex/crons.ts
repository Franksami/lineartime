import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Periodic sync every 30 minutes for all connected calendars
crons.interval('calendar-sync', { minutes: 30 }, internal.calendar.sync.performPeriodicSync);

// Daily webhook renewal check at 2 AM UTC
crons.daily(
  'webhook-renewal',
  { hourUTC: 2, minuteUTC: 0 },
  internal.calendar.sync.checkAndRenewWebhooks
);

// Cleanup completed sync queue items daily at 3 AM UTC
crons.daily(
  'sync-queue-cleanup',
  { hourUTC: 3, minuteUTC: 0 },
  internal.calendar.sync.cleanupCompletedSyncItems
);

export default crons;
