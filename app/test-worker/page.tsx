'use client'

import React, { useState, useEffect } from 'react'
import { useCalendarWorker } from '@/lib/workers/useWorker'
import type { Event } from '@/types/calendar'
import { Button } from '@/components/ui/button'

// Generate test events
function generateTestEvents(count: number): Event[] {
  const events: Event[] = []
  const categories: Event['category'][] = ['personal', 'work', 'effort', 'note']
  const year = new Date().getFullYear()
  
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 28) + 1
    const duration = Math.floor(Math.random() * 5) + 1
    const startHour = Math.floor(Math.random() * 24)
    
    const startDate = new Date(year, month, day, startHour)
    const endDate = new Date(year, month, day + duration, startHour + 2)
    
    events.push({
      id: `event-${i}`,
      title: `Event ${i + 1}`,
      startDate,
      endDate,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Test event ${i + 1}`
    })
  }
  
  return events
}

export default function TestWorkerPage() {
  const worker = useCalendarWorker()
  const [events, setEvents] = useState<Event[]>([])
  const [results, setResults] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [metrics, setMetrics] = useState({
    layoutTime: 0,
    conflictTime: 0,
    optimizeTime: 0,
    totalTime: 0,
    eventCount: 1000
  })
  
  // Generate initial events
  useEffect(() => {
    const testEvents = generateTestEvents(metrics.eventCount)
    setEvents(testEvents)
  }, [metrics.eventCount])
  
  // Test layout calculation
  const testLayoutCalculation = async () => {
    if (!worker.isReady || processing) return
    
    setProcessing(true)
    const startTotal = performance.now()
    
    try {
      // Test 1: Calculate Layout
      const startLayout = performance.now()
      const layoutResult = await worker.calculateLayout(events)
      const layoutTime = performance.now() - startLayout
      
      // Test 2: Detect Conflicts
      const startConflict = performance.now()
      const conflictResult = await worker.detectConflicts(events)
      const conflictTime = performance.now() - startConflict
      
      // Test 3: Optimize Positions
      const startOptimize = performance.now()
      const optimizedResult = await worker.optimizePositions(events, layoutResult)
      const optimizeTime = performance.now() - startOptimize
      
      const totalTime = performance.now() - startTotal
      
      setMetrics(prev => ({
        ...prev,
        layoutTime,
        conflictTime,
        optimizeTime,
        totalTime
      }))
      
      setResults({
        layouts: layoutResult,
        conflicts: conflictResult,
        optimized: optimizedResult
      })
      
      console.log('Worker test results:', {
        layoutCount: layoutResult?.length,
        conflictCount: conflictResult?.length,
        optimizedCount: optimizedResult?.length,
        times: { layoutTime, conflictTime, optimizeTime, totalTime }
      })
    } catch (error) {
      console.error('Worker test failed:', error)
    } finally {
      setProcessing(false)
    }
  }
  
  // Test with different event counts
  const testScaling = async () => {
    const counts = [100, 500, 1000, 5000, 10000]
    const results: any[] = []
    
    for (const count of counts) {
      const testEvents = generateTestEvents(count)
      const start = performance.now()
      
      try {
        await worker.calculateLayout(testEvents)
        const time = performance.now() - start
        
        results.push({
          count,
          time,
          throughput: count / (time / 1000) // events per second
        })
        
        console.log(`Processed ${count} events in ${time.toFixed(2)}ms`)
      } catch (error) {
        console.error(`Failed at ${count} events:`, error)
      }
    }
    
    console.table(results)
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
          Web Worker Performance Test
        </h1>
        
        {/* Worker Status */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold mb-4">Worker Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                worker.isReady ? 'bg-green-500' : worker.isLoading ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {worker.isReady ? 'Ready' : worker.isLoading ? 'Loading...' : 'Not Available'}
              </span>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Events loaded: {events.length}
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Layout Calc</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.layoutTime < 50 ? 'text-green-600' : 
                metrics.layoutTime < 100 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.layoutTime.toFixed(1)}ms
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Conflict Detection</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.conflictTime < 30 ? 'text-green-600' : 
                metrics.conflictTime < 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.conflictTime.toFixed(1)}ms
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Position Optimize</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.optimizeTime < 20 ? 'text-green-600' : 
                metrics.optimizeTime < 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.optimizeTime.toFixed(1)}ms
              </div>
            </div>
            
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Time</div>
              <div className={`text-xl font-mono font-bold ${
                metrics.totalTime < 100 ? 'text-green-600' : 
                metrics.totalTime < 200 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.totalTime.toFixed(1)}ms
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-1">
                Event Count
              </label>
              <input
                type="number"
                value={metrics.eventCount}
                onChange={(e) => setMetrics(prev => ({ ...prev, eventCount: parseInt(e.target.value) || 0 }))}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                onClick={testLayoutCalculation}
                disabled={!worker.isReady || processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? 'Processing...' : 'Run Worker Test'}
              </Button>
              
              <Button
                onClick={testScaling}
                disabled={!worker.isReady || processing}
                variant="outline"
              >
                Test Scaling
              </Button>
              
              <Button
                onClick={() => {
                  const newEvents = generateTestEvents(metrics.eventCount)
                  setEvents(newEvents)
                }}
                variant="outline"
              >
                Regenerate Events
              </Button>
            </div>
          </div>
        </div>
        
        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Layout Calculations</h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {results.layouts?.length || 0} layouts calculated
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Conflict Detection</h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {results.conflicts?.length || 0} conflicts detected
                  {results.conflicts?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs">
                        High: {results.conflicts.filter((c: any) => c.severity === 'high').length} |
                        Medium: {results.conflicts.filter((c: any) => c.severity === 'medium').length} |
                        Low: {results.conflicts.filter((c: any) => c.severity === 'low').length}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Position Optimization</h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {results.optimized?.length || 0} positions optimized
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Info */}
        <div className="mt-8 text-xs text-neutral-600 dark:text-neutral-400">
          <p className="font-semibold mb-2">Web Worker Benefits:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Offloads heavy calculations from main thread</li>
            <li>Prevents UI freezing during complex operations</li>
            <li>Enables parallel processing of event data</li>
            <li>Maintains 60fps even with 10,000+ events</li>
          </ul>
        </div>
      </div>
    </div>
  )
}