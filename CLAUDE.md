# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

### Current Session Context
- Active Task: CheatCal Strategic Transformation Implementation
- Last Updated: August 27, 2025
- Checkpoint: CheatCal PRD Analysis Complete + Documentation Structure Created

**CheatCal - "The Calendar That Cheats For You"** - Revolutionary AI-powered coordination optimization platform for money-focused professionals. Built on proven 133,222+ line quantum calendar infrastructure with controversial positioning and multi-modal AI capabilities.

**Current Version**: v1.0.0 (CheatCal Foundation - Strategic Transformation)
**Previous Foundation**: v0.3.3 (Enterprise Calendar Integration Platform - PRESERVED)
**Target Version**: v2.0.0 (CheatCal Market Validation & Community Launch)
**Project Philosophy**: "AI-powered coordination optimization for money-focused professionals through sophisticated analysis, elite service provider marketplace, and always-available productivity enhancement"

### 💀 **STRATEGIC EVOLUTION: LinearTime → CheatCal**

**REVOLUTIONARY MISSION**: Transform the existing quantum calendar infrastructure into **CheatCal** - the world's first AI-powered coordination optimization platform that uses controversial positioning and multi-modal AI surveillance to help high-revenue professionals "cheat" at productivity.

**TARGET MARKET**: Money-focused professionals who prioritize results over conventional methods:
- Course creators ($30K+ launches): Complex launch coordination optimization  
- Agency owners ($500K+ revenue): Client coordination and operational efficiency
- Family offices ($10M+ AUM): Multi-professional investment decision coordination
- Elite professionals: Anyone who values measurable productivity ROI over privacy concerns

**BUSINESS MODEL**: Triple revenue stream innovation:
- Community Education: $49-$999/month CheatCal University (Hustlers University model)
- Marketplace Value-Sharing: 15-25% of coordination improvement value created
- Viral Authority Building: Success stories → viral content → thought leadership

### 🔗 **Current Foundation: Calendar Integration Platform**

#### **4-Provider Calendar Integration System**
- **Google Calendar**: OAuth 2.0 with real-time webhook notifications
- **Microsoft Graph**: OAuth 2.0 with Graph API subscriptions and push notifications
- **Apple iCloud CalDAV**: RFC4791 compliant CalDAV with app-specific passwords
- **Generic CalDAV**: Universal CalDAV support for any standards-compliant server
- **Server-Side Encryption**: AES-256-GCM encryption via Convex for all provider tokens
- **Real-Time Sync**: Webhook-driven synchronization with automatic renewal
- **Background Processing**: Intelligent sync queue with exponential backoff retry

#### **10 Calendar Library Support**
- **LinearCalendarHorizontal** (Core Foundation) - 12-month horizontal timeline
- **FullCalendar Pro** - Professional calendar with advanced scheduling features
- **Toast UI Calendar** - Drag & drop functionality with comprehensive toolbar
- **React Big Calendar** - React-native calendar with responsive drag & drop
- **React Infinite Calendar** - Infinite scrolling virtualized calendar
- **PrimeReact Calendar** - Enterprise React calendar with statistics
- **MUI X Calendar** - Material Design calendar with multiple picker variants
- **React Calendar** - Lightweight calendar with tile customization
- **React DatePicker** - Date selection with calendar popup integration
- **React Day Picker** - Flexible day picker with advanced customization
- **ProgressCalendarView** - Progress visualization with dot indicators

#### **Enterprise Security Architecture**
- **Zero-Trust Model**: Server-side AES-256-GCM token encryption
- **Webhook Security**: Signature verification for all provider webhooks
- **Audit Logging**: Comprehensive security event tracking
- **GDPR Compliance**: Right to be forgotten and data portability
- **SOC 2 Ready**: Enterprise security controls and monitoring

#### **Previous Foundation (v0.3.1)**
- **Convex Backend**: Real-time database with direct webhook handling
- **Clerk Authentication**: Complete user lifecycle management via webhooks
- **Stripe Billing**: Subscription management with graceful API fallbacks
- **shadcn/Vercel Tokens**: Pure semantic design token system (glass effects removed)
- **Timeline Redesign**: Vertical month-by-month view (editing centralized to Manage + Command Bar)

## 🔒 CRITICAL: FOUNDATION LOCKED

### **THE LINEAR CALENDAR FOUNDATION IS IMMUTABLE (LAYOUT), IMPLEMENTATION MAY IMPROVE**

The locked rules are defined in `docs/LINEAR_CALENDAR_FOUNDATION_SPEC.md`. The core layout must never be broken. Implementation improvements (performance, tokens, motion, a11y, AI overlays) are allowed.

#### **LOCKED FOUNDATION STRUCTURE (see spec):**
- 12 vertical month rows (Jan→Dec stacked), each a single continuous horizontal row
- Week day headers at top and bottom aligned with day columns
- Month labels on both left and right
- Correct day-of-week alignment for any year; 42-cell grid per month with empty leading/trailing cells
- Year header with tagline; bordered grid

#### **PRIMARY CALENDAR COMPONENT (USE ONLY THIS):**
```tsx
// ✅ ONLY USE THIS COMPONENT:
<LinearCalendarHorizontal
  year={currentYear}
  events={calendarEvents}
  className="h-full w-full"
  onEventCreate={handleEventCreate}
  onEventUpdate={handleEventUpdate}
  onEventDelete={handleEventDelete}
  enableInfiniteCanvas={true}
/>
```

⚠️ **WARNING**: Any change that breaks the layout in the spec **BREAKS THE PRODUCT**. All development must build ON TOP OF the locked foundation.

## 📦 Essential Commands

### Development
```bash
# Start development server
npm run dev                     # Runs on port 3000 with Turbopack

# Build & Production
npm run build                   # Production build with Turbopack
npm run start                   # Run production server

# Linting
npm run lint                    # ESLint check
```

### Testing Commands (MANDATORY)
```bash
# Foundation Protection (REQUIRED before commits)
npm run test:foundation         # Validates locked foundation structure

# Full Test Suite
npm run test:all               # All Playwright tests
npx playwright test            # Run all tests
npx playwright test --ui       # Interactive UI for testing

# Specific Tests
npx playwright test tests/foundation-validation.spec.ts
npx playwright test tests/comprehensive-ui-test.spec.ts
npx playwright test --grep "event creation"

# Test Helpers
npm run test:manual            # Manual testing helper
npm run test:seed              # Seed test data

# CI Validation
npm run ci:guard               # Pre-commit validation
```

### Git Workflow (MANDATORY)
```bash
# ❌ NEVER DO THIS:
git push origin main           # BLOCKED - Direct push prohibited

# ✅ REQUIRED WORKFLOW:
# 1. Create feature branch
git checkout -b feature/task-[ID]-[description]

# 2. Run tests BEFORE committing
npm run test:foundation        # MANDATORY
npx playwright test           # Feature tests
npm run build                 # Build validation

# 3. Commit (only if tests pass)
git add .
git commit -m "feat: [feature] - validated with tests"

# 4. Create Pull Request
git push origin feature/[branch-name]
gh pr create --title "Task #[ID]: [Feature]" --body "[testing details]"

# 5. WAIT for CodeRabbit review
# 6. Merge ONLY after approval
```

## 🏗 High-Level Architecture

### Calendar Integration Platform Architecture

#### **Core Foundation Component (LOCKED)**
**Primary Component (USE THIS)**:
- `components/calendar/LinearCalendarHorizontal.tsx` - The ONLY foundation calendar
  - Horizontal linear timeline (immutable core identity)
  - 12 months in continuous rows
  - Zoom controls & infinite canvas
  - Target: 10,000+ events with provider sync
  - Integration with all 4 calendar providers

#### **Calendar Library System (10 Libraries)**
**CalendarProvider Architecture**:
- `components/calendar/providers/CalendarRegistry.tsx` - Central library registry
- `components/calendar/providers/CalendarRenderer.tsx` - Unified rendering engine
- `components/calendar/providers/types.ts` - Type definitions and interfaces

**Supported Calendar Libraries**:
1. `LinearCalendarHorizontal.tsx` - Core foundation (always available)
2. `FullCalendarView.tsx` - Professional scheduling with advanced features
3. `ToastUICalendarView.tsx` - Drag & drop with comprehensive toolbar
4. `ReactBigCalendarView.tsx` - React Big Calendar with responsive design
5. `ReactInfiniteCalendarView.tsx` - Infinite scrolling with virtualization
6. `PrimeReactCalendarView.tsx` - Enterprise statistics and analytics
7. `MUIXCalendarView.tsx` - Material Design with multiple picker variants
8. `ReactCalendarView.tsx` - Lightweight with tile customization
9. `ReactDatePickerView.tsx` - Date picker with calendar integration
10. `ReactDayPickerView.tsx` - Flexible day picker
11. `ProgressCalendarView.tsx` - Progress tracking with dot visualization

#### **Provider Integration Components**
**Calendar Sync System**:
- `convex/calendar/providers.ts` - Provider registration and configuration
- `convex/calendar/google.ts` - Google Calendar API with OAuth 2.0
- `convex/calendar/microsoft.ts` - Microsoft Graph API integration
- `convex/calendar/caldav.ts` - CalDAV protocol for Apple/Generic providers
- `convex/calendar/sync.ts` - Sync engine with queue management

**Webhook System**:
- `app/api/webhooks/google/route.ts` - Google push notifications
- `app/api/webhooks/microsoft/route.ts` - Microsoft Graph webhooks
- `lib/webhook-security.ts` - Signature verification and security
- `lib/sync-queue.ts` - Background job processing

#### **Enhanced Calendar Toolbar**
- `components/calendar/EnhancedCalendarToolbar.tsx` - Modern toolbar with animations
  - Library switching capabilities
  - Provider sync controls
  - AI scheduling integration
  - Keyboard shortcuts
  - Mobile-responsive design

#### **Legacy/Deprecated Components**
**DO NOT USE**:
- `LinearCalendarVertical.tsx` - Violates horizontal layout foundation
- `VirtualCalendar.tsx` - Experimental only
- `AdvancedCalendarToolbar.tsx` - Replaced by EnhancedCalendarToolbar
- Direct provider API calls - Use CalendarProvider system

### State Management

**CalendarContext** (`contexts/CalendarContext.tsx`):
- Global calendar state with useReducer
- Performance optimized with batch updates
- Accessibility announcements
- Mobile-specific state

**Hooks**:
- `useLinearCalendar.ts` - Event CRUD with IndexedDB
- `useCalendarEvents.ts` - Event-specific logic
- `use-gesture/react` - Touch gesture support

### Storage Architecture

#### **Convex Real-Time Database**
- **Provider Token Storage**: AES-256-GCM encrypted credentials
- **Unified Events**: Cross-provider event synchronization
- **Webhook Subscriptions**: Automatic renewal and management
- **Sync Jobs**: Background processing queue with retry logic
- **Audit Logs**: Comprehensive security and sync event tracking

#### **Client-Side Storage (IndexedDB with Dexie)**
- **Local Event Cache**: Offline-first architecture for performance
- **Sync State**: Last sync tokens and provider status
- **User Preferences**: Calendar library and display settings
- **Migration Support**: Backward compatibility with LocalStorage

#### **Event Transformation System**
- **Unified Format**: Common event structure across all providers
- **Bidirectional Mapping**: Provider-specific to unified format conversion
- **Conflict Resolution**: Last-write-wins with user override options
- **Timezone Handling**: IANA timezone database with UTC normalization

### AI Integration

**Vercel AI SDK v5**:
- OpenAI integration for scheduling
- Natural language event parsing (Chrono.js)
- Conflict resolution
- Focus time protection

### 🏢 Backend Integration Architecture (v0.3.1)

**Convex + Clerk + Stripe Complete Integration**:

#### Convex HTTP Endpoints (`convex/http.ts`)
```typescript
// Direct webhook handling in Convex via HTTP router
const http = httpRouter();
http.route({
  path: "/clerk-user-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Svix signature verification for security
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, svixHeaders);
    // Handle user lifecycle events
    await ctx.runMutation(internal.clerk.upsertFromClerk, {...});
  }),
});
```

#### User Lifecycle Management
- **Clerk Webhook URL**: `https://incredible-ibis-307.convex.cloud/clerk-user-webhook`
- **Automatic Subscription Init**: New users get free tier subscriptions via `initializeUserSubscription`
- **Cascading Deletion**: User deletion triggers cleanup across 7 related Convex tables
- **Security**: Svix signature verification with proper error handling

#### Billing System Integration
- **Graceful Stripe Fallbacks**: APIs return 503 when Stripe not configured (development-friendly)
- **Free Tier Auto-Init**: Users without subscriptions automatically treated as free tier
- **Production Ready**: Full webhook signature verification and security measures

#### Environment Variables (Phase 2.6 Requirements)
```bash
# Core Platform (Required)
NEXT_PUBLIC_CONVEX_URL=https://incredible-ibis-307.convex.cloud
CLERK_WEBHOOK_SECRET=whsec_[configured]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[configured]

# Calendar Integration Platform (Required)
CONVEX_ENCRYPTION_MASTER_KEY=[AES-256-GCM-key]  # Server-side token encryption
CONVEX_ENCRYPTION_ALGORITHM=AES-256-GCM
CONVEX_ENCRYPTION_SALT=[128-bit-salt]

# Google Calendar Integration
GOOGLE_CLIENT_ID=[oauth-client-id]
GOOGLE_CLIENT_SECRET=[oauth-client-secret]
GOOGLE_WEBHOOK_TOKEN=[webhook-verification-token]

# Microsoft Graph Integration
MICROSOFT_CLIENT_ID=[azure-app-id]
MICROSOFT_CLIENT_SECRET=[azure-app-secret]
MICROSOFT_WEBHOOK_SECRET=[webhook-signature-secret]

# Webhook Configuration
NEXT_PUBLIC_APP_URL=https://lineartime.app  # For webhook callbacks
WEBHOOK_RENEWAL_THRESHOLD_HOURS=24         # Hours before expiration

# Optional (graceful fallbacks when missing)
STRIPE_SECRET_KEY=sk_live_[configured]  
STRIPE_WEBHOOK_SECRET=whsec_[configured]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[configured]
```

#### Design System Migration (v0.3.1)
- **Pure shadcn/Vercel Tokens**: Migrated from glass effects to semantic design tokens
- **CI Enforcement**: `scripts/ci-guard.js` prevents non-token colors in production
- **Consistent Theming**: All components use `bg-background`, `bg-card`, `text-foreground`, `border-border`
- **Breaking Change**: Glass effects and backdrop-blur completely removed

#### Timeline Architecture Change
- **Before**: Horizontal TimelineContainer component  
- **After**: Vertical month-by-month TimelineView (read-only)
- **Editing**: Centralized in Manage view and Command Bar only
- **Filtering**: All filtering capabilities preserved with improved visual hierarchy

## 🚀 Current Implementation Status

### ✅ Phase 4.5 Sound Effects & UX Enhancement Complete (LATEST)

**Sound Effects System Implementation** - Comprehensive audio feedback system with accessibility-first design:

#### **Sound Effects Architecture**
- **use-sound React Hook**: 1KB + async Howler.js loading for optimal performance
- **Three Sound Types**: Success, error, and notification sounds for different interactions
- **Sound Service**: Clean separation between React hook (`useSoundEffects`) and standalone service
- **Settings Integration**: Volume control, per-type toggles, and sound preview buttons
- **Performance Impact**: Maintains 112+ FPS with minimal bundle size increase

#### **Accessibility & Compliance**
- **prefers-reduced-motion**: Respects user accessibility preferences automatically
- **Browser Autoplay Policy**: Compliant with modern browser restrictions (requires user gesture)
- **WCAG 2.1 AA**: Full compliance with accessibility standards and proper ARIA labels
- **Cross-Browser Support**: Works across Chrome, Firefox, Safari, and Edge with graceful degradation
- **Mobile Optimization**: Touch gesture support and mobile-specific optimizations

#### **Core Integration Points**
- **Event Operations**: Success sounds for create/update/delete operations
- **Sync Operations**: Notification sounds for background calendar synchronization
- **Error States**: Error sounds for failed operations and validation issues
- **Settings UI**: Comprehensive NotificationSettings component with real-time controls
- **Settings Persistence**: localStorage integration with global SettingsContext

#### **Testing & Quality Assurance**
- **Comprehensive Test Suite**: `tests/sound-effects.spec.ts` with 5 major test categories
- **Critical Bug Fix**: Resolved dashboard syntax error causing HTTP 500 responses
- **Cross-Browser Validation**: Automated testing across all major browsers
- **Performance Testing**: Verified 112+ FPS maintenance with sound effects active

### ✅ Phase 2.7 Ultimate Integration Dashboard Complete (PREVIOUS)

**Enterprise Integration Dashboard** - Comprehensive monitoring and management interface for the Phase 2.6 foundation:

#### **Ultimate Integration Dashboard** (`/integration-dashboard`)
- **6-Tab Interface**: Providers, Libraries, Sync Monitor, Security, Analytics, Testing
- **Real-Time Analytics**: Interactive Recharts visualizations with live data updates
- **Security Monitoring**: SOC 2, GDPR, ISO 27001 compliance dashboard
- **Sync Queue Monitor**: Live job tracking with exponential backoff visualization  
- **API Testing Center**: Comprehensive endpoint testing with request/response logging
- **Calendar Library Showcase**: Interactive switching between all 10 supported libraries
- **Production Deployment**: Successfully running on localhost:3000/integration-dashboard

#### **Specialized Dashboard Components**
1. **IntegrationAnalyticsCharts.tsx** (411 lines) - Real-time performance analytics using Recharts
2. **SecurityMonitoringDashboard.tsx** (560 lines) - Enterprise security monitoring with compliance indicators
3. **SyncQueueMonitor.tsx** (436 lines) - Real-time sync job monitoring with progress tracking
4. **IntegrationTestingCenter.tsx** - API endpoint testing for all 4 providers with live monitoring

#### **Technical Implementation**
- **Main Dashboard**: 580+ lines orchestrating all components with 6-tab architecture
- **Real-Time Updates**: 30-second intervals with smooth animations and live data
- **Glass-Morphism Design**: Professional enterprise interface with dark mode support
- **Performance Metrics**: <1.5s load time, <100ms tab switching, ~90MB memory usage
- **Mobile Responsive**: Optimized for tablets and smartphones with touch interactions

#### **Enterprise Features Demonstrated**
- Multi-provider calendar integration (Google, Microsoft, Apple CalDAV, Generic CalDAV)
- Real-time system health and performance monitoring
- Enterprise-grade security compliance (SOC 2, GDPR, ISO 27001)
- Comprehensive API testing and validation
- Interactive calendar library comparison and switching
- Production-ready deployment and operational dashboard

### ✅ Phase 2.6 Foundation Complete (FOUNDATION)

#### **Calendar Integration Platform (Enterprise-Grade)**
1. **4-Provider Integration System** - Google, Microsoft, Apple CalDAV, Generic CalDAV
2. **Server-Side AES-256-GCM Encryption** - Zero client-side credential storage
3. **Real-Time Webhook System** - Push notifications with automatic renewal
4. **Background Sync Queue** - Intelligent job processing with exponential backoff
5. **10 Calendar Library Support** - Unified CalendarProvider architecture
6. **Event Transformation System** - Bidirectional provider-to-unified mapping
7. **Enterprise Security** - Comprehensive audit logging and threat detection
8. **Sync Performance Optimization** - Batch processing and rate limiting
9. **CalDAV Protocol Support** - RFC4791 compliant for Apple/Generic providers
10. **OAuth 2.0 Integration** - Secure authentication flow for Google/Microsoft

#### **Calendar Library Architecture (10 Libraries)**
11. **LinearCalendarHorizontal** - Core foundation (immutable)
12. **FullCalendar Pro Integration** - Professional scheduling features
13. **Toast UI Calendar** - Drag & drop with comprehensive toolbar
14. **React Big Calendar** - Responsive design with native drag & drop
15. **React Infinite Calendar** - Virtualized infinite scrolling
16. **PrimeReact Calendar** - Enterprise statistics and analytics
17. **MUI X Calendar** - Material Design with picker variants
18. **React Calendar** - Lightweight with tile customization
19. **React DatePicker** - Calendar popup integration
20. **React Day Picker** - Flexible day selection
21. **Progress Calendar** - Dot visualization for task tracking

#### **Enhanced Testing Suite (300+ Tests)**
22. **Integration Tests** - 4-provider sync validation
23. **Calendar Library Tests** - All 10 libraries comprehensively tested
24. **Security Tests** - Token encryption and webhook verification
25. **Performance Tests** - Load testing with 10,000+ events
26. **Mobile Tests** - Cross-device responsive validation
27. **Accessibility Tests** - WCAG 2.1 AA compliance

#### **Previous Foundation Features (Preserved)**
28. **Performance Foundation** - Virtual scrolling, Canvas rendering, IntervalTree
29. **Backend Integration** - Complete Convex + Clerk + Stripe integration with webhooks
30. **User Management** - Automatic user lifecycle, free tier initialization, cascading deletion
31. **Billing System** - Subscription management with graceful Stripe API fallbacks
32. **Design System** - Pure shadcn/Vercel tokens (glass effects completely removed)
33. **Timeline Redesign** - Vertical month-by-month view (editing centralized)
34. **Storage Migration** - IndexedDB implementation, offline-first
35. **Natural Language** - Chrono.js, command bar, real-time parsing
36. **AI Assistant** - Vercel AI SDK, scheduling suggestions
37. **Mobile Support** - Touch gestures, responsive design
38. **Event Creation** - Click/drag-to-create, inline editing
39. **Analytics Dashboard** - Productivity metrics, insights
40. **Category & Tags** - Enhanced organization system
41. **Theme System** - Custom themes with live preview
42. **PWA Features** - Service worker, offline support
43. **Modern Landing Page** - Professional landing page with Clerk integration
44. **Enhanced Dashboard** - Real-time dashboard with productivity metrics and insights

### 🔨 Major System Integrations (v0.3.1 - Just Completed)

**Convex + Clerk + Stripe Integration**:
- Complete authentication and billing infrastructure via `convex/http.ts`
- Direct Clerk webhook handling with Svix signature verification
- User lifecycle management (create, update, delete) with cascading cleanup
- Free tier subscription initialization for new users
- Graceful Stripe API degradation for development environments

**Pure shadcn/Vercel Token Migration**:
- Migrated from glass effects and backdrop-blur to semantic design tokens
- Standardized all components to use `bg-background`, `bg-card`, `text-foreground`
- Enhanced CI enforcement via `scripts/ci-guard.js` to prevent non-token colors
- Category color mappings now use inline token-based styles

**Timeline View Redesign**:
- Replaced horizontal TimelineContainer with vertical month-by-month TimelineView
- Read-only timeline with event cards organized by month
- Editing remains centralized in Manage view and Command Bar
- Maintains all filtering capabilities with improved visual hierarchy

**Integration Testing Suite**:
- 185 comprehensive integration tests across 2 test suites
- `tests/convex-clerk-integration.spec.ts` - 105 integration tests
- `tests/integration-validation.spec.ts` - 80 system validation tests
- Cross-browser compatibility and performance benchmarking

### 🔨 Previous Enhancements

**Analytics Dashboard** (`/analytics`):
- Event category breakdowns, monthly tracking, AI insights, export functionality

**Category Tag Manager**:
- 7 category types, 5 priority levels, custom tags, visual color coding

**Advanced Theme System** (`/themes`):
- Custom theme creator, live preview, theme persistence

**PWA Implementation** (`/test-pwa`):
- Service worker caching, install prompts, background sync

**AI Scheduling Engine** (`/test-ai-scheduling`):
- Intelligent placement, time slot finding, conflict resolution

### 🎨 Modern UI/UX Architecture (Latest Enhancement)

**Landing Page Implementation** (`/app/landing/page.tsx`):
- Modern, professional landing page with "Life is bigger than a week" tagline
- Integrated Clerk authentication (SignInButton, SignUpButton) 
- Framer-motion animations for smooth user experience
- Responsive design with mobile-first approach
- Hero section, features grid, testimonials, and pricing preview
- Navigation component with beta badge and responsive menu
- Optimized for conversions and user onboarding

**Enhanced Dashboard Overview** (`/components/dashboard/DashboardOverview.tsx`):
- Real-time dashboard with live calendar data integration
- **Key Metrics Cards**: Total events, upcoming events, completed today, focus time
- **Productivity Insights**: Peak hours analysis, trend indicators, weekly focus score
- **Upcoming Events Display**: Next 3 events with priority badges and time formatting
- **Activity Feed**: Recent completed events, sync status, conflicts detection
- **Calendar Sync Status**: Real provider integration with sync buttons and status indicators
- **Weekly Goal Progress**: Visual progress bar with percentage tracking
- **Privacy Toggle**: Eye/eye-off button for metrics visibility
- **Empty States**: Graceful handling when no data available
- **Loading States**: Proper loading indicators and error handling
- **Mobile Responsive**: Adaptive layouts for all device sizes

**UI Components Architecture**:
```tsx
// Landing Page Navigation
<LandingNavigation />   // components/landing/LandingNavigation.tsx

// Dashboard Integration
<DashboardOverview 
  year={currentYear}
  className="dashboard-container"
/>

// View Switching (Enhanced)
<ViewSwitcher 
  currentView={view}
  onViewChange={setView}
/>
```

**Data Integration Hooks**:
- `useCalendarEvents`: Real-time event data with conflict detection
- `useSyncedCalendar`: Convex integration with sync status
- `useUser`: Clerk authentication state
- Real-time metrics calculation from actual calendar data
- Optimistic updates for better user experience

**Testing Strategy**:
- Comprehensive Playwright test suite (`tests/landing-dashboard-ui-enhancements.spec.ts`)
- Cross-browser compatibility testing (Chrome, Firefox, Safari, Mobile)
- Accessibility validation (WCAG 2.1 AA compliance)
- Responsive design testing across device sizes
- Authentication flow validation
- Performance and load time testing
- Error handling and edge case coverage

**Design System Consistency**:
- Uses shadcn/ui components throughout
- Follows established semantic design tokens
- Consistent typography hierarchy and spacing
- Proper focus states and accessibility
- Color contrast validation
- Responsive breakpoints and mobile optimization

**Key Architecture Decisions**:
1. **Real Data Integration**: Dashboard uses actual calendar events instead of mock data
2. **Conditional Rendering**: Components gracefully handle missing data or features
3. **Performance Optimization**: Memoized calculations for metrics and insights
4. **Accessibility First**: Proper ARIA labels, keyboard navigation, screen reader support
5. **Mobile Responsive**: Mobile-first design with progressive enhancement
6. **Error Boundaries**: Graceful error handling and recovery
7. **Loading States**: Proper loading indicators and skeleton states

## 📁 Key Directories

```
lineartime/
├── app/                    # Next.js app router
│   ├── analytics/         # Analytics dashboard
│   ├── dashboard/         # Calendar dashboard (Phase 2.7)
│   ├── integration-dashboard/ # Ultimate Integration Dashboard (Phase 2.7 - NEW)
│   │   └── page.tsx       # Main dashboard with 6-tab interface (580+ lines)
│   ├── landing/          # Modern landing page
│   ├── themes/           # Theme management
│   ├── test-*/           # Test pages (25+ integration test pages)
│   └── api/              # API routes
│       ├── webhooks/     # Provider webhook endpoints (NEW)
│       │   ├── google/   # Google Calendar webhooks
│       │   └── microsoft/ # Microsoft Graph webhooks
│       ├── billing/      # Stripe billing with fallbacks
│       └── sync/         # Sync management APIs (NEW)
├── components/
│   ├── calendar/         # Calendar components (50+ components)
│   │   ├── providers/    # Calendar library system (NEW)
│   │   │   ├── CalendarRegistry.tsx    # Central library registry
│   │   │   ├── CalendarRenderer.tsx    # Unified rendering engine
│   │   │   └── types.ts               # Type definitions
│   │   ├── LinearCalendarHorizontal.tsx # Core foundation (LOCKED)
│   │   ├── FullCalendarView.tsx        # FullCalendar Pro integration
│   │   ├── ToastUICalendarView.tsx     # Toast UI with drag & drop
│   │   ├── ReactBigCalendarView.tsx    # React Big Calendar
│   │   ├── ReactInfiniteCalendarView.tsx # Infinite scrolling
│   │   ├── PrimeReactCalendarView.tsx  # Enterprise features
│   │   ├── MUIXCalendarView.tsx        # Material Design
│   │   ├── ReactCalendarView.tsx       # Lightweight calendar
│   │   ├── ReactDatePickerView.tsx     # Date picker integration
│   │   ├── ReactDayPickerView.tsx      # Day picker
│   │   ├── ProgressCalendarView.tsx    # Progress visualization
│   │   └── EnhancedCalendarToolbar.tsx # Modern toolbar
│   ├── dashboard/        # Enhanced dashboard components (Phase 2.7 - NEW)
│   │   ├── IntegrationAnalyticsCharts.tsx  # Real-time analytics (411 lines)
│   │   ├── SecurityMonitoringDashboard.tsx # Security monitoring (560 lines)
│   │   ├── SyncQueueMonitor.tsx           # Sync job monitoring (436 lines)
│   │   └── IntegrationTestingCenter.tsx    # API endpoint testing
│   ├── landing/          # Landing page components
│   ├── settings/sections/ # Settings with provider integration
│   │   └── CalendarIntegrations.tsx   # Provider connection UI (NEW)
│   ├── ai/              # AI components
│   ├── ui/              # shadcn components (35+)
│   └── theme/           # Theme components
├── convex/              # Convex backend with integration platform
│   ├── calendar/        # Calendar integration system (NEW)
│   │   ├── providers.ts # Provider registration
│   │   ├── google.ts    # Google Calendar API
│   │   ├── microsoft.ts # Microsoft Graph API
│   │   ├── caldav.ts    # CalDAV protocol (Apple/Generic)
│   │   └── sync.ts      # Sync engine with queue
│   ├── auth.ts          # Enhanced with provider encryption
│   ├── http.ts          # Webhook handling (expanded)
│   ├── billing.ts       # Subscription management
│   ├── clerk.ts         # User lifecycle
│   ├── events.ts        # Unified event management (NEW)
│   ├── schema.ts        # Database schema (expanded)
│   └── _generated/      # Auto-generated types
├── contexts/            # React contexts
│   └── CalendarContext.tsx # Enhanced with provider support
├── hooks/              # Custom hooks (20+)
│   ├── useSyncedCalendar.ts  # Provider sync hook (NEW)
│   └── useCalendarNotifications.tsx # Real-time updates (NEW)
├── lib/                # Business logic
│   ├── ai/            # AI scheduling engine
│   ├── db/            # IndexedDB operations
│   ├── sound-service.ts    # Sound effects service (NEW v0.3.3)
│   ├── webhook-security.ts # Webhook signature verification (NEW)
│   ├── sync-queue.ts      # Background job processing (NEW)
│   ├── providers/         # Provider-specific utilities (NEW)
│   └── theme-manager.ts   # Theme management
├── scripts/            # Build tools
│   └── ci-guard.js     # Token-only theming enforcement
├── tests/              # Playwright tests (40+ test files)
│   ├── sound-effects.spec.ts       # Sound effects system tests (NEW v0.3.3)
│   ├── integration/    # Integration test suites (NEW)
│   │   ├── google-calendar-integration.spec.ts
│   │   ├── microsoft-graph-integration.spec.ts
│   │   ├── caldav-integration.spec.ts
│   │   └── provider-sync.spec.ts
│   ├── calendar-libraries/ # Library-specific tests (NEW)
│   │   ├── fullcalendar-integration.spec.ts
│   │   ├── toastui-calendar.spec.ts
│   │   └── [8 other library test files]
│   ├── security/       # Security validation tests (NEW)
│   │   ├── token-encryption.spec.ts
│   │   └── webhook-verification.spec.ts
│   └── foundation/     # Foundation protection tests
│       └── foundation-validation.spec.ts
├── docs/               # Phase 2.6 Foundation Documentation (NEW)
│   ├── INTEGRATION_PLATFORM_ARCHITECTURE.md  # Complete system overview
│   ├── SECURITY_ARCHITECTURE.md              # Enterprise security model
│   ├── WEBHOOK_SYNC_ARCHITECTURE.md          # Real-time sync system
│   ├── DEVELOPMENT_GUIDE.md                  # Local development setup
│   ├── DEPLOYMENT_GUIDE.md                   # Production deployment
│   ├── API_REFERENCE.md                      # Integration API docs
│   └── [legacy documentation preserved]
├── PHASE_2.7_ULTIMATE_INTEGRATION_DASHBOARD.md # Phase 2.7 Dashboard Documentation (NEW)
└── public/             # Static assets & PWA files
```

## 🧪 Testing Methodology

### Testing Hierarchy (MANDATORY)
1. **Foundation Validation** - Structure integrity check
2. **Feature Testing** - New functionality verification
3. **Integration Testing** - Feature + foundation compatibility
4. **Performance Testing** - Benchmarks maintained (112+ FPS, <100MB memory)
5. **Accessibility Testing** - WCAG compliance

### Key Test Files
- `foundation-validation.spec.ts` - Foundation protection (MUST PASS)
- `comprehensive-ui-test.spec.ts` - Full UI validation
- `sound-effects.spec.ts` - Sound effects system validation (NEW v0.3.3)
- `event-creation-improved.spec.ts` - Event creation flows
- `performance-improved.spec.ts` - Performance benchmarks
- `accessibility.spec.ts` - WCAG compliance

## 🎯 Performance Targets

| Metric | Current | Target | Critical? |
|--------|---------|--------|-----------|
| Initial Load | ~1.5s | <500ms | Yes |
| Max Events | 5,000 | 10,000+ | Yes |
| Scroll FPS | 60 | 60 | Yes |
| Memory Usage | ~90MB | <100MB | Yes |
| Event Operations | <150ms | <100ms | No |

## 🚀 Next Development Phase

### Ready for Phase 2.8: Advanced Integration Features  
- **Real-Time Data Integration** - Connect integration dashboard to live Convex backend
- **WebSocket Implementation** - Replace mock data with real-time streaming
- **Calendar Sync Optimization** - Enhanced sync performance with batch operations
- **Provider Health Monitoring** - Advanced monitoring with automated alerts
- **Cross-Calendar Scheduling** - Multi-provider event coordination
- **Integration API Gateway** - Unified API for external integrations

### Phase 3.0 Roadmap: AI-Powered Enterprise Platform
- **AI Scheduling Optimization** - Cross-provider intelligent scheduling
- **Natural Language Processing** - Advanced event creation and management
- **Smart Conflict Resolution** - AI-powered conflict detection and resolution
- **Predictive Calendar Management** - Proactive scheduling suggestions
- **Enterprise SSO Integration** - SAML/OIDC support for enterprise customers
- **Multi-Tenant Architecture** - Organization-level calendar management

### Feature Flags (Environment Variables)
```bash
# .env.local
NEXT_PUBLIC_CALENDAR_LAYOUT=horizontal        # LOCKED - DO NOT CHANGE
NEXT_PUBLIC_USE_HYBRID_CALENDAR=false        # LOCKED - DO NOT CHANGE
NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL=true
NEXT_PUBLIC_FEATURE_CANVAS_RENDER=true
NEXT_PUBLIC_FEATURE_NLP_PARSER=true
```

## ⚠️ Critical Guidelines

### DO NOT:
- ❌ Modify the 12-month horizontal layout
- ❌ Use LinearCalendarVertical component
- ❌ Push directly to main branch
- ❌ Skip foundation tests before commits
- ❌ Commit without running test suite

### ALWAYS:
- ✅ Use LinearCalendarHorizontal as primary calendar
- ✅ Run `npm run test:foundation` before commits
- ✅ Create feature branches for development
- ✅ Wait for CodeRabbit review on PRs
- ✅ Test with 1,000+ events for performance
- ✅ Maintain backward compatibility
- ✅ Build ON TOP OF the locked foundation

## 📚 Complete Platform Documentation

### **Phase 2.7 Ultimate Integration Dashboard**
- `/PHASE_2.7_ULTIMATE_INTEGRATION_DASHBOARD.md` - **Complete dashboard implementation documentation**
- **Dashboard Access**: `http://localhost:3000/integration-dashboard`
- **6-Tab Interface**: Providers, Libraries, Sync Monitor, Security, Analytics, Testing
- **Real-Time Monitoring**: Live analytics, security compliance, sync queue monitoring

### **Phase 2.6 Foundation Documentation**
- `/docs/INTEGRATION_PLATFORM_ARCHITECTURE.md` - **Complete integration platform overview**
- `/docs/SECURITY_ARCHITECTURE.md` - **Enterprise security and encryption model**
- `/docs/WEBHOOK_SYNC_ARCHITECTURE.md` - **Real-time sync and queue system**
- `/docs/ARCHITECTURE.md` - System design (updated for integration platform)

### **Development & Deployment**
- `/docs/DEVELOPMENT_GUIDE.md` - Local development with provider integration
- `/docs/DEPLOYMENT_GUIDE.md` - Production deployment requirements
- `/docs/API_REFERENCE.md` - Complete integration API documentation

### **Foundation & Testing**
- `/docs/LINEAR_CALENDAR_FOUNDATION_LOCKED.md` - Foundation specification (immutable)
- `/docs/TESTING_METHODOLOGY.md` - Testing requirements (updated for integration)
- `/docs/GIT_WORKFLOW_RULES.md` - Git workflow (MANDATORY)
- `/MANUAL_TESTING_CHECKLIST.md` - Manual QA checklist

### **Legacy Documentation**
- `/Advanced Features technical-prd.md` - Technical PRD (Phase 1.0)
- `/docs/CALENDAR_IMPLEMENTATION_SUMMARY.md` - Legacy implementation notes

## 🔧 Common Development Tasks

### Fix Port Conflicts
```bash
# If port 3000 is in use
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Add New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement with tests
3. Run foundation tests: `npm run test:foundation`
4. Run feature tests: `npx playwright test`
5. Create PR for CodeRabbit review

### Debug Performance
```javascript
// Add to components
if (process.env.NODE_ENV === 'development') {
  console.time('render');
  // component logic
  console.timeEnd('render');
}
```

### Debug Integration Issues (v0.3.1)

**Convex Connection Issues**:
```bash
# Check Convex deployment status
npx convex dev                    # Local development
npx convex deploy                 # Production deployment
npx convex dashboard              # View database and functions
```

**Clerk Webhook Issues**:
```bash
# Verify webhook configuration
curl -X POST https://incredible-ibis-307.convex.cloud/clerk-user-webhook \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test"
```

**Stripe API Fallbacks**:
```bash
# Test billing endpoints return 503 when Stripe not configured
curl http://localhost:3000/api/billing/checkout
curl http://localhost:3000/api/billing/portal

# Should return: {"error":"Billing system not configured"}
```

**Environment Validation**:
```bash
# Check required variables are set
echo "NEXT_PUBLIC_CONVEX_URL: $NEXT_PUBLIC_CONVEX_URL"
echo "CLERK_WEBHOOK_SECRET: [configured]"
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
```

### Test Pages Available
- `/` - Main calendar application
- `/analytics` - Analytics dashboard
- `/themes` - Theme management
- `/test-all-features` - Feature showcase
- `/test-ai-scheduling` - AI scheduling tests
- `/test-category-tags` - Category system tests
- `/test-enhanced-calendar` - Enhanced calendar features
- `/test-pwa` - PWA functionality tests