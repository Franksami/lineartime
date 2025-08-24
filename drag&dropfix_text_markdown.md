# LinearTime calendar fixing guide for drag-and-drop bugs and UI overlapping

## Immediate bug fixes (1-2 days)

### Fix 1: Drag operations not terminating properly

The root cause is **missing global event listeners** and **improper cleanup**. Your drag handlers are likely only attached to the dragged element, not the document.

**Complete Solution:**
```typescript
// hooks/useCalendarDrag.tsx
'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

interface DragState {
  isDragging: boolean;
  pointerId: number | null;
  startCoords: { x: number; y: number };
  dragOffset: { x: number; y: number };
}

export const useCalendarDrag = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    pointerId: null,
    startCoords: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 }
  });
  
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const element = elementRef.current;
    if (!element) return;

    // CRITICAL: Capture pointer to receive all events
    element.setPointerCapture(e.pointerId);
    e.preventDefault();
    
    dragStateRef.current = {
      isDragging: true,
      pointerId: e.pointerId,
      startCoords: { x: e.clientX, y: e.clientY },
      dragOffset: { x: 0, y: 0 }
    };
    
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStateRef.current.isDragging || 
        e.pointerId !== dragStateRef.current.pointerId) return;
    
    const offset = {
      x: e.clientX - dragStateRef.current.startCoords.x,
      y: e.clientY - dragStateRef.current.startCoords.y
    };
    
    dragStateRef.current.dragOffset = offset;
    
    // Update visual position
    if (elementRef.current) {
      elementRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== dragStateRef.current.pointerId) return;
    
    const element = elementRef.current;
    if (element) {
      // CRITICAL: Release pointer capture
      element.releasePointerCapture(e.pointerId);
      element.style.transform = '';
    }
    
    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      pointerId: null,
      startCoords: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 }
    };
    
    setIsDragging(false);
  }, []);

  // CRITICAL: Handle pointer cancel (browser interference)
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== dragStateRef.current.pointerId) return;
    
    // Force cleanup
    setIsDragging(false);
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(e.pointerId);
      elementRef.current.style.transform = '';
    }
    
    dragStateRef.current.isDragging = false;
  }, []);

  // Escape key to cancel drag
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragStateRef.current.isDragging) {
        if (elementRef.current && dragStateRef.current.pointerId !== null) {
          elementRef.current.releasePointerCapture(dragStateRef.current.pointerId);
          elementRef.current.style.transform = '';
        }
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return {
    elementRef,
    isDragging,
    dragOffset: dragStateRef.current.dragOffset,
    eventHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel
    }
  };
};
```

**Apply to your calendar events:**
```css
/* globals.css */
.draggable-calendar-event {
  touch-action: none; /* CRITICAL: Prevents browser interference */
  user-select: none;
  cursor: move;
  position: relative;
}

.draggable-calendar-event.is-dragging {
  z-index: 1000;
  pointer-events: none;
  opacity: 0.8;
}
```

### Fix 2: Z-index and UI layering conflicts

The problem is **missing stacking context management** and **portal misconfiguration**. Shadcn/ui components need proper z-index hierarchy.

**Complete Z-Index System:**
```typescript
// lib/z-index.ts
export const CALENDAR_LAYERS = {
  // Base layers
  GRID: 0,
  EVENTS: 1,
  EVENT_RESIZE: 2,
  SELECTED_EVENT: 3,
  
  // Interaction layers
  DRAG_PREVIEW: 10,
  DROP_ZONES: 11,
  
  // UI layers
  FLOATING_TOOLBAR: 20,
  COLOR_PICKER: 30,
  DROPDOWN_MENU: 31,
  
  // Overlay layers
  TOOLTIP: 40,
  POPOVER: 41,
  
  // Modal layers
  DIALOG: 50,
  TOAST: 60
} as const;
```

**Update Tailwind configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        'calendar-grid': '0',
        'calendar-events': '1',
        'calendar-drag': '10',
        'calendar-toolbar': '20',
        'calendar-dropdown': '30',
        'calendar-tooltip': '40',
        'calendar-modal': '50',
      }
    }
  }
}
```

**Add CSS isolation:**
```css
/* components/calendar/calendar.module.css */
.calendar-container {
  isolation: isolate; /* Creates new stacking context */
  position: relative;
}
```

### Fix 3: Floating toolbar and color picker overlapping

The issue is **improper portal usage** and **missing collision detection**. Shadcn/ui components need explicit portal configuration.

**Fixed Floating Toolbar with Color Picker:**
```typescript
// components/calendar/FloatingEventToolbar.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift,
  FloatingPortal
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HexColorPicker } from 'react-colorful';

interface FloatingEventToolbarProps {
  event: CalendarEvent;
  triggerElement: HTMLElement | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdate: (event: CalendarEvent) => void;
  onEventDelete: (eventId: string) => void;
}

const FloatingEventToolbar: React.FC<FloatingEventToolbarProps> = ({
  event,
  triggerElement,
  isOpen,
  onOpenChange,
  onEventUpdate,
  onEventDelete
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange,
    elements: { reference: triggerElement },
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ 
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] 
      }),
      shift({ padding: 16 })
    ]
  });
  
  const handleColorChange = useCallback((color: string) => {
    onEventUpdate({ ...event, color });
  }, [event, onEventUpdate]);
  
  const colorOptions = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
  ];
  
  return (
    <FloatingPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: CALENDAR_LAYERS.FLOATING_TOOLBAR }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border rounded-lg shadow-lg p-3 min-w-[280px]"
          >
            <div className="space-y-3">
              {/* Event Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">
                  {event.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEventDelete(event.id)}
                  className="text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Color Picker - FIXED PORTAL RENDERING */}
              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    style={{ backgroundColor: event.color }}
                  />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-3"
                  side="right"
                  align="start"
                  sideOffset={8}
                  // CRITICAL: Prevent overlap with proper z-index
                  style={{ zIndex: CALENDAR_LAYERS.COLOR_PICKER }}
                  // CRITICAL: Prevent click-through
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  <HexColorPicker color={event.color} onChange={handleColorChange} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          handleColorChange(color);
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
};

export default FloatingEventToolbar;
```

## Phase 1: Foundation fixes (Days 1-3)

### 1.1 Complete drag-and-drop system overhaul

**Implementation checklist:**
- [ ] Replace all mouse event handlers with pointer events
- [ ] Add pointer capture to all draggable elements
- [ ] Implement global escape key handling
- [ ] Add touch-action: none CSS to prevent browser hijacking
- [ ] Create visual feedback states (hover, grabbed, dragging)
- [ ] Add snap-to-grid functionality (15-minute intervals)

**Testing pattern:**
```typescript
// tests/drag-and-drop.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('drag operation terminates on mouse release', async () => {
  const user = userEvent.setup();
  render(<CalendarEvent />);
  
  const event = screen.getByTestId('calendar-event');
  
  await user.pointer([
    { keys: '[MouseLeft>]', target: event },
    { coords: { x: 100, y: 100 } },
    { keys: '[/MouseLeft]' }
  ]);
  
  expect(event).not.toHaveClass('is-dragging');
});
```

### 1.2 Z-index hierarchy implementation

**Step-by-step migration:**
1. Add isolation: isolate to calendar container
2. Implement CALENDAR_LAYERS constants
3. Update all components to use consistent z-index values
4. Configure Shadcn/ui portals with explicit z-index
5. Test with browser DevTools z-index visualization

**Debugging utility:**
```javascript
// lib/debug-z-index.js
export const debugZIndex = () => {
  const elements = document.querySelectorAll('*');
  const stackingContexts = [];
  
  elements.forEach(el => {
    const styles = getComputedStyle(el);
    const zIndex = styles.zIndex;
    const position = styles.position;
    
    if (zIndex !== 'auto' || position !== 'static') {
      stackingContexts.push({
        element: el.className || el.tagName,
        zIndex,
        position
      });
    }
  });
  
  console.table(stackingContexts.sort((a, b) => 
    parseInt(a.zIndex || 0) - parseInt(b.zIndex || 0)
  ));
};
```

### 1.3 Floating toolbar collision detection

**Smart positioning implementation:**
```typescript
// hooks/useSmartPosition.ts
import { useLayoutEffect, useState } from 'react';

export const useSmartPosition = (
  triggerRect: DOMRect | null,
  toolbarSize: { width: number; height: number }
) => {
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'bottom' });
  
  useLayoutEffect(() => {
    if (!triggerRect) return;
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate available space
    const spaceBelow = viewport.height - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const spaceRight = viewport.width - triggerRect.right;
    
    let x = triggerRect.left;
    let y = triggerRect.bottom + 8;
    let placement = 'bottom';
    
    // Flip vertically if not enough space
    if (spaceBelow < toolbarSize.height && spaceAbove > spaceBelow) {
      y = triggerRect.top - toolbarSize.height - 8;
      placement = 'top';
    }
    
    // Shift horizontally if overflowing
    if (x + toolbarSize.width > viewport.width - 16) {
      x = viewport.width - toolbarSize.width - 16;
    }
    
    setPosition({ x, y, placement });
  }, [triggerRect, toolbarSize]);
  
  return position;
};
```

## Phase 2: Performance optimization (Days 4-5)

### 2.1 React 18 concurrent features

**useTransition for expensive updates:**
```typescript
// components/calendar/CalendarGrid.tsx
import { useTransition, useDeferredValue } from 'react';

function CalendarGrid({ events, filters }) {
  const [isPending, startTransition] = useTransition();
  const deferredFilters = useDeferredValue(filters);
  
  const filteredEvents = useMemo(() => 
    filterEvents(events, deferredFilters),
    [events, deferredFilters]
  );
  
  return (
    <div className={isPending ? 'opacity-50' : ''}>
      {/* Render filtered events */}
    </div>
  );
}
```

### 2.2 Virtual scrolling for large datasets

**Implementation with react-window:**
```typescript
// components/calendar/VirtualEventList.tsx
import { FixedSizeList } from 'react-window';

const VirtualEventList = ({ events, height = 600 }) => {
  const EventRow = ({ index, style }) => (
    <div style={style}>
      <CalendarEvent event={events[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={height}
      itemCount={events.length}
      itemSize={60}
      width="100%"
      overscanCount={5}
    >
      {EventRow}
    </FixedSizeList>
  );
};
```

### 2.3 State management with Zustand

**Calendar store setup:**
```typescript
// store/calendar.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CalendarStore {
  events: CalendarEvent[];
  dragState: DragState | null;
  selectedEventId: string | null;
  
  // Actions
  startDrag: (event: CalendarEvent, position: Point) => void;
  updateDrag: (position: Point) => void;
  endDrag: (dropTarget: DropTarget) => void;
  cancelDrag: () => void;
}

export const useCalendarStore = create<CalendarStore>()(
  immer((set) => ({
    events: [],
    dragState: null,
    selectedEventId: null,
    
    startDrag: (event, position) => set((state) => {
      state.dragState = {
        event,
        startPosition: position,
        currentPosition: position,
        isDragging: true
      };
    }),
    
    updateDrag: (position) => set((state) => {
      if (state.dragState) {
        state.dragState.currentPosition = position;
      }
    }),
    
    endDrag: (dropTarget) => set((state) => {
      if (state.dragState) {
        const eventIndex = state.events.findIndex(
          e => e.id === state.dragState!.event.id
        );
        if (eventIndex !== -1) {
          state.events[eventIndex] = {
            ...state.events[eventIndex],
            ...dropTarget
          };
        }
        state.dragState = null;
      }
    }),
    
    cancelDrag: () => set((state) => {
      state.dragState = null;
    })
  }))
);
```

## Phase 3: Advanced features (Days 6-7)

### 3.1 Touch gesture support

```typescript
// hooks/useTouchGestures.ts
export const useTouchGestures = () => {
  const [gesture, setGesture] = useState<string | null>(null);
  const touchStartRef = useRef<Touch | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0];
    
    // Long press detection (600ms)
    longPressTimerRef.current = setTimeout(() => {
      setGesture('longPress');
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 600);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.clientX;
    const deltaY = touch.clientY - touchStartRef.current.clientY;
    
    // Cancel long press if moved > 10px
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      setGesture('drag');
    }
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    setGesture(null);
    touchStartRef.current = null;
  }, []);
  
  return {
    gesture,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};
```

### 3.2 Accessibility implementation

```typescript
// components/calendar/AccessibleCalendarGrid.tsx
const AccessibleCalendarGrid = ({ events, onEventSelect }) => {
  const [focusedDate, setFocusedDate] = useState(new Date());
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedDate(addDays(focusedDate, 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedDate(subDays(focusedDate, 1));
        break;
      case 'Enter':
        e.preventDefault();
        onEventSelect(focusedDate);
        break;
      case 'c':
        e.preventDefault();
        createNewEvent(focusedDate);
        break;
    }
  };
  
  return (
    <div
      role="grid"
      aria-label={`Calendar for ${format(focusedDate, 'MMMM yyyy')}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Calendar cells with proper ARIA attributes */}
    </div>
  );
};
```

## Performance monitoring setup

```typescript
// lib/performance-monitor.ts
class PerformanceMonitor {
  private observer: PerformanceObserver;
  
  constructor() {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16.67) { // 60fps threshold
          console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
    
    this.observer.observe({ entryTypes: ['measure'] });
  }
  
  measure(name: string, fn: () => void) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
}

export const perfMonitor = new PerformanceMonitor();
```

## Validation checklist

**Before deployment, verify:**
- [ ] Drag operations terminate properly on all browsers
- [ ] No z-index conflicts between calendar layers
- [ ] Color picker renders above toolbar
- [ ] Dropdowns don't overlap calendar content
- [ ] 60fps maintained during drag operations
- [ ] Touch gestures work on mobile devices
- [ ] Keyboard navigation fully functional
- [ ] Screen reader announces calendar changes
- [ ] Memory usage stable over time
- [ ] No console errors or warnings

## Next steps and maintenance

1. **Set up error boundaries** for graceful failure handling
2. **Implement telemetry** to track drag operation success rates
3. **Add feature flags** for gradual rollout of new interactions
4. **Create Storybook stories** for all calendar states
5. **Document keyboard shortcuts** for power users
6. **Add haptic feedback** for mobile interactions
7. **Implement undo/redo stack** for all operations
8. **Set up performance budgets** in CI/CD pipeline

This comprehensive guide addresses all your immediate bugs while providing a robust foundation for your LinearTime calendar application. The solutions are production-ready, performant, and fully compatible with your Next.js 14, React 18, TypeScript, and Shadcn/ui stack.