'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { animated } from '@react-spring/web'
import { cn } from '@/lib/utils'
import { useCalendarGestures } from '@/hooks/useCalendarGestures'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import type { Event } from '@/types/calendar'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileCalendarViewProps {
  events: Event[]
  currentDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
  onAddEvent?: (date: Date) => void
  className?: string
}

export function MobileCalendarView({
  events,
  currentDate = new Date(),
  onDateSelect,
  onEventClick,
  onAddEvent,
  className
}: MobileCalendarViewProps) {
  const [viewDate, setViewDate] = useState(currentDate)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  
  // Get days for current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    return eachDayOfInterval({ start, end })
  }, [viewDate])
  
  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach(event => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, event])
    })
    return map
  }, [events])
  
  // Navigation handlers
  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setViewDate(current => 
      direction === 'next' 
        ? addMonths(current, 1)
        : subMonths(current, 1)
    )
  }, [])
  
  const handleDateLongPress = useCallback((date: Date) => {
    onAddEvent?.(date)
  }, [onAddEvent])
  
  const handleDateTap = useCallback((date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }, [onDateSelect])
  
  // Setup gesture handlers
  const {
    bind,
    containerRef,
    gestureState,
    zoom,
    animatedStyle,
    isPulling
  } = useCalendarGestures({
    onMonthChange: handleMonthChange,
    onZoomChange: setZoomLevel,
    onDateLongPress: handleDateLongPress,
    onRefresh: async () => {
      // Trigger data refresh
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  })
  
  // Get event categories for a date
  const getDateEventIndicators = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayEvents = eventsByDay.get(dateKey) || []
    const categories = new Set(dayEvents.map(e => e.category))
    return Array.from(categories).slice(0, 3) // Max 3 indicators
  }
  
  const categoryColors = {
    personal: 'bg-primary',
    work: 'bg-secondary',
    effort: 'bg-accent',
    notes: 'bg-muted'
  }
  
  return (
    <div 
      ref={containerRef}
      data-testid="mobile-calendar-view"
      className={cn(
        'relative h-full overflow-hidden bg-background touch-pan-y',
        className
      )}
      {...bind()}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-center bg-primary/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleMonthChange('prev')}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h2 className="text-lg font-semibold">
            {format(viewDate, 'MMMM yyyy')}
          </h2>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleMonthChange('next')}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-xs text-muted-foreground px-2 pb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center">
              {day}
            </div>
          ))}
        </div>
      </div>
      
      {/* Calendar Grid */}
      <animated.div 
        style={animatedStyle}
        className="p-2"
      >
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for alignment */}
          {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Date cells */}
          {monthDays.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const hasEvents = eventsByDay.has(format(date, 'yyyy-MM-dd'))
            const indicators = getDateEventIndicators(date)
            
            return (
              <button
                key={date.toISOString()}
                data-date={date.toISOString()}
                onClick={() => handleDateTap(date)}
                className={cn(
                  'relative aspect-square flex flex-col items-center justify-center rounded-lg',
                  'transition-all duration-200 touch-manipulation',
                  'hover:bg-accent active:scale-95',
                  isToday(date) && 'ring-2 ring-primary ring-offset-2',
                  isSelected && 'bg-primary text-primary-foreground',
                  !isSelected && hasEvents && 'font-semibold'
                )}
                style={{
                  transform: `scale(${zoomLevel})`
                }}
              >
                <span className="text-sm">
                  {format(date, 'd')}
                </span>
                
                {/* Event indicators */}
                {indicators.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {indicators.map((category, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          categoryColors[category as keyof typeof categoryColors]
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </animated.div>
      
      {/* Gesture feedback overlay */}
      {gestureState.isGesturing && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-card rounded-lg px-4 py-2 border border-border shadow-sm">
            <p className="text-sm">
              {gestureState.currentGesture === 'swipe' && 'Swiping...'}
              {gestureState.currentGesture === 'pinch' && `Zoom: ${Math.round(zoomLevel * 100)}%`}
              {gestureState.currentGesture === 'longpress' && 'Hold to create event'}
            </p>
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <Button
        size="icon"
        className="absolute bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => onAddEvent?.(selectedDate || new Date())}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}