/**
 * useCommands Hook - Command system integration with recent commands tracking
 * Research validation: Obsidian command patterns + local persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { CommandDefinition, CommandExecutor, ALL_COMMANDS } from '@/lib/commands/CommandRegistry';

interface RecentCommand {
  id: string;
  timestamp: number;
  executionCount: number;
}

const RECENT_COMMANDS_KEY = 'lineartime:recentCommands';
const MAX_RECENT_COMMANDS = 10;

/**
 * Command system hook with recent commands tracking and persistence
 */
export function useCommands() {
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent commands from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentCommand[];
        // Clean up old entries (older than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const cleaned = parsed.filter((cmd) => cmd.timestamp > thirtyDaysAgo);
        setRecentCommands(cleaned);
      }
    } catch (error) {
      console.error('Failed to load recent commands:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save recent commands to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recentCommands));
      } catch (error) {
        console.error('Failed to save recent commands:', error);
      }
    }
  }, [recentCommands, isLoading]);

  /**
   * Track command execution and update recent commands
   */
  const trackCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const existing = prev.find((cmd) => cmd.id === commandId);

      if (existing) {
        // Update existing command with new timestamp and increment count
        const updated = prev.map((cmd) =>
          cmd.id === commandId
            ? {
                ...cmd,
                timestamp: Date.now(),
                executionCount: cmd.executionCount + 1,
              }
            : cmd
        );
        // Sort by timestamp (most recent first)
        return updated.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        // Add new command to recent list
        const newCommand: RecentCommand = {
          id: commandId,
          timestamp: Date.now(),
          executionCount: 1,
        };

        // Add to beginning and limit to MAX_RECENT_COMMANDS
        const updated = [newCommand, ...prev].slice(0, MAX_RECENT_COMMANDS);
        return updated;
      }
    });
  }, []);

  /**
   * Execute a command with tracking
   */
  const executeCommand = useCallback(
    async (command: CommandDefinition, context?: any) => {
      try {
        // Track before execution (in case execution fails, we still track the attempt)
        trackCommand(command.id);

        // Execute the command
        await CommandExecutor.executeCommand(command, context);

        return { success: true };
      } catch (error) {
        console.error(`Failed to execute command: ${command.id}`, error);
        return { success: false, error };
      }
    },
    [trackCommand]
  );

  /**
   * Get recent command definitions
   */
  const getRecentCommandDefinitions = useCallback((): CommandDefinition[] => {
    return recentCommands
      .map((recent) => ALL_COMMANDS.find((cmd) => cmd.id === recent.id))
      .filter(Boolean) as CommandDefinition[];
  }, [recentCommands]);

  /**
   * Get frequently used commands (sorted by execution count)
   */
  const getFrequentCommands = useCallback((): CommandDefinition[] => {
    const sorted = [...recentCommands].sort((a, b) => b.executionCount - a.executionCount);
    return sorted
      .slice(0, 5) // Top 5 most frequently used
      .map((recent) => ALL_COMMANDS.find((cmd) => cmd.id === recent.id))
      .filter(Boolean) as CommandDefinition[];
  }, [recentCommands]);

  /**
   * Clear recent commands history
   */
  const clearRecentCommands = useCallback(() => {
    setRecentCommands([]);
    try {
      localStorage.removeItem(RECENT_COMMANDS_KEY);
    } catch (error) {
      console.error('Failed to clear recent commands:', error);
    }
  }, []);

  /**
   * Search commands with recent/frequent boost
   */
  const searchCommands = useCallback(
    (query: string): CommandDefinition[] => {
      const results = CommandExecutor.searchCommands(query);

      if (!query.trim()) {
        // When no query, prioritize recent commands
        const recent = getRecentCommandDefinitions();
        const frequent = getFrequentCommands();

        // Combine recent and frequent, removing duplicates
        const prioritized = [...recent];
        frequent.forEach((cmd) => {
          if (!prioritized.find((c) => c.id === cmd.id)) {
            prioritized.push(cmd);
          }
        });

        // Add other high-priority commands
        const others = ALL_COMMANDS.filter((cmd) => !prioritized.find((c) => c.id === cmd.id))
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, Math.max(0, 10 - prioritized.length));

        return [...prioritized, ...others];
      }

      // Boost recent commands in search results
      const recentIds = new Set(recentCommands.map((r) => r.id));
      return results.sort((a, b) => {
        const aIsRecent = recentIds.has(a.id);
        const bIsRecent = recentIds.has(b.id);

        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;

        return 0; // Maintain original search order for non-recent items
      });
    },
    [recentCommands, getRecentCommandDefinitions, getFrequentCommands]
  );

  return {
    // Command execution
    executeCommand,
    trackCommand,

    // Recent commands
    recentCommands,
    getRecentCommandDefinitions,
    getFrequentCommands,
    clearRecentCommands,

    // Search with recent boost
    searchCommands,

    // Loading state
    isLoading,
  };
}

/**
 * Hook for keyboard shortcut registration
 */
export function useCommandShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Get matching command based on shortcut
      const matchingCommand = ALL_COMMANDS.find((cmd) => {
        if (!cmd.shortcut) return false;

        const shortcut = cmd.shortcut.toLowerCase();
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

        // Parse shortcut (e.g., "mod+shift+a" or "ctrl+k")
        const parts = shortcut.split('+');
        const requiredMod = parts.includes('mod') || parts.includes('ctrl');
        const requiredShift = parts.includes('shift');
        const requiredAlt = parts.includes('alt');
        const key = parts[parts.length - 1];

        // Check modifiers
        const modPressed = isMac ? event.metaKey : event.ctrlKey;
        if (requiredMod && !modPressed) return false;
        if (requiredShift && !event.shiftKey) return false;
        if (requiredAlt && !event.altKey) return false;

        // Check key
        return event.key.toLowerCase() === key;
      });

      if (matchingCommand) {
        event.preventDefault();
        CommandExecutor.executeCommand(matchingCommand);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
