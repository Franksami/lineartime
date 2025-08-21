'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Copy,
  Repeat
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Event, EventCategory } from '@/types/calendar'

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  onDelete?: (id: string) => void
  onDuplicate?: (event: Event) => void
  isDragging?: boolean
  isSelected?: boolean
  className?: string
  compact?: boolean
}

const categoryColors: Record<EventCategory, string> = {
  personal: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  work: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  effort: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
  note: 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
}

const categoryAccents: Record<EventCategory, string> = {
  personal: 'bg-green-500',
  work: 'bg-blue-500',
  effort: 'bg-orange-500',
  note: 'bg-purple-500'
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onDuplicate,
  isDragging = false,
  isSelected = false,
  className,
  compact = false
}: EventCardProps) {
  const isMultiDay = event.startDate && event.endDate && 
    format(event.startDate, 'yyyy-MM-dd') !== format(event.endDate, 'yyyy-MM-dd')

  const handleClick = (e: React.MouseEvent) => {
    if (!e.defaultPrevented && onEdit) {
      onEdit(event)
    }
  }

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative px-2 py-1 rounded-md cursor-pointer transition-all duration-200',
          'bg-gradient-to-r backdrop-blur-md',
          categoryColors[event.category],
          'border border-white/20 dark:border-white/10',
          'hover:scale-[1.02] hover:shadow-lg',
          isDragging && 'opacity-50 scale-95',
          isSelected && 'ring-2 ring-blue-500 ring-offset-1',
          className
        )}
      >
        <div className="flex items-center gap-1">
          <div className={cn('w-1.5 h-1.5 rounded-full', categoryAccents[event.category])} />
          <span className="text-xs font-medium truncate">{event.title}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative p-4 rounded-xl cursor-pointer transition-all duration-200',
        'bg-gradient-to-br backdrop-blur-xl',
        categoryColors[event.category],
        'border border-white/30 dark:border-white/10',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
        'hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.25)]',
        'hover:scale-[1.02] hover:-translate-y-0.5',
        'before:absolute before:inset-0 before:rounded-xl',
        'before:bg-gradient-to-br before:from-white/10 before:to-transparent',
        'before:pointer-events-none before:opacity-0 before:transition-opacity',
        'hover:before:opacity-100',
        isDragging && 'opacity-50 scale-95 rotate-2',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        className
      )}
    >
      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {event.title}
            </h3>
            {event.recurrence && (
              <Badge 
                variant="secondary" 
                className="mt-1 text-xs bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-white/30 dark:border-white/10"
            >
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(event)
                }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(event)
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {(onEdit || onDuplicate) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(event.id)
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {/* Date/Time */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs">
              {event.startDate && format(event.startDate, 'PPP')}
              {isMultiDay && event.endDate && ` - ${format(event.endDate, 'PPP')}`}
            </span>
          </div>

          {/* Time */}
          {!event.allDay && event.startDate && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs">
                {format(event.startDate, 'p')}
                {event.endDate && ` - ${format(event.endDate, 'p')}`}
              </span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs truncate">{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Category Indicator */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-xl">
          <div className={cn(
            'absolute -top-6 -right-6 w-12 h-12 rotate-45',
            categoryAccents[event.category],
            'opacity-20'
          )} />
        </div>
      </div>
    </div>
  )
}