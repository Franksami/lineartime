'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { isToday } from 'date-fns'

interface DroppableCalendarDayProps {
  date: Date
  day: number
  isCurrentDay?: boolean
  onDateSelect?: (date: Date) => void
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DroppableCalendarDay({
  date,
  day,
  isCurrentDay = false,
  onDateSelect,
  children,
  className,
  style,
}: DroppableCalendarDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: {
      date,
      type: 'calendar-day',
    },
  })

  return (
    <button
      ref={setNodeRef}
      onClick={() => onDateSelect?.(date)}
      className={cn(
        "relative bg-background",
        "border-t border-border",
        "p-1 transition-colors",
        isOver && "bg-primary/10",
        !isOver && "hover:bg-muted/30",
        isCurrentDay && "ring-2 ring-primary ring-inset",
        className
      )}
      style={style}
    >
      <span className={cn(
        "absolute top-1 left-1 text-xs z-0",
        isCurrentDay ? "font-bold text-primary" : "text-muted-foreground"
      )}>
        {day}
      </span>
      {isOver && (
        <div className="absolute inset-0 border-2 border-primary border-dashed rounded pointer-events-none z-20" />
      )}
      {children}
    </button>
  )
}