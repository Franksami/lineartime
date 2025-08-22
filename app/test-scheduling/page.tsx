'use client';

import { useState } from 'react';
import { SchedulingSuggestions } from '@/components/ai/SchedulingSuggestions';
import { EventModal } from '@/components/calendar/EventModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types/calendar';
import { addHours, addDays, startOfDay } from 'date-fns';

// Generate mock events for testing
function generateMockEvents(): Event[] {
  const events: Event[] = [];
  const now = new Date();
  const categories: Event['category'][] = ['work', 'personal', 'effort', 'note'];
  
  // Add some events for today
  events.push({
    id: '1',
    title: 'Morning Standup',
    startDate: addHours(startOfDay(now), 9),
    endDate: addHours(startOfDay(now), 9.5),
    category: 'work'
  });
  
  events.push({
    id: '2',
    title: 'Team Meeting',
    startDate: addHours(startOfDay(now), 14),
    endDate: addHours(startOfDay(now), 15),
    category: 'work'
  });
  
  // Add events for next few days
  for (let day = 1; day <= 7; day++) {
    const baseDate = addDays(now, day);
    const numEvents = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numEvents; i++) {
      const hour = 9 + Math.floor(Math.random() * 8);
      events.push({
        id: `day${day}-${i}`,
        title: `Event ${day}-${i}`,
        startDate: addHours(startOfDay(baseDate), hour),
        endDate: addHours(startOfDay(baseDate), hour + 1),
        category: categories[Math.floor(Math.random() * categories.length)]
      });
    }
  }
  
  return events;
}

export default function TestScheduling() {
  const [events, setEvents] = useState<Event[]>(generateMockEvents());
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [schedulingRequest, setSchedulingRequest] = useState<{ title: string; duration: number } | null>(null);
  
  const handleSaveEvent = (event: Partial<Event>) => {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: event.title || 'New Event',
      startDate: event.startDate || new Date(),
      endDate: event.endDate || addHours(event.startDate || new Date(), 1),
      category: event.category || 'personal',
      description: event.description
    };
    setEvents([...events, newEvent]);
    setShowModal(false);
  };
  
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setShowModal(false);
  };
  
  const checkOverlaps = (start: Date, end: Date, excludeId?: string) => {
    return events.filter(event => {
      if (event.id === excludeId) return false;
      return event.startDate < end && event.endDate > start;
    });
  };
  
  const handleSmartSchedule = (title: string, duration: number) => {
    setSchedulingRequest({ title, duration });
    setShowSuggestions(true);
    setShowModal(false);
  };
  
  const handleAcceptSuggestion = (suggestion: any) => {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: schedulingRequest?.title || 'New Event',
      startDate: suggestion.slot.start,
      endDate: suggestion.slot.end,
      category: 'personal'
    };
    setEvents([...events, newEvent]);
    setShowSuggestions(false);
    setSchedulingRequest(null);
  };
  
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Scheduling Test</CardTitle>
          <CardDescription>
            Test the AI-powered scheduling suggestions with mock calendar data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => setShowModal(true)}>
              Create New Event
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSchedulingRequest({ title: 'Team Meeting', duration: 60 });
                setShowSuggestions(true);
              }}
            >
              Test Smart Schedule Directly
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Current Events ({events.length})</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {events.slice(0, 5).map(event => (
                <div key={event.id}>
                  • {event.title} - {event.startDate.toLocaleDateString()} at {event.startDate.toLocaleTimeString()}
                </div>
              ))}
              {events.length > 5 && <div>... and {events.length - 5} more events</div>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showSuggestions && schedulingRequest && (
        <SchedulingSuggestions
          title={schedulingRequest.title}
          duration={schedulingRequest.duration}
          events={events}
          onAccept={handleAcceptSuggestion}
          onCancel={() => {
            setShowSuggestions(false);
            setSchedulingRequest(null);
          }}
          preferences={{
            timeOfDay: 'morning',
            avoidConflicts: true,
            bufferTime: 15
          }}
        />
      )}
      
      <EventModal
        open={showModal}
        onOpenChange={setShowModal}
        event={null}
        selectedDate={new Date()}
        selectedRange={null}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        checkOverlaps={checkOverlaps}
        onSmartSchedule={handleSmartSchedule}
        events={events}
      />
    </div>
  );
}