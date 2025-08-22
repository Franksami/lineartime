'use client';

import { useState, useCallback, useEffect } from 'react';
import { LinearCalendarVertical } from "@/components/calendar/LinearCalendarVertical";
import { VirtualCalendar } from "@/components/calendar/VirtualCalendar";
import { HybridCalendar } from "@/components/calendar/HybridCalendar";
import { LinearCalendarHorizontal } from "@/components/calendar/LinearCalendarHorizontal";
import { LinearCalendarFullBleed } from "@/components/calendar/LinearCalendarFullBleed";
import { MobileCalendarView } from "@/components/mobile/MobileCalendarView";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { EventManagement } from "@/components/calendar/EventManagement";
import { ViewSwitcher, CalendarView } from "@/components/dashboard/ViewSwitcher";
import { useOfflineEvents } from "@/hooks/useIndexedDB";
import { HighContrastToggle } from "@/components/ui/high-contrast-toggle";
import { CommandBar } from "@/components/CommandBar";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { AssistantPanel } from "@/components/ai/AssistantPanel";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { NavigationHeader } from "@/components/layout/NavigationHeader";
import type { Event } from "@/types/calendar";

export default function Page() {
  const currentYear = new Date().getFullYear();
  const [currentView, setCurrentView] = useState<CalendarView>('year');
  // CRITICAL: Never change from LinearCalendarHorizontal - this is the core identity of LinearTime
  // The horizontal linear timeline layout is what makes this calendar unique
  const [isMobile, setIsMobile] = useState(false);
  const userId = 'default-user'; // This could come from auth context later
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [])
  
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
  
  const isYearView = currentView === 'year'

  return (
    <div 
      className="h-screen bg-background overflow-hidden flex flex-col"
      role="application"
      aria-label="Linear Calendar for year navigation and event management"
    >
      {/* Navigation Header */}
      <NavigationHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onEventCreate={handleEventCreate}
        onEventDelete={handleEventDelete}
        events={events}
      />
      
      {/* Skip Links for Accessibility */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <a 
        href="#calendar-view"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-24 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to calendar
      </a>
      
          
      {/* Main Content Area */}
      <main 
        id="main-content"
        className="flex-1 bg-background overflow-hidden"
        aria-label="Main calendar content"
      >
        {isYearView && (
          <div id="calendar-view">
            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && !isMobile && (
              <div className="absolute top-20 right-4 z-20 bg-background/80 backdrop-blur-sm p-2 rounded-lg border">
                <span className="text-xs text-muted-foreground">Horizontal Linear Timeline</span>
              </div>
            )}
            
            {/* Mobile Calendar View */}
            {isMobile ? (
              <MobileCalendarView
                events={calendarEvents}
                currentDate={new Date()}
                onDateSelect={(date) => console.log('Date selected:', date)}
                onEventClick={(event) => console.log('Event clicked:', event)}
                onAddEvent={async (date) => {
                  // Open event creation modal
                  console.log('Add event for:', date)
                }}
                className="h-full"
              />
            ) : (
              /* Desktop Calendar View - HORIZONTAL LINEAR TIMELINE */
              /* CRITICAL: This horizontal layout is the core identity of LinearTime */
              <LinearCalendarHorizontal
                year={currentYear}
                events={calendarEvents}
                className="h-full w-full"
                onDateSelect={(date) => console.log('Date selected:', date)}
                onEventClick={(event) => console.log('Event clicked:', event)}
                onEventCreate={handleEventCreate}
                onEventUpdate={async (event) => {
                  if (updateEvent) {
                    const existingEvent = events?.find(e => e.convexId === event.id || String(e.id) === event.id)
                    if (existingEvent) {
                      await updateEvent(existingEvent.id, {
                        title: event.title,
                        startTime: event.startDate.getTime(),
                        endTime: event.endDate?.getTime() || event.startDate.getTime(),
                        categoryId: event.category,
                        description: event.description,
                        location: event.location
                      })
                    }
                  }
                }}
                onEventDelete={handleEventDelete}
                enableInfiniteCanvas={true}
              />
            )}
          </div>
        )}
        
        {currentView === 'timeline' && (
          <div className="h-full p-6">
            <TimelineContainer
              className="h-full"
              events={timelineEvents}
              userId={userId}
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
      </main>
      
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
      
      {/* Command Bar - Natural Language Input (Cmd+K to open) */}
      <CommandBar
        onEventCreate={handleEventCreate}
        onEventUpdate={async (id, event) => {
          const numericId = parseInt(id) || events?.find(e => e.convexId === id)?.id;
          if (numericId && updateEvent) {
            await updateEvent(numericId, {
              title: event.title || '',
              startTime: event.startDate?.getTime() || Date.now(),
              endTime: event.endDate?.getTime() || event.startDate?.getTime() || Date.now(),
              categoryId: event.category || 'personal',
              description: event.description,
              location: event.location,
              updatedAt: Date.now()
            });
          }
        }}
        onEventDelete={handleEventDelete}
        onEventSearch={(query) => {
          console.log('Searching for:', query);
          // TODO: Implement search highlighting/filtering
        }}
        events={calendarEvents}
      />
    </div>
  );
}