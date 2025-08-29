/**
 * Radix UI Primitive Integration for AAA Accessibility
 *
 * Enhanced accessibility-first components using Radix UI primitives:
 * - Automatic keyboard navigation and focus management
 * - Built-in ARIA attributes and screen reader support
 * - AAA color contrast compliance
 * - Enhanced focus indicators
 * - Context-sensitive help integration
 */

'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronDownIcon, Cross2Icon } from '@radix-ui/react-icons';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Progress from '@radix-ui/react-progress';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { aaaColorSystem } from '@/lib/accessibility/aaa-color-system';
import { focusManager } from '@/lib/accessibility/focus-management-aaa';
import { cn } from '@/lib/utils';

// Context for AAA accessibility settings
interface AccessibilityContextType {
  isHighContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  helpEnabled: boolean;
  announceChanges: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// AAA-compliant Accessibility Provider
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontSize, _setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const [helpEnabled, _setHelpEnabled] = useState(true);

  useEffect(() => {
    // Detect user preferences
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsHighContrast(highContrastQuery.matches);
    setReduceMotion(reducedMotionQuery.matches);

    // Listen for changes
    const handleContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);

    highContrastQuery.addEventListener('change', handleContrastChange);
    reducedMotionQuery.addEventListener('change', handleMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleContrastChange);
      reducedMotionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const announceChanges = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1500);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isHighContrast,
        reduceMotion,
        fontSize,
        helpEnabled,
        announceChanges,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Enhanced Dialog with AAA compliance
export interface AccessibleDialogProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onOpenChange?: (open: boolean) => void;
  helpContent?: React.ReactNode;
  className?: string;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  children,
  trigger,
  title,
  description,
  size = 'md',
  onOpenChange,
  helpContent,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const { announceChanges, isHighContrast } = useAccessibility();
  const trapId = useRef<string>(`dialog-${Date.now()}`);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    if (newOpen) {
      announceChanges(
        `${title} dialog opened. ${description || ''} Press Escape to close.`,
        'assertive'
      );

      // Create focus trap
      setTimeout(() => {
        const dialogElement = document.querySelector(
          `[data-dialog-id="${trapId.current}"]`
        ) as HTMLElement;
        if (dialogElement) {
          focusManager.createAAATrap(dialogElement, { id: trapId.current });
          focusManager.activateTrap(trapId.current);
        }
      }, 100);
    } else {
      announceChanges(`${title} dialog closed. Focus restored.`);
      focusManager.deactivateTrap(trapId.current);
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            isHighContrast && 'bg-black/80'
          )}
        />

        <Dialog.Content
          data-dialog-id={trapId.current}
          className={cn(
            'fixed left-[50%] top-[50%] z-50',
            'translate-x-[-50%] translate-y-[-50%]',
            'w-full',
            sizeClasses[size],
            'rounded-lg border bg-background p-6 shadow-lg',
            'duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            // AAA focus styling
            'focus-within:ring-4 focus-within:ring-focus-ring-aaa focus-within:ring-offset-2',
            isHighContrast && 'border-foreground border-2',
            className
          )}
          onEscapeKeyDown={() => handleOpenChange(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>

            {helpContent && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'rounded-sm opacity-70 ring-offset-background transition-opacity',
                        'hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-focus-ring-aaa',
                        'disabled:pointer-events-none data-[state=open]:bg-accent'
                      )}
                      aria-label="Show help for this dialog"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.5 0C3.36 0 0 3.36 0 7.5S3.36 15 7.5 15 15 11.64 15 7.5 11.64 0 7.5 0zm.75 12h-1.5v-1.5h1.5V12zm0-3h-1.5V4.5h1.5V9z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    side="bottom"
                    className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                  >
                    {helpContent}
                  </Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}

            <Dialog.Close asChild>
              <button
                type="button"
                className={cn(
                  'rounded-sm opacity-70 ring-offset-background transition-opacity',
                  'hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-focus-ring-aaa',
                  'disabled:pointer-events-none data-[state=open]:bg-accent'
                )}
                aria-label={`Close ${title} dialog`}
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {description && (
            <Dialog.Description className="text-sm text-muted-foreground mb-4">
              {description}
            </Dialog.Description>
          )}

          <div className="space-y-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Enhanced Select with AAA compliance
export interface AccessibleSelectProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  placeholder = 'Select an option...',
  value,
  onValueChange,
  options,
  label,
  description,
  error,
  required,
  className,
}) => {
  const { announceChanges, isHighContrast } = useAccessibility();
  const selectId = useRef(`select-${Date.now()}`);

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    const selectedOption = options.find((option) => option.value === newValue);
    if (selectedOption) {
      announceChanges(`Selected ${selectedOption.label}`);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId.current}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            isHighContrast && 'text-foreground font-bold'
          )}
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {description && (
        <p id={`${selectId.current}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      <Select.Root value={value} onValueChange={handleValueChange}>
        <Select.Trigger
          id={selectId.current}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input',
            'bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus:ring-4 focus:ring-focus-ring-aaa focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            isHighContrast && 'border-foreground border-2',
            className
          )}
          aria-describedby={cn(
            description && `${selectId.current}-description`,
            error && `${selectId.current}-error`
          )}
          aria-required={required}
          aria-invalid={!!error}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={cn(
              'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover',
              'text-popover-foreground shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              isHighContrast && 'border-foreground border-2'
            )}
            position="popper"
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2',
                    'text-sm outline-none',
                    'focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-focus-ring-aaa',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    isHighContrast && 'focus:bg-foreground focus:text-background'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Select.ItemIndicator>
                      <CheckIcon className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </span>

                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {error && (
        <p
          id={`${selectId.current}-error`}
          className="text-xs text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Enhanced Navigation Menu with AAA compliance
export interface AccessibleNavigationProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    children?: Array<{ label: string; href: string; description?: string }>;
  }>;
  className?: string;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({ items, className }) => {
  const { announceChanges, isHighContrast } = useAccessibility();

  return (
    <NavigationMenu.Root
      className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
    >
      <NavigationMenu.List className="group flex flex-1 list-none items-center justify-center space-x-1">
        {items.map((item, index) => (
          <NavigationMenu.Item key={`nav-${index}`}>
            {item.children ? (
              <>
                <NavigationMenu.Trigger
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md',
                    'bg-background px-4 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    'focus:ring-4 focus:ring-focus-ring-aaa focus:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'data-[state=open]:bg-accent/50',
                    isHighContrast &&
                      'border border-foreground hover:bg-foreground hover:text-background'
                  )}
                  onFocusCapture={() => announceChanges(`${item.label} menu`)}
                >
                  {item.label}
                  <ChevronDownIcon
                    className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </NavigationMenu.Trigger>

                <NavigationMenu.Content
                  className={cn(
                    'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out',
                    'data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out',
                    'data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52',
                    'data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52',
                    'md:absolute md:w-auto'
                  )}
                >
                  <div className="m-0 grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <div className="row-span-3 grid gap-1">
                      <h3 className="text-lg font-medium">{item.label}</h3>
                      {item.children.map((child, childIndex) => (
                        <NavigationMenu.Link key={`nav-child-${childIndex}`} asChild>
                          <a
                            href={child.href}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline',
                              'outline-none transition-colors',
                              'hover:bg-accent hover:text-accent-foreground',
                              'focus:bg-accent focus:text-accent-foreground',
                              'focus:ring-2 focus:ring-focus-ring-aaa',
                              isHighContrast && 'focus:bg-foreground focus:text-background'
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{child.label}</div>
                            {child.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {child.description}
                              </p>
                            )}
                          </a>
                        </NavigationMenu.Link>
                      ))}
                    </div>
                  </div>
                </NavigationMenu.Content>
              </>
            ) : (
              <NavigationMenu.Link asChild>
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md',
                    'bg-background px-4 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    'focus:ring-4 focus:ring-focus-ring-aaa focus:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    isHighContrast &&
                      'border border-foreground hover:bg-foreground hover:text-background'
                  )}
                >
                  {item.label}
                </a>
              </NavigationMenu.Link>
            )}
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>

      <div className="absolute left-0 top-full flex justify-center">
        <NavigationMenu.Viewport
          className={cn(
            'origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)]',
            'w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90',
            'md:w-[var(--radix-navigation-menu-viewport-width)]',
            isHighContrast && 'border-foreground border-2'
          )}
        />
      </div>
    </NavigationMenu.Root>
  );
};

// Enhanced Alert Dialog for critical actions
export interface AccessibleAlertDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'destructive' | 'warning' | 'info';
  className?: string;
}

export const AccessibleAlertDialog: React.FC<AccessibleAlertDialogProps> = ({
  trigger,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const { announceChanges, isHighContrast } = useAccessibility();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      announceChanges(`Alert: ${title}. ${description}`, 'assertive');
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
    announceChanges('Action confirmed');
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
    announceChanges('Action cancelled');
  };

  const variantStyles = {
    destructive: 'border-destructive/50 bg-destructive/5',
    warning: 'border-warning/50 bg-warning/5',
    info: 'border-border bg-background',
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            isHighContrast && 'bg-black/90'
          )}
        />

        <AlertDialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
            'gap-4 border p-6 shadow-lg duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'sm:rounded-lg',
            'focus:ring-4 focus:ring-focus-ring-aaa',
            variantStyles[variant],
            isHighContrast && 'border-foreground border-2',
            className
          )}
        >
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <AlertDialog.Title className="text-lg font-semibold text-foreground">
              {title}
            </AlertDialog.Title>

            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  'inline-flex h-10 items-center justify-center rounded-md border border-input',
                  'bg-background px-4 py-2 text-sm font-medium ring-offset-background',
                  'transition-colors hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-4 focus:ring-focus-ring-aaa focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isHighContrast && 'border-foreground hover:bg-foreground hover:text-background'
                )}
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  'inline-flex h-10 items-center justify-center rounded-md px-4 py-2',
                  'text-sm font-medium ring-offset-background transition-colors',
                  'focus:outline-none focus:ring-4 focus:ring-focus-ring-aaa focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  variant === 'destructive' &&
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                  variant === 'warning' && 'bg-warning text-warning-foreground hover:bg-warning/90',
                  variant === 'info' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isHighContrast && 'border-2 border-foreground'
                )}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

// Export all enhanced components
export {
  Dialog,
  DropdownMenu,
  Select,
  Tabs,
  Tooltip,
  NavigationMenu,
  AlertDialog,
  Progress,
  Slider,
  Switch,
  Checkbox,
  RadioGroup,
};
