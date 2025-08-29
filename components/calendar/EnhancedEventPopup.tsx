'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/components/ui/notify';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CALENDAR_LAYERS } from '@/lib/z-index';
import type { Event } from '@/types/calendar';
import {
  FloatingArrow,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit2,
  MapPin,
  Repeat,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';

// TUI Calendar-inspired professional interface
import 'react-datepicker/dist/react-datepicker.css';

interface EnhancedEventPopupProps {
  event: Event | null;
  isOpen: boolean;
  anchorElement?: HTMLElement | null;
  onClose: () => void;
  onUpdate?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: Event) => void;
  className?: string;
}

const categoryOptions = [
  { value: 'personal', label: 'Personal', color: 'bg-primary' },
  { value: 'work', label: 'Work', color: 'bg-secondary' },
  { value: 'effort', label: 'Effort', color: 'bg-accent' },
  { value: 'note', label: 'Note', color: 'bg-muted' },
];

export function EnhancedEventPopup({
  event,
  isOpen,
  anchorElement,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  className,
}: EnhancedEventPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event | null>(null);
  const arrowRef = useRef<SVGSVGElement>(null);

  // Professional floating positioning with Floating UI
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: onClose,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Update floating reference when anchor element changes
  useEffect(() => {
    if (anchorElement) {
      refs.setReference(anchorElement);
    }
  }, [anchorElement, refs]);

  // Initialize edit form when event changes
  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      setIsEditing(false);
    }
  }, [event]);

  if (!event || !editedEvent) return null;

  const handleSave = () => {
    if (!editedEvent.title.trim()) {
      notify.error('Event title is required');
      return;
    }

    if (onUpdate) {
      onUpdate(editedEvent);
    }
    setIsEditing(false);
    onClose();
    notify.success('Event updated successfully');
  };

  const handleCancel = () => {
    setEditedEvent({ ...event });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
    onClose();
    notify.success('Event deleted');
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      const duplicatedEvent = {
        ...event,
        id: `${event.id}-copy-${Date.now()}`,
        title: `${event.title} (Copy)`,
        startDate: addDays(event.startDate, 1),
        endDate: addDays(event.endDate, 1),
      };
      onDuplicate(duplicatedEvent);
    }
    onClose();
    notify.success('Event duplicated');
  };

  const updateField = (field: keyof Event, value: any) => {
    setEditedEvent((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            style={{ zIndex: CALENDAR_LAYERS.POPOVER - 1 }}
            onClick={onClose}
          />

          {/* Professional Popup */}
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: CALENDAR_LAYERS.POPOVER,
            }}
            className={cn('w-96 max-w-[90vw]', className)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <FloatingArrow ref={arrowRef} context={context} className="fill-card stroke-border" />

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {isEditing ? 'Edit Event' : 'Event Details'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDuplicate}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Event Title</label>
                  {isEditing ? (
                    <Input
                      value={editedEvent.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="Enter event title..."
                      className="text-sm"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                  )}
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Date & Time
                  </label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start</label>
                        <DatePicker
                          selected={editedEvent.startDate}
                          onChange={(date) => date && updateField('startDate', startOfDay(date))}
                          className="w-full text-xs p-2 border border-border rounded bg-background"
                          dateFormat="MMM d, yyyy"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">End</label>
                        <DatePicker
                          selected={editedEvent.endDate}
                          onChange={(date) => date && updateField('endDate', endOfDay(date))}
                          className="w-full text-xs p-2 border border-border rounded bg-background"
                          dateFormat="MMM d, yyyy"
                          minDate={editedEvent.startDate}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {format(event.startDate, 'MMM d, yyyy')}
                      {format(event.startDate, 'yyyy-MM-dd') !==
                        format(event.endDate, 'yyyy-MM-dd') &&
                        ` - ${format(event.endDate, 'MMM d, yyyy')}`}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Category
                  </label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={editedEvent.category === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateField('category', option.value)}
                          className="justify-start"
                        >
                          <div className={cn('w-2 h-2 rounded-full mr-2', option.color)} />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="default" className="w-fit">
                      {categoryOptions.find((cat) => cat.value === event.category)?.label ||
                        event.category}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  {isEditing ? (
                    <Textarea
                      value={editedEvent.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Add event description..."
                      className="text-sm min-h-[80px]"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {event.description || 'No description'}
                    </div>
                  )}
                </div>

                {/* Advanced Options - Future Enhancement */}
                {!isEditing && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="text-xs font-medium text-muted-foreground">Quick Actions</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <MapPin className="h-3 w-3 mr-1" />
                        Location
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Users className="h-3 w-3 mr-1" />
                        Attendees
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Repeat className="h-3 w-3 mr-1" />
                        Repeat
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Bell className="h-3 w-3 mr-1" />
                        Reminder
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
