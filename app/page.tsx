'use client';

import { useState, useCallback, useEffect } from 'react';
import { LinearCalendarVertical } from "@/components/calendar/LinearCalendarVertical";
import { VirtualCalendar } from "@/components/calendar/VirtualCalendar";
import { HybridCalendar } from "@/components/calendar/HybridCalendar";
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
import type { Event } from "@/types/calendar";

export default function Page() {
  const currentYear = new Date().getFullYear();
  const [currentView, setCurrentView] = useState<CalendarView>('year');
  // Check for environment variable or default to HybridCalendar
  const useHybrid = process.env.NEXT_PUBLIC_USE_HYBRID_CALENDAR !== 'false';
  const [useVirtualScroll, setUseVirtualScroll] = useState(!useHybrid); // Feature flag for virtual scrolling
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
  
  return (
    <div 
      className="h-screen bg-background overflow-hidden"
      role="application"
      aria-label="Linear Calendar for year navigation and event management"
    >
      {/* Command Bar for NLP event creation */}
      <CommandBar
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
            <div className="flex items-center gap-2" role="toolbar" aria-label="Calendar controls">
              <HighContrastToggle />
              <SettingsDialog />
              <ViewSwitcher 
                currentView={currentView} 
                onViewChange={setCurrentView}
              />
            </div>
          </div>
        </div>
      </div>
          
      {/* Main Content Area */}
      <main 
        id="main-content"
        className="flex-1 h-[calc(100vh-88px)] bg-background overflow-hidden"
        aria-label="Main calendar content"
      >
        {currentView === 'year' && (
          <div id="calendar-view">
            {/* Virtual Scroll Toggle (temporary for testing) */}
            {process.env.NODE_ENV === 'development' && !isMobile && (
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
              /* Desktop Calendar View */
              useHybrid ? (
                <HybridCalendar
                  year={currentYear}
                  events={calendarEvents}
                  className="h-full"
                  onDateSelect={(date) => console.log('Date selected:', date)}
                  onEventClick={(event) => console.log('Event clicked:', event)}
                  onEventUpdate={async (event) => {
                    console.log('Event updated:', event)
                    // Update the event in IndexedDB
                    if (updateEvent) {
                      const existingEvent = events?.find(e => e.convexId === event.id || String(e.id) === event.id)
                      if (existingEvent) {
                        await updateEvent(existingEvent.id, {
                          startTime: event.startDate.getTime(),
                          endTime: event.endDate.getTime(),
                        })
                      }
                    }
                  }}
                  useCanvas={calendarEvents.length > 100} // Auto-switch to canvas for performance
                  canvasThreshold={100}
                  enableDragDrop={true}
                />
              ) : useVirtualScroll ? (
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
              )
            )}
          </div>
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
    </div>
  );
}