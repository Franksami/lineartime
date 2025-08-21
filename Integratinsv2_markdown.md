# Technical Product Requirements Document: Enterprise Calendar Integration Platform

## Executive Summary

This Technical PRD defines the architecture and implementation requirements for a comprehensive calendar integration platform supporting Google Calendar, Microsoft Outlook, Apple iCloud, Notion, and Obsidian. The system is designed to handle 10,000+ events with real-time synchronization, built on Next.js 15.5 and optimized for implementation using Claude Code within Cursor IDE. The architecture employs microservices patterns, OAuth 2.0 authentication, CalDAV protocols, and Redis caching to deliver sub-second response times at enterprise scale.

## 1. System Architecture Overview

### Core Architecture Pattern

The platform utilizes a **hybrid microservices architecture** with event-driven communication for real-time synchronization. The system separates concerns into distinct services while maintaining a unified API gateway for client access.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Clients   │    │  Mobile Apps    │    │   Obsidian      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────────┐
              │         API Gateway                 │
              │  - Rate Limiting (Redis)            │
              │  - Authentication (NextAuth.js v5)  │
              │  - Request Routing                  │
              └─────────────────────────────────────┘
                                 │
              ┌─────────────────────────────────────┐
              │      Sync Orchestrator              │
              │  - Delta Sync Management            │
              │  - Conflict Resolution (CRDT)       │
              │  - Event Deduplication              │
              └─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Calendar Clients│    │  Queue Manager  │    │  Event Store    │
│ - Google API v3 │    │  - BullMQ       │    │  - PostgreSQL   │
│ - MS Graph      │    │  - Inngest      │    │  - Event Log    │
│ - tsdav (CalDAV)│    │  - Temporal     │    │  - Redis Cache  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Core Framework:** Next.js 15.5  
**Authentication:** NextAuth.js v5.0.0-beta.25  
**Database:** PostgreSQL 15 with Prisma ORM  
**Caching:** Redis 7.0 with clustering  
**Queue Management:** BullMQ 5.0  
**Real-time Updates:** WebSockets (ws) / Server-Sent Events  
**Calendar APIs:** googleapis@156.0.0, @microsoft/microsoft-graph-client@3.0.7, @notionhq/client@2.2.15, tsdav@2.1.5

## 2. Authentication & OAuth 2.0 Implementation

### 2.1 NextAuth.js v5 Configuration

**File: `/auth.ts`**
```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile https://www.googleapis.com/auth/calendar"
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.AUTH_AZURE_AD_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email https://graph.microsoft.com/calendars.readwrite offline_access"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          provider: account.provider,
        }
      }
      return token
    }
  }
})
```

### 2.2 Token Storage Schema

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  calendar_id       String? // Primary calendar ID
  sync_token        String? // For incremental sync
  webhook_id        String? // For notification webhooks
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

## 3. Calendar Provider Integrations

### 3.1 Google Calendar Integration

**Implementation Requirements:**
- Google Calendar API v3 with TypeScript support
- Push notifications via Google Pub/Sub
- Batch operations for performance
- RRULE support for recurring events

```typescript
class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  async createEvent(calendarId: string, event: Schema$Event): Promise<Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId,
      resource: event
    });
    return response.data;
  }

  async setupWebhook(calendarId: string, webhookUrl: string) {
    const channelId = generateUUID();
    const watchResponse = await this.calendar.events.watch({
      calendarId,
      resource: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: 'verification-token'
      }
    });
    return watchResponse.data;
  }
}
```

### 3.2 Microsoft Outlook Integration

**Implementation Requirements:**
- Microsoft Graph API v1.0
- Delta query for incremental sync
- Batch request support

```typescript
class OutlookCalendarService {
  async getDeltaChanges(deltaUrl?: string): Promise<DeltaResult> {
    const url = deltaUrl || '/me/events/delta';
    const response = await fetch(`https://graph.microsoft.com/v1.0${url}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    const data = await response.json();
    return {
      changes: data.value,
      deltaLink: data['@odata.deltaLink'],
      nextLink: data['@odata.nextLink']
    };
  }
}
```

### 3.3 Apple iCloud Calendar (CalDAV)

**Implementation Requirements:**
- tsdav library for CalDAV protocol
- App-specific passwords for authentication
- iCalendar format parsing

```typescript
import { createDAVClient, DAVClient } from 'tsdav';

export const createiCloudClient = async (
  username: string, 
  appPassword: string
): Promise<DAVClient> => {
  const client = await createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: {
      username,
      password: appPassword // App-specific password required
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav'
  });
  return client;
};
```

### 3.4 Notion Integration

**Implementation Requirements:**
- Notion API v2 with database support
- Rate limiting (3 requests/second)
- Custom OAuth provider implementation

```typescript
class NotionCalendarClient {
  private notion: Client;
  
  constructor(apiKey: string, databaseId: string) {
    this.notion = new Client({
      auth: apiKey,
      notionVersion: '2022-06-28'
    });
    this.databaseId = databaseId;
  }
  
  async createEvent(eventData: CalendarEvent): Promise<string> {
    const response = await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: this.mapToNotionProperties(eventData)
    });
    return response.id;
  }
}
```

### 3.5 Obsidian Integration

**Implementation Requirements:**
- Plugin development with Obsidian API
- Markdown frontmatter for event metadata
- URI protocol for deep linking
- Local vault synchronization

```typescript
export default class CalendarPlugin extends Plugin {
  async onload() {
    this.registerView(CALENDAR_VIEW_TYPE, (leaf) => {
      return new CalendarView(leaf);
    });
    
    this.registerEvent(
      this.app.vault.on('modify', this.onFileModify.bind(this))
    );
  }
  
  async readCalendarData(file: TFile): Promise<CalendarEvent> {
    const fileCache = this.app.metadataCache.getFileCache(file);
    const frontmatter = fileCache?.frontmatter;
    
    return {
      id: file.path,
      title: file.basename,
      date: moment(frontmatter.date),
      startTime: frontmatter.startTime,
      endTime: frontmatter.endTime,
      allDay: frontmatter.allDay || false
    };
  }
}
```

## 4. Sync Engine Architecture

### 4.1 Bidirectional Sync Algorithm

**Conflict Resolution Strategy:** Conflict-free Replicated Data Types (CRDTs) with vector clocks

```typescript
class VectorClock {
  private clocks: Map<string, number> = new Map();
  
  increment(nodeId: string): void {
    this.clocks.set(nodeId, (this.clocks.get(nodeId) || 0) + 1);
  }
  
  compare(other: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
    let isLessOrEqual = true;
    let isGreaterOrEqual = true;
    
    const allNodes = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    
    for (const nodeId of allNodes) {
      const thisValue = this.clocks.get(nodeId) || 0;
      const otherValue = other.clocks.get(nodeId) || 0;
      
      if (thisValue > otherValue) isLessOrEqual = false;
      if (thisValue < otherValue) isGreaterOrEqual = false;
    }
    
    if (isLessOrEqual && isGreaterOrEqual) return 'equal';
    if (isLessOrEqual) return 'before';
    if (isGreaterOrEqual) return 'after';
    return 'concurrent';
  }
}
```

### 4.2 Delta Sync Implementation

```typescript
class CalDAVDeltaSync {
  async performDeltaSync(calendar: Calendar, lastSyncToken?: string): Promise<SyncResult> {
    if (!lastSyncToken) {
      return this.performFullSync(calendar);
    }
    
    const request = `
      <d:sync-collection xmlns:d="DAV:">
        <d:sync-token>${lastSyncToken}</d:sync-token>
        <d:sync-level>1</d:sync-level>
        <d:prop>
          <d:getetag/>
          <c:calendar-data xmlns:c="urn:ietf:params:xml:ns:caldav"/>
        </d:prop>
      </d:sync-collection>
    `;
    
    const response = await this.sendRequest(request);
    return this.processDeltaResponse(response);
  }
}
```

### 4.3 Queue Management with BullMQ

```typescript
import { Queue, Worker } from 'bullmq';

class CalendarSyncQueue {
  private queue: Queue;
  private worker: Worker;
  
  constructor() {
    this.queue = new Queue('calendar-sync', {
      connection: { host: 'localhost', port: 6379 }
    });
    
    this.worker = new Worker('calendar-sync', async (job) => {
      switch (job.name) {
        case 'full-sync':
          return this.performFullSync(job.data);
        case 'delta-sync':
          return this.performDeltaSync(job.data);
        case 'event-update':
          return this.updateEvent(job.data);
      }
    }, {
      connection: { host: 'localhost', port: 6379 },
      concurrency: 10
    });
  }
  
  async scheduleSync(userId: string, calendarId: string): Promise<void> {
    await this.queue.add('delta-sync', {
      userId,
      calendarId,
      timestamp: Date.now()
    }, {
      delay: 30000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
}
```

## 5. Data Models

### 5.1 Database Schema

```sql
-- Events table with optimized indexes
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50),
    location TEXT,
    created_by UUID NOT NULL,
    calendar_id UUID NOT NULL,
    recurrence_rule TEXT,
    parent_event_id UUID,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance-critical indexes
CREATE INDEX CONCURRENTLY idx_events_tenant_time 
    ON events (tenant_id, start_time, end_time) 
    WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_events_calendar_time 
    ON events (calendar_id, start_time) 
    WHERE deleted_at IS NULL;

-- BRIN index for time-series data
CREATE INDEX CONCURRENTLY idx_events_time_brin 
    ON events USING brin(start_time, end_time);
```

### 5.2 GraphQL Schema

```graphql
type Event {
    id: ID!
    title: String!
    description: String
    startTime: DateTime!
    endTime: DateTime!
    isAllDay: Boolean!
    location: String
    timezone: String
    creator: User!
    calendar: Calendar!
    attendees: [EventAttendee!]!
    recurrenceRule: RecurrenceRule
    parentEvent: Event
    reminders: [Reminder!]!
    createdAt: DateTime!
    updatedAt: DateTime!
}

type Query {
    calendarEvents(
        calendarIds: [ID!]
        start: DateTime!
        end: DateTime!
        timezone: String
    ): [Event!]!
    
    checkAvailability(
        userIds: [ID!]!
        start: DateTime!
        end: DateTime!
    ): [UserAvailability!]!
}

type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
}

type Subscription {
    eventUpdated(calendarId: ID!): Event!
    eventCreated(calendarId: ID!): Event!
}
```

## 6. Performance Optimization

### 6.1 Redis Caching Strategy

```redis
# Event Key Structure
event:{event_id} -> JSON event data
user:{user_id}:events:{date_range} -> Set of event IDs
calendar:{calendar_id}:events:{date_range} -> Set of event IDs
calendar_view:{user_id}:{view_type}:{date} -> Rendered calendar data

# Configuration
maxmemory-policy allkeys-lru
maxmemory 8gb
cluster-enabled yes
```

### 6.2 Virtual Scrolling Implementation

```jsx
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualCalendarGrid = memo(({ events, viewType, onEventClick }) => {
    const Cell = memo(({ columnIndex, rowIndex, style }) => {
        const cellEvents = getEventsForCell(events, rowIndex, columnIndex);
        return (
            <div style={style} className="calendar-cell">
                {cellEvents.map(event => (
                    <EventComponent 
                        key={event.id} 
                        event={event} 
                        onClick={onEventClick}
                    />
                ))}
            </div>
        );
    });

    return (
        <Grid
            columnCount={7}
            columnWidth={200}
            height={600}
            rowCount={Math.ceil(events.length / 7)}
            rowHeight={150}
            width={'100%'}
            overscanRowCount={2}
        >
            {Cell}
        </Grid>
    );
});
```

### 6.3 WebSocket Real-time Updates

```javascript
class CalendarWebSocketManager {
    constructor() {
        this.userConnections = new Map();
        this.calendarSubscriptions = new Map();
    }

    handleConnection(ws, userId) {
        this.userConnections.set(userId, ws);
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            this.handleCalendarMessage(message, userId);
        });
    }

    broadcastEventUpdate(calendarId, eventData) {
        const subscribers = this.calendarSubscriptions.get(calendarId) || [];
        subscribers.forEach(userId => {
            const ws = this.userConnections.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'EVENT_UPDATE',
                    calendarId,
                    data: eventData
                }));
            }
        });
    }
}
```

## 7. Security Implementation

### 7.1 Token Encryption

```typescript
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
}
```

### 7.2 Rate Limiting

```typescript
export class RateLimiter {
  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    
    const lua = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local windowMs = tonumber(ARGV[3])
      
      redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
      local current = redis.call('ZCARD', key)
      
      if current < limit then
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
        return {1, limit - current - 1, now + windowMs}
      else
        return {0, 0, now + windowMs}
      end
    `;
    
    const [allowed, remaining, resetTime] = await this.redis.eval(
      lua, 1, key, limit, now, windowMs
    );
    
    return { allowed: allowed === 1, remaining, resetTime };
  }
}
```

## 8. Testing Strategy

### 8.1 Unit Testing with Vitest

```javascript
import { describe, test, expect, beforeEach } from 'vitest';
import { CalendarService } from '../services/CalendarService';

describe('CalendarService', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    calendarService = new CalendarService();
  });

  test('should create calendar event', async () => {
    const event = {
      title: 'Test Meeting',
      start: new Date('2024-01-01T10:00:00'),
      end: new Date('2024-01-01T11:00:00')
    };
    
    const result = await calendarService.createEvent(event);
    expect(result).toHaveProperty('id');
    expect(result.title).toBe(event.title);
  });
});
```

### 8.2 API Mocking with MSW

```javascript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://www.googleapis.com/calendar/v3/calendars/:calendarId/events', () => {
    return HttpResponse.json({
      items: [{
        id: 'event-123',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z' }
      }]
    });
  })
];
```

### 8.3 Load Testing Configuration

```javascript
// K6 load test
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(99)<600'],
    http_req_failed: ['rate<0.1']
  }
};
```

## 9. Development Workflow

### 9.1 Cursor IDE Configuration

**File Structure for AI Development:**
```
project-root/
├── docs/
│   ├── PRD.md                    # This document
│   ├── api-specs.md              # API documentation
│   └── architecture.md           # System architecture
├── .cursor/
│   └── rules/
│       ├── dev_workflow.mdc      # Development workflow rules
│       ├── frontend.mdc          # Frontend-specific rules
│       └── backend.mdc           # Backend-specific rules
├── .cursorrules                  # Legacy format
└── CLAUDE.md                     # Claude Code context file
```

**.cursorrules Configuration:**
```markdown
# Calendar Integration Project Rules

## Stack Requirements
- Use TypeScript for all new code
- Next.js 15.5 with App Router
- PostgreSQL with Prisma ORM
- Redis for caching

## Calendar Integration Patterns
- Use official calendar APIs
- Implement webhook handlers for real-time updates
- Follow OAuth 2.0 for authentication
- Use proper error handling for API failures

## Code Organization
- Modular architecture with clear separation
- API layer, service layer, data layer
- Calendar-specific services in /src/services/calendar/
```

### 9.2 CI/CD Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:unit
        
      - name: Build application
        run: npm run build
```

## 10. Monitoring & Observability

### 10.1 Sentry Configuration

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});
```

### 10.2 Metrics Collection

```javascript
export class CalendarMetrics {
  static recordSyncDuration(provider: string, duration: number) {
    statsd.timing(`sync.duration`, duration, [`provider:${provider}`]);
  }

  static recordSyncSuccess(provider: string) {
    statsd.increment(`sync.success`, 1, [`provider:${provider}`]);
  }
}
```

## 11. Acceptance Criteria

### Core Functionality
- ✅ Support for 5 calendar providers (Google, Outlook, Apple, Notion, Obsidian)
- ✅ Real-time bidirectional synchronization
- ✅ Handle 10,000+ events with sub-second response time
- ✅ OAuth 2.0 authentication for all providers
- ✅ Conflict resolution for concurrent edits
- ✅ Recurring event support with RRULE

### Performance Requirements
- ✅ Calendar view load time < 100ms
- ✅ Event creation < 50ms
- ✅ Cache hit ratio > 95%
- ✅ Support 1000+ concurrent users
- ✅ 99.9% uptime SLA

### Security Requirements
- ✅ Encrypted token storage
- ✅ GDPR compliance
- ✅ Rate limiting per user/API
- ✅ Audit logging for all operations

## 12. Rollout Plan

### Phase 1: Core Infrastructure (Weeks 1-2)
- Set up Next.js 15.5 project structure
- Implement NextAuth.js v5 authentication
- Configure PostgreSQL and Redis
- Deploy basic API gateway

### Phase 2: Provider Integrations (Weeks 3-5)
- Google Calendar integration
- Microsoft Outlook integration
- Apple iCloud CalDAV implementation
- Basic sync engine

### Phase 3: Advanced Features (Weeks 6-7)
- Notion and Obsidian integrations
- Real-time WebSocket updates
- Conflict resolution with CRDTs
- Performance optimization

### Phase 4: Production Readiness (Week 8)
- Load testing and optimization
- Security audit
- Monitoring setup
- Documentation completion

## Key NPM Dependencies

```json
{
  "dependencies": {
    "next": "^15.5.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.2",
    "@prisma/client": "^5.22.0",
    "googleapis": "^156.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@notionhq/client": "^2.2.15",
    "tsdav": "^2.1.5",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",
    "react-window": "^1.8.10"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "msw": "^2.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

This PRD provides a comprehensive blueprint for implementing enterprise-grade calendar integrations optimized for AI-assisted development in Cursor IDE. Each component includes production-ready code examples, architectural patterns, and clear implementation guidelines to ensure successful deployment at scale.