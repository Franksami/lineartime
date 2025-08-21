/**
 * Vector Clock implementation for conflict resolution
 * Used to detect concurrent modifications in distributed calendar sync
 */
export class VectorClock {
  private clocks: Map<string, number> = new Map();

  constructor(initialClocks?: Record<string, number>) {
    if (initialClocks) {
      Object.entries(initialClocks).forEach(([nodeId, value]) => {
        this.clocks.set(nodeId, value);
      });
    }
  }

  /**
   * Increment the clock for a specific node
   */
  increment(nodeId: string): void {
    this.clocks.set(nodeId, (this.clocks.get(nodeId) || 0) + 1);
  }

  /**
   * Get the current value for a node
   */
  getValue(nodeId: string): number {
    return this.clocks.get(nodeId) || 0;
  }

  /**
   * Compare this vector clock with another
   * Returns the relationship between two clocks
   */
  compare(other: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
    let isLessOrEqual = true;
    let isGreaterOrEqual = true;
    
    // Get all nodes from both clocks
    const allNodes = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    
    for (const nodeId of allNodes) {
      const thisValue = this.clocks.get(nodeId) || 0;
      const otherValue = other.clocks.get(nodeId) || 0;
      
      if (thisValue > otherValue) isLessOrEqual = false;
      if (thisValue < otherValue) isGreaterOrEqual = false;
    }
    
    // Determine the relationship
    if (isLessOrEqual && isGreaterOrEqual) return 'equal';
    if (isLessOrEqual) return 'before';
    if (isGreaterOrEqual) return 'after';
    return 'concurrent';
  }

  /**
   * Merge this vector clock with another
   * Takes the maximum value for each node
   */
  merge(other: VectorClock): void {
    const allNodes = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    
    for (const nodeId of allNodes) {
      const thisValue = this.clocks.get(nodeId) || 0;
      const otherValue = other.clocks.get(nodeId) || 0;
      this.clocks.set(nodeId, Math.max(thisValue, otherValue));
    }
  }

  /**
   * Create a copy of this vector clock
   */
  clone(): VectorClock {
    const cloned = new VectorClock();
    this.clocks.forEach((value, key) => {
      cloned.clocks.set(key, value);
    });
    return cloned;
  }

  /**
   * Convert to a plain object for storage
   */
  toObject(): Record<string, number> {
    const obj: Record<string, number> = {};
    this.clocks.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Create a VectorClock from a plain object
   */
  static fromObject(obj: Record<string, number>): VectorClock {
    return new VectorClock(obj);
  }

  /**
   * Check if two vector clocks are equal
   */
  equals(other: VectorClock): boolean {
    return this.compare(other) === 'equal';
  }

  /**
   * Check if this clock happened before another
   */
  happenedBefore(other: VectorClock): boolean {
    return this.compare(other) === 'before';
  }

  /**
   * Check if this clock happened after another
   */
  happenedAfter(other: VectorClock): boolean {
    return this.compare(other) === 'after';
  }

  /**
   * Check if this clock is concurrent with another
   */
  isConcurrent(other: VectorClock): boolean {
    return this.compare(other) === 'concurrent';
  }

  /**
   * Get a string representation for debugging
   */
  toString(): string {
    const entries = Array.from(this.clocks.entries())
      .map(([node, value]) => `${node}:${value}`)
      .join(', ');
    return `VectorClock{${entries}}`;
  }
}

/**
 * Helper function to detect conflicts using vector clocks
 */
export function detectConflict(
  localClock: VectorClock | Record<string, number>,
  remoteClock: VectorClock | Record<string, number>
): boolean {
  const local = localClock instanceof VectorClock 
    ? localClock 
    : VectorClock.fromObject(localClock);
  
  const remote = remoteClock instanceof VectorClock
    ? remoteClock
    : VectorClock.fromObject(remoteClock);
  
  return local.isConcurrent(remote);
}

/**
 * Resolve conflicts using a three-way merge
 */
export interface MergeableEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  attendees?: string[];
  [key: string]: any;
}

export function threeWayMerge<T extends MergeableEvent>(
  base: T,
  local: T,
  remote: T,
  preferLocal: boolean = true
): T {
  const merged = { ...base } as T;
  
  // Get all keys from all three versions
  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote)
  ]);
  
  for (const key of allKeys) {
    const baseValue = base[key as keyof T];
    const localValue = local[key as keyof T];
    const remoteValue = remote[key as keyof T];
    
    // If both changed the same way, use that change
    if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
      merged[key as keyof T] = localValue;
    }
    // If only local changed
    else if (JSON.stringify(baseValue) === JSON.stringify(remoteValue)) {
      merged[key as keyof T] = localValue;
    }
    // If only remote changed
    else if (JSON.stringify(baseValue) === JSON.stringify(localValue)) {
      merged[key as keyof T] = remoteValue;
    }
    // Both changed differently - conflict!
    else {
      // Use preference to resolve
      merged[key as keyof T] = preferLocal ? localValue : remoteValue;
      
      // For certain fields, we might want to merge differently
      if (key === 'attendees' && Array.isArray(localValue) && Array.isArray(remoteValue)) {
        // Merge attendee lists
        const mergedAttendees = new Set([
          ...(localValue as string[]),
          ...(remoteValue as string[])
        ]);
        merged[key as keyof T] = Array.from(mergedAttendees) as T[keyof T];
      }
      
      if (key === 'description') {
        // Concatenate descriptions if both changed
        if (localValue && remoteValue && localValue !== remoteValue) {
          merged[key as keyof T] = `${localValue}\n\n---\n\n${remoteValue}` as T[keyof T];
        }
      }
    }
  }
  
  return merged;
}