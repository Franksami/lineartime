'use client'

import React, { useEffect, useRef } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[] // Percentages of screen height
  defaultSnap?: number
  className?: string
  showHandle?: boolean
  closeOnOverlayClick?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [50, 90], // Default to 50% and 90% of screen height
  defaultSnap = 0,
  className,
  showHandle = true,
  closeOnOverlayClick = true
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(defaultSnap)
  
  // Calculate actual pixel values for snap points
  const getSnapPixels = () => {
    const height = window.innerHeight
    return snapPoints.map(percentage => height * (1 - percentage / 100))
  }
  
  // Animation spring
  const [{ y }, api] = useSpring(() => ({
    y: window.innerHeight,
    config: config.stiff
  }))
  
  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      const snapPixels = getSnapPixels()
      api.start({ 
        y: snapPixels[currentSnapIndex],
        immediate: false
      })
    } else {
      api.start({ 
        y: window.innerHeight,
        immediate: false
      })
    }
  }, [isOpen, currentSnapIndex, api])
  
  // Drag gesture handling
  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], cancel, canceled, last }) => {
      if (canceled) return
      
      const snapPixels = getSnapPixels()
      const currentY = snapPixels[currentSnapIndex] + my
      
      // If dragging up past the top snap point, add resistance
      if (currentY < snapPixels[snapPixels.length - 1]) {
        cancel()
        api.start({ y: snapPixels[snapPixels.length - 1] })
        return
      }
      
      // Update position while dragging
      if (!last) {
        api.start({ 
          y: currentY, 
          immediate: true 
        })
      } else {
        // Determine which snap point to go to based on velocity and position
        const threshold = window.innerHeight * 0.2 // 20% threshold for closing
        
        // Close if dragged down significantly or with high velocity
        if (currentY > window.innerHeight - threshold || vy > 0.5) {
          api.start({ y: window.innerHeight })
          setTimeout(onClose, 300)
        } else {
          // Find nearest snap point
          let nearestIndex = 0
          let nearestDistance = Math.abs(currentY - snapPixels[0])
          
          snapPixels.forEach((snapY, index) => {
            const distance = Math.abs(currentY - snapY)
            if (distance < nearestDistance) {
              nearestDistance = distance
              nearestIndex = index
            }
          })
          
          setCurrentSnapIndex(nearestIndex)
          api.start({ y: snapPixels[nearestIndex] })
        }
      }
    },
    {
      from: () => [0, y.get()],
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: true
    }
  )
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen && y.get() >= window.innerHeight) {
    return null
  }
  
  return (
    <>
      {/* Overlay */}
      <animated.div
        className="fixed inset-0 bg-black/50 z-40"
        style={{
          opacity: y.to([0, window.innerHeight], [1, 0]),
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Bottom Sheet */}
      <animated.div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-background rounded-t-2xl shadow-2xl',
          'touch-none',
          className
        )}
        style={{
          y,
          height: `${Math.max(...snapPoints)}%`
        }}
      >
        {/* Drag handle */}
        {showHandle && (
          <div 
            className="absolute top-0 left-0 right-0 flex justify-center p-3 cursor-grab active:cursor-grabbing"
            {...bind()}
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pt-6 pb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div 
          className={cn(
            'overflow-y-auto overscroll-contain',
            'px-4 pb-safe',
            title ? 'pt-2' : 'pt-8',
            'max-h-[calc(100%-4rem)]'
          )}
        >
          {children}
        </div>
      </animated.div>
    </>
  )
}