/**
 * Real-time Performance Measurement System
 *
 * Integrates with the browser's Performance API to collect comprehensive
 * performance metrics for SLO monitoring and regression detection.
 */

export interface PerformanceMeasurements {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  bundleSize: number;
  memoryUsage: number;
  fps: number;
  tokenResolution: number;
  componentRender: number;
  timestamp: Date;
}

export interface PerformanceObserverOptions {
  collectWebVitals: boolean;
  collectMemoryMetrics: boolean;
  collectBundleMetrics: boolean;
  collectDesignSystemMetrics: boolean;
  onMeasurement?: (measurements: PerformanceMeasurements) => void;
}

/**
 * Performance measurement system that works in the browser
 */
export class PerformanceMeasurementSystem {
  private observers: PerformanceObserver[] = [];
  private metrics: Partial<PerformanceMeasurements> = {};
  private options: PerformanceObserverOptions;
  private isRunning = false;
  private fpsData: number[] = [];
  private lastFrameTime = 0;

  constructor(options: PerformanceObserverOptions) {
    this.options = options;
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning || typeof window === 'undefined') {
      return;
    }

    this.isRunning = true;
    this.metrics = {};

    if (this.options.collectWebVitals) {
      this.initWebVitalsCollection();
    }

    if (this.options.collectMemoryMetrics) {
      this.initMemoryCollection();
    }

    if (this.options.collectBundleMetrics) {
      this.initBundleMetricsCollection();
    }

    if (this.options.collectDesignSystemMetrics) {
      this.initDesignSystemMetrics();
    }

    // Collect initial measurements
    this.collectCurrentMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  /**
   * Initialize Web Vitals collection
   */
  private initWebVitalsCollection(): void {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (error) {
      console.warn('FCP observer not supported:', error);
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // First Input Delay - this requires user interaction
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  /**
   * Initialize memory metrics collection
   */
  private initMemoryCollection(): void {
    // Chrome-specific memory API
    if ('memory' in performance) {
      const measureMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      };

      measureMemory();
      setInterval(measureMemory, 5000); // Update every 5 seconds
    }

    // FPS measurement
    this.startFPSMeasurement();
  }

  /**
   * Start FPS measurement using requestAnimationFrame
   */
  private startFPSMeasurement(): void {
    let frames = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      if (!this.isRunning) return;

      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = frames / ((currentTime - lastTime) / 1000);
        this.fpsData.push(fps);

        // Keep only last 10 FPS measurements for smoothing
        if (this.fpsData.length > 10) {
          this.fpsData = this.fpsData.slice(-10);
        }

        this.metrics.fps = this.fpsData.reduce((a, b) => a + b, 0) / this.fpsData.length;

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Initialize bundle metrics collection
   */
  private initBundleMetricsCollection(): void {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(
        (resource) =>
          resource.name.includes('.js') &&
          resource.transferSize &&
          (resource.name.includes('/_next/') || resource.name.includes('/chunks/'))
      );

      const totalSize = jsResources.reduce(
        (total, resource) => total + (resource.transferSize || 0),
        0
      );

      this.metrics.bundleSize = totalSize / 1024; // KB
    } catch (error) {
      console.warn('Bundle metrics collection failed:', error);
    }
  }

  /**
   * Initialize design system performance metrics
   */
  private initDesignSystemMetrics(): void {
    // Measure token resolution time
    this.measureTokenResolutionTime();

    // Measure component render time
    this.measureComponentRenderTime();
  }

  /**
   * Measure CSS custom property resolution performance
   */
  private measureTokenResolutionTime(): void {
    const startTime = performance.now();

    try {
      // Create test element with design system tokens
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
        padding: var(--space-4);
        margin: var(--space-2);
        border-radius: var(--radius);
        font-size: var(--text-sm);
        box-shadow: var(--shadow);
      `;

      // Temporarily add to DOM to force resolution
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      document.body.appendChild(testElement);

      // Force style recalculation
      const computedStyle = getComputedStyle(testElement);
      const _properties = [
        computedStyle.backgroundColor,
        computedStyle.color,
        computedStyle.borderColor,
        computedStyle.padding,
        computedStyle.margin,
        computedStyle.borderRadius,
        computedStyle.fontSize,
      ];

      // Clean up
      document.body.removeChild(testElement);

      this.metrics.tokenResolution = performance.now() - startTime;
    } catch (error) {
      console.warn('Token resolution measurement failed:', error);
      this.metrics.tokenResolution = 0;
    }
  }

  /**
   * Measure component render time (simulated)
   */
  private measureComponentRenderTime(): void {
    const startTime = performance.now();

    try {
      // Simulate component creation and rendering
      const testComponent = document.createElement('div');
      testComponent.className =
        'flex items-center space-x-2 p-4 bg-card border border-border rounded-lg';
      testComponent.innerHTML = `
        <div class="w-4 h-4 bg-primary rounded-full"></div>
        <span class="text-foreground font-medium">Test Component</span>
        <button class="px-3 py-1 bg-primary text-primary-foreground rounded">Action</button>
      `;

      // Add to DOM temporarily
      testComponent.style.position = 'absolute';
      testComponent.style.left = '-9999px';
      document.body.appendChild(testComponent);

      // Force layout
      testComponent.offsetHeight;

      // Clean up
      document.body.removeChild(testComponent);

      this.metrics.componentRender = performance.now() - startTime;
    } catch (error) {
      console.warn('Component render measurement failed:', error);
      this.metrics.componentRender = 0;
    }
  }

  /**
   * Collect current metrics and create measurement object
   */
  private collectCurrentMetrics(): void {
    // Collect load time from navigation timing
    if (performance.timing) {
      this.metrics.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    } else if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        this.metrics.loadTime = navEntries[0].loadEventEnd;
      }
    }

    // Set defaults for missing metrics
    const measurements: PerformanceMeasurements = {
      loadTime: this.metrics.loadTime || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      bundleSize: this.metrics.bundleSize || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      fps: this.metrics.fps || 60,
      tokenResolution: this.metrics.tokenResolution || 0,
      componentRender: this.metrics.componentRender || 0,
      timestamp: new Date(),
    };

    // Call callback if provided
    if (this.options.onMeasurement) {
      this.options.onMeasurement(measurements);
    }
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): PerformanceMeasurements {
    return {
      loadTime: this.metrics.loadTime || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      bundleSize: this.metrics.bundleSize || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      fps: this.metrics.fps || 60,
      tokenResolution: this.metrics.tokenResolution || 0,
      componentRender: this.metrics.componentRender || 0,
      timestamp: new Date(),
    };
  }

  /**
   * Force a new measurement cycle
   */
  forceMeasurement(): void {
    if (!this.isRunning) return;

    this.measureTokenResolutionTime();
    this.measureComponentRenderTime();
    this.collectCurrentMetrics();
  }

  /**
   * Check if performance monitoring is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;

    return !!(window.performance && window.PerformanceObserver && window.requestAnimationFrame);
  }

  /**
   * Get browser performance capabilities
   */
  static getCapabilities(): {
    performanceAPI: boolean;
    performanceObserver: boolean;
    memoryAPI: boolean;
    navigationTiming: boolean;
    paintTiming: boolean;
    layoutShift: boolean;
    largestContentfulPaint: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        performanceAPI: false,
        performanceObserver: false,
        memoryAPI: false,
        navigationTiming: false,
        paintTiming: false,
        layoutShift: false,
        largestContentfulPaint: false,
      };
    }

    const capabilities = {
      performanceAPI: 'performance' in window,
      performanceObserver: 'PerformanceObserver' in window,
      memoryAPI: !!(performance as any).memory,
      navigationTiming: 'timing' in performance,
      paintTiming: false,
      layoutShift: false,
      largestContentfulPaint: false,
    };

    // Test specific observer support
    if (capabilities.performanceObserver) {
      try {
        new PerformanceObserver(() => {}).observe({ type: 'paint', buffered: true });
        capabilities.paintTiming = true;
      } catch {
        capabilities.paintTiming = false;
      }

      try {
        new PerformanceObserver(() => {}).observe({ type: 'layout-shift', buffered: true });
        capabilities.layoutShift = true;
      } catch {
        capabilities.layoutShift = false;
      }

      try {
        new PerformanceObserver(() => {}).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        capabilities.largestContentfulPaint = true;
      } catch {
        capabilities.largestContentfulPaint = false;
      }
    }

    return capabilities;
  }
}
