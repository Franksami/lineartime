'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  type DragDropHeatmapData,
  type DragDropMetrics,
  useDragDropAnalytics,
} from '@/lib/analytics/dragDropAnalytics';
import {
  Activity,
  Brain,
  Clock,
  Download,
  Mouse,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdvancedExportDialog } from './AdvancedExportDialog';

interface DragDropMetricsPanelProps {
  startDate?: Date;
  endDate?: Date;
  className?: string;
  calendarAnalytics?: any;
  events?: any[];
  year?: number;
}

export function DragDropMetricsPanel({
  startDate,
  endDate,
  className,
  calendarAnalytics = null,
  events = [],
  year = new Date().getFullYear(),
}: DragDropMetricsPanelProps) {
  const analytics = useDragDropAnalytics();
  const [metrics, setMetrics] = useState<DragDropMetrics | null>(null);
  const [heatmapData, setHeatmapData] = useState<DragDropHeatmapData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [metricsData, heatmapData, recentData] = await Promise.all([
        analytics.generateMetrics(startDate, endDate),
        analytics.generateHeatmapData(startDate, endDate),
        analytics.getRecentActivity(24), // Last 24 hours
      ]);

      setMetrics(metricsData);
      setHeatmapData(heatmapData);
      setRecentActivity(recentData);
    } catch (error) {
      console.error('Failed to load drag & drop analytics:', error);
      // Set empty metrics for graceful fallback
      setMetrics({
        totalDragOperations: 0,
        successfulDrops: 0,
        cancelledDrags: 0,
        averageDragDuration: 0,
        mostDraggedCategory: 'none',
        aiSuggestionUsageRate: 0,
        conflictResolutionRate: 0,
        optimizationAcceptanceRate: 0,
        dragsByDayOfWeek: {
          Sunday: 0,
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
        },
        dragsByTimeOfDay: {
          'Morning (6-12)': 0,
          'Afternoon (12-17)': 0,
          'Evening (17-22)': 0,
          'Night (22-6)': 0,
        },
        dragEfficiencyScore: 0,
      });
      setHeatmapData([]);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  const _handleExportData = () => {
    try {
      const data = analytics.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drag-drop-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export drag & drop data:', error);
    }
  };

  const handleClearData = () => {
    if (
      confirm(
        'Are you sure you want to clear all drag & drop analytics data? This cannot be undone.'
      )
    ) {
      analytics.clearData();
      loadAnalytics();
    }
  };

  const handleGenerateSampleData = () => {
    // Generate sample drag & drop events for testing
    const categories = ['work', 'personal', 'effort', 'note'];
    const eventTitles = [
      'Team Meeting',
      'Lunch Break',
      'Project Review',
      'Doctor Appointment',
      'Workout',
      'Call with Client',
    ];

    const now = new Date();

    // Generate 20 sample drag operations over the past week
    for (let i = 0; i < 20; i++) {
      const eventId = `sample-${i}`;
      const eventTitle = eventTitles[Math.floor(Math.random() * eventTitles.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Random date within past week
      const daysAgo = Math.floor(Math.random() * 7);
      const sourceDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const targetDate = new Date(sourceDate.getTime() + Math.random() * 3 * 60 * 60 * 1000); // Up to 3 hours later

      // 80% success rate
      const isSuccessful = Math.random() > 0.2;

      analytics.trackDragStart(eventId, eventTitle, sourceDate, category);

      if (isSuccessful) {
        analytics.trackDropSuccess(eventId, eventTitle, sourceDate, targetDate, category, {
          aiSuggestionUsed: Math.random() > 0.6, // 40% use AI suggestions
          conflictResolved: Math.random() > 0.8, // 20% had conflicts
          optimizedTimeSlot: Math.random() > 0.5, // 50% accepted optimizations
        });
      } else {
        analytics.trackDragCancel(eventId, eventTitle, sourceDate, category);
      }
    }

    loadAnalytics();
  };

  if (isLoading || !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Activity className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading drag & drop metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dayOfWeekData = Object.entries(metrics.dragsByDayOfWeek).map(([day, count]) => ({
    day: day.substring(0, 3), // Abbreviate day names
    count,
  }));

  const timeOfDayData = Object.entries(metrics.dragsByTimeOfDay).map(([time, count]) => ({
    time,
    count,
  }));

  const efficiencyColor =
    metrics.dragEfficiencyScore >= 80
      ? '#10b981'
      : metrics.dragEfficiencyScore >= 60
        ? '#f59e0b'
        : '#ef4444';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Drag & Drop Analytics</h2>
          <p className="text-muted-foreground">
            Insights into your drag-and-drop interaction patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateSampleData}>
            <Zap className="w-4 h-4 mr-2" />
            Generate Sample Data
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Advanced Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearData}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drags</CardTitle>
            <Mouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDragOperations}</div>
            <p className="text-xs text-muted-foreground">{metrics.successfulDrops} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalDragOperations > 0
                ? Math.round((metrics.successfulDrops / metrics.totalDragOperations) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                metrics.totalDragOperations > 0
                  ? (metrics.successfulDrops / metrics.totalDragOperations) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.averageDragDuration / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Per drag operation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: efficiencyColor }}>
              {metrics.dragEfficiencyScore}
            </div>
            <Progress value={metrics.dragEfficiencyScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI Integration Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions Used</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.aiSuggestionUsageRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Of successful drops</p>
            <Progress value={metrics.aiSuggestionUsageRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts Resolved</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.conflictResolutionRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Auto-resolved conflicts</p>
            <Progress value={metrics.conflictResolutionRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimizations Accepted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.optimizationAcceptanceRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Smart time slot suggestions</p>
            <Progress value={metrics.optimizationAcceptanceRate * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Usage Pattern Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Day of Week</CardTitle>
            <CardDescription>When you're most active with drag & drop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [`${value} drags`, 'Count']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Time of Day</CardTitle>
            <CardDescription>Your drag & drop activity patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeOfDayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {timeOfDayData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [`${value} drags`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag Activity Heatmap */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Heatmap</CardTitle>
            <CardDescription>Drag & drop intensity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'dragCount'
                        ? `${value} drags`
                        : name === 'successRate'
                          ? `${Math.round(value * 100)}% success`
                          : `${Math.round(value)}ms avg`,
                      name === 'dragCount'
                        ? 'Drags'
                        : name === 'successRate'
                          ? 'Success Rate'
                          : 'Avg Duration',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="dragCount"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 24 hours of drag & drop operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentActivity.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="p-2 rounded-full bg-background">
                    {event.eventType === 'drop_success' && (
                      <Target className="w-4 h-4 text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                    )}
                    {event.eventType === 'drop_cancel' && (
                      <Mouse className="w-4 h-4 text-red-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                    )}
                    {event.eventType === 'drag_start' && (
                      <Activity className="w-4 h-4 text-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{event.eventTitle}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()} •
                      {event.eventType === 'drop_success'
                        ? ' Successfully moved'
                        : event.eventType === 'drop_cancel'
                          ? ' Cancelled'
                          : ' Started drag'}{' '}
                      •{event.duration}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most Dragged Category */}
      {metrics.mostDraggedCategory !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle>Top Category</CardTitle>
            <CardDescription>Your most frequently moved event type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary capitalize">
                  {metrics.mostDraggedCategory}
                </div>
                <p className="text-muted-foreground mt-2">Most frequently dragged category</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Export Dialog */}
      <AdvancedExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        calendarAnalytics={calendarAnalytics}
        events={events}
        year={year}
      />
    </div>
  );
}
