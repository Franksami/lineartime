'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  eventCount: number;
  lastUpdate: number;
}

export function usePerformanceMonitor(eventCount: number) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    eventCount: 0,
    lastUpdate: Date.now(),
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStartTime = useRef(0);

  useEffect(() => {
    let animationId: number;

    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;

      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));

        // Get memory usage if available
        const memoryUsage = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0;

        setMetrics((prev) => ({
          ...prev,
          fps,
          memoryUsage,
          eventCount,
          lastUpdate: Date.now(),
        }));

        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [eventCount]);

  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics((prev) => ({ ...prev, renderTime }));
  }, []);

  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
  };
}
