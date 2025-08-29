/**
 * React Day Picker Calendar View
 *
 * Flexible day picker calendar using react-day-picker with advanced customization
 * for Command Center platform integration.
 *
 * Features:
 * - Single, multiple, and range selection modes
 * - Custom styling with shadcn/ui integration
 * - Accessibility compliance (ARIA live regions)
 * - Professional appearance with semantic tokens
 * - Event integration with calendar system
 *
 * @version 2.0.0 (Command Center Integration)
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { format, isSameDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { type DayContentProps, DayPicker } from 'react-day-picker';

// Import DayPicker styles
import 'react-day-picker/style.css';

interface ReactDayPickerViewProps {
  events: Event[];
  onEventCreate?: (event: Partial<Event>) => void;
  onDateSelect?: (date: Date) => void;
  className?: string;
  mode?: 'single' | 'multiple' | 'range';
  showWeekNumbers?: boolean;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  numberOfMonths?: number;
}

// Custom day content component that shows event indicators
function CustomDayContent(props: DayContentProps & { events: Event[] }) {
  const { date, events } = props;
  const dayEvents = events.filter((event) => event.start && isSameDay(new Date(event.start), date));

  return (
    <div className="relative flex flex-col items-center">
      <span className="text-sm font-medium text-foreground">{date.getDate()}</span>
      {dayEvents.length > 0 && (
        <div className="flex space-x-1 mt-1">
          {dayEvents.slice(0, 3).map((event, idx) => (
            <div key={idx} className="w-1 h-1 rounded-full bg-primary" title={event.title} />
          ))}
          {dayEvents.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              +{dayEvents.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReactDayPickerView({
  events = [],
  onEventCreate,
  onDateSelect,
  className,
  mode = 'single',
  showWeekNumbers = false,
  showOutsideDays = true,
  fixedWeeks = false,
  numberOfMonths = 1,
}: ReactDayPickerViewProps) {
  const [selected, setSelected] = useState<Date | Date[] | undefined>();
  const [month, setMonth] = useState(new Date());

  // Handle date selection
  const handleSelect = useCallback(
    (date: Date | Date[] | undefined) => {
      setSelected(date);

      if (onDateSelect && date) {
        const selectedDate = Array.isArray(date) ? date[0] : date;
        if (selectedDate) {
          onDateSelect(selectedDate);
        }
      }
    },
    [onDateSelect]
  );

  // Handle date click for event creation
  const handleDayClick = useCallback(
    (date: Date) => {
      if (onEventCreate) {
        const title = prompt('Create new event:');
        if (title) {
          onEventCreate({
            title,
            start: date,
            end: date,
            allDay: true,
          });
        }
      }
    },
    [onEventCreate]
  );

  // Custom components for better integration
  const customComponents = {
    DayContent: (props: DayContentProps) => <CustomDayContent {...props} events={events} />,
  };

  // Get events for selected date
  const selectedDate = Array.isArray(selected) ? selected[0] : selected;
  const selectedEvents = selectedDate
    ? events.filter((event) => event.start && isSameDay(new Date(event.start), selectedDate))
    : [];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Day Picker Calendar</span>
          {selectedEvents.length > 0 && (
            <Badge variant="outline">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Day Picker Calendar */}
        <div className="flex justify-center">
          <DayPicker
            mode={mode as any}
            selected={selected as any}
            onSelect={handleSelect as any}
            onDayClick={handleDayClick}
            month={month}
            onMonthChange={setMonth}
            showWeekNumber={showWeekNumbers}
            showOutsideDays={showOutsideDays}
            fixedWeeks={fixedWeeks}
            numberOfMonths={numberOfMonths}
            components={customComponents}
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-lg font-semibold text-foreground',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7'
              ),
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
              day: cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'h-9 w-9 hover:bg-accent hover:text-accent-foreground'
              ),
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
              day_hidden: 'invisible',
            }}
            footer={
              selectedDate ? (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm text-foreground mb-2">
                    Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  {selectedEvents.length > 0 && (
                    <div className="space-y-1">
                      {selectedEvents.slice(0, 3).map((event, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {event.title}
                        </div>
                      ))}
                      {selectedEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{selectedEvents.length - 3} more events
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                'Select a date to view events'
              )
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setSelected(today);
              setMonth(today);
              onDateSelect?.(today);
            }}
          >
            Today
          </Button>

          {selectedDate && onEventCreate && (
            <Button variant="outline" size="sm" onClick={() => handleDayClick(selectedDate)}>
              Add Event
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
