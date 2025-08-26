import { tool } from 'ai'
import { z } from 'zod'
import { addDays, addMinutes, startOfDay, endOfDay, format, isAfter, isBefore } from 'date-fns'
import { SchedulingEngine } from '../SchedulingEngine'
import { TimeSlotFinder } from '../TimeSlotFinder'
import { IntervalTree } from '../../data-structures/IntervalTree'
import type { Event } from '@/types/calendar'
import type { SchedulingRequest, UserPreferences } from '../types'

/**
 * Calendar AI Tools for Vercel AI SDK v5
 * Provides intelligent calendar operations with natural language interface
 */

// Input schemas for calendar tools
export const getAvailabilitySchema = z.object({
  startDate: z.string().describe('Start date for availability search (YYYY-MM-DD)'),
  endDate: z.string().describe('End date for availability search (YYYY-MM-DD)'),
  duration: z.number().describe('Required duration in minutes'),
  preferences: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
    respectWorkingHours: z.boolean().default(true),
    includeWeekends: z.boolean().default(false),
    bufferTime: z.number().default(5).describe('Buffer time in minutes between events'),
  }).optional()
}).describe('Find available time slots in a calendar for scheduling events')

export const createEventSchema = z.object({
  title: z.string().describe('Event title'),
  startTime: z.string().describe('Start time (ISO string)'),
  endTime: z.string().describe('End time (ISO string)'),
  description: z.string().optional(),
  category: z.enum(['work', 'personal', 'meeting', 'deadline', 'travel']).default('meeting'),
  attendees: z.array(z.string()).optional().describe('List of attendee email addresses'),
  location: z.string().optional().describe('Event location'),
  priority: z.number().min(1).max(5).default(3).describe('Event priority (1=lowest, 5=highest)')
}).describe('Create a new calendar event with conflict checking and intelligent placement')

export const findConflictsSchema = z.object({
  eventId: z.string().optional().describe('Specific event ID to check conflicts for'),
  date: z.string().optional().describe('Date to check conflicts (YYYY-MM-DD)'),
  startTime: z.string().optional().describe('Start time to check (ISO string)'),
  endTime: z.string().optional().describe('End time to check (ISO string)'),
  includeBuffer: z.boolean().default(true).describe('Include buffer time in conflict detection')
}).describe('Detect and analyze scheduling conflicts for specific times or events')

export const suggestTimesSchema = z.object({
  title: z.string().describe('Event title for context'),
  duration: z.number().describe('Duration in minutes'),
  preferences: z.object({
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
    daysAhead: z.number().default(7).describe('How many days ahead to search'),
    avoidBackToBack: z.boolean().default(true),
    preferredDays: z.array(z.number()).optional().describe('Preferred days of week (0=Sunday, 6=Saturday)')
  }),
  attendees: z.array(z.string()).optional().describe('Attendee email addresses for availability check'),
  existingEvents: z.array(z.any()).optional().describe('Current calendar events for context')
}).describe('Use AI to suggest optimal scheduling times based on preferences and calendar analysis')

export const rescheduleEventSchema = z.object({
  eventId: z.string().describe('ID of event to reschedule'),
  newStartTime: z.string().optional().describe('New start time (ISO string)'),
  newEndTime: z.string().optional().describe('New end time (ISO string)'),
  reason: z.string().optional().describe('Reason for rescheduling'),
  findAlternatives: z.boolean().default(true).describe('Find alternative times if specified time conflicts'),
  notifyAttendees: z.boolean().default(true).describe('Whether to notify attendees of the change')
}).describe('Reschedule an existing event with intelligent conflict detection and alternative suggestions')

/**
 * Get availability slots for a given time period
 */
export const getAvailabilityTool = tool({
  description: 'Find available time slots in a calendar for scheduling events',
  inputSchema: getAvailabilitySchema,
  execute: async ({ startDate, endDate, duration, preferences = {} }) => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Initialize with empty events for now - in real implementation, fetch from Convex
      const events: Event[] = []
      const finder = new TimeSlotFinder(events)
      
      const availableSlots = finder.findAvailableSlots(
        start,
        end,
        duration,
        {
          respectWorkingHours: preferences.respectWorkingHours ?? true,
          includeWeekends: preferences.includeWeekends ?? false,
          bufferTime: preferences.bufferTime ?? 5
        }
      )
      
      // Filter by time of day preference
      const filteredSlots = availableSlots.filter(slot => {
        const hour = slot.start.getHours()
        switch (preferences.timeOfDay) {
          case 'morning': return hour >= 6 && hour < 12
          case 'afternoon': return hour >= 12 && hour < 17
          case 'evening': return hour >= 17 && hour < 22
          default: return true
        }
      })
      
      const formattedSlots = filteredSlots.slice(0, 10).map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        startFormatted: format(slot.start, 'PPpp'),
        endFormatted: format(slot.end, 'PPpp'),
        duration: Math.round((slot.end.getTime() - slot.start.getTime()) / 60000),
        dayOfWeek: format(slot.start, 'EEEE'),
        timeOfDay: slot.start.getHours() < 12 ? 'morning' : slot.start.getHours() < 17 ? 'afternoon' : 'evening'
      }))
      
      return {
        success: true,
        period: `${format(start, 'PP')} to ${format(end, 'PP')}`,
        totalSlotsFound: filteredSlots.length,
        availableSlots: formattedSlots,
        searchCriteria: {
          duration: `${duration} minutes`,
          timePreference: preferences.timeOfDay || 'any',
          workingHoursOnly: preferences.respectWorkingHours ?? true,
          includesWeekends: preferences.includeWeekends ?? false
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to find availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        availableSlots: []
      }
    }
  }
})

/**
 * Create a new calendar event with intelligent scheduling
 */
export const createEventTool = tool({
  description: 'Create a new calendar event with conflict checking and intelligent placement',
  inputSchema: createEventSchema,
  execute: async ({ title, startTime, endTime, description, category, attendees, location, priority }) => {
    try {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const duration = Math.round((end.getTime() - start.getTime()) / 60000)
      
      // Validate times
      if (isAfter(start, end)) {
        return {
          success: false,
          error: 'Start time must be before end time',
          event: null
        }
      }
      
      // Create event object
      const newEvent: Partial<Event> = {
        title,
        startDate: start,
        endDate: end,
        description,
        category,
        location,
        // In real implementation, these would be properly handled
        id: `event_${Date.now()}`,
        userId: 'temp_user',
        allDay: false,
        recurring: false,
        color: getCategoryColor(category)
      }
      
      // Check for conflicts (with empty events for now)
      const events: Event[] = []
      const intervalTree = new IntervalTree()
      events.forEach(event => intervalTree.insert(event))
      
      const conflicts = intervalTree.findOverlapping(start, end)
      
      // Create suggestions if there are conflicts
      let suggestions: any[] = []
      if (conflicts.length > 0) {
        const schedulingEngine = new SchedulingEngine(events)
        const scheduleResult = await schedulingEngine.schedule({
          title,
          duration,
          category,
          priority,
          flexible: true
        })
        
        suggestions = scheduleResult.suggestions.slice(0, 3).map(s => ({
          start: s.slot.start.toISOString(),
          end: s.slot.end.toISOString(),
          startFormatted: format(s.slot.start, 'PPpp'),
          endFormatted: format(s.slot.end, 'PPpp'),
          score: s.score,
          reasoning: s.reasoningText || ['Alternative time slot']
        }))
      }
      
      return {
        success: conflicts.length === 0,
        event: {
          ...newEvent,
          startFormatted: format(start, 'PPpp'),
          endFormatted: format(end, 'PPpp'),
          duration: `${duration} minutes`
        },
        conflicts: conflicts.map(c => ({
          title: c.title,
          time: `${format(new Date(c.startDate), 'PPpp')} - ${format(new Date(c.endDate), 'PPpp')}`,
          category: c.category
        })),
        suggestions: suggestions,
        message: conflicts.length > 0 
          ? `Event has ${conflicts.length} conflict(s). Consider the suggested alternative times.`
          : 'Event created successfully with no conflicts.'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        event: null
      }
    }
  }
})

/**
 * Find scheduling conflicts for a specific time or event
 */
export const findConflictsTool = tool({
  description: 'Detect and analyze scheduling conflicts for specific times or events',
  inputSchema: findConflictsSchema,
  execute: async ({ eventId, date, startTime, endTime, includeBuffer = true }) => {
    try {
      // For now, working with empty events - in real implementation, fetch from Convex
      const events: Event[] = []
      const intervalTree = new IntervalTree()
      events.forEach(event => intervalTree.insert(event))
      
      let conflictsFound: Event[] = []
      let searchPeriod = ''
      
      if (eventId) {
        // Find conflicts for a specific event
        const targetEvent = events.find(e => e.id === eventId)
        if (!targetEvent) {
          return {
            success: false,
            error: 'Event not found',
            conflicts: []
          }
        }
        
        conflictsFound = intervalTree.findOverlapping(targetEvent.startDate, targetEvent.endDate)
          .filter(e => e.id !== eventId) // Exclude the event itself
        searchPeriod = `Event: ${targetEvent.title}`
        
      } else if (startTime && endTime) {
        // Find conflicts for a specific time period
        const start = new Date(startTime)
        const end = new Date(endTime)
        
        // Add buffer time if requested
        const searchStart = includeBuffer ? addMinutes(start, -5) : start
        const searchEnd = includeBuffer ? addMinutes(end, 5) : end
        
        conflictsFound = intervalTree.findOverlapping(searchStart, searchEnd)
        searchPeriod = `${format(start, 'PPpp')} - ${format(end, 'PPpp')}`
        
      } else if (date) {
        // Find conflicts for an entire day
        const targetDate = new Date(date)
        const dayStart = startOfDay(targetDate)
        const dayEnd = endOfDay(targetDate)
        
        conflictsFound = intervalTree.findOverlapping(dayStart, dayEnd)
        searchPeriod = format(targetDate, 'PP')
      }
      
      // Analyze conflicts
      const conflictAnalysis = conflictsFound.map(conflict => {
        const overlappingEvents = intervalTree.findOverlapping(
          new Date(conflict.startDate), 
          new Date(conflict.endDate)
        ).filter(e => e.id !== conflict.id)
        
        return {
          id: conflict.id,
          title: conflict.title,
          startTime: format(new Date(conflict.startDate), 'PPpp'),
          endTime: format(new Date(conflict.endDate), 'PPpp'),
          category: conflict.category,
          duration: Math.round((new Date(conflict.endDate).getTime() - new Date(conflict.startDate).getTime()) / 60000),
          overlappingCount: overlappingEvents.length,
          severity: overlappingEvents.length > 2 ? 'high' : overlappingEvents.length > 0 ? 'medium' : 'low'
        }
      })
      
      return {
        success: true,
        searchPeriod,
        totalConflicts: conflictsFound.length,
        conflicts: conflictAnalysis,
        summary: {
          hasConflicts: conflictsFound.length > 0,
          severity: conflictsFound.length > 3 ? 'high' : conflictsFound.length > 1 ? 'medium' : 'low',
          recommendation: conflictsFound.length > 0 
            ? 'Consider rescheduling some events to resolve conflicts'
            : 'No conflicts detected'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to find conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        conflicts: []
      }
    }
  }
})

/**
 * Suggest optimal times for scheduling based on AI analysis
 */
export const suggestTimesTool = tool({
  description: 'Use AI to suggest optimal scheduling times based on preferences and calendar analysis',
  inputSchema: suggestTimesSchema,
  execute: async ({ title, duration, preferences, attendees, existingEvents = [] }) => {
    try {
      const schedulingEngine = new SchedulingEngine(existingEvents as Event[])
      
      // Build scheduling request
      const request: SchedulingRequest = {
        title,
        duration,
        category: 'meeting', // Default category
        priority: preferences.urgency === 'urgent' ? 5 : 
                 preferences.urgency === 'high' ? 4 :
                 preferences.urgency === 'medium' ? 3 : 2,
        flexible: true,
        attendees: attendees,
        deadline: addDays(new Date(), preferences.daysAhead)
      }
      
      // Add preferred times based on time of day preference
      if (preferences.timeOfDay !== 'any') {
        const today = new Date()
        const ranges: { start: Date; end: Date }[] = []
        
        for (let i = 0; i < preferences.daysAhead; i++) {
          const date = addDays(today, i)
          let start: Date, end: Date
          
          switch (preferences.timeOfDay) {
            case 'morning':
              start = new Date(date.setHours(9, 0, 0, 0))
              end = new Date(date.setHours(12, 0, 0, 0))
              break
            case 'afternoon':
              start = new Date(date.setHours(13, 0, 0, 0))
              end = new Date(date.setHours(17, 0, 0, 0))
              break
            case 'evening':
              start = new Date(date.setHours(17, 0, 0, 0))
              end = new Date(date.setHours(20, 0, 0, 0))
              break
            default:
              continue
          }
          
          ranges.push({ start, end })
        }
        
        request.preferredTimes = ranges
      }
      
      const result = await schedulingEngine.schedule(request)
      
      if (!result.success) {
        return {
          success: false,
          error: 'No suitable time slots found',
          suggestions: [],
          analysis: {
            reason: result.conflicts?.[0]?.description || 'Unknown scheduling issue',
            recommendation: 'Try extending the search period or relaxing constraints'
          }
        }
      }
      
      const suggestions = result.suggestions.map(suggestion => ({
        start: suggestion.slot.start.toISOString(),
        end: suggestion.slot.end.toISOString(),
        startFormatted: format(suggestion.slot.start, 'PPpp'),
        endFormatted: format(suggestion.slot.end, 'PPpp'),
        dayOfWeek: format(suggestion.slot.start, 'EEEE'),
        score: suggestion.score,
        reasoning: suggestion.reasoningText || [],
        aiInsights: {
          energyLevel: suggestion.score > 80 ? 'high' : suggestion.score > 60 ? 'medium' : 'low',
          workloadBalance: suggestion.score > 85 ? 'optimal' : suggestion.score > 70 ? 'good' : 'busy',
          recommendationLevel: suggestion.score > 90 ? 'highly recommended' : 
                              suggestion.score > 75 ? 'recommended' : 'acceptable'
        }
      }))
      
      return {
        success: true,
        query: {
          title,
          duration: `${duration} minutes`,
          urgency: preferences.urgency,
          timePreference: preferences.timeOfDay,
          searchPeriod: `${preferences.daysAhead} days ahead`
        },
        suggestions,
        analysis: {
          totalOptionsFound: result.suggestions.length,
          bestScore: Math.max(...result.suggestions.map(s => s.score)),
          averageScore: Math.round(result.suggestions.reduce((acc, s) => acc + s.score, 0) / result.suggestions.length),
          recommendation: suggestions.length > 0 ? 'Multiple good options available' : 'Limited availability'
        },
        alternativeOptions: result.alternativeOptions?.slice(0, 5).map(alt => ({
          start: format(alt.start, 'PPpp'),
          end: format(alt.end, 'PPpp'),
          score: alt.score
        })) || []
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest times: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: []
      }
    }
  }
})

/**
 * Reschedule an existing event with intelligent conflict avoidance
 */
export const rescheduleEventTool = tool({
  description: 'Reschedule an existing event with intelligent conflict detection and alternative suggestions',
  inputSchema: rescheduleEventSchema,
  execute: async ({ eventId, newStartTime, newEndTime, reason, findAlternatives = true, notifyAttendees = true }) => {
    try {
      // For now, working with empty events - in real implementation, fetch from Convex
      const events: Event[] = []
      
      // Find the event to reschedule
      const targetEvent = events.find(e => e.id === eventId)
      if (!targetEvent) {
        return {
          success: false,
          error: 'Event not found',
          rescheduled: null
        }
      }
      
      let newStart: Date, newEnd: Date
      
      if (newStartTime && newEndTime) {
        newStart = new Date(newStartTime)
        newEnd = new Date(newEndTime)
      } else if (newStartTime) {
        newStart = new Date(newStartTime)
        const originalDuration = targetEvent.endDate.getTime() - targetEvent.startDate.getTime()
        newEnd = new Date(newStart.getTime() + originalDuration)
      } else {
        return {
          success: false,
          error: 'Must provide at least a new start time',
          rescheduled: null
        }
      }
      
      // Check for conflicts at new time
      const intervalTree = new IntervalTree()
      events.filter(e => e.id !== eventId).forEach(event => intervalTree.insert(event))
      
      const conflicts = intervalTree.findOverlapping(newStart, newEnd)
      
      // If no conflicts, proceed with reschedule
      if (conflicts.length === 0) {
        const rescheduledEvent = {
          ...targetEvent,
          startDate: newStart,
          endDate: newEnd,
          startFormatted: format(newStart, 'PPpp'),
          endFormatted: format(newEnd, 'PPpp'),
          rescheduledReason: reason
        }
        
        return {
          success: true,
          rescheduled: rescheduledEvent,
          originalTime: {
            start: format(targetEvent.startDate, 'PPpp'),
            end: format(targetEvent.endDate, 'PPpp')
          },
          newTime: {
            start: format(newStart, 'PPpp'),
            end: format(newEnd, 'PPpp')
          },
          conflicts: [],
          message: `Event successfully rescheduled${reason ? ` (${reason})` : ''}`,
          notificationsSent: notifyAttendees
        }
      }
      
      // If there are conflicts and alternatives are requested
      if (findAlternatives) {
        const schedulingEngine = new SchedulingEngine(events)
        const duration = Math.round((targetEvent.endDate.getTime() - targetEvent.startDate.getTime()) / 60000)
        
        const result = await schedulingEngine.schedule({
          title: targetEvent.title,
          duration,
          category: targetEvent.category,
          priority: 3,
          flexible: true
        })
        
        const alternatives = result.suggestions.slice(0, 3).map(s => ({
          start: s.slot.start.toISOString(),
          end: s.slot.end.toISOString(),
          startFormatted: format(s.slot.start, 'PPpp'),
          endFormatted: format(s.slot.end, 'PPpp'),
          score: s.score,
          reasoning: s.reasoningText || []
        }))
        
        return {
          success: false,
          rescheduled: null,
          requestedTime: {
            start: format(newStart, 'PPpp'),
            end: format(newEnd, 'PPpp')
          },
          conflicts: conflicts.map(c => ({
            title: c.title,
            time: `${format(new Date(c.startDate), 'PPpp')} - ${format(new Date(c.endDate), 'PPpp')}`,
            category: c.category
          })),
          alternatives,
          message: `Requested time conflicts with ${conflicts.length} event(s). Consider the alternative times provided.`,
          recommendation: alternatives.length > 0 ? 'Use one of the suggested alternative times' : 'Try a different time period'
        }
      }
      
      return {
        success: false,
        rescheduled: null,
        conflicts: conflicts.map(c => ({
          title: c.title,
          time: `${format(new Date(c.startDate), 'PPpp')} - ${format(new Date(c.endDate), 'PPpp')}`
        })),
        message: `Cannot reschedule: conflicts with ${conflicts.length} event(s)`,
        recommendation: 'Choose a different time or enable alternative suggestions'
      }
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to reschedule event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rescheduled: null
      }
    }
  }
})

// Helper function to get category colors
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    work: '#3b82f6',      // blue
    personal: '#10b981',   // emerald
    meeting: '#8b5cf6',    // violet
    deadline: '#ef4444',   // red
    travel: '#f59e0b'      // amber
  }
  return colors[category] || '#6b7280' // gray default
}

// Export all tools as a collection
export const calendarTools = {
  getAvailability: getAvailabilityTool,
  createEvent: createEventTool,
  findConflicts: findConflictsTool,
  suggestTimes: suggestTimesTool,
  rescheduleEvent: rescheduleEventTool
} as const

// Export tool schemas for validation
export const calendarToolSchemas = {
  getAvailability: getAvailabilitySchema,
  createEvent: createEventSchema,
  findConflicts: findConflictsSchema,
  suggestTimes: suggestTimesSchema,
  rescheduleEvent: rescheduleEventSchema
} as const