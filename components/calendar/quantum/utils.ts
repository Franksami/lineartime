/**
 * Quantum Calendar Utilities
 *
 * Utility functions for browser support detection, performance measurement,
 * analytics tracking, A/B testing, and configuration management.
 */

import type {
  BrowserSupportResult,
  FeatureFlagEvaluation,
  QuantumConfig,
  QuantumEngagementMetrics,
  QuantumEventData,
  QuantumFeatureFlags,
  QuantumPerformanceMetrics,
  QuantumVariant,
} from '@/types/quantum-calendar';

// =============================================================================
// BROWSER SUPPORT DETECTION
// =============================================================================

/**
 * Detect browser support for modern CSS features
 */
export function detectBrowserSupport(): Record<string, BrowserSupportResult> {
  if (typeof window === 'undefined') {
    return {}; // Server-side rendering
  }

  const results: Record<string, BrowserSupportResult> = {};

  // CSS Subgrid support detection
  try {
    const testElement = document.createElement('div');
    testElement.style.gridTemplateColumns = 'subgrid';
    results.subgrid = {
      feature: 'subgrid',
      supported: testElement.style.gridTemplateColumns === 'subgrid',
      fallbackUsed: testElement.style.gridTemplateColumns !== 'subgrid' ? 'css-grid' : undefined,
    };
  } catch (error) {
    results.subgrid = { feature: 'subgrid', supported: false, fallbackUsed: 'css-grid' };
  }

  // Container Queries support detection
  try {
    results.containerQueries = {
      feature: 'container-queries',
      supported: CSS.supports('container-type', 'inline-size'),
      fallbackUsed: !CSS.supports('container-type', 'inline-size') ? 'media-queries' : undefined,
    };
  } catch (error) {
    results.containerQueries = {
      feature: 'container-queries',
      supported: false,
      fallbackUsed: 'media-queries',
    };
  }

  // CSS Grid support (baseline requirement)
  results.cssGrid = {
    feature: 'css-grid',
    supported: CSS.supports('display', 'grid'),
    fallbackUsed: !CSS.supports('display', 'grid') ? 'flexbox' : undefined,
  };

  // CSS Custom Properties support
  results.customProperties = {
    feature: 'css-custom-properties',
    supported: CSS.supports('color', 'var(--test)'),
    fallbackUsed: !CSS.supports('color', 'var(--test)') ? 'static-values' : undefined,
  };

  // Intersection Observer support
  results.intersectionObserver = {
    feature: 'intersection-observer',
    supported: 'IntersectionObserver' in window,
  };

  // Web Workers support
  results.webWorkers = {
    feature: 'web-workers',
    supported: typeof Worker !== 'undefined',
  };

  // Performance Observer support
  results.performanceObserver = {
    feature: 'performance-observer',
    supported: 'PerformanceObserver' in window,
  };

  // Vibration API support
  results.vibrationAPI = {
    feature: 'vibration-api',
    supported: 'vibrate' in navigator,
  };

  return results;
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Calculate overall performance score from metrics
 */
export function calculatePerformanceScore(metrics: QuantumPerformanceMetrics): number {
  const weights = {
    renderTime: 0.25,
    firstInputDelay: 0.2,
    largestContentfulPaint: 0.2,
    cumulativeLayoutShift: 0.15,
    scrollSmoothness: 0.15,
    memoryUsage: 0.05,
  };

  // Normalize metrics to 0-100 scale (higher is better)
  const normalizedMetrics = {
    renderTime: Math.max(0, 100 - (metrics.renderTime / 16) * 100),
    firstInputDelay: Math.max(0, 100 - (metrics.firstInputDelay / 100) * 100),
    largestContentfulPaint: Math.max(0, 100 - (metrics.largestContentfulPaint / 2500) * 100),
    cumulativeLayoutShift: Math.max(0, 100 - (metrics.cumulativeLayoutShift / 0.1) * 100),
    scrollSmoothness: metrics.scrollSmoothness,
    memoryUsage: Math.max(0, 100 - (metrics.memoryUsage / 100) * 100),
  };

  const score = Object.entries(weights).reduce((acc, [key, weight]) => {
    return acc + normalizedMetrics[key as keyof typeof normalizedMetrics] * weight;
  }, 0);

  return Math.max(0, Math.min(100, score));
}

/**
 * Measure the performance impact of a specific quantum feature
 */
export function measureQuantumFeatureImpact<T>(
  featureName: string,
  operation: () => T,
  onMeasurement?: (duration: number, featureName: string) => void
): T {
  const startTime = performance.now();

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    onMeasurement?.(duration, featureName);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    onMeasurement?.(duration, `${featureName}-error`);
    throw error;
  }
}

/**
 * Create performance timing mark
 */
export function createPerformanceMark(name: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  performance.mark(`quantum-${name}-start`);

  return {
    end: () => {
      performance.mark(`quantum-${name}-end`);
      performance.measure(`quantum-${name}`, `quantum-${name}-start`, `quantum-${name}-end`);

      const entries = performance.getEntriesByName(`quantum-${name}`, 'measure');
      const lastEntry = entries[entries.length - 1];

      return {
        name,
        startTime: lastEntry?.startTime || 0,
        endTime: (lastEntry?.startTime || 0) + (lastEntry?.duration || 0),
        duration: lastEntry?.duration || 0,
        metadata,
      };
    },
  };
}

// =============================================================================
// ANALYTICS UTILITIES
// =============================================================================

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `quantum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track quantum event for analytics
 */
export function trackQuantumEvent(
  eventType: QuantumEventData['eventType'],
  data: Record<string, any>,
  sessionId: string,
  userId?: string
): QuantumEventData {
  const event: QuantumEventData = {
    eventType,
    timestamp: Date.now(),
    sessionId,
    userId,
    data,
    context: {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      connectionType: (navigator as any)?.connection?.effectiveType,
    },
  };

  // Send to analytics endpoint if configured
  if (typeof window !== 'undefined' && (window as any).quantumAnalytics) {
    (window as any).quantumAnalytics.track(event);
  }

  return event;
}

/**
 * Calculate feature utilization score
 */
export function calculateFeatureUtilization(
  featureFlags: QuantumFeatureFlags,
  engagementMetrics: QuantumEngagementMetrics
): number {
  const enabledFlags = Object.values(featureFlags).filter(Boolean).length;
  const totalFlags = Object.keys(featureFlags).length;
  const utilizationSum = Object.values(engagementMetrics.featureUtilization).reduce(
    (sum, utilization) => sum + utilization,
    0
  );

  const baseScore = (enabledFlags / totalFlags) * 100;
  const utilizationScore = (utilizationSum / totalFlags) * 100;

  return (baseScore + utilizationScore) / 2;
}

/**
 * Calculate user engagement score
 */
export function calculateEngagementScore(metrics: QuantumEngagementMetrics): number {
  return (
    (metrics.taskCompletionRate * 0.3 +
      Math.min(metrics.sessionDuration / 60, 1) * 0.2 + // Cap at 1 hour
      (metrics.userRetentionRate || 0) * 0.3 +
      (metrics.featureFeedbackScore / 5) * 0.2) *
    100
  );
}

// =============================================================================
// A/B TESTING UTILITIES
// =============================================================================

/**
 * Assign user to A/B test variant
 */
export function assignUserToVariant(
  userId: string,
  variants: QuantumVariant[]
): QuantumVariant | null {
  if (!variants.length) return null;

  // Create deterministic hash from user ID
  const hash = hashString(userId);
  const normalizedHash = hash / 2147483647; // Normalize to 0-1

  // Assign based on cumulative weights
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (normalizedHash <= cumulativeWeight) {
      return variant;
    }
  }

  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Evaluate feature flag with variant override
 */
export function evaluateFeatureFlag(
  flag: keyof QuantumFeatureFlags,
  currentFlags: QuantumFeatureFlags,
  activeVariant?: QuantumVariant | null,
  overrides?: Partial<QuantumFeatureFlags>
): FeatureFlagEvaluation {
  let enabled = currentFlags[flag];
  let reason: FeatureFlagEvaluation['reason'] = 'default';

  // Apply variant flags
  if (activeVariant && activeVariant.featureFlags[flag] !== undefined) {
    enabled = activeVariant.featureFlags[flag] as boolean;
    reason = 'variant';
  }

  // Apply overrides (highest priority)
  if (overrides && overrides[flag] !== undefined) {
    enabled = overrides[flag] as boolean;
    reason = 'override';
  }

  return {
    flag,
    enabled,
    reason,
    context: {
      variant: activeVariant?.name,
      variantWeight: activeVariant?.weight,
      override: overrides?.[flag],
    },
  };
}

// =============================================================================
// CONFIGURATION UTILITIES
// =============================================================================

/**
 * Create default quantum configuration
 */
export function createQuantumConfig(overrides?: Partial<QuantumConfig>): QuantumConfig {
  const defaultConfig: QuantumConfig = {
    subgrid: {
      enabled: true,
      fallbackStrategy: 'css-grid',
      monthRowHeight: 'minmax',
      dayColumnWidth: 'minmax',
      gapSize: '1px',
      alignmentMode: 'stretch',
    },
    containerQueries: {
      enabled: true,
      breakpoints: {
        small: '(max-width: 320px)',
        medium: '(max-width: 768px)',
        large: '(max-width: 1024px)',
        xlarge: '(min-width: 1025px)',
      },
      containerTypes: {
        calendar: 'inline-size',
        month: 'inline-size',
        day: 'size',
      },
      responsiveFeatures: {
        typography: true,
        spacing: true,
        layout: true,
        interactions: true,
      },
    },
    fluidTypography: {
      enabled: true,
      scaleRatio: 1.25,
      minViewport: '320px',
      maxViewport: '1200px',
      sizes: {
        caption: { min: '0.75rem', max: '0.875rem' },
        body: { min: '1rem', max: '1.125rem' },
        heading: { min: '1.5rem', max: '2rem' },
        display: { min: '2rem', max: '3rem' },
      },
    },
    physicsAnimations: {
      enabled: false,
      engine: 'framer-motion',
      springConfig: {
        tension: 120,
        friction: 14,
        mass: 1,
        velocity: 0,
      },
      dampingRatio: 0.8,
      customEasing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      maxAnimationDuration: 1000,
      fpsThreshold: 30,
    },
    microInteractions: {
      enabled: true,
      hoverTransitionDuration: 200,
      hoverScaleMultiplier: 1.05,
      hoverColorShiftIntensity: 0.1,
      focusIndicatorWidth: 3,
      focusIndicatorOffset: 2,
      focusAnimationDuration: 200,
      tapScaleMultiplier: 0.95,
      tapDuration: 150,
      rippleEffect: false,
      skeletonAnimationDuration: 1500,
      stateTransitionDuration: 300,
      loadingIndicatorType: 'spinner',
    },
    virtualScrolling: {
      enabled: true,
      bufferSize: 10,
      itemHeight: 'dynamic',
    },
    intersectionObserver: {
      enabled: true,
      rootMargin: '50px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
    webWorkers: {
      enabled: false,
      maxWorkers: 2,
      taskTypes: ['calculations'],
    },
  };

  return mergeQuantumConfigs(defaultConfig, overrides || {});
}

/**
 * Validate quantum configuration
 */
export function validateQuantumConfig(config: QuantumConfig): string[] {
  const errors: string[] = [];

  // Validate subgrid config
  if (config.subgrid.enabled) {
    const validFallbacks = ['css-grid', 'flexbox', 'table'];
    if (!validFallbacks.includes(config.subgrid.fallbackStrategy)) {
      errors.push(`Invalid subgrid fallback strategy: ${config.subgrid.fallbackStrategy}`);
    }
  }

  // Validate container queries config
  if (config.containerQueries.enabled) {
    const containerTypes = Object.values(config.containerQueries.containerTypes);
    const validTypes = ['size', 'inline-size', 'block-size'];
    containerTypes.forEach((type, index) => {
      if (!validTypes.includes(type)) {
        errors.push(`Invalid container type: ${type}`);
      }
    });
  }

  // Validate physics animations config
  if (config.physicsAnimations.enabled) {
    const { springConfig } = config.physicsAnimations;
    if (springConfig.tension <= 0) {
      errors.push('Spring tension must be positive');
    }
    if (springConfig.friction <= 0) {
      errors.push('Spring friction must be positive');
    }
    if (springConfig.mass <= 0) {
      errors.push('Spring mass must be positive');
    }
  }

  // Validate web workers config
  if (config.webWorkers.enabled) {
    if (config.webWorkers.maxWorkers <= 0) {
      errors.push('Max workers must be positive');
    }
    if (config.webWorkers.maxWorkers > navigator.hardwareConcurrency) {
      errors.push(
        `Max workers (${config.webWorkers.maxWorkers}) exceeds hardware concurrency (${navigator.hardwareConcurrency})`
      );
    }
  }

  return errors;
}

/**
 * Merge quantum configurations with deep merge
 */
export function mergeQuantumConfigs(
  base: QuantumConfig,
  override: Partial<QuantumConfig>
): QuantumConfig {
  const result = { ...base };

  Object.keys(override).forEach((key) => {
    const overrideValue = override[key as keyof QuantumConfig];
    if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      result[key as keyof QuantumConfig] = {
        ...result[key as keyof QuantumConfig],
        ...overrideValue,
      } as any;
    } else {
      result[key as keyof QuantumConfig] = overrideValue as any;
    }
  });

  return result;
}

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate?: boolean
): T {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(this: any, ...args: any[]) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  } as T;
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

  const cloned = {} as T;
  Object.keys(obj).forEach((key) => {
    cloned[key as keyof T] = deepClone(obj[key as keyof T]);
  });

  return cloned;
}
