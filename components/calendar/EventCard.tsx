'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutoAnimateDropdown } from '@/hooks/useAutoAnimate';
import { cn } from '@/lib/utils';
import type { Event, EventCategory } from '@/types/calendar';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Copy,
  Edit2,
  MapPin,
  MoreHorizontal,
  Repeat,
  Tag,
  Trash2,
} from 'lucide-react';
import type * as React from 'react';

import { useComponentMigration } from '@/lib/design-system/component-tokens/ComponentMigrationUtility';
// 🎨 Design System Integration - Component Token Migration
import { useComponentTokens } from '@/lib/design-system/component-tokens/ComponentTokenRegistry';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (event: Event) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  className?: string;
  compact?: boolean;
}

// 🎨 Component Token Migration - Gradual Migration Pattern
// Legacy hardcoded values (preserved as fallbacks during migration)
const legacyCategoryColors: Record<EventCategory, string> = {
  personal: 'bg-primary/10 border-primary/20',
  work: 'bg-secondary/10 border-secondary/20',
  effort: 'bg-accent/10 border-accent/20',
  note: 'bg-muted border-border',
};

const legacyCategoryAccents: Record<EventCategory, string> = {
  personal: 'bg-primary',
  work: 'bg-secondary',
  effort: 'bg-accent',
  note: 'bg-muted',
};

// 🎨 Token-based category styles using Component Token Registry
const getTokenBasedCategoryStyles = (category: EventCategory, useTokens = true) => {
  const { getComponentToken } = useComponentTokens();

  if (!useTokens) {
    return {
      containerClass: legacyCategoryColors[category],
      accentClass: legacyCategoryAccents[category],
    };
  }

  try {
    // Use composite tokens from Component Token Registry
    const categoryToken = getComponentToken(`event.category.${category}`);

    if (typeof categoryToken === 'object' && categoryToken.background && categoryToken.accent) {
      return {
        containerClass: `${categoryToken.background} ${categoryToken.border || 'border-border'}`,
        accentClass: categoryToken.accent,
      };
    }

    // Fallback to semantic tokens
    const tokenBasedStyles = {
      personal: {
        containerClass: 'bg-primary/10 border-primary/20',
        accentClass: 'bg-primary',
      },
      work: {
        containerClass: 'bg-secondary/10 border-secondary/20',
        accentClass: 'bg-secondary',
      },
      effort: {
        containerClass: 'bg-accent/10 border-accent/20',
        accentClass: 'bg-accent',
      },
      note: {
        containerClass: 'bg-muted border-border',
        accentClass: 'bg-muted-foreground',
      },
    };

    return tokenBasedStyles[category];
  } catch (error) {
    console.warn('[EventCard] Token resolution failed, using legacy styles:', error);
    return {
      containerClass: legacyCategoryColors[category],
      accentClass: legacyCategoryAccents[category],
    };
  }
};

// Backward compatibility exports
const _categoryColors = legacyCategoryColors;
const _categoryAccents = legacyCategoryAccents;

interface EventCardPropsEnhanced extends EventCardProps {
  /** Enable token-based styling (gradual migration) */
  useDesignTokens?: boolean;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onDuplicate,
  isDragging = false,
  isSelected = false,
  className,
  compact = false,
  useDesignTokens = true, // Enable tokens by default for new implementations
}: EventCardPropsEnhanced) {
  const [dropdownRef] = useAutoAnimateDropdown();
  const isMultiDay =
    event.startDate &&
    event.endDate &&
    format(event.startDate, 'yyyy-MM-dd') !== format(event.endDate, 'yyyy-MM-dd');

  // 🎨 Component Token Integration
  const { getComponentToken } = useComponentTokens();
  const categoryStyles = getTokenBasedCategoryStyles(event.category, useDesignTokens);

  // Get event state tokens for interactions
  const getEventStateClasses = (state: 'default' | 'hover' | 'selected' | 'dragging') => {
    if (!useDesignTokens) {
      // Legacy state classes
      const legacyStates = {
        default: 'shadow-sm',
        hover: 'hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5',
        selected: 'ring-2 ring-primary ring-offset-2',
        dragging: 'opacity-50 scale-95 rotate-2',
      };
      return legacyStates[state];
    }

    try {
      const stateToken = getComponentToken(`event.state.${state}`);
      if (typeof stateToken === 'object') {
        // Convert token object to CSS classes (simplified for demo)
        const classes = [];
        if (stateToken.shadow)
          classes.push(`shadow-${stateToken.shadow.replace('{shadows.', '').replace('}', '')}`);
        if (stateToken.transform) classes.push('hover:scale-[1.02]');
        if (stateToken.ring) classes.push(`ring-${stateToken.ring}`);
        if (stateToken.ringColor) classes.push('ring-primary');
        if (stateToken.opacity)
          classes.push(`opacity-${stateToken.opacity.replace('{opacity.', '').replace('}', '')}`);
        return classes.join(' ');
      }
    } catch (error) {
      console.warn(`[EventCard] Failed to resolve state token: ${state}`, error);
    }

    // Fallback to semantic tokens
    const fallbackStates = {
      default: 'shadow-sm',
      hover: 'hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5',
      selected: 'ring-2 ring-primary ring-offset-2',
      dragging: 'opacity-50 scale-95 rotate-2',
    };
    return fallbackStates[state];
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!e.defaultPrevented && onEdit) {
      onEdit(event);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative px-2 py-1 rounded-md cursor-pointer transition-all duration-200',
          categoryStyles.containerClass,
          'border',
          getEventStateClasses('hover'),
          isDragging && getEventStateClasses('dragging'),
          isSelected && getEventStateClasses('selected'),
          className
        )}
      >
        <div className="flex items-center gap-1">
          <div className={cn('w-1.5 h-1.5 rounded-full', categoryStyles.accentClass)} />
          <span className="text-xs font-medium truncate">{event.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative p-4 rounded-xl cursor-pointer transition-all duration-200',
        categoryStyles.containerClass,
        'border',
        getEventStateClasses('default'),
        getEventStateClasses('hover'),
        isDragging && getEventStateClasses('dragging'),
        isSelected && getEventStateClasses('selected'),
        className
      )}
    >
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground line-clamp-2">{event.title}</h3>
            {event.recurrence && (
              <Badge variant="secondary" className="mt-1 text-xs bg-muted">
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              ref={dropdownRef}
              align="end"
              className="bg-card border border-border shadow-sm"
            >
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(event);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {(onEdit || onDuplicate) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Date/Time */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-muted/30">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs">
              {event.startDate && format(event.startDate, 'PPP')}
              {isMultiDay && event.endDate && ` - ${format(event.endDate, 'PPP')}`}
            </span>
          </div>

          {/* Time */}
          {!event.allDay && event.startDate && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-muted/30">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs">
                {format(event.startDate, 'p')}
                {event.endDate && ` - ${format(event.endDate, 'p')}`}
              </span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-muted/30">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs truncate">{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Category Indicator */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-xl">
          <div
            className={cn(
              'absolute -top-6 -right-6 w-12 h-12 rotate-45',
              categoryStyles.accentClass,
              'opacity-20'
            )}
          />
        </div>
      </div>
    </div>
  );
}
