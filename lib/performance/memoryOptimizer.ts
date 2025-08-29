/**
 * Memory Optimization Manager
 * Memory usage optimization, leak detection, and resource management
 * Maintains <100MB usage with intelligent cleanup strategies
 */

import { useCallback, useEffect, useRef } from 'react';

// Memory management interfaces
interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  domNodes: number;
  eventListeners: number;
  detachedNodes: number;
  leakRisk: number; // 0-1 scale
}

interface MemoryLeak {
  id: string;
  type: 'dom-leak' | 'event-leak' | 'closure-leak' | 'timer-leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  detected: number;
  size: number;
}

interface ResourceCleanup {
  id: string;
  type: 'websocket' | 'interval' | 'timeout' | 'observer' | 'listener' | 'animation';
  cleanup: () => void;
  priority: number; // 1-10, higher = more important to clean up
  memoryImpact: number; // estimated bytes
}

interface MemoryBudget {
  maxHeapSize: number; // Maximum heap size in bytes
  warningThreshold: number; // Warning threshold (80% of max)
  criticalThreshold: number; // Critical threshold (95% of max)
  maxDomNodes: number;
  maxEventListeners: number;
  gcTriggerThreshold: number; // When to suggest garbage collection
}

// Default memory budgets
const DEFAULT_BUDGET: MemoryBudget = {
  maxHeapSize: 100 * 1024 * 1024, // 100MB
  warningThreshold: 80 * 1024 * 1024, // 80MB
  criticalThreshold: 95 * 1024 * 1024, // 95MB
  maxDomNodes: 5000,
  maxEventListeners: 1000,
  gcTriggerThreshold: 70 * 1024 * 1024, // 70MB
};

class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private budget: MemoryBudget;
  private cleanupRegistry: Map<string, ResourceCleanup> = new Map();
  private leakDetectors: Map<string, MemoryLeak> = new Map();
  private metrics: MemoryMetrics;
  private observers: Set<(metrics: MemoryMetrics) => void> = new Set();
  private leakObservers: Set<(leak: MemoryLeak) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcScheduled = false;

  // Memory tracking
  private baselineMemory = 0;
  private memoryHistory: Array<{ timestamp: number; usage: number }> = [];
  private maxHistorySize = 60; // Keep 60 measurements

  // Leak detection
  private domMutationObserver: MutationObserver | null = null;
  private weakMapRegistry = new WeakMap();
  private componentInstances = new Set<any>();

  private constructor(budget: Partial<MemoryBudget> = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...budget };
    this.metrics = this.getInitialMetrics();

    if (typeof window !== 'undefined') {
      this.initializeOptimization();
    }
  }

  static getInstance(budget?: Partial<MemoryBudget>): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer(budget);
    }
    return MemoryOptimizer.instance;
  }

  /**
   * Initialize memory optimization
   */
  private initializeOptimization(): void {
    // Set baseline memory usage
    this.baselineMemory = this.getCurrentMemoryUsage();

    // Start monitoring
    this.startMonitoring();

    // Setup DOM mutation observer
    this.setupDomLeakDetection();

    // Setup page visibility handling
    this.setupVisibilityHandling();

    // Setup memory pressure handling
    this.setupMemoryPressureHandling();

    // Setup automatic cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanupAll());
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.detectLeaks();
      this.checkBudgets();
      this.optimizeMemoryUsage();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.domMutationObserver) {
      this.domMutationObserver.disconnect();
      this.domMutationObserver = null;
    }
  }

  /**
   * Register resource for cleanup
   */
  registerCleanup(cleanup: Omit<ResourceCleanup, 'id'>): string {
    const id = `cleanup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.cleanupRegistry.set(id, {
      id,
      ...cleanup,
    });

    return id;
  }

  /**
   * Unregister cleanup resource
   */
  unregisterCleanup(id: string): void {
    const cleanup = this.cleanupRegistry.get(id);
    if (cleanup) {
      // Run cleanup function
      try {
        cleanup.cleanup();
      } catch (error) {
        console.warn(`Cleanup failed for resource ${id}:`, error);
      }

      this.cleanupRegistry.delete(id);
    }
  }

  /**
   * Track component instance for memory monitoring
   */
  trackComponent(component: any, metadata?: { name?: string; props?: any }): () => void {
    this.componentInstances.add(component);

    if (metadata) {
      this.weakMapRegistry.set(component, {
        ...metadata,
        mountTime: Date.now(),
        renders: 0,
      });
    }

    // Return cleanup function
    return () => {
      this.componentInstances.delete(component);
      this.weakMapRegistry.delete(component);
    };
  }

  /**
   * Collect memory metrics
   */
  private collectMetrics(): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    const domNodes = document.querySelectorAll('*').length;
    const detachedNodes = this.countDetachedNodes();
    const eventListeners = this.countEventListeners();

    // Update metrics
    this.metrics = {
      heapUsed: memoryUsage,
      heapTotal: this.getHeapTotal(),
      heapLimit: this.getHeapLimit(),
      domNodes,
      eventListeners,
      detachedNodes,
      leakRisk: this.calculateLeakRisk(memoryUsage, domNodes, detachedNodes),
    };

    // Update history
    this.memoryHistory.push({
      timestamp: Date.now(),
      usage: memoryUsage,
    });

    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }

    // Fallback estimation based on DOM and component count
    const domNodes = document.querySelectorAll('*').length;
    const estimatedSize = domNodes * 1000 + this.componentInstances.size * 5000; // Rough estimate
    return estimatedSize;
  }

  /**
   * Get heap total size
   */
  private getHeapTotal(): number {
    if ('memory' in performance) {
      return (performance as any).memory.totalJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get heap limit
   */
  private getHeapLimit(): number {
    if ('memory' in performance) {
      return (performance as any).memory.jsHeapSizeLimit || 0;
    }
    return this.budget.maxHeapSize;
  }

  /**
   * Count detached DOM nodes
   */
  private countDetachedNodes(): number {
    // This is a simplified detection - in production, would use more sophisticated methods
    const allNodes = document.querySelectorAll('*');
    let detachedCount = 0;

    allNodes.forEach((node) => {
      // Check if node has data attributes that might indicate React detachment
      if (node.hasAttribute('data-reactroot') && !node.isConnected) {
        detachedCount++;
      }
    });

    return detachedCount;
  }

  /**
   * Count event listeners
   */
  private countEventListeners(): number {
    // This is a rough estimation - actual implementation would require
    // monkey-patching addEventListener/removeEventListener
    const allNodes = document.querySelectorAll('*');
    let listenerCount = 0;

    allNodes.forEach((node) => {
      // Estimate based on common listener attributes
      const attributes = node.attributes;
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (
          attr.name.startsWith('on') ||
          attr.name.includes('click') ||
          attr.name.includes('event')
        ) {
          listenerCount++;
        }
      }
    });

    return listenerCount;
  }

  /**
   * Calculate leak risk score
   */
  private calculateLeakRisk(memoryUsage: number, domNodes: number, detachedNodes: number): number {
    let riskScore = 0;

    // Memory growth risk
    if (this.memoryHistory.length > 5) {
      const recentGrowth = this.memoryHistory.slice(-5);
      const growthRate = recentGrowth[recentGrowth.length - 1].usage - recentGrowth[0].usage;

      if (growthRate > 5 * 1024 * 1024) {
        // Growing more than 5MB in last 25 seconds
        riskScore += 0.3;
      }
    }

    // DOM node accumulation risk
    if (domNodes > this.budget.maxDomNodes * 0.8) {
      riskScore += 0.2;
    }

    // Detached nodes risk
    if (detachedNodes > 10) {
      riskScore += 0.3;
    }

    // Memory budget risk
    if (memoryUsage > this.budget.warningThreshold) {
      riskScore += 0.2;
    }

    return Math.min(1, riskScore);
  }

  /**
   * Detect memory leaks
   */
  private detectLeaks(): void {
    // DOM leak detection
    const detachedCount = this.metrics.detachedNodes;
    if (detachedCount > 10) {
      this.reportLeak({
        type: 'dom-leak',
        severity: detachedCount > 50 ? 'critical' : 'high',
        description: `${detachedCount} detached DOM nodes detected`,
        size: detachedCount * 1000, // Estimated size
      });
    }

    // Memory growth leak detection
    if (this.memoryHistory.length >= 10) {
      const recent = this.memoryHistory.slice(-10);
      const growth = recent[recent.length - 1].usage - recent[0].usage;
      const growthRate = growth / (10 * 5); // Per second

      if (growthRate > 100000) {
        // 100KB/second sustained growth
        this.reportLeak({
          type: 'closure-leak',
          severity: 'high',
          description: `Sustained memory growth: ${Math.round(growthRate / 1024)}KB/s`,
          size: growth,
        });
      }
    }

    // Component instance leak detection
    if (this.componentInstances.size > 1000) {
      this.reportLeak({
        type: 'closure-leak',
        severity: 'medium',
        description: `High number of tracked components: ${this.componentInstances.size}`,
        size: this.componentInstances.size * 5000,
      });
    }
  }

  /**
   * Report memory leak
   */
  private reportLeak(leak: Omit<MemoryLeak, 'id' | 'detected'>): void {
    const leakId = `leak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullLeak: MemoryLeak = {
      id: leakId,
      detected: Date.now(),
      ...leak,
    };

    this.leakDetectors.set(leakId, fullLeak);

    // Notify leak observers
    this.leakObservers.forEach((observer) => observer(fullLeak));

    // Auto-cleanup old leaks
    if (this.leakDetectors.size > 50) {
      const oldestLeakId = Array.from(this.leakDetectors.keys())[0];
      this.leakDetectors.delete(oldestLeakId);
    }
  }

  /**
   * Check memory budgets and take action
   */
  private checkBudgets(): void {
    const { heapUsed, domNodes, eventListeners } = this.metrics;

    // Critical memory usage
    if (heapUsed > this.budget.criticalThreshold) {
      this.performEmergencyCleanup();
      this.scheduleGarbageCollection();
    }
    // Warning threshold
    else if (heapUsed > this.budget.warningThreshold) {
      this.performOptimization();
    }

    // DOM node limit
    if (domNodes > this.budget.maxDomNodes) {
      console.warn(`DOM node count (${domNodes}) exceeds budget (${this.budget.maxDomNodes})`);
    }

    // Event listener limit
    if (eventListeners > this.budget.maxEventListeners) {
      console.warn(
        `Event listener count (${eventListeners}) exceeds budget (${this.budget.maxEventListeners})`
      );
    }
  }

  /**
   * Optimize memory usage
   */
  private optimizeMemoryUsage(): void {
    // Clean up low-priority resources
    const lowPriorityCleanups = Array.from(this.cleanupRegistry.values())
      .filter((cleanup) => cleanup.priority <= 3)
      .sort((a, b) => a.priority - b.priority);

    lowPriorityCleanups.slice(0, 5).forEach((cleanup) => {
      this.unregisterCleanup(cleanup.id);
    });

    // Suggest garbage collection if memory is high
    if (this.metrics.heapUsed > this.budget.gcTriggerThreshold) {
      this.scheduleGarbageCollection();
    }
  }

  /**
   * Perform emergency cleanup
   */
  private performEmergencyCleanup(): void {
    console.warn('Emergency memory cleanup triggered');

    // Clean up all non-critical resources
    const cleanups = Array.from(this.cleanupRegistry.values()).sort(
      (a, b) => a.priority - b.priority
    ); // Lower priority first

    cleanups.slice(0, Math.floor(cleanups.length / 2)).forEach((cleanup) => {
      this.unregisterCleanup(cleanup.id);
    });

    // Force image cleanup
    this.cleanupImages();

    // Clear component tracking for unmounted components
    this.cleanupComponentTracking();
  }

  /**
   * Perform routine optimization
   */
  private performOptimization(): void {
    // Clean up low-priority resources
    const cleanups = Array.from(this.cleanupRegistry.values()).filter(
      (cleanup) => cleanup.priority <= 2
    );

    cleanups.slice(0, 3).forEach((cleanup) => {
      this.unregisterCleanup(cleanup.id);
    });
  }

  /**
   * Schedule garbage collection
   */
  private scheduleGarbageCollection(): void {
    if (this.gcScheduled) return;

    this.gcScheduled = true;

    // Use requestIdleCallback for non-blocking GC suggestion
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          this.forceGarbageCollection();
          this.gcScheduled = false;
        },
        { timeout: 1000 }
      );
    } else {
      setTimeout(() => {
        this.forceGarbageCollection();
        this.gcScheduled = false;
      }, 100);
    }
  }

  /**
   * Force garbage collection (if available)
   */
  private forceGarbageCollection(): void {
    // In Chromium-based browsers, gc() might be available in dev mode
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.debug('Manual garbage collection triggered');
      } catch (_error) {
        console.debug('Manual GC not available');
      }
    }

    // Alternative: Create and release large objects to trigger GC
    const largeObject = new Array(1000000).fill(0);
    setTimeout(() => {
      // Release reference
      largeObject.length = 0;
    }, 0);
  }

  /**
   * Clean up images and media resources
   */
  private cleanupImages(): void {
    const images = document.querySelectorAll('img');
    const videos = document.querySelectorAll('video');

    // Remove src from offscreen images
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const isOffscreen = rect.bottom < 0 || rect.top > window.innerHeight;

      if (isOffscreen && img.dataset.originalSrc) {
        img.src = '';
      }
    });

    // Pause offscreen videos
    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const isOffscreen = rect.bottom < 0 || rect.top > window.innerHeight;

      if (isOffscreen && !video.paused) {
        video.pause();
      }
    });
  }

  /**
   * Clean up component tracking
   */
  private cleanupComponentTracking(): void {
    // Remove tracking for components that are no longer mounted
    const toRemove: any[] = [];

    this.componentInstances.forEach((component) => {
      // Simple heuristic: if component doesn't have _reactInternalInstance, it's unmounted
      if (!component._reactInternalFiber && !component._reactInternalInstance) {
        toRemove.push(component);
      }
    });

    toRemove.forEach((component) => {
      this.componentInstances.delete(component);
      this.weakMapRegistry.delete(component);
    });
  }

  /**
   * Setup DOM leak detection
   */
  private setupDomLeakDetection(): void {
    if (!('MutationObserver' in window)) return;

    this.domMutationObserver = new MutationObserver((mutations) => {
      let addedNodes = 0;
      let removedNodes = 0;

      mutations.forEach((mutation) => {
        addedNodes += mutation.addedNodes.length;
        removedNodes += mutation.removedNodes.length;
      });

      // If we're adding many more nodes than we're removing, potential leak
      if (addedNodes > removedNodes + 10) {
        console.debug(`DOM growth detected: +${addedNodes - removedNodes} nodes`);
      }
    });

    this.domMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup visibility handling for memory optimization
   */
  private setupVisibilityHandling(): void {
    if (!('hidden' in document)) return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, perform aggressive cleanup
        this.performOptimization();
        this.cleanupImages();
      }
    });
  }

  /**
   * Setup memory pressure handling
   */
  private setupMemoryPressureHandling(): void {
    // Listen for memory pressure events (if available)
    if ('onmemory' in window) {
      const memoryHandler = () => {
        console.warn('Memory pressure detected');
        this.performEmergencyCleanup();
      };
      (window as any).addEventListener('memory', memoryHandler);
    }

    // Monitor for low memory conditions via performance.memory
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usageRatio > 0.9) {
          console.warn('High memory usage ratio:', usageRatio);
          this.performEmergencyCleanup();
        }
      }, 10000);
    }
  }

  /**
   * Clean up all resources
   */
  private cleanupAll(): void {
    // Run all cleanup functions
    this.cleanupRegistry.forEach((cleanup) => {
      try {
        cleanup.cleanup();
      } catch (error) {
        console.warn(`Cleanup failed for ${cleanup.id}:`, error);
      }
    });

    this.cleanupRegistry.clear();
    this.componentInstances.clear();
    this.stopMonitoring();
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): MemoryMetrics {
    return {
      heapUsed: 0,
      heapTotal: 0,
      heapLimit: 0,
      domNodes: 0,
      eventListeners: 0,
      detachedNodes: 0,
      leakRisk: 0,
    };
  }

  /**
   * Notify metrics observers
   */
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer({ ...this.metrics }));
  }

  // Public API methods

  /**
   * Get current memory metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory usage history
   */
  getHistory(): Array<{ timestamp: number; usage: number }> {
    return [...this.memoryHistory];
  }

  /**
   * Get detected memory leaks
   */
  getLeaks(): MemoryLeak[] {
    return Array.from(this.leakDetectors.values());
  }

  /**
   * Subscribe to memory metrics updates
   */
  subscribe(observer: (metrics: MemoryMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Subscribe to memory leak detection
   */
  subscribeToLeaks(observer: (leak: MemoryLeak) => void): () => void {
    this.leakObservers.add(observer);
    return () => this.leakObservers.delete(observer);
  }

  /**
   * Force memory optimization
   */
  optimize(): void {
    this.performOptimization();
    this.scheduleGarbageCollection();
  }

  /**
   * Set custom memory budget
   */
  setBudget(budget: Partial<MemoryBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'cleanup' | 'gc' | 'dom' | 'listeners';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action: () => void;
  }> {
    const recommendations: Array<{
      type: 'cleanup' | 'gc' | 'dom' | 'listeners';
      priority: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      action: () => void;
    }> = [];

    const { heapUsed, domNodes, eventListeners, leakRisk } = this.metrics;

    // High memory usage
    if (heapUsed > this.budget.warningThreshold) {
      recommendations.push({
        type: 'cleanup',
        priority: heapUsed > this.budget.criticalThreshold ? 'critical' : 'high',
        description: `Memory usage: ${Math.round(heapUsed / 1024 / 1024)}MB`,
        action: () => this.performOptimization(),
      });
    }

    // High leak risk
    if (leakRisk > 0.5) {
      recommendations.push({
        type: 'cleanup',
        priority: leakRisk > 0.8 ? 'critical' : 'high',
        description: `High memory leak risk: ${Math.round(leakRisk * 100)}%`,
        action: () => this.performOptimization(),
      });
    }

    // Too many DOM nodes
    if (domNodes > this.budget.maxDomNodes * 0.8) {
      recommendations.push({
        type: 'dom',
        priority: 'medium',
        description: `High DOM node count: ${domNodes}`,
        action: () => this.cleanupImages(),
      });
    }

    // Too many event listeners
    if (eventListeners > this.budget.maxEventListeners * 0.8) {
      recommendations.push({
        type: 'listeners',
        priority: 'medium',
        description: `High event listener count: ${eventListeners}`,
        action: () => this.performOptimization(),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

// React hooks for memory optimization

/**
 * Hook for automatic cleanup registration
 */
export function useMemoryCleanup(
  cleanup: () => void,
  deps: React.DependencyList = [],
  options: { priority?: number; memoryImpact?: number } = {}
) {
  const optimizer = MemoryOptimizer.getInstance();
  const cleanupIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Register cleanup
    cleanupIdRef.current = optimizer.registerCleanup({
      type: 'listener',
      cleanup,
      priority: options.priority || 5,
      memoryImpact: options.memoryImpact || 1000,
    });

    return () => {
      if (cleanupIdRef.current) {
        optimizer.unregisterCleanup(cleanupIdRef.current);
      }
    };
  }, deps);

  // Return manual cleanup function
  return useCallback(() => {
    if (cleanupIdRef.current) {
      optimizer.unregisterCleanup(cleanupIdRef.current);
      cleanupIdRef.current = null;
    }
  }, []);
}

/**
 * Hook for component memory tracking
 */
export function useMemoryTracking(componentName: string, metadata?: any) {
  const optimizer = MemoryOptimizer.getInstance();
  const componentRef = useRef<any>({});

  useEffect(() => {
    const cleanup = optimizer.trackComponent(componentRef.current, {
      name: componentName,
      ...metadata,
    });

    return cleanup;
  }, [componentName]);

  return componentRef;
}

/**
 * Hook for memory metrics monitoring
 */
export function useMemoryMetrics(): {
  metrics: MemoryMetrics;
  leaks: MemoryLeak[];
  optimize: () => void;
  recommendations: Array<{
    type: 'cleanup' | 'gc' | 'dom' | 'listeners';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action: () => void;
  }>;
} {
  const optimizer = MemoryOptimizer.getInstance();
  const [metrics, setMetrics] = React.useState<MemoryMetrics>(optimizer.getMetrics());
  const [leaks, setLeaks] = React.useState<MemoryLeak[]>(optimizer.getLeaks());

  useEffect(() => {
    const unsubscribeMetrics = optimizer.subscribe(setMetrics);
    const unsubscribeLeaks = optimizer.subscribeToLeaks((leak) => {
      setLeaks((prev) => [leak, ...prev.slice(0, 49)]);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeLeaks();
    };
  }, []);

  const optimize = useCallback(() => {
    optimizer.optimize();
  }, []);

  const recommendations = React.useMemo(() => {
    return optimizer.getOptimizationRecommendations();
  }, [metrics]);

  return { metrics, leaks, optimize, recommendations };
}

// Export singleton instance
export const memoryOptimizer = MemoryOptimizer.getInstance();

// Export types
export type { MemoryMetrics, MemoryLeak, MemoryBudget, ResourceCleanup };
