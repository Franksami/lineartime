'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { 
  Copy,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Users,
  Bell,
  Link,
  Split,
  Merge,
  RotateCcw,
  Zap,
  Star,
  Pin,
  Share,
  Download,
  Upload,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  ArrowRight,
  Layers,
  BookOpen,
  Settings,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react'
import { format, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns'
import type { Event, EventCategory, EventPriority } from '@/types/calendar'
import { notify } from '@/components/ui/notify'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

// Enhanced event with additional management properties
export interface ManagedEvent extends Event {
  isSelected?: boolean
  isHidden?: boolean
  isPinned?: boolean
  isArchived?: boolean
  relationships?: {
    dependencies: string[]
    dependents: string[]
    linked: string[]
  }
  aiSuggestions?: {
    timeOptimization: string
    categoryRecommendation: EventCategory
    conflictResolution: string[]
  }
  syncStatus?: {
    google?: 'synced' | 'pending' | 'error'
    outlook?: 'synced' | 'pending' | 'error' 
    apple?: 'synced' | 'pending' | 'error'
  }
  analytics?: {
    completionRate: number
    timeSpent: number
    productivity: number
  }
}

// Bulk operation types
export type BulkOperation = 
  | 'delete'
  | 'archive' 
  | 'unarchive'
  | 'categorize'
  | 'prioritize'
  | 'tag'
  | 'schedule'
  | 'duplicate'
  | 'export'

// Event management context for operations
interface EventManagementContext {
  events: ManagedEvent[]
  selectedEvents: Set<string>
  filters: {
    categories: Set<EventCategory>
    priorities: Set<EventPriority>
    tags: Set<string>
    dateRange?: { start: Date; end: Date }
    searchQuery: string
    showHidden: boolean
    showArchived: boolean
  }
  sorting: {
    field: 'title' | 'startDate' | 'priority' | 'category'
    direction: 'asc' | 'desc'
  }
}

// Individual event context menu component
function EventContextMenu({ 
  event, 
  children, 
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onPin,
  onAddTag,
  onChangeCategory,
  onChangePriority,
  onCreateDependency,
  onAIOptimize,
}: {
  event: ManagedEvent
  children: React.ReactNode
  onEdit?: (event: ManagedEvent) => void
  onDelete?: (eventId: string) => void
  onDuplicate?: (event: ManagedEvent) => void
  onArchive?: (eventId: string) => void
  onPin?: (eventId: string) => void
  onAddTag?: (eventId: string, tag: string) => void
  onChangeCategory?: (eventId: string, category: EventCategory) => void
  onChangePriority?: (eventId: string, priority: EventPriority) => void
  onCreateDependency?: (fromId: string, toId: string) => void
  onAIOptimize?: (eventId: string) => void
}) {
  const categories: EventCategory[] = ['personal', 'work', 'effort', 'note', 'meeting', 'deadline', 'milestone']
  const priorities: EventPriority[] = ['critical', 'high', 'medium', 'low', 'optional']

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* Quick Actions */}
        <ContextMenuItem onClick={() => onEdit?.(event)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Event
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onDuplicate?.(event)}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onPin?.(event.id)}>
          <Pin className="h-4 w-4 mr-2" />
          {event.isPinned ? 'Unpin' : 'Pin'} Event
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* AI-Enhanced Actions */}
        <ContextMenuItem onClick={() => onAIOptimize?.(event.id)}>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Optimize Time
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Target className="h-4 w-4 mr-2" />
            Smart Actions
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Find Better Time
            </ContextMenuItem>
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Suggest Attendees
            </ContextMenuItem>
            <ContextMenuItem>
              <Link className="h-4 w-4 mr-2" />
              Create Follow-up
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Category Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Tag className="h-4 w-4 mr-2" />
            Change Category
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {categories.map(category => (
              <ContextMenuItem 
                key={category} 
                onClick={() => onChangeCategory?.(event.id, category)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  <span className="capitalize">{category}</span>
                  {event.category === category && <CheckCircle className="h-3 w-3 ml-auto" />}
                </div>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Priority Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Change Priority
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {priorities.map(priority => (
              <ContextMenuItem 
                key={priority} 
                onClick={() => onChangePriority?.(event.id, priority)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    priority === 'critical' && "bg-red-500",
                    priority === 'high' && "bg-orange-500",
                    priority === 'medium' && "bg-yellow-500",
                    priority === 'low' && "bg-green-500",
                    priority === 'optional' && "bg-gray-400"
                  )} />
                  <span className="capitalize">{priority}</span>
                  {event.priority === priority && <CheckCircle className="h-3 w-3 ml-auto" />}
                </div>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Relationship Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Link className="h-4 w-4 mr-2" />
            Relationships
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              <ArrowRight className="h-4 w-4 mr-2" />
              Add Dependency
            </ContextMenuItem>
            <ContextMenuItem>
              <Layers className="h-4 w-4 mr-2" />
              Link Related Event
            </ContextMenuItem>
            <ContextMenuItem>
              <Split className="h-4 w-4 mr-2" />
              Split Event
            </ContextMenuItem>
            <ContextMenuItem>
              <Merge className="h-4 w-4 mr-2" />
              Merge Events
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Sync Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <BookOpen className="h-4 w-4 mr-2" />
            External Sync
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              <div className="flex items-center gap-2 w-full">
                Google Calendar
                {event.syncStatus?.google === 'synced' && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
                {event.syncStatus?.google === 'pending' && <Clock className="h-3 w-3 text-yellow-500 ml-auto" />}
                {event.syncStatus?.google === 'error' && <XCircle className="h-3 w-3 text-red-500 ml-auto" />}
              </div>
            </ContextMenuItem>
            <ContextMenuItem>
              <div className="flex items-center gap-2 w-full">
                Outlook Calendar
                {event.syncStatus?.outlook === 'synced' && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
              </div>
            </ContextMenuItem>
            <ContextMenuItem>
              <div className="flex items-center gap-2 w-full">
                Apple Calendar
                {event.syncStatus?.apple === 'synced' && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Destructive Actions */}
        <ContextMenuItem onClick={() => onArchive?.(event.id)}>
          <Archive className="h-4 w-4 mr-2" />
          {event.isArchived ? 'Unarchive' : 'Archive'}
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={() => onDelete?.(event.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Event
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Bulk operations toolbar
function BulkOperationsToolbar({
  selectedCount,
  onBulkOperation,
  onSelectAll,
  onClearSelection,
}: {
  selectedCount: number
  onBulkOperation: (operation: BulkOperation, data?: any) => void
  onSelectAll: () => void
  onClearSelection: () => void
}) {
  if (selectedCount === 0) return null

  return (
    <Card className="mb-4 bg-primary/5 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} event{selectedCount !== 1 ? 's' : ''} selected
            </Badge>

            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSelectAll}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClearSelection}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Select onValueChange={(value) => onBulkOperation('categorize', value)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="effort">Effort</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => onBulkOperation('prioritize', value)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkOperation('duplicate')}
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkOperation('archive')}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkOperation('export')}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onBulkOperation('delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Advanced event filters
function EventFilters({ 
  context, 
  onContextChange 
}: { 
  context: EventManagementContext
  onContextChange: (context: Partial<EventManagementContext>) => void 
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={context.filters.searchQuery}
            onChange={(e) => onContextChange({
              filters: { ...context.filters, searchQuery: e.target.value }
            })}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {['personal', 'work', 'effort', 'note', 'meeting', 'deadline', 'milestone'].map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={context.filters.categories.has(category as EventCategory)}
                  onCheckedChange={(checked) => {
                    const newCategories = new Set(context.filters.categories)
                    if (checked) {
                      newCategories.add(category as EventCategory)
                    } else {
                      newCategories.delete(category as EventCategory)
                    }
                    onContextChange({
                      filters: { ...context.filters, categories: newCategories }
                    })
                  }}
                />
                <label
                  htmlFor={`category-${category}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-hidden"
              checked={context.filters.showHidden}
              onCheckedChange={(checked) => onContextChange({
                filters: { ...context.filters, showHidden: checked }
              })}
            />
            <label htmlFor="show-hidden" className="text-sm">Show hidden</label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={context.filters.showArchived}
              onCheckedChange={(checked) => onContextChange({
                filters: { ...context.filters, showArchived: checked }
              })}
            />
            <label htmlFor="show-archived" className="text-sm">Show archived</label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function for category colors
function getCategoryColor(category: EventCategory): string {
  const colors = {
    personal: '#3b82f6',
    work: '#10b981',
    effort: '#f59e0b',
    note: '#8b5cf6',
    meeting: '#06b6d4',
    deadline: '#ef4444',
    milestone: '#ec4899'
  }
  return colors[category] || colors.personal
}

// Main Enhanced Event Management component
export function EnhancedEventManagement({
  events = [],
  onEventUpdate,
  onEventDelete,
  onBulkOperation,
  className,
}: {
  events: Event[]
  onEventUpdate?: (event: Event) => void
  onEventDelete?: (eventId: string) => void
  onBulkOperation?: (operation: BulkOperation, eventIds: string[], data?: any) => void
  className?: string
}) {
  // Convert events to managed events
  const managedEvents: ManagedEvent[] = useMemo(() => 
    events.map(event => ({ ...event, isSelected: false })), [events])

  const [context, setContext] = useState<EventManagementContext>({
    events: managedEvents,
    selectedEvents: new Set(),
    filters: {
      categories: new Set(),
      priorities: new Set(),
      tags: new Set(),
      searchQuery: '',
      showHidden: false,
      showArchived: false,
    },
    sorting: {
      field: 'startDate',
      direction: 'asc'
    }
  })

  const performanceMonitor = usePerformanceMonitor(managedEvents.length)

  // Update context when events change
  useEffect(() => {
    setContext(prev => ({ ...prev, events: managedEvents }))
  }, [managedEvents])

  // Handle context updates
  const handleContextChange = useCallback((updates: Partial<EventManagementContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }, [])

  // Handle bulk operations
  const handleBulkOperation = useCallback((operation: BulkOperation, data?: any) => {
    const selectedIds = Array.from(context.selectedEvents)
    
    if (onBulkOperation) {
      onBulkOperation(operation, selectedIds, data)
    }

    // Clear selection after operation
    setContext(prev => ({ ...prev, selectedEvents: new Set() }))
    
    notify.success(`${operation} applied to ${selectedIds.length} event${selectedIds.length !== 1 ? 's' : ''}`)
  }, [context.selectedEvents, onBulkOperation])

  // Handle individual event operations
  const handleEventEdit = useCallback((event: ManagedEvent) => {
    notify.info(`Opening editor for: ${event.title}`)
  }, [])

  const handleEventDelete = useCallback((eventId: string) => {
    if (onEventDelete) {
      onEventDelete(eventId)
    }
    notify.success('Event deleted')
  }, [onEventDelete])

  return (
    <div className={cn('enhanced-event-management', className)}>
      <EventFilters 
        context={context} 
        onContextChange={handleContextChange}
      />

      <BulkOperationsToolbar
        selectedCount={context.selectedEvents.size}
        onBulkOperation={handleBulkOperation}
        onSelectAll={() => setContext(prev => ({ 
          ...prev, 
          selectedEvents: new Set(prev.events.map(e => e.id)) 
        }))}
        onClearSelection={() => setContext(prev => ({ 
          ...prev, 
          selectedEvents: new Set() 
        }))}
      />

      {/* Event List with Context Menus */}
      <div className="space-y-2">
        {managedEvents.map(event => (
          <EventContextMenu
            key={event.id}
            event={event}
            onEdit={handleEventEdit}
            onDelete={handleEventDelete}
            onDuplicate={(event) => notify.info(`Duplicating: ${event.title}`)}
            onArchive={(id) => notify.info(`Archiving event: ${id}`)}
            onPin={(id) => notify.info(`Pinning event: ${id}`)}
            onChangeCategory={(id, category) => notify.info(`Changed category to: ${category}`)}
            onChangePriority={(id, priority) => notify.info(`Changed priority to: ${priority}`)}
            onAIOptimize={(id) => notify.info(`AI optimizing event: ${id}`)}
          >
            <Card className={cn(
              'p-3 cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:bg-accent/50',
              event.isSelected && 'ring-2 ring-primary',
              event.isPinned && 'border-l-4 border-l-yellow-500',
              event.isArchived && 'opacity-60'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={context.selectedEvents.has(event.id)}
                    onCheckedChange={(checked) => {
                      const newSelection = new Set(context.selectedEvents)
                      if (checked) {
                        newSelection.add(event.id)
                      } else {
                        newSelection.delete(event.id)
                      }
                      setContext(prev => ({ ...prev, selectedEvents: newSelection }))
                    }}
                  />
                  
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(event.startDate, 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {event.aiSuggestions && (
                    <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  <Badge>{event.category}</Badge>
                  {event.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
            </Card>
          </EventContextMenu>
        ))}
      </div>
    </div>
  )
}

export type { ManagedEvent, BulkOperation, EventManagementContext }