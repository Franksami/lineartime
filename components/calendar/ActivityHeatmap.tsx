'use client';

import { memo } from 'react';
import { MonthData } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  month: MonthData;
  maxDensity: number;
  className?: string;
}

export const ActivityHeatmap = memo<ActivityHeatmapProps>(({ 
  month, 
  maxDensity, 
  className 
}) => {
  const getIntensityColor = (density: number) => {
    if (density === 0) return 'bg-glass-surface/20';
    
    const normalizedDensity = Math.min(density / maxDensity, 1);
    
    if (normalizedDensity <= 0.25) {
      return 'bg-glass-accent/20';
    } else if (normalizedDensity <= 0.5) {
      return 'bg-glass-accent/40';
    } else if (normalizedDensity <= 0.75) {
      return 'bg-glass-accent/60';
    } else {
      return 'bg-glass-accent/80';
    }
  };

  return (
    <div className={cn('flex gap-px h-3 mb-2', className)}>
      {month.days.map((day, index) => (
        <div
          key={`${day.date.getTime()}-${index}`}
          className={cn(
            'w-px rounded-sm transition-all duration-200 hover:scale-y-125',
            getIntensityColor(day.eventDensity),
            !day.isCurrentMonth && 'opacity-30'
          )}
          title={`${day.date.toLocaleDateString()}: ${day.events.length} events`}
        />
      ))}
    </div>
  );
});

ActivityHeatmap.displayName = 'ActivityHeatmap';