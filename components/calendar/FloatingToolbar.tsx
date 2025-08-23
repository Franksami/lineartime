'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/calendar'
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
  X
} from 'lucide-react'

interface FloatingToolbarProps {
  event: Event | null
  position?: { x: number; y: number }
  onUpdate?: (event: Event) => void
  onDelete?: (eventId: string) => void
  onDuplicate?: (event: Event) => void
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
  onClose,
  className
}: FloatingToolbarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (event) {
      setEditedTitle(event.title)
      setIsEditing(false)
      setShowColorPicker(false)
      setShowMoreOptions(false)
    }
  }, [event])
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])
  
  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
        setShowMoreOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (!event) return null
  
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== event.title) {
      onUpdate?.({ ...event, title: editedTitle.trim() })
    }
    setIsEditing(false)
  }
  
  const handleCategoryChange = (category: string) => {
    onUpdate?.({ ...event, category: category as Event['category'] })
    setShowColorPicker(false)
  }
  
  // Calculate toolbar position
  const toolbarStyle = position ? {
    left: `${position.x}px`,
    top: `${position.y - 60}px`, // Position above the event
  } : {}
  
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
            "absolute bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-1",
            "flex items-center gap-1",
            className
          )}
          style={{
            ...toolbarStyle,
            zIndex: 20 // CALENDAR_LAYERS.FLOATING_TOOLBAR
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
                    className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg p-1 min-w-[150px]"
                    style={{ zIndex: 31 }} // CALENDAR_LAYERS.DROPDOWN_MENU
                  >
                    <button
                      onClick={() => {
                        // Add description editing
                        setShowMoreOptions(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      <AlignLeft className="h-3 w-3" />
                      Edit Description
                    </button>
                    <button
                      onClick={() => {
                        // Add time editing
                        setShowMoreOptions(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      <Clock className="h-3 w-3" />
                      Change Time
                    </button>
                    <button
                      onClick={() => {
                        // Add recurrence
                        setShowMoreOptions(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      <Calendar className="h-3 w-3" />
                      Set Recurrence
                    </button>
                    <button
                      onClick={() => {
                        // Add tags
                        setShowMoreOptions(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent rounded text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      Add Tags
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