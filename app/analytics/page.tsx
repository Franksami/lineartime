'use client'

import React, { useState, useEffect } from 'react'
import { AnalyticsDashboard } from '@/components/calendar/analytics-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, TrendingUp, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Event } from '@/types/calendar'

// Mock events for demonstration - in real app, this would come from your database
const generateMockEvents = (year: number): Event[] => {
  const events: Event[] = []
  const categories = ['personal', 'work', 'effort', 'note'] as const
  const priorities = ['critical', 'high', 'medium', 'low', 'optional'] as const
  
  // Generate events throughout the year
  for (let month = 0; month < 12; month++) {
    const eventsInMonth = Math.floor(Math.random() * 15) + 5 // 5-20 events per month
    
    for (let i = 0; i < eventsInMonth; i++) {
      const day = Math.floor(Math.random() * 28) + 1
      const hour = Math.floor(Math.random() * 16) + 8 // 8 AM to 11 PM
      const duration = [30, 60, 90, 120, 180][Math.floor(Math.random() * 5)]
      
      const startDate = new Date(year, month, day, hour, 0)
      const endDate = new Date(startDate.getTime() + duration * 60000)
      
      events.push({
        id: `event-${month}-${i}`,
        title: `Event ${month + 1}.${i + 1}`,
        startDate,
        endDate,
        category: categories[Math.floor(Math.random() * categories.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
        description: `Sample event for analytics demonstration`,
        color: '#3b82f6'
      })
    }
  }
  
  return events
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, you'd fetch events from your database
    // For now, we'll generate mock data
    const mockEvents = generateMockEvents(selectedYear)
    setEvents(mockEvents)
    setIsLoading(false)
  }, [selectedYear])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">Calendar Analytics</h1>
              </div>
            </div>
            
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                {selectedYear - 1}
              </Button>
              <Button variant="default" size="sm">
                {selectedYear}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
              >
                {selectedYear + 1}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard 
        events={events as any} 
        year={selectedYear} 
      />
      
      {/* Quick Actions */}
      <div className="container mx-auto px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Jump to different views and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="justify-start h-auto p-4"
              >
                <div className="text-left">
                  <div className="font-medium">Calendar View</div>
                  <div className="text-sm text-muted-foreground">Back to main calendar</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/test-enhanced-calendar')}
                className="justify-start h-auto p-4"
              >
                <div className="text-left">
                  <div className="font-medium">Enhanced Features</div>
                  <div className="text-sm text-muted-foreground">Test new capabilities</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/settings')}
                className="justify-start h-auto p-4"
              >
                <div className="text-left">
                  <div className="font-medium">Settings</div>
                  <div className="text-sm text-muted-foreground">Customize your experience</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
