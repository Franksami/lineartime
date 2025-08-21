'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Message, MessageProps } from './message'
import { useStickyBottom } from 'use-stick-to-bottom'

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: MessageProps[]
  isLoading?: boolean
}

export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ className, messages, isLoading, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const { scrollToBottom, isAtBottom } = useStickyBottom(scrollRef)
    
    React.useEffect(() => {
      if (isAtBottom) {
        scrollToBottom()
      }
    }, [messages, isAtBottom, scrollToBottom])
    
    return (
      <div 
        ref={ref}
        className={cn(
          'relative flex flex-col h-full',
          className
        )}
        {...props}
      >
        <ScrollArea 
          ref={scrollRef}
          className="flex-1 px-4"
        >
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <p>Start a conversation to get AI assistance</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message, index) => (
                  <Message 
                    key={index} 
                    {...message}
                  />
                ))}
                {isLoading && (
                  <Message 
                    role="assistant"
                    content=""
                    isLoading
                  />
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 z-10 rounded-full bg-background/80 backdrop-blur-sm border p-2 shadow-lg hover:bg-accent transition-colors"
            aria-label="Scroll to bottom"
          >
            <svg 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Conversation.displayName = 'Conversation'