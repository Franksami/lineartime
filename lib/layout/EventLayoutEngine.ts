// Google Calendar's Column-Based Event Layout Algorithm
// Implements the 5-step process for optimal event stacking

import type { Event } from '@/types/calendar'

export interface LayoutedEvent extends Event {
  column: number
  width: number
  left: number
  top: number
  height: number
  zIndex: number
  collisionGroup: string
  expandedWidth?: number
}

export interface CollisionGroup {
  id: string
  events: Event[]
  maxColumns: number
  startTime: number
  endTime: number
}

export class EventLayoutEngine {
  private containerWidth: number
  private cellWidth: number
  private cellHeight: number
  private columnGap: number
  private minEventHeight: number
  
  constructor(config: {
    containerWidth?: number
    cellWidth?: number
    cellHeight?: number
    columnGap?: number
    minEventHeight?: number
  } = {}) {
    this.containerWidth = config.containerWidth || 600
    this.cellWidth = config.cellWidth || 40
    this.cellHeight = config.cellHeight || 36
    this.columnGap = config.columnGap || 2
    this.minEventHeight = config.minEventHeight || 30
  }

  /**
   * Main layout method implementing Google Calendar's algorithm
   * 1. Sort events by start time, then end time
   * 2. Build collision groups
   * 3. Assign columns within groups
   * 4. Calculate widths
   * 5. Apply smart expansion
   */
  layoutEvents(events: Event[]): LayoutedEvent[] {
    if (!events || events.length === 0) return []
    
    // Step 1: Sort events
    const sortedEvents = this.sortEvents(events)
    
    // Step 2: Build collision groups
    const collisionGroups = this.buildCollisionGroups(sortedEvents)
    
    // Step 3-5: Layout each collision group
    const layoutedEvents: LayoutedEvent[] = []
    
    collisionGroups.forEach(group => {
      const groupLayoutedEvents = this.layoutCollisionGroup(group)
      layoutedEvents.push(...groupLayoutedEvents)
    })
    
    return layoutedEvents
  }

  /**
   * Sort events by start time, then by end time (longer events first)
   */
  private sortEvents(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      // Primary sort: start time
      const startDiff = a.startDate.getTime() - b.startDate.getTime()
      if (startDiff !== 0) return startDiff
      
      // Secondary sort: longer events first (end time descending)
      const endDiff = b.endDate.getTime() - a.endDate.getTime()
      if (endDiff !== 0) return endDiff
      
      // Tertiary sort: alphabetical by title for consistency
      return a.title.localeCompare(b.title)
    })
  }

  /**
   * Build collision groups - events that transitively overlap
   */
  private buildCollisionGroups(events: Event[]): CollisionGroup[] {
    const groups: CollisionGroup[] = []
    let currentGroup: Event[] = []
    let groupStartTime = 0
    let groupEndTime = 0
    let groupId = 0
    
    events.forEach(event => {
      const eventStart = event.startDate.getTime()
      const eventEnd = event.endDate.getTime()
      
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

  /**
   * Layout a single collision group
   */
  private layoutCollisionGroup(group: CollisionGroup): LayoutedEvent[] {
    const columns: Event[][] = []
    const columnAssignments = new Map<string, number>()
    
    // Step 3: Assign events to columns (leftmost available)
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
    
    // Step 4: Calculate base width
    const baseWidth = (this.containerWidth - (numColumns - 1) * this.columnGap) / numColumns
    
    // Step 5: Calculate positions and apply smart expansion
    const layoutedEvents: LayoutedEvent[] = []
    
    group.events.forEach((event, eventIndex) => {
      const column = columnAssignments.get(event.id) || 0
      const expandedWidth = this.calculateExpandedWidth(event, columns, column)
      
      // Calculate position based on event date and time
      const startDate = event.startDate
      const endDate = event.endDate
      
      // For calendar grid positioning
      const dayOfMonth = startDate.getDate()
      const dayOfWeek = startDate.getDay()
      const weekOfMonth = Math.floor((dayOfMonth - 1) / 7)
      
      // Calculate pixel positions
      const left = column * (baseWidth + this.columnGap)
      const top = weekOfMonth * this.cellHeight + (startDate.getHours() * 60 + startDate.getMinutes()) * (this.cellHeight / 60)
      
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

  /**
   * Check if an event can be placed in a column without collision
   */
  private canPlaceInColumn(event: Event, column: Event[]): boolean {
    const eventStart = event.startDate.getTime()
    const eventEnd = event.endDate.getTime()
    
    return !column.some(existingEvent => {
      const existingStart = existingEvent.startDate.getTime()
      const existingEnd = existingEvent.endDate.getTime()
      
      // Check for overlap with microsecond tolerance
      return (eventStart < existingEnd - 1) && (eventEnd > existingStart + 1)
    })
  }

  /**
   * Calculate how many columns an event can expand into
   */
  private calculateExpandedWidth(
    event: Event,
    columns: Event[][],
    startColumn: number
  ): number {
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

  /**
   * Update container width (for responsive layouts)
   */
  setContainerWidth(width: number) {
    this.containerWidth = width
  }

  /**
   * Get collision groups for debugging/visualization
   */
  getCollisionGroups(events: Event[]): CollisionGroup[] {
    const sortedEvents = this.sortEvents(events)
    return this.buildCollisionGroups(sortedEvents)
  }
}