import { 
  addDays, 
  addWeeks, 
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  setHours,
  setMinutes,
  format,
  isWeekend,
  getDay,
  differenceInMinutes,
  isSameDay
} from 'date-fns';
import { TimeRange, RecurrencePattern } from '../types';

/**
 * Generate recurring dates based on a pattern
 */
export function generateRecurringDates(
  startDate: Date,
  pattern: RecurrencePattern,
  limit: number = 52 // Default to 52 occurrences (1 year for weekly)
): Date[] {
  const dates: Date[] = [];
  let currentDate = startDate;
  let count = 0;
  
  while (count < limit && (!pattern.endDate || currentDate <= pattern.endDate)) {
    // Check if this date is an exception
    if (!pattern.exceptions?.some(exception => isSameDay(exception, currentDate))) {
      // For weekly recurrence, check if it's the right day of week
      if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
        const dayOfWeek = getDay(currentDate);
        if (pattern.daysOfWeek.includes(dayOfWeek)) {
          dates.push(new Date(currentDate));
          count++;
        }
      } else {
        dates.push(new Date(currentDate));
        count++;
      }
    }
    
    // Move to next occurrence
    switch (pattern.frequency) {
      case 'daily':
        currentDate = addDays(currentDate, pattern.interval);
        break;
      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 1) {
          // Find next day in the week pattern
          currentDate = addDays(currentDate, 1);
        } else {
          currentDate = addWeeks(currentDate, pattern.interval);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, pattern.interval);
        break;
    }
  }
  
  return dates;
}

/**
 * Get working hours for a specific date
 */
export function getWorkingHours(
  date: Date,
  workingHours: {
    start: number;
    end: number;
    days: number[];
  }
): TimeRange | null {
  const dayOfWeek = getDay(date);
  
  if (!workingHours.days.includes(dayOfWeek)) {
    return null;
  }
  
  return {
    start: setMinutes(setHours(date, workingHours.start), 0),
    end: setMinutes(setHours(date, workingHours.end), 0)
  };
}

/**
 * Check if a time is within working hours
 */
export function isWithinWorkingHours(
  time: Date,
  workingHours: {
    start: number;
    end: number;
    days: number[];
  }
): boolean {
  const dayOfWeek = getDay(time);
  
  if (!workingHours.days.includes(dayOfWeek)) {
    return false;
  }
  
  const hour = time.getHours();
  return hour >= workingHours.start && hour < workingHours.end;
}

/**
 * Get the next working day from a given date
 */
export function getNextWorkingDay(
  from: Date,
  workingDays: number[] = [1, 2, 3, 4, 5] // Monday to Friday
): Date {
  let nextDay = addDays(from, 1);
  
  while (!workingDays.includes(getDay(nextDay))) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}

/**
 * Calculate buffer time between events
 */
export function calculateBufferTime(
  event1End: Date,
  event2Start: Date,
  defaultBuffer: number = 5
): number {
  const gap = differenceInMinutes(event2Start, event1End);
  return Math.max(0, gap);
}

/**
 * Format a time range for display
 */
export function formatTimeRange(start: Date, end: Date): string {
  const startStr = format(start, 'h:mm a');
  const endStr = format(end, 'h:mm a');
  
  if (isSameDay(start, end)) {
    return `${startStr} - ${endStr}`;
  } else {
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a')}`;
  }
}

/**
 * Get time blocks for a day (morning, afternoon, evening)
 */
export function getDayTimeBlocks(date: Date): {
  morning: TimeRange;
  afternoon: TimeRange;
  evening: TimeRange;
} {
  return {
    morning: {
      start: setMinutes(setHours(date, 6), 0),
      end: setMinutes(setHours(date, 12), 0)
    },
    afternoon: {
      start: setMinutes(setHours(date, 12), 0),
      end: setMinutes(setHours(date, 17), 0)
    },
    evening: {
      start: setMinutes(setHours(date, 17), 0),
      end: setMinutes(setHours(date, 22), 0)
    }
  };
}

/**
 * Check if a date is a holiday (basic implementation - can be extended)
 */
export function isHoliday(date: Date, holidays: Date[] = []): boolean {
  return holidays.some(holiday => isSameDay(holiday, date));
}

/**
 * Get the week boundaries for a given date
 */
export function getWeekBoundaries(date: Date): TimeRange {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 })
  };
}

/**
 * Get the month boundaries for a given date
 */
export function getMonthBoundaries(date: Date): TimeRange {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
}

/**
 * Calculate the optimal meeting duration based on type
 */
export function suggestMeetingDuration(type: string): number {
  const durations: Record<string, number> = {
    'standup': 15,
    'quick-sync': 15,
    'one-on-one': 30,
    'meeting': 60,
    'workshop': 120,
    'training': 180,
    'all-hands': 60,
    'interview': 60,
    'review': 45,
    'brainstorm': 90
  };
  
  return durations[type.toLowerCase()] || 30;
}

/**
 * Parse flexible time expressions (e.g., "next week", "tomorrow morning")
 */
export function parseFlexibleTime(
  expression: string,
  referenceDate: Date = new Date()
): TimeRange | null {
  const lower = expression.toLowerCase();
  
  // Tomorrow
  if (lower.includes('tomorrow')) {
    const tomorrow = addDays(referenceDate, 1);
    
    if (lower.includes('morning')) {
      return {
        start: setMinutes(setHours(tomorrow, 9), 0),
        end: setMinutes(setHours(tomorrow, 12), 0)
      };
    } else if (lower.includes('afternoon')) {
      return {
        start: setMinutes(setHours(tomorrow, 13), 0),
        end: setMinutes(setHours(tomorrow, 17), 0)
      };
    } else if (lower.includes('evening')) {
      return {
        start: setMinutes(setHours(tomorrow, 17), 0),
        end: setMinutes(setHours(tomorrow, 20), 0)
      };
    } else {
      return {
        start: setMinutes(setHours(tomorrow, 9), 0),
        end: setMinutes(setHours(tomorrow, 17), 0)
      };
    }
  }
  
  // Next week
  if (lower.includes('next week')) {
    const nextWeek = addWeeks(referenceDate, 1);
    return getWeekBoundaries(nextWeek);
  }
  
  // This week
  if (lower.includes('this week')) {
    return getWeekBoundaries(referenceDate);
  }
  
  // Today
  if (lower.includes('today')) {
    if (lower.includes('morning')) {
      return {
        start: setMinutes(setHours(referenceDate, 9), 0),
        end: setMinutes(setHours(referenceDate, 12), 0)
      };
    } else if (lower.includes('afternoon')) {
      return {
        start: setMinutes(setHours(referenceDate, 13), 0),
        end: setMinutes(setHours(referenceDate, 17), 0)
      };
    } else if (lower.includes('evening')) {
      return {
        start: setMinutes(setHours(referenceDate, 17), 0),
        end: setMinutes(setHours(referenceDate, 20), 0)
      };
    } else {
      return {
        start: new Date(),
        end: setMinutes(setHours(referenceDate, 23), 59)
      };
    }
  }
  
  return null;
}

/**
 * Round time to nearest interval (e.g., 15, 30 minutes)
 */
export function roundToNearestInterval(
  date: Date,
  intervalMinutes: number = 15
): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  
  if (roundedMinutes === 60) {
    return setMinutes(addDays(date, 1), 0);
  }
  
  return setMinutes(date, roundedMinutes);
}

/**
 * Get energy level for a specific hour (basic implementation)
 */
export function getEnergyLevel(
  hour: number,
  profile: 'morning' | 'evening' | 'balanced' = 'balanced'
): number {
  switch (profile) {
    case 'morning':
      // Peak energy in the morning
      if (hour >= 6 && hour <= 11) return 0.9;
      if (hour >= 12 && hour <= 14) return 0.6;
      if (hour >= 15 && hour <= 17) return 0.7;
      if (hour >= 18 && hour <= 20) return 0.4;
      return 0.2;
      
    case 'evening':
      // Peak energy in the evening
      if (hour >= 6 && hour <= 9) return 0.3;
      if (hour >= 10 && hour <= 14) return 0.6;
      if (hour >= 15 && hour <= 18) return 0.8;
      if (hour >= 19 && hour <= 22) return 0.9;
      return 0.2;
      
    case 'balanced':
    default:
      // Balanced energy throughout the day
      if (hour >= 6 && hour <= 8) return 0.5;
      if (hour >= 9 && hour <= 11) return 0.8;
      if (hour >= 12 && hour <= 13) return 0.5;
      if (hour >= 14 && hour <= 16) return 0.7;
      if (hour >= 17 && hour <= 19) return 0.6;
      if (hour >= 20 && hour <= 22) return 0.4;
      return 0.2;
  }
}