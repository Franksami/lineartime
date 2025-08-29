'use client';

/**
 * Year Lens View - Legacy LinearCalendarHorizontal Integration
 * 
 * This is the ONLY allowed location for LinearCalendarHorizontal usage
 * according to Command Workspace governance rules.
 * 
 * Purpose: Provides year-wide overview with 12-month horizontal timeline
 * Status: Optional view, OFF by default in Command Workspace
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// GOVERNANCE APPROVED: This is the only allowed import location for LinearCalendarHorizontal
const LinearCalendarHorizontal = dynamic(
  () => import('@/components/calendar/LinearCalendarHorizontal').then(mod => ({
    default: mod.LinearCalendarHorizontal,
  })),
  { 
    loading: () => (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <h3 className="text-lg font-semibold">Loading Year Lens...</h3>
          <p className="text-muted-foreground">12-month timeline view</p>
        </div>
      </div>
    )
  }
);

interface YearLensViewProps {
  className?: string;
}

export function YearLensView({ className }: YearLensViewProps) {
  return (
    <div className={`h-full w-full bg-background ${className || ''}`}>
      {/* View Header */}
      <div className="border-b border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Year Lens</h1>
            <p className="text-sm text-muted-foreground">
              12-month horizontal timeline - Legacy view
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-300 px-2 py-1 rounded border border-orange-500/20">
              LEGACY
            </span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
              Optional
            </span>
          </div>
        </div>
      </div>

      {/* Legacy Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <Suspense 
          fallback={
            <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-medium text-muted-foreground">
                  Loading Legacy Calendar...
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  12-month horizontal foundation
                </div>
              </div>
            </div>
          }
        >
          <LinearCalendarHorizontal />
        </Suspense>
      </div>
    </div>
  );
}

export default YearLensView;