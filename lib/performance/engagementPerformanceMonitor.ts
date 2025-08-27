/**
 * Engagement Performance Monitor
 * Validates <50ms tracking overhead and monitors system performance impact
 *
 * Performance Requirements:
 * - Tracking latency: <50ms per interaction
 * - Memory overhead: <10MB additional usage
 * - CPU impact: <5% average increase
 * - Battery impact: Minimal on mobile devices
 * - Dashboard updates: <100ms latency
 */

interface PerformanceMetrics {
  trackingLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryImpact: number;
  dashboardLatency: number;
  networkLatency: number;
  totalInteractions: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  p95Latency: number;
  errorRate: number;
}

interface PerformanceBenchmark {
  timestamp: number;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  success: boolean;
  error?: string;
  metadata?: any;
}

interface PerformanceAlert {
  level: 'warning' | 'critical';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
}

class EngagementPerformanceMonitor {
  private benchmarks: PerformanceBenchmark[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private performanceObserver?: PerformanceObserver;
  private memoryMonitorInterval?: NodeJS.Timeout;
  private cpuMonitorInterval?: NodeJS.Timeout;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  // Performance thresholds
  private readonly THRESHOLDS = {
    trackingLatency: 50, // ms
    memoryUsage: 10, // MB
    cpuUsage: 5, // %
    dashboardLatency: 100, // ms
    networkLatency: 200, // ms
    errorRate: 1, // %
  };

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔬 PERFORMANCE MONITORING STARTED');

    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
    this.startCPUMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }

    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }

    if (this.cpuMonitorInterval) {
      clearInterval(this.cpuMonitorInterval);
      this.cpuMonitorInterval = undefined;
    }

    console.log('🔬 PERFORMANCE MONITORING STOPPED');
  }

  /**
   * Benchmark a tracking operation
   */
  async benchmarkTracking<T>(
    operation: string,
    trackingFunction: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let memoryBefore = 0;
    let memoryAfter = 0;
    let result: T;
    let error: string | undefined;
    let success = true;

    // Get memory usage before operation (if available)
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in (window.performance as any)
    ) {
      const memInfo = (window.performance as any).memory;
      memoryBefore = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }

    try {
      result = await trackingFunction();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      success = false;
      throw e;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Get memory usage after operation
      if (
        typeof window !== 'undefined' &&
        'performance' in window &&
        'memory' in (window.performance as any)
      ) {
        const memInfo = (window.performance as any).memory;
        memoryAfter = memInfo.usedJSHeapSize / 1024 / 1024; // MB
      }

      // Record benchmark
      const benchmark: PerformanceBenchmark = {
        timestamp: Date.now(),
        operation,
        startTime,
        endTime,
        duration,
        memoryBefore,
        memoryAfter,
        success,
        error,
        metadata,
      };

      this.benchmarks.push(benchmark);

      // Keep only last 1000 benchmarks to prevent memory growth
      if (this.benchmarks.length > 1000) {
        this.benchmarks = this.benchmarks.slice(-1000);
      }

      // Check for performance violations
      this.checkPerformanceThresholds(benchmark);

      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > this.THRESHOLDS.trackingLatency) {
        console.warn(
          `⚠️ SLOW TRACKING: ${operation} took ${duration.toFixed(2)}ms (>${this.THRESHOLDS.trackingLatency}ms threshold)`
        );
      }

      // Log successful fast operations
      if (
        process.env.NODE_ENV === 'development' &&
        success &&
        duration <= this.THRESHOLDS.trackingLatency
      ) {
        console.log(`⚡ FAST TRACKING: ${operation} (${duration.toFixed(2)}ms)`);
      }
    }

    return result!;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const recentBenchmarks = this.benchmarks.slice(-100); // Last 100 operations

    if (recentBenchmarks.length === 0) {
      return {
        trackingLatency: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        batteryImpact: 0,
        dashboardLatency: 0,
        networkLatency: 0,
        totalInteractions: 0,
        averageLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        p95Latency: 0,
        errorRate: 0,
      };
    }

    const durations = recentBenchmarks.map((b) => b.duration).sort((a, b) => a - b);
    const errors = recentBenchmarks.filter((b) => !b.success).length;

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      trackingLatency: durations[durations.length - 1] || 0, // Latest
      memoryUsage: this.getAverageMemoryUsage(recentBenchmarks),
      cpuUsage: 0, // Would be calculated from CPU monitoring
      batteryImpact: 0, // Would be estimated from CPU/network usage
      dashboardLatency: this.getAverageDashboardLatency(recentBenchmarks),
      networkLatency: this.getAverageNetworkLatency(recentBenchmarks),
      totalInteractions: recentBenchmarks.length,
      averageLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxLatency: Math.max(...durations),
      minLatency: Math.min(...durations),
      p95Latency: durations[p95Index] || 0,
      errorRate: (errors / recentBenchmarks.length) * 100,
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const recentAlerts = this.alerts.slice(-10);

    return `
🔬 ENGAGEMENT PERFORMANCE REPORT
═══════════════════════════════════════════════════════════════

📊 TRACKING PERFORMANCE:
   Average Latency: ${metrics.averageLatency.toFixed(2)}ms
   P95 Latency: ${metrics.p95Latency.toFixed(2)}ms
   Max Latency: ${metrics.maxLatency.toFixed(2)}ms
   Min Latency: ${metrics.minLatency.toFixed(2)}ms
   Total Interactions: ${metrics.totalInteractions}
   Error Rate: ${metrics.errorRate.toFixed(1)}%

⚡ PERFORMANCE THRESHOLDS:
   Tracking Latency: ${metrics.trackingLatency.toFixed(2)}ms ${this.getThresholdStatus('trackingLatency', metrics.trackingLatency)}
   Dashboard Updates: ${metrics.dashboardLatency.toFixed(2)}ms ${this.getThresholdStatus('dashboardLatency', metrics.dashboardLatency)}
   Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB ${this.getThresholdStatus('memoryUsage', metrics.memoryUsage)}
   Network Latency: ${metrics.networkLatency.toFixed(2)}ms ${this.getThresholdStatus('networkLatency', metrics.networkLatency)}

🚨 RECENT ALERTS (${recentAlerts.length}):
${recentAlerts.length > 0 ? recentAlerts.map((alert) => `   ${alert.level.toUpperCase()}: ${alert.message} (${alert.value.toFixed(2)} > ${alert.threshold})`).join('\n') : '   No recent performance alerts'}

🎯 PERFORMANCE STATUS:
   ${metrics.averageLatency < this.THRESHOLDS.trackingLatency ? '🟢' : metrics.averageLatency < this.THRESHOLDS.trackingLatency * 1.5 ? '🟡' : '🔴'} Tracking Performance
   ${metrics.errorRate < this.THRESHOLDS.errorRate ? '🟢' : metrics.errorRate < this.THRESHOLDS.errorRate * 2 ? '🟡' : '🔴'} System Reliability
   ${metrics.memoryUsage < this.THRESHOLDS.memoryUsage ? '🟢' : metrics.memoryUsage < this.THRESHOLDS.memoryUsage * 1.5 ? '🟡' : '🔴'} Memory Efficiency

Generated: ${new Date().toISOString()}
`;
  }

  /**
   * Add performance alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.benchmarks = [];
    this.alerts = [];
    console.log('🧹 PERFORMANCE HISTORY CLEARED');
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    metrics: PerformanceMetrics;
    benchmarks: PerformanceBenchmark[];
    alerts: PerformanceAlert[];
    exportedAt: number;
  } {
    return {
      metrics: this.getPerformanceMetrics(),
      benchmarks: [...this.benchmarks],
      alerts: [...this.alerts],
      exportedAt: Date.now(),
    };
  }

  // Private methods

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation' || entry.entryType === 'measure') {
            // Process navigation and custom measure events
            console.log(`📈 Performance Entry: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'measure', 'mark'],
      });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in (window.performance as any))) return;

    this.memoryMonitorInterval = setInterval(() => {
      const memInfo = (window.performance as any).memory;
      const currentMemory = memInfo.usedJSHeapSize / 1024 / 1024; // MB

      if (currentMemory > this.THRESHOLDS.memoryUsage) {
        this.triggerAlert(
          'warning',
          `High memory usage: ${currentMemory.toFixed(2)}MB`,
          'memoryUsage',
          currentMemory,
          this.THRESHOLDS.memoryUsage
        );
      }
    }, 5000); // Check every 5 seconds
  }

  private startCPUMonitoring(): void {
    // CPU monitoring would require additional APIs or heuristics
    // For now, we'll monitor based on frame rate or operation times
    let lastCPUCheck = performance.now();

    this.cpuMonitorInterval = setInterval(() => {
      const now = performance.now();
      const timeDiff = now - lastCPUCheck;

      // If there's significant drift from expected interval, CPU might be under load
      const expectedInterval = 1000; // 1 second
      const drift = Math.abs(timeDiff - expectedInterval);

      if (drift > 100) {
        // More than 100ms drift
        console.log(`⚠️ Possible CPU load detected (${drift.toFixed(2)}ms drift)`);
      }

      lastCPUCheck = now;
    }, 1000);
  }

  private checkPerformanceThresholds(benchmark: PerformanceBenchmark): void {
    // Check tracking latency
    if (benchmark.duration > this.THRESHOLDS.trackingLatency) {
      this.triggerAlert(
        benchmark.duration > this.THRESHOLDS.trackingLatency * 2 ? 'critical' : 'warning',
        `Slow tracking operation: ${benchmark.operation}`,
        'trackingLatency',
        benchmark.duration,
        this.THRESHOLDS.trackingLatency
      );
    }

    // Check memory usage increase
    const memoryIncrease = benchmark.memoryAfter - benchmark.memoryBefore;
    if (memoryIncrease > 1) {
      // More than 1MB increase
      this.triggerAlert(
        'warning',
        `High memory usage in operation: ${benchmark.operation}`,
        'memoryUsage',
        memoryIncrease,
        1
      );
    }
  }

  private triggerAlert(
    level: 'warning' | 'critical',
    message: string,
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      level,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Log alert
    const emoji = level === 'critical' ? '🚨' : '⚠️';
    console.warn(`${emoji} PERFORMANCE ALERT: ${message} (${value.toFixed(2)} > ${threshold})`);
  }

  private getThresholdStatus(metric: keyof PerformanceMetrics, value: number): string {
    const threshold = this.THRESHOLDS[metric as keyof typeof this.THRESHOLDS];
    if (!threshold) return '?';

    if (value <= threshold) return '🟢';
    if (value <= threshold * 1.5) return '🟡';
    return '🔴';
  }

  private getAverageMemoryUsage(benchmarks: PerformanceBenchmark[]): number {
    const memoryReadings = benchmarks.filter((b) => b.memoryAfter > 0).map((b) => b.memoryAfter);

    return memoryReadings.length > 0
      ? memoryReadings.reduce((sum, m) => sum + m, 0) / memoryReadings.length
      : 0;
  }

  private getAverageDashboardLatency(benchmarks: PerformanceBenchmark[]): number {
    const dashboardOps = benchmarks.filter(
      (b) => b.operation.includes('dashboard') || b.operation.includes('metrics')
    );

    return dashboardOps.length > 0
      ? dashboardOps.reduce((sum, b) => sum + b.duration, 0) / dashboardOps.length
      : 0;
  }

  private getAverageNetworkLatency(benchmarks: PerformanceBenchmark[]): number {
    const networkOps = benchmarks.filter(
      (b) => b.operation.includes('track') || b.operation.includes('convex')
    );

    return networkOps.length > 0
      ? networkOps.reduce((sum, b) => sum + b.duration, 0) / networkOps.length
      : 0;
  }
}

// Export singleton instance
export const performanceMonitor = new EngagementPerformanceMonitor();

// React hook for performance monitoring
export function useEngagementPerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);

  React.useEffect(() => {
    // Start monitoring when component mounts
    performanceMonitor.startMonitoring();

    // Set up alert listener
    const handleAlert = (alert: PerformanceAlert) => {
      setAlerts((prev) => [...prev.slice(-9), alert]); // Keep last 10 alerts
    };

    performanceMonitor.onAlert(handleAlert);

    // Update metrics periodically
    const updateInterval = setInterval(() => {
      setMetrics(performanceMonitor.getPerformanceMetrics());
    }, 5000); // Every 5 seconds

    return () => {
      performanceMonitor.stopMonitoring();
      clearInterval(updateInterval);
    };
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring: true,
    clearHistory: () => performanceMonitor.clearHistory(),
    exportData: () => performanceMonitor.exportPerformanceData(),
    generateReport: () => performanceMonitor.getPerformanceReport(),
  };
}

// Performance benchmarking decorator
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  operation: string,
  fn: T
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return performanceMonitor.benchmarkTracking(operation, () => fn(...args)) as ReturnType<T>;
  }) as T;
}

// Add React import for hooks
const React = require('react');
