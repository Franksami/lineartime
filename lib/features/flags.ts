/**
 * Command Workspace Feature Flags
 * Research-validated feature flag system for safe Command Workspace deployment
 */

export const COMMAND_WORKSPACE_FLAGS = {
  // Core Shell Architecture
  SHELL_COMMAND_WORKSPACE: 'shell.commandWorkspace',
  SHELL_THREE_PANE_LAYOUT: 'shell.threePaneLayout',
  SHELL_SIDEBAR_ENABLED: 'shell.sidebarEnabled',

  // Views (Research-validated view system)
  VIEWS_WEEK: 'views.week',
  VIEWS_DAY: 'views.day',
  VIEWS_PLANNER: 'views.planner',
  VIEWS_NOTES: 'views.notes',
  VIEWS_MAILBOX: 'views.mailbox',
  VIEWS_AUTOMATIONS: 'views.automations',
  VIEWS_YEAR_LENS: 'views.yearLens', // Optional legacy calendar

  // Context Dock System
  DOCK_AI_ASSISTANT: 'dock.aiAssistant',
  DOCK_DETAILS_PANEL: 'dock.detailsPanel',
  DOCK_CONFLICTS_PANEL: 'dock.conflictsPanel',
  DOCK_CAPACITY_PANEL: 'dock.capacityPanel',
  DOCK_BACKLINKS_PANEL: 'dock.backlinksPanel',

  // Command System (Obsidian + Schedule X patterns)
  COMMANDS_PALETTE_ENABLED: 'commands.paletteEnabled',
  COMMANDS_FUZZY_SEARCH: 'commands.fuzzySearch',
  COMMANDS_KEYBOARD_SHORTCUTS: 'commands.keyboardShortcuts',

  // Omnibox & AI Integration (Rasa patterns)
  OMNIBOX_ENABLED: 'omnibox.enabled',
  OMNIBOX_STREAMING: 'omnibox.streaming',
  OMNIBOX_INTENT_CLASSIFICATION: 'omnibox.intentClassification',

  // AI Agents (Timefold + Rasa patterns)
  AI_PLANNER_AGENT: 'ai.plannerAgent',
  AI_CONFLICT_AGENT: 'ai.conflictAgent',
  AI_SUMMARIZER_AGENT: 'ai.summarizerAgent',
  AI_ROUTER_AGENT: 'ai.routerAgent',

  // Computer Vision (ImageSorcery patterns)
  CV_ENABLED: 'cv.enabled',
  CV_LOCAL_PROCESSING: 'cv.localProcessing',
  CV_CONSENT_MANAGEMENT: 'cv.consentManagement',

  // Performance & Monitoring
  PERFORMANCE_MONITORING: 'performance.monitoring',
  BUNDLE_ANALYSIS: 'performance.bundleAnalysis',
  PERFORMANCE_BUDGETS: 'performance.budgets',

  // Developer Experience
  STORYBOOK_ENABLED: 'dev.storybookEnabled',
  HOT_RELOAD_OPTIMIZED: 'dev.hotReloadOptimized',
} as const;

export type CommandWorkspaceFlag =
  (typeof COMMAND_WORKSPACE_FLAGS)[keyof typeof COMMAND_WORKSPACE_FLAGS];

/**
 * Feature flag defaults for safe rollout
 */
export const DEFAULT_FLAG_VALUES: Record<CommandWorkspaceFlag, boolean> = {
  // Phase 0 - Foundation (enable first)
  'performance.monitoring': true,
  'dev.storybookEnabled': true,

  // Phase 1 - Shell (enable after foundation)
  'shell.commandWorkspace': true, // 🚨 MASTER SWITCH - ENABLED FOR TESTING
  'shell.threePaneLayout': true,
  'shell.sidebarEnabled': true,

  // Phase 2 - Commands (enable after shell)
  'commands.paletteEnabled': true, // Core feature - enabled for Command Workspace
  'commands.fuzzySearch': true, // Essential for command palette functionality
  'commands.keyboardShortcuts': true, // Required for Ctrl+P/Cmd+P activation

  // Phase 3 - Views (enable after commands)
  'views.week': true,
  'views.day': true,
  'views.planner': true,
  'views.notes': true,
  'views.mailbox': true,
  'views.automations': false,
  'views.yearLens': true, // Legacy calendar always available

  // Phase 4 - AI (enable after views)
  'ai.plannerAgent': false,
  'ai.conflictAgent': false,
  'ai.summarizerAgent': false,
  'ai.routerAgent': false,
  'omnibox.enabled': false,
  'omnibox.streaming': false,
  'omnibox.intentClassification': false,

  // Phase 5 - Advanced (enable after AI)
  'cv.enabled': false,
  'cv.localProcessing': false,
  'cv.consentManagement': false,

  // Context Dock (enable per phase)
  'dock.aiAssistant': true,
  'dock.detailsPanel': true,
  'dock.conflictsPanel': true,
  'dock.capacityPanel': true,
  'dock.backlinksPanel': true,

  // Performance (always enabled)
  'performance.bundleAnalysis': true,
  'performance.budgets': true,
  'dev.hotReloadOptimized': true,
};

/**
 * Emergency rollback - disable all Command Workspace features
 */
export const EMERGENCY_ROLLBACK_FLAGS: Partial<Record<CommandWorkspaceFlag, boolean>> = {
  'shell.commandWorkspace': false,
  'shell.threePaneLayout': false,
  'shell.sidebarEnabled': false,
  'commands.paletteEnabled': false,
  'omnibox.enabled': false,
  'ai.plannerAgent': false,
  'ai.conflictAgent': false,
  'cv.enabled': false,
};

/**
 * Development phase flag groups for controlled rollout
 */
export const PHASE_FLAG_GROUPS = {
  PHASE_0_FOUNDATION: [
    'performance.monitoring',
    'performance.bundleAnalysis',
    'dev.storybookEnabled',
  ],
  PHASE_1_SHELL: [
    'shell.commandWorkspace', // 🚨 Master switch
    'shell.threePaneLayout',
    'shell.sidebarEnabled',
  ],
  PHASE_2_COMMANDS: [
    'commands.paletteEnabled',
    'commands.fuzzySearch',
    'commands.keyboardShortcuts',
  ],
  PHASE_3_VIEWS: ['views.week', 'views.planner'],
  PHASE_4_AI: ['ai.plannerAgent', 'omnibox.enabled', 'dock.aiAssistant'],
} as const;
