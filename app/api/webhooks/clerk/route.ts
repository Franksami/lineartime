import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
}

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await request.text();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Handle the webhook
    const { type, data } = evt;
    console.log(`Received Clerk webhook: ${type} for user ${data.id}`);

    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const primaryEmail = data.email_addresses.find(
          (email) => email.email_address
        )?.email_address;

        if (!primaryEmail) {
          console.error('No primary email found for user:', data.id);
          return NextResponse.json(
            { error: 'No primary email found' },
            { status: 400 }
          );
        }

        await fetchMutation(api.clerk.upsertFromClerk, {
          clerkUserId: data.id,
          email: primaryEmail,
          firstName: data.first_name || undefined,
          lastName: data.last_name || undefined,
          imageUrl: data.image_url || undefined,
        });

        console.log(`Successfully ${type === 'user.created' ? 'created' : 'updated'} user:`, data.id);
        break;
      }

      case 'user.deleted': {
        await fetchMutation(api.clerk.deleteFromClerk, {
          clerkUserId: data.id,
        });

        console.log('Successfully deleted user:', data.id);
        break;
      }

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

