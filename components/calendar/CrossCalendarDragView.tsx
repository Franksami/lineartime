'use client'

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import { 
  EventInput, 
  DateSelectArg, 
  EventClickArg, 
  EventDropArg,
  EventApi
} from '@fullcalendar/core'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import type { Event } from '@/types/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { notify } from '@/components/ui/notify'
import { 
  Calendar as CalendarIcon, 
  ArrowRightLeft, 
  Users, 
  Target,
  Shuffle
} from 'lucide-react'

interface CrossCalendarDragViewProps {
  year: number
  events: Event[]
  className?: string
  onDateSelect?: (date: Date, calendarId: string) => void
  onEventClick?: (event: Event) => void
  onEventUpdate?: (event: Event) => void
  onEventCreate?: (event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  onCrossCalendarDrag?: (event: Event, fromCalendar: string, toCalendar: string) => void
}

// Calendar configuration for different views
const CALENDAR_CONFIGS = {
  source: {
    id: 'source',
    title: 'Source Calendar',
    subtitle: 'Drag events from here',
    view: 'dayGridMonth',
    color: 'hsl(var(--chart-1))',
    icon: CalendarIcon,
    editable: true,
    droppable: false
  },
  destination: {
    id: 'destination', 
    title: 'Destination Calendar',
    subtitle: 'Drop events here',
    view: 'timeGridWeek',
    color: 'hsl(var(--chart-2))',
    icon: Target,
    editable: true,
    droppable: true
  },
  shared: {
    id: 'shared',
    title: 'Shared Calendar', 
    subtitle: 'Events from both calendars',
    view: 'listMonth',
    color: 'hsl(var(--chart-3))',
    icon: Users,
    editable: true,
    droppable: true
  }
} as const

export function CrossCalendarDragView({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  onCrossCalendarDrag
}: CrossCalendarDragViewProps) {
  const sourceCalendarRef = useRef<FullCalendar>(null)
  const destinationCalendarRef = useRef<FullCalendar>(null)
  const sharedCalendarRef = useRef<FullCalendar>(null)
  const { startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor(events.length)
  
  // State for tracking which calendar events belong to
  const [eventDistribution, setEventDistribution] = useState<{
    source: Event[]
    destination: Event[]
    shared: Event[]
  }>({
    source: events.slice(0, Math.floor(events.length / 3)),
    destination: events.slice(Math.floor(events.length / 3), Math.floor(events.length * 2 / 3)),
    shared: events.slice(Math.floor(events.length * 2 / 3))
  })

  // Convert events to FullCalendar format for each calendar
  const convertEventsToFullCalendar = useCallback((eventList: Event[], calendarId: string) => {
    return eventList.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      allDay: true,
      backgroundColor: CALENDAR_CONFIGS[calendarId as keyof typeof CALENDAR_CONFIGS].color,
      borderColor: CALENDAR_CONFIGS[calendarId as keyof typeof CALENDAR_CONFIGS].color,
      extendedProps: {
        category: event.category,
        description: event.description,
        originalEvent: event,
        calendarId: calendarId
      },
      className: `cross-calendar-event cross-calendar-${calendarId}`,
    }))
  }, [])

  const sourceEvents = useMemo(() => 
    convertEventsToFullCalendar(eventDistribution.source, 'source'), 
    [eventDistribution.source, convertEventsToFullCalendar]
  )
  
  const destinationEvents = useMemo(() => 
    convertEventsToFullCalendar(eventDistribution.destination, 'destination'), 
    [eventDistribution.destination, convertEventsToFullCalendar]
  )
  
  const sharedEvents = useMemo(() => 
    convertEventsToFullCalendar([...eventDistribution.source, ...eventDistribution.destination, ...eventDistribution.shared], 'shared'), 
    [eventDistribution, convertEventsToFullCalendar]
  )

  // Handle event dragging between calendars
  const handleEventReceive = useCallback((info: any, targetCalendarId: string) => {
    const originalEvent = info.event.extendedProps.originalEvent as Event
    const sourceCalendarId = info.event.extendedProps.calendarId as string
    
    console.log('Event received:', {
      event: originalEvent,
      from: sourceCalendarId,
      to: targetCalendarId
    })

    // Update event distribution
    setEventDistribution(prev => {
      const newDistribution = { ...prev }
      
      // Remove from source calendar
      if (sourceCalendarId && sourceCalendarId !== targetCalendarId) {
        newDistribution[sourceCalendarId as keyof typeof newDistribution] = 
          newDistribution[sourceCalendarId as keyof typeof newDistribution].filter(e => e.id !== originalEvent.id)
      }
      
      // Add to destination calendar (avoid duplicates)
      if (!newDistribution[targetCalendarId as keyof typeof newDistribution].some(e => e.id === originalEvent.id)) {
        newDistribution[targetCalendarId as keyof typeof newDistribution].push(originalEvent)
      }
      
      return newDistribution
    })

    // Call callback if provided
    if (onCrossCalendarDrag) {
      onCrossCalendarDrag(originalEvent, sourceCalendarId, targetCalendarId)
    }

    notify.success(`Event "${originalEvent.title}" moved to ${CALENDAR_CONFIGS[targetCalendarId as keyof typeof CALENDAR_CONFIGS].title}`)
  }, [onCrossCalendarDrag])

  // Handle event leaving a calendar
  const handleEventLeave = useCallback((info: any, sourceCalendarId: string) => {
    const originalEvent = info.event.extendedProps.originalEvent as Event
    
    console.log('Event leaving:', {
      event: originalEvent,
      from: sourceCalendarId
    })

    notify.info(`Event "${originalEvent.title}" being moved from ${CALENDAR_CONFIGS[sourceCalendarId as keyof typeof CALENDAR_CONFIGS].title}`)
  }, [])

  // Common event handlers
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const originalEvent = clickInfo.event.extendedProps.originalEvent as Event
    
    if (onEventClick) {
      onEventClick(originalEvent)
    }

    notify.info(`Selected: ${clickInfo.event.title}`)
  }, [onEventClick])

  const handleDateSelect = useCallback((selectInfo: DateSelectArg, calendarId: string) => {
    const { start, end } = selectInfo
    
    if (onDateSelect) {
      onDateSelect(start, calendarId)
    }

    if (onEventCreate) {
      onEventCreate({
        title: 'New Event',
        startDate: start,
        endDate: end,
        category: 'personal'
      })
    }

    notify.success(`Event created on ${format(start, 'MMM d, yyyy')} in ${CALENDAR_CONFIGS[calendarId as keyof typeof CALENDAR_CONFIGS].title}`)
  }, [onDateSelect, onEventCreate])

  // Shuffle events between calendars (demo feature)
  const handleShuffleEvents = useCallback(() => {
    setEventDistribution(prev => {
      const allEvents = [...prev.source, ...prev.destination, ...prev.shared]
      const shuffled = [...allEvents].sort(() => Math.random() - 0.5)
      
      const third = Math.floor(shuffled.length / 3)
      
      return {
        source: shuffled.slice(0, third),
        destination: shuffled.slice(third, third * 2),
        shared: shuffled.slice(third * 2)
      }
    })
    
    notify.success('Events redistributed across calendars')
  }, [])

  // Performance monitoring
  useEffect(() => {
    startRenderMeasurement()
    return () => {
      endRenderMeasurement()
    }
  }, [events, startRenderMeasurement, endRenderMeasurement])

  return (
    <div className={cn('cross-calendar-drag-view h-full w-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Cross-Calendar Dragging</h2>
            <p className="text-sm text-muted-foreground">
              Drag events between different calendar views
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {eventDistribution.source.length + eventDistribution.destination.length + eventDistribution.shared.length} events
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffleEvents}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {Object.entries(CALENDAR_CONFIGS).map(([calendarId, config]) => {
          const IconComponent = config.icon
          const calendarEvents = calendarId === 'source' ? sourceEvents : 
                                calendarId === 'destination' ? destinationEvents : sharedEvents
          
          return (
            <Card key={calendarId} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconComponent className="h-4 w-4" style={{ color: config.color }} />
                  {config.title}
                  <Badge variant="outline" className="ml-auto">
                    {calendarId === 'shared' 
                      ? eventDistribution.source.length + eventDistribution.destination.length + eventDistribution.shared.length
                      : eventDistribution[calendarId as keyof typeof eventDistribution].length} events
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {config.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="h-96 border-t border-border">
                  <FullCalendar
                    ref={calendarId === 'source' ? sourceCalendarRef : 
                         calendarId === 'destination' ? destinationCalendarRef : sharedCalendarRef}
                    plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin]}
                    initialView={config.view}
                    initialDate={new Date(year, 0, 1)}
                    events={calendarEvents}
                    height="100%"
                    
                    // Interaction settings
                    selectable={true}
                    selectMirror={true}
                    editable={config.editable}
                    droppable={config.droppable}
                    
                    // Event handlers
                    eventClick={handleEventClick}
                    select={(selectInfo) => handleDateSelect(selectInfo, calendarId)}
                    
                    // Cross-calendar dragging handlers
                    eventReceive={(info) => handleEventReceive(info, calendarId)}
                    eventLeave={(info) => handleEventLeave(info, calendarId)}
                    
                    // Header toolbar
                    headerToolbar={{
                      left: 'prev,next',
                      center: 'title',
                      right: calendarId === 'shared' ? 'listMonth,dayGridMonth' : undefined
                    }}
                    
                    // Styling
                    eventClassNames={(arg) => {
                      return [
                        'cross-calendar-event',
                        `cross-calendar-${calendarId}`,
                        'transition-all',
                        'duration-200',
                        'hover:shadow-md',
                        'cursor-move'
                      ]
                    }}
                    
                    // Advanced features
                    eventOverlap={true}
                    selectOverlap={true}
                    eventDisplay="block"
                    dayMaxEvents={3}
                    
                    // Loading state
                    loading={(isLoading) => {
                      if (isLoading) {
                        console.log(`Loading ${config.title}...`)
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cross-calendar styling */}
      <style jsx>{`
        .cross-calendar-event {
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 12px;
          cursor: move;
          position: relative;
        }
        
        .cross-calendar-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }
        
        .cross-calendar-event.fc-event-dragging {
          opacity: 0.8;
          transform: rotate(3deg);
        }
        
        .cross-calendar-source .fc-event {
          border-left: 4px solid hsl(var(--chart-1));
        }
        
        .cross-calendar-destination .fc-event {
          border-left: 4px solid hsl(var(--chart-2));
        }
        
        .cross-calendar-shared .fc-event {
          border-left: 4px solid hsl(var(--chart-3));
        }
        
        .fc-daygrid-day.fc-day-hover,
        .fc-timegrid-slot.fc-timegrid-slot-hover {
          background-color: hsl(var(--primary) / 0.1);
        }
        
        .cross-calendar-drag-view .fc {
          height: 100%;
          font-family: inherit;
        }
        
        .cross-calendar-drag-view .fc-event-mirror {
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--primary-foreground));
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transform: rotate(5deg);
          z-index: 1000;
        }
      `}</style>
    </div>
  )
}

export { CALENDAR_CONFIGS }