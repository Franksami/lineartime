import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

/**
 * Verify Google webhook notification
 */
function verifyGoogleWebhook(request: NextRequest): boolean {
  const headersList = headers();
  const channelId = headersList.get('x-goog-channel-id');
  const resourceState = headersList.get('x-goog-resource-state');
  const resourceId = headersList.get('x-goog-resource-id');
  const channelToken = headersList.get('x-goog-channel-token');
  
  // Google sends these headers with every notification
  if (!channelId || !resourceState || !resourceId) {
    console.error('Missing required Google webhook headers');
    return false;
  }

  // Verify the token matches what we stored
  // In production, you'd verify this against your stored webhook tokens
  if (channelToken !== process.env.GOOGLE_WEBHOOK_TOKEN) {
    console.error('Invalid webhook token');
    return false;
  }

  return true;
}

/**
 * POST /api/webhooks/google
 * Handle Google Calendar webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Google
    if (!verifyGoogleWebhook(request)) {
      return NextResponse.json(
        { error: 'Unauthorized webhook' },
        { status: 401 }
      );
    }

    const headersList = headers();
    const channelId = headersList.get('x-goog-channel-id');
    const resourceState = headersList.get('x-goog-resource-state');
    const resourceId = headersList.get('x-goog-resource-id');
    const resourceUri = headersList.get('x-goog-resource-uri');
    const channelExpiration = headersList.get('x-goog-channel-expiration');

    // Handle sync notification
    if (resourceState === 'sync') {
      // This is the initial sync message when webhook is set up
      console.log('Google Calendar webhook sync confirmed for channel:', channelId);
      return NextResponse.json({ status: 'sync_confirmed' });
    }

    // Handle exists notification (resource changed)
    if (resourceState === 'exists') {
      console.log('Google Calendar change detected:', {
        channelId,
        resourceId,
        resourceUri
      });

      // Parse the resource URI to get calendar ID
      // Format: https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
      const calendarIdMatch = resourceUri?.match(/calendars\/([^\/]+)\/events/);
      const calendarId = calendarIdMatch ? decodeURIComponent(calendarIdMatch[1]) : null;

      if (!calendarId) {
        console.error('Could not extract calendar ID from resource URI');
        return NextResponse.json(
          { error: 'Invalid resource URI' },
          { status: 400 }
        );
      }

      // Queue incremental sync for this calendar
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Find the provider by webhook ID
      const providers = await convex.query(api.calendar.providers.getConnectedProviders);
      const googleProvider = providers.find(p => 
        p.provider === 'google' && p.webhookId === channelId
      );

      if (!googleProvider) {
        console.error('Provider not found for webhook channel:', channelId);
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      // Schedule incremental sync
      await convex.mutation(api.calendar.sync.scheduleSync, {
        provider: 'google',
        operation: 'incremental_sync',
        priority: 9, // High priority for webhook-triggered sync
        data: {
          calendarId,
          webhookTriggered: true,
          resourceId,
          channelId
        }
      });

      console.log('Incremental sync scheduled for calendar:', calendarId);
    }

    // Handle channel expiration warning
    if (channelExpiration) {
      const expirationTime = parseInt(channelExpiration);
      const now = Date.now();
      const hoursUntilExpiry = (expirationTime - now) / (1000 * 60 * 60);
      
      if (hoursUntilExpiry < 24) {
        console.warn('Google webhook expiring soon:', {
          channelId,
          hoursUntilExpiry
        });
        
        // Schedule webhook renewal
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        await convex.mutation(api.calendar.sync.scheduleSync, {
          provider: 'google',
          operation: 'webhook_renewal',
          priority: 10,
          data: { channelId }
        });
      }
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Error processing Google webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/google
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'google-calendar-webhook',
    timestamp: new Date().toISOString()
  });
}