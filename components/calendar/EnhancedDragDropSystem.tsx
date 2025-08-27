'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notify } from '@/components/ui/notify';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import { cn } from '@/lib/utils';
import type { Event, EventCategory } from '@/types/calendar';
import {
  Active,
  DndContext,
  type DragEndEvent,
  DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  Over,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Draggable } from '@fullcalendar/interaction';
import { addDays, addHours, endOfDay, format, startOfDay } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Clock,
  Copy,
  FileText,
  GripVertical,
  Layers,
  MousePointer,
  Move,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Enhanced event template with AI suggestions and multi-library support
export interface EnhancedEventTemplate {
  id: string;
  title: string;
  category: EventCategory;
  defaultDuration: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  // Enhanced properties
  aiSuggested?: boolean;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  // Multi-library support
  fullCalendarProps?: Record<string, any>;
  toastUIProps?: Record<string, any>;
  datePickerProps?: Record<string, any>;
}

// Draggable event wrapper for DnD Kit integration
function DraggableEventTemplate({
  template,
  isActive,
}: {
  template: EnhancedEventTemplate;
  isActive?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: template.id,
    data: {
      type: 'event-template',
      template,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const IconComponent = template.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'external-event p-3 rounded-lg border cursor-grab transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] active:scale-98 active:cursor-grabbing',
        'bg-card border-border relative group',
        isDragging && 'opacity-50',
        isActive && 'shadow-lg ring-2 ring-primary/50',
        template.priority === 'urgent' && 'ring-2 ring-destructive/30',
        template.aiSuggested &&
          'bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20'
      )}
      style={{
        ...style,
        borderLeftColor: template.color,
        borderLeftWidth: '4px',
      }}
    >
      {/* AI Suggested Badge */}
      {template.aiSuggested && (
        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <Sparkles className="h-3 w-3 mr-1" />
          AI
        </Badge>
      )}

      {/* Priority Indicator */}
      {template.priority === 'urgent' && (
        <div className="absolute -top-1 -left-1">
          <AlertCircle className="h-4 w-4 text-destructive fill-current" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div className="flex-shrink-0">
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          {/* Icon */}
          <div
            className="p-2 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${template.color}20` }}
          >
            <IconComponent className="h-4 w-4" style={{ color: template.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{template.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge
            variant={template.priority === 'urgent' ? 'destructive' : 'secondary'}
            className="text-xs capitalize"
          >
            {template.category}
          </Badge>
          <span className="text-xs text-muted-foreground">{template.defaultDuration}</span>
          {template.recurrence !== 'none' && (
            <Badge variant="outline" className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              {template.recurrence}
            </Badge>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex gap-1">
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          <Copy className="h-3 w-3 mr-1" />
          Clone
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          <PlusCircle className="h-3 w-3 mr-1" />
          Quick Add
        </Button>
      </div>
    </div>
  );
}

// Enhanced droppable area component
function DroppableCalendarArea({
  id,
  children,
  className,
  onDrop,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  onDrop?: (template: EnhancedEventTemplate, dropDate: Date) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'calendar-drop-area',
      onDrop,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 ring-offset-2 bg-primary/5',
        className
      )}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg pointer-events-none flex items-center justify-center">
          <Badge className="bg-primary text-primary-foreground">
            <MousePointer className="h-4 w-4 mr-2" />
            Drop to create event
          </Badge>
        </div>
      )}
    </div>
  );
}

// Enhanced event templates with AI suggestions
const ENHANCED_EVENT_TEMPLATES: EnhancedEventTemplate[] = [
  {
    id: 'ai-focus-time',
    title: 'AI-Optimized Focus Time',
    category: 'effort',
    defaultDuration: '2h',
    description: 'AI-suggested deep work block based on your productivity patterns',
    icon: Zap,
    color: 'hsl(var(--chart-3))',
    aiSuggested: true,
    tags: ['focus', 'deep-work', 'productivity'],
    priority: 'high',
    recurrence: 'daily',
    fullCalendarProps: {
      editable: true,
      backgroundColor: 'hsl(var(--chart-3))',
      textColor: 'white',
    },
    toastUIProps: { isReadOnly: false, category: 'time' },
  },
  {
    id: 'smart-meeting',
    title: 'Smart Team Sync',
    category: 'work',
    defaultDuration: '45m',
    description: 'AI-optimized meeting length for maximum effectiveness',
    icon: Users,
    color: 'hsl(var(--chart-1))',
    aiSuggested: true,
    tags: ['meeting', 'team', 'sync'],
    priority: 'medium',
    recurrence: 'weekly',
    fullCalendarProps: {
      editable: true,
      constraint: 'businessHours',
    },
  },
  {
    id: 'deadline-tracker',
    title: 'Project Deadline',
    category: 'deadline',
    defaultDuration: 'all-day',
    description: 'Important project milestone with automatic reminders',
    icon: AlertCircle,
    color: 'hsl(var(--destructive))',
    tags: ['deadline', 'project', 'milestone'],
    priority: 'urgent',
    recurrence: 'none',
    fullCalendarProps: {
      allDay: true,
      backgroundColor: 'hsl(var(--destructive))',
    },
  },
  {
    id: 'personal-task',
    title: 'Personal Task',
    category: 'personal',
    defaultDuration: '30m',
    description: 'Personal appointments and tasks',
    icon: Calendar,
    color: 'hsl(var(--chart-4))',
    tags: ['personal', 'task'],
    priority: 'low',
    recurrence: 'none',
  },
  {
    id: 'note-review',
    title: 'Note Review Session',
    category: 'note',
    defaultDuration: '15m',
    description: 'Review and organize notes and documentation',
    icon: FileText,
    color: 'hsl(var(--chart-5))',
    tags: ['notes', 'review', 'documentation'],
    priority: 'low',
    recurrence: 'daily',
  },
  {
    id: 'ai-break-reminder',
    title: 'Smart Break',
    category: 'personal',
    defaultDuration: '15m',
    description: 'AI-suggested break time based on your work patterns',
    icon: Clock,
    color: 'hsl(var(--accent))',
    aiSuggested: true,
    tags: ['break', 'wellness', 'productivity'],
    priority: 'medium',
    recurrence: 'daily',
  },
];

interface EnhancedDragDropSystemProps {
  className?: string;
  onEventCreate?: (event: Partial<Event>) => void;
  onTemplateClone?: (template: EnhancedEventTemplate) => void;
  calendarRef?: React.RefObject<HTMLElement>;
  enableAISuggestions?: boolean;
  maxTemplates?: number;
}

export function EnhancedDragDropSystem({
  className,
  onEventCreate,
  onTemplateClone,
  calendarRef,
  enableAISuggestions = true,
  maxTemplates = 10,
}: EnhancedDragDropSystemProps) {
  const [activeTemplate, setActiveTemplate] = useState<EnhancedEventTemplate | null>(null);
  const [_draggedEventData, _setDraggedEventData] = useState<any>(null);
  const _performanceMonitor = usePerformanceMonitor(ENHANCED_EVENT_TEMPLATES.length);
  const draggableRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter templates based on AI suggestions preference
  const visibleTemplates = useMemo(() => {
    const templates = enableAISuggestions
      ? ENHANCED_EVENT_TEMPLATES
      : ENHANCED_EVENT_TEMPLATES.filter((t) => !t.aiSuggested);

    return templates.slice(0, maxTemplates);
  }, [enableAISuggestions, maxTemplates]);

  // Initialize FullCalendar draggables for external events
  useEffect(() => {
    const draggables: Draggable[] = [];

    visibleTemplates.forEach((template) => {
      const element = draggableRefs.current.get(template.id);
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
              template,
              isTemplate: true,
              priority: template.priority,
              tags: template.tags,
              aiSuggested: template.aiSuggested,
            },
            ...template.fullCalendarProps,
          },
        });
        draggables.push(draggable);
      }
    });

    return () => {
      draggables.forEach((draggable) => draggable.destroy());
    };
  }, [visibleTemplates]);

  // Handle DnD Kit drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const template = visibleTemplates.find((t) => t.id === active.id);

      if (template) {
        setActiveTemplate(template);
        notify.info(`Dragging ${template.title}`, { duration: 1000 });
      }
    },
    [visibleTemplates]
  );

  // Handle DnD Kit drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTemplate(null);

      if (!over) {
        notify.warning('Event template dropped outside calendar');
        return;
      }

      const template = visibleTemplates.find((t) => t.id === active.id);
      if (!template) return;

      // Handle drop on calendar area
      if (over.data.current?.type === 'calendar-drop-area') {
        const dropDate = new Date(); // Should be calculated from drop position

        if (onEventCreate) {
          const eventData: Partial<Event> = {
            title: template.title,
            startDate: startOfDay(dropDate),
            endDate:
              template.defaultDuration === 'all-day'
                ? endOfDay(dropDate)
                : addHours(startOfDay(dropDate), 1),
            category: template.category,
            description: template.description,
            tags: template.tags,
            priority: template.priority as any,
          };

          onEventCreate(eventData);
          notify.success(`Created "${template.title}" on ${format(dropDate, 'MMM d')}`);
        }

        // Handle drop callback
        if (over.data.current?.onDrop) {
          over.data.current.onDrop(template, dropDate);
        }
      }
    },
    [visibleTemplates, onEventCreate]
  );

  // Handle template cloning
  const _handleTemplateClone = useCallback(
    (template: EnhancedEventTemplate) => {
      if (onTemplateClone) {
        onTemplateClone(template);
        notify.success(`Cloned template: ${template.title}`);
      }
    },
    [onTemplateClone]
  );

  // Handle quick event creation
  const _handleQuickCreate = useCallback(
    (template: EnhancedEventTemplate) => {
      if (onEventCreate) {
        const today = new Date();
        const eventData: Partial<Event> = {
          title: template.title,
          startDate: startOfDay(today),
          endDate:
            template.defaultDuration === 'all-day'
              ? endOfDay(today)
              : addHours(startOfDay(today), 1),
          category: template.category,
          description: template.description,
          tags: template.tags,
          priority: template.priority as any,
        };

        onEventCreate(eventData);
        notify.success(`Quick-created: ${template.title}`);
      }
    },
    [onEventCreate]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('enhanced-drag-drop-system', className)}>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Event Templates</h3>
                {enableAISuggestions && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
              <Badge variant="secondary">{visibleTemplates.length} templates</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
              {visibleTemplates.map((template) => (
                <div
                  key={template.id}
                  ref={(el) => {
                    if (el) {
                      draggableRefs.current.set(template.id, el);
                    }
                  }}
                >
                  <DraggableEventTemplate
                    template={template}
                    isActive={activeTemplate?.id === template.id}
                  />
                </div>
              ))}
            </div>

            {/* AI Suggestions Toggle */}
            {ENHANCED_EVENT_TEMPLATES.some((t) => t.aiSuggested) && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">AI-Enhanced Templates</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Templates marked with AI badges are optimized based on productivity patterns and
                  best practices.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTemplate ? (
          <div className="rotate-3 shadow-2xl">
            <DraggableEventTemplate template={activeTemplate} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Export enhanced event templates for use in other components
export { ENHANCED_EVENT_TEMPLATES, type EnhancedEventTemplate, DroppableCalendarArea };
