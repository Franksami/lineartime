'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { VirtualCalendar } from '@/components/calendar/VirtualCalendar'
import { IntervalTree } from '@/lib/data-structures/IntervalTree'
import type { Event } from '@/types/calendar'
import { Button } from '@/components/ui/button'

// Generate test events
function generateTestEvents(count: number, year: number): Event[] {
  const events: Event[] = []
  const categories: Event['category'][] = ['personal', 'work', 'effort', 'note']
  
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 28) + 1
    const duration = Math.floor(Math.random() * 5) + 1
    
    const startDate = new Date(year, month, day)
    const endDate = new Date(year, month, day + duration)
    
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

export default function TestVirtualCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [eventCount, setEventCount] = useState(10000)
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    fps: 0,
    memoryUsage: 0,
    conflictCheckTime: 0,
    conflictCount: 0
  })
  
  const currentYear = new Date().getFullYear()
  
  // Generate events and measure performance
  const loadEvents = () => {
    setIsLoading(true)
    const startTime = performance.now()
    
    // Generate events
    const newEvents = generateTestEvents(eventCount, currentYear)
    
    // Test IntervalTree performance
    const tree = new IntervalTree()
    const treeStartTime = performance.now()
    
    newEvents.forEach(event => tree.insert(event))
    
    // Find conflicts for a sample event
    const sampleEvent = newEvents[0]
    const conflicts = tree.findConflicts(sampleEvent)
    
    const treeEndTime = performance.now()
    
    // Calculate metrics
    const renderTime = performance.now() - startTime
    const conflictCheckTime = treeEndTime - treeStartTime
    
    // Estimate memory usage if available
    let memoryUsage = 0
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576 // Convert to MB
    }
    
    setMetrics({
      renderTime,
      fps: 0, // Will be measured during scroll
      memoryUsage,
      conflictCheckTime,
      conflictCount: conflicts.length
    })
    
    setEvents(newEvents)
    setIsLoading(false)
  }
  
  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])
  
  // Monitor FPS during scroll
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
    
    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(measureFPS)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
  
  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Performance Dashboard */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            Virtual Calendar Performance Test
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Memory</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.memoryUsage < 100 ? 'text-green-600' : 
                metrics.memoryUsage < 200 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.memoryUsage.toFixed(0)}MB
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Tree Time</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.conflictCheckTime < 50 ? 'text-green-600' : 
                metrics.conflictCheckTime < 100 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.conflictCheckTime.toFixed(0)}ms
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={eventCount}
              onChange={(e) => setEventCount(parseInt(e.target.value) || 0)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              placeholder="Number of events"
            />
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
          
          {/* Performance Targets */}
          <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">Target Metrics:</span>
            <span className="ml-2">Render: &lt;500ms</span>
            <span className="ml-2">•</span>
            <span className="ml-2">FPS: 60</span>
            <span className="ml-2">•</span>
            <span className="ml-2">Memory: &lt;100MB</span>
            <span className="ml-2">•</span>
            <span className="ml-2">Conflict Check: &lt;50ms</span>
          </div>
        </div>
      </div>
      
      {/* Virtual Calendar */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-neutral-600 dark:text-neutral-400">
              Generating {eventCount.toLocaleString()} events...
            </div>
          </div>
        ) : (
          <VirtualCalendar
            year={currentYear}
            events={events}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onEventClick={(event) => console.log('Event clicked:', event)}
          />
        )}
      </div>
    </div>
  )
}