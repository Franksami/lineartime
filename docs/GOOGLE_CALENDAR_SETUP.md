# Google Calendar OAuth Setup Guide

This guide will walk you through setting up Google Calendar integration for Command Center Calendar.

## Prerequisites

- Google Cloud Console account
- Command Center Calendar running locally or deployed
- Admin access to Google Cloud project

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Command Center Calendar Calendar")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"
4. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Click "Create"

### App Information
- **App name**: Command Center Calendar
- **User support email**: Your email
- **App logo**: Optional (upload Command Center Calendar logo)

### App Domain
- **Application home page**: `http://localhost:3000` (or your production URL)
- **Application privacy policy**: `http://localhost:3000/privacy` (optional)
- **Application terms of service**: `http://localhost:3000/terms` (optional)

### Authorized domains
- Add `localhost` for development
- Add your production domain if deployed

### Developer contact information
- Add your email address

Click "Save and Continue"

### Scopes
Click "Add or Remove Scopes" and add these scopes:
- `https://www.googleapis.com/auth/calendar` (See, edit, share, and permanently delete all the calendars)
- `https://www.googleapis.com/auth/calendar.events` (View and edit events on all your calendars)
- `https://www.googleapis.com/auth/calendar.readonly` (View your calendars)
- `https://www.googleapis.com/auth/userinfo.email` (See your primary Google Account email)
- `https://www.googleapis.com/auth/userinfo.profile` (See your personal info)

Click "Update" → "Save and Continue"

### Test Users (Development Only)
Add test user emails who can access the app while in testing mode:
- Your email
- Team member emails

Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"

### Configuration
- **Name**: Command Center Calendar Web Client
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (development)
  - Your production URL (if deployed)
  
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/google/callback` (development)
  - `https://yourdomain.com/api/auth/google/callback` (production)

4. Click "Create"
5. **IMPORTANT**: Save the Client ID and Client Secret

## Step 5: Configure Command Center Calendar

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update these values in `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

3. Generate encryption key:
```bash
openssl rand -hex 32
```
Add to `.env.local`:
```env
ENCRYPTION_KEY=generated_key_here
```

4. Generate webhook secret:
```bash
openssl rand -hex 32
```
Add to `.env.local`:
```env
WEBHOOK_SECRET=generated_webhook_secret_here
```

## Step 6: Set Up Webhooks (Optional - For Real-time Sync)

### Enable Google Calendar Push Notifications

1. Create a public webhook endpoint (use ngrok for local testing):
```bash
ngrok http 3000
```

2. Note the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. Update `.env.local`:
```env
NEXT_PUBLIC_URL=https://abc123.ngrok.io
```

### Register Webhook Channel

The webhook registration happens automatically when a user connects their Google Calendar. Command Center Calendar will:
1. Create a unique channel for each calendar
2. Register the webhook URL with Google
3. Start receiving real-time updates

## Step 7: Test the Integration

1. Start Command Center Calendar:
```bash
pnpm dev
```

2. Navigate to Settings → Integrations:
```
http://localhost:3000/settings/integrations
```

3. Click "Connect Google Calendar"

4. You should be redirected to Google OAuth:
   - Sign in with your Google account
   - Review permissions
   - Click "Allow"

5. You'll be redirected back to Command Center Calendar
   - Should see "Connected" status
   - Your calendars will be listed
   - Toggle calendars to sync

6. Verify sync is working:
   - Create an event in Google Calendar
   - Check if it appears in Command Center Calendar
   - Create an event in Command Center Calendar
   - Check if it appears in Google Calendar

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Check redirect URI matches exactly (including trailing slashes)
- Ensure OAuth consent screen is configured

### "401: Invalid Credentials"
- Verify Client ID and Secret are correct
- Check if API is enabled
- Ensure scopes are configured

### "Redirect URI mismatch"
- Add exact callback URL to OAuth credentials
- Check for http vs https
- Verify port number matches

### "Quota exceeded"
- Google Calendar API has usage limits
- Check [API Console](https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/metrics) for quota usage
- Request quota increase if needed

## Production Deployment

### Update OAuth Settings

1. Add production domain to OAuth consent screen
2. Add production redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
3. Update `.env.production`:
```env
NEXT_PUBLIC_URL=https://yourdomain.com
```

### Verify Domain Ownership (Optional)

For verified apps (removes "unverified app" warning):
1. Go to "OAuth consent screen"
2. Click "Add Domain"
3. Follow verification steps

### Submit for Verification (If Using Sensitive Scopes)

If your app will have >100 users:
1. Complete OAuth consent screen
2. Submit for verification
3. Google will review (can take weeks)

## Security Best Practices

1. **Never commit credentials**:
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production

2. **Rotate secrets regularly**:
   - Change Client Secret periodically
   - Update encryption keys

3. **Limit scopes**:
   - Only request necessary permissions
   - Use readonly scopes when possible

4. **Monitor usage**:
   - Check API quotas regularly
   - Set up alerts for unusual activity

5. **Implement rate limiting**:
   - Prevent abuse of sync endpoints
   - Use exponential backoff for retries

## API Quotas and Limits

### Default Quotas
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 500
- **Queries per 100 seconds**: 10,000

### Best Practices
- Cache calendar data locally
- Use incremental sync (syncToken)
- Batch API requests when possible
- Implement exponential backoff

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [API Quotas](https://developers.google.com/calendar/api/guides/quota)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs: `pnpm dev`
3. Verify all environment variables are set
4. Test with a different Google account
5. Open an issue on GitHub with:
   - Error messages
   - Browser console logs
   - Steps to reproduce