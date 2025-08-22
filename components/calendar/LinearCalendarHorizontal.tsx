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
import { Plus, Minus, GripVertical, Menu, X } from 'lucide-react'
import { FloatingToolbar } from './FloatingToolbar'
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, closestCenter, TouchSensor } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { useMediaQuery } from '@/hooks/use-media-query'

interface LinearCalendarHorizontalProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  onEventUpdate?: (event: Event) => void
  onEventCreate?: (event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
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

// Mobile-specific zoom levels
const MOBILE_ZOOM_LEVELS = {
  year: 2,      // 2px per day - more compact for mobile
  quarter: 6,   // 6px per day - quarter view  
  month: 18,    // 18px per day - month view
  week: 45,     // 45px per day - week view
  day: 100      // 100px per day - day detail view
}

type ZoomLevel = keyof typeof ZOOM_LEVELS

// Touch gesture thresholds
const TOUCH_THRESHOLDS = {
  longPressDelay: 500,  // ms to trigger long press
  swipeVelocity: 0.5,   // velocity threshold for swipe
  pinchScale: 0.01,     // scale change per pixel of pinch
  doubleTapDelay: 300   // ms between taps for double tap
}

export function LinearCalendarHorizontal({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  enableInfiniteCanvas = true
}: LinearCalendarHorizontalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month')
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDraggingEvent, setIsDraggingEvent] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [isResizingEvent, setIsResizingEvent] = useState(false)
  const [resizingEvent, setResizingEvent] = useState<Event | null>(null)
  const [resizeDirection, setResizeDirection] = useState<'start' | 'end' | null>(null)
  
  // Accessibility state
  const [announceMessage, setAnnounceMessage] = useState<string>('')
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)
  const [keyboardMode, setKeyboardMode] = useState(false)
  const liveRegionRef = useRef<HTMLDivElement>(null)
  
  // Mobile-specific state
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null)
  const [lastTapTime, setLastTapTime] = useState<number | null>(null)
  const [isPinching, setIsPinching] = useState(false)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  
  // Configure DND sensors for desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )
  
  // Event creation state
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [creatingEventStart, setCreatingEventStart] = useState<Date | null>(null)
  const [creatingEventEnd, setCreatingEventEnd] = useState<Date | null>(null)
  const [creatingEventMonth, setCreatingEventMonth] = useState<number | null>(null)
  
  // Pan and zoom state
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(1)
  
  // Responsive dimensions
  const dayWidth = isMobile ? MOBILE_ZOOM_LEVELS[zoomLevel] : ZOOM_LEVELS[zoomLevel]
  const monthHeight = isMobile ? 60 : 80 // Smaller height on mobile
  const headerWidth = isMobile ? 50 : 80 // Narrower month column on mobile
  const eventHeight = isMobile ? 18 : 22 // Smaller events on mobile
  const eventMargin = isMobile ? 1 : 2 // Tighter margins on mobile
  
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
  
  // Handle resize mouse move
  useEffect(() => {
    if (!isResizingEvent || !resizingEvent) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRef.current) return
      
      const rect = scrollRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft - headerWidth
      const dayIndex = Math.floor(x / dayWidth)
      const yearStart = startOfYear(new Date(year, 0, 1))
      const newDate = addDays(yearStart, dayIndex)
      
      const updatedEvent = { ...resizingEvent }
      
      if (resizeDirection === 'start') {
        if (newDate < resizingEvent.endDate) {
          updatedEvent.startDate = newDate
        }
      } else if (resizeDirection === 'end') {
        if (newDate > resizingEvent.startDate) {
          updatedEvent.endDate = newDate
        }
      }
      
      onEventUpdate?.(updatedEvent)
      setResizingEvent(updatedEvent)
    }
    
    const handleMouseUp = () => {
      setIsResizingEvent(false)
      setResizingEvent(null)
      setResizeDirection(null)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingEvent, resizingEvent, resizeDirection, dayWidth, year, onEventUpdate, headerWidth])
  
  // Toolbar handlers
  const handleEventUpdate = (updatedEvent: Event) => {
    setSelectedEvent(updatedEvent)
    onEventUpdate?.(updatedEvent)
  }
  
  const handleEventDelete = (eventId: string) => {
    setSelectedEvent(null)
    setToolbarPosition(null)
    // Call onEventDelete if provided
    if (onEventDelete) {
      onEventDelete(eventId)
    }
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
  
  // Event creation handlers with mobile support
  const handleDayMouseDown = (date: Date, month: number) => {
    // On mobile, require long press for event creation
    if (!isMobile) {
      setIsCreatingEvent(true)
      setCreatingEventStart(date)
      setCreatingEventEnd(date)
      setCreatingEventMonth(month)
      setSelectedEvent(null)
      setToolbarPosition(null)
    }
  }
  
  const handleDayTouchStart = (date: Date, month: number) => {
    if (isMobile) {
      setTouchStartTime(Date.now())
      
      // Set up long press timer for mobile
      const timer = setTimeout(() => {
        // Trigger haptic feedback if available
        if (window.navigator && 'vibrate' in window.navigator) {
          window.navigator.vibrate(50)
        }
        
        // Start event creation after long press
        setIsCreatingEvent(true)
        setCreatingEventStart(date)
        setCreatingEventEnd(date)
        setCreatingEventMonth(month)
        setSelectedEvent(null)
        setToolbarPosition(null)
      }, TOUCH_THRESHOLDS.longPressDelay)
      
      // Store timer to clear on touch end
      ;(window as any).__longPressTimer = timer
    }
  }
  
  const handleDayTouchEnd = (date: Date) => {
    if (isMobile) {
      // Clear long press timer
      if ((window as any).__longPressTimer) {
        clearTimeout((window as any).__longPressTimer)
        delete (window as any).__longPressTimer
      }
      
      // Handle tap (not long press)
      if (touchStartTime && Date.now() - touchStartTime < TOUCH_THRESHOLDS.longPressDelay) {
        // Check for double tap
        const now = Date.now()
        if (lastTapTime && now - lastTapTime < TOUCH_THRESHOLDS.doubleTapDelay) {
          // Double tap - zoom in on this date
          handleZoomIn()
          
          // Center on the tapped date
          if (scrollRef.current) {
            const yearStart = startOfYear(new Date(year, 0, 1))
            const dayOfYear = differenceInDays(date, yearStart)
            const scrollPosition = dayOfYear * dayWidth - scrollRef.current.clientWidth / 2
            scrollRef.current.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: 'smooth'
            })
          }
          
          setLastTapTime(null)
        } else {
          // Single tap - select date
          setSelectedDate(date)
          onDateSelect?.(date)
          setLastTapTime(now)
        }
      }
      
      setTouchStartTime(null)
    }
  }
  
  const handleDayMouseEnter = (date: Date) => {
    if (isCreatingEvent && creatingEventStart && !isMobile) {
      // Update end date while dragging (desktop only)
      if (date >= creatingEventStart) {
        setCreatingEventEnd(date)
      } else {
        setCreatingEventEnd(creatingEventStart)
        setCreatingEventStart(date)
      }
    }
  }
  
  const handleDayTouchMove = (date: Date) => {
    if (isCreatingEvent && creatingEventStart && isMobile) {
      // Update end date while dragging on mobile
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
      const newEvent: Partial<Event> = {
        id: `new-event-${Date.now()}`,
        title: 'New Event',
        description: '',
        startDate: creatingEventStart,
        endDate: creatingEventEnd,
        category: 'personal',
        isRecurring: false
      }
      
      // Call onEventCreate if provided
      if (onEventCreate) {
        onEventCreate(newEvent)
      }
      
      // Select the new event and show toolbar
      setSelectedEvent(newEvent as Event)
      // Calculate toolbar position for the new event
      // This would need proper calculation based on the event position
    }
    
    setIsCreatingEvent(false)
    setCreatingEventStart(null)
    setCreatingEventEnd(null)
    setCreatingEventMonth(null)
  }
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!focusedDate && (e.key === 'Tab' || e.key === 'Enter')) {
      setFocusedDate(new Date())
      setKeyboardMode(true)
      setAnnounceMessage('Entered calendar navigation mode')
      return
    }

    if (!focusedDate) return

    let newDate = focusedDate
    let handled = false

    switch (e.key) {
      case 'ArrowLeft':
        newDate = addDays(focusedDate, -1)
        handled = true
        break
      case 'ArrowRight':
        newDate = addDays(focusedDate, 1)
        handled = true
        break
      case 'ArrowUp':
        newDate = addDays(focusedDate, -7)
        handled = true
        break
      case 'ArrowDown':
        newDate = addDays(focusedDate, 7)
        handled = true
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedDate) {
          setSelectedDate(focusedDate)
          onDateSelect?.(focusedDate)
          setAnnounceMessage(`Selected ${format(focusedDate, 'MMMM d, yyyy')}`)
        }
        handled = true
        break
      case 'Escape':
        setFocusedDate(null)
        setKeyboardMode(false)
        setAnnounceMessage('Exited calendar navigation')
        handled = true
        break
      case 't':
      case 'T':
        // Go to today
        const today = new Date()
        setFocusedDate(today)
        setAnnounceMessage(`Navigated to today: ${format(today, 'MMMM d, yyyy')}`)
        handled = true
        break
    }

    if (handled) {
      e.preventDefault()
      if (newDate !== focusedDate) {
        setFocusedDate(newDate)
        setAnnounceMessage(`${format(newDate, 'EEEE, MMMM d, yyyy')}`)
      }
    }
  }, [focusedDate, onDateSelect])

  // Announce messages to screen readers
  useEffect(() => {
    if (announceMessage && liveRegionRef.current) {
      liveRegionRef.current.textContent = announceMessage
    }
  }, [announceMessage])

  return (
    <div 
      className={cn("relative bg-background focus:outline-none focus:ring-2 focus:ring-ring/50", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label={`Calendar for year ${year}. Press Enter to start navigation, use arrow keys to move between dates.`}
    >
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
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
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="absolute top-4 right-4 z-30 p-2 bg-background/95 backdrop-blur-sm border rounded-lg hover:bg-accent transition-colors"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      )}
      
      {/* Zoom Controls - Desktop or Mobile Menu */}
      <div 
        id="mobile-menu"
        className={cn(
          "absolute z-20 bg-background/95 backdrop-blur-sm border rounded-lg",
          isMobile ? (
            isMobileMenuOpen ? "top-16 right-4 flex flex-col gap-2 p-3 shadow-lg" : "hidden"
          ) : "top-4 right-4 flex items-center gap-2 p-1"
        )}
        role="toolbar"
        aria-label="Zoom controls"
      >
        <button
          onClick={handleZoomOut}
          className={cn(
            "hover:bg-accent rounded transition-colors",
            isMobile ? "p-2 w-full flex items-center justify-center gap-2" : "p-1"
          )}
          disabled={zoomLevel === 'year'}
          aria-label="Zoom out"
          aria-disabled={zoomLevel === 'year'}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
          {isMobile && <span className="text-sm">Zoom Out</span>}
        </button>
        <span 
          className={cn(
            "text-xs font-medium capitalize",
            isMobile ? "text-center py-1" : "px-2"
          )}
          role="status"
          aria-live="polite"
          aria-label={`Current zoom level: ${zoomLevel}`}
        >
          {zoomLevel}
        </span>
        <button
          onClick={handleZoomIn}
          className={cn(
            "hover:bg-accent rounded transition-colors",
            isMobile ? "p-2 w-full flex items-center justify-center gap-2" : "p-1"
          )}
          disabled={zoomLevel === 'day'}
          aria-label="Zoom in"
          aria-disabled={zoomLevel === 'day'}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isMobile && <span className="text-sm">Zoom In</span>}
        </button>
        
        {/* Mobile-specific controls */}
        {isMobile && (
          <>
            <div className="border-t border-border my-2" />
            <button
              onClick={() => {
                // Scroll to today
                if (scrollRef.current) {
                  const today = new Date()
                  const yearStart = startOfYear(new Date(year, 0, 1))
                  const dayOfYear = differenceInDays(today, yearStart)
                  const scrollPosition = dayOfYear * dayWidth - scrollRef.current.clientWidth / 2
                  scrollRef.current.scrollTo({
                    left: Math.max(0, scrollPosition),
                    behavior: 'smooth'
                  })
                }
                setIsMobileMenuOpen(false)
              }}
              className="p-2 w-full bg-background border border-border rounded-md hover:bg-accent transition-colors text-sm"
            >
              Go to Today
            </button>
            <div className="text-xs text-muted-foreground text-center mt-2 space-y-1">
              <p>• Long press to create event</p>
              <p>• Double tap to zoom</p>
              <p>• Pinch to zoom in/out</p>
            </div>
          </>
        )}
      </div>
      
      {/* Main Calendar Container */}
      <div 
        ref={scrollRef}
        className="overflow-auto h-full relative"
        {...bind()}
        style={{ cursor: enableInfiniteCanvas ? 'grab' : 'default' }}
        role="grid"
        aria-label={`Calendar grid for ${year}. ${keyboardMode ? 'Keyboard navigation active.' : 'Press Enter to activate keyboard navigation.'}`}
        aria-rowcount={12}
        aria-colcount={31}
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
                        if (!isCreatingEvent && !isMobile) {
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
                personal: 'bg-green-500 hover:bg-green-600',
                work: 'bg-blue-500 hover:bg-blue-600',
                effort: 'bg-orange-500 hover:bg-orange-600',
                note: 'bg-purple-500 hover:bg-purple-600'
              }
              
              const isSelected = selectedEvent?.id === event.id
              const isDragging = draggedEvent?.id === event.id
              
              return (
                <div
                  key={event.id || index}
                  className={cn(
                    "absolute pointer-events-auto rounded-sm flex items-center text-white transition-all group",
                    categoryColors[event.category as keyof typeof categoryColors] || 'bg-gray-500 hover:bg-gray-600',
                    isSelected && "ring-2 ring-blue-400 ring-offset-1 ring-offset-background z-20 shadow-lg",
                    isDragging && "opacity-50 cursor-grabbing",
                    !isDragging && "cursor-grab hover:shadow-md hover:z-10"
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label={`Event: ${event.title}. From ${format(event.startDate, 'MMM d')} to ${format(event.endDate, 'MMM d')}. Category: ${event.category}. Press Enter to select, Delete to remove.`}
                  aria-selected={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedEvent(event)
                      onEventClick?.(event)
                      setAnnounceMessage(`Selected event: ${event.title}`)
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.preventDefault()
                      if (event.id) {
                        onEventDelete?.(event.id)
                        setAnnounceMessage(`Deleted event: ${event.title}`)
                      }
                    }
                  }}
                  style={{
                    left: event.left - headerWidth,
                    top: event.top + (stackRow * (eventHeight + eventMargin)) + 4,
                    width: Math.max(event.width - 2, 30), // Minimum width for visibility
                    height: eventHeight
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggedEvent(event)
                    setIsDraggingEvent(true)
                  }}
                  onDragEnd={() => {
                    setDraggedEvent(null)
                    setIsDraggingEvent(false)
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
                  {/* Resize handle - left */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/20"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizingEvent(true)
                      setResizingEvent(event)
                      setResizeDirection('start')
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
                      setIsResizingEvent(true)
                      setResizingEvent(event)
                      setResizeDirection('end')
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}