'use client';

import { notify } from '@/components/ui/notify';
import {
  registerBackgroundSync,
  registerServiceWorker,
  setupPushNotifications,
} from '@/lib/pwa-utils';
import type React from 'react';
import { useEffect, useRef } from 'react';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const _onlineToastId = useRef<string | number | null>(null);
  const _offlineToastId = useRef<string | number | null>(null);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Register background sync
    registerBackgroundSync();

    // Setup push notifications (optional - user will be prompted)
    // setupPushNotifications()

    // Listen for app updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('App has been updated! Please refresh to see the latest version.');
        notify.info('App updated! Please refresh to see the latest version.', {
          duration: 8000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        });
      });
    }

    // Handle offline/online status
    const handleOnline = () => {
      console.log('App is online');
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready
          .then((registration) => {
            return registration.sync.register('calendar-sync');
          })
          .catch((error) => {
            console.log('Background sync registration failed:', error);
          });
      }
    };

    const handleOffline = () => {
      console.log('App is offline');
      // You could show an offline indicator here
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}
