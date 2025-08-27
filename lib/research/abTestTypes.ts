/**
 * TypeScript interfaces and types for Production A/B Testing Framework
 * Comprehensive type definitions for LinearTime horizontal timeline validation
 */

import type { Id } from '@/convex/_generated/dataModel';

// Core A/B Testing Types
export type TestVariant =
  | 'horizontal_timeline'
  | 'traditional_month'
  | 'hybrid_view'
  | 'control'
  | 'timeline_first_onboarding'
  | 'traditional_onboarding'
  | 'timeline_hero'
  | 'standard_features'
  | 'optimized_mobile_timeline'
  | 'standard_mobile_view';

export type TestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export type UserSegment = 'early_adopter' | 'power_user' | 'traditional' | 'casual';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type EventType = 'exposure' | 'conversion' | 'engagement' | 'custom' | 'error';

// A/B Test Configuration Interface
export interface ABTestConfig {
  testId: string;
  name: string;
  hypothesis: string;
  description?: string;

  // Test variants configuration
  variants: ABTestVariant[];

  // Targeting criteria
  criteria: TestCriteria;

  // Metrics and measurement
  primaryMetric: string;
  secondaryMetrics: string[];

  // Test lifecycle
  status: TestStatus;
  startDate: number;
  endDate?: number;

  // Statistical parameters
  targetSampleSize: number;
  currentSampleSize: number;
  minDetectableEffect: number; // Minimum effect size to detect (e.g., 0.05 for 5%)
  statisticalPower: number; // Statistical power (e.g., 0.8 for 80%)

  // Results
  results?: TestResults;

  // Metadata
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

// Test variant configuration
export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Traffic allocation percentage (0-100)
  config: VariantConfig;
}

// Variant-specific configuration (flexible structure)
export interface VariantConfig {
  // Timeline-specific configs
  layout?: 'horizontal' | 'vertical' | 'monthly';
  monthsVisible?: number;
  enableInfiniteCanvas?: boolean;
  showYearOverview?: boolean;
  enableZoomControls?: boolean;
  timelineOrientation?: 'horizontal' | 'vertical';

  // Onboarding configs
  onboardingFlow?: 'timeline_first' | 'traditional';
  showTimelineDemo?: boolean;
  highlightYearView?: boolean;
  demoDataPreset?: 'full_year' | 'current_month';
  skipTraditionalCalendar?: boolean;

  // Pricing page configs
  heroType?: 'timeline_demo' | 'feature_list';
  showInteractiveDemo?: boolean;
  emphasizeYearView?: boolean;
  valuePropsOrder?: string[];
  demoAnimation?: 'auto_scroll' | 'none';

  // Mobile optimization configs
  mobileOptimizations?: boolean;
  touchGesturesEnabled?: boolean;
  pinchZoomEnabled?: boolean;
  responsiveMonthLayout?: boolean;
  simplifiedNavigation?: boolean;
  swipeToNavigate?: boolean;

  // Generic configuration
  [key: string]: any;
}

// Targeting criteria for test assignment
export interface TestCriteria {
  userSegment?: UserSegment[];
  geography?: string[]; // Country codes
  deviceType?: DeviceType[];
  returningUser?: boolean | null;
  minAccountAge?: number; // Days
  planType?: string[]; // ['free', 'pro', 'enterprise']
  customFilters?: Record<string, any>;
}

// Test results and analysis
export interface TestResults {
  winner?: string; // Winning variant ID
  confidence: number; // Statistical confidence level (0-100)
  effect: number; // Measured effect size
  pValue: number; // Statistical significance
  completedAt: number;
  recommendation: TestRecommendation;
  summary: string;
  detailedAnalysis?: TestAnalysis;
}

export type TestRecommendation = 'continue' | 'stop_winner' | 'stop_inconclusive' | 'investigate';

// User assignment tracking
export interface UserAssignment {
  userId: Id<'users'>;
  testId: string;
  variantId: string;

  // Assignment context
  assignmentCriteria: AssignmentContext;

  // Consistency and tracking
  hash: string; // Stable hash for consistent assignment
  assignedAt: number;
  firstExposure?: number;
  lastInteraction?: number;

  // Quality control
  excluded: boolean;
  exclusionReason?: string;
  forcedVariant?: string; // Manual override
  isBot: boolean;
  isInternal: boolean;
}

// Context captured during assignment
export interface AssignmentContext {
  userSegment?: string;
  deviceType?: string;
  geography?: string;
  userAgent?: string;
  sessionId?: string;
  referrer?: string;
  pageContext?: string;
  planType?: string;
  ip?: string;
}

// Event tracking for analytics
export interface TestEvent {
  userId: Id<'users'>;
  testId: string;
  variantId: string;

  // Event details
  eventType: EventType;
  eventName: string;
  value: number; // Numeric value for calculations

  // Event metadata
  properties?: Record<string, any>;
  sessionId?: string;
  pageUrl?: string;
  referrer?: string;

  // Technical context
  deviceType?: string;
  browserType?: string;
  osType?: string;
  screenResolution?: string;

  // Timing
  timestamp: number;
  serverTimestamp: number;

  // Quality control
  isValid: boolean;
  invalidationReason?: string;
}

// Analytics and reporting interfaces
export interface TestAnalytics {
  testId: string;
  variants: Record<string, VariantAnalytics>;
  summary: AnalyticsSummary;
  statisticalAnalysis: StatisticalAnalysis;
  timeSeriesData?: TimeSeriesData[];
  calculatedAt: number;
}

export interface VariantAnalytics {
  variantId: string;
  totalUsers: number;
  totalEvents: number;
  conversionRate: number;
  averageValue: number;
  standardDeviation: number;
  confidenceInterval: ConfidenceInterval;
  retentionRate?: number;
  engagementScore?: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalEvents: number;
  testDuration: number; // Days
  dataQualityScore: number; // 0-100
  validEventPercentage: number;
  botTrafficPercentage: number;
}

export interface StatisticalAnalysis {
  winner?: string;
  confidence: number;
  pValue: number;
  effectSize: number;
  statisticalPower: number;
  recommendation: TestRecommendation;
  minimumSampleSizeReached: boolean;
  expectedTestDuration?: number; // Days remaining
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // e.g., 0.95 for 95% confidence
}

export interface TimeSeriesData {
  timestamp: number;
  date: string; // YYYY-MM-DD format
  variantId: string;
  metric: string;
  value: number;
  cumulativeValue: number;
}

// Performance monitoring
export interface PerformanceMetrics {
  testAssignmentTime: number; // milliseconds
  eventTrackingTime: number;
  analyticsCalculationTime: number;
  memoryUsage: number; // MB
  errorRate: number; // percentage
  throughput: number; // events per second
}

// A/B Test Configuration Templates
export interface TestTemplate {
  configId: string;
  name: string;
  description: string;
  category: TestCategory;

  template: {
    variants: TestVariantTemplate[];
    defaultCriteria: Partial<TestCriteria>;
    recommendedMetrics: string[];
    minSampleSize: number;
    expectedDuration: number; // Days
  };

  // Usage tracking
  usageCount: number;
  lastUsed?: number;

  // Access control
  isPublic: boolean;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

export type TestCategory =
  | 'ui'
  | 'feature'
  | 'onboarding'
  | 'pricing'
  | 'performance'
  | 'mobile'
  | 'retention';

export interface TestVariantTemplate {
  name: string;
  description: string;
  defaultWeight: number;
  config: Partial<VariantConfig>;
}

// Hook interfaces for React integration
export interface UseABTestResult {
  variant: TestVariant | null;
  isLoading: boolean;
  trackEvent: (
    eventType: string,
    eventName: string,
    value?: number,
    properties?: any
  ) => Promise<void>;
  isInTest: boolean;
  analytics: any;
}

export interface UseTimelineTestResult {
  variant: TestVariant | null;
  isLoading: boolean;
  trackEvent: (
    eventType: string,
    eventName: string,
    value?: number,
    properties?: any
  ) => Promise<void>;
  isHorizontalTimeline: boolean;
  isTraditionalView: boolean;
  config: VariantConfig;
}

export interface UseABTestAnalyticsResult {
  analytics: TestAnalytics | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  error?: string;
}

// Service interfaces
export interface ABTestingServiceInterface {
  // Core assignment and tracking
  assignUserToTestWithConvex(
    userId: Id<'users'>,
    testId: string,
    criteria: AssignmentContext
  ): Promise<{
    variant: TestVariant;
    isNew: boolean;
    convexAssignment: any;
  }>;

  trackEventWithConvex(
    userId: Id<'users'>,
    testId: string,
    eventType: string,
    eventName: string,
    value?: number,
    properties?: any,
    context?: Partial<AssignmentContext>
  ): Promise<boolean>;

  // Analytics and reporting
  getRealTimeAnalytics(testId: string, forceRefresh?: boolean): Promise<TestAnalytics | null>;
  generateLiveDashboard(): string;

  // Configuration management
  initializeConvex(mutations: any, queries: any): void;
}

// Middleware integration types
export interface ABTestMiddlewareContext {
  userAgent: string;
  referrer: string;
  deviceType: DeviceType;
  geography: string;
  userSegment: UserSegment;
  sessionId: string;
  returningUser: boolean;
  ip: string;
  pageContext: string;
}

// Error types
export class ABTestingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly testId?: string,
    public readonly userId?: string
  ) {
    super(message);
    this.name = 'ABTestingError';
  }
}

export class TestConfigurationError extends ABTestingError {
  constructor(message: string, testId?: string) {
    super(message, 'TEST_CONFIGURATION_ERROR', testId);
    this.name = 'TestConfigurationError';
  }
}

export class AssignmentError extends ABTestingError {
  constructor(message: string, testId?: string, userId?: string) {
    super(message, 'ASSIGNMENT_ERROR', testId, userId);
    this.name = 'AssignmentError';
  }
}

export class TrackingError extends ABTestingError {
  constructor(message: string, testId?: string, userId?: string) {
    super(message, 'TRACKING_ERROR', testId, userId);
    this.name = 'TrackingError';
  }
}

// Utility types
export interface TestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SampleSizeCalculation {
  minimumSampleSize: number;
  recommendedSampleSize: number;
  expectedDuration: number; // Days
  powerAnalysis: {
    alpha: number; // Significance level
    beta: number; // Type II error rate
    power: number; // Statistical power (1 - beta)
    effect: number; // Expected effect size
  };
}

// Constants and enums
export const TEST_METRICS = {
  // Primary metrics
  CALENDAR_ENGAGEMENT_RATE: 'calendar_engagement_rate',
  ONBOARDING_COMPLETION_RATE: 'onboarding_completion_rate',
  TRIAL_TO_PAID_CONVERSION_RATE: 'trial_to_paid_conversion_rate',
  MOBILE_SESSION_DURATION: 'mobile_session_duration',

  // Secondary metrics
  SESSION_DURATION: 'session_duration',
  EVENT_CREATION_RATE: 'event_creation_rate',
  USER_RETENTION_7D: 'user_retention_7d',
  FEATURE_ADOPTION_RATE: 'feature_adoption_rate',
  SUPPORT_TICKET_RATE: 'support_ticket_rate',
} as const;

export const CONFIDENCE_LEVELS = {
  LOW: 75,
  MEDIUM: 90,
  HIGH: 95,
  VERY_HIGH: 99,
} as const;

export const DEFAULT_TEST_CONFIG: Partial<ABTestConfig> = {
  minDetectableEffect: 0.05, // 5%
  statisticalPower: 0.8, // 80%
  targetSampleSize: 1000,
  status: 'draft',
};

export const PERFORMANCE_TARGETS = {
  ASSIGNMENT_TIME_MS: 50,
  TRACKING_TIME_MS: 25,
  ANALYTICS_TIME_MS: 100,
  MEMORY_USAGE_MB: 2,
  ERROR_RATE_PERCENT: 0.1,
} as const;
