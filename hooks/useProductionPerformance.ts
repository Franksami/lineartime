/**
 * Production Performance Monitoring Hook
 * React hook for comprehensive performance monitoring and optimization
 * Integrates all performance systems with real-time updates
 */

import {
  type PerformanceAlert,
  type ProductionPerformanceConfig,
  type UnifiedPerformanceMetrics,
  productionPerformanceService,
} from '@/lib/performance/productionPerformanceService';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Hook options interface
interface UseProductionPerformanceOptions {
  enableMonitoring?: boolean;
  enableAlerts?: boolean;
  enableAutoOptimization?: boolean;
  alertSeverityFilter?: PerformanceAlert['severity'][];
  updateInterval?: number;
  config?: Partial<ProductionPerformanceConfig>;
}

// Hook return type
interface UseProductionPerformanceReturn {
  // Current state
  metrics: UnifiedPerformanceMetrics;
  alerts: PerformanceAlert[];
  history: UnifiedPerformanceMetrics[];

  // Health indicators
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceScore: number;
  isHealthy: boolean;
  hasAlerts: boolean;
  hasCriticalAlerts: boolean;

  // Optimization recommendations
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action: () => void;
    estimatedImprovement: number;
  }>;

  // Control methods
  optimize: () => void;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  refreshMetrics: () => void;

  // Configuration
  updateConfig: (config: Partial<ProductionPerformanceConfig>) => void;

  // Monitoring controls
  startMonitoring: () => void;
  stopMonitoring: () => void;

  // Status flags
  isMonitoring: boolean;
  isOptimizing: boolean;

  // Detailed breakdowns
  bundleAnalysis: {
    size: number;
    optimizationScore: number;
    chunkCount: number;
    recommendations: string[];
  };

  memoryAnalysis: {
    usage: number;
    leakRisk: number;
    recommendations: string[];
  };

  loadTimeAnalysis: {
    totalTime: number;
    breakdown: {
      TTFB: number;
      FCP: number;
      LCP: number;
      TTI: number;
    };
    recommendations: string[];
  };
}

// Default options
const DEFAULT_OPTIONS: Required<UseProductionPerformanceOptions> = {
  enableMonitoring: true,
  enableAlerts: true,
  enableAutoOptimization: false,
  alertSeverityFilter: ['warning', 'error', 'critical'],
  updateInterval: 5000,
  config: {},
};

/**
 * Production Performance Monitoring Hook
 *
 * @param options Configuration options for performance monitoring
 * @returns Performance monitoring state and control methods
 */
export function useProductionPerformance(
  options: UseProductionPerformanceOptions = {}
): UseProductionPerformanceReturn {
  // Merge options with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
    }),
    [options]
  );

  // State management
  const [metrics, setMetrics] = useState<UnifiedPerformanceMetrics>(
    productionPerformanceService.getMetrics()
  );
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(
    productionPerformanceService.getAlerts()
  );
  const [history, setHistory] = useState<UnifiedPerformanceMetrics[]>(
    productionPerformanceService.getHistory()
  );
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize performance service
  useEffect(() => {
    if (config.config && Object.keys(config.config).length > 0) {
      productionPerformanceService.updateConfig(config.config);
    }

    if (config.enableMonitoring) {
      productionPerformanceService.start();
      setIsMonitoring(true);
    }
  }, [config.config, config.enableMonitoring]);

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribeMetrics = productionPerformanceService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setHistory(productionPerformanceService.getHistory());
    });

    return unsubscribeMetrics;
  }, []);

  // Subscribe to alerts
  useEffect(() => {
    if (!config.enableAlerts) return;

    const unsubscribeAlerts = productionPerformanceService.subscribeToAlerts((alert) => {
      // Filter alerts based on severity
      if (config.alertSeverityFilter.includes(alert.severity)) {
        setAlerts((prev) => [alert, ...prev.slice(0, 99)]);
      }
    });

    return unsubscribeAlerts;
  }, [config.enableAlerts, config.alertSeverityFilter]);

  // Periodic updates for alerts (since they don't have real-time subscription)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAlerts = productionPerformanceService
        .getAlerts()
        .filter((alert) => config.alertSeverityFilter.includes(alert.severity));
      setAlerts(currentAlerts);
    }, config.updateInterval);

    return () => clearInterval(interval);
  }, [config.updateInterval, config.alertSeverityFilter]);

  // Health indicators
  const overallHealth = useMemo(() => metrics.overallHealth, [metrics.overallHealth]);
  const performanceScore = useMemo(() => metrics.performanceScore, [metrics.performanceScore]);
  const isHealthy = useMemo(() => ['excellent', 'good'].includes(overallHealth), [overallHealth]);

  const activeAlerts = useMemo(() => alerts.filter((alert) => !alert.acknowledged), [alerts]);

  const hasAlerts = useMemo(() => activeAlerts.length > 0, [activeAlerts]);
  const hasCriticalAlerts = useMemo(
    () => activeAlerts.some((alert) => alert.severity === 'critical'),
    [activeAlerts]
  );

  // Generate optimization recommendations
  const recommendations = useMemo(() => {
    const recs: Array<{
      category: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      action: () => void;
      estimatedImprovement: number;
    }> = [];

    // Bundle optimization recommendations
    if (metrics.bundle.totalSize > 2000000) {
      // 2MB
      recs.push({
        category: 'bundle',
        priority: metrics.bundle.totalSize > 2500000 ? 'critical' : 'high',
        description: `Bundle size is ${Math.round((metrics.bundle.totalSize / 1024 / 1024) * 10) / 10}MB, exceeding 2MB target`,
        action: () => {
          console.log('Triggering bundle optimization...');
          // In real implementation, would trigger specific bundle optimizations
        },
        estimatedImprovement: Math.floor((metrics.bundle.totalSize - 2000000) * 0.3),
      });
    }

    // Memory optimization recommendations
    if (metrics.memory.heapUsed > 80000000) {
      // 80MB
      recs.push({
        category: 'memory',
        priority: metrics.memory.heapUsed > 100000000 ? 'critical' : 'high',
        description: `Memory usage is ${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB, exceeding 80MB target`,
        action: () => {
          console.log('Triggering memory optimization...');
          // In real implementation, would trigger memory cleanup
        },
        estimatedImprovement: Math.floor((metrics.memory.heapUsed - 80000000) * 0.5),
      });
    }

    // Load time optimization recommendations
    if (metrics.loadTime.totalLoadTime > 1000) {
      // 1s
      recs.push({
        category: 'load-time',
        priority: metrics.loadTime.totalLoadTime > 2000 ? 'critical' : 'medium',
        description: `Load time is ${metrics.loadTime.totalLoadTime}ms, exceeding 1s target`,
        action: () => {
          console.log('Triggering load time optimization...');
          // In real implementation, would trigger load time optimizations
        },
        estimatedImprovement: Math.floor((metrics.loadTime.totalLoadTime - 1000) * 0.4),
      });
    }

    // FPS optimization recommendations
    if (metrics.userExperience.fps < 60) {
      recs.push({
        category: 'user-experience',
        priority: metrics.userExperience.fps < 30 ? 'critical' : 'medium',
        description: `FPS is ${Math.round(metrics.userExperience.fps)}, below 60 FPS target`,
        action: () => {
          console.log('Triggering FPS optimization...');
          // In real implementation, would trigger rendering optimizations
        },
        estimatedImprovement: Math.floor((60 - metrics.userExperience.fps) * 2),
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [metrics]);

  // Detailed analysis breakdowns
  const bundleAnalysis = useMemo(
    () => ({
      size: metrics.bundle.totalSize,
      optimizationScore: metrics.bundle.optimizationScore,
      chunkCount: metrics.bundle.chunkCount,
      recommendations: [
        metrics.bundle.totalSize > 2000000 ? 'Implement code splitting and dynamic imports' : '',
        metrics.bundle.chunkCount > 10 ? 'Consider chunk consolidation for better caching' : '',
        metrics.bundle.optimizationScore < 70 ? 'Enable tree shaking and minification' : '',
      ].filter(Boolean),
    }),
    [metrics.bundle]
  );

  const memoryAnalysis = useMemo(
    () => ({
      usage: metrics.memory.heapUsed,
      leakRisk: metrics.memory.leakRisk,
      recommendations: [
        metrics.memory.heapUsed > 80000000
          ? 'Optimize memory usage and cleanup unused resources'
          : '',
        metrics.memory.leakRisk > 0.5 ? 'Investigate potential memory leaks' : '',
        metrics.memory.gcFrequency > 5 ? 'Reduce object allocation to minimize GC pressure' : '',
      ].filter(Boolean),
    }),
    [metrics.memory]
  );

  const loadTimeAnalysis = useMemo(
    () => ({
      totalTime: metrics.loadTime.totalLoadTime,
      breakdown: {
        TTFB: metrics.loadTime.TTFB,
        FCP: metrics.loadTime.FCP,
        LCP: metrics.loadTime.LCP,
        TTI: metrics.loadTime.TTI,
      },
      recommendations: [
        metrics.loadTime.TTFB > 500 ? 'Optimize server response time' : '',
        metrics.loadTime.FCP > 1500 ? 'Optimize critical rendering path' : '',
        metrics.loadTime.LCP > 2500 ? 'Optimize largest contentful paint' : '',
        metrics.loadTime.TTI > 3000 ? 'Reduce JavaScript execution time' : '',
      ].filter(Boolean),
    }),
    [metrics.loadTime]
  );

  // Control methods
  const optimize = useCallback(async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);

    try {
      productionPerformanceService.optimize();

      // Wait for optimization to complete and metrics to update
      setTimeout(() => {
        setIsOptimizing(false);
      }, 2000);
    } catch (error) {
      console.error('Optimization failed:', error);
      setIsOptimizing(false);
    }
  }, [isOptimizing]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    productionPerformanceService.acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true, resolvedAt: Date.now() } : alert
      )
    );
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
    activeAlerts.forEach((alert) => {
      productionPerformanceService.acknowledgeAlert(alert.id);
    });

    setAlerts((prev) =>
      prev.map((alert) =>
        !alert.acknowledged ? { ...alert, acknowledged: true, resolvedAt: Date.now() } : alert
      )
    );
  }, [alerts]);

  const refreshMetrics = useCallback(() => {
    setMetrics(productionPerformanceService.getMetrics());
    setHistory(productionPerformanceService.getHistory());
    setAlerts(
      productionPerformanceService
        .getAlerts()
        .filter((alert) => config.alertSeverityFilter.includes(alert.severity))
    );
  }, [config.alertSeverityFilter]);

  const updateConfig = useCallback((newConfig: Partial<ProductionPerformanceConfig>) => {
    productionPerformanceService.updateConfig(newConfig);
  }, []);

  const startMonitoring = useCallback(() => {
    productionPerformanceService.start();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    productionPerformanceService.stop();
    setIsMonitoring(false);
  }, []);

  // Auto-optimization effect
  useEffect(() => {
    if (!config.enableAutoOptimization) return;

    // Auto-optimize when performance score drops below 60
    if (performanceScore < 60 && !isOptimizing) {
      optimize();
    }
  }, [performanceScore, isOptimizing, optimize, config.enableAutoOptimization]);

  return {
    // Current state
    metrics,
    alerts: activeAlerts,
    history,

    // Health indicators
    overallHealth,
    performanceScore,
    isHealthy,
    hasAlerts,
    hasCriticalAlerts,

    // Optimization recommendations
    recommendations,

    // Control methods
    optimize,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    refreshMetrics,
    updateConfig,

    // Monitoring controls
    startMonitoring,
    stopMonitoring,

    // Status flags
    isMonitoring,
    isOptimizing,

    // Detailed breakdowns
    bundleAnalysis,
    memoryAnalysis,
    loadTimeAnalysis,
  };
}

/**
 * Lightweight hook for basic performance monitoring
 * Returns only essential performance metrics
 */
export function useBasicPerformanceMetrics() {
  const [metrics, setMetrics] = useState(productionPerformanceService.getMetrics());

  useEffect(() => {
    const unsubscribe = productionPerformanceService.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  return {
    overallHealth: metrics.overallHealth,
    performanceScore: metrics.performanceScore,
    loadTime: metrics.loadTime.totalLoadTime,
    memoryUsage: metrics.memory.heapUsed,
    fps: metrics.userExperience.fps,
  };
}

/**
 * Hook for performance alerts only
 * Useful for components that only need to show alerts
 */
export function usePerformanceAlerts(
  severityFilter: PerformanceAlert['severity'][] = ['error', 'critical']
) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  useEffect(() => {
    const unsubscribe = productionPerformanceService.subscribeToAlerts((alert) => {
      if (severityFilter.includes(alert.severity)) {
        setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
      }
    });

    // Initial load
    const currentAlerts = productionPerformanceService
      .getAlerts()
      .filter((alert) => severityFilter.includes(alert.severity) && !alert.acknowledged);
    setAlerts(currentAlerts);

    return unsubscribe;
  }, [severityFilter]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    productionPerformanceService.acknowledgeAlert(alertId);
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  return {
    alerts: alerts.filter((alert) => !alert.acknowledged),
    acknowledgeAlert,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter((alert) => alert.severity === 'critical'),
  };
}

/**
 * Hook for performance optimization recommendations
 * Returns actionable recommendations based on current metrics
 */
export function usePerformanceRecommendations() {
  const { recommendations, optimize, isOptimizing } = useProductionPerformance({
    enableMonitoring: true,
    enableAlerts: false,
    enableAutoOptimization: false,
  });

  const applyRecommendation = useCallback(
    (index: number) => {
      if (recommendations[index]) {
        recommendations[index].action();
      }
    },
    [recommendations]
  );

  const applyAllRecommendations = useCallback(() => {
    recommendations.forEach((rec) => rec.action());
  }, [recommendations]);

  return {
    recommendations,
    optimize,
    isOptimizing,
    applyRecommendation,
    applyAllRecommendations,
    hasRecommendations: recommendations.length > 0,
    highPriorityRecommendations: recommendations.filter(
      (rec) => rec.priority === 'critical' || rec.priority === 'high'
    ),
  };
}
