# Command Center Calendar Production Deployment Guide

> **Phase 2.6 Foundation Documentation**  
> **Production Deployment for Calendar Integration Platform**  
> **Last Updated**: January 2025

## Overview

This guide covers the complete production deployment of Command Center Calendar's calendar integration platform including 4-provider synchronization, enterprise security, and scalable architecture.

## Infrastructure Requirements

### Platform Specifications

**Recommended Hosting Platforms**:
- **Primary**: Vercel (optimized for Next.js)
- **Alternative**: Railway, Render, AWS Amplify, or Netlify
- **Enterprise**: Self-hosted with Docker containers

**System Requirements**:
- **Node.js**: v18.17.0 or higher (LTS recommended)
- **Memory**: Minimum 512MB, Recommended 1GB+
- **Storage**: 1GB+ for application and logs
- **Bandwidth**: Unlimited or high-volume plan for webhook traffic

### Database & Backend Services

**Convex (Required)**:
- Production Convex deployment
- Real-time database with webhook handling
- Automatic scaling and backup
- Global edge distribution

**External Services**:
- **Clerk**: Production authentication service
- **Stripe**: Production billing (optional with graceful fallbacks)
- **Provider APIs**: Google Calendar, Microsoft Graph, CalDAV servers

## Environment Configuration

### Core Production Environment Variables

```bash
#!/bin/bash
# Command Center Calendar Production Environment Configuration

# === CORE PLATFORM (REQUIRED) ===
export NODE_ENV="production"
export NEXT_PUBLIC_APP_URL="https://lineartime.app"

# Convex Configuration
export NEXT_PUBLIC_CONVEX_URL="https://incredible-ibis-307.convex.cloud"
export CONVEX_DEPLOY_KEY="[convex-production-deploy-key]"

# Authentication (Clerk)
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_[production-key]"
export CLERK_SECRET_KEY="sk_live_[production-secret]"
export CLERK_WEBHOOK_SECRET="whsec_[production-webhook-secret]"

# === CALENDAR INTEGRATION PLATFORM (REQUIRED) ===

# Server-Side Encryption (CRITICAL SECURITY)
export CONVEX_ENCRYPTION_MASTER_KEY="[base64-encoded-256-bit-key]"
export CONVEX_ENCRYPTION_SALT="[base64-encoded-128-bit-salt]"
export CONVEX_ENCRYPTION_ALGORITHM="AES-256-GCM"
export CONVEX_KEY_ROTATION_SCHEDULE="90d"  # Key rotation every 90 days

# Google Calendar Integration
export GOOGLE_CLIENT_ID="[google-oauth-client-id]"
export GOOGLE_CLIENT_SECRET="[google-oauth-client-secret]"
export GOOGLE_WEBHOOK_TOKEN="[google-webhook-verification-token]"
export GOOGLE_REDIRECT_URI="https://lineartime.app/auth/google/callback"

# Microsoft Graph Integration
export MICROSOFT_CLIENT_ID="[azure-application-id]"
export MICROSOFT_CLIENT_SECRET="[azure-application-secret]"
export MICROSOFT_TENANT_ID="common"  # Multi-tenant support
export MICROSOFT_WEBHOOK_SECRET="[microsoft-webhook-signature-secret]"
export MICROSOFT_REDIRECT_URI="https://lineartime.app/auth/microsoft/callback"

# === WEBHOOK CONFIGURATION (CRITICAL) ===

# Webhook Base URLs (Must be HTTPS in production)
export GOOGLE_WEBHOOK_URL="https://lineartime.app/api/webhooks/google"
export MICROSOFT_WEBHOOK_URL="https://lineartime.app/api/webhooks/microsoft"
export MICROSOFT_LIFECYCLE_URL="https://lineartime.app/api/webhooks/microsoft/lifecycle"

# Webhook Security & Performance
export WEBHOOK_TIMEOUT_MS="30000"           # 30 second timeout
export WEBHOOK_RETRY_ATTEMPTS="3"           # Max retry attempts
export WEBHOOK_RATE_LIMIT="1000"           # Requests per hour per provider
export WEBHOOK_RENEWAL_THRESHOLD_HOURS="24" # Renew 24h before expiration

# === SYNC QUEUE CONFIGURATION ===

# Background Job Processing
export SYNC_CONCURRENT_JOBS="10"            # Concurrent sync processors
export SYNC_MAX_RETRIES="5"                # Max retry attempts
export SYNC_TIMEOUT_MS="600000"            # 10 minute job timeout
export SYNC_BATCH_SIZE="100"               # Events per batch
export SYNC_RATE_LIMIT_WINDOW="3600"       # Rate limiting window (1 hour)

# Provider-Specific Rate Limits
export GOOGLE_API_RATE_LIMIT="1000"        # Google requests/hour
export MICROSOFT_API_RATE_LIMIT="10000"    # Microsoft requests/hour
export CALDAV_API_RATE_LIMIT="100"         # CalDAV requests/hour
export CALDAV_POLLING_INTERVAL="900000"    # 15 minutes

# === BILLING INTEGRATION (OPTIONAL) ===

# Stripe Configuration (Graceful fallbacks if missing)
export STRIPE_SECRET_KEY="sk_live_[production-stripe-key]"
export STRIPE_WEBHOOK_SECRET="whsec_[stripe-webhook-secret]"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_[stripe-publishable-key]"

# === MONITORING & OBSERVABILITY ===

# Application Monitoring
export MONITORING_ENABLED="true"
export METRICS_COLLECTION_INTERVAL="60000"  # 1 minute
export ERROR_REPORTING_ENABLED="true"
export PERFORMANCE_MONITORING_ENABLED="true"

# Logging Configuration
export LOG_LEVEL="INFO"                     # INFO, WARN, ERROR for production
export AUDIT_LOG_RETENTION="90d"           # Retain audit logs for 90 days
export SECURITY_LOG_LEVEL="WARN"           # Security event logging

# Alert Configuration
export ALERT_WEBHOOK_URL="[slack-webhook-url]"
export ALERT_EMAIL="alerts@lineartime.app"
export CRITICAL_ALERT_THRESHOLD="0.15"     # 15% error rate triggers alerts
export PERFORMANCE_ALERT_THRESHOLD="5000"   # 5s response time alert

# === SECURITY CONFIGURATION ===

# Security Headers
export SECURITY_HEADERS_ENABLED="true"
export HSTS_MAX_AGE="31536000"              # 1 year HSTS
export CSP_POLICY="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'"

# Session & CSRF Protection
export SESSION_TIMEOUT="3600000"            # 1 hour session timeout
export CSRF_PROTECTION_ENABLED="true"
export RATE_LIMITING_ENABLED="true"

# === FEATURE FLAGS ===

# Core Features (LOCKED - DO NOT CHANGE)
export NEXT_PUBLIC_CALENDAR_LAYOUT="horizontal"        # IMMUTABLE FOUNDATION
export NEXT_PUBLIC_USE_HYBRID_CALENDAR="false"        # LOCKED

# Optional Features
export NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL="true"
export NEXT_PUBLIC_FEATURE_CANVAS_RENDER="true"
export NEXT_PUBLIC_FEATURE_NLP_PARSER="true"
export NEXT_PUBLIC_FEATURE_PWA="true"
export NEXT_PUBLIC_FEATURE_ANALYTICS="true"

# Integration Platform Features
export NEXT_PUBLIC_PROVIDER_GOOGLE="true"
export NEXT_PUBLIC_PROVIDER_MICROSOFT="true"
export NEXT_PUBLIC_PROVIDER_APPLE_CALDAV="true"
export NEXT_PUBLIC_PROVIDER_GENERIC_CALDAV="true"
export NEXT_PUBLIC_MULTI_LIBRARY_SUPPORT="true"

# === PERFORMANCE OPTIMIZATION ===

# Caching Configuration
export CACHE_TTL="3600"                    # 1 hour cache TTL
export STATIC_CACHE_MAX_AGE="86400"        # 24 hour static cache
export API_CACHE_MAX_AGE="300"             # 5 minute API cache

# Resource Optimization
export IMAGE_OPTIMIZATION_ENABLED="true"
export COMPRESSION_ENABLED="true"
export MINIFICATION_ENABLED="true"
export BUNDLE_ANALYZER="false"             # Enable for debugging only
```

### Environment Variable Security

**Critical Security Variables**:
```bash
# Generate secure encryption keys
export CONVEX_ENCRYPTION_MASTER_KEY="$(openssl rand -base64 32)"
export CONVEX_ENCRYPTION_SALT="$(openssl rand -base64 16)"
export GOOGLE_WEBHOOK_TOKEN="$(openssl rand -hex 32)"
export MICROSOFT_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

**Key Storage Best Practices**:
- Store in secure environment variable management (Vercel, Railway, etc.)
- Never commit keys to version control
- Use separate keys for staging and production
- Implement key rotation schedule (90 days recommended)
- Use strong, randomly generated keys (256-bit minimum)

## Provider Configuration

### Google Calendar Setup

#### **1. Google Cloud Console Configuration**

```bash
# OAuth 2.0 Configuration
Authorized JavaScript origins: https://lineartime.app
Authorized redirect URIs: https://lineartime.app/auth/google/callback

# API Scopes Required
- https://www.googleapis.com/auth/calendar.readonly
- https://www.googleapis.com/auth/calendar.events

# Webhook Configuration
Push Notification URL: https://lineartime.app/api/webhooks/google
Verification Token: [GOOGLE_WEBHOOK_TOKEN]
```

#### **2. Domain Verification**
- Add domain to Google Search Console
- Verify ownership through DNS or file verification
- Required for webhook notifications

#### **3. Rate Limiting Configuration**
- Default: 1,000 requests per hour per user
- Monitor usage in Google Cloud Console
- Implement exponential backoff for rate limit handling

### Microsoft Graph Setup

#### **1. Azure App Registration**

```bash
# Application Configuration
Application Type: Web application
Redirect URI: https://lineartime.app/auth/microsoft/callback

# API Permissions (Microsoft Graph)
- Calendars.ReadWrite (Delegated)
- User.Read (Delegated)

# Authentication Configuration
Supported Account Types: Accounts in any organizational directory and personal Microsoft accounts
Allow public client flows: No
```

#### **2. Webhook Subscription Configuration**

```bash
# Subscription Endpoint
POST https://graph.microsoft.com/v1.0/subscriptions

# Required Configuration
notificationUrl: https://lineartime.app/api/webhooks/microsoft
resource: me/events
changeType: created,updated,deleted
expirationDateTime: [72 hours from creation]
```

#### **3. Certificate Configuration** (Enterprise)
- Upload certificate for webhook signature verification
- Configure certificate thumbprint in Azure portal
- Implement certificate rotation schedule

### Apple iCloud CalDAV Setup

#### **1. App-Specific Password Configuration**

```bash
# User Instructions
1. Sign in to appleid.apple.com
2. Go to Security > App-Specific Passwords
3. Generate password for Command Center Calendar
4. Use Apple ID email + app-specific password for authentication

# CalDAV Server Configuration
Server URL: https://caldav.icloud.com
Username: [Apple ID email]
Password: [App-specific password]
```

#### **2. Server Discovery**

```bash
# Automatic Discovery
Endpoint: https://caldav.icloud.com/.well-known/caldav
Method: PROPFIND
Headers: 
  - Depth: 0
  - Content-Type: application/xml
```

#### **3. Calendar Access Configuration**
- Implement calendar list discovery
- Handle calendar permissions and sharing
- Support multiple calendar synchronization

### Generic CalDAV Provider Setup

#### **1. Server Configuration**

```bash
# Supported CalDAV Servers
- Nextcloud/ownCloud
- Radicale
- DAVx5
- Baikal
- SabreDAV
- SOGo

# Authentication Methods
- Basic Authentication
- Digest Authentication
- OAuth 2.0 (server dependent)
```

#### **2. Server Discovery Protocol**

```bash
# RFC 6764 Auto-discovery
1. DNS SRV record lookup: _caldavs._tcp.example.com
2. Well-known URI: https://example.com/.well-known/caldav
3. Manual server URL configuration fallback

# Capability Detection
PROPFIND request to detect:
- Calendar collections
- Supported components (VEVENT, VTODO)
- Server capabilities and extensions
```

## SSL/TLS Configuration

### Certificate Requirements

**SSL Certificate**:
- Valid SSL certificate from trusted CA (Let's Encrypt, etc.)
- Wildcard certificate recommended for subdomains
- Automatic renewal configured
- HTTPS enforcement for all endpoints

**TLS Configuration**:
```nginx
# Recommended TLS Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;

# HSTS Header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Security Headers

**Required Security Headers**:
```javascript
// next.config.ts security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;"
  }
];
```

## Database Configuration

### Convex Production Setup

#### **1. Deployment Configuration**

```bash
# Convex Deployment
npx convex deploy --prod

# Environment Configuration
convex env set ENCRYPTION_MASTER_KEY [base64-key]
convex env set GOOGLE_CLIENT_SECRET [secret]
convex env set MICROSOFT_CLIENT_SECRET [secret]

# Database Indexes (Automatic via Convex)
- User queries by clerk_id
- Events queries by user_id and date range  
- Provider tokens by user_id and provider_id
- Webhook subscriptions by provider and expiration
- Sync jobs by status and priority
```

#### **2. Data Retention Policies**

```javascript
// Data Retention Configuration
const retentionPolicies = {
  auditLogs: '90d',          // Security audit logs
  syncJobs: '30d',           // Background job history
  webhookLogs: '7d',         // Webhook processing logs
  errorLogs: '30d',          // Error tracking
  performanceMetrics: '90d'  // Performance monitoring data
};
```

#### **3. Backup & Recovery**

```bash
# Convex Automatic Backup
- Point-in-time recovery available
- Automatic daily backups
- Geographic replication
- 99.9% uptime SLA

# Manual Backup for Critical Data
npx convex export --table users --format json
npx convex export --table events --format json
npx convex export --table provider_tokens --format json
```

## Webhook Configuration

### Webhook Endpoint Setup

#### **1. Production Webhook URLs**

```bash
# Required HTTPS endpoints
Google Calendar: https://lineartime.app/api/webhooks/google
Microsoft Graph: https://lineartime.app/api/webhooks/microsoft
Microsoft Lifecycle: https://lineartime.app/api/webhooks/microsoft/lifecycle

# Health Check Endpoint
Health Check: https://lineartime.app/api/health/webhooks
```

#### **2. Webhook Security Configuration**

```bash
# SSL/TLS Requirements
- Valid SSL certificate (required by providers)
- TLS 1.2 or higher
- Strong cipher suites
- HSTS header configured

# Rate Limiting
- 1000 requests/hour per provider
- Burst limit: 50 requests/minute
- IP-based rate limiting for abuse prevention

# Signature Verification
Google: Verification token in X-Goog-Channel-Token header
Microsoft: HMAC-SHA256 signature in X-MS-Signature header
```

#### **3. Webhook Monitoring**

```javascript
// Webhook Health Monitoring
const webhookMonitoring = {
  responseTime: '<500ms',      // Average response time
  successRate: '>99%',         // Success rate target
  errorTracking: 'enabled',    // Error logging and alerting
  retryLogic: 'exponential',   // Retry strategy
  deadLetterQueue: 'enabled'   // Failed webhook handling
};
```

### Webhook Registration Process

#### **1. Google Calendar Webhook Registration**

```bash
# Automatic Registration on User Connection
POST https://www.googleapis.com/calendar/v3/calendars/primary/events/watch
{
  "id": "linear_${userId}_${timestamp}",
  "type": "web_hook",
  "address": "https://lineartime.app/api/webhooks/google",
  "token": "[GOOGLE_WEBHOOK_TOKEN]",
  "expiration": "[timestamp + 7 days]"
}

# Automatic Renewal Before Expiration
- Check expiration 24 hours before
- Create new watch channel
- Stop old channel
- Update stored subscription
```

#### **2. Microsoft Graph Webhook Registration**

```bash
# Subscription Creation
POST https://graph.microsoft.com/v1.0/subscriptions
{
  "changeType": "created,updated,deleted",
  "notificationUrl": "https://lineartime.app/api/webhooks/microsoft",
  "resource": "me/events",
  "expirationDateTime": "[timestamp + 72 hours]",
  "clientState": "[signed-user-id]",
  "lifecycleNotificationUrl": "https://lineartime.app/api/webhooks/microsoft/lifecycle"
}

# Automatic Renewal
- PATCH renewal 24 hours before expiration
- Fallback to new subscription creation if PATCH fails
- Lifecycle notifications for subscription management
```

## Monitoring & Observability

### Application Performance Monitoring

#### **1. Key Performance Indicators (KPIs)**

```javascript
// Performance Targets
const performanceTargets = {
  // Response Time Targets
  apiResponseTime: '<200ms (95th percentile)',
  webhookResponseTime: '<500ms',
  syncJobProcessingTime: '<60s',
  
  // Throughput Targets  
  webhooksPerSecond: '>100',
  syncJobsPerMinute: '>1000',
  apiRequestsPerSecond: '>500',
  
  // Error Rate Targets
  apiErrorRate: '<0.1%',
  webhookErrorRate: '<1%',
  syncJobFailureRate: '<2%',
  
  // Availability Targets
  uptime: '>99.9%',
  providerSyncUptime: '>99%',
  webhookDeliveryReliability: '>99.5%'
};
```

#### **2. Real-Time Monitoring Setup**

```bash
# Health Check Endpoints
GET /api/health                    # Overall system health
GET /api/health/database           # Database connectivity
GET /api/health/providers          # Provider API status
GET /api/health/webhooks           # Webhook endpoint status
GET /api/health/sync               # Sync queue health

# Metrics Collection
- Response time percentiles (50th, 95th, 99th)
- Error rates by endpoint and provider
- Active user sessions and sync status
- Resource utilization (CPU, memory, network)
- Queue depth and processing times
```

#### **3. Alerting Configuration**

```javascript
// Critical Alerts (Immediate Response Required)
const criticalAlerts = {
  systemDown: 'Application unavailable > 1 minute',
  databaseDown: 'Database connectivity lost > 30 seconds', 
  providerApiDown: 'Provider API error rate > 50% for 5 minutes',
  webhookFailures: 'Webhook error rate > 10% for 10 minutes',
  securityBreach: 'Multiple authentication failures or suspicious activity'
};

// Warning Alerts (Investigation Required)
const warningAlerts = {
  highResponseTime: 'API response time > 1s for 15 minutes',
  highErrorRate: 'Error rate > 2% for 10 minutes',
  syncQueueBacklog: 'Sync queue depth > 1000 jobs',
  lowProviderSync: 'Provider sync success rate < 95% for 1 hour',
  resourceUtilization: 'CPU/Memory usage > 80% for 15 minutes'
};
```

### Security Monitoring

#### **1. Security Event Logging**

```javascript
// Security Events to Monitor
const securityEvents = {
  authenticationFailures: 'Failed login attempts (track rate and source)',
  unauthorizedAccess: 'Access attempts to protected resources',
  webhookVerificationFailures: 'Invalid webhook signatures',
  tokenEncryptionErrors: 'Encryption/decryption failures',
  suspiciousPatterns: 'Unusual usage patterns or potential attacks',
  dataAccess: 'Access to sensitive user data (audit trail)',
  configurationChanges: 'Changes to security settings or permissions'
};
```

#### **2. Intrusion Detection**

```bash
# Rate Limiting & Abuse Prevention
- Track request patterns by IP and user
- Implement progressive delays for suspicious activity  
- Automatic temporary blocking for abuse patterns
- Geographic access pattern analysis

# Vulnerability Scanning
- Regular dependency vulnerability scans
- Container security scanning (if self-hosted)
- SSL/TLS configuration testing
- API endpoint security validation
```

### Log Management

#### **1. Structured Logging Configuration**

```javascript
// Log Levels and Categories
const logConfiguration = {
  levels: {
    ERROR: 'Application errors, failed operations',
    WARN: 'Warning conditions, degraded performance',
    INFO: 'General information, user actions',
    DEBUG: 'Detailed debugging info (development only)'
  },
  
  categories: {
    auth: 'Authentication and authorization events',
    provider: 'Calendar provider API interactions',
    webhook: 'Webhook processing and errors',
    sync: 'Background synchronization jobs',
    security: 'Security-related events and threats',
    performance: 'Performance metrics and slow queries'
  }
};
```

#### **2. Log Retention and Analysis**

```bash
# Log Retention Policies
Application Logs: 30 days (INFO level and above)
Security Logs: 90 days (all levels)
Audit Logs: 365 days (compliance requirement)
Performance Logs: 90 days (metrics and analysis)

# Log Analysis Tools
- Real-time log streaming and filtering
- Automated pattern detection and alerting
- Performance bottleneck identification
- Security threat analysis and correlation
```

## Performance Optimization

### Caching Strategy

#### **1. Multi-Layer Caching**

```javascript
// Caching Configuration
const cachingStrategy = {
  // CDN Caching (Static Assets)
  staticAssets: {
    ttl: '1y',
    files: ['*.js', '*.css', '*.png', '*.jpg', '*.svg', '*.woff2'],
    compression: 'gzip, brotli'
  },
  
  // API Response Caching
  apiCache: {
    events: '5m',           // User events
    providers: '1h',        // Provider configurations
    calendars: '30m',       // Calendar metadata
    healthCheck: '1m'       // Health check responses
  },
  
  // Database Query Caching (Convex)
  databaseCache: {
    userPreferences: '1h',
    providerTokens: '30m',  // Encrypted tokens
    calendarMetadata: '15m'
  }
};
```

#### **2. Performance Monitoring**

```bash
# Core Web Vitals Targets
Largest Contentful Paint (LCP): <2.5s
First Input Delay (FID): <100ms
Cumulative Layout Shift (CLS): <0.1

# Application Performance Targets
Time to First Byte (TTFB): <200ms
First Contentful Paint (FCP): <1.8s
Speed Index: <3.0s
Total Blocking Time (TBT): <200ms
```

### Resource Optimization

#### **1. Bundle Optimization**

```javascript
// next.config.ts optimization
const nextConfig = {
  // Bundle Analysis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  
  // Image Optimization
  images: {
    domains: ['lineartime.app', 'cdn.lineartime.app'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Compression
  compress: true,
  poweredByHeader: false,
  
  // Build Optimization
  swcMinify: true,
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}'
    }
  }
};
```

#### **2. Database Optimization**

```bash
# Query Optimization
- Use Convex built-in indexing
- Implement pagination for large datasets
- Use proper filtering to reduce data transfer
- Implement real-time subscriptions efficiently

# Connection Management
- Connection pooling (handled by Convex)
- Query timeout configuration
- Retry logic for transient failures
- Graceful degradation for database issues
```

## Scaling & Load Management

### Horizontal Scaling

#### **1. Auto-Scaling Configuration**

```bash
# Platform-Specific Scaling
Vercel: Automatic scaling based on traffic
Railway: Configure resource limits and scaling rules
AWS: Auto Scaling Groups with CloudWatch metrics
Docker: Kubernetes HPA (Horizontal Pod Autoscaler)

# Scaling Triggers
CPU Usage: Scale up at >70%, scale down at <30%
Memory Usage: Scale up at >80%, scale down at <40%
Response Time: Scale up if >1s average for 5 minutes
Queue Depth: Scale up if sync queue >500 jobs
```

#### **2. Load Balancing**

```bash
# Load Distribution
- Geographic distribution via CDN
- Database read replicas (Convex handles automatically)
- API endpoint load balancing
- Webhook endpoint redundancy

# Health Check Configuration
Interval: 30 seconds
Timeout: 10 seconds  
Healthy Threshold: 2 consecutive successes
Unhealthy Threshold: 3 consecutive failures
```

### Resource Limits & Quotas

#### **1. Provider API Limits**

```bash
# Google Calendar API
- 1,000,000 queries per day (default)
- 100 queries per 100 seconds per user
- Courtesy limit: 1,000 requests per hour

# Microsoft Graph API  
- 10,000 API requests per 10 minutes per application
- 1,000 requests per 10 minutes per user
- Throttling: 429 status with Retry-After header

# CalDAV Servers
- Server-dependent rate limiting
- Implement conservative polling (15-minute intervals)
- Connection pooling and keep-alive
```

#### **2. Application Resource Management**

```javascript
// Resource Limits Configuration
const resourceLimits = {
  // Concurrent Operations
  maxConcurrentSyncs: 10,
  maxWebhookProcessing: 50,
  maxDatabaseConnections: 20,
  
  // Memory Limits
  maxEventCacheSize: '100MB',
  maxUserSessions: 10000,
  maxJobQueueSize: 5000,
  
  // Timeout Configuration
  apiTimeout: '30s',
  webhookTimeout: '10s',
  syncJobTimeout: '5m',
  databaseQueryTimeout: '30s'
};
```

## Deployment Pipeline

### CI/CD Configuration

#### **1. Build Pipeline**

```yaml
# .github/workflows/production.yml
name: Production Deployment

on:
  push:
    branches: [main]
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
          cache: 'npm'
      
      # Install dependencies
      - run: npm ci
      
      # Type checking
      - run: npm run type-check
      
      # Linting
      - run: npm run lint
      
      # Foundation tests (MANDATORY)
      - run: npm run test:foundation
      
      # Integration tests
      - run: npx playwright test
      
      # Build verification
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      # Deploy to Convex
      - run: npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
      
      # Deploy to Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### **2. Deployment Steps**

```bash
#!/bin/bash
# Production Deployment Script

# 1. Pre-deployment validation
npm run test:foundation          # MANDATORY - must pass
npm run build                   # Build verification
npm run lint                    # Code quality check

# 2. Database migration (if needed)
npx convex deploy --prod
convex env set --prod ENCRYPTION_MASTER_KEY "[key]"

# 3. Application deployment
vercel --prod

# 4. Post-deployment verification
curl -f https://lineartime.app/api/health || exit 1
curl -f https://lineartime.app/api/health/providers || exit 1

# 5. Webhook re-registration (if needed)
# This is handled automatically by the application

# 6. Monitoring activation
echo "Deployment complete. Monitoring active."
echo "Check https://lineartime.app/api/health for system status"
```

### Rollback Strategy

#### **1. Automatic Rollback Triggers**

```bash
# Health Check Failures
- API health check fails for >2 minutes
- Database connectivity lost
- Critical provider integrations failing
- Error rate >10% for >5 minutes

# Manual Rollback Process
vercel --prod --rollback [deployment-id]
convex rollback --prod [snapshot-id]
```

#### **2. Rollback Validation**

```bash
# Post-Rollback Checks
1. Verify application accessibility
2. Check database connectivity
3. Validate provider integrations
4. Test webhook endpoints
5. Confirm user authentication
6. Verify sync functionality
```

## Security Hardening

### Network Security

#### **1. Firewall & Access Control**

```bash
# Network Configuration
- HTTPS only (HTTP redirects to HTTPS)
- Strong SSL/TLS configuration
- Geographic access controls (if needed)
- DDoS protection via CDN

# API Security
- Rate limiting per endpoint
- Request size limits (10MB max)
- IP-based access controls
- CORS configuration for browser requests
```

#### **2. API Security**

```javascript
// API Security Configuration
const apiSecurity = {
  rateLimit: {
    windowMs: 15 * 60 * 1000,      // 15 minutes
    max: 100,                       // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  
  cors: {
    origin: ['https://lineartime.app', 'https://www.lineartime.app'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"]
      }
    }
  }
};
```

### Data Protection

#### **1. Encryption in Transit and at Rest**

```bash
# In Transit
- TLS 1.3 for all connections
- Certificate pinning for provider APIs
- Encrypted webhook payloads
- Secure WebSocket connections

# At Rest
- AES-256-GCM for provider tokens (via Convex)
- Database encryption (Convex managed)
- Encrypted backup storage
- Secure key management
```

#### **2. Privacy & Compliance**

```javascript
// GDPR Compliance Configuration
const privacyConfig = {
  dataRetention: {
    userEvents: 'until account deletion',
    auditLogs: '90 days',
    sessionData: '24 hours',
    errorLogs: '30 days'
  },
  
  userRights: {
    dataExport: 'automated via API',
    dataDetion: 'cascading deletion across all systems',
    dataPortability: 'JSON export of all user data',
    accessLog: 'comprehensive audit trail'
  },
  
  consentManagement: {
    cookieConsent: 'required for non-essential cookies',
    dataProcessing: 'explicit consent for calendar sync',
    analytics: 'opt-in only',
    marketing: 'separate consent required'
  }
};
```

## Disaster Recovery

### Backup Strategy

#### **1. Data Backup Configuration**

```bash
# Convex Automatic Backups
- Point-in-time recovery (automatic)
- Daily snapshots (30-day retention)
- Geographic replication
- Instant restoration capabilities

# Manual Backup Procedures
npx convex export --table users
npx convex export --table events  
npx convex export --table provider_tokens
npx convex export --table webhook_subscriptions

# Backup Verification
- Weekly backup integrity checks
- Monthly restoration testing
- Disaster recovery drills (quarterly)
```

#### **2. Recovery Procedures**

```bash
# Recovery Time Objectives (RTO)
- Application: <5 minutes (via platform auto-recovery)
- Database: <15 minutes (Convex managed)
- Provider Webhooks: <30 minutes (automatic re-registration)

# Recovery Point Objectives (RPO)
- Critical Data: <1 minute (real-time sync)
- User Preferences: <5 minutes
- Audit Logs: <15 minutes
- Analytics Data: <1 hour (acceptable loss)
```

### Incident Response

#### **1. Incident Classification**

```bash
# Severity Levels
P0 (Critical): Complete service outage, data breach
P1 (High): Major feature unavailable, security vulnerability  
P2 (Medium): Performance degradation, provider sync issues
P3 (Low): Minor bugs, enhancement requests

# Response Times
P0: <15 minutes acknowledgment, <1 hour resolution
P1: <30 minutes acknowledgment, <4 hours resolution
P2: <2 hours acknowledgment, <24 hours resolution
P3: <24 hours acknowledgment, <72 hours resolution
```

#### **2. Communication Plan**

```bash
# Internal Communication
- Slack channel: #incident-response
- On-call rotation: 24/7 coverage for P0/P1
- Escalation path: Developer → Team Lead → CTO

# External Communication  
- Status page: https://status.lineartime.app
- Email notifications for affected users
- Social media updates for major incidents
- Post-incident reports within 48 hours
```

## Cost Optimization

### Resource Optimization

#### **1. Platform Costs**

```bash
# Vercel Production Plan
- $20/month for team plan
- Usage-based pricing for bandwidth and function execution
- Automatic scaling included

# Convex Costs
- Free tier: 1M function calls, 8GB database
- Production tier: $25/month for 100M calls, 10GB database
- Additional usage: $0.50/1M calls, $0.25/GB storage

# Third-Party Services
Clerk: $25/month (up to 10,000 MAU)
Stripe: 2.9% + 30¢ per transaction
Provider APIs: Free (within rate limits)
```

#### **2. Cost Monitoring**

```javascript
// Cost Tracking Configuration
const costMonitoring = {
  // Usage Metrics
  functionCalls: 'track per endpoint',
  databaseOperations: 'monitor read/write patterns',
  bandwidth: 'track by user and feature',
  storageSize: 'monitor growth trends',
  
  // Cost Alerts
  monthlyBudget: '$500',
  alertThreshold: '80% of budget',
  usageSpike: '50% increase week-over-week',
  
  // Optimization Opportunities
  unusedResources: 'identify and remove',
  cacheHitRatio: 'optimize for >90%',
  apiEfficiency: 'reduce unnecessary calls'
};
```

## Final Production Checklist

### Pre-Launch Validation

```bash
# ✅ Security Checklist
□ All environment variables properly configured
□ SSL certificates valid and automatically renewing
□ Webhook signatures verified and tested
□ Provider tokens encrypted with AES-256-GCM
□ Rate limiting configured for all endpoints
□ Security headers properly configured
□ GDPR compliance measures implemented

# ✅ Functionality Checklist  
□ All 4 providers (Google, Microsoft, Apple, Generic CalDAV) working
□ All 10 calendar libraries functional and tested
□ Foundation tests passing (100% success rate)
□ Webhook registration and renewal working
□ Background sync queue processing correctly
□ Real-time updates functioning across all providers

# ✅ Performance Checklist
□ Core Web Vitals meeting targets
□ Load testing completed (10,000+ events)
□ Database queries optimized
□ Caching strategies implemented
□ CDN configured for static assets
□ Monitoring and alerting active

# ✅ Operational Checklist
□ Backup and recovery procedures tested
□ Incident response plan documented
□ On-call rotation established
□ Documentation complete and accessible
□ Training completed for support team
□ Rollback procedures validated
```

### Post-Launch Monitoring

```bash
# First 24 Hours
- Monitor system health every 15 minutes
- Verify webhook delivery and processing
- Check provider sync success rates
- Monitor error rates and performance metrics
- Validate user registration and authentication

# First Week
- Daily performance reviews
- Provider API usage monitoring
- User feedback analysis
- Security event review
- Cost and resource utilization tracking

# First Month
- Weekly system health reports
- Provider relationship management
- Performance optimization opportunities
- User growth and usage pattern analysis
- Documentation updates based on operational learnings
```

---

This deployment guide provides comprehensive instructions for deploying Command Center Calendar's Phase 2.6 calendar integration platform to production with enterprise-grade security, scalability, and reliability. Follow this guide to ensure a successful deployment that meets all technical and business requirements.