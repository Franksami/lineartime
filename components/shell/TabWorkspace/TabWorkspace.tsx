/**
 * TabWorkspace - Center pane of Command Workspace
 * Research-validated tab management with view scaffold contract
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { X, Plus, Pin, PinOff } from 'lucide-react'
import { useAppShell } from '@/contexts/AppShellProvider'
import { ViewScaffold } from './ViewScaffold'
import { WeekView } from '@/views/week/WeekView'
import { PlannerView } from '@/views/planner/PlannerView'
import { NotesView } from '@/views/notes/NotesView'
import { MailboxView } from '@/views/mailbox/MailboxView'
import { cn } from '@/lib/utils'

interface TabWorkspaceProps {
  children?: React.ReactNode
}

/**
 * Tab Workspace Component
 * Manages multiple open views with persistent state and routing integration
 */
export function TabWorkspace({ children }: TabWorkspaceProps) {
  const { 
    openTabs, 
    activeTabId, 
    activeView,
    setActiveTab, 
    closeTab, 
    openTab, 
    pinTab, 
    unpinTab 
  } = useAppShell()
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Sync URL params with active view
  const urlView = searchParams.get('view')
  
  const handleTabChange = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId)
    if (tab) {
      setActiveTab(tabId)
      
      // Update URL to reflect active view
      const params = new URLSearchParams(searchParams.toString())
      params.set('view', tab.view)
      router.push(`/app?${params.toString()}`, { scroll: false })
    }
  }
  
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const tab = openTabs.find(t => t.id === tabId)
    
    // Don't close if pinned or only tab
    if (tab?.pinned || openTabs.length <= 1) return
    
    closeTab(tabId)
  }
  
  const handlePinToggle = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const tab = openTabs.find(t => t.id === tabId)
    if (tab?.pinned) {
      unpinTab(tabId)
    } else {
      pinTab(tabId)
    }
  }
  
  const handleNewTab = () => {
    openTab('week', 'New Week View')
  }
  
  // Get active tab for content rendering
  const activeTab = openTabs.find(t => t.id === activeTabId)
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="tab-workspace-container">
      {/* Tab Bar */}
      <div className="border-b border-border bg-background" data-testid="tab-bar">
        <div className="flex items-center justify-between p-2">
          <Tabs 
            value={activeTabId} 
            onValueChange={handleTabChange}
            className="flex-1"
          >
            <TabsList className="h-auto p-1 bg-transparent">
              {openTabs.map((tab) => (
                <div key={tab.id} className="relative group">
                  <TabsTrigger
                    value={tab.id}
                    data-testid={`tab-${tab.view}`}
                    className={cn(
                      'relative px-3 py-2 text-sm transition-colors',
                      'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                      'hover:bg-muted/50',
                      'flex items-center gap-2 max-w-[200px]'
                    )}
                  >
                    {/* Pin indicator */}
                    {tab.pinned && (
                      <Pin className="h-3 w-3 text-muted-foreground" />
                    )}
                    
                    {/* Tab title */}
                    <span className="truncate">{tab.title}</span>
                    
                    {/* Close button (hidden for pinned tabs) */}
                    {!tab.pinned && openTabs.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          'h-4 w-4 p-0 opacity-0 group-hover:opacity-100',
                          'hover:bg-destructive hover:text-destructive-foreground',
                          'transition-opacity'
                        )}
                        onClick={(e) => handleCloseTab(tab.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TabsTrigger>
                  
                  {/* Pin toggle button (on hover) */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'absolute -top-1 -right-1 h-4 w-4 p-0',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'bg-background border border-border shadow-sm'
                    )}
                    onClick={(e) => handlePinToggle(tab.id, e)}
                  >
                    {tab.pinned ? (
                      <PinOff className="h-2 w-2" />
                    ) : (
                      <Pin className="h-2 w-2" />
                    )}
                  </Button>
                </div>
              ))}
            </TabsList>
          </Tabs>
          
          {/* New tab button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewTab}
            className="ml-2 h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTabId} className="h-full">
          {openTabs.map((tab) => (
            <TabsContent 
              key={tab.id} 
              value={tab.id} 
              className="h-full m-0 p-0"
              forceMount={tab.id === activeTabId} // Only render active tab
            >
              <TabViewRenderer view={tab.view} />
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Fallback children (for manual content) */}
        {children}
      </div>
    </div>
  )
}

/**
 * View Renderer - Maps view names to actual view components
 */
function TabViewRenderer({ view }: { view: string }) {
  // Wrapper div with data-testid for testing
  const renderView = () => {
    switch (view) {
      case 'week':
        return <WeekView />
      
      case 'planner':
        return <PlannerView />
        
      case 'notes':
        return <NotesView />
        
      case 'mailbox':
        return <MailboxView />
        
      case 'year-lens':
        // Legacy calendar view - only allowed LinearCalendarHorizontal usage
        return <YearLensViewWrapper />
        
      default:
        return (
          <ViewScaffold
            header={<DefaultViewHeader view={view} />}
            content={<DefaultViewPlaceholder view={view} />}
            contextPanels={['details']}
          />
        )
    }
  }
  
  return (
    <div data-testid={`view-${view}`} className="h-full">
      {renderView()}
    </div>
  )
}

/**
 * Placeholder view headers (to be implemented in Phase 3)
 */
function WeekViewHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Week View</h2>
      <div className="text-sm text-muted-foreground">Phase 3: Implementation pending</div>
    </div>
  )
}

function PlannerViewHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Planner</h2>
      <div className="text-sm text-muted-foreground">Kanban + Time-blocking</div>
    </div>
  )
}

function NotesViewHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Notes</h2>
      <div className="text-sm text-muted-foreground">Markdown + Entity Linking</div>
    </div>
  )
}

function MailboxViewHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Mailbox</h2>
      <div className="text-sm text-muted-foreground">Triage + Conversion</div>
    </div>
  )
}

function DefaultViewHeader({ view }: { view: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold capitalize">{view} View</h2>
      <div className="text-sm text-muted-foreground">Command Workspace</div>
    </div>
  )
}

/**
 * Placeholder content areas (to be implemented in Phase 3)
 */
function WeekViewPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Week View</h3>
        <p className="text-muted-foreground max-w-md">
          Seven-day calendar view with existing calendar integration. 
          Will integrate with preserved backend calendar data.
        </p>
        <div className="text-sm text-blue-600">
          Implementation: Phase 3 - Views
        </div>
      </div>
    </div>
  )
}

function PlannerViewPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Planner View</h3>
        <p className="text-muted-foreground max-w-md">
          Kanban task management with time-blocking capabilities.
          Research-validated workflow patterns from Manifestly.
        </p>
        <div className="text-sm text-blue-600">
          Implementation: Phase 3 - Views
        </div>
      </div>
    </div>
  )
}

function NotesViewPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Notes View</h3>
        <p className="text-muted-foreground max-w-md">
          Markdown editing with entity linking and backlinks.
          Research-validated patterns from Obsidian.
        </p>
        <div className="text-sm text-blue-600">
          Implementation: Phase 3 - Views
        </div>
      </div>
    </div>
  )
}

function MailboxViewPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Mailbox View</h3>
        <p className="text-muted-foreground max-w-md">
          Email triage with conversion to tasks, events, and notes.
          AI-powered routing and entity conversion.
        </p>
        <div className="text-sm text-blue-600">
          Implementation: Phase 4 - AI Integration
        </div>
      </div>
    </div>
  )
}

function DefaultViewPlaceholder({ view }: { view: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold capitalize">{view} View</h3>
        <p className="text-muted-foreground">
          Command Workspace view placeholder
        </p>
      </div>
    </div>
  )
}

/**
 * Year Lens View Wrapper - ONLY allowed LinearCalendarHorizontal usage
 */
function YearLensViewWrapper() {
  return (
    <ViewScaffold
      header={
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Year Lens</h2>
          <div className="text-xs text-muted-foreground">
            Legacy Calendar Foundation (Optional View)
          </div>
        </div>
      }
      content={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Year Lens View</h3>
            <p className="text-muted-foreground max-w-md">
              Optional legacy calendar view using LinearCalendarHorizontal.
              This is the ONLY approved usage of the legacy calendar foundation.
            </p>
            <div className="text-sm text-amber-600">
              Status: Available but disabled by default
            </div>
          </div>
        </div>
      }
      contextPanels={['details']}
    />
  )
}