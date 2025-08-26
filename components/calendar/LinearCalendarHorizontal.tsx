'use client'

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
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
import { Plus, Minus, GripVertical, Menu, X, Activity } from 'lucide-react'
import { EventModal } from './EventModal'
import { useMediaQuery } from '@/hooks/use-media-query'
// 🚀 NEW: Performance monitoring integration
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { PerformanceOverlay } from './performance-overlay'
import { useObjectPool } from '@/hooks/use-object-pool'
// 🚀 NEW: AI-enhanced drag & drop integration
import { useAIEnhancedDragDrop } from '@/hooks/use-ai-enhanced-drag-drop'
import { AISuggestionsPanel } from './ai-suggestions-panel'
import { DotDayContent, NumberDayContent, type DayContentContext } from './slots'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { RollingDigits } from '@/components/ui/rolling-digits'

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
  dayContent?: (ctx: DayContentContext) => React.ReactNode
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Day width at different zoom levels
const ZOOM_LEVELS = {
  fullYear: -1, // Special value: calculate dynamically for 53×7 grid
  year: 3,      // 3px per day - full year view
  quarter: 8,   // 8px per day - quarter view  
  month: 24,    // 24px per day - month view
  week: 60,     // 60px per day - week view
  day: 150      // 150px per day - day detail view
}

// Mobile-specific zoom levels
const MOBILE_ZOOM_LEVELS = {
  fullYear: -1, // Special value: calculate dynamically for 53×7 grid
  year: 2,      // 2px per day - more compact for mobile
  quarter: 6,   // 6px per day - quarter view  
  month: 18,    // 18px per day - month view
  week: 45,     // 45px per day - week view
  day: 100      // 100px per day - day detail view
}

type ZoomLevel = keyof typeof ZOOM_LEVELS

// Full Year Grid Component (12×371 layout) - Props interface
interface FullYearGridProps {
  year: number
  dayWidth: number
  monthHeight: number
  headerWidth: number
  headerHeight: number
  hoveredDate: Date | null
  selectedDate: Date | null
  onDateSelect?: (date: Date) => void
  setHoveredDate: (date: Date | null) => void
  setSelectedDate: (date: Date | null) => void
  handleDayClick: (date: Date) => void
  format: (date: Date, formatString: string) => string
  isSameDay: (dateLeft: Date, dateRight: Date) => boolean
  dayContent?: (ctx: DayContentContext) => React.ReactNode
  displayPreviewUpTo?: (date: Date) => boolean
}

function FullYearGrid({ 
  year, 
  dayWidth, 
  monthHeight, 
  headerWidth,
  headerHeight,
  hoveredDate,
  selectedDate,
  onDateSelect,
  setHoveredDate,
  setSelectedDate,
  handleDayClick,
  format,
  isSameDay,
  dayContent,
  displayPreviewUpTo
}: FullYearGridProps) {
  // Calculate year details
  const yearStart = startOfYear(new Date(year, 0, 1))
  const jan1DayOfWeek = yearStart.getDay() // 0 = Sunday, 6 = Saturday
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInYear = isLeapYear ? 366 : 365
  
  // Helper function to get date for a specific cell in each month row
  const getDateForCell = (monthRow: number, col: number): Date | null => {
    // Create date for first day of this month
    const monthDate = new Date(year, monthRow, 1)
    const firstDayOfWeek = monthDate.getDay() // 0 = Sunday
    const daysInThisMonth = getDaysInMonth(monthDate)
    
    // Calculate day number (1-31) based on column position
    // Account for empty cells at beginning of month for week alignment
    const dayNumber = col - firstDayOfWeek + 1
    
    // Check if this column should show a day number for this month
    if (dayNumber < 1 || dayNumber > daysInThisMonth) {
      return null // Empty cell for alignment
    }
    
    // Return the actual date for this day of the month
    return new Date(year, monthRow, dayNumber)
  }
  
  // Helper function to get column index for a specific date
  const getColumnForDate = (date: Date): number => {
    const dayOfYear = differenceInDays(date, yearStart) + 1
    return jan1DayOfWeek + dayOfYear - 1
  }
  
  // Create day-of-week headers (top) with visual week grouping
  const dayHeadersTop = (
    <div className="absolute top-0 left-0 right-0 bg-background border-b border-border flex z-20" style={{ height: headerHeight }}>
      <div style={{ width: headerWidth }} className="border-r border-border bg-background" />
      {Array.from({ length: 42 }).map((_, col) => {
        const dayOfWeek = col % 7
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        const dayName = dayNames[dayOfWeek]

        return (
          <div 
            key={`header-top-${col}`}
            className={cn(
              "flex items-center justify-center text-[10px] font-medium text-muted-foreground relative",
              col % 7 === 6 && "border-r-2 border-border/60", // Stronger week separator
              dayOfWeek === 0 && col > 0 && "border-l border-border/30" // Start of week
            )}
            style={{ width: dayWidth }}
          >
            {dayName}
          </div>
        )
      })}
      <div style={{ width: headerWidth }} className="border-l border-border bg-background" />
    </div>
  )
  
  // Create day-of-week headers (bottom) - mirror of top for easy reference
  const dayHeadersBottom = (
    <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border flex z-20" style={{ height: headerHeight }}>
      <div style={{ width: headerWidth }} className="border-r border-border bg-background" />
      {Array.from({ length: 42 }).map((_, col) => {
        const dayOfWeek = col % 7
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        const dayName = dayNames[dayOfWeek]

        return (
          <div 
            key={`header-bottom-${col}`}
            className={cn(
              "flex items-center justify-center text-[10px] font-medium text-muted-foreground",
              col % 7 === 6 && "border-r-2 border-border/60", // Stronger week separator
              dayOfWeek === 0 && col > 0 && "border-l border-border/30" // Start of week
            )}
            style={{ width: dayWidth }}
          >
            {dayName}
          </div>
        )
      })}
      <div style={{ width: headerWidth }} className="border-l border-border bg-background" />
    </div>
  )
  
  // Create month labels (left and right)
  const monthLabelsLeft = (
    <div className="absolute left-0 bg-background border-r border-border z-10" style={{ width: headerWidth, top: headerHeight, bottom: headerHeight }}>
      {MONTH_SHORT.map((month, idx) => (
        <div
          key={`left-${month}`}
          className="absolute flex items-center justify-center font-medium text-sm"
          style={{
            top: idx * monthHeight,
            height: monthHeight,
            width: headerWidth,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            transformOrigin: 'center'
          }}
        >
          {month}
        </div>
      ))}
    </div>
  )
  
  const monthLabelsRight = (
    <div className="absolute right-0 bg-background border-l border-border z-10" style={{ width: headerWidth, top: headerHeight, bottom: headerHeight }}>
      {MONTH_SHORT.map((month, idx) => (
        <div
          key={`right-${month}`}
          className="absolute flex items-center justify-center font-medium text-sm"
          style={{
            top: idx * monthHeight,
            height: monthHeight,
            width: headerWidth,
            writingMode: 'vertical-rl'
          }}
        >
          {month}
        </div>
      ))}
    </div>
  )
  
  // Generate grid cells (12 months × 42 days max)
  const gridCells = []
  for (let monthRow = 0; monthRow < 12; monthRow++) {
    for (let col = 0; col < 42; col++) {
      const date = getDateForCell(monthRow, col)
      // Weekend detection based on column position (0=Sunday, 6=Saturday)
      const dayOfWeek = col % 7
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isCurrentDay = date && isToday(date)
      const isSelected = date && selectedDate && isSameDay(date, selectedDate)
      const isHovered = date && hoveredDate && isSameDay(date, hoveredDate)
      const isEmpty = !date
      
      // SIMPLIFIED: No complex event creation range needed
      
      gridCells.push(
        <div
          key={`${monthRow}-${col}`}
          data-date={date ? format(date, 'yyyy-MM-dd') : undefined}
          data-day={date ? format(date, 'd') : undefined}
          className={cn(
            "absolute transition-colors day-cell",
            col % 7 === 6 && "border-r-2 border-border/60", // week separator
            isWeekend && "bg-muted/20",
            isEmpty && "bg-transparent cursor-default"
          )}
          style={{
            left: headerWidth + (col * dayWidth),
            top: headerHeight + (monthRow * monthHeight),
            width: dayWidth,
            height: monthHeight
          }}
          onMouseEnter={() => {
            if (date && !isEmpty) {
              setHoveredDate(date)
            }
          }}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (date && !isEmpty) {
              // Route through onDateSelect to unify keyboard and mouse behavior
              onDateSelect?.(date)
              handleDayClick(date)
            }
          }}
          title={date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
        >
          <div
            className={cn(
              "m-[2px] h-[calc(100%-4px)] rounded-sm border",
              isEmpty ? "border-transparent" : "border-border/40",
              isSelected && "ring-1 ring-blue-500", 
              isHovered && !isEmpty && "bg-accent/20"
            )}
            aria-hidden
          >
            <div className="w-full h-full flex items-center justify-center">
              {dayContent && dayContent({
                date,
                isEmpty,
                isToday: isCurrentDay,
                isSelected: !!isSelected,
                isWeekend,
                isHovered: !!isHovered,
                displayPreviewUpTo: displayPreviewUpTo && date ? displayPreviewUpTo(date) : false,
                onSelect: () => {
                  if (date && !isEmpty) {
                    setSelectedDate(date)
                    onDateSelect?.(date)
                  }
                },
                onPreview: () => {
                  if (date && !isEmpty) {
                    setHoveredDate(date)
                  }
                },
                dataAttrs: {
                  'data-date': date ? format(date, 'yyyy-MM-dd') : undefined,
                  'data-day': date ? format(date, 'd') : undefined
                }
              })}
            </div>
          </div>
        </div>
      )
    }
  }
  
  return (
    <div className="relative w-full h-full">
      {dayHeadersTop}
      {dayHeadersBottom}
      {monthLabelsLeft}
      {monthLabelsRight}
      <div className="absolute inset-0" style={{ paddingTop: headerHeight, paddingBottom: headerHeight }}>
        {gridCells}
      </div>
    </div>
  )
}

// Enhanced touch gesture thresholds for better mobile UX
const TOUCH_THRESHOLDS = {
  longPressDelay: 400,     // Reduce from 500ms for faster feedback
  swipeVelocity: 0.3,      // Reduce from 0.5 for easier swiping
  pinchScale: 0.015,       // Increase from 0.01 for better zoom control
  doubleTapDelay: 250,     // Reduce from 300ms for responsive feel
  minimumSwipeDistance: 20 // Add minimum distance for intentional swipes
}

// Haptic feedback for better mobile experience
const provideTactileFeedback = (type: 'light' | 'medium' | 'heavy') => {
  if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
    const patterns = { light: 25, medium: 50, heavy: 100 }
    window.navigator.vibrate(patterns[type])
  }
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
  enableInfiniteCanvas = true,
  dayContent: customDayContent
}: LinearCalendarHorizontalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fullYear')
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventManagementPosition, setEventManagementPosition] = useState<{ x: number; y: number } | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isDraggingEvent, setIsDraggingEvent] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [isResizingEvent, setIsResizingEvent] = useState(false)
  const [resizingEvent, setResizingEvent] = useState<Event | null>(null)
  const [resizeDirection, setResizeDirection] = useState<'start' | 'end' | null>(null)
  
  // Accessibility state
  const [announceMessage, setAnnounceMessage] = useState<string>('')
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)
  
  // Settings context for day content style
  const { settings } = useSettingsContext()
  
  // Day content renderer logic
  const dayContent = useMemo(() => {
    if (customDayContent) {
      return customDayContent
    }
    
    // Use settings to determine which renderer to use
    const style = settings.calendar.calendarDayStyle
    if (style === 'dot') {
      return (ctx: DayContentContext) => <DotDayContent context={ctx} />
    } else {
      return (ctx: DayContentContext) => <NumberDayContent context={ctx} />
    }
  }, [customDayContent, settings.calendar.calendarDayStyle])
  
  // Display preview logic for dot mode (which days show as filled)
  const displayPreviewUpTo = useCallback((date: Date): boolean => {
    if (settings.calendar.calendarDayStyle !== 'dot' || !date) {
      return true // In number mode, this is irrelevant or date is null
    }
    
    const today = startOfDay(new Date())
    const targetDate = startOfDay(date)
    
    // Current year logic
    if (date.getFullYear() === today.getFullYear()) {
      // Show filled dots up to today, or hovered future date
      const compareDate = hoveredDate && hoveredDate > today ? startOfDay(hoveredDate) : today
      return targetDate <= compareDate
    }
    
    // Past years: all filled
    if (date.getFullYear() < today.getFullYear()) {
      return true
    }
    
    // Future years: only filled if hovered
    if (hoveredDate && hoveredDate.getFullYear() === date.getFullYear()) {
      return targetDate <= startOfDay(hoveredDate)
    }
    
    return false
  }, [settings.calendar.calendarDayStyle, hoveredDate])
  
  // Days left calculation for dot mode
  const daysLeft = useMemo(() => {
    if (settings.calendar.calendarDayStyle !== 'dot') {
      return 0
    }
    
    const today = new Date()
    const currentYear = today.getFullYear()
    
    // Only show days left for current year
    if (year !== currentYear) {
      return 0
    }
    
    const isLeapYear = currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0)
    const totalDays = isLeapYear ? 366 : 365
    
    // Calculate day of year more reliably using differenceInDays
    const startOfCurrentYear = new Date(currentYear, 0, 1)
    const dayOfYear = differenceInDays(startOfDay(today), startOfDay(startOfCurrentYear)) + 1
    
    // If hovering over a future date, use that as the reference
    if (hoveredDate && hoveredDate > today && hoveredDate.getFullYear() === currentYear) {
      const hoveredDayOfYear = differenceInDays(startOfDay(hoveredDate), startOfDay(startOfCurrentYear)) + 1
      return Math.max(0, totalDays - hoveredDayOfYear)
    }
    
    return Math.max(0, totalDays - dayOfYear)
  }, [settings.calendar.calendarDayStyle, year, hoveredDate])
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
  
  // 🚀 PERFORMANCE: Scroll position tracking for virtual scrolling
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  
  // 🚀 NEW: Performance monitoring integration
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false)
  const { metrics, startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor(events.length)
  // Simple object pool for calendar events
  const objectPool = useObjectPool(
    () => ({ id: '', title: '', startDate: new Date(), endDate: new Date(), category: 'personal' }),
    (obj) => { obj.id = ''; obj.title = ''; obj.startDate = new Date(); obj.endDate = new Date(); obj.category = 'personal' },
    50
  )
  const poolStats = objectPool.getPoolStats()
  
  // 🚀 NEW: AI-enhanced drag & drop integration
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const {
    aiSuggestions,
    isAnalyzing,
    dragFeedback,
    handleDragStart: handleAIDragStart,
    handleDragMove: handleAIDragMove,
    handleDrop: handleAIDrop,
    clearAISuggestions
  } = useAIEnhancedDragDrop(events as any, (updatedEvents) => {
    // Handle AI-optimized event updates
    console.log('AI suggested event updates:', updatedEvents)
    // You can implement custom logic here for AI suggestions
  }, {
    enableAI: true,
    realTimeAnalysis: true,
    autoOptimize: false
  })
  
  // SIMPLIFIED: No complex drag creation state needed for click-to-create
  
  
  // Calculate viewport dimensions for fullYear grid
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  
  // Define headerWidth first, before it's used in calculations
  const headerWidth = isMobile ? 50 : 80 // Narrower month column on mobile
  const headerHeight = 24 // top and bottom header height
  
  // Update viewport size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      const width = scrollRef.current?.clientWidth || window.innerWidth
      const height = scrollRef.current?.clientHeight || window.innerHeight
      setViewportWidth(width)
      setViewportHeight(height)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Ensure the calendar opens focused at the top-left of the full-year grid
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, top: 0 })
    }
    // Reset any pan/zoom drift on initial mount
  }, [])
  
  // 🚀 NEW: Performance measurement for event rendering
  useEffect(() => {
    if (events.length > 0) {
      startRenderMeasurement()
      // Use requestAnimationFrame to measure after render
      const rafId = requestAnimationFrame(() => {
        endRenderMeasurement()
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [events, startRenderMeasurement, endRenderMeasurement])
  
  // Calculate day width for fullYear zoom (42 columns per month row)
  const calculateFullYearDayWidth = () => {
    if (viewportWidth === 0) return 20 // Fallback
    const availableWidth = viewportWidth - (headerWidth * 2) // Subtract left and right sidebars
    return Math.max(18, availableWidth / 42) // 42 columns (6 weeks × 7 days)
  }
  
  // Responsive dimensions
  const isFullYearZoom = zoomLevel === 'fullYear'
  const dayWidth = isFullYearZoom 
    ? calculateFullYearDayWidth()
    : (isMobile ? MOBILE_ZOOM_LEVELS[zoomLevel] : ZOOM_LEVELS[zoomLevel])
  
  // For fullYear grid: 12 rows (one per month)
  const monthHeight = isFullYearZoom 
    ? Math.max(44, Math.floor((viewportHeight - headerHeight * 2) / 12))
    : (isMobile ? 60 : 80)
  const eventHeight = isMobile ? 18 : 22 // Smaller events on mobile
  const eventMargin = isMobile ? 1 : 2 // Tighter margins on mobile
  
  // Calculate total width needed
  const totalDays = isFullYearZoom ? 42 : (365 + (year % 4 === 0 ? 1 : 0))
  const totalWidth = isFullYearZoom 
    ? (42 * dayWidth + headerWidth * 2) // 42 day columns plus sidebars on both sides
    : (totalDays * dayWidth + headerWidth)
  
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
      const jan1DayOfWeek = yearStart.getDay()
      const startDay = differenceInDays(startOfDay(event.startDate), yearStart) + 1
      const endDay = differenceInDays(endOfDay(event.endDate), yearStart) + 1
      const duration = endDay - startDay + 1
      
      // Determine which month row this event belongs to (based on start date)
      const eventMonth = event.startDate.getMonth()
      
      // Calculate position based on zoom level
      let left, width, top
      
      if (isFullYearZoom) {
        // For 371-column grid: use column-based positioning
        const startCol = jan1DayOfWeek + startDay - 1
        const endCol = jan1DayOfWeek + endDay - 1
        left = startCol * dayWidth + headerWidth
        width = (endCol - startCol + 1) * dayWidth - 2
        top = eventMonth * monthHeight + headerHeight + 4
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
        height: 20
      }
    })
  }, [events, dayWidth, year, isFullYearZoom])

  // 🚀 PERFORMANCE: Virtual Event Rendering - Only render visible events
  const visibleEvents = React.useMemo(() => {
    // Safety check: return all events if no container or few events
    if (!containerRef.current || processedEvents.length === 0) return processedEvents
    
    // Performance threshold: if we have fewer than 100 events, render all
    if (processedEvents.length < 100) return processedEvents
    
    try {
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerScrollLeft = containerRef.current.scrollLeft
      const containerScrollTop = containerRef.current.scrollTop
      const viewportWidth = containerRect.width
      const viewportHeight = containerRect.height
      
      // Use tracked scroll state as fallback
      const actualScrollLeft = containerScrollLeft !== undefined ? containerScrollLeft : scrollLeft
      const actualScrollTop = containerScrollTop !== undefined ? containerScrollTop : scrollTop
      
      // Calculate visible bounds with buffer for smooth scrolling
      const buffer = Math.max(viewportWidth * 0.5, 1000) // 50% viewport width buffer
      const leftBound = actualScrollLeft - buffer
      const rightBound = actualScrollLeft + viewportWidth + buffer
      const topBound = actualScrollTop - buffer  
      const bottomBound = actualScrollTop + viewportHeight + buffer
      
      // Filter events that intersect with the visible bounds
      return processedEvents.filter(event => {
        const eventLeft = event.left
        const eventRight = event.left + event.width
        const eventTop = event.top
        const eventBottom = event.top + event.height
        
        const horizontalVisible = eventRight >= leftBound && eventLeft <= rightBound
        const verticalVisible = eventBottom >= topBound && eventTop <= bottomBound
        
        return horizontalVisible && verticalVisible
      })
    } catch (error) {
      // Fallback to all events if there's any error
      console.warn('Virtual scrolling calculation failed, falling back to all events:', error)
      return processedEvents
    }
  }, [processedEvents, scrollLeft, scrollTop])
  
  
  // Pan and zoom handlers
  const handleZoomIn = () => {
    const levels: ZoomLevel[] = ['fullYear', 'year', 'quarter', 'month', 'week', 'day']
    const currentIndex = levels.indexOf(zoomLevel)
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1])
    }
  }
  
  const handleZoomOut = () => {
    const levels: ZoomLevel[] = ['fullYear', 'year', 'quarter', 'month', 'week', 'day']
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
  
  // Scroll to January 1st on mount (start of the year)
  useEffect(() => {
    if (scrollRef.current) {
      // Always start at the beginning of the year (January 1st)
      scrollRef.current.scrollLeft = 0
      scrollRef.current.scrollTop = 0
    }
  }, [year])
  
  // REMOVED: Complex drag creation system - replaced with simple click-to-create

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
    setEventManagementPosition(null)
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

  // Check for overlapping events
  const checkForOverlaps = useCallback((start: Date, end: Date, excludeId?: string) => {
    return events.filter(event => {
      if (excludeId && event.id === excludeId) return false
      
      // Check if the date ranges overlap
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      
      return (
        (start <= eventEnd && end >= eventStart) ||
        (eventStart <= end && eventEnd >= start)
      )
    })
  }, [events])
  
  // Open EventModal for event creation
  const handleDayClick = (date: Date) => {
    // Clear any existing selections
    setSelectedEvent(null)
    setEventManagementPosition(null)
    setSelectedDate(date)
    setShowEventModal(true)
  }

  // Handle event save from modal
  const handleEventSave = useCallback((eventData: Partial<Event>) => {
    if (eventData.id) {
      // Update existing event
      onEventUpdate?.(eventData as Event)
    } else {
      // Create new event
      onEventCreate?.(eventData)
    }
    setShowEventModal(false)
    setSelectedDate(null)
    setSelectedEvent(null)
  }, [onEventCreate, onEventUpdate])
  
  
  
  // REMOVED: Complex drag handlers - replaced with simple click-to-create
  
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

  // 🚀 PERFORMANCE: Track scroll position for virtual event rendering
  useEffect(() => {
    if (!containerRef.current) return

    const handleScroll = () => {
      if (!containerRef.current) return
      setScrollLeft(containerRef.current.scrollLeft)
      setScrollTop(containerRef.current.scrollTop)
    }

    const container = containerRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial scroll position
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div 
      className={cn("relative bg-background focus:outline-none focus:ring-2 focus:ring-ring/50", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Calendar for year ${year}. Press Enter to start navigation, use arrow keys to move between dates.`}
    >
      {/* PRD Required Header Layout */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Year title (top-left) */}
          <h1 className="text-xl font-semibold text-foreground">
            {year} Linear Calendar
          </h1>
          
          {/* Right side content */}
          <div className="flex items-center gap-6">
            {/* Days left counter (dot mode only) */}
            {settings.calendar.calendarDayStyle === 'dot' && 
             settings.calendar.showDaysLeft && 
             year === new Date().getFullYear() && (
              <div className="flex items-baseline gap-2">
                <RollingDigits
                  value={daysLeft}
                  className="text-base font-medium text-foreground"
                  aria-label={`${daysLeft} days remaining in ${year}`}
                />
                <span className="text-sm text-muted-foreground">days left</span>
              </div>
            )}
            
            {/* Tagline */}
            <p className="text-sm text-muted-foreground italic">
              Life is bigger than a week.
            </p>
          </div>
        </div>
      </div>
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      {/* Calendar Toolbar - Simplified for now */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b p-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{year} Linear Calendar</h2>
          <div className="text-sm text-muted-foreground">
            {events.length} events
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="absolute top-4 right-4 z-30 p-2 bg-card border border-border rounded-lg hover:bg-accent/10 transition-colors"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      )}
      
      {/* Zoom Controls - Desktop or Mobile Menu */}
      {/* Hide zoom controls while in fullYear to avoid drifting away from the startup view */}
      <div 
        id="mobile-menu"
        className={cn(
          "absolute z-20 bg-card border border-border rounded-lg",
          isFullYearZoom ? "hidden" : (
            isMobile ? (
              isMobileMenuOpen ? "top-16 right-4 flex flex-col gap-2 p-3 shadow-sm" : "hidden"
            ) : "top-4 right-4 flex items-center gap-2 p-1 shadow-sm"
          )
        )}
        role="toolbar"
        aria-label="Zoom controls"
      >
        <button
          onClick={handleZoomOut}
          className={cn(
            "hover:bg-accent/10 rounded transition-colors",
            isMobile ? "p-2 w-full flex items-center justify-center gap-2" : "p-1"
          )}
          disabled={zoomLevel === 'fullYear'}
          aria-label="Zoom out"
          aria-disabled={zoomLevel === 'fullYear'}
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
            "hover:bg-accent/10 rounded transition-colors",
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
              className="p-2 w-full bg-background border border-border rounded-md hover:bg-accent/10 transition-colors text-sm"
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
        className="h-full relative overflow-hidden"
        style={{ 
          cursor: enableInfiniteCanvas ? 'grab' : 'default',
          paddingTop: '60px' // Account for header height
        }}
        {...bind()}
        onClick={(e) => {
          // Close toolbar when clicking on the grid (not on an event)
          if ((e.target as HTMLElement).closest('[role="grid"]') && 
              !(e.target as HTMLElement).closest('[class*="bg-"]')) {
            setSelectedEvent(null)
            setEventManagementPosition(null)
          }
        }}
        role="grid"
        aria-label={`Calendar grid for ${year}. ${keyboardMode ? 'Keyboard navigation active.' : 'Press Enter to activate keyboard navigation.'}`}
        aria-rowcount={12}
        aria-colcount={42}
      >
        <div 
          className="relative"
          style={{ 
            width: isFullYearZoom ? '100%' : totalWidth,
            height: isFullYearZoom ? (12 * monthHeight + headerHeight * 2) : (12 * monthHeight),
            minWidth: '100%'
          }}
        >
          {/* Render based on zoom mode */}
          {isFullYearZoom ? (
            // Full Year Grid View (12×371)
            <FullYearGrid
              year={year}
              dayWidth={dayWidth}
              monthHeight={monthHeight}
              headerWidth={headerWidth}
              headerHeight={headerHeight}
              hoveredDate={hoveredDate}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              setHoveredDate={setHoveredDate}
              setSelectedDate={setSelectedDate}
              handleDayClick={handleDayClick}
              format={format}
              isSameDay={isSameDay}
              dayContent={dayContent}
              displayPreviewUpTo={displayPreviewUpTo}
            />
          ) : (
            // Normal horizontal month rows
            <>
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
                  
                  // SIMPLIFIED: No complex event creation range needed
                  
                  return (
                    <div
                      key={day}
                      className={cn(
                        "absolute top-0 border-r border-border/30 hover:bg-accent/10 transition-colors cursor-pointer",
                        isCurrentDay && "bg-primary/10 border-primary",
                        isSelected && "bg-primary/20",
                        isHovered && "bg-accent/10"
                      )}
                      style={{
                        left: (dayOfYear - month.startDayOfYear) * dayWidth,
                        width: dayWidth,
                        height: monthHeight
                      }}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={(e) => {
                        e.preventDefault()
                        // Route through onDateSelect to unify keyboard and mouse behavior
                        onDateSelect?.(date)
                        handleDayClick(date)
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
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
            </>
          )}
          
          {/* SIMPLIFIED: No complex drag preview needed for click-to-create */}
          
          {/* Drag & Drop Layer - Simplified for now */}
          {!isFullYearZoom && (
            <div
              className="absolute inset-0 z-10"
              style={{ marginLeft: headerWidth }}
              onClick={(e) => {
                // Simple click-to-create functionality
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                
                // Calculate which day was clicked
                const dayIndex = Math.floor(x / dayWidth)
                const monthIndex = Math.floor(y / monthHeight)
                
                if (monthIndex >= 0 && monthIndex < 12 && dayIndex >= 0) {
                  const eventData = {
                    id: Date.now().toString(),
                    title: 'New Event',
                    date: new Date(year, monthIndex, dayIndex + 1),
                    startTime: '09:00',
                    endTime: '10:00'
                  }
                  onEventCreate?.(eventData)
                }
              }}
            />
          )}
          
          {/* Event Bars */}
          <div className="absolute inset-0 pointer-events-none" style={{ marginLeft: isFullYearZoom ? 0 : headerWidth }}>
            {visibleEvents.map((event, index) => {
              const stackRow = (event as any).stackRow || 0
              const categoryColors = {
                personal: 'bg-primary hover:bg-primary/80 text-primary-foreground',
                work: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                effort: 'bg-accent hover:bg-accent/80 text-accent-foreground',
                note: 'bg-muted hover:bg-muted/80 text-muted-foreground'
              } as const
              
              const isSelected = selectedEvent?.id === event.id
              const isDragging = draggedEvent?.id === event.id
              
              return (
                <div
                  key={event.id || index}
                  className={cn(
                    "absolute pointer-events-auto rounded-sm flex items-center transition-all group",
                    categoryColors[event.category as keyof typeof categoryColors] || 'bg-accent hover:bg-accent/80 text-accent-foreground',
                    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background z-20 shadow-lg",
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
                    left: isFullYearZoom ? event.left : (event.left - headerWidth),
                    top: event.top + (stackRow * (eventHeight + eventMargin)) + (isFullYearZoom ? 0 : 4),
                    width: Math.max(event.width - 2, isFullYearZoom ? 10 : 30), // Smaller minimum for grid view
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
                    
                    // Calculate toolbar position (absolute positioning)
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setEventManagementPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top
                    })
                    
                    onEventClick?.(event)
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setSelectedEvent(event)
                    setShowEventModal(true)
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
      
      {/* Simple Event Management for selected event */}
      {selectedEvent && eventManagementPosition && (
        <div
          className="fixed bg-card border rounded-lg shadow-lg p-3 z-50"
          style={{
            left: eventManagementPosition.x,
            top: eventManagementPosition.y
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{selectedEvent.title}</h4>
            <button
              onClick={() => {
                setSelectedEvent(null)
                setEventManagementPosition(null)
              }}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Edit event (show modal)
                setShowEventModal(true)
              }}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Edit
            </button>
            <button
              onClick={() => {
                // Delete event
                onEventDelete?.(selectedEvent.id)
                setSelectedEvent(null)
                setEventManagementPosition(null)
              }}
              className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* EventModal */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={selectedEvent}
        selectedDate={selectedDate}
        selectedRange={null} // This component doesn't support date ranges yet
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        checkOverlaps={checkForOverlaps}
        events={events}
      />
      
      {/* 🚀 NEW: Performance Overlay */}
      <PerformanceOverlay
        metrics={metrics}
        poolStats={poolStats}
        visible={showPerformanceOverlay}
        onClose={() => setShowPerformanceOverlay(false)}
      />
      
      {/* 🚀 NEW: AI Suggestions Panel */}
      <AISuggestionsPanel
        suggestions={aiSuggestions}
        dragFeedback={dragFeedback}
        isAnalyzing={isAnalyzing}
        onClear={clearAISuggestions}
        className="mb-20" // Position above performance toggle button
      />
      
      {/* Performance Toggle Button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
          className="fixed bottom-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Toggle Performance Monitor"
          aria-label="Toggle Performance Monitor"
        >
          <Activity className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}