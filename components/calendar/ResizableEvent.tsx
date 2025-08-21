'use client'

import React, { useState, useCallback } from 'react'
import { Resizable, ResizeDirection } from 're-resizable'
import type { Event } from '@/types/calendar'
import { cn } from '@/lib/utils'

interface ResizableEventProps {
  event: Event & {
    left: number
    top: number
    width: number
    height: number
  }
  onResize?: (eventId: string, width: number, height: number) => void
  onResizeStop?: (eventId: string, width: number, height: number) => void
  onClick?: (event: Event) => void
  onContextMenu?: (event: Event, e: React.MouseEvent) => void
  className?: string
  minHeight?: number
  minWidth?: number
  maxWidth?: number
  gridSize?: number
}

const categoryColors = {
  personal: '#10b981',
  work: '#3b82f6',
  effort: '#f97316',
  note: '#a855f7'
}

export function ResizableEvent({
  event,
  onResize,
  onResizeStop,
  onClick,
  onContextMenu,
  className,
  minHeight = 30,
  minWidth = 60,
  maxWidth = 600,
  gridSize = 10
}: ResizableEventProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: event.width,
    height: event.height
  })

  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent, direction: ResizeDirection, ref: HTMLElement, delta: { width: number; height: number }) => {
      const newWidth = event.width + delta.width
      const newHeight = event.height + delta.height
      
      setDimensions({ width: newWidth, height: newHeight })
      onResize?.(event.id, newWidth, newHeight)
    },
    [event.id, event.width, event.height, onResize]
  )

  const handleResizeStop = useCallback(
    (e: MouseEvent | TouchEvent, direction: ResizeDirection, ref: HTMLElement, delta: { width: number; height: number }) => {
      const newWidth = event.width + delta.width
      const newHeight = event.height + delta.height
      
      setIsResizing(false)
      setDimensions({ width: newWidth, height: newHeight })
      onResizeStop?.(event.id, newWidth, newHeight)
    },
    [event.id, event.width, event.height, onResizeStop]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing && onClick) {
        e.stopPropagation()
        onClick(event)
      }
    },
    [isResizing, onClick, event]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onContextMenu?.(event, e)
    },
    [onContextMenu, event]
  )

  const color = categoryColors[event.category as keyof typeof categoryColors] || '#6b7280'
  
  // Format time for display
  const formatTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return minutes === 0 ? `${displayHours}${ampm}` : `${displayHours}:${displayMinutes}${ampm}`
  }

  const startTime = formatTime(new Date(event.startDate))
  const endTime = formatTime(new Date(event.endDate))

  return (
    <Resizable
      size={{ width: dimensions.width, height: dimensions.height }}
      style={{
        position: 'absolute',
        left: `${event.left}px`,
        top: `${event.top}px`,
      }}
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      minHeight={minHeight}
      minWidth={minWidth}
      maxWidth={maxWidth}
      grid={[gridSize, gridSize]}
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false
      }}
      handleStyles={{
        right: {
          width: '4px',
          right: '0',
          cursor: 'ew-resize',
          backgroundColor: 'transparent'
        },
        bottom: {
          height: '4px',
          bottom: '0',
          cursor: 'ns-resize',
          backgroundColor: 'transparent'
        },
        bottomRight: {
          width: '8px',
          height: '8px',
          right: '0',
          bottom: '0',
          cursor: 'nwse-resize',
          backgroundColor: 'transparent'
        }
      }}
      handleClasses={{
        right: 'hover:bg-white/30',
        bottom: 'hover:bg-white/30',
        bottomRight: 'hover:bg-white/30'
      }}
    >
      <div
        className={cn(
          'w-full h-full rounded-md border border-white/20 overflow-hidden cursor-pointer transition-all',
          'hover:shadow-lg hover:z-50',
          isResizing && 'opacity-90',
          className
        )}
        style={{
          backgroundColor: color,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="p-1.5 text-white h-full flex flex-col">
          <div className="font-medium text-xs truncate mb-0.5">
            {event.title}
          </div>
          <div className="text-[10px] opacity-80">
            {startTime} - {endTime}
          </div>
          {event.description && (
            <div className="text-[10px] opacity-70 mt-1 flex-1 overflow-hidden">
              {event.description}
            </div>
          )}
          {isResizing && (
            <div className="text-[10px] opacity-90 mt-auto">
              {Math.round(dimensions.width)}x{Math.round(dimensions.height)}
            </div>
          )}
        </div>
      </div>
    </Resizable>
  )
}