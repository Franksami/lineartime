# Linear Calendar Setup Guide (v0.3.2)

This guide provides comprehensive setup instructions for the Linear Calendar application with AI integration, multi-calendar support, and performance optimizations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Convex account and CLI
- Clerk account for authentication
- Anthropic API key for AI features
- Google/Microsoft calendar API credentials (optional)

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd lineartime

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

### 2. Required Environment Variables

Edit `.env.local` with your credentials:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex Backend (Required)
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Anthropic AI (Required for AI features)
ANTHROPIC_API_KEY=sk-ant-api03-your_anthropic_key

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft Calendar (Optional)
MICROSOFT_CLIENT_ID=your_microsoft_application_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Encryption (Required - Generate new keys)
ENCRYPTION_KEY=your_32_byte_hex_key
WEBHOOK_SECRET=your_webhook_secret

# Stripe (Optional for billing)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 3. Convex Setup

```bash
# Initialize Convex (if not already done)
npx convex dev

# Deploy schema changes
npx convex deploy
```

### 4. Generate Encryption Keys

```bash
# Generate a 32-byte encryption key
openssl rand -hex 32

# Generate webhook secret
openssl rand -hex 32
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your calendar.

## 🤖 AI Integration Setup

### Anthropic Claude Configuration

The application uses Anthropic Claude for AI features:

- **Chat & Complex Tasks**: `claude-3-5-sonnet-20241022`
- **Fast Parsing**: `claude-3-haiku-20240307`

### AI Features Available

1. **Smart Scheduling**: AI-powered time slot recommendations
2. **Event Parsing**: Natural language event creation
3. **Conflict Resolution**: Intelligent scheduling conflict detection
4. **AI Chat**: Real-time streaming chat with calendar context

### Testing AI Features

```bash
# Test AI chat API
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Schedule a meeting tomorrow at 2 PM"}],"userId":"user_id"}'
```

## 📅 Calendar Integration Setup

### Google Calendar Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing

2. **Enable APIs**
   - Enable Google Calendar API
   - Enable Google People API

3. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

4. **Configure Webhooks (Production)**
   - Set up Google Pub/Sub for webhook notifications
   - Configure webhook endpoint: `https://your-domain.com/api/webhooks/google`

### Microsoft Outlook Setup

1. **Create Azure AD Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to Azure Active Directory > App registrations
   - Create new registration

2. **Configure Permissions**
   - Add Microsoft Graph permissions:
     - `Calendars.ReadWrite`
     - `Calendars.ReadWrite.Shared`
     - `User.Read`

3. **Create Client Secret**
   - Go to Certificates & secrets
   - Create new client secret

4. **Configure Redirect URI**
   - Add: `http://localhost:3000/api/auth/microsoft/callback`

5. **Webhook Setup (Production)**
   - Configure Microsoft Graph webhook subscription
   - Set notification URL: `https://your-domain.com/api/webhooks/microsoft`

### CalDAV Setup (Optional)

```env
# Add to .env.local
CALDAV_SERVER_URL=https://your-caldav-server.com
CALDAV_USERNAME=your_username
CALDAV_PASSWORD=your_password
```

## 🔧 Performance Optimization Details

### Database Indexes

The application includes optimized indexes for:

```typescript
// Events table
.by_user_time_range: ["userId", "startTime", "endTime"]
.by_user_category_time: ["userId", "categoryId", "startTime"]
.by_user_all_day: ["userId", "allDay", "startTime"]

// Sync queue
.by_user_provider_status: ["userId", "provider", "status"]
.by_provider_created: ["provider", "createdAt"]

// Event sync
.by_provider_status: ["provider", "syncStatus"]
.by_user_provider: ["providerId", "syncStatus"]
```

### Lazy Loading Implementation

Components are lazy-loaded for optimal performance:

```typescript
const LinearCalendarHorizontal = dynamic(
  () => import("@/components/calendar/LinearCalendarHorizontal"),
  { loading: () => <Skeleton className="h-full w-full" /> }
);
```

## 🛡️ Security Configuration

### Webhook Security

All webhooks include signature validation:

- **Google**: Uses Pub/Sub authentication
- **Microsoft**: Uses HMAC-SHA256 signature validation
- **Clerk**: Uses Svix signature verification

### Token Encryption

All calendar provider tokens are encrypted using AES-256-GCM:

```typescript
const encryptedToken = encryptToken(accessToken);
const decryptedToken = decryptToken(encryptedToken);
```

## 📊 Monitoring & Debugging

### Performance Monitoring

```typescript
// Check page load performance
GET / 200 in 2930ms (optimized to sub-second)

// Monitor AI API performance
POST /api/ai/chat 200 in 1748ms
```

### Debugging Tools

```bash
# Check Convex logs
npx convex logs

# Monitor database queries
npx convex query --watch

# Debug authentication
npx convex function auth.getUserByClerkId --args '{"clerkId":"user_123"}'
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-domain.com

# Convex production URL
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud

# Webhook secrets for production
GOOGLE_WEBHOOK_SECRET=your_google_webhook_secret
MICROSOFT_WEBHOOK_SECRET=your_microsoft_webhook_secret
```

### Build & Deploy

```bash
# Build optimized production bundle
pnpm build

# Deploy Convex functions
npx convex deploy

# Start production server
pnpm start
```

## 🐛 Troubleshooting

### Common Issues

**AI Features Not Working**
- Check `ANTHROPIC_API_KEY` is set correctly
- Verify Claude model names in `lib/ai-config.ts`
- Check network connectivity to Anthropic API

**Calendar Sync Issues**
- Verify OAuth credentials for each provider
- Check webhook endpoints are accessible
- Review Convex function logs for errors

**Performance Issues**
- Ensure all database indexes are deployed
- Check lazy loading is working correctly
- Monitor memory usage in production

**Authentication Errors**
- Verify Clerk configuration
- Check Convex authentication setup
- Review middleware configuration

### Debug Commands

```bash
# Check Convex deployment status
npx convex status

# View recent logs
npx convex logs --tail

# Test specific functions
npx convex function calendar.sync.scheduleSync --args '{"provider":"google","operation":"full_sync"}'
```

## 📚 Additional Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://docs.microsoft.com/graph/)
- [Clerk Authentication](https://clerk.com/docs)

## 🔄 Future Development

### Planned Features
- Enhanced AI scheduling with learning from user patterns
- Advanced calendar analytics and insights
- Team calendar sharing and collaboration
- Mobile app development
- Integration with additional calendar providers

### Contributing
1. Follow the existing code patterns and TypeScript standards
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure performance optimizations are maintained
5. Follow the token-only design system guidelines

---

**Version**: 0.3.2
**Last Updated**: January 26, 2025
**Status**: Production Ready with AI & Multi-Calendar Integration
