'use client';

import type React from 'react';

import { useCallback, useMemo, useState } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  enabled?: boolean;
}

export function useVirtualization<T>(items: T[], options: VirtualizationOptions) {
  const { itemHeight, containerHeight, overscan = 5, enabled = true } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    if (!enabled) {
      return { start: 0, end: items.length };
    }

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(items.length, visibleEnd + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length, enabled]);

  const visibleItems = useMemo(() => {
    if (!enabled) return items;
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange, enabled]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  };
}
