'use client';

import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAutoAnimate, useAutoAnimateList } from '@/hooks/useAutoAnimate';
import { EventParser } from '@/lib/nlp/EventParser';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { addMinutes, format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  Tag,
  Trash,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CommandBarProps {
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (id: string, event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  onEventSearch?: (query: string) => void;
  events?: Event[];
}

export function CommandBar({
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventSearch,
  events = [],
}: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ReturnType<EventParser['parse']> | null>(null);
  const [intent, setIntent] = useState<ReturnType<EventParser['parseIntent']> | null>(null);
  const [_highlightedMonth, setHighlightedMonth] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const parser = useRef(new EventParser());
  const inputRef = useRef<HTMLInputElement>(null);

  // AutoAnimate refs for smooth transitions
  const [commandListRef] = useAutoAnimateList({ duration: 200 });
  const [resultsRef] = useAutoAnimate({ duration: 250, easing: 'ease-out' });

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev); // Toggle open/close
      }

      // Quick add with CMD+N
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setOpen(true);
        setInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Real-time parsing
  useEffect(() => {
    if (input.length > 2) {
      const parsedIntent = parser.current.parseIntent(input);
      setIntent(parsedIntent);

      if (parsedIntent?.action === 'search' && parsedIntent.target) {
        // Search through events
        const query = parsedIntent.target.toLowerCase();
        const results = events.filter(
          (event) =>
            event.title.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query)
        );
        setSearchResults(results);
        setPreview(null);
      } else if (parsedIntent?.action === 'create') {
        // Parse as new event
        const parsed = parser.current.parse(input);
        setPreview(parsed);
        setSearchResults([]);

        // Highlight target month on timeline
        if (parsed.start) {
          setHighlightedMonth(parsed.start.getMonth());
          // Optionally scroll to month
          scrollToMonth(parsed.start.getMonth());
        }
      } else {
        setPreview(null);
        setSearchResults([]);
      }
    } else {
      setPreview(null);
      setIntent(null);
      setHighlightedMonth(null);
      setSearchResults([]);
    }
  }, [input, events]);

  const scrollToMonth = (month: number) => {
    // Find the month element and scroll to it
    const monthElement = document.querySelector(`[data-month="${month}"]`);
    monthElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = useCallback(() => {
    if (!intent) return;

    if (intent.action === 'create' && preview && preview.confidence > 0.3) {
      const event: Partial<Event> = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: preview.title,
        startDate: preview.start || new Date(),
        endDate: preview.end || addMinutes(preview.start || new Date(), 60),
        category: preview.category,
        location: preview.location,
        attendees: preview.attendees,
      };

      onEventCreate?.(event);

      // Reset and close
      setOpen(false);
      setInput('');
      setPreview(null);
      setIntent(null);
    } else if (intent.action === 'delete' && intent.target) {
      // Find matching event and delete
      const target = events.find((e) =>
        e.title.toLowerCase().includes(intent.target?.toLowerCase())
      );
      if (target) {
        onEventDelete?.(target.id);
        setOpen(false);
        setInput('');
      }
    } else if (intent.action === 'search' && searchResults.length > 0) {
      // Navigate to first result
      const firstResult = searchResults[0];
      scrollToMonth(firstResult.startDate.getMonth());
      setOpen(false);
      setInput('');
    }
  }, [intent, preview, searchResults, events, onEventCreate, onEventDelete]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="w-[600px] z-50">
      <div className="bg-popover border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <CommandInput
            ref={inputRef}
            value={input}
            onValueChange={setInput}
            placeholder="Type to create an event (e.g., 'Lunch with Sarah tomorrow at 12pm')"
            className="w-full py-3 bg-transparent outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘K</kbd>
            <span>to close</span>
          </div>
        </div>

        <CommandList ref={commandListRef} className="max-h-[400px] overflow-y-auto p-2">
          {/* Event preview */}
          {preview && intent?.action === 'create' && (
            <div className="p-4 mb-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    {preview.title || 'New Event'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {preview.start && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(preview.start, 'MMM d, yyyy')}
                      </div>
                    )}
                    {preview.start && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(preview.start, 'h:mm a')}
                        {preview.end && ` - ${format(preview.end, 'h:mm a')}`}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    preview.category === 'work' && 'bg-secondary/20 text-secondary',
                    preview.category === 'personal' && 'bg-primary/20 text-primary',
                    preview.category === 'effort' && 'bg-accent/20 text-accent-foreground',
                    preview.category === 'note' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {preview.category}
                </div>
              </div>

              {(preview.location || preview.attendees) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {preview.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {preview.location}
                    </div>
                  )}
                  {preview.attendees && preview.attendees.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {preview.attendees.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      preview.confidence > 0.7
                        ? 'bg-primary'
                        : preview.confidence > 0.4
                          ? 'bg-muted-foreground'
                          : 'bg-destructive'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {preview.confidence > 0.7
                      ? 'High'
                      : preview.confidence > 0.4
                        ? 'Medium'
                        : 'Low'}{' '}
                    confidence
                  </span>
                </div>

                {preview.confidence < 0.4 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    Add more details for better accuracy
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
                  <span>to create</span>
                </div>
              </div>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <CommandGroup heading="Search Results">
              <div ref={resultsRef}>
                {searchResults.map((event) => (
                  <CommandItem
                    key={event.id}
                    value={event.id}
                    onSelect={() => {
                      scrollToMonth(event.startDate.getMonth());
                      setOpen(false);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(event.startDate, 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'px-2 py-1 rounded text-xs',
                        event.category === 'work' && 'bg-secondary/20 text-secondary',
                        event.category === 'personal' && 'bg-primary/20 text-primary',
                        event.category === 'effort' && 'bg-accent/20 text-accent-foreground',
                        event.category === 'note' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {event.category}
                    </div>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          )}

          {/* Quick actions */}
          {!preview && searchResults.length === 0 && (
            <>
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  value="meeting"
                  onSelect={() => setInput('Meeting tomorrow at 10am')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Schedule a meeting</span>
                </CommandItem>
                <CommandItem
                  value="reminder"
                  onSelect={() => setInput('Reminder: ')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Set a reminder</span>
                </CommandItem>
                <CommandItem
                  value="block"
                  onSelect={() => setInput('Focus time tomorrow 9am to 12pm')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span>Block focus time</span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Examples">
                <div className="px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <div>• "Lunch with Sarah tomorrow at 12pm at Starbucks"</div>
                  <div>• "Team meeting every Monday at 10am"</div>
                  <div>• "Doctor appointment next Friday 3pm"</div>
                  <div>• "Find meetings this week"</div>
                  <div>• "Delete birthday party"</div>
                </div>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
