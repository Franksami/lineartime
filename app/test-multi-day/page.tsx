'use client'

import { HybridCalendar } from '@/components/calendar/HybridCalendar'
import type { Event } from '@/types/calendar'
import { addDays, startOfMonth, addMonths } from 'date-fns'

// Generate test events with multi-day spans
function generateTestEvents(): Event[] {
  const events: Event[] = []
  const baseDate = startOfMonth(new Date())
  
  // Single day events
  events.push({
    id: 'single-1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    startDate: addDays(baseDate, 5),
    endDate: addDays(baseDate, 5),
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'single-2',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    startDate: addDays(baseDate, 12),
    endDate: addDays(baseDate, 12),
    category: 'personal',
    isRecurring: false,
  })
  
  // Multi-day events
  events.push({
    id: 'multi-1',
    title: 'Vacation in Hawaii',
    description: 'Family vacation',
    startDate: addDays(baseDate, 7),
    endDate: addDays(baseDate, 14),
    category: 'personal',
    isRecurring: false,
  })
  
  events.push({
    id: 'multi-2',
    title: 'Project Sprint',
    description: 'Q1 Sprint',
    startDate: addDays(baseDate, 3),
    endDate: addDays(baseDate, 10),
    category: 'work',
    isRecurring: false,
  })
  
  events.push({
    id: 'multi-3',
    title: 'Conference',
    description: 'Tech Conference 2025',
    startDate: addDays(baseDate, 15),
    endDate: addDays(baseDate, 17),
    category: 'work',
    isRecurring: false,
  })
  
  // Overlapping events to test stacking
  events.push({
    id: 'overlap-1',
    title: 'Training Course',
    description: 'Online training',
    startDate: addDays(baseDate, 8),
    endDate: addDays(baseDate, 11),
    category: 'effort',
    isRecurring: false,
  })
  
  events.push({
    id: 'overlap-2',
    title: 'Side Project',
    description: 'Personal project work',
    startDate: addDays(baseDate, 9),
    endDate: addDays(baseDate, 13),
    category: 'effort',
    isRecurring: false,
  })
  
  // Event spanning multiple weeks
  events.push({
    id: 'long-1',
    title: 'Long-term Goal',
    description: 'Month-long project',
    startDate: addDays(baseDate, 20),
    endDate: addDays(baseDate, 45),
    category: 'note',
    isRecurring: false,
  })
  
  // Events in different months
  const nextMonth = addMonths(baseDate, 1)
  events.push({
    id: 'next-1',
    title: 'Birthday Party',
    description: 'Friend birthday',
    startDate: addDays(nextMonth, 10),
    endDate: addDays(nextMonth, 10),
    category: 'personal',
    isRecurring: false,
  })
  
  events.push({
    id: 'next-2',
    title: 'Workshop',
    description: '3-day workshop',
    startDate: addDays(nextMonth, 5),
    endDate: addDays(nextMonth, 7),
    category: 'work',
    isRecurring: false,
  })
  
  return events
}

export default function TestMultiDayPage() {
  const testEvents = generateTestEvents()
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="h-screen bg-background">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Multi-Day Event Test</h1>
        <p className="text-muted-foreground">
          Testing multi-day event bars with overlapping and stacking
        </p>
        <div className="mt-2 flex gap-4 text-sm">
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
      </div>
      
      <div className="h-[calc(100vh-120px)]">
        <HybridCalendar
          year={currentYear}
          events={testEvents}
          onDateSelect={(date) => console.log('Date selected:', date)}
          onEventClick={(event) => console.log('Event clicked:', event)}
          useCanvas={false} // Force DOM mode to see multi-day bars
        />
      </div>
    </div>
  )
}