"use client"

import { useState, useEffect } from "react"
import {
  type CalendarEvent,
  type EventCategory,
  type EventPriority,
  type EventStatus,
  CATEGORY_COLORS,
} from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"

interface EventModalProps {
  isOpen: boolean
  mode: "create" | "edit" | "view"
  event: CalendarEvent | null
  date: Date | null
  onClose: () => void
  onCreate?: (event: Partial<CalendarEvent>) => void
  onUpdate?: (id: string, updates: Partial<CalendarEvent>) => void
  onDelete?: (id: string) => void
}

export function EventModal({ isOpen, mode, event, date, onClose, onCreate, onUpdate, onDelete }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    category: "personal" as EventCategory,
    priority: "medium" as EventPriority,
    status: "confirmed" as EventStatus,
  })

  useEffect(() => {
    if (mode === "create" && date) {
      const dateStr = format(date, "yyyy-MM-dd")
      setFormData({
        title: "",
        description: "",
        startDate: dateStr,
        endDate: dateStr,
        allDay: true,
        category: "personal",
        priority: "medium",
        status: "confirmed",
      })
    } else if (mode === "edit" && event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
        allDay: event.allDay,
        category: event.category,
        priority: event.priority,
        status: event.status,
      })
    }
  }, [mode, event, date])

  const handleSubmit = () => {
    if (mode === "create") {
      onCreate?.({
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        allDay: formData.allDay,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tags: [],
        attendees: [],
        childEventIds: [],
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user",
        lastModifiedBy: "user",
        syncStatus: "synced",
        customFields: {},
      })
    } else if (mode === "edit" && event) {
      onUpdate?.(event.id, {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        allDay: formData.allDay,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        updatedAt: new Date(),
        lastModifiedBy: "user",
      })
    }
    onClose()
  }

  const handleDelete = () => {
    if (event) {
      onDelete?.(event.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Event" : mode === "edit" ? "Edit Event" : "View Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              disabled={mode === "view"}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Event description"
              disabled={mode === "view"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                disabled={mode === "view"}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                disabled={mode === "view"}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allDay: checked }))}
              disabled={mode === "view"}
            />
            <Label htmlFor="allDay">All day</Label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: EventCategory) => setFormData((prev) => ({ ...prev, category: value }))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: EventPriority) => setFormData((prev) => ({ ...prev, priority: value }))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: EventStatus) => setFormData((prev) => ({ ...prev, status: value }))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          {mode === "edit" && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode !== "view" && <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Update"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
