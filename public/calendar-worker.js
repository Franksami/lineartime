// Calendar Layout Worker - Offloads heavy computations to background thread
// This runs in a Web Worker context, separate from the main thread

// Event interval tree for conflict detection
class WorkerIntervalTree {
  constructor() {
    this.events = new Map()
  }
  
  insert(id, start, end, data) {
    this.events.set(id, {
      start: new Date(start).getTime(),
      end: new Date(end).getTime(),
      data
    })
  }
  
  findOverlapping(start, end) {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const overlapping = []
    
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
function calculateLayout(events) {
  const results = []
  const cellWidth = 40
  const cellHeight = 36
  const padding = 2
  
  // Clear and rebuild interval tree
  intervalTree.clear()
  
  // Group events by day for conflict detection
  const eventsByDay = new Map()
  
  events.forEach(event => {
    const startDate = new Date(event.startDate)
    const dateKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`
    if (!eventsByDay.has(dateKey)) {
      eventsByDay.set(dateKey, [])
    }
    eventsByDay.get(dateKey).push(event)
    
    // Add to interval tree
    intervalTree.insert(event.id, event.startDate, event.endDate, event)
  })
  
  // Calculate positions with conflict resolution
  events.forEach(event => {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    const day = startDate.getDate()
    const dayOfWeek = startDate.getDay()
    const month = startDate.getMonth()
    const weekOfMonth = Math.floor((day - 1) / 7)
    
    // Base position calculation
    const x = dayOfWeek * cellWidth + padding
    const y = weekOfMonth * cellHeight + padding
    
    // Calculate duration width
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
  })
  
  return results
}

// Detect conflicts between events
function detectConflicts(events) {
  const results = []
  
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
      let severity = 'low'
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
function optimizePositions(events, layouts) {
  const optimized = [...layouts]
  
  // Group by overlapping time slots
  const timeSlots = new Map()
  
  optimized.forEach(layout => {
    const slotKey = `${layout.x}-${Math.floor(layout.y / 36)}`
    if (!timeSlots.has(slotKey)) {
      timeSlots.set(slotKey, [])
    }
    timeSlots.get(slotKey).push(layout)
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
self.addEventListener('message', (event) => {
  const { type, data, id } = event.data
  
  try {
    let result = null
    
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
    self.postMessage({
      type: 'SUCCESS',
      id,
      result
    })
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message || 'Unknown error'
    })
  }
})

// Signal that worker is ready
self.postMessage({ type: 'READY' })

console.log('Calendar Worker initialized and ready')