/**
 * ContextDock - Right panel system for contextual information
 * Research-validated dock patterns based on Notion properties panel + Obsidian graph
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Bot, 
  Info, 
  AlertTriangle, 
  BarChart3, 
  Network,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppShell, useAppShellPerformance } from '@/contexts/AppShellProvider'
import { useContextDock } from '@/lib/features/useFeatureFlags'
import AIAssistantPanel from '@/components/dock/panels/AIAssistantPanel'
import ConflictsPanel from '@/components/dock/panels/ConflictsPanel'
import BacklinksPanel from '@/components/dock/panels/BacklinksPanel'
import { cn } from '@/lib/utils'

/**
 * Context Dock Panel Definitions
 */
interface DockPanel {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  component: React.ComponentType
  shortcut?: string
}

/**
 * Research-validated dock panels
 */
const DOCK_PANELS: DockPanel[] = [
  {
    id: 'ai',
    title: 'AI Assistant',
    icon: Bot,
    description: 'Contextual AI agents with streaming responses',
    component: AIAssistantPanel,
    shortcut: 'mod+shift+a'
  },
  {
    id: 'details',
    title: 'Details',
    icon: Info, 
    description: 'Entity properties and metadata (Notion pattern)',
    component: DetailsPanel,
    shortcut: 'mod+shift+d'
  },
  {
    id: 'conflicts',
    title: 'Conflicts',
    icon: AlertTriangle,
    description: 'Real-time conflict visualization (Timefold pattern)',
    component: ConflictsPanel,
    shortcut: 'mod+shift+c'
  },
  {
    id: 'capacity',
    title: 'Capacity',
    icon: BarChart3,
    description: 'Resource capacity and utilization analysis',
    component: CapacityPanel,
    shortcut: 'mod+shift+r'
  },
  {
    id: 'backlinks',
    title: 'Backlinks',
    icon: Network,
    description: 'Entity relationship graph (Obsidian pattern)',
    component: BacklinksPanel,
    shortcut: 'mod+shift+b'
  }
]

/**
 * Main Context Dock Component
 */
export function ContextDock() {
  const { dockPanels, activeDockPanel, setActiveDockPanel, preferences } = useAppShell()
  const { isDockEnabled, enabledPanels } = useContextDock()
  const { metrics } = useAppShellPerformance()
  
  const [collapsed, setCollapsed] = useState(preferences.dockCollapsed)
  
  // Filter enabled panels based on feature flags
  const availablePanels = DOCK_PANELS.filter(panel => 
    enabledPanels.includes(panel.id)
  )
  
  if (!isDockEnabled || availablePanels.length === 0) {
    return (
      <div data-testid="context-dock" className="flex items-center justify-center h-full bg-muted/20">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Context Dock</div>
          <div className="text-xs text-muted-foreground">No panels enabled</div>
        </div>
      </div>
    )
  }
  
  if (collapsed) {
    return (
      <div data-testid="context-dock-collapsed" className="flex flex-col h-full bg-muted/20 border-l border-border">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="w-full justify-center"
            data-testid="dock-expand-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col gap-2 p-2">
          {availablePanels.map(panel => {
            const Icon = panel.icon
            return (
              <Button
                key={panel.id}
                variant={activeDockPanel === panel.id ? 'secondary' : 'ghost'}
                size="sm" 
                className="w-full justify-center p-2"
                onClick={() => {
                  setActiveDockPanel(panel.id)
                  setCollapsed(false)
                }}
                title={panel.title}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </div>
    )
  }
  
  return (
    <div data-testid="context-dock" className="flex flex-col h-full bg-background">
      {/* Dock Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Context Dock</h3>
        <div className="flex items-center gap-1">
          {/* Collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(true)}
            className="h-6 w-6 p-0"
            data-testid="dock-collapse-button"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Panel Tabs */}
      <Tabs 
        value={activeDockPanel || availablePanels[0]?.id} 
        onValueChange={setActiveDockPanel}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 h-auto p-1 bg-transparent">
          {availablePanels.map(panel => {
            const Icon = panel.icon
            return (
              <TabsTrigger
                key={panel.id}
                value={panel.id}
                data-testid={`dock-panel-tab-${panel.id}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 text-xs',
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{panel.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {availablePanels.map(panel => {
            const PanelComponent = panel.component
            return (
              <TabsContent 
                key={panel.id}
                value={panel.id}
                data-testid={`dock-panel-content-${panel.id}`}
                className="h-full m-0 p-0"
                forceMount={activeDockPanel === panel.id}
              >
                <PanelComponent />
              </TabsContent>
            )
          })}
        </div>
      </Tabs>
      
      {/* Dock Footer - Performance info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t border-border p-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Panels: {enabledPanels.length}</div>
            <div>Render: {metrics.lastRender.toFixed(0)}ms</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Dock Panel Components (Stubs for implementation phases)
 */
// AIAssistantPanel is imported from '@/components/dock/panels/AIAssistantPanel'

function DetailsPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Details & Properties</h4>
          <p className="text-xs text-muted-foreground">
            Entity metadata and properties panel.
            Research validation: Notion right-side properties.
          </p>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 /* TODO: Use semantic token */ font-mono">
            Phase 3: Views Implementation
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Entity selection and property editing
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

function CapacityPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Capacity</h4>
          <p className="text-xs text-muted-foreground">
            Resource capacity and utilization analysis.
          </p>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 /* TODO: Use semantic token */ font-mono">
            Phase 5: Advanced Features
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Resource optimization and planning
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}