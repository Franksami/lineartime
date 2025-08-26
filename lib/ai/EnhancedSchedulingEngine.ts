import { generateObject, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { SchedulingEngine } from './SchedulingEngine'
import { Event } from '@/types/calendar'
import {
  SchedulingRequest,
  SchedulingResult,
  SchedulingSuggestion,
  SchedulingContext,
  TimeSlot,
  UserPreferences,
  SchedulingConflict,
  UserProductivityProfile,
  ProductivityMetrics
} from './types'
import { addDays, addMinutes, startOfDay, endOfDay, format, isWithinInterval } from 'date-fns'

/**
 * Enhanced Scheduling Engine with AI-powered decision making
 * Uses Vercel AI SDK v5 for intelligent scheduling optimization
 */
export class EnhancedSchedulingEngine extends SchedulingEngine {
  private aiModel = anthropic('claude-3-5-sonnet-20241022')
  private userProfile?: UserProductivityProfile

  constructor(
    events: Event[] = [],
    preferences?: UserPreferences,
    userProfile?: UserProductivityProfile
  ) {
    super(events, preferences)
    this.userProfile = userProfile
  }

  /**
   * AI-powered scheduling with natural language understanding
   */
  async scheduleWithAI(request: SchedulingRequest & { naturalLanguageInput?: string }): Promise<SchedulingResult> {
    try {
      // First, get base scheduling results
      const baseResult = await super.schedule(request)
      
      if (!request.naturalLanguageInput) {
        return baseResult
      }

      // Enhance with AI analysis
      const aiEnhancedResult = await this.enhanceSchedulingWithAI(request, baseResult)
      return aiEnhancedResult

    } catch (error) {
      console.error('AI-powered scheduling failed:', error)
      // Fallback to base scheduling
      return super.schedule(request)
    }
  }

  /**
   * AI-powered conflict resolution with natural language explanations
   */
  async resolveConflictsWithAI(
    conflicts: SchedulingConflict[],
    context: SchedulingContext
  ): Promise<{
    resolutions: Array<{
      conflict: SchedulingConflict
      resolution: string
      action: 'reschedule' | 'decline' | 'split' | 'adjust'
      reasoning: string[]
      confidence: number
    }>
    summary: string
  }> {
    const resolutionSchema = z.object({
      resolutions: z.array(z.object({
        conflictIndex: z.number(),
        action: z.enum(['reschedule', 'decline', 'split', 'adjust']),
        reasoning: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        explanation: z.string()
      })),
      overallStrategy: z.string(),
      priorityRecommendation: z.string()
    })

    const conflictDescriptions = conflicts.map((c, i) => 
      `${i}: ${c.description} (${c.severity} severity)`
    ).join('\n')

    const userContext = this.buildUserContext()

    try {
      const result = await generateObject({
        model: this.aiModel,
        schema: resolutionSchema,
        prompt: `As an AI scheduling assistant, analyze these calendar conflicts and provide intelligent resolution strategies.

Conflicts:
${conflictDescriptions}

User Context:
${userContext}

Consider:
1. User's productivity patterns and preferences
2. Event priorities and attendee importance
3. Impact on work-life balance
4. Long-term scheduling optimization

For each conflict, recommend the best action and explain your reasoning. Provide confidence scores (0-1) for your recommendations.`
      })

      const resolutions = result.object.resolutions.map((res, index) => ({
        conflict: conflicts[res.conflictIndex] || conflicts[index],
        resolution: res.explanation,
        action: res.action,
        reasoning: res.reasoning,
        confidence: res.confidence
      }))

      return {
        resolutions,
        summary: `${result.object.overallStrategy}\n\nPriority: ${result.object.priorityRecommendation}`
      }

    } catch (error) {
      console.error('AI conflict resolution failed:', error)
      // Fallback to simple resolution
      return {
        resolutions: conflicts.map(conflict => ({
          conflict,
          resolution: 'Consider rescheduling or declining based on priority',
          action: 'reschedule' as const,
          reasoning: ['Automatic fallback recommendation'],
          confidence: 0.5
        })),
        summary: 'Unable to perform AI analysis. Basic conflict detection completed.'
      }
    }
  }

  /**
   * Generate AI insights about user's scheduling patterns
   */
  async generateProductivityInsights(): Promise<{
    insights: string[]
    recommendations: string[]
    patterns: Array<{
      pattern: string
      description: string
      impact: 'positive' | 'negative' | 'neutral'
      actionable: string
    }>
    summary: string
  }> {
    if (!this.userProfile) {
      return {
        insights: ['No user profile available for analysis'],
        recommendations: ['Set up productivity tracking to get personalized insights'],
        patterns: [],
        summary: 'Productivity analysis requires user profile data'
      }
    }

    const insightsSchema = z.object({
      keyInsights: z.array(z.string()),
      recommendations: z.array(z.string()),
      patterns: z.array(z.object({
        pattern: z.string(),
        description: z.string(),
        impact: z.enum(['positive', 'negative', 'neutral']),
        actionable: z.string()
      })),
      overallAssessment: z.string()
    })

    const metricsData = this.userProfile.historicalMetrics.slice(-30) // Last 30 entries
    const avgProductivity = metricsData.reduce((acc, m) => acc + m.productivityScore, 0) / metricsData.length
    const totalFocusTime = metricsData.reduce((acc, m) => acc + m.focusTime, 0)
    const totalMeetingTime = metricsData.reduce((acc, m) => acc + m.meetingTime, 0)

    try {
      const result = await generateObject({
        model: this.aiModel,
        schema: insightsSchema,
        prompt: `Analyze this user's productivity and scheduling patterns to provide actionable insights.

User Productivity Data:
- Average productivity score: ${avgProductivity.toFixed(1)}/100
- Total focus time (30 days): ${Math.round(totalFocusTime / 60)} hours
- Total meeting time (30 days): ${Math.round(totalMeetingTime / 60)} hours
- Meeting to focus ratio: ${(totalMeetingTime / totalFocusTime).toFixed(2)}
- Recent reschedules: ${metricsData.reduce((acc, m) => acc + m.reschedules, 0)}

Working Hours: ${this.userProfile.preferences.workingHours.start}:00 - ${this.userProfile.preferences.workingHours.end}:00
Energy Profile: ${this.userProfile.energyProfile.type}

Provide insights about:
1. Productivity patterns and trends
2. Optimal scheduling strategies
3. Work-life balance improvements
4. Focus time optimization
5. Meeting efficiency

Make recommendations specific and actionable.`
      })

      return {
        insights: result.object.keyInsights,
        recommendations: result.object.recommendations,
        patterns: result.object.patterns,
        summary: result.object.overallAssessment
      }

    } catch (error) {
      console.error('AI insights generation failed:', error)
      return {
        insights: ['Analysis temporarily unavailable'],
        recommendations: ['Continue tracking productivity metrics for future insights'],
        patterns: [],
        summary: 'Unable to generate AI insights at this time'
      }
    }
  }

  /**
   * AI-powered time slot optimization with contextual reasoning
   */
  async optimizeTimeSlots(
    slots: TimeSlot[],
    request: SchedulingRequest,
    userContext?: string
  ): Promise<{
    optimized: TimeSlot[]
    reasoning: Record<string, string[]>
    confidence: Record<string, number>
  }> {
    const optimizationSchema = z.object({
      rankedSlots: z.array(z.object({
        slotIndex: z.number(),
        score: z.number().min(0).max(100),
        reasoning: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        pros: z.array(z.string()),
        cons: z.array(z.string())
      })),
      overallRecommendation: z.string()
    })

    const slotDescriptions = slots.map((slot, i) => 
      `${i}: ${format(slot.start, 'PPpp')} - ${format(slot.end, 'PPpp')} (${slot.duration}min)`
    ).join('\n')

    const contextInfo = userContext || this.buildUserContext()

    try {
      const result = await generateObject({
        model: this.aiModel,
        schema: optimizationSchema,
        prompt: `Optimize these time slots for "${request.title}" considering user context and productivity patterns.

Available Slots:
${slotDescriptions}

Event Details:
- Title: ${request.title}
- Duration: ${request.duration} minutes
- Category: ${request.category || 'unspecified'}
- Priority: ${request.priority || 3}/5
- Attendees: ${request.attendees?.length || 0}

User Context:
${contextInfo}

Rank the slots from best to worst, considering:
1. Alignment with energy levels and productive hours
2. Buffer time and scheduling flow
3. Work-life balance impact
4. Meeting effectiveness factors
5. Long-term productivity optimization

Provide detailed reasoning for each ranking.`
      })

      const optimized: TimeSlot[] = []
      const reasoning: Record<string, string[]> = {}
      const confidence: Record<string, number> = {}

      // Sort by AI-determined score
      const sortedResults = result.object.rankedSlots.sort((a, b) => b.score - a.score)
      
      sortedResults.forEach((aiSlot, index) => {
        const originalSlot = slots[aiSlot.slotIndex]
        if (originalSlot) {
          const enhancedSlot = {
            ...originalSlot,
            score: aiSlot.score
          }
          optimized.push(enhancedSlot)
          
          const slotKey = `${format(originalSlot.start, 'PPpp')}`
          reasoning[slotKey] = [...aiSlot.reasoning, `Pros: ${aiSlot.pros.join(', ')}`, `Cons: ${aiSlot.cons.join(', ')}`]
          confidence[slotKey] = aiSlot.confidence
        }
      })

      return { optimized, reasoning, confidence }

    } catch (error) {
      console.error('AI slot optimization failed:', error)
      // Fallback to original ordering with default reasoning
      return {
        optimized: slots,
        reasoning: Object.fromEntries(
          slots.map(slot => [format(slot.start, 'PPpp'), ['Standard scheduling algorithm applied']])
        ),
        confidence: Object.fromEntries(
          slots.map(slot => [format(slot.start, 'PPpp'), 0.7])
        )
      }
    }
  }

  /**
   * Natural language event creation with AI parsing and optimization
   */
  async createEventFromNaturalLanguage(input: string): Promise<{
    event: Partial<Event>
    confidence: number
    suggestions: SchedulingSuggestion[]
    reasoning: string[]
    warnings: string[]
  }> {
    const eventParsingSchema = z.object({
      event: z.object({
        title: z.string(),
        duration: z.number().min(15).max(480), // 15 minutes to 8 hours
        category: z.enum(['work', 'personal', 'meeting', 'deadline', 'travel']),
        priority: z.number().min(1).max(5),
        description: z.string().optional(),
        attendees: z.array(z.string()).optional(),
        location: z.string().optional(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        flexible: z.boolean().default(true)
      }),
      confidence: z.number().min(0).max(1),
      reasoning: z.array(z.string()),
      warnings: z.array(z.string()).optional(),
      schedulingHints: z.object({
        urgency: z.enum(['low', 'medium', 'high', 'urgent']),
        timePreference: z.enum(['morning', 'afternoon', 'evening', 'any']),
        durationFlexibility: z.enum(['fixed', 'flexible', 'negotiable'])
      })
    })

    try {
      const result = await generateObject({
        model: this.aiModel,
        schema: eventParsingSchema,
        prompt: `Parse this natural language input into a structured calendar event. Extract all relevant information and provide scheduling optimization hints.

Input: "${input}"

Current date/time: ${format(new Date(), 'PPpp')}

Extract:
1. Event title (clear and descriptive)
2. Duration (estimate based on event type and context)
3. Category (work, personal, meeting, deadline, travel)
4. Priority level (1-5, considering urgency indicators)
5. Any attendees, location, or specific timing requests
6. Description with additional context

Provide scheduling hints about urgency, time preferences, and flexibility.
Flag any warnings or ambiguities that need clarification.`
      })

      const parsedEvent = result.object.event
      
      // Create scheduling request for AI optimization
      const schedulingRequest: SchedulingRequest = {
        title: parsedEvent.title,
        duration: parsedEvent.duration,
        category: parsedEvent.category,
        priority: parsedEvent.priority,
        attendees: parsedEvent.attendees,
        location: parsedEvent.location,
        flexible: parsedEvent.flexible
      }

      // Add preferred time if specified
      if (parsedEvent.preferredDate && parsedEvent.preferredTime) {
        try {
          const preferredDateTime = new Date(`${parsedEvent.preferredDate} ${parsedEvent.preferredTime}`)
          if (!isNaN(preferredDateTime.getTime())) {
            schedulingRequest.preferredTimes = [{
              start: preferredDateTime,
              end: addMinutes(preferredDateTime, parsedEvent.duration)
            }]
          }
        } catch (error) {
          console.warn('Could not parse preferred date/time:', error)
        }
      }

      // Get AI-optimized scheduling suggestions
      const schedulingResult = await this.scheduleWithAI({
        ...schedulingRequest,
        naturalLanguageInput: input
      })

      const event: Partial<Event> = {
        title: parsedEvent.title,
        description: parsedEvent.description,
        category: parsedEvent.category,
        location: parsedEvent.location,
        allDay: parsedEvent.duration >= 480, // 8+ hours = all day
        // Start/end dates will be set based on selected suggestion
      }

      return {
        event,
        confidence: result.object.confidence,
        suggestions: schedulingResult.suggestions,
        reasoning: result.object.reasoning,
        warnings: result.object.warnings || []
      }

    } catch (error) {
      console.error('Natural language parsing failed:', error)
      return {
        event: { title: input.slice(0, 50) + '...' },
        confidence: 0.3,
        suggestions: [],
        reasoning: ['Failed to parse natural language input'],
        warnings: ['Please provide event details manually']
      }
    }
  }

  // Private helper methods

  private async enhanceSchedulingWithAI(
    request: SchedulingRequest,
    baseResult: SchedulingResult
  ): Promise<SchedulingResult> {
    if (!baseResult.success || !baseResult.suggestions.length) {
      return baseResult
    }

    try {
      // Use AI to optimize and re-rank the suggestions
      const slots = baseResult.suggestions.map(s => s.slot)
      const { optimized, reasoning, confidence } = await this.optimizeTimeSlots(
        slots,
        request,
        request.naturalLanguageInput
      )

      // Enhance suggestions with AI reasoning
      const enhancedSuggestions: SchedulingSuggestion[] = optimized.map((slot, index) => {
        const original = baseResult.suggestions.find(s => 
          s.slot.start.getTime() === slot.start.getTime()
        ) || baseResult.suggestions[index]

        const slotKey = format(slot.start, 'PPpp')
        
        return {
          slot,
          score: slot.score || original.score,
          reasoningText: reasoning[slotKey] || original.reasoningText || [],
          constraints: original.constraints,
          adjustments: original.adjustments
        }
      })

      return {
        ...baseResult,
        suggestions: enhancedSuggestions
      }

    } catch (error) {
      console.error('AI enhancement failed:', error)
      return baseResult
    }
  }

  private buildUserContext(): string {
    const context: string[] = []
    
    if (this.userProfile) {
      context.push(`Working hours: ${this.userProfile.preferences.workingHours.start}:00-${this.userProfile.preferences.workingHours.end}:00`)
      context.push(`Energy profile: ${this.userProfile.energyProfile.type}`)
      
      const recentMetrics = this.userProfile.historicalMetrics.slice(-7) // Last 7 days
      if (recentMetrics.length > 0) {
        const avgProductivity = recentMetrics.reduce((acc, m) => acc + m.productivityScore, 0) / recentMetrics.length
        context.push(`Recent productivity: ${avgProductivity.toFixed(1)}/100`)
        
        const totalFocus = recentMetrics.reduce((acc, m) => acc + m.focusTime, 0)
        const totalMeetings = recentMetrics.reduce((acc, m) => acc + m.meetingTime, 0)
        context.push(`Focus/meeting ratio: ${(totalFocus / Math.max(totalMeetings, 1)).toFixed(2)}`)
      }
    }
    
    // Add current calendar context
    const upcomingEvents = this.context.existingEvents.filter(event => 
      event.startDate > new Date() && event.startDate < addDays(new Date(), 7)
    )
    context.push(`Upcoming events (7 days): ${upcomingEvents.length}`)
    
    if (upcomingEvents.length > 0) {
      const categories = upcomingEvents.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const categoryBreakdown = Object.entries(categories)
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(', ')
      context.push(`Event breakdown: ${categoryBreakdown}`)
    }
    
    return context.join('\n')
  }

  /**
   * Update user profile with new productivity metrics
   */
  updateUserProfile(profile: UserProductivityProfile): void {
    this.userProfile = profile
    this.updatePreferences(profile.preferences)
  }

  /**
   * Get current user profile
   */
  getUserProfile(): UserProductivityProfile | undefined {
    return this.userProfile
  }
}