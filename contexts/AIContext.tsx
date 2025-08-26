'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import type { Event } from '@/types/calendar'

/**
 * AI Context - Manages AI-powered features, suggestions, and natural language processing
 * Centralizes all AI-related functionality and state management
 */

export interface AISchedingSuggestion {
  id: string
  type: 'optimal_time' | 'conflict_resolution' | 'focus_time' | 'travel_time' | 'preparation'
  title: string
  description: string
  confidence: number // 0-1
  eventId?: string
  suggestedTime?: Date
  action: 'accept' | 'dismiss' | 'modify'
  metadata?: Record<string, any>
}

export interface NLPResult {
  id: string
  query: string
  parsedResult: {
    title?: string
    startDate?: Date
    endDate?: Date
    location?: string
    attendees?: string[]
    category?: string
    priority?: 'low' | 'medium' | 'high'
    recurring?: boolean
    description?: string
  }
  confidence: number
  status: 'parsing' | 'parsed' | 'error'
  error?: string
}

export interface AIAnalytics {
  patterns: {
    mostProductiveHours: number[]
    preferredMeetingDuration: number
    commonEventTypes: string[]
    busyDays: string[]
    freeTimeSlots: Array<{ start: Date; end: Date }>
  }
  insights: Array<{
    id: string
    type: 'productivity' | 'scheduling' | 'time_management' | 'worklife_balance'
    title: string
    description: string
    actionable: boolean
    priority: 'low' | 'medium' | 'high'
  }>
  recommendations: Array<{
    id: string
    title: string
    description: string
    category: 'scheduling' | 'productivity' | 'health'
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
    implemented: boolean
  }>
}

export interface AIAssistant {
  isActive: boolean
  conversationId: string | null
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    actions?: Array<{
      type: 'create_event' | 'modify_event' | 'suggest_time' | 'find_conflicts'
      data: any
    }>
  }>
  isTyping: boolean
  context: {
    currentView: 'calendar' | 'events' | 'analytics'
    selectedDate?: Date
    selectedEventId?: string
    recentActions: string[]
  }
}

export interface AIState {
  // Feature flags
  enabled: boolean
  features: {
    scheduling: boolean
    nlpParsing: boolean
    conflictDetection: boolean
    timeOptimization: boolean
    smartSuggestions: boolean
    assistant: boolean
  }
  
  // Scheduling AI
  suggestions: AISchedingSuggestion[]
  pendingSuggestions: number
  
  // Natural Language Processing
  nlpResults: NLPResult[]
  currentNLPQuery: string
  nlpProcessing: boolean
  
  // Analytics & Insights
  analytics: AIAnalytics
  analyticsLastUpdated: Date | null
  
  // AI Assistant
  assistant: AIAssistant
  
  // Learning & Preferences
  userPreferences: {
    workingHours: { start: number; end: number }
    preferredMeetingLength: number
    breakDuration: number
    focusTimePreference: 'morning' | 'afternoon' | 'evening'
    commutingTime: number
    automaticSuggestions: boolean
    learningEnabled: boolean
  }
  
  // Performance & Usage
  usage: {
    totalSuggestions: number
    acceptedSuggestions: number
    nlpQueries: number
    assistantConversations: number
  }
  
  // API State
  apiStatus: {
    provider: 'openai' | 'anthropic' | 'groq' | 'xai'
    connected: boolean
    rateLimited: boolean
    lastError?: string
  }
}

export type AIAction =
  | { type: 'TOGGLE_AI'; payload: boolean }
  | { type: 'SET_FEATURE'; payload: { feature: keyof AIState['features']; enabled: boolean } }
  | { type: 'ADD_SUGGESTION'; payload: AISchedingSuggestion }
  | { type: 'UPDATE_SUGGESTION'; payload: { id: string; updates: Partial<AISchedingSuggestion> } }
  | { type: 'REMOVE_SUGGESTION'; payload: string }
  | { type: 'CLEAR_SUGGESTIONS' }
  | { type: 'START_NLP_PROCESSING'; payload: string }
  | { type: 'ADD_NLP_RESULT'; payload: NLPResult }
  | { type: 'UPDATE_NLP_RESULT'; payload: { id: string; updates: Partial<NLPResult> } }
  | { type: 'CLEAR_NLP_RESULTS' }
  | { type: 'UPDATE_ANALYTICS'; payload: Partial<AIAnalytics> }
  | { type: 'START_ASSISTANT_CONVERSATION' }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: AIAssistant['messages'][0] }
  | { type: 'SET_ASSISTANT_TYPING'; payload: boolean }
  | { type: 'UPDATE_ASSISTANT_CONTEXT'; payload: Partial<AIAssistant['context']> }
  | { type: 'END_ASSISTANT_CONVERSATION' }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<AIState['userPreferences']> }
  | { type: 'UPDATE_USAGE_STATS'; payload: Partial<AIState['usage']> }
  | { type: 'UPDATE_API_STATUS'; payload: Partial<AIState['apiStatus']> }
  | { type: 'BATCH_UPDATE'; payload: Partial<AIState> }

const initialUserPreferences: AIState['userPreferences'] = {
  workingHours: { start: 9, end: 17 },
  preferredMeetingLength: 30,
  breakDuration: 15,
  focusTimePreference: 'morning',
  commutingTime: 30,
  automaticSuggestions: true,
  learningEnabled: true
}

const initialAnalytics: AIAnalytics = {
  patterns: {
    mostProductiveHours: [9, 10, 14, 15],
    preferredMeetingDuration: 30,
    commonEventTypes: ['meeting', 'work', 'focus'],
    busyDays: ['Tuesday', 'Wednesday', 'Thursday'],
    freeTimeSlots: []
  },
  insights: [],
  recommendations: []
}

const initialAssistant: AIAssistant = {
  isActive: false,
  conversationId: null,
  messages: [],
  isTyping: false,
  context: {
    currentView: 'calendar',
    recentActions: []
  }
}

const initialAIState: AIState = {
  enabled: true,
  features: {
    scheduling: true,
    nlpParsing: true,
    conflictDetection: true,
    timeOptimization: true,
    smartSuggestions: true,
    assistant: true
  },
  
  suggestions: [],
  pendingSuggestions: 0,
  
  nlpResults: [],
  currentNLPQuery: '',
  nlpProcessing: false,
  
  analytics: initialAnalytics,
  analyticsLastUpdated: null,
  
  assistant: initialAssistant,
  
  userPreferences: initialUserPreferences,
  
  usage: {
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    nlpQueries: 0,
    assistantConversations: 0
  },
  
  apiStatus: {
    provider: 'openai',
    connected: true,
    rateLimited: false
  }
}

function aiReducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'TOGGLE_AI':
      return { ...state, enabled: action.payload }
    
    case 'SET_FEATURE':
      return {
        ...state,
        features: {
          ...state.features,
          [action.payload.feature]: action.payload.enabled
        }
      }
    
    case 'ADD_SUGGESTION':
      return {
        ...state,
        suggestions: [...state.suggestions, action.payload],
        pendingSuggestions: state.pendingSuggestions + 1,
        usage: {
          ...state.usage,
          totalSuggestions: state.usage.totalSuggestions + 1
        }
      }
    
    case 'UPDATE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.map(suggestion =>
          suggestion.id === action.payload.id
            ? { ...suggestion, ...action.payload.updates }
            : suggestion
        ),
        pendingSuggestions: action.payload.updates.action === 'accept' 
          ? Math.max(0, state.pendingSuggestions - 1)
          : state.pendingSuggestions,
        usage: action.payload.updates.action === 'accept'
          ? { ...state.usage, acceptedSuggestions: state.usage.acceptedSuggestions + 1 }
          : state.usage
      }
    
    case 'REMOVE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.filter(s => s.id !== action.payload),
        pendingSuggestions: Math.max(0, state.pendingSuggestions - 1)
      }
    
    case 'CLEAR_SUGGESTIONS':
      return {
        ...state,
        suggestions: [],
        pendingSuggestions: 0
      }
    
    case 'START_NLP_PROCESSING':
      return {
        ...state,
        currentNLPQuery: action.payload,
        nlpProcessing: true,
        usage: {
          ...state.usage,
          nlpQueries: state.usage.nlpQueries + 1
        }
      }
    
    case 'ADD_NLP_RESULT':
      return {
        ...state,
        nlpResults: [...state.nlpResults, action.payload],
        nlpProcessing: false,
        currentNLPQuery: ''
      }
    
    case 'UPDATE_NLP_RESULT':
      return {
        ...state,
        nlpResults: state.nlpResults.map(result =>
          result.id === action.payload.id
            ? { ...result, ...action.payload.updates }
            : result
        )
      }
    
    case 'CLEAR_NLP_RESULTS':
      return {
        ...state,
        nlpResults: []
      }
    
    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          ...action.payload
        },
        analyticsLastUpdated: new Date()
      }
    
    case 'START_ASSISTANT_CONVERSATION':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          isActive: true,
          conversationId: `conv_${Date.now()}`,
          messages: []
        },
        usage: {
          ...state.usage,
          assistantConversations: state.usage.assistantConversations + 1
        }
      }
    
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          messages: [...state.assistant.messages, action.payload]
        }
      }
    
    case 'SET_ASSISTANT_TYPING':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          isTyping: action.payload
        }
      }
    
    case 'UPDATE_ASSISTANT_CONTEXT':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          context: {
            ...state.assistant.context,
            ...action.payload
          }
        }
      }
    
    case 'END_ASSISTANT_CONVERSATION':
      return {
        ...state,
        assistant: {
          ...initialAssistant
        }
      }
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      }
    
    case 'UPDATE_USAGE_STATS':
      return {
        ...state,
        usage: {
          ...state.usage,
          ...action.payload
        }
      }
    
    case 'UPDATE_API_STATUS':
      return {
        ...state,
        apiStatus: {
          ...state.apiStatus,
          ...action.payload
        }
      }
    
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload
      }
    
    default:
      return state
  }
}

export interface AIContextValue {
  state: AIState
  dispatch: React.Dispatch<AIAction>
  
  // Core AI controls
  toggleAI: (enabled: boolean) => void
  setFeature: (feature: keyof AIState['features'], enabled: boolean) => void
  
  // Scheduling suggestions
  addSuggestion: (suggestion: AISchedingSuggestion) => void
  updateSuggestion: (id: string, updates: Partial<AISchedingSuggestion>) => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void
  clearSuggestions: () => void
  
  // Natural Language Processing
  parseNaturalLanguage: (query: string) => Promise<NLPResult>
  addNLPResult: (result: NLPResult) => void
  clearNLPResults: () => void
  
  // Analytics & Insights
  updateAnalytics: (analytics: Partial<AIAnalytics>) => void
  generateInsights: (events: Event[]) => void
  
  // AI Assistant
  startAssistantConversation: () => void
  sendAssistantMessage: (content: string) => void
  endAssistantConversation: () => void
  
  // User preferences
  updatePreferences: (preferences: Partial<AIState['userPreferences']>) => void
  
  // Utility methods
  isFeatureEnabled: (feature: keyof AIState['features']) => boolean
  getSuggestionsForEvent: (eventId: string) => AISchedingSuggestion[]
  batchUpdate: (updates: Partial<AIState>) => void
}

const AIContext = createContext<AIContextValue | undefined>(undefined)

export interface AIProviderProps {
  children: ReactNode
}

export function AIProvider({ children }: AIProviderProps) {
  const [state, dispatch] = useReducer(aiReducer, initialAIState)
  
  // Core AI controls
  const toggleAI = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_AI', payload: enabled })
  }, [])
  
  const setFeature = useCallback((feature: keyof AIState['features'], enabled: boolean) => {
    dispatch({ type: 'SET_FEATURE', payload: { feature, enabled } })
  }, [])
  
  // Scheduling suggestions
  const addSuggestion = useCallback((suggestion: AISchedingSuggestion) => {
    dispatch({ type: 'ADD_SUGGESTION', payload: suggestion })
  }, [])
  
  const updateSuggestion = useCallback((id: string, updates: Partial<AISchedingSuggestion>) => {
    dispatch({ type: 'UPDATE_SUGGESTION', payload: { id, updates } })
  }, [])
  
  const acceptSuggestion = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_SUGGESTION', payload: { id, updates: { action: 'accept' } } })
  }, [])
  
  const dismissSuggestion = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_SUGGESTION', payload: id })
  }, [])
  
  const clearSuggestions = useCallback(() => {
    dispatch({ type: 'CLEAR_SUGGESTIONS' })
  }, [])
  
  // Natural Language Processing
  const parseNaturalLanguage = useCallback(async (query: string): Promise<NLPResult> => {
    dispatch({ type: 'START_NLP_PROCESSING', payload: query })
    
    // This would integrate with the actual AI service
    // For now, return a mock result
    const result: NLPResult = {
      id: `nlp_${Date.now()}`,
      query,
      parsedResult: {
        title: query,
        startDate: new Date(),
        category: 'personal'
      },
      confidence: 0.8,
      status: 'parsed'
    }
    
    dispatch({ type: 'ADD_NLP_RESULT', payload: result })
    return result
  }, [])
  
  const addNLPResult = useCallback((result: NLPResult) => {
    dispatch({ type: 'ADD_NLP_RESULT', payload: result })
  }, [])
  
  const clearNLPResults = useCallback(() => {
    dispatch({ type: 'CLEAR_NLP_RESULTS' })
  }, [])
  
  // Analytics & Insights
  const updateAnalytics = useCallback((analytics: Partial<AIAnalytics>) => {
    dispatch({ type: 'UPDATE_ANALYTICS', payload: analytics })
  }, [])
  
  const generateInsights = useCallback((events: Event[]) => {
    // AI-powered insights generation based on events
    // This would call the actual AI service
    const insights = {
      insights: [
        {
          id: 'productivity_insight',
          type: 'productivity' as const,
          title: 'Peak Productivity Hours',
          description: 'You\'re most productive between 9-11 AM and 2-4 PM',
          actionable: true,
          priority: 'medium' as const
        }
      ]
    }
    
    dispatch({ type: 'UPDATE_ANALYTICS', payload: insights })
  }, [])
  
  // AI Assistant
  const startAssistantConversation = useCallback(() => {
    dispatch({ type: 'START_ASSISTANT_CONVERSATION' })
  }, [])
  
  const sendAssistantMessage = useCallback((content: string) => {
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: new Date()
    }
    
    dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: userMessage })
    dispatch({ type: 'SET_ASSISTANT_TYPING', payload: true })
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: `I understand you want to "${content}". Let me help you with that.`,
        timestamp: new Date()
      }
      
      dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: assistantMessage })
      dispatch({ type: 'SET_ASSISTANT_TYPING', payload: false })
    }, 1500)
  }, [])
  
  const endAssistantConversation = useCallback(() => {
    dispatch({ type: 'END_ASSISTANT_CONVERSATION' })
  }, [])
  
  // User preferences
  const updatePreferences = useCallback((preferences: Partial<AIState['userPreferences']>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences })
  }, [])
  
  // Utility methods
  const isFeatureEnabled = useCallback((feature: keyof AIState['features']) => {
    return state.enabled && state.features[feature]
  }, [state.enabled, state.features])
  
  const getSuggestionsForEvent = useCallback((eventId: string) => {
    return state.suggestions.filter(suggestion => suggestion.eventId === eventId)
  }, [state.suggestions])
  
  const batchUpdate = useCallback((updates: Partial<AIState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates })
  }, [])
  
  const contextValue: AIContextValue = {
    state,
    dispatch,
    toggleAI,
    setFeature,
    addSuggestion,
    updateSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions,
    parseNaturalLanguage,
    addNLPResult,
    clearNLPResults,
    updateAnalytics,
    generateInsights,
    startAssistantConversation,
    sendAssistantMessage,
    endAssistantConversation,
    updatePreferences,
    isFeatureEnabled,
    getSuggestionsForEvent,
    batchUpdate
  }
  
  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  )
}

export function useAIContext() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIProvider')
  }
  return context
}

// Specialized hooks for specific AI concerns
export function useAISuggestions() {
  const { state, addSuggestion, acceptSuggestion, dismissSuggestion, clearSuggestions } = useAIContext()
  return {
    suggestions: state.suggestions,
    pendingSuggestions: state.pendingSuggestions,
    addSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions
  }
}

export function useNaturalLanguageProcessing() {
  const { state, parseNaturalLanguage, clearNLPResults } = useAIContext()
  return {
    nlpResults: state.nlpResults,
    currentQuery: state.currentNLPQuery,
    processing: state.nlpProcessing,
    parseNaturalLanguage,
    clearNLPResults
  }
}

export function useAIAssistant() {
  const { state, startAssistantConversation, sendAssistantMessage, endAssistantConversation } = useAIContext()
  return {
    assistant: state.assistant,
    startConversation: startAssistantConversation,
    sendMessage: sendAssistantMessage,
    endConversation: endAssistantConversation
  }
}

export function useAIAnalytics() {
  const { state, updateAnalytics, generateInsights } = useAIContext()
  return {
    analytics: state.analytics,
    lastUpdated: state.analyticsLastUpdated,
    updateAnalytics,
    generateInsights
  }
}