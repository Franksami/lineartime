'use client';

/**
 * QuantumAnalytics - Advanced Analytics and Performance Monitoring
 *
 * Comprehensive analytics system for tracking quantum feature performance,
 * user engagement, and continuous improvement opportunities.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Eye,
  Gauge,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import type {
  QuantumEngagementMetrics,
  QuantumEventData,
  QuantumFeatureFlags,
  QuantumPerformanceMetrics,
  QuantumVariant,
} from '@/types/quantum-calendar';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface QuantumAnalyticsProps {
  performanceMetrics: QuantumPerformanceMetrics;
  engagementMetrics: QuantumEngagementMetrics;
  featureFlags: QuantumFeatureFlags;
  activeVariant?: QuantumVariant | null;
  sessionId: string;
  isVisible: boolean;
  onClose: () => void;
  onExportAnalytics?: () => void;
  className?: string;
}

interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceBudget {
  name: string;
  current: number;
  budget: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  {
    name: 'Render Time',
    current: 0,
    budget: 16,
    unit: 'ms',
    status: 'good',
    description: 'Time to render calendar grid',
  },
  {
    name: 'Memory Usage',
    current: 0,
    budget: 100,
    unit: 'MB',
    status: 'good',
    description: 'JavaScript heap memory consumption',
  },
  {
    name: 'First Input Delay',
    current: 0,
    budget: 100,
    unit: 'ms',
    status: 'good',
    description: 'Time to first user interaction',
  },
  {
    name: 'Cumulative Layout Shift',
    current: 0,
    budget: 0.1,
    unit: '',
    status: 'good',
    description: 'Visual stability score',
  },
  {
    name: 'Scroll Smoothness',
    current: 100,
    budget: 95,
    unit: '%',
    status: 'good',
    description: 'Scroll performance score',
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate performance score based on multiple metrics
 */
function calculatePerformanceScore(metrics: QuantumPerformanceMetrics): number {
  const weights = {
    renderTime: 0.25,
    firstInputDelay: 0.2,
    largestContentfulPaint: 0.2,
    cumulativeLayoutShift: 0.15,
    scrollSmoothness: 0.15,
    memoryUsage: 0.05,
  };

  // Normalize metrics to 0-100 scale (higher is better)
  const normalizedMetrics = {
    renderTime: Math.max(0, 100 - (metrics.renderTime / 16) * 100),
    firstInputDelay: Math.max(0, 100 - (metrics.firstInputDelay / 100) * 100),
    largestContentfulPaint: Math.max(0, 100 - (metrics.largestContentfulPaint / 2500) * 100),
    cumulativeLayoutShift: Math.max(0, 100 - (metrics.cumulativeLayoutShift / 0.1) * 100),
    scrollSmoothness: metrics.scrollSmoothness,
    memoryUsage: Math.max(0, 100 - (metrics.memoryUsage / 100) * 100),
  };

  const score = Object.entries(weights).reduce((acc, [key, weight]) => {
    return acc + normalizedMetrics[key as keyof typeof normalizedMetrics] * weight;
  }, 0);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate trend for a metric
 */
function calculateTrend(current: number, previous: number): MetricTrend {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  let trend: MetricTrend['trend'] = 'stable';
  if (Math.abs(changePercent) > 5) {
    trend = change > 0 ? 'up' : 'down';
  }

  return { current, previous, change, changePercent, trend };
}

/**
 * Format metric value with appropriate units and precision
 */
function formatMetricValue(value: number, unit: string): string {
  switch (unit) {
    case 'ms':
      return value < 1000 ? `${value.toFixed(1)}ms` : `${(value / 1000).toFixed(2)}s`;
    case 'MB':
      return `${value.toFixed(1)}MB`;
    case '%':
      return `${value.toFixed(1)}%`;
    case 'score':
      return `${value.toFixed(0)}/100`;
    default:
      return value.toFixed(2);
  }
}

/**
 * Get status color for performance metrics
 */
function getStatusColor(status: PerformanceBudget['status']): string {
  switch (status) {
    case 'good':
      return 'text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */';
    case 'warning':
      return 'text-yellow-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */';
    case 'critical':
      return 'text-red-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */';
    default:
      return 'text-gray-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */';
  }
}

/**
 * Calculate feature utilization score
 */
function calculateFeatureUtilization(
  featureFlags: QuantumFeatureFlags,
  engagementMetrics: QuantumEngagementMetrics
): number {
  const enabledFlags = Object.values(featureFlags).filter(Boolean).length;
  const totalFlags = Object.keys(featureFlags).length;
  const utilizationSum = Object.values(engagementMetrics.featureUtilization).reduce(
    (sum, utilization) => sum + utilization,
    0
  );

  const baseScore = (enabledFlags / totalFlags) * 100;
  const utilizationScore = (utilizationSum / totalFlags) * 100;

  return (baseScore + utilizationScore) / 2;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Performance metrics overview card
 */
function PerformanceOverview({
  metrics,
  performanceScore,
}: {
  metrics: QuantumPerformanceMetrics;
  performanceScore: number;
}) {
  const budgets = PERFORMANCE_BUDGETS.map((budget) => {
    let current = 0;
    let status: PerformanceBudget['status'] = 'good';

    switch (budget.name) {
      case 'Render Time':
        current = metrics.renderTime;
        status =
          current <= budget.budget
            ? 'good'
            : current <= budget.budget * 1.5
              ? 'warning'
              : 'critical';
        break;
      case 'Memory Usage':
        current = metrics.memoryUsage;
        status =
          current <= budget.budget
            ? 'good'
            : current <= budget.budget * 1.5
              ? 'warning'
              : 'critical';
        break;
      case 'First Input Delay':
        current = metrics.firstInputDelay;
        status =
          current <= budget.budget
            ? 'good'
            : current <= budget.budget * 1.5
              ? 'warning'
              : 'critical';
        break;
      case 'Cumulative Layout Shift':
        current = metrics.cumulativeLayoutShift;
        status =
          current <= budget.budget ? 'good' : current <= budget.budget * 2 ? 'warning' : 'critical';
        break;
      case 'Scroll Smoothness':
        current = metrics.scrollSmoothness;
        status =
          current >= budget.budget
            ? 'good'
            : current >= budget.budget * 0.9
              ? 'warning'
              : 'critical';
        break;
    }

    return { ...budget, current, status };
  });

  const goodCount = budgets.filter((b) => b.status === 'good').length;
  const warningCount = budgets.filter((b) => b.status === 'warning').length;
  const criticalCount = budgets.filter((b) => b.status === 'critical').length;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Performance Score</h3>
          <Badge
            variant={
              performanceScore >= 90
                ? 'default'
                : performanceScore >= 70
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {performanceScore >= 90
              ? 'Excellent'
              : performanceScore >= 70
                ? 'Good'
                : 'Needs Improvement'}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">{performanceScore.toFixed(0)}</div>
          <div className="flex-1">
            <Progress value={performanceScore} className="h-2" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ rounded" />
            <span>{goodCount} Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ rounded" />
            <span>{warningCount} Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ rounded" />
            <span>{criticalCount} Critical</span>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="space-y-3">
        {budgets.map((budget) => (
          <div key={budget.name} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{budget.name}</span>
                <Badge
                  variant={
                    budget.status === 'good'
                      ? 'default'
                      : budget.status === 'warning'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {budget.status}
                </Badge>
              </div>
              <div className={cn('font-semibold', getStatusColor(budget.status))}>
                {formatMetricValue(budget.current, budget.unit)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{budget.description}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress
                  value={
                    budget.name === 'Scroll Smoothness'
                      ? budget.current
                      : Math.max(0, 100 - (budget.current / budget.budget) * 100)
                  }
                  className="h-1"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Budget: {formatMetricValue(budget.budget, budget.unit)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * User engagement metrics display
 */
function EngagementMetrics({ metrics }: { metrics: QuantumEngagementMetrics }) {
  const engagementScore =
    (metrics.taskCompletionRate * 0.3 +
      (metrics.sessionDuration / 60) * 0.1 + // Normalize to hours
      (metrics.userRetentionRate || 0) * 0.3 +
      (metrics.featureFeedbackScore / 5) * 0.3) *
    100;

  const topFeatures = Object.entries(metrics.featureUtilization)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([feature, utilization]) => ({
      feature: feature
        .replace(/^enable/, '')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase(),
      utilization: utilization * 100,
    }));

  return (
    <div className="space-y-4">
      {/* Engagement Score */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Engagement Score</h3>
          <Badge
            variant={
              engagementScore >= 80
                ? 'default'
                : engagementScore >= 60
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {engagementScore >= 80 ? 'High' : engagementScore >= 60 ? 'Medium' : 'Low'}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">{engagementScore.toFixed(0)}</div>
          <div className="flex-1">
            <Progress value={engagementScore} className="h-2" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Task Completion</div>
          <div className="text-xl font-semibold">
            {(metrics.taskCompletionRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Session Duration</div>
          <div className="text-xl font-semibold">{metrics.sessionDuration.toFixed(1)}m</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Events Created</div>
          <div className="text-xl font-semibold">
            {metrics.averageEventsCreatedPerSession.toFixed(1)}
          </div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Error Recovery</div>
          <div className="text-xl font-semibold">
            {(metrics.errorRecoveryRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Top Features */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-3">Most Used Features</h4>
        <div className="space-y-2">
          {topFeatures.map(({ feature, utilization }) => (
            <div key={feature} className="flex items-center justify-between">
              <span className="text-sm capitalize">{feature}</span>
              <div className="flex items-center gap-2">
                <Progress value={utilization} className="w-20 h-2" />
                <span className="text-sm text-muted-foreground w-10">
                  {utilization.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interaction Method */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-2">Primary Interaction</h4>
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold capitalize">{metrics.primaryInteractionMethod}</div>
          <Badge variant="outline">{metrics.calendarNavigationPattern}</Badge>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature utilization breakdown
 */
function FeatureAnalysis({
  featureFlags,
  engagementMetrics,
}: {
  featureFlags: QuantumFeatureFlags;
  engagementMetrics: QuantumEngagementMetrics;
}) {
  const features = Object.entries(featureFlags).map(([flag, enabled]) => {
    const utilization =
      engagementMetrics.featureUtilization[flag as keyof QuantumFeatureFlags] || 0;
    const name = flag
      .replace(/^enable/, '')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase();

    return {
      flag,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      enabled,
      utilization: utilization * 100,
      category: getFeatureCategory(flag),
    };
  });

  const enabledFeatures = features.filter((f) => f.enabled);
  const utilizationScore = calculateFeatureUtilization(featureFlags, engagementMetrics);

  return (
    <div className="space-y-4">
      {/* Feature Utilization Score */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Feature Utilization</h3>
          <Badge
            variant={
              utilizationScore >= 70
                ? 'default'
                : utilizationScore >= 50
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {utilizationScore >= 70 ? 'High' : utilizationScore >= 50 ? 'Medium' : 'Low'}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">{utilizationScore.toFixed(0)}%</div>
          <div className="flex-1">
            <Progress value={utilizationScore} className="h-2" />
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {enabledFeatures.length} of {features.length} features enabled
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature.flag} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{feature.name}</span>
                <Badge variant={feature.enabled ? 'default' : 'outline'}>
                  {feature.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Badge variant="secondary">{feature.category}</Badge>
              </div>
              {feature.enabled && (
                <div className="text-sm font-semibold">{feature.utilization.toFixed(1)}%</div>
              )}
            </div>
            {feature.enabled && (
              <div className="flex items-center gap-2">
                <Progress value={feature.utilization} className="flex-1 h-1" />
                <span className="text-xs text-muted-foreground">Usage Rate</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to categorize features
function getFeatureCategory(flag: string): string {
  if (
    flag.includes('Subgrid') ||
    flag.includes('ContainerQueries') ||
    flag.includes('FluidTypography')
  ) {
    return 'CSS';
  }
  if (flag.includes('Physics') || flag.includes('Transitions') || flag.includes('Parallax')) {
    return 'Animation';
  }
  if (flag.includes('Performance') || flag.includes('GPU') || flag.includes('Virtualization')) {
    return 'Performance';
  }
  if (flag.includes('Gesture') || flag.includes('Voice') || flag.includes('Haptic')) {
    return 'Advanced UI';
  }
  if (flag.includes('Analytics') || flag.includes('Tracking') || flag.includes('Error')) {
    return 'Analytics';
  }
  return 'Other';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * QuantumAnalytics - Advanced analytics dashboard
 */
export function QuantumAnalytics({
  performanceMetrics,
  engagementMetrics,
  featureFlags,
  activeVariant,
  sessionId,
  isVisible,
  onClose,
  onExportAnalytics,
  className,
}: QuantumAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState('performance');
  const performanceScore = calculatePerformanceScore(performanceMetrics);

  // Export analytics data
  const handleExportAnalytics = useCallback(() => {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      sessionId,
      performanceMetrics,
      engagementMetrics,
      featureFlags,
      activeVariant: activeVariant?.name,
      performanceScore,
      utilizationScore: calculateFeatureUtilization(featureFlags, engagementMetrics),
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum-analytics-${sessionId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExportAnalytics?.();
  }, [
    sessionId,
    performanceMetrics,
    engagementMetrics,
    featureFlags,
    activeVariant,
    performanceScore,
    onExportAnalytics,
  ]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-4 w-96 max-h-[80vh] overflow-auto bg-background border rounded-lg shadow-lg z-50',
        className
      )}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quantum Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportAnalytics} variant="outline" size="sm">
                Export
              </Button>
              <Button onClick={onClose} variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Session: {sessionId.split('_')[1]}</span>
            {activeVariant && (
              <>
                <span>•</span>
                <Badge variant="outline">{activeVariant.name}</Badge>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-4">
              <PerformanceOverview
                metrics={performanceMetrics}
                performanceScore={performanceScore}
              />
            </TabsContent>

            <TabsContent value="engagement" className="mt-4">
              <EngagementMetrics metrics={engagementMetrics} />
            </TabsContent>

            <TabsContent value="features" className="mt-4">
              <FeatureAnalysis featureFlags={featureFlags} engagementMetrics={engagementMetrics} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuantumAnalytics;
