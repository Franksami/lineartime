# Linear Calendar UI/UX Design Specification

## Design Philosophy
A year-at-a-glance calendar that reveals time patterns instantly. Users should identify conflicts, clusters, and opportunities within 3 seconds of viewing.

---

## 1. Main Year View

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Linear Calendar 2025        [Filter] [View] [+]   │ ← Header Bar
├─────────────────────────────────────────────────────────┤
│     Jan   Feb   Mar   Apr   May   Jun                    │
│ ┌────┬────┬────┬────┬────┬────┬────┐                    │
│ │ M  │ □□□□□□□□□□□□□□□□□□□□□□□□□□ │ ← Week Row         │
│ │ T  │ ████░░░░░░░░░████░░░░░░░░░ │   (Personal=Green) │
│ │ W  │ ░░░░████████░░░░░░████░░░░ │   (Work=Blue)      │
│ │ T  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │   (Effort=Orange)  │
│ │ F  │ ████████████████░░░░░░░░░░ │                    │
│ │ S  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │                    │
│ │ S  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │                    │
│ └────┴────┴────┴────┴────┴────┴────┘                    │
│     Jul   Aug   Sep   Oct   Nov   Dec                    │
│ [Similar grid structure continues...]                     │
├─────────────────────────────────────────────────────────┤
│ MiniMap: [====[viewport]================]                │ ← Navigation
└─────────────────────────────────────────────────────────┘
```

### Grid Specifications
- **Cell Dimensions**: 
  - Digital: 24x24px minimum, 32x32px optimal
  - Print: 8x8mm (8.5×11), 12x12mm (11×17)
- **Month Columns**: Equal width, 30-31 cells tall
- **Week Rows**: 7 cells, labeled Mon-Sun
- **Gap Between Months**: 8px digital, 2mm print

### Color System
```css
/* Primary Event Colors - WCAG AA Compliant */
--color-personal: #10B981;     /* Green - Personal events */
--color-work: #3B82F6;         /* Blue - Work events */
--color-effort: #F97316;       /* Orange - Active efforts */
--color-notes: #8B5CF6;        /* Purple - Knowledge/Notes */

/* State Variations */
--opacity-tentative: 0.5;      /* Unconfirmed events */
--opacity-cancelled: 0.3;      /* Cancelled but visible */
--border-conflict: #EF4444;    /* Red - Overlap warning */
```

---

## 2. Component Breakdown

### A. YearGrid Component
```typescript
interface YearGridProps {
  year: number;
  events: CalendarEvent[];
  viewMode: 'horizontal' | 'vertical';
  zoomLevel: 'compact' | 'standard' | 'expanded';
  filters: FilterState;
}

States:
- loading: Skeleton grid while fetching
- ready: Full interactive mode
- print: Static print-optimized layout
```

### B. DayCell Component
```typescript
interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

Visual States:
- default: Light gray background
- hasEvents: Event color bars
- overlap: Red border, warning icon
- hover: Elevation shadow, tooltip
- selected: Blue outline, edit mode
```

### C. EventBlock Component
```typescript
interface EventBlockProps {
  type: 'personal' | 'work' | 'effort';
  title: string;
  duration: { start: Date; end: Date };
  status: 'tentative' | 'confirmed' | 'cancelled';
  color: string;
}

Rendering Rules:
- Single day: Full cell color
- Multi-day: Horizontal bar across cells
- Overlapping: Stack vertically, max 3 visible
```

### D. FilterPanel Component
```typescript
interface FilterPanelProps {
  activeFilters: string[];
  onToggle: (filter: string) => void;
}

Layout:
┌─────────────────┐
│ View Filters    │
├─────────────────┤
│ ☑ Personal      │
│ ☑ Work          │
│ ☑ Efforts       │
│ ☐ Notes         │
├─────────────────┤
│ Display         │
│ ○ All Events    │
│ ○ Conflicts     │
│ ○ Free Time     │
└─────────────────┘
```

### E. ReflectionModal Component
```typescript
interface ReflectionModalProps {
  trigger: 'manual' | 'auto' | 'scheduled';
  questions: string[];
  onResponse: (answers: Record<string, string>) => void;
}

Content Structure:
┌──────────────────────────────┐
│ 🤔 Reflection Moment          │
├──────────────────────────────┤
│ Looking at your year:         │
│                               │
│ □ What feels overwhelming?    │
│ □ What can be rescheduled?   │
│ □ What's missing?            │
│ □ Where are the bottlenecks? │
│                               │
│ [Skip] [Save Thoughts]        │
└──────────────────────────────┘
```

---

## 3. Interaction Flows

### Flow A: Adding an Event
```mermaid
User clicks "+" button or empty cell
    ↓
QuickAdd modal appears
    ↓
User selects: [Personal] [Work] [Effort]
    ↓
Enter: Title, Start Date, End Date
    ↓
Optional: Add tags, notes, recurrence
    ↓
Save → Event renders on grid
    ↓
If overlap detected → Warning badge appears
```

### Flow B: Overlap Detection
```mermaid
System detects 3+ events on same date
    ↓
Cell border turns red
    ↓
Warning icon appears (!)
    ↓
Hover shows: "3 overlapping events"
    ↓
Click opens conflict resolver
    ↓
Options: [Reschedule] [Keep All] [Prioritize]
```

### Flow C: Drag and Drop Rescheduling
```mermaid
User hovers over event → Drag handle appears
    ↓
Start drag → Event lifts with shadow
    ↓
Valid drop zones highlight green
    ↓
Invalid zones (conflicts) show red
    ↓
Drop → Confirmation: "Move event to [date]?"
    ↓
Confirm → Event moves, grid updates
```

### Flow D: Reflection Workflow
```mermaid
Triggers:
- Manual: Click "Reflect" button
- Auto: After adding 5+ events
- Scheduled: Weekly/Monthly

Modal appears with prompts
    ↓
User types responses (optional)
    ↓
System suggests optimizations:
"You have 8 events on March 15th"
"April has no personal time blocked"
    ↓
User can: [Adjust Now] [Remind Later] [Dismiss]
```

---

## 4. Responsive & Print Behavior

### Breakpoints
```css
/* Mobile: 320-768px */
@media (max-width: 768px) {
  - Vertical scroll with 3 months visible
  - Tap to zoom month
  - Bottom sheet for filters
}

/* Tablet: 768-1024px */
@media (max-width: 1024px) {
  - 6 months visible
  - Side panel collapses to icons
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  - Full year visible
  - All panels expanded
  - Hover interactions enabled
}

/* Print */
@media print {
  - Remove all interactive elements
  - High contrast colors
  - Page break after 6 months
  - Legend on each page
}
```

### Print Layouts
```
8.5×11 Portrait:
┌────────────┐
│  Jan-Jun   │ ← Page 1
├────────────┤
│  Jul-Dec   │ ← Page 2
└────────────┘

11×17 Landscape:
┌──────────────────┐
│  Full Year View  │ ← Single page
└──────────────────┘
```

---

## 5. Micro-interactions & Animations

### Hover Effects
- **Day Cell**: Subtle elevation (2px shadow), 150ms ease
- **Event Block**: Brightness +10%, show title tooltip
- **Filter Toggle**: Scale 1.05, color transition

### State Transitions
- **Event Creation**: Fade in (300ms) with slight scale (0.95 → 1)
- **Drag Start**: Scale 1.02, opacity 0.8, shadow increase
- **Filter Apply**: Stagger fade (50ms delay per month)
- **View Switch**: Smooth morph between horizontal/vertical (500ms)

### Feedback Indicators
- **Success**: Green checkmark, subtle pulse
- **Warning**: Orange badge, gentle shake
- **Error**: Red border, error message below
- **Loading**: Skeleton grid with shimmer effect

---

## 6. Accessibility Features

### Keyboard Navigation
- `Tab`: Navigate between cells
- `Enter`: Open event details
- `Space`: Toggle selection
- `Arrow Keys`: Move between days
- `Ctrl+Arrow`: Jump months
- `Esc`: Close modals

### Screen Reader Support
- ARIA labels: "January 15, 2 events: Team meeting (work), Birthday (personal)"
- Role attributes: grid, gridcell, button
- Live regions for updates
- Skip links for navigation

### Visual Accessibility
- High contrast mode toggle
- Pattern overlays for colorblind users
- Minimum font size: 14px
- Focus indicators: 2px outline

---

## 7. Example Implementation

### January-March with Overlapping Events

```
JANUARY                 FEBRUARY                MARCH
M T W T F S S          M T W T F S S          M T W T F S S
1 2 3 4 5 6 7          . . . 1 2 3 4          . . . 1 2 3 4
█ ░ ░ █ █ ░ ░          ░ ░ ░ █ █ ░ ░          ░ ░ ░ █ █ ░ ░
8 9 10 11 12 13 14     5 6 7 8 9 10 11       5 6 7 8 9 10 11
▓ ▓ ▓ ▓ ▓ ░ ░          █ █ █ ! ! ░ ░          ░ ░ ░ █ █ ░ ░
15 16 17 18 19 20 21   12 13 14 15 16 17 18   12 13 14 15 16 17 18
░ █ █ █ █ ░ ░          ▓ ▓ ▓ ▓ ▓ ░ ░          ! ! ! ! ! ░ ░

Legend:
█ = Personal (Green)     ! = Conflict (Red border)
▓ = Work (Blue)          ░ = Empty
▒ = Effort (Orange)      
```

### Visual Notes:
- **Jan 8-12**: Blue bar indicating 5-day work project
- **Feb 8-9**: Red border showing scheduling conflict
- **Mar 12-16**: Major overlap warning (multiple events)
- Weekends: Slightly darker background
- Today: Yellow highlight border

---

## 8. Component States & Props

### Complete Props Interface
```typescript
interface LinearCalendarProps {
  // Data
  year: number;
  events: CalendarEvent[];
  
  // View
  orientation: 'horizontal' | 'vertical';
  zoom: 'year' | 'quarter' | 'month';
  theme: 'light' | 'dark' | 'high-contrast';
  
  // Filters
  visibleCategories: EventCategory[];
  highlightConflicts: boolean;
  
  // Interactions
  allowEdit: boolean;
  allowDragDrop: boolean;
  
  // Callbacks
  onEventClick: (event: CalendarEvent) => void;
  onEventEdit: (event: CalendarEvent) => void;
  onReflection: (prompt: ReflectionPrompt) => void;
  
  // Features
  enableReflection: boolean;
  enableMinimap: boolean;
  enablePrintMode: boolean;
}
```

---

## Implementation Priority

1. **Phase 1 - Core Grid** (Week 1)
   - YearGrid layout
   - DayCell rendering
   - Basic event display

2. **Phase 2 - Interactions** (Week 2)
   - Filter panel
   - Event creation modal
   - Overlap detection

3. **Phase 3 - Enhanced UX** (Week 3)
   - Drag and drop
   - Reflection workflow
   - Print optimization

4. **Phase 4 - Polish** (Week 4)
   - Animations
   - Accessibility
   - Performance optimization