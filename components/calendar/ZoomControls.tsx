'use client'

import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface ZoomControlsProps {
  zoomLevel: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onReset?: () => void
  // Legacy single-change API support
  onZoomChange?: (newZoom: number) => void
  className?: string
  /**
   * Render into document.body to avoid clipping by containers/sidebars
   */
  portal?: boolean
}

export function ZoomControls({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  onZoomChange,
  className,
  portal = true,
}: ZoomControlsProps) {
  const handleZoomInClick = () => {
    if (onZoomIn) return onZoomIn()
    if (onZoomChange) onZoomChange(Math.min(zoomLevel * 1.2, 2))
  }

  const handleZoomOutClick = () => {
    if (onZoomOut) return onZoomOut()
    if (onZoomChange) onZoomChange(Math.max(zoomLevel / 1.2, 0.5))
  }

  const handleResetClick = () => {
    if (onReset) return onReset()
    if (onZoomChange) onZoomChange(1)
  }
  const content = (
    <div
      role="group"
      aria-label="Zoom controls"
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col gap-1",
        "bg-card/80 backdrop-blur-sm border rounded-lg p-1.5 shadow-lg",
        "pointer-events-auto",
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        right: 'calc(env(safe-area-inset-right, 0px) + 1rem)'
      }}
    >
      <Button 
        aria-label="Zoom in"
        size="sm" 
        variant="ghost" 
        onClick={handleZoomInClick}
        className="h-8 w-8 p-0"
        title="Zoom In (Ctrl/Cmd +)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        aria-label="Reset zoom"
        size="sm" 
        variant="ghost" 
        onClick={handleResetClick}
        className="h-8 w-8 p-0 text-xs font-medium"
        title="Reset Zoom (Ctrl/Cmd 0)"
      >
        {Math.round(zoomLevel * 100)}%
      </Button>
      
      <Button 
        aria-label="Zoom out"
        size="sm" 
        variant="ghost" 
        onClick={handleZoomOutClick}
        className="h-8 w-8 p-0"
        title="Zoom Out (Ctrl/Cmd -)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  )

  if (!portal) return content
  if (typeof window === 'undefined') return null
  return createPortal(content, document.body)
}