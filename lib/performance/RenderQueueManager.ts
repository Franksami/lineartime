/**
 * RenderQueueManager - Manages rendering priorities and batching for optimal performance
 * Implements a priority queue system with frame budget management
 */

export interface RenderTask {
  id: string;
  priority: number; // 0 (highest) to 10 (lowest)
  execute: () => void;
  estimatedCost?: number; // Estimated ms to execute
  deadline?: number; // Timestamp when task must be completed
  retries?: number;
}

interface QueueMetrics {
  totalTasks: number;
  completedTasks: number;
  droppedFrames: number;
  averageFrameTime: number;
  peakFrameTime: number;
}

export class RenderQueueManager {
  private static instance: RenderQueueManager;
  private queues: Map<number, RenderTask[]> = new Map();
  private isProcessing = false;
  private frameId: number | null = null;
  private frameBudgetMs = 16; // Target 60fps
  private metrics: QueueMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    droppedFrames: 0,
    averageFrameTime: 0,
    peakFrameTime: 0,
  };
  private frameTimeHistory: number[] = [];
  private maxHistorySize = 100;
  private observers: Set<(metrics: QueueMetrics) => void> = new Set();

  private constructor() {
    // Initialize priority queues
    for (let i = 0; i <= 10; i++) {
      this.queues.set(i, []);
    }
  }

  static getInstance(): RenderQueueManager {
    if (!RenderQueueManager.instance) {
      RenderQueueManager.instance = new RenderQueueManager();
    }
    return RenderQueueManager.instance;
  }

  /**
   * Add a render task to the queue
   */
  enqueue(task: RenderTask): void {
    const priority = Math.min(Math.max(0, Math.floor(task.priority)), 10);
    const queue = this.queues.get(priority)!;
    queue.push(task);
    this.metrics.totalTasks++;

    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Add multiple tasks in batch
   */
  enqueueBatch(tasks: RenderTask[]): void {
    tasks.forEach((task) => {
      const priority = Math.min(Math.max(0, Math.floor(task.priority)), 10);
      const queue = this.queues.get(priority)!;
      queue.push(task);
    });
    this.metrics.totalTasks += tasks.length;

    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Remove a task from the queue
   */
  dequeue(taskId: string): boolean {
    for (const [_, queue] of this.queues) {
      const index = queue.findIndex((task) => task.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all queues
   */
  clear(priority?: number): void {
    if (priority !== undefined) {
      const queue = this.queues.get(priority);
      if (queue) {
        queue.length = 0;
      }
    } else {
      for (const queue of this.queues.values()) {
        queue.length = 0;
      }
    }
  }

  /**
   * Start processing the render queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.scheduleFrame();
  }

  /**
   * Stop processing the render queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Schedule the next animation frame
   */
  private scheduleFrame(): void {
    this.frameId = requestAnimationFrame((timestamp) => {
      this.processFrame(timestamp);
    });
  }

  /**
   * Process tasks within a single frame
   */
  private processFrame(timestamp: number): void {
    const frameStart = performance.now();
    let frameTime = 0;
    let _tasksProcessed = 0;

    // Process tasks by priority
    priorityLoop: for (let priority = 0; priority <= 10; priority++) {
      const queue = this.queues.get(priority)!;

      while (queue.length > 0) {
        // Check if we have budget remaining
        frameTime = performance.now() - frameStart;
        if (frameTime >= this.frameBudgetMs * 0.9) {
          // Use 90% of budget
          break priorityLoop;
        }

        const task = queue.shift()!;

        // Check deadline
        if (task.deadline && timestamp > task.deadline) {
          // Task expired, retry or drop
          if (task.retries && task.retries > 0) {
            task.retries--;
            task.priority = Math.max(0, task.priority - 1); // Boost priority
            this.enqueue(task);
          }
          continue;
        }

        // Execute task
        try {
          const taskStart = performance.now();
          task.execute();
          const taskTime = performance.now() - taskStart;

          // Update metrics
          this.metrics.completedTasks++;
          _tasksProcessed++;

          // If task took too long, adjust priority for similar tasks
          if (taskTime > this.frameBudgetMs * 0.5) {
            console.warn(`Render task ${task.id} took ${taskTime.toFixed(2)}ms`);
          }
        } catch (error) {
          console.error(`Error executing render task ${task.id}:`, error);
        }
      }
    }

    // Update frame metrics
    frameTime = performance.now() - frameStart;
    this.updateMetrics(frameTime);

    // Check if there are more tasks
    const hasMoreTasks = Array.from(this.queues.values()).some((q) => q.length > 0);

    if (hasMoreTasks) {
      this.scheduleFrame();
    } else {
      this.isProcessing = false;
      this.frameId = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(frameTime: number): void {
    // Track frame time history
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate average
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.averageFrameTime = sum / this.frameTimeHistory.length;

    // Track peak
    if (frameTime > this.metrics.peakFrameTime) {
      this.metrics.peakFrameTime = frameTime;
    }

    // Track dropped frames
    if (frameTime > this.frameBudgetMs) {
      this.metrics.droppedFrames++;
    }

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(observer: (metrics: QueueMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Notify all observers of metrics update
   */
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer({ ...this.metrics }));
  }

  /**
   * Get current metrics
   */
  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue sizes
   */
  getQueueSizes(): Map<number, number> {
    const sizes = new Map<number, number>();
    for (const [priority, queue] of this.queues) {
      sizes.set(priority, queue.length);
    }
    return sizes;
  }

  /**
   * Adjust frame budget based on device capabilities
   */
  setFrameBudget(ms: number): void {
    this.frameBudgetMs = Math.max(8, Math.min(33, ms)); // 30-120 fps range
  }

  /**
   * Auto-adjust frame budget based on performance
   */
  enableAdaptiveFrameBudget(): void {
    setInterval(() => {
      if (this.metrics.droppedFrames > 10) {
        // Too many dropped frames, increase budget
        this.setFrameBudget(this.frameBudgetMs + 2);
        this.metrics.droppedFrames = 0; // Reset counter
      } else if (this.metrics.averageFrameTime < this.frameBudgetMs * 0.5) {
        // We have headroom, decrease budget for smoother animation
        this.setFrameBudget(this.frameBudgetMs - 1);
      }
    }, 1000);
  }

  /**
   * Create a render task with automatic priority
   */
  static createTask(
    id: string,
    execute: () => void,
    options?: {
      priority?: number;
      estimatedCost?: number;
      deadline?: number;
      retries?: number;
    }
  ): RenderTask {
    return {
      id,
      execute,
      priority: options?.priority ?? 5,
      estimatedCost: options?.estimatedCost,
      deadline: options?.deadline,
      retries: options?.retries ?? 0,
    };
  }

  /**
   * Batch DOM operations for efficiency
   */
  static batchDOMOperations(operations: (() => void)[]): void {
    const manager = RenderQueueManager.getInstance();

    // Create a single high-priority task for all DOM operations
    const batchTask = RenderQueueManager.createTask(
      `dom-batch-${Date.now()}`,
      () => {
        // Use documentFragment or similar for batch updates
        operations.forEach((op) => op());
      },
      { priority: 1 } // High priority for DOM updates
    );

    manager.enqueue(batchTask);
  }
}

// Export singleton instance
export const renderQueue = RenderQueueManager.getInstance();
