import type { Event } from '@/types/calendar';
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  getDay,
  isAfter,
  isBefore,
  isWeekend,
  isWithinInterval,
  max,
  min,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import type { TimeRange, TimeSlot, UserPreferences } from './types';

export class TimeSlotFinder {
  private readonly MIN_SLOT_DURATION = 15; // minutes
  private readonly DEFAULT_BUFFER = 5; // minutes between events

  constructor(
    private events: Event[] = [],
    private preferences?: UserPreferences
  ) {}

  /**
   * Find all available time slots in a given date range
   */
  public findAvailableSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    options?: {
      includeWeekends?: boolean;
      respectWorkingHours?: boolean;
      bufferTime?: number;
    }
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const buffer = options?.bufferTime ?? this.preferences?.bufferTime ?? this.DEFAULT_BUFFER;

    // Process each day in the range
    let currentDate = startOfDay(startDate);
    while (isBefore(currentDate, endDate)) {
      // Skip weekends if requested
      if (!options?.includeWeekends && isWeekend(currentDate)) {
        currentDate = addMinutes(currentDate, 24 * 60);
        continue;
      }

      // Get day boundaries considering working hours
      const { dayStart, dayEnd } = this.getDayBoundaries(
        currentDate,
        options?.respectWorkingHours ?? true
      );

      if (dayStart && dayEnd) {
        // Find free slots for this day
        const daySlots = this.findDaySlots(dayStart, dayEnd, duration, buffer);
        slots.push(...daySlots);
      }

      // Move to next day
      currentDate = addMinutes(currentDate, 24 * 60);
    }

    return slots;
  }

  /**
   * Find the next available slot for a given duration
   */
  public findNextAvailableSlot(
    startFrom: Date,
    duration: number,
    options?: {
      maxDaysAhead?: number;
      preferredTimes?: TimeRange[];
      avoidTimes?: TimeRange[];
    }
  ): TimeSlot | null {
    const maxDate = addMinutes(startFrom, (options?.maxDaysAhead ?? 30) * 24 * 60);
    const slots = this.findAvailableSlots(startFrom, maxDate, duration, {
      respectWorkingHours: true,
      includeWeekends: false,
    });

    if (slots.length === 0) {
      return null;
    }

    // Filter by preferred times if provided
    if (options?.preferredTimes && options.preferredTimes.length > 0) {
      const preferredSlots = slots.filter((slot) =>
        this.isInPreferredTime(slot, options.preferredTimes!)
      );
      if (preferredSlots.length > 0) {
        return preferredSlots[0];
      }
    }

    // Filter out avoided times
    if (options?.avoidTimes && options.avoidTimes.length > 0) {
      const filteredSlots = slots.filter(
        (slot) => !this.isInAvoidedTime(slot, options.avoidTimes!)
      );
      if (filteredSlots.length > 0) {
        return filteredSlots[0];
      }
    }

    return slots[0];
  }

  /**
   * Check if a time slot conflicts with existing events
   */
  public hasConflict(slot: TimeSlot): boolean {
    return this.events.some((event) =>
      this.eventsOverlap(
        { start: slot.start, end: slot.end },
        { start: event.startDate, end: event.endDate }
      )
    );
  }

  /**
   * Find conflicts for a proposed time slot
   */
  public findConflicts(slot: TimeSlot): Event[] {
    return this.events.filter((event) =>
      this.eventsOverlap(
        { start: slot.start, end: slot.end },
        { start: event.startDate, end: event.endDate }
      )
    );
  }

  /**
   * Get free time statistics for a date range
   */
  public getFreeTimeStats(
    startDate: Date,
    endDate: Date
  ): {
    totalFreeTime: number; // minutes
    largestFreeBlock: number; // minutes
    averageFreeBlock: number; // minutes
    freeTimePercentage: number; // 0-100
  } {
    const slots = this.findAvailableSlots(startDate, endDate, this.MIN_SLOT_DURATION, {
      respectWorkingHours: true,
      includeWeekends: false,
    });

    if (slots.length === 0) {
      return {
        totalFreeTime: 0,
        largestFreeBlock: 0,
        averageFreeBlock: 0,
        freeTimePercentage: 0,
      };
    }

    const totalFreeTime = slots.reduce((sum, slot) => sum + slot.duration, 0);
    const largestFreeBlock = Math.max(...slots.map((s) => s.duration));
    const averageFreeBlock = totalFreeTime / slots.length;

    // Calculate total working time in the range
    const totalWorkingTime = this.calculateTotalWorkingTime(startDate, endDate);
    const freeTimePercentage = totalWorkingTime > 0 ? (totalFreeTime / totalWorkingTime) * 100 : 0;

    return {
      totalFreeTime,
      largestFreeBlock,
      averageFreeBlock,
      freeTimePercentage: Math.round(freeTimePercentage),
    };
  }

  /**
   * Find optimal meeting times for multiple attendees
   */
  public findCommonAvailability(
    attendeeSchedules: Event[][],
    duration: number,
    dateRange: TimeRange,
    options?: {
      preferredTimes?: TimeRange[];
      minAttendees?: number; // Minimum attendees required
    }
  ): TimeSlot[] {
    // Merge all events from all attendees
    const allEvents = attendeeSchedules.flat();

    // Create a new finder with merged events
    const finder = new TimeSlotFinder(allEvents, this.preferences);

    // Find available slots
    let slots = finder.findAvailableSlots(dateRange.start, dateRange.end, duration, {
      respectWorkingHours: true,
      includeWeekends: false,
    });

    // If we have a minimum attendee requirement, find slots where at least that many are free
    if (options?.minAttendees && options.minAttendees < attendeeSchedules.length) {
      slots = this.filterByMinimumAttendees(slots, attendeeSchedules, options.minAttendees);
    }

    // Apply preferred times filter
    if (options?.preferredTimes) {
      const preferredSlots = slots.filter((slot) =>
        this.isInPreferredTime(slot, options.preferredTimes!)
      );
      if (preferredSlots.length > 0) {
        return preferredSlots;
      }
    }

    return slots;
  }

  // Private helper methods

  private getDayBoundaries(
    date: Date,
    respectWorkingHours: boolean
  ): { dayStart: Date | null; dayEnd: Date | null } {
    if (!respectWorkingHours) {
      return {
        dayStart: startOfDay(date),
        dayEnd: endOfDay(date),
      };
    }

    const dayOfWeek = getDay(date);

    // Check if this is a working day
    if (
      this.preferences?.workingHours.days &&
      !this.preferences.workingHours.days.includes(dayOfWeek)
    ) {
      return { dayStart: null, dayEnd: null };
    }

    // Use working hours from preferences or defaults
    const startHour = this.preferences?.workingHours.start ?? 9;
    const endHour = this.preferences?.workingHours.end ?? 17;

    return {
      dayStart: setMinutes(setHours(date, startHour), 0),
      dayEnd: setMinutes(setHours(date, endHour), 0),
    };
  }

  private findDaySlots(dayStart: Date, dayEnd: Date, duration: number, buffer: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayEvents = this.events
      .filter((event) =>
        this.eventsOverlap(
          { start: dayStart, end: dayEnd },
          { start: event.startDate, end: event.endDate }
        )
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    let currentTime = dayStart;

    for (const event of dayEvents) {
      // Check if there's a gap before this event
      const gapEnd = addMinutes(event.startDate, -buffer);

      if (isAfter(gapEnd, currentTime)) {
        const gapDuration = differenceInMinutes(gapEnd, currentTime);

        if (gapDuration >= duration) {
          // We can fit one or more slots in this gap
          let slotStart = currentTime;
          while (differenceInMinutes(gapEnd, slotStart) >= duration) {
            slots.push({
              start: slotStart,
              end: addMinutes(slotStart, duration),
              duration,
              available: true,
            });
            slotStart = addMinutes(slotStart, duration + buffer);
          }
        }
      }

      // Move current time to after this event
      currentTime = addMinutes(event.endDate, buffer);
    }

    // Check if there's time after the last event
    if (isAfter(dayEnd, currentTime)) {
      const remainingTime = differenceInMinutes(dayEnd, currentTime);

      if (remainingTime >= duration) {
        let slotStart = currentTime;
        while (differenceInMinutes(dayEnd, slotStart) >= duration) {
          slots.push({
            start: slotStart,
            end: addMinutes(slotStart, duration),
            duration,
            available: true,
          });
          slotStart = addMinutes(slotStart, duration + buffer);
        }
      }
    }

    return slots;
  }

  private eventsOverlap(
    event1: { start: Date; end: Date },
    event2: { start: Date; end: Date }
  ): boolean {
    return (
      (isAfter(event1.end, event2.start) && isBefore(event1.start, event2.end)) ||
      (isAfter(event2.end, event1.start) && isBefore(event2.start, event1.end)) ||
      event1.start.getTime() === event2.start.getTime() ||
      event1.end.getTime() === event2.end.getTime()
    );
  }

  private isInPreferredTime(slot: TimeSlot, preferredTimes: TimeRange[]): boolean {
    return preferredTimes.some(
      (range) =>
        isWithinInterval(slot.start, { start: range.start, end: range.end }) &&
        isWithinInterval(slot.end, { start: range.start, end: range.end })
    );
  }

  private isInAvoidedTime(slot: TimeSlot, avoidTimes: TimeRange[]): boolean {
    return avoidTimes.some((range) =>
      this.eventsOverlap(
        { start: slot.start, end: slot.end },
        { start: range.start, end: range.end }
      )
    );
  }

  private calculateTotalWorkingTime(startDate: Date, endDate: Date): number {
    let totalMinutes = 0;
    let currentDate = startOfDay(startDate);

    while (isBefore(currentDate, endDate)) {
      if (!isWeekend(currentDate)) {
        const { dayStart, dayEnd } = this.getDayBoundaries(currentDate, true);
        if (dayStart && dayEnd) {
          totalMinutes += differenceInMinutes(dayEnd, dayStart);
        }
      }
      currentDate = addMinutes(currentDate, 24 * 60);
    }

    return totalMinutes;
  }

  private filterByMinimumAttendees(
    slots: TimeSlot[],
    attendeeSchedules: Event[][],
    minAttendees: number
  ): TimeSlot[] {
    return slots.filter((slot) => {
      let availableAttendees = 0;

      for (const schedule of attendeeSchedules) {
        const hasConflict = schedule.some((event) =>
          this.eventsOverlap(
            { start: slot.start, end: slot.end },
            { start: event.startDate, end: event.endDate }
          )
        );

        if (!hasConflict) {
          availableAttendees++;
        }
      }

      return availableAttendees >= minAttendees;
    });
  }
}
