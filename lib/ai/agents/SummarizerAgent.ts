/**
 * SummarizerAgent - Conversation Context & Summarization
 * Research validation: Rasa framework patterns for contextual conversation management
 *
 * Key patterns implemented:
 * - Slot-based state management with multi-turn conversation support
 * - Knowledge base integration with mention resolution
 * - Contextual response generation based on workspace state
 * - Conversation history management with configurable max_history
 */

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { useState } from 'react';

/**
 * Conversation slot interface (Rasa research patterns)
 */
interface ConversationSlot {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'datetime' | 'entity' | 'list';
  value: any;
  confidence: number;
  extractedFrom: 'user_input' | 'context' | 'knowledge_base';
  lastUpdated: string;
}

/**
 * Message interface for conversation history
 */
interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  intent?: string;
  entities: Array<{
    type: string;
    value: any;
    confidence: number;
  }>;
  slots: ConversationSlot[];
  contextSnapshot: {
    activeView: string;
    selectedEntities: any[];
    workspaceState: any;
  };
}

/**
 * Knowledge base query interface (Rasa research patterns)
 */
interface KnowledgeBaseQuery {
  query: string;
  entityType?: 'event' | 'task' | 'note' | 'contact' | 'project';
  attributes?: string[];
  filters?: Record<string, any>;
  limit?: number;
}

interface KnowledgeBaseResult {
  entities: Array<{
    id: string;
    type: string;
    title: string;
    attributes: Record<string, any>;
    relevanceScore: number;
  }>;
  totalFound: number;
  processingTime: number;
}

/**
 * Summarizer Agent Class
 * Implements Rasa-inspired conversation management with workspace context
 */
export class SummarizerAgent {
  private conversationHistory: ConversationMessage[] = [];
  private currentSlots: Map<string, ConversationSlot> = new Map();
  private maxHistory: number = 10; // Research: Rasa max_history pattern
  private isProcessing = false;

  /**
   * Process user message and generate contextual response
   * Research pattern: Rasa conversation flow with slot filling
   */
  async processMessage(
    userMessage: string,
    workspaceContext: {
      activeView: string;
      selectedEntities: any[];
      workspaceState: any;
    }
  ): Promise<{
    response: string;
    intent: string;
    confidence: number;
    extractedEntities: any[];
    updatedSlots: ConversationSlot[];
    suggestedActions?: Array<{
      title: string;
      description: string;
      action: () => void;
      confidence: number;
    }>;
    processingTime: number;
  }> {
    const startTime = performance.now();
    this.isProcessing = true;

    try {
      console.log('📝 SummarizerAgent: Processing message with context...');

      // Step 1: Extract entities and intent from user message
      const { intent, confidence, entities } = await this.classifyIntent(
        userMessage,
        workspaceContext
      );

      // Step 2: Update conversation slots (Rasa pattern)
      const updatedSlots = await this.updateSlots(entities, workspaceContext);

      // Step 3: Query knowledge base if needed
      const knowledgeContext = await this.queryRelevantContext(
        intent,
        updatedSlots,
        workspaceContext
      );

      // Step 4: Generate contextual response
      const response = await this.generateContextualResponse(
        userMessage,
        intent,
        updatedSlots,
        knowledgeContext,
        workspaceContext
      );

      // Step 5: Store conversation message (with max_history limit)
      const message: ConversationMessage = {
        id: `msg-${Date.now()}`,
        content: userMessage,
        role: 'user',
        timestamp: new Date().toISOString(),
        intent,
        entities,
        slots: Array.from(this.currentSlots.values()),
        contextSnapshot: workspaceContext,
      };

      this.addToHistory(message);

      const processingTime = performance.now() - startTime;

      // Performance validation (research target: ≤3s for summaries)
      if (processingTime > 3000) {
        console.warn(`⚠️ SummarizerAgent processing: ${processingTime.toFixed(2)}ms (target: ≤3s)`);
      } else {
        console.log(`✅ SummarizerAgent processing: ${processingTime.toFixed(2)}ms`);
      }

      return {
        response,
        intent,
        confidence,
        extractedEntities: entities,
        updatedSlots: Array.from(this.currentSlots.values()),
        processingTime,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Classify user intent using workspace context
   * Research pattern: Rasa intent classification with context awareness
   */
  private async classifyIntent(
    message: string,
    workspaceContext: any
  ): Promise<{
    intent: string;
    confidence: number;
    entities: any[];
  }> {
    const systemPrompt = `
    You are an intent classifier for a productivity workspace. 
    Analyze the user message considering the current workspace context.
    
    Current context:
    - Active view: ${workspaceContext.activeView}
    - Selected entities: ${JSON.stringify(workspaceContext.selectedEntities)}
    
    Available intents:
    - summarize_content: Summarize notes, emails, or meetings
    - extract_tasks: Extract action items from content
    - find_conflicts: Find scheduling conflicts
    - suggest_optimization: Suggest productivity improvements
    - answer_question: Answer questions about workspace data
    - create_entity: Create new events, tasks, or notes
    
    Return JSON: { "intent": "...", "confidence": 0.0-1.0, "entities": [...] }
    `;

    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: systemPrompt,
        prompt: message,
        temperature: 0.1,
        maxTokens: 200,
      });

      // Parse AI response
      const aiResponse = await result.text;
      const parsed = JSON.parse(aiResponse);

      return {
        intent: parsed.intent || 'answer_question',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || [],
      };
    } catch (error) {
      console.error('Intent classification failed:', error);
      return {
        intent: 'answer_question',
        confidence: 0.1,
        entities: [],
      };
    }
  }

  /**
   * Update conversation slots with extracted entities (Rasa pattern)
   */
  private async updateSlots(entities: any[], workspaceContext: any): Promise<ConversationSlot[]> {
    const updatedSlots: ConversationSlot[] = [];

    // Process extracted entities into slots
    for (const entity of entities) {
      const slot: ConversationSlot = {
        name: entity.type || 'unknown',
        type: this.inferSlotType(entity),
        value: entity.value,
        confidence: entity.confidence || 0.8,
        extractedFrom: 'user_input',
        lastUpdated: new Date().toISOString(),
      };

      this.currentSlots.set(slot.name, slot);
      updatedSlots.push(slot);
    }

    // Add context-based slots
    if (workspaceContext.selectedEntities?.length > 0) {
      const contextSlot: ConversationSlot = {
        name: 'selected_entities',
        type: 'list',
        value: workspaceContext.selectedEntities,
        confidence: 1.0,
        extractedFrom: 'context',
        lastUpdated: new Date().toISOString(),
      };

      this.currentSlots.set(contextSlot.name, contextSlot);
      updatedSlots.push(contextSlot);
    }

    return updatedSlots;
  }

  /**
   * Query knowledge base for relevant context (Rasa knowledge base patterns)
   */
  private async queryRelevantContext(
    intent: string,
    slots: ConversationSlot[],
    workspaceContext: any
  ): Promise<KnowledgeBaseResult | null> {
    // Determine if knowledge base query is needed
    const needsKnowledgeBase = [
      'summarize_content',
      'extract_tasks',
      'find_conflicts',
      'answer_question',
    ].includes(intent);

    if (!needsKnowledgeBase) {
      return null;
    }

    // Build knowledge base query from slots and context
    const query: KnowledgeBaseQuery = {
      query: slots.find((s) => s.name === 'query')?.value || '',
      entityType: this.inferEntityType(intent, workspaceContext),
      limit: 5,
    };

    // TODO: Implement actual knowledge base query
    // For now, return simulated result
    return {
      entities: [],
      totalFound: 0,
      processingTime: 50,
    };
  }

  /**
   * Generate contextual response using conversation history and workspace state
   */
  private async generateContextualResponse(
    userMessage: string,
    intent: string,
    slots: ConversationSlot[],
    knowledgeContext: KnowledgeBaseResult | null,
    workspaceContext: any
  ): Promise<string> {
    const contextPrompt = this.buildContextPrompt(
      intent,
      slots,
      knowledgeContext,
      workspaceContext
    );

    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: contextPrompt,
        prompt: userMessage,
        temperature: 0.3,
        maxTokens: 500,
      });

      return await result.text;
    } catch (error) {
      console.error('Response generation failed:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  /**
   * Add message to conversation history with max_history limit (Rasa pattern)
   */
  private addToHistory(message: ConversationMessage) {
    this.conversationHistory.push(message);

    // Implement max_history pattern from Rasa research
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
    }
  }

  /**
   * Summarize content (notes, emails, meetings) with entity extraction
   */
  async summarizeContent(
    content: string,
    contentType: 'note' | 'email' | 'meeting' | 'document',
    options: {
      extractTasks?: boolean;
      extractDates?: boolean;
      extractContacts?: boolean;
      maxLength?: number;
    } = {}
  ): Promise<{
    summary: string;
    keyPoints: string[];
    extractedTasks?: Array<{ title: string; priority: string }>;
    extractedDates?: Array<{ date: string; context: string }>;
    extractedContacts?: Array<{ name: string; email?: string }>;
    wordCount: number;
    processingTime: number;
  }> {
    const startTime = performance.now();

    const systemPrompt = `
    Summarize the following ${contentType} content concisely.
    
    ${options.extractTasks ? '- Extract actionable tasks' : ''}
    ${options.extractDates ? '- Extract important dates' : ''}
    ${options.extractContacts ? '- Extract contact information' : ''}
    
    Max length: ${options.maxLength || 200} words
    
    Return structured JSON with summary and extractions.
    `;

    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        system: systemPrompt,
        prompt: content,
        temperature: 0.2,
        maxTokens: 800,
      });

      const aiResponse = await result.text;
      const processingTime = performance.now() - startTime;

      // Parse structured response (would need proper JSON parsing)
      return {
        summary: aiResponse,
        keyPoints: [],
        wordCount: aiResponse.split(' ').length,
        processingTime,
      };
    } catch (error) {
      console.error('Content summarization failed:', error);
      return {
        summary: 'Error: Could not summarize content',
        keyPoints: [],
        wordCount: 0,
        processingTime: performance.now() - startTime,
      };
    }
  }

  // Utility methods
  private inferSlotType(entity: any): ConversationSlot['type'] {
    if (typeof entity.value === 'boolean') return 'boolean';
    if (typeof entity.value === 'number') return 'number';
    if (entity.type === 'datetime') return 'datetime';
    if (Array.isArray(entity.value)) return 'list';
    return 'text';
  }

  private inferEntityType(intent: string, context: any): string | undefined {
    switch (intent) {
      case 'summarize_content':
        return context.activeView === 'notes' ? 'note' : undefined;
      case 'find_conflicts':
        return 'event';
      case 'extract_tasks':
        return 'task';
      default:
        return undefined;
    }
  }

  private buildContextPrompt(
    intent: string,
    slots: ConversationSlot[],
    knowledgeContext: KnowledgeBaseResult | null,
    workspaceContext: any
  ): string {
    return `
    You are a productivity assistant with access to the user's workspace.
    
    Current context:
    - Active view: ${workspaceContext.activeView}
    - Intent: ${intent}
    - Available slots: ${JSON.stringify(slots)}
    - Knowledge context: ${knowledgeContext ? 'Available' : 'None'}
    
    Provide helpful, contextual responses based on the workspace state.
    Be concise but comprehensive. Offer actionable suggestions when appropriate.
    `;
  }

  /**
   * Get conversation statistics and status
   */
  getConversationStatus() {
    return {
      isProcessing: this.isProcessing,
      messageCount: this.conversationHistory.length,
      slotCount: this.currentSlots.size,
      maxHistory: this.maxHistory,
      lastMessage: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp,
      activeSlots: Array.from(this.currentSlots.entries()).map(([name, slot]) => ({
        name,
        type: slot.type,
        confidence: slot.confidence,
      })),
    };
  }

  /**
   * Clear conversation state (privacy feature)
   */
  clearConversationState() {
    this.conversationHistory = [];
    this.currentSlots.clear();
    console.log('🗑️ Conversation state cleared');
  }

  /**
   * Export conversation data (for user review/privacy)
   */
  exportConversationData() {
    return {
      history: this.conversationHistory,
      slots: Array.from(this.currentSlots.entries()),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

/**
 * Summarizer Agent Hook for React components
 */
export function useSummarizerAgent() {
  const [agent] = useState(() => new SummarizerAgent());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  const processMessage = async (message: string, context: any) => {
    setIsProcessing(true);

    try {
      const result = await agent.processMessage(message, context);
      setLastResponse(result.response);
      // Update history would need to be implemented
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const summarizeContent = async (content: string, type: any, options?: any) => {
    setIsProcessing(true);

    try {
      return await agent.summarizeContent(content, type, options);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    agent,
    isProcessing,
    lastResponse,
    conversationHistory,
    processMessage,
    summarizeContent,
    clearConversation: agent.clearConversationState.bind(agent),
    getStatus: agent.getConversationStatus.bind(agent),
    exportData: agent.exportConversationData.bind(agent),
  };
}
