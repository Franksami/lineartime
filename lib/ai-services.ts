import type { CalendarEvent } from '@/components/ui/calendar';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { AI_MODELS, AI_PROMPTS } from './ai-config';

// Enhanced event parsing schema with more fields
const EventSchema = z.object({
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  category: z.enum(['work', 'personal', 'meeting', 'deadline', 'travel']),
  description: z.string().optional(),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  recurring: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
      interval: z.number().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
});

const _PARSING_PATTERNS = {
  TIME_PATTERNS: [
    /at (\d{1,2}):?(\d{2})?\s*(am|pm)?/gi,
    /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
    /(morning|afternoon|evening|noon)/gi,
  ],
  DATE_PATTERNS: [
    /(today|tomorrow|yesterday)/gi,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(next|this)\s+(week|month|year)/gi,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/gi,
  ],
  DURATION_PATTERNS: [
    /for\s+(\d+)\s+(hour|hours|day|days|week|weeks)/gi,
    /(\d+)\s+(hour|hours|day|days|week|weeks)\s+(long|duration)/gi,
  ],
  RECURRING_PATTERNS: [
    /(every|each)\s+(day|week|month|year)/gi,
    /(daily|weekly|monthly|yearly)/gi,
    /repeat\s+(every|each)/gi,
  ],
};

// Scheduling suggestion schema
const SchedulingSuggestionSchema = z.object({
  bestTimeSlots: z.array(
    z.object({
      date: z.string(),
      time: z.string(),
      confidence: z.number(),
    })
  ),
  conflicts: z.array(
    z.object({
      eventId: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    })
  ),
  alternatives: z.array(
    z.object({
      date: z.string(),
      reason: z.string(),
    })
  ),
});

export class AICalendarService {
  static async parseEventFromText(input: string): Promise<CalendarEvent | null> {
    try {
      // Preprocess input to normalize common patterns
      const preprocessedInput = AICalendarService.preprocessInput(input);

      const { object } = await generateObject({
        model: AI_MODELS.PARSING,
        prompt: `${AI_PROMPTS.EVENT_PARSER}

Additional context for parsing:
- Current date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toLocaleTimeString()}
- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Examples of valid inputs:
- "Team meeting tomorrow at 2pm for 1 hour"
- "Dentist appointment next Friday at 10:30am"
- "Weekly standup every Monday at 9am"
- "Vacation from July 15 to July 22"
- "Call with client on 3/15/2025 at 3:30pm"

Input: "${preprocessedInput}"

Respond with valid JSON only:`.replace('{input}', preprocessedInput),
        schema: EventSchema,
      });

      const startDate = new Date(object.startDate);
      const endDate = new Date(object.endDate);

      // Handle time parsing
      if (object.startTime) {
        const [hours, minutes] = AICalendarService.parseTime(object.startTime);
        startDate.setHours(hours, minutes);
      }

      if (object.endTime) {
        const [hours, minutes] = AICalendarService.parseTime(object.endTime);
        endDate.setHours(hours, minutes);
      } else if (object.startTime) {
        // Default to 1 hour duration if only start time provided
        endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
      }

      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        title: object.title,
        startDate,
        endDate,
        category: object.category,
        description: object.description,
        color: getCategoryColor(object.category),
      };

      if (object.recurring?.frequency) {
        event.recurring = {
          frequency: object.recurring.frequency,
          interval: object.recurring.interval || 1,
          endDate: object.recurring.endDate ? new Date(object.recurring.endDate) : undefined,
        };
      }

      return event;
    } catch (error) {
      console.error('[v0] AI parsing error:', error);

      return AICalendarService.fallbackParse(input);
    }
  }

  private static preprocessInput(input: string): string {
    let processed = input.toLowerCase().trim();

    // Normalize time expressions
    processed = processed.replace(/\b(\d{1,2})\s*(am|pm)\b/g, '$1:00 $2');
    processed = processed.replace(/\bnoon\b/g, '12:00 pm');
    processed = processed.replace(/\bmidnight\b/g, '12:00 am');

    // Normalize date expressions
    const today = new Date();
    processed = processed.replace(/\btoday\b/g, today.toISOString().split('T')[0]);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    processed = processed.replace(/\btomorrow\b/g, tomorrow.toISOString().split('T')[0]);

    return processed;
  }

  private static parseTime(timeStr: string): [number, number] {
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (!match) return [9, 0]; // Default to 9 AM

    let hours = Number.parseInt(match[1]);
    const minutes = Number.parseInt(match[2] || '0');
    const period = match[3]?.toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return [hours, minutes];
  }

  private static fallbackParse(input: string): CalendarEvent | null {
    try {
      // Extract title (everything before time/date patterns)
      let title = input.replace(/\s+(at|on|from|to|for|every|each)\s+.*/i, '').trim();
      if (!title) title = 'New Event';

      // Default to today
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default

      return {
        id: crypto.randomUUID(),
        title,
        startDate,
        endDate,
        category: 'personal',
        color: getCategoryColor('personal'),
      };
    } catch {
      return null;
    }
  }

  static async getSchedulingSuggestions(
    events: CalendarEvent[],
    newEvent: Partial<CalendarEvent>,
    constraints: string[] = []
  ) {
    try {
      // Pre-analyze conflicts
      const conflicts = AICalendarService.detectConflicts(events, newEvent);

      const { object } = await generateObject({
        model: AI_MODELS.SCHEDULING,
        prompt: `${AI_PROMPTS.SCHEDULING_OPTIMIZER}

Current conflicts detected: ${JSON.stringify(conflicts)}
Working hours: 9 AM - 6 PM (configurable)
Preferred meeting times: 10 AM - 4 PM
Buffer time between meetings: 15 minutes

Analyze and provide intelligent suggestions.`
          .replace('{events}', JSON.stringify(events))
          .replace('{newEvent}', JSON.stringify(newEvent))
          .replace('{constraints}', JSON.stringify(constraints)),
        schema: SchedulingSuggestionSchema,
      });

      return object;
    } catch (error) {
      console.error('[v0] AI scheduling error:', error);
      return null;
    }
  }

  private static detectConflicts(events: CalendarEvent[], newEvent: Partial<CalendarEvent>) {
    if (!newEvent.startDate || !newEvent.endDate) return [];

    return events
      .filter((event) => {
        const eventStart = event.startDate.getTime();
        const eventEnd = event.endDate.getTime();
        const newStart = newEvent.startDate?.getTime();
        const newEnd = newEvent.endDate?.getTime();

        return newStart < eventEnd && newEnd > eventStart;
      })
      .map((event) => ({
        eventId: event.id,
        title: event.title,
        severity: 'medium' as const,
      }));
  }

  // Chat with AI assistant
  static async chatWithAssistant(message: string, context: CalendarEvent[]) {
    try {
      const { text } = await generateText({
        model: AI_MODELS.CHAT,
        prompt: AI_PROMPTS.CHAT_ASSISTANT.replace('{context}', JSON.stringify(context)).replace(
          '{message}',
          message
        ),
      });

      return text;
    } catch (error) {
      console.error('[v0] AI chat error:', error);
      return "I'm sorry, I'm having trouble processing your request right now.";
    }
  }

  // Analyze calendar for insights
  static async analyzeCalendar(events: CalendarEvent[]) {
    try {
      const { text } = await generateText({
        model: AI_MODELS.CHAT,
        prompt: `Analyze this calendar and provide insights about:
        - Workload distribution
        - Potential scheduling conflicts
        - Productivity patterns
        - Recommendations for optimization
        
        Events: ${JSON.stringify(events)}
        
        Provide a concise analysis:`,
      });

      return text;
    } catch (error) {
      console.error('[v0] AI analysis error:', error);
      return 'Unable to analyze calendar at this time.';
    }
  }
}

// Helper function to get category colors
function getCategoryColor(category: string): string {
  const colors = {
    work: '#3b82f6', // blue
    personal: '#10b981', // emerald
    meeting: '#f59e0b', // amber
    deadline: '#ef4444', // red
    travel: '#8b5cf6', // violet
  };
  return colors[category as keyof typeof colors] || '#6b7280';
}
