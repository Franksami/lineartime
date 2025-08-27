'use client';

import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { differenceInDays, format } from 'date-fns';
import React from 'react';

interface DraggableEventBarProps {
  event: Event;
  startColumn: number;
  endColumn: number;
  row: number;
  onEventClick?: (event: Event) => void;
  cellWidth?: number;
  cellHeight?: number;
  isDragging?: boolean;
}

const categoryColors = {
  personal: 'bg-primary hover:bg-primary/80 text-primary-foreground',
  work: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  effort: 'bg-accent hover:bg-accent/80 text-accent-foreground',
  note: 'bg-muted hover:bg-muted/80 text-muted-foreground',
} as const;

export function DraggableEventBar({
  event,
  startColumn,
  endColumn,
  row,
  onEventClick,
  cellWidth = 40,
  cellHeight = 36,
  isDragging = false,
}: DraggableEventBarProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: event.id,
    data: {
      event,
      type: 'event',
    },
  });

  const width = (endColumn - startColumn + 1) * cellWidth - 4;
  const left = startColumn * cellWidth + 2;
  const top = row * 20 + 18;

  const duration = differenceInDays(event.endDate, event.startDate) + 1;
  const timeText = duration === 1 ? format(event.startDate, 'HH:mm') : `${duration}d`;

  const style = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: '18px',
    transform: CSS.Translate.toString(transform),
    opacity: isCurrentlyDragging ? 0.5 : 1,
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute z-10 px-1 py-0.5 rounded text-xs font-medium',
        'transition-all duration-200 shadow-sm hover:shadow-md',
        'truncate flex items-center gap-1',
        categoryColors[event.category as keyof typeof categoryColors] || categoryColors.personal,
        isCurrentlyDragging && 'z-50 shadow-lg'
      )}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isCurrentlyDragging) {
          e.stopPropagation();
          onEventClick?.(event);
        }
      }}
      title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
    >
      <span className="truncate flex-1">{event.title}</span>
      <span className="text-[10px] opacity-80">{timeText}</span>
    </div>
  );
}
