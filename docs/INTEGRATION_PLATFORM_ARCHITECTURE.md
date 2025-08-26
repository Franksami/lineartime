# LinearTime Calendar Integration Platform Architecture

> **Phase 2.6 Foundation Documentation**  
> **Status**: New Foundation (Everything before this is considered outdated)  
> **Last Updated**: January 2025

## Overview

LinearTime has evolved from a single calendar application to an enterprise-grade **Calendar Integration Platform** supporting 4 major calendar providers with unified synchronization, security, and real-time capabilities.

### Platform Identity

**Core Philosophy**: "Life is bigger than a week"

**Platform Architecture**:
- **Calendar Library Layer**: 10 integrated calendar libraries with unified CalendarProvider
- **Integration Platform Layer**: 4-provider calendar sync (Google, Microsoft, Apple CalDAV, Generic CalDAV)
- **Security Layer**: Server-side AES-256-GCM encryption via Convex
- **Real-time Layer**: Webhook notifications with automatic renewal
- **Sync Layer**: Background queue with exponential backoff

## Integration Architecture

### 4-Provider Calendar Integration Platform

LinearTime supports comprehensive integration with major calendar platforms:

#### **1. Google Calendar Integration**
- **Protocol**: OAuth 2.0 with REST API
- **Scopes**: `calendar.readonly`, `calendar.events`
- **Features**: Real-time webhook notifications, full CRUD operations
- **Implementation**: `convex/calendar/google.ts`
- **Webhooks**: `/api/webhooks/google/route.ts`

#### **2. Microsoft Graph Integration**  
- **Protocol**: OAuth 2.0 with Graph API
- **Permissions**: `Calendars.ReadWrite`
- **Features**: Push notifications, recurring event support
- **Implementation**: `convex/calendar/microsoft.ts`
- **Webhooks**: `/api/webhooks/microsoft/route.ts`

#### **3. Apple iCloud CalDAV**
- **Protocol**: CalDAV over HTTPS
- **Discovery**: `/.well-known/caldav`
- **Features**: Standards-compliant RFC4791 implementation
- **Authentication**: App-specific passwords
- **Implementation**: `convex/calendar/caldav.ts`

#### **4. Generic CalDAV Provider**
- **Protocol**: RFC4791 compliant CalDAV
- **Compatibility**: Any standards-compliant CalDAV server
- **Features**: Server discovery, multiple calendar support
- **Authentication**: Basic Auth or Digest Auth
- **Implementation**: `convex/calendar/caldav.ts`

### Provider Unified Architecture

```typescript
// Provider Registration System
interface CalendarProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'caldav';
  authConfig: OAuth2Config | CalDAVConfig;
  capabilities: ProviderCapabilities;
}

// Unified Event Interface
interface UnifiedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
  recurrence?: RecurrenceRule;
  providerId: string;
  providerEventId: string;
}
```

## Security Architecture

### Server-Side Token Encryption

All provider authentication tokens are encrypted server-side using **AES-256-GCM** encryption via Convex:

#### **Token Storage Flow**:
1. **Client Authentication**: User completes OAuth flow in browser
2. **Token Encryption**: Tokens immediately encrypted with AES-256-GCM on Convex server
3. **Secure Storage**: Encrypted tokens stored in Convex database with user association
4. **Token Retrieval**: Tokens decrypted server-side only when needed for API calls
5. **Zero Client Storage**: No tokens or credentials ever stored client-side

#### **Encryption Implementation**:
```typescript
// Server-side encryption (Convex)
import { encryptToken, decryptToken } from './security/encryption';

// Store encrypted token
const encryptedToken = await encryptToken({
  accessToken,
  refreshToken,
  expiresAt,
  providerId,
});

// Retrieve and decrypt for API calls
const decryptedToken = await decryptToken(encryptedTokenId);
```

#### **Environment Security**:
```bash
# Required encryption keys
CONVEX_ENCRYPTION_KEY=         # AES-256-GCM key
CONVEX_ENCRYPTION_ALGORITHM=aes-256-gcm
```

### Webhook Signature Verification

All webhook endpoints implement signature verification:

```typescript
// Google Webhook Verification
const signature = request.headers['x-goog-channel-token'];
const isValid = await verifyGoogleSignature(body, signature);

// Microsoft Graph Verification  
const validationToken = request.query.validationToken;
if (validationToken) return validationToken; // Subscription validation
```

## Real-Time Webhook System

### Push Notifications

**Google Calendar Webhooks**:
- **Endpoint**: `/api/webhooks/google/route.ts`
- **Mechanism**: Google Push Notifications
- **Payload**: Resource change notifications with sync tokens
- **Renewal**: Automatic subscription renewal before expiration

**Microsoft Graph Webhooks**:
- **Endpoint**: `/api/webhooks/microsoft/route.ts`  
- **Mechanism**: Microsoft Graph subscriptions
- **Payload**: Change notifications with resource data
- **Renewal**: Automatic renewal with exponential backoff

### Automatic Webhook Renewal

```typescript
// Renewal System Implementation
interface WebhookSubscription {
  id: string;
  providerId: string;
  userId: string;
  expiresAt: Date;
  subscriptionId: string;
  webhookUrl: string;
}

// Automatic renewal before expiration
const renewalScheduler = new WebhookRenewalScheduler({
  renewalThreshold: 24 * 60 * 60 * 1000, // 24 hours before expiration
  maxRetries: 3,
  backoffStrategy: 'exponential'
});
```

## Sync Queue Architecture

### Background Processing System

**Queue Implementation**:
- **Technology**: Convex background jobs with retry logic
- **Processing**: Async job processing with priority queuing
- **Retry Strategy**: Exponential backoff with circuit breaker
- **Monitoring**: Job status tracking and error reporting

```typescript
// Sync Job Structure
interface SyncJob {
  id: string;
  userId: string;
  providerId: string;
  type: 'full_sync' | 'incremental_sync' | 'webhook_sync';
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  error?: string;
}
```

### Sync Strategies

**Real-time Sync (Webhook-driven)**:
- Immediate processing for webhook notifications
- Delta sync using change tokens
- Conflict resolution with last-write-wins strategy

**Polling Sync (CalDAV)**:
- Configurable polling intervals (default: 15 minutes)
- ETag-based change detection
- Batch processing for multiple calendars

**Full Sync (Initial/Recovery)**:
- Complete calendar data synchronization
- Used for new provider connections
- Recovery mechanism for sync failures

## Event Transformation System

### Bidirectional Event Mapping

Events are transformed between provider-specific formats and LinearTime's unified format:

```typescript
// Provider-specific transformers
class GoogleEventTransformer {
  toUnified(googleEvent: GoogleEvent): UnifiedEvent { /* ... */ }
  fromUnified(unifiedEvent: UnifiedEvent): GoogleEvent { /* ... */ }
}

class MicrosoftEventTransformer {
  toUnified(graphEvent: GraphEvent): UnifiedEvent { /* ... */ }
  fromUnified(unifiedEvent: UnifiedEvent): GraphEvent { /* ... */ }
}

class CalDAVEventTransformer {
  toUnified(icalEvent: ICalEvent): UnifiedEvent { /* ... */ }
  fromUnified(unifiedEvent: UnifiedEvent): ICalEvent { /* ... */ }
}
```

### Timezone Handling

**Normalization Strategy**:
- All events converted to UTC for internal storage
- Timezone information preserved in metadata
- Client-side rendering in user's local timezone
- IANA timezone database for accurate conversions

### Conflict Resolution

**Resolution Strategies**:
- **Last Write Wins**: Default strategy for simple conflicts
- **Provider Priority**: Configurable provider priority order
- **Manual Resolution**: User interface for complex conflicts
- **Event Versioning**: Track changes for audit trail

## Calendar Library Integration

### 10 Calendar Library Support

The integration platform works seamlessly with all 10 supported calendar libraries:

1. **LinearCalendarHorizontal** (Foundation) - Core horizontal timeline
2. **FullCalendar Pro** - Professional calendar with advanced features
3. **Toast UI Calendar** - Drag & drop functionality and scheduling
4. **React Big Calendar** - React-native calendar with drag & drop
5. **React Infinite Calendar** - Infinite scrolling virtualized calendar
6. **PrimeReact Calendar** - Enterprise React calendar component
7. **MUI X Calendar** - Material Design calendar with date pickers
8. **React Calendar** - Lightweight React calendar component
9. **React DatePicker** - Date selection with calendar popup
10. **React Day Picker** - Flexible day picker component

### Unified CalendarProvider Architecture

```typescript
// CalendarProvider Context
const CalendarProvider = ({ children }) => {
  const [selectedLibrary, setSelectedLibrary] = useState('linear');
  const [events, setEvents] = useState([]);
  const [syncProviders, setSyncProviders] = useState([]);

  // Unified event operations work across all libraries
  const handleEventCreate = async (event) => {
    // 1. Create in selected calendar library
    await calendarLibraries[selectedLibrary].createEvent(event);
    
    // 2. Sync to all connected providers
    await syncToProviders(event, syncProviders);
    
    // 3. Update local state
    setEvents(prev => [...prev, event]);
  };

  return (
    <CalendarContext.Provider value={{
      selectedLibrary,
      setSelectedLibrary,
      events,
      handleEventCreate,
      syncProviders
    }}>
      {children}
    </CalendarContext.Provider>
  );
};
```

## Database Schema

### Provider Management Tables

```sql
-- Provider configurations
CREATE TABLE provider_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'google', 'microsoft', 'apple_caldav', 'generic_caldav'
  encrypted_credentials TEXT NOT NULL, -- AES-256-GCM encrypted
  provider_config JSONB, -- Provider-specific configuration
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook subscriptions
CREATE TABLE webhook_subscriptions (
  id TEXT PRIMARY KEY,
  provider_config_id TEXT REFERENCES provider_configs(id),
  subscription_id TEXT NOT NULL, -- Provider's subscription ID
  webhook_url TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sync jobs queue
CREATE TABLE sync_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_config_id TEXT REFERENCES provider_configs(id),
  job_type TEXT NOT NULL, -- 'full_sync', 'incremental_sync', 'webhook_sync'
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  job_data JSONB -- Job-specific data
);
```

### Event Storage

```sql
-- Unified events table
CREATE TABLE unified_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT, -- IANA timezone
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Provider event mappings
CREATE TABLE provider_event_mappings (
  id TEXT PRIMARY KEY,
  unified_event_id TEXT REFERENCES unified_events(id),
  provider_config_id TEXT REFERENCES provider_configs(id),
  provider_event_id TEXT NOT NULL, -- Provider's event ID
  etag TEXT, -- For change detection
  last_synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_config_id, provider_event_id)
);
```

## Performance Considerations

### Optimization Strategies

**Connection Pooling**:
- HTTP/2 connection reuse for provider APIs
- Connection pooling for database queries
- Rate limit management per provider

**Caching Layer**:
- Redis cache for frequently accessed events
- Provider API response caching with TTL
- Calendar rendering cache for UI libraries

**Background Processing**:
- Async job processing for sync operations
- Parallel processing of multiple provider syncs
- Queue prioritization for user-initiated operations

### Scalability Architecture

**Horizontal Scaling**:
- Stateless API design for easy horizontal scaling
- Database read replicas for query performance
- CDN caching for static calendar assets

**Resource Management**:
- Rate limiting per user and provider
- Connection limits to prevent resource exhaustion
- Graceful degradation during high load

## Monitoring & Observability

### Health Monitoring

**Provider Health Checks**:
```typescript
// Health check endpoints
interface ProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'down';
  lastSuccessfulSync: Date;
  errorRate: number;
  responseTime: number;
}
```

**Sync Monitoring**:
- Real-time sync job status tracking
- Error rate monitoring per provider
- Sync latency and performance metrics
- Dead letter queue for failed jobs

### Alerting System

**Critical Alerts**:
- Provider authentication failures
- Webhook subscription failures
- High sync error rates
- Database connection issues

**Performance Alerts**:
- Sync latency exceeding thresholds
- High resource utilization
- Queue backup alerts

## Production Deployment

### Environment Configuration

**Required Environment Variables**:
```bash
# Core Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://incredible-ibis-307.convex.cloud
CLERK_WEBHOOK_SECRET=whsec_[configured]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[configured]

# Encryption Configuration
CONVEX_ENCRYPTION_KEY=[AES-256-GCM-key]
CONVEX_ENCRYPTION_ALGORITHM=aes-256-gcm

# Provider Configurations
GOOGLE_CLIENT_ID=[oauth-client-id]
GOOGLE_CLIENT_SECRET=[oauth-client-secret]
MICROSOFT_CLIENT_ID=[azure-app-id]
MICROSOFT_CLIENT_SECRET=[azure-app-secret]

# Optional: Graceful fallbacks when missing
STRIPE_SECRET_KEY=sk_live_[configured]
STRIPE_WEBHOOK_SECRET=whsec_[configured]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[configured]
```

### Deployment Architecture

**Infrastructure Requirements**:
- **Database**: Convex (managed, real-time)
- **Authentication**: Clerk (managed user lifecycle)
- **Billing**: Stripe (optional, graceful fallbacks)
- **Hosting**: Vercel (recommended) or compatible platform
- **CDN**: Automatic via Vercel/Cloudflare

**Webhook Endpoints**:
- Production webhook URLs must be HTTPS
- Valid SSL certificates required
- Webhook signature verification enabled
- Rate limiting configured

### Security Checklist

**Pre-Deployment Security Validation**:
- [ ] All provider tokens encrypted with AES-256-GCM
- [ ] Webhook signature verification implemented
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting configured
- [ ] CORS policies configured
- [ ] Security headers implemented
- [ ] Audit logging enabled

## Migration Guide

### From Previous Calendar Implementations

**Breaking Changes**:
- Old calendar sync methods are deprecated
- Direct localStorage event storage replaced by Convex
- Manual provider configuration replaced by unified system

**Migration Path**:
1. **Data Migration**: Export existing events to unified format
2. **Provider Re-authentication**: Users must reconnect providers through new OAuth flow
3. **Library Compatibility**: All existing calendar libraries remain supported
4. **Feature Parity**: All previous features maintained or enhanced

### Backward Compatibility

**Preserved APIs**:
- Calendar library switching functionality
- Event CRUD operations
- Theme and customization systems
- Mobile and PWA features

**Deprecated Features**:
- Direct provider token storage in localStorage
- Manual calendar sync triggers
- Legacy webhook endpoints

## Next Phase: Development Roadmap

### Phase 2.7: Ultimate Calendar Dashboard
- Unified calendar dashboard with all providers
- Advanced analytics and insights
- Cross-provider conflict resolution UI
- Enhanced mobile synchronization

### Phase 2.8: Enterprise Features
- Multi-tenant support
- Advanced security compliance (SOC 2, GDPR)
- Enterprise SSO integration
- Advanced audit logging
- Custom provider integrations

### Phase 3.0: AI-Powered Platform
- AI scheduling optimization across providers
- Natural language event creation
- Smart conflict resolution
- Predictive calendar management

## Conclusion

LinearTime's Phase 2.6 foundation establishes a comprehensive **Calendar Integration Platform** that transforms the application from a simple calendar tool into an enterprise-grade synchronization platform. The architecture provides:

- **Unified Experience**: Single interface for all calendar providers
- **Enterprise Security**: Server-side encryption and comprehensive audit trails  
- **Real-time Synchronization**: Webhook-driven updates with automatic renewal
- **Scalable Architecture**: Designed for high availability and horizontal scaling
- **Developer-Friendly**: Comprehensive APIs and extension points

This foundation enables LinearTime to serve as a central calendar hub while maintaining the core philosophy that "Life is bigger than a week."