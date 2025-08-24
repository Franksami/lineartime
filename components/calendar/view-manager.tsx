"use client"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, Settings, Grid3X3 } from "lucide-react"

export type CalendarView = "year" | "timeline" | "manage" | "analytics"

interface ViewManagerProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
}

export function ViewManager({ currentView, onViewChange }: ViewManagerProps) {
  const views = [
    { id: "year" as CalendarView, label: "Year View", icon: Calendar, description: "Full year horizontal timeline" },
    { id: "timeline" as CalendarView, label: "Timeline", icon: BarChart3, description: "Vertical timeline view" },
    { id: "manage" as CalendarView, label: "Manage", icon: Settings, description: "Event management" },
    { id: "analytics" as CalendarView, label: "Analytics", icon: Grid3X3, description: "Calendar insights" },
  ]

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-2 py-2 shadow-lg">
        <div className="flex items-center gap-1">
          {views.map((view) => {
            const Icon = view.icon
            const isActive = currentView === view.id

            return (
              <Button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`
                  rounded-full px-4 py-2 transition-all duration-200
                  ${
                    isActive
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
                title={view.description}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
