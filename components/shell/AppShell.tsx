/**
 * AppShell - Command Workspace Three-Pane Layout  
 * Research-validated architecture based on Obsidian workspace patterns
 */

'use client'

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { GeistSans } from 'geist/font/sans'
import { useCommandWorkspaceShell } from '@/lib/features/useFeatureFlags'
import { Sidebar } from './Sidebar/Sidebar'
import { TabWorkspace } from './TabWorkspace/TabWorkspace' 
import { ContextDock } from './ContextDock/ContextDock'
import { LegacyCalendarFallback } from './LegacyCalendarFallback'
import { CommandPaletteProvider } from '@/components/commands/CommandPalette'
import { OmniboxProvider } from '@/components/commands/OmniboxProvider'
import { useGlobalKeyboard } from '@/lib/keyboard/KeyboardManager'
import { cn } from '@/lib/utils'
import { CalendarProvider } from '@/contexts/CalendarContext'
import { SettingsProvider } from '@/contexts/SettingsContext'

interface AppShellProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Main Command Workspace Shell
 *
 * Architecture: Sidebar (20%) + TabWorkspace (60%) + ContextDock (20%)
 * Research validation: Obsidian workspaces plugin patterns
 * Performance target: <500ms initial render, 60fps resizing
 */
export function AppShell({ children, className }: AppShellProps) {
  const { shouldShowShell, shouldRedirectToLegacy, isLegacyMode } = useCommandWorkspaceShell()

  // Initialize global keyboard navigation (research: Schedule X patterns)
  useGlobalKeyboard()

  // Feature flag safety: Fallback to legacy calendar if shell disabled
  if (isLegacyMode || shouldRedirectToLegacy) {
    return <LegacyCalendarFallback />
  }

  if (!shouldShowShell) {
    return (
      <div className={cn(
        'flex h-screen w-screen items-center justify-center',
        'bg-background text-foreground',
        GeistSans.className,
        className
      )}>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Command Workspace Loading...</h2>
          <p className="text-muted-foreground">Setting up three-pane workspace</p>
        </div>
      </div>
    )
  }

  return (
    <SettingsProvider>
      <CalendarProvider year={new Date().getFullYear()}>
        <CommandPaletteProvider>
          <div 
        data-testid="app-shell"
        className={cn(
        'h-screen w-screen bg-background text-foreground',
        'command-workspace',
        GeistSans.className,
        className
      )}>
        {/* Omnibox - Global natural language interface */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <OmniboxProvider />
        </div>

        <PanelGroup
          direction="horizontal"
          className="h-full w-full"
          autoSaveId="command-workspace-layout"
          data-testid="panel-group"
        >
          {/* Left Sidebar - Calendar, Tasks, Notes, Mailbox sections */}
          <Panel
            id="sidebar"
            order={1}
            defaultSize={20}
            minSize={15}
            maxSize={35}
            className="bg-muted/30 border-r border-border"
            data-testid="app-shell-sidebar"
          >
            <Sidebar />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-muted transition-colors" />

          {/* Center Tab Workspace - Main content area */}
          <Panel
            id="workspace"
            order={2}
            defaultSize={60}
            minSize={40}
            className="bg-background"
            data-testid="tab-workspace"
          >
            <TabWorkspace>
              {children}
            </TabWorkspace>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-muted transition-colors" />

          {/* Right Context Dock - AI agents, details, conflicts, etc. */}
          <Panel
            id="dock"
            order={3}
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className="bg-muted/30 border-l border-border"
            data-testid="context-dock"
          >
            <ContextDock />
          </Panel>
        </PanelGroup>
          </div>
        </CommandPaletteProvider>
      </CalendarProvider>
    </SettingsProvider>
  )
}

/**
 * AppShell Performance Monitoring
 * Tracks shell render performance against research-validated targets
 */
export function useAppShellPerformance() {
  const startTime = performance.now()
  
  return {
    measureRenderTime: () => {
      const renderTime = performance.now() - startTime
      
      // Log performance against target (<500ms)
      if (renderTime > 500) {
        console.warn(`⚠️ AppShell render time: ${renderTime.toFixed(2)}ms (target: <500ms)`)
      } else {
        console.log(`✅ AppShell render time: ${renderTime.toFixed(2)}ms`)
      }
      
      return renderTime
    }
  }
}