/**
 * Gradual Rollout Engine - Phase 5.0 Week 7-8
 *
 * Progressive feature deployment system with:
 * - Percentage-based rollout
 * - User-group targeting
 * - A/B testing capabilities
 * - Automated rollback on performance regression
 * - Kill switch functionality
 *
 * Integrates with Vercel Edge Config for instant global updates
 */

import type {
  ComponentFlags,
  FeatureFlagManager,
  RollbackTrigger,
  RolloutPhase,
} from '../featureFlags/FeatureFlagManager';
import {
  PerformanceMeasurementSystem,
  type PerformanceMeasurements,
} from '../performance/performanceMeasurement';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RolloutTarget {
  percentage: number;
  userGroups?: string[];
  geographic?: string[];
  deviceTypes?: string[];
  timeWindow?: {
    start: Date;
    end: Date;
  };
}

export interface RolloutMetrics {
  successRate: number;
  errorRate: number;
  performanceImpact: {
    memoryDelta: number;
    fpsDelta: number;
    loadTimeDelta: number;
  };
  userFeedback: {
    positive: number;
    negative: number;
    neutral: number;
  };
  adoption: {
    totalUsers: number;
    activeUsers: number;
    retentionRate: number;
  };
}

export interface ABTestConfiguration {
  name: string;
  hypothesis: string;
  variants: {
    control: ComponentFlags;
    treatment: ComponentFlags;
  };
  splitPercentage: number; // 50 = 50/50 split
  successMetrics: string[];
  duration: number; // days
  minSampleSize: number;
  significanceThreshold: number; // 0.05 = 95% confidence
}

export interface RolloutStrategy {
  name: string;
  type: 'linear' | 'exponential' | 'step' | 'canary' | 'blue-green';
  phases: RolloutPhase[];
  fallbackStrategy: 'immediate' | 'gradual' | 'manual';
  healthChecks: HealthCheck[];
  rollbackTriggers: RollbackTrigger[];
}

export interface HealthCheck {
  name: string;
  type: 'performance' | 'error-rate' | 'user-feedback' | 'business-metric';
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  window: number; // minutes
  consecutiveFailures?: number;
}

export interface RolloutState {
  currentPhase: number;
  startTime: Date;
  phaseStartTime: Date;
  targetPercentage: number;
  actualPercentage: number;
  status: 'active' | 'paused' | 'completed' | 'rolling-back' | 'failed';
  metrics: RolloutMetrics;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  errors: RolloutError[];
}

export interface RolloutError {
  timestamp: Date;
  type: 'performance' | 'error' | 'user-feedback' | 'health-check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedUsers?: number;
  resolution?: string;
}

// ============================================================================
// PREDEFINED ROLLOUT STRATEGIES
// ============================================================================

/**
 * Conservative rollout for critical features
 */
export const CONSERVATIVE_ROLLOUT: RolloutStrategy = {
  name: 'Conservative Rollout',
  type: 'step',
  phases: [
    {
      name: 'Canary',
      percentage: 1,
      duration: 24,
      criteria: {
        minSuccessRate: 0.99,
        maxErrorRate: 0.005,
        maxMemoryUsage: 100,
        minFPS: 30,
        maxLoadTime: 1500,
      },
      rollbackTriggers: [{ metric: 'errorRate', threshold: 0.01, action: 'rollback_phase' }],
    },
    {
      name: 'Early Adopters',
      percentage: 5,
      duration: 48,
      criteria: {
        minSuccessRate: 0.995,
        maxErrorRate: 0.005,
        maxMemoryUsage: 110,
        minFPS: 30,
        maxLoadTime: 2000,
      },
      rollbackTriggers: [{ metric: 'memoryUsage', threshold: 120, action: 'rollback_phase' }],
    },
    {
      name: 'Beta',
      percentage: 25,
      duration: 72,
      criteria: {
        minSuccessRate: 0.99,
        maxErrorRate: 0.01,
        maxMemoryUsage: 120,
        minFPS: 30,
        maxLoadTime: 2500,
      },
      rollbackTriggers: [],
    },
    {
      name: 'General Availability',
      percentage: 100,
      duration: 168,
      criteria: {
        minSuccessRate: 0.99,
        maxErrorRate: 0.01,
        maxMemoryUsage: 100,
        minFPS: 60,
        maxLoadTime: 2000,
      },
      rollbackTriggers: [],
    },
  ],
  fallbackStrategy: 'immediate',
  healthChecks: [
    {
      name: 'Error Rate',
      type: 'error-rate',
      threshold: 0.01,
      operator: 'lt',
      window: 15,
      consecutiveFailures: 3,
    },
    {
      name: 'Performance Impact',
      type: 'performance',
      threshold: 20, // 20% degradation
      operator: 'lt',
      window: 10,
    },
  ],
  rollbackTriggers: [
    {
      metric: 'errorRate',
      threshold: 0.02,
      action: 'emergency_stop',
    },
  ],
};

/**
 * Aggressive rollout for non-critical features
 */
export const AGGRESSIVE_ROLLOUT: RolloutStrategy = {
  name: 'Aggressive Rollout',
  type: 'exponential',
  phases: [
    {
      name: 'Initial',
      percentage: 10,
      duration: 12,
      criteria: {
        minSuccessRate: 0.95,
        maxErrorRate: 0.05,
        maxMemoryUsage: 150,
        minFPS: 25,
        maxLoadTime: 3000,
      },
      rollbackTriggers: [],
    },
    {
      name: 'Expansion',
      percentage: 50,
      duration: 24,
      criteria: {
        minSuccessRate: 0.97,
        maxErrorRate: 0.03,
        maxMemoryUsage: 130,
        minFPS: 30,
        maxLoadTime: 2500,
      },
      rollbackTriggers: [],
    },
    {
      name: 'Full Rollout',
      percentage: 100,
      duration: 48,
      criteria: {
        minSuccessRate: 0.98,
        maxErrorRate: 0.02,
        maxMemoryUsage: 120,
        minFPS: 30,
        maxLoadTime: 2000,
      },
      rollbackTriggers: [],
    },
  ],
  fallbackStrategy: 'gradual',
  healthChecks: [
    {
      name: 'Basic Error Rate',
      type: 'error-rate',
      threshold: 0.05,
      operator: 'lt',
      window: 30,
    },
  ],
  rollbackTriggers: [
    {
      metric: 'errorRate',
      threshold: 0.1,
      action: 'rollback_phase',
    },
  ],
};

// ============================================================================
// GRADUAL ROLLOUT ENGINE CLASS
// ============================================================================

export class GradualRolloutEngine {
  private featureFlagManager: FeatureFlagManager;
  private performanceMonitor: PerformanceMeasurementSystem;
  private rolloutState: Map<string, RolloutState> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private rolloutTimers: Map<string, NodeJS.Timeout> = new Map();
  private baselineMetrics: Map<string, PerformanceMeasurements> = new Map();

  constructor(featureFlagManager: FeatureFlagManager) {
    this.featureFlagManager = featureFlagManager;
    this.initializePerformanceMonitoring();
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  /**
   * Initialize performance monitoring for rollout tracking
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      this.performanceMonitor = new PerformanceMeasurementSystem({
        collectWebVitals: true,
        collectMemoryMetrics: true,
        collectBundleMetrics: true,
        collectDesignSystemMetrics: true,
        onMeasurement: (metrics) => this.handlePerformanceUpdate(metrics),
      });

      this.performanceMonitor.start();

      // Collect baseline metrics
      setTimeout(() => {
        this.collectBaselineMetrics();
      }, 5000);
    } catch (error) {
      console.warn('Failed to initialize performance monitoring for rollout:', error);
    }
  }

  /**
   * Collect baseline performance metrics before rollout
   */
  private collectBaselineMetrics(): void {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    this.baselineMetrics.set('baseline', currentMetrics);
    console.log('Baseline metrics collected:', currentMetrics);
  }

  // ============================================================================
  // ROLLOUT MANAGEMENT
  // ============================================================================

  /**
   * Start gradual rollout for a feature
   */
  async startRollout(
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy,
    abTestConfig?: ABTestConfiguration
  ): Promise<void> {
    try {
      const rolloutId = `${featureKey}-${Date.now()}`;

      // Initialize rollout state
      const initialState: RolloutState = {
        currentPhase: 0,
        startTime: new Date(),
        phaseStartTime: new Date(),
        targetPercentage: strategy.phases[0]?.percentage || 0,
        actualPercentage: 0,
        status: 'active',
        metrics: this.getInitialMetrics(),
        healthStatus: 'healthy',
        errors: [],
      };

      this.rolloutState.set(rolloutId, initialState);

      console.log(`Starting rollout for ${featureKey}:`, {
        rolloutId,
        strategy: strategy.name,
        initialPhase: strategy.phases[0],
      });

      // Set up A/B test if configured
      if (abTestConfig) {
        await this.setupABTest(rolloutId, abTestConfig);
      }

      // Start first phase
      await this.executePhase(rolloutId, featureKey, strategy, 0);

      // Set up health monitoring
      this.setupHealthChecks(rolloutId, featureKey, strategy);

      // Log rollout start
      await this.logRolloutEvent(rolloutId, 'rollout-started', {
        feature: featureKey,
        strategy: strategy.name,
        phase: strategy.phases[0]?.name,
      });
    } catch (error) {
      console.error('Failed to start rollout:', error);
      throw error;
    }
  }

  /**
   * Execute specific rollout phase
   */
  private async executePhase(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy,
    phaseIndex: number
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state || phaseIndex >= strategy.phases.length) return;

    const phase = strategy.phases[phaseIndex];

    console.log(`Executing phase ${phaseIndex + 1}/${strategy.phases.length}: ${phase.name}`);

    // Update state
    state.currentPhase = phaseIndex;
    state.phaseStartTime = new Date();
    state.targetPercentage = phase.percentage;
    state.status = 'active';

    // Apply rollout percentage
    await this.applyRolloutPercentage(featureKey, phase.percentage);

    // Set up phase completion timer
    const phaseTimer = setTimeout(
      () => {
        this.completePhase(rolloutId, featureKey, strategy, phaseIndex);
      },
      phase.duration * 60 * 60 * 1000
    ); // Convert hours to milliseconds

    this.rolloutTimers.set(`${rolloutId}-phase-${phaseIndex}`, phaseTimer);

    // Log phase start
    await this.logRolloutEvent(rolloutId, 'phase-started', {
      phase: phase.name,
      targetPercentage: phase.percentage,
      duration: phase.duration,
    });
  }

  /**
   * Complete current phase and move to next
   */
  private async completePhase(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy,
    phaseIndex: number
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return;

    const phase = strategy.phases[phaseIndex];

    // Check if phase criteria are met
    const phaseSuccess = await this.evaluatePhaseSuccess(rolloutId, phase);

    if (!phaseSuccess) {
      console.warn(`Phase ${phase.name} failed criteria check, initiating rollback`);
      await this.initiateRollback(rolloutId, featureKey, strategy, 'phase-criteria-failed');
      return;
    }

    // Log phase completion
    await this.logRolloutEvent(rolloutId, 'phase-completed', {
      phase: phase.name,
      actualPercentage: state.actualPercentage,
      metrics: state.metrics,
    });

    // Move to next phase or complete rollout
    if (phaseIndex + 1 < strategy.phases.length) {
      await this.executePhase(rolloutId, featureKey, strategy, phaseIndex + 1);
    } else {
      await this.completeRollout(rolloutId, featureKey);
    }
  }

  /**
   * Complete entire rollout
   */
  private async completeRollout(
    rolloutId: string,
    featureKey: keyof ComponentFlags
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return;

    state.status = 'completed';

    console.log(`Rollout completed for ${featureKey}:`, {
      rolloutId,
      finalPercentage: state.actualPercentage,
      totalTime: new Date().getTime() - state.startTime.getTime(),
      finalMetrics: state.metrics,
    });

    // Clean up timers
    this.cleanupRollout(rolloutId);

    // Log completion
    await this.logRolloutEvent(rolloutId, 'rollout-completed', {
      feature: featureKey,
      finalPercentage: state.actualPercentage,
      metrics: state.metrics,
    });
  }

  // ============================================================================
  // ROLLBACK MANAGEMENT
  // ============================================================================

  /**
   * Initiate rollback to previous safe state
   */
  async initiateRollback(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy,
    reason: string
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return;

    console.warn(`Initiating rollback for ${featureKey}:`, reason);

    state.status = 'rolling-back';

    // Add error to state
    state.errors.push({
      timestamp: new Date(),
      type: 'error',
      severity: 'high',
      message: reason,
      affectedUsers: this.calculateAffectedUsers(state.actualPercentage),
    });

    // Execute rollback strategy
    switch (strategy.fallbackStrategy) {
      case 'immediate':
        await this.executeImmediateRollback(rolloutId, featureKey);
        break;
      case 'gradual':
        await this.executeGradualRollback(rolloutId, featureKey, strategy);
        break;
      case 'manual':
        await this.requestManualIntervention(rolloutId, featureKey, reason);
        break;
    }

    // Log rollback
    await this.logRolloutEvent(rolloutId, 'rollback-initiated', {
      feature: featureKey,
      reason,
      strategy: strategy.fallbackStrategy,
      affectedUsers: this.calculateAffectedUsers(state.actualPercentage),
    });
  }

  /**
   * Execute immediate rollback (kill switch)
   */
  private async executeImmediateRollback(
    rolloutId: string,
    featureKey: keyof ComponentFlags
  ): Promise<void> {
    // Disable feature immediately
    await this.featureFlagManager.emergencyDisableFeature(
      featureKey,
      'Immediate rollback triggered'
    );

    // Update rollout percentage to 0
    await this.applyRolloutPercentage(featureKey, 0);

    const state = this.rolloutState.get(rolloutId);
    if (state) {
      state.status = 'failed';
      state.actualPercentage = 0;
    }

    // Clean up
    this.cleanupRollout(rolloutId);

    console.log(`Immediate rollback completed for ${featureKey}`);
  }

  /**
   * Execute gradual rollback
   */
  private async executeGradualRollback(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    _strategy: RolloutStrategy
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return;

    const currentPercentage = state.actualPercentage;
    const _targetPercentage = 0;
    const steps = 5; // Rollback in 5 steps
    const stepSize = currentPercentage / steps;

    for (let i = 1; i <= steps; i++) {
      const newPercentage = Math.max(0, currentPercentage - stepSize * i);
      await this.applyRolloutPercentage(featureKey, newPercentage);

      // Wait between steps
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 second intervals

      // Check if system is stabilizing
      const isStable = await this.checkSystemStability();
      if (isStable && i >= 3) {
        break; // Can stop early if system stabilizes
      }
    }

    state.status = 'failed';
    state.actualPercentage = 0;

    console.log(`Gradual rollback completed for ${featureKey}`);
  }

  /**
   * Request manual intervention
   */
  private async requestManualIntervention(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    reason: string
  ): Promise<void> {
    console.error(`MANUAL INTERVENTION REQUIRED for ${featureKey}:`, reason);

    const state = this.rolloutState.get(rolloutId);
    if (state) {
      state.status = 'paused';
    }

    // Send critical alert
    await this.sendCriticalAlert({
      type: 'manual-intervention-required',
      feature: featureKey,
      rolloutId,
      reason,
      currentPercentage: state?.actualPercentage || 0,
      timestamp: new Date(),
    });

    // Pause all timers but don't rollback automatically
    this.pauseRollout(rolloutId);
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  /**
   * Set up health checks for rollout
   */
  private setupHealthChecks(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy
  ): void {
    for (const healthCheck of strategy.healthChecks) {
      const checkInterval = Math.min(healthCheck.window * 60 * 1000, 60000); // At least every minute

      const timer = setInterval(async () => {
        await this.executeHealthCheck(rolloutId, featureKey, strategy, healthCheck);
      }, checkInterval);

      this.healthCheckTimers.set(`${rolloutId}-${healthCheck.name}`, timer);
    }
  }

  /**
   * Execute individual health check
   */
  private async executeHealthCheck(
    rolloutId: string,
    featureKey: keyof ComponentFlags,
    strategy: RolloutStrategy,
    healthCheck: HealthCheck
  ): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (!state || state.status !== 'active') return;

    try {
      const checkPassed = await this.evaluateHealthCheck(healthCheck, state);

      if (!checkPassed) {
        const consecutiveFailures = this.getConsecutiveFailures(rolloutId, healthCheck.name) + 1;
        this.setConsecutiveFailures(rolloutId, healthCheck.name, consecutiveFailures);

        if (consecutiveFailures >= (healthCheck.consecutiveFailures || 1)) {
          console.warn(
            `Health check failed: ${healthCheck.name} (${consecutiveFailures} consecutive failures)`
          );

          // Update health status
          state.healthStatus = consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';

          // Trigger rollback if critical
          if (state.healthStatus === 'unhealthy') {
            await this.initiateRollback(
              rolloutId,
              featureKey,
              strategy,
              `Health check failed: ${healthCheck.name}`
            );
          }
        }
      } else {
        // Reset consecutive failures on success
        this.setConsecutiveFailures(rolloutId, healthCheck.name, 0);

        // Improve health status if all checks pass
        if (state.healthStatus === 'degraded') {
          const allHealthy = await this.checkAllHealthChecks(rolloutId, strategy);
          if (allHealthy) {
            state.healthStatus = 'healthy';
          }
        }
      }
    } catch (error) {
      console.error(`Health check execution failed: ${healthCheck.name}:`, error);
    }
  }

  /**
   * Evaluate specific health check
   */
  private async evaluateHealthCheck(
    healthCheck: HealthCheck,
    state: RolloutState
  ): Promise<boolean> {
    switch (healthCheck.type) {
      case 'performance':
        return this.evaluatePerformanceHealth(healthCheck, state);
      case 'error-rate':
        return this.evaluateErrorRateHealth(healthCheck, state);
      case 'user-feedback':
        return this.evaluateUserFeedbackHealth(healthCheck, state);
      case 'business-metric':
        return this.evaluateBusinessMetricHealth(healthCheck, state);
      default:
        return true;
    }
  }

  /**
   * Evaluate performance health check
   */
  private evaluatePerformanceHealth(healthCheck: HealthCheck, state: RolloutState): boolean {
    const baseline = this.baselineMetrics.get('baseline');
    if (!baseline || !state.performanceMetrics) return true;

    const memoryDelta =
      ((state.performanceMetrics.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100;
    const fpsDelta = ((baseline.fps - state.performanceMetrics.fps) / baseline.fps) * 100;
    const loadTimeDelta =
      ((state.performanceMetrics.loadTime - baseline.loadTime) / baseline.loadTime) * 100;

    const performanceDegradation = Math.max(memoryDelta, fpsDelta, loadTimeDelta);

    return this.compareValue(performanceDegradation, healthCheck.threshold, healthCheck.operator);
  }

  /**
   * Evaluate error rate health check
   */
  private evaluateErrorRateHealth(healthCheck: HealthCheck, state: RolloutState): boolean {
    return this.compareValue(state.metrics.errorRate, healthCheck.threshold, healthCheck.operator);
  }

  /**
   * Evaluate user feedback health check
   */
  private evaluateUserFeedbackHealth(healthCheck: HealthCheck, state: RolloutState): boolean {
    const totalFeedback =
      state.metrics.userFeedback.positive +
      state.metrics.userFeedback.negative +
      state.metrics.userFeedback.neutral;
    if (totalFeedback === 0) return true;

    const negativePercentage = (state.metrics.userFeedback.negative / totalFeedback) * 100;
    return this.compareValue(negativePercentage, healthCheck.threshold, healthCheck.operator);
  }

  /**
   * Evaluate business metric health check
   */
  private evaluateBusinessMetricHealth(healthCheck: HealthCheck, state: RolloutState): boolean {
    // This would integrate with business analytics
    // For now, use adoption rate as proxy
    return this.compareValue(
      state.metrics.adoption.retentionRate,
      healthCheck.threshold,
      healthCheck.operator
    );
  }

  /**
   * Compare values based on operator
   */
  private compareValue(actual: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt':
        return actual > threshold;
      case 'gte':
        return actual >= threshold;
      case 'lt':
        return actual < threshold;
      case 'lte':
        return actual <= threshold;
      case 'eq':
        return actual === threshold;
      default:
        return true;
    }
  }

  // ============================================================================
  // A/B TESTING
  // ============================================================================

  /**
   * Set up A/B test configuration
   */
  private async setupABTest(rolloutId: string, config: ABTestConfiguration): Promise<void> {
    console.log(`Setting up A/B test: ${config.name}`);

    // Store A/B test configuration
    if (typeof window !== 'undefined') {
      const abTests = JSON.parse(localStorage.getItem('linear-ab-tests') || '{}');
      abTests[rolloutId] = {
        ...config,
        startDate: new Date(),
        participants: {
          control: 0,
          treatment: 0,
        },
        metrics: {
          control: this.getInitialMetrics(),
          treatment: this.getInitialMetrics(),
        },
      };
      localStorage.setItem('linear-ab-tests', JSON.stringify(abTests));
    }
  }

  /**
   * Evaluate A/B test results
   */
  private async evaluateABTestResults(_rolloutId: string): Promise<{
    significant: boolean;
    winner: 'control' | 'treatment' | 'inconclusive';
    confidence: number;
  }> {
    // This would implement proper statistical analysis
    // For demo, return mock results
    return {
      significant: true,
      winner: 'treatment',
      confidence: 0.95,
    };
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  /**
   * Handle performance metric updates
   */
  private handlePerformanceUpdate(metrics: PerformanceMeasurements): void {
    // Update rollout states with latest performance data
    for (const [_rolloutId, state] of this.rolloutState) {
      if (state.status === 'active') {
        state.metrics.performanceImpact = this.calculatePerformanceImpact(metrics);

        // Update performance metrics in state
        if (!state.performanceMetrics) {
          state.performanceMetrics = {
            memoryUsage: 0,
            fps: 0,
            errorRate: 0,
            loadTime: 0,
          };
        }

        state.performanceMetrics.memoryUsage = metrics.memoryUsage;
        state.performanceMetrics.fps = metrics.fps;
        state.performanceMetrics.loadTime = metrics.loadTime;
      }
    }
  }

  /**
   * Calculate performance impact compared to baseline
   */
  private calculatePerformanceImpact(current: PerformanceMeasurements): {
    memoryDelta: number;
    fpsDelta: number;
    loadTimeDelta: number;
  } {
    const baseline = this.baselineMetrics.get('baseline');
    if (!baseline) {
      return { memoryDelta: 0, fpsDelta: 0, loadTimeDelta: 0 };
    }

    return {
      memoryDelta: current.memoryUsage - baseline.memoryUsage,
      fpsDelta: baseline.fps - current.fps,
      loadTimeDelta: current.loadTime - baseline.loadTime,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Apply rollout percentage to feature flag system
   */
  private async applyRolloutPercentage(
    featureKey: keyof ComponentFlags,
    percentage: number
  ): Promise<void> {
    // This would update Edge Config or feature flag system
    console.log(`Applying ${percentage}% rollout to ${featureKey}`);

    // Update local storage for demo
    if (typeof window !== 'undefined') {
      const rolloutPercentages = JSON.parse(
        localStorage.getItem('linear-rollout-percentages') || '{}'
      );
      rolloutPercentages[featureKey] = percentage;
      localStorage.setItem('linear-rollout-percentages', JSON.stringify(rolloutPercentages));
    }
  }

  /**
   * Evaluate phase success criteria
   */
  private async evaluatePhaseSuccess(rolloutId: string, phase: RolloutPhase): Promise<boolean> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return false;

    const metrics = state.metrics;
    const criteria = phase.criteria;

    return (
      metrics.successRate >= criteria.minSuccessRate &&
      metrics.errorRate <= criteria.maxErrorRate &&
      state.performanceMetrics &&
      state.performanceMetrics.memoryUsage <= criteria.maxMemoryUsage &&
      state.performanceMetrics.fps >= criteria.minFPS &&
      state.performanceMetrics.loadTime <= criteria.maxLoadTime
    );
  }

  /**
   * Check system stability
   */
  private async checkSystemStability(): Promise<boolean> {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    const baseline = this.baselineMetrics.get('baseline');

    if (!baseline) return true;

    const memoryIncrease =
      (currentMetrics.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage;
    const fpsDecrease = (baseline.fps - currentMetrics.fps) / baseline.fps;

    return memoryIncrease < 0.1 && fpsDecrease < 0.1; // Less than 10% degradation
  }

  /**
   * Check all health checks pass
   */
  private async checkAllHealthChecks(
    rolloutId: string,
    strategy: RolloutStrategy
  ): Promise<boolean> {
    const state = this.rolloutState.get(rolloutId);
    if (!state) return false;

    for (const healthCheck of strategy.healthChecks) {
      const passed = await this.evaluateHealthCheck(healthCheck, state);
      if (!passed) return false;
    }

    return true;
  }

  /**
   * Calculate affected users
   */
  private calculateAffectedUsers(percentage: number): number {
    // This would calculate based on actual user base
    // For demo, assume 10,000 active users
    return Math.floor((percentage / 100) * 10000);
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): RolloutMetrics {
    return {
      successRate: 1.0,
      errorRate: 0.0,
      performanceImpact: {
        memoryDelta: 0,
        fpsDelta: 0,
        loadTimeDelta: 0,
      },
      userFeedback: {
        positive: 0,
        negative: 0,
        neutral: 0,
      },
      adoption: {
        totalUsers: 0,
        activeUsers: 0,
        retentionRate: 1.0,
      },
    };
  }

  /**
   * Get consecutive failures count
   */
  private getConsecutiveFailures(rolloutId: string, checkName: string): number {
    const key = `failures-${rolloutId}-${checkName}`;
    if (typeof window !== 'undefined') {
      return Number.parseInt(localStorage.getItem(key) || '0');
    }
    return 0;
  }

  /**
   * Set consecutive failures count
   */
  private setConsecutiveFailures(rolloutId: string, checkName: string, count: number): void {
    const key = `failures-${rolloutId}-${checkName}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, count.toString());
    }
  }

  /**
   * Log rollout event
   */
  private async logRolloutEvent(rolloutId: string, eventType: string, data: any): Promise<void> {
    const logEntry = {
      rolloutId,
      eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    console.log('Rollout Event:', logEntry);

    // Store in local storage for debugging
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('linear-rollout-logs') || '[]');
      logs.push(logEntry);
      localStorage.setItem('linear-rollout-logs', JSON.stringify(logs.slice(-1000))); // Keep last 1000 events
    }
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(alertData: any): Promise<void> {
    console.error('CRITICAL ROLLOUT ALERT:', alertData);

    // In production, send to monitoring service
    // For demo, store locally
    if (typeof window !== 'undefined') {
      const alerts = JSON.parse(localStorage.getItem('linear-critical-alerts') || '[]');
      alerts.push({
        ...alertData,
        id: `alert-${Date.now()}`,
        acknowledged: false,
      });
      localStorage.setItem('linear-critical-alerts', JSON.stringify(alerts));
    }
  }

  /**
   * Pause rollout
   */
  private pauseRollout(rolloutId: string): void {
    // Clear all timers for this rollout
    this.cleanupRollout(rolloutId);

    const state = this.rolloutState.get(rolloutId);
    if (state) {
      state.status = 'paused';
    }
  }

  /**
   * Clean up rollout resources
   */
  private cleanupRollout(rolloutId: string): void {
    // Clear health check timers
    for (const [timerKey, timer] of this.healthCheckTimers) {
      if (timerKey.startsWith(rolloutId)) {
        clearInterval(timer);
        this.healthCheckTimers.delete(timerKey);
      }
    }

    // Clear rollout timers
    for (const [timerKey, timer] of this.rolloutTimers) {
      if (timerKey.startsWith(rolloutId)) {
        clearTimeout(timer);
        this.rolloutTimers.delete(timerKey);
      }
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current rollout state
   */
  getRolloutState(rolloutId: string): RolloutState | undefined {
    return this.rolloutState.get(rolloutId);
  }

  /**
   * Get all active rollouts
   */
  getActiveRollouts(): Map<string, RolloutState> {
    const active = new Map();
    for (const [id, state] of this.rolloutState) {
      if (state.status === 'active') {
        active.set(id, state);
      }
    }
    return active;
  }

  /**
   * Manually pause rollout
   */
  async pauseRolloutManually(rolloutId: string): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (state && state.status === 'active') {
      this.pauseRollout(rolloutId);
      await this.logRolloutEvent(rolloutId, 'manually-paused', {});
    }
  }

  /**
   * Manually resume rollout
   */
  async resumeRolloutManually(rolloutId: string): Promise<void> {
    const state = this.rolloutState.get(rolloutId);
    if (state && state.status === 'paused') {
      state.status = 'active';
      // Would need to recreate appropriate timers based on current phase
      await this.logRolloutEvent(rolloutId, 'manually-resumed', {});
    }
  }

  /**
   * Get rollout metrics summary
   */
  getRolloutMetrics(): {
    activeRollouts: number;
    completedRollouts: number;
    failedRollouts: number;
    avgSuccessRate: number;
    totalAffectedUsers: number;
  } {
    let active = 0;
    let completed = 0;
    let failed = 0;
    let totalSuccessRate = 0;
    let totalUsers = 0;

    for (const [_, state] of this.rolloutState) {
      switch (state.status) {
        case 'active':
          active++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }

      totalSuccessRate += state.metrics.successRate;
      totalUsers += this.calculateAffectedUsers(state.actualPercentage);
    }

    const totalRollouts = this.rolloutState.size;

    return {
      activeRollouts: active,
      completedRollouts: completed,
      failedRollouts: failed,
      avgSuccessRate: totalRollouts > 0 ? totalSuccessRate / totalRollouts : 1.0,
      totalAffectedUsers: totalUsers,
    };
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Stop performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
    }

    // Clear all timers
    this.healthCheckTimers.forEach((timer) => clearInterval(timer));
    this.rolloutTimers.forEach((timer) => clearTimeout(timer));

    this.healthCheckTimers.clear();
    this.rolloutTimers.clear();
    this.rolloutState.clear();
  }
}

export default GradualRolloutEngine;
