'use client'

import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2, Bot, Calendar, Clock, AlertTriangle } from 'lucide-react'
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
  
  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/ai/chat',
    body: {
      events: events.slice(0, 100) // Send limited events to avoid payload size issues
    }
  })
  
  const suggestions = React.useMemo(() => {
    if (messages.length === 0) {
      return [
        'Plan my week',
        'Find free time tomorrow', 
        'Resolve scheduling conflicts',
        'Summarize this month'
      ]
    }
    return []
  }, [messages.length])
  
  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion)
    handleSubmit(new Event('submit') as any)
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
      
      {!isMinimized && (
        <>
          {/* Conversation */}
          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent>
                {messages.map((message) => (
                  <div key={message.id}>
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts?.map((part, i) => {
                          switch (part.type) {
                            case 'text':
                              return (
                                <Response key={`${message.id}-${i}`}>
                                  {part.text}
                                </Response>
                              )
                            case 'tool-call':
                              return (
                                <Tool
                                  key={`${message.id}-${i}`}
                                  toolName={part.toolName}
                                  status="completed"
                                >
                                  {part.toolName === 'suggestSchedule' && <Calendar className="h-4 w-4" />}
                                  {part.toolName === 'explainConflicts' && <AlertTriangle className="h-4 w-4" />}
                                  {part.toolName === 'listOpenSlots' && <Clock className="h-4 w-4" />}
                                  <span className="capitalize">{part.toolName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </Tool>
                              )
                            default:
                              return (
                                <Response key={`${message.id}-${i}`}>
                                  {message.content}
                                </Response>
                              )
                          }
                        }) || (
                          <Response>
                            {message.content}
                          </Response>
                        )}
                      </MessageContent>
                    </Message>
                  </div>
                ))}
                {status === 'streaming' && <Loader />}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-t">
              <Suggestions>
                {suggestions.map((suggestion, index) => (
                  <Suggestion
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    suggestion={suggestion}
                  />
                ))}
              </Suggestions>
            </div>
          )}
          
          {/* Input */}
          <div className="border-t">
            <PromptInput onSubmit={handleSubmit} className="m-3">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="Ask about your schedule..."
              />
              <PromptInputToolbar>
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