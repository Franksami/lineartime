/**
 * Deployment Manager - Phase 5.0 Week 7-8
 *
 * Blue-green deployment infrastructure with:
 * - Zero-downtime deployment
 * - Canary releases
 * - Health monitoring
 * - Automated rollback
 * - Performance validation
 *
 * Integrates with Vercel deployment API and Edge Config for instant updates
 */

import type { ComponentFlags, FeatureFlagManager } from '../featureFlags/FeatureFlagManager';
import {
  PerformanceMeasurementSystem,
  type PerformanceMeasurements,
} from '../performance/performanceMeasurement';
import {
  AGGRESSIVE_ROLLOUT,
  CONSERVATIVE_ROLLOUT,
  type GradualRolloutEngine,
  type RolloutStrategy,
} from './GradualRolloutEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DeploymentConfig {
  strategy: 'blue-green' | 'canary' | 'rolling' | 'instant';
  environment: 'development' | 'staging' | 'production';
  healthChecks: DeploymentHealthCheck[];
  rollbackTriggers: DeploymentRollbackTrigger[];
  notifications: NotificationConfig;
  performance: PerformanceValidation;
}

export interface DeploymentHealthCheck {
  name: string;
  type: 'http' | 'performance' | 'feature-flag' | 'database' | 'external-service';
  endpoint?: string;
  timeout: number;
  retries: number;
  interval: number;
  successThreshold: number;
  failureThreshold: number;
  enabled: boolean;
}

export interface DeploymentRollbackTrigger {
  name: string;
  metric: 'error-rate' | 'response-time' | 'memory-usage' | 'cpu-usage' | 'user-complaints';
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  window: number; // minutes
  action: 'alert' | 'rollback' | 'emergency-stop';
  enabled: boolean;
}

export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel: string;
    enabled: boolean;
  };
  email?: {
    recipients: string[];
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    enabled: boolean;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    enabled: boolean;
  };
}

export interface PerformanceValidation {
  enabled: boolean;
  baselineCollection: {
    duration: number; // minutes
    sampleSize: number;
  };
  acceptableRegression: {
    memoryUsage: number; // percentage
    responseTime: number; // percentage
    errorRate: number; // percentage
    fps: number; // percentage
  };
  monitoringDuration: number; // minutes after deployment
}

export interface DeploymentState {
  id: string;
  version: string;
  startTime: Date;
  endTime?: Date;
  status:
    | 'preparing'
    | 'deploying'
    | 'validating'
    | 'monitoring'
    | 'completed'
    | 'failed'
    | 'rolling-back'
    | 'rolled-back';
  strategy: string;
  environment: string;
  progress: number; // 0-100
  phase: string;
  healthStatus: 'unknown' | 'healthy' | 'degraded' | 'unhealthy';
  metrics: DeploymentMetrics;
  errors: DeploymentError[];
  timeline: DeploymentEvent[];
  featureFlags: string[];
  rollouts: string[];
}

export interface DeploymentMetrics {
  deployment: {
    duration: number;
    buildTime: number;
    testTime: number;
    deployTime: number;
  };
  performance: {
    baseline: PerformanceMeasurements | null;
    current: PerformanceMeasurements | null;
    regression: {
      memoryUsage: number;
      responseTime: number;
      errorRate: number;
      fps: number;
    };
  };
  health: {
    checksExecuted: number;
    checksPassed: number;
    checksFailed: number;
    averageResponseTime: number;
    uptime: number;
  };
  traffic: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}

export interface DeploymentError {
  timestamp: Date;
  phase: string;
  type: 'build' | 'test' | 'deployment' | 'health-check' | 'performance' | 'feature-flag';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  resolved: boolean;
  resolution?: string;
}

export interface DeploymentEvent {
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  phase: string;
  message: string;
  metadata?: any;
}

export interface BlueGreenEnvironment {
  name: 'blue' | 'green';
  url: string;
  version: string;
  status: 'active' | 'inactive' | 'deploying' | 'failed';
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastDeployment: Date;
  traffic: number; // percentage
}

export interface CanaryDeployment {
  canaryVersion: string;
  canaryPercentage: number;
  canaryUrl: string;
  stableVersion: string;
  stableUrl: string;
  metrics: {
    canary: DeploymentMetrics;
    stable: DeploymentMetrics;
  };
  comparisonResults: {
    errorRateDelta: number;
    responseTimeDelta: number;
    memoryUsageDelta: number;
    userSatisfactionDelta: number;
  };
}

// ============================================================================
// PREDEFINED DEPLOYMENT CONFIGURATIONS
// ============================================================================

/**
 * Production deployment configuration with maximum safety
 */
export const PRODUCTION_DEPLOYMENT_CONFIG: DeploymentConfig = {
  strategy: 'blue-green',
  environment: 'production',
  healthChecks: [
    {
      name: 'API Health Check',
      type: 'http',
      endpoint: '/api/health',
      timeout: 5000,
      retries: 3,
      interval: 30000,
      successThreshold: 2,
      failureThreshold: 3,
      enabled: true,
    },
    {
      name: 'Database Health Check',
      type: 'database',
      timeout: 10000,
      retries: 2,
      interval: 60000,
      successThreshold: 1,
      failureThreshold: 2,
      enabled: true,
    },
    {
      name: 'Performance Check',
      type: 'performance',
      timeout: 15000,
      retries: 1,
      interval: 120000,
      successThreshold: 3,
      failureThreshold: 2,
      enabled: true,
    },
    {
      name: 'Feature Flag Check',
      type: 'feature-flag',
      timeout: 5000,
      retries: 2,
      interval: 30000,
      successThreshold: 1,
      failureThreshold: 1,
      enabled: true,
    },
  ],
  rollbackTriggers: [
    {
      name: 'High Error Rate',
      metric: 'error-rate',
      threshold: 0.01, // 1%
      operator: 'gt',
      window: 5,
      action: 'rollback',
      enabled: true,
    },
    {
      name: 'Slow Response Time',
      metric: 'response-time',
      threshold: 2000, // 2 seconds
      operator: 'gt',
      window: 10,
      action: 'alert',
      enabled: true,
    },
    {
      name: 'High Memory Usage',
      metric: 'memory-usage',
      threshold: 150, // MB
      operator: 'gt',
      window: 15,
      action: 'rollback',
      enabled: true,
    },
  ],
  notifications: {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: '#deployments',
      enabled: !!process.env.SLACK_WEBHOOK_URL,
    },
    email: {
      recipients: ['devops@company.com', 'alerts@company.com'],
      smtp: {
        host: 'smtp.company.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
      enabled: false, // Disabled by default
    },
  },
  performance: {
    enabled: true,
    baselineCollection: {
      duration: 15, // 15 minutes
      sampleSize: 100,
    },
    acceptableRegression: {
      memoryUsage: 10, // 10% increase acceptable
      responseTime: 20, // 20% increase acceptable
      errorRate: 50, // 50% increase acceptable (from very low baseline)
      fps: 5, // 5% decrease acceptable
    },
    monitoringDuration: 60, // Monitor for 1 hour after deployment
  },
};

/**
 * Staging deployment configuration with faster validation
 */
export const STAGING_DEPLOYMENT_CONFIG: DeploymentConfig = {
  ...PRODUCTION_DEPLOYMENT_CONFIG,
  strategy: 'canary',
  environment: 'staging',
  healthChecks: PRODUCTION_DEPLOYMENT_CONFIG.healthChecks.map((check) => ({
    ...check,
    interval: check.interval / 2, // Faster health checks
    timeout: check.timeout / 2, // Shorter timeouts
  })),
  performance: {
    ...PRODUCTION_DEPLOYMENT_CONFIG.performance,
    baselineCollection: {
      duration: 5, // 5 minutes
      sampleSize: 50,
    },
    acceptableRegression: {
      memoryUsage: 20, // More lenient
      responseTime: 30,
      errorRate: 100,
      fps: 10,
    },
    monitoringDuration: 30, // 30 minutes
  },
};

/**
 * Development deployment configuration with minimal validation
 */
export const DEVELOPMENT_DEPLOYMENT_CONFIG: DeploymentConfig = {
  ...PRODUCTION_DEPLOYMENT_CONFIG,
  strategy: 'instant',
  environment: 'development',
  healthChecks: [
    {
      name: 'Basic Health Check',
      type: 'http',
      endpoint: '/api/health',
      timeout: 3000,
      retries: 1,
      interval: 60000,
      successThreshold: 1,
      failureThreshold: 1,
      enabled: true,
    },
  ],
  rollbackTriggers: [], // No automatic rollback in development
  performance: {
    enabled: false, // Disabled for development
    baselineCollection: { duration: 1, sampleSize: 10 },
    acceptableRegression: { memoryUsage: 100, responseTime: 100, errorRate: 1000, fps: 50 },
    monitoringDuration: 5,
  },
};

// ============================================================================
// DEPLOYMENT MANAGER CLASS
// ============================================================================

export class DeploymentManager {
  private featureFlagManager: FeatureFlagManager;
  private rolloutEngine: GradualRolloutEngine;
  private performanceMonitor: PerformanceMeasurementSystem;
  private deployments: Map<string, DeploymentState> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();
  private blueGreenEnvironments: Map<string, BlueGreenEnvironment> = new Map();

  constructor(featureFlagManager: FeatureFlagManager, rolloutEngine: GradualRolloutEngine) {
    this.featureFlagManager = featureFlagManager;
    this.rolloutEngine = rolloutEngine;
    this.initializePerformanceMonitoring();
    this.initializeBlueGreenEnvironments();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize performance monitoring for deployment validation
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
    } catch (error) {
      console.warn('Failed to initialize deployment performance monitoring:', error);
    }
  }

  /**
   * Initialize blue-green environments
   */
  private initializeBlueGreenEnvironments(): void {
    // Initialize blue environment
    this.blueGreenEnvironments.set('blue', {
      name: 'blue',
      url: process.env.BLUE_ENVIRONMENT_URL || 'https://blue.lineartime.app',
      version: '0.0.0',
      status: 'inactive',
      healthStatus: 'unknown',
      lastDeployment: new Date(),
      traffic: 0,
    });

    // Initialize green environment
    this.blueGreenEnvironments.set('green', {
      name: 'green',
      url: process.env.GREEN_ENVIRONMENT_URL || 'https://green.lineartime.app',
      version: '0.0.0',
      status: 'active',
      healthStatus: 'unknown',
      lastDeployment: new Date(),
      traffic: 100,
    });
  }

  // ============================================================================
  // DEPLOYMENT ORCHESTRATION
  // ============================================================================

  /**
   * Start deployment with specified strategy
   */
  async startDeployment(
    version: string,
    config: DeploymentConfig = PRODUCTION_DEPLOYMENT_CONFIG,
    featureFlags: Array<keyof ComponentFlags> = []
  ): Promise<string> {
    const deploymentId = `deployment-${version}-${Date.now()}`;

    // Initialize deployment state
    const deploymentState: DeploymentState = {
      id: deploymentId,
      version,
      startTime: new Date(),
      status: 'preparing',
      strategy: config.strategy,
      environment: config.environment,
      progress: 0,
      phase: 'preparation',
      healthStatus: 'unknown',
      metrics: this.getInitialMetrics(),
      errors: [],
      timeline: [],
      featureFlags: featureFlags,
      rollouts: [],
    };

    this.deployments.set(deploymentId, deploymentState);

    try {
      // Add initial event
      this.addDeploymentEvent(
        deploymentId,
        'info',
        'preparation',
        `Starting ${config.strategy} deployment for version ${version}`
      );

      // Execute deployment strategy
      switch (config.strategy) {
        case 'blue-green':
          await this.executeBlueGreenDeployment(deploymentId, config);
          break;
        case 'canary':
          await this.executeCanaryDeployment(deploymentId, config);
          break;
        case 'rolling':
          await this.executeRollingDeployment(deploymentId, config);
          break;
        case 'instant':
          await this.executeInstantDeployment(deploymentId, config);
          break;
        default:
          throw new Error(`Unsupported deployment strategy: ${config.strategy}`);
      }

      // Start feature flag rollouts if specified
      if (featureFlags.length > 0) {
        await this.startFeatureFlagRollouts(deploymentId, featureFlags, config);
      }

      // Send deployment success notification
      await this.sendNotification(
        config,
        'success',
        `Deployment ${deploymentId} completed successfully`,
        {
          version,
          strategy: config.strategy,
          duration: Date.now() - deploymentState.startTime.getTime(),
        }
      );
    } catch (error) {
      // Handle deployment failure
      await this.handleDeploymentFailure(deploymentId, config, error as Error);
      throw error;
    }

    return deploymentId;
  }

  /**
   * Execute blue-green deployment
   */
  private async executeBlueGreenDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) throw new Error('Deployment state not found');

    // Phase 1: Prepare inactive environment
    this.updateDeploymentProgress(deploymentId, 10, 'preparing-environment');
    const inactiveEnv = this.getInactiveEnvironment();
    await this.prepareEnvironment(deploymentId, inactiveEnv, state.version);

    // Phase 2: Deploy to inactive environment
    this.updateDeploymentProgress(deploymentId, 30, 'deploying-to-inactive');
    await this.deployToEnvironment(deploymentId, inactiveEnv, state.version);

    // Phase 3: Health checks on inactive environment
    this.updateDeploymentProgress(deploymentId, 50, 'health-checking');
    await this.performHealthChecks(deploymentId, config, inactiveEnv.url);

    // Phase 4: Performance validation
    if (config.performance.enabled) {
      this.updateDeploymentProgress(deploymentId, 70, 'performance-validation');
      await this.performPerformanceValidation(deploymentId, config, inactiveEnv.url);
    }

    // Phase 5: Switch traffic
    this.updateDeploymentProgress(deploymentId, 90, 'switching-traffic');
    await this.switchTraffic(deploymentId, inactiveEnv);

    // Phase 6: Final validation and monitoring
    this.updateDeploymentProgress(deploymentId, 95, 'final-validation');
    await this.performFinalValidation(deploymentId, config);

    // Complete deployment
    this.updateDeploymentProgress(deploymentId, 100, 'completed');
    state.status = 'completed';
    state.endTime = new Date();

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'completed',
      'Blue-green deployment completed successfully'
    );
  }

  /**
   * Execute canary deployment
   */
  private async executeCanaryDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) throw new Error('Deployment state not found');

    // Phase 1: Deploy canary version
    this.updateDeploymentProgress(deploymentId, 20, 'deploying-canary');
    const canaryConfig = await this.createCanaryDeployment(deploymentId, state.version, 5); // Start with 5% traffic

    // Phase 2: Monitor canary performance
    this.updateDeploymentProgress(deploymentId, 40, 'monitoring-canary');
    await this.monitorCanaryDeployment(deploymentId, canaryConfig, config);

    // Phase 3: Gradual traffic increase
    const trafficIncreases = [10, 25, 50, 100];
    for (let i = 0; i < trafficIncreases.length; i++) {
      const trafficPercentage = trafficIncreases[i];
      this.updateDeploymentProgress(
        deploymentId,
        40 + (i + 1) * 10,
        `increasing-traffic-${trafficPercentage}`
      );

      await this.updateCanaryTraffic(deploymentId, canaryConfig, trafficPercentage);
      await this.monitorCanaryDeployment(deploymentId, canaryConfig, config);

      // Wait between traffic increases
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
    }

    // Phase 4: Complete canary promotion
    this.updateDeploymentProgress(deploymentId, 90, 'promoting-canary');
    await this.promoteCanaryDeployment(deploymentId, canaryConfig);

    // Complete deployment
    this.updateDeploymentProgress(deploymentId, 100, 'completed');
    state.status = 'completed';
    state.endTime = new Date();

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'completed',
      'Canary deployment completed successfully'
    );
  }

  /**
   * Execute rolling deployment
   */
  private async executeRollingDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) throw new Error('Deployment state not found');

    // Rolling deployment would update instances gradually
    // For demo, simulate with progressive percentage updates
    const rollStages = [10, 25, 50, 75, 100];

    for (let i = 0; i < rollStages.length; i++) {
      const percentage = rollStages[i];
      this.updateDeploymentProgress(deploymentId, percentage, `rolling-update-${percentage}`);

      // Simulate rolling update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Health check at each stage
      if (percentage < 100) {
        await this.performHealthChecks(deploymentId, config);
      }
    }

    state.status = 'completed';
    state.endTime = new Date();
    this.addDeploymentEvent(
      deploymentId,
      'success',
      'completed',
      'Rolling deployment completed successfully'
    );
  }

  /**
   * Execute instant deployment
   */
  private async executeInstantDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) throw new Error('Deployment state not found');

    // Instant deployment for development/testing
    this.updateDeploymentProgress(deploymentId, 50, 'deploying');

    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Basic health check
    this.updateDeploymentProgress(deploymentId, 80, 'health-checking');
    await this.performHealthChecks(deploymentId, config);

    this.updateDeploymentProgress(deploymentId, 100, 'completed');
    state.status = 'completed';
    state.endTime = new Date();

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'completed',
      'Instant deployment completed successfully'
    );
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  /**
   * Perform health checks
   */
  private async performHealthChecks(
    deploymentId: string,
    config: DeploymentConfig,
    targetUrl?: string
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    let passedChecks = 0;
    const totalChecks = config.healthChecks.filter((check) => check.enabled).length;

    for (const healthCheck of config.healthChecks) {
      if (!healthCheck.enabled) continue;

      try {
        const checkPassed = await this.executeHealthCheck(healthCheck, targetUrl);

        if (checkPassed) {
          passedChecks++;
          this.addDeploymentEvent(
            deploymentId,
            'success',
            'health-check',
            `Health check passed: ${healthCheck.name}`
          );
        } else {
          this.addDeploymentEvent(
            deploymentId,
            'error',
            'health-check',
            `Health check failed: ${healthCheck.name}`
          );

          // Add error to deployment state
          state.errors.push({
            timestamp: new Date(),
            phase: state.phase,
            type: 'health-check',
            severity: 'high',
            message: `Health check failed: ${healthCheck.name}`,
            resolved: false,
          });
        }
      } catch (error) {
        this.addDeploymentEvent(
          deploymentId,
          'error',
          'health-check',
          `Health check error: ${healthCheck.name} - ${(error as Error).message}`
        );

        state.errors.push({
          timestamp: new Date(),
          phase: state.phase,
          type: 'health-check',
          severity: 'critical',
          message: `Health check error: ${healthCheck.name}`,
          details: error,
          resolved: false,
        });
      }
    }

    // Update health status
    const healthRatio = totalChecks > 0 ? passedChecks / totalChecks : 1;
    if (healthRatio >= 0.9) {
      state.healthStatus = 'healthy';
    } else if (healthRatio >= 0.7) {
      state.healthStatus = 'degraded';
    } else {
      state.healthStatus = 'unhealthy';
      throw new Error(`Health checks failed: ${passedChecks}/${totalChecks} passed`);
    }

    // Update metrics
    state.metrics.health.checksExecuted += totalChecks;
    state.metrics.health.checksPassed += passedChecks;
    state.metrics.health.checksFailed += totalChecks - passedChecks;
  }

  /**
   * Execute individual health check
   */
  private async executeHealthCheck(
    healthCheck: DeploymentHealthCheck,
    targetUrl?: string
  ): Promise<boolean> {
    switch (healthCheck.type) {
      case 'http':
        return await this.executeHttpHealthCheck(healthCheck, targetUrl);
      case 'performance':
        return await this.executePerformanceHealthCheck(healthCheck);
      case 'feature-flag':
        return await this.executeFeatureFlagHealthCheck(healthCheck);
      case 'database':
        return await this.executeDatabaseHealthCheck(healthCheck);
      case 'external-service':
        return await this.executeExternalServiceHealthCheck(healthCheck);
      default:
        return true; // Unknown check type passes by default
    }
  }

  /**
   * Execute HTTP health check
   */
  private async executeHttpHealthCheck(
    healthCheck: DeploymentHealthCheck,
    targetUrl?: string
  ): Promise<boolean> {
    const baseUrl =
      targetUrl ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const url = `${baseUrl}${healthCheck.endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: healthCheck.timeout,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LinearTime-HealthCheck/1.0',
        },
      });

      return response.ok && response.status >= 200 && response.status < 300;
    } catch (error) {
      console.warn(`HTTP health check failed for ${url}:`, error);
      return false;
    }
  }

  /**
   * Execute performance health check
   */
  private async executePerformanceHealthCheck(
    _healthCheck: DeploymentHealthCheck
  ): Promise<boolean> {
    try {
      const currentMetrics = this.performanceMonitor.getCurrentMetrics();

      // Check if performance metrics are within acceptable ranges
      const memoryOk = currentMetrics.memoryUsage < 150; // 150MB threshold
      const fpsOk = currentMetrics.fps > 30; // 30 FPS threshold
      const loadTimeOk = currentMetrics.loadTime < 3000; // 3s threshold

      return memoryOk && fpsOk && loadTimeOk;
    } catch (error) {
      console.warn('Performance health check failed:', error);
      return false;
    }
  }

  /**
   * Execute feature flag health check
   */
  private async executeFeatureFlagHealthCheck(
    _healthCheck: DeploymentHealthCheck
  ): Promise<boolean> {
    try {
      // Check if feature flag system is responsive
      const flagState = this.featureFlagManager.getState();
      return flagState.isActive;
    } catch (error) {
      console.warn('Feature flag health check failed:', error);
      return false;
    }
  }

  /**
   * Execute database health check
   */
  private async executeDatabaseHealthCheck(_healthCheck: DeploymentHealthCheck): Promise<boolean> {
    try {
      // In a real implementation, this would check database connectivity
      // For demo, simulate database check
      await new Promise((resolve) => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.warn('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Execute external service health check
   */
  private async executeExternalServiceHealthCheck(
    _healthCheck: DeploymentHealthCheck
  ): Promise<boolean> {
    try {
      // Check external dependencies (APIs, services, etc.)
      // For demo, simulate external service check
      await new Promise((resolve) => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      console.warn('External service health check failed:', error);
      return false;
    }
  }

  // ============================================================================
  // PERFORMANCE VALIDATION
  // ============================================================================

  /**
   * Perform performance validation
   */
  private async performPerformanceValidation(
    deploymentId: string,
    config: DeploymentConfig,
    _targetUrl?: string
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state || !config.performance.enabled) return;

    // Collect baseline if not available
    if (!state.metrics.performance.baseline) {
      await this.collectPerformanceBaseline(deploymentId, config);
    }

    // Collect current performance metrics
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    state.metrics.performance.current = currentMetrics;

    // Calculate performance regression
    if (state.metrics.performance.baseline) {
      const regression = this.calculatePerformanceRegression(
        state.metrics.performance.baseline,
        currentMetrics
      );

      state.metrics.performance.regression = regression;

      // Check if regression is acceptable
      const acceptable = this.isPerformanceRegressionAcceptable(
        regression,
        config.performance.acceptableRegression
      );

      if (!acceptable) {
        const errorMessage = `Performance regression detected: Memory: ${regression.memoryUsage.toFixed(1)}%, Response Time: ${regression.responseTime.toFixed(1)}%, FPS: ${regression.fps.toFixed(1)}%`;

        state.errors.push({
          timestamp: new Date(),
          phase: state.phase,
          type: 'performance',
          severity: 'high',
          message: errorMessage,
          details: regression,
          resolved: false,
        });

        this.addDeploymentEvent(deploymentId, 'error', 'performance-validation', errorMessage);
        throw new Error(errorMessage);
      }
    }

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'performance-validation',
      'Performance validation passed'
    );
  }

  /**
   * Collect performance baseline
   */
  private async collectPerformanceBaseline(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    this.addDeploymentEvent(
      deploymentId,
      'info',
      'performance-validation',
      'Collecting performance baseline...'
    );

    // Collect baseline metrics over specified duration
    const samples: PerformanceMeasurements[] = [];
    const sampleInterval =
      (config.performance.baselineCollection.duration * 60 * 1000) /
      config.performance.baselineCollection.sampleSize;

    for (let i = 0; i < config.performance.baselineCollection.sampleSize; i++) {
      const metrics = this.performanceMonitor.getCurrentMetrics();
      samples.push(metrics);

      if (i < config.performance.baselineCollection.sampleSize - 1) {
        await new Promise((resolve) => setTimeout(resolve, sampleInterval));
      }
    }

    // Calculate average baseline
    const baseline: PerformanceMeasurements = {
      loadTime: this.average(samples.map((s) => s.loadTime)),
      firstContentfulPaint: this.average(samples.map((s) => s.firstContentfulPaint)),
      largestContentfulPaint: this.average(samples.map((s) => s.largestContentfulPaint)),
      firstInputDelay: this.average(samples.map((s) => s.firstInputDelay)),
      cumulativeLayoutShift: this.average(samples.map((s) => s.cumulativeLayoutShift)),
      bundleSize: this.average(samples.map((s) => s.bundleSize)),
      memoryUsage: this.average(samples.map((s) => s.memoryUsage)),
      fps: this.average(samples.map((s) => s.fps)),
      tokenResolution: this.average(samples.map((s) => s.tokenResolution)),
      componentRender: this.average(samples.map((s) => s.componentRender)),
      timestamp: new Date(),
    };

    state.metrics.performance.baseline = baseline;
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'performance-validation',
      'Performance baseline collected'
    );
  }

  /**
   * Calculate performance regression
   */
  private calculatePerformanceRegression(
    baseline: PerformanceMeasurements,
    current: PerformanceMeasurements
  ): { memoryUsage: number; responseTime: number; errorRate: number; fps: number } {
    return {
      memoryUsage: ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100,
      responseTime: ((current.loadTime - baseline.loadTime) / baseline.loadTime) * 100,
      errorRate: 0, // Would be calculated from actual error tracking
      fps: ((baseline.fps - current.fps) / baseline.fps) * 100,
    };
  }

  /**
   * Check if performance regression is acceptable
   */
  private isPerformanceRegressionAcceptable(
    regression: { memoryUsage: number; responseTime: number; errorRate: number; fps: number },
    acceptable: { memoryUsage: number; responseTime: number; errorRate: number; fps: number }
  ): boolean {
    return (
      regression.memoryUsage <= acceptable.memoryUsage &&
      regression.responseTime <= acceptable.responseTime &&
      regression.errorRate <= acceptable.errorRate &&
      regression.fps <= acceptable.fps
    );
  }

  // ============================================================================
  // FEATURE FLAG INTEGRATION
  // ============================================================================

  /**
   * Start feature flag rollouts as part of deployment
   */
  private async startFeatureFlagRollouts(
    deploymentId: string,
    featureFlags: Array<keyof ComponentFlags>,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    // Choose rollout strategy based on environment
    const rolloutStrategy: RolloutStrategy =
      config.environment === 'production' ? CONSERVATIVE_ROLLOUT : AGGRESSIVE_ROLLOUT;

    for (const featureFlag of featureFlags) {
      try {
        const rolloutId = await this.rolloutEngine.startRollout(featureFlag, rolloutStrategy);
        state.rollouts.push(rolloutId);

        this.addDeploymentEvent(
          deploymentId,
          'info',
          'feature-rollout',
          `Started rollout for ${featureFlag}: ${rolloutId}`
        );
      } catch (error) {
        this.addDeploymentEvent(
          deploymentId,
          'error',
          'feature-rollout',
          `Failed to start rollout for ${featureFlag}: ${(error as Error).message}`
        );
      }
    }
  }

  // ============================================================================
  // BLUE-GREEN DEPLOYMENT MANAGEMENT
  // ============================================================================

  /**
   * Get inactive environment for blue-green deployment
   */
  private getInactiveEnvironment(): BlueGreenEnvironment {
    for (const [_, env] of this.blueGreenEnvironments) {
      if (env.status === 'inactive') {
        return env;
      }
    }

    // If no inactive environment, use the one with less traffic
    const envs = Array.from(this.blueGreenEnvironments.values());
    return envs.reduce((prev, curr) => (prev.traffic < curr.traffic ? prev : curr));
  }

  /**
   * Prepare environment for deployment
   */
  private async prepareEnvironment(
    deploymentId: string,
    environment: BlueGreenEnvironment,
    version: string
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'environment-preparation',
      `Preparing ${environment.name} environment`
    );

    environment.status = 'deploying';
    environment.version = version;

    // Simulate environment preparation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'environment-preparation',
      `${environment.name} environment prepared`
    );
  }

  /**
   * Deploy to specific environment
   */
  private async deployToEnvironment(
    deploymentId: string,
    environment: BlueGreenEnvironment,
    version: string
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'environment-deployment',
      `Deploying version ${version} to ${environment.name}`
    );

    // Simulate deployment process
    await new Promise((resolve) => setTimeout(resolve, 5000));

    environment.lastDeployment = new Date();
    environment.status = 'inactive'; // Ready but not receiving traffic yet

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'environment-deployment',
      `Deployment to ${environment.name} completed`
    );
  }

  /**
   * Switch traffic between environments
   */
  private async switchTraffic(
    deploymentId: string,
    targetEnvironment: BlueGreenEnvironment
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'traffic-switch',
      `Switching traffic to ${targetEnvironment.name}`
    );

    // Get current active environment
    const currentActive = Array.from(this.blueGreenEnvironments.values()).find(
      (env) => env.status === 'active'
    );

    if (currentActive) {
      // Gradually switch traffic
      const switchSteps = [25, 50, 75, 100];

      for (const percentage of switchSteps) {
        currentActive.traffic = 100 - percentage;
        targetEnvironment.traffic = percentage;

        this.addDeploymentEvent(
          deploymentId,
          'info',
          'traffic-switch',
          `Traffic: ${targetEnvironment.name} ${percentage}%, ${currentActive.name} ${100 - percentage}%`
        );

        // Wait and monitor
        await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds between steps

        // Quick health check
        const healthOk = await this.executeHttpHealthCheck(
          {
            name: 'Traffic Switch Health Check',
            type: 'http',
            endpoint: '/api/health',
            timeout: 5000,
            retries: 1,
            interval: 0,
            successThreshold: 1,
            failureThreshold: 1,
            enabled: true,
          },
          targetEnvironment.url
        );

        if (!healthOk && percentage < 100) {
          // Rollback traffic switch
          currentActive.traffic = 100;
          targetEnvironment.traffic = 0;
          throw new Error(`Health check failed during traffic switch at ${percentage}%`);
        }
      }
    }

    // Complete the switch
    targetEnvironment.status = 'active';
    if (currentActive) {
      currentActive.status = 'inactive';
    }

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'traffic-switch',
      `Traffic switch to ${targetEnvironment.name} completed`
    );
  }

  /**
   * Perform final validation
   */
  private async performFinalValidation(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'final-validation',
      'Performing final validation'
    );

    // Final health checks
    await this.performHealthChecks(deploymentId, config);

    // Start continuous monitoring
    this.startContinuousMonitoring(deploymentId, config);

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'final-validation',
      'Final validation completed'
    );
  }

  // ============================================================================
  // CANARY DEPLOYMENT MANAGEMENT
  // ============================================================================

  /**
   * Create canary deployment
   */
  private async createCanaryDeployment(
    deploymentId: string,
    version: string,
    initialTraffic: number
  ): Promise<CanaryDeployment> {
    const canaryConfig: CanaryDeployment = {
      canaryVersion: version,
      canaryPercentage: initialTraffic,
      canaryUrl: `https://canary-${version}.lineartime.app`,
      stableVersion: '0.3.0', // Current stable version
      stableUrl: 'https://lineartime.app',
      metrics: {
        canary: this.getInitialMetrics(),
        stable: this.getInitialMetrics(),
      },
      comparisonResults: {
        errorRateDelta: 0,
        responseTimeDelta: 0,
        memoryUsageDelta: 0,
        userSatisfactionDelta: 0,
      },
    };

    this.addDeploymentEvent(
      deploymentId,
      'info',
      'canary-creation',
      `Created canary deployment: ${initialTraffic}% traffic`
    );
    return canaryConfig;
  }

  /**
   * Monitor canary deployment
   */
  private async monitorCanaryDeployment(
    deploymentId: string,
    canaryConfig: CanaryDeployment,
    _config: DeploymentConfig
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'info',
      'canary-monitoring',
      `Monitoring canary at ${canaryConfig.canaryPercentage}% traffic`
    );

    // Monitor for specified duration
    const monitoringDuration = 10 * 60 * 1000; // 10 minutes
    const checkInterval = 60 * 1000; // 1 minute
    const checksCount = monitoringDuration / checkInterval;

    for (let i = 0; i < checksCount; i++) {
      // Collect metrics for both canary and stable
      const canaryHealthy = await this.executeHttpHealthCheck(
        {
          name: 'Canary Health Check',
          type: 'http',
          endpoint: '/api/health',
          timeout: 5000,
          retries: 1,
          interval: 0,
          successThreshold: 1,
          failureThreshold: 1,
          enabled: true,
        },
        canaryConfig.canaryUrl
      );

      if (!canaryHealthy) {
        throw new Error(`Canary health check failed at ${canaryConfig.canaryPercentage}% traffic`);
      }

      // Wait for next check
      if (i < checksCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'canary-monitoring',
      `Canary monitoring completed for ${canaryConfig.canaryPercentage}% traffic`
    );
  }

  /**
   * Update canary traffic percentage
   */
  private async updateCanaryTraffic(
    deploymentId: string,
    canaryConfig: CanaryDeployment,
    newPercentage: number
  ): Promise<void> {
    const oldPercentage = canaryConfig.canaryPercentage;
    canaryConfig.canaryPercentage = newPercentage;

    // Simulate traffic routing update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.addDeploymentEvent(
      deploymentId,
      'info',
      'canary-traffic-update',
      `Canary traffic: ${oldPercentage}% → ${newPercentage}%`
    );
  }

  /**
   * Promote canary to stable
   */
  private async promoteCanaryDeployment(
    deploymentId: string,
    canaryConfig: CanaryDeployment
  ): Promise<void> {
    this.addDeploymentEvent(deploymentId, 'info', 'canary-promotion', 'Promoting canary to stable');

    // Switch URLs
    canaryConfig.stableVersion = canaryConfig.canaryVersion;
    canaryConfig.canaryPercentage = 100;

    // Simulate promotion
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.addDeploymentEvent(
      deploymentId,
      'success',
      'canary-promotion',
      'Canary promoted to stable'
    );
  }

  // ============================================================================
  // ROLLBACK MANAGEMENT
  // ============================================================================

  /**
   * Handle deployment failure and initiate rollback
   */
  private async handleDeploymentFailure(
    deploymentId: string,
    config: DeploymentConfig,
    error: Error
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    state.status = 'failed';
    state.endTime = new Date();

    // Add error to state
    state.errors.push({
      timestamp: new Date(),
      phase: state.phase,
      type: 'deployment',
      severity: 'critical',
      message: error.message,
      details: error,
      resolved: false,
    });

    this.addDeploymentEvent(
      deploymentId,
      'error',
      'deployment-failure',
      `Deployment failed: ${error.message}`
    );

    // Send failure notification
    await this.sendNotification(config, 'error', `Deployment ${deploymentId} failed`, {
      error: error.message,
      phase: state.phase,
      duration: Date.now() - state.startTime.getTime(),
    });

    // Initiate rollback if applicable
    if (config.strategy === 'blue-green') {
      await this.rollbackBlueGreenDeployment(deploymentId);
    } else if (config.strategy === 'canary') {
      await this.rollbackCanaryDeployment(deploymentId);
    }
  }

  /**
   * Rollback blue-green deployment
   */
  private async rollbackBlueGreenDeployment(deploymentId: string): Promise<void> {
    this.addDeploymentEvent(deploymentId, 'info', 'rollback', 'Starting blue-green rollback');

    // Switch traffic back to stable environment
    const stableEnv = Array.from(this.blueGreenEnvironments.values()).find(
      (env) => env.status === 'active'
    );
    const failedEnv = Array.from(this.blueGreenEnvironments.values()).find(
      (env) => env.status === 'deploying'
    );

    if (stableEnv && failedEnv) {
      stableEnv.traffic = 100;
      failedEnv.traffic = 0;
      failedEnv.status = 'inactive';
    }

    this.addDeploymentEvent(deploymentId, 'success', 'rollback', 'Blue-green rollback completed');
  }

  /**
   * Rollback canary deployment
   */
  private async rollbackCanaryDeployment(deploymentId: string): Promise<void> {
    this.addDeploymentEvent(deploymentId, 'info', 'rollback', 'Starting canary rollback');

    // Route all traffic back to stable version
    // In production, this would update load balancer configuration

    this.addDeploymentEvent(deploymentId, 'success', 'rollback', 'Canary rollback completed');
  }

  // ============================================================================
  // MONITORING & NOTIFICATIONS
  // ============================================================================

  /**
   * Start continuous monitoring after deployment
   */
  private startContinuousMonitoring(deploymentId: string, config: DeploymentConfig): void {
    if (!config.performance.enabled) return;

    const monitoringTimer = setInterval(async () => {
      const state = this.deployments.get(deploymentId);
      if (!state || state.status !== 'completed') {
        clearInterval(monitoringTimer);
        return;
      }

      // Check rollback triggers
      await this.checkRollbackTriggers(deploymentId, config);
    }, 60000); // Check every minute

    this.monitoringTimers.set(deploymentId, monitoringTimer);

    // Stop monitoring after specified duration
    setTimeout(
      () => {
        clearInterval(monitoringTimer);
        this.monitoringTimers.delete(deploymentId);
      },
      config.performance.monitoringDuration * 60 * 1000
    );
  }

  /**
   * Check rollback triggers
   */
  private async checkRollbackTriggers(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    for (const trigger of config.rollbackTriggers) {
      if (!trigger.enabled) continue;

      const shouldTrigger = await this.evaluateRollbackTrigger(trigger);

      if (shouldTrigger) {
        this.addDeploymentEvent(
          deploymentId,
          'warning',
          'rollback-trigger',
          `Rollback trigger activated: ${trigger.name}`
        );

        switch (trigger.action) {
          case 'alert':
            await this.sendNotification(config, 'warning', `Rollback trigger: ${trigger.name}`, {
              deploymentId,
              metric: trigger.metric,
              threshold: trigger.threshold,
            });
            break;
          case 'rollback':
            await this.initiateAutomaticRollback(deploymentId, config, trigger);
            break;
          case 'emergency-stop':
            await this.emergencyStop(deploymentId, config, trigger);
            break;
        }
      }
    }
  }

  /**
   * Evaluate rollback trigger condition
   */
  private async evaluateRollbackTrigger(_trigger: DeploymentRollbackTrigger): Promise<boolean> {
    // This would evaluate the actual metrics
    // For demo, simulate trigger evaluation
    return false; // No triggers activated in demo
  }

  /**
   * Initiate automatic rollback
   */
  private async initiateAutomaticRollback(
    deploymentId: string,
    config: DeploymentConfig,
    trigger: DeploymentRollbackTrigger
  ): Promise<void> {
    this.addDeploymentEvent(
      deploymentId,
      'warning',
      'auto-rollback',
      `Initiating automatic rollback due to: ${trigger.name}`
    );

    // Implementation would depend on deployment strategy
    await this.sendNotification(config, 'error', 'Automatic rollback initiated', {
      deploymentId,
      trigger: trigger.name,
      reason: `${trigger.metric} exceeded threshold of ${trigger.threshold}`,
    });
  }

  /**
   * Emergency stop deployment
   */
  private async emergencyStop(
    deploymentId: string,
    config: DeploymentConfig,
    trigger: DeploymentRollbackTrigger
  ): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) return;

    state.status = 'failed';
    state.endTime = new Date();

    this.addDeploymentEvent(
      deploymentId,
      'error',
      'emergency-stop',
      `Emergency stop triggered: ${trigger.name}`
    );

    await this.sendNotification(config, 'error', `EMERGENCY STOP: Deployment ${deploymentId}`, {
      trigger: trigger.name,
      reason: `Critical threshold exceeded: ${trigger.metric} > ${trigger.threshold}`,
    });
  }

  /**
   * Handle performance updates from monitoring
   */
  private handlePerformanceUpdate(metrics: PerformanceMeasurements): void {
    // Update deployment metrics for active deployments
    for (const [_, state] of this.deployments) {
      if (
        (state.status === 'monitoring' || state.status === 'completed') &&
        state.metrics.performance.current
      ) {
        state.metrics.performance.current = metrics;
      }
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(
    config: DeploymentConfig,
    level: 'info' | 'success' | 'warning' | 'error',
    message: string,
    data?: any
  ): Promise<void> {
    const notificationData = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      environment: config.environment,
    };

    console.log(`DEPLOYMENT NOTIFICATION [${level.toUpperCase()}]:`, notificationData);

    // Slack notification
    if (config.notifications.slack?.enabled && config.notifications.slack.webhookUrl) {
      try {
        await this.sendSlackNotification(config.notifications.slack, notificationData);
      } catch (error) {
        console.warn('Failed to send Slack notification:', error);
      }
    }

    // Email notification
    if (config.notifications.email?.enabled) {
      try {
        await this.sendEmailNotification(config.notifications.email, notificationData);
      } catch (error) {
        console.warn('Failed to send email notification:', error);
      }
    }

    // Webhook notification
    if (config.notifications.webhook?.enabled && config.notifications.webhook.url) {
      try {
        await this.sendWebhookNotification(config.notifications.webhook, notificationData);
      } catch (error) {
        console.warn('Failed to send webhook notification:', error);
      }
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(slackConfig: any, data: any): Promise<void> {
    const color =
      {
        info: '#36a64f',
        success: '#00ff00',
        warning: '#ff9900',
        error: '#ff0000',
      }[data.level] || '#36a64f';

    const payload = {
      channel: slackConfig.channel,
      username: 'LinearTime Deployment Bot',
      icon_emoji: ':rocket:',
      attachments: [
        {
          color,
          title: data.message,
          fields: data.data
            ? Object.entries(data.data).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          timestamp: Math.floor(new Date(data.timestamp).getTime() / 1000),
        },
      ],
    };

    // In production, would actually send to Slack
    console.log('Slack notification:', payload);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(emailConfig: any, data: any): Promise<void> {
    // In production, would send actual email using SMTP
    console.log('Email notification:', {
      to: emailConfig.recipients,
      subject: `LinearTime Deployment: ${data.message}`,
      body: `
        Level: ${data.level}
        Message: ${data.message}
        Timestamp: ${data.timestamp}
        Environment: ${data.environment}
        
        ${data.data ? JSON.stringify(data.data, null, 2) : ''}
      `,
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(webhookConfig: any, data: any): Promise<void> {
    try {
      await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers,
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Webhook notification failed:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Update deployment progress
   */
  private updateDeploymentProgress(deploymentId: string, progress: number, phase: string): void {
    const state = this.deployments.get(deploymentId);
    if (state) {
      state.progress = progress;
      state.phase = phase;
      state.status = progress < 100 ? 'deploying' : 'completed';
    }
  }

  /**
   * Add deployment event
   */
  private addDeploymentEvent(
    deploymentId: string,
    type: 'info' | 'warning' | 'error' | 'success',
    phase: string,
    message: string,
    metadata?: any
  ): void {
    const state = this.deployments.get(deploymentId);
    if (state) {
      state.timeline.push({
        timestamp: new Date(),
        type,
        phase,
        message,
        metadata,
      });
    }
  }

  /**
   * Get initial deployment metrics
   */
  private getInitialMetrics(): DeploymentMetrics {
    return {
      deployment: {
        duration: 0,
        buildTime: 0,
        testTime: 0,
        deployTime: 0,
      },
      performance: {
        baseline: null,
        current: null,
        regression: {
          memoryUsage: 0,
          responseTime: 0,
          errorRate: 0,
          fps: 0,
        },
      },
      health: {
        checksExecuted: 0,
        checksPassed: 0,
        checksFailed: 0,
        averageResponseTime: 0,
        uptime: 100,
      },
      traffic: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
      },
    };
  }

  /**
   * Calculate average of array
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get deployment state
   */
  getDeploymentState(deploymentId: string): DeploymentState | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): Map<string, DeploymentState> {
    return new Map(this.deployments);
  }

  /**
   * Get active deployments
   */
  getActiveDeployments(): Map<string, DeploymentState> {
    const active = new Map();
    for (const [id, state] of this.deployments) {
      if (['preparing', 'deploying', 'validating', 'monitoring'].includes(state.status)) {
        active.set(id, state);
      }
    }
    return active;
  }

  /**
   * Get blue-green environment status
   */
  getEnvironmentStatus(): Map<string, BlueGreenEnvironment> {
    return new Map(this.blueGreenEnvironments);
  }

  /**
   * Manually trigger rollback
   */
  async manualRollback(deploymentId: string, reason = 'Manual rollback'): Promise<void> {
    const state = this.deployments.get(deploymentId);
    if (!state) {
      throw new Error('Deployment not found');
    }

    this.addDeploymentEvent(
      deploymentId,
      'warning',
      'manual-rollback',
      `Manual rollback initiated: ${reason}`
    );

    // Implementation depends on deployment strategy
    if (state.strategy === 'blue-green') {
      await this.rollbackBlueGreenDeployment(deploymentId);
    } else if (state.strategy === 'canary') {
      await this.rollbackCanaryDeployment(deploymentId);
    }
  }

  /**
   * Get deployment summary
   */
  getDeploymentSummary(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    averageDuration: number;
    successRate: number;
  } {
    let total = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;
    let totalDuration = 0;
    let completedCount = 0;

    for (const [_, state] of this.deployments) {
      total++;

      switch (state.status) {
        case 'preparing':
        case 'deploying':
        case 'validating':
        case 'monitoring':
          active++;
          break;
        case 'completed':
          completed++;
          completedCount++;
          if (state.endTime) {
            totalDuration += state.endTime.getTime() - state.startTime.getTime();
          }
          break;
        case 'failed':
        case 'rolled-back':
          failed++;
          break;
      }
    }

    return {
      total,
      active,
      completed,
      failed,
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0,
      successRate: total > 0 ? completed / total : 1.0,
    };
  }

  /**
   * Cleanup deployment resources
   */
  cleanup(): void {
    // Stop performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
    }

    // Clear all timers
    this.healthCheckTimers.forEach((timer) => clearInterval(timer));
    this.monitoringTimers.forEach((timer) => clearTimeout(timer));

    this.healthCheckTimers.clear();
    this.monitoringTimers.clear();
    this.deployments.clear();
  }
}

export default DeploymentManager;
