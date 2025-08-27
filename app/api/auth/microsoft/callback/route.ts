import { api } from '@/convex/_generated/api';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { currentUser } from '@clerk/nextjs/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConvexHttpClient } from 'convex/browser';
import { type NextRequest, NextResponse } from 'next/server';
// Removed: import { encryptToken } from '@/lib/encryption'; - now handled server-side

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
};

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`;

/**
 * GET /api/auth/microsoft/callback
 * Handles the OAuth callback from Microsoft
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(`/settings/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect('/settings/integrations?error=missing_parameters');
    }

    // Verify state token
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());

      // Check timestamp to prevent replay attacks (5 minute expiry)
      if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
        return NextResponse.redirect('/settings/integrations?error=state_expired');
      }
    } catch {
      return NextResponse.redirect('/settings/integrations?error=invalid_state');
    }

    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect('/settings/integrations?error=unauthorized');
    }

    // Create MSAL application
    const cca = new ConfidentialClientApplication(msalConfig);

    // Exchange code for tokens
    const tokenRequest = {
      code,
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/calendars.readwrite',
        'https://graph.microsoft.com/calendars.readwrite.shared',
        'https://graph.microsoft.com/user.read',
      ],
      redirectUri: REDIRECT_URI,
    };

    const response = await cca.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      return NextResponse.redirect('/settings/integrations?error=no_access_token');
    }

    // Create Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, response.accessToken);
      },
    });

    // Get user info from Microsoft Graph
    const msUser = await graphClient.api('/me').get();

    // Get calendar list
    const calendars = await graphClient
      .api('/me/calendars')
      .select('id,name,color,isDefaultCalendar,canEdit')
      .get();

    // Tokens will be encrypted server-side in Convex function

    // Store provider connection in Convex
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get Convex user ID
    const convexUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: user.id,
    });

    if (!convexUser) {
      // Create user if doesn't exist
      await convex.mutation(api.users.createUser, {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
      });

      const newUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: user.id,
      });

      if (!newUser) {
        return NextResponse.redirect('/settings/integrations?error=user_creation_failed');
      }
    }

    // Store the provider connection with plain tokens (encrypted server-side)
    await convex.action(api.calendar.encryption.connectProviderWithTokens, {
      provider: 'microsoft',
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || undefined,
      expiresAt: response.expiresOn ? response.expiresOn.getTime() : undefined,
      providerAccountId: msUser.id,
      settings: {
        calendars:
          calendars.value?.map((cal: any) => ({
            id: cal.id,
            name: cal.name,
            color: cal.color?.toLowerCase() || '#0078d4',
            syncEnabled: cal.isDefaultCalendar || false,
            isPrimary: cal.isDefaultCalendar || false,
          })) || [],
        syncDirection: 'bidirectional',
        conflictResolution: 'newest',
      },
    });

    // Schedule initial sync
    await convex.mutation(api.calendar.sync.scheduleSync, {
      provider: 'microsoft',
      operation: 'full_sync',
      priority: 10,
    });

    // Redirect to settings with success message
    return NextResponse.redirect(
      `/settings/integrations?success=microsoft_connected&calendars=${encodeURIComponent(calendars.value?.length?.toString() || '0')}`
    );
  } catch (error) {
    console.error('Error handling Microsoft OAuth callback:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return NextResponse.redirect('/settings/integrations?error=callback_failed');
  }
}
