'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ViewSwitcher, CalendarView } from '@/components/dashboard/ViewSwitcher'
import { HighContrastToggle } from '@/components/ui/high-contrast-toggle'
import { SettingsDialog } from '@/components/settings/SettingsDialog'
import { CommandBar } from '@/components/CommandBar'
import {
  Calendar,
  CalendarDays,
  LayoutList,
  Menu,
  X,
  Search,
  Bell,
  User
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Event } from '@/types/calendar'

interface NavigationHeaderProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  onEventCreate?: (event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  events?: any[]
  className?: string
}

export function NavigationHeader({
  currentView,
  onViewChange,
  onEventCreate,
  onEventDelete,
  events = [],
  className
}: NavigationHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  return (
    <header className={cn('border-b bg-background/95 backdrop-blur-sm', className)}>
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>LinearTime</SheetTitle>
              <SheetDescription>
                Navigate your calendar views
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <Button
                variant={currentView === 'year' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  onViewChange('year')
                  setSidebarOpen(false)
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Year View
              </Button>
              <Button
                variant={currentView === 'timeline' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  onViewChange('timeline')
                  setSidebarOpen(false)
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Timeline View
              </Button>
              <Button
                variant={currentView === 'manage' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  onViewChange('manage')
                  setSidebarOpen(false)
                }}
              >
                <LayoutList className="mr-2 h-4 w-4" />
                Event Management
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold">LinearTime</div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Life is bigger than a week
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 mx-auto">
          <Button
            variant={currentView === 'year' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('year')}
            aria-current={currentView === 'year' ? 'page' : undefined}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Year
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('timeline')}
            aria-current={currentView === 'timeline' ? 'page' : undefined}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Timeline
          </Button>
          <Button
            variant={currentView === 'manage' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('manage')}
            aria-current={currentView === 'manage' ? 'page' : undefined}
          >
            <LayoutList className="mr-2 h-4 w-4" />
            Manage
          </Button>
        </nav>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={() => {
              // Trigger command bar
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true
              })
              window.dispatchEvent(event)
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {events.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
          
          {/* Settings & Profile */}
          <HighContrastToggle />
          <SettingsDialog />
          
          {/* User Avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="User profile"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Command Bar */}
      <CommandBar
        onEventCreate={onEventCreate}
        onEventDelete={onEventDelete}
        events={events}
      />
    </header>
  )
}