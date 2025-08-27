/**
 * AI Conflict Detector Component
 *
 * Real-time calendar conflict detection with AI-powered resolution suggestions.
 * Integrates with design tokens, motion system, and accessibility standards.
 * Provides intelligent conflict resolution with multi-provider support.
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
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  RotateCcw,
  Scissors,
  Timer,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

export interface ConflictType {
  type:
    | 'time_overlap'
    | 'resource_conflict'
    | 'travel_time'
    | 'priority_clash'
    | 'attendee_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  color: string;
  description: string;
}

export interface ConflictAnalysis {
  id: string;
  type: ConflictType['type'];
  severity: ConflictType['severity'];
  events: Event[];
  details: {
    overlap_duration?: number; // minutes
    travel_time_needed?: number; // minutes
    conflicting_resources?: string[];
    conflicting_attendees?: string[];
    priority_difference?: number;
  };
  impact: {
    affected_attendees: number;
    schedule_disruption: 'minimal' | 'moderate' | 'significant' | 'severe';
    business_impact: 'low' | 'medium' | 'high' | 'critical';
  };
  detected_at: Date;
  ai_confidence: number; // 0-1
}

export interface ConflictResolution {
  id: string;
  type: 'reschedule' | 'shorten' | 'merge' | 'cancel' | 'split' | 'delegate';
  title: string;
  description: string;
  impact_assessment: {
    effort: 'low' | 'medium' | 'high';
    disruption: 'minimal' | 'moderate' | 'significant';
    success_probability: number; // 0-1
  };
  automated_action?: () => Promise<void>;
  manual_steps?: string[];
  estimated_time_savings: number; // minutes
  ai_recommendation_score: number; // 0-1
}

interface AIConflictDetectorProps {
  // Calendar Integration
  events: Event[];
  timeRange: { start: Date; end: Date };
  providers?: string[]; // Multi-provider conflict detection

  // Detection Settings
  detectionSensitivity: 'conservative' | 'balanced' | 'aggressive';
  autoDetect?: boolean;
  realTimeUpdates?: boolean;

  // Display Options
  showInline?: boolean;
  showFloating?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisibleConflicts?: number;

  // Interaction Callbacks
  onConflictDetected?: (conflict: ConflictAnalysis) => void;
  onResolutionApplied?: (resolution: ConflictResolution, conflict: ConflictAnalysis) => void;
  onConflictDismissed?: (conflictId: string) => void;

  // Styling
  className?: string;
  variant?: 'minimal' | 'detailed' | 'compact';
  theme?: 'light' | 'dark' | 'auto';

  // Performance
  analysisInterval?: number; // milliseconds
  enableNotifications?: boolean;

  // Accessibility
  announceConflicts?: boolean;
  reducedMotion?: boolean;
}

// ==========================================
// Conflict Detection Engine
// ==========================================

class ConflictDetectionEngine {
  static readonly CONFLICT_TYPES: Record<ConflictType['type'], ConflictType> = {
    time_overlap: {
      type: 'time_overlap',
      severity: 'high',
      icon: <Clock className="w-4 h-4" />,
      color: 'var(--color-status-danger)',
      description: 'Events overlap in time',
    },
    resource_conflict: {
      type: 'resource_conflict',
      severity: 'medium',
      icon: <MapPin className="w-4 h-4" />,
      color: 'var(--color-status-warning)',
      description: 'Same resource required by multiple events',
    },
    travel_time: {
      type: 'travel_time',
      severity: 'medium',
      icon: <ArrowRight className="w-4 h-4" />,
      color: 'var(--color-status-warning)',
      description: 'Insufficient travel time between locations',
    },
    priority_clash: {
      type: 'priority_clash',
      severity: 'low',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'var(--color-status-info)',
      description: 'High-priority events compete for time',
    },
    attendee_conflict: {
      type: 'attendee_conflict',
      severity: 'medium',
      icon: <Users className="w-4 h-4" />,
      color: 'var(--color-status-warning)',
      description: 'Attendees double-booked',
    },
  };

  static detectConflicts(
    events: Event[],
    sensitivity: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
  ): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    // Sort events by start time for efficient processing
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (let i = 0; i < sortedEvents.length; i++) {
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[j];

        const detectedConflicts = ConflictDetectionEngine.analyzeEventPair(
          event1,
          event2,
          sensitivity
        );
        conflicts.push(...detectedConflicts);
      }
    }

    return conflicts;
  }

  private static analyzeEventPair(
    event1: Event,
    event2: Event,
    _sensitivity: string
  ): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    // Time overlap detection
    if (ConflictDetectionEngine.hasTimeOverlap(start1, end1, start2, end2)) {
      const overlapDuration = ConflictDetectionEngine.calculateOverlapDuration(
        start1,
        end1,
        start2,
        end2
      );

      conflicts.push({
        id: `overlap_${event1.id}_${event2.id}`,
        type: 'time_overlap',
        severity: overlapDuration > 30 ? 'critical' : overlapDuration > 15 ? 'high' : 'medium',
        events: [event1, event2],
        details: { overlap_duration: overlapDuration },
        impact: ConflictDetectionEngine.assessImpact([event1, event2]),
        detected_at: new Date(),
        ai_confidence: 0.95,
      });
    }

    // Travel time conflict detection
    if (event1.location && event2.location && event1.location !== event2.location) {
      const travelTimeConflict = ConflictDetectionEngine.checkTravelTimeConflict(event1, event2);
      if (travelTimeConflict) {
        conflicts.push(travelTimeConflict);
      }
    }

    // Attendee conflict detection
    if (ConflictDetectionEngine.hasAttendeeOverlap(event1, event2)) {
      conflicts.push({
        id: `attendee_${event1.id}_${event2.id}`,
        type: 'attendee_conflict',
        severity: 'medium',
        events: [event1, event2],
        details: {
          conflicting_attendees: ConflictDetectionEngine.getCommonAttendees(event1, event2),
        },
        impact: ConflictDetectionEngine.assessImpact([event1, event2]),
        detected_at: new Date(),
        ai_confidence: 0.85,
      });
    }

    // Resource conflict detection
    const resourceConflict = ConflictDetectionEngine.checkResourceConflict(event1, event2);
    if (resourceConflict) {
      conflicts.push(resourceConflict);
    }

    return conflicts;
  }

  private static hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  private static calculateOverlapDuration(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
    return Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
  }

  private static checkTravelTimeConflict(event1: Event, event2: Event): ConflictAnalysis | null {
    // Mock travel time calculation - in real app would use mapping API
    const estimatedTravelTime = 30; // minutes

    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const availableTime = (start2.getTime() - end1.getTime()) / (1000 * 60);

    if (availableTime < estimatedTravelTime) {
      return {
        id: `travel_${event1.id}_${event2.id}`,
        type: 'travel_time',
        severity: availableTime < 15 ? 'high' : 'medium',
        events: [event1, event2],
        details: {
          travel_time_needed: estimatedTravelTime,
        },
        impact: ConflictDetectionEngine.assessImpact([event1, event2]),
        detected_at: new Date(),
        ai_confidence: 0.75,
      };
    }

    return null;
  }

  private static hasAttendeeOverlap(event1: Event, event2: Event): boolean {
    const attendees1 = event1.attendees || [];
    const attendees2 = event2.attendees || [];
    return attendees1.some((attendee) => attendees2.includes(attendee));
  }

  private static getCommonAttendees(event1: Event, event2: Event): string[] {
    const attendees1 = event1.attendees || [];
    const attendees2 = event2.attendees || [];
    return attendees1.filter((attendee) => attendees2.includes(attendee));
  }

  private static checkResourceConflict(event1: Event, event2: Event): ConflictAnalysis | null {
    // Mock resource conflict detection
    const room1 = event1.location;
    const room2 = event2.location;

    if (room1 && room2 && room1 === room2) {
      return {
        id: `resource_${event1.id}_${event2.id}`,
        type: 'resource_conflict',
        severity: 'medium',
        events: [event1, event2],
        details: {
          conflicting_resources: [room1],
        },
        impact: ConflictDetectionEngine.assessImpact([event1, event2]),
        detected_at: new Date(),
        ai_confidence: 0.9,
      };
    }

    return null;
  }

  private static assessImpact(events: Event[]): ConflictAnalysis['impact'] {
    const totalAttendees = events.reduce((sum, event) => sum + (event.attendees?.length || 0), 0);

    return {
      affected_attendees: totalAttendees,
      schedule_disruption:
        totalAttendees > 10
          ? 'severe'
          : totalAttendees > 5
            ? 'significant'
            : totalAttendees > 2
              ? 'moderate'
              : 'minimal',
      business_impact: events.some((e) => e.priority === 'high') ? 'high' : 'medium',
    };
  }

  static generateResolutions(conflict: ConflictAnalysis): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];

    switch (conflict.type) {
      case 'time_overlap':
        resolutions.push(
          {
            id: `reschedule_${conflict.id}`,
            type: 'reschedule',
            title: 'Reschedule Later Event',
            description: `Move "${conflict.events[1].title}" to next available slot`,
            impact_assessment: {
              effort: 'medium',
              disruption: 'moderate',
              success_probability: 0.85,
            },
            estimated_time_savings: conflict.details.overlap_duration || 0,
            ai_recommendation_score: 0.9,
            manual_steps: [
              'Notify all attendees',
              'Find alternative time slot',
              'Update calendar invitations',
            ],
          },
          {
            id: `shorten_${conflict.id}`,
            type: 'shorten',
            title: 'Shorten First Event',
            description: `Reduce "${conflict.events[0].title}" duration to eliminate overlap`,
            impact_assessment: {
              effort: 'low',
              disruption: 'minimal',
              success_probability: 0.7,
            },
            estimated_time_savings: (conflict.details.overlap_duration || 0) / 2,
            ai_recommendation_score: 0.75,
          }
        );
        break;

      case 'travel_time':
        resolutions.push({
          id: `buffer_${conflict.id}`,
          type: 'reschedule',
          title: 'Add Travel Buffer',
          description: `Reschedule second meeting to allow ${conflict.details.travel_time_needed} minutes travel time`,
          impact_assessment: {
            effort: 'medium',
            disruption: 'moderate',
            success_probability: 0.8,
          },
          estimated_time_savings: 0,
          ai_recommendation_score: 0.85,
        });
        break;

      case 'attendee_conflict':
        resolutions.push({
          id: `delegate_${conflict.id}`,
          type: 'delegate',
          title: 'Delegate Attendance',
          description: 'Have conflicted attendees send representatives',
          impact_assessment: {
            effort: 'low',
            disruption: 'minimal',
            success_probability: 0.6,
          },
          estimated_time_savings: 30,
          ai_recommendation_score: 0.7,
        });
        break;

      default:
        resolutions.push({
          id: `generic_${conflict.id}`,
          type: 'reschedule',
          title: 'Smart Reschedule',
          description: 'AI will find the optimal time to resolve this conflict',
          impact_assessment: {
            effort: 'medium',
            disruption: 'moderate',
            success_probability: 0.75,
          },
          estimated_time_savings: 15,
          ai_recommendation_score: 0.8,
        });
    }

    return resolutions.sort((a, b) => b.ai_recommendation_score - a.ai_recommendation_score);
  }
}

// ==========================================
// Main Component
// ==========================================

export function AIConflictDetector({
  events,
  timeRange,
  providers = [],
  detectionSensitivity = 'balanced',
  autoDetect = true,
  realTimeUpdates = true,
  showInline = false,
  showFloating = true,
  position = 'top-right',
  maxVisibleConflicts = 3,
  onConflictDetected,
  onResolutionApplied,
  onConflictDismissed,
  className,
  variant = 'detailed',
  theme = 'auto',
  analysisInterval = 5000, // 5 seconds
  enableNotifications = true,
  announceConflicts = true,
  reducedMotion = false,
  ...props
}: AIConflictDetectorProps) {
  // Hooks
  const { tokens, resolveToken } = useDesignTokens();
  const { animate, choreography } = useMotionSystem();
  const { announceChange, createAriaLabel } = useAccessibilityAAA();
  const { playSound } = useSoundEffects();
  const { state: aiState, isFeatureEnabled } = useAIContext();
  const { addSuggestion } = useAISuggestions();

  // Local State
  const [conflicts, setConflicts] = useState<ConflictAnalysis[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictAnalysis | null>(null);
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResolutionPanel, setShowResolutionPanel] = useState(false);
  const [_expandedConflicts, _setExpandedConflicts] = useState<Set<string>>(new Set());

  // Refs
  const analyzerRef = useRef<NodeJS.Timeout | null>(null);
  const conflictRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Check if conflict detection is enabled
  const isEnabled = isFeatureEnabled('conflictDetection') && aiState.enabled;

  // Detect conflicts
  const detectConflicts = useCallback(async () => {
    if (!isEnabled || !events || events.length < 2) {
      setConflicts([]);
      return;
    }

    setIsAnalyzing(true);

    try {
      const detectedConflicts = ConflictDetectionEngine.detectConflicts(
        events,
        detectionSensitivity
      );

      const newConflicts = detectedConflicts.filter(
        (conflict) => !conflicts.some((existing) => existing.id === conflict.id)
      );

      if (newConflicts.length > 0) {
        setConflicts((prev) => [...prev, ...newConflicts]);

        // Announce new conflicts
        if (announceConflicts) {
          newConflicts.forEach((conflict) => {
            announceChange(
              `Calendar conflict detected: ${conflict.type.replace('_', ' ')} between ${conflict.events.map((e) => e.title).join(' and ')}`
            );
          });
        }

        // Play notification sound
        if (
          enableNotifications &&
          newConflicts.some((c) => c.severity === 'critical' || c.severity === 'high')
        ) {
          playSound('notification');
        }

        // Trigger callback
        newConflicts.forEach((conflict) => {
          onConflictDetected?.(conflict);
        });
      }
    } catch (error) {
      console.error('Conflict detection error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    events,
    isEnabled,
    detectionSensitivity,
    conflicts,
    announceConflicts,
    enableNotifications,
    announceChange,
    playSound,
    onConflictDetected,
  ]);

  // Auto-detect conflicts
  useEffect(() => {
    if (!autoDetect || !realTimeUpdates) return;

    detectConflicts();

    analyzerRef.current = setInterval(detectConflicts, analysisInterval);

    return () => {
      if (analyzerRef.current) {
        clearInterval(analyzerRef.current);
      }
    };
  }, [autoDetect, realTimeUpdates, detectConflicts, analysisInterval]);

  // Handle conflict selection
  const handleConflictClick = useCallback(
    (conflict: ConflictAnalysis) => {
      setSelectedConflict(conflict);
      setResolutions(ConflictDetectionEngine.generateResolutions(conflict));
      setShowResolutionPanel(true);

      announceChange(`Selected conflict: ${conflict.type.replace('_', ' ')}`);
    },
    [announceChange]
  );

  // Handle resolution application
  const handleResolutionApply = useCallback(
    async (resolution: ConflictResolution) => {
      if (!selectedConflict) return;

      try {
        // Execute automated action if available
        if (resolution.automated_action) {
          await resolution.automated_action();
        }

        // Remove resolved conflict
        setConflicts((prev) => prev.filter((c) => c.id !== selectedConflict.id));
        setShowResolutionPanel(false);
        setSelectedConflict(null);

        // Add to AI suggestions for tracking
        addSuggestion({
          id: `resolved_${resolution.id}`,
          type: 'conflict_resolution',
          title: resolution.title,
          description: `Applied: ${resolution.description}`,
          confidence: resolution.ai_recommendation_score,
          action: 'accept',
        });

        // Announce resolution
        announceChange(`Applied resolution: ${resolution.title}`);
        playSound('success');

        // Trigger callback
        onResolutionApplied?.(resolution, selectedConflict);
      } catch (error) {
        console.error('Resolution application error:', error);
        playSound('error');
      }
    },
    [selectedConflict, addSuggestion, announceChange, playSound, onResolutionApplied]
  );

  // Handle conflict dismissal
  const handleConflictDismiss = useCallback(
    (conflictId: string) => {
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

      if (selectedConflict?.id === conflictId) {
        setSelectedConflict(null);
        setShowResolutionPanel(false);
      }

      announceChange('Conflict dismissed');
      onConflictDismissed?.(conflictId);
    },
    [selectedConflict, announceChange, onConflictDismissed]
  );

  // Motion variants
  const conflictVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: choreography.transitions.smooth,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: 100,
      transition: choreography.transitions.quick,
    },
  };

  const shakeVariant = {
    shake: {
      x: [-2, 2, -2, 2, 0],
      transition: { duration: 0.4 },
    },
  };

  // Don't render if not enabled or no conflicts
  if (!isEnabled || conflicts.length === 0) return null;

  const visibleConflicts = conflicts.slice(0, maxVisibleConflicts).sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const containerClasses = cn(
    'ai-conflict-detector',
    'fixed z-50 max-w-sm',
    {
      'top-4 right-4': position === 'top-right',
      'top-4 left-4': position === 'top-left',
      'bottom-4 right-4': position === 'bottom-right',
      'bottom-4 left-4': position === 'bottom-left',
      'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2': position === 'center',
      'pointer-events-none': !showFloating,
    },
    className
  );

  return (
    <>
      {/* Floating Conflict Indicators */}
      {showFloating && (
        <div className={containerClasses}>
          <AnimatePresence>
            {visibleConflicts.map((conflict) => {
              const conflictType = ConflictDetectionEngine.CONFLICT_TYPES[conflict.type];

              return (
                <motion.div
                  key={conflict.id}
                  ref={(el) => {
                    if (el) conflictRefs.current.set(conflict.id, el);
                  }}
                  variants={conflictVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    'bg-background border border-border rounded-lg shadow-lg p-3 mb-2',
                    'cursor-pointer hover:shadow-xl transition-shadow',
                    'pointer-events-auto'
                  )}
                  onClick={() => handleConflictClick(conflict)}
                  whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                  whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
                >
                  {/* Conflict Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn('flex-shrink-0 p-1.5 rounded-full', {
                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400':
                          conflict.severity === 'critical',
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400':
                          conflict.severity === 'high',
                        'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400':
                          conflict.severity === 'medium',
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400':
                          conflict.severity === 'low',
                      })}
                    >
                      {conflictType.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{conflictType.description}</h4>

                        {conflict.severity === 'critical' && !reducedMotion && (
                          <motion.div
                            variants={shakeVariant}
                            animate="shake"
                            className="text-red-500"
                          >
                            <AlertCircle className="w-3 h-3" />
                          </motion.div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mb-2">
                        <div className="truncate">
                          {conflict.events.map((e) => e.title).join(' & ')}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Timer className="w-3 h-3" />
                          <span>
                            {conflict.detected_at.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex-1" />
                          <Brain className="w-3 h-3" />
                          <span>{Math.round(conflict.ai_confidence * 100)}%</span>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{conflict.impact.affected_attendees} affected</span>
                        </div>
                        {conflict.details.overlap_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{conflict.details.overlap_duration}min overlap</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConflictDismiss(conflict.id);
                      }}
                      className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Dismiss conflict"
                    >
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Analysis Indicator */}
          {isAnalyzing && (
            <motion.div
              className="bg-background border border-border rounded-lg shadow-lg p-2 mb-2 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                >
                  <Zap className="w-4 h-4 text-purple-500" />
                </motion.div>
                <span className="text-muted-foreground">Analyzing conflicts...</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Resolution Panel */}
      <AnimatePresence>
        {showResolutionPanel && selectedConflict && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowResolutionPanel(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative bg-background border border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                    {ConflictDetectionEngine.CONFLICT_TYPES[selectedConflict.type].icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Resolve {selectedConflict.type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered conflict resolution options
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResolutionPanel(false)}
                    className="p-2 hover:bg-muted rounded transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Conflict Details */}
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Conflict Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Events:</strong>{' '}
                      {selectedConflict.events.map((e) => e.title).join(', ')}
                    </div>
                    <div>
                      <strong>Severity:</strong>
                      <span
                        className={cn('ml-2 px-2 py-1 rounded-full text-xs', {
                          'bg-red-100 text-red-800': selectedConflict.severity === 'critical',
                          'bg-orange-100 text-orange-800': selectedConflict.severity === 'high',
                          'bg-yellow-100 text-yellow-800': selectedConflict.severity === 'medium',
                          'bg-blue-100 text-blue-800': selectedConflict.severity === 'low',
                        })}
                      >
                        {selectedConflict.severity}
                      </span>
                    </div>
                    <div>
                      <strong>Impact:</strong> {selectedConflict.impact.affected_attendees}{' '}
                      attendees, {selectedConflict.impact.business_impact} business impact
                    </div>
                  </div>
                </div>

                {/* Resolution Options */}
                <div className="space-y-3">
                  <h4 className="font-medium">Resolution Options</h4>
                  {resolutions.map((resolution) => (
                    <div
                      key={resolution.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium">{resolution.title}</h5>
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {Math.round(resolution.ai_recommendation_score * 100)}% match
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {resolution.description}
                          </p>

                          {/* Impact Assessment */}
                          <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                            <div>
                              <span className="font-medium">Effort:</span>{' '}
                              {resolution.impact_assessment.effort}
                            </div>
                            <div>
                              <span className="font-medium">Disruption:</span>{' '}
                              {resolution.impact_assessment.disruption}
                            </div>
                            <div>
                              <span className="font-medium">Success:</span>{' '}
                              {Math.round(resolution.impact_assessment.success_probability * 100)}%
                            </div>
                          </div>

                          {resolution.manual_steps && (
                            <div className="mb-3">
                              <p className="text-xs font-medium mb-1">Manual steps required:</p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                {resolution.manual_steps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleResolutionApply(resolution)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIConflictDetector;
