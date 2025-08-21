'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react'

export interface ActionProps {
  type: 'suggestSchedule' | 'explainConflicts' | 'listOpenSlots' | 'applyPlanPreview' | 'summarizePeriod'
  status: 'pending' | 'running' | 'completed' | 'failed'
  title: string
  description?: string
  result?: any
  error?: string
  onRetry?: () => void
}

export const Actions = React.forwardRef<HTMLDivElement, ActionProps>(
  ({ type, status, title, description, result, error, onRetry }, ref) => {
    const getIcon = () => {
      switch (type) {
        case 'suggestSchedule':
          return <Calendar className="h-4 w-4" />
        case 'explainConflicts':
          return <AlertCircle className="h-4 w-4" />
        case 'listOpenSlots':
          return <Clock className="h-4 w-4" />
        default:
          return <Calendar className="h-4 w-4" />
      }
    }
    
    const getStatusIcon = () => {
      switch (status) {
        case 'running':
          return <Loader2 className="h-4 w-4 animate-spin" />
        case 'completed':
          return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'failed':
          return <XCircle className="h-4 w-4 text-destructive" />
        default:
          return null
      }
    }
    
    return (
      <Card 
        ref={ref}
        className={cn(
          'p-3',
          status === 'running' && 'border-primary/50 bg-primary/5',
          status === 'completed' && 'border-green-500/50 bg-green-500/5',
          status === 'failed' && 'border-destructive/50 bg-destructive/5'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">{title}</h4>
              {getStatusIcon()}
            </div>
            
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            
            {status === 'completed' && result && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <pre className="whitespace-pre-wrap break-words">
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            {status === 'failed' && error && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-destructive">{error}</p>
                {onRetry && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onRetry}
                    className="h-7 text-xs"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }
)

Actions.displayName = 'Actions'