'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
import { format, addMinutes, addHours, startOfDay, endOfDay } from 'date-fns'
import {
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Tag,
  Palette,
  Move,
  Maximize2,
  AlignLeft,
  Type,
  MoreHorizontal,
  Check,
  X,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface FloatingToolbarProps {
  event: Event | null
  position?: { x: number; y: number }
  onUpdate?: (event: Event) => void
  onDelete?: (eventId: string) => void
  onDuplicate?: (event: Event) => void
  onEdit?: (event: Event) => void
  onClose?: () => void
  className?: string
}

const categoryColors = [
  { name: 'personal', color: 'bg-green-500', label: 'Personal' },
  { name: 'work', color: 'bg-blue-500', label: 'Work' },
  { name: 'effort', color: 'bg-orange-500', label: 'Effort' },
  { name: 'note', color: 'bg-purple-500', label: 'Note' }
]

export function FloatingToolbar({
  event,
  position,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  onClose,
  className
}: FloatingToolbarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (event) {
      setEditedTitle(event.title)
      setEditedDescription(event.description || '')
      setIsEditing(false)
      setIsEditingDescription(false)
      setShowColorPicker(false)
      setShowTimeEditor(false)
      setShowMoreOptions(false)
    }
  }, [event])
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])
  
  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus()
    }
  }, [isEditingDescription])
  
  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
        setShowTimeEditor(false)
        setShowMoreOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (!event) return null
  
  // Quick time adjustment functions
  const adjustEventTime = (minutes: number) => {
    const newStartDate = addMinutes(event.startDate, minutes)
    const newEndDate = addMinutes(event.endDate, minutes)
    onUpdate?.({ ...event, startDate: newStartDate, endDate: newEndDate })
  }
  
  const adjustEventDuration = (minutes: number) => {
    const newEndDate = addMinutes(event.endDate, minutes)
    if (newEndDate > event.startDate) {
      onUpdate?.({ ...event, endDate: newEndDate })
    }
  }
  
  const toggleAllDay = () => {
    if (event.allDay) {
      // Convert from all-day to timed event (9 AM - 5 PM)
      const startDate = new Date(event.startDate)
      startDate.setHours(9, 0, 0, 0)
      const endDate = new Date(event.startDate)
      endDate.setHours(17, 0, 0, 0)
      onUpdate?.({ ...event, allDay: false, startDate, endDate })
    } else {
      // Convert to all-day event
      onUpdate?.({ 
        ...event, 
        allDay: true, 
        startDate: startOfDay(event.startDate),
        endDate: endOfDay(event.endDate)
      })
    }
  }
  
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== event.title) {
      onUpdate?.({ ...event, title: editedTitle.trim() })
    }
    setIsEditing(false)
  }
  
  const handleDescriptionSave = () => {
    if (editedDescription !== (event.description || '')) {
      onUpdate?.({ ...event, description: editedDescription.trim() || undefined })
    }
    setIsEditingDescription(false)
  }
  
  const handleCategoryChange = (category: string) => {
    onUpdate?.({ ...event, category: category as Event['category'] })
    setShowColorPicker(false)
  }
  
  // Calculate toolbar position
  // Adjust toolbar position to avoid being hidden behind header
  const calculateToolbarPosition = () => {
    if (!position) return {}
    
    // Get viewport height and minimum top position (below header)
    const minTop = 120 // NavigationHeader (~60px) + Calendar header (~60px)
    const toolbarHeight = 60
    
    // Calculate desired position (above the event)
    let desiredTop = position.y - toolbarHeight
    
    // If toolbar would be hidden behind header, position it below the event instead
    if (desiredTop < minTop) {
      desiredTop = position.y + 40 // Position below the event
    }
    
    return {
      left: `${position.x}px`,
      top: `${desiredTop}px`,
    }
  }
  
  const toolbarStyle = calculateToolbarPosition()
  
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          ref={toolbarRef}
          data-testid="floating-toolbar"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "fixed bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-1",
            "flex items-center gap-1",
            className
          )}
          style={{
            ...toolbarStyle,
            zIndex: 9999 // Ensure toolbar is always on top
          }}
        >
          {/* Title Editing */}
          {isEditing ? (
            <div className="flex items-center gap-1 px-2">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                className="bg-transparent border-b border-border px-1 py-0.5 text-sm focus:outline-none min-w-[150px]"
              />
              <button
                onClick={handleTitleSave}
                className="p-1 hover:bg-accent rounded text-green-600"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-accent rounded text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              {/* Edit Title Button */}
              <button
                data-testid="toolbar-edit"
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-accent rounded"
                title="Edit title"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              
              {/* Separator */}
              <div className="w-px h-6 bg-border" />
              
              {/* Category Color Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 hover:bg-accent rounded"
                  title="Change category"
                >
                  <Palette className="h-4 w-4" />
                </button>
                
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-1 bg-background border rounded-lg shadow-lg p-2"
                    style={{ zIndex: 30 }} // CALENDAR_LAYERS.COLOR_PICKER
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {categoryColors.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => handleCategoryChange(cat.name)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-xs",
                            event.category === cat.name && "bg-accent"
                          )}
                        >
                          <div className={cn("w-3 h-3 rounded", cat.color)} />
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Duplicate */}
              <button
                data-testid="toolbar-duplicate"
                onClick={() => onDuplicate?.(event)}
                className="p-1.5 hover:bg-accent rounded"
                title="Duplicate event"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              {/* Move/Drag Indicator */}
              <button
                className="p-1.5 hover:bg-accent rounded cursor-move"
                title="Drag to move"
              >
                <Move className="h-4 w-4" />
              </button>
              
              {/* Resize Indicator */}
              <button
                className="p-1.5 hover:bg-accent rounded"
                title="Resize event"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              
              {/* Separator */}
              <div className="w-px h-6 bg-border" />
              
              {/* More Options */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="p-1.5 hover:bg-accent rounded"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {showMoreOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg p-1 min-w-[180px] max-w-[250px]"
                    style={{ zIndex: 31 }}
                  >
                    {/* Quick Description Editor */}
                    {isEditingDescription ? (
                      <div className="p-2 border-b">
                        <textarea
                          ref={descriptionRef}
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleDescriptionSave()
                            } else if (e.key === 'Escape') {
                              setIsEditingDescription(false)
                              setEditedDescription(event.description || '')
                            }
                          }}
                          className="w-full text-sm border rounded px-2 py-1 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Add description..."
                        />
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={handleDescriptionSave}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingDescription(false)
                              setEditedDescription(event.description || '')
                            }}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                      >
                        <FileText className="h-3 w-3" />
                        {event.description ? 'Edit Description' : 'Add Description'}
                      </button>
                    )}
                    
                    {/* Time Editor */}
                    <div className="p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Quick Time Adjust</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => adjustEventTime(-15)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Move 15 minutes earlier"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          -15m
                        </button>
                        <button
                          onClick={() => adjustEventTime(15)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Move 15 minutes later"
                        >
                          +15m
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => adjustEventTime(-60)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Move 1 hour earlier"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          -1h
                        </button>
                        <button
                          onClick={() => adjustEventTime(60)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Move 1 hour later"
                        >
                          +1h
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Duration Controls */}
                    <div className="p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Duration</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => adjustEventDuration(-15)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Shorten by 15 minutes"
                        >
                          <Minus className="h-3 w-3" />
                          -15m
                        </button>
                        <button
                          onClick={() => adjustEventDuration(15)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Extend by 15 minutes"
                        >
                          <Plus className="h-3 w-3" />
                          +15m
                        </button>
                        <button
                          onClick={() => adjustEventDuration(-60)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Shorten by 1 hour"
                        >
                          <Minus className="h-3 w-3" />
                          -1h
                        </button>
                        <button
                          onClick={() => adjustEventDuration(60)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
                          title="Extend by 1 hour"
                        >
                          <Plus className="h-3 w-3" />
                          +1h
                        </button>
                      </div>
                    </div>
                    
                    {/* All Day Toggle */}
                    <button
                      onClick={toggleAllDay}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      {event.allDay ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                      {event.allDay ? 'Make Timed Event' : 'Make All Day'}
                    </button>
                    
                    {/* Full Edit */}
                    <button
                      onClick={() => {
                        onEdit?.(event)
                        setShowMoreOptions(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      <AlignLeft className="h-3 w-3" />
                      Full Edit
                    </button>
                  </motion.div>
                )}
              </div>
              
              {/* Delete */}
              <button
                data-testid="toolbar-delete"
                onClick={() => {
                  if (confirm('Delete this event?')) {
                    onDelete?.(event.id)
                  }
                }}
                className="p-1.5 hover:bg-accent rounded text-red-600"
                title="Delete event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              {/* Close */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-accent rounded ml-2"
                title="Close toolbar"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}