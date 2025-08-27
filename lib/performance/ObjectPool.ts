/**
 * ObjectPool - Generic object pooling system for memory management
 * Reduces garbage collection pressure by reusing objects
 */

export interface Poolable {
  reset(): void;
  inUse?: boolean;
}

export interface PoolConfig {
  initialSize?: number;
  maxSize?: number;
  growthFactor?: number;
  resetOnRelease?: boolean;
  preWarm?: boolean;
  onAcquire?: (obj: any) => void;
  onRelease?: (obj: any) => void;
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private config: Required<PoolConfig>;
  private metrics = {
    created: 0,
    acquired: 0,
    released: 0,
    currentSize: 0,
    peakSize: 0,
    hits: 0,
    misses: 0,
  };

  constructor(factory: () => T, config: PoolConfig = {}) {
    this.factory = factory;
    this.config = {
      initialSize: config.initialSize ?? 10,
      maxSize: config.maxSize ?? 1000,
      growthFactor: config.growthFactor ?? 2,
      resetOnRelease: config.resetOnRelease ?? true,
      preWarm: config.preWarm ?? true,
      onAcquire: config.onAcquire ?? (() => {}),
      onRelease: config.onRelease ?? (() => {}),
    };

    if (this.config.preWarm) {
      this.warmUp();
    }
  }

  /**
   * Pre-allocate objects to avoid initialization cost
   */
  private warmUp(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const obj = this.factory();
      obj.reset();
      this.available.push(obj);
      this.metrics.created++;
    }
    this.metrics.currentSize = this.config.initialSize;
    this.metrics.peakSize = this.config.initialSize;
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      // Reuse existing object
      obj = this.available.pop()!;
      this.metrics.hits++;
    } else if (this.metrics.currentSize < this.config.maxSize) {
      // Create new object if under limit
      obj = this.factory();
      this.metrics.created++;
      this.metrics.currentSize++;
      this.metrics.misses++;

      if (this.metrics.currentSize > this.metrics.peakSize) {
        this.metrics.peakSize = this.metrics.currentSize;
      }
    } else {
      // Pool exhausted, force create (may cause performance issues)
      console.warn('Object pool exhausted, creating new object beyond max size');
      obj = this.factory();
      this.metrics.misses++;
    }

    obj.inUse = true;
    this.inUse.add(obj);
    this.metrics.acquired++;
    this.config.onAcquire(obj);

    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }

    this.inUse.delete(obj);
    obj.inUse = false;

    if (this.config.resetOnRelease) {
      obj.reset();
    }

    this.config.onRelease(obj);

    // Only return to pool if under max size
    if (this.available.length + this.inUse.size < this.config.maxSize) {
      this.available.push(obj);
    }

    this.metrics.released++;
  }

  /**
   * Release multiple objects at once
   */
  releaseBatch(objects: T[]): void {
    objects.forEach((obj) => this.release(obj));
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
    this.metrics.currentSize = 0;
  }

  /**
   * Grow the pool by a factor
   */
  grow(factor?: number): void {
    const growthFactor = factor ?? this.config.growthFactor;
    const targetSize = Math.min(
      Math.floor(this.metrics.currentSize * growthFactor),
      this.config.maxSize
    );

    while (this.metrics.currentSize < targetSize) {
      const obj = this.factory();
      obj.reset();
      this.available.push(obj);
      this.metrics.created++;
      this.metrics.currentSize++;
    }

    if (this.metrics.currentSize > this.metrics.peakSize) {
      this.metrics.peakSize = this.metrics.currentSize;
    }
  }

  /**
   * Shrink the pool to remove unused objects
   */
  shrink(targetSize?: number): void {
    const target = targetSize ?? this.config.initialSize;
    while (this.available.length > 0 && this.metrics.currentSize > target) {
      this.available.pop();
      this.metrics.currentSize--;
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      availableCount: this.available.length,
      inUseCount: this.inUse.size,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
    };
  }

  /**
   * Get pool size info
   */
  getSize() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.metrics.currentSize,
      max: this.config.maxSize,
    };
  }
}

/**
 * Specialized pool for DOM elements
 */
export class DOMElementPool<T extends HTMLElement> {
  private pool: ObjectPool<{ element: T; reset: () => void; inUse?: boolean }>;
  private elementType: string;
  private className?: string;

  constructor(elementType: string, className?: string, config?: PoolConfig) {
    this.elementType = elementType;
    this.className = className;

    this.pool = new ObjectPool(() => this.createElement(), config);
  }

  private createElement() {
    const element = document.createElement(this.elementType) as T;
    if (this.className) {
      element.className = this.className;
    }

    return {
      element,
      reset: () => {
        // Clear element content and attributes
        element.innerHTML = '';
        element.className = this.className || '';
        element.removeAttribute('style');
        // Remove all event listeners (requires tracking)
      },
      inUse: false,
    };
  }

  acquire(): T {
    return this.pool.acquire().element;
  }

  release(element: T): void {
    const wrapper = Array.from(this.pool.inUse).find((w) => w.element === element);
    if (wrapper) {
      this.pool.release(wrapper);
    }
  }

  getMetrics() {
    return this.pool.getMetrics();
  }
}

/**
 * Pool manager for different object types
 */
export class PoolManager {
  private static instance: PoolManager;
  private pools: Map<string, ObjectPool<any>> = new Map();

  private constructor() {}

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  /**
   * Register a new pool
   */
  registerPool<T extends Poolable>(
    name: string,
    factory: () => T,
    config?: PoolConfig
  ): ObjectPool<T> {
    if (this.pools.has(name)) {
      console.warn(`Pool '${name}' already exists`);
      return this.pools.get(name)!;
    }

    const pool = new ObjectPool(factory, config);
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Get a registered pool
   */
  getPool<T extends Poolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * Remove a pool
   */
  removePool(name: string): void {
    const pool = this.pools.get(name);
    if (pool) {
      pool.clear();
      this.pools.delete(name);
    }
  }

  /**
   * Get all pool metrics
   */
  getAllMetrics() {
    const metrics: Record<string, any> = {};
    for (const [name, pool] of this.pools) {
      metrics[name] = pool.getMetrics();
    }
    return metrics;
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * Optimize all pools based on usage
   */
  optimizeAll(): void {
    for (const [name, pool] of this.pools) {
      const metrics = pool.getMetrics();

      // Grow pools with high miss rates
      if (metrics.hitRate < 0.8 && metrics.misses > 10) {
        pool.grow();
        console.log(`Growing pool '${name}' due to low hit rate`);
      }

      // Shrink pools with many unused objects
      const size = pool.getSize();
      if (size.available > size.inUse * 3 && size.total > 20) {
        pool.shrink();
        console.log(`Shrinking pool '${name}' due to low usage`);
      }
    }
  }
}

// Export singleton instance
export const poolManager = PoolManager.getInstance();

/**
 * Example poolable event object
 */
export class PoolableEvent implements Poolable {
  id = '';
  title = '';
  startDate: Date = new Date();
  endDate: Date = new Date();
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  color = '';
  inUse?: boolean = false;

  reset(): void {
    this.id = '';
    this.title = '';
    this.startDate = new Date();
    this.endDate = new Date();
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.color = '';
  }

  configure(config: Partial<PoolableEvent>): void {
    Object.assign(this, config);
  }
}

// Create event pool
export const eventPool = new ObjectPool(() => new PoolableEvent(), {
  initialSize: 100,
  maxSize: 5000,
  growthFactor: 2,
  preWarm: true,
});
