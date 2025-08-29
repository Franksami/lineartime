import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from './ai-config';

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  category?: string;
}

interface DragContext {
  draggedEvents: Event[];
  targetDate: Date;
  existingEvents: Event[];
  dragOffset: { x: number; y: number };
}

// AI-powered drag suggestions schema
const DragSuggestionSchema = z.object({
  recommendations: z.array(
    z.object({
      targetDate: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1),
      type: z.enum(['optimal', 'alternative', 'conflict-free']),
    })
  ),
  conflicts: z.array(
    z.object({
      eventId: z.string(),
      eventTitle: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      resolution: z.string(),
    })
  ),
  insights: z.object({
    workloadBalance: z.string(),
    productivityImpact: z.string(),
    suggestions: z.array(z.string()),
  }),
});

// Smart grouping schema
const GroupingSuggestionSchema = z.object({
  groups: z.array(
    z.object({
      name: z.string(),
      eventIds: z.array(z.string()),
      reason: z.string(),
      suggestedTimeBlock: z.string(),
    })
  ),
  optimizations: z.array(
    z.object({
      type: z.enum(['consolidate', 'separate', 'reorder']),
      description: z.string(),
      eventIds: z.array(z.string()),
    })
  ),
});

export class AIDragDropService {
  static async analyzeDropTarget(context: DragContext): Promise<any> {
    try {
      const { object } = await generateObject({
        model: AI_MODELS.SCHEDULING,
        prompt: `Analyze this drag and drop operation for optimal scheduling:

Dragged Events: ${JSON.stringify(
          context.draggedEvents.map((e) => ({
            title: e.title,
            category: e.category,
            duration: (e.endDate.getTime() - e.startDate.getTime()) / (1000 * 60 * 60), // hours
          }))
        )}

Target Date: ${context.targetDate.toISOString().split('T')[0]}
Target Day: ${context.targetDate.toLocaleDateString('en-US', { weekday: 'long' })}

Existing Events on Target Date: ${JSON.stringify(
          context.existingEvents
            .filter(
              (e) =>
                e.startDate.toDateString() === context.targetDate.toDateString() ||
                e.endDate.toDateString() === context.targetDate.toDateString()
            )
            .map((e) => ({
              title: e.title,
              category: e.category,
              startTime: e.startDate.toLocaleTimeString(),
              endTime: e.endDate.toLocaleTimeString(),
            }))
        )}

Consider:
- Work-life balance
- Meeting clustering vs. focus time
- Energy levels throughout the day
- Category-based scheduling patterns
- Conflict resolution strategies

Provide intelligent recommendations:`,
        schema: DragSuggestionSchema,
      });

      return object;
    } catch (error) {
      console.error('[v0] AI drag analysis error:', error);
      return null;
    }
  }

  static async suggestEventGrouping(events: Event[]): Promise<any> {
    try {
      const { object } = await generateObject({
        model: AI_MODELS.SCHEDULING,
        prompt: `Analyze these events for intelligent grouping and organization:

Events: ${JSON.stringify(
          events.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate.toISOString(),
            duration: (e.endDate.getTime() - e.startDate.getTime()) / (1000 * 60 * 60),
          }))
        )}

Suggest optimal groupings based on:
- Similar categories or themes
- Logical workflow sequences
- Time efficiency (minimize context switching)
- Energy management (group similar mental loads)
- Meeting batching vs. focus time blocks

Provide actionable grouping suggestions:`,
        schema: GroupingSuggestionSchema,
      });

      return object;
    } catch (error) {
      console.error('[v0] AI grouping error:', error);
      return null;
    }
  }

  static async resolveConflicts(
    draggedEvents: Event[],
    conflictingEvents: Event[],
    targetDate: Date
  ): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: AI_MODELS.CHAT,
        prompt: `Provide conflict resolution suggestions for this scheduling conflict:

Dragged Events: ${JSON.stringify(
          draggedEvents.map((e) => ({
            title: e.title,
            category: e.category,
            originalDate: e.startDate.toDateString(),
          }))
        )}

Conflicting Events: ${JSON.stringify(
          conflictingEvents.map((e) => ({
            title: e.title,
            category: e.category,
            time: `${e.startDate.toLocaleTimeString()} - ${e.endDate.toLocaleTimeString()}`,
          }))
        )}

Target Date: ${targetDate.toDateString()}

Provide 3-5 specific, actionable resolution suggestions. Focus on:
- Alternative time slots
- Event priority assessment
- Rescheduling recommendations
- Meeting consolidation opportunities

Format as a numbered list:`,
      });

      return text.split('\n').filter((line) => line.trim().match(/^\d+\./));
    } catch (error) {
      console.error('[v0] AI conflict resolution error:', error);
      return [
        'Consider rescheduling one of the conflicting events',
        'Look for alternative time slots',
      ];
    }
  }

  static async optimizeEventPlacement(
    event: Event,
    targetDate: Date,
    existingEvents: Event[]
  ): Promise<{ suggestedTime: Date; reason: string } | null> {
    try {
      const { text } = await generateText({
        model: AI_MODELS.SCHEDULING,
        prompt: `Suggest the optimal time placement for this event:

Event: ${event.title} (${event.category})
Duration: ${(event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60)} minutes
Target Date: ${targetDate.toDateString()}

Existing Events on ${targetDate.toDateString()}:
${existingEvents
  .filter((e) => e.startDate.toDateString() === targetDate.toDateString())
  .map(
    (e) => `- ${e.title}: ${e.startDate.toLocaleTimeString()} - ${e.endDate.toLocaleTimeString()}`
  )
  .join('\n')}

Consider:
- Standard business hours (9 AM - 6 PM)
- Lunch break (12 PM - 1 PM)
- Meeting clustering vs. focus time
- Energy levels (high-focus tasks in morning)
- Buffer time between meetings (15 minutes)

Respond with: "SUGGESTED_TIME: HH:MM AM/PM - REASON: explanation"`,
      });

      const match = text.match(
        /SUGGESTED_TIME:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*REASON:\s*(.+)/i
      );
      if (match) {
        const timeStr = match[1];
        const reason = match[2];

        const [time, period] = timeStr.split(/\s+/);
        const [hours, minutes] = time.split(':').map(Number);
        let adjustedHours = hours;

        if (period.toUpperCase() === 'PM' && hours !== 12) adjustedHours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) adjustedHours = 0;

        const suggestedTime = new Date(targetDate);
        suggestedTime.setHours(adjustedHours, minutes, 0, 0);

        return { suggestedTime, reason };
      }

      return null;
    } catch (error) {
      console.error('[v0] AI placement optimization error:', error);
      return null;
    }
  }

  static async predictOptimalScheduling(events: Event[]): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: AI_MODELS.CHAT,
        prompt: `Analyze this calendar for predictive scheduling insights:

Events: ${JSON.stringify(
          events.map((e) => ({
            title: e.title,
            category: e.category,
            day: e.startDate.toLocaleDateString('en-US', { weekday: 'long' }),
            time: e.startDate.toLocaleTimeString(),
            duration: (e.endDate.getTime() - e.startDate.getTime()) / (1000 * 60 * 60),
          }))
        )}

Provide predictive insights about:
1. Optimal days for different types of work
2. Time patterns that maximize productivity
3. Potential scheduling bottlenecks
4. Recommendations for future event placement

Format as actionable bullet points:`,
      });

      return text
        .split('\n')
        .filter((line) => line.trim().startsWith('•') || line.trim().startsWith('-'));
    } catch (error) {
      console.error('[v0] AI predictive scheduling error:', error);
      return [];
    }
  }

  static generateDragFeedback(
    draggedEvents: Event[],
    targetDate: Date,
    conflicts: Event[]
  ): { message: string; type: 'success' | 'warning' | 'error' } {
    if (conflicts.length === 0) {
      return {
        message: `Moving ${draggedEvents.length} event${draggedEvents.length > 1 ? 's' : ''} to ${targetDate.toLocaleDateString()}`,
        type: 'success',
      };
    }

    if (conflicts.length === 1) {
      return {
        message: `Conflict with "${conflicts[0].title}" - AI suggestions available`,
        type: 'warning',
      };
    }

    return {
      message: `${conflicts.length} conflicts detected - AI optimization recommended`,
      type: 'error',
    };
  }
}
