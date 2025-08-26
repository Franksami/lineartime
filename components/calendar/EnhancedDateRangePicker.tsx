'use client'

import React, { useState, useCallback, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { CalendarRange, ArrowRight, Zap, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Import CSS for react-datepicker
import 'react-datepicker/dist/react-datepicker.css'

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface RangePreset {
  label: string
  getValue: () => DateRange
  description: string
  category: 'quick' | 'week' | 'month' | 'quarter'
  icon: React.ComponentType<{ className?: string }>
}

interface EnhancedDateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showPresets?: boolean
  minDate?: Date
  maxDate?: Date
  excludeDates?: Date[]
  maxDays?: number
  selectsRange?: boolean
}

// Predefined range presets for common date selections
const RANGE_PRESETS: RangePreset[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      return { startDate: today, endDate: today }
    },
    description: 'Just today',
    category: 'quick',
    icon: Clock
  },
  {
    label: 'Tomorrow',
    getValue: () => {
      const tomorrow = addDays(new Date(), 1)
      return { startDate: tomorrow, endDate: tomorrow }
    },
    description: 'Just tomorrow',
    category: 'quick',
    icon: Zap
  },
  {
    label: 'Next 3 Days',
    getValue: () => ({
      startDate: new Date(),
      endDate: addDays(new Date(), 2)
    }),
    description: 'Today through 2 days ahead',
    category: 'quick',
    icon: Zap
  },
  {
    label: 'Next 7 Days',
    getValue: () => ({
      startDate: new Date(),
      endDate: addDays(new Date(), 6)
    }),
    description: 'Today through next week',
    category: 'quick',
    icon: Zap
  },
  {
    label: 'This Week',
    getValue: () => {
      const today = new Date()
      return {
        startDate: startOfWeek(today, { weekStartsOn: 0 }), // Sunday
        endDate: endOfWeek(today, { weekStartsOn: 0 }) // Saturday
      }
    },
    description: 'Sunday to Saturday',
    category: 'week',
    icon: CalendarRange
  },
  {
    label: 'Next Week',
    getValue: () => {
      const nextWeek = addWeeks(new Date(), 1)
      return {
        startDate: startOfWeek(nextWeek, { weekStartsOn: 0 }),
        endDate: endOfWeek(nextWeek, { weekStartsOn: 0 })
      }
    },
    description: 'Sunday to Saturday of next week',
    category: 'week',
    icon: CalendarRange
  },
  {
    label: 'Work Week',
    getValue: () => {
      const today = new Date()
      const monday = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const friday = addDays(monday, 4) // Friday
      return {
        startDate: monday,
        endDate: friday
      }
    },
    description: 'Monday to Friday',
    category: 'week',
    icon: CalendarRange
  },
  {
    label: 'This Month',
    getValue: () => {
      const today = new Date()
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today)
      }
    },
    description: 'First to last day of month',
    category: 'month',
    icon: CalendarRange
  },
  {
    label: 'Next Month',
    getValue: () => {
      const nextMonth = addMonths(new Date(), 1)
      return {
        startDate: startOfMonth(nextMonth),
        endDate: endOfMonth(nextMonth)
      }
    },
    description: 'First to last day of next month',
    category: 'month',
    icon: CalendarRange
  },
  {
    label: 'Next 30 Days',
    getValue: () => ({
      startDate: new Date(),
      endDate: addDays(new Date(), 29)
    }),
    description: 'Rolling 30-day period',
    category: 'month',
    icon: CalendarRange
  },
  {
    label: 'Next 90 Days',
    getValue: () => ({
      startDate: new Date(),
      endDate: addDays(new Date(), 89)
    }),
    description: 'Rolling 90-day period',
    category: 'quarter',
    icon: CalendarRange
  }
]

export function EnhancedDateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range...',
  disabled = false,
  className,
  showPresets = true,
  minDate,
  maxDate,
  excludeDates = [],
  maxDays,
  selectsRange = true
}: EnhancedDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle date range selection
  const handleRangeChange = useCallback((dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    onChange({ startDate: start, endDate: end })
  }, [onChange])

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: RangePreset) => {
    const range = preset.getValue()
    onChange(range)
  }, [onChange])

  // Clear selection
  const handleClear = useCallback(() => {
    onChange({ startDate: null, endDate: null })
  }, [onChange])

  // Format display text
  const getDisplayText = useCallback(() => {
    if (!value?.startDate) return placeholder

    if (value.endDate) {
      if (format(value.startDate, 'yyyy-MM-dd') === format(value.endDate, 'yyyy-MM-dd')) {
        // Same day
        return format(value.startDate, 'PPP')
      } else {
        // Date range
        return `${format(value.startDate, 'MMM d')} - ${format(value.endDate, 'MMM d, yyyy')}`
      }
    } else {
      // Start date only
      return format(value.startDate, 'PPP')
    }
  }, [value, placeholder])

  // Calculate range info
  const rangeInfo = useMemo(() => {
    if (!value?.startDate || !value?.endDate) return null

    const days = differenceInDays(value.endDate, value.startDate) + 1
    return {
      days,
      isWeekend: days === 2 && value.startDate.getDay() === 6, // Saturday-Sunday
      isWorkWeek: days === 5 && value.startDate.getDay() === 1, // Monday-Friday
      isFullWeek: days === 7,
      isMonth: days >= 28 && days <= 31
    }
  }, [value])

  // Group presets by category
  const groupedPresets = useMemo(() => {
    return RANGE_PRESETS.reduce((acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = []
      }
      acc[preset.category].push(preset)
      return acc
    }, {} as Record<string, RangePreset[]>)
  }, [])

  // Check if range exceeds max days
  const exceedsMaxDays = useMemo(() => {
    if (!maxDays || !value?.startDate || !value?.endDate) return false
    return differenceInDays(value.endDate, value.startDate) + 1 > maxDays
  }, [maxDays, value])

  return (
    <div className={cn('enhanced-daterange-picker', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value?.startDate && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            {getDisplayText()}
            {exceedsMaxDays && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Max {maxDays} days
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Main DatePicker */}
            <div className="border-r">
              <DatePicker
                selected={value?.startDate}
                startDate={value?.startDate}
                endDate={value?.endDate}
                onChange={handleRangeChange}
                selectsRange={selectsRange}
                minDate={minDate}
                maxDate={maxDate}
                excludeDates={excludeDates}
                inline
                monthsShown={2}
                calendarClassName="enhanced-range-calendar"
                showPopperArrow={false}
                enableTabLoop={false}
              />
            </div>

            {/* Side Panel with Presets */}
            {showPresets && (
              <div className="w-64 p-4 space-y-4">
                {/* Range Presets */}
                <div className="space-y-3">
                  {Object.entries(groupedPresets).map(([category, presets]) => (
                    <div key={category}>
                      <Label className="text-sm font-medium capitalize mb-2 block">
                        {category === 'quick' ? 'Quick Select' : 
                         category === 'week' ? 'Weekly' :
                         category === 'month' ? 'Monthly' : 'Quarterly'}
                      </Label>
                      <div className="space-y-1">
                        {presets.map((preset) => {
                          const IconComponent = preset.icon
                          const presetRange = preset.getValue()
                          const isSelected = value?.startDate && value?.endDate &&
                            presetRange.startDate && presetRange.endDate &&
                            format(value.startDate, 'yyyy-MM-dd') === format(presetRange.startDate, 'yyyy-MM-dd') &&
                            format(value.endDate, 'yyyy-MM-dd') === format(presetRange.endDate, 'yyyy-MM-dd')
                          
                          return (
                            <Button
                              key={preset.label}
                              variant={isSelected ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handlePresetSelect(preset)}
                              className="w-full justify-start text-xs gap-2"
                            >
                              <IconComponent className="h-3 w-3" />
                              <span className="flex-1 text-left">{preset.label}</span>
                              {presetRange.startDate && presetRange.endDate && (
                                <Badge variant="secondary" className="text-xs">
                                  {differenceInDays(presetRange.endDate, presetRange.startDate) + 1}d
                                </Badge>
                              )}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Range Info */}
                {value?.startDate && value?.endDate && rangeInfo && (
                  <Card className="border-0 shadow-none bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Selected Range</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start:</span>
                          <span className="font-medium">{format(value.startDate, 'MMM d')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End:</span>
                          <span className="font-medium">{format(value.endDate, 'MMM d')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {rangeInfo.days} day{rangeInfo.days !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {rangeInfo.isWorkWeek && (
                          <Badge variant="secondary" className="text-xs">Work Week</Badge>
                        )}
                        {rangeInfo.isWeekend && (
                          <Badge variant="secondary" className="text-xs">Weekend</Badge>
                        )}
                        {rangeInfo.isFullWeek && (
                          <Badge variant="secondary" className="text-xs">Full Week</Badge>
                        )}
                        {rangeInfo.isMonth && (
                          <Badge variant="secondary" className="text-xs">Full Month</Badge>
                        )}
                        {exceedsMaxDays && (
                          <Badge variant="destructive" className="text-xs">Too long</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="flex-1"
                    disabled={!value?.startDate}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                    disabled={!value?.startDate || exceedsMaxDays}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Enhanced Styles for react-datepicker range */}
      <style jsx global>{`
        .enhanced-range-calendar {
          border: none !important;
          font-family: inherit;
        }
        
        .enhanced-range-calendar .react-datepicker__header {
          background-color: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
        }
        
        .enhanced-range-calendar .react-datepicker__current-month {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
        
        .enhanced-range-calendar .react-datepicker__day-name {
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          font-size: 0.75rem;
        }
        
        .enhanced-range-calendar .react-datepicker__day {
          color: hsl(var(--foreground));
          font-size: 0.875rem;
        }
        
        .enhanced-range-calendar .react-datepicker__day--selected,
        .enhanced-range-calendar .react-datepicker__day--range-start,
        .enhanced-range-calendar .react-datepicker__day--range-end {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        .enhanced-range-calendar .react-datepicker__day--in-selecting-range,
        .enhanced-range-calendar .react-datepicker__day--in-range {
          background-color: hsl(var(--primary) / 0.15) !important;
          color: hsl(var(--foreground)) !important;
        }
        
        .enhanced-range-calendar .react-datepicker__day:hover {
          background-color: hsl(var(--muted));
        }
        
        .enhanced-range-calendar .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
        }
        
        .enhanced-range-calendar .react-datepicker__month {
          margin: 1rem;
        }
        
        .enhanced-range-calendar .react-datepicker__month-container {
          float: left;
        }
      `}</style>
    </div>
  )
}

// Export presets for use in other components
export { RANGE_PRESETS }
export type { DateRange, RangePreset }