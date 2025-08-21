'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { VariableSizeList as List } from 'react-window'
import { CalendarRenderer } from '@/lib/canvas/CalendarRenderer'
import { IntervalTree } from '@/lib/data-structures/IntervalTree'
import type { Event } from '@/types/calendar'
import { getDaysInMonth, startOfYear, addMonths, getDay, isToday, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface HybridCalendarProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  useCanvas?: boolean // Toggle between DOM and Canvas rendering
  canvasThreshold?: number // Number of events to trigger Canvas mode
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ESTIMATED_MONTH_HEIGHT = 280 // Approximate height of each month

export function HybridCalendar({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  useCanvas = true,
  canvasThreshold = 100
}: HybridCalendarProps) {
  const listRef = useRef<List>(null)
  const [windowHeight, setWindowHeight] = useState(0)
  const canvasRefs = useRef<Map<number, CalendarRenderer>>(new Map())
  const intervalTree = useRef(new IntervalTree())
  const [renderMode, setRenderMode] = useState<'dom' | 'canvas'>('dom')
  const [visibleMonths, setVisibleMonths] = useState<Set<number>>(new Set())
  
  // Determine render mode based on event count
  useEffect(() => {
    if (useCanvas && events.length > canvasThreshold) {
      setRenderMode('canvas')
    } else {
      setRenderMode('dom')
    }
    
    // Build interval tree for conflict detection
    intervalTree.current.clear()
    events.forEach(event => {
      intervalTree.current.insert(event)
    })
  }, [events, useCanvas, canvasThreshold])
  
  // Calculate window height
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight)
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])
  
  // Group events by month for efficient rendering
  const eventsByMonth = React.useMemo(() => {
    const grouped = new Map<number, Event[]>()
    
    events.forEach(event => {
      const month = event.startDate.getMonth()
      if (!grouped.has(month)) {
        grouped.set(month, [])
      }
      grouped.get(month)!.push(event)
    })
    
    return grouped
  }, [events])
  
  // Calculate item size
  const getItemSize = useCallback((index: number) => {
    return ESTIMATED_MONTH_HEIGHT
  }, [])
  
  // Handle scroll to track visible months
  const handleScroll = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    const newVisible = new Set<number>()
    for (let i = visibleStartIndex; i <= visibleStopIndex; i++) {
      newVisible.add(i)
    }
    setVisibleMonths(newVisible)
  }, [])
  
  // Month row renderer
  const MonthRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const monthEvents = eventsByMonth.get(index) || []
    const monthDate = addMonths(startOfYear(new Date(year, 0, 1)), index)
    
    // Use Canvas for months with many events
    const useCanvasForMonth = renderMode === 'canvas' && monthEvents.length > 20
    
    return (
      <div style={style} className="px-4" data-month={index}>
        {/* Month Header */}
        <div className="flex items-center justify-between h-10 mb-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {MONTH_NAMES[index]} {year}
          </h3>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{monthEvents.length} events</span>
            {useCanvasForMonth && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                Canvas
              </span>
            )}
            {monthEvents.length > 0 && (
              <span className="text-xs">
                {intervalTree.current.findConflicts(monthEvents[0]).length > 0 && '⚠️ Conflicts'}
              </span>
            )}
          </div>
        </div>
        
        {/* Month Calendar */}
        {useCanvasForMonth ? (
          <CanvasMonth
            month={index}
            year={year}
            events={monthEvents}
            onEventClick={onEventClick}
            onDateSelect={onDateSelect}
          />
        ) : (
          <DOMMonth
            month={index}
            year={year}
            events={monthEvents}
            onEventClick={onEventClick}
            onDateSelect={onDateSelect}
          />
        )}
      </div>
    )
  }, [year, eventsByMonth, renderMode, onEventClick, onDateSelect])
  
  if (!windowHeight) return null
  
  return (
    <div className={cn("w-full h-full", className)}>
      {/* Performance Stats */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-2">
        <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <span>Mode: {renderMode.toUpperCase()}</span>
          <span>Events: {events.length}</span>
          <span>Visible: {Array.from(visibleMonths).map(m => MONTH_NAMES[m]).join(', ')}</span>
        </div>
      </div>
      
      {/* Virtual List */}
      <List
        ref={listRef}
        height={windowHeight - 40}
        itemCount={12}
        itemSize={getItemSize}
        width="100%"
        overscanCount={1}
        onItemsRendered={handleScroll}
        className="scrollbar-thin"
      >
        {MonthRow}
      </List>
    </div>
  )
}

// Canvas-based month renderer
function CanvasMonth({ 
  month, 
  year, 
  events, 
  onEventClick, 
  onDateSelect 
}: {
  month: number
  year: number
  events: Event[]
  onEventClick?: (event: Event) => void
  onDateSelect?: (date: Date) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<CalendarRenderer | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create renderer
    const renderer = new CalendarRenderer(containerRef.current, {
      cellWidth: 40,
      cellHeight: 36,
      monthHeaderHeight: 0, // Header handled by React
      fontSize: 11,
      padding: 2
    })
    
    rendererRef.current = renderer
    
    // Render events
    renderer.renderMonth(0, events) // Month 0 since we're rendering single month
    
    // Handle interactions
    const handleClick = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const event = renderer.handleInteraction(x, y, 'click')
      if (event && onEventClick) {
        onEventClick(event)
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      renderer.handleInteraction(x, y, 'hover')
    }
    
    containerRef.current.addEventListener('click', handleClick)
    containerRef.current.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick)
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
      }
      renderer.destroy()
    }
  }, [events, onEventClick])
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ height: 6 * 36 }} // 6 weeks × 36px height
    />
  )
}

// DOM-based month renderer (fallback for fewer events)
function DOMMonth({
  month,
  year,
  events,
  onEventClick,
  onDateSelect
}: {
  month: number
  year: number
  events: Event[]
  onEventClick?: (event: Event) => void
  onDateSelect?: (date: Date) => void
}) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = getDaysInMonth(firstDay)
  const firstDayOfWeek = getDay(firstDay)
  
  // Create calendar grid
  const cells = []
  
  // Empty cells before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-before-${i}` })
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayEvents = events.filter(e => 
      e.startDate.getDate() === day &&
      e.startDate.getMonth() === month
    )
    
    cells.push({
      type: 'day',
      key: `day-${day}`,
      date,
      day,
      events: dayEvents
    })
  }
  
  // Empty cells to complete grid
  while (cells.length < 42) {
    cells.push({ type: 'empty', key: `empty-after-${cells.length}` })
  }
  
  return (
    <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden">
      {cells.map(cell => {
        if (cell.type === 'empty') {
          return <div key={cell.key} className="bg-neutral-50 dark:bg-neutral-900 h-9" />
        }
        
        const isCurrentDay = cell.date && isToday(cell.date)
        const hasEvents = cell.events && cell.events.length > 0
        
        return (
          <button
            key={cell.key}
            onClick={() => cell.date && onDateSelect?.(cell.date)}
            className={cn(
              "relative h-9 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "flex flex-col items-center justify-center p-1",
              isCurrentDay && "ring-2 ring-blue-500"
            )}
          >
            <span className={cn(
              "text-xs",
              isCurrentDay ? "font-bold text-blue-600" : "text-neutral-700 dark:text-neutral-300"
            )}>
              {cell.day}
            </span>
            
            {hasEvents && (
              <div className="absolute bottom-0.5 flex gap-0.5">
                {cell.events?.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 h-1 rounded-full",
                      event.category === 'personal' && "bg-green-500",
                      event.category === 'work' && "bg-blue-500",
                      event.category === 'effort' && "bg-orange-500",
                      event.category === 'note' && "bg-purple-500"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}