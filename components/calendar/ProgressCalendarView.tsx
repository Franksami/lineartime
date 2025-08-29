'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Calendar,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface ProgressEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  category: string;
  progress?: number; // 0-100
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ProgressCalendarViewProps {
  year: number;
  events: ProgressEvent[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: ProgressEvent) => void;
}

export function ProgressCalendarView({
  year,
  events,
  className,
  onDateSelect,
  onEventClick,
}: ProgressCalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Generate calendar grid for the selected month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(year, selectedMonth, 1).getDay();
    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, selectedMonth, day));
    }

    return days;
  }, [year, selectedMonth]);

  // Group events by date for easy lookup
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ProgressEvent[]> = {};

    events.forEach((event) => {
      const dateKey = event.startDate.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [events]);

  // Calculate progress statistics
  const progressStats = useMemo(() => {
    const totalEvents = events.length;
    const completedEvents = events.filter((e) => e.completed || (e.progress || 0) >= 100).length;
    const inProgressEvents = events.filter(
      (e) => !e.completed && (e.progress || 0) > 0 && (e.progress || 0) < 100
    ).length;
    const pendingEvents = events.filter((e) => !e.completed && (e.progress || 0) === 0).length;

    const overallProgress = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

    return {
      total: totalEvents,
      completed: completedEvents,
      inProgress: inProgressEvents,
      pending: pendingEvents,
      overallProgress: Math.round(overallProgress),
    };
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return eventsByDate[date.toDateString()] || [];
  };

  // Get progress indicator for a day
  const getDayProgressIndicator = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    const completed = dayEvents.filter((e) => e.completed || (e.progress || 0) >= 100).length;
    const total = dayEvents.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    return {
      progress,
      completed,
      total,
      hasEvents: true,
    };
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 /* TODO: Use semantic token */';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500 /* TODO: Use semantic token */';
      case 'low':
        return 'bg-green-500 /* TODO: Use semantic token */';
      default:
        return 'bg-gray-500 /* TODO: Use semantic token */';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500 /* TODO: Use semantic token */';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-yellow-500 /* TODO: Use semantic token */';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-gray-300 /* TODO: Use semantic token */';
  };

  return (
    <div className={cn('h-full w-full bg-background p-6', className)}>
      <div className="h-full flex gap-6">
        {/* Progress Statistics Sidebar */}
        <div className="w-80 space-y-4">
          {/* Overall Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{progressStats.overallProgress}%</span>
                </div>
                <Progress value={progressStats.overallProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 /* TODO: Use semantic token */">
                    {progressStats.completed}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 /* TODO: Use semantic token */">
                    {progressStats.inProgress}
                  </div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{progressStats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{progressStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthEvents = events.filter(
                    (event) =>
                      event.startDate.getMonth() === i && event.startDate.getFullYear() === year
                  );
                  const completed = monthEvents.filter(
                    (e) => e.completed || (e.progress || 0) >= 100
                  ).length;
                  const progress =
                    monthEvents.length > 0 ? (completed / monthEvents.length) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 text-xs font-medium text-muted-foreground">
                        {monthNames[i].slice(0, 3)}
                      </div>
                      <div className="flex-1">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <div className="w-8 text-xs text-muted-foreground text-right">
                        {monthEvents.length > 0 ? `${Math.round(progress)}%` : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event List for Selected Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events
                  .filter((event) => event.startDate.getMonth() === selectedMonth)
                  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                  .slice(0, 10)
                  .map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-2 bg-muted/50 rounded-lg cursor-pointer"
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="flex items-center gap-2">
                        {event.completed || (event.progress || 0) >= 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 /* TODO: Use semantic token */" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.startDate.toLocaleDateString()}
                          </div>
                        </div>
                        {event.priority && (
                          <div
                            className={cn('w-2 h-2 rounded-full', getPriorityColor(event.priority))}
                          />
                        )}
                      </div>
                      {(event.progress || 0) > 0 && (event.progress || 0) < 100 && (
                        <Progress value={event.progress || 0} className="h-1 mt-2" />
                      )}
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Progress Calendar - {year}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(Math.max(0, selectedMonth - 1))}
                    disabled={selectedMonth === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[120px] text-center font-medium">
                    {monthNames[selectedMonth]}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(Math.min(11, selectedMonth + 1))}
                    disabled={selectedMonth === 11}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full flex flex-col">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-muted-foreground p-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={index} className="aspect-square" />;
                    }

                    const dayProgress = getDayProgressIndicator(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = getEventsForDate(date);

                    return (
                      <motion.div
                        key={date.toDateString()}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          'aspect-square p-1 border rounded-lg cursor-pointer transition-colors',
                          'hover:bg-muted/50',
                          isToday && 'ring-2 ring-primary ring-inset',
                          dayProgress?.hasEvents && 'bg-muted/20'
                        )}
                        onClick={() => onDateSelect?.(date)}
                      >
                        <div className="h-full flex flex-col">
                          <div
                            className={cn(
                              'text-sm font-medium mb-1',
                              isToday ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {date.getDate()}
                          </div>

                          {dayProgress?.hasEvents && (
                            <div className="flex-1 flex flex-col justify-center space-y-1">
                              {/* Progress dots */}
                              <div className="flex flex-wrap gap-0.5 justify-center">
                                {dayEvents.slice(0, 6).map((event, idx) => {
                                  const progress = event.progress || 0;
                                  const isCompleted = event.completed || progress >= 100;
                                  return (
                                    <div
                                      key={idx}
                                      className={cn(
                                        'w-1.5 h-1.5 rounded-full',
                                        isCompleted
                                          ? 'bg-green-500 /* TODO: Use semantic token */'
                                          : getProgressColor(progress)
                                      )}
                                      title={`${event.title} - ${progress}%`}
                                    />
                                  );
                                })}
                                {dayEvents.length > 6 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{dayEvents.length - 6}
                                  </div>
                                )}
                              </div>

                              {/* Overall day progress */}
                              {dayProgress.total > 0 && (
                                <div className="text-xs text-center text-muted-foreground">
                                  {dayProgress.completed}/{dayProgress.total}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 /* TODO: Use semantic token */" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>75%+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 /* TODO: Use semantic token */" />
                    <span>50%+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 /* TODO: Use semantic token */" />
                    <span>Not Started</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProgressCalendarView;
