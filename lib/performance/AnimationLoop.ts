/**
 * AnimationLoop - High-performance RAF-based animation system
 * Provides smooth 60fps animations with frame budget management
 */

export type AnimationCallback = (deltaTime: number, timestamp: number) => void;
export type AnimationPriority = 'critical' | 'high' | 'normal' | 'low' | 'idle';

interface AnimationTask {
  id: string;
  callback: AnimationCallback;
  priority: AnimationPriority;
  fps?: number; // Target FPS for this task
  lastExecuted?: number;
  enabled: boolean;
}

interface LoopMetrics {
  fps: number;
  frameTime: number;
  deltaTime: number;
  droppedFrames: number;
  totalFrames: number;
  averageFrameTime: number;
  jitter: number;
}

export class AnimationLoop {
  private static instance: AnimationLoop;
  private tasks: Map<string, AnimationTask> = new Map();
  private frameId: number | null = null;
  private isRunning = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private frameTimes: number[] = [];
  private maxFrameHistory = 60;
  
  // Performance settings
  private targetFPS = 60;
  private frameBudget = 1000 / 60; // ~16.67ms for 60fps
  private adaptiveQuality = true;
  private qualityLevel = 1.0; // 0.0 to 1.0
  
  // Metrics
  private metrics: LoopMetrics = {
    fps: 0,
    frameTime: 0,
    deltaTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    averageFrameTime: 0,
    jitter: 0,
  };
  
  private metricsCallbacks: Set<(metrics: LoopMetrics) => void> = new Set();

  private constructor() {
    // Detect high refresh rate displays
    this.detectRefreshRate();
  }

  static getInstance(): AnimationLoop {
    // Skip instantiation if running on server side
    if (typeof window === 'undefined') {
      return {} as AnimationLoop; // Return empty object for server-side compatibility
    }
    
    if (!AnimationLoop.instance) {
      AnimationLoop.instance = new AnimationLoop();
    }
    return AnimationLoop.instance;
  }

  /**
   * Detect display refresh rate
   */
  private async detectRefreshRate(): Promise<void> {
    // Skip detection if running on server side
    if (typeof window === 'undefined') return;
    
    if ('getScreenDetails' in window) {
      try {
        // Use Screen Details API if available
        const screenDetails = await (window as any).getScreenDetails();
        const refreshRate = screenDetails.currentScreen?.refreshRate || 60;
        this.setTargetFPS(refreshRate);
      } catch {
        // Fallback to detection
        this.detectRefreshRateFallback();
      }
    } else {
      this.detectRefreshRateFallback();
    }
  }

  /**
   * Fallback refresh rate detection
   */
  private detectRefreshRateFallback(): void {
    let frames = 0;
    const startTime = performance.now();
    
    const detect = () => {
      frames++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(detect);
      } else {
        // Detected approximate refresh rate
        const detectedRate = Math.round(frames);
        if (detectedRate > 60) {
          this.setTargetFPS(detectedRate);
        }
      }
    };
    
    requestAnimationFrame(detect);
  }

  /**
   * Register an animation task
   */
  register(
    id: string,
    callback: AnimationCallback,
    options?: {
      priority?: AnimationPriority;
      fps?: number;
      enabled?: boolean;
    }
  ): () => void {
    const task: AnimationTask = {
      id,
      callback,
      priority: options?.priority ?? 'normal',
      fps: options?.fps,
      enabled: options?.enabled ?? true,
      lastExecuted: 0,
    };
    
    this.tasks.set(id, task);
    
    // Return unregister function
    return () => this.unregister(id);
  }

  /**
   * Unregister an animation task
   */
  unregister(id: string): void {
    this.tasks.delete(id);
    
    // Stop loop if no tasks remain
    if (this.tasks.size === 0 && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Enable/disable a task
   */
  setTaskEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = enabled;
    }
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Main animation loop
   */
  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;
    
    // Calculate timing
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Update metrics
    this.updateMetrics(deltaTime, timestamp);
    
    // Adjust quality if needed
    if (this.adaptiveQuality) {
      this.adjustQuality();
    }
    
    // Process tasks by priority
    this.processTasks(deltaTime, timestamp);
    
    // Schedule next frame
    this.frameId = requestAnimationFrame(this.loop);
  };

  /**
   * Process animation tasks
   */
  private processTasks(deltaTime: number, timestamp: number): void {
    const frameStart = performance.now();
    const priorityOrder: AnimationPriority[] = ['critical', 'high', 'normal', 'low', 'idle'];
    
    for (const priority of priorityOrder) {
      // Check frame budget
      const elapsed = performance.now() - frameStart;
      const budgetRemaining = this.frameBudget - elapsed;
      
      // Skip lower priority tasks if running out of budget
      if (priority === 'low' && budgetRemaining < this.frameBudget * 0.3) break;
      if (priority === 'idle' && budgetRemaining < this.frameBudget * 0.5) break;
      
      // Process tasks of this priority
      for (const task of this.tasks.values()) {
        if (!task.enabled || task.priority !== priority) continue;
        
        // Check task-specific FPS limit
        if (task.fps && task.lastExecuted) {
          const taskInterval = 1000 / task.fps;
          if (timestamp - task.lastExecuted < taskInterval) continue;
        }
        
        try {
          // Apply quality scaling for non-critical tasks
          if (priority !== 'critical' && this.qualityLevel < 1.0) {
            // Skip some frames based on quality level
            if (Math.random() > this.qualityLevel) continue;
          }
          
          task.callback(deltaTime, timestamp);
          task.lastExecuted = timestamp;
        } catch (error) {
          console.error(`Animation task ${task.id} error:`, error);
        }
        
        // Check if we're exceeding budget
        if (performance.now() - frameStart > this.frameBudget * 0.9) {
          break;
        }
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(deltaTime: number, timestamp: number): void {
    this.frameCount++;
    this.metrics.totalFrames++;
    this.metrics.deltaTime = deltaTime;
    this.metrics.frameTime = deltaTime;
    
    // Track frame times
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }
    
    // Calculate FPS (using harmonic mean for accuracy)
    if (this.frameTimes.length > 0) {
      const harmonicMean = this.frameTimes.length / 
        this.frameTimes.reduce((sum, time) => sum + 1 / time, 0);
      this.metrics.fps = 1000 / harmonicMean;
    }
    
    // Calculate average frame time
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageFrameTime = sum / this.frameTimes.length;
    
    // Calculate jitter (variance in frame times)
    const variance = this.frameTimes.reduce((sum, time) => {
      const diff = time - this.metrics.averageFrameTime;
      return sum + diff * diff;
    }, 0) / this.frameTimes.length;
    this.metrics.jitter = Math.sqrt(variance);
    
    // Detect dropped frames
    if (deltaTime > this.frameBudget * 1.5) {
      this.metrics.droppedFrames++;
    }
    
    // Notify listeners
    this.notifyMetricsListeners();
  }

  /**
   * Adjust quality based on performance
   */
  private adjustQuality(): void {
    const targetFrameTime = 1000 / this.targetFPS;
    
    if (this.metrics.averageFrameTime > targetFrameTime * 1.2) {
      // Performance is poor, reduce quality
      this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.05);
    } else if (this.metrics.averageFrameTime < targetFrameTime * 0.8) {
      // Performance is good, increase quality
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.02);
    }
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(30, Math.min(240, fps));
    this.frameBudget = 1000 / this.targetFPS;
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled: boolean): void {
    this.adaptiveQuality = enabled;
    if (!enabled) {
      this.qualityLevel = 1.0;
    }
  }

  /**
   * Get current quality level
   */
  getQualityLevel(): number {
    return this.qualityLevel;
  }

  /**
   * Set quality level manually
   */
  setQualityLevel(level: number): void {
    this.qualityLevel = Math.max(0.0, Math.min(1.0, level));
    this.adaptiveQuality = false;
  }

  /**
   * Get current metrics
   */
  getMetrics(): LoopMetrics {
    return { ...this.metrics };
  }

  /**
   * Subscribe to metrics updates
   */
  onMetricsUpdate(callback: (metrics: LoopMetrics) => void): () => void {
    this.metricsCallbacks.add(callback);
    return () => this.metricsCallbacks.delete(callback);
  }

  /**
   * Notify metrics listeners
   */
  private notifyMetricsListeners(): void {
    const metrics = this.getMetrics();
    this.metricsCallbacks.forEach(callback => callback(metrics));
  }

  /**
   * Pause all animations
   */
  pause(): void {
    this.stop();
  }

  /**
   * Resume all animations
   */
  resume(): void {
    this.start();
  }

  /**
   * Check if loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get registered task count
   */
  getTaskCount(): number {
    return this.tasks.size;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks.clear();
    this.stop();
  }
}

// Export singleton instance
export const animationLoop = AnimationLoop.getInstance();

/**
 * Helper function to create smooth animations
 */
export function smoothAnimation(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  options?: {
    easing?: (t: number) => number;
    onComplete?: () => void;
  }
): () => void {
  const startTime = performance.now();
  const easing = options?.easing ?? ((t: number) => t); // Linear by default
  
  const taskId = `smooth-${Math.random()}`;
  
  return animationLoop.register(taskId, (deltaTime, timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + (to - from) * easedProgress;
    
    onUpdate(value);
    
    if (progress >= 1) {
      animationLoop.unregister(taskId);
      options?.onComplete?.();
    }
  }, { priority: 'high' });
}

/**
 * Common easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 2 * Math.PI / p);
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 2 * Math.PI / p) + 1;
  },
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};