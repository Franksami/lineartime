'use client';

import { CALENDAR_LAYERS } from '@/lib/z-index';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export const Toaster = () => (
  <SonnerToaster
    position="top-right"
    closeButton
    richColors
    theme="system"
    style={{ zIndex: CALENDAR_LAYERS.TOAST }}
    toastOptions={{
      classNames: {
        toast: 'bg-card text-foreground border border-border shadow-sm',
        success: 'bg-card text-foreground border border-border',
        error: 'bg-card text-foreground border border-border',
        warning: 'bg-card text-foreground border border-border',
        info: 'bg-card text-foreground border border-border',
        description: 'text-muted-foreground',
        actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
        cancelButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        closeButton: 'text-muted-foreground hover:text-foreground',
      },
    }}
  />
);

export const toast = sonnerToast;
