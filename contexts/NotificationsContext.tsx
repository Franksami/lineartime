'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

/**
 * Notifications Context - Manages toast notifications, alerts, and accessibility announcements
 * Centralizes all notification-related functionality and state management
 */

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary'
  }>
  metadata?: {
    source: 'ai' | 'sync' | 'user' | 'system'
    eventId?: string
    category?: string
  }
  dismissed: boolean
  timestamp: Date
}

export interface SystemAlert {
  id: string
  level: 'low' | 'medium' | 'high' | 'critical'
  type: 'sync_error' | 'api_limit' | 'storage_full' | 'network_error' | 'update_available'
  title: string
  message: string
  details?: string
  actionRequired: boolean
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
  resolved: boolean
  timestamp: Date
}

export interface AccessibilityAnnouncement {
  id: string
  message: string
  priority: 'polite' | 'assertive'
  timestamp: Date
  announced: boolean
}

export interface NotificationPreferences {
  enabled: boolean
  types: {
    success: boolean
    error: boolean
    warning: boolean
    info: boolean
  }
  sources: {
    ai: boolean
    sync: boolean
    user: boolean
    system: boolean
  }
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxVisible: number
  defaultDuration: number
  showInBrowser: boolean
  soundEnabled: boolean
  accessibility: {
    announceAll: boolean
    announceErrors: boolean
    announceSuccess: boolean
    screenReaderOptimized: boolean
  }
}

export interface NotificationsState {
  // Notifications
  notifications: NotificationItem[]
  maxNotifications: number
  
  // System Alerts
  alerts: SystemAlert[]
  criticalAlerts: SystemAlert[]
  
  // Accessibility
  announcements: AccessibilityAnnouncement[]
  currentAnnouncement: string
  
  // Preferences
  preferences: NotificationPreferences
  
  // State
  paused: boolean
  batchMode: boolean
  
  // Browser Notifications (PWA)
  browserPermission: 'default' | 'granted' | 'denied'
  serviceWorkerReady: boolean
  
  // Statistics
  stats: {
    totalNotifications: number
    dismissedNotifications: number
    interactedNotifications: number
    errorCount: number
    warningCount: number
  }
}

export type NotificationsAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<NotificationItem, 'id' | 'dismissed' | 'timestamp'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'DISMISS_ALL_NOTIFICATIONS' }
  | { type: 'ADD_ALERT'; payload: Omit<SystemAlert, 'id' | 'resolved' | 'timestamp'> }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Omit<AccessibilityAnnouncement, 'id' | 'timestamp' | 'announced'> }
  | { type: 'MARK_ANNOUNCEMENT_ANNOUNCED'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<NotificationPreferences> }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_BATCH_MODE'; payload: boolean }
  | { type: 'UPDATE_BROWSER_PERMISSION'; payload: NotificationPermission }
  | { type: 'SET_SERVICE_WORKER_READY'; payload: boolean }
  | { type: 'UPDATE_STATS'; payload: Partial<NotificationsState['stats']> }
  | { type: 'CLEAR_OLD_NOTIFICATIONS' }
  | { type: 'BATCH_UPDATE'; payload: Partial<NotificationsState> }

const initialPreferences: NotificationPreferences = {
  enabled: true,
  types: {
    success: true,
    error: true,
    warning: true,
    info: true
  },
  sources: {
    ai: true,
    sync: true,
    user: true,
    system: true
  },
  position: 'top-right',
  maxVisible: 5,
  defaultDuration: 4000,
  showInBrowser: true,
  soundEnabled: false,
  accessibility: {
    announceAll: false,
    announceErrors: true,
    announceSuccess: false,
    screenReaderOptimized: true
  }
}

const initialNotificationsState: NotificationsState = {
  notifications: [],
  maxNotifications: 50,
  
  alerts: [],
  criticalAlerts: [],
  
  announcements: [],
  currentAnnouncement: '',
  
  preferences: initialPreferences,
  
  paused: false,
  batchMode: false,
  
  browserPermission: 'default',
  serviceWorkerReady: false,
  
  stats: {
    totalNotifications: 0,
    dismissedNotifications: 0,
    interactedNotifications: 0,
    errorCount: 0,
    warningCount: 0
  }
}

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      if (state.paused) return state
      
      const notification: NotificationItem = {
        ...action.payload,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dismissed: false,
        timestamp: new Date()
      }
      
      // Limit number of notifications
      const notifications = [notification, ...state.notifications].slice(0, state.maxNotifications)
      
      // Update stats
      const newStats = {
        ...state.stats,
        totalNotifications: state.stats.totalNotifications + 1
      }
      
      if (notification.type === 'error') {
        newStats.errorCount += 1
      } else if (notification.type === 'warning') {
        newStats.warningCount += 1
      }
      
      // Add accessibility announcement if enabled
      const shouldAnnounce = 
        state.preferences.accessibility.announceAll ||
        (notification.type === 'error' && state.preferences.accessibility.announceErrors) ||
        (notification.type === 'success' && state.preferences.accessibility.announceSuccess)
      
      const announcements = shouldAnnounce ? [
        {
          id: `announcement_${notification.id}`,
          message: `${notification.type}: ${notification.title}`,
          priority: notification.type === 'error' ? 'assertive' as const : 'polite' as const,
          timestamp: new Date(),
          announced: false
        },
        ...state.announcements
      ] : state.announcements
      
      return {
        ...state,
        notifications,
        announcements,
        stats: newStats
      }
    }
    
    case 'DISMISS_NOTIFICATION': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, dismissed: true } : n
      )
      
      return {
        ...state,
        notifications,
        stats: {
          ...state.stats,
          dismissedNotifications: state.stats.dismissedNotifications + 1
        }
      }
    }
    
    case 'DISMISS_ALL_NOTIFICATIONS': {
      const activeNotifications = state.notifications.filter(n => !n.dismissed)
      
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, dismissed: true })),
        stats: {
          ...state.stats,
          dismissedNotifications: state.stats.dismissedNotifications + activeNotifications.length
        }
      }
    }
    
    case 'ADD_ALERT': {
      const alert: SystemAlert = {
        ...action.payload,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resolved: false,
        timestamp: new Date()
      }
      
      const alerts = [alert, ...state.alerts]
      const criticalAlerts = alert.level === 'critical' 
        ? [alert, ...state.criticalAlerts]
        : state.criticalAlerts
      
      return {
        ...state,
        alerts,
        criticalAlerts
      }
    }
    
    case 'RESOLVE_ALERT': {
      const alerts = state.alerts.map(alert =>
        alert.id === action.payload ? { ...alert, resolved: true } : alert
      )
      
      const criticalAlerts = state.criticalAlerts.filter(alert => alert.id !== action.payload)
      
      return {
        ...state,
        alerts,
        criticalAlerts
      }
    }
    
    case 'ADD_ANNOUNCEMENT': {
      const announcement: AccessibilityAnnouncement = {
        ...action.payload,
        id: `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        announced: false
      }
      
      return {
        ...state,
        announcements: [announcement, ...state.announcements.slice(0, 9)],
        currentAnnouncement: announcement.message
      }
    }
    
    case 'MARK_ANNOUNCEMENT_ANNOUNCED': {
      return {
        ...state,
        announcements: state.announcements.map(a =>
          a.id === action.payload ? { ...a, announced: true } : a
        ),
        currentAnnouncement: ''
      }
    }
    
    case 'UPDATE_PREFERENCES': {
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      }
    }
    
    case 'SET_PAUSED': {
      return { ...state, paused: action.payload }
    }
    
    case 'SET_BATCH_MODE': {
      return { ...state, batchMode: action.payload }
    }
    
    case 'UPDATE_BROWSER_PERMISSION': {
      return { ...state, browserPermission: action.payload }
    }
    
    case 'SET_SERVICE_WORKER_READY': {
      return { ...state, serviceWorkerReady: action.payload }
    }
    
    case 'UPDATE_STATS': {
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      }
    }
    
    case 'CLEAR_OLD_NOTIFICATIONS': {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      return {
        ...state,
        notifications: state.notifications.filter(n => n.timestamp > oneDayAgo),
        announcements: state.announcements.filter(a => a.timestamp > oneDayAgo)
      }
    }
    
    case 'BATCH_UPDATE': {
      return { ...state, ...action.payload }
    }
    
    default:
      return state
  }
}

export interface NotificationsContextValue {
  state: NotificationsState
  dispatch: React.Dispatch<NotificationsAction>
  
  // Notification methods
  notify: {
    success: (title: string, description?: string, options?: Partial<NotificationItem>) => void
    error: (title: string, description?: string, options?: Partial<NotificationItem>) => void
    warning: (title: string, description?: string, options?: Partial<NotificationItem>) => void
    info: (title: string, description?: string, options?: Partial<NotificationItem>) => void
  }
  
  // Alert methods
  addAlert: (alert: Omit<SystemAlert, 'id' | 'resolved' | 'timestamp'>) => void
  resolveAlert: (alertId: string) => void
  
  // Accessibility
  announce: (message: string, priority?: AccessibilityAnnouncement['priority']) => void
  
  // Management
  dismissNotification: (id: string) => void
  dismissAllNotifications: () => void
  pauseNotifications: (paused: boolean) => void
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  
  // Browser notifications (PWA)
  requestBrowserPermission: () => Promise<NotificationPermission>
  showBrowserNotification: (title: string, options?: NotificationOptions) => void
  
  // Utility methods
  getActiveNotifications: () => NotificationItem[]
  getUnresolvedAlerts: () => SystemAlert[]
  clearOldNotifications: () => void
  batchUpdate: (updates: Partial<NotificationsState>) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export interface NotificationsProviderProps {
  children: ReactNode
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [state, dispatch] = useReducer(notificationsReducer, initialNotificationsState)
  
  // Notification methods
  const createNotification = useCallback((
    type: NotificationItem['type'],
    title: string,
    description?: string,
    options?: Partial<NotificationItem>
  ) => {
    if (!state.preferences.enabled || !state.preferences.types[type]) {
      return
    }
    
    const source = options?.metadata?.source || 'user'
    if (!state.preferences.sources[source]) {
      return
    }
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type,
        title,
        description,
        duration: options?.duration ?? state.preferences.defaultDuration,
        ...options
      }
    })
  }, [state.preferences])
  
  const notify = {
    success: useCallback((title: string, description?: string, options?: Partial<NotificationItem>) =>
      createNotification('success', title, description, options), [createNotification]),
    error: useCallback((title: string, description?: string, options?: Partial<NotificationItem>) =>
      createNotification('error', title, description, options), [createNotification]),
    warning: useCallback((title: string, description?: string, options?: Partial<NotificationItem>) =>
      createNotification('warning', title, description, options), [createNotification]),
    info: useCallback((title: string, description?: string, options?: Partial<NotificationItem>) =>
      createNotification('info', title, description, options), [createNotification])
  }
  
  // Alert methods
  const addAlert = useCallback((alert: Omit<SystemAlert, 'id' | 'resolved' | 'timestamp'>) => {
    dispatch({ type: 'ADD_ALERT', payload: alert })
  }, [])
  
  const resolveAlert = useCallback((alertId: string) => {
    dispatch({ type: 'RESOLVE_ALERT', payload: alertId })
  }, [])
  
  // Accessibility
  const announce = useCallback((message: string, priority: AccessibilityAnnouncement['priority'] = 'polite') => {
    if (!state.preferences.accessibility.screenReaderOptimized) {
      return
    }
    
    dispatch({
      type: 'ADD_ANNOUNCEMENT',
      payload: { message, priority }
    })
  }, [state.preferences.accessibility.screenReaderOptimized])
  
  // Management
  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })
  }, [])
  
  const dismissAllNotifications = useCallback(() => {
    dispatch({ type: 'DISMISS_ALL_NOTIFICATIONS' })
  }, [])
  
  const pauseNotifications = useCallback((paused: boolean) => {
    dispatch({ type: 'SET_PAUSED', payload: paused })
  }, [])
  
  const updatePreferences = useCallback((preferences: Partial<NotificationPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }, [])
  
  // Browser notifications (PWA)
  const requestBrowserPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied'
    }
    
    const permission = await Notification.requestPermission()
    dispatch({ type: 'UPDATE_BROWSER_PERMISSION', payload: permission })
    return permission
  }, [])
  
  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.preferences.showInBrowser || state.browserPermission !== 'granted') {
      return
    }
    
    if ('serviceWorker' in navigator && state.serviceWorkerReady) {
      // Use service worker for better PWA support
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          ...options
        })
      })
    } else if ('Notification' in window) {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icon-192x192.svg',
        ...options
      })
    }
  }, [state.preferences.showInBrowser, state.browserPermission, state.serviceWorkerReady])
  
  // Utility methods
  const getActiveNotifications = useCallback(() => {
    return state.notifications.filter(n => !n.dismissed)
  }, [state.notifications])
  
  const getUnresolvedAlerts = useCallback(() => {
    return state.alerts.filter(a => !a.resolved)
  }, [state.alerts])
  
  const clearOldNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_OLD_NOTIFICATIONS' })
  }, [])
  
  const batchUpdate = useCallback((updates: Partial<NotificationsState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates })
  }, [])
  
  // Initialize service worker detection
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        dispatch({ type: 'SET_SERVICE_WORKER_READY', payload: true })
      })
    }
    
    // Initialize browser notification permission
    if ('Notification' in window) {
      dispatch({ type: 'UPDATE_BROWSER_PERMISSION', payload: Notification.permission })
    }
  }, [])
  
  // Clean up old notifications periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      clearOldNotifications()
    }, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [clearOldNotifications])
  
  const contextValue: NotificationsContextValue = {
    state,
    dispatch,
    notify,
    addAlert,
    resolveAlert,
    announce,
    dismissNotification,
    dismissAllNotifications,
    pauseNotifications,
    updatePreferences,
    requestBrowserPermission,
    showBrowserNotification,
    getActiveNotifications,
    getUnresolvedAlerts,
    clearOldNotifications,
    batchUpdate
  }
  
  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  }
  return context
}

// Specialized hooks for specific notification concerns
export function useNotifications() {
  const { notify, dismissNotification, dismissAllNotifications, state } = useNotificationsContext()
  return {
    notify,
    notifications: state.notifications,
    activeNotifications: state.notifications.filter(n => !n.dismissed),
    dismissNotification,
    dismissAllNotifications
  }
}

export function useSystemAlerts() {
  const { state, addAlert, resolveAlert } = useNotificationsContext()
  return {
    alerts: state.alerts,
    criticalAlerts: state.criticalAlerts,
    unresolvedAlerts: state.alerts.filter(a => !a.resolved),
    addAlert,
    resolveAlert
  }
}

export function useAccessibility() {
  const { state, announce } = useNotificationsContext()
  return {
    announcements: state.announcements,
    currentAnnouncement: state.currentAnnouncement,
    announce,
    preferences: state.preferences.accessibility
  }
}

export function useBrowserNotifications() {
  const { state, requestBrowserPermission, showBrowserNotification } = useNotificationsContext()
  return {
    permission: state.browserPermission,
    serviceWorkerReady: state.serviceWorkerReady,
    enabled: state.preferences.showInBrowser,
    requestPermission: requestBrowserPermission,
    showNotification: showBrowserNotification
  }
}