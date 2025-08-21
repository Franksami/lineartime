/**
 * Example Real-time Calendar View Component
 * Demonstrates integration of real-time subscriptions
 */

"use client";

import React, { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { 
  useRealtimeCalendarData,
  useRealtimeConnectionStatus 
} from "@/hooks/useRealtimeSubscriptions";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Loader2, RefreshCw, WifiOff, AlertTriangle } from "lucide-react";

interface RealtimeCalendarViewProps {
  userId: Id<"users"> | undefined;
  view?: "week" | "month";
}

export function RealtimeCalendarView({ 
  userId, 
  view = "week" 
}: RealtimeCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Calculate date range based on view
  const { startTime, endTime } = useMemo(() => {
    const start = view === "week" 
      ? startOfWeek(selectedDate)
      : startOfMonth(selectedDate);
    const end = view === "week"
      ? endOfWeek(selectedDate)
      : endOfMonth(selectedDate);
    
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
    };
  }, [selectedDate, view]);

  // Subscribe to real-time calendar data
  const {
    events,
    categories,
    categoriesById,
    calendars,
    defaultCalendar,
    syncStatus,
    isSyncing,
    conflicts,
    hasConflicts,
    preferences,
    isLoading,
  } = useRealtimeCalendarData(userId, startTime, endTime);

  // Monitor connection status
  const { isConnected, connectionState } = useRealtimeConnectionStatus();

  // Group events by date
  const eventsByDate = useMemo(() => {
    if (!events) return {};
    
    return events.reduce((acc, event) => {
      const dateKey = format(new Date(event.startTime), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
  }, [events]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading calendar data...
          </p>
        </div>
      </div>
    );
  }

  // Render connection error
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <WifiOff className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No connection to real-time updates
          </p>
          <button 
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sync status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(selectedDate, view === "week" ? "'Week of' MMM d, yyyy" : "MMMM yyyy")}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sync indicator */}
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          
          {/* Conflict indicator */}
          {hasConflicts && (
            <button className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:underline">
              <AlertTriangle className="h-4 w-4" />
              <span>{conflicts.length} conflicts</span>
            </button>
          )}
          
          {/* Connection status */}
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${
              connectionState === "connected" 
                ? "bg-green-500" 
                : "bg-gray-400"
            }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {connectionState}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar info cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {events?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Events
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {calendars?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Calendars
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {categories?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Categories
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {syncStatus?.providers?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Connected Accounts
          </div>
        </div>
      </div>

      {/* Events list (simplified) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Upcoming Events
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {events && events.length > 0 ? (
            events.slice(0, 10).map((event) => {
              const category = event.categoryId ? categoriesById[event.categoryId] : null;
              
              return (
                <div key={event._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {format(new Date(event.startTime), "MMM d, h:mm a")}
                        {event.endTime && ` - ${format(new Date(event.endTime), "h:mm a")}`}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                    
                    {category && (
                      <div 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: category.color + "20",
                          color: category.color 
                        }}
                      >
                        {category.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No events in this {view}
            </div>
          )}
        </div>
      </div>

      {/* User preferences display */}
      {preferences && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Calendar Settings
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Theme:</span>{" "}
              <span className="text-gray-900 dark:text-white">{preferences.theme}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Time Format:</span>{" "}
              <span className="text-gray-900 dark:text-white">{preferences.timeFormat}h</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Timezone:</span>{" "}
              <span className="text-gray-900 dark:text-white">{preferences.timezone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Real-time Event Counter
 * Shows live count of events updating in real-time
 */
export function RealtimeEventCounter({ userId }: { userId: Id<"users"> | undefined }) {
  const now = Date.now();
  const endOfToday = new Date().setHours(23, 59, 59, 999);
  
  const { events } = useRealtimeCalendarData(userId, now, endOfToday);
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {events?.length || 0} events today
      </span>
    </div>
  );
}