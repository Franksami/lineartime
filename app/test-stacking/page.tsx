'use client'

import React, { useState, useEffect } from 'react'
import { useCalendarWorker } from '@/lib/workers/useWorker'
import type { Event } from '@/types/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Generate test events with various overlapping scenarios
function generateTestEvents(): Event[] {
  const events: Event[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Scenario 1: Simple non-overlapping events
  events.push({
    id: 'event-1',
    title: 'Morning Meeting',
    startDate: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
    endDate: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
    category: 'work',
    description: 'Daily standup'
  })
  
  events.push({
    id: 'event-2',
    title: 'Lunch Break',
    startDate: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
    endDate: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
    category: 'personal',
    description: 'Lunch'
  })
  
  // Scenario 2: Overlapping events (should be in different columns)
  events.push({
    id: 'event-3',
    title: 'Project Review',
    startDate: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
    endDate: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4 PM
    category: 'work',
    description: 'Quarterly review'
  })
  
  events.push({
    id: 'event-4',
    title: 'Team Sync',
    startDate: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM
    endDate: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM
    category: 'work',
    description: 'Team alignment'
  })
  
  events.push({
    id: 'event-5',
    title: 'Client Call',
    startDate: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 3:30 PM
    endDate: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM
    category: 'work',
    description: 'Client update'
  })
  
  // Scenario 3: Complex overlapping group
  events.push({
    id: 'event-6',
    title: 'All Day Event',
    startDate: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
    endDate: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
    category: 'note',
    description: 'Background task'
  })
  
  return events
}

// Generate many events for stress testing
function generateStressTestEvents(count: number): Event[] {
  const events: Event[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const categories: Event['category'][] = ['personal', 'work', 'effort', 'note']
  
  for (let i = 0; i < count; i++) {
    const startHour = 8 + Math.random() * 10 // 8 AM to 6 PM
    const duration = 0.5 + Math.random() * 3 // 30 min to 3.5 hours
    
    events.push({
      id: `stress-event-${i}`,
      title: `Event ${i + 1}`,
      startDate: new Date(today.getTime() + startHour * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + (startHour + duration) * 60 * 60 * 1000),
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Test event ${i + 1}`
    })
  }
  
  return events
}

export default function TestStackingPage() {
  const worker = useCalendarWorker()
  const [events, setEvents] = useState<Event[]>([])
  const [layoutedEvents, setLayoutedEvents] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [testMode, setTestMode] = useState<'simple' | 'stress'>('simple')
  const [eventCount, setEventCount] = useState(20)
  const [metrics, setMetrics] = useState({
    layoutTime: 0,
    eventCount: 0,
    collisionGroups: 0,
    maxColumns: 0
  })
  
  // Load initial test events
  useEffect(() => {
    const testEvents = testMode === 'simple' 
      ? generateTestEvents()
      : generateStressTestEvents(eventCount)
    setEvents(testEvents)
  }, [testMode, eventCount])
  
  // Test the new column-based layout
  const testColumnLayout = async () => {
    if (!worker.isReady || processing || events.length === 0) return
    
    setProcessing(true)
    const startTime = performance.now()
    
    try {
      // Use the new V2 layout method with column-based algorithm
      const result = await worker.layoutEventsV2(events, 600)
      const layoutTime = performance.now() - startTime
      
      // Calculate metrics
      const groups = new Set(result.map((e: any) => e.collisionGroup))
      const maxCols = Math.max(...result.map((e: any) => e.column + 1))
      
      setMetrics({
        layoutTime,
        eventCount: result.length,
        collisionGroups: groups.size,
        maxColumns: maxCols
      })
      
      setLayoutedEvents(result)
      
      console.log('Column-based layout results:', {
        events: result.length,
        groups: groups.size,
        maxColumns: maxCols,
        time: layoutTime.toFixed(2) + 'ms'
      })
      console.log('Layouted events:', result)
    } catch (error) {
      console.error('Layout test failed:', error)
    } finally {
      setProcessing(false)
    }
  }
  
  // Color map for categories
  const categoryColors = {
    personal: '#10b981',
    work: '#3b82f6',
    effort: '#f97316',
    note: '#a855f7'
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
          Column-Based Event Stacking Test
        </h1>
        
        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-1">
                  Test Mode
                </label>
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value as 'simple' | 'stress')}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
                >
                  <option value="simple">Simple (6 events)</option>
                  <option value="stress">Stress Test</option>
                </select>
              </div>
              
              {testMode === 'stress' && (
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-1">
                    Event Count
                  </label>
                  <input
                    type="number"
                    value={eventCount}
                    onChange={(e) => setEventCount(parseInt(e.target.value) || 20)}
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
                    min="10"
                    max="100"
                  />
                </div>
              )}
              
              <div className="flex items-end">
                <Button
                  onClick={testColumnLayout}
                  disabled={!worker.isReady || processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {processing ? 'Processing...' : 'Test Column Layout'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Layout Time</div>
                <div className={`text-xl font-mono font-bold ${
                  metrics.layoutTime < 50 ? 'text-green-600' : 
                  metrics.layoutTime < 100 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.layoutTime.toFixed(1)}ms
                </div>
              </div>
              
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Events</div>
                <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {metrics.eventCount}
                </div>
              </div>
              
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Collision Groups</div>
                <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {metrics.collisionGroups}
                </div>
              </div>
              
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Max Columns</div>
                <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {metrics.maxColumns}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Visual Layout Preview */}
        {layoutedEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Visual Layout (Column-Based Stacking)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-white dark:bg-neutral-900 rounded-lg" style={{ height: '600px', width: '600px', overflow: 'hidden' }}>
                {/* Hour grid lines */}
                {Array.from({ length: 11 }, (_, i) => (
                  <div
                    key={`hour-${i}`}
                    className="absolute w-full border-t border-neutral-200 dark:border-neutral-700"
                    style={{ top: `${i * 60}px` }}
                  >
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 absolute -left-8">
                      {8 + i}:00
                    </span>
                  </div>
                ))}
                
                {/* Render layouted events */}
                {layoutedEvents.map((event: any) => {
                  const color = categoryColors[event.category as keyof typeof categoryColors] || '#6b7280'
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute rounded border border-white dark:border-neutral-900"
                      style={{
                        left: `${event.left}px`,
                        top: `${event.top}px`,
                        width: `${event.width}px`,
                        height: `${event.height}px`,
                        backgroundColor: color,
                        zIndex: event.zIndex,
                        opacity: 0.9
                      }}
                    >
                      <div className="p-1 text-white text-xs overflow-hidden">
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-xs opacity-80">
                          Col: {event.column} | Grp: {event.collisionGroup}
                        </div>
                        {event.expandedWidth && event.expandedWidth > 1 && (
                          <div className="text-xs opacity-80">
                            Expanded: {event.expandedWidth}x
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Algorithm Info */}
        <div className="mt-8 text-xs text-neutral-600 dark:text-neutral-400">
          <p className="font-semibold mb-2">Google Calendar's Column-Based Algorithm:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Sort events by start time, then end time</li>
            <li>Build collision groups (transitively overlapping events)</li>
            <li>Assign events to leftmost available column</li>
            <li>Calculate width as container_width / max_columns</li>
            <li>Expand rightmost events to use available space</li>
          </ol>
        </div>
      </div>
    </div>
  )
}