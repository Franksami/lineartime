/**
 * VirtualizationManager - Efficient viewport-based rendering with Intersection Observer
 * Manages visibility of large datasets with minimal DOM manipulation
 */

export interface VirtualItem {
  id: string;
  index: number;
  element?: HTMLElement;
  height: number;
  width?: number;
  data: any;
  isVisible?: boolean;
  isRendered?: boolean;
}

export interface VirtualizationConfig {
  rootMargin?: string; // Margin around viewport for pre-rendering
  threshold?: number | number[]; // Visibility threshold(s)
  buffer?: number; // Number of items to render outside viewport
  overscan?: number; // Number of screens to pre-render
  enableHorizontal?: boolean; // Support horizontal scrolling
  estimatedItemSize?: number; // Estimated size for unmeasured items
  onVisibilityChange?: (visible: VirtualItem[], hidden: VirtualItem[]) => void;
}

export class VirtualizationManager {
  private observer: IntersectionObserver | null = null;
  private items: Map<string, VirtualItem> = new Map();
  private visibleItems: Set<string> = new Set();
  private container: HTMLElement | null = null;
  private config: Required<VirtualizationConfig>;
  private scrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private lastScrollPosition = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  
  // Performance metrics
  private metrics = {
    totalItems: 0,
    visibleItems: 0,
    renderedItems: 0,
    intersectionCallbacks: 0,
    resizeEvents: 0,
  };

  constructor(container: HTMLElement, config: VirtualizationConfig = {}) {
    this.container = container;
    this.config = {
      rootMargin: config.rootMargin ?? '100px',
      threshold: config.threshold ?? [0, 0.1, 0.5, 0.9, 1],
      buffer: config.buffer ?? 5,
      overscan: config.overscan ?? 1,
      enableHorizontal: config.enableHorizontal ?? false,
      estimatedItemSize: config.estimatedItemSize ?? 100,
      onVisibilityChange: config.onVisibilityChange ?? (() => {}),
    };

    this.init();
  }

  /**
   * Initialize observers
   */
  private init(): void {
    if (!this.container) return;

    // Create Intersection Observer
    this.observer = new IntersectionObserver(
      this.handleIntersection,
      {
        root: this.container,
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold,
      }
    );

    // Create Resize Observer for dynamic size handling
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);

    // Create Mutation Observer for DOM changes
    this.mutationObserver = new MutationObserver(this.handleMutation);
    this.mutationObserver.observe(this.container, {
      childList: true,
      subtree: true,
    });

    // Track scroll direction
    this.container.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    this.metrics.intersectionCallbacks++;
    
    const newlyVisible: VirtualItem[] = [];
    const newlyHidden: VirtualItem[] = [];

    entries.forEach(entry => {
      const id = entry.target.getAttribute('data-virtual-id');
      if (!id) return;

      const item = this.items.get(id);
      if (!item) return;

      const wasVisible = this.visibleItems.has(id);
      const isNowVisible = entry.isIntersecting;

      if (isNowVisible && !wasVisible) {
        this.visibleItems.add(id);
        item.isVisible = true;
        newlyVisible.push(item);
      } else if (!isNowVisible && wasVisible) {
        this.visibleItems.delete(id);
        item.isVisible = false;
        newlyHidden.push(item);
      }

      // Update visibility ratio for progressive loading
      if (entry.target instanceof HTMLElement) {
        entry.target.dataset.visibilityRatio = entry.intersectionRatio.toString();
      }
    });

    // Update metrics
    this.metrics.visibleItems = this.visibleItems.size;

    // Notify listeners
    if (newlyVisible.length > 0 || newlyHidden.length > 0) {
      this.config.onVisibilityChange(newlyVisible, newlyHidden);
    }

    // Optimize rendering based on scroll direction
    this.optimizeRendering();
  };

  /**
   * Handle container resize
   */
  private handleResize = (entries: ResizeObserverEntry[]): void => {
    this.metrics.resizeEvents++;
    
    // Recalculate visible items after resize
    this.recalculateVisibility();
  };

  /**
   * Handle DOM mutations
   */
  private handleMutation = (mutations: MutationRecord[]): void => {
    // Re-observe new elements
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement && node.dataset.virtualId) {
          this.observeItem(node);
        }
      });
    });
  };

  /**
   * Handle scroll events
   */
  private handleScroll = (event: Event): void => {
    if (!this.container) return;

    const currentX = this.container.scrollLeft;
    const currentY = this.container.scrollTop;

    // Determine scroll direction
    if (currentY > this.lastScrollPosition.y) {
      this.scrollDirection = 'down';
    } else if (currentY < this.lastScrollPosition.y) {
      this.scrollDirection = 'up';
    } else if (currentX > this.lastScrollPosition.x) {
      this.scrollDirection = 'right';
    } else if (currentX < this.lastScrollPosition.x) {
      this.scrollDirection = 'left';
    }

    this.lastScrollPosition = { x: currentX, y: currentY };
  };

  /**
   * Register an item for virtualization
   */
  registerItem(item: VirtualItem): void {
    this.items.set(item.id, item);
    this.metrics.totalItems = this.items.size;
    
    if (item.element) {
      this.observeItem(item.element);
    }
  }

  /**
   * Register multiple items
   */
  registerItems(items: VirtualItem[]): void {
    items.forEach(item => this.registerItem(item));
  }

  /**
   * Unregister an item
   */
  unregisterItem(id: string): void {
    const item = this.items.get(id);
    if (item?.element && this.observer) {
      this.observer.unobserve(item.element);
    }
    
    this.items.delete(id);
    this.visibleItems.delete(id);
    this.metrics.totalItems = this.items.size;
    this.metrics.visibleItems = this.visibleItems.size;
  }

  /**
   * Observe an element
   */
  private observeItem(element: HTMLElement): void {
    if (!this.observer) return;
    
    // Add virtual ID if not present
    const id = element.dataset.virtualId;
    if (!id) {
      console.warn('Element missing virtual ID');
      return;
    }
    
    this.observer.observe(element);
  }

  /**
   * Get visible items
   */
  getVisibleItems(): VirtualItem[] {
    return Array.from(this.visibleItems).map(id => this.items.get(id)!).filter(Boolean);
  }

  /**
   * Get items to render based on visibility and buffer
   */
  getItemsToRender(): VirtualItem[] {
    const visible = this.getVisibleItems();
    const indices = visible.map(item => item.index);
    
    if (indices.length === 0) {
      // Return first buffer items if nothing visible
      return Array.from(this.items.values()).slice(0, this.config.buffer);
    }
    
    const minIndex = Math.min(...indices);
    const maxIndex = Math.max(...indices);
    
    // Add buffer items
    const startIndex = Math.max(0, minIndex - this.config.buffer);
    const endIndex = Math.min(this.items.size - 1, maxIndex + this.config.buffer);
    
    return Array.from(this.items.values()).filter(
      item => item.index >= startIndex && item.index <= endIndex
    );
  }

  /**
   * Optimize rendering based on scroll direction
   */
  private optimizeRendering(): void {
    if (!this.scrollDirection) return;
    
    const itemsToRender = this.getItemsToRender();
    const overscan = this.config.overscan;
    
    // Pre-render items in scroll direction
    if (this.scrollDirection === 'down' || this.scrollDirection === 'right') {
      const maxIndex = Math.max(...itemsToRender.map(item => item.index));
      const preRenderEnd = Math.min(this.items.size - 1, maxIndex + overscan * 10);
      
      for (let i = maxIndex + 1; i <= preRenderEnd; i++) {
        const item = Array.from(this.items.values()).find(item => item.index === i);
        if (item && !item.isRendered) {
          this.preRenderItem(item);
        }
      }
    } else if (this.scrollDirection === 'up' || this.scrollDirection === 'left') {
      const minIndex = Math.min(...itemsToRender.map(item => item.index));
      const preRenderStart = Math.max(0, minIndex - overscan * 10);
      
      for (let i = minIndex - 1; i >= preRenderStart; i--) {
        const item = Array.from(this.items.values()).find(item => item.index === i);
        if (item && !item.isRendered) {
          this.preRenderItem(item);
        }
      }
    }
    
    this.metrics.renderedItems = itemsToRender.length;
  }

  /**
   * Pre-render an item (prepare but don't display)
   */
  private preRenderItem(item: VirtualItem): void {
    // Mark as rendered but not visible
    item.isRendered = true;
    
    // This would trigger actual rendering logic in the component
    // For now, just mark the state
  }

  /**
   * Recalculate visibility after container changes
   */
  private recalculateVisibility(): void {
    if (!this.container || !this.observer) return;
    
    // Disconnect and reconnect to force recalculation
    this.items.forEach(item => {
      if (item.element) {
        this.observer!.unobserve(item.element);
        this.observer!.observe(item.element);
      }
    });
  }

  /**
   * Get virtualization metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      efficiency: this.metrics.totalItems > 0 
        ? this.metrics.renderedItems / this.metrics.totalItems 
        : 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VirtualizationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate observer with new config if needed
    if (config.rootMargin !== undefined || config.threshold !== undefined) {
      this.destroy();
      this.init();
      this.recalculateVisibility();
    }
  }

  /**
   * Force update visibility
   */
  forceUpdate(): void {
    this.recalculateVisibility();
  }

  /**
   * Destroy the manager and clean up
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
    }
    
    this.items.clear();
    this.visibleItems.clear();
  }
}

/**
 * React hook for virtualization
 */
export function useVirtualization(
  containerRef: React.RefObject<HTMLElement>,
  items: any[],
  config?: VirtualizationConfig
) {
  const [visibleIndices, setVisibleIndices] = React.useState<Set<number>>(new Set());
  const managerRef = React.useRef<VirtualizationManager | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const manager = new VirtualizationManager(containerRef.current, {
      ...config,
      onVisibilityChange: (visible, hidden) => {
        const newIndices = new Set(visible.map(item => item.index));
        setVisibleIndices(newIndices);
      },
    });

    // Register items
    const virtualItems: VirtualItem[] = items.map((data, index) => ({
      id: `item-${index}`,
      index,
      data,
      height: config?.estimatedItemSize ?? 100,
    }));
    
    manager.registerItems(virtualItems);
    managerRef.current = manager;

    return () => {
      manager.destroy();
    };
  }, [containerRef, items, config]);

  return {
    visibleIndices,
    isItemVisible: (index: number) => visibleIndices.has(index),
    forceUpdate: () => managerRef.current?.forceUpdate(),
    getMetrics: () => managerRef.current?.getMetrics(),
  };
}

import React from 'react';