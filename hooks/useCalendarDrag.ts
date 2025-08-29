'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DragState {
  isDragging: boolean;
  pointerId: number | null;
  startCoords: { x: number; y: number };
  dragOffset: { x: number; y: number };
}

interface UseCalendarDragOptions {
  onDragStart?: (coords: { x: number; y: number }) => void;
  onDragMove?: (offset: { x: number; y: number }) => void;
  onDragEnd?: (offset: { x: number; y: number }) => void;
  onDragCancel?: () => void;
}

export const useCalendarDrag = (options: UseCalendarDragOptions = {}) => {
  const { onDragStart, onDragMove, onDragEnd, onDragCancel } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    pointerId: null,
    startCoords: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
  });

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const element = elementRef.current;
      if (!element) return;

      // CRITICAL: Capture pointer to receive all events
      element.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();

      const startCoords = { x: e.clientX, y: e.clientY };

      dragStateRef.current = {
        isDragging: true,
        pointerId: e.pointerId,
        startCoords,
        dragOffset: { x: 0, y: 0 },
      };

      setIsDragging(true);

      // Set cursor immediately for visual feedback
      if (document.body) {
        document.body.style.cursor = 'grabbing';
      }

      // Callback for drag start
      onDragStart?.(startCoords);
    },
    [onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStateRef.current.isDragging || e.pointerId !== dragStateRef.current.pointerId)
        return;

      const offset = {
        x: e.clientX - dragStateRef.current.startCoords.x,
        y: e.clientY - dragStateRef.current.startCoords.y,
      };

      dragStateRef.current.dragOffset = offset;

      // Update visual position
      if (elementRef.current) {
        elementRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      }

      // Callback for drag move
      onDragMove?.(offset);
    },
    [onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== dragStateRef.current.pointerId) return;

      const element = elementRef.current;
      const finalOffset = dragStateRef.current.dragOffset;

      if (element) {
        // CRITICAL: Release pointer capture
        element.releasePointerCapture(e.pointerId);
        element.style.transform = '';
      }

      // CRITICAL: Reset cursor immediately
      if (document.body) {
        document.body.style.cursor = 'default';
      }

      // Reset drag state
      dragStateRef.current = {
        isDragging: false,
        pointerId: null,
        startCoords: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
      };

      setIsDragging(false);

      // Callback for drag end
      onDragEnd?.(finalOffset);
    },
    [onDragEnd]
  );

  // CRITICAL: Handle pointer cancel (browser interference)
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== dragStateRef.current.pointerId) return;

      const element = elementRef.current;

      // Force cleanup
      if (element && dragStateRef.current.pointerId !== null) {
        element.releasePointerCapture(dragStateRef.current.pointerId);
        element.style.transform = '';
      }

      // CRITICAL: Reset cursor
      if (document.body) {
        document.body.style.cursor = 'default';
      }

      // Reset state
      dragStateRef.current = {
        isDragging: false,
        pointerId: null,
        startCoords: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
      };

      setIsDragging(false);

      // Callback for cancel
      onDragCancel?.();
    },
    [onDragCancel]
  );

  // CRITICAL: Escape key to cancel drag
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragStateRef.current.isDragging) {
        const element = elementRef.current;

        if (element && dragStateRef.current.pointerId !== null) {
          element.releasePointerCapture(dragStateRef.current.pointerId);
          element.style.transform = '';
        }

        // Reset cursor
        if (document.body) {
          document.body.style.cursor = 'default';
        }

        dragStateRef.current = {
          isDragging: false,
          pointerId: null,
          startCoords: { x: 0, y: 0 },
          dragOffset: { x: 0, y: 0 },
        };

        setIsDragging(false);
        onDragCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onDragCancel]);

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragStateRef.current.isDragging) {
        const element = elementRef.current;
        if (element && dragStateRef.current.pointerId !== null) {
          element.releasePointerCapture(dragStateRef.current.pointerId);
        }

        // Ensure cursor is reset
        if (document.body) {
          document.body.style.cursor = 'default';
        }
      }
    };
  }, []);

  return {
    elementRef,
    isDragging,
    dragOffset: dragStateRef.current.dragOffset,
    eventHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
};
