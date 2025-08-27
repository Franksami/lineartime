'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types/calendar';
import {
  differenceInMinutes,
  endOfDay,
  format,
  getHours,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  startOfDay,
} from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Info,
  Lightbulb,
  Shield,
  Target,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  category: 'time' | 'overlap' | 'duration' | 'availability' | 'productivity' | 'capacity';
  validate: (event: Partial<Event>, existingEvents: Event[]) => ConstraintResult;
  icon: React.ComponentType<{ className?: string }>;
  autoFix?: (event: Partial<Event>, existingEvents: Event[]) => Partial<Event>;
}

export interface ConstraintResult {
  isValid: boolean;
  message: string;
  details?: string;
  suggestedFix?: string;
  conflictingEvents?: Event[];
}

export interface ConstraintSystemProps {
  event: Partial<Event>;
  existingEvents: Event[];
  rules?: BusinessRule[];
  onAutoFix?: (fixedEvent: Partial<Event>) => void;
  showSuggestions?: boolean;
  compactMode?: boolean;
}

// Predefined business rules for event scheduling
const DEFAULT_BUSINESS_RULES: BusinessRule[] = [
  {
    id: 'no-past-events',
    name: 'No Past Events',
    description: 'Events cannot be scheduled in the past',
    severity: 'error',
    category: 'time',
    icon: Clock,
    validate: (event) => {
      if (!event.startDate) {
        return { isValid: true, message: '' };
      }

      const isPast = isBefore(event.startDate, new Date());
      return {
        isValid: !isPast,
        message: isPast ? 'Event cannot be scheduled in the past' : 'Valid time',
        suggestedFix: isPast ? 'Schedule for a future time' : undefined,
      };
    },
    autoFix: (event) => ({
      ...event,
      startDate: new Date(),
      endDate:
        event.endDate && isBefore(event.endDate, new Date())
          ? new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
          : event.endDate,
    }),
  },

  {
    id: 'overlap-detection',
    name: 'Overlap Detection',
    description: 'Detect scheduling conflicts with existing events',
    severity: 'warning',
    category: 'overlap',
    icon: Users,
    validate: (event, existingEvents) => {
      if (!event.startDate || !event.endDate) {
        return { isValid: true, message: '' };
      }

      const conflicts = existingEvents.filter((existing) => {
        if (existing.id === event.id) return false; // Skip self

        return (
          (isAfter(event.startDate!, existing.startDate) &&
            isBefore(event.startDate!, existing.endDate)) ||
          (isAfter(event.endDate!, existing.startDate) &&
            isBefore(event.endDate!, existing.endDate)) ||
          (isBefore(event.startDate!, existing.startDate) &&
            isAfter(event.endDate!, existing.endDate)) ||
          event.startDate?.getTime() === existing.startDate.getTime()
        );
      });

      return {
        isValid: conflicts.length === 0,
        message:
          conflicts.length === 0
            ? 'No conflicts detected'
            : `Conflicts with ${conflicts.length} existing event${conflicts.length > 1 ? 's' : ''}`,
        conflictingEvents: conflicts,
        details:
          conflicts.length > 0
            ? conflicts
                .map(
                  (c) => `• ${c.title} (${format(c.startDate, 'p')} - ${format(c.endDate, 'p')})`
                )
                .join('\n')
            : undefined,
        suggestedFix: conflicts.length > 0 ? 'Move to a different time slot' : undefined,
      };
    },
  },

  {
    id: 'minimum-duration',
    name: 'Minimum Duration',
    description: 'Events should be at least 15 minutes long',
    severity: 'warning',
    category: 'duration',
    icon: Target,
    validate: (event) => {
      if (!event.startDate || !event.endDate) {
        return { isValid: true, message: '' };
      }

      const duration = differenceInMinutes(event.endDate, event.startDate);
      return {
        isValid: duration >= 15,
        message:
          duration >= 15
            ? `Duration: ${duration} minutes`
            : `Duration too short: ${duration} minutes`,
        suggestedFix: duration < 15 ? 'Extend event to at least 15 minutes' : undefined,
      };
    },
    autoFix: (event) => {
      if (!event.startDate || !event.endDate) return event;

      const duration = differenceInMinutes(event.endDate, event.startDate);
      if (duration < 15) {
        return {
          ...event,
          endDate: new Date(event.startDate.getTime() + 15 * 60 * 1000),
        };
      }
      return event;
    },
  },

  {
    id: 'maximum-duration',
    name: 'Maximum Duration',
    description: 'Events should not exceed 8 hours',
    severity: 'warning',
    category: 'duration',
    icon: Shield,
    validate: (event) => {
      if (!event.startDate || !event.endDate) {
        return { isValid: true, message: '' };
      }

      const duration = differenceInMinutes(event.endDate, event.startDate);
      const maxDuration = 8 * 60; // 8 hours

      return {
        isValid: duration <= maxDuration,
        message:
          duration <= maxDuration
            ? `Duration: ${Math.round((duration / 60) * 10) / 10} hours`
            : `Duration too long: ${Math.round((duration / 60) * 10) / 10} hours`,
        suggestedFix:
          duration > maxDuration ? 'Consider splitting into multiple events' : undefined,
      };
    },
  },

  {
    id: 'work-hours',
    name: 'Work Hours Preference',
    description: 'Suggest scheduling during typical work hours (9 AM - 5 PM)',
    severity: 'suggestion',
    category: 'productivity',
    icon: Lightbulb,
    validate: (event) => {
      if (!event.startDate) {
        return { isValid: true, message: '' };
      }

      const hour = getHours(event.startDate);
      const isWorkHours = hour >= 9 && hour <= 17;

      return {
        isValid: true, // This is just a suggestion
        message: isWorkHours
          ? 'Scheduled during work hours'
          : 'Scheduled outside typical work hours',
        details: isWorkHours
          ? undefined
          : 'Consider scheduling between 9 AM - 5 PM for better productivity',
      };
    },
  },

  {
    id: 'weekend-warning',
    name: 'Weekend Schedule',
    description: 'Alert when scheduling events on weekends',
    severity: 'info',
    category: 'availability',
    icon: Calendar,
    validate: (event) => {
      if (!event.startDate) {
        return { isValid: true, message: '' };
      }

      const isWeekendDay = isWeekend(event.startDate);

      return {
        isValid: true, // Just informational
        message: isWeekendDay ? 'Scheduled on weekend' : 'Scheduled on weekday',
        details: isWeekendDay ? 'Weekend scheduling detected' : undefined,
      };
    },
  },

  {
    id: 'end-before-start',
    name: 'End Before Start',
    description: 'End date must be after start date',
    severity: 'error',
    category: 'time',
    icon: XCircle,
    validate: (event) => {
      if (!event.startDate || !event.endDate) {
        return { isValid: true, message: '' };
      }

      const isValid =
        isAfter(event.endDate, event.startDate) ||
        event.startDate.getTime() === event.endDate.getTime();

      return {
        isValid,
        message: isValid ? 'Valid date range' : 'End date must be after start date',
        suggestedFix: !isValid ? 'Set end date after start date' : undefined,
      };
    },
    autoFix: (event) => {
      if (!event.startDate || !event.endDate) return event;

      if (isBefore(event.endDate, event.startDate)) {
        return {
          ...event,
          endDate: new Date(event.startDate.getTime() + 60 * 60 * 1000), // 1 hour after start
        };
      }
      return event;
    },
  },

  {
    id: 'capacity-check',
    name: 'Daily Capacity',
    description: 'Warn when scheduling more than 8 hours per day',
    severity: 'warning',
    category: 'capacity',
    icon: Zap,
    validate: (event, existingEvents) => {
      if (!event.startDate || !event.endDate) {
        return { isValid: true, message: '' };
      }

      // Find events on the same day
      const sameDay = existingEvents.filter(
        (existing) => existing.id !== event.id && isSameDay(existing.startDate, event.startDate!)
      );

      // Calculate total duration for the day
      const eventDuration = differenceInMinutes(event.endDate, event.startDate);
      const existingDuration = sameDay.reduce(
        (total, existing) => total + differenceInMinutes(existing.endDate, existing.startDate),
        0
      );

      const totalDuration = eventDuration + existingDuration;
      const maxDailyCapacity = 8 * 60; // 8 hours

      return {
        isValid: totalDuration <= maxDailyCapacity,
        message:
          totalDuration <= maxDailyCapacity
            ? `Daily schedule: ${Math.round((totalDuration / 60) * 10) / 10} hours`
            : `Overbooked day: ${Math.round((totalDuration / 60) * 10) / 10} hours`,
        details:
          totalDuration > maxDailyCapacity
            ? `Exceeds recommended daily capacity of 8 hours by ${Math.round(((totalDuration - maxDailyCapacity) / 60) * 10) / 10} hours`
            : undefined,
        suggestedFix:
          totalDuration > maxDailyCapacity ? 'Consider rescheduling to another day' : undefined,
      };
    },
  },
];

// Icon mapping for constraint results
const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    textColor: 'text-destructive',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    badgeVariant: 'secondary' as const,
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    badgeVariant: 'outline' as const,
  },
  suggestion: {
    icon: Lightbulb,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    badgeVariant: 'secondary' as const,
  },
};

export function ConstraintSystem({
  event,
  existingEvents,
  rules = DEFAULT_BUSINESS_RULES,
  onAutoFix,
  showSuggestions = true,
  compactMode = false,
}: ConstraintSystemProps) {
  // Validate event against all rules
  const validationResults = useMemo(() => {
    return rules
      .map((rule) => ({
        rule,
        result: rule.validate(event, existingEvents),
      }))
      .filter(
        ({ result }) =>
          result.message && (!compactMode || result.severity === 'error' || !result.isValid)
      );
  }, [event, existingEvents, rules, compactMode]);

  // Group results by severity
  const groupedResults = useMemo(() => {
    return validationResults.reduce(
      (acc, { rule, result }) => {
        if (!acc[rule.severity]) {
          acc[rule.severity] = [];
        }
        acc[rule.severity].push({ rule, result });
        return acc;
      },
      {} as Record<string, Array<{ rule: BusinessRule; result: ConstraintResult }>>
    );
  }, [validationResults]);

  // Get overall status
  const overallStatus = useMemo(() => {
    const hasErrors = groupedResults.error?.length > 0;
    const hasWarnings = groupedResults.warning?.length > 0;

    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'valid';
  }, [groupedResults]);

  // Handle auto-fix
  const handleAutoFix = useCallback(
    (rule: BusinessRule) => {
      if (rule.autoFix && onAutoFix) {
        const fixedEvent = rule.autoFix(event, existingEvents);
        onAutoFix(fixedEvent);
      }
    },
    [event, existingEvents, onAutoFix]
  );

  if (validationResults.length === 0) {
    return compactMode ? null : (
      <Card className="border-green-200 dark:border-green-800/20 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">All constraints satisfied</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Status */}
      {!compactMode && (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              overallStatus === 'error'
                ? 'destructive'
                : overallStatus === 'warning'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {overallStatus === 'error'
              ? 'Issues Found'
              : overallStatus === 'warning'
                ? 'Warnings'
                : 'Valid'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {validationResults.length} constraint{validationResults.length !== 1 ? 's' : ''}{' '}
            evaluated
          </span>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-2">
        {Object.entries(groupedResults).map(([severity, results]) => {
          const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];

          return results.map(({ rule, result }, index) => {
            const IconComponent = config.icon;
            const RuleIcon = rule.icon;

            return (
              <Alert
                key={`${severity}-${index}`}
                className={`${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <IconComponent className={`h-4 w-4 ${config.textColor}`} />
                    <RuleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <AlertDescription className="mb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.message}</span>
                        {rule.autoFix && !result.isValid && onAutoFix && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAutoFix(rule)}
                            className="ml-2"
                          >
                            Auto-fix
                          </Button>
                        )}
                      </div>
                    </AlertDescription>

                    {result.details && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.details.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}

                    {result.suggestedFix && showSuggestions && (
                      <div className="text-sm font-medium text-primary mt-1">
                        💡 {result.suggestedFix}
                      </div>
                    )}

                    {result.conflictingEvents && result.conflictingEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm font-medium">Conflicting events:</div>
                        {result.conflictingEvents.slice(0, 3).map((conflict) => (
                          <Badge key={conflict.id} variant="outline" className="text-xs">
                            {conflict.title} ({format(conflict.startDate, 'p')})
                          </Badge>
                        ))}
                        {result.conflictingEvents.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.conflictingEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {!compactMode && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {rule.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{rule.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            );
          });
        })}
      </div>
    </div>
  );
}

// Export default rules and types
export { DEFAULT_BUSINESS_RULES };
export type { BusinessRule, ConstraintResult };
