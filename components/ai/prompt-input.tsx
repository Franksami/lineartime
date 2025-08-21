'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, StopCircle } from 'lucide-react'

export interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
  maxLength?: number
}

export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    onSubmit, 
    onStop,
    isLoading, 
    placeholder = 'Type a message...', 
    maxLength = 1000,
    ...props 
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !isLoading) {
          onSubmit()
        }
      }
    }
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSubmit()
      }
    }
    
    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
      }
    }, [value])
    
    return (
      <div 
        ref={ref}
        className={cn(
          'border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={isLoading}
              className={cn(
                'min-h-[60px] max-h-[200px] resize-none pr-12',
                'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
              )}
              rows={1}
            />
            
            {maxLength && (
              <span className={cn(
                'absolute bottom-2 right-2 text-xs text-muted-foreground',
                value.length > maxLength * 0.9 && 'text-destructive'
              )}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
          
          {isLoading && onStop ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="shrink-0"
            >
              <StopCircle className="h-4 w-4" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!value.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </form>
      </div>
    )
  }
)

PromptInput.displayName = 'PromptInput'