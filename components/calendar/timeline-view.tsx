import type { Event } from '@/types/calendar';
import { eachMonthOfInterval, endOfYear, format, startOfYear } from 'date-fns';

interface TimelineViewProps {
  year: number;
  events: Event[];
  onEventsChange: (events: Event[]) => void;
}

export function TimelineView({ year, events, onEventsChange }: TimelineViewProps) {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="min-h-screen bg-background p-6" data-testid="timeline-container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Timeline View</h1>
          <p className="text-muted-foreground">Vertical timeline of your {year} events</p>
        </div>

        <div className="relative">
          {/* Vertical spine */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

          {months.map((month, index) => {
            const monthEvents = events.filter(
              (event) =>
                event.startDate.getMonth() === month.getMonth() &&
                event.startDate.getFullYear() === year
            );

            return (
              <div key={index} className="relative mb-12">
                {/* Month marker */}
                <div className="flex items-center mb-6">
                  <div className="w-3.5 h-3.5 bg-foreground rounded-full relative z-10" />
                  <h2 className="ml-6 text-xl font-semibold text-foreground">
                    {format(month, 'MMMM yyyy')}
                  </h2>
                </div>

                {/* Month events */}
                <div className="ml-10 space-y-4">
                  {monthEvents.length === 0 ? (
                    <p className="text-muted-foreground italic">No events this month</p>
                  ) : (
                    monthEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-card rounded-lg p-4 shadow-sm border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground mb-1">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(event.startDate, 'MMM d')} -{' '}
                              {format(event.endDate, 'MMM d, yyyy')}
                            </p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
