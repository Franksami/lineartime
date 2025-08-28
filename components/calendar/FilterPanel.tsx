'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FilterState, ViewOptions } from '@/types/calendar';
import { X } from 'lucide-react';
import * as React from 'react';

type FilterChangeHandler = (filters: FilterState | { viewOptions: ViewOptions }) => void;

interface FilterPanelProps {
  filters: FilterState;
  viewOptions: ViewOptions;
  onFilterChange: FilterChangeHandler;
  onClose: () => void;
}

export function FilterPanel({ filters, viewOptions, onFilterChange, onClose }: FilterPanelProps) {
  const handleCategoryChange = (category: keyof FilterState, checked: boolean) => {
    onFilterChange({
      ...filters,
      [category]: checked,
    });
  };

  const handleViewOptionChange = (option: keyof ViewOptions, checked: boolean) => {
    onFilterChange({
      ...filters,
      viewOptions: {
        ...viewOptions,
        [option]: checked,
      },
    });
  };

  const showAll = () => {
    onFilterChange({
      personal: true,
      work: true,
      efforts: true,
      notes: true,
    });
  };

  const hideAll = () => {
    onFilterChange({
      personal: false,
      work: false,
      efforts: false,
      notes: false,
    });
  };

  return (
    <div className="w-80 border-l bg-background p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filters & Options</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Event Categories */}
        <div>
          <h4 className="text-sm font-medium mb-3">Event Categories</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="personal" className="flex items-center cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-green-500 /* TODO: Use semantic token */ mr-2" />
                Personal
              </Label>
              <Switch
                id="personal"
                checked={filters.personal}
                onCheckedChange={(checked) => handleCategoryChange('personal', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="work" className="flex items-center cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-primary mr-2" />
                Work
              </Label>
              <Switch
                id="work"
                checked={filters.work}
                onCheckedChange={(checked) => handleCategoryChange('work', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="effort" className="flex items-center cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                Effort
              </Label>
              <Switch
                id="effort"
                checked={filters.efforts}
                onCheckedChange={(checked) => handleCategoryChange('efforts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="note" className="flex items-center cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-purple-500 /* TODO: Use semantic token */ mr-2" />
                Note
              </Label>
              <Switch
                id="note"
                checked={filters.notes}
                onCheckedChange={(checked) => handleCategoryChange('notes', checked)}
              />
            </div>
          </div>
        </div>

        {/* View Options */}
        <div>
          <h4 className="text-sm font-medium mb-3">View Options</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="weekends">Show Weekends</Label>
              <Switch
                id="weekends"
                checked={viewOptions.showWeekends}
                onCheckedChange={(checked) => handleViewOptionChange('showWeekends', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="today">Highlight Today</Label>
              <Switch
                id="today"
                checked={viewOptions.showToday}
                onCheckedChange={(checked) => handleViewOptionChange('showToday', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="compact">Compact Mode</Label>
              <Switch
                id="compact"
                checked={viewOptions.compactMode}
                onCheckedChange={(checked) => handleViewOptionChange('compactMode', checked)}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button variant="outline" className="w-full" onClick={showAll}>
            Show All Categories
          </Button>
          <Button variant="outline" className="w-full" onClick={hideAll}>
            Hide All Categories
          </Button>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 /* TODO: Use semantic token */ mr-2" />
              <span>Personal - Life events</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-primary mr-2" />
              <span>Work - Professional tasks</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
              <span>Effort - Active projects</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-purple-500 /* TODO: Use semantic token */ mr-2" />
              <span>Note - Important reminders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
