/**
 * AI Drag Drop Integration - Temporary Simplified Version
 *
 * Simplified version using @dnd-kit for testing the Command Center interface.
 * This ensures the server can start while maintaining functionality.
 */

'use client';

import { cn } from '@/lib/utils';
import type React from 'react';

interface AIDragDropIntegrationProps {
  children: React.ReactNode;
  className?: string;
}

export function AIDragDropIntegration({ children, className }: AIDragDropIntegrationProps) {
  return (
    <div className={cn('relative', className)}>
      {children}

      {/* AI Suggestions Overlay - Simplified */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-2 text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="font-medium">AI Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Drag & drop optimization active</p>
        </div>
      </div>
    </div>
  );
}
