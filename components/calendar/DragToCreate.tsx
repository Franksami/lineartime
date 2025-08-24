'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useCalendarContext } from '@/contexts/CalendarContext'
import { format, startOfDay, endOfDay, addDays, differenceInDays, startOfYear } from 'date-fns'

interface DragToCreateProps {
  year: number
  dayWidth: number
  monthHeight: number
  headerWidth: number
  headerHeight: number
  isFullYearZoom: boolean
  scrollRef: React.RefObject<HTMLDivElement>
  onEventCreate: (eventData: {
    title: string
    startDate: Date
    endDate: Date
    category: string
  }) => void
  className?: string
}

interface DragSelection {
  startDate: Date
  endDate: Date
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export const DragToCreate = React.memo(function DragToCreate({
  year,
  dayWidth,
  monthHeight,
  headerWidth,
  headerHeight,
  isFullYearZoom,
  scrollRef,
  onEventCreate,
  className = ''
}: DragToCreateProps) {
  const { state, announceMessage, batchUpdate } = useCalendarContext()
  
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragSelection, setDragSelection] = React.useState<DragSelection | null>(null)
  const [quickTitle, setQuickTitle] = React.useState('')
  const [showQuickEdit, setShowQuickEdit] = React.useState(false)
  
  const yearStart = React.useMemo(() => startOfYear(new Date(year, 0, 1)), [year])
  
  // Convert screen coordinates to date
  const screenToDate = React.useCallback((x: number, y: number): Date | null => {
    if (!scrollRef.current) return null
    
    const rect = scrollRef.current.getBoundingClientRect()
    const scrollLeft = scrollRef.current.scrollLeft
    const scrollTop = scrollRef.current.scrollTop
    
    // Adjust for scroll and header offset
    const adjustedX = x - rect.left + scrollLeft - headerWidth
    const adjustedY = y - rect.top + scrollTop - headerHeight
    
    if (isFullYearZoom) {
      // Full year grid: 12 rows × 42 columns
      const col = Math.floor(adjustedX / dayWidth)
      const row = Math.floor(adjustedY / monthHeight)
      
      if (row < 0 || row >= 12 || col < 0 || col >= 42) return null
      
      // Calculate date based on grid position
      const jan1DayOfWeek = yearStart.getDay()
      const dayOfYear = col - jan1DayOfWeek + 1
      
      if (dayOfYear < 1) return null
      
      const date = addDays(yearStart, dayOfYear - 1)
      
      // Ensure date is in the correct month row
      if (date.getMonth() !== row) return null
      
      return date
    } else {
      // Linear timeline: calculate day from X position
      const dayIndex = Math.floor(adjustedX / dayWidth)
      const monthRow = Math.floor(adjustedY / monthHeight)
      
      if (dayIndex < 0 || monthRow < 0 || monthRow >= 12) return null
      
      return addDays(yearStart, dayIndex)
    }
  }, [scrollRef, headerWidth, headerHeight, dayWidth, monthHeight, isFullYearZoom, yearStart])
  
  // Convert date to screen coordinates for visual feedback
  const dateToScreen = React.useCallback((date: Date) => {
    if (!scrollRef.current) return null
    
    const rect = scrollRef.current.getBoundingClientRect()
    const scrollLeft = scrollRef.current.scrollLeft
    const scrollTop = scrollRef.current.scrollTop
    
    if (isFullYearZoom) {
      // Full year grid positioning
      const jan1DayOfWeek = yearStart.getDay()
      const dayOfYear = differenceInDays(date, yearStart) + 1
      const col = jan1DayOfWeek + dayOfYear - 1
      const row = date.getMonth()
      
      return {
        x: rect.left + headerWidth + (col * dayWidth) - scrollLeft,
        y: rect.top + headerHeight + (row * monthHeight) - scrollTop,
        width: dayWidth,
        height: monthHeight
      }
    } else {
      // Linear timeline positioning
      const dayIndex = differenceInDays(date, yearStart)
      const row = date.getMonth()
      
      return {
        x: rect.left + headerWidth + (dayIndex * dayWidth) - scrollLeft,
        y: rect.top + headerHeight + (row * monthHeight) - scrollTop,
        width: dayWidth,
        height: monthHeight
      }
    }
  }, [scrollRef, headerWidth, headerHeight, dayWidth, monthHeight, isFullYearZoom, yearStart])
  
  // Handle mouse down to start drag selection
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return
    
    // Don't interfere with existing event interactions
    if (state.selectedEvent || state.isDraggingEvent || state.isResizingEvent) return
    
    const startDate = screenToDate(e.clientX, e.clientY)
    if (!startDate) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setDragSelection({
      startDate,
      endDate: startDate,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    })
    
    announceMessage(`Started creating event on ${format(startDate, 'EEEE, MMMM d, yyyy')}`)
    
    // Update global state
    batchUpdate({
      selectedDate: null,
      selectedEvent: null,
      showEventModal: false,
      showFloatingToolbar: false
    })
  }, [screenToDate, state, announceMessage, batchUpdate])
  
  // Handle mouse move to update drag selection
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !dragSelection) return
    
    const currentDate = screenToDate(e.clientX, e.clientY)
    if (!currentDate) return
    
    // Determine start and end dates (handle backward dragging)
    const startDate = currentDate < dragSelection.startDate ? currentDate : dragSelection.startDate
    const endDate = currentDate > dragSelection.startDate ? currentDate : dragSelection.startDate
    
    setDragSelection(prev => prev ? {
      ...prev,
      endDate,
      currentX: e.clientX,
      currentY: e.clientY
    } : null)
    
    // Announce drag progress
    const duration = differenceInDays(endDate, startDate) + 1
    const durationText = duration === 1 ? 'day' : `${duration} days`
    announceMessage(`Creating ${durationText} event from ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')}`)
  }, [isDragging, dragSelection, screenToDate, announceMessage])
  
  // Handle mouse up to complete drag selection
  const handleMouseUp = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !dragSelection) return
    
    const finalDate = screenToDate(e.clientX, e.clientY)
    if (!finalDate) {
      setIsDragging(false)
      setDragSelection(null)
      return
    }
    
    // Determine final date range
    const startDate = finalDate < dragSelection.startDate ? finalDate : dragSelection.startDate
    const endDate = finalDate > dragSelection.startDate ? finalDate : dragSelection.startDate
    
    setIsDragging(false)
    
    // Show quick edit for immediate title entry
    setShowQuickEdit(true)
    setQuickTitle('')
    
    // Update drag selection for quick edit positioning
    setDragSelection(prev => prev ? {
      ...prev,
      startDate,
      endDate
    } : null)
    
    announceMessage(`Event creation started. Enter title for ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')}`)
  }, [isDragging, dragSelection, screenToDate, announceMessage])
  
  // Handle quick edit completion
  const handleQuickEditComplete = React.useCallback((title: string = quickTitle) => {
    if (!dragSelection) return
    
    const eventTitle = title.trim() || 'New Event'
    
    // Create the event
    onEventCreate({
      title: eventTitle,
      startDate: startOfDay(dragSelection.startDate),
      endDate: endOfDay(dragSelection.endDate),
      category: 'personal' // Default category
    })
    
    // Cleanup
    setShowQuickEdit(false)
    setDragSelection(null)
    setQuickTitle('')
    
    announceMessage(`Created event: ${eventTitle}`)
  }, [dragSelection, quickTitle, onEventCreate, announceMessage])
  
  // Handle quick edit cancel
  const handleQuickEditCancel = React.useCallback(() => {
    setShowQuickEdit(false)
    setDragSelection(null)
    setQuickTitle('')
    announceMessage('Event creation cancelled')
  }, [announceMessage])
  
  // Attach global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  // Handle escape key to cancel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDragging || showQuickEdit) {
          handleQuickEditCancel()
        }
      } else if (e.key === 'Enter' && showQuickEdit) {
        handleQuickEditComplete()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDragging, showQuickEdit, handleQuickEditCancel, handleQuickEditComplete])
  
  // Calculate visual selection rectangle
  const selectionRect = React.useMemo(() => {
    if (!dragSelection || !isDragging) return null
    
    const startScreen = dateToScreen(dragSelection.startDate)
    const endScreen = dateToScreen(dragSelection.endDate)
    
    if (!startScreen || !endScreen) return null
    
    const left = Math.min(startScreen.x, endScreen.x)
    const right = Math.max(startScreen.x + startScreen.width, endScreen.x + endScreen.width)
    const top = Math.min(startScreen.y, endScreen.y)
    const bottom = Math.max(startScreen.y + startScreen.height, endScreen.y + endScreen.height)
    
    return {
      left,
      top,
      width: right - left,
      height: bottom - top
    }
  }, [dragSelection, isDragging, dateToScreen])
  
  // Calculate quick edit position
  const quickEditPosition = React.useMemo(() => {
    if (!dragSelection || !showQuickEdit) return null
    
    const startScreen = dateToScreen(dragSelection.startDate)
    if (!startScreen) return null
    
    return {
      x: startScreen.x,
      y: startScreen.y - 40 // Position above the selection
    }
  }, [dragSelection, showQuickEdit, dateToScreen])
  
  return (
    <>
      {/* Drag capture overlay */}
      <div
        className={cn(
          "absolute inset-0 z-10",
          isDragging ? "cursor-crosshair" : "cursor-crosshair",
          className
        )}
        onMouseDown={handleMouseDown}
        style={{ marginLeft: headerWidth, marginTop: headerHeight }}
      />
      
      {/* Visual selection feedback */}
      {isDragging && selectionRect && (
        <div
          className="fixed bg-blue-500/20 border-2 border-blue-500 rounded-sm pointer-events-none z-20"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height
          }}
        />
      )}
      
      {/* Quick edit input */}
      {showQuickEdit && quickEditPosition && (
        <div
          className="fixed bg-background border rounded-lg shadow-lg p-2 z-30"
          style={{
            left: quickEditPosition.x,
            top: quickEditPosition.y
          }}
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleQuickEditComplete()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                handleQuickEditCancel()
              }
            }}
            className="text-sm border rounded px-2 py-1 min-w-[200px]"
            placeholder="Event title..."
            autoFocus
          />
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => handleQuickEditComplete()}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={handleQuickEditCancel}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
})

DragToCreate.displayName = 'DragToCreate'