/**
 * RouterAgent - Intent Classification & Entity Routing  
 * Research validation: Rasa intent classification with confidence thresholds + entity routing
 * 
 * Key patterns implemented:
 * - Intent classification with confidence thresholds (≥0.8 auto-execute, <0.8 confirm)
 * - Entity conversion from emails, notes, and natural language
 * - Tool routing to appropriate MCP tools based on intent
 * - Multi-modal input processing (text, email, calendar data)
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { useState } from 'react'

/**
 * Intent classification result (Rasa research patterns)
 */
interface IntentClassification {
  intent: string
  confidence: number
  entities: Array<{
    type: string
    value: any
    confidence: number
    startIndex?: number
    endIndex?: number
  }>
  context: {
    sourceType: 'user_input' | 'email' | 'note' | 'calendar_event'
    sourceId?: string
    workspaceState: any
  }
  processingTime: number
}

/**
 * Entity conversion result for email/note to task/event transformation
 */
interface EntityConversion {
  id: string
  sourceType: 'email' | 'note' | 'text'
  sourceId: string
  targetType: 'event' | 'task' | 'note' | 'contact'
  
  extractedData: {
    title: string
    description?: string
    datetime?: string
    location?: string
    attendees?: string[]
    priority?: 'low' | 'medium' | 'high'
    tags?: string[]
    estimatedDuration?: number
  }
  
  confidence: number
  reasoning: string
  suggestedActions?: Array<{
    action: string
    description: string
    autoApprove: boolean
  }>
}

/**
 * Tool routing decision interface
 */
interface ToolRoutingDecision {
  toolName: string
  parameters: Record<string, any>
  confidence: number
  requiresConfirmation: boolean
  estimatedExecutionTime: number
  safetyLevel: 'auto_approve' | 'confirm' | 'manual_only'
}

/**
 * Router Agent Class
 * Handles intent classification, entity routing, and tool coordination
 */
export class RouterAgent {
  private isProcessing = false
  private routingHistory: Array<{
    intent: string
    route: ToolRoutingDecision
    executedAt: string
    success: boolean
  }> = []
  
  /**
   * Main routing method - classify intent and route to appropriate tools
   * Research pattern: Rasa intent classification with confidence-based routing
   */
  async routeRequest(
    input: string,
    sourceType: 'user_input' | 'email' | 'note' | 'calendar_event' = 'user_input',
    sourceId?: string,
    workspaceContext?: any
  ): Promise<{
    classification: IntentClassification
    routing: ToolRoutingDecision[]
    autoExecutable: boolean
    totalProcessingTime: number
  }> {
    const startTime = performance.now()
    this.isProcessing = true
    
    try {
      console.log(`🧭 RouterAgent: Classifying intent and routing request...`)
      
      // Step 1: Classify intent with workspace context
      const classification = await this.classifyIntent(input, sourceType, sourceId, workspaceContext)
      
      // Step 2: Determine tool routing based on intent
      const routing = await this.determineToolRouting(classification)
      
      // Step 3: Check if auto-executable (research: ≥0.8 confidence threshold)
      const autoExecutable = classification.confidence >= 0.8 && 
                             routing.every(r => r.safetyLevel === 'auto_approve')
      
      const totalProcessingTime = performance.now() - startTime
      
      // Performance validation (research target: ≤1s for classification)
      if (totalProcessingTime > 1000) {
        console.warn(`⚠️ RouterAgent processing: ${totalProcessingTime.toFixed(2)}ms (target: ≤1s)`)
      } else {
        console.log(`✅ RouterAgent processing: ${totalProcessingTime.toFixed(2)}ms`)
      }
      
      return {
        classification,
        routing,
        autoExecutable,
        totalProcessingTime
      }
      
    } finally {
      this.isProcessing = false
    }
  }
  
  /**
   * Convert email to structured entity (email-to-task/event conversion)
   */
  async convertEmailToEntity(
    emailContent: string,
    emailMetadata: {
      subject: string
      sender: string
      receivedAt: string
      hasAttachments?: boolean
    },
    targetType: 'auto' | 'event' | 'task' | 'note' = 'auto'
  ): Promise<EntityConversion> {
    const startTime = performance.now()
    
    const conversionPrompt = `
    Analyze this email and extract structured data for conversion to a productivity entity.
    
    Email Subject: ${emailMetadata.subject}
    From: ${emailMetadata.sender}
    Content: ${emailContent}
    
    ${targetType === 'auto' ? 'Determine the best entity type (event, task, or note) based on content.' : `Convert to ${targetType}.`}
    
    Extract:
    - Title (clear, actionable)
    - Description (concise summary)
    - Date/time (if mentioned)
    - Location (if mentioned) 
    - People involved
    - Priority level
    - Estimated duration
    - Relevant tags
    
    Return JSON with extracted data and confidence score.
    `
    
    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: conversionPrompt,
        prompt: `Convert this email to structured entity data.`,
        temperature: 0.2,
        maxTokens: 600
      })
      
      const aiResponse = await result.text
      const processingTime = performance.now() - startTime
      
      // Parse AI response (would need proper JSON parsing)
      const mockConversion: EntityConversion = {
        id: `conversion-${Date.now()}`,
        sourceType: 'email',
        sourceId: `email-${emailMetadata.subject}`,
        targetType: targetType === 'auto' ? 'event' : targetType, // Simplified
        extractedData: {
          title: emailMetadata.subject,
          description: emailContent.slice(0, 200),
          // TODO: Parse AI response for structured data
        },
        confidence: 0.85,
        reasoning: `Email contains meeting request patterns`,
        suggestedActions: [
          {
            action: 'create_calendar_event',
            description: 'Create calendar event from email details',
            autoApprove: true
          }
        ]
      }
      
      console.log(`✅ Email conversion completed (${processingTime.toFixed(2)}ms)`)
      return mockConversion
      
    } catch (error) {
      console.error('Email conversion failed:', error)
      throw error
    }
  }
  
  /**
   * Convert note content to tasks (task extraction from notes)
   */
  async extractTasksFromNote(
    noteContent: string,
    noteMetadata: {
      title: string
      tags: string[]
      createdAt: string
    }
  ): Promise<{
    extractedTasks: Array<{
      title: string
      description: string
      priority: 'low' | 'medium' | 'high'
      dueDate?: string
      estimatedHours?: number
      context: string // Where in note the task was found
    }>
    confidence: number
    processingTime: number
  }> {
    const startTime = performance.now()
    
    const extractionPrompt = `
    Extract actionable tasks from this note content.
    
    Note Title: ${noteMetadata.title}
    Tags: ${noteMetadata.tags.join(', ')}
    Content: ${noteContent}
    
    Look for:
    - Action items (TODO, [ ], must do, need to, etc.)
    - Deadlines and due dates
    - Assignments and responsibilities
    - Follow-up items
    
    Return structured task data with context.
    `
    
    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: extractionPrompt,
        prompt: 'Extract tasks from this note.',
        temperature: 0.1,
        maxTokens: 800
      })
      
      const processingTime = performance.now() - startTime
      
      // Mock task extraction for development
      const extractedTasks = [
        {
          title: 'Complete AI integration',
          description: 'Finish Phase 4 AI agent implementation',
          priority: 'high' as const,
          estimatedHours: 8,
          context: 'Action item from implementation notes'
        }
      ]
      
      return {
        extractedTasks,
        confidence: 0.82,
        processingTime
      }
      
    } catch (error) {
      console.error('Task extraction failed:', error)
      return {
        extractedTasks: [],
        confidence: 0,
        processingTime: performance.now() - startTime
      }
    }
  }
  
  /**
   * Classify intent with workspace context (Rasa patterns)
   */
  private async classifyIntent(
    input: string,
    sourceType: string,
    sourceId?: string,
    workspaceContext?: any
  ): Promise<IntentClassification> {
    const startTime = performance.now()
    
    const classificationPrompt = `
    Classify the intent of this user input within a productivity workspace context.
    
    Available intents:
    - create_event: Create calendar events
    - create_task: Create tasks or action items
    - create_note: Create notes or documents  
    - convert_email: Convert email to task/event/note
    - extract_tasks: Extract tasks from content
    - summarize_content: Summarize meetings, notes, emails
    - resolve_conflicts: Fix scheduling conflicts
    - find_information: Search for specific information
    - navigate_workspace: Switch views or navigate interface
    - manage_entities: Edit, delete, or organize existing items
    
    Context: ${JSON.stringify(workspaceContext)}
    Source: ${sourceType}
    
    Return JSON: { "intent": "...", "confidence": 0.0-1.0, "entities": [...] }
    `
    
    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: classificationPrompt,
        prompt: input,
        temperature: 0.1,
        maxTokens: 300
      })
      
      const aiResponse = await result.text
      const parsed = JSON.parse(aiResponse)
      const processingTime = performance.now() - startTime
      
      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities || [],
        context: {
          sourceType,
          sourceId,
          workspaceState: workspaceContext
        },
        processingTime
      }
      
    } catch (error) {
      console.error('Intent classification failed:', error)
      return {
        intent: 'find_information',
        confidence: 0.1,
        entities: [],
        context: { sourceType, sourceId, workspaceState: workspaceContext },
        processingTime: performance.now() - startTime
      }
    }
  }
  
  /**
   * Determine tool routing based on classified intent
   */
  private async determineToolRouting(classification: IntentClassification): Promise<ToolRoutingDecision[]> {
    const routing: ToolRoutingDecision[] = []
    
    switch (classification.intent) {
      case 'create_event':
        routing.push({
          toolName: 'calendar.createEvent',
          parameters: this.extractEventParameters(classification.entities),
          confidence: classification.confidence,
          requiresConfirmation: classification.confidence < 0.8,
          estimatedExecutionTime: 500,
          safetyLevel: classification.confidence >= 0.8 ? 'auto_approve' : 'confirm'
        })
        break
        
      case 'create_task':
        routing.push({
          toolName: 'tasks.create',
          parameters: this.extractTaskParameters(classification.entities),
          confidence: classification.confidence,
          requiresConfirmation: classification.confidence < 0.8,
          estimatedExecutionTime: 300,
          safetyLevel: 'auto_approve' // Task creation is generally safe
        })
        break
        
      case 'resolve_conflicts':
        routing.push({
          toolName: 'calendar.resolveConflicts',
          parameters: { range: 'current_week', policy: 'minimize_disruption' },
          confidence: classification.confidence,
          requiresConfirmation: true, // Always confirm conflict resolution
          estimatedExecutionTime: 2000,
          safetyLevel: 'confirm'
        })
        break
        
      case 'convert_email':
        routing.push({
          toolName: 'mail.convertToEntity',
          parameters: { 
            emailId: classification.context.sourceId,
            targetType: 'auto' // Let AI decide best conversion
          },
          confidence: classification.confidence,
          requiresConfirmation: classification.confidence < 0.9,
          estimatedExecutionTime: 1000,
          safetyLevel: 'confirm'
        })
        break
        
      case 'extract_tasks':
        routing.push({
          toolName: 'notes.extractTasks',
          parameters: this.extractNoteParameters(classification),
          confidence: classification.confidence,
          requiresConfirmation: false,
          estimatedExecutionTime: 1500,
          safetyLevel: 'auto_approve'
        })
        break
        
      default:
        // Default to summarization for unknown intents
        routing.push({
          toolName: 'summarize.content',
          parameters: { content: classification.context },
          confidence: 0.5,
          requiresConfirmation: true,
          estimatedExecutionTime: 2000,
          safetyLevel: 'manual_only'
        })
    }
    
    return routing
  }
  
  /**
   * Execute routing decision with tool safety (ImageSorcery MCP patterns)
   */
  async executeRouting(
    routing: ToolRoutingDecision[],
    options: { 
      dryRun?: boolean
      skipConfirmation?: boolean
      maxExecutionTime?: number
    } = {}
  ): Promise<{
    results: Array<{
      tool: string
      success: boolean
      result: any
      executionTime: number
      error?: string
    }>
    totalTime: number
    allSuccessful: boolean
  }> {
    const startTime = performance.now()
    const results = []
    
    console.log(`🧭 RouterAgent: Executing ${routing.length} tool routes...`)
    
    for (const route of routing) {
      const routeStart = performance.now()
      
      try {
        // Safety check: Confirm if required
        if (route.requiresConfirmation && !options.skipConfirmation && !options.dryRun) {
          const confirmed = confirm(`Execute ${route.toolName} with confidence ${(route.confidence * 100).toFixed(0)}%?`)
          if (!confirmed) {
            results.push({
              tool: route.toolName,
              success: false,
              result: null,
              executionTime: performance.now() - routeStart,
              error: 'User cancelled confirmation'
            })
            continue
          }
        }
        
        // Execute tool (or simulate for dry run)
        const result = options.dryRun 
          ? await this.simulateToolExecution(route)
          : await this.executeToolRoute(route)
        
        const executionTime = performance.now() - routeStart
        
        results.push({
          tool: route.toolName,
          success: true,
          result,
          executionTime
        })
        
        // Log routing success
        this.routingHistory.push({
          intent: route.toolName,
          route,
          executedAt: new Date().toISOString(),
          success: true
        })
        
      } catch (error) {
        console.error(`Tool execution failed: ${route.toolName}`, error)
        
        results.push({
          tool: route.toolName,
          success: false,
          result: null,
          executionTime: performance.now() - routeStart,
          error: error.message
        })
      }
    }
    
    const totalTime = performance.now() - startTime
    const allSuccessful = results.every(r => r.success)
    
    console.log(`✅ RouterAgent execution completed: ${results.length} tools (${totalTime.toFixed(2)}ms)`)
    
    return {
      results,
      totalTime,
      allSuccessful
    }
  }
  
  /**
   * Smart entity conversion from natural language or structured content
   */
  async convertToEntity(
    content: string,
    contentType: 'email' | 'note' | 'text',
    targetType: 'auto' | 'event' | 'task' | 'note',
    metadata?: any
  ): Promise<EntityConversion> {
    const conversionPrompt = `
    Convert this ${contentType} content to a structured ${targetType} entity.
    
    Content: ${content}
    ${metadata ? `Metadata: ${JSON.stringify(metadata)}` : ''}
    
    Extract structured data suitable for ${targetType === 'auto' ? 'the most appropriate entity type' : targetType}.
    
    Focus on:
    - Clear, actionable title
    - Relevant description
    - Date/time information (if any)
    - People involved
    - Location (if mentioned)
    - Priority indicators
    
    Return confidence score based on data quality and completeness.
    `
    
    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: conversionPrompt,
        prompt: `Convert to ${targetType} entity.`,
        temperature: 0.2,
        maxTokens: 500
      })
      
      const aiResponse = await result.text
      
      // Mock structured conversion for development
      return {
        id: `conversion-${Date.now()}`,
        sourceType: contentType,
        sourceId: metadata?.id || 'unknown',
        targetType: targetType === 'auto' ? 'task' : targetType,
        extractedData: {
          title: content.slice(0, 50) + '...',
          description: content.slice(0, 200),
          priority: 'medium'
        },
        confidence: 0.85,
        reasoning: `${contentType} content contains structured information suitable for ${targetType} conversion`,
        suggestedActions: [
          {
            action: `create_${targetType}`,
            description: `Create ${targetType} from extracted data`,
            autoApprove: true
          }
        ]
      }
      
    } catch (error) {
      console.error('Entity conversion failed:', error)
      throw error
    }
  }
  
  // Parameter extraction utilities
  private extractEventParameters(entities: any[]): Record<string, any> {
    const params: Record<string, any> = {}
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'datetime':
          params.start = entity.value
          break
        case 'duration':
          params.duration = entity.value
          break
        case 'location':
          params.location = entity.value
          break
        case 'person':
          if (!params.attendees) params.attendees = []
          params.attendees.push(entity.value)
          break
        case 'title':
          params.title = entity.value
          break
      }
    })
    
    return params
  }
  
  private extractTaskParameters(entities: any[]): Record<string, any> {
    const params: Record<string, any> = {}
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'title':
          params.title = entity.value
          break
        case 'priority':
          params.priority = entity.value
          break
        case 'duedate':
          params.dueDate = entity.value
          break
        case 'duration':
          params.estimatedHours = entity.value
          break
      }
    })
    
    return params
  }
  
  private extractNoteParameters(classification: IntentClassification): Record<string, any> {
    return {
      noteId: classification.context.sourceId,
      extractTasksOnly: true,
      includePriorities: true
    }
  }
  
  private async simulateToolExecution(route: ToolRoutingDecision): Promise<any> {
    // Simulate tool execution for dry runs
    return {
      tool: route.toolName,
      parameters: route.parameters,
      simulated: true,
      timestamp: new Date().toISOString()
    }
  }
  
  private async executeToolRoute(route: ToolRoutingDecision): Promise<any> {
    // TODO: Integrate with actual MCP tool system
    console.log(`Executing tool: ${route.toolName}`, route.parameters)
    
    return {
      tool: route.toolName,
      parameters: route.parameters,
      executed: true,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * Get routing statistics and performance metrics
   */
  getRoutingStatus() {
    const successRate = this.routingHistory.length > 0 
      ? (this.routingHistory.filter(h => h.success).length / this.routingHistory.length * 100)
      : 0
    
    return {
      isProcessing: this.isProcessing,
      totalRoutings: this.routingHistory.length,
      successRate: successRate.toFixed(1) + '%',
      recentRoutings: this.routingHistory.slice(-5),
      capabilities: [
        'intent classification with confidence thresholds',
        'email-to-entity conversion',
        'task extraction from notes',
        'tool routing with safety validation'
      ]
    }
  }
}

/**
 * Router Agent Hook for React components
 */
export function useRouterAgent() {
  const [agent] = useState(() => new RouterAgent())
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastRouting, setLastRouting] = useState<any>(null)
  
  const routeRequest = async (input: string, sourceType?: any, sourceId?: string, context?: any) => {
    setIsProcessing(true)
    
    try {
      const result = await agent.routeRequest(input, sourceType, sourceId, context)
      setLastRouting(result)
      return result
    } finally {
      setIsProcessing(false)
    }
  }
  
  const convertEmail = async (content: string, metadata: any, targetType?: any) => {
    setIsProcessing(true)
    
    try {
      return await agent.convertEmailToEntity(content, metadata, targetType)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const extractTasks = async (noteContent: string, metadata: any) => {
    setIsProcessing(true)
    
    try {
      return await agent.extractTasksFromNote(noteContent, metadata)
    } finally {
      setIsProcessing(false)
    }
  }
  
  return {
    agent,
    isProcessing,
    lastRouting,
    routeRequest,
    convertEmail,
    extractTasks,
    getStatus: agent.getRoutingStatus.bind(agent)
  }
}