'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface SuggestionProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export const Suggestion = React.forwardRef<HTMLDivElement, SuggestionProps>(
  ({ suggestions, onSelect, className }, ref) => {
    if (suggestions.length === 0) return null
    
    return (
      <div 
        ref={ref}
        className={cn(
          'flex flex-wrap gap-2 p-4 border-t',
          className
        )}
      >
        <span className="text-sm text-muted-foreground mr-2">
          Suggestions:
        </span>
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="h-auto py-1 px-3 text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    )
  }
)

Suggestion.displayName = 'Suggestion'