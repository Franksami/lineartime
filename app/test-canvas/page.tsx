'use client'

import React, { useState, useEffect } from 'react'
import { HybridCalendar } from '@/components/calendar/HybridCalendar'
import type { Event } from '@/types/calendar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Generate test events with overlaps
function generateTestEvents(count: number, year: number, withConflicts: boolean = false): Event[] {
  const events: Event[] = []
  const categories: Event['category'][] = ['personal', 'work', 'effort', 'note']
  
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 28) + 1
    const duration = Math.floor(Math.random() * 5) + 1
    
    // Create conflicts for testing
    const startHour = withConflicts && i % 3 === 0 ? 10 : Math.floor(Math.random() * 24)
    
    const startDate = new Date(year, month, day, startHour)
    const endDate = new Date(year, month, day + duration, startHour + 2)
    
    events.push({
      id: `event-${i}`,
      title: `Event ${i + 1}`,
      startDate,
      endDate,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Test event ${i + 1} with ${duration} days duration`
    })
  }
  
  return events
}

export default function TestCanvasCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [eventCount, setEventCount] = useState(1000)
  const [isLoading, setIsLoading] = useState(false)
  const [useCanvas, setUseCanvas] = useState(true)
  const [canvasThreshold, setCanvasThreshold] = useState(100)
  const [withConflicts, setWithConflicts] = useState(false)
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    fps: 0,
    memoryUsage: 0,
    renderMode: 'hybrid'
  })
  
  const currentYear = new Date().getFullYear()
  
  // Generate events and measure performance
  const loadEvents = () => {
    setIsLoading(true)
    const startTime = performance.now()
    
    // Generate events
    const newEvents = generateTestEvents(eventCount, currentYear, withConflicts)
    
    // Calculate metrics
    const renderTime = performance.now() - startTime
    
    // Estimate memory usage
    let memoryUsage = 0
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576
    }
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      memoryUsage,
      renderMode: useCanvas && eventCount > canvasThreshold ? 'canvas' : 'dom'
    }))
    
    setEvents(newEvents)
    setIsLoading(false)
  }
  
  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])
  
  // Monitor FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics(prev => ({ ...prev, fps }))
        frameCount = 0
        lastTime = currentTime
      }
      
      rafId = requestAnimationFrame(measureFPS)
    }
    
    rafId = requestAnimationFrame(measureFPS)
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
  
  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Control Panel */}
      <div className="sticky top-0 z-20 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            Canvas/Hybrid Calendar Test
          </h1>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Events</div>
              <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {events.length.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Render Time</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.renderTime < 500 ? 'text-green-600' : 
                metrics.renderTime < 1000 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.renderTime.toFixed(0)}ms
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">FPS</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.fps >= 60 ? 'text-green-600' : 
                metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.fps || '--'}
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Mode</div>
              <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {metrics.renderMode.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="event-count" className="text-sm mb-1">Event Count</Label>
              <input
                id="event-count"
                type="number"
                value={eventCount}
                onChange={(e) => setEventCount(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                placeholder="Number of events"
              />
            </div>
            
            <div>
              <Label htmlFor="canvas-threshold" className="text-sm mb-1">Canvas Threshold</Label>
              <input
                id="canvas-threshold"
                type="number"
                value={canvasThreshold}
                onChange={(e) => setCanvasThreshold(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                placeholder="Canvas threshold"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="use-canvas"
                checked={useCanvas}
                onCheckedChange={setUseCanvas}
              />
              <Label htmlFor="use-canvas">Use Canvas</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="with-conflicts"
                checked={withConflicts}
                onCheckedChange={setWithConflicts}
              />
              <Label htmlFor="with-conflicts">Add Conflicts</Label>
            </div>
            
            <Button 
              onClick={loadEvents} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Loading...' : 'Generate Events'}
            </Button>
            
            <Button 
              onClick={() => setEvents([])}
              variant="outline"
            >
              Clear
            </Button>
          </div>
          
          {/* Info */}
          <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">Canvas Mode:</span> Automatically enables for months with &gt;20 events
            <span className="ml-4 font-semibold">•</span>
            <span className="ml-2">DOM Mode:</span> Used for simpler months
            <span className="ml-4 font-semibold">•</span>
            <span className="ml-2">Hybrid:</span> Best of both worlds
          </div>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-neutral-600 dark:text-neutral-400">
              Generating {eventCount.toLocaleString()} events...
            </div>
          </div>
        ) : (
          <HybridCalendar
            year={currentYear}
            events={events}
            useCanvas={useCanvas}
            canvasThreshold={canvasThreshold}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onEventClick={(event) => console.log('Event clicked:', event)}
          />
        )}
      </div>
    </div>
  )
}