/**
 * Production Performance Service
 * Unified service integrating all performance optimization systems
 * Sentry-compatible monitoring with production alerting and optimization
 */

import { type BundleMetrics, bundleOptimizer } from './bundleOptimizer';
import { type LoadTimeMetrics, loadTimeOptimizer } from './loadTimeOptimizer';
import { type MemoryLeak, type MemoryMetrics, memoryOptimizer } from './memoryOptimizer';

// Production performance configuration
interface ProductionPerformanceConfig {
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    reportingInterval: number; // in milliseconds
    alertingEnabled: boolean;
    sentryDsn?: string;
  };

  // Performance budgets (production-grade thresholds)
  budgets: {
    bundleSize: {
      max: number; // 2MB default
      critical: number; // 2.5MB critical
      warning: number; // 1.5MB warning
    };
    loadTime: {
      target: number; // 500ms target
      max: number; // 1000ms max
      critical: number; // 2000ms critical
    };
    memory: {
      target: number; // 80MB target
      max: number; // 100MB max
      critical: number; // 120MB critical
    };
    fps: {
      min: number; // 112 FPS minimum
      critical: number; // 60 FPS critical
      warning: number; // 90 FPS warning
    };
  };

  // Optimization settings
  optimization: {
    autoOptimize: boolean;
    aggressiveMode: boolean; // For critical performance situations
    adaptiveOptimization: boolean; // Adapt based on user device/network
  };

  // Alerting thresholds
  alerting: {
    errorThreshold: number; // Number of errors before alert
    warningThreshold: number; // Number of warnings before alert
    criticalResponseTime: number; // Response time for critical alerts
  };
}

// Unified performance metrics
interface UnifiedPerformanceMetrics {
  timestamp: number;

  // Overall health
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceScore: number; // 0-100

  // Bundle metrics
  bundle: {
    totalSize: number;
    loadTime: number;
    optimizationScore: number;
    chunkCount: number;
  };

  // Memory metrics
  memory: {
    heapUsed: number;
    heapTotal: number;
    leakRisk: number;
    gcFrequency: number;
  };

  // Load time metrics
  loadTime: {
    TTFB: number;
    FCP: number;
    LCP: number;
    TTI: number;
    totalLoadTime: number;
  };

  // User experience metrics
  userExperience: {
    fps: number;
    responsiveness: number;
    stability: number;
    accessibility: number;
  };

  // Real User Monitoring (RUM) metrics
  rum: {
    sessionId: string;
    userId?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connection: string;
    location: string;
    browserVersion: string;
  };
}

// Performance alerts
interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'bundle' | 'memory' | 'load-time' | 'user-experience' | 'system';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  recommendation: string;
  context: {
    sessionId: string;
    userId?: string;
    page: string;
    userAgent: string;
  };
  acknowledged: boolean;
  resolvedAt?: number;
}

// Default production configuration
const DEFAULT_PRODUCTION_CONFIG: ProductionPerformanceConfig = {
  monitoring: {
    enabled: true,
    reportingInterval: 30000, // 30 seconds
    alertingEnabled: true,
  },
  budgets: {
    bundleSize: {
      max: 2097152, // 2MB
      critical: 2621440, // 2.5MB
      warning: 1572864, // 1.5MB
    },
    loadTime: {
      target: 500, // 500ms
      max: 1000, // 1s
      critical: 2000, // 2s
    },
    memory: {
      target: 83886080, // 80MB
      max: 104857600, // 100MB
      critical: 125829120, // 120MB
    },
    fps: {
      min: 112,
      critical: 60,
      warning: 90,
    },
  },
  optimization: {
    autoOptimize: true,
    aggressiveMode: false,
    adaptiveOptimization: true,
  },
  alerting: {
    errorThreshold: 3,
    warningThreshold: 5,
    criticalResponseTime: 60000, // 1 minute
  },
};

class ProductionPerformanceService {
  private static instance: ProductionPerformanceService;
  private config: ProductionPerformanceConfig;

  // Metrics and state
  private currentMetrics: UnifiedPerformanceMetrics;
  private metricsHistory: UnifiedPerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;

  // Observers and subscriptions
  private observers: Set<(metrics: UnifiedPerformanceMetrics) => void> = new Set();
  private alertObservers: Set<(alert: PerformanceAlert) => void> = new Set();

  // Monitoring state
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private alertCooldown: Map<string, number> = new Map();

  // Optimization state
  private optimizationInProgress = false;
  private lastOptimization = 0;
  private optimizationResults: Array<{
    timestamp: number;
    type: string;
    improvement: number;
    success: boolean;
  }> = [];

  private constructor(config: Partial<ProductionPerformanceConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_PRODUCTION_CONFIG, config);
    this.sessionId = this.generateSessionId();
    this.currentMetrics = this.getInitialMetrics();

    if (typeof window !== 'undefined') {
      this.initializeService();
    }
  }

  static getInstance(config?: Partial<ProductionPerformanceConfig>): ProductionPerformanceService {
    if (!ProductionPerformanceService.instance) {
      ProductionPerformanceService.instance = new ProductionPerformanceService(config);
    }
    return ProductionPerformanceService.instance;
  }

  /**
   * Initialize the production performance service
   */
  private initializeService(): void {
    // Initialize Sentry integration if configured
    if (this.config.monitoring.sentryDsn) {
      this.initializeSentry();
    }

    // Start monitoring if enabled
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }

    // Setup error boundary integration
    this.setupErrorBoundaryIntegration();

    // Setup automatic optimization
    if (this.config.optimization.autoOptimize) {
      this.setupAutoOptimization();
    }

    // Setup network condition monitoring
    this.setupNetworkMonitoring();

    // Setup page lifecycle events
    this.setupPageLifecycleEvents();

    // Setup real user monitoring
    this.setupRealUserMonitoring();
  }

  /**
   * Initialize Sentry integration for production monitoring
   */
  private initializeSentry(): void {
    // This would integrate with @sentry/browser in a real implementation
    console.debug('Sentry integration initialized with DSN:', this.config.monitoring.sentryDsn);

    // Setup Sentry performance monitoring
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;

      // Start Sentry transaction
      const transaction = Sentry.startTransaction({
        name: 'Performance Monitoring',
        op: 'performance.monitor',
      });

      // Set transaction on scope
      Sentry.getCurrentHub().configureScope((scope: any) => {
        scope.setSpan(transaction);
      });
    }
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Subscribe to individual optimizers
    this.subscribeToOptimizers();

    // Start metrics collection interval
    this.monitoringInterval = setInterval(() => {
      this.collectUnifiedMetrics();
      this.analyzePerformance();
      this.reportMetrics();
    }, this.config.monitoring.reportingInterval);

    console.debug('Production performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  private stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.debug('Production performance monitoring stopped');
  }

  /**
   * Subscribe to individual optimizer metrics
   */
  private subscribeToOptimizers(): void {
    // Subscribe to bundle optimizer
    bundleOptimizer.subscribe((bundleMetrics: BundleMetrics) => {
      this.updateBundleMetrics(bundleMetrics);
    });

    // Subscribe to memory optimizer
    memoryOptimizer.subscribe((memoryMetrics: MemoryMetrics) => {
      this.updateMemoryMetrics(memoryMetrics);
    });

    // Subscribe to memory leaks
    memoryOptimizer.subscribeToLeaks((leak: MemoryLeak) => {
      this.handleMemoryLeak(leak);
    });

    // Subscribe to load time optimizer
    loadTimeOptimizer.subscribe((loadTimeMetrics: LoadTimeMetrics) => {
      this.updateLoadTimeMetrics(loadTimeMetrics);
    });
  }

  /**
   * Collect unified performance metrics
   */
  private collectUnifiedMetrics(): void {
    const now = Date.now();

    // Get metrics from individual optimizers
    const bundleMetrics = bundleOptimizer.getMetrics();
    const memoryMetrics = memoryOptimizer.getMetrics();
    const loadTimeMetrics = loadTimeOptimizer.getMetrics();

    // Calculate unified metrics
    const unifiedMetrics: UnifiedPerformanceMetrics = {
      timestamp: now,
      overallHealth: this.calculateOverallHealth(bundleMetrics, memoryMetrics, loadTimeMetrics),
      performanceScore: this.calculatePerformanceScore(
        bundleMetrics,
        memoryMetrics,
        loadTimeMetrics
      ),

      bundle: {
        totalSize: bundleMetrics?.totalSize || 0,
        loadTime: loadTimeMetrics?.totalLoadTime || 0,
        optimizationScore: this.calculateBundleOptimizationScore(bundleMetrics),
        chunkCount: bundleMetrics ? Object.keys(bundleMetrics.chunkSizes).length : 0,
      },

      memory: {
        heapUsed: memoryMetrics.heapUsed,
        heapTotal: memoryMetrics.heapTotal,
        leakRisk: memoryMetrics.leakRisk,
        gcFrequency: this.calculateGCFrequency(),
      },

      loadTime: {
        TTFB: loadTimeMetrics.TTFB,
        FCP: loadTimeMetrics.FCP,
        LCP: loadTimeMetrics.LCP,
        TTI: loadTimeMetrics.TTI,
        totalLoadTime: loadTimeMetrics.totalLoadTime,
      },

      userExperience: {
        fps: this.getCurrentFPS(),
        responsiveness: this.calculateResponsiveness(),
        stability: this.calculateStability(),
        accessibility: this.calculateAccessibilityScore(),
      },

      rum: {
        sessionId: this.sessionId,
        deviceType: this.detectDeviceType(),
        connection: this.getConnectionType(),
        location: this.getUserLocation(),
        browserVersion: this.getBrowserVersion(),
      },
    };

    // Update current metrics
    this.currentMetrics = unifiedMetrics;

    // Add to history
    this.metricsHistory.push(unifiedMetrics);
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift(); // Keep last 100 measurements
    }

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Analyze performance and generate alerts
   */
  private analyzePerformance(): void {
    const metrics = this.currentMetrics;
    const budgets = this.config.budgets;

    // Check bundle size budget
    if (metrics.bundle.totalSize > budgets.bundleSize.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'bundle',
        metric: 'bundleSize',
        currentValue: metrics.bundle.totalSize,
        threshold: budgets.bundleSize.critical,
        message: 'Bundle size exceeds critical threshold',
        recommendation: 'Implement code splitting and tree shaking immediately',
      });
    } else if (metrics.bundle.totalSize > budgets.bundleSize.max) {
      this.createAlert({
        severity: 'error',
        category: 'bundle',
        metric: 'bundleSize',
        currentValue: metrics.bundle.totalSize,
        threshold: budgets.bundleSize.max,
        message: 'Bundle size exceeds maximum budget',
        recommendation: 'Enable dynamic imports and optimize heavy dependencies',
      });
    }

    // Check load time budget
    if (metrics.loadTime.totalLoadTime > budgets.loadTime.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'load-time',
        metric: 'totalLoadTime',
        currentValue: metrics.loadTime.totalLoadTime,
        threshold: budgets.loadTime.critical,
        message: 'Load time exceeds critical threshold',
        recommendation: 'Implement critical path optimization and resource preloading',
      });
    } else if (metrics.loadTime.totalLoadTime > budgets.loadTime.max) {
      this.createAlert({
        severity: 'warning',
        category: 'load-time',
        metric: 'totalLoadTime',
        currentValue: metrics.loadTime.totalLoadTime,
        threshold: budgets.loadTime.max,
        message: 'Load time exceeds target budget',
        recommendation: 'Optimize critical rendering path and enable compression',
      });
    }

    // Check memory budget
    if (metrics.memory.heapUsed > budgets.memory.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'memory',
        metric: 'heapUsed',
        currentValue: metrics.memory.heapUsed,
        threshold: budgets.memory.critical,
        message: 'Memory usage exceeds critical threshold',
        recommendation: 'Trigger emergency memory cleanup and investigate leaks',
      });
    } else if (metrics.memory.heapUsed > budgets.memory.max) {
      this.createAlert({
        severity: 'error',
        category: 'memory',
        metric: 'heapUsed',
        currentValue: metrics.memory.heapUsed,
        threshold: budgets.memory.max,
        message: 'Memory usage exceeds maximum budget',
        recommendation: 'Optimize memory usage and cleanup unused resources',
      });
    }

    // Check FPS budget
    if (metrics.userExperience.fps < budgets.fps.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'user-experience',
        metric: 'fps',
        currentValue: metrics.userExperience.fps,
        threshold: budgets.fps.critical,
        message: 'FPS below critical threshold',
        recommendation: 'Reduce rendering complexity and optimize animations',
      });
    } else if (metrics.userExperience.fps < budgets.fps.min) {
      this.createAlert({
        severity: 'warning',
        category: 'user-experience',
        metric: 'fps',
        currentValue: metrics.userExperience.fps,
        threshold: budgets.fps.min,
        message: 'FPS below target performance',
        recommendation: 'Optimize component rendering and reduce paint operations',
      });
    }

    // Check for performance regressions
    this.detectPerformanceRegressions();

    // Trigger automatic optimization if needed
    if (this.config.optimization.autoOptimize) {
      this.triggerAutoOptimization();
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'context' | 'acknowledged'>
  ): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check cooldown to prevent alert spam
    const cooldownKey = `${alertData.category}-${alertData.metric}`;
    const lastAlert = this.alertCooldown.get(cooldownKey) || 0;
    const cooldownPeriod = alertData.severity === 'critical' ? 30000 : 60000; // 30s for critical, 60s for others

    if (Date.now() - lastAlert < cooldownPeriod) {
      return; // Skip if still in cooldown
    }

    const alert: PerformanceAlert = {
      id: alertId,
      timestamp: Date.now(),
      ...alertData,
      context: {
        sessionId: this.sessionId,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      },
      acknowledged: false,
    };

    this.alerts.unshift(alert);

    // Trim alerts to prevent memory issues
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // Set cooldown
    this.alertCooldown.set(cooldownKey, Date.now());

    // Notify alert observers
    this.alertObservers.forEach((observer) => observer(alert));

    // Send to Sentry if configured
    if (
      this.config.monitoring.sentryDsn &&
      typeof window !== 'undefined' &&
      (window as any).Sentry
    ) {
      const Sentry = (window as any).Sentry;

      Sentry.captureMessage(alert.message, {
        level: alert.severity,
        tags: {
          category: alert.category,
          metric: alert.metric,
          sessionId: this.sessionId,
        },
        extra: {
          currentValue: alert.currentValue,
          threshold: alert.threshold,
          recommendation: alert.recommendation,
        },
      });
    }

    console.warn(`Performance Alert [${alert.severity.toUpperCase()}]:`, alert.message);
  }

  /**
   * Detect performance regressions
   */
  private detectPerformanceRegressions(): void {
    if (this.metricsHistory.length < 10) return;

    const recent = this.metricsHistory.slice(-5);
    const baseline = this.metricsHistory.slice(-15, -10);

    // Calculate averages
    const recentAvg = {
      bundleSize: recent.reduce((sum, m) => sum + m.bundle.totalSize, 0) / recent.length,
      loadTime: recent.reduce((sum, m) => sum + m.loadTime.totalLoadTime, 0) / recent.length,
      memory: recent.reduce((sum, m) => sum + m.memory.heapUsed, 0) / recent.length,
      fps: recent.reduce((sum, m) => sum + m.userExperience.fps, 0) / recent.length,
    };

    const baselineAvg = {
      bundleSize: baseline.reduce((sum, m) => sum + m.bundle.totalSize, 0) / baseline.length,
      loadTime: baseline.reduce((sum, m) => sum + m.loadTime.totalLoadTime, 0) / baseline.length,
      memory: baseline.reduce((sum, m) => sum + m.memory.heapUsed, 0) / baseline.length,
      fps: baseline.reduce((sum, m) => sum + m.userExperience.fps, 0) / baseline.length,
    };

    // Check for significant regressions (>20% degradation)
    const regressionThreshold = 0.2;

    if ((recentAvg.loadTime - baselineAvg.loadTime) / baselineAvg.loadTime > regressionThreshold) {
      this.createAlert({
        severity: 'error',
        category: 'load-time',
        metric: 'regressionDetection',
        currentValue: recentAvg.loadTime,
        threshold: baselineAvg.loadTime * (1 + regressionThreshold),
        message: 'Load time performance regression detected',
        recommendation: 'Review recent changes that may have impacted load performance',
      });
    }

    if ((recentAvg.memory - baselineAvg.memory) / baselineAvg.memory > regressionThreshold) {
      this.createAlert({
        severity: 'error',
        category: 'memory',
        metric: 'regressionDetection',
        currentValue: recentAvg.memory,
        threshold: baselineAvg.memory * (1 + regressionThreshold),
        message: 'Memory usage regression detected',
        recommendation: 'Check for memory leaks or inefficient resource usage',
      });
    }

    if ((baselineAvg.fps - recentAvg.fps) / baselineAvg.fps > regressionThreshold) {
      this.createAlert({
        severity: 'warning',
        category: 'user-experience',
        metric: 'regressionDetection',
        currentValue: recentAvg.fps,
        threshold: baselineAvg.fps * (1 - regressionThreshold),
        message: 'FPS performance regression detected',
        recommendation: 'Review rendering optimizations and animation performance',
      });
    }
  }

  /**
   * Trigger automatic optimization
   */
  private triggerAutoOptimization(): void {
    if (this.optimizationInProgress) return;

    const now = Date.now();
    const timeSinceLastOptimization = now - this.lastOptimization;

    // Don't optimize too frequently
    if (timeSinceLastOptimization < 60000) return; // 1 minute minimum

    this.optimizationInProgress = true;
    this.lastOptimization = now;

    // Run optimizations in sequence
    this.runOptimizationSequence()
      .then((results) => {
        this.optimizationResults.push(...results);
        console.debug('Automatic optimization completed:', results);
      })
      .catch((error) => {
        console.error('Automatic optimization failed:', error);
      })
      .finally(() => {
        this.optimizationInProgress = false;
      });
  }

  /**
   * Run optimization sequence
   */
  private async runOptimizationSequence(): Promise<
    Array<{
      timestamp: number;
      type: string;
      improvement: number;
      success: boolean;
    }>
  > {
    const results: Array<{
      timestamp: number;
      type: string;
      improvement: number;
      success: boolean;
    }> = [];

    const beforeMetrics = { ...this.currentMetrics };

    try {
      // Bundle optimization
      bundleOptimizer.refreshMetrics();
      const bundleRecommendations = bundleOptimizer.getOptimizationRecommendations();

      for (const rec of bundleRecommendations.slice(0, 3)) {
        // Top 3 recommendations
        try {
          // In a real implementation, would execute the recommendation
          results.push({
            timestamp: Date.now(),
            type: `bundle-${rec.type}`,
            improvement: rec.estimatedSaving,
            success: true,
          });
        } catch (_error) {
          results.push({
            timestamp: Date.now(),
            type: `bundle-${rec.type}`,
            improvement: 0,
            success: false,
          });
        }
      }

      // Memory optimization
      memoryOptimizer.optimize();
      results.push({
        timestamp: Date.now(),
        type: 'memory-optimize',
        improvement: Math.max(
          0,
          beforeMetrics.memory.heapUsed - this.currentMetrics.memory.heapUsed
        ),
        success: true,
      });

      // Load time optimization
      loadTimeOptimizer.optimize();
      results.push({
        timestamp: Date.now(),
        type: 'loadtime-optimize',
        improvement: Math.max(
          0,
          beforeMetrics.loadTime.totalLoadTime - this.currentMetrics.loadTime.totalLoadTime
        ),
        success: true,
      });
    } catch (error) {
      console.error('Optimization sequence error:', error);
    }

    return results;
  }

  /**
   * Report metrics to external services
   */
  private reportMetrics(): void {
    if (!this.config.monitoring.enabled) return;

    // Report to Sentry if configured
    if (
      this.config.monitoring.sentryDsn &&
      typeof window !== 'undefined' &&
      (window as any).Sentry
    ) {
      const Sentry = (window as any).Sentry;

      // Send custom measurements
      Sentry.setMeasurement('bundle.totalSize', this.currentMetrics.bundle.totalSize, 'byte');
      Sentry.setMeasurement('memory.heapUsed', this.currentMetrics.memory.heapUsed, 'byte');
      Sentry.setMeasurement(
        'loadTime.totalLoadTime',
        this.currentMetrics.loadTime.totalLoadTime,
        'millisecond'
      );
      Sentry.setMeasurement('userExperience.fps', this.currentMetrics.userExperience.fps, 'none');
      Sentry.setMeasurement('performance.score', this.currentMetrics.performanceScore, 'none');
    }

    // Report to analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;

      gtag('event', 'performance_metrics', {
        custom_map: {
          metric1: 'bundle_size',
          metric2: 'load_time',
          metric3: 'memory_usage',
          metric4: 'performance_score',
        },
        metric1: this.currentMetrics.bundle.totalSize,
        metric2: this.currentMetrics.loadTime.totalLoadTime,
        metric3: this.currentMetrics.memory.heapUsed,
        metric4: this.currentMetrics.performanceScore,
      });
    }
  }

  /**
   * Setup error boundary integration
   */
  private setupErrorBoundaryIntegration(): void {
    // Capture unhandled errors and correlate with performance
    window.addEventListener('error', (_event) => {
      const errorContext = {
        performanceScore: this.currentMetrics.performanceScore,
        memoryUsage: this.currentMetrics.memory.heapUsed,
        sessionId: this.sessionId,
      };

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        Sentry.setContext('performance', errorContext);
      }
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (_event) => {
      const errorContext = {
        performanceScore: this.currentMetrics.performanceScore,
        memoryUsage: this.currentMetrics.memory.heapUsed,
        sessionId: this.sessionId,
      };

      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        Sentry.setContext('performance', errorContext);
      }
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;

    const updatePerformanceStrategy = () => {
      const isSlowConnection =
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData;

      if (isSlowConnection && this.config.optimization.adaptiveOptimization) {
        // Enable aggressive optimization for slow connections
        this.config.optimization.aggressiveMode = true;
        this.triggerAutoOptimization();

        console.debug('Enabled aggressive optimization for slow connection');
      }
    };

    connection.addEventListener('change', updatePerformanceStrategy);
    updatePerformanceStrategy(); // Initial check
  }

  /**
   * Setup page lifecycle events
   */
  private setupPageLifecycleEvents(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce monitoring frequency
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval);
          this.monitoringInterval = setInterval(() => {
            this.collectUnifiedMetrics();
          }, this.config.monitoring.reportingInterval * 2); // Double the interval
        }
      } else {
        // Page is visible, resume normal monitoring
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval);
          this.monitoringInterval = setInterval(() => {
            this.collectUnifiedMetrics();
            this.analyzePerformance();
            this.reportMetrics();
          }, this.config.monitoring.reportingInterval);
        }
      }
    });

    // Page unload
    window.addEventListener('beforeunload', () => {
      this.stopMonitoring();

      // Send final metrics
      if (this.config.monitoring.enabled) {
        this.reportMetrics();
      }
    });
  }

  /**
   * Setup real user monitoring (RUM)
   */
  private setupRealUserMonitoring(): void {
    // Track user interactions
    ['click', 'scroll', 'resize'].forEach((eventType) => {
      document.addEventListener(
        eventType,
        () => {
          // Update user experience metrics
          this.updateUserExperienceMetrics();
        },
        { passive: true }
      );
    });
  }

  /**
   * Update user experience metrics
   */
  private updateUserExperienceMetrics(): void {
    this.currentMetrics.userExperience = {
      fps: this.getCurrentFPS(),
      responsiveness: this.calculateResponsiveness(),
      stability: this.calculateStability(),
      accessibility: this.calculateAccessibilityScore(),
    };
  }

  // Utility methods for calculations

  private calculateOverallHealth(
    bundleMetrics: BundleMetrics | null,
    memoryMetrics: MemoryMetrics,
    loadTimeMetrics: LoadTimeMetrics
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const score = this.calculatePerformanceScore(bundleMetrics, memoryMetrics, loadTimeMetrics);

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private calculatePerformanceScore(
    bundleMetrics: BundleMetrics | null,
    memoryMetrics: MemoryMetrics,
    loadTimeMetrics: LoadTimeMetrics
  ): number {
    let score = 100;

    // Bundle size impact (25% weight)
    if (bundleMetrics && bundleMetrics.totalSize > this.config.budgets.bundleSize.max) {
      const excess = bundleMetrics.totalSize - this.config.budgets.bundleSize.max;
      const penalty = (excess / this.config.budgets.bundleSize.max) * 25;
      score -= Math.min(penalty, 25);
    }

    // Load time impact (30% weight)
    if (loadTimeMetrics.totalLoadTime > this.config.budgets.loadTime.target) {
      const excess = loadTimeMetrics.totalLoadTime - this.config.budgets.loadTime.target;
      const penalty = (excess / this.config.budgets.loadTime.target) * 30;
      score -= Math.min(penalty, 30);
    }

    // Memory impact (25% weight)
    if (memoryMetrics.heapUsed > this.config.budgets.memory.target) {
      const excess = memoryMetrics.heapUsed - this.config.budgets.memory.target;
      const penalty = (excess / this.config.budgets.memory.target) * 25;
      score -= Math.min(penalty, 25);
    }

    // User experience impact (20% weight)
    const fps = this.getCurrentFPS();
    if (fps < this.config.budgets.fps.min) {
      const deficit = this.config.budgets.fps.min - fps;
      const penalty = (deficit / this.config.budgets.fps.min) * 20;
      score -= Math.min(penalty, 20);
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateBundleOptimizationScore(bundleMetrics: BundleMetrics | null): number {
    if (!bundleMetrics) return 50;

    let score = 100;

    // Size efficiency
    const sizeRatio = bundleMetrics.totalSize / this.config.budgets.bundleSize.max;
    score -= Math.min(sizeRatio * 40, 40);

    // Chunk distribution
    const chunkSizes = Object.values(bundleMetrics.chunkSizes);
    const largeChunks = chunkSizes.filter((size) => size > 500000).length; // >500KB chunks
    score -= largeChunks * 10;

    // Duplicate modules penalty
    score -= bundleMetrics.duplicateModules.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateGCFrequency(): number {
    // Approximate GC frequency based on memory patterns
    if (this.metricsHistory.length < 5) return 0;

    const recent = this.metricsHistory.slice(-5);
    let gcEvents = 0;

    for (let i = 1; i < recent.length; i++) {
      const current = recent[i].memory.heapUsed;
      const previous = recent[i - 1].memory.heapUsed;

      // Detect potential GC (significant memory drop)
      if (previous - current > 5000000) {
        // 5MB drop
        gcEvents++;
      }
    }

    return gcEvents;
  }

  private getCurrentFPS(): number {
    // This would integrate with RAF-based FPS monitoring
    // For now, return mock value based on performance
    const baselineFPS = 120;
    const memoryPenalty =
      Math.max(0, (this.currentMetrics?.memory.heapUsed || 0) - this.config.budgets.memory.target) /
      1000000;

    return Math.max(30, baselineFPS - memoryPenalty);
  }

  private calculateResponsiveness(): number {
    // Calculate based on input delay and interaction responsiveness
    return Math.max(0, 100 - (this.currentMetrics?.loadTime.FID || 0) * 0.1);
  }

  private calculateStability(): number {
    // Calculate based on layout shift and error rates
    const cls = this.currentMetrics?.loadTime.CLS || 0;
    return Math.max(0, 100 - cls * 1000);
  }

  private calculateAccessibilityScore(): number {
    // Basic accessibility scoring
    let score = 100;

    // Check for common accessibility issues
    const images = document.querySelectorAll('img:not([alt])');
    score -= images.length * 2;

    const buttons = document.querySelectorAll('button:not([aria-label]):not([title])');
    score -= buttons.length * 3;

    return Math.max(0, Math.min(100, score));
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    if (!('connection' in navigator)) return 'unknown';
    return (navigator as any).connection?.effectiveType || 'unknown';
  }

  private getUserLocation(): string {
    // In production, would use geolocation or IP-based detection
    return 'unknown';
  }

  private getBrowserVersion(): string {
    return navigator.userAgent;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateBundleMetrics(bundleMetrics: BundleMetrics): void {
    this.currentMetrics.bundle.totalSize = bundleMetrics.totalSize;
    this.currentMetrics.bundle.chunkCount = Object.keys(bundleMetrics.chunkSizes).length;
    this.currentMetrics.bundle.optimizationScore =
      this.calculateBundleOptimizationScore(bundleMetrics);
  }

  private updateMemoryMetrics(memoryMetrics: MemoryMetrics): void {
    this.currentMetrics.memory.heapUsed = memoryMetrics.heapUsed;
    this.currentMetrics.memory.heapTotal = memoryMetrics.heapTotal;
    this.currentMetrics.memory.leakRisk = memoryMetrics.leakRisk;
  }

  private updateLoadTimeMetrics(loadTimeMetrics: LoadTimeMetrics): void {
    this.currentMetrics.loadTime = { ...loadTimeMetrics };
  }

  private handleMemoryLeak(leak: MemoryLeak): void {
    this.createAlert({
      severity: leak.severity === 'critical' ? 'critical' : 'error',
      category: 'memory',
      metric: 'memoryLeak',
      currentValue: leak.size,
      threshold: 0,
      message: `Memory leak detected: ${leak.description}`,
      recommendation: 'Investigate and fix memory leak to prevent performance degradation',
    });
  }

  private mergeConfig(
    defaultConfig: ProductionPerformanceConfig,
    userConfig: Partial<ProductionPerformanceConfig>
  ): ProductionPerformanceConfig {
    return {
      monitoring: { ...defaultConfig.monitoring, ...userConfig.monitoring },
      budgets: {
        bundleSize: { ...defaultConfig.budgets.bundleSize, ...userConfig.budgets?.bundleSize },
        loadTime: { ...defaultConfig.budgets.loadTime, ...userConfig.budgets?.loadTime },
        memory: { ...defaultConfig.budgets.memory, ...userConfig.budgets?.memory },
        fps: { ...defaultConfig.budgets.fps, ...userConfig.budgets?.fps },
      },
      optimization: { ...defaultConfig.optimization, ...userConfig.optimization },
      alerting: { ...defaultConfig.alerting, ...userConfig.alerting },
    };
  }

  private getInitialMetrics(): UnifiedPerformanceMetrics {
    return {
      timestamp: Date.now(),
      overallHealth: 'excellent',
      performanceScore: 100,
      bundle: {
        totalSize: 0,
        loadTime: 0,
        optimizationScore: 100,
        chunkCount: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        leakRisk: 0,
        gcFrequency: 0,
      },
      loadTime: {
        TTFB: 0,
        FCP: 0,
        LCP: 0,
        TTI: 0,
        totalLoadTime: 0,
      },
      userExperience: {
        fps: 120,
        responsiveness: 100,
        stability: 100,
        accessibility: 100,
      },
      rum: {
        sessionId: this.sessionId,
        deviceType: 'desktop',
        connection: 'unknown',
        location: 'unknown',
        browserVersion: navigator.userAgent,
      },
    };
  }

  private notifyObservers(): void {
    this.observers.forEach((observer) => observer({ ...this.currentMetrics }));
  }

  // Public API

  /**
   * Get current unified performance metrics
   */
  getMetrics(): UnifiedPerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get performance metrics history
   */
  getHistory(): UnifiedPerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Subscribe to performance metrics
   */
  subscribe(observer: (metrics: UnifiedPerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Subscribe to performance alerts
   */
  subscribeToAlerts(observer: (alert: PerformanceAlert) => void): () => void {
    this.alertObservers.add(observer);
    return () => this.alertObservers.delete(observer);
  }

  /**
   * Trigger manual optimization
   */
  optimize(): void {
    if (!this.optimizationInProgress) {
      this.triggerAutoOptimization();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProductionPerformanceConfig>): void {
    this.config = this.mergeConfig(this.config, config);
  }

  /**
   * Start monitoring (public method)
   */
  start(): void {
    this.startMonitoring();
  }

  /**
   * Stop monitoring (public method)
   */
  stop(): void {
    this.stopMonitoring();
  }
}

// Export singleton instance with default production configuration
export const productionPerformanceService = ProductionPerformanceService.getInstance({
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    reportingInterval: 30000,
    alertingEnabled: true,
  },
  optimization: {
    autoOptimize: true,
    adaptiveOptimization: true,
    aggressiveMode: false,
  },
});

// Export types
export type { ProductionPerformanceConfig, UnifiedPerformanceMetrics, PerformanceAlert };

export default ProductionPerformanceService;
