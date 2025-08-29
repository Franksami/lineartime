/**
 * AI Insight Panel Component
 *
 * Analytics and productivity insights dashboard with AI-powered recommendations.
 * Integrates with design tokens, motion system, and accessibility standards.
 * Provides comprehensive schedule analysis and productivity metrics.
 *
 * @version Phase 5.0
 * @author Command Center Calendar AI Enhancement System
 */

'use client';

import { useAIAnalytics, useAIContext } from '@/contexts/AIContext';
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
  Award,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  Download,
  Filter,
  Focus,
  Lightbulb,
  LineChart,
  MapPin,
  Maximize2,
  Minimize2,
  PieChart,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingDown,
  TrendingFlat,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

export interface ProductivityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  period: 'daily' | 'weekly' | 'monthly';
  benchmark: number;
  category: 'time_management' | 'focus' | 'collaboration' | 'wellbeing';
  icon: React.ReactNode;
  color: string;
}

export interface ScheduleInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  category: string;
  data_points: Array<{
    date: Date;
    value: number;
    context?: string;
  }>;
  recommendations: string[];
  action_items: Array<{
    id: string;
    title: string;
    description: string;
    estimated_impact: number; // 0-1
    effort_required: 'low' | 'medium' | 'high';
  }>;
  created_at: Date;
  expires_at?: Date;
}

export interface TimeAnalysis {
  total_scheduled_time: number; // minutes
  total_free_time: number; // minutes
  meeting_time: number; // minutes
  focus_time: number; // minutes
  break_time: number; // minutes
  travel_time: number; // minutes

  distribution: {
    meetings: number; // percentage
    focused_work: number; // percentage
    breaks: number; // percentage
    administrative: number; // percentage
    other: number; // percentage
  };

  patterns: {
    most_productive_hours: number[];
    peak_meeting_days: string[];
    average_meeting_duration: number;
    longest_focus_block: number; // minutes
    interruption_frequency: number; // per hour
  };

  health_indicators: {
    meeting_fatigue_score: number; // 0-1
    context_switching_frequency: number;
    break_adequacy: number; // 0-1
    work_life_balance: number; // 0-1
  };
}

interface AIInsightPanelProps {
  // Data Sources
  events: Event[];
  timeRange: { start: Date; end: Date };
  userId?: string;

  // Display Configuration
  variant?: 'sidebar' | 'modal' | 'embedded' | 'floating';
  position?: 'left' | 'right' | 'center';
  showMetrics?: boolean;
  showInsights?: boolean;
  showRecommendations?: boolean;
  showTrends?: boolean;

  // Customization
  metricCategories?: ProductivityMetric['category'][];
  insightTypes?: ScheduleInsight['type'][];
  refreshInterval?: number; // minutes

  // Interaction Callbacks
  onInsightAction?: (insight: ScheduleInsight, actionId: string) => void;
  onMetricClick?: (metric: ProductivityMetric) => void;
  onExport?: (data: any) => void;
  onShare?: (insight: ScheduleInsight) => void;

  // Styling
  className?: string;
  compactMode?: boolean;
  darkMode?: boolean;

  // Accessibility
  reducedMotion?: boolean;
  announceChanges?: boolean;
}

// ==========================================
// Analytics Engine
// ==========================================

class ProductivityAnalyzer {
  static analyzeSchedule(events: Event[], timeRange: { start: Date; end: Date }): TimeAnalysis {
    const totalDurationMs = timeRange.end.getTime() - timeRange.start.getTime();
    const totalMinutes = totalDurationMs / (1000 * 60);

    // Calculate time allocations
    const meetingEvents = events.filter((e) => e.type === 'meeting' || e.attendees?.length > 0);
    const focusEvents = events.filter((e) => e.category === 'focus' || e.category === 'work');
    const breakEvents = events.filter((e) => e.category === 'break' || e.category === 'personal');

    const meetingTime = ProductivityAnalyzer.calculateTotalDuration(meetingEvents);
    const focusTime = ProductivityAnalyzer.calculateTotalDuration(focusEvents);
    const breakTime = ProductivityAnalyzer.calculateTotalDuration(breakEvents);
    const scheduledTime = ProductivityAnalyzer.calculateTotalDuration(events);
    const freeTime = Math.max(0, totalMinutes - scheduledTime);

    // Calculate distribution percentages
    const distribution = {
      meetings: (meetingTime / totalMinutes) * 100,
      focused_work: (focusTime / totalMinutes) * 100,
      breaks: (breakTime / totalMinutes) * 100,
      administrative: 10, // Estimated
      other: Math.max(0, 100 - ((meetingTime + focusTime + breakTime) / totalMinutes) * 100 - 10),
    };

    // Analyze patterns
    const patterns = {
      most_productive_hours: ProductivityAnalyzer.findMostProductiveHours(events),
      peak_meeting_days: ProductivityAnalyzer.findPeakMeetingDays(meetingEvents),
      average_meeting_duration: meetingEvents.length > 0 ? meetingTime / meetingEvents.length : 0,
      longest_focus_block: ProductivityAnalyzer.findLongestFocusBlock(focusEvents),
      interruption_frequency: ProductivityAnalyzer.calculateInterruptionFrequency(events),
    };

    // Health indicators
    const health_indicators = {
      meeting_fatigue_score: Math.min(meetingTime / (8 * 60), 1), // 8-hour workday baseline
      context_switching_frequency: ProductivityAnalyzer.calculateContextSwitching(events),
      break_adequacy: ProductivityAnalyzer.assessBreakAdequacy(events, totalMinutes),
      work_life_balance: ProductivityAnalyzer.assessWorkLifeBalance(events),
    };

    return {
      total_scheduled_time: scheduledTime,
      total_free_time: freeTime,
      meeting_time: meetingTime,
      focus_time: focusTime,
      break_time: breakTime,
      travel_time: ProductivityAnalyzer.calculateTravelTime(events),
      distribution,
      patterns,
      health_indicators,
    };
  }

  static generateProductivityMetrics(
    analysis: TimeAnalysis,
    previousAnalysis?: TimeAnalysis
  ): ProductivityMetric[] {
    const metrics: ProductivityMetric[] = [
      {
        id: 'focus_time',
        name: 'Focus Time',
        value: Math.round(analysis.focus_time),
        unit: 'minutes',
        trend: previousAnalysis
          ? ProductivityAnalyzer.calculateTrend(analysis.focus_time, previousAnalysis.focus_time)
          : 'stable',
        trend_percentage: previousAnalysis
          ? ProductivityAnalyzer.calculateTrendPercentage(
              analysis.focus_time,
              previousAnalysis.focus_time
            )
          : 0,
        period: 'daily',
        benchmark: 240, // 4 hours ideal
        category: 'focus',
        icon: <Focus className="w-4 h-4" />,
        color: '#10b981',
      },

      {
        id: 'meeting_load',
        name: 'Meeting Load',
        value: Math.round(analysis.distribution.meetings),
        unit: '%',
        trend: previousAnalysis
          ? ProductivityAnalyzer.calculateTrend(
              analysis.distribution.meetings,
              previousAnalysis.distribution.meetings
            )
          : 'stable',
        trend_percentage: previousAnalysis
          ? ProductivityAnalyzer.calculateTrendPercentage(
              analysis.distribution.meetings,
              previousAnalysis.distribution.meetings
            )
          : 0,
        period: 'daily',
        benchmark: 40, // 40% max recommended
        category: 'collaboration',
        icon: <Users className="w-4 h-4" />,
        color: '#f59e0b',
      },

      {
        id: 'productivity_score',
        name: 'Productivity Score',
        value: Math.round((1 - analysis.health_indicators.meeting_fatigue_score) * 100),
        unit: 'score',
        trend: 'stable',
        trend_percentage: 0,
        period: 'daily',
        benchmark: 80,
        category: 'time_management',
        icon: <Target className="w-4 h-4" />,
        color: '#8b5cf6',
      },

      {
        id: 'context_switching',
        name: 'Context Switches',
        value: Math.round(analysis.health_indicators.context_switching_frequency),
        unit: 'per hour',
        trend: previousAnalysis
          ? ProductivityAnalyzer.calculateTrend(
              analysis.health_indicators.context_switching_frequency,
              previousAnalysis.health_indicators.context_switching_frequency
            )
          : 'stable',
        trend_percentage: previousAnalysis
          ? ProductivityAnalyzer.calculateTrendPercentage(
              analysis.health_indicators.context_switching_frequency,
              previousAnalysis.health_indicators.context_switching_frequency
            )
          : 0,
        period: 'daily',
        benchmark: 3, // Max 3 switches per hour
        category: 'focus',
        icon: <Activity className="w-4 h-4" />,
        color: '#ef4444',
      },

      {
        id: 'wellbeing_score',
        name: 'Wellbeing Score',
        value: Math.round(analysis.health_indicators.work_life_balance * 100),
        unit: 'score',
        trend: 'stable',
        trend_percentage: 0,
        period: 'daily',
        benchmark: 75,
        category: 'wellbeing',
        icon: <Coffee className="w-4 h-4" />,
        color: '#06b6d4',
      },
    ];

    return metrics;
  }

  static generateInsights(analysis: TimeAnalysis, _events: Event[]): ScheduleInsight[] {
    const insights: ScheduleInsight[] = [];

    // High meeting load insight
    if (analysis.distribution.meetings > 60) {
      insights.push({
        id: 'high_meeting_load',
        type: 'warning',
        title: 'High Meeting Load Detected',
        description: `${Math.round(analysis.distribution.meetings)}% of your time is spent in meetings, which may impact deep work capacity.`,
        impact: 'high',
        confidence: 0.9,
        category: 'time_management',
        data_points: [],
        recommendations: [
          'Consider declining optional meetings',
          'Propose shorter meeting durations',
          'Schedule "No Meeting" blocks for focus work',
          'Review meeting necessity with stakeholders',
        ],
        action_items: [
          {
            id: 'block_focus_time',
            title: 'Block 2-hour focus time daily',
            description: 'Reserve uninterrupted time for deep work',
            estimated_impact: 0.8,
            effort_required: 'low',
          },
        ],
        created_at: new Date(),
      });
    }

    // Low focus time insight
    if (analysis.focus_time < 120) {
      // Less than 2 hours
      insights.push({
        id: 'low_focus_time',
        type: 'opportunity',
        title: 'Opportunity to Increase Focus Time',
        description: `Only ${Math.round(analysis.focus_time)} minutes of dedicated focus time detected. Optimal productivity requires 3-4 hours daily.`,
        impact: 'high',
        confidence: 0.85,
        category: 'productivity',
        data_points: [],
        recommendations: [
          'Schedule morning focus blocks when energy is highest',
          'Use time-blocking techniques',
          'Minimize context switching between tasks',
          'Create distraction-free environments',
        ],
        action_items: [
          {
            id: 'morning_focus_block',
            title: 'Schedule morning focus block',
            description: 'Block 9-11 AM for deep work daily',
            estimated_impact: 0.9,
            effort_required: 'medium',
          },
        ],
        created_at: new Date(),
      });
    }

    // Productivity pattern insight
    if (analysis.patterns.most_productive_hours.length > 0) {
      const peakHours = analysis.patterns.most_productive_hours.slice(0, 2);
      insights.push({
        id: 'productivity_pattern',
        type: 'pattern',
        title: 'Peak Productivity Hours Identified',
        description: `Your most productive hours appear to be ${peakHours.join(' and ')}. Leverage these times for important work.`,
        impact: 'medium',
        confidence: 0.7,
        category: 'optimization',
        data_points: [],
        recommendations: [
          'Schedule demanding tasks during peak hours',
          'Protect peak hours from meetings when possible',
          'Use off-peak hours for administrative tasks',
          'Align team collaboration with your peak times',
        ],
        action_items: [
          {
            id: 'protect_peak_hours',
            title: 'Protect peak productivity hours',
            description: 'Block peak hours for high-value work',
            estimated_impact: 0.7,
            effort_required: 'medium',
          },
        ],
        created_at: new Date(),
      });
    }

    // Context switching warning
    if (analysis.health_indicators.context_switching_frequency > 4) {
      insights.push({
        id: 'high_context_switching',
        type: 'warning',
        title: 'High Context Switching Frequency',
        description: `You're switching between different types of work ${Math.round(analysis.health_indicators.context_switching_frequency)} times per hour, which can reduce efficiency.`,
        impact: 'medium',
        confidence: 0.8,
        category: 'focus',
        data_points: [],
        recommendations: [
          'Batch similar tasks together',
          'Create longer time blocks for each type of work',
          'Use the "two-minute rule" for quick tasks',
          'Implement theme days for different work types',
        ],
        action_items: [
          {
            id: 'batch_similar_tasks',
            title: 'Batch similar tasks',
            description: 'Group similar work types into time blocks',
            estimated_impact: 0.6,
            effort_required: 'low',
          },
        ],
        created_at: new Date(),
      });
    }

    // Achievement insight
    if (analysis.health_indicators.work_life_balance > 0.8) {
      insights.push({
        id: 'good_balance',
        type: 'achievement',
        title: 'Excellent Work-Life Balance',
        description:
          'Your schedule shows a healthy balance between work commitments and personal time. Keep it up!',
        impact: 'low',
        confidence: 0.9,
        category: 'wellbeing',
        data_points: [],
        recommendations: [
          'Maintain current scheduling patterns',
          'Share best practices with colleagues',
          'Monitor for any negative trends',
          'Consider mentoring others on time management',
        ],
        action_items: [],
        created_at: new Date(),
      });
    }

    return insights.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return impactWeight[b.impact] - impactWeight[a.impact];
    });
  }

  // Helper methods
  private static calculateTotalDuration(events: Event[]): number {
    return events.reduce((total, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
  }

  private static calculateTravelTime(events: Event[]): number {
    // Estimate travel time based on location changes
    let travelTime = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      if (current.location && next.location && current.location !== next.location) {
        travelTime += 30; // 30 minutes estimated travel time
      }
    }
    return travelTime;
  }

  private static findMostProductiveHours(events: Event[]): number[] {
    const hourCounts: Record<number, number> = {};

    events.forEach((event) => {
      if (event.category === 'focus' || event.category === 'work') {
        const hour = new Date(event.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => Number.parseInt(hour));
  }

  private static findPeakMeetingDays(events: Event[]): string[] {
    const dayCounts: Record<string, number> = {};

    events.forEach((event) => {
      const day = new Date(event.startTime).toLocaleDateString('en', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([day]) => day);
  }

  private static findLongestFocusBlock(events: Event[]): number {
    if (events.length === 0) return 0;

    const sortedEvents = events
      .filter((e) => e.category === 'focus')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let maxDuration = 0;

    sortedEvents.forEach((event) => {
      const duration =
        (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
      maxDuration = Math.max(maxDuration, duration);
    });

    return maxDuration;
  }

  private static calculateInterruptionFrequency(events: Event[]): number {
    const workingHours = 8; // Assume 8-hour workday
    const shortEvents = events.filter((e) => {
      const duration =
        (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / (1000 * 60);
      return duration < 30; // Events shorter than 30 minutes might be interruptions
    });

    return shortEvents.length / workingHours;
  }

  private static calculateContextSwitching(events: Event[]): number {
    let switches = 0;

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      if (current.category !== next.category) {
        switches++;
      }
    }

    const workingHours = 8;
    return switches / workingHours;
  }

  private static assessBreakAdequacy(events: Event[], totalMinutes: number): number {
    const breakTime = events
      .filter((e) => e.category === 'break')
      .reduce((total, event) => {
        const duration =
          (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
        return total + duration;
      }, 0);

    const recommendedBreakTime = totalMinutes * 0.15; // 15% of total time
    return Math.min(breakTime / recommendedBreakTime, 1);
  }

  private static assessWorkLifeBalance(events: Event[]): number {
    const workEvents = events.filter((e) => e.category === 'work' || e.category === 'meeting');
    const personalEvents = events.filter(
      (e) => e.category === 'personal' || e.category === 'break'
    );

    if (workEvents.length === 0 && personalEvents.length === 0) return 0.8; // Default balanced

    const workTime = ProductivityAnalyzer.calculateTotalDuration(workEvents);
    const personalTime = ProductivityAnalyzer.calculateTotalDuration(personalEvents);
    const totalTime = workTime + personalTime;

    if (totalTime === 0) return 0.8;

    const workRatio = workTime / totalTime;

    // Optimal work ratio is around 0.6-0.7 (60-70% work, 30-40% personal)
    const optimalRatio = 0.65;
    const deviation = Math.abs(workRatio - optimalRatio);

    return Math.max(0, 1 - deviation * 2);
  }

  private static calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% threshold for stability
    const change = (current - previous) / previous;

    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private static calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}

// ==========================================
// Main Component
// ==========================================

export function AIInsightPanel({
  events,
  timeRange,
  userId,
  variant = 'sidebar',
  position = 'right',
  showMetrics = true,
  showInsights = true,
  showRecommendations = true,
  showTrends = true,
  metricCategories = ['time_management', 'focus', 'collaboration', 'wellbeing'],
  insightTypes = ['pattern', 'anomaly', 'opportunity', 'warning', 'achievement'],
  refreshInterval = 30,
  onInsightAction,
  onMetricClick,
  onExport,
  onShare,
  className,
  compactMode = false,
  darkMode = false,
  reducedMotion = false,
  announceChanges = true,
  ...props
}: AIInsightPanelProps) {
  // Hooks
  const { tokens, resolveToken } = useDesignTokens();
  const { animate, choreography } = useMotionSystem();
  const { announceChange, createAriaLabel } = useAccessibilityAAA();
  const { playSound } = useSoundEffects();
  const { state: aiState, isFeatureEnabled } = useAIContext();
  const { analytics, generateInsights } = useAIAnalytics();

  // Local State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [_timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis | null>(null);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetric[]>([]);
  const [scheduleInsights, setScheduleInsights] = useState<ScheduleInsight[]>([]);

  // Refs
  const _analysisRef = useRef<NodeJS.Timeout | null>(null);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  // Check if analytics feature is enabled
  const isEnabled = isFeatureEnabled('smartSuggestions') && aiState.enabled;

  // Analyze schedule and generate insights
  const analyzeSchedule = useCallback(async () => {
    if (!isEnabled || !events.length) return;

    setIsAnalyzing(true);

    try {
      const analysis = ProductivityAnalyzer.analyzeSchedule(events, timeRange);
      setTimeAnalysis(analysis);

      const metrics = ProductivityAnalyzer.generateProductivityMetrics(analysis);
      const filteredMetrics = metrics.filter((m) => metricCategories.includes(m.category));
      setProductivityMetrics(filteredMetrics);

      const insights = ProductivityAnalyzer.generateInsights(analysis, events);
      const filteredInsights = insights.filter((i) => insightTypes.includes(i.type));
      setScheduleInsights(filteredInsights);

      // Generate AI insights using the context
      generateInsights(events);

      if (announceChanges && insights.length > 0) {
        announceChange(
          `Generated ${insights.length} productivity insights and ${metrics.length} key metrics`
        );
      }
    } catch (error) {
      console.error('Schedule analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isEnabled,
    events,
    timeRange,
    metricCategories,
    insightTypes,
    generateInsights,
    announceChanges,
    announceChange,
  ]);

  // Auto-refresh analysis
  useEffect(() => {
    analyzeSchedule();

    if (refreshInterval > 0) {
      refreshRef.current = setInterval(analyzeSchedule, refreshInterval * 60 * 1000);
    }

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
    };
  }, [analyzeSchedule, refreshInterval]);

  // Handle insight action
  const handleInsightAction = useCallback(
    (insight: ScheduleInsight, actionId: string) => {
      onInsightAction?.(insight, actionId);

      if (announceChanges) {
        announceChange(`Applied action: ${actionId}`);
      }

      playSound('success');
    },
    [onInsightAction, announceChanges, announceChange, playSound]
  );

  // Handle metric click
  const handleMetricClick = useCallback(
    (metric: ProductivityMetric) => {
      onMetricClick?.(metric);

      if (announceChanges) {
        announceChange(`Selected metric: ${metric.name}`);
      }
    },
    [onMetricClick, announceChanges, announceChange]
  );

  // Filter insights by category
  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') return scheduleInsights;
    return scheduleInsights.filter((insight) => insight.category === selectedCategory);
  }, [scheduleInsights, selectedCategory]);

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0, x: variant === 'sidebar' ? (position === 'right' ? 50 : -50) : 0 },
    visible: {
      opacity: 1,
      x: 0,
      transition: choreography.transitions.smooth,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: choreography.transitions.quick,
    },
  };

  // Don't render if not enabled
  if (!isEnabled) return null;

  const containerClasses = cn(
    'ai-insight-panel bg-background border border-border',
    {
      'fixed top-0 bottom-0 z-40 w-80 shadow-xl': variant === 'sidebar',
      'right-0': variant === 'sidebar' && position === 'right',
      'left-0': variant === 'sidebar' && position === 'left',
      'rounded-lg shadow-lg': variant !== 'sidebar',
      'w-full h-full': variant === 'modal',
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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full">
              {isAnalyzing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                >
                  <Brain className="w-4 h-4" />
                </motion.div>
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
            </div>

            <div>
              <h2 className="font-semibold">AI Insights</h2>
              <p className="text-xs text-muted-foreground">
                {isAnalyzing ? 'Analyzing schedule...' : 'Productivity analytics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label={showDetailedView ? 'Minimize' : 'Maximize'}
            >
              {showDetailedView ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={analyzeSchedule}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Refresh analysis"
              disabled={isAnalyzing}
            >
              <RefreshCw className={cn('w-4 h-4', { 'animate-spin': isAnalyzing })} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <motion.div
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              />
              <p className="text-sm text-muted-foreground">
                Analyzing your productivity patterns...
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isAnalyzing && (
          <div className="flex-1 overflow-y-auto">
            {/* Productivity Metrics */}
            {showMetrics && productivityMetrics.length > 0 && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium">Key Metrics</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {productivityMetrics.slice(0, compactMode ? 3 : 6).map((metric, index) => (
                    <motion.button
                      key={metric.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleMetricClick(metric)}
                      className="text-left p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-full"
                          style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                        >
                          {metric.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{metric.name}</span>
                            {showTrends && metric.trend !== 'stable' && (
                              <div
                                className={cn('flex items-center gap-1 text-xs', {
                                  'text-green-600 /* TODO: Use semantic token */':
                                    metric.trend === 'up' && metric.value >= metric.benchmark,
                                  'text-red-600 /* TODO: Use semantic token */':
                                    metric.trend === 'down' ||
                                    (metric.trend === 'up' && metric.value < metric.benchmark),
                                  'text-orange-600':
                                    metric.trend === 'up' && metric.value < metric.benchmark,
                                })}
                              >
                                {metric.trend === 'up' ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{Math.abs(metric.trend_percentage)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">{metric.value}</span>
                            <span className="text-sm text-muted-foreground">{metric.unit}</span>

                            {metric.benchmark && (
                              <div className="flex-1 h-1 bg-gray-200 /* TODO: Use semantic token */ rounded-full overflow-hidden ml-2">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: metric.color,
                                    width: `${Math.min((metric.value / metric.benchmark) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Insights */}
            {showInsights && filteredInsights.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 /* TODO: Use semantic token */" />
                    <span className="font-medium">AI Insights</span>
                    <span className="text-xs text-muted-foreground">
                      ({filteredInsights.length})
                    </span>
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1"
                  >
                    <option value="all">All Categories</option>
                    <option value="time_management">Time Management</option>
                    <option value="productivity">Productivity</option>
                    <option value="focus">Focus</option>
                    <option value="wellbeing">Wellbeing</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredInsights.slice(0, compactMode ? 3 : 8).map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      className="border border-border rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn('flex-shrink-0 p-1.5 rounded-full', {
                            'bg-blue-100 /* TODO: Use semantic token */ text-blue-600 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//30':
                              insight.type === 'pattern',
                            'bg-red-100 /* TODO: Use semantic token */ text-red-600 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//30':
                              insight.type === 'warning',
                            'bg-green-100 /* TODO: Use semantic token */ text-green-600 /* TODO: Use semantic token */ dark:bg-green-900 /* TODO: Use semantic token *//30':
                              insight.type === 'opportunity',
                            'bg-yellow-100 /* TODO: Use semantic token */ text-yellow-600 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//30':
                              insight.type === 'anomaly',
                            'bg-purple-100 /* TODO: Use semantic token */ text-purple-600 /* TODO: Use semantic token */ dark:bg-purple-900 /* TODO: Use semantic token *//30':
                              insight.type === 'achievement',
                          })}
                        >
                          {insight.type === 'pattern' && <BarChart3 className="w-3 h-3" />}
                          {insight.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                          {insight.type === 'opportunity' && <Lightbulb className="w-3 h-3" />}
                          {insight.type === 'anomaly' && <Activity className="w-3 h-3" />}
                          {insight.type === 'achievement' && <Award className="w-3 h-3" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                            <span
                              className={cn('px-2 py-1 text-xs rounded-full', {
                                'bg-red-100 /* TODO: Use semantic token */ text-red-800 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//30':
                                  insight.impact === 'high',
                                'bg-orange-100 text-orange-800 dark:bg-orange-900/30':
                                  insight.impact === 'medium',
                                'bg-blue-100 /* TODO: Use semantic token */ text-blue-800 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//30':
                                  insight.impact === 'low',
                              })}
                            >
                              {insight.impact} impact
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {insight.description}
                          </p>

                          {/* Recommendations Preview */}
                          {showRecommendations && insight.recommendations.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium mb-1">Top Recommendation:</p>
                              <p className="text-xs text-muted-foreground">
                                {insight.recommendations[0]}
                              </p>
                            </div>
                          )}

                          {/* Action Items */}
                          {insight.action_items.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {insight.action_items.slice(0, 2).map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleInsightAction(insight, action.id)}
                                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  {action.title}
                                </button>
                              ))}

                              {insight.recommendations.length > 1 ||
                                (insight.action_items.length > 2 && (
                                  <button
                                    onClick={() =>
                                      setExpandedInsight(
                                        expandedInsight === insight.id ? null : insight.id
                                      )
                                    }
                                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {expandedInsight === insight.id ? 'Less' : 'More'}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedInsight === insight.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-border"
                          >
                            {/* All Recommendations */}
                            {insight.recommendations.length > 1 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-2">All Recommendations:</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                  {insight.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* All Action Items */}
                            {insight.action_items.length > 2 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium">Additional Actions:</p>
                                {insight.action_items.slice(2).map((action) => (
                                  <div
                                    key={action.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <p className="font-medium">{action.title}</p>
                                      <p className="text-muted-foreground">{action.description}</p>
                                    </div>
                                    <button
                                      onClick={() => handleInsightAction(insight, action.id)}
                                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors ml-2"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isAnalyzing && filteredInsights.length === 0 && productivityMetrics.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No insights available</p>
                  <p className="text-xs text-muted-foreground">
                    Add more events to your calendar to generate AI insights
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AIInsightPanel;
