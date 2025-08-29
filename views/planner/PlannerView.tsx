/**
 * PlannerView - Kanban task management with time-blocking
 * Research validation: Manifestly workflow patterns + @dnd-kit drag & drop
 */

'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  MoreVertical,
  GripVertical,
} from 'lucide-react';
import { ViewScaffold, useViewScaffold } from '@/components/_deprecated/ViewScaffold';
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * Task interface based on research-validated workflow patterns
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  timeBlocked?: {
    start: string;
    end: string;
    date: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Kanban columns configuration (research: Manifestly step-based progression)
 */
const KANBAN_COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    description: 'Tasks ready to start',
    color: 'bg-muted',
    limit: null,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    description: 'Currently working on',
    color: 'bg-accent',
    limit: 3, // Work-in-progress limit
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Awaiting review or approval',
    color: 'bg-secondary',
    limit: null,
  },
  {
    id: 'done',
    title: 'Done',
    description: 'Completed tasks',
    color: 'bg-card',
    limit: null,
  },
] as const;

/**
 * Sample tasks for development (to be replaced with real data integration)
 */
const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Implement Command Workspace shell',
    description: 'Build three-pane layout with resizable panels',
    status: 'done',
    priority: 'high',
    assignee: 'Developer',
    dueDate: '2025-08-28',
    estimatedHours: 8,
    tags: ['development', 'frontend'],
    createdAt: '2025-08-27T10:00:00Z',
    updatedAt: '2025-08-28T15:00:00Z',
  },
  {
    id: '2',
    title: 'Build command palette with fuzzy search',
    description: 'Implement Obsidian-style command palette',
    status: 'done',
    priority: 'high',
    assignee: 'Developer',
    estimatedHours: 4,
    tags: ['development', 'ux'],
    createdAt: '2025-08-27T11:00:00Z',
    updatedAt: '2025-08-28T16:00:00Z',
  },
  {
    id: '3',
    title: 'Integrate AI agents with constraint solving',
    description: 'Implement Timefold AI patterns for conflict resolution',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Developer',
    dueDate: '2025-08-30',
    estimatedHours: 12,
    tags: ['ai', 'algorithms'],
    createdAt: '2025-08-28T09:00:00Z',
    updatedAt: '2025-08-28T16:30:00Z',
  },
  {
    id: '4',
    title: 'Add computer vision privacy features',
    description: 'Local processing with ImageSorcery MCP patterns',
    status: 'todo',
    priority: 'medium',
    estimatedHours: 6,
    tags: ['ai', 'privacy'],
    createdAt: '2025-08-28T10:00:00Z',
    updatedAt: '2025-08-28T10:00:00Z',
  },
];

/**
 * Planner View state management
 */
function usePlannerView() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const { measureRender, announceViewChange } = useViewScaffold('Planner');

  // Drag & drop sensors (research: @dnd-kit best practices)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = !filterTag || task.tags.includes(filterTag);

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, filterTag]);

  // Group tasks by status for kanban columns
  const tasksByStatus = useMemo(() => {
    return KANBAN_COLUMNS.reduce(
      (acc, column) => {
        acc[column.id] = filteredTasks.filter((task) => task.status === column.id);
        return acc;
      },
      {} as Record<string, Task[]>
    );
  }, [filteredTasks]);

  // Handle drag events (research: Manifestly step-based progression patterns)
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setDraggedTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );

    setDraggedTask(null);

    // Log workflow progression (research: Manifestly audit patterns)
    console.log(`Task moved: ${taskId} → ${newStatus}`);
  };

  return {
    tasks: filteredTasks,
    tasksByStatus,
    draggedTask,
    searchQuery,
    setSearchQuery,
    filterTag,
    setFilterTag,
    sensors,
    handleDragStart,
    handleDragEnd,
    measureRender,
  };
}

/**
 * Planner View Header
 */
function PlannerViewHeader({
  searchQuery,
  onSearchChange,
  filterTag,
  onFilterChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTag: string | null;
  onFilterChange: (tag: string | null) => void;
}) {
  const allTags = ['development', 'frontend', 'ai', 'algorithms', 'privacy', 'ux'];

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Planner</h2>
        <Badge variant="secondary" className="text-xs">
          Kanban + Time-blocking
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-10 h-8"
          />
        </div>

        {/* Tag filter */}
        <div className="flex items-center gap-1">
          <Button
            variant={filterTag === null ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(null)}
            className="h-7 px-2 text-xs"
          >
            All
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={filterTag === tag ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(tag)}
              className="h-7 px-2 text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* New task button */}
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  );
}

/**
 * Kanban Column Component
 */
function KanbanColumn({
  column,
  tasks,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  tasks: Task[];
}) {
  return (
    <Card className="flex flex-col h-full bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <p className="text-xs text-muted-foreground">{column.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {tasks.length}
            </Badge>
            {column.limit && tasks.length >= column.limit && (
              <Badge variant="destructive" className="text-xs">
                Limit: {column.limit}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

/**
 * Draggable Task Card Component
 */
function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-accent text-accent-foreground',
    high: 'bg-secondary text-secondary-foreground',
    urgent: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {/* Task title */}
            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

            {/* Task description */}
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}

            {/* Task metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                {task.priority}
              </Badge>

              {task.estimatedHours && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimatedHours}h
                </div>
              )}

              {task.assignee && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assignee}
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Task tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Time blocking indicator */}
            {task.timeBlocked && (
              <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                Time-blocked: {task.timeBlocked.start} - {task.timeBlocked.end}
              </div>
            )}
          </div>

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Planner View Quick Actions
 */
function PlannerViewActions() {
  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" className="shadow-lg">
        <Plus className="h-4 w-4 mr-2" />
        Quick Task
      </Button>

      <Button variant="outline" size="sm" className="shadow-lg">
        <Clock className="h-4 w-4 mr-2" />
        Time Block
      </Button>
    </div>
  );
}

/**
 * Main Planner View Component
 */
export function PlannerView() {
  const {
    tasks,
    tasksByStatus,
    draggedTask,
    searchQuery,
    setSearchQuery,
    filterTag,
    setFilterTag,
    sensors,
    handleDragStart,
    handleDragEnd,
  } = usePlannerView();

  const plannerViewEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.VIEWS_PLANNER);

  if (!plannerViewEnabled) {
    return (
      <div data-testid="planner-view" className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <GripVertical className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Planner View</h3>
          <p className="text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline">views.planner</Badge>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ViewScaffold
        header={
          <PlannerViewHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterTag={filterTag}
            onFilterChange={setFilterTag}
          />
        }
        content={
          <div data-testid="planner-view" className="flex-1 overflow-hidden p-4">
            {/* Kanban Board */}
            <div data-testid="kanban-board" className="grid grid-cols-4 gap-4 h-full">
              {KANBAN_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasksByStatus[column.id] || []}
                />
              ))}
            </div>

            {/* Drag overlay */}
            {draggedTask && (
              <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute top-4 left-4 bg-background border border-border rounded-lg shadow-lg p-2">
                  <div className="text-sm font-medium">{draggedTask.title}</div>
                  <div className="text-xs text-muted-foreground">Moving to new column...</div>
                </div>
              </div>
            )}
          </div>
        }
        actions={<PlannerViewActions />}
        contextPanels={['ai', 'details', 'capacity']}
        scrollable={false} // Custom scroll handling for kanban
      />
    </DndContext>
  );
}
