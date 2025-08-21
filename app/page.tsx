'use client';

import { useState, useCallback } from 'react';
import { LinearCalendarVertical } from "@/components/calendar/LinearCalendarVertical";
import { VirtualCalendar } from "@/components/calendar/VirtualCalendar";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { EventManagement } from "@/components/calendar/EventManagement";
import { ViewSwitcher, CalendarView } from "@/components/dashboard/ViewSwitcher";
import { useOfflineEvents } from "@/hooks/useIndexedDB";
import { HighContrastToggle } from "@/components/ui/high-contrast-toggle";
import { CommandBar } from "@/components/CommandBar";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { AssistantPanel } from "@/components/ai/AssistantPanel";
import type { Event } from "@/types/calendar";

export default function Page() {
  const currentYear = new Date().getFullYear();
  const [currentView, setCurrentView] = useState<CalendarView>('year');
  const [useVirtualScroll, setUseVirtualScroll] = useState(true); // Feature flag for virtual scrolling
  const userId = 'default-user'; // This could come from auth context later
  
  // Get events from IndexedDB for timeline and management views
  const { events, createEvent, updateEvent, deleteEvent } = useOfflineEvents(userId);
  
  // Convert IndexedDB events to the format expected by TimelineContainer
  const timelineEvents = events?.map(e => ({
    id: e.convexId || String(e.id),
    title: e.title,
    category: (e.categoryId || 'personal') as any,
    date: new Date(e.startTime).toISOString(),
    description: e.description
  })) || [];
  
  // Convert IndexedDB events to the format expected by VirtualCalendar
  const calendarEvents: Event[] = events?.map(e => ({
    id: e.convexId || String(e.id),
    title: e.title,
    description: e.description || '',
    startDate: new Date(e.startTime),
    endDate: new Date(e.endTime || e.startTime),
    category: (e.categoryId || 'personal') as any,
    location: e.location,
    attendees: e.attendees,
    isRecurring: e.isRecurring || false
  })) || [];
  
  // Handle event creation from CommandBar
  const handleEventCreate = useCallback(async (event: Partial<Event>) => {
    if (event.title && event.startDate && createEvent) {
      await createEvent({
        title: event.title,
        startTime: event.startDate.getTime(),
        endTime: (event.endDate || event.startDate).getTime(),
        categoryId: event.category || 'personal',
        description: event.description || '',
        location: event.location,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'local',
        isDeleted: false
      });
    }
  }, [createEvent, userId]);
  
  // Handle event deletion from CommandBar
  const handleEventDelete = useCallback(async (id: string) => {
    const numericId = parseInt(id) || events?.find(e => e.convexId === id)?.id;
    if (numericId) {
      await deleteEvent(numericId);
    }
  }, [deleteEvent, events]);
  
  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Command Bar for NLP event creation */}
      <CommandBar
        onEventCreate={handleEventCreate}
        onEventDelete={handleEventDelete}
        events={events}
      />
      
      {/* Header with View Switcher */}
      <div className="relative z-10 px-4 pt-4">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {currentYear} Linear Calendar
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Life is bigger than a week
              </p>
            </div>
            <div className="flex items-center gap-2">
              <HighContrastToggle />
              <ViewSwitcher 
                currentView={currentView} 
                onViewChange={setCurrentView}
              />
            </div>
          </div>
        </div>
      </div>
          
      {/* Main Content Area */}
      <div className="flex-1 h-[calc(100vh-88px)] bg-background overflow-hidden">
        {currentView === 'year' && (
          <>
            {/* Virtual Scroll Toggle (temporary for testing) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-20 right-4 z-20 bg-background/80 backdrop-blur-sm p-2 rounded-lg border">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={useVirtualScroll}
                    onChange={(e) => setUseVirtualScroll(e.target.checked)}
                    className="rounded"
                  />
                  Use Virtual Scrolling
                </label>
              </div>
            )}
            
            {useVirtualScroll ? (
              <VirtualCalendar
                year={currentYear}
                events={calendarEvents}
                className="h-full"
                onDateSelect={(date) => console.log('Date selected:', date)}
                onEventClick={(event) => console.log('Event clicked:', event)}
              />
            ) : (
              <LinearCalendarVertical 
                initialYear={currentYear} 
                className="h-full"
                userId={userId}
              />
            )}
          </>
        )}
        
        {currentView === 'timeline' && (
          <div className="h-full p-6">
            <TimelineContainer
              className="h-full"
              events={timelineEvents}
              config={{
                glassmorphic: false,
                initialZoomLevel: 'month',
                enableGestures: true,
                enableKeyboardNavigation: true,
                showHeatMap: true,
                monthRowHeight: 150
              }}
            />
          </div>
        )}
        
        {currentView === 'manage' && (
          <div className="h-full p-6 overflow-auto">
            <EventManagement userId={userId} />
          </div>
        )}
      </div>
      
      {/* Performance Monitor (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceMonitor 
          eventCount={calendarEvents.length}
          position="bottom-left"
        />
      )}
      
      {/* AI Assistant Panel */}
      <AssistantPanel
        events={calendarEvents}
        onEventCreate={handleEventCreate}
        onEventUpdate={updateEvent}
        onEventDelete={handleEventDelete}
      />
    </div>
  );
}