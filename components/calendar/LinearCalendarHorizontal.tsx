'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
import { 
  getDaysInMonth, 
  startOfYear, 
  addMonths, 
  isToday, 
  format, 
  startOfDay, 
  endOfDay, 
  differenceInDays,
  isSameDay,
  addDays,
  startOfMonth
} from 'date-fns'
import { Plus, Minus } from 'lucide-react'
import { FloatingToolbar } from './FloatingToolbar'

interface LinearCalendarHorizontalProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  onEventUpdate?: (event: Event) => void
  enableInfiniteCanvas?: boolean
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Day width at different zoom levels
const ZOOM_LEVELS = {
  year: 3,      // 3px per day - full year view
  quarter: 8,   // 8px per day - quarter view  
  month: 24,    // 24px per day - month view
  week: 60,     // 60px per day - week view
  day: 150      // 150px per day - day detail view
}

type ZoomLevel = keyof typeof ZOOM_LEVELS

export function LinearCalendarHorizontal({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  enableInfiniteCanvas = true
}: LinearCalendarHorizontalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month')
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Event creation state
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [creatingEventStart, setCreatingEventStart] = useState<Date | null>(null)
  const [creatingEventEnd, setCreatingEventEnd] = useState<Date | null>(null)
  const [creatingEventMonth, setCreatingEventMonth] = useState<number | null>(null)
  
  // Pan and zoom state
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(1)
  
  const dayWidth = ZOOM_LEVELS[zoomLevel]
  const monthHeight = 60 // Height of each month row
  const headerWidth = 80 // Width of month name column
  
  // Calculate total width needed
  const totalDays = 365 + (year % 4 === 0 ? 1 : 0) // Account for leap year
  const totalWidth = totalDays * dayWidth + headerWidth
  
  // Generate calendar data
  const calendarData = React.useMemo(() => {
    const months = []
    const yearStart = startOfYear(new Date(year, 0, 1))
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = addMonths(yearStart, monthIndex)
      const daysInMonth = getDaysInMonth(monthDate)
      const monthStart = startOfMonth(monthDate)
      
      const days = []
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day)
        days.push({
          date,
          day,
          isToday: isToday(date),
          dayOfYear: differenceInDays(date, yearStart) + 1
        })
      }
      
      // Calculate which days of year this month spans
      const startDayOfYear = differenceInDays(monthStart, yearStart) + 1
      const endDayOfYear = startDayOfYear + daysInMonth - 1
      
      months.push({
        index: monthIndex,
        name: MONTH_NAMES[monthIndex],
        shortName: MONTH_SHORT[monthIndex],
        days,
        daysInMonth,
        startDayOfYear,
        endDayOfYear
      })
    }
    
    return months
  }, [year])
  
  // Process events to calculate positions
  const processedEvents = React.useMemo(() => {
    return events.map(event => {
      const yearStart = startOfYear(new Date(year, 0, 1))
      const startDay = differenceInDays(startOfDay(event.startDate), yearStart) + 1
      const endDay = differenceInDays(endOfDay(event.endDate), yearStart) + 1
      const duration = endDay - startDay + 1
      
      // Determine which month row this event belongs to (based on start date)
      const eventMonth = event.startDate.getMonth()
      
      return {
        ...event,
        startDay,
        endDay,
        duration,
        month: eventMonth,
        left: (startDay - 1) * dayWidth + headerWidth,
        width: duration * dayWidth - 2, // -2 for padding
        top: eventMonth * monthHeight + 25, // Position below month header
        height: 20
      }
    })
  }, [events, dayWidth, year])
  
  // Group events by month and calculate stacking
  const eventsByMonth = React.useMemo(() => {
    const grouped = new Map<number, typeof processedEvents>()
    
    processedEvents.forEach(event => {
      if (!grouped.has(event.month)) {
        grouped.set(event.month, [])
      }
      grouped.get(event.month)!.push(event)
    })
    
    // Calculate stacking for each month
    grouped.forEach((monthEvents, month) => {
      // Sort by start date, then duration
      monthEvents.sort((a, b) => {
        if (a.startDay !== b.startDay) return a.startDay - b.startDay
        return b.duration - a.duration
      })
      
      // Simple stacking algorithm
      const rows: number[] = []
      monthEvents.forEach(event => {
        let row = 0
        while (rows[row] && rows[row] >= event.startDay) {
          row++
        }
        rows[row] = event.endDay
        ;(event as any).stackRow = row
      })
    })
    
    return grouped
  }, [processedEvents])
  
  // Pan and zoom handlers
  const handleZoomIn = () => {
    const levels: ZoomLevel[] = ['year', 'quarter', 'month', 'week', 'day']
    const currentIndex = levels.indexOf(zoomLevel)
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1])
    }
  }
  
  const handleZoomOut = () => {
    const levels: ZoomLevel[] = ['year', 'quarter', 'month', 'week', 'day']
    const currentIndex = levels.indexOf(zoomLevel)
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1])
    }
  }
  
  // Gesture handling for pan
  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = -x
        scrollRef.current.scrollTop = -y
      }
    },
    onWheel: ({ event, delta: [dx, dy] }) => {
      if (event.ctrlKey || event.metaKey) {
        // Zoom with ctrl/cmd + scroll
        event.preventDefault()
        if (dy < 0) handleZoomIn()
        else handleZoomOut()
      } else if (scrollRef.current) {
        // Regular scroll
        scrollRef.current.scrollLeft += dx
        scrollRef.current.scrollTop += dy
      }
    }
  }, {
    drag: { from: () => scrollRef.current ? [-scrollRef.current.scrollLeft, -scrollRef.current.scrollTop] : [0, 0] },
    wheel: { preventDefault: true }
  })
  
  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date()
      if (today.getFullYear() === year) {
        const yearStart = startOfYear(new Date(year, 0, 1))
        const dayOfYear = differenceInDays(today, yearStart)
        const scrollPosition = dayOfYear * dayWidth - scrollRef.current.clientWidth / 2
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition)
      }
    }
  }, [year, dayWidth])
  
  // Toolbar handlers
  const handleEventUpdate = (updatedEvent: Event) => {
    setSelectedEvent(updatedEvent)
    onEventUpdate?.(updatedEvent)
  }
  
  const handleEventDelete = (eventId: string) => {
    setSelectedEvent(null)
    setToolbarPosition(null)
    // You would implement actual delete logic here
    console.log('Delete event:', eventId)
  }
  
  const handleEventDuplicate = (event: Event) => {
    const duplicatedEvent = {
      ...event,
      id: `${event.id}-copy-${Date.now()}`,
      title: `${event.title} (Copy)`,
      startDate: addDays(event.startDate, 7),
      endDate: addDays(event.endDate, 7)
    }
    // You would implement actual duplicate logic here
    console.log('Duplicate event:', duplicatedEvent)
  }
  
  // Event creation handlers
  const handleDayMouseDown = (date: Date, month: number) => {
    setIsCreatingEvent(true)
    setCreatingEventStart(date)
    setCreatingEventEnd(date)
    setCreatingEventMonth(month)
    setSelectedEvent(null)
    setToolbarPosition(null)
  }
  
  const handleDayMouseEnter = (date: Date) => {
    if (isCreatingEvent && creatingEventStart) {
      // Update end date while dragging
      if (date >= creatingEventStart) {
        setCreatingEventEnd(date)
      } else {
        setCreatingEventEnd(creatingEventStart)
        setCreatingEventStart(date)
      }
    }
  }
  
  const handleDayMouseUp = () => {
    if (isCreatingEvent && creatingEventStart && creatingEventEnd) {
      // Create the new event
      const newEvent: Event = {
        id: `new-event-${Date.now()}`,
        title: 'New Event',
        description: '',
        startDate: creatingEventStart,
        endDate: creatingEventEnd,
        category: 'personal',
        isRecurring: false
      }
      
      // You would call onEventCreate here if you had that prop
      console.log('Create new event:', newEvent)
      
      // Select the new event and show toolbar
      setSelectedEvent(newEvent)
      // Calculate toolbar position for the new event
      // This would need proper calculation based on the event position
    }
    
    setIsCreatingEvent(false)
    setCreatingEventStart(null)
    setCreatingEventEnd(null)
    setCreatingEventMonth(null)
  }
  
  return (
    <div className={cn("relative bg-background", className)}>
      {/* Floating Toolbar */}
      {selectedEvent && toolbarPosition && (
        <FloatingToolbar
          event={selectedEvent}
          position={toolbarPosition}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          onDuplicate={handleEventDuplicate}
          onClose={() => {
            setSelectedEvent(null)
            setToolbarPosition(null)
          }}
        />
      )}
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg p-1">
        <button
          onClick={handleZoomOut}
          className="p-1 hover:bg-accent rounded"
          disabled={zoomLevel === 'year'}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium capitalize">{zoomLevel}</span>
        <button
          onClick={handleZoomIn}
          className="p-1 hover:bg-accent rounded"
          disabled={zoomLevel === 'day'}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      {/* Main Calendar Container */}
      <div 
        ref={scrollRef}
        className="overflow-auto h-full relative"
        {...bind()}
        style={{ cursor: enableInfiniteCanvas ? 'grab' : 'default' }}
      >
        <div 
          className="relative"
          style={{ 
            width: totalWidth,
            height: 12 * monthHeight,
            minWidth: '100%'
          }}
        >
          {/* Month Rows */}
          {calendarData.map((month, monthIndex) => (
            <div 
              key={month.index}
              className="absolute left-0 right-0 border-b border-border"
              style={{ 
                top: monthIndex * monthHeight,
                height: monthHeight
              }}
            >
              {/* Month Name (Fixed Left) */}
              <div 
                className="absolute left-0 top-0 bg-background border-r border-border flex items-center justify-center font-medium text-sm"
                style={{ 
                  width: headerWidth,
                  height: monthHeight,
                  zIndex: 10
                }}
              >
                {month.shortName}
              </div>
              
              {/* Days Grid */}
              <div 
                className="absolute"
                style={{ 
                  left: headerWidth,
                  right: 0,
                  top: 0,
                  height: monthHeight
                }}
              >
                {month.days.map(({ date, day, isToday: isCurrentDay, dayOfYear }) => {
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  const isHovered = hoveredDate && isSameDay(date, hoveredDate)
                  
                  // Check if this day is part of the creating event range
                  const isInCreatingRange = isCreatingEvent && creatingEventStart && creatingEventEnd && 
                    date >= creatingEventStart && date <= creatingEventEnd && month.index === creatingEventMonth
                  
                  return (
                    <div
                      key={day}
                      className={cn(
                        "absolute top-0 border-r border-border/30 hover:bg-accent/10 transition-colors cursor-pointer",
                        isCurrentDay && "bg-blue-500/10 border-blue-500",
                        isSelected && "bg-blue-500/20",
                        isHovered && "bg-accent/20",
                        isInCreatingRange && "bg-green-500/20"
                      )}
                      style={{
                        left: (dayOfYear - month.startDayOfYear) * dayWidth,
                        width: dayWidth,
                        height: monthHeight
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleDayMouseDown(date, month.index)
                      }}
                      onMouseEnter={() => {
                        setHoveredDate(date)
                        handleDayMouseEnter(date)
                      }}
                      onMouseUp={handleDayMouseUp}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => {
                        if (!isCreatingEvent) {
                          setSelectedDate(date)
                          onDateSelect?.(date)
                        }
                      }}
                      title={format(date, 'EEEE, MMMM d, yyyy')}
                    >
                      {/* Day Number */}
                      {dayWidth >= 20 && (
                        <div className="absolute top-1 left-1 text-xs text-muted-foreground">
                          {day}
                        </div>
                      )}
                      
                      {/* Tiny indicator for narrow views */}
                      {dayWidth < 20 && isCurrentDay && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          
          {/* Creating Event Preview */}
          {isCreatingEvent && creatingEventStart && creatingEventEnd && creatingEventMonth !== null && (
            <div className="absolute pointer-events-none" style={{ marginLeft: headerWidth }}>
              {(() => {
                const yearStart = startOfYear(new Date(year, 0, 1))
                const startDay = differenceInDays(startOfDay(creatingEventStart), yearStart) + 1
                const endDay = differenceInDays(endOfDay(creatingEventEnd), yearStart) + 1
                const duration = endDay - startDay + 1
                
                return (
                  <div
                    className="absolute bg-green-500/50 rounded-sm border-2 border-green-500 border-dashed"
                    style={{
                      left: (startDay - 1) * dayWidth,
                      top: creatingEventMonth * monthHeight + 25,
                      width: duration * dayWidth - 2,
                      height: 20
                    }}
                  >
                    <span className="text-xs text-white px-1 truncate">
                      New Event ({duration} day{duration > 1 ? 's' : ''})
                    </span>
                  </div>
                )
              })()}
            </div>
          )}
          
          {/* Event Bars */}
          <div className="absolute inset-0 pointer-events-none" style={{ marginLeft: headerWidth }}>
            {processedEvents.map((event, index) => {
              const stackRow = (event as any).stackRow || 0
              const categoryColors = {
                personal: 'bg-green-500',
                work: 'bg-blue-500',
                effort: 'bg-orange-500',
                note: 'bg-purple-500'
              }
              
              const isSelected = selectedEvent?.id === event.id
              
              return (
                <div
                  key={event.id || index}
                  className={cn(
                    "absolute pointer-events-auto cursor-pointer rounded-sm px-1 text-white text-xs font-medium truncate",
                    "hover:opacity-90 transition-all",
                    categoryColors[event.category as keyof typeof categoryColors] || 'bg-gray-500',
                    isSelected && "ring-2 ring-blue-400 ring-offset-2 ring-offset-background z-10"
                  )}
                  style={{
                    left: event.left - headerWidth,
                    top: event.top + (stackRow * 22),
                    width: event.width,
                    height: event.height
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEvent(event)
                    
                    // Calculate toolbar position
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const scrollRect = scrollRef.current?.getBoundingClientRect()
                    if (scrollRect) {
                      setToolbarPosition({
                        x: rect.left + rect.width / 2 - scrollRect.left,
                        y: rect.top - scrollRect.top
                      })
                    }
                    
                    onEventClick?.(event)
                  }}
                  title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
                >
                  {dayWidth >= 20 ? event.title : ''}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}