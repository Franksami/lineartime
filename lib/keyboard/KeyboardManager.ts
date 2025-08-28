/**
 * Keyboard Manager - Global keyboard navigation system
 * Research validation: Schedule X keyboard patterns + Obsidian navigation
 */

import { useHotkeys } from 'react-hotkeys-hook'
import { useCallback, useEffect } from 'react'
import { CommandExecutor, DynamicCommandRegistry } from '@/lib/commands/CommandRegistry'
import { useAppShell } from '@/contexts/AppShellProvider'

/**
 * Global keyboard shortcuts configuration
 * Research validation: Schedule X + Obsidian keyboard patterns
 */
export const GLOBAL_SHORTCUTS = {
  // Command Palette (research: Obsidian standard)
  COMMAND_PALETTE: ['meta+k', 'ctrl+k'],
  
  // Quick navigation (research: Schedule X patterns)
  NAVIGATE_WEEK: ['mod+1'],
  NAVIGATE_PLANNER: ['mod+2'], 
  NAVIGATE_NOTES: ['mod+3'],
  NAVIGATE_MAILBOX: ['mod+4'],
  
  // Quick creation (research: Schedule X double-click equivalent)
  CREATE_EVENT: ['mod+n'],
  CREATE_TASK: ['mod+shift+n'],
  CREATE_NOTE: ['mod+shift+d'],
  
  // Context dock panels
  TOGGLE_AI_PANEL: ['mod+shift+a'],
  TOGGLE_DETAILS_PANEL: ['mod+shift+i'],
  TOGGLE_CONFLICTS_PANEL: ['mod+shift+c'],
  
  // Workspace management (research: Obsidian workspace patterns)
  SAVE_LAYOUT: ['mod+shift+s'],
  CYCLE_LAYOUTS: ['mod+shift+l'],
  
  // Quick actions
  TODAY_VIEW: ['g', 't'], // Sequence: press 'g' then 't' for "go to today"
  FOCUS_MODE: ['mod+shift+f'],
  
  // Emergency (safety)
  EMERGENCY_ROLLBACK: ['mod+shift+alt+r']
} as const

/**
 * View-specific keyboard shortcuts
 */
export const VIEW_SHORTCUTS = {
  week: {
    // Week navigation (research: Schedule X navigation patterns)
    PREV_WEEK: ['arrowleft', 'h'],
    NEXT_WEEK: ['arrowright', 'l'],
    TODAY: ['d'],
    
    // Event manipulation (research: Schedule X double-click patterns)
    CREATE_EVENT_AT_TIME: ['enter'], // When time slot selected
    EDIT_SELECTED_EVENT: ['e'],
    DELETE_SELECTED_EVENT: ['del', 'backspace'],
    
    // Selection navigation
    SELECT_UP: ['arrowup', 'k'],
    SELECT_DOWN: ['arrowdown', 'j'],
    SELECT_LEFT: ['arrowleft', 'h'],
    SELECT_RIGHT: ['arrowright', 'l']
  },
  
  planner: {
    // Task manipulation
    EDIT_TASK: ['enter'],
    NEW_TASK: ['n'],
    DELETE_TASK: ['del'],
    MOVE_TASK_UP: ['mod+arrowup'],
    MOVE_TASK_DOWN: ['mod+arrowdown'],
    
    // Column navigation
    MOVE_TO_TODO: ['1'],
    MOVE_TO_PROGRESS: ['2'],
    MOVE_TO_DONE: ['3']
  },
  
  notes: {
    // Note editing
    EDIT_MODE: ['enter'],
    SAVE_NOTE: ['mod+s'],
    NEW_NOTE: ['mod+n'],
    
    // Navigation
    PREV_NOTE: ['mod+arrowup'],
    NEXT_NOTE: ['mod+arrowdown']
  }
} as const

/**
 * Keyboard Manager Class
 */
export class KeyboardManager {
  private static sequenceBuffer: string[] = []
  private static sequenceTimeout: NodeJS.Timeout | null = null
  
  /**
   * Handle key sequences (e.g., 'g' then 't' for "go to today")
   */
  static handleKeySequence(key: string, callback: () => void, sequence: string[]) {
    this.sequenceBuffer.push(key)
    
    // Clear sequence after timeout
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout)
    }
    
    this.sequenceTimeout = setTimeout(() => {
      this.sequenceBuffer = []
    }, 1000) // 1 second timeout for sequences
    
    // Check if sequence matches
    if (this.sequenceBuffer.join(',') === sequence.join(',')) {
      callback()
      this.sequenceBuffer = []
      if (this.sequenceTimeout) {
        clearTimeout(this.sequenceTimeout)
      }
    }
  }
  
  /**
   * Execute command by keyboard shortcut
   */
  static async executeShortcut(shortcut: string) {
    const command = DynamicCommandRegistry.getAllCommands().find(cmd => cmd.shortcut === shortcut)
    
    if (command) {
      await CommandExecutor.executeCommand(command)
    }
  }
  
  /**
   * Focus management (research: Schedule X automatic focus)
   */
  static manageFocus(element: HTMLElement) {
    // Auto-focus with keyboard navigation support
    element.focus()
    
    // Scroll into view if needed
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    })
  }
  
  /**
   * Handle escape key consistently across all components
   * Research validation: Schedule X escape key handling
   */
  static handleEscape(callback?: () => void) {
    return useHotkeys('escape', () => {
      if (callback) {
        callback()
      } else {
        // Default escape behavior - close modals, clear selections
        const { setActiveDockPanel } = useAppShell.getState()
        setActiveDockPanel(null)
      }
    }, { enableOnFormTags: true })
  }
}

/**
 * Global Keyboard Manager Hook
 * Sets up global shortcuts for Command Workspace
 */
export function useGlobalKeyboard() {
  const { activeView, setActiveView, toggleDockPanel } = useAppShell()
  
  // Command palette (research: Obsidian standard)
  useHotkeys('meta+k,ctrl+k', (e) => {
    e.preventDefault()
    // Command palette will handle opening
  }, { enableOnFormTags: true })
  
  // Quick navigation (research: Schedule X number key patterns)
  // Support both Mod+N and Alt+N for cross-platform compatibility
  useHotkeys('mod+1,alt+1', () => setActiveView('week'))
  useHotkeys('mod+2,alt+2', () => setActiveView('planner'))
  useHotkeys('mod+3,alt+3', () => setActiveView('notes'))
  useHotkeys('mod+4,alt+4', () => setActiveView('mailbox'))
  
  // Panel toggles
  useHotkeys('mod+shift+a', () => toggleDockPanel('ai'))
  useHotkeys('mod+shift+i', () => toggleDockPanel('details'))
  useHotkeys('mod+shift+c', () => toggleDockPanel('conflicts'))
  
  // Today navigation (research: 'g' then 't' sequence pattern)
  useHotkeys('g', () => {
    KeyboardManager.handleKeySequence('g', () => {}, ['g'])
  })
  
  useHotkeys('t', () => {
    KeyboardManager.handleKeySequence('t', () => {
      // Navigate to today in current view
      console.log('Navigate to today')
      // TODO: Implement today navigation per view
    }, ['g', 't'])
  })
  
  // Emergency rollback (safety)
  useHotkeys('mod+shift+alt+r', async () => {
    const confirmed = confirm('⚠️ Emergency rollback to legacy calendar?')
    if (confirmed) {
      const { EmergencyRollbackSystem } = await import('@/lib/emergency/rollback-system')
      await EmergencyRollbackSystem.emergencyRollback('Keyboard shortcut')
    }
  })
}

/**
 * View-specific keyboard hook
 */
export function useViewKeyboard(view: string) {
  const shortcuts = VIEW_SHORTCUTS[view as keyof typeof VIEW_SHORTCUTS]
  
  if (!shortcuts) {
    return {}
  }
  
  // Return view-specific keyboard handlers
  return {
    shortcuts,
    
    // Helper for setting up view shortcuts
    setupViewShortcuts: (handlers: Record<string, () => void>) => {
      Object.entries(shortcuts).forEach(([action, keys]) => {
        const handler = handlers[action]
        if (handler && Array.isArray(keys)) {
          useHotkeys(keys.join(','), handler, { 
            enableOnFormTags: false, // Disable in forms for view shortcuts
            preventDefault: true
          })
        }
      })
    }
  }
}

/**
 * Keyboard accessibility utilities
 * Research validation: WCAG 2.1 AA keyboard-only navigation
 */
export const KeyboardAccessibility = {
  /**
   * Ensure element is focusable and keyboard accessible
   */
  makeFocusable: (element: HTMLElement) => {
    element.setAttribute('tabindex', '0')
    element.setAttribute('role', 'button')
    
    // Add keyboard interaction
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        element.click()
      }
    })
  },
  
  /**
   * Create focus trap for modals (research: Schedule X modal focus)
   */
  createFocusTrap: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    // Focus first element
    firstElement?.focus()
    
    // Handle tab cycling
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab - move backwards
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab - move forwards
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    })
    
    return {
      destroy: () => {
        container.removeEventListener('keydown', () => {})
      }
    }
  },
  
  /**
   * Announce changes to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    setTimeout(() => document.body.removeChild(announcer), 1000)
  }
}