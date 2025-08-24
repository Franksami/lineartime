# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**LinearTime Calendar** - A year-at-a-glance calendar application with horizontal linear timeline layout. Currently being transformed into an enterprise-grade, AI-powered scheduling platform.

**Current Version**: v0.3.1 (Event Creation System, CalendarContext, Enhanced Architecture)
**Target Version**: v3.0.0 (Enterprise platform per PRD)
**Project Philosophy**: "Life is bigger than a week"

## 🔒 CRITICAL: FOUNDATION LOCKED - DO NOT MODIFY

### **THE LINEAR CALENDAR FOUNDATION IS IMMUTABLE**

The horizontal 12-month row layout is the core product identity and **MUST NEVER BE CHANGED**.

#### **LOCKED FOUNDATION STRUCTURE:**
- **12 HORIZONTAL MONTH ROWS**: Each month (Jan-Dec) as complete horizontal strip
- **COMPLETE DAY NUMBERS**: 01-31 for each month with proper week alignment  
- **WEEK DAY HEADERS**: "Su Mo Tu We Th Fr Sa" at top AND bottom
- **MONTH LABELS**: On BOTH left AND right sides of each row
- **YEAR HEADER**: "2025 Linear Calendar" + "Life is bigger than a week" tagline
- **BORDERED GRID**: Clean cell structure with visual hierarchy

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

⚠️ **WARNING**: Changes to the 12-month horizontal layout **BREAKS THE PRODUCT**. All development must build ON TOP OF this foundation.

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

### Core Calendar Components

**Primary Component (USE THIS)**:
- `components/calendar/LinearCalendarHorizontal.tsx` - The ONLY calendar to use
  - Horizontal linear timeline (core identity)
  - 12 months in continuous rows
  - Zoom controls & infinite canvas
  - Target: 5,000+ events

**Supporting Components**:
- `CalendarGrid.tsx` - Pure rendering for 12×42 layout
- `DragToCreate.tsx` - Event creation handler
- `EventLayer.tsx` - Event rendering layer
- `InteractionLayer.tsx` - User interaction handler
- `EventModal.tsx` - Event editing interface
- `FloatingToolbar.tsx` - Context-aware toolbar

**DO NOT USE**:
- `LinearCalendarVertical.tsx` - Violates horizontal layout
- `VirtualCalendar.tsx` - Only for experiments

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

**IndexedDB with Dexie**:
- Primary storage for events
- Offline-first architecture
- Migration from LocalStorage preserved
- Background sync preparation

### AI Integration

**Vercel AI SDK v5**:
- OpenAI integration for scheduling
- Natural language event parsing (Chrono.js)
- Conflict resolution
- Focus time protection

## 🚀 Current Implementation Status

### ✅ Completed Features

1. **Performance Foundation** - Virtual scrolling, Canvas rendering, IntervalTree
2. **Storage Migration** - IndexedDB implementation, offline-first
3. **Natural Language** - Chrono.js, command bar, real-time parsing
4. **AI Assistant** - Vercel AI SDK, scheduling suggestions
5. **Mobile Support** - Touch gestures, responsive design
6. **Event Creation** - Click/drag-to-create, inline editing
7. **Analytics Dashboard** - Productivity metrics, insights
8. **Category & Tags** - Enhanced organization system
9. **Theme System** - Custom themes with live preview
10. **PWA Features** - Service worker, offline support

### 🔨 Recent Enhancements (Just Added)

**Analytics Dashboard** (`/analytics`):
- Event category breakdowns
- Monthly activity tracking
- AI-powered insights
- Export functionality

**Category Tag Manager**:
- 7 category types (Personal, Work, Effort, Note, Meeting, Deadline, Milestone)
- 5 priority levels
- Custom tag creation
- Visual color coding

**Advanced Theme System** (`/themes`):
- Custom theme creator
- Live preview
- Theme persistence
- Navigation integration

**PWA Implementation** (`/test-pwa`):
- Manifest file configured
- Service worker for caching
- Install prompts
- Background sync

**AI Scheduling Engine** (`/test-ai-scheduling`):
- Intelligent event placement
- Smart time slot finding
- Conflict resolution
- Natural language parsing

## 📁 Key Directories

```
lineartime/
├── app/                    # Next.js app router
│   ├── analytics/         # Analytics dashboard
│   ├── themes/           # Theme management
│   ├── test-*/           # Test pages (20+ test pages)
│   └── api/              # API routes
├── components/
│   ├── calendar/         # Calendar components (25+)
│   ├── ai/              # AI components
│   ├── ui/              # shadcn components (30+)
│   └── theme/           # Theme components
├── contexts/            # React contexts
├── hooks/              # Custom hooks (15+)
├── lib/                # Business logic
│   ├── ai/            # AI scheduling engine
│   ├── db/            # IndexedDB operations
│   └── theme-manager.ts # Theme management
├── tests/              # Playwright tests (25+ test files)
├── docs/               # Documentation
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

### Current Focus: Plugin System & Integrations
- Obsidian Plugin Integration (Task #21)
- Notion Integration
- Enhanced calendar sync (Google/Microsoft/CalDAV)
- Plugin architecture for extensibility

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

## 📚 Key Documentation

- `/docs/LINEAR_CALENDAR_FOUNDATION_LOCKED.md` - Foundation specification
- `/docs/TESTING_METHODOLOGY.md` - Testing requirements
- `/docs/GIT_WORKFLOW_RULES.md` - Git workflow (MANDATORY)
- `/docs/ARCHITECTURE.md` - System design
- `/MANUAL_TESTING_CHECKLIST.md` - Manual QA checklist
- `/Advanced Features technical-prd.md` - Technical PRD

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

### Test Pages Available
- `/` - Main calendar application
- `/analytics` - Analytics dashboard
- `/themes` - Theme management
- `/test-all-features` - Feature showcase
- `/test-ai-scheduling` - AI scheduling tests
- `/test-category-tags` - Category system tests
- `/test-enhanced-calendar` - Enhanced calendar features
- `/test-pwa` - PWA functionality tests