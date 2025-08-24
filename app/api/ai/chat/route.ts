import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { SchedulingEngine } from '@/lib/ai/SchedulingEngine'
import { IntervalTree } from '@/lib/data-structures/IntervalTree'
import type { Event } from '@/types/calendar'
import { addDays, startOfDay, endOfDay, format } from 'date-fns'

// Enable Edge runtime for optimal performance
export const runtime = 'edge'

// Rate limiting (simplified for edge runtime)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = requestCounts.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (userLimit.count >= 20) { // 20 requests per minute
    return false
  }
  
  userLimit.count++
  return true
}

// Tool schemas
const suggestScheduleSchema = z.object({
  title: z.string().describe('Event title'),
  duration: z.number().describe('Duration in minutes'),
  preferences: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
    avoidConflicts: z.boolean().default(true)
  }).optional()
})

const explainConflictsSchema = z.object({
  date: z.string().describe('Date to check conflicts (YYYY-MM-DD)').optional(),
  eventId: z.string().optional()
})

const listOpenSlotsSchema = z.object({
  date: z.string().describe('Date to find open slots (YYYY-MM-DD)'),
  minDuration: z.number().describe('Minimum duration in minutes').default(30)
})

const summarizePeriodSchema = z.object({
  startDate: z.string().describe('Start date (YYYY-MM-DD)'),
  endDate: z.string().describe('End date (YYYY-MM-DD)')
})

export async function POST(request: Request) {
  try {
    // Get user ID from headers or session (simplified for demo)
    const userId = request.headers.get('x-user-id') || 'anonymous'
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    
    const { messages, events = [] } = await request.json()
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request', { status: 400 })
    }
    
    // Initialize scheduling engine with events
    const schedulingEngine = new SchedulingEngine(events)
    const intervalTree = new IntervalTree()
    
    // Add events to interval tree for conflict detection
    events.forEach((event: Event) => {
      if (event.startDate && event.endDate) {
        intervalTree.insert(event)
      }
    })
    
    // Stream response using AI SDK v5
    const result = streamText({
      model: openai('gpt-4o-mini'), // Using mini for cost efficiency
      messages,
      temperature: 0.7,
      tools: {
        suggestSchedule: tool({
          description: 'Suggest optimal time slots for a new event',
          parameters: suggestScheduleSchema,
          execute: async ({ title, duration, preferences }) => {
            const suggestions = schedulingEngine.suggestTimeSlots({
              title,
              duration,
              startDate: new Date(),
              endDate: addDays(new Date(), 7),
              constraints: [],
              preferences: {
                workingHours: {
                  start: 9,
                  end: 17,
                  workDays: [1, 2, 3, 4, 5]
                },
                preferredTimes: preferences?.timeOfDay ? 
                  [preferences.timeOfDay] : ['morning', 'afternoon'],
                bufferTime: 15,
                focusTime: {
                  enabled: true,
                  minDuration: 120,
                  preferredTimes: ['morning']
                }
              }
            })
            
            return {
              suggestions: suggestions.suggestions.slice(0, 3).map(s => ({
                start: format(s.slot.start, 'PPpp'),
                end: format(s.slot.end, 'PPpp'),
                score: s.score,
                reasons: s.reasoning
              }))
            }
          }
        }),
        
        explainConflicts: tool({
          description: 'Explain scheduling conflicts for a specific date or event',
          parameters: explainConflictsSchema,
          execute: async ({ date }) => {
            const targetDate = date ? new Date(date) : new Date()
            const dayStart = startOfDay(targetDate).getTime()
            const dayEnd = endOfDay(targetDate).getTime()
            
            const conflicts = intervalTree.query(dayStart, dayEnd)
            
            if (conflicts.length === 0) {
              return { message: 'No conflicts found for this date' }
            }
            
            const conflictDetails = conflicts.map(c => ({
              title: c.data.title,
              time: `${format(new Date(c.start), 'p')} - ${format(new Date(c.end), 'p')}`,
              overlaps: intervalTree.query(c.start, c.end).length - 1
            }))
            
            return {
              totalConflicts: conflicts.length,
              conflicts: conflictDetails
            }
          }
        }),
        
        listOpenSlots: tool({
          description: 'List available time slots for a specific date',
          parameters: listOpenSlotsSchema,
          execute: async ({ date, minDuration }) => {
            const targetDate = new Date(date)
            const slots = schedulingEngine.findAvailableSlots(
              targetDate,
              targetDate,
              minDuration
            )
            
            return {
              date: format(targetDate, 'PP'),
              openSlots: slots.slice(0, 5).map(slot => ({
                start: format(slot.start, 'p'),
                end: format(slot.end, 'p'),
                duration: Math.round((slot.end.getTime() - slot.start.getTime()) / 60000)
              }))
            }
          }
        }),
        
        summarizePeriod: tool({
          description: 'Summarize calendar activity for a time period',
          parameters: summarizePeriodSchema,
          execute: async ({ startDate, endDate }) => {
            const start = new Date(startDate)
            const end = new Date(endDate)
            
            const periodEvents = events.filter((e: Event) => {
              const eventStart = new Date(e.startDate)
              return eventStart >= start && eventStart <= end
            })
            
            const categories = periodEvents.reduce((acc: Record<string, number>, e: Event) => {
              acc[e.category] = (acc[e.category] || 0) + 1
              return acc
            }, {})
            
            const totalHours = periodEvents.reduce((acc: number, e: Event) => {
              const duration = new Date(e.endDate).getTime() - new Date(e.startDate).getTime()
              return acc + duration / 3600000
            }, 0)
            
            return {
              period: `${format(start, 'PP')} - ${format(end, 'PP')}`,
              totalEvents: periodEvents.length,
              totalHours: Math.round(totalHours),
              byCategory: categories,
              busiest: periodEvents.length > 20 ? 'Very busy period' : 
                      periodEvents.length > 10 ? 'Moderately busy' : 'Light schedule'
            }
          }
        })
      },
      system: `You are an AI scheduling assistant for a calendar application. 
        Help users manage their time effectively by suggesting optimal scheduling, 
        identifying conflicts, and providing insights about their calendar.
        Be concise and helpful. Use the available tools to provide accurate information.
        Current date: ${format(new Date(), 'PPP')}`
    })
    
    return result.toUIMessageStreamResponse()
    
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}