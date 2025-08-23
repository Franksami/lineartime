/**
 * Enhanced Task types with analytics support
 * Supports parentTaskId field and completedAt timestamps for timeline analytics
 */

export interface TaskAnalytics {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  
  // Enhanced fields for analytics
  completedAt?: string; // ISO 8601 timestamp when task was completed
  parentTaskId?: number; // Reference to parent task for subtask hierarchy
  
  // Existing fields
  dependencies?: number[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  testStrategy?: string;
  
  // Subtasks with analytics support
  subtasks?: SubTaskAnalytics[];
}

export interface SubTaskAnalytics {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  
  // Analytics fields
  completedAt?: string; // ISO 8601 timestamp when subtask was completed
  parentTaskId: number; // Required reference to parent task
  
  // Existing fields
  dependencies?: number[];
  details?: string;
  testStrategy?: string;
}

export interface VerificationRecord {
  taskId: number;
  title: string;
  completedAt: string;
  verificationStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  verificationRecords: Record<string, {
    id: number;
    title: string;
    completedAt: string;
    verifiedBy: string;
    verificationNotes: string;
    artifacts: string[];
  }>;
  functionalityTested: Record<string, {
    tested: boolean;
    result: 'pass' | 'fail' | 'pending';
    notes: string;
  }>;
  analytics: {
    totalSubtasks: number;
    completedSubtasks: number;
    completionRate: number; // ratio 0-1
    totalDuration: number; // milliseconds
    averageSubtaskDuration: number; // milliseconds
  };
}

export interface TimelineAnalytics {
  taskId: number;
  parentTaskId?: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number; // milliseconds
  status: string;
  subtaskCount?: number;
  completedSubtasks?: number;
}