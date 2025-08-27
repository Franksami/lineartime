import type { Event } from '@/types/calendar';
import { getDay, isWeekend, isWithinInterval } from 'date-fns';
import type { SchedulingConstraint, SchedulingContext, TimeSlot } from '../types';

/**
 * Hard constraints that MUST be satisfied for a valid schedule
 */

export const NoDoubleBooking: SchedulingConstraint = {
  type: 'hard',
  name: 'no-double-booking',
  description: 'Cannot schedule overlapping events',
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    // Check if any existing event overlaps with this slot
    return !context.existingEvents.some((event) => {
      const eventStart = event.startDate.getTime();
      const eventEnd = event.endDate.getTime();
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();

      // Check for any overlap
      return slotStart < eventEnd && slotEnd > eventStart;
    });
  },
};

export const WorkingHoursConstraint: SchedulingConstraint = {
  type: 'hard',
  name: 'working-hours',
  description: 'Must be within defined working hours',
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    const { workingHours } = context.preferences;
    const slotDay = getDay(slot.start);

    // Check if it's a working day
    if (!workingHours.days.includes(slotDay)) {
      return false;
    }

    // Check if within working hours
    const slotStartHour = slot.start.getHours() + slot.start.getMinutes() / 60;
    const slotEndHour = slot.end.getHours() + slot.end.getMinutes() / 60;

    return slotStartHour >= workingHours.start && slotEndHour <= workingHours.end;
  },
};

export const MinimumDurationConstraint: SchedulingConstraint = {
  type: 'hard',
  name: 'minimum-duration',
  description: 'Event must meet minimum duration requirements',
  evaluate: (slot: TimeSlot): boolean => {
    // Minimum 15 minutes for any event
    return slot.duration >= 15;
  },
};

export const MaximumDurationConstraint: SchedulingConstraint = {
  type: 'hard',
  name: 'maximum-duration',
  description: 'Event cannot exceed maximum duration',
  evaluate: (slot: TimeSlot): boolean => {
    // Maximum 8 hours for any single event
    return slot.duration <= 480; // 8 hours in minutes
  },
};

export const DeadlineConstraint = (deadline: Date): SchedulingConstraint => ({
  type: 'hard',
  name: 'deadline',
  description: 'Must be scheduled before deadline',
  evaluate: (slot: TimeSlot): boolean => {
    return slot.end <= deadline;
  },
});

export const AttendeesAvailabilityConstraint = (
  attendeeEvents: Event[][]
): SchedulingConstraint => ({
  type: 'hard',
  name: 'attendees-availability',
  description: 'All required attendees must be available',
  evaluate: (slot: TimeSlot): boolean => {
    // Check if all attendees are free during this slot
    return attendeeEvents.every(
      (events) =>
        !events.some((event) => {
          const eventStart = event.startDate.getTime();
          const eventEnd = event.endDate.getTime();
          const slotStart = slot.start.getTime();
          const slotEnd = slot.end.getTime();

          return slotStart < eventEnd && slotEnd > eventStart;
        })
    );
  },
});

export const LocationAvailabilityConstraint = (locationEvents: Event[]): SchedulingConstraint => ({
  type: 'hard',
  name: 'location-availability',
  description: 'Location must be available',
  evaluate: (slot: TimeSlot): boolean => {
    // Check if location is free during this slot
    return !locationEvents.some((event) => {
      const eventStart = event.startDate.getTime();
      const eventEnd = event.endDate.getTime();
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();

      return slotStart < eventEnd && slotEnd > eventStart;
    });
  },
});

export const RecurringEventConstraint = (recurringPattern: {
  daysOfWeek?: number[];
  dates?: Date[];
}): SchedulingConstraint => ({
  type: 'hard',
  name: 'recurring-pattern',
  description: 'Must follow recurring pattern',
  evaluate: (slot: TimeSlot): boolean => {
    if (recurringPattern.daysOfWeek) {
      const slotDay = getDay(slot.start);
      if (!recurringPattern.daysOfWeek.includes(slotDay)) {
        return false;
      }
    }

    if (recurringPattern.dates) {
      // Check if slot matches any of the specified dates
      return recurringPattern.dates.some((date) => {
        const dateStart = new Date(date);
        dateStart.setHours(slot.start.getHours(), slot.start.getMinutes());
        return dateStart.getTime() === slot.start.getTime();
      });
    }

    return true;
  },
});

// Aggregate all default hard constraints
export const defaultHardConstraints: SchedulingConstraint[] = [
  NoDoubleBooking,
  WorkingHoursConstraint,
  MinimumDurationConstraint,
  MaximumDurationConstraint,
];

/**
 * Validate all hard constraints for a given slot
 */
export function validateHardConstraints(
  slot: TimeSlot,
  context: SchedulingContext,
  additionalConstraints: SchedulingConstraint[] = []
): { valid: boolean; violations: string[] } {
  const constraints = [...defaultHardConstraints, ...additionalConstraints];
  const violations: string[] = [];

  for (const constraint of constraints) {
    if (constraint.type === 'hard' && !constraint.evaluate(slot, context)) {
      violations.push(constraint.name);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
