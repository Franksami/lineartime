// Web Worker Hook - Manages worker lifecycle and communication
import { useEffect, useRef, useCallback, useState } from 'react'

interface WorkerMessage {
  type: string
  data?: any
  id: string
  result?: any
  error?: string
}

interface UseWorkerOptions {
  onMessage?: (message: WorkerMessage) => void
  onError?: (error: Error) => void
  onReady?: () => void
}

export function useWorker(
  workerPath: string,
  options: UseWorkerOptions = {}
) {
  const workerRef = useRef<Worker | null>(null)
  const pendingMessages = useRef<Map<string, (result: any) => void>>(new Map())
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messageIdCounter = useRef(0)
  
  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Create worker instance
      const worker = new Worker(workerPath)
      
      // Handle messages from worker
      worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
        const message = event.data
        
        if (message.type === 'READY') {
          setIsReady(true)
          setIsLoading(false)
          options.onReady?.()
        } else if (message.type === 'SUCCESS') {
          // Resolve pending promise
          const resolver = pendingMessages.current.get(message.id)
          if (resolver) {
            resolver(message.result)
            pendingMessages.current.delete(message.id)
          }
        } else if (message.type === 'ERROR') {
          // Reject pending promise
          const resolver = pendingMessages.current.get(message.id)
          if (resolver) {
            resolver(Promise.reject(new Error(message.error)))
            pendingMessages.current.delete(message.id)
          }
          options.onError?.(new Error(message.error))
        } else {
          options.onMessage?.(message)
        }
      })
      
      // Handle worker errors
      worker.addEventListener('error', (error) => {
        console.error('Worker error:', error)
        setIsLoading(false)
        options.onError?.(error)
      })
      
      workerRef.current = worker
    } catch (error) {
      console.error('Failed to create worker:', error)
      setIsLoading(false)
      options.onError?.(error as Error)
    }
    
    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pendingMessages.current.clear()
    }
  }, [workerPath])
  
  // Send message to worker
  const sendMessage = useCallback(async <T = any>(
    type: string,
    data?: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      if (!isReady) {
        reject(new Error('Worker not ready'))
        return
      }
      
      const id = `msg-${++messageIdCounter.current}`
      
      // Store resolver for this message
      pendingMessages.current.set(id, resolve)
      
      // Send message to worker
      workerRef.current.postMessage({
        type,
        data,
        id
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingMessages.current.has(id)) {
          pendingMessages.current.delete(id)
          reject(new Error('Worker message timeout'))
        }
      }, 30000)
    })
  }, [isReady])
  
  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      setIsReady(false)
    }
  }, [])
  
  return {
    sendMessage,
    terminate,
    isReady,
    isLoading,
    worker: workerRef.current
  }
}

// Specialized hook for calendar worker
export function useCalendarWorker() {
  const worker = useWorker('/calendar-worker-v2.js') // Updated to use V2 with column-based layout
  
  const calculateLayout = useCallback(async (events: any[]) => {
    return worker.sendMessage('CALCULATE_LAYOUT', { events })
  }, [worker.sendMessage])
  
  const detectConflicts = useCallback(async (events: any[]) => {
    return worker.sendMessage('DETECT_CONFLICTS', { events })
  }, [worker.sendMessage])
  
  const optimizePositions = useCallback(async (events: any[], layouts: any[]) => {
    return worker.sendMessage('OPTIMIZE_POSITIONS', { events, layouts })
  }, [worker.sendMessage])
  
  // New column-based layout method using Google Calendar algorithm
  const layoutEventsV2 = useCallback(async (events: any[], containerWidth?: number) => {
    return worker.sendMessage('LAYOUT_EVENTS_V2', { events, containerWidth })
  }, [worker.sendMessage])
  
  return {
    ...worker,
    calculateLayout,
    detectConflicts,
    optimizePositions,
    layoutEventsV2 // New method for column-based layout
  }
}