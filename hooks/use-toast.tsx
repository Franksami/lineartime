/**
 * @deprecated Use @/components/ui/notify instead for consistent toast notifications
 * This hook is maintained for backward compatibility but will be removed in a future version.
 *
 * Migration guide:
 * - Replace `useToast()` with `import { notify } from '@/components/ui/notify'`
 * - Replace `toast({ variant: 'success' })` with `notify.success()`
 * - Replace `toast({ variant: 'destructive' })` with `notify.error()`
 * - Replace `toast({ variant: 'default' })` with `notify.info()`
 */

import { notify } from '@/components/ui/notify';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

/**
 * @deprecated Use notify from @/components/ui/notify instead
 */
export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
    const message = title || description || '';
    const fullMessage = title && description ? `${title}: ${description}` : message;

    switch (variant) {
      case 'destructive':
        notify.error(fullMessage, { duration });
        break;
      case 'success':
        notify.success(fullMessage, { duration });
        break;
      default:
        notify.info(fullMessage, { duration });
    }
  };

  return { toast };
}

/**
 * @deprecated Use notify from @/components/ui/notify instead
 */
export const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
  const message = title || description || '';
  const fullMessage = title && description ? `${title}: ${description}` : message;

  switch (variant) {
    case 'destructive':
      notify.error(fullMessage, { duration });
      break;
    case 'success':
      notify.success(fullMessage, { duration });
      break;
    default:
      notify.info(fullMessage, { duration });
  }
};
