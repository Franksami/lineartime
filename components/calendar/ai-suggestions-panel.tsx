'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

interface AISuggestion {
  type: 'conflict' | 'optimization' | 'grouping';
  message: string;
  confidence: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  dragFeedback?: {
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null;
  isAnalyzing?: boolean;
  onClear?: () => void;
  className?: string;
}

export function AISuggestionsPanel({
  suggestions,
  dragFeedback,
  isAnalyzing,
  onClear,
  className,
}: AISuggestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!suggestions.length && !dragFeedback && !isAnalyzing) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'optimization':
        return <Lightbulb className="w-4 h-4 text-primary" />;
      case 'grouping':
        return <Info className="w-4 h-4 text-purple-500 /* TODO: Use semantic token */" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500 /* TODO: Use semantic token */" />;
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 /* TODO: Use semantic token */" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500 /* TODO: Use semantic token */" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className={cn('fixed bottom-6 right-6 w-80 z-40 shadow-xl', className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600 /* TODO: Use semantic token */" />
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            {isAnalyzing && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {/* Real-time drag feedback */}
            {dragFeedback && (
              <div
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md text-sm',
                  dragFeedback.type === 'success' &&
                    'bg-green-50 /* TODO: Use semantic token */ text-green-700 /* TODO: Use semantic token */',
                  dragFeedback.type === 'warning' && 'bg-amber-50 text-amber-700',
                  dragFeedback.type === 'error' &&
                    'bg-red-50 /* TODO: Use semantic token */ text-red-700 /* TODO: Use semantic token */'
                )}
              >
                {getFeedbackIcon(dragFeedback.type)}
                <span>{dragFeedback.message}</span>
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-start gap-2">
                  {getIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{suggestion.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {suggestion.actions && suggestion.actions.length > 0 && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {suggestion.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        onClick={action.action}
                        className="h-7 px-2 text-xs bg-transparent"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  <div
                    className="w-1 h-1 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-1 h-1 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span>AI analyzing optimal scheduling...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
