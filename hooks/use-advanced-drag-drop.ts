'use client';

import type React from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DragState {
  isDragging: boolean;
  isMultiSelect: boolean;
  selectedEvents: Set<string>;
  draggedEvents: Set<string>;
  dragOffset: { x: number; y: number };
  dragStartPosition: { x: number; y: number };
  snapToGrid: boolean;
  showPreview: boolean;
}

interface TouchState {
  isTouch: boolean;
  touchStartTime: number;
  touchMoved: boolean;
  longPressTimer: NodeJS.Timeout | null;
}

export function useAdvancedDragDrop<T extends { id: string; startDate: Date; endDate: Date }>(
  items: T[],
  onItemsChange: (items: T[]) => void,
  options: {
    snapToGrid?: boolean;
    multiSelect?: boolean;
    touchSupport?: boolean;
    longPressDuration?: number;
  } = {}
) {
  const {
    snapToGrid = true,
    multiSelect = true,
    touchSupport = true,
    longPressDuration = 500,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isMultiSelect: false,
    selectedEvents: new Set(),
    draggedEvents: new Set(),
    dragOffset: { x: 0, y: 0 },
    dragStartPosition: { x: 0, y: 0 },
    snapToGrid,
    showPreview: false,
  });

  const [touchState, setTouchState] = useState<TouchState>({
    isTouch: false,
    touchStartTime: 0,
    touchMoved: false,
    longPressTimer: null,
  });

  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearSelection = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      selectedEvents: new Set(),
      isMultiSelect: false,
    }));
  }, []);

  const handleItemSelect = useCallback(
    (itemId: string, event: React.MouseEvent | React.TouchEvent) => {
      const isCtrlOrCmd = 'ctrlKey' in event ? event.ctrlKey || event.metaKey : false;

      setDragState((prev) => {
        const newSelected = new Set(prev.selectedEvents);

        if (isCtrlOrCmd && multiSelect) {
          if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
          } else {
            newSelected.add(itemId);
          }
        } else {
          newSelected.clear();
          newSelected.add(itemId);
        }

        return {
          ...prev,
          selectedEvents: newSelected,
          isMultiSelect: newSelected.size > 1,
        };
      });
    },
    [multiSelect]
  );

  const handleDragStart = useCallback(
    (itemId: string, event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();

      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      setDragState((prev) => {
        const draggedItems = prev.selectedEvents.has(itemId)
          ? prev.selectedEvents
          : new Set([itemId]);

        return {
          ...prev,
          isDragging: true,
          draggedEvents: draggedItems,
          dragStartPosition: { x: clientX, y: clientY },
          dragOffset: { x: 0, y: 0 },
          showPreview: true,
        };
      });

      // Add global event listeners for smooth dragging
      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setDragState((prev) => ({
          ...prev,
          dragOffset: {
            x: clientX - prev.dragStartPosition.x,
            y: clientY - prev.dragStartPosition.y,
          },
        }));
      };

      const handleMouseUp = (e: MouseEvent | TouchEvent) => {
        handleDragEnd(e);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (touchSupport) {
          document.removeEventListener('touchmove', handleMouseMove);
          document.removeEventListener('touchend', handleMouseUp);
        }
      };

      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      if (touchSupport) {
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);
      }
    },
    [touchSupport]
  );

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

      if (!containerRef.current || !dragState.isDragging) return;

      const _containerRect = containerRef.current.getBoundingClientRect();
      const dropTarget = document.elementFromPoint(clientX, clientY);

      if (dropTarget?.dataset.date) {
        const targetDate = new Date(dropTarget.dataset.date);
        const daysDiff = Math.round(
          (targetDate.getTime() - dragState.dragStartPosition.x) / (1000 * 60 * 60 * 24)
        );

        // Update dragged items
        const updatedItems = items.map((item) => {
          if (dragState.draggedEvents.has(item.id)) {
            const newStartDate = new Date(item.startDate);
            const newEndDate = new Date(item.endDate);
            newStartDate.setDate(newStartDate.getDate() + daysDiff);
            newEndDate.setDate(newEndDate.getDate() + daysDiff);

            return {
              ...item,
              startDate: newStartDate,
              endDate: newEndDate,
            };
          }
          return item;
        });

        onItemsChange(updatedItems);
      }

      setDragState((prev) => ({
        ...prev,
        isDragging: false,
        draggedEvents: new Set(),
        dragOffset: { x: 0, y: 0 },
        showPreview: false,
      }));
    },
    [dragState, items, onItemsChange]
  );

  const handleTouchStart = useCallback(
    (itemId: string, event: React.TouchEvent) => {
      if (!touchSupport) return;

      const _touch = event.touches[0];
      setTouchState((prev) => ({
        ...prev,
        isTouch: true,
        touchStartTime: Date.now(),
        touchMoved: false,
        longPressTimer: setTimeout(() => {
          handleItemSelect(itemId, event);
          // Haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, longPressDuration),
      }));
    },
    [touchSupport, longPressDuration, handleItemSelect]
  );

  const handleTouchMove = useCallback(
    (_event: React.TouchEvent) => {
      if (!touchSupport) return;

      setTouchState((prev) => {
        if (prev.longPressTimer) {
          clearTimeout(prev.longPressTimer);
        }
        return {
          ...prev,
          touchMoved: true,
          longPressTimer: null,
        };
      });
    },
    [touchSupport]
  );

  const handleTouchEnd = useCallback(
    (itemId: string, event: React.TouchEvent) => {
      if (!touchSupport) return;

      setTouchState((prev) => {
        if (prev.longPressTimer) {
          clearTimeout(prev.longPressTimer);
        }

        // If it was a quick tap without movement, select the item
        if (!prev.touchMoved && Date.now() - prev.touchStartTime < longPressDuration) {
          handleItemSelect(itemId, event);
        }

        return {
          ...prev,
          isTouch: false,
          touchMoved: false,
          longPressTimer: null,
        };
      });
    },
    [touchSupport, longPressDuration, handleItemSelect]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (dragState.selectedEvents.size > 0) {
          const updatedItems = items.filter((item) => !dragState.selectedEvents.has(item.id));
          onItemsChange(updatedItems);
          clearSelection();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setDragState((prev) => ({
          ...prev,
          selectedEvents: new Set(items.map((item) => item.id)),
          isMultiSelect: true,
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dragState.selectedEvents, items, onItemsChange, clearSelection]);

  return {
    dragState,
    touchState,
    containerRef,
    dragPreviewRef,
    handleItemSelect,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearSelection,
  };
}
