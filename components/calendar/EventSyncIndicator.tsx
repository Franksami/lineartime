'use client';

import React from 'react';
import { Cloud, CloudOff, AlertCircle, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SyncStatus = 'synced' | 'pending' | 'conflict' | 'local' | 'error';

interface EventSyncIndicatorProps {
  status?: SyncStatus;
  provider?: string;
  lastSyncedAt?: Date;
  className?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const providerIcons: Record<string, React.ReactNode> = {
  google: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  microsoft: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4 11.4H2.6V2.6h8.8v8.8zm10 0h-8.8V2.6h8.8v8.8zm-10 10H2.6v-8.8h8.8v8.8zm10 0h-8.8v-8.8h8.8v8.8z"/>
    </svg>
  ),
  apple: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09v-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  ),
  caldav: <Calendar className="w-full h-full" />,
  notion: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
    </svg>
  ),
  obsidian: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.645 6.143L15.858 2.61a3.475 3.475 0 00-1.19-.863L8.379.018a.415.415 0 00-.49.324L6.16 8.097 3.2 14.625l-1.666 3.318a.776.776 0 00.045.785l3.92 5.896c.177.267.572.306.806.087l7.306-6.847 6.69-6.047a1.816 1.816 0 00.393-2.387l-2.05-3.287zm-2.468 4.785l-3.52 3.194c-.115.104-.186.257-.195.416l-.264 4.453-3.268 3.066-2.264-3.4a.596.596 0 00-.185-.197l-2.89-1.927 1.03-2.062 3.095-5.625.867-1.565 3.143.987c.145.046.263.144.33.274l1.66 3.195a.57.57 0 01-.076.608l-1.318 1.58 2.242 1.492c.297.198.363.607.153.901l-.74.96z"/>
    </svg>
  ),
};

const statusConfig: Record<SyncStatus, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  description: string;
}> = {
  synced: {
    icon: CheckCircle,
    color: 'text-primary',
    label: 'Synced',
    description: 'Event is synced with external calendar',
  },
  pending: {
    icon: RefreshCw,
    color: 'text-muted-foreground',
    label: 'Syncing',
    description: 'Event is being synced',
  },
  conflict: {
    icon: AlertCircle,
    color: 'text-secondary',
    label: 'Conflict',
    description: 'Event has sync conflicts that need resolution',
  },
  local: {
    icon: CloudOff,
    color: 'text-muted-foreground',
    label: 'Local Only',
    description: 'Event exists only locally',
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    label: 'Sync Error',
    description: 'Failed to sync this event',
  },
};

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function EventSyncIndicator({
  status = 'local',
  provider,
  lastSyncedAt,
  className,
  showLabel = false,
  size = 'sm',
}: EventSyncIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClass = sizeClasses[size];

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const content = (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* Provider icon */}
      {provider && status === 'synced' && (
        <div className={cn(sizeClass, 'opacity-60')}>
          {providerIcons[provider] || <Cloud className="w-full h-full" />}
        </div>
      )}
      
      {/* Status icon */}
      <Icon 
        className={cn(
          sizeClass,
          config.color,
          status === 'pending' && 'animate-spin'
        )} 
      />
      
      {/* Label */}
      {showLabel && (
        <span className={cn('text-xs', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
              {provider && (
                <p className="text-xs text-muted-foreground">
                  Provider: {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </p>
              )}
              {lastSyncedAt && status === 'synced' && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {formatLastSync(lastSyncedAt)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

interface SyncStatusBarProps {
  isSyncing: boolean;
  lastSync?: Date;
  provider?: string;
  pendingCount?: number;
  errorCount?: number;
  className?: string;
}

export function SyncStatusBar({
  isSyncing,
  lastSync,
  provider,
  pendingCount = 0,
  errorCount = 0,
  className,
}: SyncStatusBarProps) {
  return (
    <div className={cn('flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg', className)}>
      {/* Sync status */}
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Syncing...</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {lastSync ? `Last sync: ${formatTime(lastSync)}` : 'Never synced'}
            </span>
          </>
        )}
      </div>

      {/* Provider */}
      {provider && (
        <Badge variant="secondary" className="text-xs">
          {provider}
        </Badge>
      )}

      {/* Counts */}
      <div className="flex items-center gap-2 ml-auto">
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            {pendingCount} pending
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            {errorCount} errors
          </Badge>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}