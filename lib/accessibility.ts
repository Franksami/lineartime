/**
 * Accessibility utilities and helpers for WCAG 2.1 AA compliance
 */

// Re-export comprehensive accessibility features
export * from './accessibility/index';

/**
 * Generate ARIA label for calendar day
 */
export function getDayAriaLabel(date: Date, eventCount = 0): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateString = formatter.format(date);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  let label = dateString;

  if (isToday) {
    label += ', Today';
  }

  if (eventCount > 0) {
    label += `, ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`;
  }

  return label;
}

/**
 * Generate ARIA label for month
 */
export function getMonthAriaLabel(month: number, year: number): string {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return `${monthNames[month]} ${year}`;
}

/**
 * Generate ARIA label for event
 */
export function getEventAriaLabel(
  title: string,
  startDate: Date,
  endDate?: Date,
  category?: string,
  location?: string
): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  let label = `${title}, `;

  if (category) {
    label += `${category} event, `;
  }

  label += `starts ${formatter.format(startDate)}`;

  if (endDate && endDate.getTime() !== startDate.getTime()) {
    label += `, ends ${formatter.format(endDate)}`;
  }

  if (location) {
    label += `, at ${location}`;
  }

  return label;
}

/**
 * Generate keyboard navigation instructions
 */
export function getKeyboardInstructions(): string {
  return `
    Use arrow keys to navigate calendar days.
    Press Enter or Space to select a day.
    Press Tab to move between controls.
    Press Escape to close dialogs.
    Press Plus or Equal to zoom in.
    Press Minus to zoom out.
    Press Zero to reset zoom.
    Press Shift with left or right arrow to change years.
  `.trim();
}

/**
 * Focus trap utility for modals
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get className for skip link
 * @returns {string} className for skip link
 */
export function getSkipLinkClassName(): string {
  return 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';
}

/**
 * Get className for visually hidden text
 * @returns {string} className for screen reader only text
 */
export function getVisuallyHiddenClassName(): string {
  return 'sr-only';
}

/**
 * Get attributes for ARIA live region
 * @param {string} priority - Announcement priority
 * @returns {object} ARIA attributes for live region
 */
export function getLiveRegionAttributes(priority: 'polite' | 'assertive' = 'polite') {
  return {
    role: 'status',
    'aria-live': priority,
    'aria-atomic': 'true',
    className: 'sr-only',
  };
}
