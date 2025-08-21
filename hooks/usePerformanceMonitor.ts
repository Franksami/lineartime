import { useEffect, useState, useCallback } from 'react';
import { 
  performanceMonitor, 
  PerformanceMetrics, 
  PerformanceAlert,
  PerformanceThresholds 
} from '@/lib/performance/PerformanceMonitor';

export interface UsePerformanceMonitorOptions {
  /**
   * Enable automatic monitoring on mount
   */
  autoStart?: boolean;
  
  /**
   * Custom performance thresholds
   */
  thresholds?: Partial<PerformanceThresholds>;
  
  /**
   * Callback when performance degrades
   */
  onPerformanceIssue?: (alert: PerformanceAlert) => void;
  
  /**
   * Callback when metrics update
   */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    autoStart = true,
    thresholds,
    onPerformanceIssue,
    onMetricsUpdate,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Set custom thresholds if provided
  useEffect(() => {
    if (thresholds) {
      performanceMonitor.setThresholds(thresholds);
    }
  }, [thresholds]);

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    });

    // Get initial metrics
    setMetrics(performanceMonitor.getMetrics());

    return unsubscribe;
  }, [onMetricsUpdate]);

  // Subscribe to alerts
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribeToAlerts((alert) => {
      setAlerts((prev) => [...prev, alert]);
      onPerformanceIssue?.(alert);
    });

    // Get initial alerts
    setAlerts(performanceMonitor.getAlerts());

    return unsubscribe;
  }, [onPerformanceIssue]);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart) {
      setIsMonitoring(true);
    }
  }, [autoStart]);

  // Performance marking utilities
  const markStart = useCallback((name: string) => {
    performance.mark(`${name}-start`);
  }, []);

  const markEnd = useCallback((name: string) => {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(endMark);
    
    try {
      performance.measure(name, startMark, endMark);
      
      // Get the measure
      const measures = performance.getEntriesByName(name, 'measure');
      const measure = measures[measures.length - 1];
      
      if (measure) {
        return measure.duration;
      }
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
    }
    
    return null;
  }, []);

  // Measure a function's execution time
  const measureFunction = useCallback(async <T,>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<T> => {
    markStart(name);
    
    try {
      const result = await fn();
      const duration = markEnd(name);
      
      if (duration !== null) {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      markEnd(name);
      throw error;
    }
  }, [markStart, markEnd]);

  // Get performance report
  const getReport = useCallback(() => {
    return performanceMonitor.generateReport();
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    performanceMonitor.clearAlerts();
    setAlerts([]);
  }, []);

  // Get metrics history
  const getHistory = useCallback(() => {
    return performanceMonitor.getHistory();
  }, []);

  // Check if performance is degraded
  const isPerformanceDegraded = useCallback(() => {
    if (!metrics) return false;
    
    return metrics.overallHealth === 'poor' || metrics.overallHealth === 'critical';
  }, [metrics]);

  // Get specific metric status
  const getMetricStatus = useCallback((
    metricName: keyof PerformanceMetrics
  ): 'good' | 'warning' | 'error' | 'unknown' => {
    if (!metrics) return 'unknown';
    
    const value = metrics[metricName];
    if (typeof value !== 'number') return 'unknown';
    
    // Define thresholds for common metrics
    const metricThresholds: Record<string, { good: number; warning: number }> = {
      fps: { good: 50, warning: 30 },
      frameTimeAvg: { good: 20, warning: 33 },
      heapUsed: { good: 300, warning: 500 },
      domNodes: { good: 5000, warning: 8000 },
      leakRisk: { good: 0.3, warning: 0.6 },
      renderQueueSize: { good: 30, warning: 60 },
      droppedFrames: { good: 5, warning: 20 },
    };
    
    const threshold = metricThresholds[metricName];
    if (!threshold) return 'unknown';
    
    // For FPS, higher is better
    if (metricName === 'fps') {
      if (value >= threshold.good) return 'good';
      if (value >= threshold.warning) return 'warning';
      return 'error';
    }
    
    // For other metrics, lower is better
    if (value <= threshold.good) return 'good';
    if (value <= threshold.warning) return 'warning';
    return 'error';
  }, [metrics]);

  return {
    // State
    metrics,
    alerts,
    isMonitoring,
    
    // Performance status
    isPerformanceDegraded: isPerformanceDegraded(),
    overallHealth: metrics?.overallHealth,
    performanceScore: metrics?.performanceScore,
    qualityScore: metrics?.qualityScore,
    
    // Utilities
    markStart,
    markEnd,
    measureFunction,
    getReport,
    clearAlerts,
    getHistory,
    getMetricStatus,
    
    // Key metrics
    fps: metrics?.fps,
    frameTime: metrics?.frameTimeAvg,
    memoryUsage: metrics?.heapUsed,
    domNodes: metrics?.domNodes,
    leakRisk: metrics?.leakRisk,
  };
}