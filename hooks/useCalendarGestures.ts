'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { useSpring, animated, config } from '@react-spring/web'

interface UseCalendarGesturesProps {
  onMonthChange?: (direction: 'prev' | 'next') => void
  onZoomChange?: (scale: number) => void
  onDateLongPress?: (date: Date) => void
  onDateRangeSelect?: (start: Date, end: Date) => void
  onRefresh?: () => Promise<void>
  minZoom?: number
  maxZoom?: number
  swipeThreshold?: number
  longPressDelay?: number
}

interface GestureState {
  isGesturing: boolean
  currentGesture: 'swipe' | 'pinch' | 'longpress' | 'drag' | null
  gestureProgress: number
}

export function useCalendarGestures({
  onMonthChange,
  onZoomChange,
  onDateLongPress,
  onDateRangeSelect,
  onRefresh,
  minZoom = 0.5,
  maxZoom = 2,
  swipeThreshold = 50,
  longPressDelay = 500
}: UseCalendarGesturesProps = {}) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isGesturing: false,
    currentGesture: null,
    gestureProgress: 0
  })
  
  const [zoom, setZoom] = useState(1)
  const [isPulling, setIsPulling] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout>()
  const selectionStart = useRef<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Spring animation for smooth transitions
  const [{ x, y, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: config.gentle
  }))
  
  // Vibration feedback (if supported)
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])
  
  // Handle swipe gestures for month navigation
  const handleSwipe = useCallback((movement: number[], velocity: number[]) => {
    const [mx] = movement
    const [vx] = velocity
    
    // Check if swipe meets threshold
    if (Math.abs(mx) > swipeThreshold || Math.abs(vx) > 0.2) {
      if (mx > 0) {
        onMonthChange?.('prev')
        vibrate(20)
      } else {
        onMonthChange?.('next')
        vibrate(20)
      }
      
      // Animate the swipe
      api.start({
        x: mx > 0 ? 100 : -100,
        immediate: false,
        onRest: () => {
          api.start({ x: 0 })
        }
      })
    } else {
      // Snap back if threshold not met
      api.start({ x: 0 })
    }
  }, [swipeThreshold, onMonthChange, api, vibrate])
  
  // Handle pinch gestures for zoom
  const handlePinch = useCallback((scale: number, origin: [number, number]) => {
    const newZoom = Math.min(Math.max(zoom * scale, minZoom), maxZoom)
    setZoom(newZoom)
    onZoomChange?.(newZoom)
    
    api.start({
      scale: newZoom,
      immediate: true
    })
    
    // Haptic feedback at zoom limits
    if (newZoom === minZoom || newZoom === maxZoom) {
      vibrate(30)
    }
  }, [zoom, minZoom, maxZoom, onZoomChange, api, vibrate])
  
  // Handle long press for event creation
  const handleLongPress = useCallback((point: [number, number], target: EventTarget) => {
    const element = target as HTMLElement
    const dateStr = element.dataset.date
    
    if (dateStr) {
      const date = new Date(dateStr)
      longPressTimer.current = setTimeout(() => {
        vibrate([50, 100, 50]) // Pattern vibration for long press
        onDateLongPress?.(date)
        setGestureState({
          isGesturing: true,
          currentGesture: 'longpress',
          gestureProgress: 100
        })
      }, longPressDelay)
    }
  }, [longPressDelay, onDateLongPress, vibrate])
  
  // Handle drag for date range selection
  const handleDragSelection = useCallback((point: [number, number], target: EventTarget, isDragging: boolean) => {
    const element = target as HTMLElement
    const dateStr = element.dataset.date
    
    if (dateStr) {
      const date = new Date(dateStr)
      
      if (!isDragging && !selectionStart.current) {
        // Start selection
        selectionStart.current = date
      } else if (isDragging && selectionStart.current) {
        // Update selection range
        const start = selectionStart.current < date ? selectionStart.current : date
        const end = selectionStart.current < date ? date : selectionStart.current
        
        // Visual feedback during drag
        setGestureState({
          isGesturing: true,
          currentGesture: 'drag',
          gestureProgress: 50
        })
      } else if (!isDragging && selectionStart.current) {
        // End selection
        const start = selectionStart.current < date ? selectionStart.current : date
        const end = selectionStart.current < date ? date : selectionStart.current
        onDateRangeSelect?.(start, end)
        selectionStart.current = null
        vibrate(20)
        
        setGestureState({
          isGesturing: false,
          currentGesture: null,
          gestureProgress: 0
        })
      }
    }
  }, [onDateRangeSelect, vibrate])
  
  // Handle pull to refresh
  const handlePullRefresh = useCallback(async (movement: number[]) => {
    const [, my] = movement
    
    if (my > 100 && !isPulling) {
      setIsPulling(true)
      vibrate(50)
      
      if (onRefresh) {
        await onRefresh()
      }
      
      setIsPulling(false)
      api.start({ y: 0 })
    } else if (my > 0) {
      // Show pull progress
      api.start({ y: Math.min(my, 150), immediate: true })
      setGestureState({
        isGesturing: true,
        currentGesture: 'swipe',
        gestureProgress: Math.min((my / 150) * 100, 100)
      })
    }
  }, [isPulling, onRefresh, api, vibrate])
  
  // Setup gesture handlers
  const bind = useGesture({
    onDrag: ({ movement, velocity, first, last, target, dragging }) => {
      if (first) {
        clearTimeout(longPressTimer.current)
        handleLongPress([movement[0], movement[1]], target)
      }
      
      if (last && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      
      // Check for swipe
      if (last && Math.abs(movement[0]) > Math.abs(movement[1])) {
        handleSwipe(movement, velocity)
      }
      // Check for pull to refresh
      else if (movement[1] > 0 && containerRef.current?.scrollTop === 0) {
        handlePullRefresh(movement)
      }
      // Handle drag selection
      else if (dragging) {
        handleDragSelection([movement[0], movement[1]], target, dragging)
      }
      
      if (last) {
        setGestureState({
          isGesturing: false,
          currentGesture: null,
          gestureProgress: 0
        })
      }
    },
    
    onPinch: ({ offset: [scale], origin, last }) => {
      handlePinch(scale, origin as [number, number])
      
      if (last) {
        setGestureState({
          isGesturing: false,
          currentGesture: null,
          gestureProgress: 0
        })
      } else {
        setGestureState({
          isGesturing: true,
          currentGesture: 'pinch',
          gestureProgress: 50
        })
      }
    },
    
    onWheel: ({ event, delta: [, dy] }) => {
      event.preventDefault()
      const scaleFactor = 1 - dy * 0.001
      const newZoom = Math.min(Math.max(zoom * scaleFactor, minZoom), maxZoom)
      setZoom(newZoom)
      onZoomChange?.(newZoom)
      
      api.start({
        scale: newZoom,
        immediate: true
      })
    }
  }, {
    drag: {
      filterTaps: true,
      threshold: 10,
      preventDefault: true
    },
    pinch: {
      scaleBounds: { min: minZoom, max: maxZoom },
      rubberband: true
    }
  })
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])
  
  return {
    bind,
    containerRef,
    gestureState,
    zoom,
    isPulling,
    animatedStyle: {
      transform: x.to(x => `translateX(${x}px)`),
      scale
    },
    springs: { x, y, scale }
  }
}