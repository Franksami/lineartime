'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOfflineEvents } from '@/hooks/useIndexedDB';
import { Event } from '@/types/calendar';
import { addDays, addHours, startOfYear } from 'date-fns';

export default function PerformanceTestPage() {
  const userId = 'test-user';
  const offlineEvents = useOfflineEvents(userId);
  const events = offlineEvents?.events || [];
  const createEvent = offlineEvents?.createEvent;
  const deleteEvent = offlineEvents?.deleteEvent;
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState({
    eventCount: 0,
    renderTime: 0,
    fps: 0,
    memoryUsed: 0,
    storageType: 'unknown'
  });

  // Check storage type
  useEffect(() => {
    const checkStorage = () => {
      const hasIndexedDB = 'indexedDB' in window;
      const localStorageData = localStorage.getItem('calendar-events');
      
      setMetrics(prev => ({
        ...prev,
        storageType: hasIndexedDB ? 'IndexedDB available' : 'LocalStorage only',
        eventCount: events.length
      }));
    };
    
    checkStorage();
  }, [events]);

  // Generate test events
  const generateTestEvents = async (count: number) => {
    setIsGenerating(true);
    const startTime = performance.now();
    
    const categories = ['personal', 'work', 'effort', 'notes'] as const;
    const titles = [
      'Team Meeting', 'Project Review', 'Client Call', 'Code Review',
      'Lunch Break', 'Training Session', 'Sprint Planning', 'Standup',
      'Design Review', 'Performance Review', 'Interview', 'Workshop'
    ];
    
    const baseDate = startOfYear(new Date());
    const newEvents: Partial<Event>[] = [];
    
    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor(Math.random() * 365);
      const hourOffset = Math.floor(Math.random() * 10) + 8; // 8am-6pm
      const duration = Math.floor(Math.random() * 4) + 1; // 1-4 hours
      
      const startDate = addHours(addDays(baseDate, dayOffset), hourOffset);
      const endDate = addHours(startDate, duration);
      
      newEvents.push({
        title: `${titles[Math.floor(Math.random() * titles.length)]} #${i + 1}`,
        description: `Test event ${i + 1} for performance testing`,
        startDate,
        endDate,
        category: categories[Math.floor(Math.random() * categories.length)],
        location: Math.random() > 0.5 ? 'Conference Room' : undefined,
        attendees: Math.random() > 0.5 ? ['user@example.com'] : undefined
      });
    }
    
    // Add events in batches to avoid blocking
    const batchSize = 100;
    for (let i = 0; i < newEvents.length; i += batchSize) {
      const batch = newEvents.slice(i, i + batchSize);
      if (createEvent) {
        await Promise.all(batch.map(event => createEvent({
          ...event,
          userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'local',
          isDeleted: false
        } as any)));
      }
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Measure memory if available
    let memoryUsed = 0;
    if ('memory' in performance) {
      memoryUsed = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }
    
    setMetrics(prev => ({
      ...prev,
      eventCount: events.length + count,
      renderTime,
      memoryUsed
    }));
    
    setIsGenerating(false);
  };

  // Measure FPS
  const measureFPS = () => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;
    
    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  };

  useEffect(() => {
    measureFPS();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Performance Test Suite</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Event Count</p>
              <p className="text-2xl font-bold">{metrics.eventCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage Type</p>
              <p className="text-2xl font-bold">{metrics.storageType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Render Time</p>
              <p className="text-2xl font-bold">{metrics.renderTime.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current FPS</p>
              <p className="text-2xl font-bold">{metrics.fps}</p>
            </div>
            {metrics.memoryUsed > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Memory Used</p>
                <p className="text-2xl font-bold">{metrics.memoryUsed.toFixed(2)}MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Test Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={() => generateTestEvents(100)} 
              disabled={isGenerating}
              variant="outline"
            >
              Add 100 Events
            </Button>
            <Button 
              onClick={() => generateTestEvents(500)} 
              disabled={isGenerating}
              variant="outline"
            >
              Add 500 Events
            </Button>
            <Button 
              onClick={() => generateTestEvents(1000)} 
              disabled={isGenerating}
            >
              Add 1,000 Events
            </Button>
            <Button 
              onClick={() => generateTestEvents(5000)} 
              disabled={isGenerating}
              variant="default"
            >
              Add 5,000 Events
            </Button>
            <Button 
              onClick={() => generateTestEvents(10000)} 
              disabled={isGenerating}
              variant="destructive"
            >
              Add 10,000 Events (Stress Test)
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={async () => {
                if (events && deleteEvent) {
                  for (const event of events) {
                    if (event.id) {
                      await deleteEvent(event.id, true);
                    }
                  }
                }
              }} 
              variant="destructive"
              disabled={isGenerating}
            >
              Clear All Events
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="secondary"
            >
              Go to Calendar
            </Button>
          </div>
          
          {isGenerating && (
            <p className="text-sm text-muted-foreground">Generating events...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Initial Render</span>
              <span className={metrics.renderTime < 500 ? 'text-green-500' : 'text-red-500'}>
                Target: &lt;500ms (Current: {metrics.renderTime.toFixed(2)}ms)
              </span>
            </div>
            <div className="flex justify-between">
              <span>FPS</span>
              <span className={metrics.fps >= 60 ? 'text-green-500' : 'text-red-500'}>
                Target: 60fps (Current: {metrics.fps}fps)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage</span>
              <span className={metrics.memoryUsed < 100 ? 'text-green-500' : 'text-red-500'}>
                Target: &lt;100MB (Current: {metrics.memoryUsed.toFixed(2)}MB)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max Events</span>
              <span className={metrics.eventCount < 10000 ? 'text-yellow-500' : 'text-green-500'}>
                Target: 10,000+ (Current: {metrics.eventCount})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Start with 100 events and check calendar performance</p>
          <p>2. Gradually increase to 500, then 1000 events</p>
          <p>3. Monitor FPS while scrolling the calendar</p>
          <p>4. Note when performance starts degrading</p>
          <p>5. Test with 10,000 events for stress testing</p>
          <p className="text-sm text-muted-foreground mt-4">
            ⚠️ If the app becomes unresponsive, refresh the page and clear events
          </p>
        </CardContent>
      </Card>
    </div>
  );
}