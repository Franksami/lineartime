'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventModal } from '@/components/calendar/EventModal'
import { CategoryTagManager } from '@/components/calendar/category-tag-manager'
import { Plus, Tag, Palette, Star, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Event, EventCategory, EventPriority } from '@/types/calendar'

export default function TestCategoryTagsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Meeting',
      startDate: new Date(2024, 0, 15, 10, 0),
      endDate: new Date(2024, 0, 15, 11, 0),
      category: 'meeting',
      priority: 'high',
      description: 'Weekly team sync',
      tags: ['team', 'weekly', 'project-alpha'],
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Project Deadline',
      startDate: new Date(2024, 0, 20, 17, 0),
      endDate: new Date(2024, 0, 20, 17, 0),
      category: 'deadline',
      priority: 'critical',
      description: 'Final submission for Q1 project',
      tags: ['deadline', 'critical', 'q1'],
      color: '#ef4444'
    },
    {
      id: '3',
      title: 'Personal Workout',
      startDate: new Date(2024, 0, 18, 7, 0),
      endDate: new Date(2024, 0, 18, 8, 0),
      category: 'personal',
      priority: 'medium',
      description: 'Morning gym session',
      tags: ['health', 'routine', 'morning'],
      color: '#10b981'
    }
  ])

  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  // Demo state for standalone CategoryTagManager
  const [demoCategory, setDemoCategory] = useState<EventCategory>('personal')
  const [demoPriority, setDemoPriority] = useState<EventPriority>('medium')
  const [demoTags, setDemoTags] = useState<string[]>(['demo', 'test'])
  const [availableTags, setAvailableTags] = useState<string[]>([
    'meeting', 'urgent', 'project', 'personal', 'health', 'learning', 'travel', 'family', 'demo', 'test'
  ])

  const handleEventSave = (eventData: Partial<Event>) => {
    if (selectedEvent) {
      // Update existing event
      setEvents(prev => prev.map(e => 
        e.id === selectedEvent.id 
          ? { ...e, ...eventData }
          : e
      ))
    } else {
      // Create new event
      const newEvent: Event = {
        id: Date.now().toString(),
        title: eventData.title || 'New Event',
        startDate: eventData.startDate || new Date(),
        endDate: eventData.endDate || new Date(),
        category: eventData.category || 'personal',
        priority: eventData.priority || 'medium',
        description: eventData.description || '',
        tags: eventData.tags || [],
        color: '#3b82f6'
      }
      setEvents(prev => [...prev, newEvent])
    }
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  const handleEventDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  const checkOverlaps = (start: Date, end: Date, excludeId?: string): Event[] => {
    return events.filter(event => {
      if (event.id === excludeId) return false
      const eventStart = event.startDate.getTime()
      const eventEnd = event.endDate.getTime()
      const rangeStart = start.getTime()
      const rangeEnd = end.getTime()
      return (rangeStart < eventEnd && rangeEnd > eventStart)
    })
  }

  const openNewEventModal = () => {
    setSelectedEvent(null)
    setSelectedDate(new Date())
    setShowEventModal(true)
  }

  const openEditEventModal = (event: Event) => {
    setSelectedEvent(event)
    setSelectedDate(event.startDate)
    setShowEventModal(true)
  }

  const getPriorityColor = (priority?: EventPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'optional': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case 'personal': return 'bg-green-500'
      case 'work': return 'bg-blue-500'
      case 'effort': return 'bg-orange-500'
      case 'note': return 'bg-purple-500'
      case 'meeting': return 'bg-cyan-500'
      case 'deadline': return 'bg-red-500'
      case 'milestone': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Enhanced Category & Tag System</h1>
            </div>
          </div>
          <Button onClick={openNewEventModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Standalone Category Tag Manager Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Standalone Category Manager
              </CardTitle>
              <CardDescription>
                Test the category and tag management component independently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryTagManager
                selectedCategory={demoCategory}
                selectedPriority={demoPriority}
                selectedTags={demoTags}
                availableTags={availableTags}
                onCategoryChange={setDemoCategory}
                onPriorityChange={setDemoPriority}
                onTagsChange={setDemoTags}
                onCreateTag={(tag) => setAvailableTags(prev => [...prev, tag])}
              />
              
              {/* Current Selection Display */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Current Selection:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(demoCategory)}`} />
                      <span className="capitalize">{demoCategory}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Badge className={getPriorityColor(demoPriority)}>
                      {demoPriority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {demoTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Enhanced Events
              </CardTitle>
              <CardDescription>
                Events with categories, priorities, and tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map(event => (
                  <div 
                    key={event.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openEditEventModal(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category)}`} />
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {event.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.startDate.toLocaleDateString()} {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enhanced Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                7 category types including Personal, Work, Effort, Note, Meeting, Deadline, and Milestone with visual color coding.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                5 priority levels from Critical to Optional with color-coded badges and smart visual hierarchy.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smart Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create custom tags, manage available tags, and organize events with flexible tagging system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Event Modal */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={selectedEvent}
        selectedDate={selectedDate}
        selectedRange={null}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        checkOverlaps={checkOverlaps}
        events={events}
      />
    </div>
  )
}
