'use client';

import React from 'react';
import { TimelineContainer } from '@/components/timeline/TimelineContainer';

// Generate sample events for testing
const generateSampleEvents = () => {
  const events = [];
  const categories = ['work', 'personal', 'effort', 'note'];
  
  // Add some random events throughout the year
  for (let i = 0; i < 50; i++) {
    const date = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    events.push({
      id: `event-${i}`,
      date: date.toISOString(),
      title: `Event ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Sample event description for event ${i + 1}`
    });
  }
  
  return events;
};

export default function TimelineTestPage() {
  const events = generateSampleEvents();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Timeline Container Test</h1>
        <p className="text-white/70 mb-8">Testing the glassmorphic timeline component with virtual scrolling and zoom capabilities</p>
        
        <div className="space-y-8">
          {/* Full-width timeline with glassmorphism enabled */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Glassmorphic Timeline (Full Width)</h2>
            <TimelineContainer
              className="h-[200px]"
              events={events}
              config={{
                glassmorphic: true,
                initialZoomLevel: 'month',
                enableGestures: true,
                enableKeyboardNavigation: true,
                showHeatMap: true,
                monthRowHeight: 150
              }}
              onDayClick={(date) => console.log('Day clicked:', date)}
              onDayHover={(date) => console.log('Day hovered:', date)}
              onZoomChange={(level) => console.log('Zoom changed to:', level)}
            />
          </div>
          
          {/* Smaller timeline without glassmorphism for comparison */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Standard Timeline (No Glassmorphism)</h2>
            <TimelineContainer
              className="h-[150px] bg-gray-800"
              events={events}
              config={{
                glassmorphic: false,
                initialZoomLevel: 'quarter',
                enableGestures: true,
                enableKeyboardNavigation: true,
                showHeatMap: true,
                monthRowHeight: 120
              }}
            />
          </div>
          
          {/* Year view with heat map */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Year View with Heat Map</h2>
            <TimelineContainer
              className="h-[100px]"
              events={events}
              config={{
                glassmorphic: true,
                initialZoomLevel: 'year',
                enableGestures: true,
                enableKeyboardNavigation: true,
                showHeatMap: true,
                monthRowHeight: 80
              }}
            />
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Keyboard Controls:</h3>
          <ul className="text-white/80 space-y-1">
            <li>• Arrow Keys: Navigate left/right</li>
            <li>• +/- Keys: Zoom in/out</li>
            <li>• Home/End: Jump to start/end</li>
            <li>• Ctrl + Wheel: Zoom with mouse wheel</li>
            <li>• Pinch: Zoom on touch devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}