// Calendar Layout Worker V2 - Google Calendar's Column-Based Algorithm
// This runs in a Web Worker context with the proper stacking algorithm

// Event Layout Engine - Column-based stacking algorithm
class EventLayoutEngine {
  constructor(config = {}) {
    this.containerWidth = config.containerWidth || 600
    this.cellWidth = config.cellWidth || 40
    this.cellHeight = config.cellHeight || 36
    this.columnGap = config.columnGap || 2
    this.minEventHeight = config.minEventHeight || 30
  }

  layoutEvents(events) {
    if (!events || events.length === 0) return []
    
    // Step 1: Sort events
    const sortedEvents = this.sortEvents(events)
    
    // Step 2: Build collision groups
    const collisionGroups = this.buildCollisionGroups(sortedEvents)
    
    // Step 3-5: Layout each collision group
    const layoutedEvents = []
    
    collisionGroups.forEach(group => {
      const groupLayoutedEvents = this.layoutCollisionGroup(group)
      layoutedEvents.push(...groupLayoutedEvents)
    })
    
    return layoutedEvents
  }

  sortEvents(events) {
    return [...events].sort((a, b) => {
      // Sort by start time
      const startA = new Date(a.startDate).getTime()
      const startB = new Date(b.startDate).getTime()
      const startDiff = startA - startB
      if (startDiff !== 0) return startDiff
      
      // Then by end time (longer events first)
      const endA = new Date(a.endDate).getTime()
      const endB = new Date(b.endDate).getTime()
      const endDiff = endB - endA
      if (endDiff !== 0) return endDiff
      
      // Finally alphabetical
      return a.title.localeCompare(b.title)
    })
  }

  buildCollisionGroups(events) {
    const groups = []
    let currentGroup = []
    let groupStartTime = 0
    let groupEndTime = 0
    let groupId = 0
    
    events.forEach(event => {
      const eventStart = new Date(event.startDate).getTime()
      const eventEnd = new Date(event.endDate).getTime()
      
      // Check if this event overlaps with the current group
      if (currentGroup.length === 0 || eventStart >= groupEndTime) {
        // No overlap - save current group and start new one
        if (currentGroup.length > 0) {
          groups.push({
            id: `group-${groupId++}`,
            events: currentGroup,
            maxColumns: 0,
            startTime: groupStartTime,
            endTime: groupEndTime
          })
        }
        
        currentGroup = [event]
        groupStartTime = eventStart
        groupEndTime = eventEnd
      } else {
        // Overlaps with current group - add to it
        currentGroup.push(event)
        groupEndTime = Math.max(groupEndTime, eventEnd)
      }
    })
    
    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push({
        id: `group-${groupId}`,
        events: currentGroup,
        maxColumns: 0,
        startTime: groupStartTime,
        endTime: groupEndTime
      })
    }
    
    return groups
  }

  layoutCollisionGroup(group) {
    const columns = []
    const columnAssignments = new Map()
    
    // Assign events to columns (leftmost available)
    group.events.forEach(event => {
      let assigned = false
      
      // Try to place in existing columns
      for (let col = 0; col < columns.length; col++) {
        if (this.canPlaceInColumn(event, columns[col])) {
          columns[col].push(event)
          columnAssignments.set(event.id, col)
          assigned = true
          break
        }
      }
      
      // Create new column if needed
      if (!assigned) {
        columns.push([event])
        columnAssignments.set(event.id, columns.length - 1)
      }
    })
    
    const numColumns = columns.length
    group.maxColumns = numColumns
    
    // Calculate base width
    const baseWidth = (this.containerWidth - (numColumns - 1) * this.columnGap) / numColumns
    
    // Calculate positions and apply smart expansion
    const layoutedEvents = []
    
    group.events.forEach((event, eventIndex) => {
      const column = columnAssignments.get(event.id) || 0
      const expandedWidth = this.calculateExpandedWidth(event, columns, column)
      
      // Calculate position based on event date and time
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      
      // For calendar grid positioning
      const dayOfMonth = startDate.getDate()
      const dayOfWeek = startDate.getDay()
      const weekOfMonth = Math.floor((dayOfMonth - 1) / 7)
      
      // Calculate pixel positions
      const left = column * (baseWidth + this.columnGap)
      const top = weekOfMonth * this.cellHeight + 
                  (startDate.getHours() * 60 + startDate.getMinutes()) * (this.cellHeight / 60)
      
      // Calculate height based on duration
      const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
      const height = Math.max(this.minEventHeight, durationMinutes * (this.cellHeight / 60))
      
      // Calculate actual width (with expansion if possible)
      const width = expandedWidth > 1 
        ? baseWidth * expandedWidth + this.columnGap * (expandedWidth - 1)
        : baseWidth
      
      // Calculate z-index (events in rightmost columns on top)
      const zIndex = column + 1
      
      layoutedEvents.push({
        ...event,
        column,
        width,
        left,
        top,
        height,
        zIndex,
        collisionGroup: group.id,
        expandedWidth
      })
    })
    
    return layoutedEvents
  }

  canPlaceInColumn(event, column) {
    const eventStart = new Date(event.startDate).getTime()
    const eventEnd = new Date(event.endDate).getTime()
    
    return !column.some(existingEvent => {
      const existingStart = new Date(existingEvent.startDate).getTime()
      const existingEnd = new Date(existingEvent.endDate).getTime()
      
      // Check for overlap with microsecond tolerance
      return (eventStart < existingEnd - 1) && (eventEnd > existingStart + 1)
    })
  }

  calculateExpandedWidth(event, columns, startColumn) {
    let availableColumns = 1
    
    // Check how many columns to the right this event can expand into
    for (let col = startColumn + 1; col < columns.length; col++) {
      if (this.canPlaceInColumn(event, columns[col])) {
        availableColumns++
      } else {
        break // Stop at first collision
      }
    }
    
    return availableColumns
  }

  setContainerWidth(width) {
    this.containerWidth = width
  }
}

// Keep the existing interval tree for backward compatibility
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
const layoutEngine = new EventLayoutEngine()

// Keep backward compatibility functions
function calculateLayout(events) {
  const results = []
  const cellWidth = 40
  const cellHeight = 36
  const padding = 2
  
  intervalTree.clear()
  const eventsByDay = new Map()
  
  events.forEach(event => {
    const startDate = new Date(event.startDate)
    const dateKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`
    if (!eventsByDay.has(dateKey)) {
      eventsByDay.set(dateKey, [])
    }
    eventsByDay.get(dateKey).push(event)
    intervalTree.insert(event.id, event.startDate, event.endDate, event)
  })
  
  events.forEach(event => {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    const day = startDate.getDate()
    const dayOfWeek = startDate.getDay()
    const month = startDate.getMonth()
    const weekOfMonth = Math.floor((day - 1) / 7)
    
    const x = dayOfWeek * cellWidth + padding
    const y = weekOfMonth * cellHeight + padding
    
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    const width = Math.min(
      duration * cellWidth - padding * 2,
      7 * cellWidth - x
    )
    const height = cellHeight / 4
    
    const conflicts = intervalTree.findOverlapping(event.startDate, event.endDate)
      .filter(id => id !== event.id)
    
    const layer = conflicts.length > 0 ? (conflicts.length % 3) + 1 : 0
    
    results.push({
      eventId: event.id,
      x,
      y: y + (layer * (height + 1)),
      width,
      height,
      layer,
      conflicts
    })
  })
  
  return results
}

function detectConflicts(events) {
  const results = []
  
  intervalTree.clear()
  events.forEach(event => {
    intervalTree.insert(event.id, event.startDate, event.endDate, event)
  })
  
  events.forEach(event => {
    const conflicts = intervalTree.findOverlapping(event.startDate, event.endDate)
      .filter(id => id !== event.id)
    
    if (conflicts.length > 0) {
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

function optimizePositions(events, layouts) {
  const optimized = [...layouts]
  const timeSlots = new Map()
  
  optimized.forEach(layout => {
    const slotKey = `${layout.x}-${Math.floor(layout.y / 36)}`
    if (!timeSlots.has(slotKey)) {
      timeSlots.set(slotKey, [])
    }
    timeSlots.get(slotKey).push(layout)
  })
  
  timeSlots.forEach(slotLayouts => {
    if (slotLayouts.length > 1) {
      const availableHeight = 36 - 4
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
        
      case 'LAYOUT_EVENTS_V2':
        // Use the new column-based layout engine
        if (data.containerWidth) {
          layoutEngine.setContainerWidth(data.containerWidth)
        }
        result = layoutEngine.layoutEvents(data.events)
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

console.log('Calendar Worker V2 initialized with column-based layout')