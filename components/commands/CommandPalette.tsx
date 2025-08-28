/**
 * Command Palette - Fuzzy search command interface
 * Research validation: Obsidian Ctrl+P/Cmd+P patterns + Schedule X keyboard interaction
 */

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command'
import fuzzysort from 'fuzzysort'
import { 
  CommandExecutor,
  DynamicCommandRegistry,
  CommandContext,
  type CommandDefinition,
  COMMAND_CATEGORIES
} from '@/lib/commands/CommandRegistry'
import { useCommandSystem } from '@/lib/features/useFeatureFlags'
import { useAppShell } from '@/contexts/AppShellProvider'
import { useCommands } from '@/hooks/useCommands'
import { cn } from '@/lib/utils'

/**
 * Command Palette Hook for state management
 */
function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { isPaletteEnabled, isFuzzySearchEnabled } = useCommandSystem()
  const { activeView, activeDockPanel } = useAppShell()
  
  // Get available commands based on context
  const availableCommands = useMemo(() => {
    if (!isPaletteEnabled) return []
    
    return CommandContext.getAvailableCommands(
      activeView,
      undefined, // TODO: selectedEntity from context
      activeDockPanel || undefined
    )
  }, [isPaletteEnabled, activeView, activeDockPanel])
  
  // Fuzzy search with fuzzysort (research: SublimeText-like search)
  const searchResults = useMemo(() => {
    if (!search.trim() || !isFuzzySearchEnabled) {
      // Return prioritized commands when no search
      return availableCommands
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 10)
    }
    
    // Prepare search targets for fuzzysort
    const targets = availableCommands.map(cmd => ({
      command: cmd,
      target: `${cmd.title} ${cmd.description || ''} ${(cmd.keywords || []).join(' ')}`
    }))
    
    // Use fuzzysort for fuzzy matching
    const results = fuzzysort.go(search, targets, {
      key: 'target',
      limit: 10,
      threshold: -10000 // Allow lower quality matches
    })
    
    return results.map(result => result.obj.command)
  }, [search, availableCommands, isFuzzySearchEnabled])
  
  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])
  
  return {
    open,
    setOpen,
    search,
    setSearch,
    searchResults,
    selectedIndex,
    setSelectedIndex,
    isPaletteEnabled,
    availableCommands
  }
}

/**
 * Main Command Palette Component
 */
export function CommandPalette() {
  const {
    open,
    setOpen,
    search,
    setSearch,
    searchResults,
    selectedIndex,
    setSelectedIndex,
    isPaletteEnabled
  } = useCommandPalette()
  
  // Debug logging in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('CommandPalette rendering, isPaletteEnabled:', isPaletteEnabled, 'open:', open)
  }
  
  const { executeCommand: executeWithTracking, getRecentCommandDefinitions } = useCommands()
  
  const executeCommand = useCallback(async (command: CommandDefinition) => {
    const startTime = performance.now()
    
    const result = await executeWithTracking(command)
    
    const executionTime = performance.now() - startTime
    
    if (result.success) {
      console.log(`✅ Command executed: ${command.title} (${executionTime.toFixed(2)}ms)`)
    } else {
      console.error(`❌ Command failed: ${command.title}`, result.error)
      // TODO: Show error toast
    }
  }, [executeWithTracking])
  
  // Keyboard shortcuts using native event listeners (research: shadcn/ui pattern for Playwright compatibility)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Key pressed:', e.key, 'Meta:', e.metaKey, 'Ctrl:', e.ctrlKey)
      }
      
      // Command Palette open shortcuts (Cmd/Ctrl+P or Cmd/Ctrl+K)
      if ((e.key === 'p' || e.key === 'P' || e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('CommandPalette shortcut triggered! Opening palette...')
        }
        e.preventDefault()
        if (isPaletteEnabled) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Setting open to true')
          }
          setOpen((open) => !open)
        }
        return
      }
      
      // Only handle following keys when palette is open
      if (!open) return
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setSearch('')
        return
      }
      
      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        return
      }
      
      // Enter to execute command
      if (e.key === 'Enter') {
        e.preventDefault()
        const command = searchResults[selectedIndex]
        if (command) {
          await executeCommand(command)
          setOpen(false)
          setSearch('')
        }
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPaletteEnabled, open, searchResults, selectedIndex, setOpen, setSearch, executeCommand])
  
  if (!isPaletteEnabled) {
    return null
  }
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen} data-testid="command-palette">
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
        className="font-mono text-sm"
        data-testid="command-palette-input"
      />
      
      <CommandList>
        {searchResults.length === 0 ? (
          <CommandEmpty>No commands found.</CommandEmpty>
        ) : (
          <>
            {/* Show recent commands when no search */}
            {!search.trim() && (
              <>
                {(() => {
                  const recentCommands = getRecentCommandDefinitions()
                  if (recentCommands.length > 0) {
                    return (
                      <CommandGroup heading="Recent Commands" data-testid="recent-commands">
                        {recentCommands.slice(0, 5).map((command, index) => (
                          <CommandItem
                            key={`recent-${command.id}`}
                            value={`recent-${command.id}`}
                            onSelect={() => executeCommand(command)}
                            className={cn(
                              'flex items-center justify-between px-3 py-2',
                              selectedIndex === index && 'bg-accent text-accent-foreground'
                            )}
                            data-testid="recent-command"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium">{command.title}</span>
                            </div>
                            {command.shortcut && (
                              <CommandShortcut className="text-xs">
                                {command.shortcut.replace('mod', '⌘')}
                              </CommandShortcut>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  }
                  return null
                })()}
                <CommandSeparator />
              </>
            )}
            
            {/* Group commands by category */}
            {Object.values(COMMAND_CATEGORIES).map(category => {
              const categoryCommands = searchResults.filter(cmd => cmd.category === category)
              
              if (categoryCommands.length === 0) return null
              
              return (
                <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)} data-testid="command-category">
                  {categoryCommands.map((command, index) => {
                    const globalIndex = searchResults.indexOf(command)
                    const isSelected = selectedIndex === globalIndex
                    
                    return (
                      <CommandItem
                        key={command.id}
                        value={command.id}
                        onSelect={() => executeCommand(command)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2',
                          isSelected && 'bg-accent text-accent-foreground'
                        )}
                        data-testid="command-result"
                        data-selected={isSelected ? "true" : "false"}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {/* Command icon */}
                          {command.icon && (
                            <div className="w-4 h-4 text-muted-foreground">
                              {/* Icon will be rendered based on icon name */}
                            </div>
                          )}
                          
                          {/* Command info */}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{command.title}</span>
                            {command.description && (
                              <span className="text-xs text-muted-foreground">
                                {command.description}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Keyboard shortcut */}
                        {command.shortcut && (
                          <CommandShortcut className="text-xs" data-testid="command-shortcut">
                            {command.shortcut.replace('mod', '⌘')}
                          </CommandShortcut>
                        )}
                        
                        {/* Command category badge */}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {command.category}
                        </Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
          </>
        )}
      </CommandList>
      
      {/* Command Palette Footer - Performance info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t border-border p-2">
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Commands: {searchResults.length}</span>
            <span>Query: "{search}"</span>
          </div>
        </div>
      )}
    </CommandDialog>
  )
}

/**
 * Command Palette Performance Hook
 * Monitors search and execution performance against research targets
 */
export function useCommandPalettePerformance() {
  const [searchTimes, setSearchTimes] = useState<number[]>([])
  
  const recordSearchTime = useCallback((time: number) => {
    setSearchTimes(prev => {
      const newTimes = [...prev, time].slice(-10) // Keep last 10
      
      // Performance target: <100ms for command palette operations
      if (time > 100) {
        console.warn(`⚠️ Command search: ${time.toFixed(2)}ms (target: <100ms)`)
      }
      
      return newTimes
    })
  }, [])
  
  return {
    recordSearchTime,
    averageSearchTime: searchTimes.length > 0 
      ? searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length 
      : 0,
    isPerformant: searchTimes.length > 0 
      ? searchTimes.every(time => time < 100) 
      : true
  }
}

/**
 * Command Palette Provider for global state
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    console.log('CommandPaletteProvider mounted')
  }
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}