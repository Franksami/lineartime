/**
 * Conflicts Panel - Real-Time Conflict Visualization
 * Research validation: Timefold AI constraint solving + Motion conflict repair UX
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  Play,
  Square,
  RotateCcw,
  Eye,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { useConflictAgent } from '@/lib/ai/agents/ConflictAgent'
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags'
import { cn } from '@/lib/utils'

/**
 * Conflicts Panel Hook
 */
function useConflictsPanel() {
  const conflictAgent = useConflictAgent()
  const [selectedConflict, setSelectedConflict] = useState<any>(null)
  const [resolutionInProgress, setResolutionInProgress] = useState<string | null>(null)
  const conflictsPanelEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_CONFLICTS_PANEL)
  
  // Start monitoring on mount
  useEffect(() => {
    if (conflictsPanelEnabled && !conflictAgent.isMonitoring) {
      conflictAgent.startMonitoring(async () => {
        // TODO: Get real calendar data
        return { events: [], tasks: [] }
      })
    }
    
    return () => {
      if (conflictAgent.isMonitoring) {
        conflictAgent.stopMonitoring()
      }
    }
  }, [conflictsPanelEnabled])
  
  const applyResolution = async (conflict: any, resolution: any) => {
    setResolutionInProgress(resolution.id)
    
    try {
      const result = await conflictAgent.applyResolution(resolution, { notify: true })
      
      if (result.success) {
        console.log(`✅ Conflict resolution applied: ${resolution.title}`)
        // Remove resolved conflict from list
        conflictAgent.clearConflicts()
      } else {
        console.error(`❌ Resolution failed: ${result}`)
      }
      
    } finally {
      setResolutionInProgress(null)
    }
  }
  
  const previewResolution = async (conflict: any, resolution: any) => {
    console.log(`👁️ Previewing resolution: ${resolution.title}`)
    
    try {
      const result = await conflictAgent.applyResolution(resolution, { dryRun: true })
      console.log('Preview result:', result)
      
      // Show preview modal or update UI with preview data
      return result
    } catch (error) {
      console.error('Preview failed:', error)
    }
  }
  
  return {
    conflicts: conflictAgent.conflicts,
    isMonitoring: conflictAgent.isMonitoring,
    selectedConflict,
    setSelectedConflict,
    resolutionInProgress,
    applyResolution,
    previewResolution,
    startMonitoring: conflictAgent.startMonitoring,
    stopMonitoring: conflictAgent.stopMonitoring,
    getStatus: conflictAgent.getStatus,
    conflictsPanelEnabled
  }
}

/**
 * Conflict Card Component
 */
function ConflictCard({ 
  conflict, 
  isSelected, 
  onSelect, 
  onApplyResolution,
  onPreviewResolution,
  resolutionInProgress
}: {
  conflict: any
  isSelected: boolean
  onSelect: () => void
  onApplyResolution: (resolution: any) => void
  onPreviewResolution: (resolution: any) => void
  resolutionInProgress: string | null
}) {
  const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-200 text-red-900 border-red-300'
  }
  
  return (
    <Card className={cn(
      'cursor-pointer transition-all duration-200',
      isSelected && 'ring-2 ring-primary bg-primary/5',
      'hover:shadow-sm'
    )} onClick={onSelect}>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Conflict header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                'h-4 w-4',
                conflict.severity === 'critical' ? 'text-red-600' :
                conflict.severity === 'high' ? 'text-red-500' :
                conflict.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
              )} />
              <span className="text-sm font-medium line-clamp-1">
                {conflict.description}
              </span>
            </div>
            
            <Badge className={cn('text-xs', severityColors[conflict.severity])}>
              {conflict.severity}
            </Badge>
          </div>
          
          {/* Affected entities */}
          <div className="space-y-1">
            {conflict.entities?.slice(0, 2).map((entity: any, index: number) => (
              <div key={entity.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                {entity.type === 'event' && <Calendar className="h-3 w-3" />}
                {entity.type === 'task' && <Clock className="h-3 w-3" />}
                <span className="truncate">{entity.title}</span>
              </div>
            ))}
            
            {conflict.entities?.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{conflict.entities.length - 2} more entities
              </div>
            )}
          </div>
          
          {/* Time and impact info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round((conflict.timeRange?.duration || 0) / 60000)}min overlap</span>
            </div>
            
            {conflict.impact?.attendeesAffected && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{conflict.impact.attendeesAffected} affected</span>
              </div>
            )}
          </div>
          
          {/* Resolution suggestions */}
          {isSelected && conflict.suggestions && conflict.suggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-xs font-medium">Resolutions ({conflict.suggestions.length})</div>
              
              {conflict.suggestions.slice(0, 2).map((resolution: any, index: number) => (
                <div key={resolution.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <div className="font-medium">{resolution.title}</div>
                      <div className="text-muted-foreground">{resolution.description}</div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {(resolution.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreviewResolution(resolution)
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onApplyResolution(resolution)
                      }}
                      className="h-6 px-2 text-xs"
                      disabled={resolutionInProgress === resolution.id}
                    >
                      {resolutionInProgress === resolution.id ? (
                        <Clock className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Monitoring Controls Component
 */
function ConflictMonitoringControls({ 
  isMonitoring, 
  onToggleMonitoring, 
  conflictCount,
  lastScan 
}: {
  isMonitoring: boolean
  onToggleMonitoring: () => void
  conflictCount: number
  lastScan?: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Conflict Monitor</h4>
        
        <Button
          size="sm"
          variant={isMonitoring ? 'destructive' : 'default'}
          onClick={onToggleMonitoring}
          className="h-6 px-2 text-xs"
        >
          {isMonitoring ? (
            <>
              <Square className="h-3 w-3 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Monitor
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant={isMonitoring ? 'default' : 'secondary'} className="text-xs">
            {isMonitoring ? 'Active' : 'Stopped'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Conflicts:</span>
          <span className={cn(
            conflictCount > 0 ? 'text-red-600 font-medium' : 'text-green-600'
          )}>
            {conflictCount}
          </span>
        </div>
        
        {lastScan && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last Scan:</span>
            <span>{new Date(lastScan).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Main Conflicts Panel Component
 */
export function ConflictsPanel() {
  const {
    conflicts,
    isMonitoring,
    selectedConflict,
    setSelectedConflict,
    resolutionInProgress,
    applyResolution,
    previewResolution,
    startMonitoring,
    stopMonitoring,
    getStatus,
    conflictsPanelEnabled
  } = useConflictsPanel()
  
  if (!conflictsPanelEnabled) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">Conflicts Panel</h3>
          <p className="text-xs text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline" className="text-xs">dock.conflictsPanel</Badge>
        </div>
      </div>
    )
  }
  
  const status = getStatus()
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b border-border">
        <ConflictMonitoringControls
          isMonitoring={isMonitoring}
          onToggleMonitoring={() => {
            if (isMonitoring) {
              stopMonitoring()
            } else {
              startMonitoring(async () => ({ events: [], tasks: [] }))
            }
          }}
          conflictCount={conflicts.length}
          lastScan={conflicts[conflicts.length - 1]?.detectedAt}
        />
      </div>
      
      {/* Conflicts list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">
                <TrendingUp className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm font-medium text-green-600">No Conflicts</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isMonitoring ? 'Monitoring for conflicts...' : 'Start monitoring to detect conflicts'}
              </p>
            </div>
          ) : (
            conflicts.map((conflict, index) => (
              <ConflictCard
                key={conflict.conflictId}
                conflict={conflict}
                isSelected={selectedConflict?.conflictId === conflict.conflictId}
                onSelect={() => setSelectedConflict(conflict)}
                onApplyResolution={(resolution) => applyResolution(conflict, resolution)}
                onPreviewResolution={(resolution) => previewResolution(conflict, resolution)}
                resolutionInProgress={resolutionInProgress}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Panel footer - Performance metrics */}
      <div className="border-t border-border p-3">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Success Rate:</span>
            <span>{status.performance.successRate}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Detected:</span>
            <span>{status.conflictsDetected}</span>
          </div>
          <div className="flex justify-between">
            <span>Resolutions Applied:</span>
            <span>{status.resolutionsApplied}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConflictsPanel