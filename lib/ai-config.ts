import { xai } from "@ai-sdk/xai"
import { groq } from "@ai-sdk/groq"

// Default model configurations
export const AI_MODELS = {
  CHAT: xai("grok-beta"), // Use Grok for chat interactions
  PARSING: groq("llama-3.1-70b-versatile"), // Use Groq for fast parsing
  SCHEDULING: xai("grok-beta"), // Use Grok for complex scheduling
} as const

// AI prompt templates
export const AI_PROMPTS = {
  EVENT_PARSER: `You are an expert calendar assistant. Parse the following natural language input into structured event data.

Extract:
- title: Event title
- startDate: Start date (YYYY-MM-DD format)
- endDate: End date (YYYY-MM-DD format, same as start if single day)
- category: One of "work", "personal", "meeting", "deadline", "travel"
- description: Brief description if provided

Input: "{input}"

Respond with valid JSON only:`,

  SCHEDULING_OPTIMIZER: `You are a scheduling optimization expert. Given the following events and constraints, suggest the optimal schedule.

Current events: {events}
New event request: {newEvent}
Constraints: {constraints}

Provide suggestions for:
1. Best time slots
2. Potential conflicts
3. Alternative dates
4. Duration recommendations

Respond with JSON:`,

  CHAT_ASSISTANT: `You are a helpful calendar assistant for a linear calendar application. You can:
- Help create, modify, and delete events
- Suggest optimal scheduling
- Resolve conflicts
- Answer questions about the calendar

Current calendar context: {context}
User message: {message}

Provide a helpful response:`,
} as const
