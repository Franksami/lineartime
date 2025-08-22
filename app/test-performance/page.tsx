'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { HybridCalendar } from "@/components/calendar/HybridCalendar";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { addDays, startOfYear, addHours } from 'date-fns';
import type { Event } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Zap, AlertCircle } from 'lucide-react';

export default function PerformanceTestPage() {
  const [eventCount, setEventCount] = useState(1000);
  const [renderMode, setRenderMode] = useState<'canvas' | 'dom'>('canvas');
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState<{
    renderTime: number;
    eventCount: number;
    memoryUsage: number;
  } | null>(null);
  
  const events = useMemo(() => {
    const generatedEvents: Event[] = [];
    const categories: Event['category'][] = ['personal', 'work', 'effort', 'note'];
    const startDate = startOfYear(new Date());
    
    for (let i = 0; i < eventCount; i++) {
      const dayOffset = Math.floor(Math.random() * 365);
      const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
      const start = addDays(startDate, dayOffset);
      const end = addDays(start, duration);
      
      generatedEvents.push({
        id: `test-${i}`,
        title: `Event ${i} - ${['Meeting', 'Task', 'Reminder', 'Appointment'][Math.floor(Math.random() * 4)]}`,
        startDate: start,
        endDate: end,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Test event ${i} description`,
        allDay: Math.random() > 0.5,
      });
    }
    
    return generatedEvents;
  }, [eventCount]);
  
  const handleGenerateEvents = (count: number) => {
    const startTime = performance.now();
    setIsGenerating(true);
    setEventCount(count);
    
    // Measure render time after React updates
    setTimeout(() => {
      const renderTime = performance.now() - startTime;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize / 1048576 || 0;
      
      setMetrics({
        renderTime,
        eventCount: count,
        memoryUsage
      });
      
      setIsGenerating(false);
      
      // Log performance results
      console.log(`Performance Test Results for ${count} events:`);
      console.log(`- Render Time: ${renderTime.toFixed(2)}ms`);
      console.log(`- Memory Usage: ${memoryUsage.toFixed(2)}MB`);
      console.log(`- Mode: ${renderMode}`);
    }, 100);
  };
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Performance Metrics Card */}
      {metrics && (
        <Card className="m-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Render Time</p>
                <p className={`text-2xl font-bold ${
                  metrics.renderTime < 500 ? 'text-green-600' : 
                  metrics.renderTime < 1000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.renderTime.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Count</p>
                <p className="text-2xl font-bold">{metrics.eventCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className={`text-2xl font-bold ${
                  metrics.memoryUsage < 100 ? 'text-green-600' :
                  metrics.memoryUsage < 200 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.memoryUsage.toFixed(1)}MB
                </p>
              </div>
            </div>
            
            {/* Performance Status */}
            <div className="mt-4">
              {metrics.renderTime < 500 && metrics.eventCount >= 10000 ? (
                <Alert className="border-green-600">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    ✅ Excellent! Meeting performance target: &lt;500ms for {metrics.eventCount.toLocaleString()} events
                  </AlertDescription>
                </Alert>
              ) : metrics.renderTime < 1000 ? (
                <Alert className="border-yellow-600">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-600">
                    ⚠️ Acceptable performance: {metrics.renderTime.toFixed(0)}ms for {metrics.eventCount.toLocaleString()} events
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-600">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">
                    ❌ Poor performance: {metrics.renderTime.toFixed(0)}ms for {metrics.eventCount.toLocaleString()} events
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Controls */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Event Count:</span>
          <Button
            variant={eventCount === 100 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(100)}
          >
            100
          </Button>
          <Button
            variant={eventCount === 500 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(500)}
          >
            500
          </Button>
          <Button
            variant={eventCount === 1000 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(1000)}
          >
            1,000
          </Button>
          <Button
            variant={eventCount === 5000 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(5000)}
          >
            5,000
          </Button>
          <Button
            variant={eventCount === 10000 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(10000)}
          >
            10,000
          </Button>
          <Button
            variant={eventCount === 20000 ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenerateEvents(20000)}
            className="font-bold"
          >
            20,000 🔥
          </Button>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium">Render Mode:</span>
          <Button
            variant={renderMode === 'canvas' ? "default" : "outline"}
            size="sm"
            onClick={() => setRenderMode('canvas')}
          >
            Canvas
          </Button>
          <Button
            variant={renderMode === 'dom' ? "default" : "outline"}
            size="sm"
            onClick={() => setRenderMode('dom')}
          >
            DOM
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Current: {eventCount.toLocaleString()} events
        </div>
      </div>
      
      {/* Calendar */}
      <div className="flex-1 overflow-hidden">
        {isGenerating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-lg">Generating {eventCount.toLocaleString()} events...</div>
          </div>
        ) : (
          <HybridCalendar
            year={new Date().getFullYear()}
            events={events}
            className="h-full w-full"
            useCanvas={renderMode === 'canvas'}
            canvasThreshold={100}
            enableDragDrop={true}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onEventClick={(event) => console.log('Event clicked:', event)}
            onEventUpdate={(event) => console.log('Event updated:', event)}
          />
        )}
      </div>
    </div>
  );
}