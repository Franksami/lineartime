'use client';

import { CommandBar } from '@/components/CommandBar';
import { type CalendarView, ViewSwitcher } from '@/components/dashboard/ViewSwitcher';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { Button } from '@/components/ui/button';
import { HighContrastToggle } from '@/components/ui/high-contrast-toggle';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import {
  Bell,
  Calendar,
  CalendarDays,
  LayoutList,
  Menu,
  Palette,
  Search,
  User,
  X,
} from 'lucide-react';
import React from 'react';

interface NavigationHeaderProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  events?: any[];
  className?: string;
}

export function NavigationHeader({
  currentView,
  onViewChange,
  onEventCreate,
  onEventDelete,
  events = [],
  className,
}: NavigationHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);

  return (
    <header className={cn('border-b border-border bg-background', className)}>
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Command Center Calendar</SheetTitle>
              <SheetDescription>Navigate your calendar views</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <Button
                variant={currentView === 'year' ? 'default' : 'ghost'}
                className="w-full justify-start"
                aria-label="Switch to year view"
                aria-current={currentView === 'year' ? 'page' : undefined}
                onClick={() => {
                  onViewChange('year');
                  setSidebarOpen(false);
                }}
              >
                <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                Year View
              </Button>
              <Button
                variant={currentView === 'timeline' ? 'default' : 'ghost'}
                className="w-full justify-start"
                aria-label="Switch to timeline view"
                aria-current={currentView === 'timeline' ? 'page' : undefined}
                onClick={() => {
                  onViewChange('timeline');
                  setSidebarOpen(false);
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                Timeline View
              </Button>
              <Button
                variant={currentView === 'manage' ? 'default' : 'ghost'}
                className="w-full justify-start"
                aria-label="Switch to event management view"
                aria-current={currentView === 'manage' ? 'page' : undefined}
                onClick={() => {
                  onViewChange('manage');
                  setSidebarOpen(false);
                }}
              >
                <LayoutList className="mr-2 h-4 w-4" aria-hidden="true" />
                Event Management
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-primary/20 text-primary hover:bg-primary/10"
                aria-label="Open Command Center Enterprise demo"
                onClick={() => {
                  window.open('/cheatcal-enterprise', '_blank');
                  setSidebarOpen(false);
                }}
              >
                <span className="mr-2 text-sm">✨</span>
                Command Center Enterprise
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold">Command Center Calendar</div>
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
            aria-label="Switch to year view"
            aria-current={currentView === 'year' ? 'page' : undefined}
          >
            <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
            Year
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('timeline')}
            aria-label="Switch to timeline view"
            aria-current={currentView === 'timeline' ? 'page' : undefined}
          >
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
            Timeline
          </Button>
          <Button
            variant={currentView === 'manage' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('manage')}
            aria-label="Switch to event management view"
            aria-current={currentView === 'manage' ? 'page' : undefined}
          >
            <LayoutList className="mr-2 h-4 w-4" aria-hidden="true" />
            Manage
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/cheatcal-enterprise', '_blank')}
            aria-label="Open Command Center Enterprise demo"
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            <span className="mr-2 text-xs">✨</span>
            Command Center Enterprise
          </Button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            aria-label="Search events (Ctrl+K)"
            onClick={() => {
              // Trigger command bar
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true,
              });
              window.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" aria-hidden="true" />
            {events.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Button>

          {/* Settings & Profile */}
          <HighContrastToggle />

          {/* Theme Selector */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            aria-label="Theme selector"
            className="relative"
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
          </Button>

          <SettingsDialog />

          {/* User Avatar */}
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="User profile">
            <User className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Command Bar */}
      <CommandBar onEventCreate={onEventCreate} onEventDelete={onEventDelete} events={events} />

      {/* Theme Selector Popup */}
      {showThemeSelector && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowThemeSelector(false)}>
          <div className="absolute top-20 right-4" onClick={(e) => e.stopPropagation()}>
            <ThemeSelector onClose={() => setShowThemeSelector(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
