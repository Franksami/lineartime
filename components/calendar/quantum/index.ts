/**
 * Quantum Calendar System - Exports
 * 
 * Modern CSS calendar implementation with iterative refinement capabilities,
 * A/B testing integration, and comprehensive performance monitoring.
 */

// Core Component
export { QuantumCalendarCore } from './QuantumCalendarCore';
export { default as QuantumCalendarCoreDefault } from './QuantumCalendarCore';

// Feature Management
export { QuantumFeatureFlags } from './QuantumFeatureFlags';
export { default as QuantumFeatureFlagsDefault } from './QuantumFeatureFlags';

// Analytics & Monitoring
export { QuantumAnalytics } from './QuantumAnalytics';
export { default as QuantumAnalyticsDefault } from './QuantumAnalytics';

// Re-export types for convenience
export type {
  QuantumCalendarCoreProps,
  QuantumCalendarState,
  QuantumCalendarAction,
  QuantumFeatureFlags,
  QuantumVariant,
  QuantumABTestConfig,
  QuantumPerformanceMetrics,
  QuantumEngagementMetrics,
  QuantumEventData,
  QuantumConfig,
  QuantumPerformanceConfig,
  QuantumAnalyticsConfig,
  SubgridConfig,
  ContainerQueryConfig,
  FluidTypographyConfig,
  PhysicsAnimationConfig,
  MicroInteractionConfig,
  FeatureFlagEvaluation,
  BrowserSupportResult,
  PerformanceTimingMark,
  CSSCustomProperty,
  CSSContainerQuery,
} from '@/types/quantum-calendar';

// Utility functions
export {
  // Browser support detection
  detectBrowserSupport,
  
  // Performance utilities
  calculatePerformanceScore,
  measureQuantumFeatureImpact,
  
  // Analytics utilities
  generateSessionId,
  trackQuantumEvent,
  calculateFeatureUtilization,
  
  // A/B testing utilities
  assignUserToVariant,
  evaluateFeatureFlag,
  
  // Configuration helpers
  createQuantumConfig,
  validateQuantumConfig,
  mergeQuantumConfigs,
} from './utils';

// Constants
export {
  DEFAULT_QUANTUM_CONFIG,
  QUANTUM_FEATURE_CATEGORIES,
  QUANTUM_PERFORMANCE_BUDGETS,
  QUANTUM_CSS_CUSTOM_PROPERTIES,
} from './constants';

// Hooks
export {
  useQuantumCalendar,
  useQuantumFeatureFlags,
  useQuantumAnalytics,
  useQuantumPerformance,
  useQuantumABTesting,
} from './hooks';

/**
 * Quick Start Guide:
 * 
 * 1. Basic Usage:
 *    ```tsx
 *    import { QuantumCalendarCore } from '@/components/calendar/quantum';
 *    
 *    <QuantumCalendarCore
 *      year={2025}
 *      events={events}
 *      onDateSelect={handleDateSelect}
 *    />
 *    ```
 * 
 * 2. With Feature Flags:
 *    ```tsx
 *    const featureFlags = {
 *      enableSubgrid: true,
 *      enableContainerQueries: true,
 *      enablePhysicsAnimations: false,
 *    };
 *    
 *    <QuantumCalendarCore
 *      year={2025}
 *      events={events}
 *      featureFlags={featureFlags}
 *    />
 *    ```
 * 
 * 3. With A/B Testing:
 *    ```tsx
 *    const abTestConfig = {
 *      testId: 'quantum-features-test',
 *      testName: 'Modern CSS Features Test',
 *      variants: [
 *        {
 *          id: 'control',
 *          name: 'Control',
 *          featureFlags: { enableSubgrid: false },
 *          weight: 0.5,
 *        },
 *        {
 *          id: 'treatment',
 *          name: 'Modern CSS',
 *          featureFlags: { enableSubgrid: true, enableContainerQueries: true },
 *          weight: 0.5,
 *        },
 *      ],
 *    };
 *    
 *    <QuantumCalendarCore
 *      year={2025}
 *      events={events}
 *      abTestConfig={abTestConfig}
 *      onVariantAssignment={handleVariantAssignment}
 *    />
 *    ```
 * 
 * 4. With Performance Monitoring:
 *    ```tsx
 *    <QuantumCalendarCore
 *      year={2025}
 *      events={events}
 *      performanceConfig={{
 *        enabled: true,
 *        enableRealUserMonitoring: true,
 *        budgets: {
 *          renderTime: 16,
 *          memoryUsage: 100,
 *        },
 *      }}
 *      onPerformanceMetric={handlePerformanceMetric}
 *    />
 *    ```
 * 
 * 5. Development Mode:
 *    ```tsx
 *    <QuantumCalendarCore
 *      year={2025}
 *      events={events}
 *      enableDebugMode={true}
 *      enablePerformanceOverlay={true}
 *      enableFeatureFlagPanel={true}
 *    />
 *    ```
 */