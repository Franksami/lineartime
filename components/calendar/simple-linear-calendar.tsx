"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CanvasToolbar } from "./canvas-toolbar"

interface SimpleEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
}

interface SimpleLinearCalendarProps {
  year?: number
  events?: SimpleEvent[]
  className?: string
  onEventUpdate?: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onEventChange?: (eventId: string, updates: Partial<SimpleEvent>) => void
  onEventDelete?: (eventId: string) => void
  onEventCreate?: () => void
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function SimpleLinearCalendar({
  year = new Date().getFullYear(),
  events = [],
  className,
  onEventUpdate,
  onEventChange,
  onEventDelete,
  onEventCreate,
}: SimpleLinearCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<SimpleEvent | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [resizeMode, setResizeMode] = useState<{ eventId: string; mode: "start" | "end" } | null>(null)
  const [resizeOverDate, setResizeOverDate] = useState<string | null>(null)

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, SimpleEvent[]>()

    events.forEach((event) => {
      const startDate = formatDate(event.startDate)
      const endDate = formatDate(event.endDate)

      // Handle single day and multi-day events
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDate(d)
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(event)
      }
    })

    return map
  }, [events])

  // Get selected event object
  const selectedEventObj = useMemo(() => {
    return selectedEvent ? events.find((e) => e.id === selectedEvent) || null : null
  }, [selectedEvent, events])

  const handleDragStart = useCallback((e: React.DragEvent, event: SimpleEvent) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", event.id)

    // Create a custom drag image
    const dragElement = e.currentTarget as HTMLElement
    const rect = dragElement.getBoundingClientRect()
    e.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
    setDragOverDate(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverDate(dateKey)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dateKey: string) => {
      e.preventDefault()

      if (!draggedEvent) return

      const newDate = new Date(dateKey)
      const originalStart = draggedEvent.startDate
      const originalEnd = draggedEvent.endDate
      const duration = originalEnd.getTime() - originalStart.getTime()

      const newStartDate = new Date(newDate)
      const newEndDate = new Date(newDate.getTime() + duration)

      onEventUpdate?.(draggedEvent.id, newStartDate, newEndDate)

      setDraggedEvent(null)
      setDragOverDate(null)
    },
    [draggedEvent, onEventUpdate],
  )

  const handleResizeStart = useCallback((e: React.DragEvent, event: SimpleEvent, mode: "start" | "end") => {
    e.stopPropagation()
    setResizeMode({ eventId: event.id, mode })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", `resize-${event.id}-${mode}`)
  }, [])

  const handleResizeEnd = useCallback(() => {
    setResizeMode(null)
    setResizeOverDate(null)
  }, [])

  const handleResizeOver = useCallback(
    (e: React.DragEvent, dateKey: string) => {
      e.preventDefault()
      if (resizeMode) {
        e.dataTransfer.dropEffect = "move"
        setResizeOverDate(dateKey)
      }
    },
    [resizeMode],
  )

  const handleResizeDrop = useCallback(
    (e: React.DragEvent, dateKey: string) => {
      e.preventDefault()

      if (!resizeMode) return

      const event = events.find((e) => e.id === resizeMode.eventId)
      if (!event) return

      const newDate = new Date(dateKey)

      let newStartDate = event.startDate
      let newEndDate = event.endDate

      if (resizeMode.mode === "start") {
        newStartDate = newDate
        // Ensure start date is not after end date
        if (newStartDate > event.endDate) {
          newStartDate = event.endDate
        }
      } else {
        newEndDate = newDate
        // Ensure end date is not before start date
        if (newEndDate < event.startDate) {
          newEndDate = event.startDate
        }
      }

      onEventUpdate?.(event.id, newStartDate, newEndDate)

      setResizeMode(null)
      setResizeOverDate(null)
    },
    [resizeMode, events, onEventUpdate],
  )

  const handleEventDuplicate = useCallback(
    (event: SimpleEvent) => {
      if (onEventCreate) {
        // Create a new event with similar properties but different dates
        const newStartDate = new Date(event.endDate)
        newStartDate.setDate(newStartDate.getDate() + 1)
        const duration = event.endDate.getTime() - event.startDate.getTime()
        const newEndDate = new Date(newStartDate.getTime() + duration)

        // This would need to be handled by the parent component
        onEventCreate()
      }
    },
    [onEventCreate],
  )

  const handleToolbarEventUpdate = useCallback(
    (eventId: string, updates: Partial<SimpleEvent>) => {
      if (onEventChange) {
        onEventChange(eventId, updates)
      }
    },
    [onEventChange],
  )

  const handleToolbarEventDelete = useCallback(
    (eventId: string) => {
      if (onEventDelete) {
        onEventDelete(eventId)
        setSelectedEvent(null)
      }
    },
    [onEventDelete],
  )

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(year, monthIndex)
    const firstDay = getFirstDayOfMonth(year, monthIndex)
    const today = formatDate(new Date())

    return (
      <div key={monthIndex} className="flex border-b border-border min-h-[140px] bg-card shadow-sm">
        {/* Month label */}
        <div className="flex items-center justify-center w-16 bg-muted text-muted-foreground font-montserrat font-bold text-sm border-r border-border">
          <div className="transform -rotate-90 whitespace-nowrap tracking-wide">{MONTH_NAMES[monthIndex]}</div>
        </div>

        {/* Days grid */}
        <div className="flex flex-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="flex-1 border-r border-border bg-muted/30 min-w-[50px]" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, dayIndex) => {
            const day = dayIndex + 1
            const date = new Date(year, monthIndex, day)
            const dateKey = formatDate(date)
            const dayEvents = eventsByDate.get(dateKey) || []
            const isSelected = selectedDate === dateKey
            const isToday = dateKey === today
            const isDragOver = dragOverDate === dateKey
            const isResizeOver = resizeOverDate === dateKey

            return (
              <div
                key={day}
                className={cn(
                  "flex-1 border-r border-border cursor-pointer transition-all duration-200 relative min-w-[50px] p-2",
                  "hover:bg-accent/10 hover:shadow-sm",
                  isSelected && "bg-primary/5 border-primary/30 shadow-md",
                  isToday && "bg-secondary/10 border-secondary/30",
                  isDragOver && "bg-chart-2/20 border-chart-2/50 shadow-lg",
                  isResizeOver && "bg-chart-3/20 border-chart-3/50 shadow-lg",
                )}
                onClick={() => setSelectedDate(dateKey)}
                onDragOver={(e) => {
                  handleDragOver(e, dateKey)
                  handleResizeOver(e, dateKey)
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  handleDrop(e, dateKey)
                  handleResizeDrop(e, dateKey)
                }}
              >
                {/* Day number */}
                <div
                  className={cn(
                    "text-sm font-montserrat font-semibold mb-2 leading-none",
                    isToday && "text-secondary font-black",
                    isSelected && "text-primary",
                  )}
                >
                  {day}
                </div>

                {/* Events */}
                <div className="space-y-1.5">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => {
                    const isEventSelected = selectedEvent === event.id
                    const isFirstDay = formatDate(event.startDate) === dateKey
                    const isLastDay = formatDate(event.endDate) === dateKey

                    return (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(selectedEvent === event.id ? null : event.id)
                        }}
                        className={cn(
                          "relative px-2 py-1.5 rounded-md text-xs font-open-sans font-medium text-white truncate cursor-move transition-all duration-200 group shadow-sm",
                          "hover:opacity-90 hover:scale-[1.02] hover:shadow-md",
                          isEventSelected && "ring-2 ring-white/60 scale-[1.02] shadow-lg",
                          draggedEvent?.id === event.id && "opacity-40 scale-95",
                        )}
                        style={{ backgroundColor: event.color }}
                        title={event.title}
                      >
                        {isEventSelected && isFirstDay && (
                          <div
                            draggable
                            onDragStart={(e) => handleResizeStart(e, event, "start")}
                            onDragEnd={handleResizeEnd}
                            className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/60 cursor-w-resize opacity-0 group-hover:opacity-100 hover:bg-white/90 transition-all duration-200 rounded-l-md"
                            title="Resize start date"
                          />
                        )}

                        {isEventSelected && isLastDay && (
                          <div
                            draggable
                            onDragStart={(e) => handleResizeStart(e, event, "end")}
                            onDragEnd={handleResizeEnd}
                            className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/60 cursor-e-resize opacity-0 group-hover:opacity-100 hover:bg-white/90 transition-all duration-200 rounded-r-md"
                            title="Resize end date"
                          />
                        )}

                        <span className="relative z-10 leading-tight">{event.title}</span>
                      </div>
                    )
                  })}

                  {/* More events indicator */}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground font-open-sans font-medium px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty cells for days after month ends */}
          {Array.from({ length: 6 - ((firstDay + daysInMonth - 1) % 7) }, (_, i) => (
            <div key={`empty-end-${i}`} className="flex-1 border-r border-border bg-muted/30 min-w-[50px]" />
          ))}
        </div>

        {/* Month label (right side) */}
        <div className="flex items-center justify-center w-16 bg-muted text-muted-foreground font-montserrat font-bold text-sm border-l border-border">
          <div className="transform rotate-90 whitespace-nowrap tracking-wide">{MONTH_NAMES[monthIndex]}</div>
        </div>
      </div>
    )
  }

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className={cn("w-full relative bg-background", className)}>
      {/* Canvas Toolbar */}
      <CanvasToolbar
        selectedEvent={selectedEventObj}
        onEventUpdate={handleToolbarEventUpdate}
        onEventDelete={handleToolbarEventDelete}
        onEventDuplicate={handleEventDuplicate}
        onCreateEvent={onEventCreate}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card shadow-sm">
        <h1 className="text-3xl font-montserrat font-black text-foreground tracking-tight">{year}</h1>
        <div className="flex items-center gap-6">
          <div className="text-sm font-open-sans font-medium text-muted-foreground">{events.length} events</div>
          {selectedEvent && (
            <div className="text-xs font-open-sans font-medium text-secondary bg-secondary/10 px-3 py-1 rounded-full">
              Drag events to move • Drag edges to resize
            </div>
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="flex border-b-2 border-border bg-muted/50 shadow-sm">
        <div className="w-16 border-r border-border" />
        {DAY_NAMES.map((dayName) => (
          <div
            key={dayName}
            className="flex-1 flex items-center justify-center text-xs font-montserrat font-bold text-muted-foreground border-r border-border py-3 min-w-[50px] tracking-wider"
          >
            {dayName}
          </div>
        ))}
        <div className="w-16 border-l border-border" />
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-lg">
        {Array.from({ length: 12 }, (_, monthIndex) => renderMonth(monthIndex))}
      </div>

      {/* Day headers (bottom) */}
      <div className="flex border-t-2 border-border bg-muted/50 shadow-sm">
        <div className="w-16 border-r border-border" />
        {DAY_NAMES.map((dayName) => (
          <div
            key={`bottom-${dayName}`}
            className="flex-1 flex items-center justify-center text-xs font-montserrat font-bold text-muted-foreground border-r border-border py-3 min-w-[50px] tracking-wider"
          >
            {dayName}
          </div>
        ))}
        <div className="w-16 border-l border-border" />
      </div>
    </div>
  )
}
