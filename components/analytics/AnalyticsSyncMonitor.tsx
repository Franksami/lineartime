'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  type BackgroundSyncConfig,
  analyticsBackgroundSync,
} from '@/lib/analytics/AnalyticsBackgroundSync';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Settings,
  Trash2,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface AnalyticsSyncMonitorProps {
  className?: string;
  compact?: boolean;
}

interface SyncStats {
  size: number;
  byPriority: { high: number; medium: number; low: number };
  oldestItem: number | null;
  isOnline: boolean;
  syncInProgress: boolean;
}

export function AnalyticsSyncMonitor({ className, compact = false }: AnalyticsSyncMonitorProps) {
  const [stats, setStats] = useState<SyncStats>({
    size: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
    oldestItem: null,
    isOnline: navigator.onLine,
    syncInProgress: false,
  });
  const [_lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Update stats periodically
    const updateStats = () => {
      const queueStatus = analyticsBackgroundSync.getQueueStatus();
      setStats(queueStatus);
    };

    // Initial update
    updateStats();

    // Set up polling
    const interval = setInterval(updateStats, 2000);

    // Listen for online/offline events
    const handleOnline = () => setStats((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStats((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      setLastSyncTime(Date.now());
      await analyticsBackgroundSync.forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleClearQueue = () => {
    analyticsBackgroundSync.clearQueue();
  };

  const handleToggleSync = (enabled: boolean) => {
    setSyncEnabled(enabled);
    // In a real implementation, you'd disable/enable the sync intervals
  };

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';

    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSyncHealthStatus = () => {
    if (!stats.isOnline) return { status: 'offline', color: 'text-gray-500', icon: WifiOff };
    if (stats.syncInProgress) return { status: 'syncing', color: 'text-blue-500', icon: RefreshCw };
    if (stats.size === 0) return { status: 'healthy', color: 'text-green-500', icon: CheckCircle2 };
    if (stats.size > 100)
      return { status: 'warning', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'normal', color: 'text-green-500', icon: Activity };
  };

  const health = getSyncHealthStatus();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-card border rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <health.icon
            className={`h-4 w-4 ${health.color} ${stats.syncInProgress ? 'animate-spin' : ''}`}
          />
          <div className="flex flex-col">
            <Badge variant="outline" className="text-xs">
              {stats.size} queued
            </Badge>
            <span className="text-xs text-muted-foreground">Analytics sync</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleForceSync}
          disabled={stats.syncInProgress || !stats.isOnline}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${stats.syncInProgress ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <health.icon
                className={`h-4 w-4 ${health.color} ${stats.syncInProgress ? 'animate-spin' : ''}`}
              />
              Analytics Background Sync
            </CardTitle>
            <CardDescription>Real-time analytics data synchronization</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Queue Size</span>
              </div>
              <div className="text-2xl font-bold">{stats.size}</div>
              {stats.size > 50 && <Progress value={(stats.size / 100) * 100} className="h-2" />}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">High Priority</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.byPriority.high}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Medium Priority</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{stats.byPriority.medium}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Low Priority</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.byPriority.low}</div>
            </div>
          </div>

          {/* Sync Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {stats.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Connection</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw
                    className={`h-4 w-4 ${stats.syncInProgress ? 'animate-spin text-blue-500' : 'text-muted-foreground'}`}
                  />
                  <span className="text-sm font-medium">Sync Status</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.syncInProgress ? 'In Progress' : 'Idle'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Oldest Item</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(stats.oldestItem)}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="sync-enabled" checked={syncEnabled} onCheckedChange={handleToggleSync} />
              <Label htmlFor="sync-enabled" className="text-sm">
                Auto-sync enabled
              </Label>
            </div>

            <div className="flex gap-2">
              {stats.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearQueue}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Queue
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={handleForceSync}
                disabled={stats.syncInProgress || !stats.isOnline}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${stats.syncInProgress ? 'animate-spin' : ''}`}
                />
                Force Sync
              </Button>
            </div>
          </div>

          {/* Warnings */}
          {stats.size > 100 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Large Queue Size
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You have {stats.size} items queued for sync. Consider forcing a sync or checking
                your connection.
              </p>
            </div>
          )}

          {!stats.isOnline && (
            <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Offline Mode
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Analytics data is being queued locally and will sync when connection is restored.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Sync Configuration</CardTitle>
            <CardDescription>Adjust background sync behavior and intervals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>High Priority Interval</Label>
                <div className="text-sm text-muted-foreground">30 seconds</div>
              </div>
              <div className="space-y-2">
                <Label>Medium Priority Interval</Label>
                <div className="text-sm text-muted-foreground">2 minutes</div>
              </div>
              <div className="space-y-2">
                <Label>Low Priority Interval</Label>
                <div className="text-sm text-muted-foreground">10 minutes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Size</Label>
                <div className="text-sm text-muted-foreground">50 events per batch</div>
              </div>
              <div className="space-y-2">
                <Label>Max Queue Size</Label>
                <div className="text-sm text-muted-foreground">1000 events maximum</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Configuration changes require app restart
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AnalyticsSyncMonitor;
