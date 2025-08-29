/**
 * React DatePicker Calendar View
 *
 * Date picker calendar with popup integration for Command Center platform.
 * Provides professional date selection with calendar popup functionality.
 *
 * Features:
 * - Date picker with calendar popup
 * - Time selection integration
 * - Professional styling with shadcn/ui
 * - Event creation capabilities
 * - Mobile responsive design
 *
 * @version 2.0.0 (Command Center Integration)
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { format, isSameDay } from 'date-fns';
import { Calendar, Clock, Plus } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';

// Import React DatePicker styles
import 'react-datepicker/dist/react-datepicker.css';

interface ReactDatePickerViewProps {
  events: Event[];
  onEventCreate?: (event: Partial<Event>) => void;
  onDateSelect?: (date: Date) => void;
  className?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  inline?: boolean;
}

export default function ReactDatePickerView({
  events = [],
  onEventCreate,
  onDateSelect,
  className,
  showTimeSelect = false,
  dateFormat = 'MMMM d, yyyy',
  inline = true,
}: ReactDatePickerViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [includeTime, setIncludeTime] = useState(showTimeSelect);

  // Get events for selected date
  const selectedEvents = events.filter(
    (event) => event.start && isSameDay(new Date(event.start), selectedDate)
  );

  // Handle date selection
  const handleDateChange = useCallback(
    (date: Date | null) => {
      if (date) {
        setSelectedDate(date);
        onDateSelect?.(date);
      }
    },
    [onDateSelect]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(() => {
    if (onEventCreate) {
      const title = prompt('Enter event title:');
      if (title) {
        onEventCreate({
          title,
          start: selectedDate,
          end: selectedDate,
          allDay: !includeTime,
        });
      }
    }
  }, [onEventCreate, selectedDate, includeTime]);

  // Custom day class name function to highlight days with events
  const getDayClassName = useCallback(
    (date: Date) => {
      const hasEvents = events.some(
        (event) => event.start && isSameDay(new Date(event.start), date)
      );

      return cn(
        'text-foreground hover:bg-accent hover:text-accent-foreground',
        hasEvents &&
          'relative after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
      );
    },
    [events]
  );

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Date Picker Calendar</span>
          </div>

          {selectedEvents.length > 0 && (
            <Badge variant="outline">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Selection Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="include-time" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Include Time Selection</span>
          </Label>
          <Switch id="include-time" checked={includeTime} onCheckedChange={setIncludeTime} />
        </div>

        {/* Date Picker */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              showTimeSelect={includeTime}
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
              dateFormat={includeTime ? 'MMMM d, yyyy h:mm aa' : dateFormat}
              inline={inline}
              dayClassName={getDayClassName}
              calendarClassName="bg-background border border-border rounded-lg shadow-lg"
              wrapperClassName="w-full"
              popperClassName="bg-background border border-border rounded-lg shadow-lg"
              // Custom styling for integration with shadcn/ui theme
              customInput={
                !inline ? (
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, dateFormat) : 'Pick a date'}
                  </Button>
                ) : undefined
              }
            />
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Selected Date</div>
                  <div className="text-lg font-semibold text-primary">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    {includeTime && (
                      <span className="text-muted-foreground text-base ml-2">
                        at {format(selectedDate, 'h:mm aa')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Events for selected date */}
                {selectedEvents.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      Events on this day
                    </div>
                    <div className="space-y-2">
                      {selectedEvents.map((event, idx) => (
                        <div key={idx} className="p-2 bg-background rounded border border-border">
                          <div className="font-medium text-sm">{event.title}</div>
                          {event.start && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(event.start), 'h:mm aa')}
                              {event.end && event.end !== event.start && (
                                <> - {format(new Date(event.end), 'h:mm aa')}</>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-2">
                  {onEventCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateEvent}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Event</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today);
                      setMonth(today);
                    }}
                  >
                    Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
