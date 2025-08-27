'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { announceToScreenReader } from '@/lib/accessibility';
import { cn } from '@/lib/utils';
import type { Event, EventCategory, EventPriority } from '@/types/calendar';
import { format } from 'date-fns';
import {
  AlertCircle,
  Bell,
  CalendarIcon,
  Clock,
  MapPin,
  Repeat,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { ConstraintSystem } from './ConstraintSystem';
import { EnhancedDateRangePicker } from './EnhancedDateRangePicker';
import { EnhancedDateTimePicker } from './EnhancedDateTimePicker';
import { CategoryTagManager } from './category-tag-manager';

interface DateRange {
  from: Date;
  to: Date;
}

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  selectedDate: Date | null;
  selectedRange: DateRange | null;
  onSave: (event: Partial<Event>) => void;
  onDelete: (id: string) => void;
  checkOverlaps: (start: Date, end: Date, excludeId?: string) => Event[];
  onSmartSchedule?: (title: string, duration: number) => void;
  events?: Event[];
}

export function EventModal({
  open,
  onOpenChange,
  event,
  selectedDate,
  selectedRange,
  onSave,
  onDelete,
  checkOverlaps,
  onSmartSchedule,
  events = [],
}: EventModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const [formData, setFormData] = React.useState<Partial<Event>>({
    title: '',
    category: 'personal',
    priority: 'medium',
    startDate: selectedDate || new Date(),
    endDate: selectedDate || new Date(),
    description: '',
    tags: [],
  });

  // Available tags for the tag manager (in real app, this would come from a database)
  const [availableTags, setAvailableTags] = React.useState<string[]>([
    'meeting',
    'urgent',
    'project',
    'personal',
    'health',
    'learning',
    'travel',
    'family',
  ]);

  const [_showSmartSchedule, _setShowSmartSchedule] = React.useState(false);

  const _conflicts = React.useMemo(() => {
    if (formData.startDate && formData.endDate && formData.title) {
      // Filter out duplicate "New Event" entries and only show unique conflicts
      const overlaps = checkOverlaps(formData.startDate, formData.endDate, event?.id);

      // Remove duplicates and limit to 5 conflicts max
      const uniqueConflicts = overlaps
        .filter(
          (conflict, index, self) =>
            index ===
            self.findIndex(
              (c) =>
                c.title === conflict.title && c.startDate.getTime() === conflict.startDate.getTime()
            )
        )
        .slice(0, 5);

      return uniqueConflicts;
    }
    return [];
  }, [formData.startDate, formData.endDate, formData.title, checkOverlaps, event]);

  React.useEffect(() => {
    if (event) {
      setFormData(event);
    } else if (selectedRange) {
      setFormData((prev) => ({
        ...prev,
        startDate: selectedRange.from,
        endDate: selectedRange.to,
      }));
    } else if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        startDate: selectedDate,
        endDate: selectedDate,
      }));
    }
  }, [event, selectedDate, selectedRange]);

  // Focus management
  React.useEffect(() => {
    if (open) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the title input after modal is rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
        announceToScreenReader(event ? 'Edit event dialog opened' : 'Create event dialog opened');
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
        announceToScreenReader('Event dialog closed');
      }
    }
  }, [open, event]);

  const handleSave = () => {
    if (formData.title && formData.startDate && formData.endDate) {
      onSave({
        ...formData,
        id: event?.id || crypto.randomUUID(),
      });
      onOpenChange(false);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'personal',
      startDate: new Date(),
      endDate: new Date(),
      description: '',
    });
  };

  const _categoryColors = {
    personal: 'bg-primary text-primary-foreground',
    work: 'bg-secondary text-secondary-foreground',
    effort: 'bg-accent text-accent-foreground',
    note: 'bg-muted text-muted-foreground',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Responsive width: mobile-first approach
          'w-[calc(100vw-1rem)] max-w-[95vw]', // Mobile: almost full width with small margin
          'sm:w-auto sm:max-w-[580px]', // Small tablets: comfortable width
          'md:max-w-[680px]', // Medium screens: more space for content
          'lg:max-w-[780px]', // Large screens: spacious layout
          // Responsive height with proper constraints
          'max-h-[90vh] min-h-[300px]', // Height between 300px and 90% viewport
          'sm:max-h-[85vh]', // Slightly smaller on larger screens
          // Overflow and scrolling
          'overflow-hidden', // Hide overflow on main container
          // Mobile positioning improvements
          'top-[5%] sm:top-[50%]', // Higher position on mobile, centered on desktop
          'translate-y-0 sm:translate-y-[-50%]', // No Y translation on mobile, centered on desktop
          // Styling
          'bg-card border border-border shadow-lg',
          prefersReducedMotion && 'transition-none'
        )}
        aria-labelledby="event-dialog-title"
        aria-describedby="event-dialog-description"
      >
        <DialogHeader className="bg-muted/30 rounded-t-lg p-4 sm:p-6 -m-6 mb-4 border-b border-border flex-shrink-0">
          <DialogTitle id="event-dialog-title" className="sr-only">
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <div className="text-lg sm:text-xl font-semibold">
            {event ? 'Edit Event' : 'Create New Event'}
          </div>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid gap-4 py-3 px-1 sm:gap-5 sm:py-4">
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
                className="bg-background border-input focus:bg-background transition-all"
                placeholder="Enter event title..."
                aria-label="Event title"
                aria-required="true"
              />
            </div>

            {/* Enhanced Category, Priority & Tags Management */}
            <div className="space-y-4">
              <CategoryTagManager
                selectedCategory={formData.category as EventCategory}
                selectedPriority={formData.priority as EventPriority}
                selectedTags={formData.tags || []}
                availableTags={availableTags}
                onCategoryChange={(category) => setFormData({ ...formData, category })}
                onPriorityChange={(priority) => setFormData({ ...formData, priority })}
                onTagsChange={(tags) => setFormData({ ...formData, tags })}
                onCreateTag={(tag) => setAvailableTags((prev) => [...prev, tag])}
              />
            </div>

            {/* Time Section */}
            <div className="space-y-4">
              {/* All Day Toggle */}
              <div className="space-y-2">
                <Label htmlFor="all-day" className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  All Day Event
                </Label>
                <div className="flex items-center space-x-2 h-10 px-3 bg-background border border-input rounded-md">
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
              {/* Enhanced Start Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Start Date & Time
                </Label>
                <EnhancedDateTimePicker
                  value={formData.startDate || undefined}
                  onChange={(date) => {
                    if (date) {
                      setFormData((prev) => ({
                        ...prev,
                        startDate: date,
                        // Auto-adjust end date if it's before start date
                        endDate: prev.endDate && prev.endDate < date ? date : prev.endDate,
                      }));
                    }
                  }}
                  placeholder="Select start date and time..."
                  showTimeSelect={true}
                  showPresets={true}
                  showQuickActions={true}
                  eventTitle={formData.title || 'New Event'}
                  eventCategory={formData.category}
                  eventDuration={
                    formData.endDate && formData.startDate
                      ? Math.round(
                          (formData.endDate.getTime() - formData.startDate.getTime()) / 60000
                        )
                      : 60
                  }
                  onEventCreate={(eventData) => {
                    // Quick create from within date picker
                    setFormData((prev) => ({
                      ...prev,
                      title: eventData.title || prev.title,
                      startDate: eventData.startDate || prev.startDate,
                      endDate: eventData.endDate || prev.endDate,
                      category: eventData.category || prev.category,
                      description: eventData.description || prev.description,
                    }));
                  }}
                />
              </div>

              {/* Enhanced End Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Clock className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  End Date & Time
                </Label>
                <EnhancedDateTimePicker
                  value={formData.endDate || undefined}
                  onChange={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, endDate: date }));
                    }
                  }}
                  placeholder="Select end date and time..."
                  showTimeSelect={true}
                  showPresets={true}
                  showQuickActions={false} // Don't show quick actions for end date
                  minDate={formData.startDate || undefined}
                  filterTime={(time) => {
                    // For end date, filter out times before start time if same day
                    if (
                      formData.startDate &&
                      formData.endDate &&
                      format(formData.startDate, 'yyyy-MM-dd') === format(time, 'yyyy-MM-dd')
                    ) {
                      return time.getTime() > formData.startDate.getTime();
                    }
                    return true;
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                </div>
                Location
              </Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-background border-input focus:bg-background transition-all"
                placeholder="Add location (optional)"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Tag className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-input focus:bg-background transition-all resize-none"
                placeholder="Add description (optional)"
                rows={3}
              />
            </div>

            {/* Business Rules & Constraint Validation */}
            <div className="space-y-3">
              <ConstraintSystem
                event={formData}
                existingEvents={events}
                onAutoFix={(fixedEvent) => setFormData(fixedEvent)}
                showSuggestions={true}
                compactMode={false}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/30 rounded-b-lg p-4 sm:p-6 -m-6 mt-4 border-t border-border flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 w-full">
            {/* Left side buttons */}
            <div className="flex gap-2 sm:mr-auto">
              {event && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {!event && onSmartSchedule && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const duration =
                      formData.endDate && formData.startDate
                        ? Math.round(
                            (formData.endDate.getTime() - formData.startDate.getTime()) / 60000
                          )
                        : 60; // Default to 60 minutes
                    onSmartSchedule(formData.title || 'New Event', duration);
                    onOpenChange(false);
                  }}
                  disabled={!formData.title}
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Smart Schedule
                </Button>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                size="sm"
                className="flex-1 sm:flex-none hover:bg-accent/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.title}
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none shadow-sm"
              >
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
