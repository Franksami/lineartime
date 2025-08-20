'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Filter,
  Plus,
  ZoomIn,
  ZoomOut,
  Tag,
  Briefcase,
  Users,
  Heart
} from 'lucide-react';

export type ViewMode = 'year' | 'month' | 'week' | 'day';

interface ControlBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  className?: string;
}

const VIEW_MODES = [
  { id: 'year' as ViewMode, label: 'Year', icon: Calendar },
  { id: 'month' as ViewMode, label: 'Month', icon: CalendarDays },
  { id: 'week' as ViewMode, label: 'Week', icon: CalendarRange },
  { id: 'day' as ViewMode, label: 'Day', icon: Clock },
];

const FILTER_CATEGORIES = [
  { id: 'work', label: 'Work', icon: Briefcase, color: 'oklch(58% 0.22 240)' },
  { id: 'personal', label: 'Personal', icon: Heart, color: 'oklch(70% 0.18 200)' },
  { id: 'team', label: 'Team', icon: Users, color: 'oklch(65% 0.15 220)' },
];

export function ControlBar({
  viewMode,
  onViewModeChange,
  zoomLevel,
  onZoomChange,
  className
}: ControlBarProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleZoomIn = () => {
    const newZoom = Math.min(100, zoomLevel + 10);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(30, zoomLevel - 10); // Minimum 30px for mobile
    onZoomChange(newZoom);
  };

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(parseInt(e.target.value));
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className={cn('glass border-b border-glass-border', className)}>
      <div className="px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-oklch-gray-500 mr-2 hidden sm:inline">View:</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-glass-primary/5 border border-glass-border flex-1 sm:flex-initial">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onViewModeChange(mode.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md flex items-center gap-2 transition-all",
                      viewMode === mode.id
                        ? "bg-glass-primary text-white shadow-md"
                        : "hover:bg-glass-primary/10 text-oklch-gray-600"
                    )}
                    aria-label={`${mode.label} view`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-oklch-gray-500 hidden sm:inline">Zoom:</span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-glass-primary/10 transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-glass-primary" />
            </button>
            <div className="relative flex-1 sm:w-32">
              <input
                type="range"
                min="30"
                max="100"
                value={zoomLevel}
                onChange={handleZoomSlider}
                className="w-full h-1.5 bg-glass-primary/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, oklch(58% 0.22 240) 0%, oklch(58% 0.22 240) ${(zoomLevel - 30) * 100 / 70}%, oklch(58% 0.22 240 / 0.2) ${(zoomLevel - 30) * 100 / 70}%, oklch(58% 0.22 240 / 0.2) 100%)`
                }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-glass-primary text-white text-xs font-mono opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {zoomLevel}%
              </div>
            </div>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-glass-primary/10 transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-glass-primary" />
            </button>
          </div>

          {/* Filters - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                showFilters || activeFilters.length > 0
                  ? "bg-glass-primary/10 border border-glass-primary"
                  : "hover:bg-glass-primary/10 border border-glass-border"
              )}
            >
              <Filter className="w-4 h-4 text-glass-primary" />
              <span className="text-sm">Filters</span>
              {activeFilters.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-glass-primary text-white text-xs font-medium">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="flex items-center gap-2">
                {FILTER_CATEGORIES.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilters.includes(filter.id);
                  return (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilter(filter.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                        isActive
                          ? "bg-glass-primary/20 border-2"
                          : "bg-glass-primary/5 border border-glass-border hover:bg-glass-primary/10"
                      )}
                      style={{
                        borderColor: isActive ? filter.color : undefined
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: filter.color }} />
                      <span className="text-sm">{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-glass-primary text-white hover:bg-glass-primary/90 transition-colors shadow-md">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">New Event</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: oklch(58% 0.22 240);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: oklch(58% 0.22 240);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
}