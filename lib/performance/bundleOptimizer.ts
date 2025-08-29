/**
 * Bundle Optimization System
 * Dynamic imports, code splitting, and tree shaking for <2MB bundle target
 * Based on Context7 research for enterprise bundle optimization strategies
 */

import { type ComponentType, lazy } from 'react';

// Bundle analysis interfaces
interface BundleMetrics {
  totalSize: number;
  chunkSizes: Record<string, number>;
  unusedCode: string[];
  duplicateModules: string[];
  heavyDependencies: Array<{
    name: string;
    size: number;
    usage: 'critical' | 'important' | 'optional';
  }>;
}

interface BundleOptimizationConfig {
  maxBundleSize: number;
  chunkSizeWarning: number;
  enableDynamicImports: boolean;
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  preloadThreshold: number;
}

interface LazyComponentConfig {
  componentPath: string;
  chunkName?: string;
  preload?: boolean;
  fallback?: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; resetError: () => void }>;
}

// Default optimization configuration
const DEFAULT_CONFIG: BundleOptimizationConfig = {
  maxBundleSize: 2097152, // 2MB in bytes
  chunkSizeWarning: 524288, // 512KB warning threshold
  enableDynamicImports: true,
  enableCodeSplitting: true,
  enableTreeShaking: true,
  preloadThreshold: 0.8, // 80% probability threshold for preloading
};

// Performance budgets for different component categories
const _COMPONENT_BUDGETS = {
  calendar: { maxSize: 400000, priority: 'critical' }, // 400KB for calendar components
  ai: { maxSize: 300000, priority: 'important' }, // 300KB for AI components
  motion: { maxSize: 200000, priority: 'optional' }, // 200KB for motion components
  collaboration: { maxSize: 250000, priority: 'important' }, // 250KB for collaboration
  analytics: { maxSize: 150000, priority: 'optional' }, // 150KB for analytics
};

class BundleOptimizer {
  private static instance: BundleOptimizer;
  private config: BundleOptimizationConfig;
  private bundleMetrics: BundleMetrics | null = null;
  private preloadQueue: Set<string> = new Set();
  private loadedChunks: Set<string> = new Set();
  private observers: Set<(metrics: BundleMetrics) => void> = new Set();

  private constructor(config: Partial<BundleOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (typeof window !== 'undefined') {
      this.initializeOptimization();
    }
  }

  static getInstance(config?: Partial<BundleOptimizationConfig>): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer(config);
    }
    return BundleOptimizer.instance;
  }

  /**
   * Initialize bundle optimization
   */
  private initializeOptimization(): void {
    // Monitor bundle size changes
    this.measureBundleSize();

    // Setup intersection observer for preloading
    this.setupPreloadObserver();

    // Monitor network conditions for adaptive loading
    this.monitorNetworkConditions();

    // Setup periodic optimization checks
    setInterval(() => this.optimizationCheck(), 30000); // Every 30 seconds
  }

  /**
   * Create optimized lazy component with advanced features
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFunction: () => Promise<{ default: T }>,
    config: LazyComponentConfig
  ): ComponentType {
    const LazyComponent = lazy(() => {
      // Add to preload queue if configured
      if (config.preload) {
        this.preloadQueue.add(config.componentPath);
      }

      // Track chunk loading for metrics
      const chunkName = config.chunkName || this.extractChunkName(config.componentPath);

      return importFunction()
        .then((module) => {
          this.loadedChunks.add(chunkName);
          this.updateBundleMetrics();
          return module;
        })
        .catch((error) => {
          console.error(`Failed to load component chunk ${chunkName}:`, error);
          throw error;
        });
    });

    // Return component with error boundary if provided
    if (config.errorBoundary) {
      const _ErrorBoundary = config.errorBoundary;
      return (props: any) => {
        try {
          return LazyComponent(props);
        } catch (error) {
          console.error('Component load error:', error);
          // Return null or fallback component instead of JSX in .ts file
          return null;
        }
      };
    }

    return LazyComponent;
  }

  /**
   * Dynamic import with intelligent preloading
   */
  async dynamicImport<T>(
    importPath: string,
    options: {
      preload?: boolean;
      priority?: 'high' | 'low';
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { preload = false, priority = 'low', timeout = 10000 } = options;

    // Check if already loaded
    const chunkName = this.extractChunkName(importPath);
    if (this.loadedChunks.has(chunkName)) {
      return import(importPath);
    }

    // Add to preload queue if requested
    if (preload) {
      this.preloadQueue.add(importPath);
    }

    // Create timeout promise for reliability
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Import timeout: ${importPath}`)), timeout);
    });

    try {
      const module = await Promise.race([import(importPath), timeoutPromise]);

      this.loadedChunks.add(chunkName);
      this.updateBundleMetrics();
      return module as T;
    } catch (error) {
      console.error(`Dynamic import failed for ${importPath}:`, error);
      throw error;
    }
  }

  /**
   * Preload components based on user behavior patterns
   */
  preloadComponent(componentPath: string, probability = 0.8): void {
    if (!this.config.enableDynamicImports || probability < this.config.preloadThreshold) {
      return;
    }

    // Check network conditions
    if (this.isSlowConnection()) {
      return;
    }

    // Use requestIdleCallback for non-blocking preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          this.preloadInBackground(componentPath);
        },
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => this.preloadInBackground(componentPath), 100);
    }
  }

  /**
   * Preload component in background
   */
  private preloadInBackground(componentPath: string): void {
    if (
      this.preloadQueue.has(componentPath) ||
      this.loadedChunks.has(this.extractChunkName(componentPath))
    ) {
      return;
    }

    this.preloadQueue.add(componentPath);

    // Create link element for preloading
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = this.resolveModulePath(componentPath);
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);

    // Track preload success/failure
    link.onload = () => {
      console.debug(`Preloaded: ${componentPath}`);
    };

    link.onerror = () => {
      console.warn(`Failed to preload: ${componentPath}`);
      this.preloadQueue.delete(componentPath);
    };
  }

  /**
   * Setup intersection observer for intelligent preloading
   */
  private setupPreloadObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            const element = entry.target as HTMLElement;
            const preloadPath = element.dataset.preload;

            if (preloadPath) {
              this.preloadComponent(preloadPath, 0.9);
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Store observer for later use
    (window as any).__bundlePreloadObserver = observer;
  }

  /**
   * Monitor network conditions for adaptive loading
   */
  private monitorNetworkConditions(): void {
    if (!('navigator' in window) || !('connection' in navigator)) return;

    const connection = (navigator as any).connection;

    if (connection) {
      const updateStrategy = () => {
        const isSlowConnection = this.isSlowConnection();

        if (isSlowConnection) {
          // Disable preloading on slow connections
          this.preloadQueue.clear();
          console.debug('Adaptive loading: Disabled preloading due to slow connection');
        } else {
          // Enable aggressive preloading on fast connections
          console.debug('Adaptive loading: Enabled preloading for fast connection');
        }
      };

      connection.addEventListener('change', updateStrategy);
      updateStrategy(); // Initial check
    }
  }

  /**
   * Check if connection is slow
   */
  private isSlowConnection(): boolean {
    if (!('navigator' in window) || !('connection' in navigator)) return false;

    const connection = (navigator as any).connection;
    return (
      connection &&
      (connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData)
    );
  }

  /**
   * Measure current bundle size and analyze chunks
   */
  private measureBundleSize(): void {
    if (!('performance' in window)) return;

    const _entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Calculate total bundle size from JavaScript resources
    const jsResources = resources.filter(
      (resource) => resource.name.includes('.js') || resource.name.includes('.mjs')
    );

    const totalSize = jsResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);

    // Analyze chunks
    const chunkSizes: Record<string, number> = {};
    jsResources.forEach((resource) => {
      const chunkName = this.extractChunkFromUrl(resource.name);
      chunkSizes[chunkName] = resource.transferSize || 0;
    });

    // Identify heavy dependencies (mock analysis)
    const heavyDependencies = Object.entries(chunkSizes)
      .filter(([, size]) => size > this.config.chunkSizeWarning)
      .map(([name, size]) => ({
        name,
        size,
        usage: this.classifyDependencyUsage(name),
      }));

    this.bundleMetrics = {
      totalSize,
      chunkSizes,
      unusedCode: [], // Would require build-time analysis
      duplicateModules: [], // Would require build-time analysis
      heavyDependencies,
    };

    this.notifyObservers();
  }

  /**
   * Update bundle metrics after chunk loading
   */
  private updateBundleMetrics(): void {
    this.measureBundleSize();
  }

  /**
   * Run optimization check
   */
  private optimizationCheck(): void {
    if (!this.bundleMetrics) return;

    const { totalSize, heavyDependencies } = this.bundleMetrics;

    // Check if bundle size exceeds limits
    if (totalSize > this.config.maxBundleSize) {
      console.warn(
        `Bundle size (${Math.round(totalSize / 1024)}KB) exceeds limit (${Math.round(this.config.maxBundleSize / 1024)}KB)`
      );
      this.suggestOptimizations();
    }

    // Check for oversized chunks
    heavyDependencies.forEach((dep) => {
      if (dep.usage === 'optional' && dep.size > this.config.chunkSizeWarning) {
        console.warn(
          `Optional dependency ${dep.name} is large (${Math.round(dep.size / 1024)}KB) - consider lazy loading`
        );
      }
    });
  }

  /**
   * Suggest bundle optimizations
   */
  private suggestOptimizations(): void {
    if (!this.bundleMetrics) return;

    const suggestions: string[] = [];

    // Check for large chunks that could be split
    Object.entries(this.bundleMetrics.chunkSizes).forEach(([chunk, size]) => {
      if (size > this.config.chunkSizeWarning) {
        suggestions.push(`Consider splitting large chunk: ${chunk} (${Math.round(size / 1024)}KB)`);
      }
    });

    // Suggest dynamic imports for heavy dependencies
    this.bundleMetrics.heavyDependencies
      .filter((dep) => dep.usage === 'optional')
      .forEach((dep) => {
        suggestions.push(`Lazy load optional dependency: ${dep.name}`);
      });

    if (suggestions.length > 0) {
      console.group('Bundle Optimization Suggestions:');
      suggestions.forEach((suggestion) => console.warn(suggestion));
      console.groupEnd();
    }
  }

  /**
   * Extract chunk name from component path
   */
  private extractChunkName(componentPath: string): string {
    const parts = componentPath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Extract chunk name from URL
   */
  private extractChunkFromUrl(url: string): string {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.split('?')[0].split('.')[0]; // Remove query params and extensions
  }

  /**
   * Resolve module path for preloading
   */
  private resolveModulePath(componentPath: string): string {
    // In production, this would resolve to the actual chunk URLs
    // For now, return the path as-is
    return componentPath;
  }

  /**
   * Classify dependency usage priority
   */
  private classifyDependencyUsage(dependencyName: string): 'critical' | 'important' | 'optional' {
    // Core calendar functionality is critical
    if (dependencyName.includes('calendar') || dependencyName.includes('linear')) {
      return 'critical';
    }

    // AI and collaboration features are important
    if (dependencyName.includes('ai') || dependencyName.includes('collaboration')) {
      return 'important';
    }

    // Animation and analytics are optional
    if (dependencyName.includes('motion') || dependencyName.includes('analytics')) {
      return 'optional';
    }

    return 'important'; // Default to important
  }

  /**
   * Notify bundle metrics observers
   */
  private notifyObservers(): void {
    if (this.bundleMetrics) {
      this.observers.forEach((observer) => observer(this.bundleMetrics!));
    }
  }

  /**
   * Subscribe to bundle metrics updates
   */
  subscribe(observer: (metrics: BundleMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Get current bundle metrics
   */
  getMetrics(): BundleMetrics | null {
    return this.bundleMetrics;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'code-split' | 'lazy-load' | 'tree-shake' | 'preload';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedSaving: number; // in bytes
  }> {
    if (!this.bundleMetrics) return [];

    const recommendations: Array<{
      type: 'code-split' | 'lazy-load' | 'tree-shake' | 'preload';
      priority: 'high' | 'medium' | 'low';
      description: string;
      estimatedSaving: number;
    }> = [];

    // Analyze heavy dependencies for lazy loading opportunities
    this.bundleMetrics.heavyDependencies.forEach((dep) => {
      if (dep.usage === 'optional' && dep.size > 100000) {
        // >100KB
        recommendations.push({
          type: 'lazy-load',
          priority: 'high',
          description: `Lazy load ${dep.name} to reduce initial bundle size`,
          estimatedSaving: dep.size,
        });
      }
    });

    // Check for code splitting opportunities
    Object.entries(this.bundleMetrics.chunkSizes).forEach(([chunk, size]) => {
      if (size > this.config.chunkSizeWarning) {
        recommendations.push({
          type: 'code-split',
          priority: 'medium',
          description: `Split large chunk ${chunk} into smaller pieces`,
          estimatedSaving: Math.floor(size * 0.3), // Estimated 30% reduction
        });
      }
    });

    return recommendations.sort((a, b) => b.estimatedSaving - a.estimatedSaving);
  }

  /**
   * Force bundle size recalculation
   */
  refreshMetrics(): void {
    this.measureBundleSize();
  }

  /**
   * Clear preload queue and loaded chunks cache
   */
  clearCache(): void {
    this.preloadQueue.clear();
    this.loadedChunks.clear();
  }
}

// Utility functions for component optimization

/**
 * Create optimized lazy component factory
 */
export function createOptimizedLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: {
    chunkName?: string;
    preload?: boolean;
    fallback?: ComponentType;
  } = {}
): ComponentType {
  const optimizer = BundleOptimizer.getInstance();

  return optimizer.createLazyComponent(importFunction, {
    componentPath: options.chunkName || 'unknown',
    ...options,
  });
}

/**
 * Preload component with user interaction prediction
 */
export function preloadOnInteraction(
  componentPath: string,
  element: HTMLElement,
  interactionTypes: string[] = ['mouseenter', 'focus']
): void {
  const optimizer = BundleOptimizer.getInstance();

  const preloadHandler = () => {
    optimizer.preloadComponent(componentPath, 0.9);

    // Remove listeners after first interaction
    interactionTypes.forEach((type) => {
      element.removeEventListener(type, preloadHandler);
    });
  };

  interactionTypes.forEach((type) => {
    element.addEventListener(type, preloadHandler, { once: true, passive: true });
  });
}

/**
 * Progressive enhancement wrapper for optional features
 */
export function withProgressiveEnhancement<T extends ComponentType<any>>(
  baseComponent: T,
  enhancementImport: () => Promise<{ default: ComponentType }>,
  condition: () => boolean = () => true
): ComponentType {
  return (props: any) => {
    const [Enhanced, setEnhanced] = React.useState<ComponentType | null>(null);

    React.useEffect(() => {
      if (condition()) {
        enhancementImport()
          .then((module) => setEnhanced(() => module.default))
          .catch(() => {
            console.warn('Failed to load progressive enhancement');
          });
      }
    }, []);

    if (Enhanced) {
      return React.createElement(Enhanced, props);
    }

    return React.createElement(baseComponent, props);
  };
}

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();

// Export types
export type { BundleMetrics, BundleOptimizationConfig, LazyComponentConfig };
