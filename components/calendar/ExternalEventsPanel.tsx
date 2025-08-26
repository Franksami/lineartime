'use client'

import React, { useEffect, useRef } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Users, 
  Target, 
  FileText, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react'
import type { EventCategory } from '@/types/calendar'

interface EventTemplate {
  id: string
  title: string
  category: EventCategory
  defaultDuration: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface ExternalEventsPanelProps {
  className?: string
  onEventCreate?: (template: EventTemplate) => void
}

// Predefined event templates for drag-and-drop
const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'meeting',
    title: 'Team Meeting',
    category: 'work',
    defaultDuration: '1h',
    description: 'Regular team sync or project meeting',
    icon: Users,
    color: 'hsl(var(--chart-1))'
  },
  {
    id: 'deadline',
    title: 'Project Deadline',
    category: 'deadline',
    defaultDuration: 'all-day',
    description: 'Important project or task deadline',
    icon: AlertCircle,
    color: 'hsl(var(--destructive))'
  },
  {
    id: 'personal-task',
    title: 'Personal Task',
    category: 'personal',
    defaultDuration: '30m',
    description: 'Personal appointments or tasks',
    icon: Calendar,
    color: 'hsl(var(--chart-4))'
  },
  {
    id: 'focus-time',
    title: 'Focus Time',
    category: 'effort',
    defaultDuration: '2h',
    description: 'Dedicated time for deep work',
    icon: Target,
    color: 'hsl(var(--chart-3))'
  },
  {
    id: 'note-review',
    title: 'Note Review',
    category: 'note',
    defaultDuration: '15m',
    description: 'Review notes or documentation',
    icon: FileText,
    color: 'hsl(var(--chart-5))'
  },
  {
    id: 'time-block',
    title: 'Time Block',
    category: 'effort',
    defaultDuration: '1h',
    description: 'Generic time blocking',
    icon: Clock,
    color: 'hsl(var(--chart-3))'
  }
]

export function ExternalEventsPanel({ className, onEventCreate }: ExternalEventsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggableRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Initialize draggable elements
  useEffect(() => {
    const draggables: Draggable[] = []

    EVENT_TEMPLATES.forEach((template) => {
      const element = draggableRefs.current.get(template.id)
      if (element) {
        const draggable = new Draggable(element, {
          eventData: {
            title: template.title,
            duration: template.defaultDuration,
            create: true,
            category: template.category,
            description: template.description,
            backgroundColor: template.color,
            borderColor: template.color,
            className: `event-template-${template.category}`,
            extendedProps: {
              template: template,
              isTemplate: true
            }
          }
        })
        draggables.push(draggable)
      }
    })

    // Cleanup
    return () => {
      draggables.forEach(draggable => draggable.destroy())
    }
  }, [])

  const handleCreateEvent = (template: EventTemplate) => {
    if (onEventCreate) {
      onEventCreate(template)
    }
  }

  return (
    <div ref={containerRef} className={cn('external-events-panel', className)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Event Templates
          </CardTitle>
          <CardDescription>
            Drag these templates onto the calendar to create events quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {EVENT_TEMPLATES.map((template) => {
            const IconComponent = template.icon
            
            return (
              <div
                key={template.id}
                ref={(el) => {
                  if (el) {
                    draggableRefs.current.set(template.id, el)
                  }
                }}
                className={cn(
                  'external-event p-3 rounded-lg border cursor-move transition-all duration-200',
                  'hover:shadow-md hover:scale-102 active:scale-98',
                  'bg-card border-border'
                )}
                style={{
                  borderLeftColor: template.color,
                  borderLeftWidth: '4px'
                }}
                data-event={JSON.stringify({
                  title: template.title,
                  category: template.category,
                  duration: template.defaultDuration,
                  description: template.description
                })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="p-2 rounded-md"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <IconComponent 
                        className="h-4 w-4" 
                        style={{ color: template.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {template.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.defaultDuration}
                    </span>
                  </div>
                </div>
                
                {/* Quick create button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs h-6"
                  onClick={() => handleCreateEvent(template)}
                >
                  Quick Create
                </Button>
              </div>
            )
          })}
          
          {/* Custom styling for draggable elements */}
          <style jsx>{`
            .external-event {
              position: relative;
            }
            .external-event::before {
              content: '⋮⋮';
              position: absolute;
              left: 8px;
              top: 50%;
              transform: translateY(-50%);
              color: hsl(var(--muted-foreground));
              font-size: 12px;
              line-height: 1;
              opacity: 0.5;
            }
            .external-event:hover::before {
              opacity: 1;
            }
            .external-event.fc-event-mirror {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              transform: rotate(2deg);
              border-radius: 8px;
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  )
}

// Export event templates for use in other components
export { EVENT_TEMPLATES, type EventTemplate }