/**
 * AI Enhancement Components Index
 *
 * Complete AI enhancement UI layer for LinearTime Phase 5.0
 * Integrates with design tokens, motion system, and accessibility standards.
 *
 * @version Phase 5.0
 * @author LinearTime AI Enhancement System
 */

// ==========================================
// Core AI Components
// ==========================================

/**
 * AICapacityRibbon - Visual capacity overlays showing calendar load
 *
 * Features:
 * - Real-time capacity analysis with AI-powered suggestions
 * - Visual indicators for low/medium/high/critical capacity levels
 * - Interactive tooltips with detailed capacity information
 * - Integration with design tokens and motion system
 * - Accessibility compliant with WCAG 2.1 AA
 * - Performance optimized for 10,000+ events
 *
 * Usage:
 * ```tsx
 * <AICapacityRibbon
 *   date="2025-01-15"
 *   events={calendarEvents}
 *   timeRange={{ start: startDate, end: endDate }}
 *   position="overlay"
 *   showDetails={true}
 *   showSuggestions={true}
 *   onClick={handleCapacityClick}
 * />
 * ```
 */
export {
  AICapacityRibbon,
  AICapacityRibbonMinimal,
  AICapacityRibbonCompact,
  AICapacityRibbonDetailed,
} from './AICapacityRibbon';

/**
 * AIConflictDetector - Real-time calendar conflict detection
 *
 * Features:
 * - Multi-type conflict detection (time overlap, travel time, attendee conflicts)
 * - AI-powered resolution suggestions with confidence scoring
 * - Interactive conflict resolution modal with visual diff comparison
 * - Cross-provider conflict detection for multi-calendar setups
 * - Real-time notifications with sound effects integration
 * - Automated conflict resolution with user approval workflows
 *
 * Usage:
 * ```tsx
 * <AIConflictDetector
 *   events={calendarEvents}
 *   timeRange={{ start: startDate, end: endDate }}
 *   detectionSensitivity="balanced"
 *   autoDetect={true}
 *   onConflictDetected={handleConflictDetected}
 *   onResolutionApplied={handleResolutionApplied}
 * />
 * ```
 */
export { AIConflictDetector } from './AIConflictDetector';

/**
 * AINLPInput - Natural language processing for event creation
 *
 * Features:
 * - Real-time natural language parsing with confidence scoring
 * - Voice input support with browser speech recognition
 * - AI-powered suggestions and completions
 * - Template system with popular and recent queries
 * - Multi-language support with localization
 * - Context-aware parsing using existing calendar data
 *
 * Usage:
 * ```tsx
 * <AINLPInput
 *   placeholder="Try: 'Team meeting tomorrow at 2pm in conference room A'"
 *   enableRealTimeParsing={true}
 *   enableVoiceInput={true}
 *   enableSuggestions={true}
 *   onEventParsed={handleEventParsed}
 *   onEventCreate={handleEventCreate}
 * />
 * ```
 */
export { AINLPInput } from './AINLPInput';

/**
 * AISmartScheduling - Intelligent scheduling assistance
 *
 * Features:
 * - AI-powered optimal time slot recommendations
 * - Multi-factor analysis (availability, productivity patterns, travel time)
 * - Smart meeting consolidation suggestions
 * - Focus time protection with productivity alignment
 * - Cross-provider scheduling with capability detection
 * - Learning-based preference adaptation
 *
 * Usage:
 * ```tsx
 * <AISmartScheduling
 *   events={calendarEvents}
 *   timeRange={{ start: startDate, end: endDate }}
 *   requestedDuration={60}
 *   attendees={meetingAttendees}
 *   preferences={schedulingPreferences}
 *   onTimeSlotSelected={handleTimeSlotSelected}
 *   onSuggestionApplied={handleSuggestionApplied}
 * />
 * ```
 */
export { AISmartScheduling } from './AISmartScheduling';

/**
 * AIInsightPanel - Comprehensive productivity analytics dashboard
 *
 * Features:
 * - Real-time productivity metrics with trend analysis
 * - AI-generated insights and recommendations
 * - Schedule pattern recognition and optimization suggestions
 * - Work-life balance assessment with wellbeing indicators
 * - Actionable recommendations with impact estimation
 * - Export and sharing capabilities for insights
 *
 * Usage:
 * ```tsx
 * <AIInsightPanel
 *   events={calendarEvents}
 *   timeRange={{ start: startDate, end: endDate }}
 *   variant="sidebar"
 *   showMetrics={true}
 *   showInsights={true}
 *   showRecommendations={true}
 *   onInsightAction={handleInsightAction}
 *   onMetricClick={handleMetricClick}
 * />
 * ```
 */
export { AIInsightPanel } from './AIInsightPanel';

/**
 * AIConductorInterface - AI Orchestration & Monitoring Dashboard
 *
 * Features:
 * - Real-time AI system monitoring and orchestration
 * - Agent status tracking and load balancing
 * - Conflict visualization and resolution management
 * - Predictive insights with confidence scoring
 * - Audio controls for voice interaction
 * - System metrics and performance monitoring
 *
 * Usage:
 * ```tsx
 * <AIConductorInterface />
 * ```
 */
export { default as AIConductorInterface } from './AIConductorInterface';

// ==========================================
// Type Definitions
// ==========================================

/**
 * Shared types for AI enhancement components
 */
export type {
  // AICapacityRibbon types
  CapacityLevel,
  CapacityData,
} from './AICapacityRibbon';

export type {
  // AIConflictDetector types
  ConflictType,
  ConflictAnalysis,
  ConflictResolution,
} from './AIConflictDetector';

export type {
  // AINLPInput types
  NLPParsedEvent,
  NLPSuggestion,
} from './AINLPInput';

export type {
  // AISmartScheduling types
  TimeSlot,
  SchedulingPreferences,
  SchedulingSuggestion,
} from './AISmartScheduling';

export type {
  // AIInsightPanel types
  ProductivityMetric,
  ScheduleInsight,
  TimeAnalysis,
} from './AIInsightPanel';

// ==========================================
// Component Groups & Presets
// ==========================================

/**
 * Complete AI Enhancement Suite
 *
 * Pre-configured combination of all AI components for comprehensive
 * calendar enhancement. Ideal for full-featured implementations.
 *
 * Usage:
 * ```tsx
 * import { CompleteAISuite } from '@/components/ai';
 *
 * <CompleteAISuite
 *   events={calendarEvents}
 *   timeRange={{ start: startDate, end: endDate }}
 *   config={{
 *     capacityRibbon: { position: 'overlay', showSuggestions: true },
 *     conflictDetector: { detectionSensitivity: 'balanced' },
 *     nlpInput: { enableVoiceInput: true },
 *     smartScheduling: { maxSuggestions: 5 },
 *     insightPanel: { variant: 'sidebar' }
 *   }}
 * />
 * ```
 */
export const CompleteAISuite = {
  AICapacityRibbon,
  AIConflictDetector,
  AINLPInput,
  AISmartScheduling,
  AIInsightPanel,
};

/**
 * Essential AI Features
 *
 * Minimal set of AI components for basic enhancement.
 * Ideal for performance-conscious implementations.
 *
 * Usage:
 * ```tsx
 * import { EssentialAI } from '@/components/ai';
 *
 * const { AICapacityRibbon, AIConflictDetector } = EssentialAI;
 * ```
 */
export const EssentialAI = {
  AICapacityRibbon,
  AIConflictDetector,
};

/**
 * Advanced AI Features
 *
 * Full-featured AI components for power users.
 * Includes all advanced features and analytics.
 *
 * Usage:
 * ```tsx
 * import { AdvancedAI } from '@/components/ai';
 *
 * const { AISmartScheduling, AIInsightPanel } = AdvancedAI;
 * ```
 */
export const AdvancedAI = {
  AINLPInput,
  AISmartScheduling,
  AIInsightPanel,
};

// ==========================================
// Utility Functions
// ==========================================

/**
 * AI Component Feature Detector
 *
 * Detects available AI features based on browser capabilities
 * and user preferences.
 *
 * @returns Object with available features
 */
export const detectAIFeatures = () => {
  const features = {
    voiceInput: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webGL: !!window.WebGLRenderingContext,
    localStorage: !!window.localStorage,
    indexedDB: !!window.indexedDB,
    webWorkers: !!window.Worker,
    intersection: 'IntersectionObserver' in window,
    resize: 'ResizeObserver' in window,
  };

  return features;
};

/**
 * AI Component Configuration Validator
 *
 * Validates AI component configurations for optimal performance
 * and compatibility.
 *
 * @param config - AI component configuration
 * @returns Validation result with suggestions
 */
export const validateAIConfig = (config: any) => {
  const validation = {
    isValid: true,
    warnings: [] as string[],
    suggestions: [] as string[],
    performance: {
      estimated_memory_usage: 0, // MB
      estimated_cpu_usage: 0, // %
      battery_impact: 'low' as 'low' | 'medium' | 'high',
    },
  };

  // Validate memory usage
  let memoryUsage = 0;
  if (config.capacityRibbon?.enabled) memoryUsage += 10;
  if (config.conflictDetector?.enabled) memoryUsage += 15;
  if (config.nlpInput?.enabled) memoryUsage += 20;
  if (config.smartScheduling?.enabled) memoryUsage += 25;
  if (config.insightPanel?.enabled) memoryUsage += 30;

  validation.performance.estimated_memory_usage = memoryUsage;

  // Performance warnings
  if (memoryUsage > 80) {
    validation.warnings.push('High memory usage detected. Consider disabling some features.');
    validation.performance.battery_impact = 'high';
  }

  // Voice input compatibility
  if (config.nlpInput?.enableVoiceInput && !detectAIFeatures().voiceInput) {
    validation.warnings.push('Voice input requested but not supported in this browser.');
  }

  // Suggestions for optimization
  if (config.insightPanel?.refreshInterval < 30) {
    validation.suggestions.push('Consider increasing refresh interval to reduce CPU usage.');
  }

  return validation;
};

/**
 * AI Performance Monitor
 *
 * Monitors AI component performance and provides optimization
 * recommendations.
 *
 * @returns Performance monitoring utilities
 */
export const createAIPerformanceMonitor = () => {
  const startTime = Date.now();
  const metrics: Record<string, number> = {};

  return {
    startTimer: (component: string) => {
      metrics[`${component}_start`] = performance.now();
    },

    endTimer: (component: string) => {
      const start = metrics[`${component}_start`];
      if (start) {
        metrics[`${component}_duration`] = performance.now() - start;
      }
    },

    getMetrics: () => metrics,

    generateReport: () => {
      const report = {
        total_runtime: Date.now() - startTime,
        component_performance: Object.entries(metrics)
          .filter(([key]) => key.endsWith('_duration'))
          .map(([key, duration]) => ({
            component: key.replace('_duration', ''),
            duration: Math.round(duration),
            status:
              duration < 100 ? 'optimal' : duration < 500 ? 'acceptable' : 'needs_optimization',
          })),
        recommendations: [] as string[],
      };

      // Generate recommendations based on performance
      report.component_performance.forEach((comp) => {
        if (comp.status === 'needs_optimization') {
          report.recommendations.push(
            `Consider optimizing ${comp.component} - taking ${comp.duration}ms`
          );
        }
      });

      return report;
    },
  };
};

// ==========================================
// Default Configurations
// ==========================================

/**
 * Default AI Configuration
 *
 * Optimized default settings for all AI components.
 */
export const defaultAIConfig = {
  capacityRibbon: {
    enabled: true,
    position: 'overlay' as const,
    height: 8,
    showDetails: true,
    showSuggestions: true,
    updateInterval: 30000,
    enableRealTimeUpdates: true,
  },

  conflictDetector: {
    enabled: true,
    detectionSensitivity: 'balanced' as const,
    autoDetect: true,
    realTimeUpdates: true,
    showFloating: true,
    maxVisibleConflicts: 3,
    analysisInterval: 5000,
  },

  nlpInput: {
    enabled: true,
    enableRealTimeParsing: true,
    enableSuggestions: true,
    enableVoiceInput: false, // Default off for privacy
    enableTemplates: true,
    parseDelay: 500,
    maxLength: 500,
  },

  smartScheduling: {
    enabled: true,
    suggestionTypes: ['optimal_time', 'reschedule', 'consolidate', 'focus_time'] as const,
    maxSuggestions: 5,
    confidenceThreshold: 0.6,
    enableLearning: true,
    analysisInterval: 60000,
  },

  insightPanel: {
    enabled: true,
    variant: 'sidebar' as const,
    showMetrics: true,
    showInsights: true,
    showRecommendations: true,
    showTrends: true,
    refreshInterval: 30,
    compactMode: false,
  },
};

/**
 * Performance-Optimized AI Configuration
 *
 * Reduced feature set for optimal performance on lower-end devices.
 */
export const performanceAIConfig = {
  ...defaultAIConfig,
  capacityRibbon: {
    ...defaultAIConfig.capacityRibbon,
    updateInterval: 60000, // Slower updates
    enableRealTimeUpdates: false,
  },
  conflictDetector: {
    ...defaultAIConfig.conflictDetector,
    analysisInterval: 15000, // Less frequent analysis
    maxVisibleConflicts: 2,
  },
  nlpInput: {
    ...defaultAIConfig.nlpInput,
    enableRealTimeParsing: false, // Manual parsing only
    parseDelay: 1000,
  },
  smartScheduling: {
    ...defaultAIConfig.smartScheduling,
    maxSuggestions: 3,
    analysisInterval: 120000, // Less frequent analysis
  },
  insightPanel: {
    ...defaultAIConfig.insightPanel,
    refreshInterval: 60, // Slower refresh
    compactMode: true,
  },
};

/**
 * Feature-Rich AI Configuration
 *
 * All features enabled for maximum AI assistance.
 */
export const enhancedAIConfig = {
  ...defaultAIConfig,
  capacityRibbon: {
    ...defaultAIConfig.capacityRibbon,
    updateInterval: 15000, // Faster updates
    showTrends: true,
  },
  conflictDetector: {
    ...defaultAIConfig.conflictDetector,
    detectionSensitivity: 'aggressive' as const,
    analysisInterval: 3000, // More frequent analysis
    enableNotifications: true,
  },
  nlpInput: {
    ...defaultAIConfig.nlpInput,
    enableVoiceInput: true,
    contextAware: true,
    crossProviderSupport: true,
    enableSmartScheduling: true,
  },
  smartScheduling: {
    ...defaultAIConfig.smartScheduling,
    maxSuggestions: 8,
    confidenceThreshold: 0.5,
    analysisInterval: 30000,
  },
  insightPanel: {
    ...defaultAIConfig.insightPanel,
    refreshInterval: 15, // Faster refresh
    showAdvancedMetrics: true,
  },
};

// ==========================================
// Version Information
// ==========================================

/**
 * AI Enhancement Layer Version Information
 */
export const AI_VERSION = {
  version: '5.0.0',
  build: 'Phase-5.0-AI-Enhancement',
  release_date: '2025-01-15',
  components: [
    'AICapacityRibbon',
    'AIConflictDetector',
    'AINLPInput',
    'AISmartScheduling',
    'AIInsightPanel',
  ],
  features: [
    'Real-time capacity analysis',
    'Intelligent conflict detection',
    'Natural language processing',
    'Smart scheduling assistance',
    'Productivity analytics',
    'Voice input support',
    'Multi-provider integration',
    'Accessibility compliance',
    'Performance optimization',
  ],
  performance_targets: {
    load_time: '<50ms per component',
    memory_usage: '<100MB total',
    cpu_usage: '<5% background',
    response_time: '<50ms AI processing',
  },
};

export default {
  // Core components
  AICapacityRibbon,
  AIConflictDetector,
  AINLPInput,
  AISmartScheduling,
  AIInsightPanel,

  // Component groups
  CompleteAISuite,
  EssentialAI,
  AdvancedAI,

  // Utilities
  detectAIFeatures,
  validateAIConfig,
  createAIPerformanceMonitor,

  // Configurations
  defaultAIConfig,
  performanceAIConfig,
  enhancedAIConfig,

  // Version info
  AI_VERSION,
};
