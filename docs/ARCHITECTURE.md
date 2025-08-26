# Linear Calendar Architecture (v0.3.2)

## Overview

Linear Calendar has evolved into an AI-powered enterprise-grade React application with complete multi-calendar integration in v0.3.2. The architecture now features Anthropic Claude AI integration, Microsoft Graph API synchronization, Google Calendar webhooks, real-time data synchronization, advanced performance optimizations, and comprehensive calendar provider management while maintaining the core horizontal 12-month layout foundation.

## Architecture Principles (v0.3.2)

1. **AI-First Calendar**: Anthropic Claude integration for intelligent scheduling and event management
2. **Multi-Calendar Integration**: Unified interface for Google Calendar, Microsoft Outlook, and local events
3. **Backend-First Architecture**: Convex provides real-time data synchronization as the primary data layer
4. **Performance Optimized**: Advanced indexing, lazy loading, and memoization for sub-second page loads
5. **Component Composition**: Small, focused components that compose into larger features
6. **Separation of Concerns**: Clear boundaries between UI, state management, and backend integration
7. **Type Safety**: Full TypeScript coverage including Convex integration types
8. **Graceful Degradation**: APIs degrade gracefully when services not configured (development-friendly)
9. **Token-Only Design**: Pure semantic design tokens (glass effects completely removed)
10. **Security by Default**: Webhook signature verification and secure user lifecycle management
11. **Real-time Synchronization**: Webhook-driven updates across all calendar providers
12. **Accessibility by Default**: WCAG 2.1 AA compliance maintained across all components

## System Architecture (v0.3.2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Next.js Application                             │
├─────────────────┬───────────────────┬─────────────────────────────────────┤
│   Presentation  │  State Management │      Backend Integration            │
│   Layer         │      Layer        │            Layer                    │
├─────────────────┼───────────────────┼─────────────────────────────────────┤
│ • Components    │ • React Hooks     │ • Convex Real-time DB              │
│ • shadcn/ui     │ • Local State     │ • Clerk Authentication             │
│ • Token-only    │ • Context         │ • Anthropic Claude AI              │
│   theming       │ • Event Handlers  │ • Google Calendar API              │
│ • WCAG AA       │ • Real-time sync  │ • Microsoft Graph API              │
│ • Performance   │ • AI Integration  │ • Stripe Billing (with fallbacks)  │
│   Optimized     │ • Calendar Sync   │ • Webhook Security (Svix)          │
└─────────────────┴───────────────────┴─────────────────────────────────────┘
                                      ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                           Backend Services                              │
├──────────────────┬──────────────────┬─────────────────────────────────────┤
│    Convex        │     Clerk        │            AI & Calendar            │
│  (Primary DB)    │  (Auth Provider) │            Providers                │
├──────────────────┼──────────────────┼─────────────────────────────────────┤
│ • HTTP Endpoints │ • User Lifecycle │ • Anthropic Claude 3.5 Sonnet      │
│ • Real-time Sync │ • Webhooks       │ • Google Calendar Webhooks         │
│ • Data Storage   │ • Authentication │ • Microsoft Graph API              │
│ • Query/Mutation │ • Session Mgmt   │ • Conflict Resolution Engine       │
│ • Performance    │ • Security       │ • Smart Scheduling Engine          │
│   Optimized      │                  │ • Real-time Synchronization         │
└──────────────────┴──────────────────┴─────────────────────────────────────┘
                                      ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                         External Services                               │
├──────────────────┬──────────────────┬─────────────────────────────────────┤
│   Stripe         │   Anthropic      │         Calendar APIs               │
│  (Billing)       │   Claude AI      │   (Google + Microsoft)              │
├──────────────────┼──────────────────┼─────────────────────────────────────┤
│ • Subscriptions  │ • AI Chat        │ • Event Synchronization             │
│ • Customer Portal│ • Smart Scheduling│ • Real-time Webhooks              │
│ • Usage Tracking │ • Conflict       │ • Calendar Permissions             │
│ • Graceful       │   Resolution     │ • Provider Management              │
│   Fallbacks      │                  │                                    │
└──────────────────┴──────────────────┴─────────────────────────────────────┘
```

## Design System Architecture (v0.3.1 - BREAKING CHANGES)

### Token-Only Design System (Glass Effects REMOVED)
The application now uses pure semantic design tokens from shadcn/Vercel theme:

```css
/* Core semantic tokens - ALL components MUST use these */
--background: oklch(0 0 0);        /* Pure black background */
--foreground: oklch(1 0 0);        /* White text */
--card: oklch(0.14 0 0);           /* Elevated surfaces */
--border: oklch(0.26 0 0);         /* Subtle borders */
--muted: oklch(0.23 0 0);          /* Secondary surfaces */

/* PROHIBITED in v0.3.1 - CI Guard will block these */
/* backdrop-blur-* classes - REMOVED */
/* glass morphism effects - REMOVED */
/* hardcoded color values - BLOCKED */
```

### Theme Architecture (Updated v0.3.1)
- **shadcn/Vercel Tokens**: Complete semantic design token system
- **CI Enforcement**: `scripts/ci-guard.js` prevents non-token colors
- **Breaking Change**: Glass effects and backdrop-blur completely removed
- **Consistency**: All components use `bg-background`, `bg-card`, `text-foreground`, `border-border`
- **CSS Variables**: Dynamic theming support
- **Dark Mode First**: Optimized for dark environments
- **SSR Compatible**: Safe for server-side rendering

### Layout System
- **Full-Screen**: Edge-to-edge viewport utilization
- **Responsive Grid**: Mobile-first responsive design
- **Overflow Management**: Explicit scroll containers
- **Z-Index Layers**: Consistent stacking contexts

## Component Hierarchy (v0.3.1)

```
App (page.tsx)
└── LinearCalendarHorizontal (IMMUTABLE FOUNDATION)
    ├── Header
    │   ├── Year Selector
    │   ├── Sync Status (Convex connection)
    │   └── Navigation Controls
    ├── FilterPanel (UPDATED - fixed props)
    │   ├── Category Toggles (token-based styling)
    │   └── View Options (viewOptions interface)
    ├── Calendar Grid (12-month horizontal - PRESERVED)
    │   └── Month Rows (12)
    │       └── Day Cells (42 per month)
    │           ├── Event Indicators (token-based colors)
    │           └── Sync Status Indicators (NEW)
    ├── ZoomControls
    ├── EventModal (Enhanced with Convex)
    │   ├── Event Form (real-time validation)
    │   └── Category Selector
    └── Additional Views
        ├── TimelineView (NEW - Vertical month-by-month, read-only)
        ├── BillingSettings (NEW - Stripe integration)
        └── ConflictResolutionModal (NEW - sync conflicts)

Timeline Route (/timeline) - SEPARATE ARCHITECTURE
└── TimelineView (Vertical layout, editing disabled)
    ├── Month Cards (organized by month)
    ├── Event Cards (read-only display)
    └── Filter Integration (preserved functionality)

Manage Route (/manage) - CENTRALIZED EDITING
└── Event Management Interface
    ├── Event List (CRUD operations)
    ├── Command Bar Integration
    └── Bulk Operations
```

## Backend Integration Architecture (v0.3.1)

### Convex HTTP Endpoints
The application now uses direct HTTP endpoints in Convex for webhook handling:

```typescript
// convex/http.ts - Direct webhook handling
const http = httpRouter();

http.route({
  path: "/clerk-user-webhook", 
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Svix signature verification for security
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, svixHeaders);
    
    // Handle user lifecycle events
    await ctx.runMutation(internal.clerk.upsertFromClerk, {
      clerkUserId: evt.data.id,
      // ... user data
    });
  }),
});
```

### User Lifecycle Management
User management now flows through Convex with cascading operations:

1. **User Created (Clerk)** → Webhook → Convex → `initializeUserSubscription`
2. **User Updated (Clerk)** → Webhook → Convex → Update user data
3. **User Deleted (Clerk)** → Webhook → Convex → Cascade deletion across 7 tables

### Billing Integration Flow
```typescript
// Graceful Stripe API fallbacks
const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return key && key !== 'sk_test_placeholder' && key.startsWith('sk_');
};

if (!isStripeConfigured()) {
  return NextResponse.json(
    { error: 'Billing system not configured' }, 
    { status: 503 }
  );
}
```

### Real-time Data Synchronization
- **Convex Queries**: Reactive data fetching with automatic updates
- **Convex Mutations**: Optimistic updates with conflict resolution  
- **IndexedDB Cache**: Local persistence for offline support
- **Webhook Security**: Svix signature verification for all external webhooks

## Data Flow (Updated v0.3.1)

### Enhanced Event Creation Flow
1. User clicks on a day cell in `LinearCalendarHorizontal` (IMMUTABLE FOUNDATION)
2. Calendar handles click event with real-time validation
3. Opens `EventModal` with selected date and Convex context
4. User fills form with real-time sync validation
5. Event processed through Convex mutations with optimistic updates
6. Event saved to Convex DB with IndexedDB cache fallback
7. Real-time updates propagate to all connected clients
8. Component re-renders with new event and sync status indicators

### Timeline View Flow (NEW - Read-Only)
1. User navigates to `/timeline` route
2. `TimelineView` component loads with vertical month-by-month layout
3. Events displayed as organized cards (editing disabled)
4. Filter functionality preserved but editing redirects to `/manage`
5. All event modifications happen in Manage view or Command Bar

### State Management (v0.3.1 - Convex Integration)

The application now uses Convex for real-time state management with local optimization:

```typescript
// Enhanced state with Convex integration
interface CalendarState {
  currentYear: number
  events: Map<string, Event[]>        // Real-time from Convex
  filters: FilterState                // Local state with persistence
  selectedDates: Set<string>          // Local UI state
  hoveredDate: Date | null            // Local UI state
  selectedRange: DateRange | null     // Local UI state
  syncStatus: SyncStatus              // NEW - Convex connection status
  userSubscription: Subscription      // NEW - Billing integration
  conflicts: ConflictResolution[]     // NEW - Sync conflict tracking
}

// Convex integration state
interface SyncStatus {
  isConnected: boolean
  lastSync: Date | null
  pendingOperations: number
  conflicts: number
}
```

Key features (Enhanced v0.3.1):
- **Real-time Events**: Synced from Convex with automatic updates
- **Optimistic Updates**: Local changes applied immediately with server reconciliation
- **Offline Support**: IndexedDB cache with sync on reconnection
- **Conflict Resolution**: Automatic and manual conflict resolution
- **User Management**: Integrated subscription and billing status
- **Performance**: Efficient data structures maintained with real-time updates

## Styling Architecture (v0.3.1 - BREAKING CHANGES)

### Token-Only Design System (Glass Effects REMOVED)

The application now uses a pure semantic token approach:

1. **shadcn/Vercel Tokens**: Semantic design token system
2. **OKLCH Color Space**: Perceptually uniform colors (maintained)
3. **CSS Custom Properties**: Dynamic theming with tokens only
4. **CI Enforcement**: `scripts/ci-guard.js` prevents non-token usage
5. **BREAKING**: Glass morphism and backdrop-blur completely removed

### Token Structure (Enforced)

```css
/* REQUIRED - All components must use these semantic tokens */
:root {
  --background: oklch(0 0 0);           /* bg-background */
  --foreground: oklch(1 0 0);           /* text-foreground */
  --card: oklch(0.14 0 0);              /* bg-card */
  --border: oklch(0.26 0 0);            /* border-border */
  --muted: oklch(0.23 0 0);             /* bg-muted */
}

/* PROHIBITED - CI Guard will block these in builds */
/* .backdrop-blur-* { ... }  ← REMOVED */
/* .glass-* { ... }          ← REMOVED */
/* background: #123456;       ← BLOCKED */
```

### CI Guard Enforcement
```javascript
// scripts/ci-guard.js - Automated token enforcement
const prohibitedPatterns = [
  /backdrop-blur-/,
  /bg-\w+\/\d+/,           // Glass opacity patterns
  /#[0-9a-fA-F]{3,6}/,     // Hex colors
  /rgb\([\d\s,]+\)/,       // RGB colors
];
```

### Layout System

The calendar uses CSS Grid for the main layout:

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(42, 1fr); /* 6 weeks × 7 days */
  gap: 1px;
}
```

## Performance Optimizations

### Rendering Optimizations
- React.memo for expensive components
- useMemo for computed values
- useCallback for stable function references
- Virtualization considered for future with large event counts

### Data Structure Choices
- Map for O(1) event lookups by date
- Set for O(1) selected date checking
- Indexed storage for efficient filtering

### Bundle Optimization
- Tree shaking with Next.js
- Dynamic imports for modals
- Turbopack for fast development builds

## Security Considerations

### Client-Side Security
- Input sanitization for event data
- XSS prevention through React's default escaping
- Content Security Policy headers via Next.js

### Data Privacy
- LocalStorage for offline-first, privacy-first approach
- Optional cloud sync with user consent
- No analytics or tracking by default

## Technology Decisions

### Why Next.js 15?
- App Router for better performance
- Server Components support (future)
- Built-in optimizations
- Excellent TypeScript support
- Turbopack for fast builds

### Why LocalStorage?
- Offline-first capability
- Privacy by default
- Zero latency
- No backend required for MVP
- Simple migration path to cloud

### Why Tailwind CSS?
- Rapid prototyping
- Consistent design system
- Small bundle size with purging
- Excellent responsive utilities
- OKLCH color support

### Why shadcn/ui?
- Accessible by default
- Fully customizable
- Copy-paste components
- TypeScript support
- Radix UI primitives

## Deployment Architecture

### Production Build
```
next build
├── Static Generation (pages)
├── Client Components (calendar)
├── API Routes (future)
└── Optimized Assets
```

### Hosting Options
- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted Node.js

## Future Architecture Considerations

### Scalability Path
1. **Phase 1**: LocalStorage (current)
2. **Phase 2**: Convex for real-time sync
3. **Phase 3**: Edge functions for compute
4. **Phase 4**: Mobile apps with shared core

### Performance Targets
- Initial Load: <3s on 3G
- Time to Interactive: <1s on broadband
- Lighthouse Score: >95
- Bundle Size: <200KB gzipped

### Extension Points
- Plugin system for integrations
- Custom event renderers
- Theme marketplace
- Export adapters
- Import parsers

## Development Workflow

### Code Organization
```
src/
├── components/     # UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities
├── types/         # TypeScript types
└── styles/        # Global styles
```

### Testing Strategy (Future)
- Unit tests for utilities
- Component tests for UI
- Integration tests for workflows
- E2E tests for critical paths

### CI/CD Pipeline (Future)
1. Lint and type check
2. Run tests
3. Build application
4. Deploy preview
5. Run E2E tests
6. Deploy to production

## Dependencies

### Core Dependencies
- next: 15.5.0
- react: 19.0.0
- typescript: 5.0.0
- tailwindcss: 3.4.1
- date-fns: 4.1.0

### UI Dependencies
- @radix-ui/*: Accessible primitives
- class-variance-authority: Component variants
- clsx: Class name utilities
- tailwind-merge: Class deduplication

### Optional Services
- @clerk/nextjs: Authentication
- convex: Real-time backend
- @sentry/nextjs: Error tracking (future)

## Monitoring & Observability (Future)

### Metrics to Track
- Page load times
- User interactions
- Error rates
- Feature usage
- Performance budgets

### Logging Strategy
- Client errors to Sentry
- Performance metrics to analytics
- User events for product insights
- System health dashboards