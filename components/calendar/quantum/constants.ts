/**
 * Quantum Calendar Constants
 *
 * Central configuration and constant definitions for the quantum calendar system.
 */

import type {
  QuantumAnalyticsConfig,
  QuantumConfig,
  QuantumFeatureFlags,
  QuantumPerformanceConfig,
} from '@/types/quantum-calendar';

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default quantum feature flags - Conservative defaults for stability
 */
export const DEFAULT_QUANTUM_FEATURE_FLAGS: QuantumFeatureFlags = {
  // CSS Modern Features (enabled with fallbacks)
  enableSubgrid: true,
  enableContainerQueries: true,
  enableFluidTypography: true,

  // Micro-Interactions & Physics (conservative defaults)
  enablePhysicsAnimations: false, // Enable via A/B testing
  enableParallaxEffects: false,
  enableElasticScrolling: false,
  enableQuantumTransitions: true,

  // Performance & Optimization (enabled by default)
  enableQuantumVirtualization: true,
  enableIntersectionObserver: true,
  enableWebWorkerCalculations: false, // Enable for large datasets
  enableGPUAcceleration: true,

  // Advanced UI Features (experimental)
  enableMagneticSnapping: false,
  enableGestureRecognition: false,
  enableVoiceInteraction: false,
  enableHapticFeedback: false,

  // Analytics & Monitoring (enabled for insights)
  enablePerformanceTracking: true,
  enableUserBehaviorAnalytics: true,
  enableA11yMetrics: true,
  enableErrorBoundaryReporting: true,
};

/**
 * Default quantum configuration with all modules
 */
export const DEFAULT_QUANTUM_CONFIG: QuantumConfig = {
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

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: QuantumPerformanceConfig = {
  enabled: true,
  sampleRate: 1.0, // 100% sampling in development
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  enableRealUserMonitoring: true,
  enableSyntheticMonitoring: false,

  budgets: {
    renderTime: 16, // 60fps target
    memoryUsage: 100, // 100MB
    bundleSize: 500, // 500KB
    cumulativeLayoutShift: 0.1,
  },

  alerts: {
    enabled: true,
    thresholds: {
      performanceDegradation: 20, // 20% degradation
      errorRate: 5, // 5 errors per minute
      memoryLeakDetection: 10, // 10MB increase per minute
    },
  },
};

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: QuantumAnalyticsConfig = {
  enabled: true,
  anonymizeData: true,

  events: {
    pageViews: true,
    userInteractions: true,
    featureUsage: true,
    performanceMetrics: true,
    errorTracking: true,
  },

  privacyMode: 'balanced',
  consentManagement: false, // Enable in production
  dataRetentionDays: 90,

  providers: {
    // Configure endpoints as needed
  },
};

// =============================================================================
// FEATURE CATEGORIES
// =============================================================================

/**
 * Feature flag categories for organization
 */
export const QUANTUM_FEATURE_CATEGORIES = [
  {
    name: 'CSS Modern Features',
    description: 'Modern CSS capabilities with progressive enhancement',
    icon: 'Zap',
    color: 'bg-blue-500',
    flags: ['enableSubgrid', 'enableContainerQueries', 'enableFluidTypography'] as const,
  },
  {
    name: 'Micro-Interactions',
    description: 'Physics-based animations and micro-interactions',
    icon: 'Target',
    color: 'bg-purple-500',
    flags: [
      'enablePhysicsAnimations',
      'enableParallaxEffects',
      'enableElasticScrolling',
      'enableQuantumTransitions',
    ] as const,
  },
  {
    name: 'Performance',
    description: 'Optimization and performance enhancements',
    icon: 'Gauge',
    color: 'bg-green-500',
    flags: [
      'enableQuantumVirtualization',
      'enableIntersectionObserver',
      'enableWebWorkerCalculations',
      'enableGPUAcceleration',
    ] as const,
  },
  {
    name: 'Advanced UI',
    description: 'Experimental and advanced user interface features',
    icon: 'Beaker',
    color: 'bg-orange-500',
    flags: [
      'enableMagneticSnapping',
      'enableGestureRecognition',
      'enableVoiceInteraction',
      'enableHapticFeedback',
    ] as const,
  },
  {
    name: 'Analytics',
    description: 'Monitoring and user behavior analytics',
    icon: 'BarChart3',
    color: 'bg-indigo-500',
    flags: [
      'enablePerformanceTracking',
      'enableUserBehaviorAnalytics',
      'enableA11yMetrics',
      'enableErrorBoundaryReporting',
    ] as const,
  },
] as const;

// =============================================================================
// PERFORMANCE BUDGETS
// =============================================================================

/**
 * Performance budget definitions
 */
export const QUANTUM_PERFORMANCE_BUDGETS = [
  {
    name: 'Render Time',
    key: 'renderTime',
    budget: 16,
    unit: 'ms',
    description: 'Time to render calendar grid (60fps target)',
    category: 'rendering',
  },
  {
    name: 'Memory Usage',
    key: 'memoryUsage',
    budget: 100,
    unit: 'MB',
    description: 'JavaScript heap memory consumption',
    category: 'memory',
  },
  {
    name: 'First Input Delay',
    key: 'firstInputDelay',
    budget: 100,
    unit: 'ms',
    description: 'Time to first user interaction response',
    category: 'interactivity',
  },
  {
    name: 'Cumulative Layout Shift',
    key: 'cumulativeLayoutShift',
    budget: 0.1,
    unit: '',
    description: 'Visual stability score (lower is better)',
    category: 'stability',
  },
  {
    name: 'Scroll Smoothness',
    key: 'scrollSmoothness',
    budget: 95,
    unit: '%',
    description: 'Scroll performance score (60fps target)',
    category: 'scrolling',
  },
  {
    name: 'Largest Contentful Paint',
    key: 'largestContentfulPaint',
    budget: 2500,
    unit: 'ms',
    description: 'Time to render largest content element',
    category: 'loading',
  },
  {
    name: 'Subgrid Render Time',
    key: 'subgridRenderTime',
    budget: 8,
    unit: 'ms',
    description: 'Time to render subgrid layout',
    category: 'quantum',
  },
  {
    name: 'Container Query Evaluation',
    key: 'containerQueryEvaluationTime',
    budget: 5,
    unit: 'ms',
    description: 'Time to evaluate container queries',
    category: 'quantum',
  },
  {
    name: 'Physics Calculation Time',
    key: 'physicsCalculationTime',
    budget: 10,
    unit: 'ms',
    description: 'Time for physics-based animation calculations',
    category: 'quantum',
  },
] as const;

// =============================================================================
// CSS CUSTOM PROPERTIES
// =============================================================================

/**
 * CSS custom property definitions for quantum features
 */
export const QUANTUM_CSS_CUSTOM_PROPERTIES = {
  // Layout Variables
  '--quantum-calendar-gap': 'clamp(0.125rem, 0.5vw, 0.25rem)',
  '--quantum-calendar-border-radius': 'clamp(0.25rem, 1vw, 0.5rem)',
  '--quantum-calendar-header-height': 'clamp(2rem, 5vh, 3rem)',

  // Grid System Variables
  '--quantum-grid-columns': '42', // 6 weeks × 7 days
  '--quantum-grid-rows': '12', // 12 months
  '--quantum-month-height': 'minmax(3rem, 1fr)',
  '--quantum-day-width': 'minmax(1.5rem, 1fr)',

  // Fluid Typography Scale
  '--quantum-font-size-xs': 'clamp(0.625rem, 1.5vw, 0.75rem)',
  '--quantum-font-size-sm': 'clamp(0.75rem, 2vw, 0.875rem)',
  '--quantum-font-size-base': 'clamp(0.875rem, 2.5vw, 1rem)',
  '--quantum-font-size-lg': 'clamp(1rem, 3vw, 1.125rem)',
  '--quantum-font-size-xl': 'clamp(1.125rem, 3.5vw, 1.25rem)',
  '--quantum-font-size-2xl': 'clamp(1.25rem, 4vw, 1.5rem)',

  // Physics-Based Animation Variables
  '--quantum-spring-tension': '120',
  '--quantum-spring-friction': '14',
  '--quantum-spring-mass': '1',
  '--quantum-easing-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '--quantum-easing-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--quantum-easing-snappy': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // Micro-Interaction Durations
  '--quantum-duration-instant': '100ms',
  '--quantum-duration-quick': '200ms',
  '--quantum-duration-smooth': '300ms',
  '--quantum-duration-leisurely': '500ms',

  // Focus & Accessibility Variables
  '--quantum-focus-outline-width': '3px',
  '--quantum-focus-outline-offset': '2px',
  '--quantum-focus-outline-color': 'hsl(210 100% 50%)',
  '--quantum-tap-target-min': '44px',

  // Performance & GPU Variables
  '--quantum-transform-gpu': 'translate3d(0, 0, 0)',
  '--quantum-will-change': 'transform, opacity',
  '--quantum-backface-visibility': 'hidden',
} as const;

// =============================================================================
// FOUNDATION CONSTANTS
// =============================================================================

/**
 * Foundation layout constants - IMMUTABLE per LINEAR_CALENDAR_FOUNDATION_SPEC.md
 */
export const FOUNDATION_CONSTANTS = {
  MONTHS_PER_YEAR: 12,
  DAYS_PER_MONTH_GRID: 42, // 6 weeks × 7 days
  DAYS_PER_WEEK: 7,
  WEEKS_PER_MONTH: 6,
  MINIMUM_YEAR: 1900,
  MAXIMUM_YEAR: 2100,
} as const;

// =============================================================================
// BROWSER COMPATIBILITY
// =============================================================================

/**
 * Browser compatibility matrix for quantum features
 */
export const BROWSER_COMPATIBILITY = {
  subgrid: {
    chrome: '117+',
    firefox: '71+',
    safari: '16+',
    edge: '117+',
    fallback: 'css-grid',
  },
  containerQueries: {
    chrome: '105+',
    firefox: '110+',
    safari: '16+',
    edge: '105+',
    fallback: 'media-queries',
  },
  cssGrid: {
    chrome: '57+',
    firefox: '52+',
    safari: '10.1+',
    edge: '16+',
    fallback: 'flexbox',
  },
  customProperties: {
    chrome: '49+',
    firefox: '31+',
    safari: '9.1+',
    edge: '16+',
    fallback: 'static-values',
  },
  intersectionObserver: {
    chrome: '51+',
    firefox: '55+',
    safari: '12.1+',
    edge: '15+',
    fallback: 'scroll-event',
  },
} as const;

// =============================================================================
// A/B TESTING CONSTANTS
// =============================================================================

/**
 * Default A/B test configurations
 */
export const DEFAULT_AB_TEST_VARIANTS = [
  {
    id: 'control',
    name: 'Control (Traditional)',
    description: 'Standard CSS Grid layout without modern features',
    featureFlags: {
      enableSubgrid: false,
      enableContainerQueries: false,
      enableFluidTypography: false,
      enablePhysicsAnimations: false,
    },
    weight: 0.5,
    startDate: new Date(),
    targetMetrics: ['renderTime', 'memoryUsage', 'taskCompletionRate'],
  },
  {
    id: 'quantum',
    name: 'Quantum Enhanced',
    description: 'Modern CSS with subgrid and container queries',
    featureFlags: {
      enableSubgrid: true,
      enableContainerQueries: true,
      enableFluidTypography: true,
      enablePhysicsAnimations: true,
    },
    weight: 0.5,
    startDate: new Date(),
    targetMetrics: ['renderTime', 'memoryUsage', 'taskCompletionRate', 'engagementScore'],
  },
] as const;

// =============================================================================
// ANALYTICS EVENTS
// =============================================================================

/**
 * Standard analytics event types
 */
export const ANALYTICS_EVENT_TYPES = {
  FEATURE_USAGE: 'feature_usage',
  PERFORMANCE: 'performance',
  ENGAGEMENT: 'engagement',
  ERROR: 'error',
  ACCESSIBILITY: 'a11y',
  USER_INTERACTION: 'user_interaction',
  QUANTUM_METRIC: 'quantum_metric',
} as const;

/**
 * Performance metric categories
 */
export const PERFORMANCE_CATEGORIES = {
  RENDERING: 'rendering',
  MEMORY: 'memory',
  INTERACTIVITY: 'interactivity',
  STABILITY: 'stability',
  LOADING: 'loading',
  SCROLLING: 'scrolling',
  QUANTUM: 'quantum',
} as const;

// =============================================================================
// DEVELOPMENT CONSTANTS
// =============================================================================

/**
 * Development and debugging constants
 */
export const DEV_CONSTANTS = {
  PERFORMANCE_OVERLAY_UPDATE_INTERVAL: 1000, // 1 second
  FEATURE_FLAG_PANEL_WIDTH: 384, // 24rem
  ANALYTICS_PANEL_WIDTH: 384, // 24rem
  DEBUG_COLORS: {
    SUBGRID: 'rgba(59, 130, 246, 0.3)', // blue
    CONTAINER_QUERY: 'rgba(16, 185, 129, 0.3)', // emerald
    DAY_CELL: 'rgba(245, 158, 11, 0.3)', // amber
    MONTH_ROW: 'rgba(139, 92, 246, 0.3)', // violet
  },
  MOCK_DELAY_MS: 100, // For simulating async operations
} as const;
