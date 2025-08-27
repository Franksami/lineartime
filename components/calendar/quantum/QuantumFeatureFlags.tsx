'use client';

/**
 * QuantumFeatureFlags - A/B Testing and Feature Flag Management
 *
 * Provides comprehensive feature flag management, A/B testing integration,
 * and gradual rollout capabilities for quantum calendar features.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Activity,
  BarChart3,
  Beaker,
  Eye,
  EyeOff,
  Gauge,
  Settings,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

import type {
  FeatureFlagEvaluation,
  QuantumABTestConfig,
  QuantumEngagementMetrics,
  QuantumFeatureFlags,
  QuantumPerformanceMetrics,
  QuantumVariant,
} from '@/types/quantum-calendar';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface QuantumFeatureFlagsProps {
  currentFlags: QuantumFeatureFlags;
  activeVariant?: QuantumVariant | null;
  performanceMetrics?: QuantumPerformanceMetrics;
  engagementMetrics?: QuantumEngagementMetrics;
  abTestConfig?: QuantumABTestConfig;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onFlagChange: (flag: keyof QuantumFeatureFlags, enabled: boolean) => void;
  onVariantChange?: (variant: QuantumVariant) => void;
  onExportConfig?: () => void;
  onImportConfig?: (config: Partial<QuantumFeatureFlags>) => void;
  className?: string;
}

interface FeatureFlagCategory {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  flags: (keyof QuantumFeatureFlags)[];
  color: string;
}

// =============================================================================
// FEATURE FLAG CATEGORIES
// =============================================================================

const FEATURE_CATEGORIES: FeatureFlagCategory[] = [
  {
    name: 'CSS Modern Features',
    description: 'Modern CSS capabilities with progressive enhancement',
    icon: Zap,
    color: 'bg-blue-500',
    flags: ['enableSubgrid', 'enableContainerQueries', 'enableFluidTypography'],
  },
  {
    name: 'Micro-Interactions',
    description: 'Physics-based animations and micro-interactions',
    icon: Target,
    color: 'bg-purple-500',
    flags: [
      'enablePhysicsAnimations',
      'enableParallaxEffects',
      'enableElasticScrolling',
      'enableQuantumTransitions',
    ],
  },
  {
    name: 'Performance',
    description: 'Optimization and performance enhancements',
    icon: Gauge,
    color: 'bg-green-500',
    flags: [
      'enableQuantumVirtualization',
      'enableIntersectionObserver',
      'enableWebWorkerCalculations',
      'enableGPUAcceleration',
    ],
  },
  {
    name: 'Advanced UI',
    description: 'Experimental and advanced user interface features',
    icon: Beaker,
    color: 'bg-orange-500',
    flags: [
      'enableMagneticSnapping',
      'enableGestureRecognition',
      'enableVoiceInteraction',
      'enableHapticFeedback',
    ],
  },
  {
    name: 'Analytics',
    description: 'Monitoring and user behavior analytics',
    icon: BarChart3,
    color: 'bg-indigo-500',
    flags: [
      'enablePerformanceTracking',
      'enableUserBehaviorAnalytics',
      'enableA11yMetrics',
      'enableErrorBoundaryReporting',
    ],
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate feature flag impact score based on performance metrics
 */
function calculateImpactScore(
  flag: keyof QuantumFeatureFlags,
  performanceMetrics?: QuantumPerformanceMetrics
): number {
  if (!performanceMetrics) return 0;

  const impactWeights = {
    enableSubgrid: performanceMetrics.subgridRenderTime * 0.3,
    enableContainerQueries: performanceMetrics.containerQueryEvaluationTime * 0.2,
    enablePhysicsAnimations: performanceMetrics.physicsCalculationTime * 0.4,
    enableQuantumVirtualization: (100 - performanceMetrics.scrollSmoothness) * 0.1,
    enablePerformanceTracking: performanceMetrics.renderTime * 0.1,
    enableGPUAcceleration: performanceMetrics.memoryUsage * 0.05,
  } as Partial<Record<keyof QuantumFeatureFlags, number>>;

  return Math.max(0, Math.min(100, impactWeights[flag] || 0));
}

/**
 * Generate feature flag evaluation
 */
function evaluateFeatureFlag(
  flag: keyof QuantumFeatureFlags,
  currentFlags: QuantumFeatureFlags,
  activeVariant?: QuantumVariant | null
): FeatureFlagEvaluation {
  let enabled = currentFlags[flag];
  let reason: FeatureFlagEvaluation['reason'] = 'default';

  if (activeVariant && activeVariant.featureFlags[flag] !== undefined) {
    enabled = activeVariant.featureFlags[flag] as boolean;
    reason = 'variant';
  }

  return {
    flag,
    enabled,
    reason,
    context: {
      variant: activeVariant?.name,
      variantWeight: activeVariant?.weight,
    },
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Feature flag control component
 */
function FeatureFlagControl({
  flag,
  enabled,
  evaluation,
  impactScore,
  onToggle,
}: {
  flag: keyof QuantumFeatureFlags;
  enabled: boolean;
  evaluation: FeatureFlagEvaluation;
  impactScore: number;
  onToggle: (enabled: boolean) => void;
}) {
  const flagDisplayName = flag
    .replace(/^enable/, '')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  const getImpactColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReasonBadge = (reason: FeatureFlagEvaluation['reason']) => {
    switch (reason) {
      case 'variant':
        return <Badge variant="secondary">A/B Test</Badge>;
      case 'override':
        return <Badge variant="outline">Override</Badge>;
      case 'fallback':
        return <Badge variant="destructive">Fallback</Badge>;
      default:
        return <Badge variant="default">Default</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/10 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor={flag} className="font-medium">
            {flagDisplayName}
          </Label>
          {getReasonBadge(evaluation.reason)}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Impact Score:</span>
          <span className={cn('font-medium', getImpactColor(impactScore))}>
            {impactScore.toFixed(1)}%
          </span>
          {impactScore > 0 && <Progress value={impactScore} className="w-20 h-2" />}
        </div>
      </div>
      <Switch
        id={flag}
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={evaluation.reason === 'fallback'}
      />
    </div>
  );
}

/**
 * A/B Test variant selector
 */
function VariantSelector({
  variants,
  activeVariant,
  onVariantChange,
}: {
  variants: QuantumVariant[];
  activeVariant?: QuantumVariant | null;
  onVariantChange?: (variant: QuantumVariant) => void;
}) {
  if (!variants.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium">A/B Test Variants</h4>
      <div className="space-y-2">
        {variants.map((variant) => {
          const isActive = activeVariant?.id === variant.id;
          const flagCount = Object.keys(variant.featureFlags).length;
          const enabledFlags = Object.values(variant.featureFlags).filter(Boolean).length;

          return (
            <div
              key={variant.id}
              className={cn(
                'p-3 border rounded-lg cursor-pointer transition-colors',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50 hover:bg-accent/10'
              )}
              onClick={() => onVariantChange?.(variant)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variant.name}</span>
                  {isActive && <Badge>Active</Badge>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {enabledFlags}/{flagCount} flags
                  </span>
                  <span>•</span>
                  <span>{(variant.weight * 100).toFixed(0)}% traffic</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{variant.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={variant.weight * 100} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground">
                  {(variant.weight * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Performance impact visualization
 */
function PerformanceImpactChart({
  performanceMetrics,
  engagementMetrics,
}: {
  performanceMetrics?: QuantumPerformanceMetrics;
  engagementMetrics?: QuantumEngagementMetrics;
}) {
  if (!performanceMetrics) return null;

  const metrics = [
    {
      name: 'Render Time',
      value: performanceMetrics.renderTime,
      unit: 'ms',
      target: 16,
      color: 'bg-blue-500',
    },
    {
      name: 'Memory Usage',
      value: performanceMetrics.memoryUsage,
      unit: 'MB',
      target: 100,
      color: 'bg-green-500',
    },
    {
      name: 'Scroll Smoothness',
      value: performanceMetrics.scrollSmoothness,
      unit: '%',
      target: 100,
      color: 'bg-purple-500',
    },
    {
      name: 'Interaction Response',
      value: performanceMetrics.interactionResponsiveness,
      unit: 'ms',
      target: 100,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Performance Impact</h4>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const isGood =
            metric.name === 'Scroll Smoothness'
              ? metric.value >= metric.target * 0.9
              : metric.value <= metric.target * 1.1;

          return (
            <div key={metric.name} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                <Badge variant={isGood ? 'default' : 'destructive'}>
                  {isGood ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded', metric.color)} />
                <span className="text-lg font-semibold">{metric.value.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="mt-2">
                <Progress
                  value={
                    metric.name === 'Scroll Smoothness'
                      ? metric.value
                      : Math.max(0, 100 - (metric.value / metric.target) * 100)
                  }
                  className="h-2"
                />
              </div>
            </div>
          );
        })}
      </div>

      {engagementMetrics && (
        <div className="mt-6">
          <h5 className="font-medium mb-3">User Engagement</h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Task Completion</span>
              <div className="text-lg font-semibold">
                {(engagementMetrics.taskCompletionRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Session Duration</span>
              <div className="text-lg font-semibold">
                {engagementMetrics.sessionDuration.toFixed(1)}m
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * QuantumFeatureFlags - Feature flag management and A/B testing panel
 */
export function QuantumFeatureFlags({
  currentFlags,
  activeVariant,
  performanceMetrics,
  engagementMetrics,
  abTestConfig,
  isVisible,
  onToggleVisibility,
  onFlagChange,
  onVariantChange,
  onExportConfig,
  onImportConfig,
  className,
}: QuantumFeatureFlagsProps) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate feature evaluations
  const featureEvaluations = useMemo(() => {
    const evaluations: Record<keyof QuantumFeatureFlags, FeatureFlagEvaluation> = {} as any;
    Object.keys(currentFlags).forEach((flag) => {
      evaluations[flag as keyof QuantumFeatureFlags] = evaluateFeatureFlag(
        flag as keyof QuantumFeatureFlags,
        currentFlags,
        activeVariant
      );
    });
    return evaluations;
  }, [currentFlags, activeVariant]);

  // Calculate impact scores
  const impactScores = useMemo(() => {
    const scores: Record<keyof QuantumFeatureFlags, number> = {} as any;
    Object.keys(currentFlags).forEach((flag) => {
      scores[flag as keyof QuantumFeatureFlags] = calculateImpactScore(
        flag as keyof QuantumFeatureFlags,
        performanceMetrics
      );
    });
    return scores;
  }, [currentFlags, performanceMetrics]);

  // Handle flag toggle
  const handleFlagToggle = useCallback(
    (flag: keyof QuantumFeatureFlags, enabled: boolean) => {
      onFlagChange(flag, enabled);
    },
    [onFlagChange]
  );

  // Export configuration
  const handleExportConfig = useCallback(() => {
    const config = {
      flags: currentFlags,
      variant: activeVariant,
      timestamp: new Date().toISOString(),
      performance: performanceMetrics,
      engagement: engagementMetrics,
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExportConfig?.();
  }, [currentFlags, activeVariant, performanceMetrics, engagementMetrics, onExportConfig]);

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        size="icon"
        variant="default"
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 w-96 max-h-[80vh] overflow-auto bg-background border rounded-lg shadow-lg z-50',
        className
      )}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Quantum Features
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportConfig} variant="outline" size="sm">
                Export
              </Button>
              <Button onClick={onToggleVisibility} variant="ghost" size="icon">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {activeVariant && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{activeVariant.name}</Badge>
              <span className="text-muted-foreground">
                {(activeVariant.weight * 100).toFixed(0)}% traffic
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs
            value={selectedCategory.toString()}
            onValueChange={(value) => setSelectedCategory(Number.parseInt(value))}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="0">Features</TabsTrigger>
              <TabsTrigger value="1">A/B Tests</TabsTrigger>
              <TabsTrigger value="2">Metrics</TabsTrigger>
            </TabsList>

            {/* Feature Flags Tab */}
            <TabsContent value="0" className="space-y-4">
              {FEATURE_CATEGORIES.map((category, index) => (
                <div key={category.name} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded', category.color)} />
                    <h4 className="font-medium">{category.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="space-y-2">
                    {category.flags.map((flag) => (
                      <FeatureFlagControl
                        key={flag}
                        flag={flag}
                        enabled={currentFlags[flag]}
                        evaluation={featureEvaluations[flag]}
                        impactScore={impactScores[flag]}
                        onToggle={(enabled) => handleFlagToggle(flag, enabled)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* A/B Testing Tab */}
            <TabsContent value="1" className="space-y-4">
              {abTestConfig && onVariantChange && (
                <VariantSelector
                  variants={abTestConfig.variants}
                  activeVariant={activeVariant}
                  onVariantChange={onVariantChange}
                />
              )}
              {!abTestConfig && (
                <div className="text-center py-8 text-muted-foreground">
                  <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No A/B tests configured</p>
                </div>
              )}
            </TabsContent>

            {/* Performance Metrics Tab */}
            <TabsContent value="2" className="space-y-4">
              <PerformanceImpactChart
                performanceMetrics={performanceMetrics}
                engagementMetrics={engagementMetrics}
              />
            </TabsContent>
          </Tabs>

          {/* Summary Stats */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Enabled Features:</span>
                <div className="font-semibold">
                  {Object.values(currentFlags).filter(Boolean).length} /{' '}
                  {Object.keys(currentFlags).length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Performance Score:</span>
                <div className="font-semibold text-green-600">
                  {performanceMetrics
                    ? (
                        100 -
                        Object.values(impactScores).reduce((a, b) => a + b, 0) /
                          Object.keys(impactScores).length
                      ).toFixed(0)
                    : '--'}
                  %
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuantumFeatureFlags;
