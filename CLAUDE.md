# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

### Current Session Context
- **Active Phase**: Command Workspace Architecture Implementation
- **Last Updated**: August 27, 2025
- **Checkpoint**: Research Validation Complete + Command Workspace PRD Approved
- **Implementation Status**: Phase 1 Ready (Shell + Views + Command System)

**Command Center Calendar Command Workspace** - AI-powered productivity platform with three-pane workspace architecture (Sidebar + Tabs + Context Dock). Features command-first experience, contextual AI agents, and privacy-first computer vision integration.

**Current Version**: v2.0.0 (Command Workspace Architecture - Research Validated)
**Previous Foundation**: Calendar Integration Platform (PRESERVED as backend infrastructure)
**Target Version**: v2.1.0 (Full Feature Implementation + Mobile Optimization)
**Architecture Philosophy**: "Command-first workspace with progressive disclosure, contextual AI integration, and industry-validated patterns for professional productivity optimization"

### 🏗️ **ARCHITECTURAL EVOLUTION: Command Workspace Hybrid**

**STRATEGIC DIRECTION**: Transform from calendar-centric to workspace-centric architecture with three-pane shell (Sidebar + Tabs + Context Dock), command-first experience, and contextual AI integration.

**CORE WORKSPACE COMPONENTS**:
- **Three-Pane Shell**: Sidebar (sections), Center Tabs (Week/Planner/Notes/Mailbox), Right Context Dock (AI/Details/Conflicts)
- **Command System**: Command Palette (⌘/Ctrl-K) + Omnibox (NL→Actions) for keyboard-first productivity
- **AI Integration**: Context Dock agents (Planner/Conflict/Summarizer/Router) with MCP tools
- **Privacy-First**: Local computer vision processing with consent management and audit logging

**RESEARCH-VALIDATED PATTERNS**:
- **Command-First Interface**: Industry standard validated by Obsidian (Ctrl+P/Cmd+P) and Schedule X patterns
- **Multi-Pane Architecture**: Confirmed by Obsidian Workspaces plugin with saved layout management
- **AI Constraint Solving**: Timefold AI Solver patterns for scheduling optimization and conflict resolution
- **Local Privacy Processing**: ImageSorcery MCP patterns for 100% local computer vision operations

### 🏢 **Backend Foundation: Calendar Integration Platform (PRESERVED)**

**Enterprise Infrastructure** (maintained as backend services):
- **4-Provider System**: Google Calendar, Microsoft Graph, Apple CalDAV, Generic CalDAV
- **Server-Side Encryption**: AES-256-GCM via Convex for all provider tokens
- **Real-Time Sync**: Webhook-driven synchronization with intelligent queue processing
- **Enterprise Security**: Zero-trust model with comprehensive audit logging

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

## 🚨 CRITICAL: ARCHITECTURAL TRANSFORMATION

### **NEW COMMAND WORKSPACE ARCHITECTURE (PRIMARY)**

**PRIMARY SHELL COMPONENT**:
```tsx
// ✅ NEW PRIMARY ARCHITECTURE:
<AppShell>
  <Sidebar sections={['Calendar', 'Tasks', 'Notes', 'Mailbox']} />
  <TabWorkspace>
    <Tab view="week" />
    <Tab view="planner" />
    <Tab view="notes" />
    <Tab view="mailbox" />
  </TabWorkspace>
  <ContextDock panels={['ai', 'details', 'conflicts', 'capacity']} />
</AppShell>
```

### **⚠️ DEPRECATION: Linear Calendar Foundation**

**LinearCalendarHorizontal is DEPRECATED as main shell** - relegated to optional Year Lens view only.

**Governance Enforcement**:
- ESLint ban: `no-restricted-imports` for LinearCalendarHorizontal outside `views/year-lens/*`
- Dependency cruiser: Forbid imports outside Year Lens scope
- CI grep guard: Block accidental legacy imports

**Migration Path**:
- All new development targets Command Workspace shell
- Legacy calendar preserved as `views/year-lens/YearLensView.tsx` (optional, OFF by default)
- No shell or view code may depend on 12-row calendar constraints

⚠️ **CRITICAL**: Any development using LinearCalendarHorizontal outside Year Lens view **VIOLATES the new architecture**.

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

### **Command Workspace Testing (RESEARCH-VALIDATED)**
```bash
# Shell Architecture Tests (NEW MANDATORY)
npm run test:shell             # Command Workspace shell validation
npm run test:commands          # Command palette and keyboard navigation
npm run test:dock              # Context dock panel functionality

# Research-Validated Test Patterns
npx playwright test tests/command-workspace/     # Shell, tabs, dock integration tests
npx playwright test tests/keyboard-navigation/   # Keyboard-first patterns (Schedule X validation)
npx playwright test tests/ai-agents/             # Contextual AI integration (Rasa patterns)
npx playwright test tests/conflict-resolution/   # Constraint-based optimization (Timefold patterns)

# Performance & Accessibility Tests  
npx playwright test tests/performance/           # 60fps, <500ms render, <120ms keyboard response
npx playwright test tests/accessibility/         # WCAG 2.1 AA, keyboard-only, focus management

# Legacy Calendar Tests (Optional Year Lens Only)
npx playwright test tests/year-lens/             # DEPRECATED: Only for Year Lens view

# CI Validation (Updated)
npm run ci:guard               # Architecture compliance validation
npm run test:governance        # ESLint/dependency-cruiser governance checks
```

### Git Workflow (MANDATORY)
```bash
# ❌ NEVER DO THIS:
git push origin main           # BLOCKED - Direct push prohibited

# ✅ REQUIRED WORKFLOW:
# 1. Create feature branch
git checkout -b feature/task-[ID]-[description]

# 2. Run tests BEFORE committing  
npm run test:shell            # MANDATORY - Command Workspace validation
npm run test:governance       # MANDATORY - Architecture compliance checks
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

## 🏗 **Command Workspace Architecture (NEW)**

### **Three-Pane Shell System (PRIMARY)**

#### **Core Shell Components (NEW FOUNDATION)**
**Primary Architecture**:
```tsx
// 🏗️ COMMAND WORKSPACE SHELL ARCHITECTURE:
components/shell/
├── AppShell.tsx              // Main three-pane shell container
├── Sidebar/
│   ├── SidebarSection.tsx    // Calendar, Tasks, Notes, Mailbox sections
│   └── SidebarProvider.tsx   // Sidebar state and persistence
├── TabWorkspace/
│   ├── TabContainer.tsx      // Tab management and routing
│   ├── ViewScaffold.tsx      // Consistent Header + Content + Context
│   └── TabProvider.tsx       // Tab state and navigation
└── ContextDock/
    ├── DockPanel.tsx         // AI, Details, Conflicts, Capacity panels
    ├── DockProvider.tsx      // Panel state and registry
    └── panels/               // Individual dock panel implementations
```

**Research-Validated Patterns**:
- **Multi-Pane Layout**: Based on Obsidian Workspaces plugin architecture
- **Saved Workspace States**: Layout persistence with task-based switching (Obsidian pattern)
- **Tab Management**: Group and persistent state management (Obsidian/Schedule X patterns)

#### **Command System Architecture (NEW)**
**Research-Validated Command Patterns**:
```tsx
// 🎯 COMMAND SYSTEM ARCHITECTURE:
components/commands/
├── CommandPalette.tsx        // ⌘/Ctrl-K palette with fuzzy search
├── CommandRegistry.tsx       // Command registration and routing
├── OmniboxProvider.tsx       // NL→Actions with streaming (Vercel AI SDK)
├── KeyboardManager.tsx       // Global keyboard shortcuts and navigation
└── commands/
    ├── NavigateCommands.tsx  // View switching and navigation
    ├── CreateCommands.tsx    // Entity creation (event/task/note)
    ├── LinkCommands.tsx      // Entity linking and backlinks
    └── ToolCommands.tsx      // AI tool execution and routing
```

**Keyboard Patterns** (Schedule X validated):
- **Command Palette**: Ctrl+P/Cmd+P (industry standard from Obsidian research)
- **Double-Click Creation**: onDoubleClickDateTime/onDoubleClickDate <120ms response
- **Escape Key Standard**: Consistent behavior across all modals with custom callbacks
- **Focus Management**: Automatic focus when modals opened via keyboard navigation

#### **View System Architecture (NEW)**  
**Research-Validated View Patterns**:
```tsx
// 📋 VIEW SYSTEM ARCHITECTURE:
views/
├── week/                     // WeekView (primary view)
├── day/                      // DayView 
├── month-strip/              // MonthStripView (single-row month)
├── quarter/                  // QuarterView (3-month capacity)
├── planner/                  // PlannerView (kanban + time-blocking)
├── notes/                    // NotesView (markdown + embeds)
├── mailbox/                  // MailboxView (triage + conversion)
├── automations/              // AutomationsView (workflow builder)
└── year-lens/                // YearLensView (optional legacy calendar)
    └── YearLensView.tsx      // ONLY place LinearCalendarHorizontal allowed
```

**View Scaffold Contract** (consistent across all views):
- **Header**: Title/range, filters, search, quick actions, view switcher
- **Content**: Virtualized grid/list/canvas with full keyboard navigation
- **Context Integration**: View-specific panel contributions to Context Dock

#### **AI Integration Architecture (NEW)**
**Research-Validated AI Patterns**:
```tsx
// 🤖 AI INTEGRATION ARCHITECTURE:
lib/ai/
├── agents/
│   ├── PlannerAgent.tsx      // Constraint-based scheduling (Timefold patterns)
│   ├── ConflictAgent.tsx     // Real-time conflict detection & resolution
│   ├── SummarizerAgent.tsx   // Slot-based conversation management (Rasa patterns)
│   └── RouterAgent.tsx       // Intent classification with confidence thresholds
├── mcp/
│   ├── MCPToolRegistry.tsx   // MCP tool registration and routing
│   ├── ToolSafety.tsx        // Scoped permissions and audit logging
│   └── tools/                // Calendar, task, note, mail tool implementations
└── context/
    ├── ConversationContext.tsx // Multi-turn conversation state (Rasa patterns)
    ├── ToolContext.tsx         // Tool execution state and results
    └── AgentProvider.tsx       // Agent coordination and communication
```

**AI Agent Patterns** (validated by research):
- **Constraint-Based Planning**: Timefold AI Solver patterns for optimization and conflict resolution
- **Conversation Management**: Rasa framework patterns for context-aware AI interactions
- **Tool Safety**: Auto-approval lists and consent patterns from ImageSorcery MCP research

#### **Context Dock System (NEW)**
**Research-Validated Dock Patterns**:
```tsx
// 📌 CONTEXT DOCK ARCHITECTURE:
components/dock/
├── ContextDock.tsx           // Right-side dock container with panel management
├── DockRegistry.tsx          // Panel registration and lifecycle management
├── panels/
│   ├── AIAssistant/          // Contextual AI agents with streaming responses
│   ├── DetailsPanel/         // Entity properties and metadata (Notion pattern)
│   ├── ConflictsPanel/       // Real-time conflict visualization (Timefold pattern)
│   ├── CapacityPanel/        // Resource capacity and utilization analysis
│   └── BacklinksPanel/       // Entity relationship graph (Obsidian pattern)
└── providers/
    ├── DockProvider.tsx      // Dock state management and persistence
    └── PanelProvider.tsx     // Individual panel state and communication
```

**Dock Panel Features**:
- **Contextual AI**: Agents respond to current view/selection with streaming responses (Rasa patterns)
- **Entity Details**: Properties panel similar to Notion's right-side metadata (validated research)
- **Backlinks Graph**: Visual relationship mapping based on Obsidian graph view patterns

### **State Management Architecture (TRANSFORMED)**

**Primary Providers** (Command Workspace focused):
```tsx
// 🔄 STATE MANAGEMENT ARCHITECTURE:
contexts/
├── AppShellProvider.tsx      // Shell state: tabs, active view, dock panels, layout persistence
├── CommandProvider.tsx       // Command registry, palette state, keyboard mappings  
├── OmniboxProvider.tsx       // NL parsing, streaming results, tool routing (Rasa patterns)
├── WorkspaceProvider.tsx     // Saved layouts, view preferences, user workspace configuration
└── legacy/
    └── CalendarContext.tsx   // LEGACY: Preserved for Year Lens view compatibility
```

**Research-Validated Hooks**:
- `useAppShell.ts` - Shell navigation, tab management, dock panel control
- `useCommands.ts` - Command palette integration with fuzzy search and execution
- `useOmnibox.ts` - Natural language processing with intent classification (Rasa patterns)
- `useWorkspaceLayout.ts` - Layout persistence with task-based switching (Obsidian patterns)
- `useKeyboardNavigation.ts` - Global keyboard shortcuts with focus management (Schedule X patterns)

**Legacy Hooks** (preserved for backend integration):
- `useCalendarEvents.ts` - Event CRUD operations (preserved for calendar data)
- `useSyncedCalendar.ts` - Provider synchronization (preserved for backend integration)

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

## 📁 **Command Workspace Directory Architecture**

### **🏗️ NEW COMMAND WORKSPACE STRUCTURE**
```
lineartime/
├── app/                    # Next.js app router
│   ├── app/               # 🆕 MAIN SHELL ENTRY POINT (/app route)
│   │   ├── page.tsx       # Command Workspace shell mount
│   │   ├── layout.tsx     # Shell layout with providers
│   │   └── loading.tsx    # Shell loading states
│   ├── api/              # Backend API routes (PRESERVED)
│   │   ├── webhooks/     # Calendar provider webhooks  
│   │   ├── billing/      # Stripe billing integration
│   │   └── sync/         # Calendar sync management
│   └── legacy/           # 🚨 DEPRECATED ROUTES (redirect to /app)
│       ├── analytics/    # REDIRECT: → /app?view=analytics
│       ├── dashboard/    # REDIRECT: → /app?view=week  
│       ├── themes/       # REDIRECT: → /app?panel=settings
│       └── test-*/       # REDIRECT: → /app?view=test
├── components/
│   ├── shell/            # 🆕 COMMAND WORKSPACE SHELL (PRIMARY)
│   │   ├── AppShell.tsx          # Three-pane shell container
│   │   ├── Sidebar/              # Left sidebar with sections
│   │   ├── TabWorkspace/         # Center tabs with view scaffolds
│   │   └── ContextDock/          # Right context dock with panels
│   ├── commands/         # 🆕 COMMAND SYSTEM (PRIMARY)
│   │   ├── CommandPalette.tsx    # ⌘/Ctrl-K palette (Obsidian patterns)
│   │   ├── OmniboxProvider.tsx   # NL→Actions (Rasa patterns)
│   │   ├── CommandRegistry.tsx   # Command registration and routing
│   │   └── KeyboardManager.tsx   # Global keyboard navigation
│   ├── dock/             # 🆕 CONTEXT DOCK PANELS (PRIMARY)
│   │   ├── panels/               # AI, Details, Conflicts, Capacity, Backlinks
│   │   ├── DockProvider.tsx      # Panel state and registry
│   │   └── DockContainer.tsx     # Panel management and layout
│   ├── calendar/         # 🚨 LEGACY COMPONENTS (Year Lens only)
│   │   ├── LinearCalendarHorizontal.tsx # 🚨 DEPRECATED: Year Lens view only
│   │   ├── providers/            # Calendar library system (preserved)
│   │   └── [other calendar libs] # Preserved for future integration
│   ├── ui/              # shadcn components (preserved)
│   └── theme/           # Theme components (preserved)
├── views/               # 🆕 COMMAND WORKSPACE VIEWS (PRIMARY)
│   ├── week/            # WeekView (primary view) with view scaffold
│   ├── day/             # DayView with keyboard navigation
│   ├── month-strip/     # MonthStripView (single-row month)
│   ├── quarter/         # QuarterView (3-month capacity planning)
│   ├── planner/         # PlannerView (kanban + time-blocking)
│   ├── notes/           # NotesView (markdown + embeds + entity linking)
│   ├── mailbox/         # MailboxView (triage + entity conversion)
│   ├── automations/     # AutomationsView (workflow builder)
│   └── year-lens/       # 🚨 LEGACY: Year Lens (optional, OFF by default)
│       └── YearLensView.tsx  # ONLY allowed use of LinearCalendarHorizontal
├── contexts/            # 🆕 COMMAND WORKSPACE PROVIDERS (PRIMARY)
│   ├── AppShellProvider.tsx      # Shell state: tabs, dock, layouts
│   ├── CommandProvider.tsx       # Command registry and palette state
│   ├── OmniboxProvider.tsx       # NL parsing and tool routing
│   ├── WorkspaceProvider.tsx     # Layout persistence and preferences
│   └── legacy/                   # 🚨 LEGACY CONTEXTS
│       └── CalendarContext.tsx   # DEPRECATED: Year Lens only
├── hooks/              # 🆕 COMMAND WORKSPACE HOOKS (PRIMARY)
│   ├── useAppShell.ts           # Shell navigation and tab management
│   ├── useCommands.ts           # Command palette and execution
│   ├── useOmnibox.ts            # Natural language processing (Rasa patterns)
│   ├── useWorkspaceLayout.ts    # Layout persistence (Obsidian patterns)
│   ├── useKeyboardNavigation.ts # Global shortcuts (Schedule X patterns)
│   └── legacy/                  # 🚨 LEGACY HOOKS (backend only)
│       ├── useCalendarEvents.ts      # Event CRUD (backend integration)
│       └── useSyncedCalendar.ts      # Provider sync (backend integration)
├── lib/                # Business logic
│   ├── ai/             # 🆕 AI AGENT SYSTEM (PRIMARY)
│   │   ├── agents/     # Planner, Conflict, Summarizer, Router agents
│   │   ├── mcp/        # MCP tool registry and safety
│   │   ├── context/    # Conversation and tool context (Rasa patterns)
│   │   └── tools/      # Calendar, task, note, mail tools
│   ├── cv/             # 🆕 COMPUTER VISION (LOCAL PRIVACY)
│   │   ├── consent/    # Consent management and audit logging
│   │   ├── processor/  # Local CV pipeline (ImageSorcery patterns)
│   │   └── models/     # Local model management and validation
│   ├── db/            # IndexedDB operations (preserved)
│   └── providers/     # Calendar provider utilities (preserved)
├── convex/            # 🏢 BACKEND SERVICES (PRESERVED)
│   ├── calendar/      # Calendar integration platform (preserved)
│   ├── auth.ts        # Authentication and encryption
│   ├── billing.ts     # Subscription management  
│   ├── events.ts      # Unified event management
│   └── schema.ts      # Database schema
├── scripts/            # Build tools
│   └── ci-guard.js     # Token-only theming enforcement
├── tests/              # 🆕 COMMAND WORKSPACE TESTS (RESEARCH-VALIDATED)
│   ├── command-workspace/      # 🆕 PRIMARY TEST SUITE
│   │   ├── shell-integration.spec.ts    # AppShell three-pane functionality
│   │   ├── tab-management.spec.ts       # Tab state and navigation
│   │   ├── dock-panels.spec.ts          # Context dock panel integration
│   │   └── workspace-persistence.spec.ts # Layout saving (Obsidian patterns)
│   ├── keyboard-navigation/    # 🆕 KEYBOARD-FIRST TESTS (Schedule X validation)
│   │   ├── command-palette.spec.ts      # Ctrl+P/Cmd+P functionality
│   │   ├── double-click-creation.spec.ts # <120ms event creation
│   │   ├── escape-key-handling.spec.ts  # Consistent escape behavior
│   │   └── focus-management.spec.ts     # Automatic modal focus
│   ├── ai-agents/             # 🆕 AI INTEGRATION TESTS (Rasa patterns)
│   │   ├── conversation-context.spec.ts # Multi-turn conversation state
│   │   ├── intent-classification.spec.ts # Confidence threshold routing
│   │   ├── constraint-solving.spec.ts   # Timefold AI patterns
│   │   └── tool-safety.spec.ts          # Permission and audit systems
│   ├── performance/           # 🆕 PERFORMANCE VALIDATION
│   │   ├── shell-rendering.spec.ts      # <500ms render targets
│   │   ├── keyboard-response.spec.ts    # <120ms keyboard interaction
│   │   └── bundle-size.spec.ts          # Component size budgets
│   ├── accessibility/         # 🆕 A11Y VALIDATION (WCAG 2.1 AA)
│   │   ├── keyboard-only.spec.ts        # Complete keyboard navigation
│   │   ├── focus-trap.spec.ts          # Modal and panel focus management
│   │   └── screen-reader.spec.ts       # SR announcements and labels
│   ├── year-lens/             # 🚨 LEGACY TESTS (Year Lens only)
│   │   └── foundation-validation.spec.ts # DEPRECATED: Legacy calendar tests
│   └── integration/           # 🏢 BACKEND INTEGRATION TESTS (preserved)
│       ├── calendar-providers.spec.ts    # Calendar sync integration
│       └── security-validation.spec.ts   # Token encryption and webhooks
├── docs/               # 📚 DOCUMENTATION
│   ├── command-workspace/      # 🆕 COMMAND WORKSPACE DOCS (PRIMARY)
│   │   ├── ULTIMATE_COMPREHENSIVE_PRD.md # Complete PRD with research validation
│   │   ├── GOVERNANCE_ENFORCEMENT.md     # ESLint/dependency-cruiser rules
│   │   ├── PHASE_1_CHECKLIST.md         # Implementation roadmap
│   │   └── research/                    # Research validation artifacts
│   │       ├── obsidian_panes_backlinks.md
│   │       ├── cron_keyboard_calendar.md  
│   │       ├── motion_scheduling_automation.md
│   │       ├── sunsama_ritual_planning.md
│   │       ├── ai_workspace_integrations.md
│   │       └── cv_privacy_consent_patterns.md
│   ├── legacy/             # 🚨 LEGACY DOCUMENTATION (reference only)
│   │   ├── INTEGRATION_PLATFORM_ARCHITECTURE.md # Backend integration docs
│   │   ├── LINEAR_CALENDAR_FOUNDATION_SPEC.md   # DEPRECATED: Year Lens only
│   │   └── CALENDAR_IMPLEMENTATION_SUMMARY.md   # Legacy implementation notes
│   └── ARCHITECTURE.md        # Updated for Command Workspace
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

## 🎯 **Research-Validated Performance Targets**

### **Command Workspace Performance Budgets**

| Metric | Target | Research Validation | Critical? |
|--------|--------|---------------------|-----------|
| **Shell Render** | <500ms | Industry standard | Yes |
| **Tab Switch** | <200ms | Obsidian workspace pattern | Yes |
| **Panel Toggle** | <100ms | Context dock responsiveness | Yes |
| **Keyboard Response** | <120ms | Schedule X double-click pattern | Yes |
| **Conflict Detection** | ≤500ms | Timefold AI real-time constraint solving | Yes |
| **Command Palette** | <100ms | Obsidian Ctrl+P/Cmd+P standard | Yes |
| **Scroll/Drag FPS** | 60fps | Schedule X animation requirements | Yes |
| **Memory Usage** | <100MB | Shell + panels efficiency | Yes |
| **Omnibox First Token** | <400ms | AI response streaming | Yes |
| **Agent Suggestions** | ≤2s | Rasa conversation management | Yes |

### **Bundle Size Budgets** (Research-Validated)
| Component | Budget | Justification | Critical? |
|-----------|--------|---------------|-----------|
| **Shell Core** | <150KB | Three-pane architecture base | Yes |
| **Per View** | <100KB | Individual view components | Yes |
| **Per Dock Panel** | <50KB | Context panel efficiency | Yes |
| **Command System** | <75KB | Palette + omnibox combined | Yes |
| **AI Agents** | <200KB | Conversation management + tools | Yes |

## 🚀 **Command Workspace Development Roadmap**

### **Phase 1: Shell Foundation (CURRENT)**  
**Research-Validated Implementation**:
- **AppShell + Three-Pane Layout** - Sidebar + Tabs + Context Dock (Obsidian patterns)
- **Command System** - Palette (Ctrl+P/Cmd+P) + Omnibox with streaming (Schedule X + Rasa patterns)
- **Basic Views** - WeekView + PlannerView with view scaffolding
- **Dock Stubs** - AI Assistant + Details panels with minimal state
- **Governance Enforcement** - ESLint rules, dependency cruiser, CI guards

### **Phase 2: AI & Views Integration**
- **AI Agent Implementation** - Planner/Conflict/Summarizer/Router with constraint solving (Timefold patterns)
- **Advanced Views** - Month Strip, Quarter, Notes, Mailbox, Automations
- **Workflow System** - Recurring automation with step-based progression (Manifestly patterns)
- **Entity Linking** - Backlinks graph and relationship management (Obsidian patterns)

### **Phase 3: Computer Vision & Polish**
- **Local CV Integration** - Privacy-first computer vision with consent management (ImageSorcery patterns)
- **Advanced Dock Panels** - Conflicts visualization, capacity analysis, backlinks graph
- **Performance Optimization** - 60fps animations, <500ms render, <120ms keyboard response
- **Mobile Enhancement** - 700px breakpoint optimization (Schedule X responsive patterns)

### Feature Flags (Environment Variables)
```bash
# .env.local
NEXT_PUBLIC_CALENDAR_LAYOUT=horizontal        # LOCKED - DO NOT CHANGE
NEXT_PUBLIC_USE_HYBRID_CALENDAR=false        # LOCKED - DO NOT CHANGE
NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL=true
NEXT_PUBLIC_FEATURE_CANVAS_RENDER=true
NEXT_PUBLIC_FEATURE_NLP_PARSER=true
```

## ⚠️ **Critical Guidelines (COMMAND WORKSPACE)**

### **🚫 ARCHITECTURAL VIOLATIONS:**
- ❌ Import LinearCalendarHorizontal outside `views/year-lens/*` (ESLint enforced)
- ❌ Create new pages outside `/app` shell routing for product surfaces
- ❌ Bypass Command Workspace shell for new features
- ❌ Skip shell architecture tests before commits
- ❌ Push directly to main branch (unchanged)

### **✅ COMMAND WORKSPACE REQUIREMENTS:**
- ✅ **Use AppShell architecture** for all new development
- ✅ **Implement View Scaffold contract** for new views (Header + Content + Context)
- ✅ **Follow Command Registry patterns** for new commands and shortcuts
- ✅ **Use Context Dock** for contextual information and AI integration
- ✅ **Run `npm run test:shell`** before commits (MANDATORY)
- ✅ **Validate governance compliance** with `npm run test:governance`
- ✅ **Follow research-validated patterns** from Obsidian, Schedule X, Timefold, Rasa, etc.
- ✅ Create feature branches for development (unchanged)
- ✅ Wait for CodeRabbit review on PRs (unchanged)

### **🔧 LEGACY COMPONENT USAGE:**
- ⚠️ **LinearCalendarHorizontal**: ONLY allowed in `views/year-lens/YearLensView.tsx`
- ⚠️ **Calendar Integration**: Backend services preserved, UI deprecated as main shell
- ⚠️ **Legacy Tests**: `npm run test:foundation` only for Year Lens view validation

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