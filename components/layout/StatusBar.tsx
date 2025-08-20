'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Cloud, CloudOff, HelpCircle, Keyboard, RefreshCw } from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate sync status changes
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleString('en-US', options);
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-3.5 h-3.5 text-glass-primary animate-spin" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <>
      <div className={cn('glass border-t border-glass-border', className)}>
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left Section - Sync Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getSyncIcon()}
                <span className="text-sm text-oklch-gray-600">
                  {getSyncText()}
                </span>
              </div>
              {syncStatus === 'synced' && (
                <span className="text-xs text-oklch-gray-500">
                  Last sync: Just now
                </span>
              )}
            </div>

            {/* Center Section - Current Date/Time */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-oklch-gray-700">
                {formatDate(currentTime)}
              </span>
            </div>

            {/* Right Section - Help */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-glass-primary/10 transition-colors"
              >
                <Keyboard className="w-3.5 h-3.5 text-oklch-gray-500" />
                <span className="text-xs text-oklch-gray-500">Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">
                  ?
                </kbd>
                <span className="text-xs text-oklch-gray-500">for help</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-heavy rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-glass-primary" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-oklch-gray-500 hover:text-oklch-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Toggle help</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">?</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Go to today</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">T</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Previous month</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">←</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Next month</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">→</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zoom in</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">+</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zoom out</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">-</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">New event</span>
                <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">N</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Search</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 rounded bg-glass-primary/10 border border-glass-border text-xs font-mono">K</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}