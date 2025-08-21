# Linear Calendar - Technical Product Requirements Document (PRD)

## Executive Summary

This PRD defines the technical implementation for transforming a basic linear calendar into an enterprise-grade, AI-powered scheduling platform. The implementation targets 60fps performance with 10,000+ events, natural language processing, real-time collaboration, and intelligent scheduling capabilities comparable to Fantastical, Reclaim.ai, and Notion Calendar.

**Target Metrics:**
- Initial render: <500ms for 12 months
- Scrolling: Consistent 60fps with 10,000+ events
- Memory usage: <100MB typical, <200MB peak
- Event creation: <100ms with NLP
- Sync latency: <100ms for real-time updates

## Current State Analysis

### Existing Implementation
```typescript
// Current stack
- Framework: Next.js 15.5.0 with Turbopack
- UI: React 18 + TypeScript + shadcn/ui
- Styling: Tailwind CSS (dark theme)
- Storage: LocalStorage (limited to ~5MB)
- Layout: Vertical 12-month grid (42 columns × 12 rows)
- Features: Basic CRUD, category filters, zoom controls
```

### Critical Limitations
1. **Performance:** DOM-based rendering degrades at >500 events
2. **Storage:** LocalStorage synchronous operations block UI
3. **Intelligence:** No NLP or AI capabilities
4. **Collaboration:** Single-user only
5. **Mobile:** Limited touch optimization

## Phase 1: Performance Foundation (Weeks 1-4)

### 1.1 Virtual Scrolling Implementation

**Objective:** Handle 10,000+ events with constant 60fps performance

```typescript
// components/calendar/VirtualCalendar.tsx
import { VariableSizeList } from 'react-window';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualCalendarProps {
  events: CalendarEvent[];
  months: MonthData[];
}

const VirtualCalendar: React.FC<VirtualCalendarProps> = ({ events, months }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: 12, // 12 months
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated month height
    overscan: 2, // Render 2 months outside viewport
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadMonthEvents(entry.target.dataset.month);
          }
        });
      },
      { rootMargin: '100px' }
    );
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <MonthRow
            key={virtualRow.key}
            month={months[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 1.2 Canvas-DOM Hybrid Rendering

**Implementation:** Three-layer Canvas architecture with DOM overlays

```typescript
// lib/canvas/CalendarRenderer.ts
export class CalendarRenderer {
  private gridCanvas: HTMLCanvasElement;
  private eventsCanvas: HTMLCanvasElement;
  private interactionCanvas: HTMLCanvasElement;
  private ctx: {
    grid: CanvasRenderingContext2D;
    events: CanvasRenderingContext2D;
    interaction: CanvasRenderingContext2D;
  };
  
  private offscreenCanvas: OffscreenCanvas;
  private eventPool: EventRenderObject[] = [];
  
  constructor(container: HTMLElement) {
    // Initialize canvases with will-change for GPU acceleration
    this.setupCanvases(container);
    this.initializeOffscreenRendering();
  }

  private setupCanvases(container: HTMLElement) {
    // Create three stacked canvases
    ['grid', 'events', 'interaction'].forEach((layer) => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.willChange = 'transform';
      canvas.style.transform = 'translateZ(0)'; // Force GPU layer
      
      if (layer === 'grid') {
        // Static grid - render once
        canvas.style.zIndex = '1';
      } else if (layer === 'events') {
        // Dynamic events layer
        canvas.style.zIndex = '2';
      } else {
        // Interactive overlay
        canvas.style.zIndex = '3';
        canvas.style.pointerEvents = 'auto';
      }
      
      container.appendChild(canvas);
      this[`${layer}Canvas`] = canvas;
      this.ctx[layer] = canvas.getContext('2d', {
        alpha: layer !== 'grid',
        desynchronized: true, // Improve performance
      });
    });
  }

  public renderMonth(month: number, events: CalendarEvent[]) {
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      this.clearEventLayer(month);
      
      // Batch render events
      const renderBatch = events.slice(0, 100); // Render in batches
      this.renderEventBatch(renderBatch);
      
      if (events.length > 100) {
        // Schedule remaining events
        requestIdleCallback(() => {
          this.renderEventBatch(events.slice(100));
        });
      }
    });
  }

  private renderEventBatch(events: CalendarEvent[]) {
    const ctx = this.ctx.events;
    ctx.save();
    
    // Use object pooling for event render objects
    events.forEach(event => {
      const renderObj = this.getEventRenderObject(event);
      this.drawEvent(ctx, renderObj);
      this.releaseEventRenderObject(renderObj);
    });
    
    ctx.restore();
  }
}
```

### 1.3 Event Data Structure Optimization

**Implementation:** Interval Tree for O(log n) conflict detection

```typescript
// lib/data-structures/IntervalTree.ts
interface TimeInterval {
  start: number;
  end: number;
  event: CalendarEvent;
}

class IntervalNode {
  interval: TimeInterval;
  max: number;
  left: IntervalNode | null = null;
  right: IntervalNode | null = null;
  
  constructor(interval: TimeInterval) {
    this.interval = interval;
    this.max = interval.end;
  }
}

export class IntervalTree {
  private root: IntervalNode | null = null;
  
  insert(event: CalendarEvent): void {
    const interval = {
      start: event.startTime.getTime(),
      end: event.endTime.getTime(),
      event
    };
    this.root = this.insertNode(this.root, interval);
  }
  
  findOverlapping(start: Date, end: Date): CalendarEvent[] {
    const results: CalendarEvent[] = [];
    this.searchOverlapping(
      this.root,
      start.getTime(),
      end.getTime(),
      results
    );
    return results;
  }
  
  private searchOverlapping(
    node: IntervalNode | null,
    start: number,
    end: number,
    results: CalendarEvent[]
  ): void {
    if (!node) return;
    
    // Check if current node overlaps
    if (node.interval.start < end && node.interval.end > start) {
      results.push(node.interval.event);
    }
    
    // Recursively search subtrees
    if (node.left && node.left.max > start) {
      this.searchOverlapping(node.left, start, end, results);
    }
    
    if (node.right && node.interval.start < end) {
      this.searchOverlapping(node.right, start, end, results);
    }
  }
}
```

### 1.4 Web Worker Architecture

```typescript
// workers/calendar.worker.ts
import { IntervalTree } from '../lib/data-structures/IntervalTree';

interface WorkerMessage {
  type: 'PROCESS_EVENTS' | 'FIND_CONFLICTS' | 'CALCULATE_LAYOUT';
  payload: any;
}

const eventTree = new IntervalTree();
const eventCache = new Map<string, ProcessedEvent>();

self.addEventListener('message', async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'PROCESS_EVENTS':
      const processed = await processEvents(payload.events);
      self.postMessage({ type: 'EVENTS_PROCESSED', data: processed });
      break;
      
    case 'FIND_CONFLICTS':
      const conflicts = findConflicts(payload.start, payload.end);
      self.postMessage({ type: 'CONFLICTS_FOUND', data: conflicts });
      break;
      
    case 'CALCULATE_LAYOUT':
      const layout = calculateEventLayout(payload.events);
      self.postMessage({ type: 'LAYOUT_CALCULATED', data: layout });
      break;
  }
});

async function processEvents(events: RawEvent[]): Promise<ProcessedEvent[]> {
  // Parallel processing with chunking
  const chunkSize = 100;
  const chunks = [];
  
  for (let i = 0; i < events.length; i += chunkSize) {
    chunks.push(events.slice(i, i + chunkSize));
  }
  
  const processed = await Promise.all(
    chunks.map(chunk => processChunk(chunk))
  );
  
  return processed.flat();
}

function calculateEventLayout(events: ProcessedEvent[]): EventLayout {
  // Implement sweep line algorithm for optimal layout
  const columns: EventColumn[] = [];
  const sortedEvents = events.sort((a, b) => a.start - b.start);
  
  sortedEvents.forEach(event => {
    let placed = false;
    
    for (const column of columns) {
      if (column.canFit(event)) {
        column.addEvent(event);
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      const newColumn = new EventColumn();
      newColumn.addEvent(event);
      columns.push(newColumn);
    }
  });
  
  return { columns, maxColumns: columns.length };
}
```

## Phase 2: Natural Language Processing (Weeks 5-6)

### 2.1 Chrono.js Integration with Custom Refiners

```typescript
// lib/nlp/EventParser.ts
import * as chrono from 'chrono-node';
import { EventIntent, ParsedEvent } from '@/types/calendar';

export class EventParser {
  private parser: chrono.Chrono;
  private locationPattern = /(?:at|@)\s+([^,]+?)(?:\s+(?:on|at|from)|$)/i;
  private attendeePattern = /(?:with|w\/)\s+(@?\w+(?:\s+@?\w+)*)/gi;
  
  constructor() {
    this.parser = new chrono.Chrono();
    this.registerCustomRefiners();
  }
  
  private registerCustomRefiners() {
    // Business hours refiner
    this.parser.refiners.push({
      refine: (context, results) => {
        results.forEach(result => {
          if (!result.start.isCertain('hour')) {
            const text = context.text.toLowerCase();
            
            if (text.includes('meeting') || text.includes('call')) {
              // Default business hours for meetings
              result.start.imply('hour', 10);
              result.start.imply('minute', 0);
              
              if (!result.end) {
                result.end = result.start.clone();
                result.end.imply('hour', 11);
              }
            }
          }
        });
        return results;
      }
    });
    
    // Duration refiner
    this.parser.refiners.push({
      refine: (context, results) => {
        const durationPattern = /for\s+(\d+)\s+(hour|minute|min|hr)s?/i;
        const match = context.text.match(durationPattern);
        
        if (match && results.length > 0) {
          const duration = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const result = results[0];
          
          if (!result.end && result.start) {
            result.end = result.start.clone();
            
            if (unit.startsWith('hour') || unit === 'hr') {
              result.end.imply('hour', result.start.get('hour') + duration);
            } else {
              result.end.imply('minute', result.start.get('minute') + duration);
            }
          }
        }
        
        return results;
      }
    });
  }
  
  public parse(input: string): ParsedEvent {
    // Parse temporal information
    const temporal = this.parser.parse(input)[0];
    
    // Extract location
    const locationMatch = input.match(this.locationPattern);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Extract attendees
    const attendees: string[] = [];
    let match;
    while ((match = this.attendeePattern.exec(input)) !== null) {
      attendees.push(...match[1].split(/\s+/).map(a => a.replace('@', '')));
    }
    
    // Extract title (remove parsed components)
    let title = input;
    if (temporal) {
      title = title.replace(temporal.text, '');
    }
    if (location) {
      title = title.replace(this.locationPattern, '');
    }
    title = title.replace(this.attendeePattern, '').trim();
    
    // Determine event category using NLP
    const category = this.inferCategory(input);
    
    return {
      title,
      start: temporal?.start.date(),
      end: temporal?.end?.date(),
      location,
      attendees,
      category,
      confidence: this.calculateConfidence(temporal, location, attendees),
      originalInput: input
    };
  }
  
  private inferCategory(input: string): EventCategory {
    const workKeywords = ['meeting', 'call', 'presentation', 'review', 'standup'];
    const personalKeywords = ['birthday', 'dinner', 'lunch', 'coffee', 'gym'];
    const effortKeywords = ['workout', 'study', 'practice', 'work on', 'build'];
    
    const lower = input.toLowerCase();
    
    if (workKeywords.some(keyword => lower.includes(keyword))) {
      return 'work';
    }
    if (personalKeywords.some(keyword => lower.includes(keyword))) {
      return 'personal';
    }
    if (effortKeywords.some(keyword => lower.includes(keyword))) {
      return 'effort';
    }
    
    return 'note';
  }
}
```

### 2.2 Command Bar Implementation

```typescript
// components/CommandBar.tsx
import { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { EventParser } from '@/lib/nlp/EventParser';
import { CalendarEvent } from '@/types/calendar';

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedEvent | null>(null);
  const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null);
  const parser = useRef(new EventParser());
  
  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Real-time parsing
  useEffect(() => {
    if (input.length > 3) {
      const parsed = parser.current.parse(input);
      setPreview(parsed);
      
      // Highlight target month on timeline
      if (parsed.start) {
        setHighlightedMonth(parsed.start.getMonth());
        scrollToMonth(parsed.start.getMonth());
      }
    } else {
      setPreview(null);
      setHighlightedMonth(null);
    }
  }, [input]);
  
  const handleSubmit = async () => {
    if (preview && preview.confidence > 0.6) {
      const event = await createEvent(preview);
      
      // Optimistic update
      optimisticallyAddEvent(event);
      
      // Sync to server
      syncEventToServer(event);
      
      setOpen(false);
      setInput('');
    }
  };
  
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] z-50"
    >
      <Command.Input
        value={input}
        onValueChange={setInput}
        placeholder="Type an event (e.g., 'Lunch with Sarah tomorrow at 12pm')"
        className="w-full p-4 text-lg"
      />
      
      {preview && (
        <div className="p-4 border-t">
          <EventPreview event={preview} />
          
          {preview.confidence < 0.6 && (
            <div className="mt-2 text-sm text-yellow-500">
              Low confidence. Please provide more details.
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded">Enter</kbd>
            <span className="text-sm">to create event</span>
            
            {preview.start && (
              <span className="ml-auto text-sm text-gray-400">
                {format(preview.start, 'MMMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      )}
      
      <Command.List>
        <Command.Group heading="Suggestions">
          <Command.Item value="meeting">Schedule a meeting</Command.Item>
          <Command.Item value="reminder">Set a reminder</Command.Item>
          <Command.Item value="block">Block focus time</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

## Phase 3: AI-Powered Scheduling (Weeks 7-9)

### 3.1 Constraint Satisfaction Problem (CSP) Solver

```typescript
// lib/ai/SchedulingEngine.ts
interface Constraint {
  type: 'hard' | 'soft';
  evaluate: (slot: TimeSlot, context: SchedulingContext) => boolean;
  penalty?: number;
}

interface SchedulingContext {
  existingEvents: CalendarEvent[];
  preferences: UserPreferences;
  focusBlocks: FocusBlock[];
  energyLevels: EnergyProfile;
}

export class SchedulingEngine {
  private constraints: Constraint[] = [];
  private readonly MAX_ITERATIONS = 1000;
  
  constructor() {
    this.initializeConstraints();
  }
  
  private initializeConstraints() {
    // Hard constraints (must be satisfied)
    this.constraints.push({
      type: 'hard',
      evaluate: (slot, context) => {
        // No double-booking
        return !context.existingEvents.some(event => 
          this.overlaps(slot, event)
        );
      }
    });
    
    this.constraints.push({
      type: 'hard',
      evaluate: (slot, context) => {
        // Respect working hours
        const hour = slot.start.getHours();
        return hour >= 9 && hour <= 18;
      }
    });
    
    // Soft constraints (preferences)
    this.constraints.push({
      type: 'soft',
      penalty: 10,
      evaluate: (slot, context) => {
        // Prefer high-energy times for important tasks
        const hour = slot.start.getHours();
        const energyLevel = context.energyLevels.getLevel(hour);
        return slot.priority <= 2 ? energyLevel > 0.7 : true;
      }
    });
    
    this.constraints.push({
      type: 'soft',
      penalty: 5,
      evaluate: (slot, context) => {
        // Minimize context switching
        const before = this.getEventBefore(slot, context.existingEvents);
        const after = this.getEventAfter(slot, context.existingEvents);
        
        return (!before || before.category === slot.category) &&
               (!after || after.category === slot.category);
      }
    });
  }
  
  public async findOptimalSlot(
    request: SchedulingRequest
  ): Promise<TimeSlot[]> {
    const candidates = this.generateCandidateSlots(request);
    const context = await this.buildContext(request);
    
    // Score each candidate
    const scored = candidates.map(slot => ({
      slot,
      score: this.scoreSlot(slot, context)
    }));
    
    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);
    
    // Return top 5 options
    return scored.slice(0, 5).map(s => s.slot);
  }
  
  private scoreSlot(slot: TimeSlot, context: SchedulingContext): number {
    let score = 100;
    
    for (const constraint of this.constraints) {
      const satisfied = constraint.evaluate(slot, context);
      
      if (constraint.type === 'hard' && !satisfied) {
        return -1; // Invalid slot
      }
      
      if (constraint.type === 'soft' && !satisfied) {
        score -= constraint.penalty || 5;
      }
    }
    
    // Bonus for protecting focus time
    if (this.protectsFocusTime(slot, context)) {
      score += 20;
    }
    
    return score;
  }
  
  public async autoReschedule(
    trigger: RescheduleTrigger
  ): Promise<RescheduleResult> {
    // Implement Reclaim.ai-style automatic rescheduling
    const affectedEvents = await this.getAffectedEvents(trigger);
    const dependencies = await this.buildDependencyGraph(affectedEvents);
    
    // Use backtracking search with forward checking
    const solution = await this.backtrackingSearch(
      affectedEvents,
      dependencies,
      new Map()
    );
    
    if (solution) {
      return {
        success: true,
        changes: this.generateChangeSet(affectedEvents, solution)
      };
    }
    
    // Try relaxing constraints
    const relaxedSolution = await this.searchWithRelaxation(
      affectedEvents,
      dependencies
    );
    
    return relaxedSolution || { success: false, conflicts: affectedEvents };
  }
}
```

### 3.2 Focus Time Protection

```typescript
// lib/ai/FocusTimeManager.ts
interface FocusBlock {
  id: string;
  type: 'deep-work' | 'shallow-work' | 'break';
  preferredTimes: TimeRange[];
  minDuration: number;
  maxDuration: number;
  priority: number;
}

export class FocusTimeManager {
  private focusBlocks: Map<string, FocusBlock> = new Map();
  private userProfile: UserProductivityProfile;
  
  async protectFocusTime(
    request: FocusTimeRequest
  ): Promise<ProtectedTimeResult> {
    const blocks = this.generateFocusBlocks(request);
    const conflicts = await this.findConflicts(blocks);
    
    if (conflicts.length > 0) {
      // Negotiate with conflicting events
      const negotiationResult = await this.negotiate(blocks, conflicts);
      
      if (negotiationResult.success) {
        await this.applyChanges(negotiationResult.changes);
      }
    }
    
    // Lock focus blocks in calendar
    const locked = await this.lockBlocks(blocks);
    
    // Set up auto-decline for meeting requests during focus time
    await this.setupAutoDecline(locked);
    
    return {
      protected: locked,
      rescheduled: conflicts.filter(c => c.rescheduled),
      declined: conflicts.filter(c => c.declined)
    };
  }
  
  private async negotiate(
    focusBlocks: FocusBlock[],
    conflicts: CalendarEvent[]
  ): Promise<NegotiationResult> {
    const changes: CalendarChange[] = [];
    
    for (const conflict of conflicts) {
      // Calculate importance scores
      const focusScore = this.calculateFocusImportance(focusBlocks);
      const eventScore = this.calculateEventImportance(conflict);
      
      if (focusScore > eventScore * 1.5) {
        // Try to reschedule the event
        const newSlot = await this.findAlternativeSlot(conflict);
        
        if (newSlot) {
          changes.push({
            type: 'reschedule',
            event: conflict,
            newTime: newSlot
          });
        } else if (conflict.priority < 3) {
          // Decline low-priority events
          changes.push({
            type: 'decline',
            event: conflict,
            reason: 'Focus time protected'
          });
        }
      }
    }
    
    return {
      success: changes.length === conflicts.length,
      changes
    };
  }
}
```

## Phase 4: Real-Time Collaboration (Weeks 10-12)

### 4.1 WebSocket & CRDT Implementation

```typescript
// lib/collaboration/CollaborationManager.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export class CollaborationManager {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private persistence: IndexeddbPersistence;
  private awareness: any;
  
  constructor(calendarId: string, userId: string) {
    // Initialize Yjs document
    this.doc = new Y.Doc();
    
    // Set up IndexedDB persistence for offline support
    this.persistence = new IndexeddbPersistence(calendarId, this.doc);
    
    // WebSocket provider for real-time sync
    this.provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_WS_URL!,
      calendarId,
      this.doc,
      {
        connect: true,
        params: { userId },
        WebSocketPolyfill: WebSocket,
        resyncInterval: 5000,
      }
    );
    
    // Awareness protocol for presence
    this.awareness = this.provider.awareness;
    this.setupAwareness(userId);
    
    // Initialize CRDT structures
    this.initializeCRDTStructures();
  }
  
  private initializeCRDTStructures() {
    // Events as Y.Map for conflict-free updates
    const events = this.doc.getMap('events');
    
    // Event ordering as Y.Array
    const eventOrder = this.doc.getArray('eventOrder');
    
    // Shared settings
    const settings = this.doc.getMap('settings');
    
    // Set up observers
    events.observe(this.handleEventChanges.bind(this));
    eventOrder.observe(this.handleOrderChanges.bind(this));
  }
  
  public addEvent(event: CalendarEvent): void {
    const events = this.doc.getMap('events');
    const eventOrder = this.doc.getArray('eventOrder');
    
    // Transaction for atomic updates
    this.doc.transact(() => {
      // Create Y.Map for event properties
      const yEvent = new Y.Map();
      Object.entries(event).forEach(([key, value]) => {
        yEvent.set(key, value);
      });
      
      // Add to events map
      events.set(event.id, yEvent);
      
      // Update order
      const index = this.findInsertionIndex(event, eventOrder);
      eventOrder.insert(index, [event.id]);
    }, this);
  }
  
  public updateEvent(eventId: string, updates: Partial<CalendarEvent>): void {
    const events = this.doc.getMap('events');
    const yEvent = events.get(eventId) as Y.Map<any>;
    
    if (yEvent) {
      this.doc.transact(() => {
        Object.entries(updates).forEach(([key, value]) => {
          yEvent.set(key, value);
        });
        
        // Add last-modified timestamp
        yEvent.set('lastModified', Date.now());
        yEvent.set('modifiedBy', this.awareness.clientID);
      }, this);
    }
  }
  
  private handleConflict(
    localChange: any,
    remoteChange: any
  ): any {
    // Implement conflict resolution strategies
    
    // Strategy 1: Last-write-wins for simple properties
    if (localChange.lastModified < remoteChange.lastModified) {
      return remoteChange;
    }
    
    // Strategy 2: Merge for arrays (e.g., attendees)
    if (Array.isArray(localChange) && Array.isArray(remoteChange)) {
      return [...new Set([...localChange, ...remoteChange])];
    }
    
    // Strategy 3: Three-way merge for complex objects
    return this.threeWayMerge(localChange, remoteChange);
  }
  
  public setupPresence(userId: string): void {
    // Set user presence
    this.awareness.setLocalStateField('user', {
      id: userId,
      name: getUserName(userId),
      color: getUserColor(userId),
      cursor: null,
      selection: null
    });
    
    // Track cursor position
    document.addEventListener('mousemove', (e) => {
      this.awareness.setLocalStateField('cursor', {
        x: e.clientX,
        y: e.clientY
      });
    });
    
    // Observe remote cursors
    this.awareness.on('change', () => {
      const states = this.awareness.getStates();
      this.renderRemoteCursors(states);
    });
  }
}
```

### 4.2 Offline-First with Service Worker

```typescript
// service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Event sync queue
const eventQueue = new Queue('events', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        // Put back in queue if failed
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// API routes with background sync
registerRoute(
  /^https:\/\/api\.calendar\.com\/events/,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60 // Retry for 24 hours
      })
    ]
  }),
  'POST'
);

// Calendar data caching
registerRoute(
  ({ request }) => request.url.includes('/api/calendar'),
  new StaleWhileRevalidate({
    cacheName: 'calendar-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // Cache only successful responses
          if (response && response.status === 200) {
            return response;
          }
          return null;
        }
      }
    ]
  })
);

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

// Background sync for events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

async function syncEvents() {
  const db = await openDB('calendar-db', 1);
  const tx = db.transaction('pending-events', 'readonly');
  const events = await tx.objectStore('pending-events').getAll();
  
  for (const event of events) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Remove from pending after successful sync
      await db.delete('pending-events', event.id);
    } catch (error) {
      console.error('Sync failed for event:', event.id);
    }
  }
}
```

## Phase 5: Storage Migration & Data Architecture

### 5.1 IndexedDB Implementation

```typescript
// lib/storage/CalendarDB.ts
import Dexie, { Table } from 'dexie';

interface StoredEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: string;
  recurring?: RecurrenceRule;
  syncStatus: 'local' | 'synced' | 'pending';
  lastModified: number;
  version: number;
}

class CalendarDatabase extends Dexie {
  events!: Table<StoredEvent>;
  conflicts!: Table<ConflictRecord>;
  syncQueue!: Table<SyncQueueItem>;
  
  constructor() {
    super('CalendarDB');
    
    this.version(1).stores({
      events: 'id, start, end, category, syncStatus, lastModified',
      conflicts: 'id, eventId, timestamp',
      syncQueue: '++id, operation, timestamp'
    });
    
    this.version(2).stores({
      events: 'id, start, end, category, syncStatus, lastModified, [start+end]',
      // Add compound index for range queries
    }).upgrade(trans => {
      // Migrate from localStorage
      return trans.events.toCollection().modify(event => {
        event.version = 1;
      });
    });
  }
  
  async migrateFromLocalStorage(): Promise<void> {
    const localData = localStorage.getItem('calendar-events');
    
    if (localData) {
      const events = JSON.parse(localData);
      
      await this.transaction('rw', this.events, async () => {
        for (const event of events) {
          await this.events.add({
            ...event,
            syncStatus: 'local',
            lastModified: Date.now(),
            version: 1
          });
        }
      });
      
      // Clear localStorage after successful migration
      localStorage.removeItem('calendar-events');
    }
  }
  
  async getEventsInRange(start: Date, end: Date): Promise<StoredEvent[]> {
    // Use compound index for efficient range query
    return this.events
      .where('[start+end]')
      .between([start, Dexie.minKey], [end, Dexie.maxKey])
      .toArray();
  }
  
  async bulkSync(events: StoredEvent[]): Promise<void> {
    // Efficient bulk operations
    await this.transaction('rw', this.events, this.syncQueue, async () => {
      // Use bulkPut for better performance
      await this.events.bulkPut(events);
      
      // Clear sync queue for successful items
      const syncedIds = events.map(e => e.id);
      await this.syncQueue
        .where('eventId')
        .anyOf(syncedIds)
        .delete();
    });
  }
}

export const db = new CalendarDatabase();
```

## Phase 6: Mobile Optimization

### 6.1 Touch Gesture Handler

```typescript
// lib/mobile/GestureHandler.ts
export class GestureHandler {
  private element: HTMLElement;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private velocityX = 0;
  private velocityY = 0;
  private rafId: number | null = null;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.initializeGestures();
  }
  
  private initializeGestures() {
    // Use Pointer Events for unified input handling
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerup', this.handlePointerUp);
    this.element.addEventListener('pointercancel', this.handlePointerCancel);
    
    // Prevent default touch behaviors
    this.element.style.touchAction = 'none';
    this.element.style.userSelect = 'none';
    
    // Enable hardware acceleration
    this.element.style.willChange = 'transform';
  }
  
  private handlePointerDown = (e: PointerEvent) => {
    // Capture pointer for consistent tracking
    this.element.setPointerCapture(e.pointerId);
    
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchStartTime = Date.now();
    
    // Cancel any ongoing momentum
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Haptic feedback for touch
    if ('vibrate' in navigator && e.pointerType === 'touch') {
      navigator.vibrate(10);
    }
  };
  
  private handlePointerMove = (e: PointerEvent) => {
    if (!this.element.hasPointerCapture(e.pointerId)) return;
    
    const deltaX = e.clientX - this.touchStartX;
    const deltaY = e.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    
    // Calculate velocity for momentum
    this.velocityX = deltaX / deltaTime;
    this.velocityY = deltaY / deltaTime;
    
    // Apply transform with GPU acceleration
    this.element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
  };
  
  private handlePointerUp = (e: PointerEvent) => {
    this.element.releasePointerCapture(e.pointerId);
    
    const deltaX = e.clientX - this.touchStartX;
    const deltaY = e.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    
    // Detect gesture type
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.handleTap(e);
    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.handleHorizontalSwipe(deltaX, this.velocityX);
    } else {
      this.handleVerticalSwipe(deltaY, this.velocityY);
    }
    
    // Apply momentum scrolling
    if (Math.abs(this.velocityX) > 0.5 || Math.abs(this.velocityY) > 0.5) {
      this.applyMomentum();
    }
  };
  
  private applyMomentum() {
    const deceleration = 0.95;
    
    const animate = () => {
      this.velocityX *= deceleration;
      this.velocityY *= deceleration;
      
      if (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1) {
        const currentTransform = this.element.style.transform;
        const matrix = new DOMMatrix(currentTransform);
        
        this.element.style.transform = `translate3d(
          ${matrix.m41 + this.velocityX * 16}px,
          ${matrix.m42 + this.velocityY * 16}px,
          0
        )`;
        
        this.rafId = requestAnimationFrame(animate);
      } else {
        // Snap to grid
        this.snapToGrid();
      }
    };
    
    this.rafId = requestAnimationFrame(animate);
  }
  
  private snapToGrid() {
    const cellWidth = this.element.offsetWidth / 7;
    const currentTransform = new DOMMatrix(this.element.style.transform);
    const x = Math.round(currentTransform.m41 / cellWidth) * cellWidth;
    
    this.element.style.transition = 'transform 0.2s ease-out';
    this.element.style.transform = `translate3d(${x}px, 0, 0)`;
  }
}
```

## Phase 7: Accessibility Implementation

### 7.1 ARIA Grid Pattern

```typescript
// components/calendar/AccessibleCalendarGrid.tsx
export function AccessibleCalendarGrid() {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const { row, col } = focusedCell;
    let newRow = row;
    let newCol = col;
    
    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(11, row + 1); // 12 months
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(41, col + 1); // 42 columns
        break;
      case 'Home':
        newCol = 0;
        break;
      case 'End':
        newCol = 41;
        break;
      case 'PageUp':
        newRow = Math.max(0, row - 3);
        break;
      case 'PageDown':
        newRow = Math.min(11, row + 3);
        break;
      case 'Enter':
      case ' ':
        handleCellActivation(row, col);
        break;
    }
    
    if (newRow !== row || newCol !== col) {
      e.preventDefault();
      setFocusedCell({ row: newRow, col: newCol });
      announceCellContent(newRow, newCol);
    }
  };
  
  const announceCellContent = (row: number, col: number) => {
    const cell = getCellData(row, col);
    const announcement = `${cell.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}. ${cell.events.length} events. ${
      cell.hasConflict ? 'Has scheduling conflict.' : ''
    }`;
    
    // Use live region for announcement
    const liveRegion = document.getElementById('calendar-live-region');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  };
  
  return (
    <>
      <div
        ref={gridRef}
        role="grid"
        aria-label="12-month calendar view"
        aria-rowcount={12}
        aria-colcount={42}
        onKeyDown={handleKeyDown}
        className="calendar-grid"
      >
        {months.map((month, rowIndex) => (
          <div
            key={month.id}
            role="row"
            aria-rowindex={rowIndex + 1}
          >
            <div
              role="rowheader"
              aria-label={month.name}
              className="month-header"
            >
              {month.name}
            </div>
            
            {month.days.map((day, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                role="gridcell"
                aria-rowindex={rowIndex + 1}
                aria-colindex={colIndex + 1}
                aria-selected={
                  focusedCell.row === rowIndex && 
                  focusedCell.col === colIndex
                }
                tabIndex={
                  focusedCell.row === rowIndex && 
                  focusedCell.col === colIndex ? 0 : -1
                }
                aria-label={getAriaLabel(day)}
                className={getCellClasses(day, rowIndex, colIndex)}
              >
                <CalendarCell day={day} />
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Live region for screen reader announcements */}
      <div
        id="calendar-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
```

## Phase 8: Plugin Architecture

### 8.1 Web Component Plugin System

```typescript
// lib/plugins/PluginManager.ts
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  permissions: PluginPermission[];
  entryPoint: string;
  customElements: string[];
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private sandboxes: Map<string, PluginSandbox> = new Map();
  
  async loadPlugin(manifest: PluginManifest): Promise<void> {
    // Create sandboxed environment
    const sandbox = this.createSandbox(manifest);
    
    // Load plugin code
    const module = await import(manifest.entryPoint);
    
    // Register custom elements with scoped registry
    for (const elementName of manifest.customElements) {
      const ElementClass = module[elementName];
      
      // Wrap in Shadow DOM for isolation
      class IsolatedElement extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'closed' });
          const instance = new ElementClass();
          shadow.appendChild(instance);
        }
      }
      
      customElements.define(`plugin-${manifest.id}-${elementName}`, IsolatedElement);
    }
    
    // Initialize plugin with restricted API
    const plugin = new module.default({
      api: this.createRestrictedAPI(manifest.permissions),
      storage: this.createPluginStorage(manifest.id),
      events: this.createEventBus(manifest.id)
    });
    
    this.plugins.set(manifest.id, plugin);
    this.sandboxes.set(manifest.id, sandbox);
  }
  
  private createRestrictedAPI(permissions: PluginPermission[]) {
    const api: any = {};
    
    if (permissions.includes('calendar:read')) {
      api.getEvents = this.wrapAPIMethod(this.calendarAPI.getEvents);
    }
    
    if (permissions.includes('calendar:write')) {
      api.createEvent = this.wrapAPIMethod(this.calendarAPI.createEvent);
      api.updateEvent = this.wrapAPIMethod(this.calendarAPI.updateEvent);
    }
    
    if (permissions.includes('ui:notification')) {
      api.showNotification = this.wrapAPIMethod(this.uiAPI.showNotification);
    }
    
    return new Proxy(api, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        throw new Error(`Permission denied: ${String(prop)}`);
      }
    });
  }
  
  private createSandbox(manifest: PluginManifest): PluginSandbox {
    // Create iframe sandbox for plugin execution
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Inject plugin runtime
    const runtime = `
      window.pluginAPI = {
        id: '${manifest.id}',
        postMessage: (data) => {
          parent.postMessage({
            pluginId: '${manifest.id}',
            data
          }, '*');
        }
      };
    `;
    
    iframe.contentWindow!.eval(runtime);
    
    return {
      iframe,
      terminate: () => iframe.remove()
    };
  }
}
```

## Phase 9: Integration Layer

### 9.1 OAuth 2.0 Implementation

```typescript
// lib/auth/OAuth2Client.ts
export class OAuth2Client {
  private readonly providers: Map<string, OAuthProvider> = new Map();
  
  constructor() {
    this.registerProviders();
  }
  
  private registerProviders() {
    // Google Calendar
    this.providers.set('google', {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/calendar'],
      usePKCE: true
    });
    
    // Microsoft Outlook
    this.providers.set('microsoft', {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['calendars.readwrite'],
      usePKCE: true
    });
  }
  
  async authorize(provider: string): Promise<TokenResponse> {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Unknown provider: ${provider}`);
    
    // Generate PKCE challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store verifier for token exchange
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: process.env[`NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID`]!,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: this.generateState()
    });
    
    // Redirect to authorization
    window.location.href = `${config.authUrl}?${params}`;
  }
  
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    // Verify state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    
    // Exchange code for tokens
    const verifier = sessionStorage.getItem('pkce_verifier');
    const provider = sessionStorage.getItem('oauth_provider');
    const config = this.providers.get(provider!);
    
    const response = await fetch(config!.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${window.location.origin}/auth/callback`,
        client_id: process.env[`NEXT_PUBLIC_${provider!.toUpperCase()}_CLIENT_ID`]!,
        code_verifier: verifier!
      })
    });
    
    const tokens = await response.json();
    
    // Store tokens securely
    await this.storeTokens(provider!, tokens);
    
    // Clean up session storage
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');
    
    return tokens;
  }
  
  private async storeTokens(provider: string, tokens: TokenResponse) {
    // Encrypt tokens before storage
    const encrypted = await this.encryptTokens(tokens);
    
    // Store in IndexedDB
    await db.tokens.put({
      provider,
      accessToken: encrypted.accessToken,
      refreshToken: encrypted.refreshToken,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      scopes: tokens.scope.split(' ')
    });
  }
}
```

## Phase 10: Performance Monitoring

### 10.1 Performance Metrics Collection

```typescript
// lib/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observer: PerformanceObserver;
  
  constructor() {
    this.initializeObservers();
    this.setupMetrics();
  }
  
  private setupMetrics() {
    // Core Web Vitals
    this.trackLCP(); // Largest Contentful Paint
    this.trackFID(); // First Input Delay
    this.trackCLS(); // Cumulative Layout Shift
    
    // Custom calendar metrics
    this.trackEventRenderTime();
    this.trackScrollPerformance();
    this.trackMemoryUsage();
  }
  
  private trackEventRenderTime() {
    const measureRender = (count: number) => {
      const startMark = `render-start-${Date.now()}`;
      const endMark = `render-end-${Date.now()}`;
      
      performance.mark(startMark);
      
      // Render events
      requestAnimationFrame(() => {
        performance.mark(endMark);
        performance.measure('event-render', startMark, endMark);
        
        const measure = performance.getEntriesByName('event-render')[0];
        this.recordMetric('eventRender', {
          duration: measure.duration,
          eventCount: count,
          averagePerEvent: measure.duration / count
        });
      });
    };
    
    return measureRender;
  }
  
  private trackScrollPerformance() {
    let lastScrollTime = 0;
    let frameCount = 0;
    let frameDrops = 0;
    
    const checkFrameRate = () => {
      const now = performance.now();
      const delta = now - lastScrollTime;
      
      if (delta > 16.67) { // Less than 60fps
        frameDrops++;
      }
      
      frameCount++;
      lastScrollTime = now;
      
      if (frameCount % 60 === 0) { // Check every second
        const fps = (60 - frameDrops) / (delta / 1000);
        this.recordMetric('scrollFPS', {
          fps,
          frameDrops,
          smooth: fps >= 59
        });
        
        frameDrops = 0;
      }
    };
    
    document.addEventListener('scroll', () => {
      requestAnimationFrame(checkFrameRate);
    });
  }
  
  private trackMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
        
        // Alert if memory usage is high
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.handleHighMemoryUsage();
        }
      }, 5000);
    }
  }
  
  private handleHighMemoryUsage() {
    // Clear caches
    this.clearEventCache();
    
    // Reduce render quality
    this.reduceRenderQuality();
    
    // Notify user
    this.notifyUser('Performance optimization in progress...');
  }
}
```

## Deployment & Migration Strategy

### Migration from LocalStorage to IndexedDB

```typescript
// scripts/migrate.ts
async function migrateToIndexedDB() {
  // 1. Check for existing LocalStorage data
  const hasLocalData = localStorage.getItem('calendar-events') !== null;
  
  if (!hasLocalData) {
    console.log('No migration needed');
    return;
  }
  
  // 2. Parse and validate data
  const localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
  const validEvents = localEvents.filter(validateEvent);
  
  // 3. Open IndexedDB
  const db = await openDB('CalendarDB', 2);
  
  // 4. Batch insert with progress tracking
  const batchSize = 100;
  let processed = 0;
  
  for (let i = 0; i < validEvents.length; i += batchSize) {
    const batch = validEvents.slice(i, i + batchSize);
    
    await db.transaction('events', 'readwrite', async (tx) => {
      for (const event of batch) {
        await tx.store.add({
          ...event,
          syncStatus: 'local',
          version: 1,
          lastModified: Date.now()
        });
      }
    });
    
    processed += batch.length;
    console.log(`Migrated ${processed}/${validEvents.length} events`);
  }
  
  // 5. Verify migration
  const dbCount = await db.count('events');
  if (dbCount === validEvents.length) {
    // 6. Backup LocalStorage data
    localStorage.setItem('calendar-events-backup', localStorage.getItem('calendar-events')!);
    
    // 7. Clear original LocalStorage
    localStorage.removeItem('calendar-events');
    
    console.log('Migration completed successfully');
  } else {
    throw new Error('Migration verification failed');
  }
}
```

## Testing Strategy

### Performance Testing

```typescript
// tests/performance.test.ts
describe('Calendar Performance', () => {
  it('should render 10,000 events in under 500ms', async () => {
    const events = generateMockEvents(10000);
    
    const start = performance.now();
    await renderCalendar(events);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
  
  it('should maintain 60fps while scrolling', async () => {
    const events = generateMockEvents(5000);
    await renderCalendar(events);
    
    const fps = await measureScrollingFPS();
    expect(fps).toBeGreaterThanOrEqual(59);
  });
  
  it('should handle concurrent updates without conflicts', async () => {
    const updates = Array(100).fill(null).map(() => ({
      type: 'UPDATE',
      eventId: randomId(),
      changes: randomChanges()
    }));
    
    const results = await Promise.all(
      updates.map(update => applyUpdate(update))
    );
    
    expect(results.every(r => r.success)).toBe(true);
  });
});
```

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial Load Time | <500ms | Performance.timing |
| Time to Interactive | <1s | Lighthouse |
| Event Render Time | <3ms/event | Custom metrics |
| Scroll FPS | 60fps | requestAnimationFrame |
| Memory Usage | <100MB typical | performance.memory |
| Sync Latency | <100ms | Network timing |
| Conflict Resolution | <50ms | CRDT benchmarks |
| NLP Parse Time | <100ms | Custom timing |
| Mobile Touch Delay | <50ms | Event timestamps |

## Conclusion

This PRD provides a comprehensive technical blueprint for transforming the linear calendar into a state-of-the-art scheduling platform. The phased approach ensures continuous delivery while maintaining system stability. Each phase builds upon the previous, creating a robust foundation for future enhancements.

The architecture prioritizes performance, scalability, and user experience while maintaining compatibility with existing calendar ecosystems. By implementing these specifications, the linear calendar will achieve feature parity with industry leaders while introducing innovative capabilities unique to the linear timeline format.