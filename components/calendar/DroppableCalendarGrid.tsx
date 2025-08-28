'use client';

import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import type React from 'react';

interface DroppableCalendarGridProps {
  id: string;
  date: Date;
  hour?: number;
  children?: React.ReactNode;
  className?: string;
  isOver?: boolean;
  canDrop?: boolean;
}

export function DroppableCalendarGrid({
  id,
  date,
  hour,
  children,
  className,
  isOver: externalIsOver,
  canDrop = true,
}: DroppableCalendarGridProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      date,
      hour,
      type: 'calendar-grid',
    },
    disabled: !canDrop,
  });

  const isHighlighted = isOver || externalIsOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-colors',
        isHighlighted && canDrop && 'bg-blue-50 /* TODO: Use semantic token */ dark:bg-blue-950 /* TODO: Use semantic token *//20',
        !canDrop && 'cursor-not-allowed',
        className
      )}
      data-droppable-id={id}
      data-date={date.toISOString()}
      data-hour={hour}
    >
      {children}
      {isHighlighted && canDrop && (
        <div className="absolute inset-0 border-2 border-blue-500 /* TODO: Use semantic token */ border-dashed rounded pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
