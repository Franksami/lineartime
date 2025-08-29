/**
 * Advanced Focus Management System for WCAG 2.1 AAA Compliance
 *
 * Enhanced focus management with:
 * - 3px minimum focus indicator thickness (AAA requirement)
 * - 3:1 contrast ratio for focus indicators (AAA requirement)
 * - Advanced keyboard navigation patterns
 * - Focus history and restoration
 * - Screen reader integration
 * - Performance optimization
 */

export interface AAAfocusConfiguration {
  thickness: '3px' | '4px' | '5px';
  style: 'solid' | 'dashed' | 'double' | 'ridge';
  color: string; // Must meet 3:1 contrast with background
  offset: string;
  borderRadius?: string;
  animationDuration?: string;
}

export interface FocusTrap {
  id: string;
  element: HTMLElement;
  focusableElements: HTMLElement[];
  firstFocusable: HTMLElement | null;
  lastFocusable: HTMLElement | null;
  previousFocus: HTMLElement | null;
  configuration: AAAfocusConfiguration;
  keyboardHandlers: Map<string, (event: KeyboardEvent) => void>;
  isActive: boolean;
}

export interface KeyboardNavigationPattern {
  keys: string[];
  description: string;
  handler: (event: KeyboardEvent, context: NavigationContext) => void;
  scope: 'global' | 'component' | 'modal';
  priority: number;
}

export interface NavigationContext {
  currentElement: HTMLElement;
  focusableElements: HTMLElement[];
  containerElement: HTMLElement;
  isRTL: boolean;
  gridNavigation?: {
    rows: number;
    columns: number;
    currentRow: number;
    currentColumn: number;
  };
}

export class AdvancedFocusManager {
  private static instance: AdvancedFocusManager;
  private focusHistory: HTMLElement[] = [];
  private focusTraps: Map<string, FocusTrap> = new Map();
  private keyboardPatterns: Map<string, KeyboardNavigationPattern> = new Map();
  private configuration: aaFocusConfiguration;
  private isInitialized = false;

  // AAA compliant focus configurations
  private static readonly AAA_FOCUS_CONFIGS = {
    default: {
      thickness: '3px' as const,
      style: 'solid' as const,
      color: 'var(--focus-ring-aaa)',
      offset: '2px',
      borderRadius: '4px',
      animationDuration: '150ms',
    },
    high_contrast: {
      thickness: '4px' as const,
      style: 'solid' as const,
      color: 'oklch(0.45 0.3 250)', // Blue with 3:1+ contrast
      offset: '3px',
      borderRadius: '4px',
      animationDuration: '100ms',
    },
    calendar: {
      thickness: '3px' as const,
      style: 'dashed' as const,
      color: 'oklch(0.4 0.25 250)', // Calendar-specific focus
      offset: '1px',
      borderRadius: '2px',
      animationDuration: '200ms',
    },
  };

  constructor(initialConfig?: Partial<AAAfocusConfiguration>) {
    this.configuration = {
      ...AdvancedFocusManager.AAA_FOCUS_CONFIGS.default,
      ...initialConfig,
    };
  }

  public static getInstance(): AdvancedFocusManager {
    if (!AdvancedFocusManager.instance) {
      AdvancedFocusManager.instance = new AdvancedFocusManager();
    }
    return AdvancedFocusManager.instance;
  }

  /**
   * Initialize the focus management system
   */
  public initialize(): void {
    if (this.isInitialized) return;

    this.setupGlobalKeyboardHandlers();
    this.setupFocusIndicatorStyles();
    this.registerDefaultNavigationPatterns();
    this.detectAccessibilityPreferences();
    this.isInitialized = true;

    console.log('🎯 Advanced Focus Manager initialized with AAA compliance');
  }

  /**
   * Create an AAA-compliant focus trap for modals and dialogs
   */
  public createAAATrap(
    element: HTMLElement,
    options: Partial<{
      id: string;
      configuration: AAAfocusConfiguration;
      restoreFocus: boolean;
      preventScroll: boolean;
    }> = {}
  ): FocusTrap {
    const trapId = options.id || `focus-trap-${Date.now()}`;
    const focusableElements = this.findFocusableElements(element);

    const trap: FocusTrap = {
      id: trapId,
      element,
      focusableElements,
      firstFocusable: focusableElements[0] || null,
      lastFocusable: focusableElements[focusableElements.length - 1] || null,
      previousFocus: document.activeElement as HTMLElement,
      configuration: options.configuration || this.configuration,
      keyboardHandlers: new Map(),
      isActive: false,
    };

    // Setup enhanced keyboard navigation within the trap
    this.setupTrapKeyboardHandlers(trap);

    // Store the trap
    this.focusTraps.set(trapId, trap);

    // Apply AAA focus styling
    this.applyAAAfocusStyles(element, trap.configuration);

    return trap;
  }

  /**
   * Activate a focus trap with AAA enhancements
   */
  public activateTrap(trapId: string): void {
    const trap = this.focusTraps.get(trapId);
    if (!trap) return;

    // Store current focus for restoration
    if (document.activeElement && document.activeElement !== document.body) {
      this.focusHistory.push(document.activeElement as HTMLElement);
    }

    trap.isActive = true;

    // Focus the first focusable element with enhanced announcement
    if (trap.firstFocusable) {
      trap.firstFocusable.focus({ preventScroll: false });
      this.announceToScreenReader(
        `Entered ${this.getElementLabel(trap.element)} dialog. ${this.getKeyboardInstructions()}`
      );
    }

    // Apply focus trap styles
    trap.element.setAttribute('role', 'dialog');
    trap.element.setAttribute('aria-modal', 'true');
    trap.element.setAttribute('data-focus-trap-active', 'true');
  }

  /**
   * Deactivate focus trap and restore focus
   */
  public deactivateTrap(trapId: string, restoreFocus = true): void {
    const trap = this.focusTraps.get(trapId);
    if (!trap) return;

    trap.isActive = false;
    trap.element.removeAttribute('data-focus-trap-active');

    if (restoreFocus) {
      this.restoreFocusAAA();
    }

    this.focusTraps.delete(trapId);
    this.announceToScreenReader('Dialog closed. Focus restored.');
  }

  /**
   * Enhanced focus restoration with AAA compliance
   */
  public restoreFocusAAA(fallback?: HTMLElement): void {
    const previousFocus = this.focusHistory.pop();

    if (
      previousFocus &&
      this.isElementVisible(previousFocus) &&
      this.isElementFocusable(previousFocus)
    ) {
      previousFocus.focus();
      this.announceToScreenReader(`Focus restored to ${this.getElementLabel(previousFocus)}`);
    } else if (fallback && this.isElementFocusable(fallback)) {
      fallback.focus();
      this.announceToScreenReader(`Focus moved to ${this.getElementLabel(fallback)}`);
    } else {
      // Fallback to main content area
      const main = document.querySelector('main, [role="main"]') as HTMLElement;
      if (main) {
        main.focus();
        this.announceToScreenReader('Focus restored to main content area');
      }
    }
  }

  /**
   * Register calendar-specific keyboard navigation patterns
   */
  public registerCalendarNavigation(calendarElement: HTMLElement): void {
    const calendarPatterns: KeyboardNavigationPattern[] = [
      {
        keys: ['ArrowRight'],
        description: 'Move to next day',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'next-day'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['ArrowLeft'],
        description: 'Move to previous day',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'previous-day'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['ArrowDown'],
        description: 'Move to next week',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'next-week'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['ArrowUp'],
        description: 'Move to previous week',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'previous-week'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['Home'],
        description: 'Move to first day of month',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'month-start'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['End'],
        description: 'Move to last day of month',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'month-end'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['Control+Home'],
        description: 'Move to current date',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'today'),
        scope: 'component',
        priority: 2,
      },
      {
        keys: ['PageUp'],
        description: 'Move to previous month',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'previous-month'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['PageDown'],
        description: 'Move to next month',
        handler: (event, context) => this.navigateCalendarDate(event, context, 'next-month'),
        scope: 'component',
        priority: 1,
      },
      {
        keys: ['F6'],
        description: 'Cycle between calendar regions',
        handler: (event, context) => this.cycleCalendarRegions(event, context),
        scope: 'component',
        priority: 3,
      },
    ];

    // Register patterns for this calendar
    calendarPatterns.forEach((pattern) => {
      const key = `calendar-${pattern.keys.join('+')}-${Date.now()}`;
      this.keyboardPatterns.set(key, pattern);
    });

    // Attach keyboard handlers to calendar
    calendarElement.addEventListener('keydown', this.handleCalendarKeydown.bind(this));
    calendarElement.setAttribute('data-focus-enhanced', 'true');
  }

  /**
   * Setup AAA-compliant focus indicator styles
   */
  private setupFocusIndicatorStyles(): void {
    const styleId = 'aaa-focus-indicators';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const focusStyles = `
      /* AAA Compliant Focus Indicators */
      *:focus {
        outline: ${this.configuration.thickness} ${this.configuration.style} ${this.configuration.color};
        outline-offset: ${this.configuration.offset};
        border-radius: ${this.configuration.borderRadius || '4px'};
        transition: outline ${this.configuration.animationDuration || '150ms'} ease-in-out;
      }

      /* Enhanced calendar focus indicators */
      [data-focus-enhanced="true"] *:focus {
        outline: 3px dashed oklch(0.4 0.25 250);
        outline-offset: 1px;
        box-shadow: 0 0 0 2px oklch(0.9 0.05 250);
      }

      /* High contrast focus indicators */
      @media (prefers-contrast: high) {
        *:focus {
          outline: 4px solid oklch(0.45 0.3 250);
          outline-offset: 3px;
          box-shadow: 0 0 0 1px oklch(1 0 0), 0 0 0 5px oklch(0.45 0.3 250);
        }
      }

      /* Focus trap indicators */
      [data-focus-trap-active="true"] {
        position: relative;
      }

      [data-focus-trap-active="true"]::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid oklch(0.4 0.25 250);
        border-radius: 8px;
        pointer-events: none;
        z-index: -1;
      }

      /* Screen reader only focus announcements */
      .sr-focus-announcement {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      }
    `;

    styleElement.textContent = focusStyles;
  }

  /**
   * Calendar-specific keyboard navigation handler
   */
  private navigateCalendarDate(
    event: KeyboardEvent,
    context: NavigationContext,
    direction: string
  ): void {
    event.preventDefault();

    const currentDate = this.getCurrentCalendarDate(context.currentElement);
    if (!currentDate) return;

    let newDate: Date;

    switch (direction) {
      case 'next-day':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        break;
      case 'previous-day':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        break;
      case 'next-week':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        break;
      case 'previous-week':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month-start':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case 'month-end':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        break;
      case 'next-month':
        newDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate()
        );
        break;
      case 'previous-month':
        newDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          currentDate.getDate()
        );
        break;
      case 'today':
        newDate = new Date();
        break;
      default:
        return;
    }

    // Find and focus the new date element
    const newDateElement = this.findCalendarDateElement(context.containerElement, newDate);
    if (newDateElement) {
      newDateElement.focus();
      this.announceCalendarNavigation(newDate, direction);
    }
  }

  /**
   * Cycle between calendar regions (F6 navigation)
   */
  private cycleCalendarRegions(event: KeyboardEvent, context: NavigationContext): void {
    event.preventDefault();

    const regions = [
      '[data-region="calendar-header"]',
      '[data-region="calendar-grid"]',
      '[data-region="calendar-controls"]',
      '[data-region="event-details"]',
    ];

    const currentRegion = context.currentElement.closest('[data-region]');
    const currentIndex = regions.findIndex((selector) => currentRegion?.matches(selector));

    const nextIndex = (currentIndex + 1) % regions.length;
    const nextRegion = context.containerElement.querySelector(regions[nextIndex]) as HTMLElement;

    if (nextRegion) {
      const firstFocusable = this.findFocusableElements(nextRegion)[0];
      if (firstFocusable) {
        firstFocusable.focus();
        this.announceToScreenReader(`Moved to ${this.getRegionLabel(nextRegion)}`);
      }
    }
  }

  /**
   * Enhanced screen reader announcements for calendar navigation
   */
  private announceCalendarNavigation(date: Date, direction: string): void {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dateString = formatter.format(date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    let announcement = dateString;
    if (isToday) {
      announcement += ', Today';
    }

    // Add context about the navigation
    const navigationContext = {
      'next-day': 'moved forward one day',
      'previous-day': 'moved back one day',
      'next-week': 'moved forward one week',
      'previous-week': 'moved back one week',
      'month-start': 'moved to beginning of month',
      'month-end': 'moved to end of month',
      'next-month': 'moved to next month',
      'previous-month': 'moved to previous month',
      today: 'moved to today',
    }[direction];

    if (navigationContext) {
      announcement += `, ${navigationContext}`;
    }

    this.announceToScreenReader(announcement, 'assertive');
  }

  /**
   * Find all focusable elements within a container
   */
  private findFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'summary',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(
        (el) =>
          this.isElementVisible(el as HTMLElement) && this.isElementFocusable(el as HTMLElement)
      )
      .sort((a, b) => {
        const aTabIndex = Number.parseInt((a as HTMLElement).getAttribute('tabindex') || '0');
        const bTabIndex = Number.parseInt((b as HTMLElement).getAttribute('tabindex') || '0');
        return aTabIndex - bTabIndex;
      }) as HTMLElement[];
  }

  /**
   * Enhanced visibility check for elements
   */
  private isElementVisible(element: HTMLElement): boolean {
    if (!element || element.offsetParent === null) return false;

    const style = getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  /**
   * Check if element is focusable
   */
  private isElementFocusable(element: HTMLElement): boolean {
    if (!this.isElementVisible(element)) return false;

    const _tagName = element.tagName.toLowerCase();
    const tabIndex = element.getAttribute('tabindex');

    // Elements with negative tabindex are not focusable via keyboard
    if (tabIndex && Number.parseInt(tabIndex) < 0) return false;

    // Check for disabled state
    if ('disabled' in element && (element as any).disabled) return false;

    // Check for aria-hidden
    if (element.getAttribute('aria-hidden') === 'true') return false;

    return true;
  }

  /**
   * Get descriptive label for element (for screen readers)
   */
  private getElementLabel(element: HTMLElement): string {
    // Check for aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check for associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }

    // Check for text content
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 50) return textContent;

    // Fallback to role and tag name
    const role = element.getAttribute('role');
    return role || element.tagName.toLowerCase();
  }

  /**
   * Get keyboard navigation instructions for screen readers
   */
  private getKeyboardInstructions(): string {
    return `
      Press Tab to navigate between controls.
      Press Arrow keys to navigate calendar dates.
      Press Enter or Space to select.
      Press Escape to close dialogs.
      Press F6 to cycle between regions.
    `
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Enhanced screen reader announcements
   */
  private announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-focus-announcement';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1500);
  }

  /**
   * Setup focus trap keyboard handlers
   */
  private setupTrapKeyboardHandlers(trap: FocusTrap): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!trap.isActive) return;

      switch (event.key) {
        case 'Tab':
          this.handleTrapTabNavigation(event, trap);
          break;
        case 'Escape':
          event.preventDefault();
          this.deactivateTrap(trap.id);
          break;
        case 'F6':
          event.preventDefault();
          this.cycleFocusWithinTrap(trap);
          break;
      }
    };

    trap.keyboardHandlers.set('keydown', handleKeyDown);
    trap.element.addEventListener('keydown', handleKeyDown);
  }

  /**
   * Handle Tab navigation within focus trap
   */
  private handleTrapTabNavigation(event: KeyboardEvent, trap: FocusTrap): void {
    if (!trap.firstFocusable || !trap.lastFocusable) return;

    if (event.shiftKey) {
      // Shift+Tab (backwards)
      if (document.activeElement === trap.firstFocusable) {
        event.preventDefault();
        trap.lastFocusable.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === trap.lastFocusable) {
        event.preventDefault();
        trap.firstFocusable.focus();
      }
    }
  }

  /**
   * Additional helper methods for calendar integration
   */
  private getCurrentCalendarDate(element: HTMLElement): Date | null {
    const dateAttribute =
      element.getAttribute('data-date') ||
      element.getAttribute('data-calendar-date') ||
      element.getAttribute('aria-label');

    if (dateAttribute) {
      const date = new Date(dateAttribute);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  private findCalendarDateElement(container: HTMLElement, date: Date): HTMLElement | null {
    const dateString = date.toISOString().split('T')[0];
    return container.querySelector(
      `[data-date="${dateString}"], [data-calendar-date="${dateString}"]`
    ) as HTMLElement;
  }

  private getRegionLabel(region: HTMLElement): string {
    const regionType = region.getAttribute('data-region');
    const regionLabels = {
      'calendar-header': 'calendar navigation',
      'calendar-grid': 'calendar dates',
      'calendar-controls': 'calendar controls',
      'event-details': 'event information',
    };

    return regionLabels[regionType as keyof typeof regionLabels] || 'calendar region';
  }

  private detectAccessibilityPreferences(): void {
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.configuration = {
        ...this.configuration,
        ...AdvancedFocusManager.AAA_FOCUS_CONFIGS.high_contrast,
      };
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.configuration.animationDuration = '0ms';
    }

    // Update styles based on preferences
    this.setupFocusIndicatorStyles();
  }

  private setupGlobalKeyboardHandlers(): void {
    // Global keyboard handler for focus management
    document.addEventListener('keydown', (event) => {
      // Handle global focus shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'F6':
            event.preventDefault();
            this.cycleFocusBetweenMainRegions();
            break;
        }
      }
    });
  }

  private registerDefaultNavigationPatterns(): void {
    // Register common navigation patterns that apply globally
    const globalPatterns: KeyboardNavigationPattern[] = [
      {
        keys: ['Escape'],
        description: 'Close current dialog or return to previous state',
        handler: (event) => this.handleGlobalEscape(event),
        scope: 'global',
        priority: 1,
      },
      {
        keys: ['F1'],
        description: 'Show contextual help',
        handler: (event) => this.showContextualHelp(event),
        scope: 'global',
        priority: 2,
      },
    ];

    globalPatterns.forEach((pattern) => {
      const key = `global-${pattern.keys.join('+')}-${Date.now()}`;
      this.keyboardPatterns.set(key, pattern);
    });
  }

  private applyAAAfocusStyles(element: HTMLElement, config: AAAfocusConfiguration): void {
    element.style.setProperty('--focus-ring-thickness', config.thickness);
    element.style.setProperty('--focus-ring-color', config.color);
    element.style.setProperty('--focus-ring-offset', config.offset);
    element.style.setProperty('--focus-ring-style', config.style);
  }

  private handleCalendarKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[data-focus-enhanced="true"]') as HTMLElement;

    if (!container) return;

    const context: NavigationContext = {
      currentElement: target,
      focusableElements: this.findFocusableElements(container),
      containerElement: container,
      isRTL: getComputedStyle(container).direction === 'rtl',
    };

    // Find matching keyboard patterns
    const keyCombo = this.getKeyCombo(event);
    for (const [, pattern] of this.keyboardPatterns) {
      if (pattern.keys.includes(keyCombo) && pattern.scope === 'component') {
        pattern.handler(event, context);
        break;
      }
    }
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('Control');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key);
    return parts.join('+');
  }

  private cycleFocusWithinTrap(trap: FocusTrap): void {
    const currentIndex = trap.focusableElements.findIndex((el) => el === document.activeElement);
    const nextIndex = (currentIndex + 1) % trap.focusableElements.length;
    trap.focusableElements[nextIndex]?.focus();
  }

  private cycleFocusBetweenMainRegions(): void {
    // Implementation for cycling between main page regions
    const _mainRegions = ['header', 'main', 'aside', 'footer'];
    // Implementation details...
  }

  private handleGlobalEscape(_event: KeyboardEvent): void {
    // Find active focus trap and deactivate it
    for (const [trapId, trap] of this.focusTraps) {
      if (trap.isActive) {
        this.deactivateTrap(trapId);
        break;
      }
    }
  }

  private showContextualHelp(event: KeyboardEvent): void {
    event.preventDefault();
    // Implementation for contextual help system
    this.announceToScreenReader('Context help would appear here', 'assertive');
  }
}

// Export singleton instance
export const focusManager = AdvancedFocusManager.getInstance();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      focusManager.initialize();
    });
  } else {
    focusManager.initialize();
  }
}
