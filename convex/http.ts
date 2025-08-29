import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

const http = httpRouter();

// Clerk webhook endpoint - matches the URL in Clerk dashboard
http.route({
  path: '/clerk-user-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      // Get webhook secret from environment
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('CLERK_WEBHOOK_SECRET not configured');
        return new Response('Webhook secret not configured', { status: 500 });
      }

      // Get Svix headers for signature verification
      const svix_id = request.headers.get('svix-id');
      const svix_timestamp = request.headers.get('svix-timestamp');
      const svix_signature = request.headers.get('svix-signature');

      if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('Missing Svix headers');
        return new Response('Missing svix headers', { status: 400 });
      }

      // Get the raw payload
      const payload = await request.text();

      // Verify the webhook signature
      const wh = new Webhook(webhookSecret);
      let evt;

      try {
        evt = wh.verify(payload, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });
      } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Invalid webhook signature', { status: 400 });
      }

      // Parse the event
      const eventType = (evt as any).type;
      const eventData = (evt as any).data;

      console.log(`Received Clerk webhook: ${eventType} for user ${eventData.id}`);

      // Handle different event types
      switch (eventType) {
        case 'user.created':
        case 'user.updated': {
          // Find the primary email
          const primaryEmailObj = eventData.email_addresses?.find(
            (email: any) => email.primary === true
          );
          const primaryEmail = primaryEmailObj?.email_address;

          if (!primaryEmail) {
            console.error('No primary email found for user:', eventData.id);
            return new Response('No primary email found', { status: 400 });
          }

          // Create or update user in Convex
          await ctx.runMutation(internal.clerk.upsertFromClerk, {
            clerkUserId: eventData.id,
            email: primaryEmail,
            firstName: eventData.first_name || undefined,
            lastName: eventData.last_name || undefined,
            imageUrl: eventData.image_url || undefined,
          });

          // Note: Free tier users don't need a subscription record created
          // The billing system automatically treats users without subscriptions as free tier
          if (eventType === 'user.created') {
            console.log(`New user created with free tier access: ${eventData.id}`);
          }

          console.log(`Successfully processed ${eventType} for user: ${eventData.id}`);
          break;
        }

        case 'user.deleted': {
          // Delete user and all related data
          await ctx.runMutation(internal.clerk.deleteFromClerk, {
            clerkUserId: eventData.id,
          });

          console.log(`Successfully deleted user: ${eventData.id}`);
          break;
        }

        default:
          console.log(`Unhandled webhook type: ${eventType}`);
      }

      return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing Clerk webhook:', error);
      return new Response('Webhook processing failed', { status: 500 });
    }
  }),
});

// Health check endpoint for webhook monitoring
http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async (_ctx, _request) => {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'lineartime-webhooks',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
});

export default http;
