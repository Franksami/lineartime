'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Brain, Clock, Calendar, Zap, Target, Users, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SchedulingEngine } from '@/lib/ai/SchedulingEngine'
import type { Event } from '@/types/calendar'
import type { SchedulingRequest, SchedulingResult, UserPreferences, FocusTimeRequest } from '@/lib/ai/types'

export default function TestAISchedulingPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [schedulingEngine, setSchedulingEngine] = useState<SchedulingEngine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SchedulingResult | null>(null)
  
  // Form state for scheduling requests
  const [requestForm, setRequestForm] = useState({
    title: '',
    duration: 60,
    category: 'work' as const,
    priority: 3,
    description: '',
    flexible: true,
    preferredTime: '',
    deadline: ''
  })
  
  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    workingHours: {
      start: 9,
      end: 17,
      days: [1, 2, 3, 4, 5] // Monday to Friday
    },
    bufferTime: 15,
    focusTimePreferences: {
      preferredDuration: 120,
      preferredTimes: [],
      protectionLevel: 'flexible'
    },
    meetingPreferences: {
      preferredDuration: 30,
      maxBackToBack: 3,
      breakAfterMeetings: 15
    }
  })

  useEffect(() => {
    // Generate sample events
    const sampleEvents: Event[] = [
      {
        id: '1',
        title: 'Daily Standup',
        startDate: new Date(2024, 0, 15, 9, 0),
        endDate: new Date(2024, 0, 15, 9, 30),
        category: 'work',
        description: 'Team standup meeting',
        color: '#3b82f6'
      },
      {
        id: '2',
        title: 'Client Presentation',
        startDate: new Date(2024, 0, 15, 14, 0),
        endDate: new Date(2024, 0, 15, 15, 30),
        category: 'work',
        description: 'Quarterly review presentation',
        color: '#ef4444'
      },
      {
        id: '3',
        title: 'Gym Session',
        startDate: new Date(2024, 0, 16, 7, 0),
        endDate: new Date(2024, 0, 16, 8, 30),
        category: 'personal',
        description: 'Morning workout',
        color: '#10b981'
      }
    ]
    
    setEvents(sampleEvents)
    
    // Initialize scheduling engine
    const engine = new SchedulingEngine(sampleEvents, preferences)
    setSchedulingEngine(engine)
  }, [preferences])

  const handleScheduleRequest = async () => {
    if (!schedulingEngine) return
    
    setIsLoading(true)
    
    const request: SchedulingRequest = {
      title: requestForm.title,
      duration: requestForm.duration,
      category: requestForm.category,
      priority: requestForm.priority,
      description: requestForm.description,
      flexible: requestForm.flexible,
      preferredTimes: requestForm.preferredTime ? [{
        start: new Date(`2024-01-15T${requestForm.preferredTime}:00`),
        end: new Date(`2024-01-15T${requestForm.preferredTime}:00`)
      }] : [],
      deadline: requestForm.deadline ? new Date(requestForm.deadline) : undefined
    }
    
    try {
      const result = await schedulingEngine.schedule(request)
      setResults(result)
    } catch (error) {
      console.error('Scheduling failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProtectFocusTime = async () => {
    if (!schedulingEngine) return
    
    setIsLoading(true)
    
    const focusRequest: FocusTimeRequest = {
      type: 'deep-work',
      duration: 120, // 2 hours
      flexibleScheduling: true,
      recurring: {
        frequency: 'daily',
        interval: 1,
        count: 5 // Next 5 days
      }
    }
    
    try {
      const result = await schedulingEngine.protectFocusTime(focusRequest)
      console.log('Focus time protection result:', result)
    } catch (error) {
      console.error('Focus time protection failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">AI Scheduling Engine</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Smart Scheduling
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduling Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule New Event
              </CardTitle>
              <CardDescription>
                Let AI find the optimal time slot for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                    placeholder="Team Meeting"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={requestForm.duration}
                    onChange={(e) => setRequestForm({ ...requestForm, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={requestForm.category} 
                    onValueChange={(value: any) => setRequestForm({ ...requestForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="effort">Effort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (1-5)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="5"
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({ ...requestForm, priority: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={requestForm.preferredTime}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredTime: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={requestForm.deadline}
                    onChange={(e) => setRequestForm({ ...requestForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  onClick={handleScheduleRequest} 
                  disabled={!requestForm.title || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Find Optimal Time
                </Button>
                
                <Button 
                  onClick={handleProtectFocusTime} 
                  variant="outline"
                  disabled={isLoading}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Protect Focus Time
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Suggestions
              </CardTitle>
              <CardDescription>
                Smart scheduling recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Submit a scheduling request to see AI suggestions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.success ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">Found {results.suggestions.length} optimal slots</span>
                      </div>
                      
                      {results.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Option {index + 1}</h4>
                            <Badge variant="outline">Score: {suggestion.score.toFixed(1)}</Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p>{suggestion.slot.start.toLocaleString()} - {suggestion.slot.end.toLocaleString()}</p>
                            <p>Duration: {suggestion.slot.duration} minutes</p>
                          </div>
                          
                          {suggestion.reasoning.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Reasoning:</span>
                              {suggestion.reasoning.map((reason, i) => (
                                <p key={i} className="text-xs text-muted-foreground">• {reason}</p>
                              ))}
                            </div>
                          )}
                          
                          {suggestion.adjustments.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-yellow-600">Adjustments:</span>
                              {suggestion.adjustments.map((adjustment, i) => (
                                <p key={i} className="text-xs text-yellow-600">• {adjustment}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Scheduling Failed</span>
                      </div>
                      
                      {results.conflicts.map((conflict, index) => (
                        <div key={index} className={`p-3 border rounded-lg ${getSeverityColor(conflict.severity)}`}>
                          <p className="text-sm font-medium">{conflict.description}</p>
                          
                          {conflict.resolutionOptions && (
                            <div className="mt-2 space-y-1">
                              <span className="text-xs font-medium">Resolution Options:</span>
                              {conflict.resolutionOptions.map((option, i) => (
                                <div key={i} className="text-xs">
                                  <p>• {option.description}</p>
                                  {option.impact.map((impact, j) => (
                                    <p key={j} className="ml-4 text-muted-foreground">- {impact}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Current Schedule
            </CardTitle>
            <CardDescription>
              Events that the AI considers when scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.startDate.toLocaleString()} - {event.endDate.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{event.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI analyzes your schedule, preferences, and constraints to find optimal time slots with intelligent conflict resolution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Focus Time Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically blocks time for deep work and reschedules conflicting meetings to protect your productivity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Group Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Finds common availability across multiple attendees with intelligent meeting optimization and conflict handling.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
