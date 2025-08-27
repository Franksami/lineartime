'use client';

import { cn } from '@/lib/utils';
import { type EventSegment, createPlugin, sliceEvents } from '@fullcalendar/core';
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

// Enhanced Linear Year View Configuration for FullCalendar v6+
// Displays all 12 months horizontally in a single view (LOCKED FOUNDATION)
// Features: React 19 patterns, collision detection, virtual rendering preparation

const LinearYearViewConfig = {
  classNames: ['linear-year-view', 'linear-year-pro'],

  content: (props: any) => {
    performance.mark('linear-year-render-start');

    const currentDate = props.dateProfile.currentRange.start;
    const year = currentDate.getFullYear();
    const segs = sliceEvents(props, true); // allDay=true

    // Enhanced event processing with collision detection
    const eventsByDate = processEventsWithCollisionDetection(segs);
    const overlappingDates = detectOverlappingDates(eventsByDate);

    // Enhanced month rendering with performance optimization
    const monthsHtml = generateMonthsHtml(year, eventsByDate, overlappingDates);

    performance.mark('linear-year-render-end');
    performance.measure('linear-year-render', 'linear-year-render-start', 'linear-year-render-end');

    const html = generateLinearYearHtml(year, monthsHtml, overlappingDates.size);

    return { html: html };
  },

  didMount: (props: any) => {
    const year = props.dateProfile.currentRange.start.getFullYear();
    console.log(`LinearYear Pro view mounted for ${year} with enhanced features`);

    const container = props.el;

    // Enhanced click handlers with performance tracking
    const handleClick = createOptimizedClickHandler(props);
    container.addEventListener('click', handleClick);

    // Enhanced hover effects with collision indication
    const handleMouseOver = createOptimizedHoverHandler(true);
    const handleMouseOut = createOptimizedHoverHandler(false);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    // Store cleanup functions
    container._cleanup = () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  },

  willUnmount: (props: any) => {
    console.log('LinearYear Pro view unmounting with cleanup');

    // Cleanup event listeners
    const container = props.el;
    if (container?._cleanup) {
      container._cleanup();
    }

    // Clear performance marks
    try {
      performance.clearMarks('linear-year-render-start');
      performance.clearMarks('linear-year-render-end');
      performance.clearMeasures('linear-year-render');
    } catch (error) {
      console.warn('Performance cleanup failed:', error);
    }
  },
};

// Enhanced helper functions for React 19 patterns and collision detection

function processEventsWithCollisionDetection(segs: EventSegment[]): Record<string, any[]> {
  const eventsByDate: Record<string, any[]> = {};

  segs.forEach((seg: any) => {
    const eventDate = seg.range.start.toISOString().split('T')[0];
    if (!eventsByDate[eventDate]) {
      eventsByDate[eventDate] = [];
    }
    eventsByDate[eventDate].push(seg);
  });

  return eventsByDate;
}

function detectOverlappingDates(eventsByDate: Record<string, any[]>): Set<string> {
  const overlapping = new Set<string>();

  Object.entries(eventsByDate).forEach(([dateKey, events]) => {
    if (events.length > 1) {
      overlapping.add(dateKey);
    }
  });

  return overlapping;
}

function generateMonthsHtml(
  year: number,
  eventsByDate: Record<string, any[]>,
  overlappingDates: Set<string>
): string {
  let monthsHtml = '';

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthDate = new Date(year, monthIndex, 1);
    const monthName = format(monthDate, 'MMMM');
    const firstDayOfMonth = startOfMonth(monthDate);
    const lastDayOfMonth = endOfMonth(monthDate);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks = [];

    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    // Generate days grid with enhanced styling
    let weeksHtml = '';
    weeks.forEach((week) => {
      let weekHtml = '<div class="week-row grid grid-cols-7 gap-0">';
      week.forEach((day) => {
        const isCurrentMonth = day.getMonth() === monthIndex;
        const dayNumber = day.getDate();
        const dateKey = day.toISOString().split('T')[0];
        const dayEvents = eventsByDate[dateKey] || [];
        const isTodayDate = isToday(day);
        const hasOverlap = overlappingDates.has(dateKey);

        // Enhanced event dots with collision indication
        let eventsHtml = '';
        if (dayEvents.length > 0) {
          eventsHtml = dayEvents
            .slice(0, 4)
            .map((event: any, index: number) => {
              const isLast = index === 3 && dayEvents.length > 4;
              const eventTitle = event.def?.title || 'Event';

              return `
              <div class="event-dot absolute w-2 h-2 rounded-full transition-all hover:scale-125 ${
                hasOverlap
                  ? 'bg-destructive border border-destructive-foreground animate-pulse'
                  : 'bg-primary'
              }" 
                   style="top: ${4 + index * 3}px; left: ${4 + index * 3}px;"
                   data-event-id="${event.def?.publicId || ''}"
                   title="${eventTitle}${isLast ? ` and ${dayEvents.length - 4} more` : ''}">
                ${isLast ? `<span class="absolute -top-1 -right-1 text-xs font-bold">+</span>` : ''}
              </div>
            `;
            })
            .join('');

          // Add overflow indicator for many events
          if (dayEvents.length > 4) {
            eventsHtml += `
              <div class="event-overflow absolute bottom-1 right-1 text-xs font-bold text-primary">
                ${dayEvents.length}
              </div>
            `;
          }
        }

        weekHtml += `
          <div class="day-cell relative h-12 flex items-center justify-center text-xs border border-border cursor-pointer transition-all hover:bg-accent hover:shadow-sm ${cn(
            isCurrentMonth
              ? isTodayDate
                ? 'text-foreground bg-primary/10 border-primary font-bold ring-1 ring-primary/30'
                : 'text-foreground bg-background'
              : 'text-muted-foreground bg-muted/30',
            hasOverlap && 'bg-destructive/5 border-destructive/30'
          )}" 
               data-date="${day.toISOString()}" 
               data-fc-date="${dateKey}"
               data-has-events="${dayEvents.length > 0}"
               data-has-overlap="${hasOverlap}"
               aria-label="${format(day, 'EEEE, MMMM d, yyyy')}${dayEvents.length > 0 ? ` - ${dayEvents.length} event(s)` : ''}${hasOverlap ? ' - Has conflicts' : ''}">
            <span class="day-number relative z-10">${dayNumber}</span>
            ${eventsHtml}
          </div>
        `;
      });
      weekHtml += '</div>';
      weeksHtml += weekHtml;
    });

    monthsHtml += `
      <div class="month-row flex items-stretch border-b border-border hover:bg-accent/5 transition-colors">
        <div class="month-label w-16 flex items-center justify-center bg-card border-r border-border">
          <span class="text-sm font-medium transform -rotate-90 select-none">${monthName}</span>
        </div>
        <div class="calendar-grid flex-1">
          ${weeksHtml}
        </div>
        <div class="month-label w-16 flex items-center justify-center bg-card border-l border-border">
          <span class="text-sm font-medium transform rotate-90 select-none">${monthName}</span>
        </div>
      </div>
    `;
  }

  return monthsHtml;
}

function generateLinearYearHtml(year: number, monthsHtml: string, conflictCount: number): string {
  return `
    <div class="linear-year-calendar bg-background text-foreground h-full overflow-hidden">
      <div class="year-header text-center py-4 border-b border-border bg-card">
        <div class="flex items-center justify-center gap-4">
          <h1 class="text-2xl font-bold">${year} Linear Calendar</h1>
          ${
            conflictCount > 0
              ? `
            <div class="flex items-center gap-2 text-destructive">
              <svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium">${conflictCount} conflicts</span>
            </div>
          `
              : ''
          }
        </div>
        <p class="text-sm text-muted-foreground mt-1">Life is bigger than a week</p>
      </div>
      
      <div class="days-header grid grid-cols-7 bg-muted/50 text-xs font-medium border-b border-border">
        <div class="col-start-2 p-2 text-center select-none">Su</div>
        <div class="p-2 text-center select-none">Mo</div>
        <div class="p-2 text-center select-none">Tu</div>
        <div class="p-2 text-center select-none">We</div>
        <div class="p-2 text-center select-none">Th</div>
        <div class="p-2 text-center select-none">Fr</div>
        <div class="p-2 text-center select-none">Sa</div>
      </div>
      
      <div class="months-container overflow-y-auto flex-1" style="height: calc(100% - 140px);">
        ${monthsHtml}
      </div>
      
      <div class="days-footer grid grid-cols-7 bg-muted/50 text-xs font-medium border-t border-border">
        <div class="col-start-2 p-2 text-center select-none">Su</div>
        <div class="p-2 text-center select-none">Mo</div>
        <div class="p-2 text-center select-none">Tu</div>
        <div class="p-2 text-center select-none">We</div>
        <div class="p-2 text-center select-none">Th</div>
        <div class="p-2 text-center select-none">Fr</div>
        <div class="p-2 text-center select-none">Sa</div>
      </div>
    </div>
  `;
}

function createOptimizedClickHandler(props: any) {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    const dayCell = target.closest('.day-cell');
    const eventDot = target.closest('.event-dot');

    if (eventDot) {
      // Enhanced event click with performance tracking
      e.stopPropagation();
      const eventId = eventDot.getAttribute('data-event-id');

      if (eventId) {
        performance.mark('event-click-start');
        console.log('LinearYear: Event clicked:', eventId);

        // Trigger FullCalendar's eventClick
        const event = props.eventStore.defs[eventId];
        if (event) {
          props.context.emitter.trigger('eventClick', {
            el: eventDot,
            event: { def: event },
            jsEvent: e,
            view: props.view,
          });
        }

        performance.mark('event-click-end');
        performance.measure('event-click', 'event-click-start', 'event-click-end');
      }
    } else if (dayCell) {
      // Enhanced date click with animation
      const dateStr = dayCell.getAttribute('data-date');
      if (dateStr) {
        const date = new Date(dateStr);
        const hasEvents = dayCell.getAttribute('data-has-events') === 'true';
        const hasOverlap = dayCell.getAttribute('data-has-overlap') === 'true';

        console.log('LinearYear: Date clicked:', date, { hasEvents, hasOverlap });

        // Add visual feedback
        dayCell.style.animation = 'pulse 0.3s ease-in-out';
        setTimeout(() => {
          if (dayCell.style) {
            dayCell.style.animation = '';
          }
        }, 300);

        // Trigger FullCalendar's dateClick
        props.context.emitter.trigger('dateClick', {
          date,
          dateStr: dayCell.getAttribute('data-fc-date'),
          allDay: true,
          dayEl: dayCell,
          jsEvent: e,
          view: props.view,
          // Enhanced data
          hasEvents,
          hasOverlap,
        });
      }
    }
  };
}

function createOptimizedHoverHandler(isMouseOver: boolean) {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    const eventDot = target.closest('.event-dot');
    const dayCell = target.closest('.day-cell');

    if (eventDot) {
      if (isMouseOver) {
        eventDot.style.transform = 'scale(1.2)';
        eventDot.style.zIndex = '50';
      } else {
        eventDot.style.transform = 'scale(1)';
        eventDot.style.zIndex = '10';
      }
    }

    if (dayCell) {
      const hasOverlap = dayCell.getAttribute('data-has-overlap') === 'true';
      if (isMouseOver && hasOverlap) {
        dayCell.style.boxShadow = '0 0 10px hsl(var(--destructive) / 0.5)';
      } else {
        dayCell.style.boxShadow = '';
      }
    }
  };
}

// Create the enhanced FullCalendar plugin
const LinearYearPlugin = createPlugin({
  name: 'linearYear',
  views: {
    linearYear: LinearYearViewConfig,
  },
});

export default LinearYearPlugin;
