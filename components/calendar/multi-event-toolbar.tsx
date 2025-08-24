"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Copy, Trash2, Palette, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  category?: string
}

interface MultiEventToolbarProps {
  selectedEvents: Event[]
  onBulkUpdate?: (eventIds: string[], updates: Partial<Event>) => void
  onBulkDelete?: (eventIds: string[]) => void
  onBulkDuplicate?: (events: Event[]) => void
  onBulkMove?: (eventIds: string[], dayOffset: number) => void
  onClearSelection?: () => void
  className?: string
}

const PRESET_COLORS = [
  "#be123c", // rose-600
  "#ec4899", // pink-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#6b7280", // gray-500
]

const CATEGORIES = [
  { value: "work", label: "Work", color: "#3b82f6" },
  { value: "personal", label: "Personal", color: "#10b981" },
  { value: "meeting", label: "Meeting", color: "#f59e0b" },
  { value: "deadline", label: "Deadline", color: "#ef4444" },
  { value: "travel", label: "Travel", color: "#8b5cf6" },
]

export function MultiEventToolbar({
  selectedEvents,
  onBulkUpdate,
  onBulkDelete,
  onBulkDuplicate,
  onBulkMove,
  onClearSelection,
  className,
}: MultiEventToolbarProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isMovePickerOpen, setIsMovePickerOpen] = useState(false)
  const [moveOffset, setMoveOffset] = useState<string>("1")

  if (selectedEvents.length === 0) return null

  const eventIds = selectedEvents.map((event) => event.id)

  const handleBulkColorChange = (color: string) => {
    if (onBulkUpdate) {
      onBulkUpdate(eventIds, { color })
    }
    setIsColorPickerOpen(false)
  }

  const handleBulkCategoryChange = (category: string) => {
    const categoryData = CATEGORIES.find((cat) => cat.value === category)
    if (onBulkUpdate && categoryData) {
      onBulkUpdate(eventIds, {
        category: categoryData.value,
        color: categoryData.color,
      })
    }
  }

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(eventIds)
    }
  }

  const handleBulkDuplicate = () => {
    if (onBulkDuplicate) {
      onBulkDuplicate(selectedEvents)
    }
  }

  const handleBulkMove = () => {
    const offset = Number.parseInt(moveOffset)
    if (onBulkMove && !isNaN(offset)) {
      onBulkMove(eventIds, offset)
    }
    setIsMovePickerOpen(false)
  }

  // Get common properties for batch editing
  const commonColor = selectedEvents.every((e) => e.color === selectedEvents[0].color) ? selectedEvents[0].color : null
  const commonCategory = selectedEvents.every((e) => e.category === selectedEvents[0].category)
    ? selectedEvents[0].category
    : null

  return (
    <div className={cn("fixed top-6 left-1/2 transform -translate-x-1/2 z-50", className)}>
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedEvents.length} events selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Color Change */}
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-2 bg-transparent"
                title="Change color for all selected events"
              >
                <Palette className="w-3 h-3" />
                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: commonColor || "#6b7280" }} />
                Color
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Bulk Color Change</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleBulkColorChange(color)}
                      className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Category Change */}
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <Select value={commonCategory || ""} onValueChange={handleBulkCategoryChange}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Move */}
          <Popover open={isMovePickerOpen} onOpenChange={setIsMovePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-2 bg-transparent"
                title="Move all selected events"
              >
                <CalendarDays className="w-3 h-3" />
                Move
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Move Events</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={moveOffset}
                    onChange={(e) => setMoveOffset(e.target.value)}
                    placeholder="Days"
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={handleBulkMove} className="h-8 px-3 text-xs">
                    Move
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Positive numbers move forward, negative backward</div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDuplicate}
              className="h-8 px-3 gap-2 text-xs hover:bg-accent/50"
              title="Duplicate all selected events"
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 px-3 gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete all selected events"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
        </div>

        {/* Event Preview */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {selectedEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                <span className="truncate max-w-20">{event.title}</span>
              </div>
            ))}
            {selectedEvents.length > 8 && (
              <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                +{selectedEvents.length - 8} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
