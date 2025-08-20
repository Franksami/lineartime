'use client';

import { GlassButton } from '@/components/glass';
import { Calendar, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineControlsProps {
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onTodayClick: () => void;
  year: number;
}

const ZOOM_PRESETS = [
  { label: 'Year', level: 5 },
  { label: 'Quarter', level: 20 },
  { label: 'Month', level: 40 },
  { label: 'Week', level: 60 },
  { label: 'Day', level: 100 }
];

export function TimelineControls({
  zoomLevel,
  onZoomChange,
  onTodayClick,
  year
}: TimelineControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(100, zoomLevel + 10));
  };
  
  const handleZoomOut = () => {
    onZoomChange(Math.max(1, zoomLevel - 10));
  };
  
  const handleZoomReset = () => {
    onZoomChange(20); // Default to quarter view
  };

  return (
    <div className="glass rounded-glass p-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Year Navigation */}
        <div className="flex items-center gap-1">
          <GlassButton 
            size="sm" 
            variant="ghost"
            onClick={() => {/* TODO: Previous year */}}
          >
            <ChevronLeft className="h-4 w-4" />
          </GlassButton>
          <span className="text-sm font-medium px-2">{year}</span>
          <GlassButton 
            size="sm" 
            variant="ghost"
            onClick={() => {/* TODO: Next year */}}
          >
            <ChevronRight className="h-4 w-4" />
          </GlassButton>
        </div>
        
        <div className="w-px h-6 bg-glass-border/20" />
        
        {/* Today Button */}
        <GlassButton
          size="sm"
          variant="secondary"
          onClick={onTodayClick}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Today
        </GlassButton>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Zoom Presets */}
        <div className="flex gap-1">
          {ZOOM_PRESETS.map(preset => (
            <GlassButton
              key={preset.label}
              size="sm"
              variant={Math.abs(zoomLevel - preset.level) < 5 ? 'primary' : 'ghost'}
              onClick={() => onZoomChange(preset.level)}
              className="text-xs"
            >
              {preset.label}
            </GlassButton>
          ))}
        </div>
        
        <div className="w-px h-6 bg-glass-border/20" />
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </GlassButton>
          
          <div className="relative w-24 h-6">
            <div className="absolute inset-0 glass rounded" />
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-glass-accent/30 to-glass-secondary/30 rounded transition-all"
              style={{ width: `${zoomLevel}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {zoomLevel}%
            </span>
          </div>
          
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 100}
          >
            <ZoomIn className="h-4 w-4" />
          </GlassButton>
          
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={handleZoomReset}
          >
            <RotateCcw className="h-4 w-4" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
}