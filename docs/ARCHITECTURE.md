# Linear Calendar Architecture

## Overview

Linear Calendar is built as a modern React application using Next.js 15 with a component-based architecture. The application follows a unidirectional data flow pattern with local state management through React hooks.

## Architecture Principles

1. **Component Composition**: Small, focused components that compose into larger features
2. **Separation of Concerns**: Clear boundaries between UI, state management, and data persistence
3. **Type Safety**: Full TypeScript coverage for compile-time safety
4. **Performance First**: Optimized rendering with React memoization and efficient data structures
5. **Progressive Enhancement**: Core functionality works without optional services (auth, backend)
6. **Design System Compliance**: Consistent use of oklch color system and theme variables
7. **Accessibility by Default**: WCAG 2.1 AA compliance in all components

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Application                      │
├──────────────────┬──────────────────┬──────────────────────┤
│   Presentation   │  State Management │   Data Persistence   │
│   Layer          │      Layer        │       Layer          │
├──────────────────┼──────────────────┼──────────────────────┤
│ • Components     │ • React Hooks     │ • LocalStorage       │
│ • shadcn/ui      │ • Local State     │ • Convex (optional)  │
│ • Tailwind CSS   │ • Context         │ • Clerk Auth         │
│ • oklch colors   │ • Event Handlers  │ • IndexedDB          │
└──────────────────┴──────────────────┴──────────────────────┘
```

## Design System Architecture

### Color System (oklch)
The application uses the oklch color space for perceptually uniform colors:

```css
/* Core color variables defined in globals.css */
--background: oklch(0 0 0);        /* Pure black background */
--foreground: oklch(1 0 0);        /* White text */
--card: oklch(0.14 0 0);           /* Elevated surfaces */
--border: oklch(0.26 0 0);         /* Subtle borders */
--muted: oklch(0.23 0 0);          /* Secondary surfaces */
```

### Theme Architecture
- **Vercel Theme**: Base design system via shadcn/ui
- **CSS Variables**: Dynamic theming support
- **Dark Mode First**: Optimized for dark environments
- **SSR Compatible**: Safe for server-side rendering

### Layout System
- **Full-Screen**: Edge-to-edge viewport utilization
- **Responsive Grid**: Mobile-first responsive design
- **Overflow Management**: Explicit scroll containers
- **Z-Index Layers**: Consistent stacking contexts

## Component Hierarchy

```
App (page.tsx)
└── LinearCalendarVertical
    ├── Header
    │   ├── Year Selector
    │   └── Navigation Controls
    ├── FilterPanel
    │   ├── Category Toggles
    │   └── View Options
    ├── Calendar Grid
    │   └── Month Rows (12)
    │       └── Day Cells (42 per month)
    │           └── Event Indicators
    ├── ZoomControls
    ├── EventModal
    │   ├── Event Form
    │   └── Category Selector
    └── ReflectionModal
        └── Reflection Prompts
```

## Data Flow

### Event Creation Flow
1. User clicks on a day cell
2. `LinearCalendarVertical` handles click event
3. Opens `EventModal` with selected date
4. User fills form and submits
5. `useLinearCalendar` hook processes the event
6. Event saved to LocalStorage
7. Component re-renders with new event

### State Management

The application uses a custom hook `useLinearCalendar` for centralized state management:

```typescript
interface CalendarState {
  currentYear: number
  events: Map<string, Event[]>  // Indexed by date string
  filters: FilterState
  selectedDates: Set<string>
  hoveredDate: Date | null
  selectedRange: DateRange | null
  reflections: Reflection[]
}
```

Key features:
- Events stored in a Map for O(1) lookup by date
- Filters managed as boolean flags per category
- Selected dates tracked in a Set for efficient membership testing
- All state changes trigger LocalStorage persistence

## Styling Architecture

### Design System

The application uses a layered styling approach:

1. **Tailwind CSS**: Utility-first base styles
2. **OKLCH Color Space**: Perceptually uniform colors
3. **CSS Custom Properties**: Dynamic theming
4. **Glass Morphism**: Modern translucent UI effects

### Theme Structure

```css
:root {
  --background: oklch(0 0 0)
  --foreground: oklch(0.9328 0.0025 228.7857)
  --primary: oklch(0.6692 0.1607 245.0110)
  /* ... additional color tokens */
}
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