# LinearTime Architecture Document

## Executive Summary

LinearTime is a revolutionary calendar application that replaces traditional grid-based calendars with a continuous linear timeline visualization. This document outlines the architectural transformation required to implement the world's best linear calendar as described in the PRD.

## Current State vs Target State

### Current State (v0 Implementation)
- ✅ Modern glassmorphic UI with purple/pink gradients
- ✅ Clerk authentication integrated
- ✅ Convex backend for data persistence
- ❌ Still using grid-based calendar layout
- ❌ Traditional month/week views
- ❌ No continuous timeline visualization

### Target State (Linear Calendar)
- ✅ Preserve glassmorphic aesthetic
- ✅ Keep authentication and backend
- ✨ **365-day continuous horizontal timeline**
- ✨ **Each month as a horizontal row of days**
- ✨ **Semantic zooming (year → quarter → month → week → day)**
- ✨ **Heat map visualization for event density**
- ✨ **60fps virtual scrolling performance**
- ✨ **Gesture-based navigation**

## Core Architectural Changes

### 1. Component Architecture

```
components/
├── timeline/                    # NEW: Linear timeline components
│   ├── TimelineContainer.tsx   # Main container with virtual scrolling
│   ├── TimelineRow.tsx         # Single month row
│   ├── TimelineDay.tsx         # Individual day cell
│   ├── TimelineHeatMap.tsx     # Heat map overlay
│   ├── TimelineZoom.tsx        # Zoom controls
│   └── TimelineMiniMap.tsx     # Navigation minimap
├── ui/
│   └── glass/                  # Consolidated glass components
│       ├── GlassUI.tsx         # Unified glass component library
│       ├── GlassButton.tsx
│       ├── GlassCard.tsx
│       └── GlassDialog.tsx
└── events/                     # Event management
    ├── EventCard.tsx
    ├── EventEditor.tsx
    └── EventDensity.tsx
```

### 2. State Management Architecture

```typescript
// Global state with Zustand
interface TimelineState {
  // View state
  currentDate: Date;
  zoomLevel: number; // 1-100
  scrollPosition: { x: number; y: number };
  viewType: 'year' | 'quarter' | 'month' | 'week' | 'day';
  
  // Data state
  events: CalendarEvent[];
  eventDensity: Map<string, number>; // date -> density
  
  // Actions
  setZoomLevel: (level: number) => void;
  scrollToDate: (date: Date) => void;
  loadEvents: (range: DateRange) => Promise<void>;
}
```

### 3. Performance Architecture

#### Virtual Scrolling Strategy
```typescript
// Using TanStack Virtual for horizontal virtualization
const virtualizer = useVirtualizer({
  horizontal: true,
  count: 365, // days in year
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: (index) => getDayWidth(zoomLevel),
  overscan: 5, // render 5 extra days on each side
});
```

#### Rendering Optimization
- **Canvas rendering** for heat maps when zoomed out
- **React.memo** for all timeline components
- **useMemo** for expensive calculations
- **Web Workers** for density calculations
- **RequestAnimationFrame** for smooth scrolling

### 4. Data Flow Architecture

```
User Interaction → Gesture Handler → State Update → Virtual Renderer → DOM Update
                                           ↓
                                    Convex Backend
                                           ↓
                                    Event Updates → Real-time Sync
```

## Implementation Phases

### Phase 1: Project Cleanup (Task 16)
**Status**: Ready to start
**Duration**: 2-3 days

1. Remove grid-based calendar components
2. Consolidate glass UI components
3. Reorganize file structure
4. Clean up dependencies

### Phase 2: Core Timeline (Task 5)
**Status**: Pending cleanup
**Duration**: 5-7 days

1. Build TimelineContainer with horizontal scrolling
2. Implement virtual scrolling with TanStack
3. Create semantic zoom system
4. Add gesture controls
5. Implement keyboard navigation

### Phase 3: Visual Enhancement (Task 17)
**Status**: Pending Phase 2
**Duration**: 3-5 days

1. Implement heat map visualization
2. Add smooth animations
3. Create mini-map navigation
4. Polish glassmorphic effects
5. Optimize performance

### Phase 4: Integration & Polish
**Status**: Pending Phase 3
**Duration**: 2-3 days

1. Connect to Convex backend
2. Implement real-time updates
3. Add mobile responsiveness
4. Performance optimization
5. Accessibility compliance

## Technical Stack

### Core Dependencies
```json
{
  "@tanstack/react-virtual": "^3.0.0",  // Virtual scrolling
  "framer-motion": "^11.0.0",           // Animations
  "zustand": "^4.4.0",                   // State management
  "date-fns": "^3.0.0",                  // Date utilities
  "@use-gesture/react": "^10.3.0",      // Gesture handling
  "react-intersection-observer": "^9.5.0" // Viewport detection
}
```

### Performance Targets
- **Initial Load**: <2 seconds
- **Time to Interactive**: <3 seconds
- **Scroll Performance**: 60fps
- **Interaction Response**: <100ms
- **Memory Usage**: <100MB

## Key Technical Decisions

### Why TanStack Virtual over react-window?
- Better horizontal scrolling support
- More flexible item sizing
- Superior TypeScript support
- Active maintenance

### Why Zustand over Redux?
- Lighter weight (2KB vs 10KB)
- Simpler API
- Better TypeScript inference
- Sufficient for our needs

### Why Canvas for heat maps?
- 100x better performance for dense data
- Smooth gradients
- Lower memory usage
- GPU acceleration

## Migration Strategy

### Step 1: Parallel Development
- Keep existing calendar functional
- Build linear timeline alongside
- Feature flag for switching

### Step 2: Gradual Migration
- Move event management first
- Migrate user preferences
- Transfer calendar sync

### Step 3: Cutover
- Switch default to linear view
- Keep grid view as option
- Monitor performance

## Risk Mitigation

### Performance Risks
- **Risk**: Poor scrolling performance
- **Mitigation**: Virtual scrolling, canvas rendering, progressive loading

### Browser Compatibility
- **Risk**: Gesture API not supported
- **Mitigation**: Polyfills, fallback to mouse events

### User Adoption
- **Risk**: Users confused by new interface
- **Mitigation**: Onboarding flow, option to switch back

## Success Metrics

### Technical Metrics
- 60fps scrolling achieved
- <100ms interaction response
- <2s page load time
- 80% test coverage

### User Metrics
- 30% reduction in cognitive load (user studies)
- 25% improvement in planning accuracy
- 70% user retention after 30 days
- 4.5+ app store rating

## Next Steps

### Immediate Actions (This Week)
1. ✅ Update Task Master with implementation plan
2. 🔄 Start Task 16: Project cleanup
3. ⏳ Prepare for Task 5: Timeline implementation

### Short Term (Next 2 Weeks)
1. Complete core timeline implementation
2. Integrate virtual scrolling
3. Implement basic zoom levels
4. Add gesture controls

### Medium Term (Month 1)
1. Complete heat map visualization
2. Add mini-map navigation
3. Optimize performance
4. Mobile responsiveness

### Long Term (Month 2-3)
1. AI scheduling features
2. Calendar sync
3. Export functionality
4. Production deployment

## Conclusion

LinearTime represents a fundamental reimagining of calendar interfaces. By replacing the traditional grid with a continuous linear timeline, we can reduce cognitive load by 30-40% while enhancing users' ability to plan and visualize time. The technical architecture outlined here provides a clear path to implementation while maintaining the beautiful glassmorphic aesthetic already in place.

The key to success will be maintaining performance while delivering a revolutionary user experience. With virtual scrolling, semantic zooming, and gesture-based navigation, LinearTime will set a new standard for calendar applications.

---

*Document Version: 1.0*  
*Last Updated: August 20, 2025*  
*Status: Implementation Ready*