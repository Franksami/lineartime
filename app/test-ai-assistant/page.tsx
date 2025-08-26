'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Enhanced AI Assistant
const EnhancedAIAssistant = dynamic(
  () => import("@/components/ai/EnhancedAIAssistant").then(mod => ({ default: mod.EnhancedAIAssistant })),
  { 
    ssr: false,
    loading: () => <div className="p-4">Loading AI Assistant...</div>
  }
);

export default function TestAIAssistantPage() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Assistant Test Page</h1>
        
        {/* AI Assistant Trigger Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAIAssistant(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Open Enhanced AI Assistant"
          >
            🤖 Open Enhanced AI Assistant
          </button>
        </div>

        {/* Test Calendar Data */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Calendar Events</h2>
          <div className="text-sm text-muted-foreground">
            This page provides a test environment for the Enhanced AI Assistant
            with sample calendar events for AI processing.
          </div>
        </div>

        {/* Enhanced AI Assistant */}
        {showAIAssistant && (
          <EnhancedAIAssistant 
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            events={[
              {
                id: '1',
                title: 'Team Meeting',
                startDate: new Date('2025-01-15T10:00:00'),
                endDate: new Date('2025-01-15T11:00:00'),
                category: 'work',
                description: 'Weekly team sync'
              },
              {
                id: '2', 
                title: 'Project Review',
                startDate: new Date('2025-01-16T14:00:00'),
                endDate: new Date('2025-01-16T15:30:00'),
                category: 'work',
                description: 'Q1 project status review'
              }
            ]}
          />
        )}

        {/* Additional Test Content */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">AI Features Available</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Natural language event creation</li>
            <li>Smart scheduling suggestions</li>
            <li>Conflict detection and resolution</li>
            <li>Calendar insights and analytics</li>
            <li>AI-powered time management tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
}