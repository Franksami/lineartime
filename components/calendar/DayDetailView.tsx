'use client'

import React, { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { DraggableEvent } from './DraggableEvent'
import { DroppableCalendarGrid } from './DroppableCalendarGrid'
import { useCalendarWorker } from '@/lib/workers/useWorker'
import type { Event } from '@/types/calendar'

interface DayDetailViewProps {
  date: Date
  events: Event[]
  onClose: () => void
  onEventUpdate?: (event: Event) => void
  onEventDelete?: (eventId: string) => void
  onEventEdit?: (event: Event) => void
  onEventDuplicate?: (event: Event) => void
  className?: string
}

interface LayoutedEvent extends Event {
  left: number
  top: number
  width: number
  height: number
  column?: number
  totalColumns?: number
}

export function DayDetailView({
  date,
  events,
  onClose,
  onEventUpdate,
  onEventDelete,
  onEventEdit,
  onEventDuplicate,
  className
}: DayDetailViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutedEvents, setLayoutedEvents] = useState<LayoutedEvent[]>([])
  const [containerWidth, setContainerWidth] = useState(600)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragEnabled, setIsDragEnabled] = useState(true)
  const [isResizeEnabled, setIsResizeEnabled] = useState(true)
  
  const { layoutEventsV2 } = useCalendarWorker()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Convert date events to hourly events for layout
  const convertToHourlyEvents = (dayEvents: Event[]): Event[] => {
    return dayEvents.map(event => {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      
      // If it's an all-day event, set it to span the full day
      if (event.allDay) {
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
      }
      
      return {
        ...event,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  }

  // Layout events using the worker
  useEffect(() => {
    const layoutEvents = async () => {
      if (!containerRef.current) return
      
      const hourlyEvents = convertToHourlyEvents(events)
      const layoutResult = await layoutEventsV2(hourlyEvents, containerWidth)
      
      // Convert layout result to positioned events
      const positioned = layoutResult.map((event: any) => {
        const startHour = new Date(event.startDate).getHours()
        const startMinutes = new Date(event.startDate).getMinutes()
        const endHour = new Date(event.endDate).getHours()
        const endMinutes = new Date(event.endDate).getMinutes()
        
        const top = (startHour + startMinutes / 60) * 60 // 60px per hour
        const height = Math.max(30, ((endHour + endMinutes / 60) - (startHour + startMinutes / 60)) * 60)
        
        return {
          ...event,
          left: event.left || 50, // Add padding from left
          top,
          width: event.width || (containerWidth - 100), // Full width minus padding
          height
        }
      })
      
      setLayoutedEvents(positioned)
    }
    
    layoutEvents()
  }, [events, containerWidth, layoutEventsV2])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over || !onEventUpdate) return
    
    const draggedEvent = layoutedEvents.find(e => e.id === active.id)
    if (!draggedEvent) return
    
    // Get the drop target data
    const dropData = over.data.current as { hour?: number; date: Date }
    if (dropData.hour !== undefined) {
      // Calculate new time based on drop position
      const newStartDate = new Date(draggedEvent.startDate)
      const newEndDate = new Date(draggedEvent.endDate)
      const duration = newEndDate.getTime() - newStartDate.getTime()
      
      newStartDate.setHours(dropData.hour, 0, 0, 0)
      newEndDate.setTime(newStartDate.getTime() + duration)
      
      onEventUpdate({
        ...draggedEvent,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString()
      })
    }
  }

  const handleEventResize = (eventId: string, width: number, height: number) => {
    if (!onEventUpdate) return
    
    const event = layoutedEvents.find(e => e.id === eventId)
    if (!event) return
    
    // Calculate new end time based on height
    const startDate = new Date(event.startDate)
    const hours = height / 60 // 60px per hour
    const newEndDate = new Date(startDate)
    newEndDate.setHours(startDate.getHours() + Math.floor(hours))
    newEndDate.setMinutes((hours % 1) * 60)
    
    onEventUpdate({
      ...event,
      endDate: newEndDate.toISOString()
    })
  }

  const activeEvent = activeId ? layoutedEvents.find(e => e.id === activeId) : null

  // Generate hour slots for the grid
  const hourSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className={cn("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm", className)}>
      <div className="fixed inset-4 md:inset-8 bg-background border rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDragEnabled(!isDragEnabled)}
            >
              Drag: {isDragEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResizeEnabled(!isResizeEnabled)}
            >
              Resize: {isResizeEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div ref={containerRef} className="relative min-h-[1440px]"> {/* 24 hours * 60px */}
              {/* Hour grid */}
              <div className="absolute inset-0">
                {hourSlots.map(hour => (
                  <DroppableCalendarGrid
                    key={`hour-${hour}`}
                    id={`hour-${hour}`}
                    date={date}
                    hour={hour}
                    className="absolute left-0 right-0 border-b border-border/20"
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px'
                    }}
                  >
                    <div className="absolute left-2 top-1 text-xs text-muted-foreground">
                      {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                    </div>
                  </DroppableCalendarGrid>
                ))}
              </div>

              {/* Events */}
              <div className="absolute inset-0 pointer-events-none">
                {layoutedEvents.map(event => (
                  <div
                    key={event.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${event.left}px`,
                      top: `${event.top}px`,
                      width: `${event.width}px`,
                      height: `${event.height}px`
                    }}
                  >
                    <DraggableEvent
                      event={event}
                      onResize={isResizeEnabled ? handleEventResize : undefined}
                      onClick={() => onEventEdit?.(event)}
                      onEdit={() => onEventEdit?.(event)}
                      onDelete={() => onEventDelete?.(event.id)}
                      onDuplicate={() => onEventDuplicate?.(event)}
                      dragDisabled={!isDragEnabled}
                      minHeight={30}
                      gridSize={15}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeEvent && (
                <div
                  className="opacity-50"
                  style={{
                    width: `${activeEvent.width}px`,
                    height: `${activeEvent.height}px`
                  }}
                >
                  <DraggableEvent
                    event={activeEvent}
                    dragDisabled={true}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}