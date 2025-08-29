'use client';

/**
 * Legacy Dashboard Route - Command Workspace Migration
 * 
 * This route now redirects to the new Command Workspace architecture at /app
 * LinearCalendarHorizontal has been deprecated as the main shell in favor of
 * the three-pane Command Workspace (Sidebar + TabWorkspace + ContextDock)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to new Command Workspace architecture
    router.replace('/app?view=week');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold text-foreground">Redirecting to Command Workspace...</h2>
        <p className="text-muted-foreground">Moving to new three-pane architecture</p>
        <div className="text-xs text-muted-foreground">
          /dashboard → /app (Command Workspace)
        </div>
      </div>
    </div>
  );
}