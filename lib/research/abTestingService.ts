/**
 * Enhanced A/B Testing Service for Command Center Calendar Horizontal Timeline Validation
 * Production-ready integration with Convex backend and real-time analytics
 * Uses Confidence framework for dynamic configuration management
 */

import { Store as Confidence } from '@hapipal/confidence';
import { useConvexAuth } from 'convex/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export type TestVariant = 'horizontal_timeline' | 'traditional_month' | 'hybrid_view' | 'control';

export interface ABTestConfig {
  testId: string;
  name: string;
  hypothesis: string;
  variants: {
    [key: string]: {
      name: string;
      description: string;
      weight: number; // 0-100, percentage of traffic
      config: any;
    };
  };
  criteria: {
    userSegment?: 'early_adopter' | 'traditional' | 'power_user' | 'casual';
    geography?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    userAgent?: string;
    returningUser?: boolean;
  };
  metrics: {
    primary: string; // Primary metric to optimize for
    secondary: string[]; // Secondary metrics to track
  };
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetSampleSize: number;
  currentSampleSize: number;
}

export interface UserAssignment {
  userId: string;
  testId: string;
  variant: TestVariant;
  assignedAt: Date;
  criteria: any;
}

export interface ABTestResult {
  testId: string;
  variant: TestVariant;
  metric: string;
  value: number;
  timestamp: Date;
  userId?: string;
}

// Enhanced interfaces for production A/B testing
export interface ConvexABTestConfig extends ABTestConfig {
  convexTestId: Id<'abTests'>;
  realTimeAnalytics: boolean;
  statisticalPower: number;
  minDetectableEffect: number;
}

export interface ProductionTestResult extends ABTestResult {
  statisticalSignificance: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  recommendation: 'continue' | 'stop_winner' | 'stop_inconclusive' | 'investigate';
}

class EnhancedABTestingService {
  private store: any;
  private convexMutations: any;
  private convexQueries: any;
  private assignments: Map<string, UserAssignment> = new Map();
  private results: ABTestResult[] = [];

  constructor() {
    // Initialize Confidence store with enhanced A/B test configuration
    this.store = new Confidence({
      tests: {
        // PRODUCTION TEST 1: Horizontal Timeline Validation
        horizontal_timeline_validation: {
          $filter: 'userSegment',
          early_adopter: {
            $filter: 'random.timeline_validation',
            $range: [
              { limit: 85, value: 'horizontal_timeline' }, // 85% get horizontal (confidence boost)
              { limit: 100, value: 'traditional_month' }, // 15% control for comparison
            ],
          },
          power_user: {
            $filter: 'random.timeline_validation',
            $range: [
              { limit: 90, value: 'horizontal_timeline' }, // 90% for power users
              { limit: 100, value: 'traditional_month' }, // 10% control
            ],
          },
          traditional: {
            $filter: 'planType',
            pro: {
              $filter: 'random.timeline_validation',
              $range: [
                { limit: 50, value: 'horizontal_timeline' }, // 50% for pro users
                { limit: 100, value: 'traditional_month' },
              ],
            },
            free: {
              $filter: 'random.timeline_validation',
              $range: [
                { limit: 30, value: 'horizontal_timeline' }, // 30% for free users
                { limit: 100, value: 'traditional_month' },
              ],
            },
            $default: {
              $filter: 'random.timeline_validation',
              $range: [
                { limit: 40, value: 'horizontal_timeline' },
                { limit: 100, value: 'traditional_month' },
              ],
            },
          },
          $default: {
            $filter: 'random.timeline_validation',
            $range: [
              { limit: 60, value: 'horizontal_timeline' }, // Default 60/40 split
              { limit: 100, value: 'traditional_month' },
            ],
          },
        },

        // Test 2: Onboarding Flow Comparison
        onboarding_flow_test: {
          $filter: 'returningUser',
          false: {
            // New users only
            $filter: 'random.onboarding_test',
            $range: [
              { limit: 50, value: 'timeline_first_onboarding' },
              { limit: 100, value: 'traditional_onboarding' },
            ],
          },
          $default: 'skip', // Existing users skip onboarding test
        },

        // Test 3: Pricing Page Timeline Showcase
        pricing_page_test: {
          $filter: 'pageContext',
          pricing: {
            $filter: 'random.pricing_test',
            $range: [
              { limit: 50, value: 'timeline_hero' },
              { limit: 100, value: 'standard_features' },
            ],
          },
          $default: 'control',
        },
      },

      // Feature flags for gradual rollouts
      features: {
        horizontal_timeline_enabled: {
          $filter: 'userSegment',
          early_adopter: true,
          power_user: true,
          traditional: {
            $filter: 'random.feature_rollout',
            $range: [
              { limit: 25, value: true }, // 25% gradual rollout
              { limit: 100, value: false },
            ],
          },
          $default: false,
        },

        enhanced_analytics: {
          $filter: 'environment',
          development: true,
          staging: true,
          production: {
            $filter: 'random.analytics_rollout',
            $range: [
              { limit: 10, value: true }, // 10% of production users
              { limit: 100, value: false },
            ],
          },
          $default: false,
        },
      },
    });
  }

  /**
   * Initialize Convex integration for production A/B testing
   */
  initializeConvex(mutations: any, queries: any) {
    this.convexMutations = mutations;
    this.convexQueries = queries;
  }

  /**
   * Assign user to A/B test variant with Convex backend persistence
   */
  async assignUserToTestWithConvex(
    userId: Id<'users'>,
    testId: string,
    criteria: {
      userSegment?: string;
      deviceType?: string;
      geography?: string;
      returningUser?: boolean;
      pageContext?: string;
      environment?: string;
      planType?: string;
      sessionId?: string;
      referrer?: string;
      userAgent?: string;
      [key: string]: any;
    }
  ): Promise<{
    variant: TestVariant;
    isNew: boolean;
    convexAssignment: any;
  }> {
    try {
      // First get assignment from Convex (handles persistence and consistency)
      const convexResult = await this.convexMutations.abTesting.assignUserToTest({
        userId,
        testId,
        assignmentCriteria: {
          userSegment: criteria.userSegment,
          deviceType: criteria.deviceType,
          geography: criteria.geography,
          sessionId: criteria.sessionId,
          referrer: criteria.referrer,
          userAgent: criteria.userAgent,
        },
      });

      if (!convexResult) {
        return {
          variant: 'control',
          isNew: false,
          convexAssignment: null,
        };
      }

      // Also get local assignment for immediate use
      const _localVariant = this.assignUserToTest(userId, testId, criteria);

      return {
        variant: convexResult.variantId as TestVariant,
        isNew: convexResult.isNew,
        convexAssignment: convexResult.assignment,
      };
    } catch (error) {
      console.error('Convex assignment failed, falling back to local:', error);
      // Fallback to local assignment if Convex fails
      const variant = this.assignUserToTest(userId, testId, criteria);
      return {
        variant,
        isNew: false,
        convexAssignment: null,
      };
    }
  }

  /**
   * Legacy method for non-Convex assignment (kept for backward compatibility)
   */
  assignUserToTest(
    userId: string,
    testId: string,
    criteria: {
      userSegment?: string;
      deviceType?: string;
      geography?: string;
      returningUser?: boolean;
      pageContext?: string;
      environment?: string;
      planType?: string;
      [key: string]: any;
    }
  ): TestVariant {
    // Generate consistent random value for this user + test
    const randomSeed = this.hashUserId(userId + testId) % 100;

    // Add random value to criteria
    const enrichedCriteria = {
      ...criteria,
      random: {
        timeline_test: randomSeed,
        onboarding_test: randomSeed,
        pricing_test: randomSeed,
        feature_rollout: randomSeed,
        analytics_rollout: randomSeed,
      },
    };

    // Get variant assignment from Confidence store
    const variant = this.store.get(`/tests/${testId}`, enrichedCriteria) as TestVariant;

    // Store assignment
    const assignment: UserAssignment = {
      userId,
      testId,
      variant,
      assignedAt: new Date(),
      criteria: enrichedCriteria,
    };

    this.assignments.set(`${userId}:${testId}`, assignment);

    // Track assignment event
    this.trackEvent(userId, testId, 'assignment', variant, {
      userSegment: criteria.userSegment,
      deviceType: criteria.deviceType,
    });

    return variant;
  }

  /**
   * Get user's current test assignment
   */
  getUserAssignment(userId: string, testId: string): TestVariant | null {
    const assignment = this.assignments.get(`${userId}:${testId}`);
    return assignment?.variant || null;
  }

  /**
   * Enhanced event tracking with Convex backend integration
   */
  async trackEventWithConvex(
    userId: Id<'users'>,
    testId: string,
    eventType: string,
    eventName: string,
    value?: number,
    properties?: any,
    context?: {
      sessionId?: string;
      pageUrl?: string;
      referrer?: string;
      deviceType?: string;
      browserType?: string;
      osType?: string;
      screenResolution?: string;
    }
  ): Promise<boolean> {
    try {
      await this.convexMutations.abTesting.trackTestEvent({
        userId,
        testId,
        eventType,
        eventName,
        value,
        properties,
        sessionId: context?.sessionId,
        pageUrl: context?.pageUrl,
        referrer: context?.referrer,
        deviceType: context?.deviceType,
        browserType: context?.browserType,
        osType: context?.osType,
        screenResolution: context?.screenResolution,
      });

      // Also track locally for immediate feedback
      this.trackEvent(userId, testId, eventName, value || 1, properties);
      return true;
    } catch (error) {
      console.error('Convex event tracking failed:', error);
      // Fallback to local tracking
      this.trackEvent(userId, testId, eventName, value || 1, properties);
      return false;
    }
  }

  /**
   * Legacy event tracking method (kept for backward compatibility)
   */
  trackEvent(userId: string, testId: string, metric: string, value: any, _metadata?: any): void {
    const assignment = this.assignments.get(`${userId}:${testId}`);
    if (!assignment) {
      console.warn(`No assignment found for user ${userId} in test ${testId}`);
      return;
    }

    const result: ABTestResult = {
      testId,
      variant: assignment.variant,
      metric,
      value: typeof value === 'number' ? value : 1, // Convert events to 1
      timestamp: new Date(),
      userId,
    };

    this.results.push(result);

    // ASCII-style logging for development
    console.log(`
📊 A/B TEST EVENT TRACKED
   User: ${userId.substring(0, 8)}...
   Test: ${testId}
   Variant: ${assignment.variant}
   Metric: ${metric}
   Value: ${result.value}
   Time: ${new Date().toISOString()}
    `);
  }

  /**
   * Get real-time analytics from Convex backend
   */
  async getRealTimeAnalytics(
    testId: string,
    forceRefresh = false
  ): Promise<{
    variants: { [variant: string]: any };
    summary: any;
    statisticalAnalysis: {
      winner?: string;
      confidence: number;
      recommendation: string;
    };
  } | null> {
    try {
      if (!this.convexMutations?.abTesting?.calculateTestAnalytics) {
        console.warn('Convex analytics not available, falling back to local');
        return this.getTestResultsEnhanced(testId);
      }

      const analytics = await this.convexMutations.abTesting.calculateTestAnalytics({
        testId,
        forceRefresh,
      });

      if (!analytics) {
        return null;
      }

      // Calculate statistical significance and recommendations
      const variantKeys = Object.keys(analytics.variants);
      let winner = null;
      let maxConversion = 0;
      let confidence = 0;

      for (const variant of variantKeys) {
        const conversionRate = analytics.variants[variant].conversionRate || 0;
        if (conversionRate > maxConversion) {
          maxConversion = conversionRate;
          winner = variant;
        }
      }

      // Simplified confidence calculation (use proper statistical tests in production)
      const totalUsers = analytics.summary.totalUsers || 0;
      if (totalUsers > 100) {
        confidence = Math.min(85 + (totalUsers / 100) * 5, 95);
      } else {
        confidence = totalUsers * 0.5;
      }

      let recommendation = 'continue';
      if (confidence > 90 && maxConversion > 0) {
        recommendation = 'stop_winner';
      } else if (confidence < 50) {
        recommendation = 'investigate';
      }

      return {
        ...analytics,
        statisticalAnalysis: {
          winner,
          confidence,
          recommendation,
        },
      };
    } catch (error) {
      console.error('Real-time analytics failed:', error);
      return this.getTestResultsEnhanced(testId);
    }
  }

  /**
   * Enhanced local test results with statistical analysis
   */
  getTestResultsEnhanced(testId: string): {
    variants: { [variant: string]: any };
    summary: any;
    statisticalAnalysis: {
      winner?: string;
      confidence: number;
      recommendation: string;
    };
  } {
    const localResults = this.getTestResults(testId);

    // Add statistical analysis
    const variantKeys = Object.keys(localResults.variants);
    let winner = null;
    let maxConversion = 0;

    for (const variant of variantKeys) {
      const conversionRate = localResults.variants[variant].conversionRate || 0;
      if (conversionRate > maxConversion) {
        maxConversion = conversionRate;
        winner = variant;
      }
    }

    const confidence = localResults.summary.statisticalSignificance || 0;
    let recommendation = 'continue';

    if (confidence > 90 && maxConversion > 0) {
      recommendation = 'stop_winner';
    } else if (confidence < 50) {
      recommendation = 'investigate';
    }

    return {
      ...localResults,
      statisticalAnalysis: {
        winner,
        confidence,
        recommendation,
      },
    };
  }

  /**
   * Legacy test results method (kept for backward compatibility)
   */
  getTestResults(testId: string): {
    variants: { [variant: string]: any };
    summary: any;
    asciiReport: string;
  } {
    const testResults = this.results.filter((r) => r.testId === testId);
    const variants: { [variant: string]: any } = {};

    // Calculate statistics per variant
    const variantNames = [...new Set(testResults.map((r) => r.variant))];

    variantNames.forEach((variant) => {
      const variantResults = testResults.filter((r) => r.variant === variant);
      const users = new Set(variantResults.map((r) => r.userId)).size;

      variants[variant] = {
        users,
        totalEvents: variantResults.length,
        avgValue: variantResults.reduce((sum, r) => sum + r.value, 0) / variantResults.length || 0,
        conversionRate: this.calculateConversionRate(variant, testResults),
        retentionRate: this.calculateRetentionRate(variant, variantResults),
      };
    });

    // Generate ASCII report
    const asciiReport = this.generateASCIIReport(testId, variants);

    return {
      variants,
      summary: {
        totalUsers: new Set(testResults.map((r) => r.userId)).size,
        totalEvents: testResults.length,
        testDuration: this.calculateTestDuration(testId),
        statisticalSignificance: this.calculateSignificance(variants),
      },
      asciiReport,
    };
  }

  /**
   * Generate ASCII visualization of test results
   */
  private generateASCIIReport(testId: string, variants: any): string {
    const variantKeys = Object.keys(variants);
    if (variantKeys.length === 0) return 'No data available';

    const maxUsers = Math.max(...variantKeys.map((v) => variants[v].users));
    const maxRate = Math.max(...variantKeys.map((v) => variants[v].conversionRate || 0));

    let report = `
A/B TEST RESULTS: ${testId.toUpperCase()}
═══════════════════════════════════════════════════════

CONVERSION RATES:
`;

    variantKeys.forEach((variant) => {
      const data = variants[variant];
      const rate = data.conversionRate || 0;
      const barLength = Math.round((rate / maxRate) * 50);
      const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);

      report += `
${variant.padEnd(20)} │${bar}│ ${rate.toFixed(1)}%
                     Users: ${data.users}, Events: ${data.totalEvents}`;
    });

    report += `

USER COUNTS:
`;

    variantKeys.forEach((variant) => {
      const users = variants[variant].users;
      const barLength = Math.round((users / maxUsers) * 40);
      const bar = '▓'.repeat(barLength) + '▒'.repeat(40 - barLength);

      report += `
${variant.padEnd(20)} │${bar}│ ${users} users`;
    });

    // Determine winner
    const winner = variantKeys.reduce((best, current) =>
      (variants[current].conversionRate || 0) > (variants[best].conversionRate || 0)
        ? current
        : best
    );

    const winnerRate = variants[winner].conversionRate || 0;
    const controlRate =
      variants[variantKeys.find((v) => v.includes('control') || v.includes('traditional'))] ||
      variants[variantKeys[0]];
    const improvement =
      ((winnerRate - (controlRate.conversionRate || 0)) / (controlRate.conversionRate || 1)) * 100;

    report += `

WINNER: ${winner.toUpperCase()} 🏆
Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%
Confidence: ${this.calculateSignificance(variants).toFixed(1)}%

RECOMMENDATION: ${improvement > 10 ? 'IMPLEMENT WINNER' : improvement > 5 ? 'CONTINUE TESTING' : 'INVESTIGATE FURTHER'}
`;

    return report;
  }

  /**
   * Helper methods for calculations
   */
  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateConversionRate(variant: TestVariant, results: ABTestResult[]): number {
    const variantResults = results.filter((r) => r.variant === variant);
    const users = new Set(variantResults.map((r) => r.userId)).size;
    const conversions = variantResults.filter(
      (r) => r.metric === 'conversion' || r.metric === 'signup' || r.metric === 'purchase'
    ).length;

    return users > 0 ? (conversions / users) * 100 : 0;
  }

  private calculateRetentionRate(_variant: TestVariant, results: ABTestResult[]): number {
    const users = new Set(results.map((r) => r.userId));
    const returnUsers = new Set(
      results
        .filter((r) => r.metric === 'session_start')
        .filter((r) => {
          const assignmentTime = this.assignments.get(`${r.userId}:${r.testId}`)?.assignedAt;
          if (!assignmentTime) return false;
          const daysSinceAssignment =
            (r.timestamp.getTime() - assignmentTime.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceAssignment >= 7; // Retained if they return after 7+ days
        })
        .map((r) => r.userId)
    );

    return users.size > 0 ? (returnUsers.size / users.size) * 100 : 0;
  }

  private calculateTestDuration(testId: string): number {
    const testResults = this.results.filter((r) => r.testId === testId);
    if (testResults.length === 0) return 0;

    const earliest = Math.min(...testResults.map((r) => r.timestamp.getTime()));
    const latest = Math.max(...testResults.map((r) => r.timestamp.getTime()));

    return Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)); // Days
  }

  private calculateSignificance(variants: any): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical tests (t-test, chi-square, etc.)
    const variantKeys = Object.keys(variants);
    if (variantKeys.length < 2) return 0;

    const totalUsers = variantKeys.reduce((sum, key) => sum + variants[key].users, 0);
    const sampleSizeScore = Math.min(totalUsers / 1000, 1) * 40; // Max 40 points for sample size

    // Calculate effect size
    const rates = variantKeys.map((key) => variants[key].conversionRate || 0);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    const effectSize = maxRate - minRate;
    const effectSizeScore = Math.min(effectSize / 10, 1) * 60; // Max 60 points for effect size

    return Math.min(sampleSizeScore + effectSizeScore, 95);
  }

  /**
   * Export test results for external analysis
   */
  exportTestData(testId: string, format: 'csv' | 'json' | 'ascii' = 'json'): string {
    const results = this.getTestResults(testId);

    if (format === 'ascii') {
      return results.asciiReport;
    }

    if (format === 'csv') {
      let csv = 'variant,users,events,conversion_rate,retention_rate\n';
      Object.entries(results.variants).forEach(([variant, data]: [string, any]) => {
        csv += `${variant},${data.users},${data.totalEvents},${data.conversionRate},${data.retentionRate}\n`;
      });
      return csv;
    }

    return JSON.stringify(results, null, 2);
  }

  /**
   * Get current test configuration for a user
   */
  getTestConfig(
    userId: string,
    criteria: any
  ): {
    horizontalTimelineTest: TestVariant;
    onboardingTest: TestVariant;
    pricingPageTest: TestVariant;
    features: {
      horizontalTimelineEnabled: boolean;
      enhancedAnalytics: boolean;
    };
  } {
    // Get all current test assignments
    const horizontalTimelineTest = this.assignUserToTest(
      userId,
      'horizontal_timeline_vs_month',
      criteria
    );

    const onboardingTest = this.assignUserToTest(userId, 'onboarding_flow_test', criteria);

    const pricingPageTest = this.assignUserToTest(userId, 'pricing_page_test', {
      ...criteria,
      pageContext: 'pricing',
    });

    // Get feature flags
    const features = {
      horizontalTimelineEnabled: this.store.get('/features/horizontal_timeline_enabled', criteria),
      enhancedAnalytics: this.store.get('/features/enhanced_analytics', criteria),
    };

    return {
      horizontalTimelineTest,
      onboardingTest,
      pricingPageTest,
      features,
    };
  }

  /**
   * Generate real-time ASCII dashboard for monitoring
   */
  generateLiveDashboard(): string {
    const activeTests = [
      'horizontal_timeline_vs_month',
      'onboarding_flow_test',
      'pricing_page_test',
    ];
    let dashboard = `
🔬 LINEARTIME A/B TESTING LIVE DASHBOARD
═══════════════════════════════════════════════════════════════════

📊 TEST STATUS OVERVIEW:
`;

    activeTests.forEach((testId) => {
      const results = this.getTestResults(testId);
      const isActive = results.summary.totalUsers > 0;
      const confidence = results.summary.statisticalSignificance;

      dashboard += `
┌─ ${testId.replace(/_/g, ' ').toUpperCase()}
│  Status: ${isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
│  Users: ${results.summary.totalUsers}
│  Confidence: ${confidence.toFixed(1)}%
│  Duration: ${results.summary.testDuration} days
└─ ${confidence > 90 ? '✅ SIGNIFICANT' : confidence > 75 ? '⚠️ TRENDING' : '📊 COLLECTING'}
`;
    });

    dashboard += `
📈 HORIZONTAL TIMELINE VALIDATION STATUS:
`;

    const mainTest = this.getTestResults('horizontal_timeline_vs_month');
    const variants = mainTest.variants;

    if (Object.keys(variants).length > 0) {
      const horizontal = variants.horizontal_timeline;
      const traditional = variants.traditional_month;

      if (horizontal && traditional) {
        const improvement =
          ((horizontal.conversionRate - traditional.conversionRate) / traditional.conversionRate) *
          100;

        dashboard += `
Horizontal Timeline: ${horizontal.conversionRate?.toFixed(1) || 0}% conversion (${horizontal.users || 0} users)
Traditional View:    ${traditional.conversionRate?.toFixed(1) || 0}% conversion (${traditional.users || 0} users)
Improvement:         ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%

${
  improvement > 20
    ? '🚀 STRONG WINNER'
    : improvement > 10
      ? '✅ MODERATE WIN'
      : improvement > 0
        ? '📈 SLIGHT ADVANTAGE'
        : '🔄 CONTINUE TESTING'
}
`;
      }
    }

    dashboard += `
Last Updated: ${new Date().toISOString()}
`;

    return dashboard;
  }
}

// Export enhanced singleton instance
export const enhancedABTestingService = new EnhancedABTestingService();

// Legacy export for backward compatibility
export const abTestingService = enhancedABTestingService;

// Production React hook for A/B testing with Convex integration
export function useProductionABTest(
  testId: string,
  userId: Id<'users'> | null,
  criteria: {
    userSegment?: string;
    deviceType?: string;
    geography?: string;
    returningUser?: boolean;
    pageContext?: string;
    planType?: string;
    sessionId?: string;
    referrer?: string;
  }
): {
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
} {
  const assignUserMutation = useMutation(api.abTesting.assignUserToTest);
  const trackEventMutation = useMutation(api.abTesting.trackTestEvent);
  const testAssignment = useQuery(
    api.abTesting.getUserTestAssignment,
    userId ? { userId, testId } : 'skip'
  );

  const [variant, setVariant] = React.useState<TestVariant | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const assignUser = async () => {
      try {
        // Initialize Convex integration
        enhancedABTestingService.initializeConvex(
          {
            abTesting: { assignUserToTest: assignUserMutation, trackTestEvent: trackEventMutation },
          },
          { abTesting: { getUserTestAssignment: () => testAssignment } }
        );

        const assignment = await enhancedABTestingService.assignUserToTestWithConvex(
          userId,
          testId,
          criteria
        );

        setVariant(assignment.variant);
        setIsLoading(false);

        // Track exposure event
        if (assignment.isNew) {
          await enhancedABTestingService.trackEventWithConvex(
            userId,
            testId,
            'exposure',
            'test_exposure',
            1,
            { testId, variant: assignment.variant }
          );
        }
      } catch (error) {
        console.error('A/B test assignment failed:', error);
        setVariant('control');
        setIsLoading(false);
      }
    };

    assignUser();
  }, [userId, testId]);

  const trackEvent = async (eventType: string, eventName: string, value = 1, properties?: any) => {
    if (!userId || !variant) return;

    try {
      await enhancedABTestingService.trackEventWithConvex(
        userId,
        testId,
        eventType,
        eventName,
        value,
        properties,
        {
          sessionId: criteria.sessionId,
          pageUrl: window.location.href,
          referrer: document.referrer,
          deviceType: criteria.deviceType,
          browserType: navigator.userAgent.includes('Chrome') ? 'chrome' : 'other',
          osType: navigator.platform,
          screenResolution: `${screen.width}x${screen.height}`,
        }
      );
    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  };

  return {
    variant,
    isLoading,
    trackEvent,
    isInTest: variant !== null && variant !== 'control',
    analytics: testAssignment,
  };
}

// Legacy React hook (kept for backward compatibility)
export function useABTest(
  testId: string,
  userId: string,
  criteria: any
): {
  variant: TestVariant;
  trackEvent: (metric: string, value?: any, metadata?: any) => void;
  isInTest: boolean;
} {
  const variant = enhancedABTestingService.assignUserToTest(userId, testId, criteria);

  const trackEvent = (metric: string, value: any = 1, metadata?: any) => {
    enhancedABTestingService.trackEvent(userId, testId, metric, value, metadata);
  };

  return {
    variant,
    trackEvent,
    isInTest: variant !== 'control' && variant !== 'skip',
  };
}

// React hook for real-time analytics
export function useABTestAnalytics(testId: string) {
  const [analytics, setAnalytics] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const results = await enhancedABTestingService.getRealTimeAnalytics(testId);
        setAnalytics(results);
        setIsLoading(false);
      } catch (error) {
        console.error('Analytics loading failed:', error);
        setIsLoading(false);
      }
    };

    loadAnalytics();

    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [testId]);

  return { analytics, isLoading };
}

// Add React import for hooks
import React from 'react';
