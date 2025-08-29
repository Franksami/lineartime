'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface DayContentContext {
  date: Date | null;
  isEmpty: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isHovered: boolean;
  displayPreviewUpTo: boolean; // For filled/unfilled dot logic
  onSelect: () => void;
  onPreview: () => void;
  dataAttrs: {
    'data-date'?: string;
    'data-day'?: string;
  };
}

interface DotDayContentProps {
  context: DayContentContext;
}

// Mobile/PC detection hook
function usePointerType() {
  const [isCoarse, setIsCoarse] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mq = window.matchMedia('(pointer: coarse)');

    const update = () => setIsCoarse(mq.matches || hasTouch);
    update();

    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  return { isCoarse };
}

// Format date for tooltip/popover labels
function formatDotLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

export function DotDayContent({ context }: DotDayContentProps) {
  const {
    date,
    isEmpty,
    isToday,
    isSelected,
    isWeekend,
    isHovered,
    displayPreviewUpTo,
    onSelect,
    onPreview,
    dataAttrs,
  } = context;

  const { isCoarse } = usePointerType();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  // Don't render anything for empty cells
  if (isEmpty || !date) {
    return null;
  }

  // Determine if this dot should be filled
  const isFilled = displayPreviewUpTo;

  const label = formatDotLabel(date);

  // Core dot element
  const dotElement = (
    <div
      className="flex items-center justify-center cursor-pointer select-none w-full h-full"
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-selected={isSelected}
      onMouseEnter={(e) => {
        e.preventDefault();
        onPreview();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        if (isCoarse) {
          // On mobile, trigger preview when tapping
          onPreview();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
          onPreview();
        }
      }}
      {...dataAttrs}
      style={
        {
          // Use CSS variable for dot size (customizable)
          '--dot-size': '5px',
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'rounded-full transition-colors duration-150',
          // Token-only styling - no custom colors
          isFilled ? 'bg-foreground' : 'bg-muted-foreground',
          // Today indicator - use existing ring styles
          isToday && 'ring-1 ring-ring',
          // Selected state - additional visual feedback
          isSelected && 'ring-2 ring-primary/50'
        )}
        style={{
          width: 'var(--dot-size)',
          height: 'var(--dot-size)',
        }}
      />
    </div>
  );

  // Mobile uses Popover (tap to open/close)
  if (isCoarse) {
    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          setIsPopoverOpen(open);
          if (open) {
            onPreview();
          }
        }}
      >
        <PopoverTrigger asChild>{dotElement}</PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={8}
          align="center"
          updatePositionStrategy="always"
          className="w-auto min-w-0 whitespace-nowrap px-2 py-1 text-xs bg-popover text-popover-foreground border-border rounded shadow-lg"
        >
          {label}
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop uses Tooltip (hover)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{dotElement}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          updatePositionStrategy="always"
          className="w-auto min-w-0 whitespace-nowrap text-xs bg-popover text-popover-foreground border-border rounded shadow-lg"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Default number content renderer for backward compatibility
export function NumberDayContent({ context }: { context: DayContentContext }) {
  const { date, isEmpty, isToday } = context;

  if (isEmpty || !date) {
    return null;
  }

  return (
    <span
      className={cn(
        'text-[10px] leading-none text-muted-foreground',
        isToday && 'font-semibold text-primary'
      )}
    >
      {date.getDate().toString().padStart(2, '0')}
    </span>
  );
}
