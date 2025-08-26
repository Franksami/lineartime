import { useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { notify } from '@/components/ui/notify';
import { CheckCircle, AlertCircle, RefreshCw, CloudOff, Calendar, AlertTriangle } from 'lucide-react';

interface NotificationOptions {
  enableSyncNotifications?: boolean;
  enableErrorNotifications?: boolean;
  enableConflictNotifications?: boolean;
  soundEnabled?: boolean;
  persistentErrors?: boolean;
}

export function useCalendarNotifications(options: NotificationOptions = {}) {
  const {
    enableSyncNotifications = true,
    enableErrorNotifications = true,
    enableConflictNotifications = true,
    soundEnabled = false,
    persistentErrors = true,
  } = options;

  // Convex subscriptions
  const syncQueue = useQuery(api.calendar.sync.getSyncQueueStatus);
  const conflicts = useQuery(api.calendar.events.getUnresolvedConflicts);
  const providers = useQuery(api.calendar.providers.getConnectedProviders);

  // Track previous states to detect changes
  const prevStatesRef = useRef<{
    syncQueue?: typeof syncQueue;
    conflicts?: typeof conflicts;
    providers?: typeof providers;
  }>({});

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(console.error);
    }
  }, [soundEnabled]);

  // Handle sync status changes
  useEffect(() => {
    if (!enableSyncNotifications || !syncQueue) return;

    const prevQueue = prevStatesRef.current.syncQueue;
    
    // Check for newly completed syncs
    if (prevQueue && syncQueue.completed > prevQueue.completed) {
      const newlyCompleted = syncQueue.completed - prevQueue.completed;
      notify.success(
        `Sync completed`,
        {
          description: `${newlyCompleted} calendar${newlyCompleted > 1 ? 's' : ''} synced successfully`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 4000,
        }
      );
      playSound();
    }

    // Check for new sync errors
    if (prevQueue && syncQueue.failed > prevQueue.failed) {
      const newErrors = syncQueue.failed - prevQueue.failed;
      const errorToast = notify.error(
        `Sync failed: ${newErrors} operation${newErrors > 1 ? 's' : ''} failed. Click to retry.`,
        {
          duration: persistentErrors ? Infinity : 6000,
          action: {
            label: 'Retry',
            onClick: () => {
              // Trigger retry logic
              console.log('Retrying failed syncs...');
            },
          },
        }
      );
      playSound();
    }

    // Check for ongoing syncs
    if (syncQueue.processing > 0 && (!prevQueue || prevQueue.processing === 0)) {
      notify.info(
        `Syncing calendars... Processing ${syncQueue.processing} calendar${syncQueue.processing > 1 ? 's' : ''}`,
        {
          duration: 3000,
        }
      );
    }

    prevStatesRef.current.syncQueue = syncQueue;
  }, [syncQueue, enableSyncNotifications, persistentErrors, playSound]);

  // Handle conflict notifications
  useEffect(() => {
    if (!enableConflictNotifications || !conflicts) return;

    const prevConflicts = prevStatesRef.current.conflicts;
    
    // Check for new conflicts
    if (prevConflicts && conflicts.length > prevConflicts.length) {
      const newConflicts = conflicts.length - prevConflicts.length;
      notify.warning(
        `Sync conflict detected: ${newConflicts} event${newConflicts > 1 ? 's have' : ' has'} conflicting changes. Review required.`,
        {
          duration: Infinity,
          action: {
            label: 'Review',
            onClick: () => {
              // Navigate to conflict resolution
              window.location.href = '/calendar?resolve-conflicts=true';
            },
          },
        }
      );
      playSound();
    }

    prevStatesRef.current.conflicts = conflicts;
  }, [conflicts, enableConflictNotifications, playSound]);

  // Handle provider connection status changes
  useEffect(() => {
    if (!providers) return;

    const prevProviders = prevStatesRef.current.providers;
    
    if (prevProviders) {
      // Check for newly connected providers
      const newProviders = providers.filter(
        p => !prevProviders.find(prev => prev._id === p._id)
      );
      
      newProviders.forEach(provider => {
        notify.success(
          `Calendar connected`,
          {
            description: `${provider.provider} calendar connected successfully`,
            icon: <Calendar className="h-4 w-4" />,
            duration: 5000,
          }
        );
        playSound();
      });

      // Check for disconnected providers
      const removedProviders = prevProviders.filter(
        p => !providers.find(current => current._id === p._id)
      );
      
      removedProviders.forEach(provider => {
        notify.info(
          `Calendar disconnected: ${provider.provider} calendar has been disconnected`,
          {
            duration: 4000,
          }
        );
      });

      // Check for providers with expired tokens
      providers.forEach(provider => {
        const prevProvider = prevProviders.find(p => p._id === provider._id);
        if (prevProvider && provider.tokenExpired && !prevProvider.tokenExpired) {
          notify.error(
            `Authentication expired: ${provider.provider} requires re-authentication`,
            {
              duration: Infinity,
              action: {
                label: 'Reconnect',
                onClick: () => {
                  window.location.href = '/settings/integrations';
                },
              },
            }
          );
          playSound();
        }
      });
    }

    prevStatesRef.current.providers = providers;
  }, [providers, playSound]);

  // Error recovery suggestions
  const getSyncErrorSuggestion = useCallback((error: string): string => {
    if (error.includes('auth') || error.includes('401')) {
      return 'Authentication failed. Please reconnect your calendar.';
    }
    if (error.includes('network') || error.includes('timeout')) {
      return 'Network error. Please check your connection.';
    }
    if (error.includes('rate') || error.includes('429')) {
      return 'Rate limit reached. Sync will resume automatically.';
    }
    if (error.includes('permission') || error.includes('403')) {
      return 'Permission denied. Check calendar permissions.';
    }
    return 'An error occurred. Please try again later.';
  }, []);

  // Manual notification triggers
  const notifySuccess = useCallback((message: string, description?: string) => {
    notify.success(description ? `${message}: ${description}` : message, {
      duration: 4000,
    });
    playSound();
  }, [playSound]);

  const notifyError = useCallback((message: string, error?: any) => {
    const description = error ? getSyncErrorSuggestion(error.toString()) : undefined;
    notify.error(description ? `${message}: ${description}` : message, {
      duration: persistentErrors ? Infinity : 6000,
    });
    playSound();
  }, [getSyncErrorSuggestion, persistentErrors, playSound]);

  const notifyInfo = useCallback((message: string, description?: string) => {
    notify.info(description ? `${message}: ${description}` : message, {
      duration: 3000,
    });
  }, []);

  const notifyWarning = useCallback((message: string, description?: string) => {
    notify.warning(description ? `${message}: ${description}` : message, {
      duration: 5000,
    });
    playSound();
  }, [playSound]);

  return {
    // Notification methods
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    
    // Current states
    syncStatus: {
      pending: syncQueue?.pending || 0,
      processing: syncQueue?.processing || 0,
      completed: syncQueue?.completed || 0,
      failed: syncQueue?.failed || 0,
    },
    conflictCount: conflicts?.length || 0,
    connectedProviders: providers?.length || 0,
    
    // Utilities
    getSyncErrorSuggestion,
  };
}

// Global notification handler for sync events
export function setupCalendarNotifications() {
  if (typeof window === 'undefined') return;

  // Listen for custom sync events
  window.addEventListener('calendar:sync:start', (event: CustomEvent) => {
    notify.info('Starting calendar sync...');
  });

  window.addEventListener('calendar:sync:complete', (event: CustomEvent) => {
    const { provider, eventCount } = event.detail;
    notify.success(`${provider} sync complete: ${eventCount} events synced`);
  });

  window.addEventListener('calendar:sync:error', (event: CustomEvent) => {
    const { provider, error } = event.detail;
    notify.error(`${provider} sync failed: ${error}`, {
      action: {
        label: 'Retry',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('calendar:sync:retry', {
            detail: { provider }
          }));
        },
      },
    });
  });

  window.addEventListener('calendar:conflict', (event: CustomEvent) => {
    const { eventTitle } = event.detail;
    notify.warning(`Conflict detected: ${eventTitle}. Click to resolve`, {
      action: {
        label: 'Resolve',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('calendar:conflict:resolve', {
            detail: event.detail
          }));
        },
      },
    });
  });
}

// Trigger custom events
export function triggerSyncEvent(type: 'start' | 'complete' | 'error', detail: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`calendar:sync:${type}`, { detail }));
  }
}

export function triggerConflictEvent(detail: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('calendar:conflict', { detail }));
  }
}

import { useRef } from 'react';