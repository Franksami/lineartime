'use client';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { differenceInDays, endOfYear, startOfYear } from 'date-fns';
import { Menu, X, ZoomIn, ZoomOut } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

export type ZoomLevel = 'fullYear' | 'year' | 'quarter' | 'month' | 'week' | 'day';

interface ZoomControlsProps {
  // New calendar-specific interface
  zoomLevel?: ZoomLevel;
  year?: number;
  dayWidth?: number;
  isFullYearZoom?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;

  // Legacy numeric zoom support for backward compatibility
  numericZoomLevel?: number;
  onZoomChange?: (newZoom: number) => void;

  className?: string;
  /**
   * Render into document.body to avoid clipping by containers/sidebars
   */
  portal?: boolean;
}

export function ZoomControls({
  zoomLevel,
  year,
  dayWidth,
  isFullYearZoom = false,
  scrollRef,
  onZoomIn,
  onZoomOut,
  onReset,
  numericZoomLevel,
  onZoomChange,
  className,
  portal = false, // Default to false for calendar use
}: ZoomControlsProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Use either string-based or numeric zoom level
  const _currentZoomLevel = zoomLevel || numericZoomLevel;
  const isCalendarMode = Boolean(zoomLevel && year && dayWidth);

  const canZoomIn = zoomLevel ? zoomLevel !== 'day' : true;
  const canZoomOut = zoomLevel ? zoomLevel !== 'fullYear' : true;

  const handleZoomInClick = () => {
    onZoomIn();
  };

  const handleZoomOutClick = () => {
    onZoomOut();
  };

  const handleResetClick = () => {
    if (onReset) return onReset();
    if (onZoomChange) onZoomChange(1);
  };

  const handleGoToToday = React.useCallback(() => {
    if (scrollRef?.current && year && dayWidth) {
      const today = new Date();
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));

      // Check if today is within the displayed year
      let targetDate = today;
      if (today < yearStart) {
        targetDate = yearStart; // Clamp to start of year
      } else if (today > yearEnd) {
        targetDate = yearEnd; // Clamp to end of year
      }

      const dayOfYear = differenceInDays(targetDate, yearStart);
      const scrollPosition = dayOfYear * dayWidth - scrollRef.current.clientWidth / 2;

      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      });
    }
    setIsMobileMenuOpen(false);
  }, [scrollRef, year, dayWidth]);

  // Hide zoom controls in fullYear mode for calendar
  if (isCalendarMode && isFullYearZoom) {
    return null;
  }

  const renderLegacyContent = () => (
    <div
      role="group"
      aria-label="Zoom controls"
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col gap-1',
        'bg-card border border-border rounded-lg p-1.5 shadow-sm',
        'pointer-events-auto',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
      }}
    >
      <Button
        aria-label="Zoom in"
        size="sm"
        variant="ghost"
        onClick={handleZoomInClick}
        className="h-8 w-8 p-0"
        title="Zoom In (Ctrl/Cmd +)"
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
      </Button>

      <Button
        aria-label="Reset zoom"
        size="sm"
        variant="ghost"
        onClick={handleResetClick}
        className="h-8 w-8 p-0 text-xs font-medium"
        title="Reset Zoom (Ctrl/Cmd 0)"
      >
        {typeof numericZoomLevel === 'number'
          ? `${Math.round(numericZoomLevel * 100)}%`
          : zoomLevel}
      </Button>

      <Button
        aria-label="Zoom out"
        size="sm"
        variant="ghost"
        onClick={handleZoomOutClick}
        className="h-8 w-8 p-0"
        title="Zoom Out (Ctrl/Cmd -)"
      >
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );

  const renderCalendarContent = () => {
    if (!isCalendarMode) return renderLegacyContent();

    const desktopControls = (
      <div
        className="flex items-center gap-2 p-1 bg-card border border-border rounded-lg shadow-sm"
        role="toolbar"
        aria-label="Zoom controls"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOutClick}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </Button>

        <span
          className="px-2 text-xs font-medium capitalize min-w-[60px] text-center"
          role="status"
          aria-live="polite"
        >
          {zoomLevel}
        </span>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomInClick}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );

    const mobileControls = (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          className="bg-card border border-border shadow-sm"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Menu className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        {isMobileMenuOpen && (
          <div
            className="absolute top-12 right-0 flex flex-col gap-2 p-3 bg-card border border-border rounded-lg shadow-sm z-30 min-w-[200px]"
            role="menu"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                handleZoomOutClick();
                setIsMobileMenuOpen(false);
              }}
              disabled={!canZoomOut}
              aria-label="Zoom out to see more of the calendar"
              className="justify-start gap-2"
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
              Zoom Out
            </Button>

            <div className="text-center py-1 text-sm font-medium capitalize border border-border rounded bg-muted/30">
              {zoomLevel}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                handleZoomInClick();
                setIsMobileMenuOpen(false);
              }}
              disabled={!canZoomIn}
              aria-label="Zoom in to see calendar details"
              className="justify-start gap-2"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
              Zoom In
            </Button>

            <div className="border-t border-border my-2" />

            <Button
              size="sm"
              variant="outline"
              onClick={handleGoToToday}
              aria-label="Navigate to today's date"
              className="text-sm"
            >
              Go to Today
            </Button>

            <div className="text-xs text-muted-foreground text-center mt-2 space-y-1 border-t border-border pt-2">
              <p>• Long press to create event</p>
              <p>• Double tap to zoom</p>
              <p>• Pinch to zoom in/out</p>
            </div>
          </div>
        )}
      </>
    );

    return (
      <div className={cn('absolute z-20 top-4 right-4', className)}>
        {isMobile ? mobileControls : desktopControls}
      </div>
    );
  };

  // Close mobile menu effects
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isMobileMenuOpen &&
        !target.closest('[role="menu"]') &&
        !target.closest('button[aria-expanded="true"]')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileMenuOpen]);

  const content = renderCalendarContent();

  if (!portal) return content;
  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
