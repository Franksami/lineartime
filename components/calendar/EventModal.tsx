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
import { CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="col-span-3"
              placeholder="Event title"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: EventCategory) => 
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <span className="flex items-center">
                    <span className={cn("w-3 h-3 rounded-full mr-2", categoryColors.personal)} />
                    Personal
                  </span>
                </SelectItem>
                <SelectItem value="work">
                  <span className="flex items-center">
                    <span className={cn("w-3 h-3 rounded-full mr-2", categoryColors.work)} />
                    Work
                  </span>
                </SelectItem>
                <SelectItem value="effort">
                  <span className="flex items-center">
                    <span className={cn("w-3 h-3 rounded-full mr-2", categoryColors.effort)} />
                    Effort
                  </span>
                </SelectItem>
                <SelectItem value="note">
                  <span className="flex items-center">
                    <span className={cn("w-3 h-3 rounded-full mr-2", categoryColors.note)} />
                    Note
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
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

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Schedule Conflict Detected</strong>
                <ul className="mt-2 text-sm">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx}>
                      • {conflict.title} ({conflict.category})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {event && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title}>
            {conflicts.length > 0 ? 'Save Anyway' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}