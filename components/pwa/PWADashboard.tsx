'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Smartphone,
  Download,
  Bell,
  Wifi,
  WifiOff,
  Activity,
  BarChart3,
  Settings,
  Share2,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Gauge
} from 'lucide-react'
import { enhancedPWAManager, type PWACapabilities, type PWAMetrics } from '@/lib/pwa/EnhancedPWAManager'

interface PWADashboardProps {
  className?: string
}

export function PWADashboard({ className }: PWADashboardProps) {
  const [capabilities, setCapabilities] = useState<PWACapabilities>(enhancedPWAManager.getCapabilities())
  const [metrics, setMetrics] = useState<PWAMetrics>(enhancedPWAManager.getMetrics())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [badgeCount, setBadgeCount] = useState(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted')

  useEffect(() => {
    // Update state periodically
    const updateState = () => {
      setCapabilities(enhancedPWAManager.getCapabilities())
      setMetrics(enhancedPWAManager.getMetrics())
    }

    const interval = setInterval(updateState, 2000)

    // Online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // PWA events
    enhancedPWAManager.on('installed', updateState)
    enhancedPWAManager.on('updateAvailable', updateState)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstallApp = async () => {
    await enhancedPWAManager.showInstallPrompt()
  }

  const handleEnableNotifications = async () => {
    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
  }

  const handleUpdateBadge = async () => {
    const newCount = badgeCount === 0 ? 5 : 0
    setBadgeCount(newCount)
    await enhancedPWAManager.updateBadge(newCount)
  }

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LinearTime Calendar',
          text: 'Life is bigger than a week - A comprehensive linear calendar for long-term planning',
          url: window.location.origin
        })
      } catch (error) {
        console.log('Share cancelled or failed:', error)
      }
    }
  }

  const getCapabilityStatus = (supported: boolean, enabled?: boolean) => {
    if (!supported) return { variant: 'outline' as const, text: 'Not Supported' }
    if (enabled === false) return { variant: 'secondary' as const, text: 'Disabled' }
    if (enabled === true) return { variant: 'default' as const, text: 'Enabled' }
    return { variant: 'default' as const, text: 'Supported' }
  }

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Never'
    
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const getEngagementLevel = () => {
    if (metrics.engagementEvents >= 100) return { level: 'High', color: 'text-green-600', progress: 100 }
    if (metrics.engagementEvents >= 50) return { level: 'Medium', color: 'text-yellow-600', progress: 75 }
    if (metrics.engagementEvents >= 20) return { level: 'Low', color: 'text-orange-600', progress: 50 }
    return { level: 'Minimal', color: 'text-gray-600', progress: 25 }
  }

  const engagement = getEngagementLevel()

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PWA Status</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={capabilities.installed ? 'default' : capabilities.installable ? 'secondary' : 'outline'}>
                  {capabilities.installed ? 'Installed' : capabilities.installable ? 'Installable' : 'Not Available'}
                </Badge>
                {capabilities.updateAvailable && (
                  <Badge variant="destructive" className="block w-fit">
                    Update Available
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection</CardTitle>
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${engagement.color}`}>
                  {engagement.level}
                </div>
                <Progress value={engagement.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {metrics.engagementEvents} interactions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pageViews}</div>
              <div className="text-xs text-muted-foreground">
                Total visits
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="capabilities" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="capabilities" className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Features
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="h-3 w-3" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PWA Capabilities</CardTitle>
                <CardDescription>
                  Available Progressive Web App features for your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Standalone Mode</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.standalone).variant}>
                      {getCapabilityStatus(capabilities.standalone).text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Push Notifications</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.pushNotificationsSupported, notificationsEnabled).variant}>
                      {getCapabilityStatus(capabilities.pushNotificationsSupported, notificationsEnabled).text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">App Badge</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.badgeSupported).variant}>
                      {getCapabilityStatus(capabilities.badgeSupported).text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Share Target</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.shareTargetSupported).variant}>
                      {getCapabilityStatus(capabilities.shareTargetSupported).text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">File Handling</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.fileHandlingSupported).variant}>
                      {getCapabilityStatus(capabilities.fileHandlingSupported).text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Background Sync</span>
                    </div>
                    <Badge variant={getCapabilityStatus(capabilities.periodicSyncSupported).variant}>
                      {getCapabilityStatus(capabilities.periodicSyncSupported).text}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage Metrics</CardTitle>
                  <CardDescription>Your app usage statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Page Views</span>
                      <span className="font-medium">{metrics.pageViews}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Engagement Events</span>
                      <span className="font-medium">{metrics.engagementEvents}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time on Site</span>
                      <span className="font-medium">
                        {Math.round(metrics.timeOnSite / 60000)}m
                      </span>
                    </div>
                    
                    {metrics.installDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Installed</span>
                        <span className="font-medium">{formatTimeAgo(metrics.installDate)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Install Metrics</CardTitle>
                  <CardDescription>Installation prompt statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prompts Shown</span>
                      <span className="font-medium">{metrics.installPromptShown}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Accepted</span>
                      <span className="font-medium text-green-600">{metrics.installPromptAccepted}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dismissed</span>
                      <span className="font-medium text-red-600">{metrics.installPromptDismissed}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Prompt</span>
                      <span className="font-medium">{formatTimeAgo(metrics.lastInstallPrompt)}</span>
                    </div>
                  </div>

                  {metrics.installPromptShown > 0 && (
                    <div className="pt-2">
                      <div className="text-sm text-muted-foreground mb-1">Acceptance Rate</div>
                      <Progress 
                        value={(metrics.installPromptAccepted / metrics.installPromptShown) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round((metrics.installPromptAccepted / metrics.installPromptShown) * 100)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PWA Controls</CardTitle>
                <CardDescription>
                  Test and control PWA features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {!capabilities.installed && capabilities.installable && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">Install App</div>
                        <div className="text-sm text-muted-foreground">
                          Add LinearTime to your home screen for quick access
                        </div>
                      </div>
                      <Button onClick={handleInstallApp}>
                        <Download className="h-4 w-4 mr-2" />
                        Install
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notifications">Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for calendar events
                      </div>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notificationsEnabled}
                      onCheckedChange={handleEnableNotifications}
                      disabled={!capabilities.pushNotificationsSupported}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">App Badge Testing</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm">Current Badge Count</div>
                        <div className="text-xs text-muted-foreground">
                          Badge count: {badgeCount}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUpdateBadge}
                        disabled={!capabilities.badgeSupported}
                      >
                        {badgeCount === 0 ? 'Set Badge (5)' : 'Clear Badge'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Share LinearTime</CardTitle>
                <CardDescription>
                  Share the app with others or test share functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg space-y-3">
                    <h3 className="font-medium">Share App</h3>
                    <p className="text-sm text-muted-foreground">
                      Share LinearTime with friends and colleagues
                    </p>
                    <Button
                      onClick={handleShareApp}
                      disabled={!capabilities.shareTargetSupported}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share LinearTime
                    </Button>
                  </div>

                  <div className="p-4 border border-border rounded-lg space-y-3">
                    <h3 className="font-medium">Native Features</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {capabilities.fileHandlingSupported ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span>Calendar file handling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {capabilities.shortcutsSupported ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span>App shortcuts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {capabilities.shareTargetSupported ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span>Share target</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PWADashboard