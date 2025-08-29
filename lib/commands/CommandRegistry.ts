/**
 * Command Registry - Type-safe command system for Command Workspace
 * Research validation: Obsidian command palette patterns + Schedule X keyboard shortcuts
 */

import { useAppShell } from '@/contexts/AppShellProvider';

/**
 * Command categories for organization and keyboard shortcuts
 */
export const COMMAND_CATEGORIES = {
  NAVIGATE: 'navigate',
  CREATE: 'create',
  EDIT: 'edit',
  LINK: 'link',
  TOOL: 'tool',
  TOGGLE: 'toggle',
  BULK: 'bulk',
  SYSTEM: 'system',
} as const;

export type CommandCategory = (typeof COMMAND_CATEGORIES)[keyof typeof COMMAND_CATEGORIES];

/**
 * Command scope determines where command is available
 */
export const COMMAND_SCOPES = {
  GLOBAL: 'global', // Available everywhere
  VIEW: 'view', // Available in specific views
  ENTITY: 'entity', // Available when entity selected
  PANEL: 'panel', // Available in specific dock panels
} as const;

export type CommandScope = (typeof COMMAND_SCOPES)[keyof typeof COMMAND_SCOPES];

/**
 * Command confirmation policies for safety
 */
export const CONFIRMATION_POLICIES = {
  NONE: 'none', // Execute immediately
  CONFIRM: 'confirm', // Ask for confirmation
  DOUBLE_CONFIRM: 'double', // Ask twice for destructive actions
  PREVIEW: 'preview', // Show preview before execution
} as const;

export type ConfirmationPolicy = (typeof CONFIRMATION_POLICIES)[keyof typeof CONFIRMATION_POLICIES];

/**
 * Command definition interface
 */
export interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  scope: CommandScope;

  // Keyboard shortcuts (research: Schedule X + Obsidian patterns)
  shortcut?: string; // e.g., 'mod+k', 'ctrl+shift+p'

  // Execution
  execute: (args?: any) => Promise<void> | void;
  confirmPolicy?: ConfirmationPolicy;

  // Availability conditions
  available?: (context?: any) => boolean;

  // Search optimization
  keywords?: string[]; // Additional search terms
  aliases?: string[]; // Alternative names

  // UI customization
  icon?: string; // Lucide icon name

  // Performance
  priority?: number; // Higher numbers appear first in search
}

/**
 * Core Navigation Commands (Research: Obsidian workspace patterns)
 */
export const NAVIGATION_COMMANDS: CommandDefinition[] = [
  {
    id: 'navigate.view.week',
    title: 'Navigate to Week View',
    description: 'Switch to weekly calendar view',
    category: COMMAND_CATEGORIES.NAVIGATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+1',
    keywords: ['week', 'calendar', 'weekly'],
    icon: 'Calendar',
    priority: 100,
    execute: () => {
      useAppShell.getState().setActiveView('week');
    },
  },
  {
    id: 'navigate.view.planner',
    title: 'Navigate to Planner',
    description: 'Switch to kanban planning view',
    category: COMMAND_CATEGORIES.NAVIGATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+2',
    keywords: ['planner', 'kanban', 'tasks'],
    icon: 'LayoutBoard',
    priority: 95,
    execute: () => {
      useAppShell.getState().setActiveView('planner');
    },
  },
  {
    id: 'navigate.view.notes',
    title: 'Navigate to Notes',
    description: 'Switch to notes and documentation view',
    category: COMMAND_CATEGORIES.NAVIGATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+3',
    keywords: ['notes', 'markdown', 'docs'],
    icon: 'FileText',
    priority: 90,
    execute: () => {
      useAppShell.getState().setActiveView('notes');
    },
  },
  {
    id: 'navigate.view.mailbox',
    title: 'Navigate to Mailbox',
    description: 'Switch to email triage view',
    category: COMMAND_CATEGORIES.NAVIGATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+4',
    keywords: ['mailbox', 'email', 'triage'],
    icon: 'Mail',
    priority: 85,
    execute: () => {
      useAppShell.getState().setActiveView('mailbox');
    },
  },
];

/**
 * Creation Commands (Research: Schedule X double-click patterns)
 */
export const CREATION_COMMANDS: CommandDefinition[] = [
  {
    id: 'create.event',
    title: 'Create Event',
    description: 'Create a new calendar event',
    category: COMMAND_CATEGORIES.CREATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+n',
    keywords: ['event', 'meeting', 'appointment'],
    icon: 'Plus',
    priority: 100,
    execute: async () => {
      // TODO: Phase 3 - Integrate with calendar backend
      console.log('Creating new event...');
    },
  },
  {
    id: 'create.task',
    title: 'Create Task',
    description: 'Create a new task or to-do item',
    category: COMMAND_CATEGORIES.CREATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+shift+n',
    keywords: ['task', 'todo', 'action item'],
    icon: 'CheckSquare',
    priority: 95,
    execute: async () => {
      console.log('Creating new task...');
    },
  },
  {
    id: 'create.note',
    title: 'Create Note',
    description: 'Create a new note or document',
    category: COMMAND_CATEGORIES.CREATE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+shift+d',
    keywords: ['note', 'document', 'markdown'],
    icon: 'FileText',
    priority: 90,
    execute: async () => {
      console.log('Creating new note...');
    },
  },
];

/**
 * Panel Toggle Commands (Research: Context dock patterns)
 */
export const PANEL_COMMANDS: CommandDefinition[] = [
  {
    id: 'toggle.panel.ai',
    title: 'Toggle AI Assistant',
    description: 'Show/hide AI assistant panel',
    category: COMMAND_CATEGORIES.TOGGLE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+shift+a',
    keywords: ['ai', 'assistant', 'agent'],
    icon: 'Bot',
    priority: 100,
    execute: () => {
      const { toggleDockPanel } = useAppShell.getState();
      toggleDockPanel('ai');
    },
  },
  {
    id: 'toggle.panel.details',
    title: 'Toggle Details Panel',
    description: 'Show/hide entity details and properties',
    category: COMMAND_CATEGORIES.TOGGLE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+shift+i',
    keywords: ['details', 'properties', 'info'],
    icon: 'Info',
    priority: 95,
    execute: () => {
      const { toggleDockPanel } = useAppShell.getState();
      toggleDockPanel('details');
    },
  },
  {
    id: 'toggle.panel.conflicts',
    title: 'Toggle Conflicts Panel',
    description: 'Show/hide scheduling conflicts',
    category: COMMAND_CATEGORIES.TOGGLE,
    scope: COMMAND_SCOPES.GLOBAL,
    shortcut: 'mod+shift+c',
    keywords: ['conflicts', 'scheduling', 'overlaps'],
    icon: 'AlertTriangle',
    priority: 90,
    execute: () => {
      const { toggleDockPanel } = useAppShell.getState();
      toggleDockPanel('conflicts');
    },
  },
];

/**
 * Tool Commands (Research: MCP tool patterns)
 */
export const TOOL_COMMANDS: CommandDefinition[] = [
  {
    id: 'tool.resolve.conflicts',
    title: 'Resolve Conflicts',
    description: 'Run AI-powered conflict resolution',
    category: COMMAND_CATEGORIES.TOOL,
    scope: COMMAND_SCOPES.VIEW,
    shortcut: 'mod+r',
    keywords: ['resolve', 'conflicts', 'ai', 'schedule'],
    icon: 'Wand2',
    priority: 100,
    confirmPolicy: CONFIRMATION_POLICIES.PREVIEW,
    execute: async () => {
      // TODO: Phase 4 - AI Integration
      console.log('Running conflict resolution...');
    },
  },
  {
    id: 'tool.auto.schedule',
    title: 'Auto Schedule Tasks',
    description: 'Automatically schedule unscheduled tasks',
    category: COMMAND_CATEGORIES.TOOL,
    scope: COMMAND_SCOPES.VIEW,
    shortcut: 'mod+shift+s',
    keywords: ['auto', 'schedule', 'tasks', 'ai'],
    icon: 'CalendarDays',
    priority: 95,
    confirmPolicy: CONFIRMATION_POLICIES.PREVIEW,
    execute: async () => {
      console.log('Auto-scheduling tasks...');
    },
  },
];

/**
 * System Commands
 */
export const SYSTEM_COMMANDS: CommandDefinition[] = [
  {
    id: 'system.save.layout',
    title: 'Save Workspace Layout',
    description: 'Save current workspace layout configuration',
    category: COMMAND_CATEGORIES.SYSTEM,
    scope: COMMAND_SCOPES.GLOBAL,
    keywords: ['save', 'layout', 'workspace'],
    icon: 'Save',
    priority: 70,
    execute: async () => {
      const layoutName = prompt('Enter layout name:');
      if (layoutName) {
        const { saveLayout } = useAppShell.getState();
        saveLayout(layoutName);
      }
    },
  },
  {
    id: 'system.emergency.rollback',
    title: 'Emergency Rollback',
    description: 'Rollback to legacy calendar (emergency only)',
    category: COMMAND_CATEGORIES.SYSTEM,
    scope: COMMAND_SCOPES.GLOBAL,
    keywords: ['emergency', 'rollback', 'legacy'],
    icon: 'AlertTriangle',
    priority: 0,
    confirmPolicy: CONFIRMATION_POLICIES.DOUBLE_CONFIRM,
    execute: async () => {
      const { EmergencyRollbackSystem } = await import('@/lib/emergency/rollback-system');
      await EmergencyRollbackSystem.emergencyRollback('User initiated');
    },
  },
];

/**
 * Master command registry combining all command categories
 */
export const ALL_COMMANDS: CommandDefinition[] = [
  ...NAVIGATION_COMMANDS,
  ...CREATION_COMMANDS,
  ...PANEL_COMMANDS,
  ...TOOL_COMMANDS,
  ...SYSTEM_COMMANDS,
];

/**
 * Command execution utilities
 */
export class CommandExecutor {
  /**
   * Execute command with safety checks and confirmation handling
   */
  static async executeCommand(command: CommandDefinition, context?: any) {
    try {
      // Check availability
      if (command.available && !command.available(context)) {
        throw new Error(`Command "${command.title}" is not available in current context`);
      }

      // Handle confirmation policy
      if (command.confirmPolicy === CONFIRMATION_POLICIES.CONFIRM) {
        const confirmed = confirm(`Execute: ${command.title}?`);
        if (!confirmed) return;
      }

      if (command.confirmPolicy === CONFIRMATION_POLICIES.DOUBLE_CONFIRM) {
        const firstConfirm = confirm(`⚠️ DESTRUCTIVE: ${command.title}. Are you sure?`);
        if (!firstConfirm) return;

        const secondConfirm = confirm(`⚠️ FINAL WARNING: This will ${command.title}. Continue?`);
        if (!secondConfirm) return;
      }

      // Execute command
      const startTime = performance.now();
      await command.execute(context);
      const executionTime = performance.now() - startTime;

      // Performance tracking
      if (executionTime > 100) {
        console.warn(
          `⚠️ Command "${command.id}" took ${executionTime.toFixed(2)}ms (target: <100ms)`
        );
      }

      // Log successful execution
      console.log(`✅ Command executed: ${command.title} (${executionTime.toFixed(2)}ms)`);
    } catch (error) {
      console.error(`❌ Command failed: ${command.title}`, error);
      throw error;
    }
  }

  /**
   * Search commands using fuzzy matching (fuzzysort integration)
   */
  static searchCommands(query: string, availableCommands = ALL_COMMANDS) {
    if (!query.trim()) {
      // Return recent/favorite commands when no query
      return availableCommands.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 10);
    }

    // Use fuzzysort for fuzzy matching (imported in CommandPalette)
    const searchTargets = availableCommands.map((cmd) => ({
      command: cmd,
      searchText: [
        cmd.title,
        cmd.description || '',
        ...(cmd.keywords || []),
        ...(cmd.aliases || []),
      ].join(' '),
    }));

    return searchTargets
      .map(({ command, searchText }) => {
        // Simple contains-based search (fuzzysort will be used in component)
        const score = query
          .toLowerCase()
          .split(' ')
          .reduce((acc, term) => {
            if (searchText.toLowerCase().includes(term)) {
              return acc + 1;
            }
            return acc;
          }, 0);

        return { command, score };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || (b.command.priority || 0) - (a.command.priority || 0))
      .map((result) => result.command);
  }

  /**
   * Get commands by category
   */
  static getCommandsByCategory(category: CommandCategory) {
    return ALL_COMMANDS.filter((cmd) => cmd.category === category);
  }

  /**
   * Get commands by scope
   */
  static getCommandsByScope(scope: CommandScope) {
    return ALL_COMMANDS.filter((cmd) => cmd.scope === scope);
  }

  /**
   * Get command by ID
   */
  static getCommandById(id: string) {
    return ALL_COMMANDS.find((cmd) => cmd.id === id);
  }
}

/**
 * Command registration for dynamic commands (plugins, extensions)
 */
export class DynamicCommandRegistry {
  private static dynamicCommands: CommandDefinition[] = [];

  /**
   * Register a new command at runtime
   */
  static registerCommand(command: CommandDefinition) {
    // Validate command structure
    if (!command.id || !command.title || !command.category || !command.execute) {
      throw new Error('Invalid command definition');
    }

    // Check for ID conflicts
    const existingCommand = [...ALL_COMMANDS, ...this.dynamicCommands].find(
      (cmd) => cmd.id === command.id
    );
    if (existingCommand) {
      throw new Error(`Command ID "${command.id}" already exists`);
    }

    this.dynamicCommands.push(command);
  }

  /**
   * Unregister a dynamic command
   */
  static unregisterCommand(id: string) {
    this.dynamicCommands = this.dynamicCommands.filter((cmd) => cmd.id !== id);
  }

  /**
   * Get all commands (static + dynamic)
   */
  static getAllCommands(): CommandDefinition[] {
    return [...ALL_COMMANDS, ...this.dynamicCommands];
  }

  /**
   * Clear all dynamic commands
   */
  static clearDynamicCommands() {
    this.dynamicCommands = [];
  }
}

/**
 * Command context utilities for scope-aware command availability
 */
export const CommandContext = {
  /**
   * Get available commands for current context
   */
  getAvailableCommands: (view?: string, selectedEntity?: any, activePanel?: string) => {
    return DynamicCommandRegistry.getAllCommands()
      .filter((command) => {
        // Check scope-based availability
        switch (command.scope) {
          case COMMAND_SCOPES.VIEW:
            return view !== undefined;
          case COMMAND_SCOPES.ENTITY:
            return selectedEntity !== undefined;
          case COMMAND_SCOPES.PANEL:
            return activePanel !== undefined;
          case COMMAND_SCOPES.GLOBAL:
          default:
            return true;
        }
      })
      .filter((command) => {
        // Check custom availability function
        if (command.available) {
          return command.available({ view, selectedEntity, activePanel });
        }
        return true;
      });
  },
};
