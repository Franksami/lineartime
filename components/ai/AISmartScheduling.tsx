/**
 * AI Smart Scheduling Component
 *
 * Intelligent scheduling assistance with optimal time slot recommendations.
 * Integrates with design tokens, motion system, and accessibility standards.
 * Provides AI-powered scheduling suggestions with multi-provider support.
 *
 * @version Phase 5.0
 * @author LinearTime AI Enhancement System
 */

'use client';

import { useAIContext, useAISuggestions } from '@/contexts/AIContext';
import { useAccessibilityAAA } from '@/hooks/useAccessibilityAAA';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Globe,
  Lightbulb,
  MapPin,
  Minus,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  duration: number; // minutes
  score: number; // 0-1 AI confidence score
  reasons: string[];
  considerations: {
    attendee_availability: number; // 0-1
    time_zone_friendliness: number; // 0-1
    productivity_alignment: number; // 0-1
    travel_time_buffer: number; // 0-1
    focus_time_protection: number; // 0-1
    meeting_fatigue: number; // 0-1 (lower is better)
  };
  conflicts: Array<{
    type: 'partial_conflict' | 'travel_time' | 'back_to_back' | 'lunch_time';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  alternatives?: TimeSlot[];
}

export interface SchedulingPreferences {
  preferred_times: Array<{ start: number; end: number }>; // Hours (24-hour format)
  avoid_times: Array<{ start: number; end: number }>;
  max_meetings_per_day: number;
  preferred_meeting_duration: number; // minutes
  buffer_between_meetings: number; // minutes
  lunch_break: { start: number; end: number }; // Hours
  working_hours: { start: number; end: number }; // Hours
  time_zone: string;
  focus_time_blocks: Array<{ start: number; end: number; priority: 'high' | 'medium' | 'low' }>;
  travel_time_considerations: boolean;
  productivity_patterns: {
    morning_person: boolean;
    afternoon_person: boolean;
    evening_person: boolean;
  };
}

export interface SchedulingSuggestion {
  id: string;
  type:
    | 'optimal_time'
    | 'reschedule'
    | 'consolidate'
    | 'focus_time'
    | 'break_time'
    | 'travel_buffer';
  title: string;
  description: string;
  time_slot: TimeSlot;
  impact: {
    productivity_gain: number; // 0-1
    attendee_satisfaction: number; // 0-1
    schedule_efficiency: number; // 0-1
  };
  action_required: 'automatic' | 'user_approval' | 'manual';
  estimated_time_saved: number; // minutes
  confidence: number; // 0-1
}

interface AISmartSchedulingProps {
  // Scheduling Context
  events: Event[];
  timeRange: { start: Date; end: Date };
  requestedDuration?: number; // minutes
  attendees?: string[];

  // User Preferences
  preferences?: Partial<SchedulingPreferences>;
  workingHours?: { start: number; end: number };
  timeZone?: string;

  // AI Settings
  suggestionTypes?: Array<SchedulingSuggestion['type']>;
  maxSuggestions?: number;
  confidenceThreshold?: number; // 0-1
  enableLearning?: boolean;

  // Multi-provider Support
  providers?: Array<{
    id: string;
    name: string;
    events: Event[];
    availability: 'available' | 'limited' | 'unavailable';
  }>;

  // Interaction Callbacks
  onTimeSlotSelected?: (timeSlot: TimeSlot) => void;
  onSuggestionApplied?: (suggestion: SchedulingSuggestion) => void;
  onPreferencesUpdated?: (preferences: SchedulingPreferences) => void;

  // Display Options
  variant?: 'floating' | 'embedded' | 'modal';
  position?: 'top-right' | 'bottom-right' | 'center';
  showAdvancedOptions?: boolean;
  compactMode?: boolean;

  // Styling
  className?: string;
  theme?: 'light' | 'dark' | 'auto';

  // Accessibility
  reducedMotion?: boolean;
  announceChanges?: boolean;
}

// ==========================================
// Smart Scheduling Engine
// ==========================================

class SmartSchedulingEngine {
  private static readonly DEFAULT_PREFERENCES: SchedulingPreferences = {
    preferred_times: [
      { start: 9, end: 11 }, // Morning focus
      { start: 14, end: 16 }, // Afternoon collaboration
    ],
    avoid_times: [
      { start: 12, end: 13 }, // Lunch time
      { start: 17, end: 18 }, // End of day wrap-up
    ],
    max_meetings_per_day: 6,
    preferred_meeting_duration: 30,
    buffer_between_meetings: 15,
    lunch_break: { start: 12, end: 13 },
    working_hours: { start: 9, end: 17 },
    time_zone: 'UTC',
    focus_time_blocks: [{ start: 9, end: 11, priority: 'high' }],
    travel_time_considerations: true,
    productivity_patterns: {
      morning_person: true,
      afternoon_person: false,
      evening_person: false,
    },
  };

  static findOptimalTimeSlots(
    duration: number,
    events: Event[],
    timeRange: { start: Date; end: Date },
    preferences: Partial<SchedulingPreferences> = {},
    attendees: string[] = []
  ): TimeSlot[] {
    const prefs = { ...SmartSchedulingEngine.DEFAULT_PREFERENCES, ...preferences };
    const slots: TimeSlot[] = [];

    // Generate potential time slots (30-minute intervals)
    const slotInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
    const current = new Date(timeRange.start);

    while (current < timeRange.end) {
      const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

      if (slotEnd <= timeRange.end) {
        const slot = SmartSchedulingEngine.evaluateTimeSlot(
          current,
          slotEnd,
          events,
          prefs,
          attendees
        );

        if (slot.score > 0.3) {
          // Only include viable slots
          slots.push(slot);
        }
      }

      current.setTime(current.getTime() + slotInterval);
    }

    // Sort by score (best first) and return top candidates
    return slots.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private static evaluateTimeSlot(
    start: Date,
    end: Date,
    events: Event[],
    preferences: SchedulingPreferences,
    attendees: string[]
  ): TimeSlot {
    const id = `slot_${start.getTime()}_${end.getTime()}`;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    const considerations = {
      attendee_availability: SmartSchedulingEngine.calculateAttendeeAvailability(
        start,
        end,
        events,
        attendees
      ),
      time_zone_friendliness: SmartSchedulingEngine.calculateTimeZoneFriendliness(
        start,
        preferences.time_zone
      ),
      productivity_alignment: SmartSchedulingEngine.calculateProductivityAlignment(
        start,
        preferences
      ),
      travel_time_buffer: SmartSchedulingEngine.calculateTravelTimeBuffer(start, end, events),
      focus_time_protection: SmartSchedulingEngine.calculateFocusTimeProtection(
        start,
        end,
        preferences
      ),
      meeting_fatigue: SmartSchedulingEngine.calculateMeetingFatigue(start, events),
    };

    // Calculate overall score (weighted average)
    const weights = {
      attendee_availability: 0.3,
      time_zone_friendliness: 0.15,
      productivity_alignment: 0.25,
      travel_time_buffer: 0.1,
      focus_time_protection: 0.15,
      meeting_fatigue: 0.05,
    };

    const score = Object.entries(considerations).reduce((total, [key, value]) => {
      const weight = weights[key as keyof typeof weights];
      return total + value * weight;
    }, 0);

    const conflicts = SmartSchedulingEngine.detectSlotConflicts(start, end, events, preferences);
    const reasons = SmartSchedulingEngine.generateSlotReasons(considerations, preferences);

    return {
      id,
      start,
      end,
      duration,
      score,
      reasons,
      considerations,
      conflicts,
    };
  }

  private static calculateAttendeeAvailability(
    start: Date,
    end: Date,
    events: Event[],
    attendees: string[]
  ): number {
    if (attendees.length === 0) return 1.0;

    // Check for conflicts with existing events
    const conflictingEvents = events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return (
        start < eventEnd &&
        end > eventStart &&
        event.attendees?.some((attendee) => attendees.includes(attendee))
      );
    });

    return Math.max(0, 1 - conflictingEvents.length / attendees.length);
  }

  private static calculateTimeZoneFriendliness(start: Date, _timeZone: string): number {
    const hour = start.getHours();

    // Optimal hours for most time zones (9 AM - 4 PM)
    if (hour >= 9 && hour <= 16) return 1.0;
    if (hour >= 8 && hour <= 17) return 0.8;
    if (hour >= 7 && hour <= 18) return 0.6;

    return 0.3; // Early morning or evening
  }

  private static calculateProductivityAlignment(
    start: Date,
    preferences: SchedulingPreferences
  ): number {
    const hour = start.getHours();
    const { morning_person, afternoon_person, evening_person } = preferences.productivity_patterns;

    if (hour >= 8 && hour <= 11 && morning_person) return 1.0;
    if (hour >= 13 && hour <= 16 && afternoon_person) return 1.0;
    if (hour >= 16 && hour <= 18 && evening_person) return 1.0;

    // Check preferred times
    const isPreferredTime = preferences.preferred_times.some(
      (range) => hour >= range.start && hour <= range.end
    );

    if (isPreferredTime) return 0.9;

    // Check avoid times
    const isAvoidTime = preferences.avoid_times.some(
      (range) => hour >= range.start && hour <= range.end
    );

    if (isAvoidTime) return 0.2;

    return 0.6; // Neutral
  }

  private static calculateTravelTimeBuffer(start: Date, end: Date, events: Event[]): number {
    // Check for events before and after this slot
    const bufferTime = 15 * 60 * 1000; // 15 minutes

    const eventBefore = events.find((event) => {
      const eventEnd = new Date(event.endTime);
      return eventEnd > new Date(start.getTime() - bufferTime) && eventEnd <= start;
    });

    const eventAfter = events.find((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart >= end && eventStart < new Date(end.getTime() + bufferTime);
    });

    let score = 1.0;
    if (eventBefore?.location) score -= 0.3;
    if (eventAfter?.location) score -= 0.3;

    return Math.max(0, score);
  }

  private static calculateFocusTimeProtection(
    start: Date,
    _end: Date,
    preferences: SchedulingPreferences
  ): number {
    const hour = start.getHours();

    // Check if this time slot overlaps with focus time blocks
    const overlapsWithFocusTime = preferences.focus_time_blocks.some((block) => {
      return hour >= block.start && hour <= block.end && block.priority === 'high';
    });

    // Penalty for scheduling during high-priority focus time
    if (overlapsWithFocusTime) return 0.3;

    return 1.0;
  }

  private static calculateMeetingFatigue(start: Date, events: Event[]): number {
    // Count meetings on the same day
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const meetingsToday = events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfDay && eventDate <= endOfDay && event.type === 'meeting';
    });

    // Diminishing returns for meeting density
    const meetingCount = meetingsToday.length;
    if (meetingCount <= 3) return 1.0;
    if (meetingCount <= 5) return 0.8;
    if (meetingCount <= 7) return 0.6;

    return 0.4; // High fatigue
  }

  private static detectSlotConflicts(
    start: Date,
    end: Date,
    events: Event[],
    preferences: SchedulingPreferences
  ): TimeSlot['conflicts'] {
    const conflicts: TimeSlot['conflicts'] = [];

    // Check for overlapping events
    const overlappingEvents = events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return start < eventEnd && end > eventStart;
    });

    if (overlappingEvents.length > 0) {
      conflicts.push({
        type: 'partial_conflict',
        severity: 'high',
        description: `Conflicts with ${overlappingEvents.length} existing events`,
      });
    }

    // Check for lunch time conflicts
    const hour = start.getHours();
    if (hour >= preferences.lunch_break.start && hour <= preferences.lunch_break.end) {
      conflicts.push({
        type: 'lunch_time',
        severity: 'medium',
        description: 'Overlaps with lunch break',
      });
    }

    // Check for back-to-back meetings
    const prevEvent = events.find((event) => {
      const eventEnd = new Date(event.endTime);
      return Math.abs(eventEnd.getTime() - start.getTime()) < 15 * 60 * 1000; // Within 15 minutes
    });

    if (prevEvent) {
      conflicts.push({
        type: 'back_to_back',
        severity: 'low',
        description: 'Back-to-back meeting detected',
      });
    }

    return conflicts;
  }

  private static generateSlotReasons(
    considerations: TimeSlot['considerations'],
    _preferences: SchedulingPreferences
  ): string[] {
    const reasons: string[] = [];

    if (considerations.attendee_availability > 0.8) {
      reasons.push('High attendee availability');
    }

    if (considerations.productivity_alignment > 0.8) {
      reasons.push('Aligns with productivity patterns');
    }

    if (considerations.time_zone_friendliness > 0.8) {
      reasons.push('Optimal time zone coverage');
    }

    if (considerations.travel_time_buffer > 0.8) {
      reasons.push('Good buffer time for travel');
    }

    if (considerations.meeting_fatigue < 0.5) {
      reasons.push('Light meeting load');
    }

    if (reasons.length === 0) {
      reasons.push('Available time slot');
    }

    return reasons;
  }

  static generateSchedulingSuggestions(
    events: Event[],
    timeRange: { start: Date; end: Date },
    preferences: Partial<SchedulingPreferences> = {}
  ): SchedulingSuggestion[] {
    const suggestions: SchedulingSuggestion[] = [];

    // Suggestion 1: Optimal meeting consolidation
    const clusteredMeetings = SmartSchedulingEngine.findClusterableEvents(events);
    if (clusteredMeetings.length > 1) {
      suggestions.push({
        id: 'consolidate_meetings',
        type: 'consolidate',
        title: 'Consolidate Related Meetings',
        description: `Combine ${clusteredMeetings.length} related meetings to create focus blocks`,
        time_slot: {
          id: 'consolidated',
          start: new Date(
            Math.min(...clusteredMeetings.map((e) => new Date(e.startTime).getTime()))
          ),
          end: new Date(Math.max(...clusteredMeetings.map((e) => new Date(e.endTime).getTime()))),
          duration: 120,
          score: 0.85,
          reasons: ['Reduces context switching', 'Creates focused work blocks'],
          considerations: {
            attendee_availability: 0.9,
            time_zone_friendliness: 0.8,
            productivity_alignment: 0.9,
            travel_time_buffer: 1.0,
            focus_time_protection: 0.7,
            meeting_fatigue: 0.6,
          },
          conflicts: [],
        },
        impact: {
          productivity_gain: 0.8,
          attendee_satisfaction: 0.7,
          schedule_efficiency: 0.9,
        },
        action_required: 'user_approval',
        estimated_time_saved: 30,
        confidence: 0.85,
      });
    }

    // Suggestion 2: Focus time protection
    const focusTimeSlots = SmartSchedulingEngine.identifyFocusTimeOpportunities(
      events,
      timeRange,
      preferences
    );
    if (focusTimeSlots.length > 0) {
      const bestSlot = focusTimeSlots[0];
      suggestions.push({
        id: 'protect_focus_time',
        type: 'focus_time',
        title: 'Block Focus Time',
        description: 'Reserve 2-hour focus block during your most productive hours',
        time_slot: bestSlot,
        impact: {
          productivity_gain: 0.9,
          attendee_satisfaction: 0.8,
          schedule_efficiency: 0.8,
        },
        action_required: 'automatic',
        estimated_time_saved: 60,
        confidence: 0.9,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private static findClusterableEvents(events: Event[]): Event[] {
    // Simple implementation - find events with similar titles or attendees
    const clusters: Event[][] = [];

    for (const event of events) {
      const relatedEvents = events.filter(
        (e) =>
          e.id !== event.id &&
          (e.title.toLowerCase().includes(event.title.toLowerCase().split(' ')[0]) ||
            e.attendees?.some((attendee) => event.attendees?.includes(attendee)))
      );

      if (relatedEvents.length > 0) {
        clusters.push([event, ...relatedEvents]);
      }
    }

    return clusters.length > 0 ? clusters[0] : [];
  }

  private static identifyFocusTimeOpportunities(
    events: Event[],
    timeRange: { start: Date; end: Date },
    preferences: Partial<SchedulingPreferences>
  ): TimeSlot[] {
    const focusBlockDuration = 120; // 2 hours
    return SmartSchedulingEngine.findOptimalTimeSlots(
      focusBlockDuration,
      events,
      timeRange,
      preferences
    );
  }
}

// ==========================================
// Main Component
// ==========================================

export function AISmartScheduling({
  events,
  timeRange,
  requestedDuration = 60,
  attendees = [],
  preferences = {},
  workingHours = { start: 9, end: 17 },
  timeZone = 'UTC',
  suggestionTypes = ['optimal_time', 'reschedule', 'consolidate', 'focus_time'],
  maxSuggestions = 5,
  confidenceThreshold = 0.6,
  enableLearning = true,
  providers = [],
  onTimeSlotSelected,
  onSuggestionApplied,
  onPreferencesUpdated,
  variant = 'floating',
  position = 'top-right',
  showAdvancedOptions = false,
  compactMode = false,
  className,
  theme = 'auto',
  reducedMotion = false,
  announceChanges = true,
  ...props
}: AISmartSchedulingProps) {
  // Hooks
  const { tokens, resolveToken } = useDesignTokens();
  const { animate, choreography } = useMotionSystem();
  const { announceChange, createAriaLabel } = useAccessibilityAAA();
  const { playSound } = useSoundEffects();
  const { state: aiState, isFeatureEnabled } = useAIContext();
  const { addSuggestion } = useAISuggestions();

  // Local State
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTimeSlots, _setShowTimeSlots] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [userPreferences, _setUserPreferences] =
    useState<Partial<SchedulingPreferences>>(preferences);

  // Refs
  const analysisRef = useRef<NodeJS.Timeout | null>(null);

  // Check if smart scheduling is enabled
  const isEnabled = isFeatureEnabled('timeOptimization') && aiState.enabled;

  // Analyze and generate suggestions
  const analyzeSchedule = useCallback(async () => {
    if (!isEnabled || !events.length) return;

    setIsAnalyzing(true);

    try {
      // Find optimal time slots
      const optimalSlots = SmartSchedulingEngine.findOptimalTimeSlots(
        requestedDuration,
        events,
        timeRange,
        { ...userPreferences, working_hours: workingHours, time_zone: timeZone },
        attendees
      );

      setTimeSlots(optimalSlots);

      // Generate scheduling suggestions
      const generatedSuggestions = SmartSchedulingEngine.generateSchedulingSuggestions(
        events,
        timeRange,
        { ...userPreferences, working_hours: workingHours, time_zone: timeZone }
      );

      const filteredSuggestions = generatedSuggestions
        .filter((s) => suggestionTypes.includes(s.type))
        .filter((s) => s.confidence >= confidenceThreshold)
        .slice(0, maxSuggestions);

      setSuggestions(filteredSuggestions);

      if (announceChanges) {
        announceChange(
          `Found ${optimalSlots.length} optimal time slots and ${filteredSuggestions.length} AI suggestions`
        );
      }
    } catch (error) {
      console.error('Smart scheduling analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isEnabled,
    events,
    requestedDuration,
    timeRange,
    userPreferences,
    workingHours,
    timeZone,
    attendees,
    suggestionTypes,
    confidenceThreshold,
    maxSuggestions,
    announceChanges,
    announceChange,
  ]);

  // Auto-analyze on data changes
  useEffect(() => {
    if (analysisRef.current) {
      clearTimeout(analysisRef.current);
    }

    analysisRef.current = setTimeout(analyzeSchedule, 1000);

    return () => {
      if (analysisRef.current) {
        clearTimeout(analysisRef.current);
      }
    };
  }, [analyzeSchedule]);

  // Handle time slot selection
  const handleSlotSelection = useCallback(
    (slot: TimeSlot) => {
      setSelectedSlot(slot);
      onTimeSlotSelected?.(slot);

      if (announceChanges) {
        announceChange(`Selected time slot: ${slot.start.toLocaleString()}`);
      }

      playSound('success');
    },
    [onTimeSlotSelected, announceChanges, announceChange, playSound]
  );

  // Handle suggestion application
  const handleSuggestionApply = useCallback(
    async (suggestion: SchedulingSuggestion) => {
      try {
        // Add to AI suggestions context
        addSuggestion({
          id: suggestion.id,
          type: suggestion.type as any,
          title: suggestion.title,
          description: suggestion.description,
          confidence: suggestion.confidence,
          action: 'accept',
        });

        onSuggestionApplied?.(suggestion);

        if (announceChanges) {
          announceChange(`Applied suggestion: ${suggestion.title}`);
        }

        playSound('success');
      } catch (error) {
        console.error('Suggestion application error:', error);
        playSound('error');
      }
    },
    [addSuggestion, onSuggestionApplied, announceChanges, announceChange, playSound]
  );

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: choreography.transitions.smooth,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: choreography.transitions.quick,
    },
  };

  // Don't render if not enabled
  if (!isEnabled) return null;

  const containerClasses = cn(
    'ai-smart-scheduling bg-background border border-border rounded-lg shadow-lg',
    {
      'fixed z-50 max-w-sm': variant === 'floating',
      'top-4 right-4': variant === 'floating' && position === 'top-right',
      'bottom-4 right-4': variant === 'floating' && position === 'bottom-right',
      'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2':
        variant === 'floating' && position === 'center',
      'w-full': variant === 'embedded',
      'max-h-96 overflow-y-auto': compactMode,
    },
    className
  );

  return (
    <motion.div
      className={containerClasses}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full">
            {isAnalyzing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              >
                <Brain className="w-4 h-4" />
              </motion.div>
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-sm">AI Smart Scheduling</h3>
            <p className="text-xs text-muted-foreground">
              {isAnalyzing ? 'Analyzing optimal times...' : 'Intelligent scheduling assistance'}
            </p>
          </div>

          {variant === 'floating' && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Toggle suggestions"
            >
              {showSuggestions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {!isAnalyzing && (timeSlots.length > 0 || suggestions.length > 0) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>{timeSlots.length} optimal slots</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lightbulb className="w-3 h-3" />
              <span>{suggestions.length} AI suggestions</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <motion.div
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              />
              <p className="text-sm text-muted-foreground">Analyzing your schedule...</p>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">AI Suggestions</span>
              </div>

              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn('flex-shrink-0 p-1.5 rounded-full', {
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30':
                          suggestion.type === 'optimal_time',
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30':
                          suggestion.type === 'reschedule',
                        'bg-purple-100 text-purple-600 dark:bg-purple-900/30':
                          suggestion.type === 'consolidate',
                        'bg-green-100 text-green-600 dark:bg-green-900/30':
                          suggestion.type === 'focus_time',
                      })}
                    >
                      {suggestion.type === 'optimal_time' && <Target className="w-3 h-3" />}
                      {suggestion.type === 'reschedule' && <Calendar className="w-3 h-3" />}
                      {suggestion.type === 'consolidate' && <BarChart3 className="w-3 h-3" />}
                      {suggestion.type === 'focus_time' && <Shield className="w-3 h-3" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 rounded-full">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>

                      {/* Time Slot Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {suggestion.time_slot.start.toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {suggestion.time_slot.end.toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {suggestion.estimated_time_saved > 0 && (
                          <>
                            <Timer className="w-3 h-3" />
                            <span>Saves {suggestion.estimated_time_saved}min</span>
                          </>
                        )}
                      </div>

                      {/* Impact Indicators */}
                      <div className="flex items-center gap-3 text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span>
                            Productivity: {Math.round(suggestion.impact.productivity_gain * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-500" />
                          <span>
                            Satisfaction:{' '}
                            {Math.round(suggestion.impact.attendee_satisfaction * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSuggestionApply(suggestion)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Apply Suggestion
                    </button>

                    <button
                      onClick={() =>
                        setExpandedSuggestion(
                          expandedSuggestion === suggestion.id ? null : suggestion.id
                        )
                      }
                      className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedSuggestion === suggestion.id ? 'Less' : 'More'}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedSuggestion === suggestion.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-border"
                      >
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium">Reasons:</span>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                              {suggestion.time_slot.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          {suggestion.time_slot.conflicts.length > 0 && (
                            <div>
                              <span className="font-medium text-orange-600">Potential Issues:</span>
                              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                                {suggestion.time_slot.conflicts.map((conflict, i) => (
                                  <li
                                    key={i}
                                    className={cn({
                                      'text-red-600': conflict.severity === 'high',
                                      'text-orange-600': conflict.severity === 'medium',
                                      'text-yellow-600': conflict.severity === 'low',
                                    })}
                                  >
                                    {conflict.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optimal Time Slots */}
        <AnimatePresence>
          {showTimeSlots && timeSlots.length > 0 && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">Optimal Time Slots</span>
                <span className="text-xs text-muted-foreground">
                  ({requestedDuration}min duration)
                </span>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {timeSlots.slice(0, compactMode ? 3 : 6).map((slot, index) => (
                  <motion.button
                    key={slot.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSlotSelection(slot)}
                    className={cn(
                      'w-full text-left p-2 border border-border rounded hover:bg-muted transition-colors',
                      {
                        'ring-2 ring-primary': selectedSlot?.id === slot.id,
                      }
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        <div
                          className={cn('w-2 h-2 rounded-full', {
                            'bg-green-500': slot.score >= 0.8,
                            'bg-yellow-500': slot.score >= 0.6,
                            'bg-orange-500': slot.score >= 0.4,
                            'bg-red-500': slot.score < 0.4,
                          })}
                        />
                        <span className="font-medium text-sm">
                          {slot.start.toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex-1" />
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        {Math.round(slot.score * 100)}% match
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground truncate">
                      {slot.reasons.slice(0, 2).join(', ')}
                    </div>

                    {slot.conflicts.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600">
                          {slot.conflicts.length} potential issue
                          {slot.conflicts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isAnalyzing && timeSlots.length === 0 && suggestions.length === 0 && (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No optimal time slots found. Try adjusting your preferences or time range.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AISmartScheduling;
