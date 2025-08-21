'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { cn } from "@/lib/utils"

interface ZoomControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  className?: string
}

export function ZoomControls({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  className 
}: ZoomControlsProps) {
  return (
    <div className={cn(
      "fixed bottom-4 right-4 flex flex-col gap-1",
      "bg-card/80 backdrop-blur-sm border rounded-lg p-1.5 shadow-lg",
      className
    )}>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onZoomIn}
        className="h-8 w-8 p-0"
        title="Zoom In (Ctrl/Cmd +)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onReset}
        className="h-8 w-8 p-0 text-xs font-medium"
        title="Reset Zoom (Ctrl/Cmd 0)"
      >
        {Math.round(zoomLevel * 100)}%
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onZoomOut}
        className="h-8 w-8 p-0"
        title="Zoom Out (Ctrl/Cmd -)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  )
}