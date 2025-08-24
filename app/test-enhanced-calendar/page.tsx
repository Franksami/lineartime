'use client'

import React, { useState } from 'react'
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Brain, Target, Sparkles } from 'lucide-react'
import type { Event } from '@/types/calendar'

export default function TestEnhancedCalendarPage() {
  const currentYear = new Date().getFullYear()
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Meeting',
      startDate: new Date(currentYear, 0, 15, 10, 0),
      endDate: new Date(currentYear, 0, 15, 11, 0),
      category: 'work',
      description: 'Weekly team sync'
    },
    {
      id: '2',
      title: 'Lunch with Client',
      startDate: new Date(currentYear, 0, 20, 12, 0),
      endDate: new Date(currentYear, 0, 20, 13, 30),
      category: 'work',
      description: 'Discuss project requirements'
    },
    {
      id: '3',
      title: 'Gym Session',
      startDate: new Date(currentYear, 0, 18, 17, 0),
      endDate: new Date(currentYear, 0, 18, 18, 0),
      category: 'personal',
      description: 'Cardio and strength training'
    }
  ])

  const handleEventCreate = (eventData: Partial<Event>) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: eventData.title || 'New Event',
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || new Date(),
      category: eventData.category || 'personal',
      description: eventData.description || ''
    }
    setEvents(prev => [...prev, newEvent])
  }

  const handleEventUpdate = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ))
  }

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                🚀 Enhanced Calendar Test
              </h1>
              <p className="text-muted-foreground mt-2">
                Testing new performance monitoring and AI-enhanced features
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Performance Monitor
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Enhanced
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Performance Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time FPS monitoring, memory usage tracking, and render time optimization.
                Click the performance button to see live metrics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enhanced AI assistant with natural language parsing, AI-powered scheduling suggestions,
                and intelligent conflict resolution. Look for the AI button in the bottom-right.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Enhanced Drag & Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced drag and drop with touch support, multi-select, and real-time
                feedback during event manipulation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Features Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              New AI Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">🤖 Natural Language Parser</h4>
                <p className="text-xs text-muted-foreground">
                  Create events using natural language like "Team meeting tomorrow at 2pm for 1 hour"
                </p>
                <div className="text-xs bg-muted p-2 rounded">
                  <strong>Try:</strong> "Dentist appointment next Friday at 10:30am"
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">🧠 AI Chat Interface</h4>
                <p className="text-xs text-muted-foreground">
                  Advanced AI chat with context-aware responses and event management
                </p>
                <div className="text-xs bg-muted p-2 rounded">
                  <strong>Try:</strong> "What's my schedule looking like this week?"
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">⚡ AI Scheduling Suggestions</h4>
                <p className="text-xs text-muted-foreground">
                  AI-powered optimization for finding best meeting times and resolving conflicts
                </p>
                <div className="text-xs bg-muted p-2 rounded">
                  <strong>Try:</strong> "AI: Optimize my schedule"
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">🎯 Smart Event Creation</h4>
                <p className="text-xs text-muted-foreground">
                  Intelligent event parsing with automatic category detection and time optimization
                </p>
                <div className="text-xs bg-muted p-2 rounded">
                  <strong>Try:</strong> "Weekly standup every Monday at 9am"
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How to Test the New Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Performance Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  Look for the blue performance button in the bottom-left corner. Click it to see real-time FPS, memory usage, and render time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">AI Assistant</p>
                <p className="text-sm text-muted-foreground">
                  Look for the AI assistant button in the bottom-right corner. It now has three tabs: Chat, Parser, and AI Chat.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Natural Language Parsing</p>
                <p className="text-sm text-muted-foreground">
                  In the AI Assistant, go to the "Parser" tab and try typing natural language event descriptions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium">AI Chat Interface</p>
                <p className="text-sm text-muted-foreground">
                  In the AI Assistant, go to the "AI Chat" tab for advanced AI-powered conversations about your calendar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                5
              </div>
              <div>
                <p className="font-medium">Enhanced Drag & Drop</p>
                <p className="text-sm text-muted-foreground">
                  Try dragging events around the calendar. You'll see AI-powered suggestions and real-time feedback.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <div className="h-[600px] border-t">
        <LinearCalendarHorizontal
          year={currentYear}
          events={events}
          className="h-full w-full"
          onDateSelect={(date) => console.log('Date selected:', date)}
          onEventClick={(event) => console.log('Event clicked:', event)}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          enableInfiniteCanvas={true}
        />
      </div>
    </div>
  )
}
