'use client';

import { useState } from 'react';
import { LinearCalendarVertical } from "@/components/calendar/LinearCalendarVertical";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { EventManagement } from "@/components/calendar/EventManagement";
import { ViewSwitcher, CalendarView } from "@/components/dashboard/ViewSwitcher";
import { useOfflineEvents } from "@/hooks/useIndexedDB";

export default function Page() {
  const currentYear = new Date().getFullYear();
  const [currentView, setCurrentView] = useState<CalendarView>('year');
  const userId = 'default-user'; // This could come from auth context later
  
  // Get events from IndexedDB for timeline and management views
  const { events } = useOfflineEvents(userId);
  
  // Convert IndexedDB events to the format expected by TimelineContainer
  const timelineEvents = events?.map(e => ({
    id: e.convexId || String(e.id),
    title: e.title,
    category: (e.categoryId || 'personal') as any,
    date: new Date(e.startTime).toISOString(),
    description: e.description
  })) || [];
  
  return (
    <div className="h-screen bg-background overflow-hidden">
      
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
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={setCurrentView}
            />
          </div>
        </div>
      </div>
          
      {/* Main Content Area */}
      <div className="flex-1 h-[calc(100vh-88px)] bg-background overflow-hidden">
        {currentView === 'year' && (
          <LinearCalendarVertical 
            initialYear={currentYear} 
            className="h-full"
            userId={userId}
          />
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
      
    </div>
  );
}