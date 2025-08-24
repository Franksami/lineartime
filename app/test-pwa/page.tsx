'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Smartphone, Wifi, WifiOff, Download, Bell, RefreshCw, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { OfflineStorage, isPWA, getInstallationStatus, setupPushNotifications } from '@/lib/pwa-utils'

export default function TestPWAPage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [installationStatus, setInstallationStatus] = useState<string>('not-installable')
  const [offlineEvents, setOfflineEvents] = useState<any[]>([])
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<string>('default')
  const [offlineStorage] = useState(new OfflineStorage())

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    // Check PWA installation status
    setIsPWAInstalled(isPWA())
    setInstallationStatus(getInstallationStatus())
    
    // Check push notification support
    setPushSupported('PushManager' in window)
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
    
    // Load offline events
    loadOfflineEvents()
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineEvents = async () => {
    try {
      await offlineStorage.init()
      const events = await offlineStorage.getEvents()
      setOfflineEvents(events)
    } catch (error) {
      console.error('Failed to load offline events:', error)
    }
  }

  const createOfflineEvent = async () => {
    const event = {
      id: `offline-${Date.now()}`,
      title: `Offline Event ${offlineEvents.length + 1}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      color: '#3b82f6',
      category: 'personal',
      synced: false,
      createdAt: new Date().toISOString()
    }

    try {
      await offlineStorage.saveEvent(event)
      await loadOfflineEvents()
    } catch (error) {
      console.error('Failed to save offline event:', error)
    }
  }

  const requestPushPermission = async () => {
    try {
      const success = await setupPushNotifications()
      if (success) {
        setPushPermission('granted')
      }
    } catch (error) {
      console.error('Failed to setup push notifications:', error)
    }
  }

  const triggerBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register('calendar-sync')
        console.log('Background sync registered')
      } catch (error) {
        console.error('Background sync registration failed:', error)
      }
    }
  }

  const getStatusColor = (status: boolean) => status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">PWA Features Test</h1>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(isOnline)}>
              {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge className={getStatusColor(isPWAInstalled)}>
              <Smartphone className="w-3 h-3 mr-1" />
              {isPWAInstalled ? 'Installed' : 'Web'}
            </Badge>
          </div>
        </div>

        {/* PWA Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                Installation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(isPWAInstalled)}>
                    {installationStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Installed:</span>
                  <span className="text-sm">{isPWAInstalled ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Standalone:</span>
                  <span className="text-sm">{isPWA() ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supported:</span>
                  <Badge className={getStatusColor(pushSupported)}>
                    {pushSupported ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Permission:</span>
                  <Badge className={pushPermission === 'granted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {pushPermission}
                  </Badge>
                </div>
                {pushSupported && pushPermission !== 'granted' && (
                  <Button size="sm" onClick={requestPushPermission} className="w-full">
                    Request Permission
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Offline Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Events:</span>
                  <Badge variant="outline">{offlineEvents.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unsynced:</span>
                  <Badge variant="outline">
                    {offlineEvents.filter(e => !e.synced).length}
                  </Badge>
                </div>
                <Button size="sm" onClick={createOfflineEvent} className="w-full">
                  Create Test Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offline Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Offline Events Storage
            </CardTitle>
            <CardDescription>
              Events stored locally using IndexedDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offlineEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No offline events stored. Create one to test offline functionality.
                </p>
              ) : (
                <div className="space-y-2">
                  {offlineEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(event.synced)}>
                          {event.synced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {offlineEvents.filter(e => !e.synced).length > 0 && (
                <Button onClick={triggerBackgroundSync} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trigger Background Sync
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PWA Features */}
        <Card>
          <CardHeader>
            <CardTitle>PWA Features Overview</CardTitle>
            <CardDescription>
              Test and explore Progressive Web App capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Implemented Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service Worker for caching</li>
                  <li>• Offline functionality</li>
                  <li>• Install prompts</li>
                  <li>• Background sync</li>
                  <li>• Push notifications</li>
                  <li>• IndexedDB storage</li>
                  <li>• App manifest</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🔄 How to Test</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Go offline to test caching</li>
                  <li>• Create events while offline</li>
                  <li>• Install as PWA from browser menu</li>
                  <li>• Enable notifications</li>
                  <li>• Test background sync</li>
                  <li>• Try on mobile device</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
