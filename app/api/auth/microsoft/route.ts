import { ConfidentialClientApplication } from '@azure/msal-node';
import { currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';

// Microsoft OAuth configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
};

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'https://graph.microsoft.com/calendars.readwrite',
  'https://graph.microsoft.com/calendars.readwrite.shared',
  'https://graph.microsoft.com/user.read',
];

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`;

/**
 * GET /api/auth/microsoft
 * Initiates the Microsoft OAuth flow
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Check if Microsoft credentials are configured
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Microsoft OAuth not configured' }, { status: 500 });
    }

    // Create MSAL application
    const cca = new ConfidentialClientApplication(msalConfig);

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    // Get authorization URL
    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      state,
      prompt: 'select_account', // Force account selection
    };

    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Microsoft OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate Microsoft OAuth' }, { status: 500 });
  }
}
