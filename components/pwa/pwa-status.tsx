'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Download, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is installed
    const checkInstalled = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone
      ) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleRefreshApp = () => {
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col gap-2 sm:top-16 sm:right-4">
      {/* Online/Offline Status */}
      <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* PWA Installation Status */}
      {isInstalled && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          App Installed
        </Badge>
      )}

      {/* Notification Status */}
      {isInstalled && (
        <div className="flex items-center gap-1">
          <Badge
            variant={notificationsEnabled ? 'default' : 'outline'}
            className="flex items-center gap-1"
          >
            {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
            {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
          </Badge>
          {!notificationsEnabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEnableNotifications}
              className="h-6 px-2 text-xs"
            >
              Enable
            </Button>
          )}
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary">Update Available</Badge>
          <Button size="sm" variant="ghost" onClick={handleRefreshApp} className="h-6 px-2 text-xs">
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
