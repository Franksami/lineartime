import type { Event, EventCategory } from '@/types/calendar';

// Time slot representation
export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
  available: boolean;
  score?: number; // 0-100 scoring for optimal slots
}

// Scheduling request from user
export interface SchedulingRequest {
  title: string;
  duration: number; // in minutes
  category?: EventCategory;
  preferredTimes?: TimeRange[];
  deadline?: Date;
  priority?: number; // 1-5 (1 = highest)
  attendees?: string[];
  location?: string;
  constraints?: SchedulingConstraint[];
  flexible?: boolean; // Can be split into multiple sessions
}

// Time range for preferences
export interface TimeRange {
  start: Date;
  end: Date;
  preferred?: boolean; // true = preferred, false = avoid
}

// Constraint types for scheduling
export interface SchedulingConstraint {
  type: 'hard' | 'soft';
  name: string;
  evaluate: (slot: TimeSlot, context: SchedulingContext) => boolean;
  penalty?: number; // For soft constraints
  description?: string;
}

// Context for scheduling decisions
export interface SchedulingContext {
  existingEvents: Event[];
  preferences: UserPreferences;
  focusBlocks: FocusBlock[];
  energyLevels: EnergyProfile;
  workingHours: TimeRange[];
  timezone: string;
}

// User preferences for scheduling
export interface UserPreferences {
  workingHours: {
    start: number; // hour (0-23)
    end: number; // hour (0-23)
    days: number[]; // 0 = Sunday, 6 = Saturday
  };
  bufferTime: number; // minutes between events
  lunchTime?: TimeRange;
  focusTimePreferences: {
    preferredDuration: number; // minutes
    preferredTimes: TimeRange[];
    protectionLevel: 'strict' | 'flexible' | 'none';
  };
  meetingPreferences: {
    preferredDuration: number; // default meeting length
    maxBackToBack: number; // max consecutive meetings
    breakAfterMeetings: number; // break duration after meetings
  };
}

// Energy profile for optimal scheduling
export interface EnergyProfile {
  type: 'morning' | 'evening' | 'balanced' | 'custom';
  levels: EnergyLevel[];
  lastUpdated: Date;
}

export interface EnergyLevel {
  hour: number; // 0-23
  level: number; // 0-1 (0 = low, 1 = high)
  dayOfWeek?: number; // Optional: different levels for different days
}

// Focus time blocks
export interface FocusBlock {
  id: string;
  type: 'deep-work' | 'shallow-work' | 'break' | 'personal';
  title?: string;
  preferredTimes: TimeRange[];
  minDuration: number; // minutes
  maxDuration: number; // minutes
  priority: number; // 1-5
  recurring?: RecurrencePattern;
  protected: boolean; // Cannot be overridden
}

// Recurrence pattern for repeating events
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // For weekly recurrence
  endDate?: Date;
  exceptions?: Date[]; // Skip these dates
}

// Scheduling result
export interface SchedulingResult {
  success: boolean;
  suggestions: SchedulingSuggestion[];
  conflicts?: SchedulingConflict[];
  alternativeOptions?: TimeSlot[];
}

// Individual scheduling suggestion
export interface SchedulingSuggestion {
  slot: TimeSlot;
  score: number;
  reasoningText: string[];
  constraints: {
    satisfied: string[];
    violated: string[];
  };
  adjustments?: string[]; // What was adjusted to make this work
}

// Conflict information
export interface SchedulingConflict {
  type: 'overlap' | 'constraint' | 'preference';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedEvents?: Event[];
  resolutionOptions?: ConflictResolution[];
}

// Conflict resolution options
export interface ConflictResolution {
  type: 'reschedule' | 'split' | 'decline' | 'override';
  description: string;
  impact: string[];
  execute: () => Promise<void>;
}

// Rescheduling trigger
export interface RescheduleTrigger {
  type: 'conflict' | 'cancellation' | 'priority-change' | 'manual';
  sourceEvent?: Event;
  reason?: string;
  affectedRange?: TimeRange;
}

// Rescheduling result
export interface RescheduleResult {
  success: boolean;
  changes?: CalendarChange[];
  conflicts?: Event[];
  suggestions?: SchedulingSuggestion[];
}

// Calendar change representation
export interface CalendarChange {
  type: 'create' | 'update' | 'delete' | 'reschedule';
  event: Event | Partial<Event>;
  newTime?: TimeSlot;
  reason?: string;
}

// Negotiation result for conflicts
export interface NegotiationResult {
  success: boolean;
  accepted: CalendarChange[];
  rejected: CalendarChange[];
  pending: CalendarChange[];
  feedback?: string;
}

// Focus time request
export interface FocusTimeRequest {
  duration: number; // minutes
  type: 'deep-work' | 'shallow-work' | 'break';
  preferredTimes?: TimeRange[];
  recurring?: RecurrencePattern;
  flexibleScheduling?: boolean;
}

// Protected time result
export interface ProtectedTimeResult {
  protected: FocusBlock[];
  rescheduled: Event[];
  declined: Event[];
  conflicts: SchedulingConflict[];
}

// Productivity metrics for learning
export interface ProductivityMetrics {
  userId: string;
  date: Date;
  focusTime: number; // minutes
  meetingTime: number; // minutes
  breakTime: number; // minutes
  productivityScore: number; // 0-100
  completedTasks: number;
  missedEvents: number;
  reschedules: number;
}

// User productivity profile for AI learning
export interface UserProductivityProfile {
  userId: string;
  patterns: ProductivityPattern[];
  preferences: UserPreferences;
  energyProfile: EnergyProfile;
  historicalMetrics: ProductivityMetrics[];
  lastUpdated: Date;
}

// Productivity pattern detected by AI
export interface ProductivityPattern {
  type: string;
  description: string;
  frequency: number; // How often this pattern occurs
  impact: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
}
