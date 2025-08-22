'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertCircle, Clock, Repeat, MapPin, Tag, Users, Bell, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Event, EventCategory } from "@/types/calendar"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { announceToScreenReader } from "@/lib/accessibility"

interface DateRange {
  from: Date
  to: Date
}

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  selectedDate: Date | null
  selectedRange: DateRange | null
  onSave: (event: Partial<Event>) => void
  onDelete: (id: string) => void
  checkOverlaps: (start: Date, end: Date, excludeId?: string) => Event[]
}

export function EventModal({
  open,
  onOpenChange,
  event,
  selectedDate,
  selectedRange,
  onSave,
  onDelete,
  checkOverlaps
}: EventModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  
  const [formData, setFormData] = React.useState<Partial<Event>>({
    title: '',
    category: 'personal',
    startDate: selectedDate || new Date(),
    endDate: selectedDate || new Date(),
    description: ''
  })
  
  const conflicts = React.useMemo(() => {
    if (formData.startDate && formData.endDate) {
      return checkOverlaps(
        formData.startDate,
        formData.endDate,
        event?.id
      )
    }
    return []
  }, [formData.startDate, formData.endDate, checkOverlaps, event])

  React.useEffect(() => {
    if (event) {
      setFormData(event)
    } else if (selectedRange) {
      setFormData(prev => ({
        ...prev,
        startDate: selectedRange.from,
        endDate: selectedRange.to
      }))
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate,
        endDate: selectedDate
      }))
    }
  }, [event, selectedDate, selectedRange])

  // Focus management
  React.useEffect(() => {
    if (open) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Focus the title input after modal is rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
        announceToScreenReader(event ? 'Edit event dialog opened' : 'Create event dialog opened')
      }, 100)
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
        announceToScreenReader('Event dialog closed')
      }
    }
  }, [open, event])

  const handleSave = () => {
    if (formData.title && formData.startDate && formData.endDate) {
      onSave({
        ...formData,
        id: event?.id || crypto.randomUUID()
      })
      onOpenChange(false)
      resetForm()
    }
  }

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id)
      onOpenChange(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'personal',
      startDate: new Date(),
      endDate: new Date(),
      description: ''
    })
  }

  const categoryColors = {
    personal: 'bg-green-500',
    work: 'bg-blue-500',
    effort: 'bg-orange-500',
    note: 'bg-purple-500'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[600px] bg-card/95 backdrop-blur-sm border-border shadow-2xl overflow-visible",
          prefersReducedMotion && "transition-none"
        )}
        aria-labelledby="event-dialog-title"
        aria-describedby="event-dialog-description">
        <DialogHeader className="bg-muted/50 backdrop-blur-sm rounded-t-lg p-6 -m-6 mb-4 border-b border-border">
          <DialogTitle id="event-dialog-title" className="text-xl font-semibold">
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              Event Title
            </Label>
            <Input
              ref={titleInputRef}
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background/90 backdrop-blur-sm border-input focus:bg-background transition-all"
              placeholder="Enter event title..."
              aria-label="Event title"
              aria-required="true"
            />
          </div>

          {/* Category and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Tag className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: EventCategory) => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="bg-background/90 backdrop-blur-sm border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-sm border-border">
                  <SelectItem value="personal">
                    <span className="flex items-center">
                      <span className={cn("w-3 h-3 rounded-full mr-2 shadow-sm", categoryColors.personal)} />
                      Personal
                    </span>
                  </SelectItem>
                  <SelectItem value="work">
                    <span className="flex items-center">
                      <span className={cn("w-3 h-3 rounded-full mr-2 shadow-sm", categoryColors.work)} />
                      Work
                    </span>
                  </SelectItem>
                  <SelectItem value="effort">
                    <span className="flex items-center">
                      <span className={cn("w-3 h-3 rounded-full mr-2 shadow-sm", categoryColors.effort)} />
                      Effort
                    </span>
                  </SelectItem>
                  <SelectItem value="note">
                    <span className="flex items-center">
                      <span className={cn("w-3 h-3 rounded-full mr-2 shadow-sm", categoryColors.note)} />
                      Note
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* All Day Toggle */}
            <div className="space-y-2">
              <Label htmlFor="all-day" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                All Day Event
              </Label>
              <div className="flex items-center space-x-2 h-10 px-3 bg-background/90 backdrop-blur-sm border border-input rounded-md">
                <Switch
                  id="all-day"
                  checked={formData.allDay || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
                />
                <Label htmlFor="all-day" className="text-sm text-muted-foreground cursor-pointer">
                  {formData.allDay ? 'Yes' : 'No'}
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <CalendarIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-background/90 backdrop-blur-sm border-input hover:bg-accent hover:text-accent-foreground",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border-border">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <CalendarIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background/90 backdrop-blur-sm border-input hover:bg-accent hover:text-accent-foreground",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border-border">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                    disabled={(date) => formData.startDate ? date < formData.startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Location
            </Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-background/90 backdrop-blur-sm border-input focus:bg-background transition-all"
              placeholder="Add location (optional)"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <Tag className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background/90 backdrop-blur-sm border-input focus:bg-background transition-all resize-none"
              placeholder="Add description (optional)"
              rows={3}
            />
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-900 dark:text-red-100">
                <strong>Schedule Conflict Detected</strong>
                <ul className="mt-2 text-sm space-y-1">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", categoryColors[conflict.category as EventCategory])} />
                      {conflict.title}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="bg-muted/30 backdrop-blur-sm rounded-b-lg p-6 -m-6 mt-4 border-t border-border">
          {event && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="mr-auto hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.title}
            variant="default"
            className="shadow-sm"
          >
            {conflicts.length > 0 ? 'Save Anyway' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}