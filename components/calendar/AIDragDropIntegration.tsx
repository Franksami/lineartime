'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import { addMinutes, differenceInMinutes, format, isAfter, isSameDay } from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Lightbulb,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DragSuggestion {
  id: string;
  type: 'time-optimization' | 'conflict-resolution' | 'productivity-boost' | 'balance-improvement';
  title: string;
  description: string;
  confidence: number;
  suggestedTime?: Date;
  reasons: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AIDragDropState {
  isDragging: boolean;
  draggedEvent: Event | null;
  dropZone: string | null;
  suggestions: DragSuggestion[];
  hoverFeedback: string;
}

interface AIDragDropIntegrationProps {
  events: Event[];
  onEventMove: (eventId: string, newStartTime: Date) => void;
  onEventResize: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  onSuggestionApply: (suggestion: DragSuggestion) => void;
  timeSlots: { id: string; time: Date; available: boolean }[];
  className?: string;
}

// AI-powered drag suggestions logic
const generateDragSuggestions = (
  draggedEvent: Event,
  targetTime: Date,
  allEvents: Event[]
): DragSuggestion[] => {
  const suggestions: DragSuggestion[] = [];
  const eventDuration = differenceInMinutes(draggedEvent.endDate, draggedEvent.startDate);
  const newEndTime = addMinutes(targetTime, eventDuration);

  // Check for conflicts
  const conflicts = allEvents.filter(
    (event) =>
      event.id !== draggedEvent.id &&
      isSameDay(event.startDate, targetTime) &&
      ((isAfter(targetTime, event.startDate) && targetTime < event.endDate) ||
        (newEndTime > event.startDate && newEndTime <= event.endDate) ||
        (targetTime <= event.startDate && newEndTime >= event.endDate))
  );

  if (conflicts.length > 0) {
    // Conflict resolution suggestion
    const nextAvailable = findNextAvailableSlot(
      targetTime,
      eventDuration,
      allEvents,
      draggedEvent.id
    );
    if (nextAvailable) {
      suggestions.push({
        id: 'conflict-resolution',
        type: 'conflict-resolution',
        title: '⚠️ Conflict Detected',
        description: `Conflicts with ${conflicts[0].title}. Suggested alternative time.`,
        confidence: 85,
        suggestedTime: nextAvailable,
        reasons: [
          `Conflicts with ${conflicts.length} event${conflicts.length > 1 ? 's' : ''}`,
          `Next available: ${format(nextAvailable, 'h:mm a')}`,
          'Maintains meeting buffer time',
        ],
        icon: AlertTriangle,
        color: 'text-orange-600',
      });
    }
  }

  // Time optimization suggestions
  const hour = targetTime.getHours();
  if (draggedEvent.category === 'work' && hour >= 16) {
    const morningSlot = findMorningSlot(targetTime, eventDuration, allEvents, draggedEvent.id);
    if (morningSlot) {
      suggestions.push({
        id: 'morning-optimization',
        type: 'time-optimization',
        title: '🌅 Morning Optimization',
        description: 'Move meeting to morning for better engagement',
        confidence: 75,
        suggestedTime: morningSlot,
        reasons: [
          'Morning meetings tend to be more productive',
          'Avoids late-day meeting fatigue',
          'Better for team focus and decision making',
        ],
        icon: Lightbulb,
        color: 'text-blue-600',
      });
    }
  }

  // Productivity boost suggestions
  if (draggedEvent.category === 'effort') {
    const focusHours = [9, 10, 14, 15]; // Prime focus hours
    if (!focusHours.includes(hour)) {
      const focusSlot = findFocusTimeSlot(targetTime, eventDuration, allEvents, draggedEvent.id);
      if (focusSlot) {
        suggestions.push({
          id: 'focus-optimization',
          type: 'productivity-boost',
          title: '🧠 Focus Time Optimization',
          description: 'Schedule during peak focus hours for better results',
          confidence: 90,
          suggestedTime: focusSlot,
          reasons: [
            'Aligns with natural productivity peaks',
            'Reduces distractions and interruptions',
            'Maximizes deep work potential',
          ],
          icon: Target,
          color: 'text-green-600',
        });
      }
    }
  }

  // Balance improvement suggestions
  const dayEvents = allEvents.filter((event) => isSameDay(event.startDate, targetTime));
  const dayMeetingTime = dayEvents
    .filter((e) => e.category === 'work')
    .reduce((acc, e) => acc + differenceInMinutes(e.endDate, e.startDate), 0);

  if (dayMeetingTime > 5 * 60) {
    // More than 5 hours of meetings
    suggestions.push({
      id: 'balance-improvement',
      type: 'balance-improvement',
      title: '⚖️ Schedule Balance',
      description: 'Heavy meeting day detected. Consider rescheduling.',
      confidence: 70,
      reasons: [
        `${Math.round(dayMeetingTime / 60)} hours of meetings on this day`,
        'Risk of meeting fatigue and reduced productivity',
        'Consider spreading meetings across multiple days',
      ],
      icon: RefreshCw,
      color: 'text-purple-600',
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

// Helper functions for finding optimal time slots
const findNextAvailableSlot = (
  targetTime: Date,
  duration: number,
  events: Event[],
  excludeId: string
): Date | null => {
  let checkTime = new Date(targetTime);
  const endOfDay = new Date(targetTime);
  endOfDay.setHours(18, 0, 0, 0); // Check until 6 PM

  while (checkTime < endOfDay) {
    const checkEndTime = addMinutes(checkTime, duration);
    const hasConflict = events.some(
      (event) =>
        event.id !== excludeId &&
        isSameDay(event.startDate, checkTime) &&
        ((checkTime >= event.startDate && checkTime < event.endDate) ||
          (checkEndTime > event.startDate && checkEndTime <= event.endDate) ||
          (checkTime <= event.startDate && checkEndTime >= event.endDate))
    );

    if (!hasConflict) {
      return checkTime;
    }

    checkTime = addMinutes(checkTime, 15); // Check every 15 minutes
  }

  return null;
};

const findMorningSlot = (
  targetTime: Date,
  duration: number,
  events: Event[],
  excludeId: string
): Date | null => {
  const morningStart = new Date(targetTime);
  morningStart.setHours(9, 0, 0, 0);
  const morningEnd = new Date(targetTime);
  morningEnd.setHours(12, 0, 0, 0);

  let checkTime = new Date(morningStart);
  while (checkTime < morningEnd) {
    const checkEndTime = addMinutes(checkTime, duration);
    const hasConflict = events.some(
      (event) =>
        event.id !== excludeId &&
        isSameDay(event.startDate, checkTime) &&
        ((checkTime >= event.startDate && checkTime < event.endTime) ||
          (checkEndTime > event.startDate && checkEndTime <= event.endTime))
    );

    if (!hasConflict) {
      return checkTime;
    }

    checkTime = addMinutes(checkTime, 30);
  }

  return null;
};

const findFocusTimeSlot = (
  targetTime: Date,
  duration: number,
  events: Event[],
  excludeId: string
): Date | null => {
  const focusSlots = [
    { start: 9, end: 11 }, // Morning focus
    { start: 14, end: 16 }, // Afternoon focus
  ];

  for (const slot of focusSlots) {
    const slotStart = new Date(targetTime);
    slotStart.setHours(slot.start, 0, 0, 0);
    const slotEnd = new Date(targetTime);
    slotEnd.setHours(slot.end, 0, 0, 0);

    let checkTime = new Date(slotStart);
    while (addMinutes(checkTime, duration) <= slotEnd) {
      const checkEndTime = addMinutes(checkTime, duration);
      const hasConflict = events.some(
        (event) =>
          event.id !== excludeId &&
          isSameDay(event.startDate, checkTime) &&
          ((checkTime >= event.startDate && checkTime < event.endTime) ||
            (checkEndTime > event.startDate && checkEndTime <= event.endTime))
      );

      if (!hasConflict) {
        return checkTime;
      }

      checkTime = addMinutes(checkTime, 30);
    }
  }

  return null;
};

export function AIDragDropIntegration({
  events,
  onEventMove,
  onEventResize,
  onSuggestionApply,
  timeSlots,
  className,
}: AIDragDropIntegrationProps) {
  const [dragState, setDragState] = useState<AIDragDropState>({
    isDragging: false,
    draggedEvent: null,
    dropZone: null,
    suggestions: [],
    hoverFeedback: '',
  });

  const draggedEventRef = useRef<Event | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle drag start
  const handleDragStart = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      draggedEventRef.current = event;
      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        draggedEvent: event,
        suggestions: [],
      }));
    },
    [events]
  );

  // Handle drag over with AI suggestions
  const handleDragOver = useCallback(
    (timeSlotId: string) => {
      const timeSlot = timeSlots.find((ts) => ts.id === timeSlotId);
      const draggedEvent = draggedEventRef.current;

      if (!timeSlot || !draggedEvent) return;

      // Clear previous timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Generate hover feedback immediately
      const conflicts = events.filter(
        (event) =>
          event.id !== draggedEvent.id &&
          isSameDay(event.startDate, timeSlot.time) &&
          Math.abs(differenceInMinutes(event.startDate, timeSlot.time)) < 60
      );

      const feedback =
        conflicts.length > 0
          ? `⚠️ ${conflicts.length} potential conflict${conflicts.length > 1 ? 's' : ''}`
          : timeSlot.available
            ? '✅ Available slot'
            : '❌ Unavailable';

      setDragState((prev) => ({
        ...prev,
        dropZone: timeSlotId,
        hoverFeedback: feedback,
      }));

      // Generate AI suggestions after a brief delay
      hoverTimeoutRef.current = setTimeout(() => {
        const suggestions = generateDragSuggestions(draggedEvent, timeSlot.time, events);
        setDragState((prev) => ({
          ...prev,
          suggestions,
        }));
      }, 500);
    },
    [timeSlots, events]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      const { destination, source } = result;
      const draggedEvent = draggedEventRef.current;

      if (!destination || !draggedEvent) {
        // Reset state
        setDragState({
          isDragging: false,
          draggedEvent: null,
          dropZone: null,
          suggestions: [],
          hoverFeedback: '',
        });
        draggedEventRef.current = null;
        return;
      }

      const targetTimeSlot = timeSlots.find((ts) => ts.id === destination.droppableId);
      if (targetTimeSlot) {
        onEventMove(draggedEvent.id, targetTimeSlot.time);
      }

      // Keep suggestions visible briefly for user to see
      setTimeout(() => {
        setDragState({
          isDragging: false,
          draggedEvent: null,
          dropZone: null,
          suggestions: [],
          hoverFeedback: '',
        });
        draggedEventRef.current = null;
      }, 2000);
    },
    [timeSlots, onEventMove]
  );

  // Apply AI suggestion
  const applySuggestion = useCallback(
    (suggestion: DragSuggestion) => {
      if (suggestion.suggestedTime && dragState.draggedEvent) {
        onEventMove(dragState.draggedEvent.id, suggestion.suggestedTime);
        onSuggestionApply(suggestion);

        // Remove applied suggestion
        setDragState((prev) => ({
          ...prev,
          suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
        }));
      }
    },
    [dragState.draggedEvent, onEventMove, onSuggestionApply]
  );

  return (
    <div className={cn('ai-drag-drop-integration', className)}>
      <DragDropContext
        onDragStart={(initial) => handleDragStart(initial.draggableId)}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Feedback Overlay */}
        {dragState.isDragging && (
          <div className="fixed top-4 right-4 z-50 space-y-3">
            {/* Current Drag Status */}
            <Card className="bg-background/95 backdrop-blur border-primary/20 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Assistance Active</span>
                </div>
                {dragState.hoverFeedback && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {dragState.hoverFeedback}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {dragState.suggestions.length > 0 && (
              <div className="space-y-2 max-w-sm">
                {dragState.suggestions.slice(0, 3).map((suggestion) => {
                  const IconComponent = suggestion.icon;
                  return (
                    <Card key={suggestion.id} className="bg-background/95 backdrop-blur shadow-lg">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className={cn('h-3 w-3', suggestion.color)} />
                              <span className="text-sm font-medium truncate">
                                {suggestion.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.confidence}%
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground mb-2">
                              {suggestion.description}
                            </div>

                            {suggestion.suggestedTime && (
                              <div className="text-xs text-primary">
                                Suggested: {format(suggestion.suggestedTime, 'h:mm a')}
                              </div>
                            )}
                          </div>

                          {suggestion.suggestedTime && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applySuggestion(suggestion)}
                              className="text-xs h-6"
                            >
                              Apply
                            </Button>
                          )}
                        </div>

                        {suggestion.reasons.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {suggestion.reasons.slice(0, 2).map((reason, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-1"
                              >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                {reason}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Time Slots (Droppable Areas) */}
        <div className="grid grid-cols-1 gap-2">
          {timeSlots.map((timeSlot) => (
            <Droppable key={timeSlot.id} droppableId={timeSlot.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-colors',
                    snapshot.isDraggedOver ? 'border-primary bg-primary/5' : 'border-muted',
                    !timeSlot.available && 'opacity-50 bg-muted/20'
                  )}
                  onMouseEnter={() => {
                    if (dragState.isDragging) {
                      handleDragOver(timeSlot.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{format(timeSlot.time, 'h:mm a')}</span>

                    {snapshot.isDraggedOver && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3 text-primary animate-pulse" />
                        <span className="text-xs text-primary">AI analyzing...</span>
                      </div>
                    )}
                  </div>

                  {/* Show existing events */}
                  {events
                    .filter(
                      (event) =>
                        isSameDay(event.startDate, timeSlot.time) &&
                        Math.abs(differenceInMinutes(event.startDate, timeSlot.time)) < 30
                    )
                    .map((event) => (
                      <Draggable key={event.id} draggableId={event.id} index={0}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'mt-2 p-2 bg-primary text-primary-foreground rounded text-xs cursor-move',
                              snapshot.isDragging && 'opacity-50'
                            )}
                          >
                            {event.title}
                          </div>
                        )}
                      </Draggable>
                    ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Post-drag suggestions */}
      {!dragState.isDragging && dragState.suggestions.length > 0 && (
        <Alert className="mt-4">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">AI detected optimization opportunities:</div>
            <div className="space-y-2">
              {dragState.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between text-sm">
                  <span>{suggestion.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion(suggestion)}
                    disabled={!suggestion.suggestedTime}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default AIDragDropIntegration;
