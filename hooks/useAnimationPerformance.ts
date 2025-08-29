/**
 * React hook for animation performance monitoring
 * Provides real-time performance metrics and utilities for animation tracking
 */

import { type PerformanceMetrics, animationMonitor } from '@/lib/performance/AnimationMonitor';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AnimationPerformanceHook {
  metrics: PerformanceMetrics | null;
  averageMetrics: Partial<PerformanceMetrics>;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  measureAnimation: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  clearMetrics: () => void;
}

export function useAnimationPerformance(): AnimationPerformanceHook {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update metrics from the global monitor
  const updateMetrics = useCallback(() => {
    const allMetrics = animationMonitor.getMetrics();
    if (allMetrics.length > 0) {
      setMetrics(allMetrics[allMetrics.length - 1]); // Get latest metrics
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    animationMonitor.startMonitoring();
    setIsMonitoring(true);

    // Update metrics every second
    intervalRef.current = setInterval(updateMetrics, 1000);
  }, [isMonitoring, updateMetrics]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    animationMonitor.stopMonitoring();
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isMonitoring]);

  const measureAnimation = useCallback(<T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return animationMonitor.measureAnimation(name, fn);
  }, []);

  const clearMetrics = useCallback(() => {
    animationMonitor.clearMetrics();
    setMetrics(null);
  }, []);

  const averageMetrics = animationMonitor.getAverageMetrics();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    averageMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureAnimation,
    clearMetrics,
  };
}

// Specialized hook for component-specific performance tracking
export function useComponentPerformance(componentName: string) {
  const { measureAnimation } = useAnimationPerformance();
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current++;

    // Log excessive renders in development
    if (process.env.NODE_ENV === 'development' && renderCountRef.current > 10) {
      console.warn(`🎬 High render count for ${componentName}: ${renderCountRef.current}`);
    }
  });

  const measureComponentAnimation = useCallback(
    <T>(animationName: string, fn: () => Promise<T>): Promise<T> => {
      return measureAnimation(`${componentName}-${animationName}`, fn);
    },
    [componentName, measureAnimation]
  );

  return {
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
    measureAnimation: measureComponentAnimation,
  };
}
