'use client';

import { memo, useCallback } from 'react';
import { NavigatorData } from '@/types';
import { cn } from '@/lib/utils';

interface NavigatorProps {
  data: NavigatorData;
  onViewportChange: (scrollPosition: number) => void;
  className?: string;
}

export const Navigator = memo<NavigatorProps>(({ 
  data, 
  onViewportChange, 
  className 
}) => {
  const handleNavigatorClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const scrollPosition = clickX / rect.width;
    onViewportChange(Math.max(0, Math.min(1, scrollPosition)));
  }, [onViewportChange]);

  const getDensityColor = (density: number) => {
    if (density === 0) return 'bg-glass-surface/30';
    
    if (density <= 0.25) {
      return 'bg-glass-accent/30';
    } else if (density <= 0.5) {
      return 'bg-glass-accent/50';
    } else if (density <= 0.75) {
      return 'bg-glass-accent/70';
    } else {
      return 'bg-glass-accent/90';
    }
  };

  const viewportStartPercent = data.currentViewport.scrollProgress * 100;
  const viewportWidthPercent = 15; // Approximate viewport width as percentage of full year

  return (
    <div className={cn(
      'glass rounded-glass p-4 select-none',
      className
    )}>
      {/* Navigator label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-oklch-gray-700">
          {data.year} Timeline Navigator
        </span>
        <span className="text-xs text-oklch-gray-600">
          Click to navigate
        </span>
      </div>

      {/* Year overview bar */}
      <div 
        className="relative h-8 glass-light rounded-sm cursor-pointer hover:glass-heavy transition-all duration-200"
        onClick={handleNavigatorClick}
      >
        {/* Month segments */}
        <div className="absolute inset-1 flex gap-px">
          {data.monthSummaries.map((month, index) => (
            <div
              key={month.month}
              className={cn(
                'flex-1 rounded-xs transition-all duration-200 hover:scale-y-110',
                getDensityColor(month.density)
              )}
              title={`${new Date(data.year, month.month).toLocaleDateString('en', { month: 'long' })}: ${month.eventCount} events`}
            />
          ))}
        </div>

        {/* Current viewport indicator */}
        <div
          className="absolute top-0 h-full glass-accent/30 border-2 border-glass-accent/50 rounded-sm transition-all duration-300"
          style={{
            left: `${viewportStartPercent}%`,
            width: `${viewportWidthPercent}%`,
          }}
        >
          <div className="absolute inset-0 bg-glass-accent/20 rounded-xs animate-smooth-pulse" />
        </div>
      </div>

      {/* Month labels */}
      <div className="flex justify-between mt-2 text-xs text-oklch-gray-600">
        <span>Jan</span>
        <span>Mar</span>
        <span>May</span>
        <span>Jul</span>
        <span>Sep</span>
        <span>Dec</span>
      </div>
    </div>
  );
});

Navigator.displayName = 'Navigator';