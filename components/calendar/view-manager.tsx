'use client';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Grid3X3, Settings } from 'lucide-react';

export type CalendarView = 'year' | 'timeline' | 'manage' | 'analytics';

interface ViewManagerProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export function ViewManager({ currentView, onViewChange }: ViewManagerProps) {
  const views = [
    {
      id: 'year' as CalendarView,
      label: 'Year View',
      icon: Calendar,
      description: 'Full year horizontal timeline',
    },
    {
      id: 'timeline' as CalendarView,
      label: 'Timeline',
      icon: BarChart3,
      description: 'Vertical timeline view',
    },
    {
      id: 'manage' as CalendarView,
      label: 'Manage',
      icon: Settings,
      description: 'Event management',
    },
    {
      id: 'analytics' as CalendarView,
      label: 'Analytics',
      icon: Grid3X3,
      description: 'Calendar insights',
    },
  ];

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-card border border-border rounded-full px-2 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = currentView === view.id;

            return (
              <Button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={
                  isActive
                    ? 'rounded-full px-4 py-2 bg-primary text-primary-foreground shadow-sm'
                    : 'rounded-full px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
                title={view.description}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
