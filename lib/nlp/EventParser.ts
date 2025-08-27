import type { Event, EventCategory } from '@/types/calendar';
import * as chrono from 'chrono-node';

export interface ParsedEvent {
  title: string;
  start?: Date;
  end?: Date;
  location?: string;
  attendees?: string[];
  category: EventCategory;
  confidence: number;
  originalInput: string;
}

export interface EventIntent {
  action: 'create' | 'update' | 'delete' | 'search';
  target?: string;
  conditions?: any;
}

export class EventParser {
  private parser: chrono.Chrono;
  private locationPattern = /(?:at|@)\s+([^,]+?)(?:\s+(?:on|at|from)|$)/i;
  private attendeePattern = /(?:with|w\/)\s+(@?\w+(?:\s+@?\w+)*)/gi;

  constructor() {
    this.parser = new chrono.Chrono();
    this.registerCustomRefiners();
  }

  private registerCustomRefiners() {
    // Business hours refiner
    this.parser.refiners.push({
      refine: (context, results) => {
        results.forEach((result) => {
          if (!result.start.isCertain('hour')) {
            const text = context.text.toLowerCase();

            if (text.includes('meeting') || text.includes('call')) {
              // Default business hours for meetings
              result.start.imply('hour', 10);
              result.start.imply('minute', 0);

              if (!result.end) {
                result.end = result.start.clone();
                result.end.imply('hour', 11);
              }
            }
          }
        });
        return results;
      },
    });

    // Duration refiner
    this.parser.refiners.push({
      refine: (context, results) => {
        const durationPattern = /for\s+(\d+)\s+(hour|minute|min|hr)s?/i;
        const match = context.text.match(durationPattern);

        if (match && results.length > 0) {
          const duration = Number.parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const result = results[0];

          if (!result.end && result.start) {
            result.end = result.start.clone();

            if (unit.startsWith('hour') || unit === 'hr') {
              result.end.imply('hour', result.start.get('hour') + duration);
            } else {
              result.end.imply('minute', result.start.get('minute') + duration);
            }
          }
        }

        return results;
      },
    });

    // Recurring events refiner
    this.parser.refiners.push({
      refine: (context, results) => {
        const recurringPattern =
          /(?:every|each)\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
        const match = context.text.match(recurringPattern);

        if (match && results.length > 0) {
          // Add recurring metadata to result
          (results[0] as any).recurring = match[1].toLowerCase();
        }

        return results;
      },
    });
  }

  public parse(input: string): ParsedEvent {
    // Parse temporal information
    const temporal = this.parser.parse(input)[0];

    // Extract location
    const locationMatch = input.match(this.locationPattern);
    const location = locationMatch ? locationMatch[1].trim() : undefined;

    // Extract attendees
    const attendees: string[] = [];
    let match;
    while ((match = this.attendeePattern.exec(input)) !== null) {
      attendees.push(...match[1].split(/\s+/).map((a) => a.replace('@', '')));
    }

    // Extract title (remove parsed components)
    let title = input;
    if (temporal) {
      title = title.replace(temporal.text, '');
    }
    if (location) {
      title = title.replace(this.locationPattern, '');
    }
    title = title.replace(this.attendeePattern, '').trim();

    // Clean up title
    title = title.replace(/^\s*[-:,]\s*/, '').trim();
    if (!title) {
      title = this.generateTitle(input, temporal, location);
    }

    // Determine event category using NLP
    const category = this.inferCategory(input);

    return {
      title,
      start: temporal?.start.date(),
      end: temporal?.end?.date(),
      location,
      attendees,
      category,
      confidence: this.calculateConfidence(temporal, location, attendees),
      originalInput: input,
    };
  }

  private generateTitle(input: string, _temporal: any, location?: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('meeting')) return 'Meeting';
    if (lower.includes('call')) return 'Call';
    if (lower.includes('lunch')) return 'Lunch';
    if (lower.includes('dinner')) return 'Dinner';
    if (lower.includes('birthday')) return 'Birthday';
    if (lower.includes('appointment')) return 'Appointment';
    if (lower.includes('workout') || lower.includes('gym')) return 'Workout';
    if (lower.includes('deadline')) return 'Deadline';

    if (location) return `Event at ${location}`;

    return 'New Event';
  }

  private inferCategory(input: string): EventCategory {
    const workKeywords = [
      'meeting',
      'call',
      'presentation',
      'review',
      'standup',
      'work',
      'office',
      'deadline',
      'project',
      'client',
      'interview',
    ];
    const personalKeywords = [
      'birthday',
      'dinner',
      'lunch',
      'coffee',
      'gym',
      'doctor',
      'appointment',
      'date',
      'party',
      'wedding',
      'vacation',
    ];
    const effortKeywords = [
      'workout',
      'study',
      'practice',
      'work on',
      'build',
      'learn',
      'training',
      'exercise',
      'run',
      'coding',
    ];

    const lower = input.toLowerCase();

    // Count keyword matches
    const workScore = workKeywords.filter((k) => lower.includes(k)).length;
    const personalScore = personalKeywords.filter((k) => lower.includes(k)).length;
    const effortScore = effortKeywords.filter((k) => lower.includes(k)).length;

    // Return category with highest score
    if (workScore > personalScore && workScore > effortScore) {
      return 'work';
    }
    if (personalScore > workScore && personalScore > effortScore) {
      return 'personal';
    }
    if (effortScore > 0) {
      return 'effort';
    }

    // Default to note if unclear
    return 'note';
  }

  private calculateConfidence(temporal: any, location?: string, attendees?: string[]): number {
    let confidence = 0;

    // Temporal confidence
    if (temporal) {
      confidence += 0.4;
      if (temporal.start.isCertain('day')) confidence += 0.2;
      if (temporal.start.isCertain('hour')) confidence += 0.1;
      if (temporal.end) confidence += 0.1;
    }

    // Location confidence
    if (location) confidence += 0.1;

    // Attendees confidence
    if (attendees && attendees.length > 0) confidence += 0.1;

    return Math.min(1, confidence);
  }

  public parseIntent(input: string): EventIntent | null {
    const lower = input.toLowerCase();

    // Delete intent
    if (lower.includes('delete') || lower.includes('remove') || lower.includes('cancel')) {
      const target = input.replace(/^(delete|remove|cancel)\s+/i, '').trim();
      return { action: 'delete', target };
    }

    // Update intent
    if (
      lower.includes('update') ||
      lower.includes('change') ||
      lower.includes('modify') ||
      lower.includes('reschedule')
    ) {
      const target = input.replace(/^(update|change|modify|reschedule)\s+/i, '').trim();
      return { action: 'update', target };
    }

    // Search intent
    if (
      lower.includes('find') ||
      lower.includes('search') ||
      lower.includes('show') ||
      lower.includes('list')
    ) {
      const target = input.replace(/^(find|search|show|list)\s+/i, '').trim();
      return { action: 'search', target };
    }

    // Default to create
    return { action: 'create' };
  }
}
