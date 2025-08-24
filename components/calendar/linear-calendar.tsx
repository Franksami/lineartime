"use client"

import { useState, useCallback } from "react"
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns"
import { cn } from "@/lib/utils"
import {
  type CalendarEvent,
  type ZoomLevel,
  MONTH_NAMES,
  DAY_NAMES,
  CATEGORY_COLORS,
  type EventFilters,
} from "@/components/ui/calendar"
import { useCalendarDimensions } from "@/hooks/use-calendar-dimensions"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import { CalendarHeader } from "./calendar-header"
import { EventModal } from "./event-modal"

interface LinearCalendarProps {
  year?: number
  events?: CalendarEvent[]
  className?: string
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventCreate?: (event: Partial<CalendarEvent>) => void
  onEventUpdate?: (id: string, updates: Partial<CalendarEvent>) => void
  onEventDelete?: (id: string) => void
}

export function LinearCalendar({
  year = new Date().getFullYear(),
  events = [],
  className,
  onDateSelect,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
}: LinearCalendarProps) {
  // State management
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("year")
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<EventFilters>({
    categories: new Set(),
    priorities: new Set(),
    statuses: new Set(),
    tags: new Set(),
    attendees: new Set(),
    dateRange: null,
    searchQuery: "",
  })
  const [eventModalState, setEventModalState] = useState({
    isOpen: false,
    mode: "create" as "create" | "edit" | "view",
    event: null as CalendarEvent | null,
    date: null as Date | null,
  })

  // Custom hooks
  const dimensions = useCalendarDimensions(zoomLevel)
  const { filteredEvents, eventsByDate } = useCalendarEvents(events, filters)

  // Event handlers
  const handleDateSelect = useCallback(
    (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd")
      setSelectedDates((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(dateKey)) {
          newSet.delete(dateKey)
        } else {
          newSet.add(dateKey)
        }
        return newSet
      })
      onDateSelect?.(date)
    },
    [onDateSelect],
  )

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      setEventModalState({
        isOpen: true,
        mode: "edit",
        event,
        date: new Date(event.startDate),
      })
      onEventClick?.(event)
    },
    [onEventClick],
  )

  const handleDateDoubleClick = useCallback((date: Date) => {
    setEventModalState({
      isOpen: true,
      mode: "create",
      event: null,
      date,
    })
  }, [])

  // Render month row
  const renderMonthRow = useCallback(
    (monthIndex: number) => {
      const monthDate = new Date(year, monthIndex, 1)
      const daysInMonth = getDaysInMonth(monthDate)
      const startDay = getDay(startOfMonth(monthDate))

      return (
        <div key={monthIndex} className="flex border-b border-border" style={{ height: dimensions.monthHeight }}>
          {/* Month label */}
          <div className="flex items-center justify-center w-16 bg-muted text-muted-foreground font-medium text-sm border-r border-border">
            {MONTH_NAMES[monthIndex]}
          </div>

          {/* Days grid */}
          <div className="flex flex-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDay }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="border-r border-border bg-muted/30"
                style={{ width: dimensions.dayWidth }}
              />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, dayIndex) => {
              const day = dayIndex + 1
              const date = new Date(year, monthIndex, day)
              const dateKey = format(date, "yyyy-MM-dd")
              const dayEvents = eventsByDate.get(dateKey) || []
              const isSelected = selectedDates.has(dateKey)
              const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
              const isHovered = hoveredDate && format(hoveredDate, "yyyy-MM-dd") === dateKey

              return (
                <div
                  key={day}
                  className={cn(
                    "relative border-r border-border cursor-pointer transition-colors",
                    "hover:bg-accent/50",
                    isSelected && "bg-primary/10 border-primary",
                    isToday && "bg-blue-50 dark:bg-blue-950/30",
                    isHovered && "bg-accent",
                  )}
                  style={{ width: dimensions.dayWidth }}
                  onClick={() => handleDateSelect(date)}
                  onDoubleClick={() => handleDateDoubleClick(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  {/* Day number */}
                  <div
                    className={cn(
                      "absolute top-1 left-1 text-xs font-medium",
                      isToday && "text-blue-600 dark:text-blue-400 font-bold",
                    )}
                  >
                    {day}
                  </div>

                  {/* Events */}
                  <div className="absolute inset-0 pt-5 px-1 overflow-hidden">
                    {dayEvents.slice(0, Math.floor((dimensions.monthHeight - 20) / 16)).map((event, eventIndex) => (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className="mb-1 px-1 py-0.5 rounded text-xs text-white cursor-pointer hover:opacity-80 truncate"
                        style={{
                          backgroundColor: CATEGORY_COLORS[event.category],
                          fontSize: Math.max(8, dimensions.dayWidth / 8),
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}

                    {/* More events indicator */}
                    {dayEvents.length > Math.floor((dimensions.monthHeight - 20) / 16) && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - Math.floor((dimensions.monthHeight - 20) / 16)} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Empty cells for days after month ends */}
            {Array.from({ length: 6 - ((startDay + daysInMonth - 1) % 7) }, (_, i) => (
              <div
                key={`empty-end-${i}`}
                className="border-r border-border bg-muted/30"
                style={{ width: dimensions.dayWidth }}
              />
            ))}
          </div>

          {/* Month label (right side) */}
          <div className="flex items-center justify-center w-16 bg-muted text-muted-foreground font-medium text-sm border-l border-border">
            {MONTH_NAMES[monthIndex]}
          </div>
        </div>
      )
    },
    [
      year,
      dimensions,
      eventsByDate,
      selectedDates,
      hoveredDate,
      handleDateSelect,
      handleEventClick,
      handleDateDoubleClick,
    ],
  )

  return (
    <div className={cn("linear-calendar w-full", className)}>
      {/* Header */}
      <CalendarHeader
        year={year}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        eventCount={filteredEvents.length}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Day headers */}
      <div className="flex border-b-2 border-border bg-muted/50">
        <div className="w-16 border-r border-border" />
        {DAY_NAMES.map((dayName, index) => (
          <div
            key={dayName}
            className="flex items-center justify-center text-xs font-medium text-muted-foreground border-r border-border"
            style={{ width: dimensions.dayWidth }}
          >
            {dayName}
          </div>
        ))}
        <div className="w-16 border-l border-border" />
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        {Array.from({ length: 12 }, (_, monthIndex) => renderMonthRow(monthIndex))}
      </div>

      {/* Day headers (bottom) */}
      <div className="flex border-t-2 border-border bg-muted/50">
        <div className="w-16 border-r border-border" />
        {DAY_NAMES.map((dayName, index) => (
          <div
            key={`bottom-${dayName}`}
            className="flex items-center justify-center text-xs font-medium text-muted-foreground border-r border-border"
            style={{ width: dimensions.dayWidth }}
          >
            {dayName}
          </div>
        ))}
        <div className="w-16 border-l border-border" />
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={eventModalState.isOpen}
        mode={eventModalState.mode}
        event={eventModalState.event}
        date={eventModalState.date}
        onClose={() => setEventModalState((prev) => ({ ...prev, isOpen: false }))}
        onCreate={onEventCreate}
        onUpdate={onEventUpdate}
        onDelete={onEventDelete}
      />
    </div>
  )
}
