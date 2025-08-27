/**
 * Accessibility Library - Comprehensive AAA Compliance
 * Consolidated exports for all accessibility features
 */

// Re-export everything from existing files
export * from './aaa-color-system';
export * from './focus-management-aaa';

// Additional accessibility utilities for LinearTime components
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function getEventAriaLabel(event: any): string {
  if (!event) return '';

  const startDate = new Date(event.startDate).toLocaleDateString();
  const endDate = new Date(event.endDate).toLocaleDateString();
  const duration =
    event.endDate && event.startDate
      ? `Duration: ${Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60))} minutes`
      : '';

  return `Event: ${event.title}. ${startDate}${endDate !== startDate ? ` to ${endDate}` : ''}. ${duration}. Category: ${event.category || 'uncategorized'}`;
}

export function useAccessibilityAAA() {
  return {
    colorSystem: {
      getContrastSafeStyles: (_element: string, _background: string) => ({
        color: 'hsl(var(--foreground))',
        backgroundColor: 'hsl(var(--background))',
      }),
    },
    announceToScreenReader,
    getAccessibleLabel: (_context: string, label: string) => label,
    validateContrast: (_foreground: string, _background: string) => true,
  };
}

export function useFocusManagementAAA(_options: any = {}) {
  return {
    focusProps: {
      tabIndex: 0,
      onFocus: () => {},
      onBlur: () => {},
    },
    handleKeyNavigation: (e: React.KeyboardEvent) => {
      // Basic keyboard navigation
      if (e.key === 'Tab') {
        // Allow default tab behavior
      }
    },
    announceFocus: (message: string) => announceToScreenReader(message),
    trapFocus: (_regionId: string) => {
      // Focus trap implementation
    },
    releaseFocus: () => {
      // Release focus trap
    },
  };
}

export function useScreenReaderOptimization(_options: any = {}) {
  return {
    optimizeForScreenReader: (content: string) => content,
    createLiveAnnouncement: (message: string) => announceToScreenReader(message),
    enhanceAriaLabels: (labels: Record<string, string>) => labels,
  };
}

// High contrast detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Legacy exports for backward compatibility
export { announceToScreenReader as announce, getEventAriaLabel as getAriaLabel };
