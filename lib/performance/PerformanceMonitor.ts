/**
 * PerformanceMonitor - Comprehensive performance monitoring and reporting system
 * Aggregates metrics from all performance subsystems
 */

import { AnimationLoop } from './AnimationLoop';
import { RenderQueueManager } from './RenderQueueManager';
import { VirtualizationManager } from './VirtualizationManager';
import { MemoryManager, MemoryMetrics } from './MemoryManager';
import { ObjectPool } from './ObjectPool';

export interface PerformanceMetrics {
  // Frame metrics
  fps: number;
  frameTime: number;
  frameTimeAvg: number;
  frameTimeMax: number;
  droppedFrames: number;
  jitter: number;
  
  // Memory metrics
  heapUsed: number;
  heapTotal: number;
  domNodes: number;
  eventListeners: number;
  leakRisk: number;
  
  // Render metrics
  renderTasks: number;
  renderQueueSize: number;
  renderEfficiency: number;
  
  // Virtualization metrics
  totalItems: number;
  visibleItems: number;
  renderedItems: number;
  virtualizationEfficiency: number;
  
  // Object pool metrics
  poolHitRate: number;
  poolSize: number;
  poolUtilization: number;
  
  // System metrics
  cpuUsage: number;
  networkLatency: number;
  storageUsage: number;
  
  // Quality scores
  performanceScore: number; // 0-100
  qualityScore: number; // 0-100
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface PerformanceThresholds {
  fps: { min: number; target: number };
  frameTime: { max: number; warning: number };
  memory: { max: number; warning: number };
  domNodes: { max: number; warning: number };
  renderQueue: { max: number; warning: number };
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'frame' | 'memory' | 'render' | 'system';
  message: string;
  value: number;
  threshold: number;
  recommendation?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private maxAlerts = 100;
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private alertObservers: Set<(alert: PerformanceAlert) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 60; // 1 minute of data at 1 sample/second
  
  // Performance tracking
  private lastMeasurement = 0;
  private measurementInterval = 1000; // 1 second
  private performanceObserver: PerformanceObserver | null = null;
  
  // Subsystem references
  private animationLoop = AnimationLoop.getInstance();
  private renderQueue = RenderQueueManager.getInstance();
  private memoryManager = MemoryManager.getInstance();

  private constructor() {
    this.metrics = this.getInitialMetrics();
    this.thresholds = this.getDefaultThresholds();
    this.init();
  }

  static getInstance(): PerformanceMonitor {
    // Skip instantiation if running on server side
    if (typeof window === 'undefined') {
      return {} as PerformanceMonitor; // Return empty object for server-side compatibility
    }
    
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize monitoring
   */
  private init(): void {
    // Skip initialization if running on server side
    if (typeof window === 'undefined') return;
    
    // Subscribe to subsystem metrics
    this.subscribeToSubsystems();
    
    // Setup Performance Observer API
    this.setupPerformanceObserver();
    
    // Start monitoring loop
    this.startMonitoring();
  }

  /**
   * Subscribe to subsystem metrics
   */
  private subscribeToSubsystems(): void {
    // Animation loop metrics
    this.animationLoop.onMetricsUpdate((metrics) => {
      this.metrics.fps = metrics.fps;
      this.metrics.frameTime = metrics.frameTime;
      this.metrics.frameTimeAvg = metrics.averageFrameTime;
      this.metrics.droppedFrames = metrics.droppedFrames;
      this.metrics.jitter = metrics.jitter;
    });
    
    // Memory manager metrics
    this.memoryManager.subscribe((metrics: MemoryMetrics) => {
      this.metrics.heapUsed = metrics.heapUsed;
      this.metrics.heapTotal = metrics.heapTotal;
      this.metrics.domNodes = metrics.domNodes;
      this.metrics.eventListeners = metrics.eventListeners;
      this.metrics.leakRisk = metrics.leakRisk;
    });
    
    // Render queue metrics
    this.renderQueue.subscribe((metrics) => {
      this.metrics.renderTasks = metrics.completedTasks;
      this.metrics.droppedFrames = Math.max(
        this.metrics.droppedFrames,
        metrics.droppedFrames
      );
    });
  }

  /**
   * Setup Performance Observer API
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      // Observe long tasks
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.createAlert({
              severity: 'warning',
              category: 'frame',
              message: `Long task detected: ${entry.name}`,
              value: entry.duration,
              threshold: 50,
            });
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['longtask', 'measure'] });
    } catch (error) {
      console.warn('PerformanceObserver not fully supported');
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeMetrics();
      this.updateHistory();
      this.notifyObservers();
    }, this.measurementInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Collect metrics from various sources
   */
  private collectMetrics(): void {
    const now = performance.now();
    
    // Get render queue metrics
    const queueSizes = this.renderQueue.getQueueSizes();
    this.metrics.renderQueueSize = Array.from(queueSizes.values())
      .reduce((sum, size) => sum + size, 0);
    
    // Get memory metrics
    const memoryMetrics = this.memoryManager.getMetrics();
    Object.assign(this.metrics, memoryMetrics);
    
    // Get resource stats
    const resourceStats = this.memoryManager.getResourceStats();
    
    // Calculate efficiency metrics
    this.metrics.renderEfficiency = this.metrics.renderTasks > 0
      ? 1 - (this.metrics.droppedFrames / this.metrics.renderTasks)
      : 1;
    
    // Get CPU usage (approximate)
    this.metrics.cpuUsage = this.estimateCPUUsage();
    
    // Get network latency
    this.metrics.networkLatency = this.measureNetworkLatency();
    
    // Get storage usage
    this.metrics.storageUsage = this.getStorageUsage();
    
    // Calculate quality scores
    this.calculateQualityScores();
    
    this.lastMeasurement = now;
  }

  /**
   * Analyze metrics and generate alerts
   */
  private analyzeMetrics(): void {
    const { thresholds, metrics } = this;
    
    // Check FPS
    if (metrics.fps < thresholds.fps.min) {
      this.createAlert({
        severity: metrics.fps < 30 ? 'error' : 'warning',
        category: 'frame',
        message: 'Low FPS detected',
        value: metrics.fps,
        threshold: thresholds.fps.min,
        recommendation: 'Reduce rendering complexity or enable optimizations',
      });
    }
    
    // Check frame time
    if (metrics.frameTimeAvg > thresholds.frameTime.max) {
      this.createAlert({
        severity: 'warning',
        category: 'frame',
        message: 'High frame time',
        value: metrics.frameTimeAvg,
        threshold: thresholds.frameTime.max,
        recommendation: 'Optimize rendering pipeline',
      });
    }
    
    // Check memory
    if (metrics.heapUsed > thresholds.memory.warning) {
      const severity = metrics.heapUsed > thresholds.memory.max ? 'error' : 'warning';
      this.createAlert({
        severity,
        category: 'memory',
        message: 'High memory usage',
        value: metrics.heapUsed,
        threshold: thresholds.memory.warning,
        recommendation: 'Clean up unused resources and optimize memory usage',
      });
    }
    
    // Check DOM nodes
    if (metrics.domNodes > thresholds.domNodes.warning) {
      this.createAlert({
        severity: 'warning',
        category: 'render',
        message: 'Too many DOM nodes',
        value: metrics.domNodes,
        threshold: thresholds.domNodes.warning,
        recommendation: 'Use virtualization for long lists',
      });
    }
    
    // Check render queue
    if (metrics.renderQueueSize > thresholds.renderQueue.warning) {
      this.createAlert({
        severity: 'warning',
        category: 'render',
        message: 'Render queue backlog',
        value: metrics.renderQueueSize,
        threshold: thresholds.renderQueue.warning,
        recommendation: 'Reduce render task complexity',
      });
    }
    
    // Check for memory leaks
    if (metrics.leakRisk > 0.7) {
      this.createAlert({
        severity: metrics.leakRisk > 0.9 ? 'critical' : 'error',
        category: 'memory',
        message: 'Potential memory leak detected',
        value: metrics.leakRisk,
        threshold: 0.7,
        recommendation: 'Review event listeners and resource cleanup',
      });
    }
  }

  /**
   * Calculate quality scores
   */
  private calculateQualityScores(): void {
    const { metrics, thresholds } = this;
    
    // Performance score (0-100)
    let perfScore = 100;
    
    // FPS impact (40% weight)
    const fpsRatio = metrics.fps / thresholds.fps.target;
    perfScore -= (1 - Math.min(fpsRatio, 1)) * 40;
    
    // Frame time impact (30% weight)
    const frameTimeRatio = thresholds.frameTime.max / Math.max(metrics.frameTimeAvg, 1);
    perfScore -= (1 - Math.min(frameTimeRatio, 1)) * 30;
    
    // Memory impact (20% weight)
    const memoryRatio = (thresholds.memory.max - metrics.heapUsed) / thresholds.memory.max;
    perfScore -= (1 - Math.max(memoryRatio, 0)) * 20;
    
    // Efficiency impact (10% weight)
    perfScore -= (1 - metrics.renderEfficiency) * 10;
    
    this.metrics.performanceScore = Math.max(0, Math.min(100, perfScore));
    
    // Quality score (0-100)
    let qualityScore = 100;
    
    // No dropped frames (30% weight)
    qualityScore -= Math.min(metrics.droppedFrames, 30);
    
    // Low jitter (20% weight)
    qualityScore -= Math.min(metrics.jitter, 20);
    
    // Memory health (25% weight)
    qualityScore -= metrics.leakRisk * 25;
    
    // DOM efficiency (25% weight)
    const domEfficiency = Math.min(metrics.domNodes / thresholds.domNodes.max, 1);
    qualityScore -= domEfficiency * 25;
    
    this.metrics.qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    // Overall health
    const overallScore = (this.metrics.performanceScore + this.metrics.qualityScore) / 2;
    if (overallScore >= 90) {
      this.metrics.overallHealth = 'excellent';
    } else if (overallScore >= 75) {
      this.metrics.overallHealth = 'good';
    } else if (overallScore >= 60) {
      this.metrics.overallHealth = 'fair';
    } else if (overallScore >= 40) {
      this.metrics.overallHealth = 'poor';
    } else {
      this.metrics.overallHealth = 'critical';
    }
  }

  /**
   * Estimate CPU usage
   */
  private estimateCPUUsage(): number {
    // Approximate based on frame time and render queue
    const frameLoad = this.metrics.frameTimeAvg / 16.67; // Relative to 60fps
    const queueLoad = this.metrics.renderQueueSize / 100; // Normalized
    return Math.min(1, (frameLoad + queueLoad) / 2) * 100;
  }

  /**
   * Measure network latency
   */
  private measureNetworkLatency(): number {
    // Skip measurement if running on server side
    if (typeof window === 'undefined') return 0;
    
    // Use Navigation Timing API if available
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      return timing.responseEnd - timing.fetchStart;
    }
    return 0;
  }

  /**
   * Get storage usage
   */
  private async getStorageUsage(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return (estimate.usage || 0) / 1048576; // Convert to MB
      } catch {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Create an alert
   */
  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const fullAlert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      ...alert,
    };
    
    this.alerts.push(fullAlert);
    
    // Trim alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }
    
    // Notify alert observers
    this.alertObservers.forEach(observer => observer(fullAlert));
  }

  /**
   * Update metrics history
   */
  private updateHistory(): void {
    this.metricsHistory.push({ ...this.metrics });
    
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 0,
      frameTimeAvg: 0,
      frameTimeMax: 0,
      droppedFrames: 0,
      jitter: 0,
      heapUsed: 0,
      heapTotal: 0,
      domNodes: 0,
      eventListeners: 0,
      leakRisk: 0,
      renderTasks: 0,
      renderQueueSize: 0,
      renderEfficiency: 1,
      totalItems: 0,
      visibleItems: 0,
      renderedItems: 0,
      virtualizationEfficiency: 1,
      poolHitRate: 1,
      poolSize: 0,
      poolUtilization: 0,
      cpuUsage: 0,
      networkLatency: 0,
      storageUsage: 0,
      performanceScore: 100,
      qualityScore: 100,
      overallHealth: 'excellent',
    };
  }

  /**
   * Get default thresholds
   */
  private getDefaultThresholds(): PerformanceThresholds {
    return {
      fps: { min: 30, target: 60 },
      frameTime: { max: 33, warning: 16.67 },
      memory: { max: 500, warning: 300 }, // MB
      domNodes: { max: 10000, warning: 5000 },
      renderQueue: { max: 100, warning: 50 },
    };
  }

  /**
   * Notify observers
   */
  private notifyObservers(): void {
    this.observers.forEach(observer => observer({ ...this.metrics }));
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get metrics history
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get recent alerts
   */
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(observer: (alert: PerformanceAlert) => void): () => void {
    this.alertObservers.add(observer);
    return () => this.alertObservers.delete(observer);
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const { metrics, metricsHistory } = this;
    
    // Calculate trends
    const recentMetrics = metricsHistory.slice(-10);
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.heapUsed, 0) / recentMetrics.length;
    
    return `
Performance Report
==================
Overall Health: ${metrics.overallHealth.toUpperCase()}
Performance Score: ${metrics.performanceScore.toFixed(1)}/100
Quality Score: ${metrics.qualityScore.toFixed(1)}/100

Frame Performance
-----------------
FPS: ${metrics.fps.toFixed(1)} (avg: ${avgFPS.toFixed(1)})
Frame Time: ${metrics.frameTimeAvg.toFixed(2)}ms
Dropped Frames: ${metrics.droppedFrames}
Jitter: ${metrics.jitter.toFixed(2)}ms

Memory Usage
------------
Heap Used: ${metrics.heapUsed.toFixed(1)}MB (avg: ${avgMemory.toFixed(1)}MB)
Heap Total: ${metrics.heapTotal.toFixed(1)}MB
DOM Nodes: ${metrics.domNodes}
Event Listeners: ${metrics.eventListeners}
Leak Risk: ${(metrics.leakRisk * 100).toFixed(1)}%

Rendering
---------
Render Tasks: ${metrics.renderTasks}
Queue Size: ${metrics.renderQueueSize}
Efficiency: ${(metrics.renderEfficiency * 100).toFixed(1)}%

Recent Alerts: ${this.alerts.length}
Critical: ${this.alerts.filter(a => a.severity === 'critical').length}
Errors: ${this.alerts.filter(a => a.severity === 'error').length}
Warnings: ${this.alerts.filter(a => a.severity === 'warning').length}
    `.trim();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();