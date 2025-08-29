/**
 * Motion Performance Monitor
 * Advanced performance monitoring and optimization for Motion system
 * Ensures 112+ FPS targets and validates animation performance
 */

'use client';

interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  animationCount: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuAccelerated: boolean;
  renderTime: number;
  compositorTime: number;
  layoutThrashing: number;
}

interface AnimationProfile {
  id: string;
  element: Element;
  startTime: number;
  endTime?: number;
  duration: number;
  keyframes: any;
  category: 'feedback' | 'interface' | 'page' | 'scroll';
  performance: PerformanceMetrics;
  optimization: {
    hardwareAccelerated: boolean;
    willChange: boolean;
    transform3d: boolean;
    containLayout: boolean;
  };
}

interface PerformanceThresholds {
  minFPS: number;
  maxFrameDrops: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  maxLayoutThrashing: number;
}

/**
 * Advanced performance monitoring system
 */
export class MotionPerformanceMonitor {
  private isMonitoring = false;
  private animationProfiles = new Map<string, AnimationProfile>();
  private performanceObserver: PerformanceObserver | null = null;
  private frameCallback: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private droppedFrames = 0;
  private currentFPS = 0;

  private thresholds: PerformanceThresholds = {
    minFPS: 112,
    maxFrameDrops: 5,
    maxMemoryUsage: 100, // MB
    maxRenderTime: 8.9, // ~112 FPS = 8.93ms per frame
    maxLayoutThrashing: 3,
  };

  private metrics: PerformanceMetrics = {
    fps: 0,
    frameDrops: 0,
    animationCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    gpuAccelerated: false,
    renderTime: 0,
    compositorTime: 0,
    layoutThrashing: 0,
  };

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds };
    }

    this.initializePerformanceObserver();
    this.detectGPUAcceleration();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.resetMetrics();
    this.startFrameRateMonitoring();
    this.startMemoryMonitoring();

    console.log('🎯 Motion Performance Monitor started - Target: 112+ FPS');
  }

  /**
   * Stop performance monitoring and return results
   */
  stopMonitoring(): PerformanceMetrics & { profiles: AnimationProfile[] } {
    this.isMonitoring = false;
    this.stopFrameRateMonitoring();

    const results = {
      ...this.metrics,
      profiles: Array.from(this.animationProfiles.values()),
    };

    this.generatePerformanceReport(results);
    return results;
  }

  /**
   * Register animation for performance tracking
   */
  registerAnimation(
    id: string,
    element: Element,
    keyframes: any,
    duration: number,
    category: AnimationProfile['category']
  ): void {
    const profile: AnimationProfile = {
      id,
      element,
      startTime: performance.now(),
      duration,
      keyframes,
      category,
      performance: { ...this.metrics },
      optimization: this.analyzeOptimization(element, keyframes),
    };

    this.animationProfiles.set(id, profile);
    this.metrics.animationCount++;

    // Apply optimizations if needed
    this.applyOptimizations(element, profile.optimization);
  }

  /**
   * Complete animation tracking
   */
  completeAnimation(id: string): void {
    const profile = this.animationProfiles.get(id);
    if (profile) {
      profile.endTime = performance.now();
      profile.performance = { ...this.metrics };

      // Check for performance violations
      this.validateAnimationPerformance(profile);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Initialize Performance Observer for detailed metrics
   */
  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe multiple performance entry types
      this.performanceObserver.observe({
        entryTypes: ['measure', 'navigation', 'paint', 'layout-shift'],
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.renderTime = entry.startTime;
        }
        break;

      case 'layout-shift':
        this.metrics.layoutThrashing++;
        break;

      case 'measure':
        if (entry.name.includes('animation')) {
          this.metrics.compositorTime += entry.duration;
        }
        break;
    }
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = (currentTime: number) => {
      frames++;

      if (currentTime - lastTime >= 1000) {
        this.currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
        this.metrics.fps = this.currentFPS;

        // Detect dropped frames
        const expectedFrames = 112; // Target FPS
        const actualFrames = frames;
        this.droppedFrames += Math.max(0, expectedFrames - actualFrames);
        this.metrics.frameDrops = this.droppedFrames;

        // Reset for next measurement
        frames = 0;
        lastTime = currentTime;

        // Performance warnings
        if (this.currentFPS < this.thresholds.minFPS) {
          console.warn(
            `⚠️ Low FPS detected: ${this.currentFPS} (target: ${this.thresholds.minFPS}+)`
          );
        }
      }

      if (this.isMonitoring) {
        this.frameCallback = requestAnimationFrame(measureFPS);
      }
    };

    this.frameCallback = requestAnimationFrame(measureFPS);
  }

  /**
   * Stop frame rate monitoring
   */
  private stopFrameRateMonitoring(): void {
    if (this.frameCallback) {
      cancelAnimationFrame(this.frameCallback);
      this.frameCallback = null;
    }
  }

  /**
   * Monitor memory usage
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // MB

      if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
        console.warn(`⚠️ High memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB`);
      }

      if (this.isMonitoring) {
        setTimeout(checkMemory, 1000);
      }
    };

    checkMemory();
  }

  /**
   * Detect GPU acceleration capabilities
   */
  private detectGPUAcceleration(): void {
    const testElement = document.createElement('div');
    testElement.style.transform = 'translateZ(0)';
    testElement.style.willChange = 'transform';
    document.body.appendChild(testElement);

    const styles = getComputedStyle(testElement);
    this.metrics.gpuAccelerated = styles.transform !== 'none';

    document.body.removeChild(testElement);
  }

  /**
   * Analyze animation for optimization opportunities
   */
  private analyzeOptimization(element: Element, keyframes: any): AnimationProfile['optimization'] {
    const computedStyle = getComputedStyle(element as HTMLElement);
    const transforms = Object.keys(keyframes).filter((key) =>
      ['transform', 'translateX', 'translateY', 'translateZ', 'scale', 'rotate'].includes(key)
    );

    return {
      hardwareAccelerated: this.isHardwareAccelerated(keyframes),
      willChange: computedStyle.willChange !== 'auto',
      transform3d: transforms.length > 0,
      containLayout: computedStyle.contain.includes('layout'),
    };
  }

  /**
   * Check if animation uses hardware-accelerated properties
   */
  private isHardwareAccelerated(keyframes: any): boolean {
    const acceleratedProps = [
      'transform',
      'opacity',
      'filter',
      'clipPath',
      'translateX',
      'translateY',
      'translateZ',
      'scale',
      'scaleX',
      'scaleY',
      'scaleZ',
      'rotate',
      'rotateX',
      'rotateY',
      'rotateZ',
    ];

    return Object.keys(keyframes).some((key) => acceleratedProps.includes(key));
  }

  /**
   * Apply performance optimizations
   */
  private applyOptimizations(
    element: Element,
    optimization: AnimationProfile['optimization']
  ): void {
    const htmlElement = element as HTMLElement;

    // Apply will-change hint
    if (optimization.transform3d && !optimization.willChange) {
      htmlElement.style.willChange = 'transform';
    }

    // Force layer creation for GPU acceleration
    if (optimization.hardwareAccelerated && !optimization.transform3d) {
      htmlElement.style.transform = 'translateZ(0)';
    }

    // Apply containment for layout optimizations
    if (!optimization.containLayout) {
      htmlElement.style.contain = 'layout';
    }

    // Optimize for high refresh rates
    htmlElement.style.backfaceVisibility = 'hidden';
    htmlElement.style.perspective = '1000px';
  }

  /**
   * Validate animation performance against thresholds
   */
  private validateAnimationPerformance(profile: AnimationProfile): void {
    const violations: string[] = [];

    if (this.metrics.fps < this.thresholds.minFPS) {
      violations.push(`Low FPS: ${this.metrics.fps} (min: ${this.thresholds.minFPS})`);
    }

    if (this.metrics.frameDrops > this.thresholds.maxFrameDrops) {
      violations.push(
        `Frame drops: ${this.metrics.frameDrops} (max: ${this.thresholds.maxFrameDrops})`
      );
    }

    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      violations.push(
        `Memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB (max: ${this.thresholds.maxMemoryUsage}MB)`
      );
    }

    if (this.metrics.layoutThrashing > this.thresholds.maxLayoutThrashing) {
      violations.push(
        `Layout thrashing: ${this.metrics.layoutThrashing} (max: ${this.thresholds.maxLayoutThrashing})`
      );
    }

    if (violations.length > 0) {
      console.group(`⚠️ Performance violations for animation "${profile.id}"`);
      violations.forEach((violation) => console.warn(violation));
      console.groupEnd();

      // Suggest optimizations
      this.suggestOptimizations(profile, violations);
    }
  }

  /**
   * Suggest performance optimizations
   */
  private suggestOptimizations(profile: AnimationProfile, _violations: string[]): void {
    const suggestions: string[] = [];

    if (!profile.optimization.hardwareAccelerated) {
      suggestions.push('Use hardware-accelerated properties (transform, opacity, filter)');
    }

    if (!profile.optimization.willChange) {
      suggestions.push('Add will-change CSS property');
    }

    if (!profile.optimization.transform3d) {
      suggestions.push('Use transform3d to force GPU layer');
    }

    if (profile.category === 'feedback' && profile.duration > 150) {
      suggestions.push('Reduce feedback animation duration to <150ms');
    }

    if (suggestions.length > 0) {
      console.group('💡 Optimization suggestions:');
      suggestions.forEach((suggestion) => console.info(suggestion));
      console.groupEnd();
    }
  }

  /**
   * Reset performance metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      fps: 0,
      frameDrops: 0,
      animationCount: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      gpuAccelerated: this.metrics.gpuAccelerated,
      renderTime: 0,
      compositorTime: 0,
      layoutThrashing: 0,
    };

    this.animationProfiles.clear();
    this.frameCount = 0;
    this.droppedFrames = 0;
  }

  /**
   * Generate comprehensive performance report
   */
  private generatePerformanceReport(
    results: PerformanceMetrics & { profiles: AnimationProfile[] }
  ): void {
    const passedTests = [
      results.fps >= this.thresholds.minFPS,
      results.frameDrops <= this.thresholds.maxFrameDrops,
      results.memoryUsage <= this.thresholds.maxMemoryUsage,
      results.layoutThrashing <= this.thresholds.maxLayoutThrashing,
    ];

    const score = (passedTests.filter(Boolean).length / passedTests.length) * 100;

    console.group('📊 Motion Performance Report');
    console.info(
      `Overall Score: ${score.toFixed(1)}% ${score >= 90 ? '🎉' : score >= 70 ? '⚠️' : '❌'}`
    );
    console.info(`FPS: ${results.fps} (target: ${this.thresholds.minFPS}+)`);
    console.info(`Frame Drops: ${results.frameDrops}`);
    console.info(`Memory Usage: ${results.memoryUsage.toFixed(1)}MB`);
    console.info(`Animations Tracked: ${results.profiles.length}`);
    console.info(`GPU Acceleration: ${results.gpuAccelerated ? '✅' : '❌'}`);

    // Category breakdown
    const categoryStats = results.profiles.reduce(
      (acc, profile) => {
        acc[profile.category] = (acc[profile.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.info('Animation Categories:', categoryStats);
    console.groupEnd();
  }
}

// Global performance monitor
let globalPerformanceMonitor: MotionPerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(
  customThresholds?: Partial<PerformanceThresholds>
): MotionPerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new MotionPerformanceMonitor(customThresholds);
  }
  return globalPerformanceMonitor;
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(autoStart = false) {
  const [monitor] = React.useState(() => getPerformanceMonitor());
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    if (autoStart) {
      monitor.startMonitoring();

      const interval = setInterval(() => {
        setMetrics(monitor.getCurrentMetrics());
      }, 1000);

      return () => {
        clearInterval(interval);
        monitor.stopMonitoring();
      };
    }
  }, [monitor, autoStart]);

  const startMonitoring = React.useCallback(() => {
    monitor.startMonitoring();
  }, [monitor]);

  const stopMonitoring = React.useCallback(() => {
    const results = monitor.stopMonitoring();
    setMetrics(results);
    return results;
  }, [monitor]);

  return {
    monitor,
    metrics,
    startMonitoring,
    stopMonitoring,
    isMonitoring: metrics !== null,
  };
}

// React import for hook
let React: any;
try {
  React = require('react');
} catch {
  // React not available in Node environment
}

export default {
  MotionPerformanceMonitor,
  getPerformanceMonitor,
  usePerformanceMonitor: React ? usePerformanceMonitor : undefined,
};
