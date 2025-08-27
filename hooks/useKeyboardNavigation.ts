import { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onHome?: () => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for comprehensive keyboard navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const key = event.key;
      const shiftKey = event.shiftKey;
      const _ctrlKey = event.ctrlKey || event.metaKey;

      // Don't interfere with form inputs
      const target = event.target as HTMLElement;
      const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (isFormElement && !['Escape', 'Tab'].includes(key)) {
        return;
      }

      switch (key) {
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case ' ':
        case 'Space':
          if (onSpace) {
            event.preventDefault();
            onSpace();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(shiftKey);
          }
          break;
        case 'Home':
          if (onHome) {
            event.preventDefault();
            onHome();
          }
          break;
        case 'End':
          if (onEnd) {
            event.preventDefault();
            onEnd();
          }
          break;
        case 'PageUp':
          if (onPageUp) {
            event.preventDefault();
            onPageUp();
          }
          break;
        case 'PageDown':
          if (onPageDown) {
            event.preventDefault();
            onPageDown();
          }
          break;
      }
    },
    [
      enabled,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onSpace,
      onEscape,
      onTab,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
    ]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Custom hook for roving tabindex pattern
 */
export function useRovingTabIndex(
  items: HTMLElement[],
  currentIndex: number,
  onChange: (index: number) => void
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;
      const itemCount = items.length;

      if (itemCount === 0) return;

      let newIndex = currentIndex;

      switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (currentIndex + 1) % itemCount;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (currentIndex - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = itemCount - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        onChange(newIndex);
        items[newIndex]?.focus();
      }
    },
    [items, currentIndex, onChange]
  );

  useEffect(() => {
    // Set tabindex on items
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1;
    });
  }, [items, currentIndex]);

  return handleKeyDown;
}

/**
 * Custom hook for focus management
 */
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleTabKey);

    return () => {
      containerRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef]);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  return {
    trapFocus,
    saveFocus,
    restoreFocus,
  };
}
