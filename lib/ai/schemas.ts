import { z } from 'zod';

// Plan Diff Schema - for preview/apply workflow
export const PlanDiffSchema = z.object({
  adds: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      startDate: z.string(), // ISO string
      endDate: z.string(),
      category: z.enum(['personal', 'work', 'effort', 'notes']),
      location: z.string().optional(),
      attendees: z.array(z.string()).optional(),
    })
  ),
  updates: z.array(
    z.object({
      id: z.string(),
      changes: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        category: z.enum(['personal', 'work', 'effort', 'notes']).optional(),
        location: z.string().optional(),
        attendees: z.array(z.string()).optional(),
      }),
    })
  ),
  removes: z.array(z.string()), // Array of event IDs to remove
});

// Conflict Schema
export const ConflictSchema = z.object({
  idA: z.string(),
  idB: z.string(),
  overlap: z.object({
    start: z.string(), // ISO string
    end: z.string(),
  }),
  severity: z.enum(['low', 'medium', 'high']),
  resolution: z.enum(['reschedule', 'shorten', 'cancel', 'ignore']).optional(),
});

// Time Slot Schema
export const TimeSlotSchema = z.object({
  start: z.string(), // ISO string
  end: z.string(),
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()).optional(),
  conflicts: z.array(z.string()).optional(), // Event IDs that conflict
});

// Summary Schema
export const SummarySchema = z.object({
  text: z.string(),
  metrics: z.object({
    total: z.number(),
    overlaps: z.number(),
    focusBlocks: z.number(),
    categories: z.record(z.string(), z.number()),
    busyScore: z.number().min(0).max(1),
  }),
  insights: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});

// Tool Input Schemas
export const ToolInputSchemas = {
  suggestSchedule: z.object({
    title: z.string(),
    duration: z.number().min(15).max(480), // 15 min to 8 hours
    preferences: z
      .object({
        timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
        avoidConflicts: z.boolean().default(true),
        respectFocusTime: z.boolean().default(true),
        preferredDays: z.array(z.number().min(0).max(6)).optional(),
      })
      .optional(),
    constraints: z
      .array(
        z.object({
          type: z.enum(['deadline', 'after', 'before', 'between']),
          date: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .optional(),
  }),

  explainConflicts: z.object({
    date: z.string().optional(),
    eventId: z.string().optional(),
    includeResolutions: z.boolean().default(true),
  }),

  listOpenSlots: z.object({
    date: z.string(),
    minDuration: z.number().min(15).default(30),
    maxSlots: z.number().min(1).max(20).default(5),
    withinWorkingHours: z.boolean().default(true),
  }),

  applyPlanPreview: z.object({
    planDiff: PlanDiffSchema,
    dryRun: z.boolean().default(true),
    validateConflicts: z.boolean().default(true),
  }),

  summarizePeriod: z.object({
    startDate: z.string(),
    endDate: z.string(),
    includeInsights: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true),
    groupBy: z.enum(['day', 'week', 'category']).default('category'),
  }),
};

// Tool Output Schemas
export const ToolOutputSchemas = {
  suggestSchedule: z.object({
    suggestions: z.array(TimeSlotSchema),
    alternativeOptions: z.array(TimeSlotSchema).optional(),
  }),

  explainConflicts: z.object({
    conflicts: z.array(ConflictSchema),
    totalConflicts: z.number(),
    resolutionPlan: z
      .array(
        z.object({
          conflictId: z.string(),
          action: z.string(),
          impact: z.string(),
        })
      )
      .optional(),
  }),

  listOpenSlots: z.object({
    date: z.string(),
    openSlots: z.array(TimeSlotSchema),
    totalAvailable: z.number(),
    recommendedSlot: TimeSlotSchema.optional(),
  }),

  applyPlanPreview: z.object({
    success: z.boolean(),
    applied: PlanDiffSchema.optional(),
    errors: z.array(z.string()).optional(),
    conflicts: z.array(ConflictSchema).optional(),
  }),

  summarizePeriod: SummarySchema,
};

// Type exports
export type PlanDiff = z.infer<typeof PlanDiffSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Summary = z.infer<typeof SummarySchema>;
