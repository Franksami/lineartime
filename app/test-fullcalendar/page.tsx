'use client'

import { useState, useEffect } from 'react'
import { LinearCalendarPro } from '@/components/calendar/LinearCalendarPro'
import { EnhancedEventPopup } from '@/components/calendar/EnhancedEventPopup'
import { ProductivityDashboard } from '@/components/analytics/ProductivityDashboard'
import type { Event } from '@/types/calendar'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Sample events for testing
const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'New Year Resolution',
    startDate: startOfDay(new Date(2025, 0, 1)),
    endDate: endOfDay(new Date(2025, 0, 1)),
    allDay: true,
    category: 'personal',
    description: 'Start the year with good intentions'
  },
  {
    id: '2',
    title: 'Project Kickoff',
    startDate: startOfDay(new Date(2025, 0, 15)),
    endDate: endOfDay(new Date(2025, 0, 17)),
    allDay: true,
    category: 'work',
    description: 'Launch the new calendar project'
  },
  {
    id: '3',
    title: 'Valentine\'s Day',
    startDate: startOfDay(new Date(2025, 1, 14)),
    endDate: endOfDay(new Date(2025, 1, 14)),
    allDay: true,
    category: 'personal',
    description: 'Romantic dinner planned'
  },
  {
    id: '4',
    title: 'Spring Break',
    startDate: startOfDay(new Date(2025, 2, 10)),
    endDate: endOfDay(new Date(2025, 2, 17)),
    allDay: true,
    category: 'personal',
    description: 'Week-long vacation'
  },
  {
    id: '5',
    title: 'Q1 Review',
    startDate: startOfDay(new Date(2025, 2, 31)),
    endDate: endOfDay(new Date(2025, 2, 31)),
    allDay: true,
    category: 'work',
    description: 'Quarterly business review'
  },
  {
    id: '6',
    title: 'Summer Planning',
    startDate: startOfDay(new Date(2025, 5, 1)),
    endDate: endOfDay(new Date(2025, 5, 5)),
    allDay: true,
    category: 'effort',
    description: 'Plan summer activities'
  },
  {
    id: '7',
    title: 'Independence Day',
    startDate: startOfDay(new Date(2025, 6, 4)),
    endDate: endOfDay(new Date(2025, 6, 4)),
    allDay: true,
    category: 'personal',
    description: 'BBQ and fireworks'
  },
  {
    id: '8',
    title: 'Back to School',
    startDate: startOfDay(new Date(2025, 7, 15)),
    endDate: endOfDay(new Date(2025, 7, 25)),
    allDay: true,
    category: 'effort',
    description: 'Preparation for new semester'
  },
  {
    id: '9',
    title: 'Halloween',
    startDate: startOfDay(new Date(2025, 9, 31)),
    endDate: endOfDay(new Date(2025, 9, 31)),
    allDay: true,
    category: 'personal',
    description: 'Costume party'
  },
  {
    id: '10',
    title: 'Year-End Review',
    startDate: startOfDay(new Date(2025, 11, 15)),
    endDate: endOfDay(new Date(2025, 11, 31)),
    allDay: true,
    category: 'work',
    description: 'Annual performance review'
  }
]

export default function TestFullCalendarPage() {
  const [events, setEvents] = useState<Event[]>(sampleEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null)
  const currentYear = 2025

  const handleEventCreate = (eventData: Partial<Event>) => {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: eventData.title || 'New Event',
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || new Date(),
      allDay: eventData.allDay !== false,
      category: eventData.category || 'personal',
      description: eventData.description || ''
    }

    setEvents(prev => [...prev, newEvent])
  }

  const handleEventUpdate = (updatedEvent: Event) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    )
  }

  const handleEventClick = (event: Event, anchorElement?: HTMLElement) => {
    setSelectedEvent(event)
    setPopupAnchor(anchorElement || null)
    setShowPopup(true)
  }

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
    setSelectedEvent(null)
  }

  const clearEvents = () => {
    setEvents([])
    setSelectedEvent(null)
  }

  const resetEvents = () => {
    setEvents(sampleEvents)
    setSelectedEvent(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              FullCalendar Integration Test
            </h1>
            <p className="text-sm text-muted-foreground">
              Testing LinearTime with professional FullCalendar features
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetEvents} variant="outline">
              Reset Events
            </Button>
            <Button onClick={clearEvents} variant="outline">
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Content */}
        <div className="flex-1 p-4">
          <Tabs defaultValue="calendar" className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="h-[calc(100%-60px)]">
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <LinearCalendarPro
                    year={currentYear}
                    events={events}
                    onEventCreate={handleEventCreate}
                    onEventUpdate={handleEventUpdate}
                    onEventClick={handleEventClick}
                    onEventDelete={handleEventDelete}
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="h-[calc(100%-60px)]">
              <ProductivityDashboard
                events={events}
                year={currentYear}
                className="h-full overflow-y-auto"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Features</CardTitle>
              <CardDescription>
                Testing FullCalendar integration with LinearTime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">What's New</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ FullCalendar professional drag & drop</li>
                  <li>✅ Preserved horizontal 12-month layout</li>
                  <li>✅ Event conflict detection</li>
                  <li>✅ Professional event management</li>
                  <li>✅ Token-only theming integration</li>
                  <li>✅ Performance optimizations</li>
                  <li>✅ Accessibility improvements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Event Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Events:</span>
                    <Badge variant="secondary">{events.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Personal:</span>
                    <Badge variant="default">
                      {events.filter(e => e.category === 'personal').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Work:</span>
                    <Badge variant="secondary">
                      {events.filter(e => e.category === 'work').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Effort:</span>
                    <Badge variant="outline">
                      {events.filter(e => e.category === 'effort').length}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedEvent && (
                <div>
                  <h4 className="font-medium mb-2">Selected Event</h4>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="font-medium">{selectedEvent.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedEvent.description}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{selectedEvent.category}</Badge>
                    </div>
                    <Button 
                      onClick={() => handleEventDelete(selectedEvent.id)}
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                    >
                      Delete Event
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Test Instructions</h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Click on empty dates to create events</li>
                  <li>Click on events to select them</li>
                  <li>Drag events to move them</li>
                  <li>Test the horizontal scroll</li>
                  <li>Check mobile responsiveness</li>
                  <li>Verify accessibility with keyboard</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Event Popup */}
      <EnhancedEventPopup
        event={selectedEvent}
        isOpen={showPopup}
        anchorElement={popupAnchor}
        onClose={() => {
          setShowPopup(false)
          setSelectedEvent(null)
          setPopupAnchor(null)
        }}
        onUpdate={handleEventUpdate}
        onDelete={handleEventDelete}
        onDuplicate={(duplicatedEvent) => {
          setEvents(prev => [...prev, duplicatedEvent])
        }}
      />
    </div>
  )
}