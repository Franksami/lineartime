// Enhanced Service Worker for LinearTime Calendar
// Version 2.0 - Advanced caching strategies with drag-drop analytics integration

const CACHE_VERSION = 'v2.1.0'
const STATIC_CACHE = `lineartime-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `lineartime-dynamic-${CACHE_VERSION}`
const API_CACHE = `lineartime-api-${CACHE_VERSION}`
const IMAGES_CACHE = `lineartime-images-${CACHE_VERSION}`
const ANALYTICS_CACHE = `lineartime-analytics-${CACHE_VERSION}`

// Cache configurations with TTL (Time To Live)
const CACHE_CONFIG = {
  static: {
    name: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50
  },
  api: {
    name: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100
  },
  images: {
    name: IMAGES_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200
  },
  analytics: {
    name: ANALYTICS_CACHE,
    maxAge: 60 * 1000, // 1 minute
    maxEntries: 50
  }
}

// Static resources to cache immediately (Cache First strategy)
const STATIC_RESOURCES = [
  '/',
  '/analytics',
  '/themes',
  '/test-enhanced-calendar',
  '/test-category-tags',
  '/test-ai-scheduling',
  '/test-pwa',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico'
]

// API endpoints for caching (Network First with fallback)
const API_PATTERNS = [
  /\/api\/events/,
  /\/api\/analytics/,
  /\/api\/drag-drop/,
  /\/api\/billing/,
  /\/api\/auth/
]

// Image patterns (Cache First with network fallback)
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\/images\//,
  /\/icons\//,
  /\/static\/media\//
]

// Analytics patterns (Stale While Revalidate)
const ANALYTICS_PATTERNS = [
  /\/api\/analytics/,
  /\/api\/drag-drop\/metrics/,
  /\/api\/performance/
]

// Install event - Cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.1.0...')
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, { cache: 'reload' })))
      }),
      
      // Initialize analytics storage
      initializeAnalyticsStorage(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.1.0...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients immediately
      self.clients.claim(),
      
      // Initialize background sync
      initializeBackgroundSync()
    ])
  )
})

// Fetch event - Advanced routing with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Route to appropriate caching strategy
  if (isStaticResource(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE))
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGES_CACHE))
  } else if (isAnalyticsRequest(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request, ANALYTICS_CACHE))
  } else {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE))
  }
})

// Background sync for offline events and analytics
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'calendar-sync') {
    event.waitUntil(syncCalendarEvents())
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData())
  } else if (event.tag === 'drag-drop-sync') {
    event.waitUntil(syncDragDropAnalytics())
  }
})

// Push notification handling with enhanced features
self.addEventListener('push', (event) => {
  let data = {}
  
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'LinearTime Calendar', body: event.data ? event.data.text() : 'New notification' }
  }
  
  const options = {
    title: data.title || 'LinearTime Calendar',
    body: data.body || 'New calendar notification',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: Date.now(),
    data: {
      ...data,
      dateOfArrival: Date.now(),
      primaryKey: data.id || Date.now().toString()
    },
    actions: [
      {
        action: 'open',
        title: 'Open Calendar',
        icon: '/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-96x96.png'
      }
    ],
    tag: data.tag || 'calendar-notification'
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  )
})

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data || {}
  
  if (action === 'open' || !action) {
    // Open the app to specific page if provided
    const urlToOpen = data.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus()
            if (data.url) client.navigate(data.url)
            return
          }
        }
        
        // Open new window
        return clients.openWindow(urlToOpen)
      })
    )
  } else if (action === 'dismiss') {
    // Log dismissal for analytics
    logNotificationAction('dismissed', data)
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION })
      break
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches())
      break
      
    case 'FORCE_SYNC':
      event.waitUntil(forceSyncAll())
      break
      
    case 'LOG_ANALYTICS':
      event.waitUntil(storeAnalyticsData(payload))
      break
      
    default:
      console.log('[SW] Unknown message type:', type)
  }
})

// CACHING STRATEGIES

// Cache First - Good for static resources
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request, { cacheName })
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      
      // Add timestamp header for expiration checking
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      })
      
      cache.put(request, responseWithTimestamp)
      await cleanupCache(cacheName)
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network error, serving from cache:', error)
    return cachedResponse || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

// Network First - Good for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      })
      
      cache.put(request, responseWithTimestamp)
      await cleanupCache(cacheName)
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network error, trying cache:', error)
    
    const cachedResponse = await caches.match(request, { cacheName })
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

// Stale While Revalidate - Good for analytics and frequently changing data
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request, { cacheName })
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      const cache = caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      })
      
      cache.then(c => c.put(request, responseWithTimestamp))
      cleanupCache(cacheName)
    }
    
    return networkResponse
  }).catch((error) => {
    console.log('[SW] Network error in stale-while-revalidate:', error)
    return cachedResponse
  })
  
  return cachedResponse || fetchPromise
}

// UTILITY FUNCTIONS

function isStaticResource(request) {
  const url = new URL(request.url)
  return STATIC_RESOURCES.some(resource => url.pathname === resource) ||
         url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css')
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return API_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isImageRequest(request) {
  const url = new URL(request.url)
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isAnalyticsRequest(request) {
  const url = new URL(request.url)
  return ANALYTICS_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isExpired(response) {
  const cachedAt = response.headers.get('sw-cached-at')
  if (!cachedAt) return true
  
  const age = Date.now() - parseInt(cachedAt)
  const maxAge = CACHE_CONFIG.static.maxAge // Default to static cache TTL
  
  return age > maxAge
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys()
  const currentCaches = Object.values(CACHE_CONFIG).map(config => config.name)
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName)
        return caches.delete(cacheName)
      })
  )
}

async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  const config = Object.values(CACHE_CONFIG).find(c => c.name === cacheName)
  
  if (!config) return
  
  // Remove expired entries
  const now = Date.now()
  const expiredKeys = []
  
  for (const key of keys) {
    const response = await cache.match(key)
    const cachedAt = response.headers.get('sw-cached-at')
    
    if (cachedAt && (now - parseInt(cachedAt)) > config.maxAge) {
      expiredKeys.push(key)
    }
  }
  
  // Remove expired entries
  await Promise.all(expiredKeys.map(key => cache.delete(key)))
  
  // Remove oldest entries if over limit
  const remainingKeys = await cache.keys()
  if (remainingKeys.length > config.maxEntries) {
    const entriesToRemove = remainingKeys.slice(0, remainingKeys.length - config.maxEntries)
    await Promise.all(entriesToRemove.map(key => cache.delete(key)))
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  return Promise.all(cacheNames.map(name => caches.delete(name)))
}

// BACKGROUND SYNC FUNCTIONS

async function initializeBackgroundSync() {
  console.log('[SW] Initializing background sync...')
  
  // Register sync events
  const registration = await self.registration
  
  try {
    await registration.sync.register('calendar-sync')
    await registration.sync.register('analytics-sync')
    await registration.sync.register('drag-drop-sync')
    console.log('[SW] Background sync registered successfully')
  } catch (error) {
    console.log('[SW] Background sync registration failed:', error)
  }
}

async function syncCalendarEvents() {
  console.log('[SW] Syncing calendar events...')
  
  try {
    const db = await openIndexedDB()
    const pendingEvents = await getPendingEvents(db)
    
    let syncedCount = 0
    let failedCount = 0
    
    for (const event of pendingEvents) {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        })
        
        if (response.ok) {
          await markEventSynced(db, event.id)
          syncedCount++
          console.log('[SW] Synced event:', event.id)
        } else {
          failedCount++
          console.log('[SW] Failed to sync event:', event.id, response.status)
        }
      } catch (error) {
        failedCount++
        console.log('[SW] Error syncing event:', event.id, error)
      }
    }
    
    console.log(`[SW] Calendar sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`)
    
    // Show notification if there were sync results
    if (syncedCount > 0) {
      await self.registration.showNotification('Calendar Sync', {
        body: `${syncedCount} event(s) synchronized`,
        icon: '/icon-192x192.png',
        tag: 'sync-notification'
      })
    }
    
  } catch (error) {
    console.error('[SW] Calendar sync failed:', error)
  }
}

async function syncAnalyticsData() {
  console.log('[SW] Syncing analytics data...')
  
  try {
    const analyticsData = await getStoredAnalytics()
    
    if (analyticsData.length === 0) {
      console.log('[SW] No analytics data to sync')
      return
    }
    
    const response = await fetch('/api/analytics/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsData)
    })
    
    if (response.ok) {
      await clearStoredAnalytics()
      console.log('[SW] Analytics data synced successfully')
    } else {
      console.log('[SW] Failed to sync analytics:', response.status)
    }
    
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error)
  }
}

async function syncDragDropAnalytics() {
  console.log('[SW] Syncing drag-drop analytics...')
  
  try {
    const dragDropData = await getStoredDragDropAnalytics()
    
    if (dragDropData.length === 0) {
      console.log('[SW] No drag-drop analytics to sync')
      return
    }
    
    const response = await fetch('/api/drag-drop/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dragDropData)
    })
    
    if (response.ok) {
      await clearStoredDragDropAnalytics()
      console.log('[SW] Drag-drop analytics synced successfully')
    } else {
      console.log('[SW] Failed to sync drag-drop analytics:', response.status)
    }
    
  } catch (error) {
    console.error('[SW] Drag-drop analytics sync failed:', error)
  }
}

async function forceSyncAll() {
  console.log('[SW] Force syncing all data...')
  
  await Promise.all([
    syncCalendarEvents(),
    syncAnalyticsData(),
    syncDragDropAnalytics()
  ])
  
  console.log('[SW] Force sync completed')
}

// INDEXEDDB HELPERS

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LinearTimeCalendar', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('events')) {
        const eventsStore = db.createObjectStore('events', { keyPath: 'id' })
        eventsStore.createIndex('synced', 'synced', { unique: false })
      }
      
      if (!db.objectStoreNames.contains('analytics')) {
        const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true })
        analyticsStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      if (!db.objectStoreNames.contains('dragdrop')) {
        const dragDropStore = db.createObjectStore('dragdrop', { keyPath: 'id', autoIncrement: true })
        dragDropStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

async function getPendingEvents(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['events'], 'readonly')
    const store = transaction.objectStore('events')
    const index = store.index('synced')
    const request = index.getAll(false)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function markEventSynced(db, eventId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['events'], 'readwrite')
    const store = transaction.objectStore('events')
    const getRequest = store.get(eventId)
    
    getRequest.onsuccess = () => {
      const event = getRequest.result
      if (event) {
        event.synced = true
        const putRequest = store.put(event)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
    
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// ANALYTICS STORAGE

async function initializeAnalyticsStorage() {
  console.log('[SW] Initializing analytics storage...')
  // Analytics storage is initialized in the main IndexedDB setup
}

async function storeAnalyticsData(data) {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['analytics'], 'readwrite')
    const store = transaction.objectStore('analytics')
    
    await store.add({
      ...data,
      timestamp: Date.now()
    })
    
    console.log('[SW] Analytics data stored')
  } catch (error) {
    console.error('[SW] Failed to store analytics data:', error)
  }
}

async function getStoredAnalytics() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['analytics'], 'readonly')
    const store = transaction.objectStore('analytics')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('[SW] Failed to get analytics data:', error)
    return []
  }
}

async function clearStoredAnalytics() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['analytics'], 'readwrite')
    const store = transaction.objectStore('analytics')
    
    await store.clear()
    console.log('[SW] Analytics data cleared')
  } catch (error) {
    console.error('[SW] Failed to clear analytics data:', error)
  }
}

async function getStoredDragDropAnalytics() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['dragdrop'], 'readonly')
    const store = transaction.objectStore('dragdrop')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('[SW] Failed to get drag-drop analytics:', error)
    return []
  }
}

async function clearStoredDragDropAnalytics() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['dragdrop'], 'readwrite')
    const store = transaction.objectStore('dragdrop')
    
    await store.clear()
    console.log('[SW] Drag-drop analytics cleared')
  } catch (error) {
    console.error('[SW] Failed to clear drag-drop analytics:', error)
  }
}

function logNotificationAction(action, data) {
  // Log notification interactions for analytics
  const analyticsEvent = {
    type: 'notification_interaction',
    action,
    data,
    timestamp: Date.now()
  }
  
  storeAnalyticsData(analyticsEvent)
}

console.log('[SW] Enhanced service worker v2.1.0 loaded successfully')