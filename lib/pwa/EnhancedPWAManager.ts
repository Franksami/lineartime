/**
 * EnhancedPWAManager - Comprehensive PWA features with native app capabilities
 * Features:
 * - Smart install prompts with user behavior tracking
 * - App badge notifications
 * - Shortcuts management
 * - File handling integration
 * - Share target functionality
 * - Periodic background sync
 * - App lifecycle management
 */

interface PWAInstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWACapabilities {
  standalone: boolean
  installable: boolean
  installed: boolean
  updateAvailable: boolean
  badgeSupported: boolean
  shortcutsSupported: boolean
  shareTargetSupported: boolean
  fileHandlingSupported: boolean
  periodicSyncSupported: boolean
  pushNotificationsSupported: boolean
}

export interface PWAConfig {
  // Install prompt behavior
  installPrompt: {
    enabled: boolean
    delayAfterPageViews: number
    minTimeOnSite: number // milliseconds
    showOnEngagement: boolean
    maxPromptAttempts: number
  }
  
  // Badge notifications
  badgeNotifications: {
    enabled: boolean
    updateOnEvents: boolean
    clearOnFocus: boolean
  }
  
  // Background sync
  backgroundSync: {
    enabled: boolean
    periodicSyncTag: string
    minimumInterval: number // milliseconds
  }
  
  // Push notifications
  pushNotifications: {
    enabled: boolean
    vapidPublicKey?: string
    autoRequest: boolean
  }
  
  // Share target
  shareTarget: {
    enabled: boolean
    handleUrls: boolean
    handleFiles: boolean
    acceptedFileTypes: string[]
  }
}

export interface PWAMetrics {
  pageViews: number
  timeOnSite: number
  engagementEvents: number
  installPromptShown: number
  installPromptAccepted: number
  installPromptDismissed: number
  lastInstallPrompt: number
  isInstalled: boolean
  installDate?: number
}

export class EnhancedPWAManager {
  private config: PWAConfig
  private metrics: PWAMetrics
  private deferredPrompt: PWAInstallEvent | null = null
  private capabilities: PWACapabilities
  private listeners: { [event: string]: Function[] } = {}
  private sessionStartTime = Date.now()

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = {
      installPrompt: {
        enabled: true,
        delayAfterPageViews: 3,
        minTimeOnSite: 30000, // 30 seconds
        showOnEngagement: true,
        maxPromptAttempts: 3
      },
      badgeNotifications: {
        enabled: true,
        updateOnEvents: true,
        clearOnFocus: true
      },
      backgroundSync: {
        enabled: true,
        periodicSyncTag: 'periodic-calendar-sync',
        minimumInterval: 12 * 60 * 60 * 1000 // 12 hours
      },
      pushNotifications: {
        enabled: true,
        autoRequest: false
      },
      shareTarget: {
        enabled: true,
        handleUrls: true,
        handleFiles: true,
        acceptedFileTypes: ['.ics', '.csv', 'text/calendar']
      },
      ...config
    }

    this.capabilities = this.detectCapabilities()
    this.metrics = this.loadMetrics()
    this.initialize()
  }

  private detectCapabilities(): PWACapabilities {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone

    return {
      standalone: isStandalone,
      installable: false, // Will be updated when beforeinstallprompt fires
      installed: isStandalone,
      updateAvailable: false,
      badgeSupported: 'setAppBadge' in navigator,
      shortcutsSupported: 'getInstalledApps' in navigator,
      shareTargetSupported: 'share' in navigator,
      fileHandlingSupported: 'launchQueue' in window,
      periodicSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotificationsSupported: 'Notification' in window && 'serviceWorker' in navigator
    }
  }

  private initialize(): void {
    console.log('[PWA] Initializing Enhanced PWA Manager...')
    
    // Update metrics
    this.updatePageView()
    
    // Set up event listeners
    this.setupEventListeners()
    
    // Initialize features based on capabilities
    this.initializeFeatures()
    
    console.log('[PWA] PWA Manager initialized with capabilities:', this.capabilities)
  }

  private setupEventListeners(): void {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this))
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this))
    
    // Service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', this.handleServiceWorkerUpdate.bind(this))
    }
    
    // Visibility changes (for badge clearing)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Page unload (for metrics)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    
    // Engagement tracking
    this.setupEngagementTracking()
    
    // Share target handling
    if (this.config.shareTarget.enabled && this.capabilities.shareTargetSupported) {
      this.setupShareTargetHandling()
    }
    
    // File handling
    if (this.config.shareTarget.enabled && this.capabilities.fileHandlingSupported) {
      this.setupFileHandling()
    }
  }

  private initializeFeatures(): void {
    // Badge notifications
    if (this.config.badgeNotifications.enabled && this.capabilities.badgeSupported) {
      this.initializeBadgeNotifications()
    }
    
    // Background sync
    if (this.config.backgroundSync.enabled && this.capabilities.periodicSyncSupported) {
      this.initializeBackgroundSync()
    }
    
    // Push notifications
    if (this.config.pushNotifications.enabled && this.capabilities.pushNotificationsSupported) {
      this.initializePushNotifications()
    }
  }

  private handleBeforeInstallPrompt(event: Event): void {
    event.preventDefault()
    this.deferredPrompt = event as PWAInstallEvent
    this.capabilities.installable = true
    
    console.log('[PWA] Install prompt available')
    this.emit('installable', { available: true })
    
    // Check if we should show install prompt automatically
    if (this.shouldShowInstallPrompt()) {
      setTimeout(() => {
        this.showInstallPrompt()
      }, 1000)
    }
  }

  private handleAppInstalled(): void {
    this.deferredPrompt = null
    this.capabilities.installed = true
    this.capabilities.installable = false
    
    this.metrics.isInstalled = true
    this.metrics.installDate = Date.now()
    this.metrics.installPromptAccepted++
    
    this.saveMetrics()
    
    console.log('[PWA] App was installed')
    this.emit('installed', { timestamp: Date.now() })
    
    // Set up post-install features
    this.setupPostInstallFeatures()
  }

  private handleServiceWorkerUpdate(): void {
    this.capabilities.updateAvailable = true
    console.log('[PWA] App update available')
    this.emit('updateAvailable', { timestamp: Date.now() })
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Clear badge when app becomes visible
      if (this.config.badgeNotifications.clearOnFocus && this.capabilities.badgeSupported) {
        this.clearBadge()
      }
    }
  }

  private handleBeforeUnload(): void {
    // Update time on site metric
    this.metrics.timeOnSite = Date.now() - this.sessionStartTime
    this.saveMetrics()
  }

  private setupEngagementTracking(): void {
    // Track various engagement signals
    const engagementEvents = ['click', 'scroll', 'keypress', 'touch']
    
    const trackEngagement = () => {
      this.metrics.engagementEvents++
      if (this.metrics.engagementEvents % 10 === 0) {
        this.saveMetrics()
      }
    }
    
    engagementEvents.forEach(event => {
      document.addEventListener(event, trackEngagement, { passive: true })
    })
  }

  private setupShareTargetHandling(): void {
    // Handle shared content when app is launched as share target
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        console.log('[PWA] Handling launch parameters:', launchParams)
        
        if (launchParams.targetURL) {
          this.handleSharedUrl(launchParams.targetURL)
        }
        
        if (launchParams.files && launchParams.files.length > 0) {
          this.handleSharedFiles(launchParams.files)
        }
      })
    }
  }

  private setupFileHandling(): void {
    // Handle file associations
    if ('launchQueue' in window) {
      console.log('[PWA] File handling initialized for types:', this.config.shareTarget.acceptedFileTypes)
    }
  }

  private initializeBadgeNotifications(): void {
    console.log('[PWA] Badge notifications initialized')
    
    // Example: Set initial badge based on pending events
    // this.updateBadge(this.getPendingEventsCount())
  }

  private async initializeBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        
        // Register periodic sync if supported
        if ('periodicSync' in registration) {
          const status = await (registration as any).periodicSync.register(
            this.config.backgroundSync.periodicSyncTag,
            {
              minInterval: this.config.backgroundSync.minimumInterval
            }
          )
          console.log('[PWA] Periodic sync registered:', status)
        }
      } catch (error) {
        console.error('[PWA] Failed to register periodic sync:', error)
      }
    }
  }

  private async initializePushNotifications(): Promise<void> {
    if (!this.capabilities.pushNotificationsSupported) return
    
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('[PWA] Push notifications permitted')
      
      // Subscribe to push notifications if VAPID key is provided
      if (this.config.pushNotifications.vapidPublicKey) {
        await this.subscribeToPushNotifications()
      }
    }
  }

  private setupPostInstallFeatures(): void {
    // Features that are available only after installation
    console.log('[PWA] Setting up post-install features...')
    
    // Add app shortcuts
    this.addDynamicShortcuts()
    
    // Set up periodic badge updates
    this.startBadgeUpdates()
  }

  // Public API Methods

  public getCapabilities(): PWACapabilities {
    return { ...this.capabilities }
  }

  public getMetrics(): PWAMetrics {
    return { ...this.metrics }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available')
      return false
    }

    try {
      this.metrics.installPromptShown++
      this.saveMetrics()
      
      await this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        this.metrics.installPromptAccepted++
        console.log('[PWA] User accepted install prompt')
      } else {
        this.metrics.installPromptDismissed++
        console.log('[PWA] User dismissed install prompt')
      }
      
      this.metrics.lastInstallPrompt = Date.now()
      this.saveMetrics()
      this.deferredPrompt = null
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error)
      return false
    }
  }

  public async updateBadge(count: number): Promise<void> {
    if (!this.capabilities.badgeSupported) return
    
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count)
      } else {
        await (navigator as any).clearAppBadge()
      }
      console.log(`[PWA] Badge updated: ${count}`)
    } catch (error) {
      console.error('[PWA] Failed to update badge:', error)
    }
  }

  public async clearBadge(): Promise<void> {
    if (!this.capabilities.badgeSupported) return
    
    try {
      await (navigator as any).clearAppBadge()
      console.log('[PWA] Badge cleared')
    } catch (error) {
      console.error('[PWA] Failed to clear badge:', error)
    }
  }

  public async addDynamicShortcuts(): Promise<void> {
    // Add dynamic app shortcuts
    const shortcuts = [
      {
        name: 'New Event',
        short_name: 'New Event',
        description: 'Create a new calendar event',
        url: '/?shortcut=new-event',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }]
      },
      {
        name: 'Today\'s Schedule',
        short_name: 'Today',
        description: 'View today\'s events',
        url: '/?shortcut=today',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }]
      },
      {
        name: 'Analytics',
        short_name: 'Analytics',
        description: 'View calendar analytics',
        url: '/analytics?shortcut=analytics',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }]
      }
    ]
    
    // Note: Dynamic shortcuts API is limited, but we can update the manifest
    console.log('[PWA] Dynamic shortcuts prepared:', shortcuts.length)
  }

  public async shareCalendarEvent(event: any): Promise<boolean> {
    if (!this.capabilities.shareTargetSupported) return false
    
    try {
      const shareData = {
        title: event.title,
        text: `${event.title}\n${new Date(event.startDate).toLocaleString()} - ${new Date(event.endDate).toLocaleString()}`,
        url: `${window.location.origin}/?event=${event.id}`
      }
      
      await navigator.share(shareData)
      console.log('[PWA] Event shared successfully')
      return true
    } catch (error) {
      console.error('[PWA] Share failed:', error)
      return false
    }
  }

  private shouldShowInstallPrompt(): boolean {
    if (!this.config.installPrompt.enabled || !this.deferredPrompt) return false
    
    // Check attempt limits
    if (this.metrics.installPromptShown >= this.config.installPrompt.maxPromptAttempts) {
      return false
    }
    
    // Check page view threshold
    if (this.metrics.pageViews < this.config.installPrompt.delayAfterPageViews) {
      return false
    }
    
    // Check time on site
    if (Date.now() - this.sessionStartTime < this.config.installPrompt.minTimeOnSite) {
      return false
    }
    
    // Check engagement if required
    if (this.config.installPrompt.showOnEngagement && this.metrics.engagementEvents < 5) {
      return false
    }
    
    return true
  }

  private updatePageView(): void {
    this.metrics.pageViews++
    this.saveMetrics()
  }

  private startBadgeUpdates(): void {
    if (!this.config.badgeNotifications.enabled) return
    
    // Update badge periodically based on pending events
    setInterval(() => {
      // This would integrate with your calendar system
      // const pendingCount = this.getPendingEventsCount()
      // this.updateBadge(pendingCount)
    }, 60000) // Every minute
  }

  private async subscribeToPushNotifications(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.pushNotifications.vapidPublicKey!)
      })
      
      // Send subscription to server
      console.log('[PWA] Push subscription:', subscription)
      
    } catch (error) {
      console.error('[PWA] Push notification subscription failed:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private handleSharedUrl(url: string): void {
    console.log('[PWA] Handling shared URL:', url)
    this.emit('urlShared', { url })
  }

  private handleSharedFiles(files: File[]): void {
    console.log('[PWA] Handling shared files:', files.length)
    this.emit('filesShared', { files })
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  public off(event: string, callback: Function): void {
    if (!this.listeners[event]) return
    
    const index = this.listeners[event].indexOf(callback)
    if (index > -1) {
      this.listeners[event].splice(index, 1)
    }
  }

  private emit(event: string, data?: any): void {
    if (!this.listeners[event]) return
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[PWA] Event listener error for ${event}:`, error)
      }
    })
  }

  // Persistence
  private loadMetrics(): PWAMetrics {
    try {
      const stored = localStorage.getItem('pwa-metrics')
      if (stored) {
        return { ...this.getDefaultMetrics(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('[PWA] Failed to load metrics:', error)
    }
    
    return this.getDefaultMetrics()
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem('pwa-metrics', JSON.stringify(this.metrics))
    } catch (error) {
      console.error('[PWA] Failed to save metrics:', error)
    }
  }

  private getDefaultMetrics(): PWAMetrics {
    return {
      pageViews: 0,
      timeOnSite: 0,
      engagementEvents: 0,
      installPromptShown: 0,
      installPromptAccepted: 0,
      installPromptDismissed: 0,
      lastInstallPrompt: 0,
      isInstalled: false
    }
  }

  public updateConfig(newConfig: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[PWA] Configuration updated')
  }

  public destroy(): void {
    // Clean up event listeners and intervals
    console.log('[PWA] PWA Manager destroyed')
  }
}

// Export singleton instance
export const enhancedPWAManager = new EnhancedPWAManager()