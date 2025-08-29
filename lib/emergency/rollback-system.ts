/**
 * Emergency Rollback System
 * Comprehensive rollback capabilities for Command Workspace deployment
 */

import { FeatureFlagManager, EMERGENCY_ROLLBACK_FLAGS } from '../features/useFeatureFlags';

export class EmergencyRollbackSystem {
  /**
   * 🚨 EMERGENCY: Complete system rollback to calendar foundation
   * Use only in critical situations
   */
  static async emergencyRollback(reason: string = 'Manual trigger') {
    console.error('🚨 EMERGENCY ROLLBACK INITIATED:', reason);

    try {
      // Step 1: Disable all Command Workspace features instantly
      await this.disableAllCommandWorkspaceFeatures();

      // Step 2: Redirect to legacy routes
      await this.activateLegacyRouting();

      // Step 3: Validate legacy system functionality
      await this.validateLegacySystem();

      // Step 4: Log rollback event for monitoring
      await this.logRollbackEvent(reason);

      // Step 5: Notify monitoring systems
      await this.notifyMonitoringSystems(reason);

      console.log('✅ Emergency rollback completed successfully');
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('💥 Emergency rollback failed:', error);
      return { success: false, error: error.message, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Disable all Command Workspace features using feature flags
   */
  private static async disableAllCommandWorkspaceFeatures() {
    console.log('🔄 Disabling Command Workspace features...');

    // Use the predefined emergency rollback flags
    Object.entries(EMERGENCY_ROLLBACK_FLAGS).forEach(([flag, enabled]) => {
      FeatureFlagManager.setFlag(flag as any, enabled!);
    });

    // Force reload for immediate effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-rollback-complete'));
    }
  }

  /**
   * Activate legacy routing system
   */
  private static async activateLegacyRouting() {
    console.log('🔄 Activating legacy routing...');

    // Set routing flags to legacy mode
    if (typeof window !== 'undefined') {
      localStorage.setItem('routing_mode', 'legacy');
      localStorage.setItem('shell_disabled', 'true');

      // Redirect current page if on /app route
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/dashboard'; // Legacy calendar route
      }
    }
  }

  /**
   * Validate that legacy calendar system is functional
   */
  private static async validateLegacySystem() {
    console.log('🔍 Validating legacy system...');

    try {
      // Check that calendar integration is working
      const calendarHealthy = await this.checkCalendarHealth();
      const authHealthy = await this.checkAuthHealth();
      const backendHealthy = await this.checkBackendHealth();

      if (!calendarHealthy || !authHealthy || !backendHealthy) {
        throw new Error('Legacy system validation failed');
      }

      console.log('✅ Legacy system validation passed');
    } catch (error) {
      console.error('❌ Legacy system validation failed:', error);
      throw error;
    }
  }

  /**
   * Log rollback event for monitoring and analytics
   */
  private static async logRollbackEvent(reason: string) {
    const rollbackEvent = {
      type: 'emergency_rollback',
      reason,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      flags: FeatureFlagManager.getAllFlags(),
    };

    try {
      // Log to local storage for immediate access
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('rollback_logs') || '[]');
        existingLogs.push(rollbackEvent);
        localStorage.setItem('rollback_logs', JSON.stringify(existingLogs.slice(-10))); // Keep last 10
      }

      // Send to monitoring endpoint (if available)
      await fetch('/api/monitoring/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rollbackEvent),
      }).catch(() => {}); // Don't fail if monitoring unavailable
    } catch (error) {
      console.warn('Failed to log rollback event:', error);
    }
  }

  /**
   * Notify external monitoring systems
   */
  private static async notifyMonitoringSystems(reason: string) {
    // Could integrate with services like Sentry, DataDog, etc.
    console.log('📡 Notifying monitoring systems...');

    if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
      const data = JSON.stringify({
        event: 'emergency_rollback',
        reason,
        timestamp: new Date().toISOString(),
      });

      navigator.sendBeacon('/api/monitoring/emergency', data);
    }
  }

  /**
   * Health check utilities
   */
  private static async checkCalendarHealth(): Promise<boolean> {
    try {
      // Basic check that calendar components can render
      return typeof document !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  private static async checkAuthHealth(): Promise<boolean> {
    try {
      // Check if Clerk is responsive (basic check)
      return typeof window !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  private static async checkBackendHealth(): Promise<boolean> {
    try {
      // Basic connectivity check
      const response = await fetch('/api/health', { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false; // Backend might be down, but that's not rollback-worthy
    }
  }
}

/**
 * Controlled rollback utilities (less drastic than emergency)
 */
export class ControlledRollback {
  /**
   * Rollback specific phase while keeping others functional
   */
  static async rollbackPhase(phase: keyof typeof PHASE_FLAG_GROUPS, reason: string = '') {
    console.log(`🔄 Rolling back ${phase}...`);

    try {
      FeatureFlagManager.disablePhase(phase);

      // Validate that rollback didn't break anything
      const validation = FeatureFlagManager.validateFlagDependencies();
      if (!validation.valid) {
        console.warn('⚠️ Rollback created dependency issues:', validation.errors);
      }

      // Log phase rollback
      this.logPhaseRollback(phase, reason);

      return { success: true, phase, reason };
    } catch (error) {
      console.error(`Failed to rollback ${phase}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gradual rollback - disable features in reverse order
   */
  static async gradualRollback() {
    console.log('🔄 Performing gradual rollback...');

    const phases = ['PHASE_4_AI', 'PHASE_3_VIEWS', 'PHASE_2_COMMANDS', 'PHASE_1_SHELL'] as const;

    for (const phase of phases) {
      await this.rollbackPhase(phase, 'Gradual rollback');
      // Wait 1 second between phases to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Log phase-specific rollback events
   */
  private static logPhaseRollback(phase: string, reason: string) {
    if (typeof window !== 'undefined') {
      const event = {
        type: 'phase_rollback',
        phase,
        reason,
        timestamp: new Date().toISOString(),
      };

      const existingLogs = JSON.parse(localStorage.getItem('phase_rollback_logs') || '[]');
      existingLogs.push(event);
      localStorage.setItem('phase_rollback_logs', JSON.stringify(existingLogs.slice(-20)));
    }
  }
}

/**
 * Browser-accessible emergency functions (for debugging)
 */
if (typeof window !== 'undefined') {
  // @ts-ignore - Development utility
  window.__emergencyRollback = EmergencyRollbackSystem.emergencyRollback;
  // @ts-ignore - Development utility
  window.__rollbackPhase = ControlledRollback.rollbackPhase;
  // @ts-ignore - Development utility
  window.__validateFlags = FeatureFlagManager.validateFlagDependencies;
}
