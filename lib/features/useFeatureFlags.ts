/**
 * Command Workspace Feature Flag Hooks
 * Safe feature flag management with emergency rollback capabilities
 */

import { useState, useEffect } from 'react';
import {
  COMMAND_WORKSPACE_FLAGS,
  DEFAULT_FLAG_VALUES,
  EMERGENCY_ROLLBACK_FLAGS,
  PHASE_FLAG_GROUPS,
  type CommandWorkspaceFlag,
} from './flags';

/**
 * Hook for accessing individual feature flags
 */
export function useFeatureFlag(flag: CommandWorkspaceFlag): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Check for override in localStorage (for development)
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem(`flag_${flag}`);
      if (override !== null) {
        return override === 'true';
      }
    }

    // Use default value
    return DEFAULT_FLAG_VALUES[flag] ?? false;
  });

  useEffect(() => {
    // Listen for flag updates (for real-time control)
    const handleFlagUpdate = (event: CustomEvent<{ flag: string; enabled: boolean }>) => {
      if (event.detail.flag === flag) {
        setIsEnabled(event.detail.enabled);
      }
    };

    window.addEventListener('flag-update' as any, handleFlagUpdate);
    return () => window.removeEventListener('flag-update' as any, handleFlagUpdate);
  }, [flag]);

  return isEnabled;
}

/**
 * Hook for Command Workspace shell features
 */
export function useCommandWorkspaceShell() {
  const shellEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.SHELL_COMMAND_WORKSPACE);
  const threePaneLayout = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.SHELL_THREE_PANE_LAYOUT);
  const sidebarEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.SHELL_SIDEBAR_ENABLED);

  return {
    isShellEnabled: shellEnabled && threePaneLayout,
    isSidebarEnabled: sidebarEnabled,
    isLegacyMode: !shellEnabled,

    // Shell configuration
    shouldShowShell: shellEnabled && threePaneLayout,
    shouldShowSidebar: shellEnabled && sidebarEnabled,
    shouldRedirectToLegacy: !shellEnabled,
  };
}

/**
 * Hook for Command System features (Phase 2)
 */
export function useCommandSystem() {
  const paletteEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.COMMANDS_PALETTE_ENABLED);
  const fuzzySearch = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.COMMANDS_FUZZY_SEARCH);
  const keyboardShortcuts = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.COMMANDS_KEYBOARD_SHORTCUTS);

  return {
    isPaletteEnabled: paletteEnabled,
    isFuzzySearchEnabled: fuzzySearch,
    areKeyboardShortcutsEnabled: keyboardShortcuts,

    // Command system configuration
    shouldShowPalette: paletteEnabled && fuzzySearch,
    shouldEnableKeyboard: keyboardShortcuts,
    isCommandSystemReady: paletteEnabled && fuzzySearch && keyboardShortcuts,
  };
}

/**
 * Hook for AI Agent features (Phase 4)
 */
export function useAIAgents() {
  const plannerAgent = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.AI_PLANNER_AGENT);
  const conflictAgent = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.AI_CONFLICT_AGENT);
  const summarizerAgent = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.AI_SUMMARIZER_AGENT);
  const routerAgent = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.AI_ROUTER_AGENT);
  const omniboxEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.OMNIBOX_ENABLED);

  return {
    planner: plannerAgent,
    conflict: conflictAgent,
    summarizer: summarizerAgent,
    router: routerAgent,
    omnibox: omniboxEnabled,

    // AI system status
    areAgentsEnabled: plannerAgent || conflictAgent || summarizerAgent || routerAgent,
    isOmniboxReady: omniboxEnabled,
    aiSystemStatus: {
      planning: plannerAgent ? 'enabled' : 'disabled',
      conflicts: conflictAgent ? 'enabled' : 'disabled',
      conversation: summarizerAgent ? 'enabled' : 'disabled',
      routing: routerAgent ? 'enabled' : 'disabled',
    },
  };
}

/**
 * Hook for Context Dock panels
 */
export function useContextDock() {
  const aiAssistant = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_AI_ASSISTANT);
  const detailsPanel = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_DETAILS_PANEL);
  const conflictsPanel = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_CONFLICTS_PANEL);
  const capacityPanel = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_CAPACITY_PANEL);
  const backlinksPanel = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_BACKLINKS_PANEL);

  return {
    panels: {
      ai: aiAssistant,
      details: detailsPanel,
      conflicts: conflictsPanel,
      capacity: capacityPanel,
      backlinks: backlinksPanel,
    },

    // Dock configuration
    enabledPanels: [
      aiAssistant && 'ai',
      detailsPanel && 'details',
      conflictsPanel && 'conflicts',
      capacityPanel && 'capacity',
      backlinksPanel && 'backlinks',
    ].filter(Boolean) as string[],

    isDockEnabled: aiAssistant || detailsPanel || conflictsPanel || capacityPanel || backlinksPanel,
  };
}

/**
 * Flag management utilities
 */
export class FeatureFlagManager {
  /**
   * Enable a phase of flags (for controlled rollout)
   */
  static enablePhase(phase: keyof typeof PHASE_FLAG_GROUPS) {
    const flags = PHASE_FLAG_GROUPS[phase];
    flags.forEach((flag) => {
      this.setFlag(flag as CommandWorkspaceFlag, true);
    });
  }

  /**
   * Disable a phase of flags (for rollback)
   */
  static disablePhase(phase: keyof typeof PHASE_FLAG_GROUPS) {
    const flags = PHASE_FLAG_GROUPS[phase];
    flags.forEach((flag) => {
      this.setFlag(flag as CommandWorkspaceFlag, false);
    });
  }

  /**
   * Emergency rollback - disable all Command Workspace features
   */
  static emergencyRollback() {
    console.warn('🚨 EMERGENCY ROLLBACK: Disabling all Command Workspace features');

    Object.entries(EMERGENCY_ROLLBACK_FLAGS).forEach(([flag, enabled]) => {
      this.setFlag(flag as CommandWorkspaceFlag, enabled!);
    });

    // Emit rollback event for monitoring
    window.dispatchEvent(
      new CustomEvent('emergency-rollback', {
        detail: { timestamp: new Date().toISOString(), flags: EMERGENCY_ROLLBACK_FLAGS },
      })
    );
  }

  /**
   * Set individual flag value
   */
  static setFlag(flag: CommandWorkspaceFlag, enabled: boolean) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`flag_${flag}`, enabled.toString());

      // Emit update event for real-time updates
      window.dispatchEvent(
        new CustomEvent('flag-update', {
          detail: { flag, enabled },
        })
      );
    }
  }

  /**
   * Get current flag status
   */
  static getFlag(flag: CommandWorkspaceFlag): boolean {
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem(`flag_${flag}`);
      if (override !== null) {
        return override === 'true';
      }
    }
    return DEFAULT_FLAG_VALUES[flag] ?? false;
  }

  /**
   * Get all enabled flags (for debugging)
   */
  static getAllFlags(): Record<string, boolean> {
    return Object.values(COMMAND_WORKSPACE_FLAGS).reduce(
      (acc, flag) => {
        acc[flag] = this.getFlag(flag);
        return acc;
      },
      {} as Record<string, boolean>
    );
  }

  /**
   * Validate flag dependencies (ensure proper phase order)
   */
  static validateFlagDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Shell must be enabled before views
    if (this.getFlag('views.week') && !this.getFlag('shell.commandWorkspace')) {
      errors.push('Views require shell.commandWorkspace to be enabled');
    }

    // Commands require shell
    if (this.getFlag('commands.paletteEnabled') && !this.getFlag('shell.commandWorkspace')) {
      errors.push('Commands require shell.commandWorkspace to be enabled');
    }

    // AI agents require omnibox or dock panels
    const agentsEnabled = this.getFlag('ai.plannerAgent') || this.getFlag('ai.conflictAgent');
    const interfaceEnabled = this.getFlag('omnibox.enabled') || this.getFlag('dock.aiAssistant');

    if (agentsEnabled && !interfaceEnabled) {
      errors.push('AI agents require omnibox.enabled or dock.aiAssistant to be enabled');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Development utilities for testing flag combinations
 */
export const DevFlagUtils = {
  /**
   * Quick enable for development testing
   */
  enableDevelopmentFeatures() {
    FeatureFlagManager.enablePhase('PHASE_0_FOUNDATION');
    FeatureFlagManager.setFlag('performance.monitoring', true);
    FeatureFlagManager.setFlag('dev.storybookEnabled', true);
  },

  /**
   * Enable shell for testing
   */
  enableShellTesting() {
    FeatureFlagManager.enablePhase('PHASE_1_SHELL');
  },

  /**
   * Full feature enable (for final testing)
   */
  enableAllFeatures() {
    Object.values(COMMAND_WORKSPACE_FLAGS).forEach((flag) => {
      FeatureFlagManager.setFlag(flag, true);
    });
  },
};

/**
 * Export flag constants for external use
 */
export { COMMAND_WORKSPACE_FLAGS } from './flags';
export { EMERGENCY_ROLLBACK_FLAGS } from './flags';
export type { CommandWorkspaceFlag } from './flags';
