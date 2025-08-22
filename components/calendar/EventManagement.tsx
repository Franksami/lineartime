'use client'

import * as React from 'react'
import { getEventAriaLabel, announceToScreenReader } from '@/lib/accessibility'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EventCard } from './EventCard'
import { EventModal } from './EventModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Calendar, Grid3x3, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event, EventCategory } from '@/types/calendar'
import { useOfflineEvents } from '@/hooks/useIndexedDB'
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface SortableEventProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
  onDuplicate: (event: Event) => void
}

function SortableEvent({ event, onEdit, onDelete, onDuplicate }: SortableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <EventCard
        event={event}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isDragging={isDragging}
      />
    </div>
  )
}

export function EventManagement({ userId }: { userId: string }) {
  const { events, createEvent, updateEvent, deleteEvent, loading } = useOfflineEvents(userId)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<EventCategory | 'all'>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week' | 'month'>('all')
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [localEvents, setLocalEvents] = React.useState<Event[]>([])

  // Convert stored events to Event type
  React.useEffect(() => {
    if (events) {
      const convertedEvents = events.map(e => ({
        id: e.convexId || String(e.id),
        title: e.title,
        category: (e.categoryId || 'personal') as EventCategory,
        startDate: new Date(e.startTime),
        endDate: e.endTime ? new Date(e.endTime) : new Date(e.startTime),
        description: e.description,
        location: e.location,
        allDay: e.allDay,
        recurrence: e.recurrence
      }))
      setLocalEvents(convertedEvents)
    }
  }, [events])

  // Filter events
  const filteredEvents = React.useMemo(() => {
    let filtered = [...localEvents]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(search) ||
        event.description?.toLowerCase().includes(search) ||
        event.location?.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    // Date filter
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(event =>
          event.startDate >= startOfDay(now) && event.startDate <= endOfDay(now)
        )
        break
      case 'week':
        filtered = filtered.filter(event =>
          event.startDate >= startOfWeek(now) && event.startDate <= endOfWeek(now)
        )
        break
      case 'month':
        filtered = filtered.filter(event =>
          event.startDate >= startOfMonth(now) && event.startDate <= endOfMonth(now)
        )
        break
    }

    // Sort by start date
    filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    return filtered
  }, [localEvents, searchTerm, categoryFilter, dateFilter])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredEvents.findIndex(e => e.id === active.id)
      const newIndex = filteredEvents.findIndex(e => e.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(filteredEvents, oldIndex, newIndex)
        // Here you could update the order in the database if needed
      }
    }

    setActiveId(null)
  }

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    if (selectedEvent) {
      // Update existing event
      const id = events?.find(e => e.convexId === selectedEvent.id || String(e.id) === selectedEvent.id)?.id
      if (id) {
        await updateEvent(id, {
          title: eventData.title!,
          description: eventData.description,
          startTime: eventData.startDate!.getTime(),
          endTime: eventData.endDate?.getTime(),
          categoryId: eventData.category,
          location: eventData.location,
          allDay: eventData.allDay,
          recurrence: eventData.recurrence as any
        })
      }
    } else {
      // Create new event
      await createEvent({
        userId,
        title: eventData.title!,
        description: eventData.description,
        startTime: eventData.startDate!.getTime(),
        endTime: eventData.endDate?.getTime(),
        categoryId: eventData.category,
        location: eventData.location,
        allDay: eventData.allDay,
        recurrence: eventData.recurrence as any,
        syncStatus: 'local',
        lastModified: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    }
    setModalOpen(false)
    setSelectedEvent(null)
  }

  const handleDeleteEvent = async (id: string) => {
    const dbEvent = events?.find(e => e.convexId === id || String(e.id) === id)
    if (dbEvent?.id) {
      await deleteEvent(dbEvent.id)
    }
  }

  const handleDuplicateEvent = (event: Event) => {
    const duplicate = {
      ...event,
      id: crypto.randomUUID(),
      title: `${event.title} (Copy)`,
      startDate: addDays(event.startDate, 1),
      endDate: event.endDate ? addDays(event.endDate, 1) : undefined
    }
    handleSaveEvent(duplicate)
  }

  const checkOverlaps = (start: Date, end: Date, excludeId?: string): Event[] => {
    return filteredEvents.filter(event => {
      if (event.id === excludeId) return false
      const eventStart = event.startDate.getTime()
      const eventEnd = event.endDate.getTime()
      const checkStart = start.getTime()
      const checkEnd = end.getTime()
      
      return (
        (checkStart >= eventStart && checkStart < eventEnd) ||
        (checkEnd > eventStart && checkEnd <= eventEnd) ||
        (checkStart <= eventStart && checkEnd >= eventEnd)
      )
    })
  }

  const activeEvent = activeId ? filteredEvents.find(e => e.id === activeId) : null

  return (
    <div className="space-y-6" role="region" aria-label="Event Management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Event Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedEvent(null)
            setModalOpen(true)
            announceToScreenReader('New event dialog opened')
          }}
          variant="default"
          className="shadow-sm"
          aria-label="Create new event"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border"
              aria-label="Search events"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
          <SelectTrigger className="w-[150px] bg-background border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="effort">Effort</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
          <SelectTrigger className="w-[150px] bg-background border-border">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Events Grid/List */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredEvents.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          )}>
            {filteredEvents.map(event => (
              <SortableEvent
                key={event.id}
                event={event}
                onEdit={(e) => {
                  setSelectedEvent(e)
                  setModalOpen(true)
                }}
                onDelete={handleDeleteEvent}
                onDuplicate={handleDuplicateEvent}
              />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeEvent ? (
            <EventCard
              event={activeEvent}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12 px-4 rounded-xl bg-card border border-border">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first event to get started'}
          </p>
          {!searchTerm && categoryFilter === 'all' && dateFilter === 'all' && (
            <Button
              onClick={() => {
                setSelectedEvent(null)
                setModalOpen(true)
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        selectedRange={null}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        checkOverlaps={checkOverlaps}
      />
    </div>
  )
}