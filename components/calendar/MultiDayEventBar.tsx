'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
import { differenceInDays, startOfDay, endOfDay, format } from 'date-fns'

interface MultiDayEventBarProps {
  event: Event
  startColumn: number
  endColumn: number
  row: number
  onEventClick?: (event: Event) => void
  cellWidth?: number
  cellHeight?: number
}

const categoryColors = {
  personal: 'bg-green-500 hover:bg-green-600 text-white',
  work: 'bg-blue-500 hover:bg-blue-600 text-white',
  effort: 'bg-orange-500 hover:bg-orange-600 text-white',
  note: 'bg-purple-500 hover:bg-purple-600 text-white',
} as const

export function MultiDayEventBar({
  event,
  startColumn,
  endColumn,
  row,
  onEventClick,
  cellWidth = 40,
  cellHeight = 36,
}: MultiDayEventBarProps) {
  const width = (endColumn - startColumn + 1) * cellWidth - 4 // -4 for padding
  const left = startColumn * cellWidth + 2 // +2 for padding
  const top = row * 20 + 18 // Position below day number
  
  const duration = differenceInDays(endOfDay(event.endDate), startOfDay(event.startDate)) + 1
  const timeText = duration === 1 
    ? format(event.startDate, 'HH:mm')
    : `${duration}d`

  return (
    <div
      className={cn(
        'absolute z-10 px-1 py-0.5 rounded text-xs font-medium cursor-pointer',
        'transition-all duration-200 shadow-sm hover:shadow-md',
        'truncate flex items-center gap-1',
        categoryColors[event.category as keyof typeof categoryColors] || categoryColors.personal
      )}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: '18px',
      }}
      onClick={(e) => {
        e.stopPropagation()
        onEventClick?.(event)
      }}
      title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
    >
      <span className="truncate flex-1">{event.title}</span>
      <span className="text-[10px] opacity-80">{timeText}</span>
    </div>
  )
}

// Stacking algorithm to prevent overlapping events
export function calculateEventStacks(events: Event[]): Map<Event, number> {
  const stacks = new Map<Event, number>()
  const sortedEvents = [...events].sort((a, b) => {
    // Sort by start date, then by duration (longer events first)
    const startDiff = a.startDate.getTime() - b.startDate.getTime()
    if (startDiff !== 0) return startDiff
    
    const durationA = a.endDate.getTime() - a.startDate.getTime()
    const durationB = b.endDate.getTime() - b.startDate.getTime()
    return durationB - durationA
  })
  
  const occupiedRows: { start: number; end: number; row: number }[] = []
  
  sortedEvents.forEach(event => {
    const eventStart = startOfDay(event.startDate).getTime()
    const eventEnd = endOfDay(event.endDate).getTime()
    
    // Find the first available row
    let row = 0
    let foundRow = false
    
    while (!foundRow) {
      const hasConflict = occupiedRows.some(occupied => 
        occupied.row === row &&
        !(eventEnd < occupied.start || eventStart > occupied.end)
      )
      
      if (!hasConflict) {
        foundRow = true
        occupiedRows.push({ start: eventStart, end: eventEnd, row })
        stacks.set(event, row)
      } else {
        row++
      }
    }
  })
  
  return stacks
}