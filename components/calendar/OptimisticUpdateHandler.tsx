'use client';

import { useCalendarContext } from '@/contexts/CalendarContext';
import { useSoundEffects } from '@/lib/sound-service';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWebSocketSync } from './WebSocketSyncManager';

// Types for optimistic updates
export interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  eventId: string;
  data: Event | Partial<Event>;
  snapshot: StateSnapshot;
  retryCount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back';
  latency?: number;
}

export interface StateSnapshot {
  eventId: string;
  calendarState: {
    selectedEvent: Event | null;
    selectedDate: Date | null;
    year: number;
    zoomLevel: string;
  };
  timestamp: number;
}

export interface OptimisticState {
  operations: OptimisticOperation[];
  isProcessing: boolean;
  pendingCount: number;
  failedCount: number;
  averageLatency: number;
  memoryUsage: number;
}

export interface ConflictResolution {
  conflictId: string;
  operationId: string;
  serverData: Event | Partial<Event>;
  clientData: Event | Partial<Event>;
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  timestamp: number;
}

export interface OptimisticUpdateConfig {
  // Performance Settings
  maxOperations: number;
  snapshotRetentionMs: number;
  batchSize: number;
  throttleMs: number;

  // Rollback Configuration
  enableRollbackAnimations: boolean;
  rollbackAnimationMs: number;
  rollbackEasing: string;

  // Conflict Resolution
  defaultResolution: 'server_wins' | 'client_wins' | 'merge';
  enableManualResolution: boolean;

  // Memory Management
  memoryThresholdMB: number;
  enableGarbageCollection: boolean;

  // Performance Monitoring
  enableLatencyTracking: boolean;
  enableMemoryTracking: boolean;
}

export interface OptimisticUpdateHandlerProps {
  config?: Partial<OptimisticUpdateConfig>;
  onConflict?: (conflict: ConflictResolution) => void;
  onOperationComplete?: (operation: OptimisticOperation) => void;
  onRollback?: (operation: OptimisticOperation) => void;
  onPerformanceWarning?: (metrics: OptimisticState) => void;
  className?: string;
  children?: React.ReactNode;
}

// Default configuration
const DEFAULT_CONFIG: OptimisticUpdateConfig = {
  maxOperations: 100,
  snapshotRetentionMs: 300000, // 5 minutes
  batchSize: 10,
  throttleMs: 50,
  enableRollbackAnimations: true,
  rollbackAnimationMs: 300,
  rollbackEasing: 'ease-out',
  defaultResolution: 'server_wins',
  enableManualResolution: true,
  memoryThresholdMB: 10,
  enableGarbageCollection: true,
  enableLatencyTracking: true,
  enableMemoryTracking: true,
};

/**
 * OptimisticUpdateHandler Component
 *
 * Provides immediate UI updates with intelligent rollback capabilities for LinearTime's
 * real-time calendar synchronization system. Integrates with WebSocketSyncManager for
 * server coordination and implements ShareDB-inspired operational transforms.
 *
 * Core Features:
 * - <50ms optimistic update response time
 * - Intelligent rollback animations with natural transitions
 * - Memory-efficient state snapshot system with automatic cleanup
 * - Conflict resolution with operational transform patterns
 * - Performance monitoring with <10MB memory overhead
 * - Integration with existing WebSocket infrastructure
 * - Sound effects and accessibility feedback
 */
export function OptimisticUpdateHandler({
  config: configOverrides = {},
  onConflict,
  onOperationComplete,
  onRollback,
  onPerformanceWarning,
  className,
  children,
}: OptimisticUpdateHandlerProps) {
  // Merge configuration with defaults
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...configOverrides }), [configOverrides]);

  // Context and hooks
  const {
    state: calendarState,
    dispatch: calendarDispatch,
    announceMessage,
  } = useCalendarContext();
  const { sendEventUpdate, isConnected, connectionStatus } = useWebSocketSync();
  const { playSound } = useSoundEffects();

  // State management
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({
    operations: [],
    isProcessing: false,
    pendingCount: 0,
    failedCount: 0,
    averageLatency: 0,
    memoryUsage: 0,
  });

  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [rollbackAnimations, setRollbackAnimations] = useState<Map<string, boolean>>(new Map());

  // Refs for performance
  const operationsRef = useRef<OptimisticOperation[]>([]);
  const snapshotCacheRef = useRef<Map<string, StateSnapshot>>(new Map());
  const latencyBufferRef = useRef<number[]>([]);
  const performanceRef = useRef({
    lastMemoryCheck: 0,
    lastCleanup: 0,
    operationStartTimes: new Map<string, number>(),
  });

  // Performance monitoring
  const memoryRef = useRef<{
    snapshots: number;
    operations: number;
    estimated: number;
  }>({ snapshots: 0, operations: 0, estimated: 0 });

  // Operation ID generator
  const generateOperationId = useCallback((): string => {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create state snapshot for rollback
  const createSnapshot = useCallback(
    (eventId: string): StateSnapshot | null => {
      try {
        // Use structuredClone for efficient deep copy
        const snapshot: StateSnapshot = structuredClone({
          eventId,
          calendarState: {
            selectedEvent: calendarState.selectedEvent,
            selectedDate: calendarState.selectedDate,
            // Only snapshot relevant state parts to minimize memory
            year: calendarState.year,
            zoomLevel: calendarState.zoomLevel.toString(),
          },
          timestamp: Date.now(),
        });

        // Cache snapshot for quick access
        snapshotCacheRef.current.set(eventId, snapshot);

        // Update memory tracking
        memoryRef.current.snapshots++;
        memoryRef.current.estimated += JSON.stringify(snapshot).length / 1024; // Rough KB estimate

        return snapshot;
      } catch (error) {
        console.error('Failed to create state snapshot:', error);
        return null;
      }
    },
    [calendarState]
  );

  // Calculate memory usage
  const calculateMemoryUsage = useCallback((): number => {
    if (!config.enableMemoryTracking) return 0;

    const now = Date.now();
    if (now - performanceRef.current.lastMemoryCheck < 5000) {
      return memoryRef.current.estimated;
    }

    performanceRef.current.lastMemoryCheck = now;

    // Calculate estimated memory usage
    const operationsSize = operationsRef.current.length * 0.5; // KB per operation estimate
    const snapshotsSize = snapshotCacheRef.current.size * 2; // KB per snapshot estimate
    const total = operationsSize + snapshotsSize;

    memoryRef.current.estimated = total;

    return total;
  }, [config.enableMemoryTracking]);

  // Garbage collection for old operations and snapshots
  const performGarbageCollection = useCallback(() => {
    if (!config.enableGarbageCollection) return;

    const now = Date.now();
    const retentionThreshold = now - config.snapshotRetentionMs;

    // Clean old operations
    const validOperations = operationsRef.current.filter((op) => {
      const isRecent = op.timestamp > retentionThreshold;
      const isPending = op.status === 'pending';
      return isRecent || isPending;
    });

    const removedCount = operationsRef.current.length - validOperations.length;
    operationsRef.current = validOperations;

    // Clean old snapshots
    const validSnapshots = new Map();
    const validEventIds = new Set(validOperations.map((op) => op.eventId));

    snapshotCacheRef.current.forEach((snapshot, eventId) => {
      if (validEventIds.has(eventId) || snapshot.timestamp > retentionThreshold) {
        validSnapshots.set(eventId, snapshot);
      }
    });

    snapshotCacheRef.current = validSnapshots;

    // Update memory tracking
    memoryRef.current.operations = validOperations.length;
    memoryRef.current.snapshots = validSnapshots.size;

    performanceRef.current.lastCleanup = now;

    if (removedCount > 0) {
      console.log(
        `Optimistic GC: Cleaned ${removedCount} operations, memory: ${calculateMemoryUsage().toFixed(1)}KB`
      );
    }
  }, [config.enableGarbageCollection, config.snapshotRetentionMs, calculateMemoryUsage]);

  // Update performance metrics
  const updateMetrics = useCallback(() => {
    const operations = operationsRef.current;
    const pendingCount = operations.filter((op) => op.status === 'pending').length;
    const failedCount = operations.filter((op) => op.status === 'failed').length;

    // Calculate average latency
    let averageLatency = 0;
    if (config.enableLatencyTracking && latencyBufferRef.current.length > 0) {
      const sum = latencyBufferRef.current.reduce((acc, lat) => acc + lat, 0);
      averageLatency = sum / latencyBufferRef.current.length;
    }

    const memoryUsage = calculateMemoryUsage();

    const newState: OptimisticState = {
      operations: [...operations], // Create new array for immutability
      isProcessing: pendingCount > 0,
      pendingCount,
      failedCount,
      averageLatency: Math.round(averageLatency),
      memoryUsage: Math.round(memoryUsage),
    };

    setOptimisticState(newState);

    // Performance warning check
    if (memoryUsage > config.memoryThresholdMB * 1024) {
      // Convert MB to KB
      onPerformanceWarning?.(newState);
    }
  }, [
    config.enableLatencyTracking,
    config.memoryThresholdMB,
    calculateMemoryUsage,
    onPerformanceWarning,
  ]);

  // Track operation latency
  const trackLatency = useCallback(
    (operationId: string, latency: number) => {
      if (!config.enableLatencyTracking) return;

      latencyBufferRef.current.push(latency);

      // Keep buffer size manageable
      if (latencyBufferRef.current.length > 100) {
        latencyBufferRef.current.shift();
      }

      // Update operation with latency
      operationsRef.current = operationsRef.current.map((op) =>
        op.id === operationId ? { ...op, latency } : op
      );
    },
    [config.enableLatencyTracking]
  );

  // Execute optimistic update
  const executeOptimisticUpdate = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      eventId: string,
      data: Event | Partial<Event>
    ): Promise<string> => {
      const operationId = generateOperationId();
      const startTime = Date.now();

      try {
        // Create state snapshot for rollback
        const snapshot = createSnapshot(eventId);
        if (!snapshot) {
          throw new Error('Failed to create state snapshot');
        }

        // Create operation record
        const operation: OptimisticOperation = {
          id: operationId,
          type,
          timestamp: startTime,
          eventId,
          data,
          snapshot,
          retryCount: 0,
          status: 'pending',
        };

        // Add to operations list
        operationsRef.current.push(operation);
        performanceRef.current.operationStartTimes.set(operationId, startTime);

        // Immediately update UI (optimistic)
        calendarDispatch({
          type: 'BATCH_UPDATE',
          payload: {
            selectedEvent: type === 'create' || type === 'update' ? data : null,
          },
        });

        // Performance target: <50ms for UI update
        const uiUpdateTime = Date.now() - startTime;

        // Send to server via WebSocket
        if (isConnected) {
          await sendEventUpdate(data, type);
        }

        // Track performance
        if (uiUpdateTime < 50) {
          playSound('success');
          announceMessage(`${type} operation completed optimistically`);
        } else {
          console.warn(`Optimistic update exceeded 50ms target: ${uiUpdateTime}ms`);
        }

        updateMetrics();
        return operationId;
      } catch (error) {
        // Mark operation as failed
        operationsRef.current = operationsRef.current.map((op) =>
          op.id === operationId ? { ...op, status: 'failed' } : op
        );

        console.error('Optimistic update failed:', error);
        playSound('error');
        announceMessage(`${type} operation failed`);

        updateMetrics();
        throw error;
      }
    },
    [
      generateOperationId,
      createSnapshot,
      calendarDispatch,
      isConnected,
      sendEventUpdate,
      playSound,
      announceMessage,
      updateMetrics,
    ]
  );

  // Confirm operation (server acknowledged)
  const confirmOperation = useCallback(
    (operationId: string, _serverData?: Event | Partial<Event>) => {
      const startTime = performanceRef.current.operationStartTimes.get(operationId);
      const latency = startTime ? Date.now() - startTime : 0;

      operationsRef.current = operationsRef.current.map((operation) => {
        if (operation.id === operationId) {
          const confirmedOperation: OptimisticOperation = {
            ...operation,
            status: 'confirmed',
            latency,
          };

          // Track latency
          if (latency > 0) {
            trackLatency(operationId, latency);
          }

          // Clean up
          performanceRef.current.operationStartTimes.delete(operationId);
          onOperationComplete?.(confirmedOperation);

          return confirmedOperation;
        }
        return operation;
      });

      updateMetrics();

      // Success feedback
      playSound('success');
    },
    [trackLatency, onOperationComplete, updateMetrics, playSound]
  );

  // Rollback operation with animation
  const rollbackOperation = useCallback(
    async (operationId: string, reason = 'Server conflict') => {
      const operation = operationsRef.current.find((op) => op.id === operationId);
      if (!operation) return;

      try {
        // Start rollback animation if enabled
        if (config.enableRollbackAnimations) {
          setRollbackAnimations((prev) => new Map(prev.set(operationId, true)));
        }

        // Restore state from snapshot
        const snapshot = operation.snapshot;
        if (snapshot?.calendarState) {
          calendarDispatch({
            type: 'BATCH_UPDATE',
            payload: snapshot.calendarState,
          });
        }

        // Update operation status
        operationsRef.current = operationsRef.current.map((op) =>
          op.id === operationId ? { ...op, status: 'rolled_back' } : op
        );

        // Wait for animation to complete
        if (config.enableRollbackAnimations) {
          await new Promise((resolve) => setTimeout(resolve, config.rollbackAnimationMs));
          setRollbackAnimations((prev) => {
            const newMap = new Map(prev);
            newMap.delete(operationId);
            return newMap;
          });
        }

        // Clean up snapshot
        snapshotCacheRef.current.delete(operation.eventId);
        performanceRef.current.operationStartTimes.delete(operationId);

        // Feedback
        playSound('error');
        announceMessage(`Operation rolled back: ${reason}`);

        onRollback?.(operation);
        updateMetrics();
      } catch (error) {
        console.error('Rollback failed:', error);
        announceMessage('Rollback failed, please refresh');
      }
    },
    [
      config.enableRollbackAnimations,
      config.rollbackAnimationMs,
      calendarDispatch,
      playSound,
      announceMessage,
      onRollback,
      updateMetrics,
    ]
  );

  // Handle server conflicts
  const resolveConflict = useCallback(
    (
      operationId: string,
      serverData: Event | Partial<Event>,
      clientData: Event | Partial<Event>
    ) => {
      const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const conflict: ConflictResolution = {
        conflictId,
        operationId,
        serverData,
        clientData,
        resolution: config.defaultResolution,
        timestamp: Date.now(),
      };

      // Apply resolution strategy
      switch (config.defaultResolution) {
        case 'server_wins':
          // Rollback client operation, accept server data
          rollbackOperation(operationId, 'Server data takes precedence');
          break;

        case 'client_wins':
          // Keep client data, ignore server update
          confirmOperation(operationId, clientData);
          break;

        case 'merge': {
          // Attempt to merge data (simplified merge)
          const mergedData = { ...serverData, ...clientData };
          confirmOperation(operationId, mergedData);
          break;
        }
      }

      setConflicts((prev) => [...prev, conflict]);
      onConflict?.(conflict);

      announceMessage(`Conflict resolved using ${config.defaultResolution} strategy`);
    },
    [config.defaultResolution, rollbackOperation, confirmOperation, onConflict, announceMessage]
  );

  // Retry failed operations
  const retryOperation = useCallback(
    async (operationId: string) => {
      const operation = operationsRef.current.find((op) => op.id === operationId);
      if (!operation || operation.retryCount >= 3) return;

      // Update retry count
      operationsRef.current = operationsRef.current.map((op) =>
        op.id === operationId ? { ...op, retryCount: op.retryCount + 1, status: 'pending' } : op
      );

      // Retry the operation
      try {
        if (isConnected) {
          await sendEventUpdate(operation.data, operation.type);
        }
        updateMetrics();
      } catch (_error) {
        // Mark as failed if retry fails
        operationsRef.current = operationsRef.current.map((op) =>
          op.id === operationId ? { ...op, status: 'failed' } : op
        );
        updateMetrics();
      }
    },
    [isConnected, sendEventUpdate, updateMetrics]
  );

  // Batch retry failed operations
  const retryFailedOperations = useCallback(async () => {
    const failedOps = operationsRef.current.filter(
      (op) => op.status === 'failed' && op.retryCount < 3
    );

    for (const operation of failedOps) {
      await retryOperation(operation.id);
      // Small delay between retries to avoid flooding
      await new Promise((resolve) => setTimeout(resolve, config.throttleMs));
    }
  }, [retryOperation, config.throttleMs]);

  // Clear completed operations
  const clearCompletedOperations = useCallback(() => {
    const activeStatuses = ['pending', 'failed'];
    operationsRef.current = operationsRef.current.filter((op) =>
      activeStatuses.includes(op.status)
    );
    updateMetrics();
  }, [updateMetrics]);

  // Periodic garbage collection
  useEffect(() => {
    const interval = setInterval(() => {
      performGarbageCollection();
      updateMetrics();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [performGarbageCollection, updateMetrics]);

  // Monitor connection status for failed operations
  useEffect(() => {
    if (isConnected && connectionStatus === 'connected') {
      // Retry failed operations when connection is restored
      const failedCount = operationsRef.current.filter((op) => op.status === 'failed').length;
      if (failedCount > 0) {
        announceMessage(`Connection restored. Retrying ${failedCount} failed operations.`);
        retryFailedOperations();
      }
    }
  }, [isConnected, connectionStatus, retryFailedOperations, announceMessage]);

  // Context value for child components
  const contextValue = useMemo(
    () => ({
      // State
      optimisticState,
      conflicts,
      isProcessing: optimisticState.isProcessing,

      // Core operations
      executeOptimisticUpdate,
      confirmOperation,
      rollbackOperation,

      // Conflict resolution
      resolveConflict,

      // Management
      retryOperation,
      retryFailedOperations,
      clearCompletedOperations,

      // Utilities
      getOperation: (id: string) => operationsRef.current.find((op) => op.id === id),
      getPendingOperations: () => operationsRef.current.filter((op) => op.status === 'pending'),
      getFailedOperations: () => operationsRef.current.filter((op) => op.status === 'failed'),

      // Performance
      getMemoryUsage: calculateMemoryUsage,
      performGarbageCollection,
    }),
    [
      optimisticState,
      conflicts,
      executeOptimisticUpdate,
      confirmOperation,
      rollbackOperation,
      resolveConflict,
      retryOperation,
      retryFailedOperations,
      clearCompletedOperations,
      calculateMemoryUsage,
      performGarbageCollection,
    ]
  );

  return (
    <OptimisticUpdateContext.Provider value={contextValue}>
      <div className={cn('optimistic-update-handler', className)}>
        {children}

        {/* Rollback Animation Overlay */}
        <AnimatePresence>
          {Array.from(rollbackAnimations.entries()).map(
            ([operationId, isActive]) =>
              isActive &&
              config.enableRollbackAnimations && (
                <motion.div
                  key={operationId}
                  className="absolute inset-0 bg-red-500 /* TODO: Use semantic token *//10 pointer-events-none rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: config.rollbackAnimationMs / 1000,
                    ease: config.rollbackEasing,
                  }}
                  style={{ zIndex: 1000 }}
                />
              )
          )}
        </AnimatePresence>

        {/* Performance Monitor (Development) */}
        {process.env.NODE_ENV === 'development' && optimisticState.pendingCount > 0 && (
          <motion.div
            className="fixed top-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 /* TODO: Use semantic token */ rounded-full animate-pulse" />
              <span className="font-semibold">Optimistic Updates</span>
            </div>

            <div className="space-y-1">
              <div>Pending: {optimisticState.pendingCount}</div>
              <div>Failed: {optimisticState.failedCount}</div>
              <div>Avg Latency: {optimisticState.averageLatency}ms</div>
              <div>Memory: {optimisticState.memoryUsage}KB</div>
            </div>

            {optimisticState.failedCount > 0 && (
              <button
                onClick={retryFailedOperations}
                className="mt-2 px-2 py-1 bg-red-600 /* TODO: Use semantic token */ hover:bg-red-500 /* TODO: Use semantic token */ rounded text-xs"
              >
                Retry Failed ({optimisticState.failedCount})
              </button>
            )}
          </motion.div>
        )}
      </div>
    </OptimisticUpdateContext.Provider>
  );
}

// Context for accessing optimistic update functionality
const OptimisticUpdateContext = createContext<{
  optimisticState: OptimisticState;
  conflicts: ConflictResolution[];
  isProcessing: boolean;
  executeOptimisticUpdate: (
    type: 'create' | 'update' | 'delete',
    eventId: string,
    data: Event | Partial<Event>
  ) => Promise<string>;
  confirmOperation: (operationId: string, serverData?: Event | Partial<Event>) => void;
  rollbackOperation: (operationId: string, reason?: string) => Promise<void>;
  resolveConflict: (
    operationId: string,
    serverData: Event | Partial<Event>,
    clientData: Event | Partial<Event>
  ) => void;
  retryOperation: (operationId: string) => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  clearCompletedOperations: () => void;
  getOperation: (id: string) => OptimisticOperation | undefined;
  getPendingOperations: () => OptimisticOperation[];
  getFailedOperations: () => OptimisticOperation[];
  getMemoryUsage: () => number;
  performGarbageCollection: () => void;
} | null>(null);

// Hook for accessing optimistic update functionality
export function useOptimisticUpdate() {
  const context = useContext(OptimisticUpdateContext);
  if (!context) {
    throw new Error('useOptimisticUpdate must be used within an OptimisticUpdateHandler');
  }
  return context;
}

// Hook for optimistic state management
export function useOptimisticState() {
  const { optimisticState, isProcessing } = useOptimisticUpdate();
  return { optimisticState, isProcessing };
}

// Hook for rollback management
export function useRollback() {
  const { rollbackOperation, getFailedOperations, retryFailedOperations } = useOptimisticUpdate();

  const rollbackAll = useCallback(async () => {
    const failed = getFailedOperations();
    for (const operation of failed) {
      await rollbackOperation(operation.id, 'Manual rollback');
    }
  }, [rollbackOperation, getFailedOperations]);

  return {
    rollbackOperation,
    rollbackAll,
    retryFailedOperations,
    failedOperations: getFailedOperations(),
  };
}

// Hook for conflict resolution
export function useOptimisticConflicts() {
  const { conflicts, resolveConflict } = useOptimisticUpdate();

  const resolveAllConflicts = useCallback(
    (resolution: 'server_wins' | 'client_wins' | 'merge') => {
      conflicts.forEach((conflict) => {
        if (conflict.resolution !== resolution) {
          resolveConflict(conflict.operationId, conflict.serverData, conflict.clientData);
        }
      });
    },
    [conflicts, resolveConflict]
  );

  return {
    conflicts,
    resolveConflict,
    resolveAllConflicts,
    hasConflicts: conflicts.length > 0,
  };
}

// State Snapshot Manager (internal utility)
class StateSnapshotManager {
  private snapshots = new Map<string, StateSnapshot>();
  private maxSnapshots: number;

  constructor(maxSnapshots = 100) {
    this.maxSnapshots = maxSnapshots;
  }

  createSnapshot(id: string, state: StateSnapshot): boolean {
    try {
      // Clean old snapshots if at capacity
      if (this.snapshots.size >= this.maxSnapshots) {
        const oldestKey = this.snapshots.keys().next().value;
        this.snapshots.delete(oldestKey);
      }

      const snapshot = structuredClone(state);
      this.snapshots.set(id, snapshot);
      return true;
    } catch (error) {
      console.error('Snapshot creation failed:', error);
      return false;
    }
  }

  getSnapshot(id: string): StateSnapshot | null {
    return this.snapshots.get(id) || null;
  }

  deleteSnapshot(id: string): void {
    this.snapshots.delete(id);
  }

  clear(): void {
    this.snapshots.clear();
  }

  getMemoryUsage(): number {
    // Estimate memory usage in KB
    let total = 0;
    this.snapshots.forEach((snapshot) => {
      total += JSON.stringify(snapshot).length;
    });
    return total / 1024;
  }
}

// Rollback Animation Manager (internal utility)
class RollbackAnimationManager {
  private activeAnimations = new Set<string>();
  private animationQueue: Array<{ id: string; callback: () => void }> = [];

  async playRollbackAnimation(id: string, duration = 300, callback?: () => void): Promise<void> {
    if (this.activeAnimations.has(id)) return;

    this.activeAnimations.add(id);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.activeAnimations.delete(id);
        callback?.();
        resolve();
      }, duration);
    });
  }

  isAnimating(id: string): boolean {
    return this.activeAnimations.has(id);
  }

  cancelAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  clear(): void {
    this.activeAnimations.clear();
    this.animationQueue = [];
  }
}

// Conflict Resolution Manager (internal utility)
class ConflictResolutionManager {
  private resolutionStrategies = {
    server_wins: (serverData: Event | Partial<Event>, _clientData: Event | Partial<Event>) =>
      serverData,
    client_wins: (_serverData: Event | Partial<Event>, clientData: Event | Partial<Event>) =>
      clientData,
    merge: (serverData: Event | Partial<Event>, clientData: Event | Partial<Event>) => ({
      ...serverData,
      ...clientData,
    }),
    manual: (_serverData: Event | Partial<Event>, _clientData: Event | Partial<Event>) => null, // Requires user intervention
  };

  resolveConflict(
    strategy: keyof typeof this.resolutionStrategies,
    serverData: Event | Partial<Event>,
    clientData: Event | Partial<Event>
  ): Event | Partial<Event> | null {
    return this.resolutionStrategies[strategy](serverData, clientData);
  }

  detectConflict(serverData: Event | Partial<Event>, clientData: Event | Partial<Event>): boolean {
    // Simple conflict detection based on timestamps and critical fields
    if (!serverData || !clientData) return false;

    // Check for timestamp conflicts
    if (serverData.updatedAt && clientData.updatedAt) {
      return new Date(serverData.updatedAt) > new Date(clientData.updatedAt);
    }

    // Check for field conflicts
    const criticalFields = ['title', 'startDate', 'endDate'];
    return criticalFields.some((field) => serverData[field] !== clientData[field]);
  }
}

export default OptimisticUpdateHandler;
