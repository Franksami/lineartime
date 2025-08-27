import { api } from '@/convex/_generated/api';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';
// TODO: Move token encryption to Convex function
// import { encryptToken } from '@/lib/encryption';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/google/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * GET /api/auth/google
 * Initiates the Google OAuth flow
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: SCOPES,
      state,
      prompt: 'consent', // Force consent to get refresh token
      include_granted_scopes: true,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}

/**
 * POST /api/auth/google (called as callback)
 * Handles the OAuth callback from Google
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`/settings/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect('/settings/integrations?error=missing_parameters');
    }

    // Verify state token
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect('/settings/integrations?error=invalid_state');
    }

    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect('/settings/integrations?error=unauthorized');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list();

    // Store provider connection with server-side encryption
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get Convex user ID
    const convexUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: user.id,
    });

    if (!convexUser) {
      return NextResponse.redirect('/settings/integrations?error=user_not_found');
    }

    // Store the provider connection using server-side encryption
    await convex.action(api.calendar.encryption.connectProviderWithTokens, {
      provider: 'google',
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || undefined,
      providerAccountId: userInfo.id!,
      settings: {
        calendars:
          calendarList.items?.map((cal) => ({
            id: cal.id!,
            name: cal.summary!,
            color: cal.backgroundColor || '#4285F4',
            syncEnabled: cal.primary || false, // Enable primary calendar by default
            isPrimary: cal.primary || false,
          })) || [],
        syncDirection: 'bidirectional',
        conflictResolution: 'newest',
      },
    });

    // Redirect to settings with success message
    return NextResponse.redirect('/settings/integrations?success=google_connected');
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect('/settings/integrations?error=callback_failed');
  }
}
