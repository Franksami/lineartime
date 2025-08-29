'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EventFilters, ZoomLevel } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, ZoomIn, ZoomOut } from 'lucide-react';

interface CalendarHeaderProps {
  year: number;
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  eventCount: number;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
}

export function CalendarHeader({
  year,
  zoomLevel,
  onZoomChange,
  eventCount,
  filters,
  onFiltersChange,
}: CalendarHeaderProps) {
  const zoomLevels: { value: ZoomLevel; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
    { value: 'fullYear', label: 'Full Year' },
  ];

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      {/* Left section - Year and stats */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{year}</h1>
        <Badge variant="secondary" className="text-sm">
          {eventCount} events
        </Badge>
      </div>

      {/* Center section - Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Right section - Zoom controls */}
      <div className="flex items-center gap-2">
        <Select value={zoomLevel} onValueChange={(value: ZoomLevel) => onZoomChange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zoomLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const currentIndex = zoomLevels.findIndex((z) => z.value === zoomLevel);
            if (currentIndex > 0) {
              onZoomChange(zoomLevels[currentIndex - 1].value);
            }
          }}
          disabled={zoomLevel === 'month'}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const currentIndex = zoomLevels.findIndex((z) => z.value === zoomLevel);
            if (currentIndex < zoomLevels.length - 1) {
              onZoomChange(zoomLevels[currentIndex + 1].value);
            }
          }}
          disabled={zoomLevel === 'fullYear'}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
