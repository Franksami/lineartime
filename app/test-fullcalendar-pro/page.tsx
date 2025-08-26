'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { LinearCalendarPro } from '@/components/calendar/LinearCalendarPro'
import { EnhancedCalendarToolbar, CalendarView, CalendarFilter } from '@/components/calendar/EnhancedCalendarToolbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Event } from '@/types/calendar'
import { addDays, addMonths, addWeeks, startOfYear, format } from 'date-fns'
import { Activity, Zap, Target, AlertTriangle, CheckCircle } from 'lucide-react'

const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 50,   // < 50ms render time
  GOOD: 100,       // < 100ms render time
  WARNING: 200,    // < 200ms render time
  POOR: 500        // < 500ms render time
}

// Generate test events with different patterns
function generateTestEvents(count: number, year: number): Event[] {
  const events: Event[] = []
  const yearStart = startOfYear(new Date(year, 0, 1))
  const categories = ['personal', 'work', 'effort', 'note'] as const
  const priorities = ['low', 'medium', 'high', 'urgent'] as const
  
  console.log(`Generating ${count} test events for ${year}...`)
  
  for (let i = 0; i < count; i++) {
    // Create different event patterns
    const pattern = i % 4
    let startDate: Date
    let endDate: Date
    let title: string
    
    switch (pattern) {
      case 0: // Single day events
        startDate = addDays(yearStart, Math.floor(Math.random() * 365))
        endDate = startDate
        title = `Single Event ${i + 1}`
        break
      case 1: // Multi-day events (2-7 days)
        startDate = addDays(yearStart, Math.floor(Math.random() * 360))
        endDate = addDays(startDate, Math.floor(Math.random() * 6) + 1)
        title = `Multi-day Event ${i + 1}`
        break
      case 2: // Weekly recurring pattern
        const weekOffset = Math.floor(i / 4) * 7
        startDate = addDays(yearStart, weekOffset % 365)
        endDate = startDate
        title = `Weekly Pattern ${i + 1}`
        break
      case 3: // Monthly milestones
        const monthOffset = Math.floor(i / 12)
        startDate = addMonths(yearStart, monthOffset % 12)
        endDate = addDays(startDate, 2)
        title = `Milestone ${i + 1}`
        break
      default:
        startDate = addDays(yearStart, Math.floor(Math.random() * 365))
        endDate = startDate
        title = `Event ${i + 1}`
    }
    
    events.push({
      id: `test-event-${i}`,
      title,
      startDate,
      endDate,
      category: categories[i % categories.length],
      priority: priorities[i % priorities.length],
      description: `Generated test event #${i + 1} with ${pattern === 1 ? 'multi-day' : 'single-day'} duration`,
      allDay: true,
      tags: [`tag-${i % 5}`, `category-${categories[i % categories.length]}`],
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  console.log(`Generated ${events.length} events successfully`)
  return events
}

export default function FullCalendarProTestPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<CalendarView>('linearYear')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventCount, setEventCount] = useState(1000)
  const [events, setEvents] = useState<Event[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    eventProcessingTime: 0
  })
  const [overlappingEventCount, setOverlappingEventCount] = useState(0)
  const [collisionDetectionEnabled, setCollisionDetectionEnabled] = useState(true)
  const [virtualRenderingEnabled, setVirtualRenderingEnabled] = useState(true)
  const [filters, setFilters] = useState<CalendarFilter>({
    categories: [],
    priorities: [],
    tags: [],
    searchQuery: '',
    showOverlapping: true,
    showConflicts: true
  })
  
  // Performance tracking
  const [renderStartTime, setRenderStartTime] = useState<number>(0)
  
  // Generate events with progress tracking
  const generateEvents = useCallback(async (count: number) => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    const startTime = performance.now()
    
    // Simulate progressive generation for better UX
    const batchSize = 100
    const batches = Math.ceil(count / batchSize)
    let allEvents: Event[] = []
    
    for (let batch = 0; batch < batches; batch++) {
      const batchCount = Math.min(batchSize, count - (batch * batchSize))
      const batchEvents = generateTestEvents(batchCount, currentYear)
      
      // Add batch offset to avoid duplicate IDs
      const offsetEvents = batchEvents.map((event, index) => ({
        ...event,
        id: `batch-${batch}-${event.id}-${index}`
      }))
      
      allEvents = [...allEvents, ...offsetEvents]
      
      const progress = ((batch + 1) / batches) * 100
      setGenerationProgress(progress)
      
      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    const endTime = performance.now()
    const processingTime = endTime - startTime
    
    setEvents(allEvents)
    setPerformanceMetrics(prev => ({
      ...prev,
      eventProcessingTime: processingTime
    }))
    
    console.log(`Generated ${allEvents.length} events in ${processingTime.toFixed(2)}ms`)
    
    // Calculate overlapping events
    const overlaps = detectOverlappingEvents(allEvents)
    setOverlappingEventCount(overlaps.length)
    
    setIsGenerating(false)
    setGenerationProgress(100)
  }, [currentYear])
  
  // Detect overlapping events
  const detectOverlappingEvents = useCallback((eventList: Event[]) => {
    const overlapping: Event[] = []
    
    for (let i = 0; i < eventList.length; i++) {
      for (let j = i + 1; j < eventList.length; j++) {
        const event1 = eventList[i]
        const event2 = eventList[j]
        
        const start1 = new Date(event1.startDate)
        const end1 = new Date(event1.endDate)
        const start2 = new Date(event2.startDate)
        const end2 = new Date(event2.endDate)
        
        if (start1 <= end2 && start2 <= end1) {
          if (!overlapping.find(e => e.id === event1.id)) {
            overlapping.push(event1)
          }
          if (!overlapping.find(e => e.id === event2.id)) {
            overlapping.push(event2)
          }
        }
      }
    }
    
    return overlapping
  }, [])
  
  // Performance monitoring
  useEffect(() => {
    if (events.length > 0) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'linear-year-render') {
            setPerformanceMetrics(prev => ({
              ...prev,
              renderTime: entry.duration
            }))
          }
        })
      })
      
      observer.observe({ entryTypes: ['measure'] })
      
      return () => observer.disconnect()
    }
  }, [events])
  
  // Memory usage monitoring
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }))
      }
    }
    
    checkMemoryUsage()
    const interval = setInterval(checkMemoryUsage, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Event handlers
  const handleEventCreate = useCallback((event: Partial<Event>) => {
    const newEvent: Event = {
      id: `created-${Date.now()}`,
      title: event.title || 'New Event',
      startDate: event.startDate || new Date(),
      endDate: event.endDate || new Date(),
      category: event.category || 'personal',
      priority: 'medium',
      allDay: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...event
    }
    
    setEvents(prev => [...prev, newEvent])
    console.log('Event created:', newEvent)
  }, [])
  
  const handleEventUpdate = useCallback((event: Event) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e))
    console.log('Event updated:', event)
  }, [])
  
  const handleEventDelete = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    console.log('Event deleted:', id)
  }, [])
  
  const handleDateNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    switch (direction) {
      case 'prev':
        setCurrentYear(prev => prev - 1)
        setCurrentDate(new Date(currentYear - 1, 0, 1))
        break
      case 'next':
        setCurrentYear(prev => prev + 1)
        setCurrentDate(new Date(currentYear + 1, 0, 1))
        break
      case 'today':
        const today = new Date()
        setCurrentYear(today.getFullYear())
        setCurrentDate(today)
        break
    }
  }, [currentYear])
  
  // Performance assessment
  const getPerformanceLevel = useCallback((renderTime: number) => {
    if (renderTime < PERFORMANCE_THRESHOLDS.EXCELLENT) return { level: 'excellent', color: 'text-green-600' }
    if (renderTime < PERFORMANCE_THRESHOLDS.GOOD) return { level: 'good', color: 'text-blue-600' }
    if (renderTime < PERFORMANCE_THRESHOLDS.WARNING) return { level: 'warning', color: 'text-yellow-600' }
    if (renderTime < PERFORMANCE_THRESHOLDS.POOR) return { level: 'poor', color: 'text-orange-600' }
    return { level: 'critical', color: 'text-red-600' }
  }, [])
  
  const performanceLevel = getPerformanceLevel(performanceMetrics.renderTime)
  
  // Auto-generate events on mount
  useEffect(() => {
    generateEvents(eventCount)
  }, []) // Only run on mount
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                FullCalendar Pro Integration Test
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Performance testing with {events.length.toLocaleString()} events
              </p>
            </div>
            
            {/* Performance indicator */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${performanceLevel.color}`}>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {performanceMetrics.renderTime.toFixed(1)}ms
                </span>
                <Badge variant={performanceLevel.level === 'excellent' ? 'default' : 'secondary'}>
                  {performanceLevel.level}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Controls */}
      <div className="container mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Event Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Event Generation
              </CardTitle>
              <CardDescription>
                Generate test events with different patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={eventCount}
                    onChange={(e) => setEventCount(parseInt(e.target.value) || 1000)}
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                    min="100"
                    max="10000"
                    step="100"
                  />
                  <Button
                    onClick={() => generateEvents(eventCount)}
                    disabled={isGenerating}
                    size="sm"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
                
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(generationProgress)}% complete
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Performance
              </CardTitle>
              <CardDescription>
                Real-time rendering metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Render Time:</span>
                  <span className={performanceLevel.color}>
                    {performanceMetrics.renderTime.toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing:</span>
                  <span>{performanceMetrics.eventProcessingTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory:</span>
                  <span>{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Events:</span>
                  <span>{events.length.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Collision Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Conflicts
              </CardTitle>
              <CardDescription>
                Event overlap detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Detection:</span>
                  <Badge variant={collisionDetectionEnabled ? 'default' : 'outline'}>
                    {collisionDetectionEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conflicts:</span>
                  <Badge variant={overlappingEventCount > 0 ? 'destructive' : 'secondary'}>
                    {overlappingEventCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Virtual:</span>
                  <Badge variant={virtualRenderingEnabled ? 'default' : 'outline'}>
                    {virtualRenderingEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Status
              </CardTitle>
              <CardDescription>
                Integration health check
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {performanceLevel.level === 'excellent' || performanceLevel.level === 'good'
                      ? 'Performance is optimal'
                      : performanceLevel.level === 'warning'
                      ? 'Performance needs attention'
                      : 'Performance is poor'
                    }
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Calendar Toolbar */}
      <EnhancedCalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onDateNavigation={handleDateNavigation}
        onEventCreate={() => handleEventCreate({ title: 'New Test Event' })}
        filters={filters}
        onFiltersChange={setFilters}
        eventCount={events.length}
        isLoading={isGenerating}
        enableProFeatures={true}
        onCollisionDetectionToggle={setCollisionDetectionEnabled}
        onVirtualRenderingToggle={setVirtualRenderingEnabled}
        overlappingEventCount={overlappingEventCount}
        performanceMetrics={performanceMetrics}
      />
      
      {/* Main Calendar */}
      <div className="h-[calc(100vh-300px)] bg-background">
        <LinearCalendarPro
          year={currentYear}
          events={events}
          view={view}
          onEventClick={(event) => console.log('Event clicked:', event)}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onDateSelect={(date) => console.log('Date selected:', date)}
          enableInfiniteCanvas={true}
          enableVirtualRendering={virtualRenderingEnabled}
          enableCollisionDetection={collisionDetectionEnabled}
          enableAdvancedDragDrop={true}
          maxEvents={10000}
          eventRenderMode="virtual"
          onViewChange={(newView) => {
            console.log('View changed to:', newView)
            setView(newView as CalendarView)
          }}
          onDateRangeChange={(start, end) => {
            console.log('Date range changed:', start, end)
          }}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}