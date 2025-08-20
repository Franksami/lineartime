'use client';

import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TimelineMiniMapProps {
  year: number;
  events: any[];
  scrollPosition: number;
  containerWidth: number;
  totalWidth: number;
  onNavigate: (position: number) => void;
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function TimelineMiniMap({
  year,
  events,
  scrollPosition,
  containerWidth,
  totalWidth,
  onNavigate
}: TimelineMiniMapProps) {
  const miniMapRef = useRef<HTMLDivElement>(null);
  
  // Calculate viewport indicator position and width
  const viewportWidth = (containerWidth / totalWidth) * 100;
  const viewportPosition = (scrollPosition / totalWidth) * 100;
  
  // Calculate event density for heat map
  const monthDensities = useMemo(() => {
    const densities = new Array(12).fill(0);
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      if (eventDate.getFullYear() === year) {
        densities[eventDate.getMonth()]++;
      }
    });
    
    const maxDensity = Math.max(...densities, 1);
    return densities.map(d => d / maxDensity);
  }, [events, year]);
  
  const handleClick = (e: React.MouseEvent) => {
    if (!miniMapRef.current) return;
    
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newPosition = clickPercent * totalWidth;
    
    onNavigate(newPosition);
  };

  return (
    <div className="glass rounded-glass p-2 mt-2">
      <div 
        ref={miniMapRef}
        className="relative h-12 rounded cursor-pointer bg-glass-primary/5"
        onClick={handleClick}
      >
        {/* Month segments with heat map */}
        <div className="absolute inset-0 flex">
          {MONTHS.map((month, index) => (
            <div
              key={index}
              className="flex-1 border-r border-glass-border/10 last:border-r-0 relative"
              style={{
                backgroundColor: `rgba(139, 92, 246, ${monthDensities[index] * 0.2})`
              }}
            >
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-oklch-gray-500">
                {month}
              </span>
            </div>
          ))}
        </div>
        
        {/* Today marker */}
        {new Date().getFullYear() === year && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-glass-accent"
            style={{
              left: `${(new Date().getMonth() / 12 + new Date().getDate() / 365) * 100}%`
            }}
          />
        )}
        
        {/* Viewport indicator */}
        <div
          className={cn(
            'absolute top-0 bottom-0',
            'bg-glass-accent/20 border-x-2 border-glass-accent',
            'transition-all duration-150'
          )}
          style={{
            left: `${viewportPosition}%`,
            width: `${viewportWidth}%`
          }}
        />
      </div>
    </div>
  );
}