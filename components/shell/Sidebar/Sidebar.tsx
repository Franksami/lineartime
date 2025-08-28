/**
 * Command Workspace Sidebar
 * Collapsible sections for Calendar, Tasks, Notes, Mailbox, Automations
 * Research validation: Obsidian workspace sidebar patterns
 */

'use client'

import { useState } from 'react'
import { Calendar, CheckSquare, FileText, Mail, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAppShell } from '@/contexts/AppShellProvider'

interface SidebarSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: SidebarItem[]
  defaultExpanded?: boolean
}

interface SidebarItem {
  id: string
  title: string
  view?: string
  action?: () => void
  count?: number
  active?: boolean
}

/**
 * Sidebar sections with research-validated organization
 */
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar,
    defaultExpanded: true,
    items: [
      { id: 'week', title: 'Week View', view: 'week', active: true },
      { id: 'day', title: 'Day View', view: 'day' },
      { id: 'month-strip', title: 'Month Strip', view: 'month-strip' },
      { id: 'quarter', title: 'Quarter View', view: 'quarter' },
      { id: 'year-lens', title: 'Year Lens', view: 'year-lens' } // Legacy calendar access
    ]
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: CheckSquare,
    defaultExpanded: false,
    items: [
      { id: 'planner', title: 'Planner', view: 'planner' },
      { id: 'today', title: 'Today', view: 'planner', action: () => console.log('Filter today') },
      { id: 'upcoming', title: 'Upcoming', view: 'planner', count: 12 },
      { id: 'overdue', title: 'Overdue', view: 'planner', count: 3 }
    ]
  },
  {
    id: 'notes',
    title: 'Notes', 
    icon: FileText,
    defaultExpanded: false,
    items: [
      { id: 'notes-all', title: 'All Notes', view: 'notes' },
      { id: 'daily-notes', title: 'Daily Notes', view: 'notes' },
      { id: 'meeting-notes', title: 'Meeting Notes', view: 'notes', count: 8 }
    ]
  },
  {
    id: 'mailbox',
    title: 'Mailbox',
    icon: Mail,
    defaultExpanded: false,
    items: [
      { id: 'inbox', title: 'Inbox', view: 'mailbox', count: 24 },
      { id: 'converted', title: 'Converted', view: 'mailbox' },
      { id: 'archived', title: 'Archived', view: 'mailbox' }
    ]
  },
  {
    id: 'automations',
    title: 'Automations',
    icon: Zap,
    defaultExpanded: false,
    items: [
      { id: 'workflows', title: 'Workflows', view: 'automations' },
      { id: 'running', title: 'Running', view: 'automations', count: 2 },
      { id: 'scheduled', title: 'Scheduled', view: 'automations', count: 5 }
    ]
  }
]

/**
 * Main Sidebar Component
 */
export function Sidebar() {
  const { activeView, setActiveView } = useAppShell()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(SIDEBAR_SECTIONS.filter(s => s.defaultExpanded).map(s => s.id))
  )
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }
  
  const handleItemClick = (item: SidebarItem) => {
    if (item.view) {
      setActiveView(item.view)
    }
    if (item.action) {
      item.action()
    }
  }
  
  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">LinearTime</h2>
        <p className="text-sm text-muted-foreground">Command Workspace</p>
      </div>
      
      {/* Scrollable Sections */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {SIDEBAR_SECTIONS.map((section, index) => {
            const isExpanded = expandedSections.has(section.id)
            const Icon = section.icon
            
            return (
              <div key={section.id}>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-9 px-3',
                        'hover:bg-muted transition-colors'
                      )}
                      data-testid={`sidebar-section-${section.id}`}
                      data-active={isExpanded ? 'true' : 'false'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-1 ml-6 mt-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        data-testid={`sidebar-item-${item.id}`}
                        className={cn(
                          'w-full justify-start h-8 px-3 text-sm',
                          'hover:bg-muted transition-colors',
                          activeView === item.view && 'bg-muted text-foreground'
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.count && (
                          <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                            {item.count}
                          </span>
                        )}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                
                {index < SIDEBAR_SECTIONS.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      
      {/* Sidebar Footer - Workspace info */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Active View: <span className="text-foreground">{activeView}</span></div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
            <span>Shell Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Sidebar loading skeleton for performance optimization
 */
export function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full bg-muted/30 animate-pulse">
      <div className="p-4 border-b border-border">
        <div className="h-5 bg-muted rounded w-24 mb-2" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
      
      <div className="p-2 space-y-1 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-9 bg-muted rounded" />
            {i < 2 && (
              <div className="ml-6 space-y-1">
                <div className="h-8 bg-muted/60 rounded" />
                <div className="h-8 bg-muted/60 rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}