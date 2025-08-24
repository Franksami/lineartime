'use client'

import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2, Bot, Calendar, Clock, AlertTriangle, Wand2, Sparkles } from 'lucide-react'
import { 
  Conversation, 
  ConversationContent, 
  ConversationScrollButton 
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { 
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputTools
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { Tool } from '@/components/ai-elements/tool'
import { Response } from '@/components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader'
// 🚀 NEW: Enhanced AI features from v0
import { NaturalLanguageParser } from './natural-language-parser'
import { AIChatInterface } from './ai-chat-interface'
import { AICalendarService } from '@/lib/ai-services'
import type { Event } from '@/types/calendar'

interface AssistantPanelProps {
  events?: Event[]
  onEventCreate?: (event: Partial<Event>) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  className?: string
}

export function AssistantPanel({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className
}: AssistantPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [isMobile, setIsMobile] = React.useState(false)
  
  // 🚀 NEW: Enhanced AI features state
  const [activeTab, setActiveTab] = React.useState<'chat' | 'parser' | 'ai-chat'>('chat')
  const [isParsingEvent, setIsParsingEvent] = React.useState(false)
  const [parsedEvent, setParsedEvent] = React.useState<Partial<Event> | null>(null)
  const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([])
  
  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const { messages, sendMessage, status } = useChat()
  
  // 🚀 NEW: Enhanced AI event parsing
  const handleNaturalLanguageParse = async (text: string) => {
    if (!text.trim()) return
    
    setIsParsingEvent(true)
    try {
      // Use the new AI service for natural language parsing
      const parsedEvent = await AICalendarService.parseEventFromText(text)
      if (parsedEvent && onEventCreate) {
        // Convert the parsed event to your Event type
        const newEvent: Partial<Event> = {
          title: parsedEvent.title,
          startDate: new Date(parsedEvent.startDate),
          endDate: new Date(parsedEvent.endDate),
          category: parsedEvent.category as any,
          description: parsedEvent.description || ''
        }
        
        onEventCreate(newEvent)
        setParsedEvent(newEvent)
        
        // Show success message
        sendMessage({ 
          text: `I've successfully created the event "${parsedEvent.title}" for ${new Date(parsedEvent.startDate).toLocaleDateString()}. You can see it on your calendar now!` 
        })
      }
    } catch (error) {
      console.error('AI parsing error:', error)
      sendMessage({ 
        text: "I'm sorry, I couldn't parse that event. Please try rephrasing it or use a different format." 
      })
    } finally {
      setIsParsingEvent(false)
    }
  }
  
  // 🚀 NEW: AI-powered scheduling suggestions
  const handleAISchedulingSuggestion = async () => {
    try {
      const suggestions = await AICalendarService.getSchedulingSuggestions(events, {
        timeRange: 'week',
        includeConflicts: true,
        optimizeFor: 'productivity'
      })
      
      if (suggestions) {
        sendMessage({ 
          text: `Here are some AI-powered scheduling suggestions for your week:\n\n${suggestions.bestTimeSlots?.map(slot => `• ${slot.date} at ${slot.time} (${Math.round(slot.confidence * 100)}% confidence)`).join('\n') || 'No specific suggestions available.'}` 
        })
      }
    } catch (error) {
      console.error('AI scheduling error:', error)
      sendMessage({ 
        text: "I couldn't generate scheduling suggestions right now. Please try again later." 
      })
    }
  }
  
  const suggestions = React.useMemo(() => {
    if (messages.length === 0) {
      return [
        'Plan my week',
        'Find free time tomorrow', 
        'Resolve scheduling conflicts',
        'Summarize this month',
        // 🚀 NEW: AI-enhanced suggestions
        'AI: Optimize my schedule',
        'AI: Find best meeting times',
        'AI: Resolve conflicts automatically'
      ]
    }
    return []
  }, [messages.length])
  
  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion)
    // Trigger form submission programmatically
    const syntheticEvent = {
      preventDefault: () => {}
    } as React.FormEvent
    handleSubmit(syntheticEvent)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status !== 'streaming') {
      sendMessage({ text: input })
      setInput('')
    }
  }
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 rounded-full shadow-lg",
          isMobile 
            ? "bottom-20 right-4 h-14 w-14" // Mobile: Higher up to avoid nav
            : "bottom-4 right-4 h-12 w-12"   // Desktop: Standard position
        )}
        size="icon"
      >
        <Bot className="h-5 w-5" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    )
  }
  
  return (
    <Card className={cn(
      'fixed z-40 shadow-2xl transition-all duration-300',
      isMobile ? (
        // Mobile: Full screen
        isMinimized 
          ? 'bottom-0 left-0 right-0 h-14'
          : 'inset-0 rounded-none'
      ) : (
        // Desktop: Floating panel
        isMinimized 
          ? 'bottom-4 right-4 w-80 h-14'
          : 'bottom-4 right-4 w-96 h-[600px] max-h-[80vh]'
      ),
      'flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">
              {isMinimized ? 'Maximize' : 'Minimize'}
            </span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
      
      {/* 🚀 NEW: Tab Navigation */}
      {!isMinimized && (
        <div className="flex border-b bg-muted/30">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'chat' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Bot className="w-4 h-4" />
              Chat
            </div>
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'parser' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Wand2 className="w-4 h-4" />
              Parser
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai-chat')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'ai-chat' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4" />
              AI Chat
            </div>
          </button>
        </div>
      )}
      
      {!isMinimized && (
        <>
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === 'chat' && (
              <>
                {/* Original Chat Interface */}
                <Conversation className="h-full">
                  <ConversationContent className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <Message from={message.role} key={message.id}>
                          <MessageContent>
                            <Response>
                              {typeof message === 'object' && 'content' in message ? message.content : 'Message content unavailable'}
                            </Response>
                          </MessageContent>
                        </Message>
                      </div>
                    ))}
                    {status === 'streaming' && <Loader />}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
                
                {/* Enhanced Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-4 p-3 border-t">
                    <Suggestions>
                      {suggestions.map((suggestion, index) => (
                        <Suggestion
                          key={index}
                          onClick={() => {
                            if (suggestion.startsWith('AI:')) {
                              // Handle AI-enhanced suggestions
                              if (suggestion.includes('Optimize')) {
                                handleAISchedulingSuggestion()
                              } else if (suggestion.includes('Find best meeting times')) {
                                handleAISchedulingSuggestion()
                              } else if (suggestion.includes('Resolve conflicts')) {
                                sendMessage({ text: 'I\'ll analyze your calendar for conflicts and suggest resolutions.' })
                              }
                            } else {
                              handleSuggestionSelect(suggestion)
                            }
                          }}
                          suggestion={suggestion}
                        />
                      ))}
                    </Suggestions>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'parser' && (
              <div className="h-full">
                <NaturalLanguageParser 
                  onEventParsed={(event) => {
                    if (onEventCreate) {
                      onEventCreate(event as any)
                      setActiveTab('chat')
                      sendMessage({ 
                        text: `I've successfully created the event "${event.title}"! You can see it on your calendar now.` 
                      })
                    }
                  }}
                />
              </div>
            )}
            
            {activeTab === 'ai-chat' && (
              <div className="h-full">
                <AIChatInterface 
                  events={events as any}
                  onEventCreate={(event) => {
                    if (onEventCreate) {
                      onEventCreate(event as any)
                      setActiveTab('chat')
                    }
                  }}
                  onEventUpdate={(eventId, updates) => {
                    if (onEventUpdate) {
                      onEventUpdate(eventId, updates as any)
                    }
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="border-t p-3">
            <PromptInput onSubmit={handleSubmit} className="rounded-lg">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="Ask about your schedule..."
                className="min-h-[60px]"
              />
              <PromptInputToolbar className="px-2 pb-2">
                <PromptInputTools>
                  {/* Tool buttons could go here */}
                </PromptInputTools>
                <PromptInputSubmit 
                  disabled={!input.trim()} 
                  status={status} 
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </>
      )}
    </Card>
  )
}