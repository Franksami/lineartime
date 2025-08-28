'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ManageViewProps {
  events: CalendarEvent[];
  onEventsChange: (events: CalendarEvent[]) => void;
}

export function ManageView({ events, onEventsChange }: ManageViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteEvent = (eventId: string) => {
    onEventsChange(events.filter((e) => e.id !== eventId));
  };

  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage Events</h1>
          <p className="text-gray-600 /* TODO: Use semantic token */">Organize and manage your calendar events</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 /* TODO: Use semantic token */ w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Events ({filteredEvents.length})
              </h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      {event.category && (
                        <Badge variant="secondary" className="text-xs">
                          {event.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 /* TODO: Use semantic token */ mb-2">
                      {format(event.startDate, 'MMM d, yyyy')} -{' '}
                      {format(event.endDate, 'MMM d, yyyy')}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 /* TODO: Use semantic token */">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 /* TODO: Use semantic token */ hover:text-red-700 /* TODO: Use semantic token */ hover:bg-red-50 /* TODO: Use semantic token */"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500 /* TODO: Use semantic token */">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
