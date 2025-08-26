import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
// TODO: Move webhook processing to Convex action for server-side token decryption
// import { decryptToken } from '@/lib/encryption';
import crypto from 'crypto';

/**
 * POST /api/webhooks/microsoft
 * Handles Microsoft Graph webhooks for calendar changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-ms-notification-signature');

    // Validate webhook signature if configured
    if (process.env.MICROSOFT_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.MICROSOFT_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);

    // Handle validation request from Microsoft
    if (request.method === 'GET' || data?.validationToken) {
      const validationToken = request.url.searchParams.get('validationToken');
      if (validationToken) {
        return new NextResponse(validationToken, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    if (!data?.value || !Array.isArray(data.value)) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Process each notification
    for (const notification of data.value) {
      try {
        if (notification.lifecycleEvent === 'subscriptionRemoved') {
          console.log('Microsoft subscription removed:', notification.subscriptionId);
          // Handle subscription removal - could renew or notify user
          continue;
        }

        if (!notification.resource || !notification.clientState) {
          console.warn('Missing resource or clientState in notification');
          continue;
        }

        // Find the provider by subscription ID or client state
        const provider = await convex.query(api.calendar.providers.getProviderBySubscriptionId, {
          subscriptionId: notification.subscriptionId || notification.clientState
        });

        if (!provider) {
          console.warn('Provider not found for subscription:', notification.subscriptionId);
          continue;
        }

        // Process Microsoft webhook notification using Convex action
        await convex.action(api.calendar.microsoft.processWebhookNotification, {
          notification,
          providerId: provider._id
        });

        // Schedule sync operation for real-time processing
        await convex.mutation(api.calendar.sync.scheduleSync, {
          provider: 'microsoft',
          operation: 'webhook_update',
          priority: 9, // High priority for real-time updates
          data: {
            providerId: provider._id,
            notification,
            changeType: notification.changeType,
            resource: notification.resource
          }
        });

        console.log('Successfully processed Microsoft webhook notification:', notification.subscriptionId);

      } catch (error) {
        console.error('Error processing Microsoft notification:', error);
        // Continue processing other notifications
      }
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Error handling Microsoft webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/microsoft
 * Handles Microsoft Graph webhook validation
 */
export async function GET(request: NextRequest) {
  const validationToken = request.url.searchParams.get('validationToken');

  if (validationToken) {
    console.log('Microsoft webhook validation requested');
    return new NextResponse(validationToken, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  return NextResponse.json({ error: 'Validation token required' }, { status: 400 });
}
