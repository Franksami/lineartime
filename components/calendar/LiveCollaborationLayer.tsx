'use client';

import { useCalendarContext } from '@/contexts/CalendarContext';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Cursor,
  Edit3,
  Eye,
  GitBranch,
  Hash,
  Info,
  Merge,
  MousePointer2,
  RefreshCw,
  RotateCcw,
  Split,
  User,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { useWebSocketSync } from './WebSocketSyncManager';
import type { WebSocketMessage } from './WebSocketSyncManager';

// ==========================================
// Types & Interfaces
// ==========================================

export interface CollaboratorInfo {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  lastSeen: Date;
  permissions: 'view' | 'edit' | 'admin';
}

export interface PresenceData {
  userId: string;
  cursor?: { x: number; y: number; eventId?: string };
  selection?: { eventId: string; field?: string };
  editingEvent?: string;
  activeField?: string;
  timestamp: number;
}

export interface CollaborativeEdit {
  id: string;
  eventId: string;
  field: string;
  userId: string;
  operation: 'insert' | 'delete' | 'replace' | 'move';
  position?: number;
  length?: number;
  content?: any;
  oldContent?: any;
  timestamp: number;
  applied: boolean;
  conflictsWith?: string[];
}

export interface OperationalTransform {
  id: string;
  eventId: string;
  field: string;
  operations: Array<{
    type: 'retain' | 'insert' | 'delete';
    count?: number;
    content?: any;
  }>;
  userId: string;
  baseVersion: number;
  timestamp: number;
}

export interface ConflictResolution {
  id: string;
  conflictId: string;
  type: 'auto' | 'manual';
  strategy: 'last_write_wins' | 'merge' | 'user_choice' | 'crdt';
  winner?: string;
  merged?: any;
  userChoice?: string;
  resolvedAt: Date;
}

export interface ChangeAttribution {
  eventId: string;
  field: string;
  author: string;
  timestamp: Date;
  operation: string;
  version: number;
  description: string;
}

export interface CollaborationConflict {
  id: string;
  eventId: string;
  field: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_conflict' | 'data_integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  participants: string[];
  changes: CollaborativeEdit[];
  detectedAt: Date;
  status: 'active' | 'resolving' | 'resolved' | 'escalated';
  autoResolvable: boolean;
}

interface LiveCollaborationLayerProps {
  enabled?: boolean;
  maxCollaborators?: number;
  conflictResolutionTimeout?: number;
  presenceUpdateInterval?: number;
  showCursors?: boolean;
  showSelections?: boolean;
  showActivityFeed?: boolean;
  enableConflictResolution?: boolean;
  onCollaboratorJoin?: (collaborator: CollaboratorInfo) => void;
  onCollaboratorLeave?: (collaboratorId: string) => void;
  onConflictDetected?: (conflict: CollaborationConflict) => void;
  onConflictResolved?: (conflict: CollaborationConflict, resolution: ConflictResolution) => void;
  onEditConflict?: (edit: CollaborativeEdit) => void;
  className?: string;
}

// ==========================================
// CRDT Implementation for Conflict Resolution
// ==========================================

class CollaborativeCRDT {
  private operations: Map<string, OperationalTransform[]> = new Map();
  private versions: Map<string, number> = new Map();
  private conflicts: Map<string, CollaborationConflict> = new Map();

  constructor(private userId: string) {}

  // Apply operational transform using CRDT principles
  applyTransform(transform: OperationalTransform): { success: boolean; conflicts?: string[] } {
    const key = `${transform.eventId}-${transform.field}`;
    const existing = this.operations.get(key) || [];
    const currentVersion = this.versions.get(key) || 0;

    // Check for version conflicts
    if (transform.baseVersion < currentVersion - 1) {
      const conflict = this.createVersionConflict(transform, existing);
      this.conflicts.set(conflict.id, conflict);
      return { success: false, conflicts: [conflict.id] };
    }

    // Apply transform using Hocuspocus-style CRDT resolution
    const resolved = this.resolveWithCRDT(transform, existing);
    this.operations.set(key, [...existing, resolved]);
    this.versions.set(key, currentVersion + 1);

    return { success: true };
  }

  private resolveWithCRDT(
    transform: OperationalTransform,
    existing: OperationalTransform[]
  ): OperationalTransform {
    // Implement CRDT conflict resolution similar to Hocuspocus patterns
    const concurrent = existing.filter(
      (op) => op.timestamp > transform.baseVersion && op.userId !== transform.userId
    );

    if (concurrent.length === 0) {
      return transform; // No conflicts
    }

    // Apply operational transformation
    let resolved = { ...transform };

    for (const concurrent_op of concurrent) {
      resolved = this.transformAgainst(resolved, concurrent_op);
    }

    return resolved;
  }

  private transformAgainst(
    transform: OperationalTransform,
    against: OperationalTransform
  ): OperationalTransform {
    // Simplified operational transform implementation
    // In production, use proper OT library or Hocuspocus Y.js integration
    if (transform.eventId !== against.eventId || transform.field !== against.field) {
      return transform; // No conflict
    }

    // Apply position adjustments based on concurrent operations
    const adjustedOps = transform.operations.map((op) => {
      if (op.type === 'insert' || op.type === 'retain') {
        // Adjust position based on prior concurrent operations
        return op;
      }
      return op;
    });

    return { ...transform, operations: adjustedOps };
  }

  private createVersionConflict(
    transform: OperationalTransform,
    existing: OperationalTransform[]
  ): CollaborationConflict {
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: transform.eventId,
      field: transform.field,
      type: 'version_mismatch',
      severity: 'medium',
      participants: [transform.userId, ...existing.map((op) => op.userId)],
      changes: [], // Would map from transforms to CollaborativeEdit
      detectedAt: new Date(),
      status: 'active',
      autoResolvable: true,
    };
  }

  getConflicts(): CollaborationConflict[] {
    return Array.from(this.conflicts.values());
  }

  resolveConflict(conflictId: string, _resolution: ConflictResolution): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    conflict.status = 'resolved';
    this.conflicts.set(conflictId, conflict);
    return true;
  }
}

// ==========================================
// Collaboration Context
// ==========================================

interface CollaborationContextType {
  collaborators: Map<string, CollaboratorInfo>;
  presenceData: Map<string, PresenceData>;
  currentUser?: CollaboratorInfo;
  conflicts: CollaborationConflict[];
  isEditingEvent: (eventId: string) => boolean;
  getEventEditor: (eventId: string) => CollaboratorInfo | null;
  updatePresence: (data: Partial<PresenceData>) => void;
  startEdit: (eventId: string, field?: string) => void;
  endEdit: (eventId: string) => void;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within LiveCollaborationLayer');
  }
  return context;
}

// ==========================================
// Custom Hooks
// ==========================================

export function useLiveCollaboration() {
  return useCollaboration();
}

export function usePresence() {
  const { presenceData, updatePresence } = useCollaboration();
  return { presenceData, updatePresence };
}

export function useCollaborativeEdit(eventId: string) {
  const { isEditingEvent, getEventEditor, startEdit, endEdit } = useCollaboration();

  return {
    isBeingEdited: isEditingEvent(eventId),
    currentEditor: getEventEditor(eventId),
    startEditing: (field?: string) => startEdit(eventId, field),
    stopEditing: () => endEdit(eventId),
  };
}

export function useChangeAttribution(eventId: string) {
  const [attributions, setAttributions] = useState<ChangeAttribution[]>([]);

  // Mock implementation - in production would fetch from backend
  useEffect(() => {
    // Fetch change attribution data for event
    const mockAttributions: ChangeAttribution[] = [
      {
        eventId,
        field: 'title',
        author: 'john@example.com',
        timestamp: new Date(Date.now() - 3600000),
        operation: 'updated',
        version: 3,
        description: 'Changed title from "Meeting" to "Team Standup"',
      },
    ];
    setAttributions(mockAttributions);
  }, [eventId]);

  return { attributions };
}

export function useConflictResolution() {
  const { conflicts, resolveConflict } = useCollaboration();

  const resolveAutomatic = useCallback(
    (conflictId: string, strategy: ConflictResolution['strategy']) => {
      const resolution: ConflictResolution = {
        id: `resolution_${Date.now()}`,
        conflictId,
        type: 'auto',
        strategy,
        resolvedAt: new Date(),
      };
      resolveConflict(conflictId, resolution);
    },
    [resolveConflict]
  );

  const resolveManual = useCallback(
    (conflictId: string, userChoice: string) => {
      const resolution: ConflictResolution = {
        id: `resolution_${Date.now()}`,
        conflictId,
        type: 'manual',
        strategy: 'user_choice',
        userChoice,
        resolvedAt: new Date(),
      };
      resolveConflict(conflictId, resolution);
    },
    [resolveConflict]
  );

  return { conflicts, resolveAutomatic, resolveManual };
}

// ==========================================
// Main Component
// ==========================================

export function LiveCollaborationLayer({
  enabled = true,
  maxCollaborators = 10,
  conflictResolutionTimeout = 30000, // 30 seconds
  presenceUpdateInterval = 1000, // 1 second
  showCursors = true,
  showSelections = true,
  showActivityFeed = true,
  enableConflictResolution = true,
  onCollaboratorJoin,
  onCollaboratorLeave,
  onConflictDetected,
  onConflictResolved,
  onEditConflict,
  className,
}: LiveCollaborationLayerProps) {
  // Hooks and Context
  const { state: calendarState, announceMessage } = useCalendarContext();
  const webSocketAPI = useWebSocketSync();

  // Local State
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorInfo>>(new Map());
  const [presenceData, setPresenceData] = useState<Map<string, PresenceData>>(new Map());
  const [currentUser, setCurrentUser] = useState<CollaboratorInfo>();
  const [conflicts, setConflicts] = useState<CollaborationConflict[]>([]);
  const [editingSessions, setEditingSessions] = useState<Map<string, string>>(new Map()); // eventId -> userId
  const [changeHistory, setChangeHistory] = useState<ChangeAttribution[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<CollaborationConflict | null>(null);

  // Refs
  const crdtEngine = useRef<CollaborativeCRDT>();
  const presenceTimer = useRef<NodeJS.Timeout>();
  const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const conflictTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize CRDT engine
  useEffect(() => {
    if (!currentUser) return;
    crdtEngine.current = new CollaborativeCRDT(currentUser.id);
  }, [currentUser]);

  // Initialize current user (mock - in production get from auth)
  useEffect(() => {
    const mockUser: CollaboratorInfo = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Current User',
      email: 'user@example.com',
      color: '#3b82f6',
      status: 'active',
      lastSeen: new Date(),
      permissions: 'edit',
    };
    setCurrentUser(mockUser);

    // Add to collaborators
    setCollaborators((prev) => new Map(prev).set(mockUser.id, mockUser));
  }, []);

  // WebSocket Message Handlers
  const _handleCollaborationMessage = useCallback(
    (message: WebSocketMessage) => {
      if (!enabled) return;

      switch (message.type) {
        case 'user_joined':
          handleUserJoined(message.data);
          break;
        case 'user_left':
          handleUserLeft(message.data);
          break;
        case 'presence_update':
          handlePresenceUpdate(message.data);
          break;
        case 'collaborative_edit':
          handleCollaborativeEdit(message.data);
          break;
        case 'conflict_detected':
          handleConflictDetected(message.data);
          break;
        case 'conflict_resolved':
          handleConflictResolved(message.data);
          break;
      }
    },
    [enabled]
  );

  // Handle user joining collaboration session
  const handleUserJoined = useCallback(
    (userData: CollaboratorInfo) => {
      setCollaborators((prev) => {
        const newMap = new Map(prev);
        newMap.set(userData.id, userData);
        return newMap;
      });

      announceMessage(`${userData.name} joined the collaboration session`);
      onCollaboratorJoin?.(userData);
    },
    [announceMessage, onCollaboratorJoin]
  );

  // Handle user leaving collaboration session
  const handleUserLeft = useCallback(
    (userId: string) => {
      setCollaborators((prev) => {
        const newMap = new Map(prev);
        const user = newMap.get(userId);
        newMap.delete(userId);

        if (user) {
          announceMessage(`${user.name} left the collaboration session`);
        }
        return newMap;
      });

      // Clean up presence data
      setPresenceData((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });

      // Clean up editing sessions
      setEditingSessions((prev) => {
        const newMap = new Map(prev);
        for (const [eventId, editorId] of newMap.entries()) {
          if (editorId === userId) {
            newMap.delete(eventId);
          }
        }
        return newMap;
      });

      onCollaboratorLeave?.(userId);
    },
    [announceMessage, onCollaboratorLeave]
  );

  // Handle presence updates
  const handlePresenceUpdate = useCallback((presence: PresenceData) => {
    setPresenceData((prev) => {
      const newMap = new Map(prev);
      newMap.set(presence.userId, presence);
      return newMap;
    });
  }, []);

  // Handle collaborative edits
  const handleCollaborativeEdit = useCallback(
    (edit: CollaborativeEdit) => {
      if (!crdtEngine.current) return;

      // Apply operational transform
      const transform: OperationalTransform = {
        id: edit.id,
        eventId: edit.eventId,
        field: edit.field,
        operations: [
          {
            type:
              edit.operation === 'insert'
                ? 'insert'
                : edit.operation === 'delete'
                  ? 'delete'
                  : 'retain',
            count: edit.length,
            content: edit.content,
          },
        ],
        userId: edit.userId,
        baseVersion: 0, // Would track actual versions in production
        timestamp: edit.timestamp,
      };

      const result = crdtEngine.current.applyTransform(transform);

      if (!result.success && result.conflicts) {
        // Handle conflicts
        result.conflicts.forEach((conflictId) => {
          const conflict = crdtEngine.current?.getConflicts().find((c) => c.id === conflictId);
          if (conflict) {
            setConflicts((prev) => [...prev, conflict]);
            onConflictDetected?.(conflict);

            // Set auto-resolve timeout
            const timeout = setTimeout(() => {
              handleAutoResolveConflict(conflictId);
            }, conflictResolutionTimeout);

            conflictTimeouts.current.set(conflictId, timeout);
          }
        });
      } else {
        // Add to change history
        const attribution: ChangeAttribution = {
          eventId: edit.eventId,
          field: edit.field,
          author: edit.userId,
          timestamp: new Date(edit.timestamp),
          operation: edit.operation,
          version: 1, // Would track actual versions
          description: `${edit.operation} in ${edit.field}`,
        };

        setChangeHistory((prev) => [...prev.slice(-19), attribution]); // Keep last 20
      }

      onEditConflict?.(edit);
    },
    [conflictResolutionTimeout, onConflictDetected, onEditConflict]
  );

  // Handle conflict detection
  const handleConflictDetected = useCallback(
    (conflict: CollaborationConflict) => {
      setConflicts((prev) => [...prev, conflict]);
      announceMessage(`Conflict detected: ${conflict.type.replace('_', ' ')}`);
      onConflictDetected?.(conflict);
    },
    [announceMessage, onConflictDetected]
  );

  // Handle conflict resolution
  const handleConflictResolved = useCallback(
    (data: { conflict: CollaborationConflict; resolution: ConflictResolution }) => {
      const { conflict, resolution } = data;

      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));

      // Clear timeout
      const timeout = conflictTimeouts.current.get(conflict.id);
      if (timeout) {
        clearTimeout(timeout);
        conflictTimeouts.current.delete(conflict.id);
      }

      announceMessage(`Conflict resolved using ${resolution.strategy}`);
      onConflictResolved?.(conflict, resolution);
    },
    [announceMessage, onConflictResolved]
  );

  // Auto-resolve conflict
  const handleAutoResolveConflict = useCallback(
    (conflictId: string) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict || !conflict.autoResolvable) return;

      const resolution: ConflictResolution = {
        id: `resolution_${Date.now()}`,
        conflictId,
        type: 'auto',
        strategy: 'last_write_wins',
        resolvedAt: new Date(),
      };

      crdtEngine.current?.resolveConflict(conflictId, resolution);
      handleConflictResolved({ conflict, resolution });
    },
    [conflicts, handleConflictResolved]
  );

  // Update presence data
  const updatePresence = useCallback(
    (data: Partial<PresenceData>) => {
      if (!currentUser || !webSocketAPI.isConnected) return;

      const presence: PresenceData = {
        userId: currentUser.id,
        timestamp: Date.now(),
        ...data,
      };

      setPresenceData((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentUser.id, presence);
        return newMap;
      });

      // Broadcast presence update
      webSocketAPI.sendMessage({
        type: 'presence_update' as any,
        data: presence,
        priority: 5,
      });
    },
    [currentUser, webSocketAPI]
  );

  // Start editing an event
  const startEdit = useCallback(
    (eventId: string, field?: string) => {
      if (!currentUser) return;

      setEditingSessions((prev) => {
        const newMap = new Map(prev);
        newMap.set(eventId, currentUser.id);
        return newMap;
      });

      updatePresence({
        editingEvent: eventId,
        activeField: field,
        selection: { eventId, field },
      });

      announceMessage('Started editing event');
    },
    [currentUser, updatePresence, announceMessage]
  );

  // End editing an event
  const endEdit = useCallback(
    (eventId: string) => {
      setEditingSessions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(eventId);
        return newMap;
      });

      updatePresence({
        editingEvent: undefined,
        activeField: undefined,
        selection: undefined,
      });

      announceMessage('Stopped editing event');
    },
    [updatePresence, announceMessage]
  );

  // Check if event is being edited
  const isEditingEvent = useCallback(
    (eventId: string) => {
      return editingSessions.has(eventId);
    },
    [editingSessions]
  );

  // Get event editor
  const getEventEditor = useCallback(
    (eventId: string) => {
      const editorId = editingSessions.get(eventId);
      if (!editorId) return null;
      return collaborators.get(editorId) || null;
    },
    [editingSessions, collaborators]
  );

  // Resolve conflict manually
  const resolveConflict = useCallback(
    (conflictId: string, resolution: ConflictResolution) => {
      crdtEngine.current?.resolveConflict(conflictId, resolution);
      handleConflictResolved({
        conflict: conflicts.find((c) => c.id === conflictId)!,
        resolution,
      });
    },
    [conflicts, handleConflictResolved]
  );

  // Setup presence updates
  useEffect(() => {
    if (!enabled || !currentUser) return;

    presenceTimer.current = setInterval(() => {
      updatePresence({ timestamp: Date.now() });
    }, presenceUpdateInterval);

    return () => {
      if (presenceTimer.current) {
        clearInterval(presenceTimer.current);
      }
    };
  }, [enabled, currentUser, updatePresence, presenceUpdateInterval]);

  // Listen for WebSocket messages
  useEffect(() => {
    // In a real implementation, this would be handled by WebSocketSyncManager
    // For now, simulate some collaborative activity
    if (!enabled) return;

    const simulateActivity = () => {
      // Simulate users joining
      setTimeout(() => {
        const mockUser: CollaboratorInfo = {
          id: 'user_2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          color: '#ef4444',
          status: 'active',
          lastSeen: new Date(),
          permissions: 'edit',
        };
        handleUserJoined(mockUser);
      }, 2000);

      // Simulate presence updates
      setTimeout(() => {
        handlePresenceUpdate({
          userId: 'user_2',
          cursor: { x: 100, y: 200 },
          timestamp: Date.now(),
        });
      }, 3000);
    };

    simulateActivity();
  }, [enabled, handleUserJoined, handlePresenceUpdate]);

  // Context value
  const contextValue: CollaborationContextType = useMemo(
    () => ({
      collaborators,
      presenceData,
      currentUser,
      conflicts,
      isEditingEvent,
      getEventEditor,
      updatePresence,
      startEdit,
      endEdit,
      resolveConflict,
    }),
    [
      collaborators,
      presenceData,
      currentUser,
      conflicts,
      isEditingEvent,
      getEventEditor,
      updatePresence,
      startEdit,
      endEdit,
      resolveConflict,
    ]
  );

  // Don't render if disabled
  if (!enabled) return null;

  return (
    <CollaborationContext.Provider value={contextValue}>
      <div className={cn('live-collaboration-layer relative', className)}>
        {/* Live Cursors */}
        {showCursors && (
          <div className="absolute inset-0 pointer-events-none z-40">
            <AnimatePresence>
              {Array.from(presenceData.entries()).map(([userId, presence]) => {
                const user = collaborators.get(userId);
                if (!user || !presence.cursor || userId === currentUser?.id) return null;

                return (
                  <motion.div
                    key={userId}
                    ref={(el) => {
                      if (el) cursorsRef.current.set(userId, el);
                    }}
                    className="absolute z-50 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: presence.cursor.x,
                      y: presence.cursor.y,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <div className="flex items-center">
                      <MousePointer2
                        className="w-5 h-5"
                        style={{ color: user.color }}
                        fill={user.color}
                      />
                      <div
                        className="ml-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name}
                      </div>
                    </div>
                    {presence.editingEvent && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        Editing
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Collaborator Avatars */}
        <div className="fixed top-4 right-4 z-50 flex -space-x-2">
          <AnimatePresence>
            {Array.from(collaborators.values())
              .slice(0, maxCollaborators)
              .map((user) => (
                <motion.div
                  key={user.id}
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-medium text-sm',
                      {
                        'ring-2 ring-green-400 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          user.status === 'active',
                        'ring-2 ring-yellow-400 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          user.status === 'idle',
                        'ring-2 ring-gray-400 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          user.status === 'away',
                        'ring-2 ring-red-400 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          user.status === 'offline',
                      }
                    )}
                    style={{ backgroundColor: user.color }}
                    title={`${user.name} (${user.status})`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  {/* Activity indicator */}
                  {Array.from(presenceData.values()).find((p) => p.userId === user.id)
                    ?.editingEvent && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Edit3 className="w-2 h-2 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {collaborators.size > maxCollaborators && (
            <div className="w-10 h-10 rounded-full bg-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ border-2 border-white shadow-md flex items-center justify-center text-white font-medium text-sm">
              +{collaborators.size - maxCollaborators}
            </div>
          )}
        </div>

        {/* Conflict Notifications */}
        <AnimatePresence>
          {conflicts.length > 0 && enableConflictResolution && (
            <div className="fixed top-20 right-4 z-50 space-y-2">
              {conflicts.slice(0, 3).map((conflict) => (
                <motion.div
                  key={conflict.id}
                  className={cn(
                    'bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm cursor-pointer',
                    {
                      'border-red-200 /* TODO: Use semantic token */ /* TODO: Use semantic token */ bg-red-50 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:border-red-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20':
                        conflict.severity === 'critical',
                      'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20':
                        conflict.severity === 'high',
                      'border-yellow-200 /* TODO: Use semantic token */ /* TODO: Use semantic token */ bg-yellow-50 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:border-yellow-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20':
                        conflict.severity === 'medium',
                      'border-blue-200 /* TODO: Use semantic token */ /* TODO: Use semantic token */ bg-blue-50 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:border-blue-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20':
                        conflict.severity === 'low',
                    }
                  )}
                  initial={{ opacity: 0, x: 100, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setShowConflictModal(true);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn('flex-shrink-0 p-1.5 rounded-full', {
                        'bg-red-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-red-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          conflict.severity === 'critical',
                        'bg-orange-100 text-orange-600': conflict.severity === 'high',
                        'bg-yellow-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-yellow-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          conflict.severity === 'medium',
                        'bg-blue-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                          conflict.severity === 'low',
                      })}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {conflict.type.replace('_', ' ')} Conflict
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conflict.participants.length} users affected
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{conflict.detectedAt.toLocaleTimeString()}</span>
                        {conflict.autoResolvable && (
                          <div className="flex items-center gap-1 text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Auto-resolvable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {conflicts.length > 3 && (
                <motion.div
                  className="bg-background border border-border rounded-lg shadow-lg p-2 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-sm text-muted-foreground">
                    +{conflicts.length - 3} more conflicts
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Activity Feed */}
        {showActivityFeed && changeHistory.length > 0 && (
          <div className="fixed bottom-4 right-4 z-40">
            <motion.div
              className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm max-h-64 overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Recent Activity</h4>
              </div>

              <div className="space-y-2">
                {changeHistory
                  .slice(-5)
                  .reverse()
                  .map((change, index) => {
                    const user = Array.from(collaborators.values()).find(
                      (u) => u.id === change.author
                    );
                    return (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div
                          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: user?.color || '#gray' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">
                            <span className="font-medium">{user?.name || change.author}</span>{' '}
                            {change.description}
                          </p>
                          <p className="text-muted-foreground">
                            {change.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Conflict Resolution Modal */}
        <AnimatePresence>
          {showConflictModal && selectedConflict && (
            <motion.div
              className="fixed inset-0 z-60 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowConflictModal(false)}
              />

              <motion.div
                className="relative bg-background border border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Resolve Collaboration Conflict</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConflict.type.replace('_', ' ')} detected
                      </p>
                    </div>
                    <button
                      onClick={() => setShowConflictModal(false)}
                      className="p-2 hover:bg-muted rounded transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Conflict Details */}
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Conflict Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Event:</strong> {selectedConflict.eventId}
                      </div>
                      <div>
                        <strong>Field:</strong> {selectedConflict.field}
                      </div>
                      <div>
                        <strong>Participants:</strong> {selectedConflict.participants.join(', ')}
                      </div>
                      <div>
                        <strong>Detected:</strong> {selectedConflict.detectedAt.toLocaleString()}
                      </div>
                      <div>
                        <strong>Severity:</strong>
                        <span
                          className={cn('ml-2 px-2 py-1 rounded-full text-xs', {
                            'bg-red-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-red-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                              selectedConflict.severity === 'critical',
                            'bg-orange-100 text-orange-800': selectedConflict.severity === 'high',
                            'bg-yellow-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-yellow-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                              selectedConflict.severity === 'medium',
                            'bg-blue-100 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-blue-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */':
                              selectedConflict.severity === 'low',
                          })}
                        >
                          {selectedConflict.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Resolution Options</h4>

                    {selectedConflict.autoResolvable && (
                      <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-medium">Auto-Resolve (Last Write Wins)</h5>
                            <p className="text-sm text-muted-foreground mb-3">
                              Automatically accept the most recent change and discard others.
                            </p>
                            <button
                              onClick={() => {
                                handleAutoResolveConflict(selectedConflict.id);
                                setShowConflictModal(false);
                              }}
                              className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */ transition-colors text-sm font-medium"
                            >
                              Apply Auto-Resolution
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Merge className="w-5 h-5 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium">Smart Merge</h5>
                          <p className="text-sm text-muted-foreground mb-3">
                            Attempt to intelligently merge all changes using CRDT algorithms.
                          </p>
                          <button
                            onClick={() => {
                              const resolution: ConflictResolution = {
                                id: `resolution_${Date.now()}`,
                                conflictId: selectedConflict.id,
                                type: 'auto',
                                strategy: 'crdt',
                                resolvedAt: new Date(),
                              };
                              resolveConflict(selectedConflict.id, resolution);
                              setShowConflictModal(false);
                            }}
                            className="px-4 py-2 bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-white rounded hover:bg-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */ transition-colors text-sm font-medium"
                          >
                            Apply Smart Merge
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium">Manual Resolution</h5>
                          <p className="text-sm text-muted-foreground mb-3">
                            Review all changes and manually choose which version to keep.
                          </p>
                          <button
                            onClick={() => {
                              // Would open detailed manual resolution interface
                              console.log('Manual resolution not implemented in demo');
                            }}
                            className="px-4 py-2 bg-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-white rounded hover:bg-purple-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */ transition-colors text-sm font-medium"
                            disabled
                          >
                            Manual Review (Demo)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status */}
        <div className="fixed bottom-4 left-4 z-40">
          <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg shadow-sm text-sm">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                webSocketAPI.isConnected
                  ? 'bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
                  : 'bg-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
              )}
            />
            <span className="text-muted-foreground">
              {webSocketAPI.isConnected ? 'Connected' : 'Disconnected'} • {collaborators.size} users
            </span>
          </div>
        </div>
      </div>
    </CollaborationContext.Provider>
  );
}

export default LiveCollaborationLayer;
