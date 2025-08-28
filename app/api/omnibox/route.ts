/**
 * Omnibox API - Natural Language to Actions Processing
 * Research validation: Rasa intent classification patterns with Vercel AI SDK
 */

import { streamText } from 'ai'
import { openai } from 'ai/openai'

/**
 * Intent classification prompt based on Rasa research patterns
 */
const INTENT_CLASSIFICATION_PROMPT = `
You are an intent classification system for a productivity workspace. 
Analyze user input and return a JSON response with intent classification and action mapping.

Available intents:
- create_event: Create calendar events
- create_task: Create tasks or todos  
- create_note: Create notes or documents
- navigate_view: Switch between views (week, planner, notes, mailbox)
- resolve_conflicts: AI-powered conflict resolution
- auto_schedule: Automatically schedule tasks
- link_entities: Link items together
- toggle_panel: Show/hide dock panels
- search: Search for information

Response format:
{
  "intent": "create_event",
  "confidence": 0.92,
  "entities": {
    "title": "Meeting with Dan",
    "date": "2025-03-15", 
    "time": "15:00",
    "duration": "1h"
  },
  "action": {
    "type": "create_event",
    "parameters": {
      "title": "Meeting with Dan",
      "start": "2025-03-15T15:00:00",
      "end": "2025-03-15T16:00:00"
    }
  }
}

For confidence < 0.8, provide suggestions array with multiple possible actions.
For confidence ≥ 0.8, provide direct action for auto-execution.

Examples:
- "meet Dan tomorrow 3pm 1h" → create_event with high confidence
- "schedule focus time" → create_event with medium confidence, provide suggestions
- "fix conflicts" → resolve_conflicts with high confidence
- "show me tasks" → navigate_view to planner with high confidence
`

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response('Missing prompt', { status: 400 })
    }
    
    // Use Vercel AI SDK for intent classification
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: INTENT_CLASSIFICATION_PROMPT,
      prompt: `Classify this user input: "${prompt}"`,
      temperature: 0.1, // Low temperature for consistent classification
      maxTokens: 500
    })
    
    // Stream the response for real-time feedback
    return result.toTextStreamResponse()
    
  } catch (error) {
    console.error('Omnibox API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

/**
 * Intent execution utilities (to be expanded in Phase 4 - AI Integration)
 */
export class IntentExecutor {
  
  /**
   * Execute classified intent with safety checks
   */
  static async executeIntent(intent: ParsedIntent): Promise<boolean> {
    try {
      switch (intent.intent) {
        case 'create_event':
          return await this.createEvent(intent.action?.parameters || {})
          
        case 'create_task':
          return await this.createTask(intent.action?.parameters || {})
          
        case 'navigate_view':
          return await this.navigateView(intent.action?.parameters || {})
          
        case 'toggle_panel':
          return await this.togglePanel(intent.action?.parameters || {})
          
        default:
          console.warn(`Unknown intent: ${intent.intent}`)
          return false
      }
    } catch (error) {
      console.error(`Intent execution failed for ${intent.intent}:`, error)
      return false
    }
  }
  
  /**
   * Create event from natural language
   */
  private static async createEvent(parameters: any): Promise<boolean> {
    console.log('Creating event from NL:', parameters)
    
    // TODO: Phase 3 - Integrate with calendar backend
    // For now, just validate parameters
    const requiredFields = ['title']
    const hasRequired = requiredFields.every(field => parameters[field])
    
    if (!hasRequired) {
      throw new Error('Missing required fields for event creation')
    }
    
    return true
  }
  
  /**
   * Create task from natural language
   */
  private static async createTask(parameters: any): Promise<boolean> {
    console.log('Creating task from NL:', parameters)
    
    // TODO: Phase 3 - Integrate with task system
    return true
  }
  
  /**
   * Navigate to view from natural language
   */
  private static async navigateView(parameters: any): Promise<boolean> {
    const { view } = parameters
    
    if (!view) return false
    
    // Use existing navigation command
    const command = {
      id: `navigate.view.${view}`,
      title: `Navigate to ${view}`,
      category: 'navigate' as const,
      scope: 'global' as const,
      execute: () => {
        const { setActiveView } = useAppShell.getState()
        setActiveView(view)
      }
    }
    
    await CommandExecutor.executeCommand(command)
    return true
  }
  
  /**
   * Toggle dock panel from natural language
   */
  private static async togglePanel(parameters: any): Promise<boolean> {
    const { panel } = parameters
    
    if (!panel) return false
    
    const { toggleDockPanel } = useAppShell.getState()
    toggleDockPanel(panel)
    return true
  }
}

/**
 * Omnibox development utilities
 */
export const OmniboxDevUtils = {
  /**
   * Test intent classification with example inputs
   */
  testIntentClassification: async () => {
    const testInputs = [
      'create meeting with Dan tomorrow at 3pm',
      'schedule focus time every morning',
      'show me conflicts this week',
      'navigate to planner view',
      'toggle ai panel'
    ]
    
    for (const input of testInputs) {
      console.log(`Testing: "${input}"`)
      
      try {
        const response = await fetch('/api/omnibox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input })
        })
        
        const result = await response.text()
        console.log('Result:', result)
      } catch (error) {
        console.error('Test failed:', error)
      }
    }
  },
  
  /**
   * Validate performance targets
   */
  measurePerformance: async (input: string) => {
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/omnibox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      })
      
      const firstTokenTime = performance.now() - startTime
      
      // Research target: <400ms for first token
      if (firstTokenTime > 400) {
        console.warn(`⚠️ Omnibox first token: ${firstTokenTime.toFixed(2)}ms (target: <400ms)`)
      } else {
        console.log(`✅ Omnibox first token: ${firstTokenTime.toFixed(2)}ms`)
      }
      
      return firstTokenTime
    } catch (error) {
      console.error('Performance measurement failed:', error)
      return -1
    }
  }
}