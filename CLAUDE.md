# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Linear Calendar** - A year-at-a-glance calendar application being transformed into an enterprise-grade, AI-powered scheduling platform.

**Current Version**: v0.3.0 (Virtual scrolling, IndexedDB, AI Assistant, Mobile support)
**Target Version**: v3.0.0 (Enterprise platform per PRD)

## ⚠️ CRITICAL: Core Design Identity

### **THE HORIZONTAL LINEAR TIMELINE LAYOUT IS THE CORE IDENTITY OF LINEARTIME**

**This layout must NEVER be changed without explicit permission from the project owner.**

#### Mandatory Layout Requirements:
- **All 12 months displayed in ONE continuous horizontal row**
- **Days numbered 01-31 across the top**
- **Month labels on the left side**
- **Events shown as horizontal bars with visible text**
- **Horizontal scrolling (NOT vertical) for navigation**
- **Component to use: `LinearCalendarHorizontal` (NOT HybridCalendar or VirtualCalendar)**

#### What Makes LinearTime Unique:
The horizontal linear timeline is what differentiates LinearTime from every other calendar application. While other calendars use traditional monthly grids or vertical layouts, LinearTime's unique value proposition is seeing an entire year as a single continuous timeline that scrolls horizontally.

#### Performance Trade-offs Accepted:
- Target 5,000 events instead of 20,000 to preserve the horizontal layout
- Horizontal scrolling on mobile devices (not vertical)
- Slightly slower initial render to maintain design fidelity
- Canvas rendering optimized for horizontal layout, not vertical

#### Configuration Lock:
```env
# .env.local - DO NOT CHANGE
NEXT_PUBLIC_CALENDAR_LAYOUT=horizontal
NEXT_PUBLIC_USE_HYBRID_CALENDAR=false
```

#### Component Usage:
```tsx
// ALWAYS use this component in app/page.tsx:
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

⚠️ **WARNING**: Any attempt to optimize performance by switching to vertical layouts (HybridCalendar, VirtualCalendar with vertical scrolling) fundamentally breaks the product's identity. Performance optimizations must work within the horizontal layout constraint.

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

# Lint code (no tests configured yet)
pnpm lint
```

### Task Master Commands (Project Management)
```bash
# View all tasks
task-master list

# Get next task to work on
task-master next

# Show task details
task-master show <id>

# Mark task complete
task-master set-status --id=<id> --status=done

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

- **`components/calendar/VirtualCalendar.tsx`**: Performance optimization component
  - NOT TO BE USED as primary calendar
  - Only for technical experiments with vertical layouts
  - Handles 10,000+ events but breaks horizontal design

- **`components/calendar/LinearCalendarVertical.tsx`**: Legacy DOM-based calendar
  - DO NOT USE - violates horizontal layout requirement
  - Kept only for historical reference

- **`hooks/useLinearCalendar.ts`**: Enhanced state management hook
  - Event CRUD operations with IndexedDB
  - Advanced filter and search capabilities
  - Offline-first architecture
  - Touch gesture support for mobile
  - Real-time sync preparation

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

### Next Implementation Phase

#### Phase 6: Real-time Collaboration (TODO)
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
│   ├── api/ai/            # AI chat endpoints
│   └── test-*/            # Test pages for features
├── components/
│   ├── ai/                # AI Assistant components
│   ├── ai-elements/       # Vercel AI SDK v5 components
│   ├── calendar/          # Calendar components
│   ├── mobile/            # Mobile-specific components
│   ├── performance/       # Performance monitoring
│   ├── timeline/          # Timeline view components
│   └── ui/                # shadcn components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
│   ├── ai/                # AI scheduling engine
│   ├── canvas/            # Canvas rendering
│   ├── data-structures/   # IntervalTree, etc.
│   ├── mobile/            # Touch gesture handlers
│   ├── nlp/               # Natural language processing
│   └── storage/           # IndexedDB management
├── types/                  # TypeScript definitions
└── workers/                # Web Workers
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

### Add Dependencies for PRD Implementation
```bash
# Phase 1: Performance
pnpm add react-window @tanstack/react-virtual

# Phase 2: Storage
pnpm add dexie workbox-webpack-plugin

# Phase 3: NLP
pnpm add chrono-node cmdk

# Phase 4: Collaboration
pnpm add yjs y-websocket y-indexeddb socket.io-client
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

### Current Limitations
1. **Single-user only** - Implement Yjs CRDT for collaboration
2. **No service worker** - Add for full offline support
3. **Limited calendar integrations** - Add Google/Outlook sync
4. **No plugin system** - Implement extensibility framework

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
- PRD: `/Advanced Features technical-prd.md`
- Architecture: `/docs/ARCHITECTURE.md`
- Components: `/docs/COMPONENTS.md`
- Task Master Guide: `/docs/CLAUDE.md`

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

## Task Master Integration

Use Task Master to track PRD implementation:
1. Parse the PRD: `task-master parse-prd --append "Advanced Features technical-prd.md"`
2. Break down into subtasks: `task-master expand --all --research`
3. Track progress: `task-master list`
4. Get next task: `task-master next`

Remember: Always implement performance features before adding new functionality!