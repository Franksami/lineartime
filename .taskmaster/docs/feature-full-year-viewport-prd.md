# Linear Calendar Application Development Specification

## Overview
Defines a linear calendar that displays an entire year (365/366 days) in a single horizontal viewport without scrollbars. Supports draggable, resizable, duplicatable event blocks, with a floating toolbar, following Vercel Geist design.

## Core viewport requirements
### Full year display without scrolling
- Render all 365/366 days simultaneously in one horizontal view (no horizontal scroll)
- Compute cell width from viewport: `cellWidth = (viewportWidth - sidebarWidth * 2) / 53` (52 weeks + 1 overflow)
- Use CSS Grid with fixed-size tracks; avoid auto-sized tracks for performance
- Full height 100vh; grid fills remaining space after headers/sidebars

### Responsive sizing strategy
```css
.calendar-container {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr var(--sidebar-width);
  grid-template-rows: var(--header-height) 1fr var(--header-height);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(53, minmax(0, 1fr));
  grid-template-rows: repeat(7, 1fr);
  gap: 1px;
}
```

## Grid structure specifications
### Day-of-week headers positioning
- Abbreviated day names (Su, Mo, Tu, We, Th, Fr, Sa) as fixed headers at top and bottom
- Stay aligned with columns regardless of year start day
- Use `position: sticky` for consistent visibility

### Month name sidebars
- Month names on left and right edges (rotate 90°)
- Each label spans the correct week rows based on month days
- Absolute positioning using cumulative day offsets
```ts
const monthPositions = months.map((month, index) => ({
  name: month.name,
  startRow: Math.floor(cumulativeDays[index] / 7),
  endRow: Math.floor((cumulativeDays[index] + month.days - 1) / 7),
  offset: (cumulativeDays[index] % 7) * cellHeight
}))
```

### Sunday–Saturday column consistency
- Always 7 columns; Sunday = col 1, Saturday = col 7
- Empty leading cells before Jan 1 if year does not start Sunday

## Event system architecture
### Event data model
```ts
interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  category: string
  color: string
  layer: number
  isResizing: boolean
  isDragging: boolean
  metadata?: Record<string, any>
}
```

### Draggable event implementation
- Use `@dnd-kit/core` for drag-and-drop with accessibility
- Phases: drag start, drag move (collision feedback), drag end (snap + persist)
- Use transform-only animations to avoid layout thrash

### Resizable event blocks
```ts
const handleResize = (event, direction, delta) => {
  const newDuration = direction === 'left' ? adjustStartDate(event, delta) : adjustEndDate(event, delta)
  const constrained = Math.max(1, Math.min(maxDays, newDuration))
  requestAnimationFrame(() => updateEventDimensions(event.id, constrained))
}
```

### Event duplication system
- Trigger by toolbar, keyboard (Cmd/Ctrl+D), or context menu
- Duplicate below original with offset; independent ID; adjust layer
- Provide undo capability

### Inline editing capability
- Double-click swaps to inline editor; toolbar for basic formatting
- Save on blur/Enter; Escape cancels

### Event stacking algorithm
- Vertical stacking inside each cell using `layer`
- Assign optimal layers to minimize overlap and maximize space

## Visual styling integration
### Geist tokens
```css
:root {
  --calendar-background: var(--geist-background);
  --calendar-foreground: var(--geist-foreground);
  --calendar-border: var(--geist-border);
  --calendar-accent: var(--geist-accent);
  --weekend-tint: rgba(var(--geist-foreground-rgb), 0.03);
  --event-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Weekend columns
- Subtle tint for Sat/Sun columns compatible with light/dark

### Event category colors
- 8 predefined accessible colors; adapt to theme via HSL

### Animation specs
- Drag: cubic-bezier(0.2, 0, 0, 1)
- Resize: linear
- Hover: 200ms ease-out
- Toolbar: spring(1, 80, 10)

## Floating toolbar system
- Appears 8px above selection; uses Floating UI for smart placement
- Actions: duplicate, delete, color, category; with shortcuts
```ts
interface ToolbarAction {
  icon: string
  label: string
  shortcut?: string
  action: (event: CalendarEvent) => void
  isEnabled: (event: CalendarEvent) => boolean
}
```
- Position relative to bounding box; prefer above; handle multi-select

## Technical implementation requirements
### State management
- Centralized state for calendar data and interactions; immutable updates; undo/redo

### Data persistence
- IndexedDB local with optimistic updates; optional backend sync; retry with backoff

### Keyboard shortcuts
```ts
const keyboardShortcuts = {
  'cmd+d': duplicateSelectedEvents,
  delete: deleteSelectedEvents,
  'cmd+z': undoLastAction,
  'cmd+shift+z': redoLastAction,
  escape: clearSelection,
  tab: navigateNextEvent,
  'shift+tab': navigatePreviousEvent,
  enter: editSelectedEvent,
  space: toggleEventSelection,
  'cmd+a': selectAllEvents,
}
```

### Performance strategies
- React.memo on cells, windowing for >100 events
- requestAnimationFrame for drag updates
- Fixed grid tracks; transform animations; lazy-load event details

## Accessibility requirements
- role="grid" container, role="gridcell" cells, ARIA labels for events
- Keyboard navigation: arrows, Home/End, Tab cycle, F10 to toolbar
- Live regions for announcements

## Implementation notes
- Target modern evergreen browsers; feature detection + fallbacks
- Touch: pinch-to-zoom, long-press context; recommend desktop for full-year view
- Testing: unit (dates/layout), integration (DnD/shortcuts), e2e, performance (60fps, <100ms actions)
- Security: sanitize inputs, HTTPS, CORS, encrypted local storage, rate limiting, proper auth handling

## Component structure
```tsx
<CalendarApp>
  <CalendarContainer>
    <MonthSidebar position="left" />
    <CalendarViewport>
      <DayHeader position="top" />
      <CalendarGrid>
        <CalendarCell />
        <EventBlock />
      </CalendarGrid>
      <DayHeader position="bottom" />
    </CalendarViewport>
    <MonthSidebar position="right" />
  </CalendarContainer>
  <FloatingToolbar />
  <ContextMenu />
</CalendarApp>
```

## Project-specific constraints
- Maintain Horizontal Linear Timeline identity; use `LinearCalendarHorizontal` for main year view.
- Avoid embedding large images/screenshots (Playwright or otherwise) in tooling to prevent 413 errors.
- Keep changes incremental; prefer small diffs and validations.
