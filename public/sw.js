const CACHE_NAME = 'lineartime-v1'
const urlsToCache = [
  '/',
  '/analytics',
  '/themes',
  '/test-enhanced-calendar',
  '/test-category-tags',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Background sync for offline events
self.addEventListener('sync', (event) => {
  if (event.tag === 'calendar-sync') {
    event.waitUntil(syncCalendarEvents())
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New calendar notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Calendar',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-96x96.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('LinearTime Calendar', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close()
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Background sync function for calendar events
async function syncCalendarEvents() {
  try {
    // Open IndexedDB and get pending events
    const db = await openDB()
    const transaction = db.transaction(['events'], 'readonly')
    const store = transaction.objectStore('events')
    const index = store.index('synced')
    const pendingEvents = await getAllFromIndex(index, false)

    // Sync each pending event
    for (const event of pendingEvents) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        })

        if (response.ok) {
          // Mark as synced in IndexedDB
          await markEventSynced(db, event.id)
          console.log('Synced event:', event.id)
        }
      } catch (error) {
        console.log('Failed to sync event:', event.id, error)
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error)
  }
}

// Helper functions for IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LinearTimeCalendar', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function getAllFromIndex(index, query) {
  return new Promise((resolve, reject) => {
    const request = index.getAll(query)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function markEventSynced(db, eventId) {
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