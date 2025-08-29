# Command Center Calendar Webhook & Sync Queue Architecture

> **Phase 2.6 Foundation Documentation**  
> **Real-Time Synchronization Platform**  
> **Last Updated**: January 2025

## Executive Summary

Command Center Calendar implements a sophisticated **real-time webhook system** with **automatic renewal capabilities** and **intelligent sync queue processing** to maintain seamless calendar synchronization across 4 major providers (Google, Microsoft, Apple CalDAV, Generic CalDAV).

## Architecture Overview

### Hybrid Sync Strategy

Command Center Calendar employs a **hybrid synchronization approach** combining:

1. **Push Notifications** (Google, Microsoft) - Real-time webhook delivery
2. **Polling Sync** (CalDAV providers) - Scheduled incremental sync
3. **Background Queue Processing** - Async job handling with retry logic
4. **Automatic Renewal** - Zero-downtime webhook subscription management

```typescript
// Sync Strategy Configuration
interface SyncStrategy {
  google: 'webhook' | 'polling' | 'hybrid';      // webhook
  microsoft: 'webhook' | 'polling' | 'hybrid';   // webhook
  apple_caldav: 'webhook' | 'polling' | 'hybrid'; // polling
  generic_caldav: 'webhook' | 'polling' | 'hybrid'; // polling
}

const syncConfig: SyncStrategy = {
  google: 'webhook',        // Real-time push notifications
  microsoft: 'webhook',     // Graph API subscriptions
  apple_caldav: 'polling',  // 15-minute intervals
  generic_caldav: 'polling' // 15-minute intervals
};
```

## Real-Time Webhook System

### Google Calendar Push Notifications

#### **Webhook Registration**

```typescript
// Google Calendar Watch API Integration
interface GoogleWatchRequest {
  id: string;           // Unique channel ID
  type: 'web_hook';     // Notification type
  address: string;      // Webhook endpoint URL
  token?: string;       // Verification token
  expiration?: number;  // Expiration timestamp (max 7 days)
  params?: {
    ttl: string;        // Time to live
  };
}

class GoogleWebhookService {
  async createWatchChannel(userId: string, calendarId: string = 'primary'): Promise<GoogleWatchChannel> {
    const watchRequest: GoogleWatchRequest = {
      id: `linear_${userId}_${calendarId}_${Date.now()}`,
      type: 'web_hook',
      address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google`,
      token: process.env.GOOGLE_WEBHOOK_TOKEN,
      expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days max
      params: {
        ttl: '604800' // 7 days in seconds
      }
    };

    // Decrypt user's Google tokens
    const tokens = await this.getDecryptedTokens(userId, 'google');
    
    // Create watch channel
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/watch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(watchRequest)
      }
    );

    const channel = await response.json();
    
    // Store channel metadata for renewal
    await this.storeWebhookSubscription({
      userId,
      providerId: 'google',
      channelId: channel.id,
      resourceId: channel.resourceId,
      resourceUri: channel.resourceUri,
      expiration: new Date(channel.expiration),
      webhookUrl: watchRequest.address,
      token: watchRequest.token
    });

    return channel;
  }
}
```

#### **Webhook Handler Implementation**

```typescript
// Google Webhook Endpoint: /api/webhooks/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleWebhookSignature } from '@/lib/webhook-security';
import { processGoogleSyncJob } from '@/lib/sync-queue';

export async function POST(request: NextRequest) {
  try {
    // 1. Security validation
    const body = await request.text();
    const isValid = await verifyGoogleWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Extract webhook headers
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceUri = request.headers.get('x-goog-resource-uri');

    // 3. Handle different resource states
    switch (resourceState) {
      case 'sync':
        // Initial sync - acknowledge and return
        return NextResponse.json({ status: 'sync acknowledged' });
        
      case 'exists':
        // Calendar event change detected
        await processGoogleWebhook({
          channelId,
          resourceState,
          resourceId,
          resourceUri,
          changeType: 'event_modified'
        });
        break;
        
      case 'not_exists':
        // Calendar event deleted
        await processGoogleWebhook({
          channelId,
          resourceState,
          resourceId,
          resourceUri,
          changeType: 'event_deleted'
        });
        break;
    }

    // 4. Queue incremental sync job
    const subscription = await getWebhookSubscription(channelId);
    if (subscription) {
      await queueSyncJob({
        userId: subscription.userId,
        providerId: 'google',
        type: 'incremental_sync',
        priority: 'high',
        metadata: {
          resourceId,
          syncToken: await getLastSyncToken(subscription.userId, 'google')
        }
      });
    }

    return NextResponse.json({ status: 'webhook processed' });
    
  } catch (error) {
    console.error('Google webhook processing error:', error);
    
    // Log security event
    await logSecurityEvent({
      eventType: 'webhook_processing_error',
      providerId: 'google',
      error: error.message,
      riskLevel: 'medium'
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

### Microsoft Graph Webhook Subscriptions

#### **Subscription Creation**

```typescript
// Microsoft Graph Webhook Service
class MicrosoftWebhookService {
  async createSubscription(userId: string): Promise<GraphSubscription> {
    const tokens = await this.getDecryptedTokens(userId, 'microsoft');
    
    const subscriptionRequest = {
      changeType: 'created,updated,deleted',
      notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/microsoft`,
      resource: 'me/events',
      expirationDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      clientState: this.generateClientState(userId),
      includeResourceData: false, // For security, fetch data separately
      lifecycleNotificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/microsoft/lifecycle`
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionRequest)
    });

    const subscription = await response.json();
    
    // Store subscription for renewal
    await this.storeWebhookSubscription({
      userId,
      providerId: 'microsoft',
      subscriptionId: subscription.id,
      resource: subscription.resource,
      changeTypes: subscription.changeType.split(','),
      expiresAt: new Date(subscription.expirationDateTime),
      webhookUrl: subscription.notificationUrl,
      clientState: subscription.clientState
    });

    return subscription;
  }

  private generateClientState(userId: string): string {
    // Generate secure client state for verification
    const payload = { userId, timestamp: Date.now() };
    return this.signClientState(payload);
  }
}
```

#### **Microsoft Webhook Handler**

```typescript
// Microsoft Webhook Endpoint: /api/webhooks/microsoft/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Handle subscription validation
    const url = new URL(request.url);
    const validationToken = url.searchParams.get('validationToken');
    if (validationToken) {
      return new Response(validationToken, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. Security validation
    const body = await request.text();
    const isValid = await verifyMicrosoftWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Process notifications
    const notifications = JSON.parse(body);
    
    for (const notification of notifications.value) {
      // Verify client state
      const subscription = await getWebhookSubscription(notification.subscriptionId);
      if (!subscription || notification.clientState !== subscription.clientState) {
        continue; // Skip invalid notifications
      }

      // Queue sync job based on change type
      await queueSyncJob({
        userId: subscription.userId,
        providerId: 'microsoft',
        type: 'incremental_sync',
        priority: this.getPriorityFromChangeType(notification.changeType),
        metadata: {
          resourceId: notification.resourceData?.id,
          changeType: notification.changeType,
          subscriptionId: notification.subscriptionId
        }
      });
    }

    return NextResponse.json({ status: 'notifications processed' });
    
  } catch (error) {
    console.error('Microsoft webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

## Automatic Webhook Renewal System

### Proactive Renewal Service

```typescript
// Webhook Renewal Scheduler
class WebhookRenewalService {
  private readonly RENEWAL_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours before expiration
  private readonly MAX_RENEWAL_RETRIES = 3;
  
  async startRenewalScheduler(): Promise<void> {
    // Check for expiring subscriptions every hour
    setInterval(async () => {
      await this.processExpiringSubscriptions();
    }, 60 * 60 * 1000);
  }

  private async processExpiringSubscriptions(): Promise<void> {
    const expiringSubscriptions = await this.getExpiringSubscriptions();
    
    for (const subscription of expiringSubscriptions) {
      await this.renewSubscription(subscription);
    }
  }

  private async getExpiringSubscriptions(): Promise<WebhookSubscription[]> {
    const threshold = new Date(Date.now() + this.RENEWAL_THRESHOLD);
    
    return await ctx.db.query('webhookSubscriptions')
      .filter(q => q.lt(q.field('expiresAt'), threshold))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
  }

  async renewSubscription(subscription: WebhookSubscription): Promise<void> {
    try {
      let renewedSubscription;
      
      switch (subscription.providerId) {
        case 'google':
          renewedSubscription = await this.renewGoogleSubscription(subscription);
          break;
        case 'microsoft':
          renewedSubscription = await this.renewMicrosoftSubscription(subscription);
          break;
        default:
          throw new Error(`Unsupported provider: ${subscription.providerId}`);
      }

      // Update stored subscription
      await this.updateStoredSubscription(subscription.id, {
        expiresAt: renewedSubscription.expiresAt,
        subscriptionId: renewedSubscription.subscriptionId,
        renewedAt: new Date(),
        status: 'active'
      });

      // Log successful renewal
      await logWebhookEvent({
        eventType: 'subscription_renewed',
        providerId: subscription.providerId,
        userId: subscription.userId,
        subscriptionId: subscription.subscriptionId,
        outcome: 'success'
      });

    } catch (error) {
      await this.handleRenewalFailure(subscription, error);
    }
  }

  private async renewGoogleSubscription(
    subscription: WebhookSubscription
  ): Promise<{ subscriptionId: string; expiresAt: Date }> {
    // Google requires creating a new watch channel (cannot renew existing)
    const newChannel = await this.googleWebhookService.createWatchChannel(
      subscription.userId,
      subscription.resourceId
    );

    // Stop old channel
    await this.googleWebhookService.stopChannel(
      subscription.channelId,
      subscription.resourceId
    );

    return {
      subscriptionId: newChannel.id,
      expiresAt: new Date(newChannel.expiration)
    };
  }

  private async renewMicrosoftSubscription(
    subscription: WebhookSubscription
  ): Promise<{ subscriptionId: string; expiresAt: Date }> {
    const tokens = await getDecryptedTokens(subscription.userId, 'microsoft');
    
    // Microsoft allows PATCH renewal
    const renewalRequest = {
      expirationDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscription.subscriptionId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(renewalRequest)
      }
    );

    if (!response.ok) {
      // If PATCH fails, create new subscription
      const newSubscription = await this.microsoftWebhookService.createSubscription(
        subscription.userId
      );
      
      return {
        subscriptionId: newSubscription.id,
        expiresAt: new Date(newSubscription.expirationDateTime)
      };
    }

    const renewed = await response.json();
    return {
      subscriptionId: renewed.id,
      expiresAt: new Date(renewed.expirationDateTime)
    };
  }
}
```

### Failure Recovery & Retry Logic

```typescript
// Renewal Failure Handling
class RenewalFailureHandler {
  async handleRenewalFailure(
    subscription: WebhookSubscription,
    error: Error
  ): Promise<void> {
    const retryCount = subscription.renewalRetryCount || 0;
    
    if (retryCount < this.MAX_RENEWAL_RETRIES) {
      // Exponential backoff retry
      const retryDelay = Math.pow(2, retryCount) * 5 * 60 * 1000; // 5min, 10min, 20min
      
      await this.scheduleRenewalRetry(subscription, retryDelay);
      
      await this.updateSubscriptionRetryCount(subscription.id, retryCount + 1);
      
    } else {
      // Max retries exceeded - fall back to polling
      await this.fallbackToPolling(subscription);
      
      // Mark subscription as failed
      await this.updateSubscriptionStatus(subscription.id, 'failed');
      
      // Alert administrators
      await this.sendRenewalFailureAlert(subscription, error);
    }
  }

  private async fallbackToPolling(subscription: WebhookSubscription): Promise<void> {
    // Create polling schedule for this user/provider
    await this.createPollingSchedule({
      userId: subscription.userId,
      providerId: subscription.providerId,
      interval: '15m',
      reason: 'webhook_renewal_failed'
    });
    
    await logWebhookEvent({
      eventType: 'fallback_to_polling',
      providerId: subscription.providerId,
      userId: subscription.userId,
      reason: 'renewal_failure',
      outcome: 'fallback_enabled'
    });
  }
}
```

## Sync Queue Architecture

### Job Queue System

```typescript
// Sync Job Types
interface SyncJob {
  id: string;
  userId: string;
  providerId: 'google' | 'microsoft' | 'apple_caldav' | 'generic_caldav';
  
  // Job classification
  type: 'full_sync' | 'incremental_sync' | 'webhook_sync' | 'polling_sync';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Execution control
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  retryCount: number;
  maxRetries: number;
  
  // Scheduling
  scheduledAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  nextRetryAt?: Date;
  
  // Job data
  metadata: {
    syncToken?: string;     // For incremental sync
    resourceId?: string;    // Webhook resource ID
    changeType?: string;    // Type of change
    fullSyncReason?: string; // Reason for full sync
  };
  
  // Error tracking
  error?: {
    message: string;
    code: string;
    retryable: boolean;
    timestamp: Date;
  };
}

// Queue Management Service
class SyncQueueService {
  async queueSyncJob(jobRequest: Partial<SyncJob>): Promise<string> {
    const job: SyncJob = {
      id: generateUUID(),
      scheduledAt: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.getMaxRetries(jobRequest.type, jobRequest.providerId),
      ...jobRequest
    } as SyncJob;

    // Store job in database
    await ctx.db.insert('syncJobs', job);
    
    // Add to processing queue with priority
    await this.addToProcessingQueue(job);
    
    return job.id;
  }

  private getMaxRetries(
    jobType?: string,
    providerId?: string
  ): number {
    const retryConfig = {
      full_sync: 3,
      incremental_sync: 5,
      webhook_sync: 7,
      polling_sync: 2
    };
    
    return retryConfig[jobType] || 3;
  }
}
```

### Background Job Processor

```typescript
// Job Processing Engine
class SyncJobProcessor {
  private readonly CONCURRENT_JOBS = 5;
  private readonly PROCESSING_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  
  async startProcessor(): Promise<void> {
    // Start multiple concurrent processors
    for (let i = 0; i < this.CONCURRENT_JOBS; i++) {
      this.processJobQueue();
    }
  }

  private async processJobQueue(): Promise<void> {
    while (true) {
      try {
        // Get next job from queue (priority ordered)
        const job = await this.getNextJob();
        if (!job) {
          await this.sleep(5000); // Wait 5 seconds if no jobs
          continue;
        }

        await this.processJob(job);
        
      } catch (error) {
        console.error('Job processor error:', error);
        await this.sleep(10000); // Wait 10 seconds on error
      }
    }
  }

  private async getNextJob(): Promise<SyncJob | null> {
    // Get highest priority pending job
    const job = await ctx.db.query('syncJobs')
      .filter(q => q.eq(q.field('status'), 'pending'))
      .filter(q => q.lte(q.field('scheduledAt'), new Date()))
      .order('desc') // Assuming higher priority = higher number
      .first();

    if (job) {
      // Mark as processing
      await ctx.db.patch(job._id, {
        status: 'processing',
        processingStartedAt: new Date()
      });
    }

    return job;
  }

  private async processJob(job: SyncJob): Promise<void> {
    const timeout = setTimeout(async () => {
      await this.handleJobTimeout(job);
    }, this.PROCESSING_TIMEOUT);

    try {
      let result;
      
      switch (job.type) {
        case 'full_sync':
          result = await this.performFullSync(job);
          break;
        case 'incremental_sync':
          result = await this.performIncrementalSync(job);
          break;
        case 'webhook_sync':
          result = await this.performWebhookSync(job);
          break;
        case 'polling_sync':
          result = await this.performPollingSync(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      await ctx.db.patch(job._id, {
        status: 'completed',
        completedAt: new Date(),
        result
      });

      // Log success
      await logSyncEvent({
        eventType: 'sync_job_completed',
        userId: job.userId,
        providerId: job.providerId,
        jobType: job.type,
        duration: Date.now() - job.processingStartedAt.getTime(),
        outcome: 'success'
      });

    } catch (error) {
      await this.handleJobError(job, error);
      
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

### Exponential Backoff Retry Strategy

```typescript
// Intelligent Retry Logic
class SyncRetryHandler {
  async handleJobError(job: SyncJob, error: Error): Promise<void> {
    const retryable = this.isRetryableError(error);
    
    if (!retryable || job.retryCount >= job.maxRetries) {
      // Mark as permanently failed
      await ctx.db.patch(job._id, {
        status: 'failed',
        completedAt: new Date(),
        error: {
          message: error.message,
          code: this.getErrorCode(error),
          retryable: false,
          timestamp: new Date()
        }
      });

      // Send failure notification
      await this.sendJobFailureNotification(job, error);
      return;
    }

    // Calculate retry delay with exponential backoff
    const baseDelay = this.getBaseDelay(job.providerId);
    const backoffMultiplier = Math.pow(2, job.retryCount);
    const jitter = Math.random() * 0.1 * baseDelay; // Add 10% jitter
    const retryDelay = baseDelay * backoffMultiplier + jitter;

    // Schedule retry
    const nextRetryAt = new Date(Date.now() + retryDelay);
    
    await ctx.db.patch(job._id, {
      status: 'retry',
      retryCount: job.retryCount + 1,
      nextRetryAt,
      scheduledAt: nextRetryAt,
      error: {
        message: error.message,
        code: this.getErrorCode(error),
        retryable: true,
        timestamp: new Date()
      }
    });

    // Log retry
    await logSyncEvent({
      eventType: 'sync_job_retry',
      userId: job.userId,
      providerId: job.providerId,
      jobType: job.type,
      retryCount: job.retryCount + 1,
      nextRetryAt,
      error: error.message
    });
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE',
      'TOKEN_REFRESH_NEEDED'
    ];

    return retryableErrors.some(code => 
      error.message.includes(code) || error.name === code
    );
  }

  private getBaseDelay(providerId: string): number {
    const delays = {
      google: 30000,      // 30 seconds
      microsoft: 45000,   // 45 seconds  
      apple_caldav: 60000,    // 1 minute
      generic_caldav: 60000   // 1 minute
    };
    
    return delays[providerId] || 30000;
  }
}
```

## CalDAV Polling System

### Scheduled Polling Service

```typescript
// CalDAV Polling Scheduler
class CalDAVPollingService {
  private readonly POLLING_INTERVALS = {
    apple_caldav: 15 * 60 * 1000,    // 15 minutes
    generic_caldav: 15 * 60 * 1000   // 15 minutes
  };

  async startPollingScheduler(): Promise<void> {
    // Schedule polling jobs for all active CalDAV providers
    const providers = await this.getActiveCalDAVProviders();
    
    for (const provider of providers) {
      this.schedulePollingJob(provider);
    }
  }

  private schedulePollingJob(provider: ProviderConfig): void {
    const interval = this.POLLING_INTERVALS[provider.providerId];
    
    setInterval(async () => {
      await queueSyncJob({
        userId: provider.userId,
        providerId: provider.providerId,
        type: 'polling_sync',
        priority: 'medium',
        metadata: {
          lastPollAt: provider.lastSyncAt,
          pollingInterval: interval
        }
      });
    }, interval);
  }

  async performCalDAVSync(job: SyncJob): Promise<SyncResult> {
    const credentials = await getDecryptedTokens(job.userId, job.providerId);
    
    // 1. Connect to CalDAV server
    const caldavClient = new CalDAVClient({
      serverUrl: credentials.serverUrl,
      username: credentials.username,
      password: credentials.password,
      authMethod: credentials.authMethod
    });

    // 2. Get calendar list
    const calendars = await caldavClient.getCalendars();
    
    // 3. Sync events from each calendar
    const syncResults = [];
    
    for (const calendar of calendars) {
      // Check for changes using ETag
      const currentETag = await caldavClient.getCalendarETag(calendar.url);
      const lastETag = await this.getLastETag(job.userId, calendar.url);
      
      if (currentETag !== lastETag) {
        // Calendar has changes - fetch events
        const events = await caldavClient.getEvents(calendar.url, {
          timeRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)   // 1 year ahead
          }
        });

        // Process events
        const processedEvents = await this.processCalDAVEvents(events, job.userId);
        
        syncResults.push({
          calendarUrl: calendar.url,
          eventCount: processedEvents.length,
          etag: currentETag
        });

        // Store new ETag
        await this.storeETag(job.userId, calendar.url, currentETag);
      }
    }

    return {
      syncType: 'caldav_polling',
      calendarsProcessed: syncResults.length,
      totalEvents: syncResults.reduce((sum, r) => sum + r.eventCount, 0),
      results: syncResults
    };
  }
}
```

## Sync Performance Optimization

### Intelligent Batching

```typescript
// Event Batch Processing
class SyncBatchProcessor {
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_DELAY = 100; // ms between batches

  async processSyncBatch(
    events: UnifiedEvent[],
    operation: 'create' | 'update' | 'delete'
  ): Promise<BatchResult[]> {
    const batches = this.createBatches(events, this.BATCH_SIZE);
    const results: BatchResult[] = [];

    for (const batch of batches) {
      try {
        const batchResult = await this.processBatch(batch, operation);
        results.push(batchResult);
        
        // Rate limiting delay
        await this.sleep(this.BATCH_DELAY);
        
      } catch (error) {
        // Handle batch errors gracefully
        results.push({
          batchId: batch.id,
          success: false,
          error: error.message,
          processedCount: 0,
          failedCount: batch.events.length
        });
      }
    }

    return results;
  }

  private createBatches(events: UnifiedEvent[], batchSize: number): EventBatch[] {
    const batches: EventBatch[] = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batchEvents = events.slice(i, i + batchSize);
      batches.push({
        id: `batch_${i / batchSize + 1}`,
        events: batchEvents,
        size: batchEvents.length
      });
    }
    
    return batches;
  }
}
```

### Sync Token Management

```typescript
// Incremental Sync Token Handling
class SyncTokenManager {
  async getSyncToken(userId: string, providerId: string): Promise<string | null> {
    const tokenRecord = await ctx.db.query('syncTokens')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('providerId'), providerId))
      .first();

    return tokenRecord?.token || null;
  }

  async updateSyncToken(
    userId: string, 
    providerId: string, 
    newToken: string
  ): Promise<void> {
    const existingRecord = await this.getSyncTokenRecord(userId, providerId);
    
    if (existingRecord) {
      await ctx.db.patch(existingRecord._id, {
        token: newToken,
        updatedAt: new Date()
      });
    } else {
      await ctx.db.insert('syncTokens', {
        userId,
        providerId,
        token: newToken,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async performIncrementalSync(job: SyncJob): Promise<SyncResult> {
    const syncToken = await this.getSyncToken(job.userId, job.providerId);
    
    let syncResult;
    
    switch (job.providerId) {
      case 'google':
        syncResult = await this.googleIncrementalSync(job, syncToken);
        break;
      case 'microsoft':
        syncResult = await this.microsoftIncrementalSync(job, syncToken);
        break;
      default:
        throw new Error(`Incremental sync not supported for ${job.providerId}`);
    }

    // Update sync token for next incremental sync
    if (syncResult.nextSyncToken) {
      await this.updateSyncToken(
        job.userId, 
        job.providerId, 
        syncResult.nextSyncToken
      );
    }

    return syncResult;
  }
}
```

## Monitoring & Observability

### Sync Performance Metrics

```typescript
// Comprehensive Sync Monitoring
interface SyncMetrics {
  // Job processing metrics
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  
  // Queue metrics
  queueDepth: number;
  averageWaitTime: number;
  concurrentProcessors: number;
  
  // Provider-specific metrics
  providerMetrics: {
    [providerId: string]: {
      successRate: number;
      averageLatency: number;
      errorRate: number;
      lastSyncTime: Date;
    };
  };
  
  // Webhook metrics
  webhookMetrics: {
    activeSubscriptions: number;
    renewalSuccessRate: number;
    webhooksProcessed: number;
    averageProcessingTime: number;
  };
  
  // Resource utilization
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    databaseConnections: number;
    apiCallsPerMinute: number;
  };
}

class SyncMonitoringService {
  async generateMetrics(): Promise<SyncMetrics> {
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    const since = new Date(Date.now() - timeWindow);

    return {
      totalJobs: await this.getTotalJobs(since),
      completedJobs: await this.getCompletedJobs(since),
      failedJobs: await this.getFailedJobs(since),
      averageProcessingTime: await this.getAverageProcessingTime(since),
      
      queueDepth: await this.getQueueDepth(),
      averageWaitTime: await this.getAverageWaitTime(since),
      concurrentProcessors: this.CONCURRENT_JOBS,
      
      providerMetrics: await this.getProviderMetrics(since),
      webhookMetrics: await this.getWebhookMetrics(since),
      resourceUsage: await this.getResourceUsage()
    };
  }
}
```

### Real-Time Alerting

```typescript
// Sync Health Alerts
class SyncAlertingService {
  private readonly ALERT_THRESHOLDS = {
    queueDepthCritical: 1000,     // Jobs in queue
    processingTimeCritical: 300,   // Seconds
    errorRateCritical: 0.15,      // 15% error rate
    webhookFailureRate: 0.1,      // 10% webhook failures
    syncLagCritical: 60 * 60      // 1 hour sync lag
  };

  async checkSyncHealth(): Promise<void> {
    const metrics = await this.monitoringService.generateMetrics();
    
    // Queue depth alert
    if (metrics.queueDepth > this.ALERT_THRESHOLDS.queueDepthCritical) {
      await this.sendAlert({
        level: 'critical',
        title: 'High sync queue depth',
        message: `Queue depth: ${metrics.queueDepth} jobs`,
        action: 'Scale up sync processors'
      });
    }

    // Processing time alert
    if (metrics.averageProcessingTime > this.ALERT_THRESHOLDS.processingTimeCritical) {
      await this.sendAlert({
        level: 'warning',
        title: 'Slow sync processing',
        message: `Average processing time: ${metrics.averageProcessingTime}s`,
        action: 'Investigate performance bottlenecks'
      });
    }

    // Provider-specific alerts
    for (const [providerId, providerMetrics] of Object.entries(metrics.providerMetrics)) {
      if (providerMetrics.errorRate > this.ALERT_THRESHOLDS.errorRateCritical) {
        await this.sendAlert({
          level: 'critical',
          title: `High ${providerId} error rate`,
          message: `Error rate: ${(providerMetrics.errorRate * 100).toFixed(1)}%`,
          action: `Check ${providerId} API status and credentials`
        });
      }
    }
  }
}
```

## Production Deployment Configuration

### Environment Setup

```bash
#!/bin/bash
# Webhook & Sync Queue Production Configuration

# Webhook Endpoints
export WEBHOOK_BASE_URL="https://lineartime.app"
export GOOGLE_WEBHOOK_TOKEN="$(openssl rand -hex 32)"
export MICROSOFT_WEBHOOK_SECRET="$(openssl rand -hex 32)"

# Sync Queue Configuration
export SYNC_CONCURRENT_JOBS="10"
export SYNC_MAX_RETRIES="5"
export SYNC_TIMEOUT_MS="600000"  # 10 minutes

# Provider API Configuration
export GOOGLE_API_RATE_LIMIT="1000"    # requests/hour
export MICROSOFT_API_RATE_LIMIT="10000" # requests/hour
export CALDAV_API_RATE_LIMIT="100"     # requests/hour

# Monitoring & Alerting
export SYNC_MONITORING_ENABLED="true"
export ALERT_WEBHOOK_URL="[slack-webhook-url]"
export METRICS_RETENTION_DAYS="90"

# Performance Tuning
export BATCH_SIZE="50"
export BATCH_DELAY_MS="100"
export POLLING_INTERVAL_MS="900000"  # 15 minutes
```

### Health Check Endpoints

```typescript
// Health Check API: /api/health/sync
export async function GET() {
  const healthCheck = {
    timestamp: new Date(),
    status: 'healthy',
    services: {
      syncQueue: await checkSyncQueueHealth(),
      webhooks: await checkWebhookHealth(),
      providers: await checkProviderHealth(),
      database: await checkDatabaseHealth()
    },
    metrics: await generateHealthMetrics()
  };

  const overallStatus = Object.values(healthCheck.services)
    .every(service => service.status === 'healthy') ? 'healthy' : 'degraded';

  return NextResponse.json(healthCheck, {
    status: overallStatus === 'healthy' ? 200 : 503
  });
}
```

## Conclusion

Command Center Calendar's webhook and sync queue architecture provides **enterprise-grade real-time synchronization** through:

- **Hybrid Sync Strategy**: Optimal combination of push notifications and polling
- **Automatic Renewal**: Zero-downtime webhook subscription management
- **Intelligent Queuing**: Priority-based job processing with exponential backoff
- **Comprehensive Monitoring**: Real-time metrics and alerting
- **Fault Tolerance**: Graceful degradation and automatic recovery
- **Security Integration**: End-to-end security with audit logging

This foundation ensures **reliable, scalable, and secure** calendar synchronization across all supported providers while maintaining **optimal performance** and **user experience**.