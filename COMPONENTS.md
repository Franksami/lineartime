# Linear Calendar Component API Documentation

## Core Components

### LinearCalendarVertical

The main calendar component that renders a vertical year view with all 12 months.

```typescript
interface LinearCalendarVerticalProps {
  initialYear?: number  // Default: current year
}
```

**Usage:**
```tsx
import { LinearCalendarVertical } from '@/components/calendar'

export default function CalendarPage() {
  return <LinearCalendarVertical initialYear={2024} />
}
```

**Features:**
- Manages all calendar state internally
- Handles event persistence to LocalStorage
- Coordinates child component interactions
- Provides keyboard navigation support

**State Management:**
- Uses `useLinearCalendar` hook for centralized state
- Automatically saves/loads events from LocalStorage
- Manages filter state and view options

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
- Centralized state management
- Automatic LocalStorage persistence
- Optimized data structures (Map, Set)
- Memoized computed values

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
  
  return isMobile ? <MobileView /> : <DesktopView />
}
```

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