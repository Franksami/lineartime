'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { GlassCard, GlassButton } from '@/components/glass';
import { LinearTimelineView } from '@/components/timeline/LinearTimelineView';
import { YearOverview } from '@/components/timeline/YearOverview';
import { HeaderBar, ControlBar, StatusBar, type ViewMode } from '@/components/layout';
import { generateSampleEvents } from '@/lib/sampleData';
import { Calendar, Clock, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const [zoomLevel, setZoomLevel] = useState(45); // Increased default for better touch targets
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate sample events for demonstration
  const sampleEvents = generateSampleEvents(year);
  
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);
  
  const handleEventClick = useCallback((eventId: string) => {
    const event = sampleEvents.find(e => e.id === eventId);
    if (event) {
      console.log('Event clicked:', event);
      // Here you would typically open an event detail modal or navigate to event page
    }
  }, [sampleEvents]);

  // Calculate stats from sample events
  const today = new Date();
  const eventsToday = sampleEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });
  
  const upcomingEvents = sampleEvents.filter(event => 
    event.startTime > today
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  const nextEvent = upcomingEvents[0];

  // Keyboard navigation implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch(e.key.toLowerCase()) {
        case 't':
          // Go to today - scroll to current date
          if (viewMode === 'month') {
            const todayBtn = document.querySelector('[aria-current="date"]');
            if (todayBtn) {
              (todayBtn as HTMLElement).scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center', 
                inline: 'center' 
              });
              (todayBtn as HTMLElement).click();
            }
          } else if (viewMode === 'year') {
            const currentMonth = new Date().getMonth();
            setViewMode('month');
            // TODO: Scroll to current month in timeline
          }
          break;
        
        case 'arrowleft':
          // Previous month/year
          if (e.shiftKey) {
            setYear(year - 1);
          } else if (viewMode === 'month') {
            // Scroll calendar left
            const scrollContainer = document.querySelector('.custom-scrollbar');
            if (scrollContainer) {
              scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
            }
          }
          break;
        
        case 'arrowright':
          // Next month/year
          if (e.shiftKey) {
            setYear(year + 1);
          } else if (viewMode === 'month') {
            // Scroll calendar right
            const scrollContainer = document.querySelector('.custom-scrollbar');
            if (scrollContainer) {
              scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }
          break;
        
        case '+':
        case '=':
          // Zoom in
          e.preventDefault();
          setZoomLevel(Math.min(100, zoomLevel + 10));
          break;
        
        case '-':
        case '_':
          // Zoom out
          e.preventDefault();
          setZoomLevel(Math.max(30, zoomLevel - 10));
          break;
        
        case 'n':
          // New event (placeholder)
          e.preventDefault();
          console.log('New event shortcut triggered');
          // TODO: Open new event modal
          break;
        
        case 'k':
          // Search (with Cmd/Ctrl)
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) {
              (searchInput as HTMLInputElement).focus();
            }
          }
          break;
        
        case '?':
        case '/':
          // Show help
          if (e.shiftKey || e.key === '?') {
            e.preventDefault();
            setShowHelp(!showHelp);
          }
          break;
        
        case 'escape':
          // Close help modal
          if (showHelp) {
            setShowHelp(false);
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
          // Quick view mode switching
          const modes: ViewMode[] = ['year', 'month', 'week', 'day'];
          const modeIndex = parseInt(e.key) - 1;
          if (modes[modeIndex]) {
            setViewMode(modes[modeIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, year, zoomLevel, showHelp]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Bar */}
      <HeaderBar
        year={year}
        onYearChange={setYear}
      />

      {/* Control Bar */}
      <ControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <GlassCard className="p-6" hover liquid>
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-glass-accent" />
                <span className="text-2xl font-bold">{eventsToday.length}</span>
              </div>
              <h3 className="font-semibold mb-1">Events Today</h3>
              <p className="text-sm text-oklch-gray-600">
                {eventsToday.length === 0 ? 'No events scheduled' : 
                 eventsToday.length === 1 ? '1 event scheduled' :
                 `${eventsToday.length} events scheduled`}
              </p>
            </GlassCard>

            <GlassCard className="p-6" hover liquid>
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-glass-secondary" />
                <span className="text-2xl font-bold">
                  {nextEvent ? 
                    `${Math.ceil((nextEvent.startTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))}d` : 
                    '--'
                  }
                </span>
              </div>
              <h3 className="font-semibold mb-1">Next Event</h3>
              <p className="text-sm text-oklch-gray-600">
                {nextEvent ? nextEvent.title : 'No upcoming events'}
              </p>
            </GlassCard>

            <GlassCard className="p-6" hover liquid>
              <div className="flex items-center justify-between mb-4">
                <Plus className="w-8 h-8 text-glass-primary" />
                <GlassButton size="sm" variant="primary">
                  Quick Add
                </GlassButton>
              </div>
              <h3 className="font-semibold mb-1">Create Event</h3>
              <p className="text-sm text-oklch-gray-600">AI-powered scheduling</p>
            </GlassCard>
          </div>

          {/* Main Calendar Interface */}
          <div className="h-[calc(100vh-380px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="glass rounded-glass p-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-3 border-glass-primary border-t-transparent rounded-full" />
                    <p className="text-oklch-gray-200 font-medium">Loading calendar data...</p>
                  </div>
                </div>
              </div>
            ) : viewMode === 'year' ? (
              <YearOverview
                year={year}
                events={sampleEvents}
                className="h-full"
                onMonthClick={(month) => {
                  setViewMode('month');
                  // TODO: Navigate to specific month in timeline
                  console.log('Navigate to month:', month);
                }}
              />
            ) : viewMode === 'month' ? (
              <LinearTimelineView
                year={year}
                events={sampleEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                className="h-full"
                dayWidth={zoomLevel}
              />
            ) : viewMode === 'week' ? (
              <GlassCard className="p-6 h-full" variant="heavy" aurora>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Week View</h2>
                </div>
                <div className="h-full flex items-center justify-center">
                  <p className="text-oklch-gray-600">
                    Week view coming soon...
                  </p>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6 h-full" variant="heavy" aurora>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Day View</h2>
                </div>
                <div className="h-full flex items-center justify-center">
                  <p className="text-oklch-gray-600">
                    Day view coming soon...
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar />
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-heavy rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">⌨️</span>
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-oklch-gray-200 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Toggle help</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">?</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Go to today</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">T</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Previous month</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">←</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Next month</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">→</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Previous/Next year</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">Shift</kbd>
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">←/→</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Zoom in</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">+</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Zoom out</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">-</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">New event</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">N</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">Search</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">⌘</kbd>
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">K</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-oklch-gray-200">View modes</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono text-white">1-4</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}