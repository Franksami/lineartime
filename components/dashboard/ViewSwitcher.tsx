'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutoAnimate, useAutoAnimateDropdown } from '@/hooks/useAutoAnimate';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronDown,
  CircleDot,
  Grid3X3,
  LayoutGrid,
  List,
  Settings,
  Zap,
} from 'lucide-react';
import * as React from 'react';

export type CalendarView =
  | 'year'
  | 'fullcalendar'
  | 'toast-ui'
  | 'progress'
  | 'timeline'
  | 'manage';

interface ViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  className?: string;
}

const viewConfig = {
  year: {
    label: 'Linear View',
    icon: Calendar,
    description: 'Horizontal 12-month linear timeline',
  },
  fullcalendar: {
    label: 'Pro Calendar',
    icon: Zap,
    description: 'Professional FullCalendar with advanced features',
  },
  'toast-ui': {
    label: 'Toast UI',
    icon: Grid3X3,
    description: 'Toast UI Calendar with month/week/day views',
  },
  progress: {
    label: 'Progress Dots',
    icon: CircleDot,
    description: 'Progress visualization with dot indicators',
  },
  timeline: {
    label: 'Timeline',
    icon: List,
    description: 'Vertical month-by-month timeline view',
  },
  manage: {
    label: 'Manage',
    icon: Settings,
    description: 'Event management dashboard',
  },
};

export function ViewSwitcher({ currentView, onViewChange, className }: ViewSwitcherProps) {
  const [tabsRef] = useAutoAnimate({ duration: 200 });
  const [dropdownRef] = useAutoAnimateDropdown();
  const CurrentIcon = viewConfig[currentView].icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Desktop View - Tab Style */}
      <div
        ref={tabsRef}
        className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-card border border-border"
        role="tablist"
        aria-label="View selection"
      >
        {Object.entries(viewConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentView === key;

          return (
            <button
              key={key}
              role="tab"
              onClick={() => onViewChange(key as CalendarView)}
              aria-label={`Switch to ${config.label}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                'hover:bg-muted/50',
                isActive && ['bg-muted', 'border border-border']
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile View - Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="md:hidden">
          <Button variant="outline" className="gap-2 bg-card border-border hover:bg-muted/50">
            <CurrentIcon className="h-4 w-4" />
            <span>{viewConfig[currentView].label}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent ref={dropdownRef} align="end" className="w-56 bg-card border-border">
          {Object.entries(viewConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = currentView === key;

            return (
              <DropdownMenuItem
                key={key}
                onClick={() => onViewChange(key as CalendarView)}
                className={cn('gap-3', isActive && 'bg-muted/50')}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Optional Settings Button */}
      <Button variant="ghost" size="icon" className="ml-2 hover:bg-muted/50" aria-label="Settings">
        <Settings className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
