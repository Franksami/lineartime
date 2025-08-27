'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CATEGORY_COLORS,
  type EventCategory,
  type EventFilters,
  type EventPriority,
} from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Search, Tag } from 'lucide-react';
import { useState } from 'react';

interface EventFilterPanelProps {
  filters: EventFilters;
  availableTags: string[];
  onFiltersChange: (filters: EventFilters) => void;
  onClearFilters: () => void;
}

export function EventFilterPanel({
  filters,
  availableTags,
  onFiltersChange,
  onClearFilters,
}: EventFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories: { value: EventCategory; label: string }[] = [
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'effort', label: 'Effort' },
    { value: 'note', label: 'Note' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'milestone', label: 'Milestone' },
  ];

  const priorities: { value: EventPriority; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'optional', label: 'Optional' },
  ];

  const handleCategoryToggle = (category: EventCategory) => {
    const newCategories = new Set(filters.categories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handlePriorityToggle = (priority: EventPriority) => {
    const newPriorities = new Set(filters.priorities);
    if (newPriorities.has(priority)) {
      newPriorities.delete(priority);
    } else {
      newPriorities.add(priority);
    }
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(filters.tags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query });
  };

  const activeFiltersCount =
    filters.categories.size +
    filters.priorities.size +
    filters.tags.size +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search events..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={filters.categories.has(category.value)}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                  <label
                    htmlFor={`category-${category.value}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category.value] }}
                    />
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Priorities</Label>
            <div className="space-y-2">
              {priorities.map((priority) => (
                <div key={priority.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority.value}`}
                    checked={filters.priorities.has(priority.value)}
                    onCheckedChange={() => handlePriorityToggle(priority.value)}
                  />
                  <label
                    htmlFor={`priority-${priority.value}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        priority.value === 'critical'
                          ? 'bg-destructive'
                          : priority.value === 'high'
                            ? 'bg-secondary'
                            : priority.value === 'medium'
                              ? 'bg-primary'
                              : priority.value === 'low'
                                ? 'bg-muted-foreground/50'
                                : 'bg-muted/50'
                      }`}
                    />
                    {priority.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={filters.tags.has(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-6 px-2 text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
