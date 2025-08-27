import { api } from '@/convex/_generated/api';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { type NextRequest, NextResponse } from 'next/server';
import { createDAVClient } from 'tsdav';
// TODO: Move token encryption to Convex function
// import { encryptToken } from '@/lib/encryption';

/**
 * POST /api/auth/caldav/apple
 * Authenticates with Apple iCloud CalDAV and stores credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get credentials from request body
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and app-specific password required' },
        { status: 400 }
      );
    }

    // Validate Apple ID format
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid Apple ID format' }, { status: 400 });
    }

    // Create CalDAV client for Apple iCloud
    const client = new createDAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: {
        username: email,
        password: password, // Should be app-specific password
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    try {
      // Test authentication and get principal
      await client.login();

      // Get calendar home URL
      const calendars = await client.fetchCalendars();

      if (!calendars || calendars.length === 0) {
        return NextResponse.json({ error: 'No calendars found in Apple account' }, { status: 404 });
      }

      // Store provider connection with server-side encryption
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

      // Get Convex user
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

        // Re-fetch user
        const newUser = await convex.query(api.users.getUserByClerkId, {
          clerkId: user.id,
        });

        if (!newUser) {
          return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
        }
      }

      // Store the provider connection using server-side encryption
      await convex.action(api.calendar.encryption.connectProviderWithTokens, {
        provider: 'apple',
        accessToken: password, // App-specific password for CalDAV
        providerAccountId: email,
        settings: {
          serverUrl: 'https://caldav.icloud.com',
          username: email,
          calendars: calendars.map(
            (cal: { url: string; displayName?: string; color?: string }) => ({
              id: cal.url,
              name: cal.displayName || 'Calendar',
              color: cal.calendarColor || '#1BADF8', // Apple blue
              syncEnabled: true,
              isPrimary: calendars.length === 1,
              ctag: cal.ctag, // Calendar tag for sync
              syncToken: cal.syncToken,
            })
          ),
          syncDirection: 'bidirectional',
          conflictResolution: 'newest',
        },
      });

      // Schedule initial sync
      await convex.mutation(api.calendar.sync.scheduleSync, {
        provider: 'apple',
        operation: 'full_sync',
        priority: 10,
      });

      return NextResponse.json({
        success: true,
        calendars: calendars.length,
        message: 'Apple iCloud calendar connected successfully',
      });
    } catch (authError) {
      console.error('Apple CalDAV authentication error:', authError);

      // Check for specific error types
      if (authError instanceof Error) {
        if (authError.message.includes('401') || authError.message.includes('Unauthorized')) {
          return NextResponse.json(
            {
              error:
                'Invalid Apple ID or app-specific password. Please generate an app-specific password at appleid.apple.com',
            },
            { status: 401 }
          );
        }
        if (authError.message.includes('403') || authError.message.includes('Forbidden')) {
          return NextResponse.json(
            {
              error:
                'Access forbidden. Please check your Apple ID settings and ensure CalDAV access is enabled',
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to connect to Apple iCloud calendar' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling Apple CalDAV authentication:', error);
    return NextResponse.json(
      { error: 'Failed to process Apple calendar connection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/caldav/apple
 * Disconnects Apple iCloud calendar
 */
export async function DELETE(_request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Disconnect the provider
    await convex.mutation(api.calendar.providers.disconnectProvider, {
      provider: 'apple',
    });

    return NextResponse.json({
      success: true,
      message: 'Apple iCloud calendar disconnected',
    });
  } catch (error) {
    console.error('Error disconnecting Apple calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Apple calendar' }, { status: 500 });
  }
}
