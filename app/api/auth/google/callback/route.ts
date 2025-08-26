import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { currentUser } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
// Removed: import { encryptToken } from '@/lib/encryption'; - now handled server-side

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/google/callback`
);

/**
 * GET /api/auth/google/callback
 * Handles the OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `/settings/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        '/settings/integrations?error=missing_parameters'
      );
    }

    // Verify state token
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      
      // Check timestamp to prevent replay attacks (5 minute expiry)
      if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
        return NextResponse.redirect(
          '/settings/integrations?error=state_expired'
        );
      }
    } catch {
      return NextResponse.redirect(
        '/settings/integrations?error=invalid_state'
      );
    }

    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        '/settings/integrations?error=unauthorized'
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        '/settings/integrations?error=no_access_token'
      );
    }

    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list();

    // Tokens will be encrypted server-side in Convex function

    // Store provider connection in Convex
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Get Convex user ID
    const convexUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: user.id
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
        clerkId: user.id
      });
      
      if (!newUser) {
        return NextResponse.redirect(
          '/settings/integrations?error=user_creation_failed'
        );
      }
    }

    // Store the provider connection with plain tokens (encrypted server-side)
    await convex.action(api.calendar.encryption.connectProviderWithTokens, {
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || undefined,
      providerAccountId: userInfo.id!,
      settings: {
        calendars: calendarList.items?.map(cal => ({
          id: cal.id!,
          name: cal.summary!,
          color: cal.backgroundColor || '#4285F4',
          syncEnabled: cal.id === userInfo.email, // Enable primary calendar by default
          isPrimary: cal.primary || false
        })) || [],
        syncDirection: 'bidirectional',
        conflictResolution: 'newest'
      }
    });

    // Schedule initial sync
    await convex.mutation(api.calendar.sync.scheduleSync, {
      provider: 'google',
      operation: 'full_sync',
      priority: 10
    });

    // Redirect to settings with success message
    return NextResponse.redirect(
      '/settings/integrations?success=google_connected&calendars=' + 
      encodeURIComponent(calendarList.items?.length?.toString() || '0')
    );
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.redirect(
      '/settings/integrations?error=callback_failed'
    );
  }
}