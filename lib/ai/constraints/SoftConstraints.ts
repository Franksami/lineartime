import { TimeSlot, SchedulingConstraint, SchedulingContext, EnergyProfile } from '../types';
import { differenceInMinutes, getHours, isWithinInterval, getDay } from 'date-fns';
import { getEnergyLevel } from '../utils/dateHelpers';

/**
 * Soft constraints that are preferred but not required
 * Each constraint returns a score between 0 and 1 (1 being best)
 */

export const PreferredTimeConstraint = (
  preferredTimes: { start: Date; end: Date }[]
): SchedulingConstraint => ({
  type: 'soft',
  name: 'preferred-time',
  description: 'Prefer scheduling within user-preferred time ranges',
  penalty: 20,
  evaluate: (slot: TimeSlot): boolean => {
    // Check if slot is within any preferred time range
    return preferredTimes.some(range =>
      isWithinInterval(slot.start, { start: range.start, end: range.end }) &&
      isWithinInterval(slot.end, { start: range.start, end: range.end })
    );
  }
});

export const EnergyLevelConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'energy-level',
  description: 'Schedule high-priority tasks during peak energy times',
  penalty: 15,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    const hour = getHours(slot.start);
    const energyLevel = getEnergyLevel(
      hour,
      context.energyLevels.type as 'morning' | 'evening' | 'balanced'
    );
    
    // Prefer slots with energy level > 0.6
    return energyLevel > 0.6;
  }
};

export const BufferTimeConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'buffer-time',
  description: 'Maintain buffer time between events',
  penalty: 10,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    const bufferTime = context.preferences.bufferTime || 5;
    
    // Check events before and after this slot
    const nearbyEvents = context.existingEvents.filter(event => {
      const timeBefore = differenceInMinutes(slot.start, event.endDate);
      const timeAfter = differenceInMinutes(event.startDate, slot.end);
      
      // Check if event is within 2 hours of the slot
      return (timeBefore >= 0 && timeBefore < 120) || 
             (timeAfter >= 0 && timeAfter < 120);
    });
    
    // Check if adequate buffer exists
    return nearbyEvents.every(event => {
      const timeBefore = differenceInMinutes(slot.start, event.endDate);
      const timeAfter = differenceInMinutes(event.startDate, slot.end);
      
      return (timeBefore >= bufferTime || timeAfter >= bufferTime);
    });
  }
};

export const MeetingClusteringConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'meeting-clustering',
  description: 'Cluster meetings together to create focus blocks',
  penalty: 12,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    // Find meetings on the same day
    const slotDay = slot.start.toDateString();
    const sameDayMeetings = context.existingEvents.filter(event =>
      event.startDate.toDateString() === slotDay &&
      (event.category === 'work' || event.title.toLowerCase().includes('meeting'))
    );
    
    if (sameDayMeetings.length === 0) {
      // No existing meetings, any time is fine
      return true;
    }
    
    // Check if slot is within 1 hour of existing meetings
    return sameDayMeetings.some(meeting => {
      const gap = Math.min(
        Math.abs(differenceInMinutes(slot.start, meeting.endDate)),
        Math.abs(differenceInMinutes(slot.end, meeting.startDate))
      );
      return gap <= 60;
    });
  }
};

export const FocusTimeProtectionConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'focus-time-protection',
  description: 'Avoid scheduling during protected focus blocks',
  penalty: 25,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    // Check if slot overlaps with any focus blocks
    const overlapsWithFocus = context.focusBlocks.some(block => {
      if (!block.protected) return false;
      
      return block.preferredTimes.some(range => {
        const blockStart = range.start.getTime();
        const blockEnd = range.end.getTime();
        const slotStart = slot.start.getTime();
        const slotEnd = slot.end.getTime();
        
        return (slotStart < blockEnd && slotEnd > blockStart);
      });
    });
    
    return !overlapsWithFocus;
  }
};

export const AvoidBackToBackConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'avoid-back-to-back',
  description: 'Avoid too many back-to-back meetings',
  penalty: 8,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    const maxBackToBack = context.preferences.meetingPreferences?.maxBackToBack || 3;
    
    // Count consecutive meetings around this slot
    let consecutiveCount = 1; // This slot counts as 1
    
    // Check meetings before
    let currentTime = slot.start;
    for (const event of context.existingEvents.sort((a, b) => 
      b.endDate.getTime() - a.endDate.getTime()
    )) {
      if (Math.abs(differenceInMinutes(currentTime, event.endDate)) <= 15) {
        consecutiveCount++;
        currentTime = event.startDate;
      }
    }
    
    // Check meetings after
    currentTime = slot.end;
    for (const event of context.existingEvents.sort((a, b) => 
      a.startDate.getTime() - b.startDate.getTime()
    )) {
      if (Math.abs(differenceInMinutes(event.startDate, currentTime)) <= 15) {
        consecutiveCount++;
        currentTime = event.endDate;
      }
    }
    
    return consecutiveCount <= maxBackToBack;
  }
};

export const LunchTimeProtectionConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'lunch-time',
  description: 'Avoid scheduling during lunch hours',
  penalty: 15,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    if (!context.preferences.lunchTime) {
      // No lunch time preference set
      return true;
    }
    
    const lunchStart = context.preferences.lunchTime.start.getHours();
    const lunchEnd = context.preferences.lunchTime.end.getHours();
    const slotStartHour = slot.start.getHours();
    const slotEndHour = slot.end.getHours();
    
    // Check if slot overlaps with lunch time
    return !(slotStartHour < lunchEnd && slotEndHour > lunchStart);
  }
};

export const DayBalanceConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'day-balance',
  description: 'Balance workload across days',
  penalty: 5,
  evaluate: (slot: TimeSlot, context: SchedulingContext): boolean => {
    // Calculate total scheduled time for this day
    const slotDay = slot.start.toDateString();
    const dayEvents = context.existingEvents.filter(event =>
      event.startDate.toDateString() === slotDay
    );
    
    const totalMinutes = dayEvents.reduce((sum, event) =>
      sum + differenceInMinutes(event.endDate, event.startDate), 0
    );
    
    // Add this slot's duration
    const projectedTotal = totalMinutes + slot.duration;
    
    // Prefer days with less than 6 hours scheduled
    return projectedTotal < 360;
  }
};

export const WeekendAvoidanceConstraint: SchedulingConstraint = {
  type: 'soft',
  name: 'avoid-weekends',
  description: 'Prefer weekdays over weekends',
  penalty: 30,
  evaluate: (slot: TimeSlot): boolean => {
    const dayOfWeek = getDay(slot.start);
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  }
};

export const PriorityAlignmentConstraint = (priority: number): SchedulingConstraint => ({
  type: 'soft',
  name: 'priority-alignment',
  description: 'Schedule high-priority items sooner',
  penalty: priority * 10, // Higher priority = higher penalty for delayed scheduling
  evaluate: (slot: TimeSlot): boolean => {
    // Prefer scheduling within next 48 hours for high priority
    const hoursFromNow = differenceInMinutes(slot.start, new Date()) / 60;
    
    if (priority === 1) {
      return hoursFromNow <= 24; // Within 24 hours
    } else if (priority === 2) {
      return hoursFromNow <= 48; // Within 48 hours
    } else if (priority === 3) {
      return hoursFromNow <= 72; // Within 72 hours
    }
    
    return true; // Lower priority items have no time preference
  }
});

// Aggregate all default soft constraints
export const defaultSoftConstraints: SchedulingConstraint[] = [
  EnergyLevelConstraint,
  BufferTimeConstraint,
  MeetingClusteringConstraint,
  FocusTimeProtectionConstraint,
  AvoidBackToBackConstraint,
  LunchTimeProtectionConstraint,
  DayBalanceConstraint,
  WeekendAvoidanceConstraint
];

/**
 * Calculate soft constraint score for a given slot
 */
export function calculateSoftConstraintScore(
  slot: TimeSlot,
  context: SchedulingContext,
  additionalConstraints: SchedulingConstraint[] = []
): { score: number; penalties: { name: string; penalty: number }[] } {
  const constraints = [...defaultSoftConstraints, ...additionalConstraints];
  const penalties: { name: string; penalty: number }[] = [];
  let totalPenalty = 0;
  let maxPenalty = 0;
  
  for (const constraint of constraints) {
    if (constraint.type === 'soft') {
      maxPenalty += constraint.penalty || 10;
      if (!constraint.evaluate(slot, context)) {
        const penalty = constraint.penalty || 10;
        totalPenalty += penalty;
        penalties.push({ name: constraint.name, penalty });
      }
    }
  }
  
  // Convert to score between 0 and 100
  const score = maxPenalty > 0 ? ((maxPenalty - totalPenalty) / maxPenalty) * 100 : 100;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    penalties
  };
}