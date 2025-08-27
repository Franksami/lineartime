/**
 * Motion System - Main Entry Point
 * Comprehensive motion design language for LinearTime
 * Built on Motion library (5KB) - 84% smaller than Framer Motion (32KB)
 *
 * Features:
 * - 🎯 112+ FPS performance targets
 * - 🎵 Audio-visual synchronization
 * - 🎨 Design token integration
 * - 📊 Performance monitoring
 * - ♿ Accessibility support
 */

// Core motion system
export * from './motion-system';

// React hooks and utilities
export * from './motion-hooks';

// Audio-visual synchronization
export * from './audio-visual-sync';

// Performance monitoring
export * from './performance-monitor';

// Framer Motion migration utilities (gradual migration)
export * from './framer-motion-migration';

// Re-export common Motion library functions for direct use
export {
  animate as motionAnimate,
  timeline,
  stagger,
  spring,
  scroll,
  inView,
} from 'motion';

// Default exports for convenience
export { default as motionSystem } from './motion-system';
export { default as motionHooks } from './motion-hooks';
export { default as audioVisualSync } from './audio-visual-sync';
export { default as performanceMonitor } from './performance-monitor';
export { default as framerMotionMigration } from './framer-motion-migration';

// Quick setup helper
export function setupMotionSystem(options?: {
  enablePerformanceMonitoring?: boolean;
  audioSettings?: any;
  customThresholds?: any;
}) {
  const { enablePerformanceMonitoring = true, audioSettings, customThresholds } = options || {};

  // Initialize components
  if (enablePerformanceMonitoring && typeof window !== 'undefined') {
    const { getPerformanceMonitor } = require('./performance-monitor');
    const monitor = getPerformanceMonitor(customThresholds);
    monitor.startMonitoring();
    console.log('🎯 Motion System initialized with performance monitoring');

    // Auto-stop monitoring on page unload
    window.addEventListener('beforeunload', () => {
      monitor.stopMonitoring();
    });
  }

  if (audioSettings && typeof window !== 'undefined') {
    const { initializeAudioVisualSync } = require('./audio-visual-sync');
    initializeAudioVisualSync(audioSettings);
    console.log('🎵 Audio-visual sync initialized');
  }

  return {
    version: '1.0.0',
    bundleSize: '5KB',
    savings: '84%',
    features: [
      'Performance monitoring',
      'Audio-visual sync',
      'Token integration',
      'Accessibility support',
      'Migration tools',
    ],
  };
}
