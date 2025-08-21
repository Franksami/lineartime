'use client'

import * as React from 'react'
import { useChat } from 'ai/react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2, Bot } from 'lucide-react'
import { Conversation } from './conversation'
import { PromptInput } from './prompt-input'
import { Suggestion } from './suggestion'
import { Actions } from './actions'
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
  const [toolCalls, setToolCalls] = React.useState<any[]>([])
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/ai/chat',
    onToolCall: ({ toolCall }) => {
      setToolCalls(prev => [...prev, { ...toolCall, status: 'running' }])
    },
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
    handleInputChange({ target: { value: suggestion } } as any)
    handleSubmit()
  }
  
  const conversationMessages = React.useMemo(() => {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt ? new Date(msg.createdAt) : undefined
    }))
  }, [messages])
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full h-12 w-12 shadow-lg"
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
      isMinimized 
        ? 'bottom-4 right-4 w-80 h-14'
        : 'bottom-4 right-4 w-96 h-[600px] max-h-[80vh]',
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
            <Conversation 
              messages={conversationMessages}
              isLoading={isLoading}
            />
          </div>
          
          {/* Tool Calls Display */}
          {toolCalls.length > 0 && (
            <div className="p-3 border-t max-h-32 overflow-y-auto space-y-2">
              {toolCalls.slice(-2).map((tool, index) => (
                <Actions
                  key={index}
                  type={tool.name}
                  status={tool.status}
                  title={tool.name}
                  description={tool.description}
                  result={tool.result}
                  error={tool.error}
                />
              ))}
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Suggestion
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
            />
          )}
          
          {/* Input */}
          <PromptInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onStop={isLoading ? stop : undefined}
            isLoading={isLoading}
            placeholder="Ask about your schedule..."
          />
        </>
      )}
    </Card>
  )
}