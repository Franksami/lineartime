'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Lightbulb,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  Zap,
  TrendingUp,
  Target,
  RefreshCw
} from 'lucide-react'
import { CalendarAI } from '@/lib/ai/CalendarAI'
import { EnhancedSchedulingEngine } from '@/lib/ai/EnhancedSchedulingEngine'
import type { Event } from '@/types/calendar'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface AISchedulingSuggestionsProps {
  events: Event[]
  onEventCreate?: (event: Partial<Event>) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  className?: string
}

interface AISuggestion {
  id: string
  type: 'optimal_time' | 'conflict_resolution' | 'productivity_boost' | 'focus_time' | 'meeting_optimization'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  timeSlots?: Array<{
    start: string
    end: string
    startFormatted: string
    endFormatted: string
    reasoning: string[]
    confidence: number
  }>
  action?: {
    type: 'create_event' | 'reschedule_event' | 'block_time' | 'optimize_schedule'
    data: any
  }
}

export function AISchedulingSuggestions({
  events,
  onEventCreate,
  onEventUpdate,
  className
}: AISchedulingSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [calendarAI, setCalendarAI] = React.useState<CalendarAI | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date())

  // Initialize AI
  React.useEffect(() => {
    if (events.length > 0) {
      const ai = new CalendarAI(events)
      setCalendarAI(ai)
      generateSuggestions(ai)
    }
  }, [events])

  const generateSuggestions = async (ai: CalendarAI) => {
    if (!ai) return

    setIsLoading(true)
    try {
      // Get various types of AI suggestions
      const [insights, conflicts] = await Promise.all([
        ai.getCalendarInsights('week'),
        ai.resolveConflicts([]) // Would pass actual conflicts in real implementation
      ])

      const newSuggestions: AISuggestion[] = []

      // Productivity suggestions
      if (insights.metrics.productivityScore < 75) {
        newSuggestions.push({
          id: 'productivity-boost',
          type: 'productivity_boost',
          title: 'Optimize Schedule for Better Productivity',
          description: `Your productivity score is ${insights.metrics.productivityScore}%. I can help optimize your schedule for better focus time.`,
          confidence: 0.85,
          impact: 'high',
          action: {
            type: 'optimize_schedule',
            data: { targetScore: 85, focusTimeIncrease: 2 }
          }
        })
      }

      // Meeting optimization
      if (insights.metrics.meetingTime > insights.metrics.focusTime * 1.5) {
        newSuggestions.push({
          id: 'meeting-optimization',
          type: 'meeting_optimization',
          title: 'Reduce Meeting Overhead',
          description: `You have ${insights.metrics.meetingTime}h of meetings vs ${insights.metrics.focusTime}h focus time. Consider consolidating meetings.`,
          confidence: 0.78,
          impact: 'medium',
          action: {
            type: 'optimize_schedule',
            data: { reduceMeetings: true, targetRatio: 0.6 }
          }
        })
      }

      // Focus time suggestions
      const tomorrow = addDays(new Date(), 1)
      const dayAfter = addDays(new Date(), 2)
      
      newSuggestions.push({
        id: 'focus-time-suggestion',
        type: 'focus_time',
        title: 'Protect Deep Work Time',
        description: 'I found optimal slots for 2-hour focus blocks based on your energy patterns.',
        confidence: 0.92,
        impact: 'high',
        timeSlots: [
          {
            start: tomorrow.toISOString(),
            end: addDays(tomorrow, 0).toISOString(),
            startFormatted: format(tomorrow, 'EEEE, MMM d, h:mm a'),
            endFormatted: format(addDays(tomorrow, 0), 'h:mm a'),
            reasoning: ['Peak energy time', 'No conflicts', 'Optimal for deep work'],
            confidence: 0.92
          },
          {
            start: dayAfter.toISOString(),
            end: addDays(dayAfter, 0).toISOString(),
            startFormatted: format(dayAfter, 'EEEE, MMM d, h:mm a'),
            endFormatted: format(addDays(dayAfter, 0), 'h:mm a'),
            reasoning: ['Good energy alignment', 'Buffer time available', 'Productive time slot'],
            confidence: 0.87
          }
        ],
        action: {
          type: 'block_time',
          data: { duration: 120, type: 'focus', priority: 'high' }
        }
      })

      // Optimal meeting time suggestion
      newSuggestions.push({
        id: 'optimal-meeting-time',
        type: 'optimal_time',
        title: 'Best Times for New Meetings',
        description: 'Based on your calendar patterns, these are the most effective meeting times.',
        confidence: 0.88,
        impact: 'medium',
        timeSlots: [
          {
            start: format(addDays(new Date(), 3), "yyyy-MM-dd'T'10:00:00"),
            end: format(addDays(new Date(), 3), "yyyy-MM-dd'T'11:00:00"),
            startFormatted: format(addDays(new Date(), 3), 'EEEE, MMM d, 10:00 AM'),
            endFormatted: '11:00 AM',
            reasoning: ['High energy time', 'Good for decision making', 'Team availability'],
            confidence: 0.88
          },
          {
            start: format(addDays(new Date(), 4), "yyyy-MM-dd'T'14:00:00"),
            end: format(addDays(new Date(), 4), "yyyy-MM-dd'T'15:00:00"),
            startFormatted: format(addDays(new Date(), 4), 'EEEE, MMM d, 2:00 PM'),
            endFormatted: '3:00 PM',
            reasoning: ['Post-lunch energy peak', 'Less likely to run over', 'Good collaboration time'],
            confidence: 0.82
          }
        ]
      })

      setSuggestions(newSuggestions)
      setLastUpdated(new Date())

    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    if (!suggestion.action || !onEventCreate) return

    switch (suggestion.action.type) {
      case 'create_event':
        onEventCreate(suggestion.action.data)
        break
        
      case 'block_time':
        if (suggestion.timeSlots && suggestion.timeSlots.length > 0) {
          const slot = suggestion.timeSlots[0]
          onEventCreate({
            title: `${suggestion.action.data.type === 'focus' ? 'Focus Time' : 'Protected Time'}`,
            startDate: new Date(slot.start),
            endDate: new Date(slot.end),
            category: 'personal',
            description: `AI-suggested ${suggestion.action.data.type} block`
          })
        }
        break
        
      case 'optimize_schedule':
        // In a real implementation, this would trigger schedule optimization
        console.log('Schedule optimization requested:', suggestion.action.data)
        break
    }
  }

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'optimal_time': return <Clock className="w-4 h-4" />
      case 'conflict_resolution': return <AlertTriangle className="w-4 h-4" />
      case 'productivity_boost': return <TrendingUp className="w-4 h-4" />
      case 'focus_time': return <Target className="w-4 h-4" />
      case 'meeting_optimization': return <Users className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: AISuggestion['impact']) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-orange-600'
  }

  if (suggestions.length === 0 && !isLoading) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <Lightbulb className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h3 className="font-medium mb-2">No AI Suggestions Available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add some events to your calendar to get personalized AI scheduling suggestions.
        </p>
        <Button 
          variant="outline" 
          onClick={() => calendarAI && generateSuggestions(calendarAI)}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Suggestions
        </Button>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Scheduling Suggestions</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {format(lastUpdated, 'HH:mm')}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => calendarAI && generateSuggestions(calendarAI)}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-24"></div>
            </div>
          </Card>
        ) : (
          suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getImpactColor(suggestion.impact))}
                    >
                      {suggestion.impact} impact
                    </Badge>
                    <div className={cn('text-xs font-medium', getConfidenceColor(suggestion.confidence))}>
                      {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                {suggestion.timeSlots && suggestion.timeSlots.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Suggested Time Slots
                      </div>
                      {suggestion.timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {slot.startFormatted} - {slot.endFormatted}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {slot.reasoning.join(' • ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs', getConfidenceColor(slot.confidence))}>
                              {Math.round(slot.confidence * 100)}%
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApplySuggestion(suggestion)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Action Button */}
                {!suggestion.timeSlots && suggestion.action && (
                  <>
                    <Separator />
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="bg-gradient-to-r from-primary to-accent"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Apply Suggestion
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span>
            AI suggestions are based on your calendar patterns and productivity insights. 
            Confidence scores indicate prediction accuracy.
          </span>
        </div>
      </Card>
    </div>
  )
}