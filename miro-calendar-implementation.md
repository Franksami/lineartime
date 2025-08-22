# Miro-Style Interactive Calendar Implementation PRD

## Overview
Transform the current basic calendar view into a rich, interactive Miro-style calendar with drag-and-drop, resizing, and multi-day event bars.

## Phase 1: Foundation Switch (30 min)
### Objectives
- Replace VirtualCalendar with HybridCalendar for rich rendering
- Ensure backward compatibility with feature flags

### Tasks
- Switch default calendar component from VirtualCalendar to HybridCalendar
- Create NEXT_PUBLIC_USE_HYBRID_CALENDAR environment variable
- Update page.tsx to use HybridCalendar when flag is true
- Map event data from IndexedDB to HybridCalendar format
- Test calendar loads without errors

## Phase 2: Multi-Day Event Bars (2 hours)
### Objectives
- Render events as horizontal bars that span multiple days
- Implement stacking for overlapping events

### Tasks
- Calculate event start and end column positions based on dates
- Compute event bar width based on duration in days
- Implement vertical stacking algorithm using IntervalTree
- Apply category-based colors to event bars
- Add rounded corners and shadows for depth
- Truncate long titles with ellipsis
- Add hover tooltips for full event details

## Phase 3: Drag-and-Drop System (1.5 hours)
### Objectives
- Enable dragging events to new dates
- Provide visual feedback during drag operations

### Tasks
- Wrap calendar in DndContext from @dnd-kit/core
- Configure drag sensors for mouse and touch input
- Wrap each event with DraggableEvent component
- Make each calendar day a DroppableCalendarGrid cell
- Add hover states for drop zones
- Implement drop handler to update event dates
- Persist changes to IndexedDB on drop
- Add ghost image preview during drag
- Implement snap-to-grid behavior

## Phase 4: Resize Functionality (1 hour)
### Objectives
- Allow users to resize events to change duration
- Maintain data consistency during resize

### Tasks
- Integrate ResizableEvent wrapper for all events
- Add resize handles on event hover
- Set minimum duration constraint (30 minutes)
- Set maximum span constraints
- Implement snap-to-time-grid (15-minute intervals)
- Calculate new end date/time on resize
- Update IndexedDB with new duration
- Show duration indicator during resize
- Preview final size before release

## Phase 5: Floating Toolbar (1.5 hours)
### Objectives
- Add contextual editing toolbar like Miro
- Enable quick actions on selected events

### Tasks
- Create floating toolbar component with Edit, Delete, Duplicate, Color buttons
- Position toolbar above selected event
- Implement auto-repositioning near viewport edges
- Add quick edit modal for title/description
- Implement delete with confirmation dialog
- Add duplicate with automatic offset positioning
- Create category color picker
- Add keyboard shortcuts (Del, Ctrl+D, etc.)
- Implement toolbar animation on show/hide

## Phase 6: Performance Optimization (2 hours)
### Objectives
- Optimize rendering for 10,000+ events
- Maintain 60fps scrolling performance

### Tasks
- Implement automatic DOM/Canvas switching based on event count
- Add threshold configuration (default: 100 events)
- Implement virtual scrolling for year view
- Add lazy loading for off-screen months
- Implement event object pooling for DOM reuse
- Batch renders with requestAnimationFrame
- Add performance monitoring overlay
- Display FPS counter and memory usage
- Track render times and optimization triggers

## Phase 7: Infinite Canvas Mode (3 hours) [Optional]
### Objectives
- Add Miro-like infinite timeline navigation
- Enable pan and zoom controls

### Tasks
- Implement click-and-drag panning
- Add touch gesture support for mobile
- Implement Ctrl+scroll zoom functionality
- Add zoom control buttons in UI
- Set min/max zoom constraints
- Create minimap for navigation overview
- Implement click-to-navigate on minimap
- Add infinite year scrolling with dynamic loading
- Ensure seamless transitions between years
- Add smooth animations for all interactions

## Testing Requirements
### After Each Phase
- Run Playwright visual regression tests
- Test all CRUD operations
- Verify mobile responsiveness
- Check performance metrics
- Validate accessibility (WCAG AA)

## Success Criteria
- Initial load time < 500ms
- Scroll performance at 60fps
- Memory usage < 200MB
- Support for 10,000+ events
- All Playwright tests passing
- Accessibility score > 90%