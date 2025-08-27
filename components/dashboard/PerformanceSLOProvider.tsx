'use client';

import {
  PerformanceMeasurementSystem,
  type PerformanceMeasurements,
} from '@/lib/performance/performanceMeasurement';
import {
  PerformanceRegressionDetector,
  type RegressionAlert,
} from '@/lib/performance/regressionDetector';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface PerformanceSLOContextType {
  isMonitoring: boolean;
  currentMetrics: PerformanceMeasurements | null;
  performanceHistory: PerformanceMeasurements[];
  regressionAlerts: RegressionAlert[];
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
  resolveAlert: (alertId: string) => void;
  getSLOCompliance: () => number;
  getMetricsForTimeRange: (hours: number) => PerformanceMeasurements[];
  capabilities: {
    performanceAPI: boolean;
    performanceObserver: boolean;
    memoryAPI: boolean;
    navigationTiming: boolean;
    paintTiming: boolean;
    layoutShift: boolean;
    largestContentfulPaint: boolean;
  };
}

const PerformanceSLOContext = createContext<PerformanceSLOContextType | null>(null);

interface PerformanceSLOProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
  measurementInterval?: number;
}

export const PerformanceSLOProvider: React.FC<PerformanceSLOProviderProps> = ({
  children,
  autoStart = false,
  measurementInterval = 30000, // 30 seconds
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMeasurements | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMeasurements[]>([]);
  const [regressionAlerts, setRegressionAlerts] = useState<RegressionAlert[]>([]);
  const [measurementSystem, setMeasurementSystem] = useState<PerformanceMeasurementSystem | null>(
    null
  );
  const [regressionDetector, setRegressionDetector] =
    useState<PerformanceRegressionDetector | null>(null);

  // Initialize systems
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const system = new PerformanceMeasurementSystem({
      collectWebVitals: true,
      collectMemoryMetrics: true,
      collectBundleMetrics: true,
      collectDesignSystemMetrics: true,
      onMeasurement: handleNewMeasurement,
    });

    const detector = new PerformanceRegressionDetector();

    setMeasurementSystem(system);
    setRegressionDetector(detector);

    // Auto-start if enabled
    if (autoStart) {
      startMonitoringInternal(system, detector);
    }

    return () => {
      system.stop();
    };
  }, [autoStart, measurementInterval]);

  const handleNewMeasurement = useCallback(
    (measurements: PerformanceMeasurements) => {
      setCurrentMetrics(measurements);

      setPerformanceHistory((prev) => {
        const updated = [...prev, measurements];
        // Keep only last 100 measurements
        return updated.slice(-100);
      });

      // Check for regressions
      if (regressionDetector) {
        const newAlerts = regressionDetector.addDataPoint({
          timestamp: measurements.timestamp,
          loadTime: measurements.loadTime,
          lcp: measurements.largestContentfulPaint,
          fid: measurements.firstInputDelay,
          cls: measurements.cumulativeLayoutShift,
          bundleSize: measurements.bundleSize,
          memoryUsage: measurements.memoryUsage,
          fps: measurements.fps,
          tokenResolution: measurements.tokenResolution,
          componentRender: measurements.componentRender,
        });

        if (newAlerts.length > 0) {
          setRegressionAlerts((prev) => [...prev, ...newAlerts]);
        }
      }
    },
    [regressionDetector]
  );

  const startMonitoringInternal = useCallback(
    (system?: PerformanceMeasurementSystem, detector?: PerformanceRegressionDetector) => {
      const activeSystem = system || measurementSystem;
      const activeDetector = detector || regressionDetector;

      if (!activeSystem || !activeDetector) return;

      activeSystem.start();
      setIsMonitoring(true);

      // Start periodic measurements
      const interval = setInterval(() => {
        if (activeSystem) {
          activeSystem.forceMeasurement();
        }
      }, measurementInterval);

      return () => clearInterval(interval);
    },
    [measurementSystem, regressionDetector, measurementInterval]
  );

  const startMonitoring = useCallback(() => {
    startMonitoringInternal();
  }, [startMonitoringInternal]);

  const stopMonitoring = useCallback(() => {
    if (measurementSystem) {
      measurementSystem.stop();
    }
    setIsMonitoring(false);
  }, [measurementSystem]);

  const clearAlerts = useCallback(() => {
    setRegressionAlerts([]);
  }, []);

  const resolveAlert = useCallback(
    (alertId: string) => {
      if (regressionDetector) {
        regressionDetector.resolveAlert(alertId);
      }
      setRegressionAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
      );
    },
    [regressionDetector]
  );

  const getSLOCompliance = useCallback((): number => {
    if (!currentMetrics) return 0;

    const sloTargets = {
      maxLoadTime: 500,
      maxLCP: 2500,
      maxFID: 100,
      maxCLS: 0.1,
      maxBundleSize: 500,
      maxMemoryUsage: 100,
      minFPS: 112,
      maxTokenResolution: 10,
      maxComponentRender: 1,
    };

    const checks = [
      currentMetrics.loadTime <= sloTargets.maxLoadTime,
      currentMetrics.largestContentfulPaint <= sloTargets.maxLCP,
      currentMetrics.firstInputDelay <= sloTargets.maxFID,
      currentMetrics.cumulativeLayoutShift <= sloTargets.maxCLS,
      currentMetrics.bundleSize <= sloTargets.maxBundleSize,
      currentMetrics.memoryUsage <= sloTargets.maxMemoryUsage,
      currentMetrics.fps >= sloTargets.minFPS,
      currentMetrics.tokenResolution <= sloTargets.maxTokenResolution,
      currentMetrics.componentRender <= sloTargets.maxComponentRender,
    ];

    const passed = checks.filter(Boolean).length;
    return (passed / checks.length) * 100;
  }, [currentMetrics]);

  const getMetricsForTimeRange = useCallback(
    (hours: number): PerformanceMeasurements[] => {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      return performanceHistory.filter((metric) => new Date(metric.timestamp) >= cutoffTime);
    },
    [performanceHistory]
  );

  const capabilities = PerformanceMeasurementSystem.getCapabilities();

  const contextValue: PerformanceSLOContextType = {
    isMonitoring,
    currentMetrics,
    performanceHistory,
    regressionAlerts: regressionAlerts.filter((alert) => !alert.resolved),
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    resolveAlert,
    getSLOCompliance,
    getMetricsForTimeRange,
    capabilities,
  };

  return (
    <PerformanceSLOContext.Provider value={contextValue}>{children}</PerformanceSLOContext.Provider>
  );
};

export const usePerformanceSLO = (): PerformanceSLOContextType => {
  const context = useContext(PerformanceSLOContext);
  if (!context) {
    throw new Error('usePerformanceSLO must be used within a PerformanceSLOProvider');
  }
  return context;
};

// Hook for integration with existing Phase 2.7 analytics
export const usePerformanceAnalytics = () => {
  const slo = usePerformanceSLO();

  const getAnalyticsData = useCallback(() => {
    const recent24h = slo.getMetricsForTimeRange(24);

    if (recent24h.length === 0) return null;

    return {
      // Current performance state
      current: {
        compliance: slo.getSLOCompliance(),
        alerts: slo.regressionAlerts.length,
        monitoring: slo.isMonitoring,
        lastUpdate: slo.currentMetrics?.timestamp,
      },

      // Performance trends (24h)
      trends: {
        loadTime: {
          average: recent24h.reduce((sum, m) => sum + m.loadTime, 0) / recent24h.length,
          trend:
            recent24h.length > 1
              ? (recent24h[recent24h.length - 1].loadTime - recent24h[0].loadTime) /
                recent24h[0].loadTime
              : 0,
        },
        memoryUsage: {
          average: recent24h.reduce((sum, m) => sum + m.memoryUsage, 0) / recent24h.length,
          peak: Math.max(...recent24h.map((m) => m.memoryUsage)),
        },
        fps: {
          average: recent24h.reduce((sum, m) => sum + m.fps, 0) / recent24h.length,
          minimum: Math.min(...recent24h.map((m) => m.fps)),
        },
      },

      // Design system performance
      designSystem: {
        tokenResolution: slo.currentMetrics?.tokenResolution || 0,
        componentRender: slo.currentMetrics?.componentRender || 0,
        efficiency:
          (slo.currentMetrics?.tokenResolution || 0) < 10 &&
          (slo.currentMetrics?.componentRender || 0) < 1,
      },

      // Raw data for charts
      chartData: recent24h.map((metric) => ({
        timestamp: metric.timestamp.toISOString(),
        loadTime: metric.loadTime,
        lcp: metric.largestContentfulPaint,
        fid: metric.firstInputDelay,
        cls: metric.cumulativeLayoutShift,
        memory: metric.memoryUsage,
        fps: metric.fps,
        tokens: metric.tokenResolution,
        components: metric.componentRender,
      })),
    };
  }, [slo]);

  return {
    ...slo,
    getAnalyticsData,
  };
};
