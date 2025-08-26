'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Calendar, Clock, CalendarRange, Target, Zap } from 'lucide-react'

import { EnhancedDateTimePicker } from '@/components/calendar/EnhancedDateTimePicker'
import { EnhancedDateRangePicker, type DateRange } from '@/components/calendar/EnhancedDateRangePicker'
import { ConstraintSystem, DEFAULT_BUSINESS_RULES } from '@/components/calendar/ConstraintSystem'
import type { Event } from '@/types/calendar'

// Mock events for testing constraints
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    startDate: new Date(2025, 0, 15, 10, 0), // Jan 15, 2025 10:00 AM
    endDate: new Date(2025, 0, 15, 11, 30),   // Jan 15, 2025 11:30 AM
    category: 'work',
    description: 'Weekly team sync',
    isRecurring: false,
    priority: 'high',
    tags: ['meeting', 'team']
  },
  {
    id: '2',
    title: 'Lunch Break',
    startDate: new Date(2025, 0, 15, 12, 0), // Jan 15, 2025 12:00 PM
    endDate: new Date(2025, 0, 15, 13, 0),   // Jan 15, 2025 1:00 PM
    category: 'personal',
    description: 'Lunch with colleagues',
    isRecurring: true,
    priority: 'medium',
    tags: ['personal', 'break']
  },
  {
    id: '3',
    title: 'Client Presentation',
    startDate: new Date(2025, 0, 15, 14, 0), // Jan 15, 2025 2:00 PM
    endDate: new Date(2025, 0, 15, 16, 0),   // Jan 15, 2025 4:00 PM
    category: 'work',
    description: 'Project presentation to client',
    isRecurring: false,
    priority: 'high',
    tags: ['presentation', 'client']
  }
]

export default function TestReactDatePickerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [createdEvents, setCreatedEvents] = useState<Event[]>([])
  
  // Test event for constraint validation
  const [testEvent, setTestEvent] = useState<Partial<Event>>({
    title: 'Test Event',
    startDate: new Date(2025, 0, 15, 10, 30), // Conflicts with Team Meeting
    endDate: new Date(2025, 0, 15, 11, 0),
    category: 'work',
    description: 'Testing constraints'
  })

  const handleEventCreate = (event: Partial<Event>) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: event.title || 'New Event',
      startDate: event.startDate!,
      endDate: event.endDate!,
      category: event.category || 'personal',
      description: event.description || '',
      isRecurring: event.isRecurring || false,
      priority: event.priority || 'medium',
      tags: event.tags || []
    }
    setCreatedEvents(prev => [...prev, newEvent])
  }

  const allEvents = [...mockEvents, ...createdEvents]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          React DatePicker Integration Test
        </h1>
        <p className="text-muted-foreground text-lg">
          Testing EnhancedDateTimePicker, EnhancedDateRangePicker, and ConstraintSystem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Date Time Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Enhanced Date/Time Picker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <EnhancedDateTimePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Select date and time..."
                showTimeSelect={true}
                showPresets={true}
                showQuickActions={true}
                showRecurrence={true}
                onEventCreate={handleEventCreate}
                eventTitle="Quick Event"
                eventCategory="personal"
                eventDuration={60}
              />
            </div>
            
            {selectedDate && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Selected:</div>
                <div className="text-sm text-muted-foreground">
                  {format(selectedDate, 'PPPP p')}
                </div>
                <Badge variant="outline" className="mt-2">
                  {format(selectedDate, 'EEEE')}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Date Range Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              Enhanced Date Range Picker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <EnhancedDateRangePicker
                value={selectedRange}
                onChange={setSelectedRange}
                placeholder="Select date range..."
                showPresets={true}
                maxDays={30}
              />
            </div>
            
            {selectedRange.startDate && selectedRange.endDate && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Selected Range:</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Start: {format(selectedRange.startDate, 'PPP')}</div>
                  <div>End: {format(selectedRange.endDate, 'PPP')}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {Math.ceil((selectedRange.endDate.getTime() - selectedRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Constraint System Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Business Rules & Constraint System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Event Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold">Test Event Configuration</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    type="text"
                    value={testEvent.title || ''}
                    onChange={(e) => setTestEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Start Date & Time</label>
                  <EnhancedDateTimePicker
                    value={testEvent.startDate}
                    onChange={(date) => setTestEvent(prev => ({ 
                      ...prev, 
                      startDate: date || undefined,
                      endDate: date && prev.endDate && prev.endDate < date ? date : prev.endDate
                    }))}
                    placeholder="Select start time..."
                    showTimeSelect={true}
                    showPresets={true}
                    showQuickActions={false}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">End Date & Time</label>
                  <EnhancedDateTimePicker
                    value={testEvent.endDate}
                    onChange={(date) => setTestEvent(prev => ({ ...prev, endDate: date || undefined }))}
                    placeholder="Select end time..."
                    showTimeSelect={true}
                    showPresets={true}
                    showQuickActions={false}
                    minDate={testEvent.startDate}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={testEvent.category || 'personal'}
                    onChange={(e) => setTestEvent(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="effort">Effort</option>
                    <option value="note">Note</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Constraint Validation Results */}
            <div className="space-y-4">
              <h3 className="font-semibold">Constraint Validation</h3>
              <ConstraintSystem
                event={testEvent}
                existingEvents={allEvents}
                onAutoFix={(fixedEvent) => setTestEvent(fixedEvent)}
                showSuggestions={true}
                compactMode={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Events Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Existing Events (for Constraint Testing)
            </span>
            <Badge variant="outline">
              {allEvents.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-border rounded-lg space-y-2"
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(event.startDate, 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(event.startDate, 'h:mm a')} - {format(event.endDate, 'h:mm a')}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {event.category}
                  </Badge>
                  {event.priority && (
                    <Badge 
                      variant={event.priority === 'high' ? 'destructive' : 
                              event.priority === 'low' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {event.priority}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Rules Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Business Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEFAULT_BUSINESS_RULES.map((rule) => {
              const IconComponent = rule.icon
              return (
                <div key={rule.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <div className="font-medium text-sm">{rule.name}</div>
                    <Badge 
                      variant={rule.severity === 'error' ? 'destructive' :
                              rule.severity === 'warning' ? 'secondary' :
                              rule.severity === 'info' ? 'outline' : 'default'}
                      className="text-xs"
                    >
                      {rule.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rule.description}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rule.category}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setSelectedRange({ 
                  startDate: new Date(), 
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
                })
              }}
            >
              Set Today + 7 Days
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestEvent({
                  title: 'Overlapping Event',
                  startDate: new Date(2025, 0, 15, 10, 15), // Overlaps with Team Meeting
                  endDate: new Date(2025, 0, 15, 10, 45),
                  category: 'work'
                })
              }}
            >
              Test Overlap Conflict
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestEvent({
                  title: 'Past Event Test',
                  startDate: new Date(2024, 11, 25, 10, 0), // Past date
                  endDate: new Date(2024, 11, 25, 11, 0),
                  category: 'work'
                })
              }}
            >
              Test Past Event Error
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreatedEvents([])
              }}
            >
              Clear Created Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}