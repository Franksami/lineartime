/**
 * Typed notification wrapper around Sonner toast
 * Provides consistent API with sensible defaults and coalescing support
 */

import { toast as baseToast } from '@/components/ui/sonner';

interface NotifyOptions {
  id?: string | number;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const notify = {
  /**
   * Show success notification
   */
  success: (message: string, options?: NotifyOptions) =>
    baseToast.success(message, {
      duration: 4000,
      ...options,
    }),

  /**
   * Show error notification (persists longer)
   */
  error: (message: string, options?: NotifyOptions) =>
    baseToast.error(message, {
      duration: 6000,
      ...options,
    }),

  /**
   * Show info notification
   */
  info: (message: string, options?: NotifyOptions) =>
    baseToast(message, {
      duration: 4000,
      ...options,
    }),

  /**
   * Show warning notification
   */
  warning: (message: string, options?: NotifyOptions) =>
    baseToast.warning(message, {
      duration: 5000,
      ...options,
    }),

  /**
   * Show loading notification (returns ID for updating)
   */
  loading: (message: string) => baseToast.loading(message),

  /**
   * Update an existing toast (useful for loading -> success/error pattern)
   */
  update: (id: string | number, message: string, success = true) =>
    success ? baseToast.success(message, { id }) : baseToast.error(message, { id }),

  /**
   * Dismiss a specific toast
   */
  dismiss: (id?: string | number) => baseToast.dismiss(id),

  /**
   * Dismiss all toasts
   */
  dismissAll: () => baseToast.dismiss(),
};

// Re-export toast for direct usage when needed
export { toast } from '@/components/ui/sonner';
