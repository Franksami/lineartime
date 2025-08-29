'use client';

import { Button } from '@/components/ui/button';
import { useOfflineEvents } from '@/hooks/useIndexedDB';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGesture } from '@use-gesture/react';
import { addDays, isToday } from 'date-fns';
import { Home, Minus, Move, Plus } from 'lucide-react';
import { Resizable } from 're-resizable';
import React from 'react';
import { EventModal } from './EventModal';
import { FloatingToolbar } from './FloatingToolbar';

interface CommandCenterCalendarFullBleedProps {
  year: number;
  events?: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventDelete?: (eventId: string) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  userId?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Droppable Cell Component
function DroppableCell({
  date,
  month,
  year,
  displayDay,
  cellIndex,
  cellWidth,
  isWeekend,
  isTodayCell,
  onDateSelect,
  setSelectedDate,
  setSelectedEvent,
  setModalOpen,
}: {
  date: Date | null;
  month: number;
  year: number;
  displayDay: number | null;
  cellIndex: number;
  cellWidth: number;
  isWeekend: boolean;
  isTodayCell: boolean;
  onDateSelect?: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  setModalOpen: (open: boolean) => void;
}) {
  const dropId = date ? `cell-${year}-${month}-${displayDay}` : `empty-${month}-${cellIndex}`;

  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: { date, month, year, displayDay },
  });

  const monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  const monthName = monthNames[month];

  return (
    <div
      ref={setNodeRef}
      data-testid={displayDay ? `cell-${year}-${monthName}-${displayDay}` : undefined}
      style={{ width: `${cellWidth}px` }}
      className={cn(
        'flex items-center justify-center text-xs border-r border-border/20',
        isWeekend && 'bg-muted/5',
        isTodayCell && 'bg-primary/20 font-bold text-primary today',
        displayDay && 'cursor-pointer hover:bg-accent/10 transition-colors',
        isOver && 'bg-primary/20'
      )}
      onClick={() => {
        if (displayDay && date) {
          setSelectedDate(date);
          setSelectedEvent(null);
          setModalOpen(true);
          onDateSelect?.(date);
        }
      }}
    >
      {displayDay ? String(displayDay).padStart(2, '0') : ''}
    </div>
  );
}

// Draggable and Resizable Event Item Component
function DraggableEventItem({
  event,
  left,
  top,
  width,
  cellWidth,
  categoryColors,
  onEventClick,
  onEventResize,
  isDragging,
}: {
  event: Event;
  left: number;
  top: number;
  width: number;
  cellWidth: number;
  categoryColors: Record<string, string>;
  onEventClick: (e: React.MouseEvent, event: Event) => void;
  onEventResize?: (event: Event, newWidth: number) => void;
  isDragging: boolean;
}) {
  const [isResizing, setIsResizing] = React.useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
    disabled: isResizing, // Disable dragging while resizing
  });

  const style = {
    left: `${left}px`,
    top: `${top}px`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 10,
  };

  return (
    <div ref={setNodeRef} className="absolute pointer-events-auto transition-opacity" style={style}>
      <Resizable
        size={{ width, height: 16 }}
        onResizeStart={() => setIsResizing(true)}
        onResizeStop={(_e, _direction, _ref, d) => {
          setIsResizing(false);
          const newWidth = width + d.width;
          const daySpan = Math.round(newWidth / cellWidth);
          if (onEventResize && daySpan > 0) {
            const newEndDate = addDays(event.startDate, daySpan - 1);
            onEventResize(
              {
                ...event,
                endDate: newEndDate,
              },
              daySpan * cellWidth
            );
          }
        }}
        minWidth={cellWidth - 4}
        maxWidth={cellWidth * 42} // Max 42 days (6 weeks)
        minHeight={16}
        maxHeight={16}
        grid={[cellWidth, 1]}
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: true,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        handleStyles={{
          right: { width: '4px', right: '0px', cursor: 'ew-resize' },
          left: { width: '4px', left: '0px', cursor: 'ew-resize' },
        }}
      >
        <div
          className={cn(
            'h-full rounded-sm px-1 text-white text-[10px] truncate flex items-center',
            isResizing ? 'cursor-ew-resize' : 'cursor-move',
            categoryColors[event.category as keyof typeof categoryColors] || 'bg-muted'
          )}
          {...(!isResizing ? listeners : {})}
          {...(!isResizing ? attributes : {})}
          onClick={(e) => !isResizing && onEventClick(e, event)}
          data-testid={`event-${event.id}`}
        >
          {event.title}
        </div>
      </Resizable>
    </div>
  );
}

export function CommandCenterCalendarFullBleed({
  year,
  events = [],
  className,
  onDateSelect,
  onEventClick,
  onEventUpdate,
  onEventDelete,
  onEventCreate,
  userId = 'default-user',
}: CommandCenterCalendarFullBleedProps) {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [toolbarPosition, setToolbarPosition] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { createEvent, updateEvent, deleteEvent } = useOfflineEvents(userId);

  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Helper to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Fixed layout: 6 weeks × 7 days = 42 cells per month
  const CELLS_PER_MONTH = 42;
  const MONTH_LABEL_WIDTH = 80;
  const HEADER_HEIGHT = 35;

  // Calculate cell width to fill available space
  const availableWidth = dimensions.width - MONTH_LABEL_WIDTH * 2;
  const cellWidth = Math.floor(availableWidth / CELLS_PER_MONTH);
  const rowHeight = Math.max(50, Math.floor((dimensions.height - HEADER_HEIGHT) / 12));

  // Build calendar data for all months with 6-week structure
  const calendarData = React.useMemo(() => {
    const months = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);

      months.push({
        month,
        name: MONTHS[month],
        daysInMonth,
        firstDay,
      });
    }

    return months;
  }, [year]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSelectedEvent(null);
    setToolbarPosition(null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedEvent = events.find((e) => e.id === active.id);
      if (draggedEvent && over.data.current) {
        const targetData = over.data.current;
        if (targetData.date) {
          const targetDate = targetData.date as Date;
          const daysDiff = Math.floor(
            (targetDate.getTime() - draggedEvent.startDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const updatedEvent = {
            ...draggedEvent,
            startDate: addDays(draggedEvent.startDate, daysDiff),
            endDate: draggedEvent.endDate
              ? addDays(draggedEvent.endDate, daysDiff)
              : addDays(draggedEvent.startDate, daysDiff),
          };

          // Update in IndexedDB
          if (updateEvent) {
            const dbEvent = events?.find((e) => e.id === active.id);
            if (dbEvent) {
              await updateEvent(Number.parseInt(dbEvent.id) || 0, {
                startTime: updatedEvent.startDate.getTime(),
                endTime: updatedEvent.endDate?.getTime() || updatedEvent.startDate.getTime(),
              });
            }
          }

          // Call parent update handler
          onEventUpdate?.(updatedEvent);
        }
      }
    }

    setActiveId(null);
  };

  const activeEvent = events.find((e) => e.id === activeId);

  // Pan and zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Gesture handling for pan
  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y] }) => {
        setPan({ x, y });
      },
      onWheel: ({ event, delta: [, dy] }) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (dy < 0) handleZoomIn();
          else handleZoomOut();
        }
      },
    },
    {
      drag: {
        from: () => [pan.x, pan.y],
      },
      eventOptions: { passive: false },
    }
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        data-testid="calendar-fullbleed"
        className={cn(
          'h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col relative',
          className
        )}
      >
        {/* Zoom Controls */}
        <div
          data-testid="zoom-controls"
          className="absolute top-4 right-4 z-50 flex gap-2 bg-card border border-border rounded-lg p-2 shadow-sm"
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={scale >= 2}
            className="h-8 w-8"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleReset}
            className="h-8 w-8"
            title="Reset view"
            aria-label="Reset view"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-2 text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Pan/Zoom Container */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
            cursor: activeId ? 'grabbing' : 'grab',
          }}
          {...bind()}
        >
          {/* Fixed header with weekday labels */}
          <div
            className="flex border-b border-border/30 flex-shrink-0"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <div style={{ width: `${MONTH_LABEL_WIDTH}px` }} className="flex-shrink-0" />
            <div className="flex" style={{ width: `${cellWidth * CELLS_PER_MONTH}px` }}>
              {/* Show 42 columns of weekday headers */}
              {Array.from({ length: CELLS_PER_MONTH }, (_, i) => (
                <div
                  key={i}
                  style={{ width: `${cellWidth}px` }}
                  className="flex items-center justify-center text-xs text-muted-foreground border-r border-border/20"
                >
                  {WEEKDAYS[i % 7]}
                </div>
              ))}
            </div>
            <div style={{ width: `${MONTH_LABEL_WIDTH}px` }} className="flex-shrink-0" />
          </div>

          {/* Calendar Grid - 12 rows for months */}
          <div className="flex-1 flex flex-col">
            {calendarData.map(({ month, name, daysInMonth, firstDay }) => (
              <div
                key={month}
                className="flex border-b border-border/20"
                style={{ height: `${rowHeight}px` }}
              >
                {/* Left month label */}
                <div
                  style={{ width: `${MONTH_LABEL_WIDTH}px` }}
                  className="flex-shrink-0 flex items-center justify-center text-sm font-medium bg-background border-r border-border/30 sticky left-0 z-10"
                >
                  {name}
                </div>

                {/* Days grid - exactly 42 cells (6 weeks) */}
                <div className="flex" style={{ width: `${cellWidth * CELLS_PER_MONTH}px` }}>
                  {Array.from({ length: CELLS_PER_MONTH }, (_, cellIndex) => {
                    // Calculate if this cell should show a day
                    let displayDay: number | null = null;

                    // Check if this position should show a day
                    if (cellIndex >= firstDay && cellIndex < firstDay + daysInMonth) {
                      displayDay = cellIndex - firstDay + 1;
                    }

                    const isWeekend = cellIndex % 7 === 0 || cellIndex % 7 === 6;
                    const isTodayCell = displayDay && isToday(new Date(year, month, displayDay));
                    const cellDate = displayDay ? new Date(year, month, displayDay) : null;

                    return (
                      <DroppableCell
                        key={cellIndex}
                        date={cellDate}
                        month={month}
                        year={year}
                        displayDay={displayDay}
                        cellIndex={cellIndex}
                        cellWidth={cellWidth}
                        isWeekend={isWeekend}
                        isTodayCell={isTodayCell}
                        onDateSelect={onDateSelect}
                        setSelectedDate={setSelectedDate}
                        setSelectedEvent={setSelectedEvent}
                        setModalOpen={setModalOpen}
                      />
                    );
                  })}
                </div>

                {/* Right month label */}
                <div
                  style={{ width: `${MONTH_LABEL_WIDTH}px` }}
                  className="flex-shrink-0 flex items-center justify-center text-sm font-medium bg-background border-l border-border/30 sticky right-0 z-10"
                >
                  {name}
                </div>
              </div>
            ))}
          </div>

          {/* Event overlay layer */}
          {events.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {events.map((event, idx) => {
                const eventMonth = event.startDate.getMonth();
                const eventDay = event.startDate.getDate();
                const monthData = calendarData[eventMonth];

                if (!monthData) return null;

                const dayPosition = monthData.firstDay + eventDay - 1;
                if (dayPosition >= CELLS_PER_MONTH) return null;

                const left = MONTH_LABEL_WIDTH + dayPosition * cellWidth;
                const top = HEADER_HEIGHT + eventMonth * rowHeight + 20;

                const categoryColors = {
                  personal: 'bg-primary',
                  work: 'bg-secondary',
                  effort: 'bg-accent',
                  note: 'bg-muted',
                };

                // Calculate event width based on duration
                const eventDuration = event.endDate
                  ? Math.ceil(
                      (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1
                  : 1;
                const eventWidth = Math.min(
                  eventDuration * cellWidth - 4,
                  (42 - dayPosition) * cellWidth - 4
                );

                return (
                  <DraggableEventItem
                    key={event.id || idx}
                    event={event}
                    left={left}
                    top={top}
                    width={eventWidth}
                    cellWidth={cellWidth}
                    categoryColors={categoryColors}
                    onEventClick={(e, clickedEvent) => {
                      e.stopPropagation();
                      // Get the bounding rect of the actual event element
                      const eventElement = e.currentTarget as HTMLElement;
                      const rect = eventElement.getBoundingClientRect();
                      setSelectedEvent(clickedEvent);
                      setToolbarPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                      onEventClick?.(clickedEvent);
                    }}
                    onEventResize={async (resizedEvent, _newWidth) => {
                      // Update in IndexedDB
                      if (updateEvent) {
                        const dbEvent = events?.find((e) => e.id === resizedEvent.id);
                        if (dbEvent) {
                          await updateEvent(Number.parseInt(dbEvent.id) || 0, {
                            startTime: resizedEvent.startDate.getTime(),
                            endTime:
                              resizedEvent.endDate?.getTime() || resizedEvent.startDate.getTime(),
                          });
                        }
                      }
                      // Call parent update handler
                      onEventUpdate?.(resizedEvent);
                    }}
                    isDragging={activeId === event.id}
                  />
                );
              })}
            </div>
          )}

          {/* Floating Toolbar */}
          {selectedEvent && toolbarPosition && (
            <FloatingToolbar
              event={selectedEvent}
              position={toolbarPosition}
              onUpdate={async (updatedEvent) => {
                // Update in IndexedDB
                if (updateEvent) {
                  const dbEvent = events?.find((e) => e.id === selectedEvent.id);
                  if (dbEvent) {
                    await updateEvent(Number.parseInt(dbEvent.id) || 0, {
                      title: updatedEvent.title,
                      categoryId: updatedEvent.category,
                      startTime: updatedEvent.startDate.getTime(),
                      endTime: updatedEvent.endDate?.getTime() || updatedEvent.startDate.getTime(),
                      description: updatedEvent.description,
                      location: updatedEvent.location,
                    });
                  }
                }
                // Call parent update handler
                onEventUpdate?.(updatedEvent);
                setSelectedEvent(updatedEvent);
              }}
              onDelete={async (eventId) => {
                // Delete from IndexedDB
                if (deleteEvent) {
                  const dbEvent = events?.find((e) => e.id === eventId);
                  if (dbEvent) {
                    await deleteEvent(Number.parseInt(dbEvent.id) || 0);
                  }
                }
                // Call parent delete handler
                onEventDelete?.(eventId);
                setSelectedEvent(null);
                setToolbarPosition(null);
              }}
              onDuplicate={async (event) => {
                const duplicatedEvent: Partial<Event> = {
                  ...event,
                  id: `${event.id}-copy-${Date.now()}`,
                  title: `${event.title} (Copy)`,
                  startDate: addDays(event.startDate, 1),
                  endDate: event.endDate ? addDays(event.endDate, 1) : addDays(event.startDate, 1),
                };

                // Create in IndexedDB - only use onEventCreate if provided, otherwise use local createEvent
                if (onEventCreate) {
                  onEventCreate(duplicatedEvent);
                } else if (createEvent) {
                  await createEvent({
                    userId,
                    title: duplicatedEvent.title!,
                    startTime: duplicatedEvent.startDate?.getTime(),
                    endTime:
                      duplicatedEvent.endDate?.getTime() || duplicatedEvent.startDate?.getTime(),
                    categoryId: duplicatedEvent.category,
                    description: duplicatedEvent.description,
                    location: duplicatedEvent.location,
                    syncStatus: 'local',
                    lastModified: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                }
                setSelectedEvent(null);
                setToolbarPosition(null);
              }}
              onClose={() => {
                setSelectedEvent(null);
                setToolbarPosition(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
        {activeEvent ? (
          <div className="opacity-50 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs pointer-events-none">
            {activeEvent.title}
          </div>
        ) : null}
      </DragOverlay>

      {/* Event Modal for Creating/Editing Events */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        selectedRange={null}
        onSave={async (eventData) => {
          if (selectedEvent) {
            // Update existing event
            if (updateEvent) {
              const dbEvent = events?.find((e) => e.id === selectedEvent.id);
              if (dbEvent) {
                await updateEvent(Number.parseInt(dbEvent.id) || 0, {
                  title: eventData.title!,
                  description: eventData.description,
                  startTime: eventData.startDate?.getTime(),
                  endTime: eventData.endDate?.getTime() || eventData.startDate?.getTime(),
                  categoryId: eventData.category,
                  location: eventData.location,
                  allDay: eventData.allDay,
                  recurrence: eventData.recurrence as any,
                });
              }
            }
          } else {
            // Create new event - only use onEventCreate if provided, otherwise use local createEvent
            if (onEventCreate) {
              onEventCreate(eventData);
            } else if (createEvent) {
              await createEvent({
                userId,
                title: eventData.title!,
                startTime: eventData.startDate?.getTime(),
                endTime: eventData.endDate?.getTime() || eventData.startDate?.getTime(),
                categoryId: eventData.category,
                description: eventData.description,
                location: eventData.location,
                allDay: eventData.allDay,
                recurrence: eventData.recurrence as any,
                syncStatus: 'local',
                lastModified: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
          }
          setModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        onDelete={async (eventId) => {
          if (deleteEvent) {
            const dbEvent = events?.find((e) => e.id === eventId);
            if (dbEvent) {
              await deleteEvent(Number.parseInt(dbEvent.id) || 0);
            }
          }
          onEventDelete?.(eventId);
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        checkOverlaps={(start, end, excludeId) => {
          return events.filter((event) => {
            if (event.id === excludeId) return false;
            const eventStart = event.startDate.getTime();
            const eventEnd = event.endDate?.getTime() || eventStart;
            const checkStart = start.getTime();
            const checkEnd = end.getTime();

            return (
              (checkStart >= eventStart && checkStart < eventEnd) ||
              (checkEnd > eventStart && checkEnd <= eventEnd) ||
              (checkStart <= eventStart && checkEnd >= eventEnd)
            );
          });
        }}
      />
    </DndContext>
  );
}
