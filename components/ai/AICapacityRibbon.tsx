/**
 * AI Capacity Ribbon Component
 *
 * Visual overlay showing calendar capacity levels across time periods.
 * Integrates with design tokens, motion system, and accessibility standards.
 * Provides real-time capacity analysis with AI-powered suggestions.
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
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

export interface CapacityLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  percentage: number;
  color: string;
  description: string;
  suggestions: string[];
  timeSlots: Array<{ start: Date; end: Date; events: Event[] }>;
}

export interface CapacityData {
  date: string;
  capacity: CapacityLevel;
  trends: {
    compared_to_yesterday: 'higher' | 'lower' | 'same';
    compared_to_last_week: 'higher' | 'lower' | 'same';
    trend_direction: 'increasing' | 'decreasing' | 'stable';
  };
  peak_hours: number[];
  available_slots: Array<{ start: Date; end: Date; duration: number }>;
  workload_distribution: {
    meetings: number;
    focus_time: number;
    breaks: number;
    travel: number;
  };
}

interface AICapacityRibbonProps {
  // Calendar Integration
  date: string;
  events: Event[];
  timeRange: { start: Date; end: Date };

  // Display Options
  position: 'top' | 'bottom' | 'overlay';
  height?: number;
  showDetails?: boolean;
  showTrends?: boolean;
  showSuggestions?: boolean;

  // Interactive Features
  onClick?: (data: CapacityData) => void;
  onSuggestionClick?: (suggestion: string) => void;

  // Styling
  className?: string;
  variant?: 'minimal' | 'detailed' | 'compact';

  // Performance
  updateInterval?: number; // milliseconds
  enableRealTimeUpdates?: boolean;

  // Accessibility
  ariaLabel?: string;
  reducedMotion?: boolean;
}

// ==========================================
// Capacity Calculation Engine
// ==========================================

class CapacityAnalyzer {
  static calculateCapacity(events: Event[], _date: string): CapacityLevel {
    if (!events || events.length === 0) {
      return {
        level: 'low',
        percentage: 0,
        color: 'var(--color-ai-capacity-low)',
        description: 'Completely available',
        suggestions: [
          'Perfect time to schedule important meetings',
          'Consider blocking focus time',
        ],
        timeSlots: [],
      };
    }

    // Calculate working hours (8 hours default)
    const workingMinutes = 8 * 60; // 480 minutes

    // Calculate total scheduled time
    const scheduledMinutes = events.reduce((total, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      return total + Math.max(0, duration);
    }, 0);

    const percentage = Math.min((scheduledMinutes / workingMinutes) * 100, 100);

    // Determine capacity level
    let level: CapacityLevel['level'];
    let color: string;
    let description: string;
    let suggestions: string[];

    if (percentage >= 90) {
      level = 'critical';
      color = 'var(--color-status-danger)';
      description = 'Overbooked - High stress risk';
      suggestions = [
        'Consider rescheduling non-essential meetings',
        'Block buffer time between meetings',
        'Delegate or decline optional commitments',
      ];
    } else if (percentage >= 70) {
      level = 'high';
      color = 'var(--color-status-warning)';
      description = 'Busy day - Limited flexibility';
      suggestions = [
        'Review meeting necessity and duration',
        'Consider async alternatives',
        'Schedule short breaks between sessions',
      ];
    } else if (percentage >= 40) {
      level = 'medium';
      color = 'var(--color-status-info)';
      description = 'Well-balanced schedule';
      suggestions = [
        'Good balance maintained',
        'Perfect for adding focused work time',
        'Consider scheduling team check-ins',
      ];
    } else {
      level = 'low';
      color = 'var(--color-status-success)';
      description = 'Light schedule - Great for deep work';
      suggestions = [
        'Excellent opportunity for deep work',
        'Consider taking on strategic projects',
        'Schedule time for learning and development',
      ];
    }

    return {
      level,
      percentage,
      color,
      description,
      suggestions,
      timeSlots: CapacityAnalyzer.generateTimeSlots(events),
    };
  }

  static generateTimeSlots(events: Event[]) {
    // Group events by time slots for visualization
    return events.map((event) => ({
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      events: [event],
    }));
  }

  static calculateTrends(
    _currentCapacity: number,
    _historicalData?: number[]
  ): CapacityData['trends'] {
    // Mock implementation - in real app this would use historical data
    return {
      compared_to_yesterday: Math.random() > 0.5 ? 'higher' : 'lower',
      compared_to_last_week: Math.random() > 0.5 ? 'higher' : 'lower',
      trend_direction:
        Math.random() > 0.66 ? 'increasing' : Math.random() > 0.33 ? 'decreasing' : 'stable',
    };
  }

  static findAvailableSlots(
    events: Event[],
    _workingHours = { start: 9, end: 17 }
  ): Array<{ start: Date; end: Date; duration: number }> {
    const availableSlots: Array<{ start: Date; end: Date; duration: number }> = [];

    // Sort events by start time
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Find gaps between events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEnd = new Date(sortedEvents[i].endTime);
      const nextStart = new Date(sortedEvents[i + 1].startTime);

      const gapDuration = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

      if (gapDuration >= 15) {
        // At least 15 minutes
        availableSlots.push({
          start: currentEnd,
          end: nextStart,
          duration: gapDuration,
        });
      }
    }

    return availableSlots;
  }
}

// ==========================================
// Main Component
// ==========================================

export function AICapacityRibbon({
  date,
  events,
  timeRange,
  position = 'overlay',
  height = 8,
  showDetails = true,
  showTrends = false,
  showSuggestions = false,
  onClick,
  onSuggestionClick,
  className,
  variant = 'detailed',
  updateInterval = 30000, // 30 seconds
  enableRealTimeUpdates = true,
  ariaLabel,
  reducedMotion = false,
  ...props
}: AICapacityRibbonProps) {
  // Hooks
  const { tokens, resolveToken } = useDesignTokens();
  const { animate, choreography } = useMotionSystem();
  const { announceChange, createAriaLabel } = useAccessibilityAAA();
  const { playSound } = useSoundEffects();
  const { state: aiState, isFeatureEnabled } = useAIContext();
  const { addSuggestion } = useAISuggestions();

  // Local State
  const [_capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, _setShowTooltip] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'updating' | 'complete'>('idle');

  // Refs
  const ribbonRef = useRef<HTMLDivElement>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if AI capacity feature is enabled
  const isEnabled = isFeatureEnabled('smartSuggestions') && aiState.enabled;

  // Calculate capacity data
  const capacity = useMemo(() => {
    if (!isEnabled || !events) return null;
    return CapacityAnalyzer.calculateCapacity(events, date);
  }, [events, date, isEnabled]);

  // Generate full capacity data
  const fullCapacityData = useMemo((): CapacityData | null => {
    if (!capacity) return null;

    return {
      date,
      capacity,
      trends: CapacityAnalyzer.calculateTrends(capacity.percentage),
      peak_hours: [9, 10, 14, 15], // Mock data - would be AI-generated
      available_slots: CapacityAnalyzer.findAvailableSlots(events),
      workload_distribution: {
        meetings: events.filter((e) => e.type === 'meeting').length,
        focus_time: events.filter((e) => e.category === 'focus').length,
        breaks: events.filter((e) => e.category === 'break').length,
        travel: events.filter((e) => e.category === 'travel').length,
      },
    };
  }, [capacity, date, events]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates || !isEnabled) return;

    const updateCapacity = () => {
      if (!capacity) return;

      setAnimationPhase('updating');
      setTimeout(() => {
        setCapacityData(fullCapacityData);
        setAnimationPhase('complete');

        // Add AI suggestions when capacity is critical
        if (capacity.level === 'critical' && capacity.suggestions.length > 0) {
          capacity.suggestions.forEach((suggestion, index) => {
            addSuggestion({
              id: `capacity_${date}_${index}`,
              type: 'optimal_time',
              title: 'Schedule Optimization',
              description: suggestion,
              confidence: 0.85,
              action: 'accept',
            });
          });

          playSound('notification');
        }

        setTimeout(() => setAnimationPhase('idle'), 1000);
      }, 500);
    };

    updateCapacity();
    updateTimerRef.current = setInterval(updateCapacity, updateInterval);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [
    capacity,
    fullCapacityData,
    enableRealTimeUpdates,
    isEnabled,
    updateInterval,
    addSuggestion,
    playSound,
    date,
  ]);

  // Handle interactions
  const handleClick = useCallback(() => {
    if (!fullCapacityData || !onClick) return;

    onClick(fullCapacityData);
    announceChange(`Capacity details opened for ${date}. Level: ${capacity?.level}`);
    playSound('success');
  }, [fullCapacityData, onClick, announceChange, date, capacity, playSound]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!onSuggestionClick) return;

      onSuggestionClick(suggestion);
      announceChange(`Applied suggestion: ${suggestion}`);
      playSound('success');
    },
    [onSuggestionClick, announceChange, playSound]
  );

  // Motion variants
  const ribbonVariants = {
    idle: {
      opacity: 1,
      scale: 1,
      transition: choreography.transitions.smooth,
    },
    updating: {
      opacity: 0.7,
      scale: 0.98,
      transition: choreography.transitions.quick,
    },
    complete: {
      opacity: 1,
      scale: 1,
      transition: choreography.transitions.bounce,
    },
  };

  const pulseVariants = {
    idle: { opacity: 0.6 },
    pulse: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      },
    },
  };

  // Don't render if not enabled or no capacity data
  if (!isEnabled || !capacity) return null;

  // Dynamic styling
  const ribbonStyles = {
    '--capacity-color': capacity.color,
    '--capacity-opacity': isHovered ? '0.9' : '0.7',
    '--capacity-height': `${height}px`,
  } as React.CSSProperties;

  const containerClasses = cn(
    'ai-capacity-ribbon',
    'relative flex items-center',
    'transition-all duration-300 ease-out',
    {
      'absolute top-0 left-0 right-0': position === 'top',
      'absolute bottom-0 left-0 right-0': position === 'bottom',
      'absolute inset-0 z-10 pointer-events-none': position === 'overlay',
      'cursor-pointer pointer-events-auto': onClick && position !== 'overlay',
      'opacity-50': reducedMotion,
    },
    className
  );

  const capacityIcon = {
    low: <CheckCircle className="w-3 h-3 text-green-500 /* TODO: Use semantic token */" />,
    medium: <Activity className="w-3 h-3 text-primary" />,
    high: <TrendingUp className="w-3 h-3 text-orange-500" />,
    critical: <AlertTriangle className="w-3 h-3 text-red-500 /* TODO: Use semantic token */" />,
  }[capacity.level];

  return (
    <motion.div
      ref={ribbonRef}
      className={containerClasses}
      style={ribbonStyles}
      variants={ribbonVariants}
      animate={animationPhase}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      aria-label={
        ariaLabel ||
        createAriaLabel(
          `Calendar capacity: ${capacity.level} at ${capacity.percentage}%. ${capacity.description}`
        )
      }
      role="button"
      tabIndex={onClick ? 0 : -1}
      {...props}
    >
      {/* Main Capacity Bar */}
      <div className="relative w-full h-full">
        {/* Background Track */}
        <div className="absolute inset-0 bg-gray-200 /* TODO: Use semantic token */ dark:bg-gray-800 /* TODO: Use semantic token */ rounded-full opacity-30" />

        {/* Capacity Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            backgroundColor: capacity.color,
            width: `${capacity.percentage}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${capacity.percentage}%` }}
          transition={choreography.transitions.smooth}
        >
          {/* Animated Pulse for Critical Level */}
          {capacity.level === 'critical' && !reducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: capacity.color }}
              variants={pulseVariants}
              animate="pulse"
            />
          )}
        </motion.div>

        {/* Capacity Details Overlay */}
        <AnimatePresence>
          {showDetails && (isHovered || showTooltip) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={choreography.transitions.quick}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-64">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  {capacityIcon}
                  <span className="font-medium text-sm">
                    {capacity.percentage.toFixed(0)}% Capacity
                  </span>
                  <div className="flex-1" />
                  {showTrends && fullCapacityData && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {fullCapacityData.trends.trend_direction === 'increasing' ? (
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                      ) : (
                        <Activity className="w-3 h-3 text-green-500 /* TODO: Use semantic token */" />
                      )}
                      <span>{fullCapacityData.trends.trend_direction}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mb-2">{capacity.description}</p>

                {/* Available Slots */}
                {fullCapacityData && fullCapacityData.available_slots.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Available Slots</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fullCapacityData.available_slots.slice(0, 2).map((slot, index) => (
                        <div key={index}>
                          {slot.start.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ({slot.duration.toFixed(0)} min)
                        </div>
                      ))}
                      {fullCapacityData.available_slots.length > 2 && (
                        <span className="italic">
                          +{fullCapacityData.available_slots.length - 2} more slots
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {showSuggestions && capacity.suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-purple-500 /* TODO: Use semantic token */" />
                      <span className="text-xs font-medium">AI Suggestions</span>
                    </div>
                    <div className="space-y-1">
                      {capacity.suggestions.slice(0, 2).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuggestionClick(suggestion);
                          }}
                          className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors block w-full p-1 rounded hover:bg-muted"
                        >
                          • {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Indicator */}
        {variant === 'compact' && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {capacityIcon}
            <span className="text-xs font-medium">{capacity.percentage.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Real-time Update Indicator */}
      {enableRealTimeUpdates && animationPhase === 'updating' && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </motion.div>
  );
}

// ==========================================
// Specialized Variants
// ==========================================

export function AICapacityRibbonMinimal(props: Omit<AICapacityRibbonProps, 'variant'>) {
  return (
    <AICapacityRibbon
      {...props}
      variant="minimal"
      height={4}
      showDetails={false}
      showSuggestions={false}
    />
  );
}

export function AICapacityRibbonCompact(props: Omit<AICapacityRibbonProps, 'variant'>) {
  return (
    <AICapacityRibbon
      {...props}
      variant="compact"
      height={6}
      showDetails={true}
      showSuggestions={false}
    />
  );
}

export function AICapacityRibbonDetailed(props: Omit<AICapacityRibbonProps, 'variant'>) {
  return (
    <AICapacityRibbon
      {...props}
      variant="detailed"
      height={12}
      showDetails={true}
      showTrends={true}
      showSuggestions={true}
    />
  );
}

export default AICapacityRibbon;
