import { Event } from '@/types/calendar';
import {
  SchedulingRequest,
  SchedulingResult,
  SchedulingSuggestion,
  SchedulingContext,
  TimeSlot,
  UserPreferences,
  SchedulingConstraint,
  SchedulingConflict,
  ConflictResolution,
  RescheduleTrigger,
  RescheduleResult,
  CalendarChange,
  FocusTimeRequest,
  ProtectedTimeResult,
  FocusBlock
} from './types';
import { TimeSlotFinder } from './TimeSlotFinder';
import { SlotScorer, ScoredSlot } from './scoring/SlotScorer';
import {
  defaultHardConstraints,
  DeadlineConstraint,
  AttendeesAvailabilityConstraint,
  LocationAvailabilityConstraint,
  RecurringEventConstraint
} from './constraints/HardConstraints';
import {
  defaultSoftConstraints,
  PreferredTimeConstraint,
  PriorityAlignmentConstraint
} from './constraints/SoftConstraints';
import { addDays, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { generateRecurringDates } from './utils/dateHelpers';

export class SchedulingEngine {
  private slotFinder: TimeSlotFinder;
  private slotScorer: SlotScorer;
  private preferences: UserPreferences;
  private context: SchedulingContext;
  
  constructor(
    events: Event[] = [],
    preferences?: UserPreferences
  ) {
    this.preferences = preferences || this.getDefaultPreferences();
    this.slotFinder = new TimeSlotFinder(events, this.preferences);
    this.slotScorer = new SlotScorer();
    
    // Initialize context
    this.context = {
      existingEvents: events,
      preferences: this.preferences,
      focusBlocks: [],
      energyLevels: {
        type: 'balanced',
        levels: [],
        lastUpdated: new Date()
      },
      workingHours: this.getWorkingHoursRanges(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
  
  /**
   * Main scheduling method - finds optimal time slots for a request
   */
  public async schedule(request: SchedulingRequest): Promise<SchedulingResult> {
    try {
      // Build constraints from request
      const { hardConstraints, softConstraints } = this.buildConstraints(request);
      
      // Determine search range
      const searchStart = new Date();
      const searchEnd = request.deadline || addDays(searchStart, 30);
      
      // Find available slots
      const availableSlots = this.slotFinder.findAvailableSlots(
        searchStart,
        searchEnd,
        request.duration,
        {
          includeWeekends: false,
          respectWorkingHours: true,
          bufferTime: this.preferences.bufferTime
        }
      );
      
      if (availableSlots.length === 0) {
        return this.handleNoSlotsAvailable(request);
      }
      
      // Score and rank slots
      const scoredSlots = this.slotScorer.scoreSlots(
        availableSlots,
        this.context,
        hardConstraints,
        softConstraints,
        request.priority || 3,
        10 // Top 10 suggestions
      );
      
      // Filter out slots with score 0 (hard constraint violations)
      const validSlots = scoredSlots.filter(slot => slot.score > 0);
      
      if (validSlots.length === 0) {
        return this.handleConstraintConflicts(request, scoredSlots);
      }
      
      // Create suggestions from top slots
      const suggestions = this.createSuggestions(validSlots.slice(0, 3), request);
      
      // Find any conflicts with the best suggestion
      const conflicts = this.detectConflicts(suggestions[0].slot, request);
      
      return {
        success: true,
        suggestions,
        conflicts,
        alternativeOptions: validSlots.slice(3).map(slot => ({
          start: slot.start,
          end: slot.end,
          duration: slot.duration,
          available: true,
          score: slot.score
        }))
      };
    } catch (error) {
      return {
        success: false,
        suggestions: [],
        conflicts: [{
          type: 'constraint',
          severity: 'high',
          description: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
  
  /**
   * Reschedule existing events based on triggers
   */
  public async reschedule(
    trigger: RescheduleTrigger,
    affectedEvents: Event[]
  ): Promise<RescheduleResult> {
    const changes: CalendarChange[] = [];
    const conflicts: Event[] = [];
    const suggestions: SchedulingSuggestion[] = [];
    
    try {
      for (const event of affectedEvents) {
        // Create scheduling request from existing event
        const request: SchedulingRequest = {
          title: event.title,
          duration: Math.round((event.endDate.getTime() - event.startDate.getTime()) / 60000),
          category: event.category,
          priority: 2, // Medium priority for rescheduling
          flexible: true
        };
        
        // Add deadline based on trigger type
        if (trigger.type === 'cancellation' || trigger.type === 'conflict') {
          request.deadline = addDays(new Date(), 7); // Reschedule within a week
        }
        
        // Find new slot
        const result = await this.schedule(request);
        
        if (result.success && result.suggestions.length > 0) {
          const bestSlot = result.suggestions[0];
          changes.push({
            type: 'reschedule',
            event: event,
            newTime: bestSlot.slot,
            reason: trigger.reason || `Rescheduled due to ${trigger.type}`
          });
          suggestions.push(bestSlot);
        } else {
          conflicts.push(event);
        }
      }
      
      return {
        success: changes.length > 0,
        changes,
        conflicts,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        conflicts: affectedEvents
      };
    }
  }
  
  /**
   * Protect focus time by creating blocked periods
   */
  public async protectFocusTime(
    request: FocusTimeRequest
  ): Promise<ProtectedTimeResult> {
    const protectedBlocks: FocusBlock[] = [];
    const rescheduled: Event[] = [];
    const declined: Event[] = [];
    const conflicts: SchedulingConflict[] = [];
    
    try {
      // Create focus blocks
      let focusBlocks: TimeSlot[];
      
      if (request.recurring) {
        // Generate recurring focus blocks
        const dates = generateRecurringDates(
          new Date(),
          request.recurring,
          52 // Up to 1 year
        );
        
        focusBlocks = dates.map(date => ({
          start: date,
          end: addMinutes(date, request.duration),
          duration: request.duration,
          available: false
        }));
      } else {
        // Find available slots for focus time
        const searchEnd = addDays(new Date(), 30);
        focusBlocks = this.slotFinder.findAvailableSlots(
          new Date(),
          searchEnd,
          request.duration,
          {
            respectWorkingHours: true,
            includeWeekends: false
          }
        ).slice(0, 5); // Create up to 5 focus blocks
      }
      
      // Create FocusBlock objects
      focusBlocks.forEach((slot, index) => {
        const focusBlock: FocusBlock = {
          id: `focus-${Date.now()}-${index}`,
          type: request.type,
          title: `${request.type} Block`,
          preferredTimes: [{ start: slot.start, end: slot.end }],
          minDuration: request.duration,
          maxDuration: request.duration,
          priority: 1,
          protected: true,
          recurring: request.recurring
        };
        
        protectedBlocks.push(focusBlock);
        
        // Find conflicting events
        const conflictingEvents = this.context.existingEvents.filter(event => {
          const eventStart = event.startDate.getTime();
          const eventEnd = event.endDate.getTime();
          const slotStart = slot.start.getTime();
          const slotEnd = slot.end.getTime();
          
          return (eventStart < slotEnd && eventEnd > slotStart);
        });
        
        // Attempt to reschedule or decline conflicting events
        conflictingEvents.forEach(event => {
          if (request.flexibleScheduling) {
            rescheduled.push(event);
          } else {
            declined.push(event);
          }
        });
      });
      
      // Update context with new focus blocks
      this.context.focusBlocks.push(...protectedBlocks);
      
      // If flexible, attempt to reschedule conflicting events
      if (request.flexibleScheduling && rescheduled.length > 0) {
        const rescheduleResult = await this.reschedule(
          { type: 'priority-change', reason: 'Focus time protection' },
          rescheduled
        );
        
        if (!rescheduleResult.success) {
          conflicts.push({
            type: 'constraint',
            severity: 'medium',
            description: 'Some events could not be rescheduled'
          });
        }
      }
      
      return {
        protected: protectedBlocks,
        rescheduled,
        declined,
        conflicts
      };
    } catch (error) {
      return {
        protected: [],
        rescheduled: [],
        declined: [],
        conflicts: [{
          type: 'constraint',
          severity: 'high',
          description: `Focus time protection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
  
  /**
   * Find common availability for multiple attendees
   */
  public findGroupAvailability(
    attendeeSchedules: Event[][],
    duration: number,
    searchRange?: { start: Date; end: Date }
  ): TimeSlot[] {
    const start = searchRange?.start || new Date();
    const end = searchRange?.end || addDays(start, 14);
    
    return this.slotFinder.findCommonAvailability(
      attendeeSchedules,
      duration,
      { start, end },
      {
        preferredTimes: this.getWorkingHoursRanges(),
        minAttendees: Math.ceil(attendeeSchedules.length * 0.7) // 70% attendance required
      }
    );
  }
  
  /**
   * Update user preferences
   */
  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.context.preferences = this.preferences;
    this.slotFinder = new TimeSlotFinder(this.context.existingEvents, this.preferences);
  }
  
  /**
   * Update existing events
   */
  public updateEvents(events: Event[]): void {
    this.context.existingEvents = events;
    this.slotFinder = new TimeSlotFinder(events, this.preferences);
  }
  
  // Private helper methods
  
  private buildConstraints(request: SchedulingRequest): {
    hardConstraints: SchedulingConstraint[];
    softConstraints: SchedulingConstraint[];
  } {
    const hardConstraints = [...defaultHardConstraints];
    const softConstraints = [...defaultSoftConstraints];
    
    // Add request-specific hard constraints
    if (request.deadline) {
      hardConstraints.push(DeadlineConstraint(request.deadline));
    }
    
    if (request.attendees && request.attendees.length > 0) {
      // In a real implementation, fetch attendee calendars
      // For now, using empty array
      hardConstraints.push(AttendeesAvailabilityConstraint([]));
    }
    
    if (request.location) {
      // In a real implementation, fetch location availability
      hardConstraints.push(LocationAvailabilityConstraint([]));
    }
    
    // Add request-specific soft constraints
    if (request.preferredTimes && request.preferredTimes.length > 0) {
      softConstraints.push(PreferredTimeConstraint(request.preferredTimes));
    }
    
    if (request.priority) {
      softConstraints.push(PriorityAlignmentConstraint(request.priority));
    }
    
    // Add user-defined constraints
    if (request.constraints) {
      request.constraints.forEach(constraint => {
        if (constraint.type === 'hard') {
          hardConstraints.push(constraint);
        } else {
          softConstraints.push(constraint);
        }
      });
    }
    
    return { hardConstraints, softConstraints };
  }
  
  private createSuggestions(
    slots: ScoredSlot[],
    request: SchedulingRequest
  ): SchedulingSuggestion[] {
    return slots.map(slot => {
      const reasoning: string[] = [];
      
      // Add reasoning based on score breakdown
      if (slot.breakdown.energyScore > 80) {
        reasoning.push('Scheduled during peak energy time');
      }
      if (slot.breakdown.timingScore > 90) {
        reasoning.push('Optimal timing for priority level');
      }
      if (slot.breakdown.balanceScore > 85) {
        reasoning.push('Good workload balance');
      }
      if (slot.breakdown.constraintScore > 90) {
        reasoning.push('Meets all preferences');
      }
      
      // Note any adjustments
      const adjustments: string[] = [];
      if (slot.duration !== request.duration) {
        adjustments.push(`Duration adjusted to ${slot.duration} minutes`);
      }
      
      return {
        slot,
        score: slot.score,
        reasoningText,
        constraints: {
          satisfied: slot.violations.length === 0 
            ? ['All hard constraints satisfied'] 
            : [],
          violated: slot.violations
        },
        adjustments
      };
    });
  }
  
  private detectConflicts(
    slot: TimeSlot,
    request: SchedulingRequest
  ): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    
    // Check for overlapping events
    const overlapping = this.context.existingEvents.filter(event => {
      const eventStart = event.startDate.getTime();
      const eventEnd = event.endDate.getTime();
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();
      
      return (slotStart < eventEnd && slotEnd > eventStart);
    });
    
    if (overlapping.length > 0) {
      conflicts.push({
        type: 'overlap',
        severity: 'high',
        description: `Conflicts with ${overlapping.length} existing event(s)`,
        affectedEvents: overlapping,
        resolutionOptions: [
          {
            type: 'reschedule',
            description: 'Reschedule conflicting events',
            impact: [`${overlapping.length} events will be moved`],
            execute: async () => {
              await this.reschedule(
                { type: 'conflict', reason: 'New high-priority event' },
                overlapping
              );
            }
          },
          {
            type: 'decline',
            description: 'Decline new event',
            impact: ['New event will not be scheduled'],
            execute: async () => {
              // No-op - don't schedule the new event
            }
          }
        ]
      });
    }
    
    return conflicts;
  }
  
  private handleNoSlotsAvailable(request: SchedulingRequest): SchedulingResult {
    const conflicts: SchedulingConflict[] = [{
      type: 'constraint',
      severity: 'high',
      description: 'No available time slots found within constraints',
      resolutionOptions: [
        {
          type: 'override',
          description: 'Relax constraints (e.g., allow weekends)',
          impact: ['May schedule outside preferred times'],
          execute: async () => {
            // Re-run with relaxed constraints
          }
        }
      ]
    }];
    
    return {
      success: false,
      suggestions: [],
      conflicts
    };
  }
  
  private handleConstraintConflicts(
    request: SchedulingRequest,
    scoredSlots: ScoredSlot[]
  ): SchedulingResult {
    const violations = scoredSlots[0]?.violations || [];
    
    const conflicts: SchedulingConflict[] = [{
      type: 'constraint',
      severity: 'high',
      description: `Hard constraints violated: ${violations.join(', ')}`,
      resolutionOptions: [
        {
          type: 'override',
          description: 'Override constraints',
          impact: ['May violate scheduling rules'],
          execute: async () => {
            // Allow constraint violations
          }
        }
      ]
    }];
    
    return {
      success: false,
      suggestions: [],
      conflicts
    };
  }
  
  private getDefaultPreferences(): UserPreferences {
    return {
      workingHours: {
        start: 9,
        end: 17,
        days: [1, 2, 3, 4, 5] // Monday to Friday
      },
      bufferTime: 5,
      focusTimePreferences: {
        preferredDuration: 120,
        preferredTimes: [],
        protectionLevel: 'flexible'
      },
      meetingPreferences: {
        preferredDuration: 30,
        maxBackToBack: 3,
        breakAfterMeetings: 5
      }
    };
  }
  
  private getWorkingHoursRanges(): { start: Date; end: Date }[] {
    const ranges: { start: Date; end: Date }[] = [];
    const today = new Date();
    
    // Generate working hour ranges for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      
      if (this.preferences.workingHours.days.includes(dayOfWeek)) {
        const start = new Date(date);
        start.setHours(this.preferences.workingHours.start, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(this.preferences.workingHours.end, 0, 0, 0);
        
        ranges.push({ start, end });
      }
    }
    
    return ranges;
  }
}