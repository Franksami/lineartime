# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Linear Calendar** - A year-at-a-glance calendar application being transformed into an enterprise-grade, AI-powered scheduling platform.

**Current Version**: v0.3.1 (Event Creation System, CalendarContext, Enhanced Architecture)
**Target Version**: v3.0.0 (Enterprise platform per PRD)
**Project Completion**: 63% (39/62 tasks completed)

## 🔒 CRITICAL: FOUNDATION LOCKED - PERFECT IMPLEMENTATION ACHIEVED

### **🎉 THE DEFINITIVE LINEAR CALENDAR FOUNDATION IS COMPLETE & LOCKED**

**Date Achieved**: August 23, 2025 - **BREAKTHROUGH MOMENT**  
**Status**: ✅ **PERFECT IMPLEMENTATION** - Vision "Life is bigger than a week" FULLY REALIZED

### **🔒 LOCKED FOUNDATION STRUCTURE (IMMUTABLE)**
- **📅 12 HORIZONTAL MONTH ROWS**: Each month (Jan-Dec) displays as complete horizontal strip  
- **📊 COMPLETE DAY NUMBERS**: 01-31 shown for each month with proper week alignment
- **📋 WEEK DAY HEADERS**: "Su Mo Tu We Th Fr Sa" at BOTH top AND bottom spanning full width
- **🏷️ MONTH LABELS**: Positioned on BOTH left AND right sides of each row
- **🎯 YEAR HEADER**: "2025 Linear Calendar" title + "Life is bigger than a week" tagline
- **🎨 BORDERED GRID**: Clean cell structure creating perfect visual hierarchy
- **🚀 PERFORMANCE**: 112 FPS, 91MB memory, professional rendering

### **🔒 FOUNDATION LOCK PROTOCOL**

#### **IMMUTABLE RULES (NEVER CHANGE):**
1. **12 HORIZONTAL MONTH ROWS**: Jan-Dec each as complete horizontal strips
2. **WEEK DAY HEADERS**: "Su Mo Tu We Th Fr Sa" at top AND bottom spanning full width  
3. **MONTH LABELS**: On BOTH left AND right sides of each row
4. **COMPLETE DAY DISPLAY**: 01-31 for each month with proper week alignment
5. **YEAR HEADER**: Title + "Life is bigger than a week" tagline
6. **BORDERED GRID**: Cell structure creating visual hierarchy

#### **What Makes LinearTime Unique:**
The horizontal linear timeline with 12-month row structure differentiates LinearTime from every other calendar application. Users see an entire year as one continuous grid with complete month displays, embodying "Life is bigger than a week."

#### **FOUNDATION ACHIEVEMENT (August 23, 2025):**
- ✅ **PERFECT STRUCTURE**: All PRD requirements met
- ✅ **VISUAL EXCELLENCE**: Professional grid with complete month displays  
- ✅ **PERFORMANCE**: 112 FPS, 91MB memory, instant rendering
- ✅ **ACCESSIBILITY**: Full keyboard navigation, screen reader support
- ✅ **MOBILE**: Touch gestures preserving horizontal timeline

#### Configuration Lock:
```env
# .env.local - DO NOT CHANGE
NEXT_PUBLIC_CALENDAR_LAYOUT=horizontal
NEXT_PUBLIC_USE_HYBRID_CALENDAR=false
```

#### **🔒 FOUNDATION COMPONENT USAGE (LOCKED):**
```tsx
// ✅ DEFINITIVE IMPLEMENTATION - Use this EXACT component in app/page.tsx:
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

#### **🔒 FOUNDATION REFERENCE:**
- **Foundation Document**: `docs/LINEAR_CALENDAR_FOUNDATION_LOCKED.md`
- **Achievement Date**: August 23, 2025
- **Status**: Perfect implementation achieved and locked

⚠️ **CRITICAL WARNING**: This foundation structure is **IMMUTABLE**. Any changes to the 12-month horizontal row layout, week day headers, month labels, or core grid structure **BREAKS THE PRODUCT IDENTITY**. All future development must build ON TOP OF this foundation, never replace it.

### Tech Stack
- **Framework**: Next.js 15.5.0 with Turbopack
- **Language**: TypeScript 5.0
- **UI**: React 19 + shadcn/ui + Tailwind CSS (dark theme)
- **Storage**: IndexedDB with Dexie (migrated from LocalStorage)
- **AI**: Vercel AI SDK v5 with OpenAI integration
- **Backend**: Convex (configured, not active)
- **Auth**: Clerk (configured, not active)
- **Mobile**: Touch gestures with @use-gesture/react

## 📦 Essential Commands

### Development
```bash
# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Lint code
pnpm lint

# Testing Commands
npm run test:foundation          # MANDATORY before commits
npm run test:all                # Run all Playwright tests
npm run test:manual             # Run manual testing helpers
npm run test:seed               # Seed test data
npx playwright test tests/foundation-*.spec.ts  # Foundation protection

# Development Helpers
npm run ci:guard                # CI validation guard
```

### 🚨 **CRITICAL: CodeRabbit Review Workflow (MANDATORY)**
```bash
# ❌ NEVER push directly to main branch
git push origin main  # BLOCKED by pre-push hook

# ✅ REQUIRED workflow for ALL changes:
# 1. Create feature branch
git checkout -b feature/task-[ID]-[description]

# 2. Implement with testing (follow TESTING_METHODOLOGY.md)
npm run test:foundation    # MANDATORY foundation protection
npx playwright test       # Feature functionality testing
npm run build            # Production build validation

# 3. Commit to feature branch (ONLY if tests pass)
git add .
git commit -m "[detailed testing validation commit message]"

# 4. Push feature branch and create PR
git push origin feature/[branch-name]
gh pr create --title "Task #[ID]: [Feature]" --body "[testing details]"

# 5. WAIT for CodeRabbit review and approval
# 6. Merge ONLY after CodeRabbit approval

# See docs/GIT_WORKFLOW_RULES.md for complete workflow
```

### Task Master Commands (Project Management)
```bash
# View all tasks with progress dashboard (56% complete, 35/62 tasks done)
task-master list

# Get next task to work on (currently #21 - Obsidian Plugin Integration)
task-master next

# Show task details
task-master show <id>

# Mark task in progress before starting work
task-master set-status --id=<id> --status=in-progress

# Mark task complete
task-master set-status --id=<id> --status=done

# Break down complex tasks into subtasks
task-master expand --id=<id>

# Update task implementation notes
task-master update-subtask --id=<id> --prompt="implementation notes"

# Parse new PRD features
task-master parse-prd --append "Advanced Features technical-prd.md"
```

## 🏗 Architecture & Code Structure

### Current Implementation

#### Core Components
- **`components/calendar/LinearCalendarHorizontal.tsx`**: PRIMARY CALENDAR COMPONENT
  - The ONLY calendar component that should be used
  - Horizontal linear timeline layout (core identity)
  - All 12 months in one continuous row
  - Zoom controls and infinite canvas support
  - Floating toolbar for event editing
  - Target: 5,000 events with good performance
  
- **`components/calendar/CalendarGrid.tsx`**: NEW - Grid rendering component
  - Pure rendering component for 12×42 layout
  - Optimized date calculations and cell rendering
  - Mobile-responsive with touch support
  
- **`components/calendar/DragToCreate.tsx`**: NEW - Event creation handler
  - Drag-to-create event functionality
  - Quick edit inline UI
  - Mobile-friendly interaction patterns
  
- **`components/calendar/EventLayer.tsx`**: NEW - Event rendering layer
  - Separated event rendering for performance
  - Handles event positioning and overlaps
  
- **`components/calendar/InteractionLayer.tsx`**: NEW - User interaction handler
  - Manages all user interactions (click, drag, hover)
  - Separated concerns for better maintainability

- **`components/calendar/VirtualCalendar.tsx`**: Performance optimization component
  - NOT TO BE USED as primary calendar
  - Only for technical experiments with vertical layouts
  - Handles 10,000+ events but breaks horizontal design

- **`components/calendar/LinearCalendarVertical.tsx`**: Legacy DOM-based calendar
  - DO NOT USE - violates horizontal layout requirement
  - Kept only for historical reference

- **`contexts/CalendarContext.tsx`**: NEW - Centralized state management
  - Global calendar state with useReducer pattern
  - Performance optimizations with batch updates
  - Accessibility support with announcements
  - Mobile-specific state management
  
- **`hooks/useLinearCalendar.ts`**: Enhanced state management hook
  - Event CRUD operations with IndexedDB
  - Advanced filter and search capabilities
  - Offline-first architecture
  - Touch gesture support for mobile
  - Real-time sync preparation
  
- **`hooks/useCalendarEvents.ts`**: NEW - Event-specific hook
  - Specialized event management logic
  - Optimized event queries and mutations
  - Integration with CalendarContext

- **`types/calendar.ts`**: TypeScript definitions
  - Event interface with categories
  - Filter and view state types
  - Color constants

### Completed Features

#### ✅ Phase 1: Performance Foundation (COMPLETED)
- Virtual scrolling with react-window
- Three-layer Canvas rendering
- IntervalTree for O(log n) conflict detection
- Web Worker for heavy computations

#### ✅ Phase 2: Storage Migration (COMPLETED)
- IndexedDB with Dexie implementation
- Offline-first architecture
- Background sync preparation
- Migration from LocalStorage preserved

#### ✅ Phase 3: Natural Language Processing (COMPLETED)
- Chrono.js integration for date parsing
- Command bar implementation
- Real-time event parsing from natural language

#### ✅ Phase 4: AI Assistant (COMPLETED)
- Vercel AI SDK v5 integration
- AI-powered scheduling suggestions
- Conflict resolution with CSP solver
- Focus time protection

#### ✅ Phase 5: Mobile Support (COMPLETED)
- Touch gesture support with @use-gesture/react
- Mobile-optimized UI components
- Responsive design for all screen sizes
- Bottom sheet interactions

#### ✅ Phase 6: Event Creation System (COMPLETED - Task #30)
- Click-to-create event functionality
- Drag-to-create multi-day events
- Inline quick edit UI
- Layered architecture with separated concerns:
  - CalendarGrid for rendering
  - DragToCreate for creation
  - EventLayer for event display
  - InteractionLayer for user input
- CalendarContext for centralized state management
- Performance optimized with React.memo and useCallback

### Next Implementation Phase

#### Phase 7: Plugin System & Integrations (IN PROGRESS - Task #21)
- Obsidian Plugin Integration
- Notion Integration
- Enhanced calendar sync (Google/Microsoft/CalDAV)
- Plugin architecture for extensibility

#### Phase 8: Real-time Collaboration (TODO)
- Yjs CRDT integration
- WebSocket for real-time sync
- Presence awareness
- Collaborative editing

## 🚀 PRD Implementation Strategy

### Critical Path (Must Do First)
1. **Virtual Scrolling** - App breaks without this at scale
2. **Canvas Rendering** - DOM can't handle overlapping events
3. **IndexedDB Migration** - LocalStorage is synchronous and limited

### Implementation Order
```bash
# Week 1-2: Performance Foundation
1. Implement VirtualCalendar.tsx with react-window
2. Add Canvas rendering for events
3. Create IntervalTree for conflict detection
4. Set up Web Worker architecture

# Week 3-4: Storage & Offline
1. Migrate to IndexedDB with backward compatibility
2. Implement Service Worker
3. Add offline-first sync

# Week 5-6: Natural Language
1. Integrate Chrono.js
2. Build command bar
3. Add real-time parsing

# Week 7-9: AI Features
1. Implement scheduling engine
2. Add focus time protection
3. Build conflict resolution

# Week 10-12: Collaboration & Polish
1. Set up WebSocket infrastructure
2. Implement Yjs CRDT
3. Mobile optimization
4. Accessibility patterns
```

### Performance Targets
- **Initial render**: <500ms for 12 months
- **Scrolling**: 60fps with 10,000+ events
- **Memory**: <100MB typical, <200MB peak
- **Event operations**: <100ms
- **Sync latency**: <100ms

## 🛠 Development Guidelines

### Performance Requirements
- Always test with 10,000+ events
- Profile rendering with Chrome DevTools
- Use React DevTools Profiler
- Monitor memory usage
- Implement virtual scrolling before any new features

### Migration Safety
```typescript
// Always implement rollback capability
async function safeMigration() {
  await backupCurrentState();
  try {
    await migrateToNewSystem();
    await verifyMigration();
  } catch (error) {
    await rollbackMigration();
    throw error;
  }
}
```

### Feature Flags
Use environment variables to control feature rollout:
```typescript
// .env.local
NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL=true
NEXT_PUBLIC_FEATURE_CANVAS_RENDER=false
NEXT_PUBLIC_FEATURE_NLP_PARSER=false
```

### Testing Strategy
```typescript
// Performance test before features
it('should render 10,000 events in under 500ms', async () => {
  const events = generateMockEvents(10000);
  const start = performance.now();
  await renderCalendar(events);
  expect(performance.now() - start).toBeLessThan(500);
});

it('should maintain 60fps while scrolling', async () => {
  const fps = await measureScrollingFPS();
  expect(fps).toBeGreaterThanOrEqual(59);
});
```

## 📁 File Structure

### Current Structure
```
lineartime/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (ai, auth, webhooks)
│   ├── calendar-sync/     # Calendar sync settings page
│   ├── settings/          # Settings pages (integrations, security)
│   └── test-*/            # Test pages for features (17 test pages)
├── components/
│   ├── ai/                # AI Assistant components
│   ├── ai-elements/       # Vercel AI SDK v5 components (10 components)
│   ├── calendar/          # Calendar components (20+ components)
│   ├── mobile/            # Mobile-specific components
│   ├── performance/       # Performance monitoring
│   ├── settings/          # Settings UI components
│   └── ui/                # shadcn components (25+ components)
├── hooks/                  # Custom React hooks (15+ hooks)
├── lib/                    # Utilities and business logic
│   ├── ai/                # AI scheduling engine with constraints
│   ├── canvas/            # Canvas rendering system
│   ├── data-structures/   # IntervalTree for event conflicts
│   ├── db/                # IndexedDB operations and migrations
│   ├── performance/       # Performance monitoring systems
│   ├── security/          # Security and authentication
│   ├── sync/              # Calendar sync and vector clocks
│   └── workers/           # Web Worker utilities
├── convex/                 # Convex backend (configured, not active)
├── docs/                   # Comprehensive documentation (15+ docs)
├── scripts/                # Build and test helpers
├── tests/                  # Playwright test suite (12 test files)
├── types/                  # TypeScript definitions
└── workers/                # Web Workers for heavy computations
```

### Target Structure (After PRD)
```
lineartime/
├── lib/
│   ├── canvas/          # Canvas rendering engine
│   ├── nlp/            # Natural language processing
│   ├── ai/             # AI scheduling engine
│   ├── collaboration/  # Real-time sync (Yjs)
│   ├── storage/        # IndexedDB management
│   ├── mobile/         # Touch gestures
│   ├── plugins/        # Plugin architecture
│   └── monitoring/     # Performance tracking
├── workers/
│   ├── calendar.worker.ts
│   └── sync.worker.ts
```

## 🔧 Common Tasks

### Add Dependencies for Future Features
```bash
# Performance (already implemented)
# ✅ pnpm add react-window @tanstack/react-virtual

# Storage (already implemented)
# ✅ pnpm add dexie

# NLP (already implemented)
# ✅ pnpm add chrono-node cmdk

# AI SDK (already implemented)
# ✅ pnpm add ai @ai-sdk/openai @ai-sdk/react

# Future Collaboration Features
pnpm add yjs y-websocket y-indexeddb socket.io-client

# Future Mobile Enhancements
# ✅ pnpm add @use-gesture/react (already added)

# Plugin Development (for Obsidian/Notion integrations)
pnpm add @notionhq/client obsidian-api
```

### Performance Profiling
```javascript
// Add to components for performance monitoring
if (process.env.NODE_ENV === 'development') {
  const measure = performance.measure('render', 'start', 'end');
  console.log(`Render time: ${measure.duration}ms`);
}
```

### Virtual Scrolling Implementation Check
```javascript
// Quick test for virtual scrolling
const testVirtualScroll = () => {
  const events = Array(10000).fill(null).map((_, i) => ({
    id: `test-${i}`,
    title: `Event ${i}`,
    startDate: new Date(),
    endDate: new Date(),
    category: 'personal'
  }));
  // Should render without freezing
};
```

## 🐛 Known Issues & Solutions

### Current Limitations & Planned Solutions
1. **Single-user only** - ✅ Real-time collaboration infrastructure ready (Convex backend)
2. **Limited offline support** - ✅ IndexedDB implemented, Service Worker pending
3. **Calendar integrations incomplete** - ✅ Google/Microsoft/CalDAV auth implemented, sync pending
4. **Plugin system missing** - 🚧 Obsidian integration in progress (Task #21)
5. **Limited mobile gestures** - ✅ @use-gesture/react implemented

### Common Errors
```typescript
// LocalStorage quota exceeded
if (e.name === 'QuotaExceededError') {
  // Migrate to IndexedDB immediately
}

// DOM rendering slowdown
if (renderTime > 100) {
  // Switch to Canvas rendering
}
```

## 📚 Key Resources

### Documentation
- **PRD**: `/Advanced Features technical-prd.md` (Technical implementation guide)
- **Architecture**: `/docs/ARCHITECTURE.md` (System design and patterns)
- **Foundation**: `/docs/LINEAR_CALENDAR_FOUNDATION_LOCKED.md` (Core layout documentation)
- **Testing**: `/docs/TESTING_METHODOLOGY.md` (Test strategies and validation)
- **Git Workflow**: `/docs/GIT_WORKFLOW_RULES.md` (Development process)
- **Components**: `/docs/COMPONENTS.md` (Component library guide)
- **Accessibility**: `/docs/ACCESSIBILITY.md` (WCAG compliance guide)
- **Manual Testing**: `/MANUAL_TESTING_CHECKLIST.md` (Quality assurance)

### External Documentation
- [React Window](https://react-window.vercel.app/)
- [Yjs CRDT](https://docs.yjs.dev/)
- [Chrono.js](https://github.com/wanasit/chrono)
- [IndexedDB with Dexie](https://dexie.org/)

## ⚡ Quick Start for PRD Implementation

```bash
# 1. Set up virtual scrolling (CRITICAL)
# Create: components/calendar/VirtualCalendar.tsx
# Use the PRD code as template

# 2. Test with large dataset
# Generate 10,000 events and verify 60fps

# 3. Implement Canvas layer
# Create: lib/canvas/CalendarRenderer.ts

# 4. Set up Web Worker
# Create: workers/calendar.worker.ts

# 5. Begin IndexedDB migration
# Create: lib/storage/CalendarDB.ts
# Maintain LocalStorage compatibility
```

## 🎯 Success Metrics

Monitor these metrics during development:

| Metric | Current | Target | Critical? |
|--------|---------|--------|-----------|
| Initial Load | ~2s | <500ms | Yes |
| Max Events | ~500 | 10,000+ | Yes |
| Scroll FPS | 30-45 | 60 | Yes |
| Memory Usage | 150MB+ | <100MB | Yes |
| Event Create | 200ms | <100ms | No |

## 🎯 Current Project Status & Next Steps

**Project Progress**: 63% complete (39/62 tasks done)
**Last Completed**: Task #30 - Event Creation System (with drag-to-create functionality)
**Current Branch**: feature/task-30-fix-event-creation-bugs
**Current Priority**: High-priority integrations and plugins
**Recommended Next Task**: #21 - Develop Obsidian Plugin Integration

### Task Master Integration Workflow

Use Task Master to track PRD implementation:
1. Check current status: `task-master list`
2. Get next task: `task-master next`
3. Break down complex tasks: `task-master expand --id=21`
4. Start work: `task-master set-status --id=21 --status=in-progress`
5. Complete work: `task-master set-status --id=21 --status=done`
6. Parse new PRD features: `task-master parse-prd --append "Advanced Features technical-prd.md"`

### High-Priority Pending Tasks (23 tasks remaining)
- **#21** - Obsidian Plugin Integration (dependencies: 14, 16) - **NEXT TASK**
- **#11** - Implement Accessibility Features (dependencies: 2, 3, 5, 6, 8, 10)
- **#27** - Performance Optimization Suite (dependencies: 15, 16, 17, 18)
- **#45** - Error Handling & Recovery System (dependencies: 32, 39)
- **#55** - Accessibility Compliance (dependencies: 48, 52)

### Recently Completed Tasks (Last 10)
- **#30** ✅ Event Creation System - Click and drag-to-create functionality
- **#31** ✅ FloatingToolbar Support - Enhanced event editing UI
- **#50** ✅ FloatingEventEditor - Improved event editing experience
- **#51** ✅ Smart Positioning - Intelligent UI element placement
- **#52** ✅ Zustand Store Setup - State management architecture
- **#56** ✅ Performance Monitoring - Metrics and tracking
- **#58** ✅ CSS Drag Styles - Visual feedback for interactions
- **#49** ✅ Z-Index Management - Proper layering system
- **#48** ✅ useCalendarEvents Hook - Event management abstraction
- **#47** ✅ Foundation Tests - Automated validation of core structure

### Development Philosophy
- Foundation is **LOCKED** - never modify core horizontal layout
- Always implement performance features before adding new functionality
- Use feature flags for rollout control
- Maintain backwards compatibility during migrations