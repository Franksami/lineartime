'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Bot } from 'lucide-react'

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLoading?: boolean
  timestamp?: Date
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, content, isLoading, timestamp, ...props }, ref) => {
    const isUser = role === 'user'
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 p-4 group',
          isUser && 'flex-row-reverse',
          className
        )}
        {...props}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className={cn(
            'text-xs',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser && 'items-end'
        )}>
          <div className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted',
            isLoading && 'animate-pulse'
          )}>
            {isLoading ? (
              <div className="flex gap-1">
                <span className="animate-bounce delay-0">●</span>
                <span className="animate-bounce delay-75">●</span>
                <span className="animate-bounce delay-150">●</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{content}</div>
            )}
          </div>
          
          {timestamp && (
            <span className="text-xs text-muted-foreground px-1">
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Message.displayName = 'Message'