'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { useSyncedCalendar } from '@/hooks/useSyncedCalendar';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { CalendarErrorBoundary } from './CalendarErrorBoundary';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { DayDetailView } from './DayDetailView';
import { EventModal } from './EventModal';
import { EventSyncIndicator, SyncStatusBar } from './EventSyncIndicator';
import { FilterPanel } from './FilterPanel';
import { ReflectionModal } from './ReflectionModal';
import { ZoomControls } from './ZoomControls';

interface LinearCalendarWithSyncProps {
  initialYear?: number;
  className?: string;
  enableSync?: boolean;
}

const WEEKDAY_ABBREVIATIONS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const COLUMNS_PER_ROW = 42; // 6 weeks × 7 days

function LinearCalendarContent({
  initialYear = new Date().getFullYear(),
  className,
  enableSync = true,
}: LinearCalendarWithSyncProps) {
  const [year, setYear] = React.useState(initialYear);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [selectedDetailDate, setSelectedDetailDate] = React.useState<Date | null>(null);

  // Use synced calendar hook with all the sync features
  const {
    events,
    filters,
    selectedDate,
    selectedRange,
    hoveredDate,
    isSelecting,
    viewMode,
    showEventModal,
    showReflectionModal,
    currentEvent,
    showConflictModal,
    currentConflict,
    syncStatus,
    providers,
    syncQueue,
    conflicts,
    handleDateSelect,
    handleRangeSelect,
    handleEventSave,
    handleEventDelete,
    handleFilterChange,
    setShowEventModal,
    setShowReflectionModal,
    setCurrentEvent,
    startSelection,
    updateSelection,
    endSelection,
    triggerSync,
    setShowConflictModal,
    handleConflictResolved,
    resolveConflict,
  } = useSyncedCalendar(year);

  // Setup notifications
  const { notifyInfo, syncStatus: notificationStatus } = useCalendarNotifications({
    enableSyncNotifications: enableSync,
    enableErrorNotifications: true,
    enableConflictNotifications: true,
  });

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(Math.max(0.5, Math.min(2, newZoom)));
  };

  const handleSyncAll = React.useCallback(async () => {
    await triggerSync();
    notifyInfo('Syncing all calendars...');
  }, [triggerSync, notifyInfo]);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (
        isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
        isSameDay(date, eventStart) ||
        isSameDay(date, eventEnd)
      );
    });
  };

  const renderDay = (date: Date, monthIndex: number) => {
    const dayEvents = getEventsForDate(date);
    const isCurrentMonth = date.getMonth() === monthIndex;
    const hasEvents = dayEvents.length > 0;
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isInRange = selectedRange && isWithinInterval(date, selectedRange);
    const isHovered = hoveredDate && isSameDay(date, hoveredDate);
    const hasSyncConflict = dayEvents.some((e) => e.syncStatus === 'conflict');
    const hasPendingSync = dayEvents.some((e) => e.syncStatus === 'pending');

    return (
      <div
        key={date.toString()}
        className={cn(
          'aspect-square relative group cursor-pointer transition-all duration-200',
          'border border-border',
          'hover:bg-accent/10 hover:shadow-sm hover:z-10',
          !isCurrentMonth && 'opacity-40',
          isToday(date) && 'ring-2 ring-primary ring-offset-1',
          isSelected && 'bg-primary/10 ring-2 ring-primary',
          isInRange && 'bg-primary/5',
          isHovered && 'bg-accent/10',
          hasEvents && 'font-semibold'
        )}
        style={{
          width: `${24 * zoomLevel}px`,
          height: `${24 * zoomLevel}px`,
        }}
        onClick={() => handleDateSelect(date)}
        onMouseDown={() => startSelection(date)}
        onMouseEnter={() => updateSelection(date)}
        onMouseUp={() => endSelection(date)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full flex flex-col items-center justify-center p-0.5">
                <span
                  className={cn('text-xs leading-none', isToday(date) && 'font-bold text-primary')}
                >
                  {date.getDate()}
                </span>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          event.category === 'personal' && 'bg-primary',
                          event.category === 'work' && 'bg-secondary',
                          event.category === 'effort' && 'bg-accent',
                          event.category === 'note' && 'bg-muted'
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Sync status indicators */}
                {enableSync && (hasSyncConflict || hasPendingSync) && (
                  <div className="absolute top-0 right-0 p-0.5">
                    {hasSyncConflict && <EventSyncIndicator status="conflict" size="xs" />}
                    {hasPendingSync && !hasSyncConflict && (
                      <EventSyncIndicator status="pending" size="xs" />
                    )}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{format(date, 'MMMM d, yyyy')}</p>
                {dayEvents.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {dayEvents.slice(0, 5).map((event, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-1">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              event.category === 'personal' && 'bg-primary',
                              event.category === 'work' && 'bg-secondary',
                              event.category === 'effort' && 'bg-accent',
                              event.category === 'note' && 'bg-muted'
                            )}
                          />
                          <span className="truncate max-w-[150px]">{event.title}</span>
                          {enableSync && event.syncStatus && (
                            <EventSyncIndicator
                              status={event.syncStatus}
                              provider={event.providerId}
                              size="xs"
                            />
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{dayEvents.length - 5} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const renderMonth = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = getDaysInMonth(firstDay);
    const startingDayOfWeek = getDay(firstDay);
    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, monthIndex, day));
    }

    // Fill remaining cells to complete the grid
    while (days.length < COLUMNS_PER_ROW) {
      days.push(null);
    }

    return (
      <div key={monthIndex} className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{MONTH_NAMES[monthIndex]}</h3>
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday headers */}
          {WEEKDAY_ABBREVIATIONS.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-muted-foreground text-center pb-1"
              style={{ width: `${24 * zoomLevel}px` }}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) =>
            date ? (
              renderDay(date, monthIndex)
            ) : (
              <div
                key={`empty-${index}`}
                style={{
                  width: `${24 * zoomLevel}px`,
                  height: `${24 * zoomLevel}px`,
                }}
              />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('p-4 max-w-7xl mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => handleYearChange(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{year}</h2>
          <Button variant="outline" size="icon" onClick={() => handleYearChange(year + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Sync Status */}
          {enableSync && providers && providers.length > 0 && (
            <div className="flex items-center gap-2">
              {syncStatus.isSyncing ? (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Cloud className="h-3 w-3" />
                  {providers.length} connected
                </Badge>
              )}

              {conflicts && conflicts.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  {conflicts.length} conflicts
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSyncAll}
                disabled={syncStatus.isSyncing}
              >
                <RefreshCw className={cn('h-4 w-4', syncStatus.isSyncing && 'animate-spin')} />
              </Button>
            </div>
          )}

          <FilterPanel
            filters={filters}
            viewOptions={{
              showWeekends: true,
              showToday: true,
              compactMode: viewMode === 'compact',
            }}
            onFilterChange={handleFilterChange}
            onClose={() => {}}
          />
          <ZoomControls zoomLevel={zoomLevel} onZoomChange={handleZoomChange} />
        </div>
      </div>

      {/* Sync Status Bar */}
      {enableSync && syncQueue && (syncQueue.pending > 0 || syncQueue.processing > 0) && (
        <SyncStatusBar
          isSyncing={syncStatus.isSyncing}
          lastSync={syncStatus.lastSync}
          provider={providers?.[0]?.provider}
          pendingCount={syncQueue.pending}
          errorCount={syncQueue.failed}
          className="mb-4"
        />
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setCurrentEvent(null);
          }}
          onSave={handleEventSave}
          onDelete={currentEvent?.id ? () => handleEventDelete(currentEvent.id) : undefined}
          selectedDate={selectedDate}
          selectedRange={selectedRange}
          event={currentEvent}
        />
      )}

      {/* Reflection Modal */}
      {showReflectionModal && selectedDate && (
        <ReflectionModal
          isOpen={showReflectionModal}
          onClose={() => setShowReflectionModal(false)}
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
        />
      )}

      {/* Conflict Resolution Modal */}
      {enableSync && showConflictModal && currentConflict && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          conflictId={currentConflict._id}
          localEvent={currentConflict.localEvent}
          remoteEvent={currentConflict.remoteEvent}
          baseEvent={currentConflict.baseEvent}
          providerId={currentConflict.providerId}
          onResolved={handleConflictResolved}
        />
      )}

      {/* Day Detail View */}
      {selectedDetailDate && (
        <DayDetailView
          date={selectedDetailDate}
          events={getEventsForDate(selectedDetailDate)}
          onClose={() => setSelectedDetailDate(null)}
          onEventEdit={(event) => {
            setCurrentEvent(event);
            setShowEventModal(true);
          }}
          onEventDelete={handleEventDelete}
        />
      )}
    </div>
  );
}

export function LinearCalendarWithSync(props: LinearCalendarWithSyncProps) {
  return (
    <CalendarErrorBoundary>
      <LinearCalendarContent {...props} />
    </CalendarErrorBoundary>
  );
}
