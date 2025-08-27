'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Event } from '@/types/calendar';
import {
  Archive,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  Move,
  Pin,
  Share2,
  Tag,
  Trash2,
} from 'lucide-react';
import type React from 'react';

interface EventContextMenuProps {
  children: React.ReactNode;
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onDuplicate?: (event: Event) => void;
  onMove?: (event: Event, date: Date) => void;
  onChangeCategory?: (event: Event, category: Event['category']) => void;
  onShare?: (event: Event) => void;
  onSetReminder?: (event: Event) => void;
  onPin?: (event: Event) => void;
  onArchive?: (event: Event) => void;
}

export function EventContextMenu({
  children,
  event,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onChangeCategory,
  onShare,
  onSetReminder,
  onPin,
  onArchive,
}: EventContextMenuProps) {
  const categories: Array<{ value: Event['category']; label: string; color: string }> = [
    { value: 'personal', label: 'Personal', color: '#10b981' },
    { value: 'work', label: 'Work', color: '#3b82f6' },
    { value: 'effort', label: 'Effort', color: '#f97316' },
    { value: 'note', label: 'Note', color: '#a855f7' },
  ];

  const moveOptions = [
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { label: 'Next Month', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel className="font-semibold truncate">{event.title}</ContextMenuLabel>
        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onEdit?.(event)} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Event
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onDuplicate?.(event)} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Move className="h-4 w-4" />
            Move to...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {moveOptions.map((option) => (
              <ContextMenuItem key={option.label} onClick={() => onMove?.(event, option.date)}>
                {option.label}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onMove?.(event, new Date())}>
              <Calendar className="h-4 w-4 mr-2" />
              Custom Date...
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Tag className="h-4 w-4" />
            Category
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {categories.map((category) => (
              <ContextMenuItem
                key={category.value}
                onClick={() => onChangeCategory?.(event, category.value)}
                className="gap-2"
              >
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                {category.label}
                {event.category === category.value && <ContextMenuShortcut>✓</ContextMenuShortcut>}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onSetReminder?.(event)} className="gap-2">
          <Bell className="h-4 w-4" />
          Set Reminder
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onPin?.(event)} className="gap-2">
          <Pin className="h-4 w-4" />
          Pin Event
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onShare?.(event)} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onArchive?.(event)} className="gap-2 text-neutral-600">
          <Archive className="h-4 w-4" />
          Archive
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onDelete?.(event)}
          className="gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
