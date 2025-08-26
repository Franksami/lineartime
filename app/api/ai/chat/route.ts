import { streamText, tool } from 'ai'
import { api } from '@/convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { SchedulingEngine } from '@/lib/ai/SchedulingEngine'
import { TimeSlotFinder } from '@/lib/ai/TimeSlotFinder'
import { IntervalTree } from '@/lib/data-structures/IntervalTree'
import { AI_TOOLS } from '@/lib/ai-config'
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
    
    const { messages, events = [], userId: bodyUserId, model, webSearch } = await request.json()
    
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
    // Choose model if provided like "anthropic/claude-3-5-sonnet"
    let modelId = 'claude-3-haiku-20240307' // Default to faster, cheaper model
    if (typeof model === 'string') {
      const parts = model.split('/')
      if (parts.length === 2 && parts[0] === 'anthropic') {
        modelId = parts[1]
      } else if (parts.length === 1) {
        modelId = model
      }
    }

    const result = streamText({
      model: anthropic(modelId),
      messages,
      temperature: 0.7,
      tools: {
        // Enhanced AI calendar tools using Vercel AI SDK v5
        ...AI_TOOLS,
        
        // Legacy tools for backward compatibility
        suggestSchedule: tool({
          description: 'Legacy: Suggest optimal time slots for a new event (use suggestTimes instead)',
          inputSchema: suggestScheduleSchema,
          execute: async ({ title, duration, preferences }) => {
            const scheduleResult = await schedulingEngine.schedule({
              title,
              duration,
              preferredTimes: [],
              priority: 3
            })

            return {
              suggestions: scheduleResult.suggestions.slice(0, 3).map(s => ({
                start: format(s.slot.start, 'PPpp'),
                end: format(s.slot.end, 'PPpp'),
                startISO: s.slot.start.toISOString(),
                endISO: s.slot.end.toISOString(),
                score: s.score,
                reasons: s.reasoningText
              }))
            };
          }
        }),
        
        explainConflicts: tool({
          description: 'Legacy: Explain scheduling conflicts (use findConflicts instead)',
          inputSchema: explainConflictsSchema,
          execute: async ({ date }) => {
            const targetDate = date ? new Date(date) : new Date()
            const dayStart = startOfDay(targetDate)
            const dayEnd = endOfDay(targetDate)
            
            const conflicts = intervalTree.findOverlapping(dayStart, dayEnd)
            
            if (conflicts.length === 0) {
              return { message: 'No conflicts found for this date' }
            }
            
            const conflictDetails = conflicts.map(c => ({
              title: c.title,
              time: `${format(new Date(c.startDate), 'p')} - ${format(new Date(c.endDate), 'p')}`,
              overlaps: intervalTree.findOverlapping(c.startDate, c.endDate).length - 1
            }))
            
            return {
              totalConflicts: conflicts.length,
              conflicts: conflictDetails
            }
          }
        }),
        
        listOpenSlots: tool({
          description: 'Legacy: List available time slots (use getAvailability instead)',
          inputSchema: listOpenSlotsSchema,
          execute: async ({ date, minDuration }) => {
            const targetDate = new Date(date)
            const dayStart = startOfDay(targetDate)
            const dayEnd = endOfDay(targetDate)
            const finder = new TimeSlotFinder(events)
            const slots = finder.findAvailableSlots(
              dayStart,
              dayEnd,
              minDuration,
              { respectWorkingHours: true, includeWeekends: false }
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
          inputSchema: summarizePeriodSchema,
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
      system: `You are an AI scheduling assistant for LinearTime, a revolutionary year-at-a-glance calendar application.
        
        Philosophy: "Life is bigger than a week" - Help users think beyond weekly planning and optimize their entire year.
        
        Enhanced AI Tools Available:
        - getAvailability: Find available time slots with intelligent filtering
        - createEvent: Create events with conflict detection and smart placement
        - findConflicts: Advanced conflict analysis with severity assessment
        - suggestTimes: AI-powered time suggestions based on context and preferences
        - rescheduleEvent: Intelligent rescheduling with alternative options
        
        Core Capabilities:
        • Intelligent scheduling optimization using AI analysis
        • Cross-calendar conflict detection and resolution
        • Natural language event creation and management
        • Productivity insights and calendar analytics
        • Focus time protection and workload balancing
        
        Be proactive, insightful, and focus on helping users optimize their time across months and years, not just days and weeks.
        Always consider the user's long-term productivity and work-life balance.
        
        Current date: ${format(new Date(), 'PPP')}`
    })
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null
    const finalUserId = bodyUserId || userId

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      originalMessages: messages,
      async onFinish({ messages: uiMessages, responseMessage }) {
        try {
          if (convex && finalUserId !== 'anonymous') {
            const chatId = await convex.mutation(api.aiChat.ensureChat, { userId: finalUserId })
            await convex.mutation(api.aiChat.appendMessages, {
              chatId,
              messages: [responseMessage]
            })
          }
        } catch (e) {
          console.error('Convex save failed', e)
        }
      }
    })
    
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}