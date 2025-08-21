'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, getDaysInMonth, startOfYear, addMonths, getDay, isToday, isSameDay, isWithinInterval, endOfMonth } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { EventModal } from "./EventModal"
import { FilterPanel } from "./FilterPanel"
import { ReflectionModal } from "./ReflectionModal"
import { ZoomControls } from "./ZoomControls"
import { useLinearCalendar } from "@/hooks/useLinearCalendar"
import type { Event } from "@/types/calendar"

interface LinearCalendarVerticalProps {
  initialYear?: number
  className?: string
}

const WEEKDAY_ABBREVIATIONS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLUMNS_PER_ROW = 42 // 6 weeks × 7 days

export function LinearCalendarVertical({ 
  initialYear = new Date().getFullYear(), 
  className 
}: LinearCalendarVerticalProps) {
  const [year, setYear] = React.useState(initialYear)
  const [zoomLevel, setZoomLevel] = React.useState(1)
  
  const {
    events,
    filters,
    selectedDate,
    selectedRange,
    hoveredDate,
    isSelecting,
    viewMode,
    showEventModal,
    showReflectionModal,
    currentEvent,
    handleDateSelect,
    handleEventSave,
    handleEventDelete,
    handleFilterChange,
    setHoveredDate,
    setShowEventModal,
    setShowReflectionModal,
    setCurrentEvent,
    startSelection,
    updateSelection,
    endSelection,
    checkForOverlaps
  } = useLinearCalendar(year)

  const [showFilters, setShowFilters] = React.useState(false)

  // Generate calendar data with empty cells for alignment
  const yearData = React.useMemo(() => {
    const months = []
    const yearStart = startOfYear(new Date(year, 0, 1))
    
    for (let month = 0; month < 12; month++) {
      const monthDate = addMonths(yearStart, month)
      const firstDay = new Date(year, month, 1)
      const lastDay = endOfMonth(firstDay)
      const daysInMonth = getDaysInMonth(monthDate)
      const firstDayOfWeek = getDay(firstDay) // 0 = Sunday, 6 = Saturday
      const lastDayOfWeek = getDay(lastDay)
      
      // Calculate empty cells needed
      const emptyCellsBefore = firstDayOfWeek // Empty cells before month starts
      const emptyCellsAfter = 6 - lastDayOfWeek // Empty cells after month ends
      
      // Generate all cells for the month row
      const cells = []
      
      // Add empty cells before month starts
      for (let i = 0; i < emptyCellsBefore; i++) {
        cells.push({ type: 'empty', key: `${month}-before-${i}` })
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        cells.push({ 
          type: 'day', 
          date, 
          day, 
          key: `${month}-day-${day}` 
        })
      }
      
      // Add empty cells after month ends
      for (let i = 0; i < emptyCellsAfter; i++) {
        cells.push({ type: 'empty', key: `${month}-after-${i}` })
      }
      
      months.push({
        month,
        name: MONTH_NAMES[month],
        cells,
        totalCells: cells.length
      })
    }
    
    return months
  }, [year])

  // Handle global mouse up for range selection
  React.useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting) {
        endSelection()
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [isSelecting, endSelection])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDate || showEventModal || showReflectionModal) return
      
      let newDate: Date | null = null
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            setYear(year - 1)
          } else {
            newDate = new Date(selectedDate)
            newDate.setDate(selectedDate.getDate() - 1)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            setYear(year + 1)
          } else {
            newDate = new Date(selectedDate)
            newDate.setDate(selectedDate.getDate() + 1)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          newDate = new Date(selectedDate)
          newDate.setMonth(selectedDate.getMonth() - 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          newDate = new Date(selectedDate)
          newDate.setMonth(selectedDate.getMonth() + 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          setShowEventModal(true)
          break
      }
      
      if (newDate && newDate.getFullYear() === year) {
        handleDateSelect(newDate)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedDate, year, handleDateSelect, setShowEventModal, showEventModal, showReflectionModal, setYear])

  // Zoom controls
  const handleZoomIn = React.useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 2))
  }, [])
  
  const handleZoomOut = React.useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.7))
  }, [])
  
  const handleZoomReset = React.useCallback(() => {
    setZoomLevel(1)
  }, [])

  // Keyboard shortcuts for zoom
  React.useEffect(() => {
    const handleZoomKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !showEventModal && !showReflectionModal) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            handleZoomIn()
            break
          case '-':
            e.preventDefault()
            handleZoomOut()
            break
          case '0':
            e.preventDefault()
            handleZoomReset()
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleZoomKeys)
    return () => document.removeEventListener('keydown', handleZoomKeys)
  }, [handleZoomIn, handleZoomOut, handleZoomReset, showEventModal, showReflectionModal])

  // Filter events based on active filters
  const filterEvents = (eventsList: Event[]): Event[] => {
    return eventsList.filter(event => {
      switch (event.category) {
        case 'personal':
          return filters.personal
        case 'work':
          return filters.work
        case 'effort':
          return filters.efforts
        case 'note':
          return filters.notes
        default:
          return true
      }
    })
  }

  // Generate repeating weekday headers
  const generateWeekHeaders = () => {
    const headers = []
    // Generate 6 weeks worth of headers
    for (let i = 0; i < 6; i++) {
      headers.push(...WEEKDAY_ABBREVIATIONS)
    }
    return headers
  }

  const weekHeaders = generateWeekHeaders()

  return (
    <div className={cn("fixed inset-0 flex flex-col bg-background overflow-hidden", className)}>
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setYear(year - 1)}
            className="h-7 w-7 p-0"
            title="Previous Year (Shift + ←)"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <h1 className="text-lg font-bold min-w-[60px] text-center">
            {year} Linear Calendar
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setYear(year + 1)}
            className="h-7 w-7 p-0"
            title="Next Year (Shift + →)"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setYear(new Date().getFullYear())
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 h-7"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs italic hidden lg:block">Life is bigger than a week.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-7 text-xs px-2"
          >
            Filters
          </Button>
          <Button
            size="sm"
            onClick={() => setShowReflectionModal(true)}
            className="h-7 text-xs px-2"
          >
            Reflect
          </Button>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Zoom Controls */}
        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />
        
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div 
            className="min-h-full flex flex-col"
            style={{ 
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / zoomLevel}%`,
              height: `${100 / zoomLevel}%`
            }}
          >
            {/* Top Week Headers */}
            <div className="grid grid-cols-[auto_1fr_auto] sticky top-0 z-10 bg-background border-b">
              <div className="w-12" />
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLUMNS_PER_ROW}, 1fr)` }}>
                {weekHeaders.map((day, idx) => (
                  <div 
                    key={`top-header-${idx}`} 
                    className="text-center text-xs text-muted-foreground py-1 border-r border-border"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="w-12" />
            </div>

            {/* Month Rows */}
            <div className="flex-1 flex flex-col">
              {yearData.map((monthData) => (
                <div 
                  key={monthData.month} 
                  className="flex-1 grid grid-cols-[auto_1fr_auto] border-b min-h-0"
                >
                  {/* Left Month Label */}
                  <div className="w-12 flex items-center justify-center font-medium text-sm bg-background sticky left-0 z-10 border-r">
                    {monthData.name}
                  </div>
                  
                  {/* Day Cells */}
                  <div 
                    className="grid" 
                    style={{ gridTemplateColumns: `repeat(${COLUMNS_PER_ROW}, 1fr)` }}
                  >
                    {/* Pad with empty cells if month has fewer than 42 cells */}
                    {Array.from({ length: COLUMNS_PER_ROW }).map((_, idx) => {
                      const cell = monthData.cells[idx]
                      
                      if (!cell || cell.type === 'empty') {
                        return (
                          <div 
                            key={`empty-${monthData.month}-${idx}`} 
                            className="border-r border-border"
                          />
                        )
                      }
                      
                      const date = cell.date!
                      const dateEvents = filterEvents(
                        events.filter(e => {
                          const eventStart = new Date(e.startDate)
                          const eventEnd = new Date(e.endDate)
                          return isWithinInterval(date, { start: eventStart, end: eventEnd })
                        })
                      )
                      
                      const isSelected = selectedDate && isSameDay(date, selectedDate)
                      const isInRange = selectedRange && isWithinInterval(date, {
                        start: selectedRange.from,
                        end: selectedRange.to
                      })
                      const isHovered = hoveredDate && isSameDay(date, hoveredDate)
                      const todayCell = isToday(date)
                      
                      return (
                        <button
                          key={cell.key}
                          className={cn(
                            "relative flex items-center justify-center border-r border-border transition-all",
                            "hover:bg-muted/50 hover:z-10",
                            todayCell && "bg-orange-500/30 ring-1 ring-orange-500 ring-inset",
                            isSelected && !todayCell && "ring-1 ring-primary ring-inset bg-primary/10",
                            isInRange && !isSelected && !todayCell && "bg-primary/5",
                            isHovered && !isSelected && !todayCell && "bg-muted/30",
                            dateEvents.length > 0 && "font-semibold"
                          )}
                          onMouseDown={() => startSelection(date)}
                          onMouseEnter={() => {
                            setHoveredDate(date)
                            if (isSelecting) {
                              updateSelection(date)
                            }
                          }}
                          onMouseLeave={() => setHoveredDate(null)}
                          onClick={() => {
                            if (!isSelecting) {
                              handleDateSelect(date)
                              if (dateEvents.length === 0) {
                                setShowEventModal(true)
                              }
                            }
                          }}
                        >
                          <span className={cn(
                            "text-sm font-medium",
                            todayCell && "text-orange-100 font-bold",
                            isSelected && !todayCell && "text-primary font-semibold",
                            !todayCell && !isSelected && "text-zinc-200"
                          )}>
                            {String(cell.day).padStart(2, '0')}
                          </span>
                          
                          {/* Event indicators */}
                          {dateEvents.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 flex">
                              {dateEvents.slice(0, 3).map((event, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1"
                                  style={{ 
                                    backgroundColor: event.category === 'personal' ? '#4CAF50' :
                                                   event.category === 'work' ? '#2196F3' :
                                                   event.category === 'effort' ? '#FF9800' : '#9C27B0'
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Overlap warning */}
                          {dateEvents.length > 2 && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Right Month Label */}
                  <div className="w-12 flex items-center justify-center font-medium text-sm bg-background sticky right-0 z-10 border-l">
                    {monthData.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Week Headers */}
            <div className="grid grid-cols-[auto_1fr_auto] sticky bottom-0 z-10 bg-background border-t">
              <div className="w-12" />
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLUMNS_PER_ROW}, 1fr)` }}>
                {weekHeaders.map((day, idx) => (
                  <div 
                    key={`bottom-header-${idx}`} 
                    className="text-center text-xs text-muted-foreground py-1 border-r border-border"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="w-12" />
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            viewOptions={{
              showWeekends: true,
              showToday: true,
              compactMode: viewMode === 'compact'
            }}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      {/* Modals */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={currentEvent}
        selectedDate={selectedDate}
        selectedRange={selectedRange}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        checkOverlaps={checkForOverlaps}
      />

      <ReflectionModal
        open={showReflectionModal}
        onOpenChange={setShowReflectionModal}
        events={events}
        year={year}
      />
    </div>
  )
}