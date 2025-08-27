import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to trap focus within a container element
 * Useful for modals, dialogs, and other overlay components
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((element) => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null
      );
    });
  }, []);

  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isActive) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If shift+tab from first element, focus last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // If tab from last element, focus first element
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      // If focus is outside the container, bring it back
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        // Restore focus to the previously focused element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    },
    [isActive]
  );

  // Save current focus and set initial focus
  useEffect(() => {
    if (!isActive) return;

    // Save the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set initial focus
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure the container is fully rendered
      const timeoutId = setTimeout(() => {
        focusableElements[0].focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isActive, getFocusableElements]);

  // Add event listeners
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, handleTabKey, handleEscapeKey]);

  // Restore focus when deactivated
  useEffect(() => {
    return () => {
      if (!isActive && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus within a list of items
 * Useful for menus, dropdowns, and list navigation
 */
export function useFocusList(items: HTMLElement[], initialIndex = 0) {
  const [focusedIndex, setFocusedIndex] = useRef(initialIndex);

  const focusItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        item.focus();
        setFocusedIndex.current = index;
      }
    },
    [items]
  );

  const focusNext = useCallback(() => {
    const nextIndex = (focusedIndex.current + 1) % items.length;
    focusItem(nextIndex);
  }, [items.length, focusItem]);

  const focusPrevious = useCallback(() => {
    const prevIndex = (focusedIndex.current - 1 + items.length) % items.length;
    focusItem(prevIndex);
  }, [items.length, focusItem]);

  const focusFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const focusLast = useCallback(() => {
    focusItem(items.length - 1);
  }, [items.length, focusItem]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusPrevious();
          break;
        case 'Home':
          event.preventDefault();
          focusFirst();
          break;
        case 'End':
          event.preventDefault();
          focusLast();
          break;
      }
    },
    [focusNext, focusPrevious, focusFirst, focusLast]
  );

  useEffect(() => {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === focusedIndex.current ? '0' : '-1');
    });
  }, [items]);

  return {
    focusedIndex: focusedIndex.current,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    handleKeyDown,
  };
}
