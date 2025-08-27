'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Event, EventCategory } from '@/types/calendar';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  format,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { ArrowRight, Calendar, CheckCircle, Clock, Plus, Target, X, Zap } from 'lucide-react';
import type React from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';

// Import CSS for react-datepicker
import 'react-datepicker/dist/react-datepicker.css';

interface TimePreset {
  label: string;
  value: number; // hours in 24-hour format
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DatePreset {
  label: string;
  getValue: () => Date;
  description: string;
  category: 'today' | 'this-week' | 'next-week' | 'this-month' | 'next-month';
}

interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
}

interface EnhancedDateTimePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showTimeSelect?: boolean;
  showRecurrence?: boolean;
  showPresets?: boolean;
  showQuickActions?: boolean;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];
  includeTimes?: Date[];
  filterTime?: (time: Date) => boolean;
  eventTitle?: string;
  eventCategory?: EventCategory;
  eventDuration?: number; // minutes
}

// Predefined time presets for common scheduling
const TIME_PRESETS: TimePreset[] = [
  {
    label: '9:00 AM',
    value: 9,
    description: 'Standard work start',
    icon: Target,
  },
  {
    label: '12:00 PM',
    value: 12,
    description: 'Lunch time',
    icon: Clock,
  },
  {
    label: '2:00 PM',
    value: 14,
    description: 'Afternoon focus',
    icon: Zap,
  },
  {
    label: '5:00 PM',
    value: 17,
    description: 'End of workday',
    icon: CheckCircle,
  },
  {
    label: '7:00 PM',
    value: 19,
    description: 'Evening time',
    icon: Clock,
  },
];

// Predefined date presets for quick selection
const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Today',
    getValue: () => new Date(),
    description: 'Schedule for today',
    category: 'today',
  },
  {
    label: 'Tomorrow',
    getValue: () => addDays(new Date(), 1),
    description: 'Schedule for tomorrow',
    category: 'today',
  },
  {
    label: 'This Monday',
    getValue: () => {
      const today = new Date();
      const monday = addDays(today, (1 - today.getDay() + 7) % 7);
      return monday <= today ? addWeeks(monday, 1) : monday;
    },
    description: 'Start of this/next week',
    category: 'this-week',
  },
  {
    label: 'This Friday',
    getValue: () => {
      const today = new Date();
      const friday = addDays(today, (5 - today.getDay() + 7) % 7);
      return friday <= today ? addWeeks(friday, 1) : friday;
    },
    description: 'End of this/next week',
    category: 'this-week',
  },
  {
    label: 'Next Monday',
    getValue: () => {
      const today = new Date();
      const nextMonday = addDays(today, ((1 - today.getDay() + 7) % 7) + 7);
      return nextMonday;
    },
    description: 'Start of next week',
    category: 'next-week',
  },
  {
    label: '1st Next Month',
    getValue: () => {
      const nextMonth = addMonths(new Date(), 1);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    },
    description: 'First day of next month',
    category: 'next-month',
  },
];

// Duration presets for quick event creation
const DURATION_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: 'All day', value: 1440 }, // 24 hours
];

// Custom input component for react-datepicker
const CustomDateInput = forwardRef<
  HTMLInputElement,
  {
    value?: string;
    onClick?: () => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
  }
>(({ value, onClick, onChange, placeholder, className, disabled }, ref) => (
  <div className="relative">
    <Input
      ref={ref}
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      className={cn('pl-10', className)}
      disabled={disabled}
      readOnly
    />
    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
));
CustomDateInput.displayName = 'CustomDateInput';

export function EnhancedDateTimePicker({
  value,
  onChange,
  onEventCreate,
  placeholder = 'Select date and time...',
  disabled = false,
  className,
  showTimeSelect = true,
  showRecurrence = false,
  showPresets = true,
  showQuickActions = true,
  minDate,
  maxDate,
  excludeDates = [],
  includeTimes,
  filterTime,
  eventTitle = 'New Event',
  eventCategory = 'personal',
  eventDuration = 60,
}: EnhancedDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(eventDuration);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'none',
    interval: 1,
  });
  const [quickEventTitle, setQuickEventTitle] = useState(eventTitle);

  // Handle date selection with smart time setting
  const handleDateChange = useCallback(
    (date: Date | null) => {
      if (date) {
        // If no time is set, default to next available hour
        if (showTimeSelect && date.getHours() === 0 && date.getMinutes() === 0) {
          const now = new Date();
          const nextHour = now.getHours() + 1;
          date = setHours(setMinutes(date, 0), nextHour);
        }
      }
      onChange(date);
    },
    [onChange, showTimeSelect]
  );

  // Handle preset time selection
  const handleTimePreset = useCallback(
    (preset: TimePreset) => {
      if (value) {
        const newDate = setHours(setMinutes(value, 0), preset.value);
        onChange(newDate);
      } else {
        const today = new Date();
        const newDate = setHours(setMinutes(today, 0), preset.value);
        onChange(newDate);
      }
    },
    [value, onChange]
  );

  // Handle preset date selection
  const handleDatePreset = useCallback(
    (preset: DatePreset) => {
      const newDate = preset.getValue();

      // Preserve time if already set
      if (value && showTimeSelect) {
        newDate.setHours(value.getHours(), value.getMinutes());
      } else if (showTimeSelect) {
        // Set to next reasonable time
        const currentHour = new Date().getHours();
        const nextHour = currentHour < 17 ? currentHour + 1 : 9;
        newDate.setHours(nextHour, 0);
      }

      onChange(newDate);
    },
    [value, onChange, showTimeSelect]
  );

  // Create event with selected parameters
  const handleCreateEvent = useCallback(() => {
    if (!value || !onEventCreate) return;

    const startDate = value;
    const endDate =
      selectedDuration === 1440
        ? endOfDay(value)
        : new Date(value.getTime() + selectedDuration * 60 * 1000);

    const event: Partial<Event> = {
      title: quickEventTitle,
      startDate,
      endDate,
      category: eventCategory,
      isRecurring: recurrence.frequency !== 'none',
      description: `Created via Enhanced Date/Time Picker${
        recurrence.frequency !== 'none' ? ` (${recurrence.frequency})` : ''
      }`,
    };

    onEventCreate(event);
    setIsOpen(false);
  }, [value, onEventCreate, selectedDuration, quickEventTitle, eventCategory, recurrence]);

  // Filter past times for today
  const timeFilter = useCallback(
    (time: Date) => {
      if (filterTime) return filterTime(time);

      if (value && format(value, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        // For today, filter out past times
        return time.getTime() > new Date().getTime();
      }
      return true;
    },
    [value, filterTime]
  );

  // Grouped presets for better UX
  const groupedDatePresets = useMemo(() => {
    return DATE_PRESETS.reduce(
      (acc, preset) => {
        if (!acc[preset.category]) {
          acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
      },
      {} as Record<string, DatePreset[]>
    );
  }, []);

  return (
    <div className={cn('enhanced-datetime-picker', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {value ? (showTimeSelect ? format(value, 'PPP p') : format(value, 'PPP')) : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Main DatePicker */}
            <div className="border-r">
              <DatePicker
                selected={value}
                onChange={handleDateChange}
                showTimeSelect={showTimeSelect}
                timeIntervals={15}
                timeCaption="Time"
                dateFormat={showTimeSelect ? 'MMMM d, yyyy h:mm aa' : 'MMMM d, yyyy'}
                minDate={minDate}
                maxDate={maxDate}
                excludeDates={excludeDates}
                includeTimes={includeTimes}
                filterTime={timeFilter}
                inline
                customInput={<CustomDateInput />}
                calendarClassName="enhanced-calendar"
                showPopperArrow={false}
                enableTabLoop={false}
              />
            </div>

            {/* Side Panel with Presets and Actions */}
            <div className="w-72 p-4 space-y-4">
              {/* Time Presets */}
              {showTimeSelect && showPresets && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Times</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_PRESETS.map((preset) => {
                      const IconComponent = preset.icon;
                      const isSelected = value && value.getHours() === preset.value;

                      return (
                        <Button
                          key={preset.value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleTimePreset(preset)}
                          className="justify-start gap-2 text-xs"
                        >
                          <IconComponent className="h-3 w-3" />
                          {preset.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date Presets */}
              {showPresets && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Dates</Label>
                  <div className="space-y-2">
                    {Object.entries(groupedDatePresets).map(([category, presets]) => (
                      <div key={category} className="space-y-1">
                        {presets.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDatePreset(preset)}
                            className="w-full justify-between text-xs"
                          >
                            <span>{preset.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {format(preset.getValue(), 'MMM d')}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Quick Event Creation */}
              {showQuickActions && onEventCreate && (
                <Card className="border-0 shadow-none bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Quick Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={quickEventTitle}
                        onChange={(e) => setQuickEventTitle(e.target.value)}
                        placeholder="Event title..."
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Duration</Label>
                      <Select
                        value={selectedDuration.toString()}
                        onValueChange={(value) => setSelectedDuration(Number(value))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_PRESETS.map((duration) => (
                            <SelectItem key={duration.value} value={duration.value.toString()}>
                              {duration.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Recurrence Options */}
                    {showRecurrence && (
                      <div>
                        <Label className="text-xs">Repeat</Label>
                        <Select
                          value={recurrence.frequency}
                          onValueChange={(value) =>
                            setRecurrence((prev) => ({ ...prev, frequency: value as any }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No repeat</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      onClick={handleCreateEvent}
                      disabled={!value || !quickEventTitle.trim()}
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Current Selection Summary */}
              {value && (
                <Card className="border-0 shadow-none bg-primary/5">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground mb-1">Selected</div>
                    <div className="font-medium text-sm">
                      {format(value, showTimeSelect ? 'PPP p' : 'PPP')}
                    </div>
                    {showTimeSelect && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(value, 'EEEE')} at {format(value, 'h:mm a')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  disabled={!value}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Enhanced Styles for react-datepicker */}
      <style jsx global>{`
        .enhanced-calendar {
          border: none !important;
          font-family: inherit;
        }
        
        .enhanced-calendar .react-datepicker__header {
          background-color: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
        }
        
        .enhanced-calendar .react-datepicker__current-month {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
        
        .enhanced-calendar .react-datepicker__day-name {
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          font-size: 0.75rem;
        }
        
        .enhanced-calendar .react-datepicker__day {
          color: hsl(var(--foreground));
          font-size: 0.875rem;
        }
        
        .enhanced-calendar .react-datepicker__day--selected {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        .enhanced-calendar .react-datepicker__day:hover {
          background-color: hsl(var(--muted));
        }
        
        .enhanced-calendar .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
        }
        
        .enhanced-calendar .react-datepicker__time-container {
          border-left: 1px solid hsl(var(--border));
        }
        
        .enhanced-calendar .react-datepicker__time-list-item {
          color: hsl(var(--foreground));
        }
        
        .enhanced-calendar .react-datepicker__time-list-item:hover {
          background-color: hsl(var(--muted));
        }
        
        .enhanced-calendar .react-datepicker__time-list-item--selected {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
      `}</style>
    </div>
  );
}

// Export presets for use in other components
export { TIME_PRESETS, DATE_PRESETS, DURATION_PRESETS };
export type { TimePreset, DatePreset, RecurrenceRule };
