'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
import {
  format,
  startOfYear,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays
} from 'date-fns'
import { GripVertical } from 'lucide-react'

interface ProcessedEvent extends Event {
  startDay: number
  endDay: number
  duration: number
  month: number
  left: number
  width: number
  top: number
  height: number
  stackRow?: number
}

interface EventLayerProps {
  year: number
  events: Event[]
  dayWidth: number
  monthHeight: number
  headerWidth: number
  headerHeight: number
  isFullYearZoom: boolean
  isMobile: boolean
  eventHeight: number
  eventMargin: number
  selectedEvent: Event | null
  draggedEvent: Event | null
  isDraggingEvent: boolean
  onEventClick: (event: Event, position: { x: number; y: number }) => void
  onEventDoubleClick: (event: Event) => void
  onEventDragStart: (event: Event) => void
  onEventDragEnd: () => void
  onResizeStart: (event: Event, direction: 'start' | 'end') => void
  scrollRef: React.RefObject<HTMLDivElement>
}

const CATEGORY_COLORS = {
  personal: 'bg-primary hover:bg-primary/80 text-primary-foreground',
  work: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  effort: 'bg-accent hover:bg-accent/80 text-accent-foreground',
  note: 'bg-muted hover:bg-muted/80 text-muted-foreground'
} as const

export const EventLayer = React.memo(function EventLayer({
  year,
  events,
  dayWidth,
  monthHeight,
  headerWidth,
  headerHeight,
  isFullYearZoom,
  isMobile,
  eventHeight,
  eventMargin,
  selectedEvent,
  draggedEvent,
  isDraggingEvent,
  onEventClick,
  onEventDoubleClick,
  onEventDragStart,
  onEventDragEnd,
  onResizeStart,
  scrollRef
}: EventLayerProps) {
  
  // Process events to calculate positions
  const processedEvents = React.useMemo((): ProcessedEvent[] => {
    return events.map(event => {
      const yearStart = startOfYear(new Date(year, 0, 1))
      const jan1DayOfWeek = yearStart.getDay()
      const startDay = differenceInDays(startOfDay(event.startDate), yearStart) + 1
      const endDay = differenceInDays(endOfDay(event.endDate), yearStart) + 1
      const duration = endDay - startDay + 1
      
      // Determine which month row this event belongs to (based on start date)
      const eventMonth = event.startDate.getMonth()
      
      // Calculate position based on zoom level
      let left, width, top
      
      if (isFullYearZoom) {
        // For fullYear grid: calculate position within the month's grid
        const monthsPerRow = 1 // Assuming one month per row in full year view
        const daysPerMonthGridWidth = 42 // 7 days * 6 weeks
        const monthRow = Math.floor(eventMonth / monthsPerRow)
        const monthCol = eventMonth % monthsPerRow
        
        // Get the first day of week for the specific month
        const monthStart = new Date(year, eventMonth, 1)
        const monthFirstDayOfWeek = monthStart.getDay()
        
        // Calculate start and end columns within the month's grid
        const monthColOffset = monthCol * daysPerMonthGridWidth
        const startDayOfMonth = event.startDate.getDate()
        const endDayOfMonth = event.endDate.getMonth() === eventMonth ? event.endDate.getDate() : new Date(year, eventMonth + 1, 0).getDate()
        
        const startCol = monthFirstDayOfWeek + startDayOfMonth - 1
        const endCol = monthFirstDayOfWeek + endDayOfMonth - 1
        
        left = (monthCol * daysPerMonthGridWidth + startCol) * dayWidth + headerWidth
        width = (endCol - startCol + 1) * dayWidth - 2
        top = monthRow * monthHeight + headerHeight + 4
      } else {
        // Normal horizontal layout
        left = (startDay - 1) * dayWidth + headerWidth
        width = duration * dayWidth - 2
        top = eventMonth * monthHeight + 25
      }
      
      return {
        ...event,
        startDay,
        endDay,
        duration,
        month: eventMonth,
        left,
        width,
        top,
        height: eventHeight
      }
    })
  }, [events, dayWidth, year, isFullYearZoom, monthHeight, headerWidth, headerHeight, eventHeight])
  
  // Event stacking algorithm to handle overlaps
  const stackedEvents = React.useMemo(() => {
    const stacked = [...processedEvents]
    const eventsByMonth: { [month: number]: ProcessedEvent[] } = {}
    
    // Group events by month for efficient overlap detection
    stacked.forEach(event => {
      if (!eventsByMonth[event.month]) {
        eventsByMonth[event.month] = []
      }
      eventsByMonth[event.month].push(event)
    })
    
    // Calculate stack positions for each month
    Object.keys(eventsByMonth).forEach(monthKey => {
      const monthEvents = eventsByMonth[parseInt(monthKey)]
      monthEvents.sort((a, b) => a.startDay - b.startDay)
      
      monthEvents.forEach((event, index) => {
        let stackRow = 0
        
        // Find the lowest available stack row
        for (let i = 0; i < index; i++) {
          const otherEvent = monthEvents[i]
          // Check for overlap
          if (event.startDay <= otherEvent.endDay && event.endDay >= otherEvent.startDay) {
            stackRow = Math.max(stackRow, (otherEvent.stackRow || 0) + 1)
          }
        }
        
        event.stackRow = stackRow
      })
    })
    
    return stacked
  }, [processedEvents])
  
  const handleEventClick = React.useCallback((event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Calculate toolbar position relative to the scroll container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const scrollRect = scrollRef.current?.getBoundingClientRect()
    if (scrollRect) {
      const position = {
        x: rect.left + rect.width / 2 - scrollRect.left,
        y: rect.top - scrollRect.top
      }
      onEventClick(event, position)
    }
  }, [onEventClick, scrollRef])
  
  const handleEventDoubleClick = React.useCallback((event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventDoubleClick(event)
  }, [onEventDoubleClick])
  
  const handleDragStart = React.useCallback((event: Event, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    onEventDragStart(event)
  }, [onEventDragStart])
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none" 
      style={{ marginLeft: isFullYearZoom ? 0 : headerWidth }}
    >
      {stackedEvents.map((event, index) => {
        const stackRow = event.stackRow || 0
        const isSelected = selectedEvent?.id === event.id
        const isDragging = draggedEvent?.id === event.id
        
        return (
          <div
            key={event.id || index}
            className={cn(
              "absolute pointer-events-auto rounded-sm flex items-center transition-all group",
              CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || 'bg-accent hover:bg-accent/80 text-accent-foreground',
              isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background z-20 shadow-lg",
              isDragging && "opacity-50 cursor-grabbing",
              !isDragging && "cursor-grab hover:shadow-md hover:z-10"
            )}
            role="button"
            tabIndex={0}
            aria-label={`Event: ${event.title}. From ${format(event.startDate, 'MMM d')} to ${format(event.endDate, 'MMM d')}. Category: ${event.category}. Press Enter to select.`}
            aria-selected={isSelected}
            style={{
              left: isFullYearZoom ? event.left : (event.left - headerWidth),
              top: event.top + (stackRow * (eventHeight + eventMargin)) + (isFullYearZoom ? 0 : 4),
              width: Math.max(event.width - 2, isFullYearZoom ? 10 : 30), // Smaller minimum for grid view
              height: eventHeight
            }}
            draggable
            onDragStart={(e) => handleDragStart(event, e)}
            onDragEnd={onEventDragEnd}
            onClick={(e) => handleEventClick(event, e)}
            onDoubleClick={(e) => handleEventDoubleClick(event, e)}
            title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
          >
            {/* Resize handle - left */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/20"
              onMouseDown={(e) => {
                e.stopPropagation()
                onResizeStart(event, 'start')
              }}
            />
            
            {/* Event content with drag handle */}
            <div className="flex items-center gap-1 px-2 flex-1 min-w-0">
              {event.width > 60 && (
                <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-70 flex-shrink-0" />
              )}
              <span className="text-xs font-medium truncate">
                {event.title}
              </span>
              {event.width > 120 && (
                <span className="text-xs opacity-75 truncate">
                  {format(event.startDate, 'MMM d')}
                </span>
              )}
            </div>
            
            {/* Resize handle - right */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/20"
              onMouseDown={(e) => {
                e.stopPropagation()
                onResizeStart(event, 'end')
              }}
            />
          </div>
        )
      })}
    </div>
  )
})

EventLayer.displayName = 'EventLayer'