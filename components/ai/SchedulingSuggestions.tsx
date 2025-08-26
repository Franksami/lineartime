'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { SchedulingEngine } from '@/lib/ai/SchedulingEngine'
import type { Event } from '@/types/calendar'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface TimeSlotSuggestion {
  slot: {
    start: Date
    end: Date
  }
  score: number
  reasoningText: string[]
  conflicts: Event[]
}

interface SchedulingSuggestionsProps {
  title: string
  duration: number // in minutes
  events: Event[]
  onAccept: (slot: TimeSlotSuggestion) => void
  onCancel?: () => void
  preferences?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
    avoidConflicts?: boolean
    bufferTime?: number
  }
  className?: string
}

export function SchedulingSuggestions({
  title,
  duration,
  events,
  onAccept,
  onCancel,
  preferences = {},
  className
}: SchedulingSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<TimeSlotSuggestion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = React.useState<number | null>(null)

  React.useEffect(() => {
    const generateSuggestions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const engine = new SchedulingEngine(events)
        const result = engine.suggestTimeSlots({
          title,
          duration,
          startDate: new Date(),
          endDate: addDays(new Date(), 14), // Look 2 weeks ahead
          constraints: [],
          preferences: {
            workingHours: {
              start: 9,
              end: 17,
              workDays: [1, 2, 3, 4, 5]
            },
            preferredTimes: preferences.timeOfDay ? [preferences.timeOfDay] : ['morning', 'afternoon'],
            bufferTime: preferences.bufferTime || 15,
            focusTime: {
              enabled: true,
              minDuration: 120,
              preferredTimes: ['morning']
            }
          }
        })
        
        setSuggestions(result.suggestions.slice(0, 5)) // Top 5 suggestions
      } catch (err) {
        setError('Failed to generate scheduling suggestions')
        console.error('Scheduling error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    generateSuggestions()
  }, [title, duration, events, preferences])

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    return 'Fair'
  }

  if (loading) {
    return (
      <Card className={cn('w-full max-w-2xl', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Finding optimal time slots...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full max-w-2xl border-destructive', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-3 text-destructive">{error}</span>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className={cn('w-full max-w-2xl', className)}>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No available time slots found in the next 2 weeks</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your preferences or duration</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Scheduling Suggestions
        </CardTitle>
        <CardDescription>
          Optimal time slots for "{title}" ({duration} minutes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer',
              selectedSlot === index 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            )}
            onClick={() => setSelectedSlot(index)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(suggestion.slot.start, 'EEEE, MMMM d')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(suggestion.slot.start, 'h:mm a')} - {format(suggestion.slot.end, 'h:mm a')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={cn('font-semibold', getScoreColor(suggestion.score))}>
                  {(suggestion.score * 100).toFixed(0)}%
                </div>
                <Badge variant="secondary" className="mt-1">
                  {getScoreLabel(suggestion.score)}
                </Badge>
              </div>
            </div>
            
            {suggestion.reasoningText.length > 0 && (
              <div className="mt-3 space-y-1">
                {suggestion.reasoningText.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
            
            {suggestion.conflicts.length > 0 && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-sm">
                <span className="text-orange-600 dark:text-orange-400">
                  ⚠️ Conflicts with: {suggestion.conflicts.map(c => c.title).join(', ')}
                </span>
              </div>
            )}
            
            {selectedSlot === index && (
              <div className="mt-3 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onAccept(suggestion)
                  }}
                >
                  Accept This Time
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSlot(null)
                  }}
                >
                  View Other Options
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {onCancel && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}