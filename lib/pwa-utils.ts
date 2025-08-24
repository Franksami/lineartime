export interface OfflineEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
  category?: string
  priority?: string
  tags?: string[]
  description?: string
  synced: boolean
  createdAt: string
}

// IndexedDB setup for offline storage
export class OfflineStorage {
  private dbName = "LinearTimeCalendar"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create events store
        if (!db.objectStoreNames.contains("events")) {
          const eventsStore = db.createObjectStore("events", { keyPath: "id" })
          eventsStore.createIndex("synced", "synced", { unique: false })
          eventsStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
      }
    })
  }

  async saveEvent(event: OfflineEvent): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readwrite")
      const store = transaction.objectStore("events")
      const request = store.put(event)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getEvents(): Promise<OfflineEvent[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readonly")
      const store = transaction.objectStore("events")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getPendingEvents(): Promise<OfflineEvent[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readonly")
      const store = transaction.objectStore("events")
      const index = store.index("synced")
      const request = index.getAll(false)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async markEventSynced(eventId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readwrite")
      const store = transaction.objectStore("events")
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
}

// Service Worker registration
export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("SW registered: ", registration)

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available
                console.log("New content is available; please refresh.")
              }
            })
          }
        })
      } catch (error) {
        console.log("SW registration failed: ", error)
      }
    })
  }
}

// Background sync registration
export function registerBackgroundSync(): void {
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register("calendar-sync")
      })
      .catch((error) => {
        console.log("Background sync registration failed:", error)
      })
  }
}

// Push notification setup
export async function setupPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push messaging is not supported")
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const permission = await Notification.requestPermission()

    if (permission !== "granted") {
      console.log("Notification permission denied")
      return false
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
    })

    console.log("Push subscription:", subscription)
    return true
  } catch (error) {
    console.error("Failed to setup push notifications:", error)
    return false
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Check if app is running as PWA
export function isPWA(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone
}

// Get app installation status
export function getInstallationStatus(): "installed" | "installable" | "not-installable" {
  if (isPWA()) {
    return "installed"
  }

  // Check if beforeinstallprompt was fired (stored in session)
  if (sessionStorage.getItem("beforeinstallprompt-fired")) {
    return "installable"
  }

  return "not-installable"
}
