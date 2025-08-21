# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Linear Calendar** - A year-at-a-glance calendar application being transformed into an enterprise-grade, AI-powered scheduling platform.

**Current Version**: v0.2.0 (Basic implementation with LocalStorage)
**Target Version**: v3.0.0 (Enterprise platform per PRD)

### Tech Stack
- **Framework**: Next.js 15.5.0 with Turbopack
- **Language**: TypeScript 5.0
- **UI**: React 19 + shadcn/ui + Tailwind CSS (dark theme)
- **Storage**: LocalStorage (migrating to IndexedDB)
- **Backend**: Convex (configured, not active)
- **Auth**: Clerk (configured, not active)

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
- **`components/calendar/LinearCalendarVertical.tsx`**: Main calendar component using DOM rendering
  - 12-month vertical layout (42 columns × 12 rows)
  - Basic event rendering with category colors
  - LocalStorage persistence (synchronous, blocks UI at >500 events)

- **`hooks/useLinearCalendar.ts`**: State management hook
  - Event CRUD operations
  - Filter state management
  - LocalStorage sync (5MB limit)
  - Basic selection handling

- **`types/calendar.ts`**: TypeScript definitions
  - Event interface with categories
  - Filter and view state types
  - Color constants

### Target Architecture (PRD Implementation)

#### Phase 1: Performance Foundation (Critical - Start Here)
**WARNING**: The app will break at >500 events without virtual scrolling. Implement this first!

Key files to create:
- `lib/canvas/CalendarRenderer.ts` - Three-layer Canvas architecture
- `components/calendar/VirtualCalendar.tsx` - Virtual scrolling with react-window
- `lib/data-structures/IntervalTree.ts` - O(log n) conflict detection
- `workers/calendar.worker.ts` - Web Worker for heavy computations

#### Phase 2: Storage Migration
- `lib/storage/CalendarDB.ts` - IndexedDB with Dexie
- `service-worker.ts` - Offline-first with background sync
- Migration script to preserve existing LocalStorage data

#### Phase 3: Natural Language Processing  
- `lib/nlp/EventParser.ts` - Chrono.js integration
- `components/CommandBar.tsx` - Command palette UI

#### Phase 4: AI Scheduling
- `lib/ai/SchedulingEngine.ts` - CSP solver
- `lib/ai/FocusTimeManager.ts` - Focus protection

#### Phase 5: Real-time Collaboration
- `lib/collaboration/CollaborationManager.ts` - Yjs CRDT
- WebSocket integration for presence

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
├── components/
│   ├── calendar/          # Calendar components
│   └── ui/               # shadcn components
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── lib/                  # Utilities

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
1. **Performance degrades at >500 events** - Implement virtual scrolling
2. **LocalStorage blocks UI** - Migrate to IndexedDB
3. **No conflict detection** - Implement IntervalTree
4. **No mobile optimization** - Add touch handlers
5. **Single-user only** - Implement Yjs CRDT

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