/**
 * Animation Performance Monitor
 * Tracks animation performance, FPS, and render metrics
 * Integrates with React Scan for comprehensive monitoring
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderCount: number;
  animationDuration: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface AnimationPerformanceConfig {
  targetFPS: number;
  maxRenderCount: number;
  trackMemory: boolean;
  logWarnings: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export class AnimationMonitor {
  private metrics: PerformanceMetrics[] = [];
  private config: AnimationPerformanceConfig;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private renderObserver?: PerformanceObserver;

  constructor(config: Partial<AnimationPerformanceConfig> = {}) {
    this.config = {
      targetFPS: 60,
      maxRenderCount: 5,
      trackMemory: true,
      logWarnings: true,
      ...config,
    };

    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.renderObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'measure' && entry.name.includes('animation')) {
            this.trackAnimationPerformance(entry as PerformanceMeasure);
          }
        }
      });

      try {
        this.renderObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  startMonitoring() {
    if (typeof window === 'undefined') return;

    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
      }

      const deltaTime = timestamp - this.lastFrameTime;
      const fps = deltaTime > 0 ? 1000 / deltaTime : 0;

      this.frameCount++;

      // Collect metrics every 60 frames (roughly 1 second at 60fps)
      if (this.frameCount >= 60) {
        const metrics: PerformanceMetrics = {
          fps: Math.round(fps),
          frameTime: deltaTime,
          renderCount: this.frameCount,
          animationDuration: timestamp,
          timestamp: Date.now(),
        };

        // Track memory usage if supported and enabled
        if (this.config.trackMemory && 'memory' in performance) {
          // @ts-ignore - memory is not in all Performance types
          metrics.memoryUsage = performance.memory?.usedJSHeapSize || 0;
        }

        this.recordMetrics(metrics);
        this.frameCount = 0;
      }

      this.lastFrameTime = timestamp;
      this.animationId = requestAnimationFrame(measureFrame);
    };

    this.animationId = requestAnimationFrame(measureFrame);
  }

  stopMonitoring() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.renderObserver) {
      this.renderObserver.disconnect();
    }
  }

  private trackAnimationPerformance(entry: PerformanceMeasure) {
    const metrics: PerformanceMetrics = {
      fps: 0, // Will be calculated by frame monitoring
      frameTime: entry.duration,
      renderCount: 1,
      animationDuration: entry.duration,
      timestamp: Date.now(),
    };

    this.recordMetrics(metrics);
  }

  private recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for performance issues
    this.checkPerformanceIssues(metrics);

    // Notify listeners
    if (this.config.onMetricsUpdate) {
      this.config.onMetricsUpdate(metrics);
    }
  }

  private checkPerformanceIssues(metrics: PerformanceMetrics) {
    if (!this.config.logWarnings) return;

    // Check FPS performance
    if (metrics.fps > 0 && metrics.fps < this.config.targetFPS * 0.8) {
      console.warn(
        `🎬 Animation FPS below target: ${metrics.fps}fps (target: ${this.config.targetFPS}fps)`
      );
    }

    // Check excessive renders
    if (metrics.renderCount > this.config.maxRenderCount) {
      console.warn(
        `🎬 High render count detected: ${metrics.renderCount} (max: ${this.config.maxRenderCount})`
      );
    }

    // Check memory usage (if tracking enabled)
    if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) {
      // 100MB threshold
      console.warn(`🎬 High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Public API methods
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        fps: acc.fps + (metric.fps || 0),
        frameTime: acc.frameTime + metric.frameTime,
        renderCount: acc.renderCount + metric.renderCount,
        animationDuration: acc.animationDuration + metric.animationDuration,
        memoryUsage: acc.memoryUsage + (metric.memoryUsage || 0),
      }),
      { fps: 0, frameTime: 0, renderCount: 0, animationDuration: 0, memoryUsage: 0 }
    );

    const count = this.metrics.length;
    return {
      fps: Math.round(totals.fps / count),
      frameTime: Math.round(totals.frameTime / count),
      renderCount: Math.round(totals.renderCount / count),
      animationDuration: Math.round(totals.animationDuration / count),
      memoryUsage: Math.round(totals.memoryUsage / count),
    };
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Utility method to measure specific animations
  measureAnimation<T>(name: string, animationFn: () => Promise<T>): Promise<T> {
    if (typeof window === 'undefined') return animationFn();

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `animation-${name}`;

    performance.mark(startMark);

    return animationFn().finally(() => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
    });
  }
}

// Global animation monitor instance
export const animationMonitor = new AnimationMonitor({
  targetFPS: 60,
  maxRenderCount: 5,
  trackMemory: true,
  logWarnings: process.env.NODE_ENV === 'development',
});

// Auto-start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  animationMonitor.startMonitoring();
}
