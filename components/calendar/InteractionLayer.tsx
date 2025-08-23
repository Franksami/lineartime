'use client'

import React from 'react'
import { useGesture } from '@use-gesture/react'
import { addDays, format } from 'date-fns'
import type { Event } from '@/types/calendar'

// Enhanced touch gesture thresholds for better mobile UX
const TOUCH_THRESHOLDS = {
  longPressDelay: 400,     // Reduce from 500ms for faster feedback
  swipeVelocity: 0.3,      // Reduce from 0.5 for easier swiping
  pinchScale: 0.015,       // Increase from 0.01 for better zoom control
  doubleTapDelay: 250,     // Reduce from 300ms for responsive feel
  minimumSwipeDistance: 20 // Add minimum distance for intentional swipes
}

// Haptic feedback for better mobile experience
const provideTactileFeedback = (type: 'light' | 'medium' | 'heavy') => {
  if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
    const patterns = { light: 25, medium: 50, heavy: 100 }
    window.navigator.vibrate(patterns[type])
  }
}

export type ZoomLevel = 'fullYear' | 'year' | 'quarter' | 'month' | 'week' | 'day'

interface InteractionLayerProps {
  scrollRef: React.RefObject<HTMLDivElement>
  year: number
  dayWidth: number
  headerWidth: number
  zoomLevel: ZoomLevel
  isResizingEvent: boolean
  resizingEvent: Event | null
  resizeDirection: 'start' | 'end' | null
  focusedDate: Date | null
  keyboardMode: boolean
  announceMessage: string
  onZoomIn: () => void
  onZoomOut: () => void
  onDateSelect: (date: Date) => void
  onEventUpdate: (event: Event) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  setResizingEvent: (event: Event | null) => void
  setResizeDirection: (direction: 'start' | 'end' | null) => void
  setIsResizingEvent: (isResizing: boolean) => void
  setAnnounceMessage: (message: string) => void
  setFocusedDate: (date: Date | null) => void
  setKeyboardMode: (mode: boolean) => void
  className?: string
  children?: React.ReactNode
}

export const InteractionLayer = React.memo(function InteractionLayer({
  scrollRef,
  year,
  dayWidth,
  headerWidth,
  zoomLevel,
  isResizingEvent,
  resizingEvent,
  resizeDirection,
  focusedDate,
  keyboardMode,
  announceMessage,
  onZoomIn,
  onZoomOut,
  onDateSelect,
  onEventUpdate,
  onKeyDown,
  setResizingEvent,
  setResizeDirection,
  setIsResizingEvent,
  setAnnounceMessage,
  setFocusedDate,
  setKeyboardMode,
  className = '',
  children
}: InteractionLayerProps) {
  const liveRegionRef = React.useRef<HTMLDivElement>(null)

  // Handle resize mouse move
  React.useEffect(() => {
    if (!isResizingEvent || !resizingEvent) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRef.current) return
      
      const rect = scrollRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft - headerWidth
      const dayIndex = Math.floor(x / dayWidth)
      const yearStart = new Date(year, 0, 1)
      const newDate = addDays(yearStart, dayIndex)
      
      const updatedEvent = { ...resizingEvent }
      
      if (resizeDirection === 'start') {
        if (newDate < resizingEvent.endDate) {
          updatedEvent.startDate = newDate
        }
      } else if (resizeDirection === 'end') {
        if (newDate > resizingEvent.startDate) {
          updatedEvent.endDate = newDate
        }
      }
      
      onEventUpdate(updatedEvent)
      setResizingEvent(updatedEvent)
    }
    
    const handleMouseUp = () => {
      setIsResizingEvent(false)
      setResizingEvent(null)
      setResizeDirection(null)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isResizingEvent, 
    resizingEvent, 
    resizeDirection, 
    dayWidth, 
    year, 
    onEventUpdate, 
    headerWidth,
    scrollRef,
    setIsResizingEvent,
    setResizingEvent,
    setResizeDirection
  ])

  // Announce messages to screen readers
  React.useEffect(() => {
    if (announceMessage && liveRegionRef.current) {
      liveRegionRef.current.textContent = announceMessage
    }
  }, [announceMessage])

  // Gesture handling for pan and zoom
  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = -x
        scrollRef.current.scrollTop = -y
      }
    },
    onWheel: ({ event, delta: [dx, dy] }) => {
      if (event.ctrlKey || event.metaKey) {
        // Zoom with ctrl/cmd + scroll
        event.preventDefault()
        if (dy < 0) {
          onZoomIn()
        } else {
          onZoomOut()
        }
      } else if (scrollRef.current) {
        // Regular scroll
        scrollRef.current.scrollLeft += dx
        scrollRef.current.scrollTop += dy
      }
    },
    onPinch: ({ delta: [scale], event }) => {
      event.preventDefault()
      if (scale > 1.05) {
        onZoomIn()
        provideTactileFeedback('light')
      } else if (scale < 0.95) {
        onZoomOut()
        provideTactileFeedback('light')
      }
    },
    onLongPress: ({ event }) => {
      event.preventDefault()
      provideTactileFeedback('medium')
      // Could trigger context menu or creation mode
      setAnnounceMessage('Long press detected - context menu available')
    }
  }, {
    drag: { 
      from: () => scrollRef.current ? [-scrollRef.current.scrollLeft, -scrollRef.current.scrollTop] : [0, 0] 
    },
    wheel: { preventDefault: true },
    pinch: { 
      scaleBounds: { min: 0.5, max: 2 },
      rubberband: true
    },
    longPress: {
      threshold: TOUCH_THRESHOLDS.longPressDelay
    }
  })

  // Keyboard navigation handler with improved accessibility
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    // Handle tab navigation into calendar
    if (!focusedDate && (e.key === 'Tab' || e.key === 'Enter')) {
      const today = new Date()
      setFocusedDate(today)
      setKeyboardMode(true)
      setAnnounceMessage(`Entered calendar navigation mode. Current date: ${format(today, 'EEEE, MMMM d, yyyy')}`)
      return
    }

    if (!focusedDate) return

    let newDate = focusedDate
    let handled = false

    switch (e.key) {
      case 'ArrowLeft':
        newDate = addDays(focusedDate, -1)
        handled = true
        break
      case 'ArrowRight':
        newDate = addDays(focusedDate, 1)
        handled = true
        break
      case 'ArrowUp':
        newDate = addDays(focusedDate, -7)
        handled = true
        break
      case 'ArrowDown':
        newDate = addDays(focusedDate, 7)
        handled = true
        break
      case 'Home':
        // Go to first day of month
        newDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1)
        handled = true
        break
      case 'End':
        // Go to last day of month
        newDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth() + 1, 0)
        handled = true
        break
      case 'PageUp':
        // Previous month
        newDate = addDays(focusedDate, -30)
        handled = true
        break
      case 'PageDown':
        // Next month
        newDate = addDays(focusedDate, 30)
        handled = true
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedDate) {
          onDateSelect(focusedDate)
          setAnnounceMessage(`Selected ${format(focusedDate, 'MMMM d, yyyy')}`)
        }
        handled = true
        break
      case 'Escape':
        setFocusedDate(null)
        setKeyboardMode(false)
        setAnnounceMessage('Exited calendar navigation')
        handled = true
        break
      case 't':
      case 'T':
        // Go to today
        const today = new Date()
        setFocusedDate(today)
        setAnnounceMessage(`Navigated to today: ${format(today, 'MMMM d, yyyy')}`)
        handled = true
        break
      case '+':
      case '=':
        // Zoom in
        onZoomIn()
        setAnnounceMessage('Zoomed in')
        handled = true
        break
      case '-':
      case '_':
        // Zoom out
        onZoomOut()
        setAnnounceMessage('Zoomed out')
        handled = true
        break
    }

    if (handled) {
      e.preventDefault()
      if (newDate !== focusedDate) {
        setFocusedDate(newDate)
        setAnnounceMessage(`${format(newDate, 'EEEE, MMMM d, yyyy')}`)
        
        // Auto-scroll to keep focused date visible
        if (scrollRef.current) {
          const dayOfYear = Math.floor((newDate.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
          const scrollPosition = dayOfYear * dayWidth - scrollRef.current.clientWidth / 2
          scrollRef.current.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          })
        }
      }
    }

    // Call parent handler for any additional logic
    onKeyDown(e)
  }, [
    focusedDate, 
    onDateSelect, 
    onZoomIn, 
    onZoomOut, 
    onKeyDown,
    setFocusedDate,
    setKeyboardMode,
    setAnnounceMessage,
    scrollRef,
    year,
    dayWidth
  ])

  return (
    <div 
      className={`focus:outline-none focus:ring-2 focus:ring-ring/50 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Calendar for year ${year}. Press Enter to start navigation, use arrow keys to move between dates. Press T for today, +/- for zoom.`}
      {...bind()}
    >
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Keyboard focus indicator */}
      {keyboardMode && focusedDate && (
        <div 
          className="absolute pointer-events-none border-2 border-blue-500 rounded-sm z-30"
          style={{
            left: headerWidth + ((focusedDate.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) * dayWidth,
            top: focusedDate.getMonth() * 60 + 20,
            width: dayWidth,
            height: 36
          }}
          aria-hidden="true"
        />
      )}
      
      {children}
    </div>
  )
})

InteractionLayer.displayName = 'InteractionLayer'