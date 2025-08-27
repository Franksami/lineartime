import type { Event } from '@/types/calendar';
// Web Worker Hook - Manages worker lifecycle and communication
import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkerMessage<T = unknown> {
  type: string;
  data?: T;
  id: string;
  result?: T;
  error?: string;
}

interface UseWorkerOptions<T = unknown> {
  onMessage?: (message: WorkerMessage<T>) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export function useWorker<T = unknown>(workerPath: string, options: UseWorkerOptions<T> = {}) {
  const workerRef = useRef<Worker | null>(null);
  const pendingMessages = useRef<Map<string, (result: T) => void>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messageIdCounter = useRef(0);

  // Extract stable callback references to prevent infinite re-renders
  const { onMessage, onError, onReady } = options;
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Create worker instance
      const worker = new Worker(workerPath);

      // Handle messages from worker
      worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;

        if (message.type === 'READY') {
          setIsReady(true);
          setIsLoading(false);
          onReadyRef.current?.();
        } else if (message.type === 'SUCCESS') {
          // Resolve pending promise
          const resolver = pendingMessages.current.get(message.id);
          if (resolver) {
            resolver(message.result);
            pendingMessages.current.delete(message.id);
          }
        } else if (message.type === 'ERROR') {
          // Reject pending promise
          const resolver = pendingMessages.current.get(message.id);
          if (resolver) {
            resolver(Promise.reject(new Error(message.error)));
            pendingMessages.current.delete(message.id);
          }
          onErrorRef.current?.(new Error(message.error));
        } else {
          onMessageRef.current?.(message);
        }
      });

      // Handle worker errors
      worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
        setIsLoading(false);
        onErrorRef.current?.(error);
      });

      workerRef.current = worker;
    } catch (error) {
      console.error('Failed to create worker:', error);
      setIsLoading(false);
      onErrorRef.current?.(error as Error);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingMessages.current.clear();
    };
  }, [workerPath]); // Only depend on workerPath, not the entire options object

  // Send message to worker
  const sendMessage = useCallback(
    async <U = T>(type: string, data?: U): Promise<U> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        if (!isReady) {
          reject(new Error('Worker not ready'));
          return;
        }

        const id = `msg-${++messageIdCounter.current}`;

        // Store resolver for this message
        pendingMessages.current.set(id, resolve);

        // Send message to worker
        workerRef.current.postMessage({
          type,
          data,
          id,
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingMessages.current.has(id)) {
            pendingMessages.current.delete(id);
            reject(new Error('Worker message timeout'));
          }
        }, 30000);
      });
    },
    [isReady]
  );

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
    }
  }, []);

  return {
    sendMessage,
    terminate,
    isReady,
    isLoading,
    worker: workerRef.current,
  };
}

// Specialized hook for calendar worker
export function useCalendarWorker() {
  const worker = useWorker('/calendar-worker-v2.js'); // Updated to use V2 with column-based layout

  const calculateLayout = useCallback(
    async (events: Event[]) => {
      return worker.sendMessage('CALCULATE_LAYOUT', { events });
    },
    [worker]
  );

  const detectConflicts = useCallback(
    async (events: Event[]) => {
      return worker.sendMessage('DETECT_CONFLICTS', { events });
    },
    [worker]
  );

  const optimizePositions = useCallback(
    async (events: Event[], layouts: unknown[]) => {
      return worker.sendMessage('OPTIMIZE_POSITIONS', { events, layouts });
    },
    [worker]
  );

  // New column-based layout method using Google Calendar algorithm
  const layoutEventsV2 = useCallback(
    async (events: Event[], containerWidth?: number) => {
      return worker.sendMessage('LAYOUT_EVENTS_V2', { events, containerWidth });
    },
    [worker]
  );

  return {
    ...worker,
    calculateLayout,
    detectConflicts,
    optimizePositions,
    layoutEventsV2, // New method for column-based layout
  };
}
