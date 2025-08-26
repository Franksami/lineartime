import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createDAVClient } from 'tsdav';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
// TODO: Move token encryption to Convex function
// import { encryptToken } from '@/lib/encryption';

/**
 * POST /api/auth/caldav/generic
 * Authenticates with a generic CalDAV server and stores credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get credentials from request body
    const body = await request.json();
    const { serverUrl, username, password, providerName = 'caldav' } = body;

    if (!serverUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Server URL, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate server URL
    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid server URL format' },
        { status: 400 }
      );
    }

    // Create CalDAV client
    const client = new createDAVClient({
      serverUrl,
      credentials: {
        username,
        password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      // Test authentication and get principal
      await client.login();
      
      // Get calendar home URL and fetch calendars
      const calendars = await client.fetchCalendars();
      
      if (!calendars || calendars.length === 0) {
        return NextResponse.json(
          { error: 'No calendars found on the CalDAV server' },
          { status: 404 }
        );
      }

      // TODO: Implement server-side encryption via Convex
      // For now, CalDAV authentication is disabled until encryption is moved to server-side
      return NextResponse.json(
        { error: 'CalDAV authentication temporarily disabled - encryption refactor in progress' },
        { status: 503 }
      );
      
      // Store provider connection in Convex
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Get Convex user
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

        // Re-fetch user
        const newUser = await convex.query(api.users.getUserByClerkId, {
          clerkId: user.id
        });

        if (!newUser) {
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }
      }

      // Store the provider connection using server-side encryption
      await convex.action(api.calendar.encryption.connectProviderWithTokens, {
        provider: 'caldav',
        accessToken: password, // Password for CalDAV authentication
        providerAccountId: username,
        settings: {
          serverUrl,
          username,
          providerName, // Custom name for the provider
          calendars: calendars.map((cal: { url: string; displayName?: string; color?: string }) => ({
            id: cal.url,
            name: cal.displayName || 'Calendar',
            color: cal.calendarColor || '#4A90E2',
            syncEnabled: true,
            isPrimary: calendars.length === 1,
            ctag: cal.ctag, // Calendar tag for sync
            syncToken: cal.syncToken,
            resourcetype: cal.resourcetype,
          })),
          syncDirection: 'bidirectional',
          conflictResolution: 'newest'
        }
      });

      // Schedule initial sync
      await convex.mutation(api.calendar.sync.scheduleSync, {
        provider: 'caldav',
        operation: 'full_sync',
        priority: 10
      });

      return NextResponse.json({
        success: true,
        calendars: calendars.length,
        providerName,
        message: `CalDAV calendar (${providerName}) connected successfully`
      });
    } catch (authError) {
      console.error('CalDAV authentication error:', authError);
      
      // Check for specific error types
      if (authError instanceof Error) {
        if (authError.message.includes('401') || authError.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Invalid username or password' },
            { status: 401 }
          );
        }
        if (authError.message.includes('403') || authError.message.includes('Forbidden')) {
          return NextResponse.json(
            { error: 'Access forbidden. Please check your CalDAV server settings' },
            { status: 403 }
          );
        }
        if (authError.message.includes('404')) {
          return NextResponse.json(
            { error: 'CalDAV server not found. Please check the server URL' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to connect to CalDAV server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling CalDAV authentication:', error);
    return NextResponse.json(
      { error: 'Failed to process CalDAV connection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/caldav/generic
 * Disconnects generic CalDAV calendar
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Disconnect the provider
    await convex.mutation(api.calendar.providers.disconnectProvider, {
      provider: 'caldav'
    });

    return NextResponse.json({
      success: true,
      message: 'CalDAV calendar disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting CalDAV calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect CalDAV calendar' },
      { status: 500 }
    );
  }
}