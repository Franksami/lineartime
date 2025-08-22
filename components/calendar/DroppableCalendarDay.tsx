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
        "relative bg-white dark:bg-neutral-900",
        "border-t border-neutral-100 dark:border-neutral-800",
        "p-1 transition-colors",
        isOver && "bg-blue-50 dark:bg-blue-950",
        !isOver && "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        isCurrentDay && "ring-2 ring-blue-500 ring-inset",
        className
      )}
      style={style}
    >
      <span className={cn(
        "absolute top-1 left-1 text-xs z-0",
        isCurrentDay ? "font-bold text-blue-600" : "text-neutral-700 dark:text-neutral-300"
      )}>
        {day}
      </span>
      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded pointer-events-none z-20" />
      )}
      {children}
    </button>
  )
}