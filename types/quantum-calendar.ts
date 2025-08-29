/**
 * QuantumCalendarCore TypeScript Types
 * 
 * Comprehensive type definitions for the quantum calendar system with modular
 * enhancements, A/B testing integration, and performance monitoring.
 */

import type { Event } from '@/types/calendar';

// =============================================================================
// QUANTUM FEATURE FLAGS & A/B TESTING
// =============================================================================

/**
 * Quantum feature flag configuration for A/B testing and gradual rollout
 */
export interface QuantumFeatureFlags {
  // CSS Modern Features
  enableSubgrid: boolean;
  enableContainerQueries: boolean;
  enableFluidTypography: boolean;
  
  // Micro-Interactions & Physics
  enablePhysicsAnimations: boolean;
  enableParallaxEffects: boolean;
  enableElasticScrolling: boolean;
  enableQuantumTransitions: boolean;
  
  // Performance & Optimization
  enableQuantumVirtualization: boolean;
  enableIntersectionObserver: boolean;
  enableWebWorkerCalculations: boolean;
  enableGPUAcceleration: boolean;
  
  // Advanced UI Features
  enableMagneticSnapping: boolean;
  enableGestureRecognition: boolean;
  enableVoiceInteraction: boolean;
  enableHapticFeedback: boolean;
  
  // Analytics & Monitoring
  enablePerformanceTracking: boolean;
  enableUserBehaviorAnalytics: boolean;
  enableA11yMetrics: boolean;
  enableErrorBoundaryReporting: boolean;
}

/**
 * A/B test variant configuration
 */
export interface QuantumVariant {
  id: string;
  name: string;
  description: string;
  featureFlags: Partial<QuantumFeatureFlags>;
  weight: number; // 0-1, percentage of users who see this variant
  startDate: Date;
  endDate?: Date;
  targetMetrics: string[];
}

/**
 * A/B testing configuration
 */
export interface QuantumABTestConfig {
  testId: string;
  testName: string;
  hypothesis: string;
  variants: QuantumVariant[];
  defaultVariant: string;
  sampleSize: number;
  confidenceLevel: number; // 0.9, 0.95, 0.99
  minDetectableEffect: number; // Minimum % change to detect
}

// =============================================================================
// PERFORMANCE MONITORING & ANALYTICS
// =============================================================================

/**
 * Quantum performance metrics for continuous optimization
 */
export interface QuantumPerformanceMetrics {
  // Core Performance
  renderTime: number; // ms
  firstContentfulPaint: number; // ms
  largestContentfulPaint: number; // ms
  cumulativeLayoutShift: number;
  firstInputDelay: number; // ms
  
  // Quantum-Specific Metrics
  subgridRenderTime: number; // ms
  containerQueryEvaluationTime: number; // ms
  quantumTransitionDuration: number; // ms
  physicsCalculationTime: number; // ms
  
  // Memory & Resource Usage
  memoryUsage: number; // MB
  gpuMemoryUsage?: number; // MB
  webWorkerUtilization?: number; // %
  
  // User Experience Metrics
  scrollSmoothness: number; // 0-100 score
  interactionResponsiveness: number; // ms average
  gestureRecognitionAccuracy?: number; // 0-1
  voiceCommandSuccess?: number; // 0-1
  
  // Accessibility Metrics
  keyboardNavigationTime: number; // ms
  screenReaderAnnouncements: number;
  contrastRatioCompliance: number; // 0-1
  focusIndicatorVisibility: number; // 0-1
}

/**
 * User engagement analytics for quantum features
 */
export interface QuantumEngagementMetrics {
  // Feature Usage
  featureUtilization: Record<keyof QuantumFeatureFlags, number>; // 0-1
  userRetentionRate: number; // 0-1
  sessionDuration: number; // minutes
  taskCompletionRate: number; // 0-1
  
  // Interaction Patterns
  primaryInteractionMethod: 'mouse' | 'keyboard' | 'touch' | 'voice' | 'gesture';
  averageEventsCreatedPerSession: number;
  calendarNavigationPattern: 'linear' | 'jump' | 'search' | 'zoom';
  
  // User Satisfaction Indicators
  errorRecoveryRate: number; // 0-1
  featureFeedbackScore: number; // 1-5
  performanceSatisfactionScore: number; // 1-5
  accessibilitySatisfactionScore: number; // 1-5
}

// =============================================================================
// CSS MODERN FEATURES CONFIGURATION
// =============================================================================

/**
 * CSS Subgrid configuration for perfect calendar alignment
 */
export interface SubgridConfig {
  enabled: boolean;
  fallbackStrategy: 'css-grid' | 'flexbox' | 'table';
  monthRowHeight: 'auto' | 'minmax' | 'fixed';
  dayColumnWidth: 'auto' | 'minmax' | 'fixed' | 'fr';
  gapSize: string; // CSS gap value
  alignmentMode: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * Container Query configuration for responsive calendar cells
 */
export interface ContainerQueryConfig {
  enabled: boolean;
  breakpoints: {
    small: string; // e.g., '(max-width: 320px)'
    medium: string; // e.g., '(max-width: 768px)'
    large: string; // e.g., '(max-width: 1024px)'
    xlarge: string; // e.g., '(min-width: 1025px)'
  };
  containerTypes: {
    calendar: 'size' | 'inline-size' | 'block-size';
    month: 'size' | 'inline-size' | 'block-size';
    day: 'size' | 'inline-size' | 'block-size';
  };
  responsiveFeatures: {
    typography: boolean;
    spacing: boolean;
    layout: boolean;
    interactions: boolean;
  };
}

/**
 * Fluid typography configuration using clamp()
 */
export interface FluidTypographyConfig {
  enabled: boolean;
  scaleRatio: number; // 1.125, 1.25, 1.414, etc.
  minViewport: string; // '320px'
  maxViewport: string; // '1200px'
  sizes: {
    caption: { min: string; max: string }; // '0.75rem', '0.875rem'
    body: { min: string; max: string }; // '1rem', '1.125rem'
    heading: { min: string; max: string }; // '1.5rem', '2rem'
    display: { min: string; max: string }; // '2rem', '3rem'
  };
}

// =============================================================================
// MICRO-INTERACTIONS & PHYSICS
// =============================================================================

/**
 * Physics-based animation configuration
 */
export interface PhysicsAnimationConfig {
  enabled: boolean;
  engine: 'framer-motion' | 'react-spring' | 'custom';
  
  // Spring Physics
  springConfig: {
    tension: number; // 120-300
    friction: number; // 14-40
    mass: number; // 0.5-2
    velocity: number; // 0-10
  };
  
  // Damping & Easing
  dampingRatio: number; // 0.1-1.0
  customEasing: string; // cubic-bezier values
  
  // Performance Limits
  maxAnimationDuration: number; // ms
  fpsThreshold: number; // Skip animation if FPS < threshold
}

/**
 * Micro-interaction framework configuration
 */
export interface MicroInteractionConfig {
  enabled: boolean;
  
  // Hover Effects
  hoverTransitionDuration: number; // ms
  hoverScaleMultiplier: number; // 1.05, 1.1, etc.
  hoverColorShiftIntensity: number; // 0-1
  
  // Focus States
  focusIndicatorWidth: number; // px
  focusIndicatorOffset: number; // px
  focusAnimationDuration: number; // ms
  
  // Click/Tap Feedback
  tapScaleMultiplier: number; // 0.95, 0.98, etc.
  tapDuration: number; // ms
  rippleEffect: boolean;
  
  // Loading & State Changes
  skeletonAnimationDuration: number; // ms
  stateTransitionDuration: number; // ms
  loadingIndicatorType: 'spinner' | 'pulse' | 'wave' | 'dots';
}

// =============================================================================
// QUANTUM CALENDAR CORE PROPS & STATE
// =============================================================================

/**
 * Extended props for QuantumCalendarCore component
 */
export interface QuantumCalendarCoreProps {
  // Inherited from LinearCalendarHorizontal
  year: number;
  events: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  enableInfiniteCanvas?: boolean;
  dayContent?: (ctx: any) => React.ReactNode;
  
  // Quantum-Specific Props
  quantumConfig?: QuantumConfig;
  abTestConfig?: QuantumABTestConfig;
  performanceConfig?: QuantumPerformanceConfig;
  analyticsConfig?: QuantumAnalyticsConfig;
  
  // Feature Flag Overrides
  featureFlags?: Partial<QuantumFeatureFlags>;
  variant?: string; // Force specific A/B test variant
  
  // Development & Debugging
  enableDebugMode?: boolean;
  enablePerformanceOverlay?: boolean;
  enableFeatureFlagPanel?: boolean;
  
  // Callbacks
  onPerformanceMetric?: (metrics: QuantumPerformanceMetrics) => void;
  onEngagementMetric?: (metrics: QuantumEngagementMetrics) => void;
  onFeatureFlagChange?: (flag: keyof QuantumFeatureFlags, enabled: boolean) => void;
  onVariantAssignment?: (variant: QuantumVariant) => void;
}

/**
 * Comprehensive quantum configuration
 */
export interface QuantumConfig {
  // CSS Modern Features
  subgrid: SubgridConfig;
  containerQueries: ContainerQueryConfig;
  fluidTypography: FluidTypographyConfig;
  
  // Interactions & Physics
  physicsAnimations: PhysicsAnimationConfig;
  microInteractions: MicroInteractionConfig;
  
  // Performance & Optimization
  virtualScrolling: {
    enabled: boolean;
    bufferSize: number;
    itemHeight: number | 'dynamic';
  };
  
  intersectionObserver: {
    enabled: boolean;
    rootMargin: string;
    threshold: number[];
  };
  
  webWorkers: {
    enabled: boolean;
    maxWorkers: number;
    taskTypes: ('calculations' | 'data-processing' | 'image-processing')[];
  };
}

/**
 * Performance monitoring configuration
 */
export interface QuantumPerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  metricsEndpoint?: string;
  batchSize: number;
  flushInterval: number; // ms
  enableRealUserMonitoring: boolean;
  enableSyntheticMonitoring: boolean;
  
  // Performance Budgets
  budgets: {
    renderTime: number; // ms
    memoryUsage: number; // MB
    bundleSize: number; // KB
    cumulativeLayoutShift: number;
  };
  
  // Alert Thresholds
  alerts: {
    enabled: boolean;
    thresholds: {
      performanceDegradation: number; // % degradation
      errorRate: number; // errors per minute
      memoryLeakDetection: number; // MB increase per minute
    };
  };
}

/**
 * Analytics and user behavior tracking configuration
 */
export interface QuantumAnalyticsConfig {
  enabled: boolean;
  anonymizeData: boolean;
  
  // Tracking Configuration
  events: {
    pageViews: boolean;
    userInteractions: boolean;
    featureUsage: boolean;
    performanceMetrics: boolean;
    errorTracking: boolean;
  };
  
  // Privacy & Compliance
  privacyMode: 'strict' | 'balanced' | 'minimal';
  consentManagement: boolean;
  dataRetentionDays: number;
  
  // Integration
  providers: {
    googleAnalytics?: string;
    amplitude?: string;
    mixpanel?: string;
    customEndpoint?: string;
  };
}

// =============================================================================
// QUANTUM STATE MANAGEMENT
// =============================================================================

/**
 * Quantum calendar state for advanced features
 */
export interface QuantumCalendarState {
  // A/B Testing
  currentVariant: QuantumVariant | null;
  featureFlags: QuantumFeatureFlags;
  
  // Performance Monitoring
  performanceMetrics: QuantumPerformanceMetrics;
  isMonitoring: boolean;
  
  // User Analytics
  engagementMetrics: QuantumEngagementMetrics;
  sessionStartTime: number;
  
  // Feature States
  isSubgridSupported: boolean;
  isContainerQuerySupported: boolean;
  preferredInteractionMethod: 'mouse' | 'keyboard' | 'touch' | 'voice' | 'gesture';
  
  // Error Handling
  lastError: Error | null;
  errorRecoveryCount: number;
  fallbacksActivated: string[];
}

// =============================================================================
// QUANTUM ACTIONS & EVENTS
// =============================================================================

/**
 * Quantum calendar actions for state updates
 */
export type QuantumCalendarAction =
  | { type: 'SET_VARIANT'; payload: QuantumVariant }
  | { type: 'UPDATE_FEATURE_FLAGS'; payload: Partial<QuantumFeatureFlags> }
  | { type: 'RECORD_PERFORMANCE_METRIC'; payload: Partial<QuantumPerformanceMetrics> }
  | { type: 'RECORD_ENGAGEMENT_METRIC'; payload: Partial<QuantumEngagementMetrics> }
  | { type: 'SET_INTERACTION_METHOD'; payload: QuantumCalendarState['preferredInteractionMethod'] }
  | { type: 'HANDLE_ERROR'; payload: Error }
  | { type: 'ACTIVATE_FALLBACK'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'START_MONITORING' }
  | { type: 'STOP_MONITORING' };

/**
 * Quantum event data for analytics
 */
export interface QuantumEventData {
  eventType: 'feature_usage' | 'performance' | 'engagement' | 'error' | 'a11y';
  timestamp: number;
  sessionId: string;
  userId?: string;
  variant?: string;
  data: Record<string, any>;
  context: {
    userAgent: string;
    viewport: { width: number; height: number };
    colorScheme: 'light' | 'dark' | 'auto';
    reducedMotion: boolean;
    connectionType?: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * CSS custom property value type
 */
export type CSSCustomProperty = `--${string}`;

/**
 * CSS container query value type
 */
export type CSSContainerQuery = `@container${string}`;

/**
 * Performance timing mark
 */
export interface PerformanceTimingMark {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Feature flag evaluation result
 */
export interface FeatureFlagEvaluation {
  flag: keyof QuantumFeatureFlags;
  enabled: boolean;
  reason: 'default' | 'variant' | 'override' | 'fallback';
  context: Record<string, any>;
}

/**
 * Browser support detection result
 */
export interface BrowserSupportResult {
  feature: string;
  supported: boolean;
  version?: string;
  fallbackUsed?: string;
}

export default {};