// Calendar Layout Worker - Offloads heavy computations to background thread
// Handles event positioning, conflict detection, and layout calculations

import type { Event } from '@/types/calendar'

interface WorkerMessage {
  type: 'CALCULATE_LAYOUT' | 'DETECT_CONFLICTS' | 'OPTIMIZE_POSITIONS'
  data: any
  id: string
}

interface LayoutResult {
  eventId: string
  x: number
  y: number
  width: number
  height: number
  layer: number
  conflicts: string[]
}

interface ConflictResult {
  eventId: string
  conflictingEvents: string[]
  severity: 'low' | 'medium' | 'high'
}

// Initialize worker context
const ctx: Worker = self as any

// Event interval tree for conflict detection
class WorkerIntervalTree {
  private events: Map<string, { start: number; end: number; data: any }> = new Map()
  
  insert(id: string, start: Date, end: Date, data: any) {
    this.events.set(id, {
      start: start.getTime(),
      end: end.getTime(),
      data
    })
  }
  
  findOverlapping(start: Date, end: Date): string[] {
    const startTime = start.getTime()
    const endTime = end.getTime()
    const overlapping: string[] = []
    
    for (const [id, event] of this.events) {
      if (event.start < endTime && event.end > startTime) {
        overlapping.push(id)
      }
    }
    
    return overlapping
  }
  
  clear() {
    this.events.clear()
  }
}

const intervalTree = new WorkerIntervalTree()

// Calculate optimal layout positions for events
function calculateLayout(events: Event[]): LayoutResult[] {
  const results: LayoutResult[] = []
  const cellWidth = 40
  const cellHeight = 36
  const padding = 2
  
  // Group events by day for conflict detection
  const eventsByDay = new Map<string, Event[]>()
  
  events.forEach(event => {
    const dateKey = `${event.startDate.getFullYear()}-${event.startDate.getMonth()}-${event.startDate.getDate()}`
    if (!eventsByDay.has(dateKey)) {
      eventsByDay.set(dateKey, [])
    }
    eventsByDay.get(dateKey)!.push(event)
  })
  
  // Calculate positions with conflict resolution
  events.forEach(event => {
    const day = event.startDate.getDate()
    const dayOfWeek = event.startDate.getDay()
    const month = event.startDate.getMonth()
    const weekOfMonth = Math.floor((day - 1) / 7)
    
    // Base position calculation
    const x = dayOfWeek * cellWidth + padding
    const y = weekOfMonth * cellHeight + padding
    
    // Calculate duration width
    const duration = Math.ceil(
      (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    const width = Math.min(
      duration * cellWidth - padding * 2,
      7 * cellWidth - x
    )
    const height = cellHeight / 4
    
    // Find conflicts
    const conflicts = intervalTree.findOverlapping(event.startDate, event.endDate)
      .filter(id => id !== event.id)
    
    // Assign layer based on conflicts
    const layer = conflicts.length > 0 ? (conflicts.length % 3) + 1 : 0
    
    results.push({
      eventId: event.id,
      x,
      y: y + (layer * (height + 1)), // Stack conflicting events
      width,
      height,
      layer,
      conflicts
    })
    
    // Add to interval tree for future conflict detection
    intervalTree.insert(event.id, event.startDate, event.endDate, event)
  })
  
  return results
}

// Detect conflicts between events
function detectConflicts(events: Event[]): ConflictResult[] {
  const results: ConflictResult[] = []
  
  // Clear and rebuild interval tree
  intervalTree.clear()
  events.forEach(event => {
    intervalTree.insert(event.id, event.startDate, event.endDate, event)
  })
  
  // Find conflicts for each event
  events.forEach(event => {
    const conflicts = intervalTree.findOverlapping(event.startDate, event.endDate)
      .filter(id => id !== event.id)
    
    if (conflicts.length > 0) {
      // Determine severity based on number of conflicts
      let severity: ConflictResult['severity'] = 'low'
      if (conflicts.length > 5) severity = 'high'
      else if (conflicts.length > 2) severity = 'medium'
      
      results.push({
        eventId: event.id,
        conflictingEvents: conflicts,
        severity
      })
    }
  })
  
  return results
}

// Optimize event positions to minimize overlaps
function optimizePositions(events: Event[], layouts: LayoutResult[]): LayoutResult[] {
  const optimized = [...layouts]
  
  // Group by overlapping time slots
  const timeSlots = new Map<string, LayoutResult[]>()
  
  optimized.forEach(layout => {
    const slotKey = `${layout.x}-${Math.floor(layout.y / 36)}`
    if (!timeSlots.has(slotKey)) {
      timeSlots.set(slotKey, [])
    }
    timeSlots.get(slotKey)!.push(layout)
  })
  
  // Optimize each time slot
  timeSlots.forEach(slotLayouts => {
    if (slotLayouts.length > 1) {
      // Distribute events evenly in available vertical space
      const availableHeight = 36 - 4 // Cell height minus padding
      const eventHeight = Math.min(availableHeight / slotLayouts.length, 8)
      
      slotLayouts.forEach((layout, index) => {
        layout.height = eventHeight
        layout.y = layout.y - (layout.y % 36) + 2 + (index * (eventHeight + 1))
      })
    }
  })
  
  return optimized
}

// Handle messages from main thread
ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data
  
  try {
    let result: any
    
    switch (type) {
      case 'CALCULATE_LAYOUT':
        result = calculateLayout(data.events)
        break
        
      case 'DETECT_CONFLICTS':
        result = detectConflicts(data.events)
        break
        
      case 'OPTIMIZE_POSITIONS':
        result = optimizePositions(data.events, data.layouts)
        break
        
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    // Send result back to main thread
    ctx.postMessage({
      type: 'SUCCESS',
      id,
      result
    })
  } catch (error) {
    // Send error back to main thread
    ctx.postMessage({
      type: 'ERROR',
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Signal that worker is ready
ctx.postMessage({ type: 'READY' })

export {}