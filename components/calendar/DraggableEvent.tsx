'use client';

import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type React from 'react';
import { ResizableEvent } from './ResizableEvent';

interface DraggableEventProps {
  event: Event & {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  onResize?: (eventId: string, width: number, height: number) => void;
  onResizeStop?: (eventId: string, width: number, height: number) => void;
  onClick?: (event: Event) => void;
  onContextMenu?: (event: Event, e: React.MouseEvent) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onDuplicate?: (event: Event) => void;
  onMove?: (event: Event, date: Date) => void;
  onChangeCategory?: (event: Event, category: Event['category']) => void;
  isDragging?: boolean;
  dragDisabled?: boolean;
  className?: string;
  minHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  gridSize?: number;
  enableContextMenu?: boolean;
}

export function DraggableEvent({
  event,
  onResize,
  onResizeStop,
  onClick,
  onContextMenu,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onChangeCategory,
  isDragging = false,
  dragDisabled = false,
  className,
  minHeight = 30,
  minWidth = 60,
  maxWidth = 600,
  gridSize = 10,
  enableContextMenu = true,
}: DraggableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: event.id,
    data: event,
    disabled: dragDisabled,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isCurrentlyDragging && 'z-50 opacity-50',
        isDragging && 'opacity-30'
      )}
      {...(!dragDisabled ? listeners : {})}
      {...(!dragDisabled ? attributes : {})}
    >
      <ResizableEvent
        event={event}
        onResize={onResize}
        onResizeStop={onResizeStop}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMove={onMove}
        onChangeCategory={onChangeCategory}
        className={cn(className, !dragDisabled && 'cursor-move')}
        minHeight={minHeight}
        minWidth={minWidth}
        maxWidth={maxWidth}
        gridSize={gridSize}
        enableContextMenu={enableContextMenu}
      />
    </div>
  );
}
