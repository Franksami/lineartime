/**
 * Feature Flag Management System - Phase 5.0 Week 7-8
 *
 * Complete feature flag management for all 11 Phase 5.0 components with:
 * - Component-level control
 * - Gradual rollout engine
 * - Emergency rollback capability
 * - Real-time performance monitoring integration
 *
 * Based on Vercel Flags patterns with Next.js Edge Config integration
 */

import { nanoid } from 'nanoid';
// Server-only imports - commented out for client compatibility
// import { cookies, headers } from 'next/headers';
import { FeatureFlagProvider, dedupe, flag, useFeatureFlags } from './modernFeatureFlags';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ComponentFlags {
  // AI Enhancement Components (Phase 5.0)
  ENABLE_AI_CAPACITY_RIBBON: boolean;
  ENABLE_AI_CONFLICT_DETECTOR: boolean;
  ENABLE_AI_NLP_INPUT: boolean;
  ENABLE_AI_SMART_SCHEDULING: boolean;
  ENABLE_AI_INSIGHT_PANEL: boolean;

  // Motion System Components
  ENABLE_MOTION_ENHANCED_WRAPPER: boolean;
  ENABLE_TOUCH_GESTURE_HANDLER: boolean;
  ENABLE_LIBRARY_TRANSITION_ANIMATOR: boolean;

  // Real-time Sync Components
  ENABLE_WEBSOCKET_SYNC_MANAGER: boolean;
  ENABLE_OPTIMISTIC_UPDATE_HANDLER: boolean;
  ENABLE_LIVE_COLLABORATION_LAYER: boolean;
}

export interface RolloutStrategy {
  strategy: 'percentage' | 'userGroup' | 'geographic' | 'betaTesting' | 'canary';
  percentage?: number;
  userGroups?: string[];
  geographic?: string[];
  betaUsers?: boolean;
  canaryUsers?: boolean;
  schedule?: {
    startDate: Date;
    phases: RolloutPhase[];
  };
}

export interface RolloutPhase {
  name: string;
  percentage: number;
  duration: number; // hours
  criteria: RolloutCriteria;
  rollbackTriggers: RollbackTrigger[];
}

export interface RolloutCriteria {
  minSuccessRate: number; // 0.99 = 99%
  maxErrorRate: number; // 0.01 = 1%
  maxMemoryUsage: number; // MB
  minFPS: number;
  maxLoadTime: number; // ms
}

export interface RollbackTrigger {
  metric: 'errorRate' | 'memoryUsage' | 'fps' | 'loadTime' | 'userReports';
  threshold: number;
  action: 'disable_feature' | 'rollback_phase' | 'emergency_stop';
  cooldownPeriod?: number; // minutes
}

export interface PerformanceThresholds {
  memoryUsage: { threshold: number; action: string };
  errorRate: { threshold: number; action: string };
  loadTime: { threshold: number; action: string };
  fps: { threshold: number; action: string };
  webSocketLatency: { threshold: number; action: string };
}

export interface AlertingConfig {
  webhookUrl?: string;
  slackChannel?: string;
  emailRecipients?: string[];
  alertThresholds: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface FeatureFlagConfig {
  components: ComponentFlags;
  rollout: RolloutStrategy;
  monitoring: {
    performanceThresholds: PerformanceThresholds;
    alerting: AlertingConfig;
    rollbackTriggers: RollbackTrigger[];
  };
  metadata: {
    version: string;
    deploymentId: string;
    environment: 'development' | 'staging' | 'production';
    lastUpdated: Date;
  };
}

export interface FeatureFlagState {
  userId: string;
  sessionId: string;
  userGroup: string;
  isActive: boolean;
  rolloutPercentage: number;
  enabledFeatures: string[];
  performanceMetrics?: {
    memoryUsage: number;
    fps: number;
    errorRate: number;
    loadTime: number;
  };
}

// ============================================================================
// USER IDENTIFICATION & CONTEXT
// ============================================================================

/**
 * Generate or retrieve consistent visitor ID using Vercel Flags dedupe pattern
 */
export const getOrGenerateVisitorId = dedupe(
  async (): Promise<{ value: string; fresh: boolean }> => {
    // Client-side fallback - use localStorage or generate new ID
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('linear-visitor-id');
      if (storedId) {
        return { value: storedId, fresh: false };
      }
      const newId = nanoid();
      localStorage.setItem('linear-visitor-id', newId);
      return { value: newId, fresh: true };
    }

    // Server-side would use cookies here
    // const cookieStore = await cookies();
    // const visitorIdCookie = cookieStore.get('linear-visitor-id')?.value;
    // return visitorIdCookie
    //   ? { value: visitorIdCookie, fresh: false }
    //   : { value: nanoid(), fresh: true };

    return { value: nanoid(), fresh: true };
  }
);

/**
 * Get user context for feature flag decisions
 */
export const getUserContext = dedupe(async () => {
  const visitorId = await getOrGenerateVisitorId();

  // Client-side fallback
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent || '';
    const referer = document.referrer || '';

    // Determine user group based on various factors
    let userGroup = 'default';
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      userGroup = 'bot';
    } else if (referer.includes('beta.') || referer.includes('staging.')) {
      userGroup = 'beta';
    } else if (visitorId.value.startsWith('premium_')) {
      userGroup = 'premium';
    }

    return {
      userId: visitorId.value,
      userGroup,
      userAgent,
      referer,
      timestamp: new Date(),
      isNewUser: visitorId.fresh,
    };
  }

  // Server-side fallback (commented out for client compatibility)
  // const headersList = await headers();
  // const userAgent = headersList.get('user-agent') || '';
  // const referer = headersList.get('referer') || '';

  return {
    userId: visitorId.value,
    userGroup: 'default',
    userAgent: '',
    referer: '',
    timestamp: new Date(),
    isNewUser: visitorId.fresh,
  };
});

// ============================================================================
// PHASE-BASED ROLLOUT CONFIGURATION
// ============================================================================

/**
 * Week 7-8 deployment phases configuration
 */
export const PHASE_5_ROLLOUT_PHASES: RolloutPhase[] = [
  {
    name: 'Phase 1: Motion System Foundation',
    percentage: 1,
    duration: 24, // 24 hours
    criteria: {
      minSuccessRate: 0.99,
      maxErrorRate: 0.01,
      maxMemoryUsage: 100, // 100MB
      minFPS: 30,
      maxLoadTime: 2000,
    },
    rollbackTriggers: [
      {
        metric: 'fps',
        threshold: 30,
        action: 'disable_feature',
        cooldownPeriod: 60,
      },
      {
        metric: 'memoryUsage',
        threshold: 120,
        action: 'rollback_phase',
      },
    ],
  },
  {
    name: 'Phase 2: AI Enhancement Core',
    percentage: 10,
    duration: 48,
    criteria: {
      minSuccessRate: 0.995,
      maxErrorRate: 0.005,
      maxMemoryUsage: 110,
      minFPS: 30,
      maxLoadTime: 2500,
    },
    rollbackTriggers: [
      {
        metric: 'errorRate',
        threshold: 0.01,
        action: 'rollback_phase',
      },
      {
        metric: 'loadTime',
        threshold: 3000,
        action: 'disable_feature',
      },
    ],
  },
  {
    name: 'Phase 3: Real-time Foundation',
    percentage: 25,
    duration: 72,
    criteria: {
      minSuccessRate: 0.99,
      maxErrorRate: 0.01,
      maxMemoryUsage: 120,
      minFPS: 30,
      maxLoadTime: 2000,
    },
    rollbackTriggers: [
      {
        metric: 'webSocketLatency',
        threshold: 1000,
        action: 'disable_feature',
      },
    ],
  },
  {
    name: 'Phase 4: Full Collaboration Suite',
    percentage: 50,
    duration: 96,
    criteria: {
      minSuccessRate: 0.995,
      maxErrorRate: 0.005,
      maxMemoryUsage: 130,
      minFPS: 30,
      maxLoadTime: 2500,
    },
    rollbackTriggers: [
      {
        metric: 'memoryUsage',
        threshold: 150,
        action: 'emergency_stop',
      },
    ],
  },
  {
    name: 'Phase 5: Performance Optimizations',
    percentage: 100,
    duration: 168, // 1 week
    criteria: {
      minSuccessRate: 0.99,
      maxErrorRate: 0.01,
      maxMemoryUsage: 100,
      minFPS: 60,
      maxLoadTime: 1500,
    },
    rollbackTriggers: [],
  },
];

// ============================================================================
// FEATURE FLAG DEFINITIONS
// ============================================================================

/**
 * AI Capacity Ribbon - Shows AI processing capacity and suggestions
 */
export const aiCapacityRibbonFlag = flag<boolean>({
  key: 'ai-capacity-ribbon',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('ai-capacity-ribbon');

    // Beta users always enabled
    if (context.userGroup === 'beta') return true;

    // Premium users get early access
    if (context.userGroup === 'premium' && rolloutPercentage >= 10) return true;

    // Standard rollout based on user ID hash
    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
  options: [
    { value: true, label: 'AI Capacity Ribbon Enabled' },
    { value: false, label: 'AI Capacity Ribbon Disabled' },
  ],
});

/**
 * AI Conflict Detector - Detects and resolves calendar conflicts
 */
export const aiConflictDetectorFlag = flag<boolean>({
  key: 'ai-conflict-detector',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('ai-conflict-detector');

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 10) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * AI Natural Language Processing Input
 */
export const aiNlpInputFlag = flag<boolean>({
  key: 'ai-nlp-input',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('ai-nlp-input');

    // Skip bots
    if (context.userGroup === 'bot') return false;

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 10) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * AI Smart Scheduling - Intelligent event scheduling suggestions
 */
export const aiSmartSchedulingFlag = flag<boolean>({
  key: 'ai-smart-scheduling',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('ai-smart-scheduling');

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 25) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * AI Insight Panel - Analytics and insights dashboard
 */
export const aiInsightPanelFlag = flag<boolean>({
  key: 'ai-insight-panel',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('ai-insight-panel');

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 50) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * Motion Enhanced Wrapper - Advanced animations and transitions
 */
export const motionEnhancedWrapperFlag = flag<boolean>({
  key: 'motion-enhanced-wrapper',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('motion-enhanced-wrapper');

    // Check for reduced motion preference
    const prefersReducedMotion = await checkReducedMotionPreference();
    if (prefersReducedMotion) return false;

    if (context.userGroup === 'beta') return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * Touch Gesture Handler - Advanced touch and gesture support
 */
export const touchGestureHandlerFlag = flag<boolean>({
  key: 'touch-gesture-handler',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('touch-gesture-handler');

    // Only enable on mobile devices
    const isMobile = context.userAgent.includes('Mobile') || context.userAgent.includes('Android');
    if (!isMobile) return false;

    if (context.userGroup === 'beta') return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * Library Transition Animator - Smooth transitions between calendar libraries
 */
export const libraryTransitionAnimatorFlag = flag<boolean>({
  key: 'library-transition-animator',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('library-transition-animator');

    const prefersReducedMotion = await checkReducedMotionPreference();
    if (prefersReducedMotion) return false;

    if (context.userGroup === 'beta') return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * WebSocket Sync Manager - Real-time synchronization
 */
export const webSocketSyncManagerFlag = flag<boolean>({
  key: 'websocket-sync-manager',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('websocket-sync-manager');

    // Skip bots
    if (context.userGroup === 'bot') return false;

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 25) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * Optimistic Update Handler - Immediate UI updates with server sync
 */
export const optimisticUpdateHandlerFlag = flag<boolean>({
  key: 'optimistic-update-handler',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('optimistic-update-handler');

    if (context.userGroup === 'bot') return false;

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 25) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

/**
 * Live Collaboration Layer - Real-time multi-user collaboration
 */
export const liveCollaborationLayerFlag = flag<boolean>({
  key: 'live-collaboration-layer',
  decide: async () => {
    const context = await getUserContext();
    const rolloutPercentage = await getCurrentRolloutPercentage('live-collaboration-layer');

    if (context.userGroup === 'bot') return false;

    if (context.userGroup === 'beta') return true;
    if (context.userGroup === 'premium' && rolloutPercentage >= 50) return true;

    const userHash = hashUserId(context.userId);
    return userHash < rolloutPercentage;
  },
});

// ============================================================================
// FEATURE FLAG COLLECTIONS
// ============================================================================

/**
 * All Phase 5.0 feature flags for precomputation
 */
export const allPhase5Flags = [
  aiCapacityRibbonFlag,
  aiConflictDetectorFlag,
  aiNlpInputFlag,
  aiSmartSchedulingFlag,
  aiInsightPanelFlag,
  motionEnhancedWrapperFlag,
  touchGestureHandlerFlag,
  libraryTransitionAnimatorFlag,
  webSocketSyncManagerFlag,
  optimisticUpdateHandlerFlag,
  liveCollaborationLayerFlag,
];

/**
 * AI Enhancement flags group
 */
export const aiEnhancementFlags = [
  aiCapacityRibbonFlag,
  aiConflictDetectorFlag,
  aiNlpInputFlag,
  aiSmartSchedulingFlag,
  aiInsightPanelFlag,
];

/**
 * Motion System flags group
 */
export const motionSystemFlags = [
  motionEnhancedWrapperFlag,
  touchGestureHandlerFlag,
  libraryTransitionAnimatorFlag,
];

/**
 * Real-time Sync flags group
 */
export const realtimeSyncFlags = [
  webSocketSyncManagerFlag,
  optimisticUpdateHandlerFlag,
  liveCollaborationLayerFlag,
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hash user ID to consistent percentage (0-100)
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Get current rollout percentage for a feature
 */
async function getCurrentRolloutPercentage(_featureKey: string): Promise<number> {
  try {
    // In production, this would fetch from Edge Config or database
    // For now, return phase-based percentages
    const now = new Date();
    const currentPhase = getCurrentDeploymentPhase(now);
    return currentPhase?.percentage || 0;
  } catch (error) {
    console.warn('Failed to get rollout percentage:', error);
    return 0; // Safe default - feature disabled
  }
}

/**
 * Determine current deployment phase based on time
 */
function getCurrentDeploymentPhase(now: Date): RolloutPhase | null {
  // This would typically be stored in database/Edge Config
  // For demo, use hardcoded logic
  const deploymentStart = new Date('2024-12-01'); // Example start date
  const hoursElapsed = (now.getTime() - deploymentStart.getTime()) / (1000 * 60 * 60);

  let cumulativeHours = 0;
  for (const phase of PHASE_5_ROLLOUT_PHASES) {
    if (hoursElapsed <= cumulativeHours + phase.duration) {
      return phase;
    }
    cumulativeHours += phase.duration;
  }

  // Return final phase if past all phases
  return PHASE_5_ROLLOUT_PHASES[PHASE_5_ROLLOUT_PHASES.length - 1];
}

/**
 * Check user's reduced motion preference
 */
async function checkReducedMotionPreference(): Promise<boolean> {
  try {
    // Client-side implementation
    if (typeof window !== 'undefined') {
      // Check CSS media query for prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return true;

      // Check localStorage preference
      const motionPreference = localStorage.getItem('motion-preference');
      return motionPreference === 'reduced';
    }

    // Server-side would check cookies/database here
    // const cookieStore = await cookies();
    // const motionPreference = cookieStore.get('motion-preference')?.value;
    // return motionPreference === 'reduced';

    return false; // Default to allowing motion
  } catch {
    return false; // Default to allowing motion
  }
}

// ============================================================================
// FEATURE FLAG MANAGER CLASS
// ============================================================================

/**
 * Main Feature Flag Manager
 */
export class FeatureFlagManager {
  private config: FeatureFlagConfig;
  private state: FeatureFlagState;
  private performanceMonitor?: any; // PerformanceMeasurementSystem
  private rollbackTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.state = {
      userId: '',
      sessionId: nanoid(),
      userGroup: 'default',
      isActive: true,
      rolloutPercentage: 0,
      enabledFeatures: [],
    };
  }

  /**
   * Initialize feature flag manager
   */
  async initialize(userId?: string): Promise<void> {
    const context = await getUserContext();
    this.state.userId = userId || context.userId;
    this.state.userGroup = context.userGroup;

    // Get enabled features for this user
    this.state.enabledFeatures = await this.getEnabledFeatures();

    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      await this.initializePerformanceMonitoring();
    }

    // Set up rollback monitoring
    this.setupRollbackMonitoring();
  }

  /**
   * Check if a specific feature is enabled
   */
  async isFeatureEnabled(featureKey: keyof ComponentFlags): Promise<boolean> {
    try {
      // Check kill switch first
      if (await this.isKillSwitchActive(featureKey)) {
        return false;
      }

      // Evaluate flag
      switch (featureKey) {
        case 'ENABLE_AI_CAPACITY_RIBBON':
          return await aiCapacityRibbonFlag();
        case 'ENABLE_AI_CONFLICT_DETECTOR':
          return await aiConflictDetectorFlag();
        case 'ENABLE_AI_NLP_INPUT':
          return await aiNlpInputFlag();
        case 'ENABLE_AI_SMART_SCHEDULING':
          return await aiSmartSchedulingFlag();
        case 'ENABLE_AI_INSIGHT_PANEL':
          return await aiInsightPanelFlag();
        case 'ENABLE_MOTION_ENHANCED_WRAPPER':
          return await motionEnhancedWrapperFlag();
        case 'ENABLE_TOUCH_GESTURE_HANDLER':
          return await touchGestureHandlerFlag();
        case 'ENABLE_LIBRARY_TRANSITION_ANIMATOR':
          return await libraryTransitionAnimatorFlag();
        case 'ENABLE_WEBSOCKET_SYNC_MANAGER':
          return await webSocketSyncManagerFlag();
        case 'ENABLE_OPTIMISTIC_UPDATE_HANDLER':
          return await optimisticUpdateHandlerFlag();
        case 'ENABLE_LIVE_COLLABORATION_LAYER':
          return await liveCollaborationLayerFlag();
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Feature flag evaluation failed for ${featureKey}:`, error);
      return false; // Safe default
    }
  }

  /**
   * Get all enabled features for current user
   */
  async getEnabledFeatures(): Promise<string[]> {
    const features: string[] = [];
    const flagKeys = Object.keys(this.config.components) as Array<keyof ComponentFlags>;

    for (const key of flagKeys) {
      if (await this.isFeatureEnabled(key)) {
        features.push(key);
      }
    }

    return features;
  }

  /**
   * Emergency disable feature (kill switch)
   */
  async emergencyDisableFeature(featureKey: keyof ComponentFlags, reason: string): Promise<void> {
    try {
      // Set kill switch in Edge Config
      await this.setKillSwitch(featureKey, true, reason);

      // Log emergency action
      console.error(`EMERGENCY: Disabled feature ${featureKey} - Reason: ${reason}`);

      // Send alert
      await this.sendAlert('critical', `Emergency feature disable: ${featureKey}`, reason);

      // Update local state
      const index = this.state.enabledFeatures.indexOf(featureKey);
      if (index > -1) {
        this.state.enabledFeatures.splice(index, 1);
      }
    } catch (error) {
      console.error('Failed to emergency disable feature:', error);
    }
  }

  /**
   * Check if kill switch is active for feature
   */
  private async isKillSwitchActive(featureKey: keyof ComponentFlags): Promise<boolean> {
    try {
      // In production, check Edge Config or database
      // For demo, use localStorage as fallback
      if (typeof window !== 'undefined') {
        const killSwitches = JSON.parse(localStorage.getItem('linear-kill-switches') || '{}');
        return killSwitches[featureKey] === true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Set kill switch state
   */
  private async setKillSwitch(
    featureKey: keyof ComponentFlags,
    active: boolean,
    reason: string
  ): Promise<void> {
    if (typeof window !== 'undefined') {
      const killSwitches = JSON.parse(localStorage.getItem('linear-kill-switches') || '{}');
      if (active) {
        killSwitches[featureKey] = { active: true, reason, timestamp: new Date().toISOString() };
      } else {
        delete killSwitches[featureKey];
      }
      localStorage.setItem('linear-kill-switches', JSON.stringify(killSwitches));
    }
  }

  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      // Import and initialize PerformanceMeasurementSystem
      const { PerformanceMeasurementSystem } = await import(
        '../performance/performanceMeasurement'
      );

      this.performanceMonitor = new PerformanceMeasurementSystem({
        collectWebVitals: true,
        collectMemoryMetrics: true,
        collectBundleMetrics: true,
        collectDesignSystemMetrics: true,
        onMeasurement: (metrics) => {
          this.handlePerformanceMetrics(metrics);
        },
      });

      this.performanceMonitor.start();
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Handle performance metrics updates
   */
  private handlePerformanceMetrics(metrics: any): void {
    this.state.performanceMetrics = {
      memoryUsage: metrics.memoryUsage,
      fps: metrics.fps,
      errorRate: 0, // Would be calculated from error tracking
      loadTime: metrics.loadTime,
    };

    // Check rollback triggers
    this.checkRollbackTriggers(metrics);
  }

  /**
   * Check if performance metrics trigger rollbacks
   */
  private checkRollbackTriggers(metrics: any): void {
    const triggers = this.config.monitoring.rollbackTriggers;

    for (const trigger of triggers) {
      let shouldTrigger = false;
      let metricValue = 0;

      switch (trigger.metric) {
        case 'memoryUsage':
          metricValue = metrics.memoryUsage;
          shouldTrigger = metricValue > trigger.threshold;
          break;
        case 'fps':
          metricValue = metrics.fps;
          shouldTrigger = metricValue < trigger.threshold;
          break;
        case 'loadTime':
          metricValue = metrics.loadTime;
          shouldTrigger = metricValue > trigger.threshold;
          break;
      }

      if (shouldTrigger) {
        this.executeRollbackAction(trigger, metricValue);
      }
    }
  }

  /**
   * Execute rollback action
   */
  private async executeRollbackAction(
    trigger: RollbackTrigger,
    metricValue: number
  ): Promise<void> {
    const reason = `${trigger.metric} threshold exceeded: ${metricValue} > ${trigger.threshold}`;

    switch (trigger.action) {
      case 'disable_feature': {
        // Disable the most recent feature that could cause the issue
        const latestFeature = this.state.enabledFeatures[this.state.enabledFeatures.length - 1];
        if (latestFeature) {
          await this.emergencyDisableFeature(latestFeature as keyof ComponentFlags, reason);
        }
        break;
      }

      case 'rollback_phase':
        await this.rollbackToSafePhase(reason);
        break;

      case 'emergency_stop':
        await this.emergencyStopAllFeatures(reason);
        break;
    }

    // Set cooldown period
    if (trigger.cooldownPeriod) {
      const timerId = setTimeout(
        () => {
          this.rollbackTimers.delete(trigger.metric);
        },
        trigger.cooldownPeriod * 60 * 1000
      );

      this.rollbackTimers.set(trigger.metric, timerId);
    }
  }

  /**
   * Rollback to previous safe phase
   */
  private async rollbackToSafePhase(reason: string): Promise<void> {
    console.warn('Rolling back to safe phase:', reason);

    // Disable non-critical features
    const nonCriticalFeatures: Array<keyof ComponentFlags> = [
      'ENABLE_AI_INSIGHT_PANEL',
      'ENABLE_LIBRARY_TRANSITION_ANIMATOR',
      'ENABLE_LIVE_COLLABORATION_LAYER',
    ];

    for (const feature of nonCriticalFeatures) {
      await this.emergencyDisableFeature(feature, `Rollback: ${reason}`);
    }
  }

  /**
   * Emergency stop all features
   */
  private async emergencyStopAllFeatures(reason: string): Promise<void> {
    console.error('EMERGENCY STOP: Disabling all features -', reason);

    const allFeatures = Object.keys(this.config.components) as Array<keyof ComponentFlags>;
    for (const feature of allFeatures) {
      await this.emergencyDisableFeature(feature, `Emergency Stop: ${reason}`);
    }

    await this.sendAlert('critical', 'Emergency Stop Activated', reason);
  }

  /**
   * Setup rollback monitoring
   */
  private setupRollbackMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Monitor for JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error, event.filename, event.lineno);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, 'Promise rejection');
      });
    }
  }

  /**
   * Handle JavaScript errors
   */
  private handleError(error: Error, source?: string, line?: number): void {
    console.error('Feature flag error detected:', error, source, line);

    // If error rate is too high, trigger rollback
    // This would be implemented with proper error tracking
  }

  /**
   * Send alert notification
   */
  private async sendAlert(
    severity: 'critical' | 'warning' | 'info',
    title: string,
    message: string
  ): Promise<void> {
    try {
      const alertData = {
        severity,
        title,
        message,
        timestamp: new Date().toISOString(),
        userId: this.state.userId,
        sessionId: this.state.sessionId,
        enabledFeatures: this.state.enabledFeatures,
        performanceMetrics: this.state.performanceMetrics,
      };

      // In production, send to monitoring service
      console.log('ALERT:', alertData);

      // Store in local storage for debugging
      if (typeof window !== 'undefined') {
        const alerts = JSON.parse(localStorage.getItem('linear-alerts') || '[]');
        alerts.push(alertData);
        localStorage.setItem('linear-alerts', JSON.stringify(alerts.slice(-100))); // Keep last 100
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Get current feature flag state
   */
  getState(): FeatureFlagState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
    }

    // Clear rollback timers
    this.rollbackTimers.forEach((timer) => clearTimeout(timer));
    this.rollbackTimers.clear();
  }
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default feature flag configuration for Phase 5.0
 */
export const defaultFeatureFlagConfig: FeatureFlagConfig = {
  components: {
    ENABLE_AI_CAPACITY_RIBBON: false,
    ENABLE_AI_CONFLICT_DETECTOR: false,
    ENABLE_AI_NLP_INPUT: false,
    ENABLE_AI_SMART_SCHEDULING: false,
    ENABLE_AI_INSIGHT_PANEL: false,
    ENABLE_MOTION_ENHANCED_WRAPPER: false,
    ENABLE_TOUCH_GESTURE_HANDLER: false,
    ENABLE_LIBRARY_TRANSITION_ANIMATOR: false,
    ENABLE_WEBSOCKET_SYNC_MANAGER: false,
    ENABLE_OPTIMISTIC_UPDATE_HANDLER: false,
    ENABLE_LIVE_COLLABORATION_LAYER: false,
  },
  rollout: {
    strategy: 'percentage',
    percentage: 0,
    schedule: {
      startDate: new Date(),
      phases: PHASE_5_ROLLOUT_PHASES,
    },
  },
  monitoring: {
    performanceThresholds: {
      memoryUsage: { threshold: 120, action: 'disable_heavy_features' },
      errorRate: { threshold: 0.01, action: 'rollback_latest_feature' },
      loadTime: { threshold: 2000, action: 'disable_non_critical' },
      fps: { threshold: 30, action: 'disable_animations' },
      webSocketLatency: { threshold: 1000, action: 'fallback_polling' },
    },
    alerting: {
      alertThresholds: {
        critical: 0.99,
        warning: 0.95,
        info: 0.9,
      },
    },
    rollbackTriggers: [
      {
        metric: 'memoryUsage',
        threshold: 120,
        action: 'disable_feature',
        cooldownPeriod: 60,
      },
      {
        metric: 'errorRate',
        threshold: 0.01,
        action: 'rollback_phase',
        cooldownPeriod: 30,
      },
    ],
  },
  metadata: {
    version: '5.0.0',
    deploymentId: nanoid(),
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    lastUpdated: new Date(),
  },
};

export default FeatureFlagManager;
