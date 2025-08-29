'use client';

/**
 * CalendarProviderSyncStatus - Real-Time Provider Integration UI
 *
 * Displays sync status for all 4 calendar providers with real-time updates,
 * conflict indicators, and provider-specific controls.
 *
 * Phase 5.0 Integration: Provider sync monitoring with design token styling
 */

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useEnhancedTheme } from '@/lib/design-system/enhanced-theme';
// Design System Integration
import { TokenBridge, useDesignTokens } from '@/lib/design-system/utils/token-bridge';

// Accessibility Integration
import { useAccessibilityAAA } from '@/lib/accessibility';

// Sound Effects Integration
import { useSoundEffects } from '@/hooks/use-sound-effects';

// I18n Integration
import { useI18n } from '@/hooks/useI18n';

// Analytics Integration
import { useAnalytics } from '@/hooks/use-analytics';

interface ProviderSyncStatus {
  id: string;
  name: string;
  displayName: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected' | 'rate_limited';
  lastSync?: Date;
  nextSync?: Date;
  eventCount: number;
  conflictCount?: number;
  errorMessage?: string;
  syncProgress?: number;
  isHealthy: boolean;
  latency?: number;
  successRate?: number;
}

interface CalendarProviderSyncStatusProps {
  syncStatus: Record<string, ProviderSyncStatus> | null;
  onConflictClick?: () => void;
  onProviderClick?: (providerId: string) => void;
  onForceSync?: (providerId: string) => void;
  onSettings?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const DEFAULT_PROVIDERS: ProviderSyncStatus[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    displayName: 'Google',
    status: 'connected',
    eventCount: 0,
    isHealthy: true,
  },
  {
    id: 'microsoft',
    name: 'Microsoft Graph',
    displayName: 'Microsoft',
    status: 'connected',
    eventCount: 0,
    isHealthy: true,
  },
  {
    id: 'apple',
    name: 'Apple CalDAV',
    displayName: 'Apple',
    status: 'connected',
    eventCount: 0,
    isHealthy: true,
  },
  {
    id: 'caldav',
    name: 'Generic CalDAV',
    displayName: 'CalDAV',
    status: 'connected',
    eventCount: 0,
    isHealthy: true,
  },
];

export function CalendarProviderSyncStatus({
  syncStatus,
  onConflictClick,
  onProviderClick,
  onForceSync,
  onSettings,
  className,
  showDetails = false,
  compact = false,
}: CalendarProviderSyncStatusProps) {
  // System Integration
  const _tokens = useDesignTokens();
  const enhancedTheme = useEnhancedTheme();
  const tokenBridge = useMemo(() => new TokenBridge(enhancedTheme.theme), [enhancedTheme.theme]);

  const { getAccessibleLabel, validateContrast, colorSystem } = useAccessibilityAAA();
  const { playSuccess, playError, playNotification } = useSoundEffects();
  const i18n = useI18n();
  const analytics = useAnalytics();

  // Component State
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [animatingProvider, setAnimatingProvider] = useState<string | null>(null);

  // Process sync status data
  const providers = useMemo(() => {
    if (!syncStatus) {
      return DEFAULT_PROVIDERS;
    }

    return Object.values(syncStatus).map((provider) => ({
      ...provider,
      // Ensure all providers have required fields
      conflictCount: provider.conflictCount || 0,
      eventCount: provider.eventCount || 0,
      isHealthy: provider.isHealthy ?? true,
      lastSync: provider.lastSync ? new Date(provider.lastSync) : undefined,
      nextSync: provider.nextSync ? new Date(provider.nextSync) : undefined,
    }));
  }, [syncStatus]);

  // Calculate overall health metrics
  const overallHealth = useMemo(() => {
    const connectedProviders = providers.filter((p) => p.status === 'connected');
    const totalConflicts = providers.reduce((sum, p) => sum + (p.conflictCount || 0), 0);
    const totalEvents = providers.reduce((sum, p) => sum + p.eventCount, 0);
    const healthyProviders = providers.filter((p) => p.isHealthy);
    const avgSuccessRate =
      providers.reduce((sum, p) => sum + (p.successRate || 1), 0) / providers.length;
    const avgLatency = providers.reduce((sum, p) => sum + (p.latency || 0), 0) / providers.length;

    return {
      connectedCount: connectedProviders.length,
      totalProviders: providers.length,
      totalConflicts,
      totalEvents,
      healthScore: (healthyProviders.length / providers.length) * 100,
      avgSuccessRate: avgSuccessRate * 100,
      avgLatency: Math.round(avgLatency),
      hasIssues: totalConflicts > 0 || connectedProviders.length < providers.length,
    };
  }, [providers]);

  // Provider status icons and colors
  const getProviderStatusIcon = (provider: ProviderSyncStatus) => {
    const iconProps = { className: 'w-3 h-3', 'aria-hidden': true };

    switch (provider.status) {
      case 'connected':
        return (
          <CheckCircle2
            {...iconProps}
            style={{ color: tokenBridge.getColorValue('status.success') }}
          />
        );
      case 'syncing':
        return (
          <Loader2
            {...iconProps}
            className="animate-spin"
            style={{ color: tokenBridge.getColorValue('status.info') }}
          />
        );
      case 'error':
        return (
          <AlertCircle
            {...iconProps}
            style={{ color: tokenBridge.getColorValue('status.error') }}
          />
        );
      case 'rate_limited':
        return (
          <Clock {...iconProps} style={{ color: tokenBridge.getColorValue('status.warning') }} />
        );
      default:
        return (
          <WifiOff {...iconProps} style={{ color: tokenBridge.getColorValue('status.muted') }} />
        );
    }
  };

  const getProviderBadgeColor = (provider: ProviderSyncStatus) => {
    switch (provider.status) {
      case 'connected':
        return {
          background: tokenBridge.getColorValue('badge.success.background'),
          foreground: tokenBridge.getColorValue('badge.success.foreground'),
          border: tokenBridge.getColorValue('badge.success.border'),
        };
      case 'syncing':
        return {
          background: tokenBridge.getColorValue('badge.info.background'),
          foreground: tokenBridge.getColorValue('badge.info.foreground'),
          border: tokenBridge.getColorValue('badge.info.border'),
        };
      case 'error':
        return {
          background: tokenBridge.getColorValue('badge.error.background'),
          foreground: tokenBridge.getColorValue('badge.error.foreground'),
          border: tokenBridge.getColorValue('badge.error.border'),
        };
      case 'rate_limited':
        return {
          background: tokenBridge.getColorValue('badge.warning.background'),
          foreground: tokenBridge.getColorValue('badge.warning.foreground'),
          border: tokenBridge.getColorValue('badge.warning.border'),
        };
      default:
        return {
          background: tokenBridge.getColorValue('badge.muted.background'),
          foreground: tokenBridge.getColorValue('badge.muted.foreground'),
          border: tokenBridge.getColorValue('badge.muted.border'),
        };
    }
  };

  // Handle provider interactions
  const handleProviderClick = (provider: ProviderSyncStatus) => {
    setAnimatingProvider(provider.id);
    setTimeout(() => setAnimatingProvider(null), 300);

    onProviderClick?.(provider.id);
    playNotification();

    analytics.track('provider_status_click', {
      providerId: provider.id,
      status: provider.status,
      eventCount: provider.eventCount,
    });
  };

  const handleForceSync = (e: React.MouseEvent, provider: ProviderSyncStatus) => {
    e.stopPropagation();

    onForceSync?.(provider.id);
    playSuccess();

    analytics.track('provider_force_sync', {
      providerId: provider.id,
      status: provider.status,
    });
  };

  const handleConflictClick = () => {
    onConflictClick?.();
    playNotification();

    analytics.track('provider_conflicts_view', {
      conflictCount: overallHealth.totalConflicts,
    });
  };

  // Auto-update timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Compact view for mobile/minimal space
  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-2 px-3 py-2 rounded-md transition-all', className)}
        style={{
          backgroundColor: tokenBridge.getColorValue('provider.compact.background'),
          borderColor: tokenBridge.getColorValue('provider.compact.border'),
        }}
      >
        <Globe className="w-4 h-4" style={{ color: tokenBridge.getColorValue('provider.icon') }} />
        <span className="text-sm font-medium">
          {overallHealth.connectedCount}/{overallHealth.totalProviders}
        </span>

        {overallHealth.hasIssues && (
          <button
            onClick={handleConflictClick}
            className="p-1 rounded transition-colors"
            style={{ color: tokenBridge.getColorValue('status.warning') }}
            aria-label={`${overallHealth.totalConflicts} sync conflicts`}
          >
            <AlertTriangle className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('border rounded-lg shadow-sm transition-all', className)}
      style={{
        backgroundColor: tokenBridge.getColorValue('provider.status.background'),
        borderColor: tokenBridge.getColorValue('provider.status.border'),
      }}
    >
      {/* Header with overall status */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer border-b transition-colors"
        style={{ borderColor: tokenBridge.getColorValue('provider.status.border') }}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Calendar sync status. ${overallHealth.connectedCount} of ${overallHealth.totalProviders} providers connected. ${overallHealth.totalEvents} total events. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi
              className="w-4 h-4"
              style={{
                color: overallHealth.hasIssues
                  ? tokenBridge.getColorValue('status.warning')
                  : tokenBridge.getColorValue('status.success'),
              }}
            />
            <span className="text-sm font-medium">
              {i18n.t('Providers.syncStatus')} ({overallHealth.connectedCount}/
              {overallHealth.totalProviders})
            </span>
          </div>

          {/* Health indicators */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: tokenBridge.getColorValue('metrics.background'),
                color: tokenBridge.getColorValue('metrics.foreground'),
              }}
            >
              {overallHealth.totalEvents} {i18n.t('Providers.events')}
            </span>

            {overallHealth.totalConflicts > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConflictClick();
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: tokenBridge.getColorValue('status.warning.background'),
                  color: tokenBridge.getColorValue('status.warning.foreground'),
                }}
                aria-label={`${overallHealth.totalConflicts} sync conflicts`}
              >
                <AlertTriangle className="w-3 h-3" />
                {overallHealth.totalConflicts}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button */}
          {onSettings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettings();
              }}
              className="p-1 rounded transition-colors opacity-60 hover:opacity-100"
              style={{ color: tokenBridge.getColorValue('provider.controls.foreground') }}
              aria-label="Provider settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Last update time */}
          <span
            className="text-xs opacity-60"
            style={{ color: tokenBridge.getColorValue('provider.timestamp.foreground') }}
          >
            {lastUpdate.toLocaleTimeString(i18n.locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Overall health metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="p-2 rounded text-center"
              style={{
                backgroundColor: tokenBridge.getColorValue('metrics.card.background'),
                borderColor: tokenBridge.getColorValue('metrics.card.border'),
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: tokenBridge.getColorValue('metrics.primary') }}
              >
                {Math.round(overallHealth.healthScore)}%
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: tokenBridge.getColorValue('metrics.label') }}
              >
                Health Score
              </div>
            </div>

            <div
              className="p-2 rounded text-center"
              style={{
                backgroundColor: tokenBridge.getColorValue('metrics.card.background'),
                borderColor: tokenBridge.getColorValue('metrics.card.border'),
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: tokenBridge.getColorValue('metrics.primary') }}
              >
                {Math.round(overallHealth.avgSuccessRate)}%
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: tokenBridge.getColorValue('metrics.label') }}
              >
                Success Rate
              </div>
            </div>

            <div
              className="p-2 rounded text-center"
              style={{
                backgroundColor: tokenBridge.getColorValue('metrics.card.background'),
                borderColor: tokenBridge.getColorValue('metrics.card.border'),
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: tokenBridge.getColorValue('metrics.primary') }}
              >
                {overallHealth.avgLatency}ms
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: tokenBridge.getColorValue('metrics.label') }}
              >
                Avg Latency
              </div>
            </div>

            <div
              className="p-2 rounded text-center"
              style={{
                backgroundColor: tokenBridge.getColorValue('metrics.card.background'),
                borderColor: tokenBridge.getColorValue('metrics.card.border'),
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: tokenBridge.getColorValue('metrics.primary') }}
              >
                {overallHealth.totalEvents}
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: tokenBridge.getColorValue('metrics.label') }}
              >
                Total Events
              </div>
            </div>
          </div>

          {/* Individual provider status */}
          <div className="space-y-2">
            <h4
              className="text-sm font-medium"
              style={{ color: tokenBridge.getColorValue('provider.header.foreground') }}
            >
              {i18n.t('Providers.individualStatus')}
            </h4>

            <div className="grid gap-2">
              {providers.map((provider) => {
                const badgeColors = getProviderBadgeColor(provider);
                const isAnimating = animatingProvider === provider.id;

                return (
                  <div
                    key={provider.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded border cursor-pointer transition-all',
                      isAnimating && 'scale-[0.98] shadow-sm'
                    )}
                    style={{
                      backgroundColor: tokenBridge.getColorValue('provider.item.background'),
                      borderColor: badgeColors.border,
                    }}
                    onClick={() => handleProviderClick(provider)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${provider.displayName} provider. Status: ${provider.status}. ${provider.eventCount} events. ${provider.conflictCount ? `${provider.conflictCount} conflicts.` : ''} Click for details.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProviderClick(provider);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getProviderStatusIcon(provider)}
                        <span className="text-sm font-medium">{provider.displayName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Event count */}
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: tokenBridge.getColorValue('provider.count.background'),
                            color: tokenBridge.getColorValue('provider.count.foreground'),
                          }}
                        >
                          {provider.eventCount}
                        </span>

                        {/* Conflict indicator */}
                        {provider.conflictCount && provider.conflictCount > 0 && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: tokenBridge.getColorValue(
                                'status.warning.background'
                              ),
                              color: tokenBridge.getColorValue('status.warning.foreground'),
                            }}
                            title={`${provider.conflictCount} conflicts`}
                          >
                            ⚠ {provider.conflictCount}
                          </span>
                        )}

                        {/* Success rate indicator */}
                        {provider.successRate && provider.successRate < 0.95 && (
                          <span
                            className="text-xs opacity-60"
                            style={{
                              color: tokenBridge.getColorValue('status.warning.foreground'),
                            }}
                            title={`${Math.round(provider.successRate * 100)}% success rate`}
                          >
                            {Math.round(provider.successRate * 100)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Last sync time */}
                      {provider.lastSync && (
                        <span
                          className="text-xs opacity-60"
                          style={{
                            color: tokenBridge.getColorValue('provider.timestamp.foreground'),
                          }}
                          title={`Last sync: ${provider.lastSync.toLocaleString(i18n.locale)}`}
                        >
                          {provider.lastSync.toLocaleTimeString(i18n.locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {/* Sync progress for syncing providers */}
                      {provider.status === 'syncing' && provider.syncProgress && (
                        <div
                          className="text-xs opacity-75"
                          style={{ color: tokenBridge.getColorValue('status.info.foreground') }}
                        >
                          {Math.round(provider.syncProgress * 100)}%
                        </div>
                      )}

                      {/* Force sync button */}
                      {provider.status === 'connected' && onForceSync && (
                        <button
                          onClick={(e) => handleForceSync(e, provider)}
                          className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                          style={{
                            color: tokenBridge.getColorValue('provider.controls.foreground'),
                          }}
                          aria-label={`Force sync ${provider.displayName}`}
                          title="Force sync"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error messages for failed providers */}
          {providers.some((p) => p.status === 'error' && p.errorMessage) && (
            <div className="space-y-2">
              <h4
                className="text-sm font-medium"
                style={{ color: tokenBridge.getColorValue('status.error.foreground') }}
              >
                {i18n.t('Providers.errors')}
              </h4>

              {providers
                .filter((p) => p.status === 'error' && p.errorMessage)
                .map((provider) => (
                  <div
                    key={`error-${provider.id}`}
                    className="p-2 rounded border"
                    style={{
                      backgroundColor: tokenBridge.getColorValue('status.error.background'),
                      borderColor: tokenBridge.getColorValue('status.error.border'),
                      color: tokenBridge.getColorValue('status.error.foreground'),
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{provider.displayName}</div>
                        <div className="text-xs opacity-75">{provider.errorMessage}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarProviderSyncStatus;
