'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  offlineSyncManager,
  type SyncResult,
  type EventConflict,
  type SyncableEvent
} from '@/lib/offline-sync/OfflineSyncManager'

interface OfflineSyncState {
  isOnline: boolean
  syncInProgress: boolean
  lastSyncTime: number
  lastSyncResult: SyncResult | null
  pendingConflicts: EventConflict[]
  deviceId: string
}

interface OfflineSyncActions {
  forceSync: () => Promise<SyncResult>
  resolveConflicts: (resolutions: { [eventId: string]: 'local' | 'remote' | 'merge' }) => Promise<void>
  updateSyncConfig: (config: any) => void
  clearConflicts: () => Promise<void>
  getPendingEventsCount: () => Promise<number>
}

export function useOfflineSync(): OfflineSyncState & OfflineSyncActions {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncState, setSyncState] = useState<Omit<OfflineSyncState, 'isOnline'>>(() => {
    const status = offlineSyncManager.getSyncStatus()
    return {
      syncInProgress: status.inProgress,
      lastSyncTime: status.lastSync,
      lastSyncResult: null,
      pendingConflicts: [],
      deviceId: status.deviceId
    }
  })

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      offlineSyncManager.forcSync().catch(console.error)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Subscribe to sync events
  useEffect(() => {
    const handleSyncComplete = (result: SyncResult) => {
      setSyncState(prev => ({
        ...prev,
        lastSyncResult: result,
        lastSyncTime: Date.now()
      }))
    }

    const handleConflicts = (conflicts: EventConflict[]) => {
      setSyncState(prev => ({
        ...prev,
        pendingConflicts: conflicts
      }))
    }

    // Subscribe to sync manager events
    offlineSyncManager.onSyncComplete(handleSyncComplete)
    offlineSyncManager.onConflictsDetected(handleConflicts)

    // Load initial conflicts
    offlineSyncManager.getPendingConflicts().then(conflicts => {
      setSyncState(prev => ({
        ...prev,
        pendingConflicts: conflicts
      }))
    })

    // Update sync status periodically
    const statusInterval = setInterval(() => {
      const status = offlineSyncManager.getSyncStatus()
      setSyncState(prev => ({
        ...prev,
        syncInProgress: status.inProgress,
        lastSyncTime: status.lastSync,
        deviceId: status.deviceId
      }))
    }, 1000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [])

  // Trigger automatic sync when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        // Trigger sync when app becomes visible
        setTimeout(() => {
          offlineSyncManager.forcSync().catch(console.error)
        }, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOnline])

  const forceSync = useCallback(async (): Promise<SyncResult> => {
    try {
      const result = await offlineSyncManager.forcSync()
      return result
    } catch (error) {
      console.error('Force sync failed:', error)
      throw error
    }
  }, [])

  const resolveConflicts = useCallback(async (resolutions: { [eventId: string]: 'local' | 'remote' | 'merge' }): Promise<void> => {
    try {
      for (const [eventId, strategy] of Object.entries(resolutions)) {
        const conflict = syncState.pendingConflicts.find(c => c.eventId === eventId)
        if (!conflict) continue

        let resolvedEvent: SyncableEvent
        
        switch (strategy) {
          case 'local':
            resolvedEvent = {
              ...conflict.localEvent,
              version: Math.max(conflict.localEvent.version, conflict.remoteEvent.version) + 1,
              lastModified: Date.now()
            }
            break
            
          case 'remote':
            resolvedEvent = {
              ...conflict.remoteEvent,
              version: conflict.remoteEvent.version + 1,
              lastModified: Date.now()
            }
            break
            
          case 'merge':
          default:
            resolvedEvent = conflict.suggested.resolvedEvent
            break
        }

        const resolution = {
          strategy,
          resolvedEvent,
          conflictReason: conflict.suggested.conflictReason,
          resolutionDetails: `Resolved via ${strategy} strategy`
        }

        await offlineSyncManager.resolveConflictManually(eventId, resolution)
      }

      // Refresh conflicts list
      const remainingConflicts = await offlineSyncManager.getPendingConflicts()
      setSyncState(prev => ({
        ...prev,
        pendingConflicts: remainingConflicts
      }))
      
    } catch (error) {
      console.error('Failed to resolve conflicts:', error)
      throw error
    }
  }, [syncState.pendingConflicts])

  const updateSyncConfig = useCallback((config: any): void => {
    offlineSyncManager.updateConfig(config)
  }, [])

  const clearConflicts = useCallback(async (): Promise<void> => {
    try {
      // Resolve all conflicts with default strategy
      const resolutions: { [eventId: string]: 'merge' } = {}
      for (const conflict of syncState.pendingConflicts) {
        resolutions[conflict.eventId] = 'merge'
      }
      
      await resolveConflicts(resolutions)
    } catch (error) {
      console.error('Failed to clear conflicts:', error)
      throw error
    }
  }, [syncState.pendingConflicts, resolveConflicts])

  const getPendingEventsCount = useCallback(async (): Promise<number> => {
    try {
      // This would need to be implemented in the sync manager
      // For now, we'll return 0 as a placeholder
      return 0
    } catch (error) {
      console.error('Failed to get pending events count:', error)
      return 0
    }
  }, [])

  return {
    // State
    isOnline,
    syncInProgress: syncState.syncInProgress,
    lastSyncTime: syncState.lastSyncTime,
    lastSyncResult: syncState.lastSyncResult,
    pendingConflicts: syncState.pendingConflicts,
    deviceId: syncState.deviceId,
    
    // Actions
    forceSync,
    resolveConflicts,
    updateSyncConfig,
    clearConflicts,
    getPendingEventsCount
  }
}

// Helper hooks for specific use cases

export function useSyncStatus() {
  const { isOnline, syncInProgress, lastSyncTime, lastSyncResult } = useOfflineSync()
  
  const getSyncStatusText = () => {
    if (syncInProgress) return 'Syncing...'
    if (!isOnline) return 'Offline'
    if (lastSyncResult?.success) return 'Up to date'
    if (lastSyncResult?.errorCount && lastSyncResult.errorCount > 0) return 'Sync errors'
    return 'Ready to sync'
  }

  const getSyncStatusVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (syncInProgress) return 'secondary'
    if (!isOnline || (lastSyncResult?.errorCount && lastSyncResult.errorCount > 0)) return 'destructive'
    return 'default'
  }

  return {
    isOnline,
    syncInProgress,
    lastSyncTime,
    statusText: getSyncStatusText(),
    statusVariant: getSyncStatusVariant(),
    hasErrors: lastSyncResult?.errorCount && lastSyncResult.errorCount > 0
  }
}

export function useConflicts() {
  const { pendingConflicts, resolveConflicts, clearConflicts } = useOfflineSync()
  
  const hasConflicts = pendingConflicts.length > 0
  const conflictCount = pendingConflicts.length

  const resolveConflict = useCallback(async (eventId: string, strategy: 'local' | 'remote' | 'merge') => {
    await resolveConflicts({ [eventId]: strategy })
  }, [resolveConflicts])

  return {
    hasConflicts,
    conflictCount,
    pendingConflicts,
    resolveConflict,
    resolveConflicts,
    clearConflicts
  }
}

export function useSyncActions() {
  const { forceSync, updateSyncConfig } = useOfflineSync()
  
  const triggerSync = useCallback(async () => {
    try {
      await forceSync()
    } catch (error) {
      console.error('Manual sync failed:', error)
      throw error
    }
  }, [forceSync])

  return {
    triggerSync,
    updateSyncConfig
  }
}