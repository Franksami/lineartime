"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, TrendingUp, Activity, Download, Filter } from "lucide-react"
import type { Event } from "@/types/calendar"

interface CalendarEvent extends Event {
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'optional'
  tags?: string[]
}

interface AnalyticsDashboardProps {
  events: CalendarEvent[]
  year: number
}

// Helper functions to replace date-fns functionality
const formatDate = (date: Date, formatStr: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  if (formatStr === "MMM") {
    return months[date.getMonth()]
  }
  return date.toLocaleDateString()
}

const getDifferenceInDays = (endDate: Date, startDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function AnalyticsDashboard({ events, year }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const totalEvents = events.length
    const totalDays = events.reduce((sum, event) => sum + getDifferenceInDays(event.endDate, event.startDate) + 1, 0)

    // Category breakdown
    const categoryStats = events.reduce(
      (acc, event) => {
        const category = event.category || "uncategorized"
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Priority breakdown
    const priorityStats = events.reduce(
      (acc, event) => {
        const priority = event.priority || "medium"
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Monthly distribution
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const month = i
      const monthEvents = events.filter((event) => event.startDate.getMonth() === month)
      return {
        month: formatDate(new Date(year, month, 1), "MMM"),
        events: monthEvents.length,
        days: monthEvents.reduce((sum, event) => sum + getDifferenceInDays(event.endDate, event.startDate) + 1, 0),
      }
    })

    return {
      totalEvents,
      totalDays,
      avgEventsPerMonth: Math.round(totalEvents / 12),
      categoryStats,
      priorityStats,
      monthlyStats,
      mostProductiveMonth: monthlyStats.reduce(
        (max, month) => (month.events > max.events ? month : max),
        monthlyStats[0],
      ),
      leastProductiveMonth: monthlyStats.reduce(
        (min, month) => (month.events < min.events ? month : min),
        monthlyStats[0],
      ),
    }
  }, [events, year])

  const categoryColors = {
    personal: "hsl(var(--chart-4))",
    work: "hsl(var(--chart-1))",
    effort: "hsl(var(--chart-3))",
    note: "hsl(var(--chart-5))",
    meeting: "hsl(var(--chart-2))",
    deadline: "hsl(var(--destructive))",
    milestone: "hsl(var(--chart-1))",
    uncategorized: "hsl(var(--muted-foreground))",
  }

  const priorityColors = {
    critical: "hsl(var(--destructive))",
    high: "hsl(var(--chart-3))",
    medium: "hsl(var(--chart-1))",
    low: "hsl(var(--chart-4))",
    optional: "hsl(var(--muted-foreground))",
  }

  const categoryData = Object.entries(analytics.categoryStats).map(([category, count]) => ({
    name: category,
    value: count,
    color: categoryColors[category as keyof typeof categoryColors] || categoryColors.uncategorized,
  }))

  const priorityData = Object.entries(analytics.priorityStats).map(([priority, count]) => ({
    name: priority,
    value: count,
    color: priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium,
  }))

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Calendar Analytics</h1>
            <p className="text-muted-foreground">Insights into your {year} calendar usage and productivity</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalEvents}</div>
              <p className="text-xs text-muted-foreground">{analytics.avgEventsPerMonth} avg per month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Days</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalDays}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((analytics.totalDays / 365) * 100)}% of year scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Productive</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.mostProductiveMonth.month}</div>
              <p className="text-xs text-muted-foreground">{analytics.mostProductiveMonth.events} events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((analytics.totalEvents / 365) * 100)}%
              </div>
              <Progress value={Math.round((analytics.totalEvents / 365) * 100)} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Event Distribution</CardTitle>
              <CardDescription>Events scheduled throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Categories</CardTitle>
              <CardDescription>Distribution by event type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg mb-4">
                <p className="text-muted-foreground">Chart visualization coming soon</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryData.map((category) => (
                  <Badge key={category.name} variant="outline" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name} ({category.value})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Events by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityData.map((priority) => {
                const percentage = Math.round((priority.value / analytics.totalEvents) * 100)
                return (
                  <div key={priority.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                        <span className="text-sm font-medium capitalize">{priority.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {priority.value} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>AI-powered insights from your calendar data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Peak Activity</h4>
                <p className="text-sm text-muted-foreground">
                  Your most active month was {analytics.mostProductiveMonth.month} with{" "}
                  {analytics.mostProductiveMonth.events} events scheduled.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Time Allocation</h4>
                <p className="text-sm text-muted-foreground">
                  You have {analytics.totalDays} days scheduled, representing{" "}
                  {Math.round((analytics.totalDays / 365) * 100)}% of your year.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Planning Consistency</h4>
                <p className="text-sm text-muted-foreground">
                  You average {analytics.avgEventsPerMonth} events per month, showing consistent planning habits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
