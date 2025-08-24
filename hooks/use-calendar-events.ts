"use client"

import { useMemo } from "react"
import type { CalendarEvent, EventFilters } from "@/components/ui/calendar"
import { format, isWithinInterval } from "date-fns"

export function useCalendarEvents(events: CalendarEvent[], filters: EventFilters) {
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Category filter
      if (filters.categories.size > 0 && !filters.categories.has(event.category)) {
        return false
      }

      // Priority filter
      if (filters.priorities.size > 0 && !filters.priorities.has(event.priority)) {
        return false
      }

      // Status filter
      if (filters.statuses.size > 0 && !filters.statuses.has(event.status)) {
        return false
      }

      // Date range filter
      if (filters.dateRange) {
        const eventStart = new Date(event.startDate)
        const eventEnd = new Date(event.endDate)
        const filterStart = filters.dateRange.start
        const filterEnd = filters.dateRange.end

        if (
          !isWithinInterval(eventStart, { start: filterStart, end: filterEnd }) &&
          !isWithinInterval(eventEnd, { start: filterStart, end: filterEnd })
        ) {
          return false
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const searchableText = [event.title, event.description || "", ...event.tags, event.location?.name || ""]
          .join(" ")
          .toLowerCase()

        if (!searchableText.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [events, filters])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    filteredEvents.forEach((event) => {
      const startDate = format(new Date(event.startDate), "yyyy-MM-dd")
      const endDate = format(new Date(event.endDate), "yyyy-MM-dd")

      // Handle multi-day events
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = format(d, "yyyy-MM-dd")
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(event)
      }
    })

    return map
  }, [filteredEvents])

  return {
    filteredEvents,
    eventsByDate,
    totalEvents: filteredEvents.length,
  }
}
