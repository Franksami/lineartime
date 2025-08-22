'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { VariableSizeList as List } from 'react-window'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { CalendarRenderer } from '@/lib/canvas/CalendarRenderer'
import { IntervalTree } from '@/lib/data-structures/IntervalTree'
import type { Event } from '@/types/calendar'
import { getDaysInMonth, startOfYear, addMonths, getDay, isToday, format, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { MultiDayEventBar, calculateEventStacks } from './MultiDayEventBar'
import { DraggableEventBar } from './DraggableEventBar'
import { DroppableCalendarDay } from './DroppableCalendarDay'

interface HybridCalendarProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  onEventUpdate?: (event: Event) => void // Callback for when event is moved
  useCanvas?: boolean // Toggle between DOM and Canvas rendering
  canvasThreshold?: number // Number of events to trigger Canvas mode
  enableDragDrop?: boolean // Enable drag and drop functionality
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ESTIMATED_MONTH_HEIGHT = 280 // Approximate height of each month

export function HybridCalendar({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  useCanvas = true,
  canvasThreshold = 100,
  enableDragDrop = true
}: HybridCalendarProps) {
  const listRef = useRef<List>(null)
  const [windowHeight, setWindowHeight] = useState(0)
  const canvasRefs = useRef<Map<number, CalendarRenderer>>(new Map())
  const intervalTree = useRef(new IntervalTree())
  const [renderMode, setRenderMode] = useState<'dom' | 'canvas'>('dom')
  const [visibleMonths, setVisibleMonths] = useState<Set<number>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current?.event) return
    
    const draggedEvent = active.data.current.event as Event
    const targetDate = over.data.current?.date as Date
    
    if (!targetDate) return
    
    // Calculate the difference in days
    const daysDiff = differenceInDays(targetDate, draggedEvent.startDate)
    
    // Update event dates
    const updatedEvent: Event = {
      ...draggedEvent,
      startDate: new Date(draggedEvent.startDate.getTime() + daysDiff * 24 * 60 * 60 * 1000),
      endDate: new Date(draggedEvent.endDate.getTime() + daysDiff * 24 * 60 * 60 * 1000),
    }
    
    // Call the update callback
    onEventUpdate?.(updatedEvent)
    setActiveId(null)
  }, [onEventUpdate])
  
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
  
  // Calculate item size dynamically based on events
  const getItemSize = useCallback((index: number) => {
    const monthEvents = eventsByMonth.get(index) || []
    // Calculate height based on event stacking
    const stacks = calculateEventStacks(monthEvents)
    const maxStack = Math.max(0, ...Array.from(stacks.values()))
    return Math.max(ESTIMATED_MONTH_HEIGHT, 200 + (maxStack + 1) * 22 + 40) // +40 for header
  }, [eventsByMonth])
  
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
            enableDragDrop={enableDragDrop}
          />
        )}
      </div>
    )
  }, [year, eventsByMonth, renderMode, onEventClick, onDateSelect, enableDragDrop])
  
  if (!windowHeight) return null
  
  const content = (
    <div className={cn("w-full h-full", className)}>
      {/* Performance Stats */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-2">
        <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <span>Mode: {renderMode.toUpperCase()}</span>
          <span>Events: {events.length}</span>
          <span>Drag&Drop: {enableDragDrop ? 'ON' : 'OFF'}</span>
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
  
  // Wrap with DndContext if drag and drop is enabled
  if (enableDragDrop && renderMode === 'dom') {
    const activeEvent = events.find(e => e.id === activeId)
    
    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        {content}
        <DragOverlay>
          {activeEvent ? (
            <div className="opacity-50">
              <MultiDayEventBar
                event={activeEvent}
                startColumn={0}
                endColumn={2}
                row={0}
                cellWidth={100}
                cellHeight={36}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }
  
  return content
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
  onDateSelect,
  enableDragDrop = true
}: {
  month: number
  year: number
  events: Event[]
  onEventClick?: (event: Event) => void
  onDateSelect?: (date: Date) => void
  enableDragDrop?: boolean
}) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = getDaysInMonth(firstDay)
  const firstDayOfWeek = getDay(firstDay)
  const lastDay = new Date(year, month, daysInMonth)
  
  // Filter and prepare multi-day events
  const multiDayEvents = events.filter(event => {
    const eventStart = startOfDay(event.startDate)
    const eventEnd = endOfDay(event.endDate)
    const monthStart = startOfDay(firstDay)
    const monthEnd = endOfDay(lastDay)
    
    // Event overlaps with this month
    return !(eventEnd < monthStart || eventStart > monthEnd)
  })
  
  // Calculate stacking for multi-day events
  const eventStacks = calculateEventStacks(multiDayEvents)
  const maxStack = Math.max(0, ...Array.from(eventStacks.values()))
  const monthHeight = Math.max(280, 200 + (maxStack + 1) * 22) // Dynamic height based on stacks
  
  // Create calendar grid
  const cells = []
  
  // Empty cells before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-before-${i}` })
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({
      type: 'day',
      key: `day-${day}`,
      date,
      day,
    })
  }
  
  // Empty cells to complete grid
  while (cells.length < 42) {
    cells.push({ type: 'empty', key: `empty-after-${cells.length}` })
  }
  
  // Calculate event bar positions
  const eventBars = multiDayEvents.map(event => {
    const eventStart = startOfDay(event.startDate)
    const eventEnd = endOfDay(event.endDate)
    const monthStart = startOfDay(firstDay)
    const monthEnd = endOfDay(lastDay)
    
    // Clamp event to month boundaries
    const displayStart = eventStart < monthStart ? monthStart : eventStart
    const displayEnd = eventEnd > monthEnd ? monthEnd : eventEnd
    
    // Calculate column positions
    const startDay = displayStart.getDate()
    const startColumn = firstDayOfWeek + startDay - 1
    const endDay = displayEnd.getDate()
    const endColumn = firstDayOfWeek + endDay - 1
    
    // Get stack row from calculation
    const stackRow = eventStacks.get(event) || 0
    
    return {
      event,
      startColumn: startColumn % 7,
      endColumn: endColumn % 7,
      weekRow: Math.floor(startColumn / 7),
      stackRow,
    }
  })
  
  return (
    <div className="relative" style={{ height: `${monthHeight}px` }}>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden h-full">
        {cells.map((cell, index) => {
          if (cell.type === 'empty') {
            return <div key={cell.key} className="bg-neutral-50 dark:bg-neutral-900" />
          }
          
          const isCurrentDay = cell.date && isToday(cell.date)
          const dayOfWeek = index % 7
          const weekRow = Math.floor(index / 7)
          
          if (enableDragDrop) {
            return (
              <DroppableCalendarDay
                key={cell.key}
                date={cell.date!}
                day={cell.day}
                isCurrentDay={isCurrentDay}
                onDateSelect={onDateSelect}
                style={{ height: `${monthHeight / 6}px` }}
              />
            )
          }
          
          return (
            <button
              key={cell.key}
              onClick={() => cell.date && onDateSelect?.(cell.date)}
              className={cn(
                "relative bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "border-t border-neutral-100 dark:border-neutral-800",
                "p-1",
                isCurrentDay && "ring-2 ring-blue-500 ring-inset"
              )}
              style={{ height: `${monthHeight / 6}px` }}
            >
              <span className={cn(
                "absolute top-1 left-1 text-xs",
                isCurrentDay ? "font-bold text-blue-600" : "text-neutral-700 dark:text-neutral-300"
              )}>
                {cell.day}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* Multi-day Event Bars */}
      <div className="absolute inset-0 pointer-events-none">
        {eventBars.map((bar, index) => (
          <div 
            key={`${bar.event.id}-${index}`}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              top: `${(bar.weekRow * monthHeight / 6) + 20 + (bar.stackRow * 22)}px`,
              left: `${(bar.startColumn * 100 / 7)}%`,
              width: `${((bar.endColumn - bar.startColumn + 1) * 100 / 7)}%`,
            }}
          >
            {enableDragDrop ? (
              <DraggableEventBar
                event={bar.event}
                startColumn={0}
                endColumn={bar.endColumn - bar.startColumn}
                row={0}
                onEventClick={onEventClick}
                cellWidth={100}
                cellHeight={monthHeight / 6}
              />
            ) : (
              <MultiDayEventBar
                event={bar.event}
                startColumn={0}
                endColumn={bar.endColumn - bar.startColumn}
                row={0}
                onEventClick={onEventClick}
                cellWidth={100}
                cellHeight={monthHeight / 6}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}