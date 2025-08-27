'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  type EventConflict,
  type SyncConfig,
  type SyncResult,
  offlineSyncManager,
} from '@/lib/offline-sync/OfflineSyncManager';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface OfflineSyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineSyncStatus({ className, showDetails = false }: OfflineSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus());
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [conflicts, setConflicts] = useState<EventConflict[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [_showConfig, _setShowConfig] = useState(false);

  useEffect(() => {
    // Subscribe to sync events
    const handleSyncComplete = (result: SyncResult) => {
      setLastSyncResult(result);
      setSyncStatus(offlineSyncManager.getSyncStatus());
    };

    const handleConflicts = (newConflicts: EventConflict[]) => {
      setConflicts(newConflicts);
    };

    offlineSyncManager.onSyncComplete(handleSyncComplete);
    offlineSyncManager.onConflictsDetected(handleConflicts);

    // Load pending conflicts
    offlineSyncManager.getPendingConflicts().then(setConflicts);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update status periodically
    const statusInterval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await offlineSyncManager.forcSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.inProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-gray-500" />;
    }

    if (lastSyncResult?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (lastSyncResult?.errorCount && lastSyncResult.errorCount > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getSyncStatusText = () => {
    if (syncStatus.inProgress) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (lastSyncResult?.success) return 'Up to date';
    if (lastSyncResult?.errorCount && lastSyncResult.errorCount > 0) return 'Sync errors';
    return 'Ready to sync';
  };

  const getSyncStatusVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (syncStatus.inProgress) return 'secondary';
    if (!isOnline || (lastSyncResult?.errorCount && lastSyncResult.errorCount > 0))
      return 'destructive';
    return 'default';
  };

  return (
    <div className={className}>
      {/* Compact Status */}
      <div className="flex items-center justify-between p-2 bg-card border rounded-lg">
        <div className="flex items-center gap-2">
          {getSyncStatusIcon()}
          <div className="flex flex-col">
            <Badge variant={getSyncStatusVariant()} className="text-xs">
              {getSyncStatusText()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last sync: {formatTime(syncStatus.lastSync)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conflicts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {conflicts.length} conflicts
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSync}
            disabled={syncStatus.inProgress || !isOnline}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${syncStatus.inProgress ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <div className="mt-4 space-y-4">
          {/* Sync Statistics */}
          {lastSyncResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Last Sync Results</CardTitle>
                <CardDescription>Completed in {lastSyncResult.duration}ms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {lastSyncResult.syncedCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Synced</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {lastSyncResult.conflictCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Conflicts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {lastSyncResult.errorCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>

                {lastSyncResult.errorCount > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {lastSyncResult.errorCount} events failed to sync. Check your connection and
                      try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Sync Conflicts ({conflicts.length})
                </CardTitle>
                <CardDescription>
                  These events have conflicting changes that need resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conflicts.slice(0, 5).map((conflict) => (
                    <div
                      key={conflict.eventId}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <div className="font-medium text-sm">{conflict.localEvent.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {conflict.conflictType} conflict
                        </div>
                      </div>
                      <Badge variant="outline">{conflict.suggested.strategy}</Badge>
                    </div>
                  ))}

                  {conflicts.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      +{conflicts.length - 5} more conflicts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Status</span>
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Device ID</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {syncStatus.deviceId.substring(0, 12)}...
                  </code>
                </div>
              </div>

              {!isOnline && (
                <Alert className="mt-3">
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription>
                    You're offline. Changes will be synced when connection is restored.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sync Progress */}
          {syncStatus.inProgress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sync in Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Synchronizing events...</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default OfflineSyncStatus;
