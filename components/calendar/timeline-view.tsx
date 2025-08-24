import type { CalendarEvent } from "@/components/ui/calendar"
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns"

interface TimelineViewProps {
  year: number
  events: CalendarEvent[]
  onEventsChange: (events: CalendarEvent[]) => void
}

export function TimelineView({ year, events, onEventsChange }: TimelineViewProps) {
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timeline View</h1>
          <p className="text-gray-600">Vertical timeline of your {year} events</p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {months.map((month, index) => {
            const monthEvents = events.filter(
              (event) => event.startDate.getMonth() === month.getMonth() && event.startDate.getFullYear() === year,
            )

            return (
              <div key={index} className="relative mb-12">
                {/* Month marker */}
                <div className="flex items-center mb-6">
                  <div className="w-4 h-4 bg-gray-900 rounded-full relative z-10"></div>
                  <h2 className="ml-6 text-xl font-semibold text-gray-900">{format(month, "MMMM yyyy")}</h2>
                </div>

                {/* Month events */}
                <div className="ml-10 space-y-4">
                  {monthEvents.length === 0 ? (
                    <p className="text-gray-500 italic">No events this month</p>
                  ) : (
                    monthEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-sm text-gray-600">
                              {format(event.startDate, "MMM d")} - {format(event.endDate, "MMM d, yyyy")}
                            </p>
                            {event.description && <p className="text-sm text-gray-500 mt-2">{event.description}</p>}
                          </div>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
