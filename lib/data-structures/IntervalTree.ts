import type { Event } from '@/types/calendar'

interface TimeInterval {
  start: number
  end: number
  event: Event
}

class IntervalNode {
  interval: TimeInterval
  max: number
  left: IntervalNode | null = null
  right: IntervalNode | null = null
  height: number = 1
  
  constructor(interval: TimeInterval) {
    this.interval = interval
    this.max = interval.end
  }
}

export class IntervalTree {
  private root: IntervalNode | null = null
  private size: number = 0
  
  /**
   * Insert an event into the interval tree
   * @param event The calendar event to insert
   */
  insert(event: Event): void {
    const interval: TimeInterval = {
      start: event.startDate.getTime(),
      end: event.endDate.getTime(),
      event
    }
    this.root = this.insertNode(this.root, interval)
    this.size++
  }
  
  /**
   * Remove an event from the interval tree
   * @param eventId The ID of the event to remove
   */
  remove(eventId: string): boolean {
    const initialSize = this.size
    this.root = this.removeNode(this.root, eventId)
    return this.size < initialSize
  }
  
  /**
   * Find all events that overlap with the given time range
   * @param start Start date of the range
   * @param end End date of the range
   * @returns Array of overlapping events
   */
  findOverlapping(start: Date, end: Date): Event[] {
    const results: Event[] = []
    this.searchOverlapping(
      this.root,
      start.getTime(),
      end.getTime(),
      results
    )
    return results
  }
  
  /**
   * Find all events that conflict with a given event
   * @param event The event to check conflicts for
   * @returns Array of conflicting events
   */
  findConflicts(event: Event): Event[] {
    const conflicts = this.findOverlapping(event.startDate, event.endDate)
    // Filter out the event itself if it's already in the tree
    return conflicts.filter(e => e.id !== event.id)
  }
  
  /**
   * Check if a time slot is available (no conflicts)
   * @param start Start date to check
   * @param end End date to check
   * @returns True if the time slot is available
   */
  isTimeSlotAvailable(start: Date, end: Date): boolean {
    return this.findOverlapping(start, end).length === 0
  }
  
  /**
   * Get all events in the tree sorted by start time
   * @returns Array of all events sorted by start time
   */
  getAllEventsSorted(): Event[] {
    const events: Event[] = []
    this.inorderTraversal(this.root, events)
    return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }
  
  /**
   * Clear all events from the tree
   */
  clear(): void {
    this.root = null
    this.size = 0
  }
  
  /**
   * Get the number of events in the tree
   */
  getSize(): number {
    return this.size
  }
  
  // Private helper methods
  
  private insertNode(node: IntervalNode | null, interval: TimeInterval): IntervalNode {
    if (!node) {
      return new IntervalNode(interval)
    }
    
    const low = interval.start
    
    if (low < node.interval.start) {
      node.left = this.insertNode(node.left, interval)
    } else {
      node.right = this.insertNode(node.right, interval)
    }
    
    // Update height and max value
    node.height = 1 + Math.max(
      this.getHeight(node.left),
      this.getHeight(node.right)
    )
    
    node.max = Math.max(
      node.interval.end,
      Math.max(
        node.left ? node.left.max : 0,
        node.right ? node.right.max : 0
      )
    )
    
    // Balance the tree
    return this.balance(node)
  }
  
  private removeNode(node: IntervalNode | null, eventId: string): IntervalNode | null {
    if (!node) return null
    
    if (node.interval.event.id === eventId) {
      this.size--
      
      if (!node.left && !node.right) {
        return null
      }
      
      if (!node.left) return node.right
      if (!node.right) return node.left
      
      // Node has two children, find inorder successor
      const minNode = this.findMin(node.right)
      node.interval = minNode.interval
      node.right = this.removeNode(node.right, minNode.interval.event.id)
    } else if (eventId < node.interval.event.id) {
      node.left = this.removeNode(node.left, eventId)
    } else {
      node.right = this.removeNode(node.right, eventId)
    }
    
    // Update height and max
    node.height = 1 + Math.max(
      this.getHeight(node.left),
      this.getHeight(node.right)
    )
    
    node.max = Math.max(
      node.interval.end,
      Math.max(
        node.left ? node.left.max : 0,
        node.right ? node.right.max : 0
      )
    )
    
    return this.balance(node)
  }
  
  private searchOverlapping(
    node: IntervalNode | null,
    start: number,
    end: number,
    results: Event[]
  ): void {
    if (!node) return
    
    // Check if current node overlaps
    if (node.interval.start < end && node.interval.end > start) {
      results.push(node.interval.event)
    }
    
    // Recursively search left subtree if it might contain overlapping intervals
    if (node.left && node.left.max > start) {
      this.searchOverlapping(node.left, start, end, results)
    }
    
    // Recursively search right subtree if it might contain overlapping intervals
    if (node.right && node.interval.start < end) {
      this.searchOverlapping(node.right, start, end, results)
    }
  }
  
  private inorderTraversal(node: IntervalNode | null, events: Event[]): void {
    if (!node) return
    
    this.inorderTraversal(node.left, events)
    events.push(node.interval.event)
    this.inorderTraversal(node.right, events)
  }
  
  private getHeight(node: IntervalNode | null): number {
    return node ? node.height : 0
  }
  
  private getBalance(node: IntervalNode): number {
    return this.getHeight(node.left) - this.getHeight(node.right)
  }
  
  private balance(node: IntervalNode): IntervalNode {
    const balance = this.getBalance(node)
    
    // Left heavy
    if (balance > 1) {
      if (node.left && this.getBalance(node.left) < 0) {
        node.left = this.rotateLeft(node.left)
      }
      return this.rotateRight(node)
    }
    
    // Right heavy
    if (balance < -1) {
      if (node.right && this.getBalance(node.right) > 0) {
        node.right = this.rotateRight(node.right)
      }
      return this.rotateLeft(node)
    }
    
    return node
  }
  
  private rotateRight(y: IntervalNode): IntervalNode {
    const x = y.left!
    const T2 = x.right
    
    x.right = y
    y.left = T2
    
    // Update heights
    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right))
    x.height = 1 + Math.max(this.getHeight(x.left), this.getHeight(x.right))
    
    // Update max values
    y.max = Math.max(
      y.interval.end,
      Math.max(
        y.left ? y.left.max : 0,
        y.right ? y.right.max : 0
      )
    )
    
    x.max = Math.max(
      x.interval.end,
      Math.max(
        x.left ? x.left.max : 0,
        x.right ? x.right.max : 0
      )
    )
    
    return x
  }
  
  private rotateLeft(x: IntervalNode): IntervalNode {
    const y = x.right!
    const T2 = y.left
    
    y.left = x
    x.right = T2
    
    // Update heights
    x.height = 1 + Math.max(this.getHeight(x.left), this.getHeight(x.right))
    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right))
    
    // Update max values
    x.max = Math.max(
      x.interval.end,
      Math.max(
        x.left ? x.left.max : 0,
        x.right ? x.right.max : 0
      )
    )
    
    y.max = Math.max(
      y.interval.end,
      Math.max(
        y.left ? y.left.max : 0,
        y.right ? y.right.max : 0
      )
    )
    
    return y
  }
  
  private findMin(node: IntervalNode): IntervalNode {
    while (node.left) {
      node = node.left
    }
    return node
  }
}

// Export a singleton instance for global use
export const globalEventTree = new IntervalTree()