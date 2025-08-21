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
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white/95 to-white/85 dark:from-gray-900/95 dark:to-gray-900/85 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-visible">
        <DialogHeader className="bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-800/30 backdrop-blur-xl rounded-t-lg p-6 -m-6 mb-4 border-b border-white/20 dark:border-white/10">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
                <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              Event Title
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all"
              placeholder="Enter event title..."
            />
          </div>

          {/* Category and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
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
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-white/30 dark:border-white/10">
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
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                All Day Event
              </Label>
              <div className="flex items-center space-x-2 h-10 px-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-md">
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
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
                  <CalendarIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-gray-800/70",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-white/30 dark:border-white/10">
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
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm">
                  <CalendarIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-gray-800/70",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-white/30 dark:border-white/10">
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
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Location
            </Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all"
              placeholder="Add location (optional)"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 backdrop-blur-sm">
                <Tag className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-white/10 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all resize-none"
              placeholder="Add description (optional)"
              rows={3}
            />
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <Alert className="bg-red-500/10 border-red-500/30 backdrop-blur-sm">
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

        <DialogFooter className="bg-gradient-to-r from-white/30 to-white/20 dark:from-gray-800/30 dark:to-gray-800/20 backdrop-blur-xl rounded-b-lg p-6 -m-6 mt-4 border-t border-white/20 dark:border-white/10">
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
            className="hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.title}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 transition-all"
          >
            {conflicts.length > 0 ? 'Save Anyway' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}