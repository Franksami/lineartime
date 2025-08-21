'use client'

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsed: number;
  eventCount: number;
}

interface PerformanceMonitorProps {
  eventCount: number;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({ 
  eventCount, 
  className,
  position = 'bottom-right' 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    memoryUsed: 0,
    eventCount: 0
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        
        // Measure memory if available
        let memoryUsed = 0;
        if ('memory' in performance) {
          memoryUsed = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
        }
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsed,
          eventCount
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [eventCount]);

  // Track render time
  useEffect(() => {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(endTime - startTime)
      }));
    });
  }, [eventCount]);

  if (!isVisible || process.env.NODE_ENV === 'production') return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'fps':
        return value >= 60 ? 'text-green-500' : value >= 30 ? 'text-yellow-500' : 'text-red-500';
      case 'memory':
        return value < 100 ? 'text-green-500' : value < 200 ? 'text-yellow-500' : 'text-red-500';
      case 'renderTime':
        return value < 16 ? 'text-green-500' : value < 50 ? 'text-yellow-500' : 'text-red-500';
      case 'events':
        return value < 1000 ? 'text-green-500' : value < 5000 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn(
      "fixed z-50 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg",
      "font-mono text-xs space-y-1 min-w-[180px]",
      positionClasses[position],
      className
    )}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-foreground">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close performance monitor"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getMetricColor('fps', metrics.fps)}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render:</span>
          <span className={getMetricColor('renderTime', metrics.renderTime)}>
            {metrics.renderTime}ms
          </span>
        </div>
        
        {metrics.memoryUsed > 0 && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={getMetricColor('memory', metrics.memoryUsed)}>
              {metrics.memoryUsed}MB
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Events:</span>
          <span className={getMetricColor('events', metrics.eventCount)}>
            {metrics.eventCount}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
        <div>Target: 60fps / &lt;16ms</div>
        <div>Memory: &lt;100MB</div>
      </div>
    </div>
  );
}