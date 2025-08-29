import type { Event } from '@/types/calendar';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText, tool } from 'ai';
import { addDays, endOfWeek, format, isFuture, isToday, startOfWeek } from 'date-fns';
import { z } from 'zod';
import { EnhancedSchedulingEngine } from './EnhancedSchedulingEngine';
import {
  ProductivityMetrics,
  type SchedulingConflict,
  SchedulingRequest,
  type UserPreferences,
  type UserProductivityProfile,
} from './types';

/**
 * CalendarAI - Intelligent calendar assistant with natural language processing
 * Provides conversational interface for calendar management
 */
export class CalendarAI {
  private schedulingEngine: EnhancedSchedulingEngine;
  private aiModel = anthropic('claude-3-5-sonnet-20241022');
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(
    events: Event[] = [],
    preferences?: UserPreferences,
    userProfile?: UserProductivityProfile
  ) {
    this.schedulingEngine = new EnhancedSchedulingEngine(events, preferences, userProfile);
  }

  /**
   * Process natural language calendar requests
   */
  async processRequest(
    userInput: string,
    context?: {
      currentDate?: Date;
      userPreferences?: Partial<UserPreferences>;
      recentEvents?: Event[];
    }
  ): Promise<{
    response: string;
    actions: Array<{
      type:
        | 'create_event'
        | 'suggest_times'
        | 'find_conflicts'
        | 'reschedule'
        | 'analyze_productivity';
      data: any;
      confidence: number;
    }>;
    suggestions: string[];
    followUp: string[];
  }> {
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: userInput });

    const _responseSchema = z.object({
      intent: z.enum([
        'create_event',
        'schedule_meeting',
        'find_availability',
        'check_conflicts',
        'reschedule_event',
        'analyze_calendar',
        'get_productivity_insights',
        'general_question',
        'modify_preferences',
      ]),
      confidence: z.number().min(0).max(1),
      response: z.string(),
      actions: z.array(
        z.object({
          type: z.string(),
          parameters: z.record(z.any()),
          confidence: z.number(),
        })
      ),
      suggestions: z.array(z.string()),
      followUpQuestions: z.array(z.string()),
    });

    try {
      const calendarContext = await this.buildCalendarContext(context?.currentDate);
      const conversationContext = this.conversationHistory
        .slice(-6) // Last 3 exchanges
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const result = await generateText({
        model: this.aiModel,
        prompt: `You are an AI calendar assistant for Command Center Calendar, a revolutionary year-at-a-glance calendar application.

Philosophy: "Life is bigger than a week" - Help users optimize their time across months and years.

User Input: "${userInput}"

Calendar Context:
${calendarContext}

Recent Conversation:
${conversationContext}

Analyze the user's request and provide:
1. Intent classification and confidence
2. Natural, helpful response
3. Specific actions to take
4. Relevant suggestions
5. Follow-up questions

Be proactive about long-term planning and productivity optimization. Consider work-life balance and suggest improvements beyond just scheduling.`,
      });

      // Parse the response for structured data
      const intentAnalysis = await this.analyzeIntent(userInput, calendarContext);

      // Execute actions based on intent
      const actions = await this.executeActions(intentAnalysis.actions, userInput);

      const response = result.text;

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: response });

      return {
        response,
        actions,
        suggestions: intentAnalysis.suggestions,
        followUp: intentAnalysis.followUp,
      };
    } catch (error) {
      console.error('CalendarAI request processing failed:', error);

      return {
        response:
          "I apologize, but I'm having trouble processing your request right now. Could you try rephrasing it or ask me something specific about your calendar?",
        actions: [],
        suggestions: [
          "Try: 'Schedule a meeting for next Tuesday'",
          "Ask: 'What's my availability this week?'",
          "Request: 'Show me my productivity insights'",
        ],
        followUp: ['What specific calendar task can I help you with?'],
      };
    }
  }

  /**
   * Get AI-powered calendar insights and recommendations
   */
  async getCalendarInsights(timeframe: 'week' | 'month' | 'quarter' = 'week'): Promise<{
    summary: string;
    insights: Array<{
      type: 'productivity' | 'scheduling' | 'balance' | 'optimization';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      actionable: string;
    }>;
    recommendations: string[];
    metrics: {
      focusTime: number;
      meetingTime: number;
      productivityScore: number;
      workLifeBalance: number;
    };
  }> {
    const insights = await this.schedulingEngine.generateProductivityInsights();
    const calendarContext = await this.buildCalendarContext();

    const _insightsSchema = z.object({
      overallSummary: z.string(),
      keyInsights: z.array(
        z.object({
          type: z.enum(['productivity', 'scheduling', 'balance', 'optimization']),
          title: z.string(),
          description: z.string(),
          impact: z.enum(['high', 'medium', 'low']),
          actionable: z.string(),
        })
      ),
      strategicRecommendations: z.array(z.string()),
      metrics: z.object({
        focusTimeHours: z.number(),
        meetingTimeHours: z.number(),
        productivityScore: z.number().min(0).max(100),
        workLifeBalanceScore: z.number().min(0).max(100),
      }),
    });

    try {
      const result = await generateText({
        model: this.aiModel,
        prompt: `Provide comprehensive calendar insights for ${timeframe} timeframe.

Calendar Context:
${calendarContext}

AI Analysis Results:
Summary: ${insights.summary}
Key Insights: ${insights.insights.join(', ')}
Recommendations: ${insights.recommendations.join(', ')}

Generate:
1. Overall calendar health summary
2. Actionable insights categorized by type
3. Strategic recommendations for optimization
4. Key productivity metrics

Focus on long-term productivity and "life is bigger than a week" philosophy.`,
      });

      // For demo purposes, create sample metrics
      // In real implementation, calculate from actual data
      const sampleMetrics = {
        focusTime: 25, // hours
        meetingTime: 15, // hours
        productivityScore: 78,
        workLifeBalance: 72,
      };

      const processedInsights = insights.patterns.map((pattern) => ({
        type:
          pattern.impact === 'positive'
            ? ('productivity' as const)
            : pattern.impact === 'negative'
              ? ('optimization' as const)
              : ('scheduling' as const),
        title: pattern.pattern,
        description: pattern.description,
        impact: 'medium' as const, // In real implementation, determine from pattern analysis
        actionable: pattern.actionable,
      }));

      return {
        summary: result.text,
        insights: processedInsights,
        recommendations: insights.recommendations,
        metrics: sampleMetrics,
      };
    } catch (error) {
      console.error('Calendar insights generation failed:', error);
      return {
        summary: 'Unable to generate insights at this time.',
        insights: [],
        recommendations: ['Continue using the calendar to build more data for insights'],
        metrics: { focusTime: 0, meetingTime: 0, productivityScore: 50, workLifeBalance: 50 },
      };
    }
  }

  /**
   * Smart conflict resolution with AI recommendations
   */
  async resolveConflicts(conflicts: SchedulingConflict[]): Promise<{
    resolutions: Array<{
      conflict: SchedulingConflict;
      recommendation: string;
      alternatives: Array<{
        action: string;
        description: string;
        impact: string;
        confidence: number;
      }>;
    }>;
    summary: string;
  }> {
    const resolutionResult = await this.schedulingEngine.resolveConflictsWithAI(
      conflicts,
      this.schedulingEngine.context // Access protected context
    );

    return {
      resolutions: resolutionResult.resolutions.map((res) => ({
        conflict: res.conflict,
        recommendation: res.resolution,
        alternatives: [
          {
            action: res.action,
            description: res.resolution,
            impact: res.reasoning.join('; '),
            confidence: res.confidence,
          },
        ],
      })),
      summary: resolutionResult.summary,
    };
  }

  /**
   * Natural language event creation
   */
  async createEventFromText(input: string): Promise<{
    event: Partial<Event>;
    suggestions: Array<{
      startTime: string;
      endTime: string;
      reasoning: string[];
      confidence: number;
    }>;
    needsConfirmation: boolean;
    questions: string[];
  }> {
    const result = await this.schedulingEngine.createEventFromNaturalLanguage(input);

    const suggestions = result.suggestions.map((suggestion) => ({
      startTime: suggestion.slot.start.toISOString(),
      endTime: suggestion.slot.end.toISOString(),
      reasoning: suggestion.reasoningText || [],
      confidence: suggestion.score / 100,
    }));

    return {
      event: result.event,
      suggestions: suggestions.slice(0, 3), // Top 3 suggestions
      needsConfirmation: result.confidence < 0.8,
      questions: result.warnings,
    };
  }

  // Private helper methods

  private async analyzeIntent(
    userInput: string,
    _context: string
  ): Promise<{
    intent: string;
    confidence: number;
    actions: Array<{ type: string; parameters: any }>;
    suggestions: string[];
    followUp: string[];
  }> {
    // Simple intent classification for now
    // In real implementation, use more sophisticated NLP

    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.includes('schedule') ||
      lowerInput.includes('meeting') ||
      lowerInput.includes('appointment')
    ) {
      return {
        intent: 'create_event',
        confidence: 0.8,
        actions: [{ type: 'create_event', parameters: { input: userInput } }],
        suggestions: ['I can help you find the best time for this event'],
        followUp: [
          'Would you like me to check for conflicts?',
          'Should I invite anyone to this meeting?',
        ],
      };
    }

    if (
      lowerInput.includes('available') ||
      lowerInput.includes('free time') ||
      lowerInput.includes('open')
    ) {
      return {
        intent: 'find_availability',
        confidence: 0.9,
        actions: [{ type: 'find_availability', parameters: { query: userInput } }],
        suggestions: ['I can show you your availability for any time period'],
        followUp: ['What duration are you looking for?', 'Any specific time preferences?'],
      };
    }

    if (
      lowerInput.includes('conflict') ||
      lowerInput.includes('busy') ||
      lowerInput.includes('double book')
    ) {
      return {
        intent: 'check_conflicts',
        confidence: 0.85,
        actions: [{ type: 'find_conflicts', parameters: { query: userInput } }],
        suggestions: ['I can identify and help resolve scheduling conflicts'],
        followUp: ['Would you like suggestions for resolving conflicts?'],
      };
    }

    if (
      lowerInput.includes('productivity') ||
      lowerInput.includes('insights') ||
      lowerInput.includes('analysis')
    ) {
      return {
        intent: 'get_productivity_insights',
        confidence: 0.9,
        actions: [{ type: 'analyze_productivity', parameters: {} }],
        suggestions: ['I can provide detailed productivity analysis and recommendations'],
        followUp: ['Would you like specific recommendations for improvement?'],
      };
    }

    // Default to general question
    return {
      intent: 'general_question',
      confidence: 0.6,
      actions: [],
      suggestions: [
        'Try asking about scheduling, availability, or productivity insights',
        'I can help create events from natural language',
        'Ask me about your calendar conflicts or optimization',
      ],
      followUp: ['What would you like me to help you with today?'],
    };
  }

  private async executeActions(
    actions: Array<{ type: string; parameters: any }>,
    originalInput: string
  ): Promise<any[]> {
    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_event': {
            const eventResult = await this.createEventFromText(originalInput);
            results.push({
              type: 'create_event',
              data: eventResult,
              confidence: eventResult.suggestions[0]?.confidence || 0.5,
            });
            break;
          }

          case 'find_availability':
            // Implementation would query calendar for availability
            results.push({
              type: 'suggest_times',
              data: { message: 'Availability analysis initiated' },
              confidence: 0.8,
            });
            break;

          case 'find_conflicts':
            // Implementation would analyze conflicts
            results.push({
              type: 'find_conflicts',
              data: { message: 'Conflict analysis completed' },
              confidence: 0.9,
            });
            break;

          case 'analyze_productivity': {
            const insights = await this.getCalendarInsights();
            results.push({
              type: 'analyze_productivity',
              data: insights,
              confidence: 0.85,
            });
            break;
          }

          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
        results.push({
          type: action.type,
          data: { error: 'Action execution failed' },
          confidence: 0.1,
        });
      }
    }

    return results;
  }

  private async buildCalendarContext(currentDate?: Date): Promise<string> {
    const now = currentDate || new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Get events for current week
    const events = this.schedulingEngine.context.existingEvents;
    const thisWeekEvents = events.filter(
      (event) => event.startDate >= weekStart && event.startDate <= weekEnd
    );

    const upcomingEvents = events.filter((event) => isFuture(event.startDate)).slice(0, 5); // Next 5 events

    const context = [
      `Current date: ${format(now, 'PPP')}`,
      `This week (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}): ${thisWeekEvents.length} events`,
      `Upcoming events: ${upcomingEvents.length}`,
      '',
    ];

    if (upcomingEvents.length > 0) {
      context.push('Next few events:');
      upcomingEvents.forEach((event) => {
        context.push(`- ${event.title} (${format(event.startDate, 'PPp')})`);
      });
    }

    // Add productivity context if available
    const userProfile = this.schedulingEngine.getUserProfile();
    if (userProfile) {
      const recentMetrics = userProfile.historicalMetrics.slice(-7);
      if (recentMetrics.length > 0) {
        const avgProductivity =
          recentMetrics.reduce((acc, m) => acc + m.productivityScore, 0) / recentMetrics.length;
        context.push(`\nRecent productivity: ${avgProductivity.toFixed(1)}/100`);
      }
    }

    return context.join('\n');
  }

  /**
   * Update the underlying calendar events
   */
  updateEvents(events: Event[]): void {
    this.schedulingEngine.updateEvents(events);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.schedulingEngine.updatePreferences(preferences as UserPreferences);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
}
