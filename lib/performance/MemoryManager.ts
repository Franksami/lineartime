/**
 * MemoryManager - Advanced memory management and monitoring system
 * Tracks memory usage, detects leaks, and manages cleanup
 */

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  domNodes: number;
  eventListeners: number;
  detachedNodes: number;
  leakRisk: number; // 0-1 scale
  recommendation?: string;
}

export interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  maxDOMNodes: number;
  maxEventListeners: number;
  maxDetachedNodes: number;
}

interface TrackedResource {
  id: string;
  type: 'element' | 'listener' | 'timer' | 'observer' | 'promise' | 'worker';
  reference: WeakRef<any>;
  metadata?: any;
  created: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private resources: Map<string, TrackedResource> = new Map();
  private cleanupRegistry: FinalizationRegistry<string>;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: MemoryMetrics = this.getInitialMetrics();
  private thresholds: MemoryThresholds;
  private observers: Set<(metrics: MemoryMetrics) => void> = new Set();
  private leakDetectionEnabled = true;
  private autoCleanupEnabled = true;
  
  // Leak detection
  private heapSnapshots: number[] = [];
  private maxSnapshots = 10;
  private leakDetectionThreshold = 5; // MB growth per minute
  
  // Performance cache
  private cacheMap: Map<string, { data: any; expires: number }> = new Map();
  private maxCacheSize = 100; // MB
  private currentCacheSize = 0;

  private constructor() {
    this.thresholds = {
      warning: 100, // 100 MB
      critical: 200, // 200 MB
      maxDOMNodes: 10000,
      maxEventListeners: 1000,
      maxDetachedNodes: 100,
    };

    // Setup cleanup registry for automatic resource cleanup
    this.cleanupRegistry = new FinalizationRegistry((id: string) => {
      this.handleResourceCleanup(id);
    });

    // Start monitoring
    this.startMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): MemoryMetrics {
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      domNodes: 0,
      eventListeners: 0,
      detachedNodes: 0,
      leakRisk: 0,
    };
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.detectLeaks();
      
      if (this.autoCleanupEnabled) {
        this.performAutoCleanup();
      }
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
  }

  /**
   * Update memory metrics
   */
  private updateMetrics(): void {
    const metrics: MemoryMetrics = { ...this.getInitialMetrics() };
    
    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.heapUsed = memory.usedJSHeapSize / 1048576; // Convert to MB
      metrics.heapTotal = memory.totalJSHeapSize / 1048576;
      metrics.external = memory.jsHeapSizeLimit / 1048576;
    }
    
    // Count DOM nodes
    metrics.domNodes = document.getElementsByTagName('*').length;
    
    // Count event listeners (approximate)
    metrics.eventListeners = this.countEventListeners();
    
    // Detect detached nodes
    metrics.detachedNodes = this.countDetachedNodes();
    
    // Calculate leak risk
    metrics.leakRisk = this.calculateLeakRisk(metrics);
    
    // Add recommendation
    metrics.recommendation = this.getRecommendation(metrics);
    
    this.metrics = metrics;
    this.notifyObservers(metrics);
  }

  /**
   * Count approximate event listeners
   */
  private countEventListeners(): number {
    let count = 0;
    const allElements = document.getElementsByTagName('*');
    
    // This is an approximation - actual count would require browser internals
    for (const element of allElements) {
      // Check for inline handlers
      for (const attr of element.attributes) {
        if (attr.name.startsWith('on')) {
          count++;
        }
      }
    }
    
    // Add tracked listeners
    this.resources.forEach(resource => {
      if (resource.type === 'listener') count++;
    });
    
    return count;
  }

  /**
   * Count detached DOM nodes
   */
  private countDetachedNodes(): number {
    let count = 0;
    
    this.resources.forEach(resource => {
      if (resource.type === 'element') {
        const element = resource.reference.deref();
        if (element && !document.body.contains(element)) {
          count++;
        }
      }
    });
    
    return count;
  }

  /**
   * Calculate leak risk score
   */
  private calculateLeakRisk(metrics: MemoryMetrics): number {
    let risk = 0;
    
    // Heap usage risk
    if (metrics.heapUsed > this.thresholds.critical) {
      risk += 0.4;
    } else if (metrics.heapUsed > this.thresholds.warning) {
      risk += 0.2;
    }
    
    // DOM nodes risk
    if (metrics.domNodes > this.thresholds.maxDOMNodes) {
      risk += 0.2;
    }
    
    // Event listeners risk
    if (metrics.eventListeners > this.thresholds.maxEventListeners) {
      risk += 0.2;
    }
    
    // Detached nodes risk
    if (metrics.detachedNodes > this.thresholds.maxDetachedNodes) {
      risk += 0.2;
    }
    
    return Math.min(risk, 1);
  }

  /**
   * Get recommendation based on metrics
   */
  private getRecommendation(metrics: MemoryMetrics): string {
    if (metrics.leakRisk > 0.8) {
      return 'Critical: Memory usage is very high. Consider reloading the page.';
    } else if (metrics.leakRisk > 0.6) {
      return 'Warning: High memory usage detected. Clean up unused resources.';
    } else if (metrics.detachedNodes > 50) {
      return 'Clean up detached DOM nodes to free memory.';
    } else if (metrics.eventListeners > 500) {
      return 'Consider using event delegation to reduce listeners.';
    } else if (metrics.domNodes > 5000) {
      return 'Consider virtualizing long lists to reduce DOM nodes.';
    }
    return 'Memory usage is within normal limits.';
  }

  /**
   * Detect memory leaks
   */
  private detectLeaks(): void {
    if (!this.leakDetectionEnabled) return;
    
    const currentHeap = this.metrics.heapUsed;
    this.heapSnapshots.push(currentHeap);
    
    if (this.heapSnapshots.length > this.maxSnapshots) {
      this.heapSnapshots.shift();
    }
    
    // Check for consistent growth
    if (this.heapSnapshots.length >= 5) {
      const growth = this.heapSnapshots[this.heapSnapshots.length - 1] - this.heapSnapshots[0];
      const timeSpan = (this.heapSnapshots.length - 1) * 5; // seconds
      const growthRate = (growth / timeSpan) * 60; // MB per minute
      
      if (growthRate > this.leakDetectionThreshold) {
        console.warn(`Potential memory leak detected: ${growthRate.toFixed(2)} MB/min growth`);
        this.notifyLeak(growthRate);
      }
    }
  }

  /**
   * Perform automatic cleanup
   */
  private performAutoCleanup(): void {
    const metrics = this.metrics;
    
    // Clean up if memory usage is high
    if (metrics.leakRisk > 0.6) {
      // Clean expired cache
      this.cleanExpiredCache();
      
      // Clean detached nodes
      this.cleanDetachedNodes();
      
      // Force garbage collection if available
      this.forceGarbageCollection();
    }
  }

  /**
   * Track a resource for cleanup
   */
  trackResource(
    id: string,
    resource: any,
    type: TrackedResource['type'],
    metadata?: any
  ): void {
    const trackedResource: TrackedResource = {
      id,
      type,
      reference: new WeakRef(resource),
      metadata,
      created: Date.now(),
    };
    
    this.resources.set(id, trackedResource);
    
    // Register for automatic cleanup
    if (typeof resource === 'object' && resource !== null) {
      this.cleanupRegistry.register(resource, id);
    }
  }

  /**
   * Untrack a resource
   */
  untrackResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      // Perform cleanup based on type
      this.cleanupResource(resource);
      this.resources.delete(id);
    }
  }

  /**
   * Clean up a specific resource
   */
  private cleanupResource(resource: TrackedResource): void {
    const ref = resource.reference.deref();
    if (!ref) return;
    
    switch (resource.type) {
      case 'element':
        if (ref.parentNode) {
          ref.remove();
        }
        break;
      case 'listener':
        if (resource.metadata) {
          const { target, event, handler } = resource.metadata;
          target?.removeEventListener?.(event, handler);
        }
        break;
      case 'timer':
        clearTimeout(ref);
        clearInterval(ref);
        break;
      case 'observer':
        ref.disconnect?.();
        break;
      case 'worker':
        ref.terminate?.();
        break;
    }
  }

  /**
   * Handle automatic resource cleanup
   */
  private handleResourceCleanup(id: string): void {
    this.resources.delete(id);
  }

  /**
   * Clean detached DOM nodes
   */
  private cleanDetachedNodes(): void {
    const toRemove: string[] = [];
    
    this.resources.forEach((resource, id) => {
      if (resource.type === 'element') {
        const element = resource.reference.deref();
        if (element && !document.body.contains(element)) {
          toRemove.push(id);
        }
      }
    });
    
    toRemove.forEach(id => this.untrackResource(id));
    
    if (toRemove.length > 0) {
      console.log(`Cleaned ${toRemove.length} detached nodes`);
    }
  }

  /**
   * Cache management
   */
  cache(key: string, data: any, ttl: number = 60000): void {
    const size = this.estimateSize(data);
    
    // Check if cache would exceed limit
    if (this.currentCacheSize + size > this.maxCacheSize * 1048576) {
      this.cleanExpiredCache();
      
      // If still too large, remove oldest entries
      while (this.currentCacheSize + size > this.maxCacheSize * 1048576 && this.cacheMap.size > 0) {
        const firstKey = this.cacheMap.keys().next().value;
        this.removeFromCache(firstKey);
      }
    }
    
    this.cacheMap.set(key, {
      data,
      expires: Date.now() + ttl,
    });
    
    this.currentCacheSize += size;
  }

  /**
   * Get from cache
   */
  getFromCache(key: string): any | undefined {
    const entry = this.cacheMap.get(key);
    
    if (!entry) return undefined;
    
    if (entry.expires < Date.now()) {
      this.removeFromCache(key);
      return undefined;
    }
    
    return entry.data;
  }

  /**
   * Remove from cache
   */
  private removeFromCache(key: string): void {
    const entry = this.cacheMap.get(key);
    if (entry) {
      const size = this.estimateSize(entry.data);
      this.currentCacheSize -= size;
      this.cacheMap.delete(key);
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const toRemove: string[] = [];
    
    this.cacheMap.forEach((entry, key) => {
      if (entry.expires < now) {
        toRemove.push(key);
      }
    });
    
    toRemove.forEach(key => this.removeFromCache(key));
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str.length * 2; // Rough estimate (2 bytes per character)
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
      console.log('Forced garbage collection');
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: MemoryMetrics) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify observers
   */
  private notifyObservers(metrics: MemoryMetrics): void {
    this.observers.forEach(callback => callback(metrics));
  }

  /**
   * Notify about potential leak
   */
  private notifyLeak(growthRate: number): void {
    const event = new CustomEvent('memoryleak', {
      detail: { growthRate, metrics: this.metrics },
    });
    window.dispatchEvent(event);
  }

  /**
   * Set memory thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Enable/disable features
   */
  setFeatures(features: {
    leakDetection?: boolean;
    autoCleanup?: boolean;
  }): void {
    if (features.leakDetection !== undefined) {
      this.leakDetectionEnabled = features.leakDetection;
    }
    if (features.autoCleanup !== undefined) {
      this.autoCleanupEnabled = features.autoCleanup;
    }
  }

  /**
   * Get resource statistics
   */
  getResourceStats() {
    const stats: Record<string, number> = {};
    
    this.resources.forEach(resource => {
      stats[resource.type] = (stats[resource.type] || 0) + 1;
    });
    
    return {
      total: this.resources.size,
      byType: stats,
      cacheSize: this.currentCacheSize / 1048576, // MB
      cacheEntries: this.cacheMap.size,
    };
  }

  /**
   * Clear all resources
   */
  clearAll(): void {
    this.resources.forEach((resource, id) => {
      this.cleanupResource(resource);
    });
    this.resources.clear();
    this.cacheMap.clear();
    this.currentCacheSize = 0;
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();