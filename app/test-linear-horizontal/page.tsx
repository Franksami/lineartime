'use client'

import { useState } from 'react'
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal'
import type { Event } from '@/types/calendar'
import { addDays, startOfMonth, addMonths } from 'date-fns'

// Generate test events with multi-day spans
function generateTestEvents(): Event[] {
  const events: Event[] = []
  const baseDate = startOfMonth(new Date())
  const year = baseDate.getFullYear()
  
  // Events across different months
  events.push({
    id: 'event-1',
    title: 'Q1 Planning',
    description: 'Quarterly planning session',
    startDate: new Date(year, 0, 15), // Jan 15
    endDate: new Date(year, 0, 17),   // Jan 17
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-2',
    title: 'Winter Vacation',
    description: 'Family vacation',
    startDate: new Date(year, 1, 10), // Feb 10
    endDate: new Date(year, 1, 25),   // Feb 25
    category: 'personal',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-3',
    title: 'Product Launch',
    description: 'New product launch',
    startDate: new Date(year, 2, 1),  // Mar 1
    endDate: new Date(year, 2, 3),    // Mar 3
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-4',
    title: 'Spring Break',
    description: 'Spring vacation',
    startDate: new Date(year, 3, 5),  // Apr 5
    endDate: new Date(year, 3, 15),   // Apr 15
    category: 'personal',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-5',
    title: 'Training Program',
    description: 'Professional development',
    startDate: new Date(year, 4, 10), // May 10
    endDate: new Date(year, 4, 20),   // May 20
    category: 'effort',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-6',
    title: 'Summer Project',
    description: 'Major project deadline',
    startDate: new Date(year, 5, 1),  // Jun 1
    endDate: new Date(year, 7, 31),   // Aug 31
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-7',
    title: 'Annual Conference',
    description: 'Industry conference',
    startDate: new Date(year, 8, 15), // Sep 15
    endDate: new Date(year, 8, 18),   // Sep 18
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'event-8',
    title: 'Holiday Season',
    description: 'Holiday preparations',
    startDate: new Date(year, 11, 20), // Dec 20
    endDate: new Date(year, 11, 31),   // Dec 31
    category: 'personal',
    isRecurring: false,
  })
  
  // Add some single-day events
  for (let month = 0; month < 12; month++) {
    events.push({
      id: `monthly-${month}`,
      title: `Monthly Review`,
      description: 'Monthly team review',
      startDate: new Date(year, month, 28),
      endDate: new Date(year, month, 28),
      category: 'note',
      isRecurring: false,
    })
  }
  
  return events
}

export default function TestLinearHorizontalPage() {
  const [events, setEvents] = useState(generateTestEvents())
  const currentYear = new Date().getFullYear()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-2">
        <h1 className="text-2xl font-bold">{currentYear} Linear Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Life is bigger than a week
        </p>
        
        {/* Info Panel */}
        <div className="mt-2 flex gap-4 text-xs">
          {selectedDate && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Selected:</span>
              <span>{selectedDate.toLocaleDateString()}</span>
            </div>
          )}
          {selectedEvent && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Event:</span>
              <span>{selectedEvent.title}</span>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-2 flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            Personal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            Work
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            Effort
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            Note
          </span>
        </div>
        
        {/* Instructions */}
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Use Ctrl/Cmd + Scroll to zoom • Click and drag to pan • Click on days to select
        </div>
      </div>
      
      {/* Calendar */}
      <div className="flex-1 overflow-hidden">
        <LinearCalendarHorizontal
          year={currentYear}
          events={events}
          onDateSelect={(date) => {
            setSelectedDate(date)
            console.log('Date selected:', date)
          }}
          onEventClick={(event) => {
            setSelectedEvent(event)
            console.log('Event clicked:', event)
          }}
          onEventUpdate={(event) => {
            setEvents(prev => prev.map(e => e.id === event.id ? event : e))
            console.log('Event updated:', event)
          }}
          enableInfiniteCanvas={true}
        />
      </div>
    </div>
  )
}