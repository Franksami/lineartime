'use client';

import { cn } from '@/lib/utils';
import { format, isSameDay, isToday } from 'date-fns';
import React from 'react';

interface CalendarGridProps {
  year: number;
  dayWidth: number;
  monthHeight: number;
  headerWidth: number;
  headerHeight: number;
  hoveredDate: Date | null;
  selectedDate: Date | null;
  onDateHover: (date: Date | null) => void;
  onDateClick: (date: Date) => void;
  isFullYearZoom: boolean;
  isMobile: boolean;
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Full Year Grid Component (12×42 layout) - Pure rendering component
export const CalendarGrid = React.memo(function CalendarGrid({
  year,
  dayWidth,
  monthHeight,
  headerWidth,
  headerHeight,
  hoveredDate,
  selectedDate,
  onDateHover,
  onDateClick,
  isFullYearZoom,
  isMobile,
}: CalendarGridProps) {
  // Helper function to get date for a specific cell in each month row
  const getDateForCell = React.useCallback(
    (monthRow: number, col: number): Date | null => {
      // Create date for first day of this month
      const monthDate = new Date(year, monthRow, 1);
      const firstDayOfWeek = monthDate.getDay(); // 0 = Sunday
      const daysInThisMonth = new Date(year, monthRow + 1, 0).getDate();

      // Calculate day number (1-31) based on column position
      // Account for empty cells at beginning of month for week alignment
      const dayNumber = col - firstDayOfWeek + 1;

      // Check if this column should show a day number for this month
      if (dayNumber < 1 || dayNumber > daysInThisMonth) {
        return null; // Empty cell for alignment
      }

      // Return the actual date for this day of the month
      return new Date(year, monthRow, dayNumber);
    },
    [year]
  );

  // Create day-of-week headers (top) with visual week grouping
  const dayHeadersTop = React.useMemo(
    () => (
      <div
        className="absolute top-0 left-0 right-0 bg-background border-b border-border flex z-20"
        style={{ height: headerHeight }}
      >
        <div style={{ width: headerWidth }} className="border-r border-border bg-background" />
        {Array.from({ length: 42 }).map((_, col) => {
          const dayOfWeek = col % 7;
          const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
          const dayName = dayNames[dayOfWeek];

          return (
            <div
              key={`header-top-${col}`}
              className={cn(
                'flex items-center justify-center text-[10px] font-medium text-muted-foreground relative',
                col % 7 === 6 && 'border-r-2 border-border/60', // Stronger week separator
                dayOfWeek === 0 && col > 0 && 'border-l border-border/30' // Start of week
              )}
              style={{ width: dayWidth }}
            >
              {dayName}
            </div>
          );
        })}
        <div style={{ width: headerWidth }} className="border-l border-border bg-background" />
      </div>
    ),
    [dayWidth, headerWidth, headerHeight]
  );

  // Create day-of-week headers (bottom) - mirror of top for easy reference
  const dayHeadersBottom = React.useMemo(
    () => (
      <div
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border flex z-20"
        style={{ height: headerHeight }}
      >
        <div style={{ width: headerWidth }} className="border-r border-border bg-background" />
        {Array.from({ length: 42 }).map((_, col) => {
          const dayOfWeek = col % 7;
          const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
          const dayName = dayNames[dayOfWeek];

          return (
            <div
              key={`header-bottom-${col}`}
              className={cn(
                'flex items-center justify-center text-[10px] font-medium text-muted-foreground',
                col % 7 === 6 && 'border-r-2 border-border/60', // Stronger week separator
                dayOfWeek === 0 && col > 0 && 'border-l border-border/30' // Start of week
              )}
              style={{ width: dayWidth }}
            >
              {dayName}
            </div>
          );
        })}
        <div style={{ width: headerWidth }} className="border-l border-border bg-background" />
      </div>
    ),
    [dayWidth, headerWidth, headerHeight]
  );

  // Create month labels (left and right)
  const monthLabelsLeft = React.useMemo(
    () => (
      <div
        className="absolute left-0 bg-background border-r border-border z-10"
        style={{ width: headerWidth, top: headerHeight, bottom: headerHeight }}
      >
        {MONTH_SHORT.map((month, idx) => (
          <div
            key={`left-${month}`}
            className="absolute flex items-center justify-center font-medium text-sm"
            style={{
              top: idx * monthHeight,
              height: monthHeight,
              width: headerWidth,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              transformOrigin: 'center',
            }}
          >
            {month}
          </div>
        ))}
      </div>
    ),
    [headerWidth, headerHeight, monthHeight]
  );

  const monthLabelsRight = React.useMemo(
    () => (
      <div
        className="absolute right-0 bg-background border-l border-border z-10"
        style={{ width: headerWidth, top: headerHeight, bottom: headerHeight }}
      >
        {MONTH_SHORT.map((month, idx) => (
          <div
            key={`right-${month}`}
            className="absolute flex items-center justify-center font-medium text-sm"
            style={{
              top: idx * monthHeight,
              height: monthHeight,
              width: headerWidth,
              writingMode: 'vertical-rl',
            }}
          >
            {month}
          </div>
        ))}
      </div>
    ),
    [headerWidth, headerHeight, monthHeight]
  );

  // Generate grid cells (12 months × 42 days max)
  const gridCells = React.useMemo(() => {
    const cells = [];
    for (let monthRow = 0; monthRow < 12; monthRow++) {
      for (let col = 0; col < 42; col++) {
        const date = getDateForCell(monthRow, col);
        // Weekend detection based on column position (0=Sunday, 6=Saturday)
        const dayOfWeek = col % 7;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isCurrentDay = date && isToday(date);
        const isSelected = date && selectedDate && isSameDay(date, selectedDate);
        const isHovered = date && hoveredDate && isSameDay(date, hoveredDate);
        const isEmpty = !date;

        cells.push(
          <div
            key={`${monthRow}-${col}`}
            data-date={date ? format(date, 'yyyy-MM-dd') : undefined}
            data-day={date ? format(date, 'd') : undefined}
            className={cn(
              'absolute transition-colors day-cell',
              col % 7 === 6 && 'border-r-2 border-border/60', // week separator
              isWeekend && 'bg-muted/20',
              isEmpty && 'bg-transparent cursor-default'
            )}
            style={{
              left: headerWidth + col * dayWidth,
              top: headerHeight + monthRow * monthHeight,
              width: dayWidth,
              height: monthHeight,
            }}
            onMouseEnter={() => {
              if (date) {
                onDateHover(date);
              }
            }}
            onMouseLeave={() => onDateHover(null)}
            onClick={(e) => {
              e.preventDefault();
              if (date) {
                onDateClick(date);
              }
            }}
            title={date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
          >
            <div
              className={cn(
                'm-[2px] h-[calc(100%-4px)] rounded-sm border',
                isEmpty ? 'border-transparent' : 'border-border/40',
                isSelected && 'ring-1 ring-blue-500 /* TODO: Use semantic token */',
                isHovered && !isEmpty && 'bg-accent/20'
              )}
              aria-hidden
            >
              <div className="w-full h-full flex items-center justify-center">
                {!isEmpty && (
                  <span
                    className={cn(
                      'text-[10px] leading-none text-muted-foreground',
                      isCurrentDay && 'font-semibold text-primary'
                    )}
                  >
                    {format(date!, 'dd')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    }
    return cells;
  }, [
    year,
    dayWidth,
    monthHeight,
    headerWidth,
    headerHeight,
    hoveredDate,
    selectedDate,
    onDateHover,
    onDateClick,
    getDateForCell,
  ]);

  if (!isFullYearZoom) {
    return null; // This component only renders the full year grid
  }

  return (
    <div className="relative w-full h-full">
      {dayHeadersTop}
      {dayHeadersBottom}
      {monthLabelsLeft}
      {monthLabelsRight}
      <div
        className="absolute inset-0"
        style={{ paddingTop: headerHeight, paddingBottom: headerHeight }}
      >
        {gridCells}
      </div>
    </div>
  );
});

CalendarGrid.displayName = 'CalendarGrid';
