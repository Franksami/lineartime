# Linear Calendar Development Guide (v0.3.2)

This guide provides comprehensive development practices, patterns, and workflows for contributing to Linear Calendar.

## 🏗️ Architecture Overview

### Core Principles

1. **AI-First Design**: Anthropic Claude integration for intelligent features
2. **Multi-Calendar Integration**: Unified interface for Google, Microsoft, Apple calendars
3. **Performance Optimized**: Sub-second page loads with strategic optimizations
4. **Security by Default**: Encrypted tokens, webhook verification, secure authentication
5. **Type Safety**: Full TypeScript coverage with Convex integration types
6. **Component Composition**: Small, focused components that compose into features

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
├─────────────────┬───────────────────┬───────────────────┤
│  Presentation   │   State Mgmt     │   Backend Intg     │
│   (Components)  │   (Hooks)        │   (APIs)           │
├─────────────────┼───────────────────┼───────────────────┤
│ • shadcn/ui     │ • React Hooks    │ • Convex Client    │
│ • Token Design  │ • Local State    │ • Clerk Auth       │
│ • WCAG AA       │ • Context        │ • AI SDK           │
│ • Responsive    │ • Real-time Sync │ • Calendar APIs    │
└─────────────────┴───────────────────┴───────────────────┘
                                      ↕
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                        │
├─────────────────┬───────────────────┬───────────────────┤
│  Convex DB      │   AI Services    │  Calendar APIs     │
│  (Primary)      │   (Anthropic)    │  (External)        │
├─────────────────┼───────────────────┼───────────────────┤
│ • Real-time     │ • Claude 3.5     │ • Google Calendar  │
│ • Type-safe     │ • Streaming      │ • Microsoft Graph  │
│ • Indexed       │ • Tool Intg      │ • Webhooks         │
└─────────────────┴───────────────────┴───────────────────┘
```

## 🚀 Quick Start for New Developers

### 1. Environment Setup

```bash
# Clone and setup
git clone <repository-url>
cd lineartime
pnpm install

# Copy environment template
cp .env.example .env.local

# Generate encryption keys
openssl rand -hex 32  # For ENCRYPTION_KEY
openssl rand -hex 32  # For WEBHOOK_SECRET
```

### 2. Required API Keys

```env
# Core Requirements
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
MICROSOFT_CLIENT_ID=your_microsoft_client_id

# Encryption (Required)
ENCRYPTION_KEY=your_32_byte_hex_key
WEBHOOK_SECRET=your_random_secret
```

### 3. Development Workflow

```bash
# Start development server
pnpm dev

# In another terminal, start Convex
npx convex dev

# Run tests
pnpm test

# Check linting
pnpm lint
```

## 🧩 Component Development

### Creating New Components

#### 1. Component Structure Pattern
```typescript
// components/ui/new-component.tsx
'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const componentVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-classes',
        destructive: 'destructive-classes',
      },
      size: {
        default: 'default-size',
        sm: 'small-size',
        lg: 'large-size',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Custom props
  onAction?: () => void;
}

const Component = memo<ComponentProps>(({
  className,
  variant,
  size,
  onAction,
  children,
  ...props
}) => {
  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return (
    <div
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  );
});

Component.displayName = 'Component';

export { Component, componentVariants };
```

#### 2. Hook Development Pattern
```typescript
// hooks/use-new-feature.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface UseNewFeatureOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useNewFeature(options: UseNewFeatureOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Convex mutations and queries
  const createFeature = useMutation(api.features.createFeature);
  const features = useQuery(api.features.listFeatures, options.enabled ? {} : 'skip');

  const handleCreate = useCallback(async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createFeature(data);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [createFeature, options]);

  // Memoized computed values
  const featureStats = useMemo(() => {
    if (!features) return null;

    return {
      total: features.length,
      active: features.filter(f => f.status === 'active').length,
      completed: features.filter(f => f.status === 'completed').length,
    };
  }, [features]);

  return {
    features,
    featureStats,
    isLoading,
    error,
    createFeature: handleCreate,
  };
}
```

### AI Integration Patterns

#### 1. AI Chat Component
```typescript
// components/ai/new-ai-feature.tsx
'use client';

import { useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewAIFeatureProps {
  context?: any;
  onResult?: (result: any) => void;
}

export function NewAIFeature({ context, onResult }: NewAIFeatureProps) {
  const [input, setInput] = useState('');

  const { messages, append, isLoading } = useChat({
    api: '/api/ai/chat',
    body: {
      context,
      model: 'anthropic/claude-3-haiku-20240307', // Fast model for feature
    },
    onFinish: (message) => {
      // Process AI response
      const result = parseAIResponse(message.content);
      onResult?.(result);
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    append({
      role: 'user',
      content: input,
    });

    setInput('');
  }, [input, isLoading, append]);

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'p-3 rounded-lg',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground ml-12'
                : 'bg-muted mr-12'
            )}
          >
            {message.content}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI assistant..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Thinking...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
```

#### 2. AI Tool Integration
```typescript
// lib/ai/tools/new-tool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { SchedulingEngine } from '@/lib/ai/SchedulingEngine';

const newToolSchema = z.object({
  input: z.string().describe('Input for the new tool'),
  options: z.object({
    fast: z.boolean().default(false),
    detailed: z.boolean().default(false),
  }).optional(),
});

export const newTool = tool({
  description: 'Description of what this tool does',
  inputSchema: newToolSchema,
  execute: async ({ input, options }) => {
    try {
      // Use AI for processing
      const result = await processWithAI(input, options);

      return {
        success: true,
        result,
        metadata: {
          processedAt: new Date().toISOString(),
          options: options || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          errorAt: new Date().toISOString(),
        },
      };
    }
  },
});
```

## 📅 Calendar Integration Development

### Adding New Calendar Provider

#### 1. Provider Configuration
```typescript
// lib/calendar/providers/config.ts
export interface CalendarProvider {
  id: string;
  name: string;
  authType: 'oauth' | 'basic' | 'token';
  baseUrl: string;
  scopes: string[];
  endpoints: {
    auth: string;
    token: string;
    calendars: string;
    events: string;
    webhook: string;
  };
}

export const PROVIDER_CONFIGS: Record<string, CalendarProvider> = {
  google: {
    id: 'google',
    name: 'Google Calendar',
    authType: 'oauth',
    baseUrl: 'https://www.googleapis.com',
    scopes: ['https://www.googleapis.com/auth/calendar'],
    endpoints: {
      auth: 'https://accounts.google.com/o/oauth2/auth',
      token: 'https://oauth2.googleapis.com/token',
      calendars: '/calendar/v3/calendars',
      events: '/calendar/v3/calendars/{calendarId}/events',
      webhook: 'https://www.googleapis.com/calendar/v3/channels',
    },
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    authType: 'oauth',
    baseUrl: 'https://graph.microsoft.com/v1.0',
    scopes: ['Calendars.ReadWrite', 'Calendars.ReadWrite.Shared'],
    endpoints: {
      auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      calendars: '/me/calendars',
      events: '/me/calendars/{calendarId}/events',
      webhook: '/subscriptions',
    },
  },
};
```

#### 2. Provider Implementation
```typescript
// lib/calendar/providers/new-provider.ts
import { CalendarProvider } from './config';
import { Event } from '@/types/calendar';

export class NewProviderClient {
  private config: CalendarProvider;
  private accessToken: string;

  constructor(config: CalendarProvider, accessToken: string) {
    this.config = config;
    this.accessToken = accessToken;
  }

  async getCalendars(): Promise<Calendar[]> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.calendars}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendars: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCalendars(data);
  }

  async getEvents(calendarId: string, startDate: Date, endDate: Date): Promise<Event[]> {
    const params = new URLSearchParams({
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      $top: '1000',
    });

    const response = await fetch(
      `${this.config.baseUrl}${this.config.endpoints.events.replace('{calendarId}', calendarId)}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformEvents(data);
  }

  async createEvent(calendarId: string, event: Partial<Event>): Promise<Event> {
    const transformedEvent = this.transformEventForProvider(event);

    const response = await fetch(
      `${this.config.baseUrl}${this.config.endpoints.events.replace('{calendarId}', calendarId)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedEvent),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformEventFromProvider(data);
  }

  // Transform methods for data conversion
  private transformCalendars(data: any): Calendar[] {
    // Implementation specific to provider
    return data.value?.map((cal: any) => ({
      id: cal.id,
      name: cal.name,
      color: cal.color || '#3788d8',
      isPrimary: cal.isDefaultCalendar || false,
    })) || [];
  }

  private transformEvents(data: any): Event[] {
    // Implementation specific to provider
    return data.value?.map((event: any) => this.transformEventFromProvider(event)) || [];
  }

  private transformEventForProvider(event: Partial<Event>): any {
    // Transform our event format to provider format
    return {
      subject: event.title,
      start: {
        dateTime: event.startDate,
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.endDate,
        timeZone: 'UTC',
      },
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      location: event.location ? {
        displayName: event.location,
      } : undefined,
    };
  }

  private transformEventFromProvider(event: any): Event {
    // Transform provider format to our format
    return {
      id: event.id,
      title: event.subject || 'Untitled Event',
      startDate: new Date(event.start.dateTime).toISOString(),
      endDate: new Date(event.end.dateTime).toISOString(),
      description: event.body?.content || '',
      location: event.location?.displayName || '',
      category: event.categories?.[0] || 'personal',
      provider: this.config.id,
      providerEventId: event.id,
    };
  }
}
```

### Database Schema Updates

#### 1. Adding New Tables
```typescript
// convex/schema.ts
export default defineSchema({
  // ... existing tables

  // New feature table
  newFeatures: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("archived")
    ),
    settings: v.object({
      enabled: v.boolean(),
      config: v.any(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
});
```

#### 2. Adding New Indexes to Existing Tables
```typescript
// Adding indexes to existing table
events: defineTable({
  // ... existing fields
})
  .index("by_user", ["userId"])
  .index("by_start_time", ["startTime"])
  .index("by_user_and_time", ["userId", "startTime"])
  .index("by_category", ["categoryId"])
  .index("by_user_and_category", ["userId", "categoryId"])
  .index("by_updated", ["updatedAt"])
  .index("by_user_updated", ["userId", "updatedAt"])
  // New performance indexes
  .index("by_user_time_range", ["userId", "startTime", "endTime"])
  .index("by_user_category_time", ["userId", "categoryId", "startTime"])
  .index("by_user_all_day", ["userId", "allDay", "startTime"]),
```

### Convex Function Development

#### 1. Query Functions
```typescript
// convex/queries/new-feature.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getNewFeature = query({
  args: {
    featureId: v.id("newFeatures"),
  },
  handler: async (ctx, args) => {
    const feature = await ctx.db.get(args.featureId);

    if (!feature) {
      throw new Error("Feature not found");
    }

    // Check if user has access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || feature.userId !== identity.subject) {
      throw new Error("Access denied");
    }

    return feature;
  },
});

export const listUserFeatures = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const query = ctx.db
      .query("newFeatures")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject));

    if (args.status) {
      return await query
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    }

    return await query.collect();
  },
});
```

#### 2. Mutation Functions
```typescript
// convex/mutations/new-feature.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createNewFeature = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    settings: v.object({
      enabled: v.boolean(),
      config: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing feature with same name
    const existing = await ctx.db
      .query("newFeatures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("Feature with this name already exists");
    }

    const now = Date.now();
    const featureId = await ctx.db.insert("newFeatures", {
      userId: user._id,
      name: args.name,
      description: args.description,
      status: "active",
      settings: args.settings,
      createdAt: now,
      updatedAt: now,
    });

    return featureId;
  },
});

export const updateNewFeature = mutation({
  args: {
    featureId: v.id("newFeatures"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("archived")
    )),
    settings: v.optional(v.object({
      enabled: v.boolean(),
      config: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    const { featureId, ...updates } = args;

    const feature = await ctx.db.get(featureId);
    if (!feature) {
      throw new Error("Feature not found");
    }

    // Check access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || feature.userId !== identity.subject) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(featureId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return featureId;
  },
});
```

## 🧪 Testing Patterns

### Unit Tests
```typescript
// tests/components/new-component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '@/components/ui/new-component';

describe('NewComponent', () => {
  it('renders correctly with default props', () => {
    render(<NewComponent>Click me</NewComponent>);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<NewComponent onClick={handleClick}>Click me</NewComponent>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct accessibility attributes', () => {
    render(<NewComponent>Click me</NewComponent>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabIndex', '0');
    expect(button).toHaveAttribute('aria-label', expect.any(String));
  });

  it('supports keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<NewComponent onClick={handleClick}>Click me</NewComponent>);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests
```typescript
// tests/integration/calendar-sync.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCalendarSync } from '@/hooks/use-calendar-sync';
import { ConvexProvider } from 'convex/react';
import { convex } from '@/lib/convex';

describe('Calendar Sync Integration', () => {
  const wrapper = ({ children }) => (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );

  it('syncs events from Google Calendar', async () => {
    const { result } = renderHook(() => useCalendarSync(), { wrapper });

    act(() => {
      result.current.connectProvider('google');
    });

    // Wait for sync to complete
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.events.length).toBeGreaterThan(0);
    expect(result.current.lastSyncAt).toBeDefined();
  });

  it('handles sync conflicts correctly', async () => {
    // Setup conflicting events
    const localEvent = createTestEvent({ title: 'Local Event' });
    const remoteEvent = createTestEvent({
      title: 'Remote Event',
      providerEventId: 'remote-123'
    });

    const { result } = renderHook(() => useCalendarSync(), { wrapper });

    act(() => {
      result.current.syncEvents([localEvent, remoteEvent]);
    });

    await waitFor(() => {
      expect(result.current.conflicts.length).toBe(1);
    });

    // Test conflict resolution
    act(() => {
      result.current.resolveConflict(result.current.conflicts[0].id, 'remote');
    });

    expect(result.current.conflicts.length).toBe(0);
  });
});
```

### AI Integration Tests
```typescript
// tests/ai-integration.test.ts
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AI_MODELS } from '@/lib/ai-config';

describe('AI Integration', () => {
  jest.setTimeout(30000); // AI calls can be slow

  it('generates text with Claude', async () => {
    const result = await generateText({
      model: AI_MODELS.CHAT,
      prompt: 'Hello, test message',
      temperature: 0.7,
    });

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.usage).toBeDefined();
  });

  it('uses correct AI models', () => {
    expect(AI_MODELS.CHAT).toBeDefined();
    expect(AI_MODELS.PARSING).toBeDefined();
    expect(AI_MODELS.SCHEDULING).toBeDefined();
  });

  it('handles AI tool calls', async () => {
    const result = await generateText({
      model: AI_MODELS.SCHEDULING,
      prompt: 'Schedule a meeting for tomorrow at 2 PM',
      tools: {
        suggestSchedule: tool({
          description: 'Suggest optimal time slots',
          inputSchema: suggestScheduleSchema,
          execute: async ({ title, duration }) => {
            return { suggestions: [] };
          },
        }),
      },
    });

    expect(result.toolCalls).toBeDefined();
    expect(result.toolResults).toBeDefined();
  });
});
```

## 🔧 Debugging and Troubleshooting

### Common Issues

#### 1. AI Integration Issues
```bash
# Check Anthropic API key
echo $ANTHROPIC_API_KEY

# Test AI endpoint directly
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Check Convex AI functions
npx convex function aiChat.ensureChat --args '{"userId":"test"}'
```

#### 2. Calendar Sync Issues
```bash
# Check provider connection
npx convex query calendar.providers.getConnectedProviders

# View sync queue status
npx convex query calendar.sync.getSyncQueueStatus

# Check sync logs
npx convex logs --grep sync
```

#### 3. Performance Issues
```bash
# Check database query performance
npx convex logs --grep query

# Monitor memory usage
npx convex function performance.getMemoryStats

# Check index usage
npx convex function performance.getIndexStats
```

### Development Tools

#### 1. Convex Dashboard
```bash
# Open Convex dashboard
npx convex dashboard

# View function metrics
npx convex function --list

# Check deployment status
npx convex status
```

#### 2. AI Development Tools
```typescript
// Debug AI responses
const debugAI = async (prompt: string) => {
  const result = await generateText({
    model: AI_MODELS.CHAT,
    prompt,
    temperature: 0,
  });

  console.log('AI Response:', result.text);
  console.log('Usage:', result.usage);
  console.log('Finish Reason:', result.finishReason);
};

// Test scheduling engine
const testScheduling = async () => {
  const engine = new SchedulingEngine();
  const result = await engine.schedule({
    title: 'Test Meeting',
    duration: 60,
    preferredTimes: [],
    priority: 3,
  });

  console.log('Schedule Result:', result);
};
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run all tests: `pnpm test`
- [ ] Check linting: `pnpm lint`
- [ ] Build production bundle: `pnpm build`
- [ ] Test AI integration with production keys
- [ ] Verify all environment variables
- [ ] Test calendar integrations
- [ ] Check performance metrics

### Deployment Steps
```bash
# 1. Deploy Convex functions
npx convex deploy

# 2. Build Next.js application
pnpm build

# 3. Start production server
pnpm start

# 4. Verify deployment
curl -f https://your-domain.com/api/health
```

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check AI response times
- [ ] Verify webhook endpoints
- [ ] Test calendar synchronization
- [ ] Monitor performance metrics

## 📚 Learning Resources

### Recommended Reading
1. **Convex Documentation**: Master real-time backend development
2. **Anthropic Claude Docs**: Learn AI integration patterns
3. **Microsoft Graph API**: Calendar integration best practices
4. **Google Calendar API**: OAuth and webhook implementation
5. **Next.js App Router**: Modern React development patterns

### Key Patterns to Master
1. **Convex Query Optimization**: Strategic indexing for performance
2. **AI Tool Integration**: Building conversational AI features
3. **Calendar Provider Abstraction**: Unified multi-calendar interface
4. **Real-time Synchronization**: Webhook handling and conflict resolution
5. **Type-Safe Development**: Full TypeScript integration patterns

## 🤝 Contributing Guidelines

### Code Standards
- **TypeScript First**: All code must be fully typed
- **Component Composition**: Small, reusable components
- **Performance Optimized**: Lazy loading and memoization
- **Accessibility**: WCAG AA compliance for all UI
- **Security**: Input validation and secure token handling

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-calendar-provider
# Make changes and test
git add .
git commit -m "feat: add new calendar provider integration"
git push origin feature/new-calendar-provider

# Create pull request with:
# - Detailed description
# - Test coverage
# - Documentation updates
# - Performance impact analysis
```

### Documentation Updates
- **README.md**: Update for any new features or breaking changes
- **API Reference**: Document new endpoints and parameters
- **Setup Guide**: Update for new dependencies or configuration
- **Changelog**: Detailed version history and migration notes

---

**Development Guide Version**: 0.3.2
**Last Updated**: January 26, 2025
**Status**: Comprehensive development framework for AI-powered calendar
