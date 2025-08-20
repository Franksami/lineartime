'use client';

import { cn } from '@/lib/utils';

interface YearOverviewProps {
  year: number;
  events?: any[];
  className?: string;
  onMonthClick?: (month: number) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearOverview({ year, events = [], className, onMonthClick }: YearOverviewProps) {
  // Calculate event density for each month
  const getMonthDensity = (monthIndex: number) => {
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getMonth() === monthIndex && eventDate.getFullYear() === year;
    });
    return monthEvents.length;
  };

  // Get density height for visualization
  const getDensityHeight = (density: number) => {
    const maxHeight = 100;
    const minHeight = 10;
    if (density === 0) return minHeight;
    return Math.min(maxHeight, minHeight + (density * 5));
  };

  // Get density color
  const getDensityColor = (density: number) => {
    if (density === 0) return 'oklch(58% 0.22 240 / 0.1)';
    if (density < 5) return 'oklch(58% 0.22 240 / 0.3)';
    if (density < 10) return 'oklch(58% 0.22 240 / 0.5)';
    if (density < 20) return 'oklch(58% 0.22 240 / 0.7)';
    return 'oklch(58% 0.22 240 / 0.9)';
  };

  return (
    <div className={cn('glass rounded-glass p-6', className)}>
      {/* Year Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-glass-primary to-glass-accent bg-clip-text text-transparent">
          {year} Overview
        </h2>
      </div>

      {/* Months Row */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {MONTHS.map((month, index) => (
            <button
              key={month}
              onClick={() => onMonthClick?.(index)}
              className="flex-1 text-center text-sm font-medium text-oklch-gray-600 hover:text-glass-primary transition-colors cursor-pointer"
            >
              {month}
            </button>
          ))}
        </div>
        
        {/* Month Separator Lines */}
        <div className="flex justify-between h-px bg-glass-border">
          {MONTHS.map((_, index) => (
            <div key={index} className="flex-1 border-l border-glass-border first:border-0" />
          ))}
        </div>
      </div>

      {/* Density Visualization */}
      <div className="relative h-32 mb-4">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {MONTHS.map((_, monthIndex) => {
            const density = getMonthDensity(monthIndex);
            const height = getDensityHeight(density);
            const color = getDensityColor(density);
            
            return (
              <div
                key={monthIndex}
                className="flex-1 relative group"
              >
                <div
                  className="w-full rounded-t-md transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{
                    height: `${height}px`,
                    backgroundColor: color,
                    boxShadow: density > 0 ? '0 -2px 10px rgba(33, 150, 243, 0.3)' : 'none'
                  }}
                  onClick={() => onMonthClick?.(monthIndex)}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-glass-primary text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {density} events
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((percentage) => (
            <div key={percentage} className="flex items-center">
              <div className="w-full h-px bg-glass-border/20" />
              <span className="text-xs text-oklch-gray-500 ml-2">{percentage === 0 ? '' : `${percentage / 5}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-oklch-gray-500">
        <span>Light activity</span>
        <div className="flex items-center gap-4">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
            <div
              key={opacity}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: `oklch(58% 0.22 240 / ${opacity})` }}
            />
          ))}
        </div>
        <span>Heavy activity</span>
      </div>
    </div>
  );
}