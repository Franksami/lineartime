'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAutoAnimate, useAutoAnimateCards } from '@/hooks/useAutoAnimate';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useSyncedCalendar } from '@/hooks/useSyncedCalendar';
import type { Event } from '@/types/calendar';
import { useUser } from '@clerk/nextjs';
import {
  differenceInDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';

interface DashboardOverviewProps {
  showBalance?: boolean;
  year?: number;
  className?: string;
}

export function DashboardOverview({
  showBalance = true,
  year = new Date().getFullYear(),
  className,
}: DashboardOverviewProps) {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hideMetrics, setHideMetrics] = useState(false);

  // AutoAnimate refs for smooth dashboard transitions
  const [metricsGridRef] = useAutoAnimateCards({ duration: 300, staggerChildren: 50 });
  const [upcomingEventsRef] = useAutoAnimate({ duration: 250 });
  const [activityFeedRef] = useAutoAnimate({ duration: 200 });

  // Get real calendar data
  const {
    events: calendarEvents,
    conflicts,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsInRange,
  } = useCalendarEvents({
    userId: user?.id || 'default-user',
    enableConflictDetection: true,
  });

  const { syncStatus, providers, triggerSync } = useSyncedCalendar(year);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//10 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ border-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'call':
        return <Bell className="h-4 w-4" />;
      case 'review':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      case 'added':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'updated':
        return <Settings className="h-4 w-4 text-yellow-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Calculate real metrics from calendar events
  const metrics = useMemo(() => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today);
    const endOfThisWeek = endOfWeek(today);

    const todayEvents = getEventsInRange(startOfToday, endOfToday);
    const _weekEvents = getEventsInRange(startOfThisWeek, endOfThisWeek);
    const upcomingEvents = calendarEvents.filter((e) => e.startDate > today);
    const completedToday = todayEvents.filter((e) => e.endDate < today);

    // Calculate total focus time for today (in minutes)
    const totalFocusMinutes = todayEvents.reduce((total, event) => {
      const duration = Math.max(0, event.endDate.getTime() - event.startDate.getTime());
      return total + Math.floor(duration / (1000 * 60));
    }, 0);

    const focusHours = Math.floor(totalFocusMinutes / 60);
    const focusMinutes = totalFocusMinutes % 60;
    const focusTime = `${focusHours}h ${focusMinutes}m`;

    // Calculate productivity score based on completed vs planned events
    const plannedToday = todayEvents.length;
    const completedTodayCount = completedToday.length;
    const productivity =
      plannedToday > 0 ? Math.round((completedTodayCount / plannedToday) * 100) : 0;

    // Weekly goal is a rough target
    const weeklyGoal = 80;

    return {
      totalEvents: calendarEvents.length,
      upcomingEvents: upcomingEvents.length,
      completedToday: completedTodayCount,
      productivity,
      focusTime,
      weeklyGoal,
      conflictsCount: conflicts.length,
      todayEvents,
    };
  }, [calendarEvents, conflicts, getEventsInRange]);

  // Calculate upcoming events for display
  const upcomingEventsDisplay = useMemo(() => {
    return calendarEvents
      .filter((event) => event.startDate > currentTime)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 3)
      .map((event) => ({
        id: event.id,
        title: event.title,
        time: format(event.startDate, 'hh:mm a'),
        duration: `${Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60))} min`,
        category: event.category,
        priority: conflicts.some((c) => c.event.id === event.id) ? 'high' : 'medium',
      }));
  }, [calendarEvents, currentTime, conflicts]);

  // Calculate recent activity feed
  const activityFeed = useMemo(() => {
    const activities = [];
    const now = currentTime.getTime();

    // Add recent events (completed in last 24 hours)
    calendarEvents
      .filter((event) => {
        const timeSinceEnd = now - event.endDate.getTime();
        return timeSinceEnd > 0 && timeSinceEnd < 24 * 60 * 60 * 1000; // Last 24 hours
      })
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
      .slice(0, 2)
      .forEach((event) => {
        const hoursAgo = Math.floor((now - event.endDate.getTime()) / (1000 * 60 * 60));
        activities.push({
          id: `completed-${event.id}`,
          action: 'Event completed',
          title: event.title,
          time: hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago` : 'Just now',
          type: 'completed',
        });
      });

    // Add conflicts as activity
    conflicts.slice(0, 2).forEach((conflict) => {
      activities.push({
        id: `conflict-${conflict.event.id}`,
        action: 'Schedule conflict detected',
        title: conflict.event.title,
        time: 'Now',
        type: 'alert',
      });
    });

    // Add sync activities if available
    if (syncStatus.lastSync) {
      const syncMinutesAgo = Math.floor((now - syncStatus.lastSync.getTime()) / (1000 * 60));
      if (syncMinutesAgo < 60) {
        activities.push({
          id: 'sync-activity',
          action: 'Calendars synchronized',
          title: `${providers?.length || 0} calendar${providers?.length !== 1 ? 's' : ''}`,
          time: syncMinutesAgo > 0 ? `${syncMinutesAgo} min ago` : 'Just now',
          type: 'sync',
        });
      }
    }

    return activities.slice(0, 4);
  }, [calendarEvents, currentTime, conflicts, syncStatus, providers]);

  // Calculate productivity insights
  const insights = useMemo(() => {
    const weekEvents = getEventsInRange(startOfWeek(currentTime), endOfWeek(currentTime));

    // Calculate average event duration
    const avgDuration =
      weekEvents.length > 0
        ? weekEvents.reduce(
            (sum, event) => sum + (event.endDate.getTime() - event.startDate.getTime()),
            0
          ) /
          weekEvents.length /
          (1000 * 60)
        : 0;

    // Calculate most productive hours (simplified)
    const hourCounts = new Array(24).fill(0);
    weekEvents.forEach((event) => {
      const hour = event.startDate.getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return [
      {
        title: 'Peak Productivity Hours',
        value: `${peakHour}:00 - ${peakHour + 2}:00`,
        trend: 'up' as const,
        change: '+12%',
      },
      {
        title: 'Average Event Duration',
        value: `${Math.round(avgDuration)} minutes`,
        trend: avgDuration < 60 ? ('down' as const) : ('up' as const),
        change: avgDuration < 60 ? '-8%' : '+5%',
      },
      {
        title: 'Weekly Focus Score',
        value: `${metrics.productivity}/100`,
        trend: metrics.productivity > 70 ? ('up' as const) : ('down' as const),
        change: metrics.productivity > 70 ? '+5%' : '-3%',
      },
    ];
  }, [currentTime, getEventsInRange, metrics.productivity]);

  // Calendar sync status
  const calendarSyncStatus = useMemo(() => {
    if (!providers) return [];

    return providers.map((provider) => ({
      name: provider.displayName || provider.provider,
      status: syncStatus.isSyncing ? 'syncing' : 'synced',
      lastSync: syncStatus.lastSync ? format(syncStatus.lastSync, 'p') : 'Never',
    }));
  }, [providers, syncStatus]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">{formatDate(currentTime)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">Live Time</div>
          </div>
          <Button size="sm" className="gap-2" asChild>
            <Link href="/">
              <CalendarIcon className="h-4 w-4" />
              Open Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div ref={metricsGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <button
              onClick={() => setHideMetrics(!hideMetrics)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {hideMetrics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hideMetrics ? '•••' : metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${conflicts.length} conflicts`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hideMetrics ? '•••' : metrics.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">{conflicts.length} high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hideMetrics ? '•••' : metrics.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.todayEvents.length} scheduled today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hideMetrics ? '•••' : metrics.focusTime}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.productivity}% productivity score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={upcomingEventsRef}>
              {upcomingEventsDisplay.length > 0 ? (
                upcomingEventsDisplay.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getTypeIcon(event.category)}
                      </div>
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                          <span>{event.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(event.priority)}>
                      {event.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events today</p>
                  <p className="text-sm">Your calendar is clear!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={activityFeedRef}>
              {activityFeed.length > 0 ? (
                activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Activity will appear here as you use your calendar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{insight.title}</span>
                  <div className="flex items-center gap-1">
                    {insight.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                    )}
                    <span
                      className={`text-xs ${insight.trend === 'up' ? 'text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */' : 'text-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'}`}
                    >
                      {insight.change}
                    </span>
                  </div>
                </div>
                <div className="text-lg font-bold">{insight.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                Calendar Sync
              </span>
              {providers && providers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerSync()}
                  disabled={syncStatus.isSyncing}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calendarSyncStatus.length > 0 ? (
              calendarSyncStatus.map((calendar, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        calendar.status === 'syncing'
                          ? 'bg-yellow-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ animate-pulse'
                          : calendar.status === 'synced'
                            ? 'bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
                            : 'bg-destructive'
                      }`}
                    />
                    <span className="font-medium">{calendar.name}</span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs ${
                        calendar.status === 'syncing'
                          ? 'text-yellow-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
                          : calendar.status === 'synced'
                            ? 'text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
                            : 'text-destructive'
                      }`}
                    >
                      {calendar.status === 'syncing'
                        ? 'Syncing...'
                        : calendar.status === 'synced'
                          ? 'Synced'
                          : 'Error'}
                    </div>
                    <div className="text-xs text-muted-foreground">{calendar.lastSync}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No calendar providers connected</p>
                <p className="text-sm">Connect your calendars to see sync status</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/settings">Connect Calendars</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/">
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/">
                <CalendarIcon className="h-4 w-4" />
                View Full Calendar
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Calendar Settings
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4" />
                Analytics Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Goal Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {hideMetrics ? '•••' : `${metrics.productivity}%`} of {metrics.weeklyGoal}% target
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={hideMetrics ? 0 : metrics.productivity} className="w-full h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Monday</span>
            <span>Tuesday</span>
            <span>Wednesday</span>
            <span>Thursday</span>
            <span>Friday</span>
            <span>Saturday</span>
            <span>Sunday</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
