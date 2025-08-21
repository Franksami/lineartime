/**
 * Toast Hook for Notifications
 * Provides integration with sonner for toast notifications
 */

import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
    const message = title || description || '';
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          description: title ? description : undefined,
          duration,
        });
        break;
      case 'success':
        sonnerToast.success(message, {
          description: title ? description : undefined,
          duration,
        });
        break;
      default:
        sonnerToast(message, {
          description: title ? description : undefined,
          duration,
        });
    }
  };

  return { toast };
}

// Export toast function directly for convenience
export const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
  const message = title || description || '';
  
  switch (variant) {
    case 'destructive':
      sonnerToast.error(message, {
        description: title ? description : undefined,
        duration,
      });
      break;
    case 'success':
      sonnerToast.success(message, {
        description: title ? description : undefined,
        duration,
      });
      break;
    default:
      sonnerToast(message, {
        description: title ? description : undefined,
        duration,
      });
  }
};