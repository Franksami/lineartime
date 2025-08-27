# Linear Calendar Component API Documentation

## Design System Compliance

All components must follow the design system standards defined in [UI_STANDARDS.md](./UI_STANDARDS.md).

### Component Requirements
1. **Theme Variables Only**: No hardcoded colors - use `bg-background`, `text-foreground`, etc.
2. **oklch Color Space**: All color values use oklch for perceptual uniformity
3. **Full-Screen Layouts**: Edge-to-edge design with minimal padding
4. **SSR Compatible**: Check for `typeof window !== 'undefined'`
5. **Accessibility**: WCAG 2.1 AA compliance required

### Component Template
```tsx
/**
 * ComponentName
 * 
 * Design System: ✅ Compliant
 * Theme Variables: ✅ Used exclusively
 * Accessibility: ✅ WCAG 2.1 AA
 * SSR: ✅ Compatible
 */
export function ComponentName({ className, ...props }: ComponentProps) {
  return (
    <div className={cn(
      "bg-card border-border text-foreground", // Theme variables
      "transition-all duration-200",            // Smooth transitions
      className
    )} {...props}>
      {/* Component content */}
    </div>
  );
}
```

## 🔒 Core Components - Foundation Locked

### LinearCalendarHorizontal (PRIMARY COMPONENT)

**🎯 THE DEFINITIVE CALENDAR COMPONENT** - Locked layout per `docs/LINEAR_CALENDAR_FOUNDATION_SPEC.md`. Implementation improvements are allowed if the layout remains intact.

```typescript
interface LinearCalendarHorizontalProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  onEventUpdate?: (event: Event) => void
  onEventCreate?: (event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  enableInfiniteCanvas?: boolean
}
```

**Usage:**
```tsx
import { LinearCalendarHorizontal } from '@/components/calendar'

export default function CalendarPage() {
  return (
    <LinearCalendarHorizontal
      year={currentYear}
      events={calendarEvents}
      className="h-full w-full"
      onEventCreate={handleEventCreate}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      enableInfiniteCanvas={true}
    />
  )
}
```

## Component Status Catalog

### Active (Foundation-safe)
- [`LinearCalendarHorizontal`](mdc:components/calendar/LinearCalendarHorizontal.tsx)
- [`EventManagement`](mdc:components/calendar/EventManagement.tsx)
- [`EventModal`](mdc:components/calendar/EventModal.tsx)
- [`FilterPanel`](mdc:components/calendar/FilterPanel.tsx)
- [`ReflectionModal`](mdc:components/calendar/ReflectionModal.tsx)
- [`ZoomControls`](mdc:components/calendar/ZoomControls.tsx)

### Experimental (kept for tests and research)
- [`HybridCalendar`](mdc:components/calendar/HybridCalendar.tsx) — used in test pages
- [`VirtualCalendar`](mdc:components/calendar/VirtualCalendar.tsx) — performance lane
- [`RealtimeCalendarView`](mdc:components/calendar/RealtimeCalendarView.tsx) — future collab

### Archived (do not import; kept for history)
- [`LinearCalendarVertical`](mdc:components/calendar/_archive/LinearCalendarVertical.tsx)
- [`MobileCalendarView`](mdc:components/mobile/_archive/MobileCalendarView.tsx)

**🔒 Foundation Features (LOCKED LAYOUT):**
- 12 vertical month rows; each month a single continuous horizontal row
- Week headers at top and bottom aligned with day columns
- Month labels both left and right
- Correct day-of-week alignment for any year; 42-cell invariant per month
- Professional performance: 112+ FPS, optimized memory usage

**State Management:**
- Uses `useOfflineEvents` hook for IndexedDB persistence
- Coordinates with AI Assistant for intelligent scheduling
- Manages touch gestures and zoom controls
- Provides full accessibility support

---

### EventModal

Modal dialog for creating and editing calendar events.

```typescript
interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Partial<Event>) => void
  onDelete?: (id: string) => void
  selectedDate: Date | null
  editingEvent?: Event | null
}
```

**Usage:**
```tsx
<EventModal
  isOpen={isEventModalOpen}
  onClose={() => setIsEventModalOpen(false)}
  onSave={handleSaveEvent}
  onDelete={handleDeleteEvent}
  selectedDate={selectedDate}
  editingEvent={eventToEdit}
/>
```

**Features:**
- Form validation for required fields
- Category selection with color preview
- Optional description field
- Delete functionality for existing events
- Keyboard support (Escape to close)

**Event Categories:**
- `personal` - Green (#4CAF50)
- `work` - Blue (#2196F3)
- `effort` - Orange (#FF9800)
- `note` - Purple (#9C27B0)

---

### FilterPanel

Side panel for filtering event categories and adjusting view options.

```typescript
interface FilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  filters: FilterState
  viewOptions: ViewOptions
  onFilterChange: (filters: FilterState) => void
  onViewOptionsChange: (options: ViewOptions) => void
}
```

**Usage:**
```tsx
<FilterPanel
  isOpen={isFilterPanelOpen}
  onToggle={toggleFilterPanel}
  filters={filters}
  viewOptions={viewOptions}
  onFilterChange={setFilters}
  onViewOptionsChange={setViewOptions}
/>
```

**Filter State:**
```typescript
interface FilterState {
  personal: boolean
  work: boolean
  efforts: boolean
  notes: boolean
}
```

**View Options:**
```typescript
interface ViewOptions {
  showWeekends: boolean
  showToday: boolean
  compactMode: boolean
}
```

---

### ReflectionModal

Modal for year-end reflection with guided prompts.

```typescript
interface ReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  events: Event[]
}
```

**Usage:**
```tsx
<ReflectionModal
  isOpen={showReflection}
  onClose={() => setShowReflection(false)}
  year={currentYear}
  events={allYearEvents}
/>
```

**Reflection Prompts:**
1. Events that clustered together
2. Events that should be rescheduled
3. Missing events or gaps

**Features:**
- Analyzes event patterns
- Provides reflection prompts
- Saves reflections to LocalStorage
- Year-specific reflections

---

### ZoomControls

Controls for adjusting the calendar view density.

```typescript
interface ZoomControlsProps {
  zoomLevel: ZoomLevel
  onZoomChange: (level: ZoomLevel) => void
}

type ZoomLevel = 'compact' | 'standard' | 'expanded'
```

**Usage:**
```tsx
<ZoomControls
  zoomLevel={currentZoom}
  onZoomChange={handleZoomChange}
/>
```

**Zoom Levels:**
- `compact` - Minimal spacing, maximum density
- `standard` - Default balanced view
- `expanded` - Extra spacing for readability

---

## Hooks

### useLinearCalendar

Central state management hook for the calendar application.

```typescript
interface UseLinearCalendarReturn {
  // State
  currentYear: number
  events: Map<string, Event[]>
  filters: FilterState
  viewOptions: ViewOptions
  selectedDates: Set<string>
  hoveredDate: Date | null
  selectedRange: DateRange | null
  reflections: Reflection[]
  
  // Actions
  setCurrentYear: (year: number) => void
  addEvent: (event: Event) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  setFilters: (filters: FilterState) => void
  setViewOptions: (options: ViewOptions) => void
  selectDate: (date: Date) => void
  selectDateRange: (range: DateRange) => void
  clearSelection: () => void
  addReflection: (reflection: Reflection) => void
}
```

**Usage:**
```tsx
import { useLinearCalendar } from '@/hooks/useLinearCalendar'

function CalendarComponent() {
  const {
    events,
    filters,
    addEvent,
    setFilters
  } = useLinearCalendar()
  
  // Use calendar state and actions
}
```

**Features:**
- Centralized state management with IndexedDB
- Automatic offline-first persistence via Dexie
- Optimized data structures (Map, Set)
- Memoized computed values
- Live query support for real-time updates
- Migration support from LocalStorage

---

### use-mobile

Responsive design hook for mobile detection.

```typescript
function useMobile(): boolean
```

**Usage:**
```tsx
import { useMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useMobile()
  
  // ✅ FOUNDATION COMPLIANT: Use same component with mobile optimization
  return (
    <LinearCalendarHorizontal
      year={currentYear}
      events={events}
      className={cn("h-full w-full", isMobile && "mobile-optimized")}
      enableMobileGestures={isMobile}
    />
  )
}
```

**⚠️ FOUNDATION PROTECTION**: Never use different components for mobile vs desktop. The LinearCalendarHorizontal foundation must be used on ALL devices to preserve "Life is bigger than a week" philosophy.

---

## Type Definitions

### Event

Core event data structure.

```typescript
interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  category: EventCategory
  color?: string
  description?: string
  recurring?: RecurrenceRule
  status?: EventStatus
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
  userId?: string
}
```

### DateRange

Date range for multi-day selections.

```typescript
interface DateRange {
  start: Date
  end: Date
}
```

### RecurrenceRule

Rules for recurring events (future feature).

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number
  count?: number
  until?: Date
  byDay?: string[]
  byMonth?: number[]
  byMonthDay?: number[]
}
```

### Reflection

Year reflection data structure.

```typescript
interface Reflection {
  id: string
  date: Date
  prompts: {
    clustered: string
    reschedule: string
    missing: string
  }
  createdAt: Date
}
```

---

## UI Components (shadcn/ui)

The application uses shadcn/ui components as building blocks:

### Core UI Components
- `Button` - Interactive buttons with variants
- `Dialog` - Modal dialogs (EventModal, ReflectionModal)
- `Input` - Form inputs
- `Label` - Form labels
- `Select` - Dropdown selections
- `Textarea` - Multi-line text input
- `Switch` - Toggle switches
- `Card` - Container components
- `ScrollArea` - Scrollable containers
- `Separator` - Visual dividers
- `Sheet` - Side panels (FilterPanel)

### Usage Example:
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function EventForm() {
  return (
    <div>
      <Label htmlFor="title">Event Title</Label>
      <Input id="title" placeholder="Enter event title" />
      <Button onClick={handleSubmit}>Save Event</Button>
    </div>
  )
}
```

---

## Glass Components

Custom glass morphism components for the modern UI aesthetic.

### GlassCard
```tsx
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'light' | 'default' | 'heavy'
}
```

### GlassButton
```tsx
interface GlassButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  glassEffect?: boolean
}
```

---

## Styling Utilities

### Color System

OKLCH-based color tokens:
```typescript
const EVENT_COLORS = {
  personal: '#4CAF50',    // Green
  work: '#2196F3',        // Blue
  effort: '#FF9800',      // Orange
  note: '#9C27B0',        // Purple
}
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### CSS Classes

Common utility classes:
```css
.glass              /* Glass morphism effect */
.glass-heavy        /* Stronger glass effect */
.glass-light        /* Subtle glass effect */
.no-scrollbar       /* Hide scrollbars */
```

---

## Best Practices

### Component Guidelines
1. Keep components focused and single-purpose
2. Use TypeScript interfaces for all props
3. Provide default values where appropriate
4. Include keyboard navigation support
5. Ensure accessibility with ARIA labels

### State Management
1. Use controlled components for forms
2. Lift state up when needed by multiple components
3. Keep LocalStorage sync automatic
4. Use memoization for expensive computations

### Performance
1. Use React.memo for expensive components
2. Implement virtualization for large lists (future)
3. Lazy load modals and heavy components
4. Optimize re-renders with proper dependencies

### Accessibility
1. Include proper ARIA labels
2. Support keyboard navigation
3. Ensure color contrast ratios
4. Provide focus indicators
5. Test with screen readers