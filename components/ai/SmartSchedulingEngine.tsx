'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  confidence: number;
  reason: string;
  conflicts: Event[];
  alternatives: TimeSlot[];
}

interface SchedulingSuggestion {
  id: string;
  title: string;
  suggestedSlot: TimeSlot;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  aiGenerated: boolean;
}

interface SmartSchedulingEngineProps {
  events: Event[];
  onEventCreate: (event: Partial<Event>) => void;
  onEventUpdate: (event: Event) => void;
  onSchedulingSuggestion: (suggestion: SchedulingSuggestion) => void;
  workingHours?: { start: number; end: number }; // 24-hour format
  className?: string;
}

// AI-powered scheduling preferences
const SCHEDULING_PREFERENCES = {
  workingHours: { start: 9, end: 17 },
  preferredMeetingLengths: [30, 60, 90, 120], // minutes
  bufferTime: 15, // minutes between meetings
  maxDailyMeetings: 6,
  focusTimeSlots: [
    { start: 9, end: 11 }, // Morning focus
    { start: 14, end: 16 }, // Afternoon focus
  ],
};

export function SmartSchedulingEngine({
  events,
  onEventCreate,
  onEventUpdate,
  onSchedulingSuggestion,
  workingHours = SCHEDULING_PREFERENCES.workingHours,
  className,
}: SmartSchedulingEngineProps) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [lastAiResponse, setLastAiResponse] = useState('');

  // Find optimal time slots using AI heuristics
  const findOptimalTimeSlots = useCallback(
    (
      duration: number,
      preferredDate?: Date,
      eventType: 'meeting' | 'focus' | 'break' | 'task' = 'meeting'
    ): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      const searchDate = preferredDate || new Date();

      // Search within a 7-day window
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = addDays(searchDate, dayOffset);
        const dayStart = new Date(currentDate);
        dayStart.setHours(workingHours.start, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(workingHours.end, 0, 0, 0);

        // Find available slots in this day
        let currentTime = dayStart;

        while (isBefore(addMinutes(currentTime, duration), dayEnd)) {
          const slotEnd = addMinutes(currentTime, duration);

          // Check for conflicts
          const conflicts = events.filter(
            (event) =>
              isSameDay(event.startDate, currentDate) &&
              ((isAfter(currentTime, event.startDate) && isBefore(currentTime, event.endDate)) ||
                (isAfter(slotEnd, event.startDate) && isBefore(slotEnd, event.endDate)) ||
                (isBefore(currentTime, event.startDate) && isAfter(slotEnd, event.endDate)))
          );

          if (conflicts.length === 0) {
            // Calculate confidence score based on various factors
            let confidence = 100;
            const hour = currentTime.getHours();

            // Penalize non-working hours
            if (hour < workingHours.start || hour > workingHours.end) {
              confidence -= 40;
            }

            // Boost confidence for preferred event types at optimal times
            if (eventType === 'meeting' && hour >= 10 && hour <= 16) {
              confidence += 20;
            } else if (eventType === 'focus') {
              // Prefer focus time slots
              for (const focusSlot of SCHEDULING_PREFERENCES.focusTimeSlots) {
                if (hour >= focusSlot.start && hour <= focusSlot.end) {
                  confidence += 30;
                  break;
                }
              }
            }

            // Penalize late afternoon for meetings
            if (eventType === 'meeting' && hour >= 16) {
              confidence -= 15;
            }

            // Boost confidence for earlier in the search window
            confidence -= dayOffset * 5;

            // Add buffer time considerations
            const eventsOnDay = events.filter((event) => isSameDay(event.startDate, currentDate));
            let hasBuffer = true;
            for (const event of eventsOnDay) {
              if (
                Math.abs(differenceInMinutes(currentTime, event.endDate)) <
                  SCHEDULING_PREFERENCES.bufferTime ||
                Math.abs(differenceInMinutes(slotEnd, event.startDate)) <
                  SCHEDULING_PREFERENCES.bufferTime
              ) {
                hasBuffer = false;
                confidence -= 20;
                break;
              }
            }

            const reason = [
              confidence >= 80
                ? '✨ Optimal time slot'
                : confidence >= 60
                  ? '👍 Good time slot'
                  : confidence >= 40
                    ? '⚠️ Acceptable slot'
                    : '❌ Poor timing',
              hasBuffer ? 'with buffer time' : 'tight schedule',
              eventType === 'focus' && confidence >= 80 ? '(focus time)' : '',
              dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : `in ${dayOffset} days`,
            ]
              .filter(Boolean)
              .join(' ');

            slots.push({
              startTime: currentTime,
              endTime: slotEnd,
              confidence: Math.max(0, Math.min(100, confidence)),
              reason,
              conflicts,
              alternatives: [],
            });
          }

          // Move to next 15-minute slot
          currentTime = addMinutes(currentTime, 15);
        }
      }

      // Sort by confidence and return top 10
      return slots
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map((slot, index) => ({
          ...slot,
          alternatives: slots.slice(index + 1, index + 4), // Include top 3 alternatives
        }));
    },
    [events, workingHours]
  );

  // AI tools for calendar management
  const calendarTools = {
    findAvailableSlots: tool({
      description: 'Find available time slots for scheduling events',
      parameters: z.object({
        duration: z.number().describe('Duration in minutes'),
        eventType: z.enum(['meeting', 'focus', 'break', 'task']).describe('Type of event'),
        preferredDate: z.string().optional().describe('Preferred date (YYYY-MM-DD)'),
        requirements: z.string().optional().describe('Special requirements or constraints'),
      }),
      execute: async ({ duration, eventType, preferredDate, requirements }) => {
        const prefDate = preferredDate ? new Date(preferredDate) : undefined;
        const slots = findOptimalTimeSlots(duration, prefDate, eventType);

        return {
          availableSlots: slots.slice(0, 5).map((slot) => ({
            startTime: format(slot.startTime, 'yyyy-MM-dd HH:mm'),
            endTime: format(slot.endTime, 'yyyy-MM-dd HH:mm'),
            confidence: slot.confidence,
            reason: slot.reason,
          })),
          recommendation: slots[0]
            ? `Best slot: ${format(slots[0].startTime, 'EEE, MMM d at h:mm a')} (${slots[0].confidence}% confidence)`
            : 'No available slots found in the next 7 days',
          requirements: requirements || 'None specified',
        };
      },
    }),

    analyzeSchedule: tool({
      description: 'Analyze current schedule and provide optimization suggestions',
      parameters: z.object({
        dateRange: z.object({
          start: z.string().describe('Start date (YYYY-MM-DD)'),
          end: z.string().describe('End date (YYYY-MM-DD)'),
        }),
        focusArea: z
          .enum(['efficiency', 'balance', 'productivity', 'meetings'])
          .describe('Area to focus the analysis on'),
      }),
      execute: async ({ dateRange, focusArea }) => {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        const relevantEvents = events.filter(
          (event) => isAfter(event.startDate, startDate) && isBefore(event.endDate, endDate)
        );

        const totalMeetingTime = relevantEvents
          .filter((e) => e.category === 'work')
          .reduce((acc, e) => acc + differenceInMinutes(e.endDate, e.startDate), 0);

        const focusTimeEvents = relevantEvents.filter((e) => e.category === 'effort');
        const totalFocusTime = focusTimeEvents.reduce(
          (acc, e) => acc + differenceInMinutes(e.endDate, e.startDate),
          0
        );

        const analysis = {
          totalEvents: relevantEvents.length,
          totalMeetingTime: Math.round((totalMeetingTime / 60) * 10) / 10,
          totalFocusTime: Math.round((totalFocusTime / 60) * 10) / 10,
          averageEventLength:
            relevantEvents.length > 0
              ? Math.round(
                  relevantEvents.reduce(
                    (acc, e) => acc + differenceInMinutes(e.endDate, e.startDate),
                    0
                  ) / relevantEvents.length
                )
              : 0,
          focusArea,
          recommendations: [],
        };

        // Generate focus-specific recommendations
        if (focusArea === 'balance' && totalMeetingTime > totalFocusTime * 2) {
          analysis.recommendations.push(
            'Consider blocking more focus time to balance meeting load'
          );
        }
        if (focusArea === 'efficiency' && analysis.averageEventLength < 30) {
          analysis.recommendations.push(
            'Many short events detected - consider batching similar tasks'
          );
        }
        if (focusArea === 'productivity' && focusTimeEvents.length === 0) {
          analysis.recommendations.push(
            'No dedicated focus time found - schedule deep work blocks'
          );
        }

        return analysis;
      },
    }),

    scheduleEvent: tool({
      description: 'Schedule a new event with AI optimization',
      parameters: z.object({
        title: z.string().describe('Event title'),
        duration: z.number().describe('Duration in minutes'),
        eventType: z
          .enum(['meeting', 'focus', 'break', 'task', 'personal'])
          .describe('Type of event'),
        priority: z.enum(['high', 'medium', 'low']).describe('Event priority'),
        description: z.string().optional().describe('Event description'),
        preferredTime: z.string().optional().describe('Preferred time (HH:mm)'),
        preferredDate: z.string().optional().describe('Preferred date (YYYY-MM-DD)'),
      }),
      execute: async ({
        title,
        duration,
        eventType,
        priority,
        description,
        preferredTime,
        preferredDate,
      }) => {
        const prefDate = preferredDate ? new Date(preferredDate) : undefined;
        const slots = findOptimalTimeSlots(duration, prefDate, eventType as any);

        if (slots.length === 0) {
          return {
            success: false,
            message: 'No available slots found',
            suggestion: 'Try a different date or shorter duration',
          };
        }

        const bestSlot = slots[0];
        const eventCategory =
          eventType === 'meeting'
            ? 'work'
            : eventType === 'focus'
              ? 'effort'
              : eventType === 'personal'
                ? 'personal'
                : 'note';

        const newEvent: Partial<Event> = {
          title,
          startDate: bestSlot.startTime,
          endDate: bestSlot.endTime,
          category: eventCategory,
          description: description || `AI-scheduled ${eventType}`,
          priority: priority as any,
        };

        onEventCreate(newEvent);

        return {
          success: true,
          message: `Event "${title}" scheduled for ${format(bestSlot.startTime, 'EEE, MMM d at h:mm a')}`,
          confidence: bestSlot.confidence,
          alternatives: bestSlot.alternatives.length,
        };
      },
    }),
  };

  // Process AI prompt and generate suggestions
  const processAiPrompt = useCallback(async () => {
    if (!aiPrompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastAiResponse('');

    try {
      const result = await streamText({
        model: anthropic('claude-3-haiku-20240307'),
        system: `You are an AI calendar scheduling assistant. You help users optimize their schedules, find meeting times, and manage their calendar efficiently.
        
Current date: ${format(new Date(), 'yyyy-MM-dd')}
Working hours: ${workingHours.start}:00 - ${workingHours.end}:00

You have access to calendar tools. Use them to:
- Find available time slots
- Analyze scheduling patterns
- Schedule new events with optimization
- Provide scheduling recommendations

Be helpful, concise, and always prioritize the user's productivity and work-life balance.`,
        prompt: aiPrompt,
        tools: calendarTools,
        maxSteps: 5,
      });

      let responseText = '';
      for await (const textPart of result.textStream) {
        responseText += textPart;
        setLastAiResponse(responseText);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      setLastAiResponse('Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [aiPrompt, isProcessing, workingHours, calendarTools]);

  // Generate automatic suggestions based on current schedule
  const generateSmartSuggestions = useCallback(() => {
    const newSuggestions: SchedulingSuggestion[] = [];
    const today = new Date();
    const todayEvents = events.filter((event) => isSameDay(event.startDate, today));

    // Suggest focus time if missing
    const hasFocusTime = todayEvents.some((event) => event.category === 'effort');
    if (!hasFocusTime) {
      const focusSlots = findOptimalTimeSlots(90, today, 'focus');
      if (focusSlots.length > 0) {
        newSuggestions.push({
          id: `focus-${Date.now()}`,
          title: '🧠 Schedule Focus Time',
          suggestedSlot: focusSlots[0],
          priority: 'high',
          rationale: 'No deep work time scheduled today. Focus blocks improve productivity.',
          aiGenerated: true,
        });
      }
    }

    // Suggest breaks between long meeting blocks
    const meetings = todayEvents
      .filter((event) => event.category === 'work')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < meetings.length - 1; i++) {
      const gap = differenceInMinutes(meetings[i + 1].startDate, meetings[i].endDate);
      if (gap < 15 && gap > 0) {
        newSuggestions.push({
          id: `break-${i}-${Date.now()}`,
          title: '☕ Add Buffer Time',
          suggestedSlot: {
            startTime: meetings[i].endDate,
            endTime: meetings[i + 1].startDate,
            confidence: 85,
            reason: 'Buffer between meetings',
            conflicts: [],
            alternatives: [],
          },
          priority: 'medium',
          rationale: 'Short gap between meetings detected. Consider adding buffer time.',
          aiGenerated: true,
        });
      }
    }

    // Suggest rescheduling late-day meetings
    const lateMeetings = todayEvents.filter(
      (event) => event.category === 'work' && event.startDate.getHours() >= 17
    );

    for (const meeting of lateMeetings) {
      const earlierSlots = findOptimalTimeSlots(
        differenceInMinutes(meeting.endDate, meeting.startDate),
        today,
        'meeting'
      ).filter((slot) => slot.startTime.getHours() < 17);

      if (earlierSlots.length > 0) {
        newSuggestions.push({
          id: `reschedule-${meeting.id}`,
          title: '⏰ Reschedule Late Meeting',
          suggestedSlot: earlierSlots[0],
          priority: 'low',
          rationale: 'Meeting scheduled after typical work hours. Earlier time might be better.',
          aiGenerated: true,
        });
      }
    }

    setSuggestions(newSuggestions);
  }, [events, findOptimalTimeSlots]);

  // Apply suggestion
  const applySuggestion = useCallback(
    (suggestion: SchedulingSuggestion) => {
      const { suggestedSlot } = suggestion;

      if (suggestion.title.includes('Focus Time')) {
        onEventCreate({
          title: 'Deep Work Focus',
          startDate: suggestedSlot.startTime,
          endDate: suggestedSlot.endTime,
          category: 'effort',
          description: 'AI-suggested focus time for deep work',
          priority: 'high',
        });
      } else if (suggestion.title.includes('Buffer Time')) {
        onEventCreate({
          title: 'Buffer Time',
          startDate: suggestedSlot.startTime,
          endDate: suggestedSlot.endTime,
          category: 'personal',
          description: 'AI-suggested buffer between meetings',
          priority: 'low',
        });
      }

      // Remove applied suggestion
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      onSchedulingSuggestion(suggestion);
    },
    [onEventCreate, onSchedulingSuggestion]
  );

  // Auto-generate suggestions when events change
  React.useEffect(() => {
    const timer = setTimeout(generateSmartSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [events, generateSmartSuggestions]);

  return (
    <div className={cn('smart-scheduling-engine space-y-6', className)}>
      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Scheduling Assistant
            <Badge variant="outline" className="text-xs">
              GPT-4o Mini
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask me to schedule meetings, find free time, optimize your calendar, or analyze your schedule. Try: 'Schedule a 1-hour focus session for tomorrow morning' or 'Find time for a team meeting this week'"
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={processAiPrompt}
                disabled={!aiPrompt.trim() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Ask AI
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setAiPrompt('')} disabled={isProcessing}>
                Clear
              </Button>
            </div>
          </div>

          {lastAiResponse && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-wrap">{lastAiResponse}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Smart Suggestions
              <Badge variant="secondary">
                {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion) => (
              <Alert key={suggestion.id} className="border-primary/20 bg-primary/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{suggestion.title}</span>
                      <Badge
                        variant={
                          suggestion.priority === 'high'
                            ? 'destructive'
                            : suggestion.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {suggestion.priority}
                      </Badge>
                      {suggestion.aiGenerated && (
                        <Badge variant="outline" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">{suggestion.rationale}</div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(suggestion.suggestedSlot.startTime, 'EEE, MMM d')} at{' '}
                        {format(suggestion.suggestedSlot.startTime, 'h:mm a')} -{' '}
                        {format(suggestion.suggestedSlot.endTime, 'h:mm a')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.suggestedSlot.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => applySuggestion(suggestion)} className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiPrompt('Find me 2 hours of focus time this week')}
            >
              <Target className="h-3 w-3 mr-1" />
              Find Focus Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiPrompt('Schedule a 30-minute team meeting tomorrow')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Schedule Meeting
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setAiPrompt('Analyze my schedule for this week and suggest improvements')
              }
            >
              <Brain className="h-3 w-3 mr-1" />
              Analyze Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiPrompt('Find the best time for a 1-hour client call this week')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Client Call
            </Button>
            <Button variant="outline" size="sm" onClick={generateSmartSuggestions}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Schedule Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {(() => {
              const todayEvents = events.filter((event) => isSameDay(event.startDate, new Date()));
              const meetings = todayEvents.filter((e) => e.category === 'work');
              const focusTime = todayEvents.filter((e) => e.category === 'effort');
              const totalTime = todayEvents.reduce(
                (acc, e) => acc + differenceInMinutes(e.endDate, e.startDate),
                0
              );

              return (
                <>
                  <div>
                    <div className="text-2xl font-bold text-primary">{todayEvents.length}</div>
                    <div className="text-xs text-muted-foreground">Total Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */">
                      {meetings.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Meetings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */">
                      {focusTime.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Focus Blocks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((totalTime / 60) * 10) / 10}h
                    </div>
                    <div className="text-xs text-muted-foreground">Total Time</div>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartSchedulingEngine;
