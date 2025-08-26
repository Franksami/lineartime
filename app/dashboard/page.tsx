'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
// Lazy load calendar components for better performance
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy calendar components
const LinearCalendarHorizontal = dynamic(
  () => import("@/components/calendar/LinearCalendarHorizontal").then(mod => ({ default: mod.LinearCalendarHorizontal })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const LinearCalendarPro = dynamic(
  () => import("@/components/calendar/LinearCalendarPro").then(mod => ({ default: mod.LinearCalendarPro })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const ToastUICalendarView = dynamic(
  () => import("@/components/calendar/ToastUICalendarView").then(mod => ({ default: mod.ToastUICalendarView })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const ProgressCalendarView = dynamic(
  () => import("@/components/calendar/ProgressCalendarView").then(mod => ({ default: mod.ProgressCalendarView })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const TimelineView = dynamic(
  () => import("@/components/calendar/timeline-view").then(mod => ({ default: mod.TimelineView })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const EventManagement = dynamic(
  () => import("@/components/calendar/EventManagement").then(mod => ({ default: mod.EventManagement })),
  { loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const ExternalEventsPanel = dynamic(
  () => import("@/components/calendar/ExternalEventsPanel").then(mod => ({ default: mod.ExternalEventsPanel })),
  { loading: () => <div className="w-80 border-l border-border bg-card p-4 animate-pulse" /> }
);
import { CalendarView } from "@/components/dashboard/ViewSwitcher";
import { useOfflineEvents } from "@/hooks/useIndexedDB";
// Lazy load AI components for better performance
const CommandBar = dynamic(
  () => import("@/components/CommandBar").then(mod => ({ default: mod.CommandBar })),
  { ssr: false } // Disable SSR for command bar
);

// Import AutoAnimate hooks for view switching animations
import { useAutoAnimate } from '@/hooks/useAutoAnimate';

const EnhancedAIAssistant = dynamic(
  () => import("@/components/ai/EnhancedAIAssistant").then(mod => ({ default: mod.EnhancedAIAssistant })),
  { ssr: false } // Disable SSR for AI panel
);

const PerformanceMonitor = dynamic(
  () => import("@/components/ui/performance-monitor").then(mod => ({ default: mod.PerformanceMonitor })),
  { ssr: false }
);
import { NavigationHeader } from "@/components/layout/NavigationHeader";
import { EventFilterPanel } from "@/components/calendar/event-filter-panel";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { Event, EventFilters } from "@/components/ui/calendar";
import { CATEGORY_COLORS } from "@/components/ui/calendar";

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [currentView, setCurrentView] = useState<CalendarView>('year');
  // CRITICAL: Never change from LinearCalendarHorizontal - this is the core identity of LinearTime
  // The horizontal linear timeline layout is what makes this calendar unique
  const [isMobile, setIsMobile] = useState(false);
  const userId = 'default-user'; // This could come from auth context later
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    categories: new Set(),
    priorities: new Set(),
    tags: new Set(),
    searchQuery: ""
  });
  
  // AutoAnimate ref for smooth view switching
  const [viewContainerRef] = useAutoAnimate({ 
    duration: 400, 
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' 
  });
  
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
  
  // Convert IndexedDB events to the format expected by VirtualCalendar
  const allCalendarEvents: Event[] = events?.map(e => ({
    id: e.convexId || String(e.id),
    title: e.title,
    description: e.description || '',
    startDate: new Date(e.startTime),
    endDate: new Date(e.endTime || e.startTime),
    category: (e.categoryId || 'personal') as any,
    location: e.location,
    attendees: e.attendees,
    isRecurring: e.isRecurring || false,
    priority: (e as any).priority || 'medium', // Add priority support
    tags: (e as any).tags || [] // Add tags support
  })) || [];

  // Optimized event filtering with better performance
  const calendarEvents = useMemo(() => {
    // Early return if no events or no filters
    if (!allCalendarEvents.length) return [];
    if (!filters.categories.size && !filters.priorities.size && !filters.tags.size && !filters.searchQuery) {
      return allCalendarEvents;
    }

    let filtered = allCalendarEvents;

    // Apply filters in order of most likely to reduce the dataset first
    // Category filter (usually most selective)
    if (filters.categories.size > 0) {
      filtered = filtered.filter(event => filters.categories.has(event.category));
    }

    // Priority filter
    if (filters.priorities.size > 0) {
      filtered = filtered.filter(event => filters.priorities.has(event.priority));
    }

    // Tags filter
    if (filters.tags.size > 0) {
      filtered = filtered.filter(event =>
        event.tags?.some(tag => filters.tags.has(tag)) || false
      );
    }

    // Search filter (text search is most expensive, do last)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allCalendarEvents, filters.categories, filters.priorities, filters.tags, filters.searchQuery]);
  
  // Vertical timeline events (respect current filters) - optimized
  const verticalTimelineEvents = useMemo(() => {
    if (!calendarEvents?.length) return [];
    return calendarEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      startDate: e.startDate,
      endDate: e.endDate,
      category: e.category,
      color: CATEGORY_COLORS[e.category] || CATEGORY_COLORS.personal
    }));
  }, [calendarEvents]);
  
  // Get available tags from all events for filter panel - optimized
  const availableTags = useMemo(() => {
    if (!allCalendarEvents?.length) return [];
    const tags = new Set<string>();
    allCalendarEvents.forEach(event => {
      if (event.tags?.length) {
        event.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allCalendarEvents]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      categories: new Set(),
      priorities: new Set(),
      tags: new Set(),
      searchQuery: ""
    });
  }, []);
  
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
  const isCalendarView = ['year', 'fullcalendar', 'toast-ui', 'progress'].includes(currentView)

  return (
    <div
      className="h-full bg-background overflow-hidden flex flex-col"
      role="application"
      aria-label="Linear Calendar for year navigation and event management"
    >
      {/* Navigation Header - Now part of the dashboard */}
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


      {/* Main Content Area with Suspense for better performance */}
      <Suspense fallback={
        <main className="flex-1 bg-background overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </main>
      }>
        <main
          id="main-content"
          className="flex-1 bg-background overflow-hidden"
          aria-label="Main calendar content"
        >
        {isCalendarView && (
          <div id="calendar-view" className="relative h-full">
            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && !isMobile && (
              <div className="absolute top-20 right-4 z-20 bg-card border border-border shadow-sm p-2 rounded-lg">
                <span className="text-xs text-muted-foreground">
                  {currentView === 'year' && 'Horizontal Linear Timeline'}
                  {currentView === 'fullcalendar' && 'FullCalendar Pro'}
                  {currentView === 'toast-ui' && 'Toast UI Calendar'}
                  {currentView === 'progress' && 'Progress Visualization'}
                </span>
              </div>
            )}
            
            {/* Filter Toggle Button - Only show for calendar views that support filtering */}
            {['year', 'fullcalendar', 'toast-ui'].includes(currentView) && (
              <div className="absolute top-4 right-4 z-40 sm:right-20 md:right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shadow-sm bg-card border border-border"
                  aria-label="Toggle event filters"
                >
                  <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filter</span>
                  {(filters.categories.size + filters.priorities.size + filters.tags.size + (filters.searchQuery ? 1 : 0)) > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {filters.categories.size + filters.priorities.size + filters.tags.size + (filters.searchQuery ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </div>
            )}
            
            {/* Filter Panel - Responsive positioning */}
            {showFilters && ['year', 'fullcalendar', 'toast-ui'].includes(currentView) && (
              <div className="absolute top-16 right-4 z-30 w-80 max-w-[calc(100vw-2rem)]">
                <EventFilterPanel
                  filters={filters}
                  availableTags={availableTags}
                  onFiltersChange={setFilters}
                  onClearFilters={clearFilters}
                />
              </div>
            )}
            
            {/* Calendar Views with smooth transitions */}
            <div ref={viewContainerRef} className="h-full w-full">
            {currentView === 'year' && (
              // 🔒 FOUNDATION: LinearCalendarHorizontal on ALL devices
              // CRITICAL: Horizontal timeline preserved across desktop AND mobile
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
            
            {currentView === 'fullcalendar' && (
              <div className="flex h-full">
                {/* Enhanced FullCalendar with advanced drag-and-drop */}
                <div className="flex-1">
                  <LinearCalendarPro
                    year={currentYear}
                    events={calendarEvents}
                    className="h-full w-full"
                    view="dayGridMonth"
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
                </div>
                
                {/* External Events Panel - Desktop Only */}
                {!isMobile && (
                  <div className="w-80 border-l border-border bg-card p-4">
                    <ExternalEventsPanel 
                      onEventCreate={(template) => {
                        console.log('Creating event from template:', template)
                        handleEventCreate({
                          title: template.title,
                          category: template.category,
                          description: template.description,
                          startDate: new Date(),
                          endDate: new Date()
                        })
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {currentView === 'toast-ui' && (
              <ToastUICalendarView
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
                view="month"
              />
            )}
            
            {currentView === 'progress' && (
              <ProgressCalendarView
                year={currentYear}
                events={calendarEvents}
                className="h-full w-full"
                onDateSelect={(date) => console.log('Date selected:', date)}
                onEventClick={(event) => console.log('Event clicked:', event)}
              />
            )}
            </div>
          </div>
        )}
        
        {currentView === 'timeline' && (
          <div className="h-full p-6 overflow-auto">
            <TimelineView
              year={currentYear}
              events={verticalTimelineEvents as any}
              onEventsChange={() => {}}
            />
          </div>
        )}
        
        {currentView === 'manage' && (
          <div className="h-full p-6 overflow-auto">
            <EventManagement userId={userId} />
          </div>
        )}
        </main>
      </Suspense>

      {/* Performance Monitor (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <PerformanceMonitor
            eventCount={calendarEvents.length}
            position="bottom-left"
          />
        </Suspense>
      )}

      {/* Enhanced AI Assistant Panel - Only load when needed */}
      <Suspense fallback={null}>
        <EnhancedAIAssistant
          events={calendarEvents}
          onEventCreate={handleEventCreate}
          onEventUpdate={updateEvent}
          onEventDelete={handleEventDelete}
        />
      </Suspense>

      {/* Command Bar - Natural Language Input (Cmd+K to open) */}
      <Suspense fallback={null}>
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
          onEventSearch={() => {
            // Search functionality is handled by the CommandBar component
            // Future enhancement: implement search highlighting/filtering in calendar view
          }}
          events={calendarEvents}
        />
      </Suspense>
    </div>
  );
}