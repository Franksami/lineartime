# Linear Calendar API Reference (v0.3.2)

This document provides comprehensive API reference for Linear Calendar's backend endpoints, Convex functions, and external integrations.

## 🔗 API Endpoints

### Authentication Endpoints

#### Google Calendar OAuth
```http
GET /api/auth/google
```
Initiates Google OAuth flow for calendar integration.

**Response**: Redirect to Google authorization page

```http
GET /api/auth/google/callback
```
Handles Google OAuth callback and stores credentials.

**Query Parameters**:
- `code` - Authorization code from Google
- `state` - CSRF protection token

**Response**: Redirect to settings page with success/error status

#### Microsoft Outlook OAuth
```http
GET /api/auth/microsoft
```
Initiates Microsoft OAuth flow using MSAL.

**Response**: Redirect to Microsoft authorization page

```http
GET /api/auth/microsoft/callback
```
Handles Microsoft OAuth callback with token exchange.

**Query Parameters**:
- `code` - Authorization code from Microsoft
- `state` - CSRF protection token
- `error` - Error code (if applicable)

**Response**: Redirect to settings page with connection status

### AI Chat API

#### Chat with AI Assistant
```http
POST /api/ai/chat
```
Streaming AI chat with calendar context using Anthropic Claude.

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Schedule a meeting tomorrow at 2 PM"
    }
  ],
  "userId": "user_123",
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "events": [...], // Optional: current calendar events
  "webSearch": false // Optional: enable web search
}
```

**Response**: Server-sent events stream with AI responses

**Features**:
- Claude 3.5 Sonnet for complex scheduling tasks
- Claude 3 Haiku for fast parsing (default)
- Tool integration for calendar operations
- Real-time streaming responses
- Context-aware responses with calendar data

### Webhook Endpoints

#### Google Calendar Webhooks
```http
POST /api/webhooks/google
```
Handles Google Calendar push notifications.

**Headers**:
- `X-Goog-Channel-Token` - Channel token for verification
- `X-Goog-Resource-State` - Event state (exists, not_exists, sync)

**Response**: 200 OK

#### Microsoft Graph Webhooks
```http
POST /api/webhooks/microsoft
```
Handles Microsoft Graph calendar change notifications.

**Headers**:
- `x-ms-notification-signature` - HMAC-SHA256 signature

**Request Body**:
```json
{
  "value": [
    {
      "subscriptionId": "subscription-id",
      "clientState": "client-state",
      "changeType": "updated",
      "resource": "users/user-id/events/event-id",
      "resourceData": {
        "@odata.type": "#Microsoft.Graph.Event",
        "@odata.id": "users/user-id/events/event-id"
      }
    }
  ]
}
```

**Response**: 200 OK

#### Clerk User Lifecycle Webhooks
```http
POST /api/webhooks/clerk
```
Handles Clerk user lifecycle events (create, update, delete).

**Headers**:
- `svix-id` - Webhook ID
- `svix-timestamp` - Timestamp
- `svix-signature-1` - HMAC-SHA256 signature

**Request Body**:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_123",
    "email_addresses": [...],
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response**: 200 OK

## 🔧 Convex Functions

### Authentication Functions

#### `users.createUser`
Creates a new user from Clerk webhook data.

**Parameters**:
```typescript
{
  clerkId: v.string(),
  email: v.string(),
  firstName?: v.string(),
  lastName?: v.string(),
  imageUrl?: v.string()
}
```

#### `users.getUserByClerkId`
Retrieves user by Clerk ID.

**Parameters**:
```typescript
{
  clerkId: v.string()
}
```

### Calendar Provider Management

#### `calendar.providers.connectProvider`
Connects a new calendar provider or updates existing connection.

**Parameters**:
```typescript
{
  provider: "google" | "microsoft" | "apple" | "caldav",
  accessToken: {
    encrypted: v.string(),
    iv: v.string(),
    tag: v.string()
  },
  refreshToken?: {
    encrypted: v.string(),
    iv: v.string(),
    tag: v.string()
  },
  expiresAt?: v.number(),
  providerAccountId: v.string(),
  settings: {
    calendars: Array<{
      id: v.string(),
      name: v.string(),
      color: v.string(),
      syncEnabled: v.boolean(),
      isPrimary?: v.boolean()
    }>,
    syncDirection?: "pull" | "push" | "bidirectional",
    conflictResolution?: "local" | "remote" | "newest" | "manual"
  }
}
```

#### `calendar.providers.getConnectedProviders`
Retrieves all connected providers for the current user.

**Returns**:
```typescript
Array<{
  _id: string,
  provider: string,
  providerAccountId: string,
  lastSyncAt?: number,
  settings: object,
  hasRefreshToken: boolean,
  tokenExpiresAt?: number,
  webhookExpiry?: number
}>
```

### Calendar Synchronization

#### `calendar.sync.scheduleSync`
Schedules a calendar synchronization operation.

**Parameters**:
```typescript
{
  provider: "google" | "microsoft",
  operation: "full_sync" | "incremental_sync" | "webhook_update",
  priority?: number,
  data?: any // Additional operation data
}
```

#### `calendar.sync.processWebhookUpdate`
Processes webhook updates from calendar providers.

**Parameters**:
```typescript
{
  providerId: v.id("calendarProviders"),
  eventData: object,
  operation: string
}
```

### AI Chat Functions

#### `aiChat.ensureChat`
Creates or retrieves existing chat session.

**Parameters**:
```typescript
{
  userId: v.id("users"),
  title?: v.string()
}
```

#### `aiChat.appendMessages`
Appends messages to AI chat session.

**Parameters**:
```typescript
{
  chatId: v.id("aiChats"),
  messages: Array<{
    role: v.string(),
    parts: v.array(v.any())
  }>
}
```

#### `aiChat.listChats`
Retrieves user's AI chat sessions.

**Parameters**:
```typescript
{
  userId: v.id("users")
}
```

### Event Management

#### `events.createEvent`
Creates a new calendar event.

**Parameters**:
```typescript
{
  userId: v.id("users"),
  title: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  description?: v.string(),
  location?: v.string(),
  category: v.string(),
  allDay?: v.boolean(),
  priority?: v.number(),
  tags?: v.array(v.string())
}
```

#### `events.updateEvent`
Updates an existing calendar event.

**Parameters**:
```typescript
{
  eventId: v.id("events"),
  title?: v.string(),
  startDate?: v.string(),
  endDate?: v.string(),
  description?: v.string(),
  location?: v.string(),
  category?: v.string(),
  allDay?: v.boolean(),
  priority?: v.number(),
  tags?: v.array(v.string())
}
```

#### `events.deleteEvent`
Deletes a calendar event.

**Parameters**:
```typescript
{
  eventId: v.id("events")
}
```

### Event Synchronization

#### `eventSync.createSyncMapping`
Creates a mapping between local and provider events.

**Parameters**:
```typescript
{
  localEventId: v.id("events"),
  providerId: v.id("calendarProviders"),
  providerEventId: v.string(),
  syncStatus: "pending" | "synced" | "failed",
  lastSyncAt?: v.number()
}
```

## 📊 Database Schema

### Core Tables

#### `users`
```typescript
{
  clerkId: v.string(), // Clerk user ID
  email: v.string(),
  firstName?: v.string(),
  lastName?: v.string(),
  imageUrl?: v.string(),
  subscriptionStatus: v.string(), // free, pro, enterprise
  createdAt: v.number(),
  updatedAt: v.number()
}
```

#### `events`
```typescript
{
  userId: v.id("users"),
  title: v.string(),
  startDate: v.string(), // ISO 8601
  endDate: v.string(), // ISO 8601
  description?: v.string(),
  location?: v.string(),
  category: v.string(),
  allDay: v.boolean(),
  priority: v.number(), // 1-5
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number()
}
```

#### `calendarProviders`
```typescript
{
  userId: v.id("users"),
  provider: v.string(), // google, microsoft, apple, caldav
  accessToken: {
    encrypted: v.string(),
    iv: v.string(),
    tag: v.string()
  },
  refreshToken?: {
    encrypted: v.string(),
    iv: v.string(),
    tag: v.string()
  },
  expiresAt?: v.number(),
  providerAccountId: v.string(),
  lastSyncAt?: v.number(),
  syncToken?: v.string(), // Google sync token
  deltaLink?: v.string(), // Microsoft delta link
  settings: {
    calendars: Array<{
      id: v.string(),
      name: v.string(),
      color: v.string(),
      syncEnabled: v.boolean(),
      isPrimary?: v.boolean()
    }>,
    syncDirection: "pull" | "push" | "bidirectional",
    conflictResolution: "local" | "remote" | "newest" | "manual",
    subscriptions?: Array<{
      id: v.string(),
      resource: v.string(),
      expirationDateTime: v.string(),
      createdAt: v.number()
    }>
  },
  createdAt: v.number(),
  updatedAt: v.number()
}
```

#### `syncQueue`
```typescript
{
  userId: v.id("users"),
  provider: v.string(),
  operation: v.string(), // full_sync, incremental_sync, webhook_update, event_create, event_update, event_delete
  status: v.string(), // pending, processing, completed, failed
  priority: v.number(), // 1-10, higher = more important
  data?: v.any(), // Operation-specific data
  error?: v.string(),
  retryCount: v.number(),
  nextRetry?: v.number(),
  createdAt: v.number(),
  updatedAt: v.number()
}
```

#### `eventSync`
```typescript
{
  localEventId: v.id("events"),
  providerId: v.id("calendarProviders"),
  providerEventId: v.string(),
  syncStatus: v.string(), // pending, synced, failed, conflict
  lastSyncAt: v.number(),
  providerData?: v.any(), // Latest provider event data
  createdAt: v.number()
}
```

#### `aiChats`
```typescript
{
  userId: v.id("users"),
  title?: v.string(),
  createdAt: v.number(),
  updatedAt: v.number()
}
```

#### `aiMessages`
```typescript
{
  chatId: v.id("aiChats"),
  role: v.string(), // user, assistant, system
  parts: v.array(v.any()), // AI SDK message parts
  createdAt: v.number()
}
```

#### `aiEvents`
```typescript
{
  userId?: v.id("users"),
  chatId?: v.id("aiChats"),
  eventType: v.string(), // rate, copy, regenerate, applySuggestion
  data?: v.any(),
  createdAt: v.number()
}
```

## 🔐 Security Features

### Token Encryption
All calendar provider tokens are encrypted using AES-256-GCM:

```typescript
// Encryption
const encryptedToken = encryptToken(accessToken, encryptionKey);

// Decryption
const accessToken = decryptToken(encryptedToken);
```

### Webhook Verification
All webhooks include signature verification:

**Google**: Uses channel tokens and Pub/Sub authentication
**Microsoft**: Uses HMAC-SHA256 with shared secret
**Clerk**: Uses Svix signature verification

### Authentication Flow
1. **OAuth Initiation** → Provider authorization page
2. **Token Exchange** → Access/refresh tokens stored encrypted
3. **Token Refresh** → Automatic renewal before expiration
4. **Token Encryption** → AES-256-GCM encryption at rest

## 📈 Performance Optimizations

### Database Indexes
```typescript
// Events table - optimized for common queries
.by_user_time_range: ["userId", "startTime", "endTime"]
.by_user_category_time: ["userId", "categoryId", "startTime"]
.by_user_all_day: ["userId", "allDay", "startTime"]

// Sync operations - optimized for queue processing
.by_user_provider_status: ["userId", "provider", "status"]
.by_provider_created: ["provider", "createdAt"]

// AI features - optimized for chat operations
aiChats.by_user_updated: ["userId", "updatedAt"]
aiMessages.by_chat_created: ["chatId", "createdAt"]
```

### Frontend Optimizations
- **Dynamic Imports**: Lazy loading for calendar components
- **React.memo**: Component memoization for performance
- **useCallback**: Stable function references
- **Suspense Boundaries**: Graceful loading states

## 🧪 Testing Endpoints

### Health Check
```http
GET /api/health
```
Returns server health status.

### Test AI Integration
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"userId":"test"}'
```

### Test Webhook Endpoints
```bash
# Test Google webhook validation
curl -X GET "http://localhost:3000/api/webhooks/google?validationToken=test"

# Test Microsoft webhook
curl -X POST http://localhost:3000/api/webhooks/microsoft \
  -H "Content-Type: application/json" \
  -d '{"value":[{"subscriptionId":"test","resource":"test"}]}'
```

## 🚀 Production Deployment

### Environment Variables
```env
# Production URLs
NEXT_PUBLIC_URL=https://your-domain.com
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud

# Webhook Secrets
GOOGLE_WEBHOOK_SECRET=your_google_secret
MICROSOFT_WEBHOOK_SECRET=your_microsoft_secret
CLERK_WEBHOOK_SECRET=whsec_your_clerk_secret

# Performance Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Build Commands
```bash
# Build optimized application
pnpm build

# Deploy Convex functions
npx convex deploy

# Start production server
pnpm start
```

### Monitoring
```bash
# Check Convex deployment
npx convex status

# View logs
npx convex logs --tail

# Monitor performance
npx convex query --watch
```

---

**Version**: 0.3.2
**Last Updated**: January 26, 2025
**API Stability**: Stable
