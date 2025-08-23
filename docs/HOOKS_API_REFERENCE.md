# Calendar Hooks API Reference

## Complete Hook Documentation for LinearTime

Version: 1.0.0  
Generated: August 23, 2025

---

## Table of Contents

1. [useCalendarEvents](#usecalendarevents)
2. [useCalendarContext](#usecalendarcontext)
3. [useCalendarKeyboard](#usecalendarkeyboard)
4. [useCalendarDrag](#usecalendardrag)
5. [useCalendarTouch](#usecalendartouch)
6. [useCalendarFilters](#usecalendarfilters)
7. [useCalendarSync](#usecalendarsync)
8. [useCalendarPerformance](#usecalendarperformance)

---

## useCalendarEvents

### Purpose
Manages calendar event state with optimistic updates, conflict detection, and smart scheduling.

### Import
```tsx
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
```

### API

```tsx
function useCalendarEvents(
  initialEvents?: CalendarEvent[]
): {
  events: CalendarEvent[]
  conflicts: Map<string, string[]>
  addEvent: (event: Partial<CalendarEvent>) => CalendarEvent
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  batchUpdate: (events: CalendarEvent[]) => void
  findConflicts: (event: CalendarEvent) => string[]
  suggestTimeSlot: (duration: number, preferences?: TimePreferences) => TimeSlot
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| initialEvents | CalendarEvent[] | [] | Initial events to populate the calendar |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| events | CalendarEvent[] | Current array of calendar events |
| conflicts | Map<string, string[]> | Map of event IDs to conflicting event IDs |
| addEvent | Function | Adds a new event with automatic ID generation |
| updateEvent | Function | Updates an existing event by ID |
| deleteEvent | Function | Removes an event by ID |
| batchUpdate | Function | Updates multiple events at once |
| findConflicts | Function | Finds conflicts for a specific event |
| suggestTimeSlot | Function | AI-powered time slot suggestion |

### Usage Example

```tsx
function CalendarComponent() {
  const {
    events,
    conflicts,
    addEvent,
    updateEvent,
    deleteEvent,
    findConflicts,
    suggestTimeSlot
  } = useCalendarEvents()
  
  const handleCreateEvent = () => {
    // Get AI suggestion for best time slot
    const suggestion = suggestTimeSlot(60, {
      preferredTime: 'morning',
      avoidWeekends: true
    })
    
    const newEvent = addEvent({
      title: 'Team Meeting',
      startDate: suggestion.start,
      endDate: suggestion.end,
      category: 'work'
    })
    
    // Check for conflicts
    const eventConflicts = findConflicts(newEvent)
    if (eventConflicts.length > 0) {
      console.warn(`Event conflicts with ${eventConflicts.length} other events`)
    }
  }
  
  const handleUpdateEvent = (id: string, title: string) => {
    updateEvent(id, { 
      title,
      updatedAt: new Date()
    })
  }
  
  return (
    <div>
      {events.map(event => (
        <EventCard 
          key={event.id} 
          event={event}
          hasConflict={conflicts.has(event.id)}
          onUpdate={(updates) => updateEvent(event.id, updates)}
          onDelete={() => deleteEvent(event.id)}
        />
      ))}
    </div>
  )
}
```

### Advanced Features

#### Conflict Detection
```tsx
const conflicts = findConflicts({
  startDate: new Date('2025-01-15T10:00:00'),
  endDate: new Date('2025-01-15T11:00:00')
})
// Returns: ['event-123', 'event-456'] - IDs of conflicting events
```

#### Smart Scheduling
```tsx
const suggestion = suggestTimeSlot(90, {
  preferredTime: 'afternoon',  // 'morning' | 'afternoon' | 'evening'
  avoidWeekends: true,
  avoidConflicts: true,
  workingHours: { start: 9, end: 17 },
  bufferTime: 15  // Minutes between events
})
// Returns: { start: Date, end: Date, confidence: 0.95 }
```

---

## useCalendarContext

### Purpose
Provides access to the global calendar state through React Context API.

### Import
```tsx
import { useCalendarContext } from '@/contexts/CalendarContext'
```

### API

```tsx
function useCalendarContext(): {
  state: CalendarState
  dispatch: React.Dispatch<CalendarAction>
  // Computed values
  selectedMonth: number
  selectedYear: number
  visibleEvents: CalendarEvent[]
  // Helper functions
  selectEvent: (event: CalendarEvent | null) => void
  setView: (view: CalendarView) => void
  setFilters: (filters: FilterState) => void
  // Async operations
  syncEvents: () => Promise<void>
  exportEvents: (format: 'ics' | 'csv' | 'json') => Promise<Blob>
}
```

### State Structure

```tsx
interface CalendarState {
  events: CalendarEvent[]
  selectedEvent: CalendarEvent | null
  view: 'year' | 'month' | 'week' | 'day'
  filters: {
    categories: string[]
    dateRange: { start: Date; end: Date }
    searchQuery: string
    showCompleted: boolean
  }
  isLoading: boolean
  error: string | null
  syncStatus: 'idle' | 'syncing' | 'error'
}
```

### Action Types

```tsx
type CalendarAction = 
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SELECT_EVENT'; payload: CalendarEvent | null }
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'BATCH_UPDATE'; payload: CalendarEvent[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
```

### Usage Example

```tsx
function CalendarToolbar() {
  const {
    state,
    dispatch,
    selectedMonth,
    selectedYear,
    visibleEvents,
    selectEvent,
    setView,
    setFilters,
    syncEvents,
    exportEvents
  } = useCalendarContext()
  
  const handleViewChange = (view: CalendarView) => {
    setView(view)
  }
  
  const handleSync = async () => {
    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' })
      await syncEvents()
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'idle' })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' })
    }
  }
  
  const handleExport = async () => {
    const blob = await exportEvents('ics')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendar-${selectedYear}-${selectedMonth}.ics`
    a.click()
  }
  
  return (
    <div className="toolbar">
      <ViewSelector 
        currentView={state.view}
        onChange={handleViewChange}
      />
      <MonthNavigator
        month={selectedMonth}
        year={selectedYear}
      />
      <div className="event-count">
        {visibleEvents.length} events
      </div>
      <button onClick={handleSync} disabled={state.syncStatus === 'syncing'}>
        {state.syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
      </button>
      <button onClick={handleExport}>Export</button>
    </div>
  )
}
```

---

## useCalendarKeyboard

### Purpose
Handles keyboard navigation and shortcuts for the calendar.

### Import
```tsx
import { useCalendarKeyboard } from '@/hooks/useCalendarKeyboard'
```

### API

```tsx
function useCalendarKeyboard(options?: {
  enableShortcuts?: boolean
  customShortcuts?: ShortcutMap
  onNavigate?: (direction: NavigationDirection) => void
}): {
  registerShortcut: (key: string, handler: () => void) => void
  unregisterShortcut: (key: string) => void
  isShortcutActive: (key: string) => boolean
}
```

### Default Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `←` / `→` | Navigate months | Move between months |
| `↑` / `↓` | Navigate weeks | Move between weeks |
| `Cmd+N` | New event | Create new event |
| `Cmd+E` | Edit event | Edit selected event |
| `Delete` | Delete event | Delete selected event |
| `Escape` | Close dialogs | Close all open dialogs |
| `Cmd+F` | Search | Focus search input |
| `Cmd+Z` | Undo | Undo last action |
| `Cmd+Shift+Z` | Redo | Redo last action |
| `Space` | Quick view | Show event details |
| `Tab` | Focus next | Navigate to next element |

### Usage Example

```tsx
function KeyboardEnabledCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const { registerShortcut, unregisterShortcut } = useCalendarKeyboard({
    enableShortcuts: true,
    onNavigate: (direction) => {
      switch(direction) {
        case 'left':
          setSelectedDate(addDays(selectedDate, -1))
          break
        case 'right':
          setSelectedDate(addDays(selectedDate, 1))
          break
        case 'up':
          setSelectedDate(addWeeks(selectedDate, -1))
          break
        case 'down':
          setSelectedDate(addWeeks(selectedDate, 1))
          break
      }
    }
  })
  
  useEffect(() => {
    // Register custom shortcut
    registerShortcut('cmd+shift+n', () => {
      console.log('Creating recurring event')
    })
    
    return () => {
      unregisterShortcut('cmd+shift+n')
    }
  }, [])
  
  return <Calendar selectedDate={selectedDate} />
}
```

---

## useCalendarDrag

### Purpose
Manages drag-and-drop functionality for event creation and modification.

### Import
```tsx
import { useCalendarDrag } from '@/hooks/useCalendarDrag'
```

### API

```tsx
function useCalendarDrag(): {
  isDragging: boolean
  dragStart: { x: number; y: number } | null
  dragEnd: { x: number; y: number } | null
  dragPreview: DragPreview | null
  handleMouseDown: (e: MouseEvent) => void
  handleMouseMove: (e: MouseEvent) => void
  handleMouseUp: (e: MouseEvent) => void
  cancelDrag: () => void
}
```

### Types

```tsx
interface DragPreview {
  startDate: Date
  endDate: Date
  startX: number
  startY: number
  endX: number
  endY: number
  isValid: boolean
}
```

### Usage Example

```tsx
function DraggableCalendarGrid() {
  const {
    isDragging,
    dragPreview,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cancelDrag
  } = useCalendarDrag()
  
  const { addEvent } = useCalendarEvents()
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDragging) {
        cancelDrag()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isDragging])
  
  const handleDragComplete = () => {
    if (dragPreview?.isValid) {
      addEvent({
        title: 'New Event',
        startDate: dragPreview.startDate,
        endDate: dragPreview.endDate,
        category: 'personal'
      })
    }
  }
  
  return (
    <div 
      className="calendar-grid"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={(e) => {
        handleMouseUp(e)
        handleDragComplete()
      }}
    >
      {isDragging && dragPreview && (
        <DragPreviewComponent preview={dragPreview} />
      )}
      {/* Calendar grid cells */}
    </div>
  )
}
```

---

## useCalendarTouch

### Purpose
Handles touch gestures for mobile calendar interactions.

### Import
```tsx
import { useCalendarTouch } from '@/hooks/useCalendarTouch'
```

### API

```tsx
function useCalendarTouch(ref: React.RefObject<HTMLElement>): {
  isTouching: boolean
  touchStart: Touch | null
  touchEnd: Touch | null
  gesture: GestureType | null
  scale: number
  onPinchZoom: (scale: number) => void
  onSwipe: (direction: SwipeDirection) => void
  onLongPress: (position: { x: number; y: number }) => void
}
```

### Gesture Types

```tsx
type GestureType = 'tap' | 'swipe' | 'pinch' | 'longpress'
type SwipeDirection = 'left' | 'right' | 'up' | 'down'
```

### Usage Example

```tsx
function TouchEnabledCalendar() {
  const calendarRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  
  const {
    gesture,
    scale,
    onPinchZoom,
    onSwipe,
    onLongPress
  } = useCalendarTouch(calendarRef)
  
  useEffect(() => {
    onPinchZoom((newScale) => {
      setZoom(Math.max(0.5, Math.min(3, zoom * newScale)))
    })
    
    onSwipe((direction) => {
      if (direction === 'left') navigateNext()
      if (direction === 'right') navigatePrev()
    })
    
    onLongPress((position) => {
      createEventAtPosition(position)
    })
  }, [zoom])
  
  return (
    <div 
      ref={calendarRef}
      className="calendar-container"
      style={{ transform: `scale(${zoom})` }}
    >
      {gesture && (
        <div className="gesture-indicator">
          {gesture} detected
        </div>
      )}
      <Calendar />
    </div>
  )
}
```

---

## useCalendarFilters

### Purpose
Manages filtering and search functionality for calendar events.

### Import
```tsx
import { useCalendarFilters } from '@/hooks/useCalendarFilters'
```

### API

```tsx
function useCalendarFilters(events: CalendarEvent[]): {
  filters: FilterState
  filteredEvents: CalendarEvent[]
  setFilter: (key: string, value: any) => void
  resetFilters: () => void
  applyPreset: (preset: FilterPreset) => void
  savePreset: (name: string) => void
  presets: FilterPreset[]
}
```

### Filter State

```tsx
interface FilterState {
  categories: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  searchQuery: string
  tags: string[]
  showCompleted: boolean
  showRecurring: boolean
  sortBy: 'date' | 'title' | 'category' | 'priority'
  sortOrder: 'asc' | 'desc'
}
```

### Usage Example

```tsx
function FilterableCalendar() {
  const { events } = useCalendarEvents()
  const {
    filters,
    filteredEvents,
    setFilter,
    resetFilters,
    applyPreset,
    savePreset,
    presets
  } = useCalendarFilters(events)
  
  return (
    <div>
      <FilterBar>
        <SearchInput
          value={filters.searchQuery}
          onChange={(query) => setFilter('searchQuery', query)}
          placeholder="Search events..."
        />
        
        <CategoryFilter
          selected={filters.categories}
          onChange={(categories) => setFilter('categories', categories)}
        />
        
        <DateRangePicker
          startDate={filters.dateRange.start}
          endDate={filters.dateRange.end}
          onChange={(range) => setFilter('dateRange', range)}
        />
        
        <PresetSelector
          presets={presets}
          onSelect={applyPreset}
        />
        
        <button onClick={resetFilters}>Clear Filters</button>
        <button onClick={() => savePreset('My Filter')}>Save Filter</button>
      </FilterBar>
      
      <div className="event-count">
        Showing {filteredEvents.length} of {events.length} events
      </div>
      
      <Calendar events={filteredEvents} />
    </div>
  )
}
```

---

## useCalendarSync

### Purpose
Manages calendar synchronization with external services (Google, Outlook, CalDAV).

### Import
```tsx
import { useCalendarSync } from '@/hooks/useCalendarSync'
```

### API

```tsx
function useCalendarSync(): {
  syncStatus: SyncStatus
  lastSync: Date | null
  connectedServices: CalendarService[]
  syncEvents: (service?: CalendarService) => Promise<SyncResult>
  connectService: (service: CalendarService, credentials: any) => Promise<void>
  disconnectService: (service: CalendarService) => Promise<void>
  resolveConflict: (conflict: SyncConflict, resolution: ConflictResolution) => Promise<void>
  syncQueue: SyncQueueItem[]
}
```

### Types

```tsx
type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict'
type CalendarService = 'google' | 'outlook' | 'caldav' | 'apple'

interface SyncResult {
  added: number
  updated: number
  deleted: number
  conflicts: SyncConflict[]
  errors: SyncError[]
}

interface SyncConflict {
  localEvent: CalendarEvent
  remoteEvent: CalendarEvent
  type: 'update' | 'delete'
}

type ConflictResolution = 'keepLocal' | 'keepRemote' | 'merge'
```

### Usage Example

```tsx
function SyncManager() {
  const {
    syncStatus,
    lastSync,
    connectedServices,
    syncEvents,
    connectService,
    disconnectService,
    resolveConflict,
    syncQueue
  } = useCalendarSync()
  
  const handleSync = async () => {
    try {
      const result = await syncEvents()
      
      if (result.conflicts.length > 0) {
        // Handle conflicts
        for (const conflict of result.conflicts) {
          await resolveConflict(conflict, 'keepLocal')
        }
      }
      
      toast.success(`Synced: ${result.added} added, ${result.updated} updated`)
    } catch (error) {
      toast.error('Sync failed: ' + error.message)
    }
  }
  
  const handleConnect = async (service: CalendarService) => {
    const credentials = await authenticateService(service)
    await connectService(service, credentials)
  }
  
  return (
    <div className="sync-manager">
      <div className="sync-status">
        Status: {syncStatus}
        {lastSync && <span>Last sync: {formatRelative(lastSync)}</span>}
      </div>
      
      <div className="connected-services">
        {connectedServices.map(service => (
          <ServiceCard
            key={service}
            service={service}
            onDisconnect={() => disconnectService(service)}
          />
        ))}
      </div>
      
      <button 
        onClick={handleSync}
        disabled={syncStatus === 'syncing'}
      >
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </button>
      
      {syncQueue.length > 0 && (
        <div className="sync-queue">
          {syncQueue.length} changes pending sync
        </div>
      )}
    </div>
  )
}
```

---

## useCalendarPerformance

### Purpose
Monitors and optimizes calendar performance with metrics and debugging tools.

### Import
```tsx
import { useCalendarPerformance } from '@/hooks/useCalendarPerformance'
```

### API

```tsx
function useCalendarPerformance(): {
  metrics: PerformanceMetrics
  startMeasure: (name: string) => void
  endMeasure: (name: string) => number
  logRenderTime: (componentName: string) => void
  enableProfiling: () => void
  disableProfiling: () => void
  getReport: () => PerformanceReport
  clearMetrics: () => void
}
```

### Types

```tsx
interface PerformanceMetrics {
  renderTime: number
  frameRate: number
  memoryUsage: number
  eventCount: number
  visibleEventCount: number
  interactionDelay: number
}

interface PerformanceReport {
  averageRenderTime: number
  peakMemoryUsage: number
  slowestComponents: ComponentMetric[]
  recommendations: string[]
}
```

### Usage Example

```tsx
function PerformanceMonitoredCalendar() {
  const {
    metrics,
    startMeasure,
    endMeasure,
    logRenderTime,
    enableProfiling,
    getReport
  } = useCalendarPerformance()
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      enableProfiling()
    }
  }, [])
  
  useEffect(() => {
    startMeasure('calendar-render')
    
    return () => {
      const renderTime = endMeasure('calendar-render')
      logRenderTime('Calendar')
      
      if (renderTime > 100) {
        console.warn(`Slow render detected: ${renderTime}ms`)
      }
    }
  })
  
  const handleGenerateReport = () => {
    const report = getReport()
    console.table(report.slowestComponents)
    console.log('Recommendations:', report.recommendations)
  }
  
  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <PerformanceOverlay>
          <div>FPS: {metrics.frameRate}</div>
          <div>Render: {metrics.renderTime}ms</div>
          <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
          <div>Events: {metrics.visibleEventCount}/{metrics.eventCount}</div>
          <button onClick={handleGenerateReport}>Generate Report</button>
        </PerformanceOverlay>
      )}
      
      <Calendar />
    </>
  )
}
```

---

## Best Practices

### 1. Performance Optimization

```tsx
// Use memoization for expensive computations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(events)
}, [events])

// Debounce rapid updates
const debouncedUpdate = useDebouncedCallback(
  (value) => updateEvent(id, { title: value }),
  500
)
```

### 2. Error Handling

```tsx
try {
  await syncEvents()
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Queue for later sync
    queueSync()
  } else {
    // Show user error
    showError(error.message)
  }
}
```

### 3. Type Safety

```tsx
// Always use proper types
const event: CalendarEvent = {
  id: generateId(),
  title: 'Meeting',
  startDate: new Date(),
  endDate: addHours(new Date(), 1),
  category: 'work' as const,  // Use const assertion
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 4. Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react-hooks'

test('should add event', () => {
  const { result } = renderHook(() => useCalendarEvents())
  
  act(() => {
    result.current.addEvent({
      title: 'Test Event',
      startDate: new Date(),
      endDate: new Date()
    })
  })
  
  expect(result.current.events).toHaveLength(1)
  expect(result.current.events[0].title).toBe('Test Event')
})
```

---

## Migration Guide

### From Class Components

```tsx
// Before (Class Component)
class Calendar extends Component {
  state = { events: [] }
  
  addEvent = (event) => {
    this.setState(prevState => ({
      events: [...prevState.events, event]
    }))
  }
}

// After (Hook)
function Calendar() {
  const { events, addEvent } = useCalendarEvents()
  
  return <div>{/* ... */}</div>
}
```

### From Redux

```tsx
// Before (Redux)
const mapStateToProps = (state) => ({
  events: state.calendar.events
})

const mapDispatchToProps = {
  addEvent,
  updateEvent
}

// After (Hooks)
function Calendar() {
  const { state, dispatch } = useCalendarContext()
  const { events } = state
  
  const addEvent = (event) => {
    dispatch({ type: 'ADD_EVENT', payload: event })
  }
}
```

---

## Troubleshooting

### Common Issues

1. **Hook called outside component**
   - Ensure hooks are called at the top level of React components
   - Don't call hooks inside conditions or loops

2. **Stale closure issues**
   - Include all dependencies in useEffect/useCallback dependency arrays
   - Use functional updates for state based on previous state

3. **Performance issues**
   - Use React.memo for expensive components
   - Implement virtualization for large event lists
   - Profile with useCalendarPerformance hook

4. **Memory leaks**
   - Clean up event listeners in useEffect return functions
   - Cancel async operations when component unmounts

---

*API Reference generated by Claude Code on August 23, 2025*
*Version 1.0.0 - Phase 1 Complete*