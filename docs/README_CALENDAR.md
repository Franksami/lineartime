# 📅 LinearTime Calendar Integration

## Overview

LinearTime provides seamless calendar integration with multiple providers, allowing you to sync all your events in one place with real-time updates, conflict resolution, and secure storage.

## ✨ Features

- **Multi-Provider Support**: Google Calendar, Microsoft Outlook, Apple iCloud, and any CalDAV server
- **Real-time Sync**: Webhook-based instant updates for supported providers
- **Conflict Resolution**: Smart three-way merge with vector clock synchronization
- **Secure Storage**: AES-256-GCM encryption for all tokens and sensitive data
- **Offline Support**: Local caching with sync on reconnection
- **Bidirectional Sync**: Changes propagate both ways seamlessly

## 🚀 Quick Start

### 1. Run Setup Script

```bash
./scripts/setup-calendar.sh
```

This will:
- Create `.env.local` from template
- Generate encryption keys
- Provide setup instructions

### 2. Configure OAuth Providers

#### Google Calendar
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add to `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

#### Microsoft Outlook
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register an application
3. Add Microsoft Graph permissions
4. Add to `.env.local`:
```env
MICROSOFT_CLIENT_ID=your_application_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

### 3. Start Development Server

```bash
pnpm dev
```

### 4. Connect Calendars

Navigate to [http://localhost:3000/settings/integrations](http://localhost:3000/settings/integrations) and connect your calendars.

## 📁 Project Structure

```
lineartime/
├── app/
│   ├── api/
│   │   ├── auth/           # OAuth endpoints
│   │   │   ├── google/
│   │   │   ├── microsoft/
│   │   │   └── caldav/
│   │   └── webhooks/       # Webhook handlers
│   ├── settings/
│   │   └── integrations/   # Calendar settings UI
│   └── calendar-sync/      # Synced calendar view
├── components/
│   ├── calendar/
│   │   ├── LinearCalendarWithSync.tsx
│   │   ├── ConflictResolutionModal.tsx
│   │   ├── EventSyncIndicator.tsx
│   │   └── CalendarErrorBoundary.tsx
│   └── settings/
│       └── CalendarIntegrations.tsx
├── convex/
│   ├── calendar/
│   │   ├── providers.ts    # Provider management
│   │   ├── sync.ts         # Sync queue
│   │   ├── events.ts       # Event sync logic
│   │   ├── google.ts       # Google-specific
│   │   └── caldav.ts       # CalDAV implementation
│   └── schema.ts           # Database schema
├── hooks/
│   ├── useSyncedCalendar.ts
│   └── useCalendarNotifications.ts
├── lib/
│   ├── encryption.ts       # Token encryption
│   ├── hmac.ts            # Webhook security
│   └── sync/
│       ├── event-normalizer.ts
│       └── vector-clock.ts
└── docs/
    ├── CALENDAR_INTEGRATION.md
    └── GOOGLE_CALENDAR_SETUP.md
```

## 🔧 Configuration

### Environment Variables

```env
# Required
ENCRYPTION_KEY=             # 32-byte hex key for token encryption
WEBHOOK_SECRET=             # Secret for webhook verification

# Google Calendar
GOOGLE_CLIENT_ID=           # OAuth client ID
GOOGLE_CLIENT_SECRET=       # OAuth client secret

# Microsoft Calendar
MICROSOFT_CLIENT_ID=        # Azure app ID
MICROSOFT_CLIENT_SECRET=    # Azure app secret
MICROSOFT_TENANT_ID=common  # Tenant ID or 'common'

# Application
NEXT_PUBLIC_URL=http://localhost:3000  # Your app URL
```

### Convex Setup

The calendar integration uses Convex for:
- Real-time data synchronization
- Scheduled sync jobs
- Conflict resolution
- Token storage (encrypted)

## 🔐 Security

### Token Encryption
- All OAuth tokens encrypted with AES-256-GCM
- Unique IV and auth tag for each token
- Keys never exposed to client

### Webhook Verification
- HMAC signature validation
- Time-based token expiration
- Request replay prevention

### Data Privacy
- No third-party data sharing
- User-controlled data retention
- Revocable access tokens

## 📊 Sync Architecture

### Sync Queue System
```typescript
// Priority levels
10 - User-triggered sync
8  - Webhook updates
5  - Periodic sync
3  - Background sync
```

### Conflict Resolution
```typescript
// Vector clock for distributed sync
{
  local: timestamp,
  google: timestamp,
  microsoft: timestamp
}
```

### Event Normalization
All events normalized to common format:
```typescript
interface NormalizedEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  provider: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}
```

## 🧪 Testing

### Local Testing with ngrok

```bash
# Install ngrok
brew install ngrok

# Expose local server
ngrok http 3000

# Update .env.local with ngrok URL
NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

### Test Scenarios

1. **Connection Flow**
   - Connect each provider
   - Verify token storage
   - Check calendar list

2. **Sync Operations**
   - Create event locally → verify in provider
   - Create event in provider → verify locally
   - Update event → verify sync
   - Delete event → verify removal

3. **Conflict Resolution**
   - Modify same event in multiple places
   - Verify conflict detection
   - Test resolution strategies

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| OAuth redirect mismatch | Ensure exact URL match in provider console |
| Sync not working | Check provider connection status |
| Duplicate events | Verify sync direction settings |
| Missing events | Check calendar selection in settings |

### Debug Mode

Enable debug logging:
```typescript
// In your component
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) console.log('Sync status:', syncStatus);
```

### Error Codes

- `AUTH_001`: Token expired - reconnect provider
- `SYNC_001`: Network error - check connection
- `SYNC_002`: Rate limit - wait and retry
- `CONF_001`: Conflict detected - manual resolution needed

## 📈 Performance

### Optimization Tips

1. **Limit Synced Calendars**: Only sync essential calendars
2. **Use Incremental Sync**: Reduces API calls
3. **Enable Caching**: Improves response time
4. **Batch Operations**: Group multiple changes

### Monitoring

Track sync performance:
```typescript
// Monitor sync queue
const { pending, processing, completed, failed } = syncQueue;
```

## 🚢 Production Deployment

### Checklist

- [ ] Set production OAuth redirect URIs
- [ ] Configure production environment variables
- [ ] Enable HTTPS for webhooks
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Test with real calendar data
- [ ] Set up backup encryption keys

### Scaling Considerations

- Use Redis for sync queue (high volume)
- Implement webhook deduplication
- Add CDN for static assets
- Use connection pooling for CalDAV

## 🤝 Contributing

### Adding a New Provider

1. Create OAuth routes in `app/api/auth/[provider]/`
2. Add sync functions in `convex/calendar/[provider].ts`
3. Update schema with provider type
4. Add normalization in `lib/sync/event-normalizer.ts`
5. Create provider settings UI
6. Add documentation

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Convex for backend logic
- Tailwind for styling

## 📚 Resources

- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [CalDAV Specification](https://tools.ietf.org/html/rfc4791)
- [Convex Documentation](https://docs.convex.dev/)

## 📝 License

This calendar integration is part of the LinearTime project and follows the same license terms.

## 🆘 Support

- Documentation: `/docs/CALENDAR_INTEGRATION.md`
- Setup Guide: `/docs/GOOGLE_CALENDAR_SETUP.md`
- Issues: GitHub Issues
- Discord: Join our community

---

Built with ❤️ using Next.js, Convex, and modern web standards.