"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SimpleEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
}

interface CanvasToolbarProps {
  selectedEvent: SimpleEvent | null
  onEventUpdate?: (eventId: string, updates: Partial<SimpleEvent>) => void
  onEventDelete?: (eventId: string) => void
  onEventDuplicate?: (event: SimpleEvent) => void
  onCreateEvent?: () => void
  className?: string
}

const PRESET_COLORS = [
  "#be123c", // rose-600 (primary)
  "#ec4899", // pink-500 (secondary)
  "#f97316", // orange-500
  "#ea580c", // orange-600
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#164e63", // cyan-900
]

export function CanvasToolbar({
  selectedEvent,
  onEventUpdate,
  onEventDelete,
  onEventDuplicate,
  onCreateEvent,
  className,
}: CanvasToolbarProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [customColor, setCustomColor] = useState(selectedEvent?.color || "#be123c")

  const handleColorChange = (color: string) => {
    if (selectedEvent && onEventUpdate) {
      onEventUpdate(selectedEvent.id, { color })
    }
    setCustomColor(color)
  }

  const handleTitleChange = (title: string) => {
    if (selectedEvent && onEventUpdate) {
      onEventUpdate(selectedEvent.id, { title })
    }
  }

  const handleDelete = () => {
    if (selectedEvent && onEventDelete) {
      onEventDelete(selectedEvent.id)
    }
  }

  const handleDuplicate = () => {
    if (selectedEvent && onEventDuplicate) {
      onEventDuplicate(selectedEvent)
    }
  }

  if (!selectedEvent) {
    return (
      <div className={cn("fixed top-6 left-1/2 transform -translate-x-1/2 z-50", className)}>
        <div className="bg-card border border-border rounded-lg shadow-xl p-3 backdrop-blur-sm">
          <Button
            onClick={onCreateEvent}
            size="sm"
            className="text-sm font-montserrat font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            + New Event
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("fixed top-6 left-1/2 transform -translate-x-1/2 z-50", className)}>
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 flex items-center gap-4 min-w-[480px] backdrop-blur-sm">
        {/* Event Title Input */}
        <div className="flex-1">
          <Input
            value={selectedEvent.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-9 text-sm font-open-sans font-medium border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2"
            placeholder="Event title"
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 p-0 border-2 bg-transparent hover:scale-105 transition-transform duration-200 shadow-sm"
              style={{ backgroundColor: selectedEvent.color }}
              title="Change color"
            >
              <span className="sr-only">Change color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 bg-popover shadow-xl border border-border">
            <div className="space-y-4">
              <Label className="text-sm font-montserrat font-semibold text-popover-foreground">Event Color</Label>

              {/* Preset Colors */}
              <div className="grid grid-cols-7 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-9 h-9 rounded-md border-2 transition-all duration-200 hover:scale-110 shadow-sm",
                      selectedEvent.color === color ? "border-foreground ring-2 ring-ring/20" : "border-border",
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="space-y-3">
                <Label htmlFor="custom-color" className="text-xs font-open-sans font-medium text-muted-foreground">
                  Custom Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-color"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-9 p-1 border rounded-md shadow-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleColorChange(customColor)}
                    className="text-xs font-montserrat font-semibold bg-primary hover:bg-primary/90"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            className="h-9 px-3 text-xs font-open-sans font-medium hover:bg-accent/50 transition-colors duration-200"
            title="Duplicate event"
          >
            Copy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-9 px-3 text-xs font-open-sans font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
            title="Delete event"
          >
            Delete
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Create New Event */}
        <Button
          onClick={onCreateEvent}
          size="sm"
          className="h-9 px-4 text-xs font-montserrat font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg"
          title="Create new event"
        >
          + New
        </Button>
      </div>
    </div>
  )
}
