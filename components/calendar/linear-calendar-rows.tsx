"use client"

import type React from "react"
import { useState, useRef, useMemo, useCallback, memo } from "react"
import { CanvasToolbar } from "./canvas-toolbar"
import { MultiEventToolbar } from "./multi-event-toolbar"
import { PerformanceOverlay } from "./performance-overlay"
import { useAdvancedDragDrop } from "@/hooks/use-advanced-drag-drop"
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor"
import { useObjectPool } from "@/hooks/use-object-pool"

interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  category?: string
}

interface LinearCalendarRowsProps {
  events: Event[]
  onEventsChange: (events: Event[]) => void
  year: number
}

const CalendarGrid = memo(({ year, onCellClick, CELL_HEIGHT, MONTH_ROW_HEIGHT }: any) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const monthsData = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const firstDay = new Date(year, monthIndex, 1)
      const startDayOfWeek = firstDay.getDay()
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

      const grid = []
      for (let i = 0; i < startDayOfWeek; i++) {
        grid.push(null)
      }
      for (let day = 1; day <= daysInMonth; day++) {
        grid.push(new Date(year, monthIndex, day))
      }
      while (grid.length < 35) {
        grid.push(null)
      }

      return { monthName, monthIndex, grid }
    })
  }, [year])

  const createDayHeaders = useMemo(() => {
    const headers = []
    for (let i = 0; i < 5; i++) {
      headers.push(...dayHeaders)
    }
    return headers
  }, [])

  return (
    <>
      {/* Day headers */}
      <div className="flex mb-2">
        <div className="w-20"></div>
        <div className="flex-1 flex">
          {createDayHeaders.map((day, index) => (
            <div
              key={index}
              className="text-xs font-semibold text-muted-foreground text-center"
              style={{ width: `${100 / 35}%` }}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="w-20"></div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {monthsData.map(({ monthName, monthIndex, grid }) => (
          <div key={monthIndex} className="flex border border-border rounded-lg overflow-hidden shadow-sm bg-card">
            <div className="w-20 flex items-center justify-center bg-muted">
              <span className="text-lg font-serif font-bold text-foreground">{monthName}</span>
            </div>

            <div className="flex-1 relative bg-card" style={{ height: MONTH_ROW_HEIGHT }}>
              <div className="flex w-full">
                {grid.map((date: Date | null, cellIndex: number) => {
                  if (!date) {
                    return (
                      <div
                        key={cellIndex}
                        className="border-r border-border bg-muted/30"
                        style={{
                          width: `${100 / 35}%`,
                          height: CELL_HEIGHT,
                        }}
                      />
                    )
                  }

                  const isToday = date.toDateString() === new Date().toDateString()
                  const dayOfWeek = date.getDay()
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                  return (
                    <div
                      key={cellIndex}
                      className={`border-r border-border cursor-pointer hover:bg-primary/10 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        isWeekend ? "bg-muted/20" : "bg-card"
                      } ${isToday ? "bg-accent/20 border-accent text-accent-foreground font-semibold" : "text-card-foreground"}`}
                      style={{
                        width: `${100 / 35}%`,
                        height: CELL_HEIGHT,
                      }}
                      data-date={date.toISOString()}
                      data-month={monthIndex}
                      data-cell={cellIndex}
                      onClick={() => onCellClick(date, monthIndex)}
                    >
                      {date.getDate().toString().padStart(2, "0")}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="w-20 flex items-center justify-center bg-muted">
              <span className="text-lg font-serif font-bold text-foreground">{monthName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom day headers */}
      <div className="flex mt-2">
        <div className="w-20"></div>
        <div className="flex-1 flex">
          {createDayHeaders.map((day, index) => (
            <div
              key={index}
              className="text-xs font-semibold text-muted-foreground text-center"
              style={{ width: `${100 / 35}%` }}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="w-20"></div>
      </div>
    </>
  )
})

CalendarGrid.displayName = "CalendarGrid"

const EventLayer = memo(
  ({ events, year, dragState, onEventMouseDown, onEventTouchStart, handleTouchMove, handleTouchEnd }: any) => {
    const calendarRef = useRef<HTMLDivElement>(null)

    const getEventAbsolutePosition = useCallback(
      (event: Event) => {
        const eventStart = new Date(event.startDate)
        const eventEnd = new Date(event.endDate)

        // Calculate which month and position within that month
        const startMonth = eventStart.getMonth()
        const endMonth = eventEnd.getMonth()

        // For now, handle single-month events (can be extended for multi-month)
        const monthIndex = startMonth
        const firstDay = new Date(year, monthIndex, 1)
        const startDayOfWeek = firstDay.getDay()

        const startDay = eventStart.getDate()
        const endDay =
          eventEnd.getMonth() === monthIndex ? eventEnd.getDate() : new Date(year, monthIndex + 1, 0).getDate()

        const startCellIndex = startDay - 1 + startDayOfWeek
        const endCellIndex = endDay - 1 + startDayOfWeek

        // Calculate absolute position
        const MONTH_ROW_HEIGHT = 60
        const CELL_HEIGHT = 50
        const MONTH_SPACING = 8 // space-y-1
        const HEADER_HEIGHT = 32 // day headers
        const PADDING = 32 // p-8

        const monthRowTop = HEADER_HEIGHT + (MONTH_ROW_HEIGHT + MONTH_SPACING) * monthIndex
        const eventTop = monthRowTop + 25 // offset within month row

        // Calculate horizontal position (accounting for month label width)
        const MONTH_LABEL_WIDTH = 80 // w-20
        const calendarWidth = window.innerWidth - PADDING * 2 - MONTH_LABEL_WIDTH * 2
        const cellWidth = calendarWidth / 35

        const eventLeft = MONTH_LABEL_WIDTH + startCellIndex * cellWidth
        const eventWidth = (endCellIndex - startCellIndex + 1) * cellWidth

        return {
          top: eventTop,
          left: eventLeft,
          width: eventWidth,
          height: 20,
        }
      },
      [year],
    )

    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
        {events.map((event: Event) => {
          const position = getEventAbsolutePosition(event)
          const isSelected = dragState.selectedEvents.has(event.id)
          const isDragged = dragState.draggedEvents.has(event.id)

          return (
            <div
              key={event.id}
              className={`absolute rounded-md cursor-move transition-all duration-200 hover:shadow-lg select-none pointer-events-auto ${
                isSelected ? "ring-2 ring-primary ring-opacity-75 shadow-xl z-[10000] scale-105" : "shadow-md z-[1001]"
              } ${isDragged ? "opacity-80 z-[10001] shadow-2xl" : ""} ${dragState.isMultiSelect && isSelected ? "ring-blue-400" : ""}`}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                height: position.height,
                backgroundColor: event.color,
                transform: isDragged ? `translate(${dragState.dragOffset.x}px, ${dragState.dragOffset.y}px)` : "none",
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => onEventMouseDown(e, event)}
              onTouchStart={(e) => onEventTouchStart(e, event)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(event.id, e)}
              role="button"
              tabIndex={0}
              aria-label={`Event: ${event.title}`}
              aria-selected={isSelected}
            >
              <div className="px-2 text-white text-xs font-semibold truncate h-full flex items-center">
                {event.title}
                {dragState.isMultiSelect && isSelected && (
                  <span className="ml-1 w-2 h-2 bg-white rounded-full opacity-75" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  },
)

EventLayer.displayName = "EventLayer"

export function LinearCalendarRows({ events, onEventsChange, year }: LinearCalendarRowsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const { metrics } = usePerformanceMonitor(events.length)

  const eventPool = useObjectPool(
    () => ({ element: null, data: null }),
    (obj) => {
      obj.element = null
      obj.data = null
    },
    50,
  )

  const {
    dragState,
    containerRef,
    handleItemSelect,
    handleDragStart,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearSelection,
  } = useAdvancedDragDrop(events, onEventsChange, {
    snapToGrid: true,
    multiSelect: true,
    touchSupport: true,
    longPressDuration: 500,
  })

  const CELL_HEIGHT = 50
  const MONTH_ROW_HEIGHT = 60

  const handleEventMouseDown = useCallback(
    (e: React.MouseEvent, event: Event) => {
      e.preventDefault()
      e.stopPropagation()
      handleItemSelect(event.id, e)
      setSelectedEvent(event)
      handleDragStart(event.id, e)
    },
    [handleItemSelect, handleDragStart],
  )

  const handleEventTouchStart = useCallback(
    (e: React.TouchEvent, event: Event) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedEvent(event)
      handleTouchStart(event.id, e)
    },
    [handleTouchStart],
  )

  const handleCellClick = useCallback(
    (date: Date | null, monthIndex: number) => {
      if (!date || dragState.isDragging) return

      if (dragState.selectedEvents.size > 0) {
        clearSelection()
        return
      }

      const newEvent: Event = {
        id: Date.now().toString(),
        title: "New Event",
        startDate: new Date(date),
        endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        color: "#3b82f6",
      }

      onEventsChange([...events, newEvent])
      setSelectedEvent(newEvent)
    },
    [events, onEventsChange, dragState.isDragging, dragState.selectedEvents.size, clearSelection],
  )

  const selectedEvents = useMemo(
    () => events.filter((event) => dragState.selectedEvents.has(event.id)),
    [events, dragState.selectedEvents],
  )

  return (
    <div className="w-full min-h-screen bg-background p-8 relative" ref={containerRef}>
      <button
        onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
        className="fixed top-4 left-4 z-40 text-xs bg-muted text-muted-foreground px-2 py-1 rounded opacity-50 hover:opacity-100"
      >
        Perf: {metrics.fps}fps
      </button>

      <PerformanceOverlay
        metrics={metrics}
        poolStats={eventPool.getPoolStats()}
        onClose={() => setShowPerformanceOverlay(false)}
        visible={showPerformanceOverlay}
      />

      {/* Toolbars */}
      {selectedEvents.length > 1 ? (
        <MultiEventToolbar
          selectedEvents={selectedEvents}
          onBulkUpdate={(eventIds, updates) => {
            const updatedEvents = events.map((event) =>
              eventIds.includes(event.id) ? { ...event, ...updates } : event,
            )
            onEventsChange(updatedEvents)
          }}
          onBulkDelete={(eventIds) => {
            const updatedEvents = events.filter((event) => !eventIds.includes(event.id))
            onEventsChange(updatedEvents)
            clearSelection()
            setSelectedEvent(null)
          }}
          onBulkDuplicate={(eventsToClone) => {
            const newEvents = eventsToClone.map((event) => ({
              ...event,
              id: `${event.id}-copy-${Date.now()}`,
              title: `${event.title} (Copy)`,
              startDate: new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(event.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            }))
            onEventsChange([...events, ...newEvents])
          }}
          onBulkMove={(eventIds, dayOffset) => {
            const updatedEvents = events.map((event) => {
              if (eventIds.includes(event.id)) {
                const newStartDate = new Date(event.startDate)
                const newEndDate = new Date(event.endDate)
                newStartDate.setDate(newStartDate.getDate() + dayOffset)
                newEndDate.setDate(newEndDate.getDate() + dayOffset)
                return { ...event, startDate: newStartDate, endDate: newEndDate }
              }
              return event
            })
            onEventsChange(updatedEvents)
          }}
          onClearSelection={clearSelection}
        />
      ) : selectedEvent && selectedEvents.length <= 1 ? (
        <CanvasToolbar
          selectedEvent={selectedEvent}
          onEventChange={(updatedEvent) => {
            const updatedEvents = events.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
            onEventsChange(updatedEvents)
            setSelectedEvent(updatedEvent)
          }}
          onEventDelete={(eventId) => {
            const updatedEvents = events.filter((ev) => ev.id !== eventId)
            onEventsChange(updatedEvents)
            setSelectedEvent(null)
          }}
          onEventCopy={(event) => {
            const newEvent = {
              ...event,
              id: Date.now().toString(),
              title: `${event.title} (Copy)`,
              startDate: new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(event.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            }
            onEventsChange([...events, newEvent])
          }}
          onNewEvent={() => {
            const today = new Date()
            const newEvent: Event = {
              id: Date.now().toString(),
              title: "New Event",
              startDate: today,
              endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              color: "#3b82f6",
            }
            onEventsChange([...events, newEvent])
            setSelectedEvent(newEvent)
          }}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}

      {/* Calendar Background Layer */}
      <div className="relative">
        <CalendarGrid
          year={year}
          onCellClick={handleCellClick}
          CELL_HEIGHT={CELL_HEIGHT}
          MONTH_ROW_HEIGHT={MONTH_ROW_HEIGHT}
        />

        {/* Floating Event Layer */}
        <EventLayer
          events={events}
          year={year}
          dragState={dragState}
          onEventMouseDown={handleEventMouseDown}
          onEventTouchStart={handleEventTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
        />
      </div>

      {dragState.selectedEvents.size > 1 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg z-50">
          {dragState.selectedEvents.size} events selected
        </div>
      )}
    </div>
  )
}
