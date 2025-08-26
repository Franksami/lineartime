'use client'

import React, { createContext, useContext, ReactNode, useMemo } from 'react'

// Import all individual contexts
import { UIProvider, UIContextValue, useUIContext } from './UIContext'
import { CalendarProvider, CalendarContextType, useCalendarContext } from './CalendarContext'
import { EventsProvider, EventsContextValue, useEventsContext } from './EventsContext'
import { AIProvider, AIContextValue, useAIContext } from './AIContext'
import { NotificationsProvider, NotificationsContextValue, useNotificationsContext } from './NotificationsContext'

/**
 * SuperContext - Unified context system that orchestrates all 5 specialized contexts
 * Provides single point of access and cross-context coordination
 */

export interface SuperContextValue {
  // Individual context values
  ui: UIContextValue
  calendar: CalendarContextType
  events: EventsContextValue
  ai: AIContextValue
  notifications: NotificationsContextValue
  
  // Cross-context coordination methods
  coordination: {
    // Global state queries
    isAnyLoading: () => boolean
    hasUnresolvedConflicts: () => boolean
    hasCriticalAlerts: () => boolean
    
    // Cross-context actions
    syncAllProviders: () => Promise<void>
    handleGlobalError: (error: string, context?: string) => void
    performBulkOperation: (type: 'export' | 'delete' | 'sync', eventIds: string[]) => Promise<void>
    
    // Performance optimizations
    enableBatchMode: () => void
    disableBatchMode: () => void
    performBatchUpdate: (updates: {
      ui?: any
      calendar?: any
      events?: any
      ai?: any
      notifications?: any
    }) => void
    
    // Memory management
    cleanup: () => void
    getMemoryUsage: () => {
      events: number
      notifications: number
      aiSuggestions: number
      total: number
    }
  }
  
  // Performance monitoring
  performance: {
    contextUpdateCount: number
    lastUpdateTime: Date
    averageUpdateTime: number
    memoryUsage: number
  }
}

const SuperContext = createContext<SuperContextValue | undefined>(undefined)

export interface SuperContextProviderProps {
  children: ReactNode
  enablePerformanceMonitoring?: boolean
  memoryCleanupInterval?: number
}

// Performance monitoring hook
function usePerformanceMonitoring(enabled: boolean) {
  const [performance, setPerformance] = React.useState({
    contextUpdateCount: 0,
    lastUpdateTime: new Date(),
    averageUpdateTime: 0,
    memoryUsage: 0
  })
  
  const recordUpdate = React.useCallback(() => {
    if (!enabled) return
    
    setPerformance(prev => {
      const now = new Date()
      const updateTime = now.getTime() - prev.lastUpdateTime.getTime()
      const newCount = prev.contextUpdateCount + 1
      const newAverage = (prev.averageUpdateTime * (newCount - 1) + updateTime) / newCount
      
      return {
        contextUpdateCount: newCount,
        lastUpdateTime: now,
        averageUpdateTime: newAverage,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }
    })
  }, [enabled])
  
  return { performance, recordUpdate }
}

// Memory management hook
function useMemoryManagement(cleanupInterval: number) {
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Trigger garbage collection hints
      if (window.gc) {
        window.gc()
      }
      
      // Log memory usage if in development
      if (process.env.NODE_ENV === 'development' && (performance as any).memory) {
        const memory = (performance as any).memory
        console.log('Memory Usage:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        })
      }
    }, cleanupInterval)
    
    return () => clearInterval(interval)
  }, [cleanupInterval])
}

// Internal SuperContext provider that assumes all contexts are available
function SuperContextInner({ children, enablePerformanceMonitoring = false, memoryCleanupInterval = 30000 }: SuperContextProviderProps) {
  const ui = useUIContext()
  const calendar = useCalendarContext()
  const events = useEventsContext()
  const ai = useAIContext()
  const notifications = useNotificationsContext()
  
  const { performance, recordUpdate } = usePerformanceMonitoring(enablePerformanceMonitoring)
  useMemoryManagement(memoryCleanupInterval)
  
  // Cross-context coordination methods
  const coordination = useMemo(() => ({
    // Global state queries
    isAnyLoading: () => {
      return ui.state.loading.global ||
             ui.state.loading.calendar ||
             ui.state.loading.events ||
             ui.state.loading.sync ||
             events.state.creating ||
             events.state.updating ||
             events.state.deleting ||
             ai.state.nlpProcessing ||
             events.state.syncStatus.google.status === 'syncing' ||
             events.state.syncStatus.microsoft.status === 'syncing' ||
             events.state.syncStatus.apple.status === 'syncing' ||
             events.state.syncStatus.generic.status === 'syncing'
    },
    
    hasUnresolvedConflicts: () => {
      return events.state.conflicts.filter(c => !c.resolved).length > 0
    },
    
    hasCriticalAlerts: () => {
      return notifications.state.criticalAlerts.length > 0
    },
    
    // Cross-context actions
    syncAllProviders: async () => {
      ui.setLoading('sync', true)
      
      try {
        // Update all provider sync statuses
        const providers = ['google', 'microsoft', 'apple', 'generic'] as const
        
        await Promise.all(
          providers.map(async (provider) => {
            events.updateSyncStatus(provider, { status: 'syncing' })
            
            try {
              // Simulate sync operation (replace with actual sync logic)
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              events.updateSyncStatus(provider, { 
                status: 'success', 
                lastSync: new Date() 
              })
              
              notifications.notify.success(`${provider} calendar synced successfully`)
            } catch (error) {
              events.updateSyncStatus(provider, { 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Sync failed'
              })
              
              notifications.notify.error(`Failed to sync ${provider} calendar`)
            }
          })
        )
      } finally {
        ui.setLoading('sync', false)
      }
      
      recordUpdate()
    },
    
    handleGlobalError: (error: string, context = 'system') => {
      // Log error
      console.error(`Global Error [${context}]:`, error)
      
      // Show notification
      notifications.notify.error('Something went wrong', error, {
        persistent: true,
        metadata: { source: 'system' }
      })
      
      // Add system alert for critical errors
      if (error.toLowerCase().includes('critical') || error.toLowerCase().includes('fatal')) {
        notifications.addAlert({
          level: 'critical',
          type: 'sync_error',
          title: 'Critical System Error',
          message: error,
          actionRequired: true
        })
      }
      
      // AI can learn from errors
      if (ai.state.enabled && ai.state.features.smartSuggestions) {
        ai.addSuggestion({
          id: `error_suggestion_${Date.now()}`,
          type: 'conflict_resolution',
          title: 'Error Recovery Suggestion',
          description: `Based on the error "${error}", consider checking your network connection or trying again.`,
          confidence: 0.7,
          action: 'dismiss'
        })
      }
      
      recordUpdate()
    },
    
    performBulkOperation: async (type: 'export' | 'delete' | 'sync', eventIds: string[]) => {
      events.startBulkOperation(type, eventIds.length)
      ui.setLoading('events', true)
      
      try {
        for (let i = 0; i < eventIds.length; i++) {
          const eventId = eventIds[i]
          
          switch (type) {
            case 'delete':
              events.deleteEvent(eventId)
              break
            case 'export':
              // Export logic would go here
              break
            case 'sync':
              // Individual sync logic would go here
              break
          }
          
          events.updateBulkProgress(i + 1, eventIds.length)
          
          // Small delay to prevent UI freezing
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
        
        notifications.notify.success(`Bulk ${type} completed`, `Processed ${eventIds.length} events`)
      } catch (error) {
        notifications.notify.error(`Bulk ${type} failed`, error instanceof Error ? error.message : 'Unknown error')
      } finally {
        events.endBulkOperation()
        ui.setLoading('events', false)
      }
      
      recordUpdate()
    },
    
    // Performance optimizations
    enableBatchMode: () => {
      events.batchUpdate({ bulkOperation: { ...events.state.bulkOperation, type: 'update' } })
      notifications.batchUpdate({ batchMode: true })
      ui.announceMessage('Batch mode enabled for performance')
    },
    
    disableBatchMode: () => {
      events.batchUpdate({ bulkOperation: { ...events.state.bulkOperation, type: null } })
      notifications.batchUpdate({ batchMode: false })
      ui.announceMessage('Batch mode disabled')
    },
    
    performBatchUpdate: (updates: Parameters<typeof coordination.performBatchUpdate>[0]) => {
      // Batch update all contexts simultaneously
      if (updates.ui) ui.batchUpdate(updates.ui)
      if (updates.calendar) calendar.batchUpdate(updates.calendar)
      if (updates.events) events.batchUpdate(updates.events)
      if (updates.ai) ai.batchUpdate(updates.ai)
      if (updates.notifications) notifications.batchUpdate(updates.notifications)
      
      recordUpdate()
    },
    
    // Memory management
    cleanup: () => {
      // Clear old notifications
      notifications.clearOldNotifications()
      
      // Clear old AI suggestions
      const oldSuggestions = ai.state.suggestions.filter(s => 
        Date.now() - new Date(s.metadata?.timestamp || Date.now()).getTime() > 24 * 60 * 60 * 1000
      )
      oldSuggestions.forEach(s => ai.dismissSuggestion(s.id))
      
      // Clear old NLP results
      ai.clearNLPResults()
      
      // Clear dismissed notifications
      const dismissedNotifications = notifications.state.notifications.filter(n => n.dismissed)
      dismissedNotifications.forEach(n => {
        notifications.batchUpdate({
          notifications: notifications.state.notifications.filter(x => x.id !== n.id)
        })
      })
      
      ui.announceMessage('Memory cleanup completed')
      recordUpdate()
    },
    
    getMemoryUsage: () => {
      return {
        events: events.state.events.length,
        notifications: notifications.state.notifications.length,
        aiSuggestions: ai.state.suggestions.length,
        total: events.state.events.length + notifications.state.notifications.length + ai.state.suggestions.length
      }
    }
  }), [ui, calendar, events, ai, notifications, recordUpdate])
  
  const contextValue: SuperContextValue = useMemo(() => ({
    ui,
    calendar,
    events,
    ai,
    notifications,
    coordination,
    performance
  }), [ui, calendar, events, ai, notifications, coordination, performance])
  
  return (
    <SuperContext.Provider value={contextValue}>
      {children}
    </SuperContext.Provider>
  )
}

// Main SuperContext provider that sets up all nested contexts
export function SuperContextProvider({ children, ...props }: SuperContextProviderProps) {
  return (
    <UIProvider>
      <CalendarProvider>
        <EventsProvider>
          <AIProvider>
            <NotificationsProvider>
              <SuperContextInner {...props}>
                {children}
              </SuperContextInner>
            </NotificationsProvider>
          </AIProvider>
        </EventsProvider>
      </CalendarProvider>
    </UIProvider>
  )
}

// Main hook to access SuperContext
export function useSuperContext() {
  const context = useContext(SuperContext)
  if (context === undefined) {
    throw new Error('useSuperContext must be used within a SuperContextProvider')
  }
  return context
}

// Specialized hooks that combine multiple contexts
export function useGlobalState() {
  const { ui, events, ai, coordination } = useSuperContext()
  
  return {
    isLoading: coordination.isAnyLoading(),
    hasErrors: notifications.state.alerts.filter(a => !a.resolved).length > 0,
    hasConflicts: coordination.hasUnresolvedConflicts(),
    theme: ui.state.theme,
    totalEvents: events.state.stats.total,
    aiEnabled: ai.state.enabled
  }
}

export function useGlobalActions() {
  const { coordination } = useSuperContext()
  
  return {
    syncAll: coordination.syncAllProviders,
    handleError: coordination.handleGlobalError,
    bulkOperation: coordination.performBulkOperation,
    cleanup: coordination.cleanup,
    batchUpdate: coordination.performBatchUpdate
  }
}

export function usePerformanceMetrics() {
  const { performance, coordination } = useSuperContext()
  
  return {
    ...performance,
    memoryUsage: coordination.getMemoryUsage(),
    cleanup: coordination.cleanup
  }
}

// Development helper hook
export function useContextDebug() {
  const superContext = useSuperContext()
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose context to window for debugging
      (window as any).__SUPER_CONTEXT__ = superContext
      
      console.log('SuperContext Debug Info:', {
        contexts: ['ui', 'calendar', 'events', 'ai', 'notifications'],
        performance: superContext.performance,
        memoryUsage: superContext.coordination.getMemoryUsage()
      })
    }
  }, [superContext])
  
  return process.env.NODE_ENV === 'development' ? superContext : null
}