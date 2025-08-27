/**
 * Screen Reader Optimization System for AAA Compliance
 *
 * Advanced screen reader support with:
 * - Enhanced ARIA attributes and semantic markup
 * - Dynamic content announcements with live regions
 * - Context-sensitive descriptions and instructions
 * - Structured navigation with landmarks and headings
 * - Multi-language support and cultural adaptations
 * - Advanced screen reader testing utilities
 */

'use client';

import { focusManager } from '@/lib/accessibility/focus-management-aaa';
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// Screen reader context types
interface ScreenReaderContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  announceNavigation: (destination: string, context?: string) => void;
  announceAction: (action: string, result?: string) => void;
  announceError: (error: string, recovery?: string) => void;
  announceSuccess: (action: string) => void;
  announceProgress: (current: number, total: number, label?: string) => void;
  setRegionLabel: (regionId: string, label: string) => void;
  getRegionLabel: (regionId: string) => string;
  enableVerboseMode: boolean;
  setVerboseMode: (enabled: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

// Live region configuration
interface LiveRegionConfig {
  id: string;
  priority: 'polite' | 'assertive';
  atomic: boolean;
  relevant: string;
  busy: boolean;
}

// Screen reader context
const ScreenReaderContext = createContext<ScreenReaderContextType | null>(null);

export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within ScreenReaderProvider');
  }
  return context;
};

// Main screen reader provider
export const ScreenReaderProvider: React.FC<{ children: ReactNode; language?: string }> = ({
  children,
  language = 'en',
}) => {
  const [enableVerboseMode, setVerboseMode] = useState(false);
  const [currentLanguage, setLanguage] = useState(language);
  const [regionLabels, setRegionLabels] = useState<Map<string, string>>(new Map());

  // Live region management
  const liveRegionsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const announcementQueue = useRef<
    Array<{ message: string; priority: 'polite' | 'assertive'; timestamp: number }>
  >([]);
  const lastAnnouncementRef = useRef<string>('');
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize live regions
  useEffect(() => {
    createLiveRegions();

    return () => {
      // Cleanup live regions
      liveRegionsRef.current.forEach((region) => {
        if (document.body.contains(region)) {
          document.body.removeChild(region);
        }
      });
      liveRegionsRef.current.clear();
    };
  }, []);

  // Create live regions for announcements
  const createLiveRegions = () => {
    const regions: LiveRegionConfig[] = [
      {
        id: 'polite-announcements',
        priority: 'polite',
        atomic: true,
        relevant: 'additions text',
        busy: false,
      },
      {
        id: 'assertive-announcements',
        priority: 'assertive',
        atomic: true,
        relevant: 'additions text',
        busy: false,
      },
      {
        id: 'navigation-announcements',
        priority: 'polite',
        atomic: false,
        relevant: 'additions',
        busy: false,
      },
      {
        id: 'status-announcements',
        priority: 'polite',
        atomic: true,
        relevant: 'additions text',
        busy: false,
      },
    ];

    regions.forEach((config) => {
      const region = document.createElement('div');
      region.id = config.id;
      region.setAttribute('role', config.priority === 'assertive' ? 'alert' : 'status');
      region.setAttribute('aria-live', config.priority);
      region.setAttribute('aria-atomic', config.atomic.toString());
      region.setAttribute('aria-relevant', config.relevant);
      region.setAttribute('aria-busy', config.busy.toString());
      region.className = 'sr-only sr-live-region';

      // Enhanced styling for screen reader-only content
      region.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
      `;

      document.body.appendChild(region);
      liveRegionsRef.current.set(config.id, region);
    });
  };

  // Enhanced announcement system
  const announceMessage = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      // Avoid duplicate announcements
      if (message === lastAnnouncementRef.current) {
        return;
      }

      lastAnnouncementRef.current = message;

      // Clear any existing timeout
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }

      // Add to queue with timestamp
      announcementQueue.current.push({
        message,
        priority,
        timestamp: Date.now(),
      });

      // Process queue
      processAnnouncementQueue();

      // Clear the message after delay to allow re-announcements
      announcementTimeoutRef.current = setTimeout(() => {
        lastAnnouncementRef.current = '';
      }, 1500);
    },
    []
  );

  const processAnnouncementQueue = useCallback(() => {
    if (announcementQueue.current.length === 0) return;

    const announcement = announcementQueue.current.shift();
    if (!announcement) return;

    const regionId =
      announcement.priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';

    const region = liveRegionsRef.current.get(regionId);
    if (region) {
      // Clear previous content
      region.textContent = '';

      // Add new content after a brief delay to ensure screen reader detection
      setTimeout(() => {
        region.textContent = announcement.message;
      }, 50);

      // Clear content after announcement
      setTimeout(
        () => {
          region.textContent = '';

          // Process next in queue
          if (announcementQueue.current.length > 0) {
            setTimeout(processAnnouncementQueue, 100);
          }
        },
        Math.max(1000, announcement.message.length * 50)
      ); // Adjust timing based on message length
    }
  }, []);

  // Navigation announcements
  const announceNavigation = useCallback(
    (destination: string, context?: string) => {
      const contextInfo = context ? ` in ${context}` : '';
      const message = enableVerboseMode
        ? `Navigated to ${destination}${contextInfo}. Use arrow keys to continue navigation, or press Tab to move to next section.`
        : `Navigated to ${destination}${contextInfo}`;

      const region = liveRegionsRef.current.get('navigation-announcements');
      if (region) {
        region.textContent = message;
        setTimeout(() => {
          region.textContent = '';
        }, 2000);
      }
    },
    [enableVerboseMode]
  );

  // Action announcements
  const announceAction = useCallback(
    (action: string, result?: string) => {
      let message = action;
      if (result) {
        message += `. ${result}`;
      }

      if (enableVerboseMode) {
        message += '. Press Escape to undo, or Tab to continue.';
      }

      announceMessage(message, 'assertive');
    },
    [announceMessage, enableVerboseMode]
  );

  // Error announcements
  const announceError = useCallback(
    (error: string, recovery?: string) => {
      let message = `Error: ${error}`;
      if (recovery) {
        message += `. ${recovery}`;
      }

      if (enableVerboseMode) {
        message += '. Press F1 for help, or contact support if the problem persists.';
      }

      announceMessage(message, 'assertive');
    },
    [announceMessage, enableVerboseMode]
  );

  // Success announcements
  const announceSuccess = useCallback(
    (action: string) => {
      const message = enableVerboseMode
        ? `${action} completed successfully. You can continue with your next action.`
        : `${action} completed successfully`;

      announceMessage(message, 'polite');
    },
    [announceMessage, enableVerboseMode]
  );

  // Progress announcements
  const announceProgress = useCallback(
    (current: number, total: number, label?: string) => {
      const percentage = Math.round((current / total) * 100);
      const labelText = label ? `${label}: ` : '';
      let message = `${labelText}${percentage}% complete, ${current} of ${total}`;

      if (enableVerboseMode) {
        if (percentage === 100) {
          message += '. Process completed.';
        } else if (percentage >= 75) {
          message += '. Almost finished.';
        } else if (percentage >= 50) {
          message += '. More than halfway done.';
        } else if (percentage >= 25) {
          message += '. Making good progress.';
        } else {
          message += '. Just getting started.';
        }
      }

      announceMessage(message, 'polite');
    },
    [announceMessage, enableVerboseMode]
  );

  // Region label management
  const setRegionLabel = useCallback((regionId: string, label: string) => {
    setRegionLabels((prev) => new Map(prev.set(regionId, label)));
  }, []);

  const getRegionLabel = useCallback(
    (regionId: string): string => {
      return regionLabels.get(regionId) || regionId;
    },
    [regionLabels]
  );

  const contextValue: ScreenReaderContextType = {
    announceMessage,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    announceProgress,
    setRegionLabel,
    getRegionLabel,
    enableVerboseMode,
    setVerboseMode,
    language: currentLanguage,
    setLanguage,
  };

  return (
    <ScreenReaderContext.Provider value={contextValue}>{children}</ScreenReaderContext.Provider>
  );
};

// Enhanced ARIA live region component
interface AriaLiveRegionProps {
  id?: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: string;
  children?: ReactNode;
  className?: string;
}

export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  id,
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
  children,
  className,
}) => {
  return (
    <div
      id={id}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={`sr-only ${className || ''}`}
    >
      {children}
    </div>
  );
};

// Enhanced landmark component
interface LandmarkProps {
  role:
    | 'main'
    | 'banner'
    | 'contentinfo'
    | 'navigation'
    | 'complementary'
    | 'search'
    | 'form'
    | 'region';
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
  className?: string;
}

export const Landmark: React.FC<LandmarkProps> = ({
  role,
  label,
  labelledBy,
  describedBy,
  children,
  className,
}) => {
  const Component =
    role === 'main'
      ? 'main'
      : role === 'banner'
        ? 'header'
        : role === 'contentinfo'
          ? 'footer'
          : role === 'navigation'
            ? 'nav'
            : 'div';

  return (
    <Component
      role={['div'].includes(Component) ? role : undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={className}
    >
      {children}
    </Component>
  );
};

// Enhanced heading component with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  children: ReactNode;
  className?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  id,
  children,
  className,
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  return React.createElement(
    Component,
    {
      id,
      className,
      tabIndex: -1, // Allow programmatic focus for skip links
    },
    children
  );
};

// Screen reader instructions component
interface ScreenReaderInstructionsProps {
  id: string;
  instructions: string | ReactNode;
  context?: string;
  keyboardShortcuts?: Array<{
    keys: string;
    description: string;
  }>;
}

export const ScreenReaderInstructions: React.FC<ScreenReaderInstructionsProps> = ({
  id,
  instructions,
  context,
  keyboardShortcuts,
}) => {
  return (
    <div id={id} className="sr-only">
      <div role="region" aria-labelledby={`${id}-heading`}>
        <h2 id={`${id}-heading`}>Instructions{context && ` for ${context}`}</h2>

        <div>{instructions}</div>

        {keyboardShortcuts && keyboardShortcuts.length > 0 && (
          <div>
            <h3>Keyboard Shortcuts:</h3>
            <ul>
              {keyboardShortcuts.map((shortcut, index) => (
                <li key={index}>
                  <strong>{shortcut.keys}:</strong> {shortcut.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Skip links component
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links, className }) => {
  return (
    <nav aria-label="Skip links" className={className}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-4 focus:ring-focus-ring-aaa"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target instanceof HTMLElement) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

// Enhanced table with screen reader optimizations
interface AccessibleTableProps {
  caption: string;
  headers: Array<{
    id: string;
    label: string;
    scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  }>;
  rows: Array<{
    id: string;
    cells: Array<{
      content: ReactNode;
      headers?: string[];
    }>;
  }>;
  className?: string;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  rows,
  className,
}) => {
  return (
    <table className={className}>
      <caption className="sr-only">{caption}</caption>

      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header.id} id={header.id} scope={header.scope || 'col'} role="columnheader">
              {header.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell, cellIndex) => (
              <td key={`${row.id}-${cellIndex}`} headers={cell.headers?.join(' ')}>
                {cell.content}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Form field with enhanced screen reader support
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}) => {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className} role="group" aria-labelledby={`${id}-label`}>
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <div id={descriptionId} className="text-sm text-muted-foreground mt-1">
          {description}
        </div>
      )}

      <div className="mt-2">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                id,
                'aria-describedby': describedBy,
                'aria-required': required,
                'aria-invalid': !!error,
                ...child.props,
              })
            : child
        )}
      </div>

      {error && (
        <div
          id={errorId}
          className="text-sm text-destructive mt-1"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  );
};

// Screen reader testing utilities
export const screenReaderUtils = {
  // Test if screen reader is likely active
  isScreenReaderActive(): boolean {
    // Check for common screen reader indicators
    return !!(
      window.speechSynthesis ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      window.navigator.userAgent.includes('Dragon')
    );
  },

  // Get screen reader type (if detectable)
  getScreenReaderType(): string | null {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('NVDA')) return 'NVDA';
    if (userAgent.includes('JAWS')) return 'JAWS';
    if (userAgent.includes('Dragon')) return 'Dragon NaturallySpeaking';
    if (navigator.platform.includes('Mac') && window.speechSynthesis) return 'VoiceOver (possible)';
    return null;
  },

  // Test announcement system
  testAnnouncements(): void {
    const testMessages = [
      { message: 'Testing polite announcement', priority: 'polite' as const },
      { message: 'Testing assertive announcement', priority: 'assertive' as const },
    ];

    testMessages.forEach((test, index) => {
      setTimeout(() => {
        const event = new CustomEvent('sr-test-announcement', {
          detail: test,
        });
        window.dispatchEvent(event);
      }, index * 1000);
    });
  },

  // Validate ARIA attributes on page
  validateARIA(): Array<{
    element: Element;
    issues: string[];
  }> {
    const issues: Array<{ element: Element; issues: string[] }> = [];

    // Check for common ARIA issues
    const elementsWithRole = document.querySelectorAll('[role]');
    elementsWithRole.forEach((element) => {
      const elementIssues: string[] = [];
      const role = element.getAttribute('role');

      // Check for invalid roles
      const validRoles = [
        'alert',
        'alertdialog',
        'application',
        'article',
        'banner',
        'button',
        'cell',
        'checkbox',
        'columnheader',
        'combobox',
        'complementary',
        'contentinfo',
        'dialog',
        'directory',
        'document',
        'feed',
        'figure',
        'form',
        'grid',
        'gridcell',
        'group',
        'heading',
        'img',
        'link',
        'list',
        'listbox',
        'listitem',
        'log',
        'main',
        'marquee',
        'math',
        'menu',
        'menubar',
        'menuitem',
        'menuitemcheckbox',
        'menuitemradio',
        'navigation',
        'none',
        'note',
        'option',
        'presentation',
        'progressbar',
        'radio',
        'radiogroup',
        'region',
        'row',
        'rowgroup',
        'rowheader',
        'scrollbar',
        'search',
        'searchbox',
        'separator',
        'slider',
        'spinbutton',
        'status',
        'switch',
        'tab',
        'table',
        'tablist',
        'tabpanel',
        'term',
        'textbox',
        'timer',
        'toolbar',
        'tooltip',
        'tree',
        'treegrid',
        'treeitem',
      ];

      if (role && !validRoles.includes(role)) {
        elementIssues.push(`Invalid role: ${role}`);
      }

      if (elementIssues.length > 0) {
        issues.push({ element, issues: elementIssues });
      }
    });

    return issues;
  },
};

export default ScreenReaderProvider;
