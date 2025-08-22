'use client'

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { VariableSizeList as List } from 'react-window'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
import { getDaysInMonth, startOfYear, addMonths, getDay, isToday, isSameDay, isWithinInterval, endOfMonth, format } from 'date-fns'
import { getDayAriaLabel, getMonthAriaLabel, announceToScreenReader } from '@/lib/accessibility'

interface VirtualCalendarProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
}

interface MonthData {
  month: number
  name: string
  year: number
  firstDay: Date
  lastDay: Date
  daysInMonth: number
  firstDayOfWeek: number
  cells: CellData[]
}

interface CellData {
  type: 'empty' | 'day'
  date?: Date
  day?: number
  key: string
  events?: Event[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_ABBREVIATIONS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const COLUMNS_PER_ROW = 42 // 6 weeks × 7 days
const CELL_HEIGHT = 36 // Height of each day cell
const MONTH_HEADER_HEIGHT = 40 // Height of month header
const ESTIMATED_MONTH_HEIGHT = MONTH_HEADER_HEIGHT + (Math.ceil(COLUMNS_PER_ROW / 7) * CELL_HEIGHT)

export function VirtualCalendar({ 
  year, 
  events, 
  className,
  onDateSelect,
  onEventClick 
}: VirtualCalendarProps) {
  const listRef = useRef<List>(null)
  const [windowHeight, setWindowHeight] = React.useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [focusedDate, setFocusedDate] = useState<Date>(new Date())
  const observerRefs = useRef<Map<number, IntersectionObserver>>(new Map())
  const loadedMonths = useRef<Set<number>>(new Set())
  
  // Calculate window height on mount
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight)
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Generate month data structure
  const monthsData = useMemo(() => {
    const months: MonthData[] = []
    const yearStart = startOfYear(new Date(year, 0, 1))
    
    for (let month = 0; month < 12; month++) {
      const monthDate = addMonths(yearStart, month)
      const firstDay = new Date(year, month, 1)
      const lastDay = endOfMonth(firstDay)
      const daysInMonth = getDaysInMonth(monthDate)
      const firstDayOfWeek = getDay(firstDay)
      
      // Generate cells for the month
      const cells: CellData[] = []
      
      // Add empty cells before month starts
      for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push({ type: 'empty', key: `${month}-before-${i}` })
      }
      
      // Add days of the month with events
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dayEvents = events.filter(event => 
          isSameDay(event.startDate, date) || 
          (event.startDate <= date && event.endDate >= date)
        )
        
        cells.push({ 
          type: 'day', 
          date, 
          day, 
          key: `${month}-day-${day}`,
          events: dayEvents
        })
      }
      
      // Add empty cells after month ends to complete the grid
      const remainingCells = COLUMNS_PER_ROW - cells.length
      for (let i = 0; i < remainingCells; i++) {
        cells.push({ type: 'empty', key: `${month}-after-${i}` })
      }
      
      months.push({
        month,
        name: MONTH_NAMES[month],
        year,
        firstDay,
        lastDay,
        daysInMonth,
        firstDayOfWeek,
        cells
      })
    }
    
    return months
  }, [year, events])

  // Calculate item size for each month
  const getItemSize = useCallback((index: number) => {
    const monthData = monthsData[index]
    if (!monthData) return ESTIMATED_MONTH_HEIGHT
    
    const rows = Math.ceil(monthData.cells.length / 7)
    return MONTH_HEADER_HEIGHT + (rows * CELL_HEIGHT)
  }, [monthsData])

  // Month row renderer
  const MonthRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const monthData = monthsData[index]
    if (!monthData) return null

    // Setup Intersection Observer for lazy loading
    useEffect(() => {
      const monthElement = document.getElementById(`month-${index}`)
      if (!monthElement) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !loadedMonths.current.has(index)) {
              loadedMonths.current.add(index)
              // Trigger any lazy loading logic here
              console.log(`Loading month ${index}`)
            }
          })
        },
        { rootMargin: '100px' }
      )

      observer.observe(monthElement)
      observerRefs.current.set(index, observer)

      return () => {
        observer.disconnect()
        observerRefs.current.delete(index)
      }
    }, [])

    return (
      <div 
        id={`month-${index}`}
        style={style} 
        className="px-4"
        data-month={index}
      >
        {/* Month Header */}
        <div className="flex items-center h-10 mb-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 
            id={`month-heading-${index}`}
            className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            aria-label={getMonthAriaLabel(index, monthData.year)}
          >
            {monthData.name} {monthData.year}
          </h3>
        </div>
        
        {/* Days Grid */}
        <div 
          role="grid"
          aria-labelledby={`month-heading-${index}`}
          className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden"
        >
          {/* Weekday headers row */}
          <div role="row" className="grid grid-cols-7 gap-px">
            {WEEKDAY_ABBREVIATIONS.map((day, i) => (
              <div 
                key={`header-${i}`}
                role="columnheader"
                aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}
                className="bg-neutral-50 dark:bg-neutral-800 text-center py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Day cells grouped by week */}
          {Array.from({ length: Math.ceil(monthData.cells.length / 7) }, (_, weekIndex) => {
            const weekCells = monthData.cells.slice(weekIndex * 7, (weekIndex + 1) * 7)
            // Skip rows that have no cells or only empty cells
            if (weekCells.length === 0 || weekCells.every(cell => cell.type === 'empty')) {
              return null
            }
            return (
              <div key={`week-${weekIndex}`} role="row" className="grid grid-cols-7 gap-px">
                {weekCells.map((cell) => {
            if (cell.type === 'empty') {
              return (
                <div 
                  key={cell.key}
                  role="gridcell"
                  aria-hidden="true"
                  className="bg-neutral-50 dark:bg-neutral-900 h-9"
                />
              )
            }

            const isCurrentDay = cell.date && isToday(cell.date)
            const hasEvents = cell.events && cell.events.length > 0
            const isSelected = cell.date && selectedDate && isSameDay(cell.date, selectedDate)
            const isFocused = cell.date && isSameDay(cell.date, focusedDate)

            return (
              <button
                key={cell.key}
                role="gridcell"
                aria-label={cell.date ? getDayAriaLabel(cell.date, cell.events?.length || 0) : undefined}
                aria-selected={isSelected || undefined}
                aria-current={isCurrentDay ? 'date' : undefined}
                tabIndex={isFocused ? 0 : -1}
                onClick={() => {
                  if (cell.date) {
                    setSelectedDate(cell.date)
                    onDateSelect?.(cell.date)
                    announceToScreenReader(`Selected ${getDayAriaLabel(cell.date, cell.events?.length || 0)}`)
                  }
                }}
                className={cn(
                  "relative h-9 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                  "flex flex-col items-center justify-center p-1",
                  isCurrentDay && "ring-2 ring-blue-500 dark:ring-blue-400",
                  isSelected && "bg-blue-100 dark:bg-blue-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
              >
                <span className={cn(
                  "text-xs",
                  isCurrentDay 
                    ? "font-bold text-blue-600 dark:text-blue-400" 
                    : "text-neutral-700 dark:text-neutral-300"
                )}>
                  {cell.day}
                </span>
                
                {/* Event indicators */}
                {hasEvents && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
                    {cell.events?.slice(0, 3).map((event, i) => (
                      <div
                        key={`${event.id}-${i}`}
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
                    {cell.events && cell.events.length > 3 && (
                      <span className="text-[8px] text-neutral-500 dark:text-neutral-400">
                        +{cell.events.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [monthsData, onDateSelect, onEventClick])

  // Scroll to today on mount
  useEffect(() => {
    const currentMonth = new Date().getMonth()
    if (new Date().getFullYear() === year) {
      listRef.current?.scrollToItem(currentMonth, 'start')
    }
  }, [year])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }

      const currentDate = focusedDate || new Date()
      const newDate = new Date(currentDate)
      let handled = false

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newDate.setDate(currentDate.getDate() - 1)
          handled = true
          break
        case 'ArrowRight':
          e.preventDefault()
          newDate.setDate(currentDate.getDate() + 1)
          handled = true
          break
        case 'ArrowUp':
          e.preventDefault()
          newDate.setDate(currentDate.getDate() - 7)
          handled = true
          break
        case 'ArrowDown':
          e.preventDefault()
          newDate.setDate(currentDate.getDate() + 7)
          handled = true
          break
        case 'PageUp':
          e.preventDefault()
          newDate.setMonth(currentDate.getMonth() - 1)
          handled = true
          break
        case 'PageDown':
          e.preventDefault()
          newDate.setMonth(currentDate.getMonth() + 1)
          handled = true
          break
        case 'Home':
          if (e.ctrlKey) {
            e.preventDefault()
            listRef.current?.scrollToItem(0, 'start')
            newDate.setMonth(0)
            newDate.setDate(1)
            handled = true
          } else {
            e.preventDefault()
            // Go to start of week
            const dayOfWeek = currentDate.getDay()
            newDate.setDate(currentDate.getDate() - dayOfWeek)
            handled = true
          }
          break
        case 'End':
          if (e.ctrlKey) {
            e.preventDefault()
            listRef.current?.scrollToItem(11, 'start')
            newDate.setMonth(11)
            newDate.setDate(31)
            handled = true
          } else {
            e.preventDefault()
            // Go to end of week
            const dayOfWeek = currentDate.getDay()
            newDate.setDate(currentDate.getDate() + (6 - dayOfWeek))
            handled = true
          }
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          setSelectedDate(currentDate)
          onDateSelect?.(currentDate)
          announceToScreenReader(`Selected ${getDayAriaLabel(currentDate, 0)}`)
          handled = true
          break
        case 'Escape':
          e.preventDefault()
          setSelectedDate(null)
          announceToScreenReader('Selection cleared')
          handled = true
          break
      }

      if (handled && newDate.getFullYear() === year) {
        setFocusedDate(newDate)
        // Scroll to the month if needed
        const newMonth = newDate.getMonth()
        listRef.current?.scrollToItem(newMonth, 'auto')
        announceToScreenReader(`Navigated to ${getDayAriaLabel(newDate, 0)}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedDate, year, onDateSelect])

  if (!windowHeight) return null

  return (
    <div 
      className={cn("w-full h-full", className)}
      role="region"
      aria-label="Calendar grid with months of the year"
      tabIndex={0}
      aria-describedby="calendar-instructions"
    >
      <span id="calendar-instructions" className="sr-only">
        Use arrow keys to navigate dates, Enter to select, Page Up/Down to change months
      </span>
      <List
        ref={listRef}
        height={windowHeight}
        itemCount={12}
        itemSize={getItemSize}
        width="100%"
        overscanCount={2}
        className="scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-600"
        outerElementType={React.forwardRef((props, ref) => (
          <div
            {...props}
            ref={ref}
            tabIndex={0}
            aria-label="Scrollable calendar view"
          />
        ))}
      >
        {MonthRow}
      </List>
    </div>
  )
}