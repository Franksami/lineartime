"use client"

import type React from "react"
import { useState, useRef } from "react"
import { CanvasToolbar } from "./canvas-toolbar"

interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  category?: string
  lane?: number
  height?: "thin" | "normal" | "thick"
}

interface HorizontalLinearCalendarProps {
  events: Event[]
  onEventsChange: (events: Event[]) => void
  year: number
}

export function HorizontalLinearCalendar({ events, onEventsChange, year }: HorizontalLinearCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState<{ event: Event; handle: "start" | "end" } | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const CELL_WIDTH = 40
  const CELL_HEIGHT = 32
  const ROW_HEIGHT = 120
  const DAYS_IN_WEEK = 7
  const WEEKS_TO_SHOW = 53
  const LANES_PER_ROW = 4
  const LANE_HEIGHT = 24

  const startDate = new Date(year, 0, 1)
  const startDayOfWeek = startDate.getDay()

  const assignEventLanes = (events: Event[]) => {
    const sortedEvents = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const eventsWithLanes = []

    for (const event of sortedEvents) {
      const conflictingEvents = eventsWithLanes.filter(
        (existingEvent) => event.startDate < existingEvent.endDate && event.endDate > existingEvent.startDate,
      )

      const usedLanes = conflictingEvents.map((e) => e.lane || 0)
      let assignedLane = 0

      while (usedLanes.includes(assignedLane)) {
        assignedLane++
      }

      eventsWithLanes.push({
        ...event,
        lane: assignedLane,
        height: event.height || "normal",
      })
    }

    return eventsWithLanes
  }

  const eventsWithLanes = assignEventLanes(events)

  const generateDates = () => {
    const dates = []
    const totalDays = WEEKS_TO_SHOW * DAYS_IN_WEEK

    for (let i = -startDayOfWeek; i < totalDays - startDayOfWeek; i++) {
      const date = new Date(year, 0, 1 + i)
      dates.push(date)
    }
    return dates
  }

  const dates = generateDates()

  const getDatePosition = (date: Date) => {
    const daysSinceStart = Math.floor((date.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24))
    const week = Math.floor(daysSinceStart / DAYS_IN_WEEK)
    const dayInWeek = daysSinceStart % DAYS_IN_WEEK
    return { week, dayInWeek, daysSinceStart }
  }

  const getEventLayout = (event: Event & { lane: number; height: string }) => {
    const startPos = getDatePosition(event.startDate)
    const endPos = getDatePosition(event.endDate)

    const startX = startPos.dayInWeek * CELL_WIDTH
    const endX = endPos.dayInWeek * CELL_WIDTH + CELL_WIDTH

    const eventHeight = event.height === "thin" ? 12 : event.height === "thick" ? 32 : 20
    const laneOffset = event.lane * (LANE_HEIGHT + 2)

    const segments = []

    if (startPos.week === endPos.week) {
      segments.push({
        x: startX,
        y: startPos.week * ROW_HEIGHT + laneOffset + 40,
        width: endX - startX,
        height: eventHeight,
      })
    } else {
      for (let week = startPos.week; week <= endPos.week; week++) {
        let segmentStartX, segmentWidth

        if (week === startPos.week) {
          segmentStartX = startX
          segmentWidth = DAYS_IN_WEEK * CELL_WIDTH - startX
        } else if (week === endPos.week) {
          segmentStartX = 0
          segmentWidth = endX
        } else {
          segmentStartX = 0
          segmentWidth = DAYS_IN_WEEK * CELL_WIDTH
        }

        segments.push({
          x: segmentStartX,
          y: week * ROW_HEIGHT + laneOffset + 40,
          width: segmentWidth,
          height: eventHeight,
        })
      }
    }

    return segments
  }

  const handleEventMouseDown = (e: React.MouseEvent, event: Event) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.detail === 1) {
      setSelectedEvent(event)
    }

    const rect = calendarRef.current?.getBoundingClientRect()
    if (rect) {
      setDraggedEvent(event)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, event: Event, handle: "start" | "end") => {
    e.preventDefault()
    e.stopPropagation()
    setResizing({ event, handle })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!calendarRef.current) return

    const rect = calendarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (draggedEvent && !resizing) {
      const week = Math.floor((y - 40) / ROW_HEIGHT)
      const dayInWeek = Math.floor(x / CELL_WIDTH)
      const newDateIndex = week * DAYS_IN_WEEK + dayInWeek

      if (newDateIndex >= 0 && newDateIndex < dates.length) {
        const newStartDate = new Date(dates[newDateIndex])
        const duration = draggedEvent.endDate.getTime() - draggedEvent.startDate.getTime()
        const newEndDate = new Date(newStartDate.getTime() + duration)

        const updatedEvents = events.map((ev) =>
          ev.id === draggedEvent.id ? { ...ev, startDate: newStartDate, endDate: newEndDate } : ev,
        )
        onEventsChange(updatedEvents)
      }
    } else if (resizing) {
      const week = Math.floor((y - 40) / ROW_HEIGHT)
      const dayInWeek = Math.floor(x / CELL_WIDTH)
      const newDateIndex = week * DAYS_IN_WEEK + dayInWeek

      if (newDateIndex >= 0 && newDateIndex < dates.length) {
        const newDate = new Date(dates[newDateIndex])

        const updatedEvents = events.map((ev) => {
          if (ev.id === resizing.event.id) {
            if (resizing.handle === "start") {
              return { ...ev, startDate: newDate }
            } else {
              return { ...ev, endDate: new Date(newDate.getTime() + 24 * 60 * 60 * 1000) }
            }
          }
          return ev
        })
        onEventsChange(updatedEvents)
      }
    }
  }

  const handleMouseUp = () => {
    setDraggedEvent(null)
    setResizing(null)
  }

  const handleCellClick = (date: Date) => {
    if (selectedEvent || draggedEvent) return

    const newEvent: Event = {
      id: Date.now().toString(),
      title: "New Event",
      startDate: new Date(date),
      endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      color: "#3b82f6",
      height: "normal",
    }

    onEventsChange([...events, newEvent])
    setSelectedEvent(newEvent)
  }

  return (
    <div className="w-full h-full bg-gray-50">
      {selectedEvent && (
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
              height: "normal",
            }
            onEventsChange([...events, newEvent])
            setSelectedEvent(newEvent)
          }}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <div className="p-6">
        <div className="flex mb-6">
          <div className="w-16"></div>
          <div className="flex">
            {Array.from({ length: WEEKS_TO_SHOW }, (_, weekIndex) => {
              const weekStart = new Date(dates[weekIndex * DAYS_IN_WEEK])
              const weekNumber = Math.ceil(
                (weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
              )

              return (
                <div
                  key={weekIndex}
                  className="flex flex-col items-center"
                  style={{ width: DAYS_IN_WEEK * CELL_WIDTH }}
                >
                  <div className="text-xs text-gray-500 mb-2 font-medium">W{Math.max(1, weekNumber)}</div>
                  <div className="flex">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`text-xs font-semibold text-center ${
                          dayIndex === 0 || dayIndex === 6 ? "text-purple-600" : "text-gray-700"
                        }`}
                        style={{ width: CELL_WIDTH }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex">
          <div className="w-16 flex flex-col relative">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const monthStart = new Date(year, monthIndex, 1)
              const monthPos = getDatePosition(monthStart)
              const monthName = monthStart.toLocaleDateString("en-US", { month: "short" })

              return (
                <div
                  key={monthIndex}
                  className="text-sm font-bold text-gray-800 flex items-center justify-end pr-4"
                  style={{
                    position: "absolute",
                    top: monthPos.week * ROW_HEIGHT + 60,
                    height: ROW_HEIGHT,
                  }}
                >
                  {monthName}
                </div>
              )
            })}
          </div>

          <div
            ref={calendarRef}
            className="relative bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden"
            style={{
              width: WEEKS_TO_SHOW * DAYS_IN_WEEK * CELL_WIDTH,
              height: Math.ceil((WEEKS_TO_SHOW * ROW_HEIGHT) / 4) + 40,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {dates.map((date, index) => {
              const week = Math.floor(index / DAYS_IN_WEEK)
              const dayInWeek = index % DAYS_IN_WEEK
              const isWeekend = dayInWeek === 0 || dayInWeek === 6
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`absolute border-r border-b border-gray-200 cursor-pointer hover:bg-blue-50 flex items-start justify-center pt-1 text-xs font-medium transition-colors ${
                    isWeekend ? "bg-purple-50" : "bg-white"
                  } ${isToday ? "bg-blue-100 border-blue-300" : ""} ${
                    date.getFullYear() !== year ? "text-gray-300" : "text-gray-800"
                  }`}
                  style={{
                    left: dayInWeek * CELL_WIDTH,
                    top: Math.floor(week / 4) * ROW_HEIGHT,
                    width: CELL_WIDTH,
                    height: ROW_HEIGHT,
                  }}
                  onClick={() => handleCellClick(date)}
                >
                  {date.getDate()}
                </div>
              )
            })}

            {eventsWithLanes.map((event) => {
              const segments = getEventLayout(event)
              const isSelected = selectedEvent?.id === event.id

              return segments.map((segment, segmentIndex) => (
                <div
                  key={`${event.id}-${segmentIndex}`}
                  className={`absolute rounded-lg cursor-move transition-all duration-200 shadow-sm border border-opacity-20 ${
                    isSelected ? "ring-2 ring-blue-400 ring-opacity-75 shadow-lg" : "hover:shadow-md"
                  } ${draggedEvent?.id === event.id ? "opacity-70 z-50 shadow-xl" : "z-20"}`}
                  style={{
                    left: segment.x + 1,
                    top: segment.y,
                    width: segment.width - 2,
                    height: segment.height,
                    backgroundColor: event.color,
                    borderColor: event.color,
                  }}
                  onMouseDown={(e) => handleEventMouseDown(e, event)}
                >
                  <div className="px-2 py-1 text-white text-xs font-semibold truncate h-full flex items-center">
                    {segmentIndex === 0 ? event.title : ""}
                  </div>

                  {isSelected && segmentIndex === 0 && (
                    <div
                      className="absolute left-0 top-0 w-2 h-full bg-white bg-opacity-80 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity rounded-l-lg"
                      onMouseDown={(e) => handleResizeMouseDown(e, event, "start")}
                    />
                  )}
                  {isSelected && segmentIndex === segments.length - 1 && (
                    <div
                      className="absolute right-0 top-0 w-2 h-full bg-white bg-opacity-80 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity rounded-r-lg"
                      onMouseDown={(e) => handleResizeMouseDown(e, event, "end")}
                    />
                  )}
                </div>
              ))
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
