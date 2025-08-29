/**
 * Structured Prompt Templates for Command Center Calendar AI System
 *
 * Based on research-validated best practices:
 * - XML-like formatting for clear structure
 * - Few-shot examples for pattern learning
 * - Chain-of-thought integration for reasoning
 * - Positive instructions for better performance
 */

// ============================================================================
// BASE TEMPLATE STRUCTURE
// ============================================================================

export interface PromptTemplate {
  id: string;
  category: 'scheduling' | 'conflict' | 'planning' | 'summarization' | 'extraction';
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  fewShotExamples: FewShotExample[];
  outputSchema?: OutputSchema;
  chainOfThought?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface FewShotExample {
  input: string;
  output: string;
  reasoning?: string; // For chain-of-thought
}

export interface OutputSchema {
  type: 'json' | 'markdown' | 'structured';
  schema?: Record<string, any>;
}

// ============================================================================
// SCHEDULING TEMPLATES
// ============================================================================

export const schedulingTemplates: Record<string, PromptTemplate> = {
  findTimeSlot: {
    id: 'find-time-slot',
    category: 'scheduling',
    description: 'Find optimal time slots for new events',
    systemPrompt: `You are Command Center Calendar's scheduling assistant. You analyze calendar data to find optimal time slots.

<instructions>
- Analyze existing calendar events and constraints
- Consider user preferences and patterns
- Suggest 3 optimal time slots
- Provide reasoning for each suggestion
</instructions>

<output_format>
Return a JSON object with suggested time slots and reasoning.
</output_format>`,
    userPromptTemplate: `<context>
Current Events: {{events}}
User Preferences: {{preferences}}
Constraints: {{constraints}}
</context>

<request>
Find optimal time slots for: {{eventDescription}}
Duration: {{duration}}
Date Range: {{dateRange}}
</request>`,
    fewShotExamples: [
      {
        input: `Find time for "Team meeting" (1 hour) this week`,
        output: `{
  "suggestions": [
    {
      "start": "2024-01-15T10:00:00",
      "end": "2024-01-15T11:00:00",
      "score": 0.95,
      "reasoning": "Morning slot after deep work, before lunch"
    },
    {
      "start": "2024-01-16T14:00:00",
      "end": "2024-01-16T15:00:00",
      "score": 0.85,
      "reasoning": "Post-lunch slot, common meeting time"
    },
    {
      "start": "2024-01-17T15:30:00",
      "end": "2024-01-17T16:30:00",
      "score": 0.75,
      "reasoning": "Late afternoon, minimal conflicts"
    }
  ]
}`,
        reasoning:
          'Analyzed existing meetings, avoided focus time blocks, prioritized common meeting hours',
      },
    ],
    outputSchema: {
      type: 'json',
      schema: {
        suggestions: 'array',
        'suggestions.*.start': 'datetime',
        'suggestions.*.end': 'datetime',
        'suggestions.*.score': 'number',
        'suggestions.*.reasoning': 'string',
      },
    },
    chainOfThought: true,
    temperature: 0.3,
    maxTokens: 1000,
  },

  rescheduleEvent: {
    id: 'reschedule-event',
    category: 'scheduling',
    description: 'Find alternative times for existing events',
    systemPrompt: `You are Command Center Calendar's rescheduling assistant. You help find better times for existing events.

<instructions>
- Analyze the current event placement
- Identify scheduling conflicts or suboptimal timing
- Suggest alternative time slots
- Maintain event relationships and dependencies
</instructions>`,
    userPromptTemplate: `<event>
{{eventDetails}}
</event>

<calendar_context>
{{calendarContext}}
</calendar_context>

<reason>
{{rescheduleReason}}
</reason>

Find alternative times for this event.`,
    fewShotExamples: [
      {
        input: "Reschedule 'Design Review' due to conflict with 'Client Call'",
        output: `{
  "alternatives": [
    {
      "time": "Same day, 2 hours later",
      "impact": "No other conflicts, maintains day flow"
    },
    {
      "time": "Next day, same time",
      "impact": "Clear schedule, better preparation time"
    }
  ]
}`,
      },
    ],
    temperature: 0.4,
  },
};

// ============================================================================
// CONFLICT RESOLUTION TEMPLATES
// ============================================================================

export const conflictTemplates: Record<string, PromptTemplate> = {
  detectConflicts: {
    id: 'detect-conflicts',
    category: 'conflict',
    description: 'Identify scheduling conflicts and their severity',
    systemPrompt: `You are Command Center Calendar's conflict detection system. You identify and classify scheduling conflicts.

<instructions>
- Identify all types of conflicts (time, resource, priority)
- Classify severity (critical, high, medium, low)
- Consider soft constraints (preferences, energy levels)
- Provide resolution suggestions
</instructions>

<conflict_types>
- Time overlap: Events scheduled at the same time
- Resource conflict: Same resource needed by multiple events
- Priority conflict: Low-priority event blocking high-priority time
- Energy mismatch: High-energy task during low-energy time
- Travel conflict: Insufficient time between locations
</conflict_types>`,
    userPromptTemplate: `<events>
{{events}}
</events>

<constraints>
{{constraints}}
</constraints>

Analyze for conflicts.`,
    fewShotExamples: [
      {
        input: 'Two meetings at 2pm on Tuesday',
        output: `{
  "conflicts": [
    {
      "type": "time_overlap",
      "severity": "critical",
      "events": ["meeting-1", "meeting-2"],
      "resolution": "Reschedule lower priority meeting"
    }
  ]
}`,
      },
    ],
    chainOfThought: true,
    temperature: 0.2,
  },

  resolveConflict: {
    id: 'resolve-conflict',
    category: 'conflict',
    description: 'Generate resolution strategies for conflicts',
    systemPrompt: `You are Command Center Calendar's conflict resolution engine. You provide actionable solutions for scheduling conflicts.

<resolution_strategies>
- Rescheduling: Move events to different times
- Prioritization: Keep high-priority, move low-priority
- Delegation: Assign to different resources
- Splitting: Break events into smaller chunks
- Merging: Combine related events
</resolution_strategies>`,
    userPromptTemplate: `<conflict>
{{conflictDetails}}
</conflict>

<preferences>
{{userPreferences}}
</preferences>

Generate resolution strategies.`,
    fewShotExamples: [
      {
        input: 'Critical meeting conflicts with focus time',
        output: `{
  "strategies": [
    {
      "action": "reschedule_focus",
      "description": "Move focus time to early morning",
      "impact": "Maintains deep work, accommodates meeting"
    },
    {
      "action": "shorten_meeting",
      "description": "Reduce meeting to 30 minutes",
      "impact": "Preserves some focus time"
    }
  ]
}`,
      },
    ],
    temperature: 0.5,
  },
};

// ============================================================================
// PLANNING TEMPLATES
// ============================================================================

export const planningTemplates: Record<string, PromptTemplate> = {
  dailyPlanning: {
    id: 'daily-planning',
    category: 'planning',
    description: 'Create optimized daily schedules',
    systemPrompt: `You are Command Center Calendar's daily planning assistant. You create balanced, productive daily schedules.

<planning_principles>
- Balance deep work with meetings
- Respect energy patterns (morning focus, afternoon collaboration)
- Include breaks and transitions
- Maintain work-life balance
- Consider task dependencies
</planning_principles>

<schedule_components>
- Focus blocks: 90-120 minute deep work sessions
- Meeting blocks: Grouped when possible
- Break time: 5-15 minutes between blocks
- Buffer time: Flexibility for overruns
- Personal time: Lunch, exercise, personal tasks
</schedule_components>`,
    userPromptTemplate: `<date>
{{date}}
</date>

<tasks>
{{tasks}}
</tasks>

<meetings>
{{meetings}}
</meetings>

<preferences>
{{preferences}}
</preferences>

Create an optimized daily schedule.`,
    fewShotExamples: [
      {
        input: 'Plan Tuesday with 3 meetings and 2 deep work tasks',
        output: `{
  "schedule": {
    "8:00-9:30": "Deep Work: Project Analysis",
    "9:30-9:45": "Break",
    "9:45-10:45": "Team Meeting",
    "10:45-11:00": "Email & Slack",
    "11:00-12:00": "Client Call",
    "12:00-13:00": "Lunch",
    "13:00-14:30": "Deep Work: Design Implementation",
    "14:30-14:45": "Break",
    "14:45-15:45": "1:1 Meeting",
    "15:45-16:00": "Buffer & Wrap-up",
    "16:00-17:00": "Admin & Planning"
  },
  "reasoning": "Morning deep work leverages peak focus, meetings grouped in mid-morning and afternoon, adequate breaks included"
}`,
      },
    ],
    chainOfThought: true,
    temperature: 0.4,
    maxTokens: 1500,
  },

  weeklyPlanning: {
    id: 'weekly-planning',
    category: 'planning',
    description: 'Create balanced weekly schedules with goals',
    systemPrompt: `You are Command Center Calendar's weekly planning strategist. You design productive, sustainable weekly schedules.

<weekly_rhythm>
- Monday: Planning and setup
- Tuesday-Thursday: Core productivity
- Friday: Wrap-up and review
</weekly_rhythm>

<balance_factors>
- Deep work vs collaborative work
- Urgent vs important tasks
- Energy management across days
- Personal time and recovery
</balance_factors>`,
    userPromptTemplate: `<week_start>
{{weekStart}}
</week_start>

<goals>
{{weeklyGoals}}
</goals>

<commitments>
{{existingCommitments}}
</commitments>

Design weekly schedule.`,
    fewShotExamples: [
      {
        input: 'Week with product launch and 2 client projects',
        output: `{
  "weekly_plan": {
    "monday": {
      "theme": "Planning & Launch Prep",
      "key_blocks": ["Launch planning", "Team alignment", "Client project review"]
    },
    "tuesday": {
      "theme": "Deep Work & Development",
      "key_blocks": ["Feature development", "Testing", "Client work"]
    },
    "wednesday": {
      "theme": "Launch Day",
      "key_blocks": ["Launch activities", "Monitoring", "Support"]
    },
    "thursday": {
      "theme": "Client Focus",
      "key_blocks": ["Client meetings", "Project work", "Documentation"]
    },
    "friday": {
      "theme": "Review & Planning",
      "key_blocks": ["Launch retrospective", "Next week planning", "Admin"]
    }
  },
  "success_metrics": ["Launch completed", "Client deliverables met", "Team wellbeing maintained"]
}`,
      },
    ],
    temperature: 0.5,
    maxTokens: 2000,
  },
};

// ============================================================================
// SUMMARIZATION TEMPLATES
// ============================================================================

export const summarizationTemplates: Record<string, PromptTemplate> = {
  dailySummary: {
    id: 'daily-summary',
    category: 'summarization',
    description: 'Generate daily activity summaries',
    systemPrompt: `You are Command Center Calendar's daily summarization assistant. You create concise, insightful daily summaries.

<summary_components>
- Key accomplishments
- Time allocation breakdown
- Meeting highlights
- Focus time effectiveness
- Improvement opportunities
</summary_components>

<tone>
Professional yet conversational, focusing on insights over raw data.
</tone>`,
    userPromptTemplate: `<date>
{{date}}
</date>

<completed_events>
{{completedEvents}}
</completed_events>

<metrics>
{{dailyMetrics}}
</metrics>

Generate daily summary.`,
    fewShotExamples: [
      {
        input: 'Tuesday: 4 meetings, 2 focus blocks, 6 tasks completed',
        output: `## Daily Summary - Tuesday

**Productivity Snapshot**
✅ 6 tasks completed (120% of target)
⏱️ 3.5 hours deep work (excellent focus time)
🤝 4 meetings totaling 2.5 hours

**Key Achievements**
- Completed project proposal ahead of deadline
- Resolved critical bug in authentication flow
- Aligned team on Q2 objectives

**Time Allocation**
- Deep Work: 44% (above 40% target ✨)
- Meetings: 31%
- Admin/Email: 15%
- Breaks: 10%

**Tomorrow's Priority**
Continue momentum on project implementation while maintaining focus time balance.`,
      },
    ],
    temperature: 0.6,
    maxTokens: 800,
  },

  weeklyInsights: {
    id: 'weekly-insights',
    category: 'summarization',
    description: 'Generate weekly productivity insights',
    systemPrompt: `You are Command Center Calendar's weekly insights analyst. You identify patterns and provide actionable recommendations.

<analysis_dimensions>
- Productivity trends
- Time allocation patterns
- Meeting effectiveness
- Goal achievement
- Energy and wellbeing
</analysis_dimensions>`,
    userPromptTemplate: `<week_data>
{{weekData}}
</week_data>

<goals>
{{weeklyGoals}}
</goals>

Generate weekly insights.`,
    fewShotExamples: [
      {
        input: 'Week data showing declining afternoon productivity',
        output: `## Weekly Insights

**Productivity Pattern Detected**
📉 Afternoon productivity dropped 30% compared to mornings

**Recommendation**
- Schedule creative work before lunch
- Reserve afternoons for meetings and admin
- Consider 20-minute power nap at 2pm

**This Week's Wins**
- 92% goal completion rate
- Maintained focus time target 4/5 days
- Zero meeting overruns

**Next Week's Optimization**
Experiment with time-boxing afternoon tasks to maintain energy.`,
      },
    ],
    temperature: 0.7,
    maxTokens: 1000,
  },
};

// ============================================================================
// EXTRACTION TEMPLATES
// ============================================================================

export const extractionTemplates: Record<string, PromptTemplate> = {
  parseNaturalLanguage: {
    id: 'parse-natural-language',
    category: 'extraction',
    description: 'Extract structured event data from natural language',
    systemPrompt: `You are Command Center Calendar's natural language parser. You extract structured calendar data from text.

<extraction_rules>
- Identify event title, date, time, duration
- Recognize recurring patterns
- Extract participants and locations
- Identify event categories and priorities
- Handle ambiguous dates intelligently
</extraction_rules>

<date_parsing>
- Relative dates: "tomorrow", "next Tuesday", "in 2 weeks"
- Specific dates: "Jan 15", "1/15/2024", "15th of January"
- Recurring: "every Monday", "weekly", "monthly on the 1st"
</date_parsing>`,
    userPromptTemplate: `<input>
{{naturalLanguageInput}}
</input>

<current_date>
{{currentDate}}
</current_date>

<timezone>
{{timezone}}
</timezone>

Extract event details.`,
    fewShotExamples: [
      {
        input: 'Meeting with Sarah next Tuesday at 2pm for 90 minutes about Q1 planning',
        output: `{
  "title": "Q1 Planning Meeting with Sarah",
  "date": "2024-01-16",
  "startTime": "14:00",
  "duration": 90,
  "participants": ["Sarah"],
  "category": "planning",
  "description": "Q1 planning discussion"
}`,
      },
      {
        input: 'Coffee with team every Friday morning at 9',
        output: `{
  "title": "Team Coffee",
  "recurrence": "weekly",
  "dayOfWeek": "Friday",
  "startTime": "09:00",
  "duration": 60,
  "category": "team",
  "type": "recurring"
}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 500,
  },

  extractActionItems: {
    id: 'extract-action-items',
    category: 'extraction',
    description: 'Extract action items from meeting notes',
    systemPrompt: `You are Command Center Calendar's action item extractor. You identify and structure tasks from text.

<extraction_focus>
- Action verbs indicating tasks
- Assignees and owners
- Deadlines and priorities
- Dependencies between tasks
- Success criteria
</extraction_focus>`,
    userPromptTemplate: `<meeting_notes>
{{meetingNotes}}
</meeting_notes>

Extract action items.`,
    fewShotExamples: [
      {
        input:
          'John will review the proposal by Friday. Sarah needs to update the budget before the review.',
        output: `{
  "action_items": [
    {
      "task": "Review proposal",
      "assignee": "John",
      "deadline": "Friday",
      "priority": "high"
    },
    {
      "task": "Update budget",
      "assignee": "Sarah",
      "deadline": "Before Friday",
      "dependency": "Required for proposal review",
      "priority": "critical"
    }
  ]
}`,
      },
    ],
    temperature: 0.3,
  },
};

// ============================================================================
// TEMPLATE MANAGER
// ============================================================================

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    // Load all template categories
    Object.values(schedulingTemplates).forEach((t) => this.templates.set(t.id, t));
    Object.values(conflictTemplates).forEach((t) => this.templates.set(t.id, t));
    Object.values(planningTemplates).forEach((t) => this.templates.set(t.id, t));
    Object.values(summarizationTemplates).forEach((t) => this.templates.set(t.id, t));
    Object.values(extractionTemplates).forEach((t) => this.templates.set(t.id, t));
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  formatPrompt(
    templateId: string,
    variables: Record<string, any>
  ): { system: string; user: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    // Replace variables in user prompt
    let userPrompt = template.userPromptTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      userPrompt = userPrompt.replace(
        regex,
        typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      );
    });

    // Add few-shot examples if available
    if (template.fewShotExamples.length > 0) {
      userPrompt += '\n\n<examples>\n';
      template.fewShotExamples.forEach((example, index) => {
        userPrompt += `<example_${index + 1}>\n`;
        userPrompt += `Input: ${example.input}\n`;
        userPrompt += `Output: ${example.output}\n`;
        if (example.reasoning && template.chainOfThought) {
          userPrompt += `Reasoning: ${example.reasoning}\n`;
        }
        userPrompt += `</example_${index + 1}>\n\n`;
      });
      userPrompt += '</examples>';
    }

    return {
      system: template.systemPrompt,
      user: userPrompt,
    };
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  validateOutput(templateId: string, output: any): boolean {
    const template = this.getTemplate(templateId);
    if (!template || !template.outputSchema) return true;

    // Basic validation based on output schema
    if (template.outputSchema.type === 'json') {
      try {
        const parsed = typeof output === 'string' ? JSON.parse(output) : output;
        // Check required fields if schema is defined
        if (template.outputSchema.schema) {
          for (const [key, type] of Object.entries(template.outputSchema.schema)) {
            if (key.includes('*.')) {
              // Handle nested array validation
              const [arrayKey] = key.split('.*.');
              if (!Array.isArray(parsed[arrayKey])) return false;
            } else if (!(key in parsed)) {
              return false;
            }
          }
        }
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export function createPromptChain(
  templates: string[],
  sharedContext?: Record<string, any>
): { templateId: string; variables: Record<string, any> }[] {
  return templates.map((templateId) => ({
    templateId,
    variables: sharedContext || {},
  }));
}

export function selectBestTemplate(
  userInput: string,
  category?: PromptTemplate['category']
): string | null {
  // Simple keyword matching for template selection
  const keywords: Record<string, string[]> = {
    'find-time-slot': ['find time', 'schedule', 'when can', 'available'],
    'reschedule-event': ['reschedule', 'move', 'change time'],
    'detect-conflicts': ['conflict', 'overlap', 'double booked'],
    'resolve-conflict': ['resolve', 'fix conflict', 'handle overlap'],
    'daily-planning': ['plan day', 'daily schedule', "today's plan"],
    'weekly-planning': ['plan week', 'weekly schedule', 'week ahead'],
    'daily-summary': ['summary', 'recap', 'what did I do'],
    'weekly-insights': ['insights', 'patterns', 'weekly review'],
    'parse-natural-language': ['add event', 'create meeting', 'schedule'],
    'extract-action-items': ['action items', 'todos', 'tasks from'],
  };

  const lowerInput = userInput.toLowerCase();

  for (const [templateId, terms] of Object.entries(keywords)) {
    if (terms.some((term) => lowerInput.includes(term))) {
      return templateId;
    }
  }

  return null;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { PromptTemplate, FewShotExample, OutputSchema };
