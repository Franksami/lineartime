'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function GlassDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showClose = true,
  size = 'md',
}: GlassDialogProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  'fixed left-[50%] top-[50%] z-50',
                  'w-full',
                  sizeClasses[size],
                  'translate-x-[-50%] translate-y-[-50%]',
                  'glass rounded-glass shadow-liquid',
                  'border border-glass-border/30',
                  'p-6',
                  className
                )}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 300,
                }}
              >
                {showClose && (
                  <Dialog.Close asChild>
                    <GlassButton
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </GlassButton>
                  </Dialog.Close>
                )}
                
                {title && (
                  <Dialog.Title className="text-xl font-semibold mb-2">
                    {title}
                  </Dialog.Title>
                )}
                
                {description && (
                  <Dialog.Description className="text-sm text-oklch-gray-600 mb-4">
                    {description}
                  </Dialog.Description>
                )}
                
                <div className="mt-4">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}