# Calendar Integration Documentation

## Overview

LinearTime supports bidirectional synchronization with multiple calendar providers, allowing you to manage all your events in one place while keeping them synced across platforms.

## Supported Providers

### 1. Google Calendar
- **Authentication**: OAuth 2.0
- **Features**: Real-time sync, push notifications, full CRUD operations
- **Setup Time**: ~2 minutes

### 2. Microsoft Outlook
- **Authentication**: OAuth 2.0 (MSAL) with Azure AD
- **Features**: Full Graph API integration, delta sync, real-time webhook updates, bidirectional sync
- **Setup Time**: ~3 minutes
- **Supported**: Outlook.com, Office 365, Microsoft 365

### 3. Apple iCloud
- **Authentication**: CalDAV with app-specific passwords
- **Features**: Bidirectional sync, CalDAV protocol support
- **Setup Time**: ~5 minutes

### 4. Generic CalDAV
- **Authentication**: Basic Auth
- **Features**: Universal calendar server support
- **Compatible With**: Fastmail, Zimbra, Nextcloud, and more

### 5. Notion (Coming Soon)
- **Authentication**: API Integration
- **Features**: Database sync, custom properties

### 6. Obsidian (Coming Soon)
- **Authentication**: Plugin API
- **Features**: Daily notes integration, markdown support

## Setup Instructions

### Google Calendar

1. **Navigate to Settings**
   - Go to `/settings/integrations` in LinearTime
   - Find the Google Calendar card

2. **Connect Your Account**
   - Click "Connect Google Calendar"
   - You'll be redirected to Google's authorization page
   - Sign in with your Google account
   - Grant LinearTime permission to access your calendars

3. **Select Calendars**
   - After authorization, you'll see a list of your calendars
   - Toggle which calendars you want to sync
   - Set your primary calendar for new events

4. **Verify Connection**
   - Check for the green "Connected" status
   - Your events will begin syncing automatically

### Microsoft Outlook Setup

#### Prerequisites
- Microsoft account (Outlook.com, Office 365, or Microsoft 365)
- Azure subscription (for application registration)

#### Step 1: Create Azure AD Application

1. **Access Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Sign in with your Microsoft account

2. **Register Application**
   - Navigate to **Azure Active Directory** > **App registrations**
   - Click **New registration**
   - **Name**: "LinearTime Calendar"
   - **Supported account types**: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
   - **Redirect URI**: `http://localhost:3000/api/auth/microsoft/callback` (for development)
   - Click **Register**

3. **Record Application Details**
   - Copy the **Application (client) ID** - this is your `MICROSOFT_CLIENT_ID`

#### Step 2: Configure API Permissions

1. **Add Permissions**
   - In your app registration, go to **API permissions**
   - Click **Add a permission**
   - Select **Microsoft Graph**

2. **Select Delegated Permissions**
   - **Calendars** > `Calendars.ReadWrite`
   - **Calendars** > `Calendars.ReadWrite.Shared`
   - **User** > `User.Read`
   - Click **Add permissions**

3. **Grant Admin Consent** (if applicable)
   - If you're an admin, grant consent for your organization
   - Otherwise, users will be prompted for consent during login

#### Step 3: Create Client Secret

1. **Generate Secret**
   - Go to **Certificates & secrets** in your app
   - Click **New client secret**
   - **Description**: "LinearTime Calendar Secret"
   - **Expires**: "24 months" (recommended)
   - Click **Add**

2. **Copy Secret Value**
   - Immediately copy the **Value** (not the Secret ID)
   - This is your `MICROSOFT_CLIENT_SECRET` - store it securely

#### Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Microsoft Calendar Integration
MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_value_here
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Webhook Security (generate random secret)
MICROSOFT_WEBHOOK_SECRET=your_random_webhook_secret
```

#### Step 5: Connect in LinearTime

1. **Navigate to Settings**
   - Go to `/settings/integrations` in LinearTime
   - Find the **Microsoft Outlook** card

2. **Initiate Connection**
   - Click **"Connect Microsoft Outlook"**
   - You'll be redirected to Microsoft authorization

3. **Authorize Access**
   - Sign in with your Microsoft account
   - Review and accept the permissions:
     - Read and write to your calendars
     - Access your basic profile information
   - You'll be redirected back to LinearTime

4. **Configure Sync Settings**
   - Select which calendars to synchronize
   - Choose your primary calendar for new events
   - Set sync preferences (bidirectional by default)
   - Click **"Save Settings"**

#### Step 6: Verify Connection

1. **Check Status**
   - Look for green "Connected" status
   - Initial sync may take a few minutes for large calendars

2. **Test Sync**
   - Create an event in LinearTime - it should appear in Outlook
   - Create an event in Outlook - it should appear in LinearTime
   - Changes sync in real-time via Microsoft Graph webhooks

#### Troubleshooting

**Connection Issues**
- Verify Azure application configuration
- Check environment variables are correct
- Ensure redirect URI matches exactly
- Check browser console for authentication errors

**Sync Problems**
- Verify calendar permissions in Outlook
- Check Convex function logs: `npx convex logs`
- Ensure webhook endpoint is accessible (for production)

**Permission Errors**
- Review Azure AD permissions are granted
- Check user has calendar access in Microsoft 365
- Verify tenant settings allow third-party apps

### Apple iCloud

1. **Generate App-Specific Password**
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in and navigate to Security
   - Under "App-Specific Passwords", click "Generate Password"
   - Name it "LinearTime" and copy the password

2. **Connect in LinearTime**
   - Go to `/settings/integrations`
   - Click "Connect Apple iCloud"
   - Enter your Apple ID email
   - Paste the app-specific password
   - Click "Connect"

3. **Select Calendars**
   - Choose which iCloud calendars to sync
   - Configure sync preferences

### Generic CalDAV

1. **Gather Server Information**
   - CalDAV server URL (e.g., `https://caldav.example.com`)
   - Username and password
   - Calendar paths (if known)

2. **Connect in LinearTime**
   - Go to `/settings/integrations`
   - Click "Connect CalDAV Server"
   - Enter server URL, username, and password
   - Optionally provide a custom name

3. **Test and Configure**
   - LinearTime will test the connection
   - Select calendars to sync
   - Configure sync settings

## Environment Variables

Add these to your `.env.local` file:

```env
# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key

# Webhook Secret (for Google push notifications)
WEBHOOK_SECRET=your_webhook_secret

# Public URL (for OAuth callbacks)
NEXT_PUBLIC_URL=http://localhost:3000
```

## Sync Behavior

### Automatic Sync
- **Incremental Sync**: Every 30 minutes
- **Push Notifications**: Real-time for Google Calendar
- **Webhook Updates**: Instant for supported providers
- **Conflict Detection**: Automatic with vector clocks

### Manual Sync
- Click the refresh icon next to any connected calendar
- Use the "Sync Now" button in settings
- Keyboard shortcut: `Cmd/Ctrl + Shift + S`

### Conflict Resolution

When LinearTime detects conflicting changes:

1. **Automatic Resolution** (when possible)
   - Uses vector clocks to determine causality
   - Applies three-way merge for non-conflicting fields

2. **Manual Resolution** (when required)
   - Modal appears with both versions
   - Options:
     - Keep local version
     - Keep remote version
     - Merge changes
     - Keep both as separate events

## Data Security

### Token Storage
- All OAuth tokens are encrypted using AES-256-GCM
- Tokens are stored in Convex (encrypted)
- Refresh tokens enable persistent access

### Webhook Security
- HMAC signature verification for all webhooks
- Time-based tokens with expiration
- IP allowlisting (optional)

### Privacy
- LinearTime only accesses calendar data
- No data is shared with third parties
- You can revoke access at any time

## Troubleshooting

### Common Issues

#### "Authentication Failed"
- **Solution**: Reconnect the calendar provider
- Clear browser cookies for the provider
- Check if app permissions were revoked

#### "Sync Not Working"
- **Check**: Internet connection
- **Verify**: Provider is still connected
- **Action**: Manual sync or reconnect

#### "Duplicate Events"
- **Cause**: Multiple sync sources
- **Solution**: Check sync direction settings
- Ensure only one primary calendar

#### "Missing Events"
- **Check**: Calendar selection in settings
- **Verify**: Date range filters
- **Action**: Perform full sync

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| AUTH_001 | OAuth token expired | Reconnect provider |
| SYNC_001 | Network timeout | Check connection, retry |
| SYNC_002 | Rate limit exceeded | Wait and retry |
| CONF_001 | Sync conflict detected | Resolve manually |
| PERM_001 | Insufficient permissions | Reconnect with proper scope |

## API Endpoints

### OAuth Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback

### CalDAV Endpoints
- `POST /api/auth/caldav/apple` - Apple iCloud connection
- `POST /api/auth/caldav/generic` - Generic CalDAV connection

### Webhook Endpoints
- `POST /api/webhooks/google` - Google Calendar webhooks
- `POST /api/webhooks/microsoft` - Microsoft Graph webhooks

## Development

### Testing OAuth Locally

1. **Setup ngrok** (for webhooks)
   ```bash
   ngrok http 3000
   ```

2. **Update OAuth Redirect URIs**
   - Google: Add `http://localhost:3000/api/auth/google/callback`
   - Microsoft: Add `http://localhost:3000/api/auth/microsoft/callback`

3. **Test Webhooks**
   - Use ngrok URL for webhook endpoints
   - Update `NEXT_PUBLIC_URL` with ngrok URL

### Adding a New Provider

1. **Create OAuth Route**
   ```typescript
   // app/api/auth/[provider]/route.ts
   export async function GET(request: NextRequest) {
     // Initiate OAuth flow
   }
   ```

2. **Create Callback Route**
   ```typescript
   // app/api/auth/[provider]/callback/route.ts
   export async function GET(request: NextRequest) {
     // Handle OAuth callback
   }
   ```

3. **Add Sync Functions**
   ```typescript
   // convex/calendar/[provider].ts
   export const performFullSync = internalAction({...})
   export const performIncrementalSync = internalAction({...})
   ```

4. **Update Schema**
   ```typescript
   // Add provider to union type
   provider: v.union(
     v.literal("google"),
     v.literal("microsoft"),
     v.literal("your_provider")
   )
   ```

## Performance Optimization

### Sync Queue
- Prioritized queue system
- Exponential backoff for retries
- Batch processing for efficiency

### Caching
- Event deduplication
- Delta sync for incremental updates
- Local cache for offline support

### Best Practices
1. Limit synced calendars to essential ones
2. Use incremental sync when possible
3. Configure appropriate sync intervals
4. Monitor sync queue status

## Support

### Getting Help
- Check the [FAQ](#frequently-asked-questions)
- Review [error codes](#error-codes)
- Contact support: support@lineartime.app

### Reporting Issues
Include:
- Provider type
- Error messages
- Browser console logs
- Network requests (if applicable)

## Frequently Asked Questions

**Q: How many calendars can I connect?**
A: No limit on calendar connections, but performance is best with <10 active calendars.

**Q: Is my calendar data secure?**
A: Yes, all tokens are encrypted and data is transmitted over HTTPS.

**Q: Can I sync historical events?**
A: Yes, you can configure the sync range in settings (default: 1 year back, 1 year forward).

**Q: What happens if I delete an event?**
A: Deletions sync based on your sync direction settings (bidirectional by default).

**Q: Can I use LinearTime offline?**
A: Yes, with limited functionality. Changes sync when reconnected.

**Q: How do I revoke calendar access?**
A: Disconnect in LinearTime settings or revoke in your calendar provider's security settings.

## Changelog

### v1.0.0 (Current)
- Google Calendar integration
- Microsoft Outlook support
- Apple iCloud via CalDAV
- Generic CalDAV support
- Conflict resolution UI
- Real-time sync with webhooks
- Encrypted token storage

### Roadmap
- Notion integration
- Obsidian plugin
- Calendar sharing
- Team calendars
- Advanced recurrence patterns
- AI-powered scheduling suggestions