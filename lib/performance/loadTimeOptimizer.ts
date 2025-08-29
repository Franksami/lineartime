/**
 * Load Time Optimization Engine
 * Achieve <500ms initial load time through critical path analysis and optimization
 * Based on Context7 research for production load time optimization
 */

import { ComponentType, lazy } from 'react';

// Load time optimization interfaces
interface LoadTimeMetrics {
  TTFB: number; // Time to First Byte
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTI: number; // Time to Interactive
  TBT: number; // Total Blocking Time
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  totalLoadTime: number;
  criticalResourceTime: number;
  nonCriticalResourceTime: number;
}

interface CriticalResource {
  id: string;
  type: 'css' | 'js' | 'font' | 'image' | 'api';
  url: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isBlocking: boolean;
  loadTime: number;
  cached: boolean;
}

interface LoadTimeOptimizationConfig {
  targetLoadTime: number; // Target load time in ms
  criticalPathTimeout: number; // Max critical path time
  preloadThreshold: number; // Preload priority threshold
  enableResourceHints: boolean; // DNS prefetch, preconnect, etc.
  enableServiceWorker: boolean; // Service worker caching
  enableStreaming: boolean; // Streaming SSR
  enableCodeSplitting: boolean; // Dynamic imports
  compressionLevel: 'none' | 'gzip' | 'brotli';
}

interface CacheStrategy {
  static: {
    maxAge: number; // Cache duration in seconds
    staleWhileRevalidate: boolean;
  };
  dynamic: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxAge: number;
  };
  api: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxAge: number;
  };
}

// Default optimization configuration
const DEFAULT_CONFIG: LoadTimeOptimizationConfig = {
  targetLoadTime: 500, // 500ms target
  criticalPathTimeout: 1000, // 1s max for critical path
  preloadThreshold: 0.8, // 80% probability for preloading
  enableResourceHints: true,
  enableServiceWorker: true,
  enableStreaming: true,
  enableCodeSplitting: true,
  compressionLevel: 'brotli',
};

const DEFAULT_CACHE_STRATEGY: CacheStrategy = {
  static: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: true,
  },
  dynamic: {
    strategy: 'stale-while-revalidate',
    maxAge: 3600, // 1 hour
  },
  api: {
    strategy: 'network-first',
    maxAge: 300, // 5 minutes
  },
};

class LoadTimeOptimizer {
  private static instance: LoadTimeOptimizer;
  private config: LoadTimeOptimizationConfig;
  private cacheStrategy: CacheStrategy;
  private criticalResources: Map<string, CriticalResource> = new Map();
  private metrics: LoadTimeMetrics;
  private observers: Set<(metrics: LoadTimeMetrics) => void> = new Set();

  // Performance tracking
  private performanceObserver: PerformanceObserver | null = null;
  private loadStartTime = 0;
  private criticalPathResources: Set<string> = new Set();
  private preloadedResources: Set<string> = new Set();

  // Resource management
  private resourceHints: Set<string> = new Set();
  private serviceWorker: ServiceWorkerRegistration | null = null;

  private constructor(
    config: Partial<LoadTimeOptimizationConfig> = {},
    cacheStrategy: Partial<CacheStrategy> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheStrategy = { ...DEFAULT_CACHE_STRATEGY, ...cacheStrategy };
    this.metrics = this.getInitialMetrics();

    if (typeof window !== 'undefined') {
      this.initializeOptimization();
    }
  }

  static getInstance(
    config?: Partial<LoadTimeOptimizationConfig>,
    cacheStrategy?: Partial<CacheStrategy>
  ): LoadTimeOptimizer {
    if (!LoadTimeOptimizer.instance) {
      LoadTimeOptimizer.instance = new LoadTimeOptimizer(config, cacheStrategy);
    }
    return LoadTimeOptimizer.instance;
  }

  /**
   * Initialize load time optimization
   */
  private initializeOptimization(): void {
    this.loadStartTime = performance.now();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Analyze critical path
    this.analyzeCriticalPath();

    // Setup resource hints
    if (this.config.enableResourceHints) {
      this.setupResourceHints();
    }

    // Setup service worker
    if (this.config.enableServiceWorker) {
      this.setupServiceWorker();
    }

    // Setup preloading
    this.setupIntelligentPreloading();

    // Monitor network conditions
    this.monitorNetworkConditions();

    // Setup critical CSS injection
    this.setupCriticalCSS();

    // Setup font optimization
    this.optimizeFontLoading();
  }

  /**
   * Setup performance monitoring with detailed metrics
   */
  private setupPerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
        this.updateMetrics();
      });

      // Observe all relevant performance entry types
      this.performanceObserver.observe({
        entryTypes: [
          'navigation',
          'paint',
          'largest-contentful-paint',
          'first-input',
          'layout-shift',
          'longtask',
          'resource',
        ],
      });
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }

    // Also use Navigation Timing API for broader compatibility
    window.addEventListener('load', () => {
      setTimeout(() => this.calculateLoadMetrics(), 0);
    });
  }

  /**
   * Process individual performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry);
        break;
      case 'largest-contentful-paint':
        this.metrics.LCP = entry.startTime;
        break;
      case 'first-input':
        this.metrics.FID = (entry as any).processingStart - entry.startTime;
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          this.metrics.CLS += (entry as any).value;
        }
        break;
      case 'longtask':
        this.metrics.TBT += Math.max(0, entry.duration - 50);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
    }
  }

  /**
   * Process navigation timing entry
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.TTFB = entry.responseStart - entry.fetchStart;
    this.metrics.totalLoadTime = entry.loadEventEnd - entry.fetchStart;
    this.metrics.TTI = this.calculateTTI(entry);
  }

  /**
   * Process paint timing entry
   */
  private processPaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.FCP = entry.startTime;
    }
  }

  /**
   * Process resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resource: CriticalResource = {
      id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.getResourceType(entry.name),
      url: entry.name,
      size: entry.transferSize || 0,
      priority: this.determineResourcePriority(entry),
      isBlocking: this.isBlockingResource(entry),
      loadTime: entry.duration,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    };

    this.criticalResources.set(resource.id, resource);

    // Track critical path resources
    if (resource.isBlocking || resource.priority === 'critical') {
      this.criticalPathResources.add(resource.id);
    }
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTTI(navigation: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    // In production, would use more sophisticated algorithm
    return Math.max(
      navigation.domContentLoadedEventEnd - navigation.fetchStart,
      this.metrics.FCP + 50 // Approximate
    );
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): CriticalResource['type'] {
    if (url.includes('.css')) return 'css';
    if (url.includes('.js') || url.includes('.mjs')) return 'js';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('/api/') || url.includes('graphql')) return 'api';
    return 'image';
  }

  /**
   * Determine resource priority
   */
  private determineResourcePriority(
    entry: PerformanceResourceTiming
  ): CriticalResource['priority'] {
    const url = entry.name;

    // Critical: Above-the-fold CSS, main JavaScript
    if (url.includes('critical.css') || url.includes('main.') || url.includes('app.')) {
      return 'critical';
    }

    // High: Fonts, core components
    if (url.includes('.woff') || url.includes('component') || url.includes('react')) {
      return 'high';
    }

    // Medium: Secondary scripts and styles
    if (url.includes('.js') || url.includes('.css')) {
      return 'medium';
    }

    // Low: Images, analytics, third-party
    return 'low';
  }

  /**
   * Check if resource is render-blocking
   */
  private isBlockingResource(entry: PerformanceResourceTiming): boolean {
    const url = entry.name;

    // CSS is render-blocking by default
    if (url.includes('.css')) return true;

    // Synchronous JavaScript is parser-blocking
    if (url.includes('.js') && !url.includes('async') && !url.includes('defer')) {
      return true;
    }

    return false;
  }

  /**
   * Analyze critical rendering path
   */
  private analyzeCriticalPath(): void {
    // Identify critical resources for above-the-fold content
    const criticalSelectors = [
      'header',
      'nav',
      '.hero',
      '.above-fold',
      'h1',
      'h2',
      '.primary-content',
    ];

    const criticalElements = criticalSelectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
    );

    // Calculate critical path length
    const criticalPathLength = this.calculateCriticalPathLength(criticalElements);
    this.metrics.criticalResourceTime = criticalPathLength;

    // Optimize critical path if too long
    if (criticalPathLength > this.config.criticalPathTimeout) {
      this.optimizeCriticalPath();
    }
  }

  /**
   * Calculate critical path length
   */
  private calculateCriticalPathLength(elements: Element[]): number {
    let totalTime = 0;
    const processedUrls = new Set<string>();

    elements.forEach((element) => {
      // Check for CSS dependencies
      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = computedStyle.backgroundImage;

      if (backgroundImage && backgroundImage !== 'none') {
        const urlMatch = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (urlMatch && !processedUrls.has(urlMatch[1])) {
          processedUrls.add(urlMatch[1]);
          totalTime += 100; // Estimated image load time
        }
      }

      // Check for font dependencies
      const fontFamily = computedStyle.fontFamily;
      if (fontFamily && !processedUrls.has(fontFamily)) {
        processedUrls.add(fontFamily);
        totalTime += 50; // Estimated font load time
      }
    });

    return totalTime;
  }

  /**
   * Optimize critical rendering path
   */
  private optimizeCriticalPath(): void {
    // Inline critical CSS
    this.inlineCriticalCSS();

    // Preload critical resources
    this.preloadCriticalResources();

    // Defer non-critical resources
    this.deferNonCriticalResources();

    // Optimize images
    this.optimizeImages();
  }

  /**
   * Inline critical CSS
   */
  private inlineCriticalCSS(): void {
    // This would typically be done at build time
    // Here we simulate by moving critical CSS to head
    const criticalCSS = `
      /* Critical CSS */
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
      .above-fold { min-height: 100vh; }
      .loading { opacity: 0; transition: opacity 0.3s ease; }
      .loaded { opacity: 1; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /**
   * Setup critical CSS injection
   */
  private setupCriticalCSS(): void {
    // Extract critical CSS for above-the-fold content
    const criticalViewport = window.innerHeight;
    const criticalElements: Element[] = [];

    // Find elements in critical viewport
    document.querySelectorAll('*').forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < criticalViewport && rect.bottom > 0) {
        criticalElements.push(element);
      }
    });

    // Generate critical CSS (simplified)
    this.generateCriticalCSS(criticalElements);
  }

  /**
   * Generate critical CSS for elements
   */
  private generateCriticalCSS(elements: Element[]): void {
    const criticalRules = new Set<string>();

    elements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const tagName = element.tagName.toLowerCase();
      const className = element.className;

      // Extract critical styles
      const criticalProperties = [
        'display',
        'position',
        'top',
        'left',
        'width',
        'height',
        'margin',
        'padding',
        'font-family',
        'font-size',
        'color',
        'background-color',
        'border',
      ];

      let rule = '';
      if (className) {
        rule = `.${className.split(' ')[0]} {`;
      } else {
        rule = `${tagName} {`;
      }

      criticalProperties.forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'auto' && value !== 'normal') {
          rule += `${prop}: ${value}; `;
        }
      });

      rule += '}';
      criticalRules.add(rule);
    });

    // Inject critical CSS
    if (criticalRules.size > 0) {
      const style = document.createElement('style');
      style.innerHTML = Array.from(criticalRules).join('\n');
      style.setAttribute('data-critical-css', 'true');
      document.head.appendChild(style);
    }
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    const criticalResources = Array.from(this.criticalResources.values())
      .filter((resource) => resource.priority === 'critical' || resource.priority === 'high')
      .filter((resource) => !this.preloadedResources.has(resource.url));

    criticalResources.forEach((resource) => {
      this.preloadResource(resource);
    });
  }

  /**
   * Preload individual resource
   */
  private preloadResource(resource: CriticalResource): void {
    if (this.preloadedResources.has(resource.url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;

    // Set appropriate attributes based on resource type
    switch (resource.type) {
      case 'css':
        link.as = 'style';
        break;
      case 'js':
        link.as = 'script';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
      case 'image':
        link.as = 'image';
        break;
    }

    link.onload = () => {
      console.debug(`Preloaded: ${resource.url}`);
    };

    link.onerror = () => {
      console.warn(`Failed to preload: ${resource.url}`);
    };

    document.head.appendChild(link);
    this.preloadedResources.add(resource.url);
  }

  /**
   * Defer non-critical resources
   */
  private deferNonCriticalResources(): void {
    // Defer non-critical JavaScript
    document.querySelectorAll('script[src]').forEach((script: Element) => {
      const scriptElement = script as HTMLScriptElement;
      const src = scriptElement.src;

      if (this.isNonCriticalScript(src)) {
        scriptElement.defer = true;
      }
    });

    // Defer non-critical CSS
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link: Element) => {
      const linkElement = link as HTMLLinkElement;
      const href = linkElement.href;

      if (this.isNonCriticalCSS(href)) {
        linkElement.media = 'print';
        linkElement.onload = () => {
          linkElement.media = 'all';
        };
      }
    });
  }

  /**
   * Check if script is non-critical
   */
  private isNonCriticalScript(src: string): boolean {
    const nonCriticalPatterns = [
      'analytics',
      'tracking',
      'ads',
      'social',
      'chat',
      'support',
      'marketing',
    ];

    return nonCriticalPatterns.some((pattern) => src.includes(pattern));
  }

  /**
   * Check if CSS is non-critical
   */
  private isNonCriticalCSS(href: string): boolean {
    const nonCriticalPatterns = ['print', 'mobile', 'tablet', 'theme', 'optional', 'enhancement'];

    return nonCriticalPatterns.some((pattern) => href.includes(pattern));
  }

  /**
   * Setup resource hints for improved loading
   */
  private setupResourceHints(): void {
    const domains = ['fonts.googleapis.com', 'cdn.jsdelivr.net', 'unpkg.com'];

    // DNS prefetch for external domains
    domains.forEach((domain) => {
      if (!this.resourceHints.has(`dns-${domain}`)) {
        this.addResourceHint('dns-prefetch', `https://${domain}`);
        this.resourceHints.add(`dns-${domain}`);
      }
    });

    // Preconnect to critical origins
    const criticalOrigins = ['https://fonts.gstatic.com'];

    criticalOrigins.forEach((origin) => {
      if (!this.resourceHints.has(`connect-${origin}`)) {
        this.addResourceHint('preconnect', origin, true);
        this.resourceHints.add(`connect-${origin}`);
      }
    });
  }

  /**
   * Add resource hint to document
   */
  private addResourceHint(rel: string, href: string, crossorigin = false): void {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;

    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }

  /**
   * Setup service worker for caching
   */
  private async setupServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.serviceWorker = registration;

      // Update cache strategy
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_CACHE_STRATEGY',
          strategy: this.cacheStrategy,
        });
      }

      console.debug('Service worker registered successfully');
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }

  /**
   * Setup intelligent preloading based on user behavior
   */
  private setupIntelligentPreloading(): void {
    // Intersection Observer for viewport-based preloading
    if ('IntersectionObserver' in window) {
      const preloadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              const preloadUrl = element.dataset.preload;

              if (preloadUrl && !this.preloadedResources.has(preloadUrl)) {
                this.preloadResource({
                  id: `preload-${Date.now()}`,
                  type: this.getResourceType(preloadUrl),
                  url: preloadUrl,
                  size: 0,
                  priority: 'medium',
                  isBlocking: false,
                  loadTime: 0,
                  cached: false,
                });
              }
            }
          });
        },
        {
          rootMargin: '100px',
          threshold: 0.1,
        }
      );

      // Observe elements with data-preload attribute
      document.querySelectorAll('[data-preload]').forEach((element) => {
        preloadObserver.observe(element);
      });
    }

    // Mouse hover preloading
    this.setupHoverPreloading();
  }

  /**
   * Setup hover-based preloading
   */
  private setupHoverPreloading(): void {
    let hoverTimer: NodeJS.Timeout;

    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.origin === window.location.origin) {
        hoverTimer = setTimeout(() => {
          this.preloadPage(link.href);
        }, 100); // Preload after 100ms hover
      }
    });

    document.addEventListener('mouseout', () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    });
  }

  /**
   * Preload page resources
   */
  private preloadPage(url: string): void {
    if (this.preloadedResources.has(url)) return;

    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    this.preloadedResources.add(url);
  }

  /**
   * Monitor network conditions for adaptive loading
   */
  private monitorNetworkConditions(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;

    const adaptToConnection = () => {
      const isSlowConnection =
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData;

      if (isSlowConnection) {
        // Disable preloading on slow connections
        this.preloadedResources.clear();

        // Reduce image quality
        this.optimizeImagesForConnection();

        console.debug('Adapted to slow connection');
      }
    };

    connection.addEventListener('change', adaptToConnection);
    adaptToConnection(); // Initial adaptation
  }

  /**
   * Optimize images for current connection
   */
  private optimizeImagesForConnection(): void {
    const images = document.querySelectorAll('img[data-src], img[src]');

    images.forEach((img: Element) => {
      const imageElement = img as HTMLImageElement;
      const isSlowConnection = this.isSlowConnection();

      if (isSlowConnection) {
        // Use low-quality placeholders
        if (imageElement.dataset.lowSrc) {
          imageElement.src = imageElement.dataset.lowSrc;
        }

        // Add loading="lazy" for non-critical images
        if (!imageElement.closest('.above-fold')) {
          imageElement.loading = 'lazy';
        }
      }
    });
  }

  /**
   * Check if connection is slow
   */
  private isSlowConnection(): boolean {
    if (!('connection' in navigator)) return false;

    const connection = (navigator as any).connection;
    return (
      connection &&
      (connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData)
    );
  }

  /**
   * Optimize images for faster loading
   */
  private optimizeImages(): void {
    const images = document.querySelectorAll('img');

    images.forEach((img) => {
      // Add lazy loading for below-the-fold images
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.loading = 'lazy';
      }

      // Add dimensions to prevent layout shift
      if (!img.width && !img.height) {
        // Estimate dimensions or set placeholder
        img.style.minHeight = '200px';
        img.style.backgroundColor = '#f0f0f0';
      }
    });
  }

  /**
   * Optimize font loading
   */
  private optimizeFontLoading(): void {
    // Preload critical fonts
    const criticalFonts = ['/fonts/inter-regular.woff2', '/fonts/inter-medium.woff2'];

    criticalFonts.forEach((fontUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Add font-display: swap for better performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Calculate and update load metrics
   */
  private calculateLoadMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      this.metrics = {
        ...this.metrics,
        TTFB: navigation.responseStart - navigation.fetchStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        TTI: this.calculateTTI(navigation),
      };
    }

    // Calculate resource timing
    const resources = Array.from(this.criticalResources.values());
    const criticalResources = resources.filter((r) => r.priority === 'critical' || r.isBlocking);
    const nonCriticalResources = resources.filter(
      (r) => r.priority !== 'critical' && !r.isBlocking
    );

    this.metrics.criticalResourceTime = criticalResources.reduce((sum, r) => sum + r.loadTime, 0);
    this.metrics.nonCriticalResourceTime = nonCriticalResources.reduce(
      (sum, r) => sum + r.loadTime,
      0
    );

    this.notifyObservers();
  }

  /**
   * Update metrics and notify observers
   */
  private updateMetrics(): void {
    this.calculateLoadMetrics();
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): LoadTimeMetrics {
    return {
      TTFB: 0,
      FCP: 0,
      LCP: 0,
      TTI: 0,
      TBT: 0,
      CLS: 0,
      FID: 0,
      totalLoadTime: 0,
      criticalResourceTime: 0,
      nonCriticalResourceTime: 0,
    };
  }

  /**
   * Notify observers of metrics updates
   */
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer({ ...this.metrics }));
  }

  // Public API methods

  /**
   * Get current load time metrics
   */
  getMetrics(): LoadTimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Get critical resources
   */
  getCriticalResources(): CriticalResource[] {
    return Array.from(this.criticalResources.values());
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(observer: (metrics: LoadTimeMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Force metrics recalculation
   */
  refreshMetrics(): void {
    this.calculateLoadMetrics();
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'preload' | 'defer' | 'compress' | 'cache' | 'critical-css';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImprovement: number; // in milliseconds
    action: () => void;
  }> {
    const recommendations: Array<{
      type: 'preload' | 'defer' | 'compress' | 'cache' | 'critical-css';
      priority: 'high' | 'medium' | 'low';
      description: string;
      estimatedImprovement: number;
      action: () => void;
    }> = [];

    // Check if load time exceeds target
    if (this.metrics.totalLoadTime > this.config.targetLoadTime) {
      const excess = this.metrics.totalLoadTime - this.config.targetLoadTime;

      recommendations.push({
        type: 'critical-css',
        priority: 'high',
        description: 'Inline critical CSS to reduce render blocking',
        estimatedImprovement: Math.min(200, excess * 0.3),
        action: () => this.inlineCriticalCSS(),
      });
    }

    // Check for unpreloaded critical resources
    const criticalResources = Array.from(this.criticalResources.values()).filter(
      (r) => r.priority === 'critical' && !this.preloadedResources.has(r.url)
    );

    if (criticalResources.length > 0) {
      recommendations.push({
        type: 'preload',
        priority: 'high',
        description: `Preload ${criticalResources.length} critical resources`,
        estimatedImprovement: criticalResources.length * 50,
        action: () => this.preloadCriticalResources(),
      });
    }

    // Check for large blocking resources
    const largeBlockingResources = Array.from(this.criticalResources.values()).filter(
      (r) => r.isBlocking && r.size > 100000
    ); // >100KB

    if (largeBlockingResources.length > 0) {
      recommendations.push({
        type: 'defer',
        priority: 'medium',
        description: `Defer ${largeBlockingResources.length} large blocking resources`,
        estimatedImprovement: largeBlockingResources.length * 100,
        action: () => this.deferNonCriticalResources(),
      });
    }

    return recommendations.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  /**
   * Apply automatic optimizations
   */
  optimize(): void {
    const recommendations = this.getOptimizationRecommendations();

    // Apply high-priority optimizations automatically
    recommendations.filter((r) => r.priority === 'high').forEach((r) => r.action());

    console.debug(`Applied ${recommendations.length} load time optimizations`);
  }

  /**
   * Set custom optimization config
   */
  setConfig(config: Partial<LoadTimeOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set custom cache strategy
   */
  setCacheStrategy(strategy: Partial<CacheStrategy>): void {
    this.cacheStrategy = { ...this.cacheStrategy, ...strategy };

    // Update service worker if available
    if (this.serviceWorker?.active) {
      this.serviceWorker.active.postMessage({
        type: 'UPDATE_CACHE_STRATEGY',
        strategy: this.cacheStrategy,
      });
    }
  }
}

// React hooks for load time optimization

/**
 * Hook for monitoring load time metrics
 */
export function useLoadTimeMetrics(): {
  metrics: LoadTimeMetrics;
  optimize: () => void;
  recommendations: Array<{
    type: 'preload' | 'defer' | 'compress' | 'cache' | 'critical-css';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImprovement: number;
    action: () => void;
  }>;
} {
  const optimizer = LoadTimeOptimizer.getInstance();
  const [metrics, setMetrics] = React.useState<LoadTimeMetrics>(optimizer.getMetrics());

  React.useEffect(() => {
    const unsubscribe = optimizer.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  const optimize = React.useCallback(() => {
    optimizer.optimize();
  }, []);

  const recommendations = React.useMemo(() => {
    return optimizer.getOptimizationRecommendations();
  }, [metrics]);

  return { metrics, optimize, recommendations };
}

/**
 * Hook for intelligent resource preloading
 */
export function useResourcePreloader() {
  const optimizer = LoadTimeOptimizer.getInstance();

  return React.useCallback((url: string, priority: CriticalResource['priority'] = 'medium') => {
    optimizer.preloadResource({
      id: `manual-preload-${Date.now()}`,
      type: optimizer.getResourceType(url),
      url,
      size: 0,
      priority,
      isBlocking: false,
      loadTime: 0,
      cached: false,
    });
  }, []);
}

// Export singleton instance
export const loadTimeOptimizer = LoadTimeOptimizer.getInstance();

// Export types
export type { LoadTimeMetrics, CriticalResource, LoadTimeOptimizationConfig, CacheStrategy };
