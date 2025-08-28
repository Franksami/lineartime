/**
 * Command Workspace App Entry Point
 * Main route for the new three-pane shell architecture
 */

import { Suspense } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

/**
 * Main Command Workspace Page
 * Route: /app (with optional params: ?view=week&panel=ai&date=2025-03-15)
 */
export default function CommandWorkspaceApp() {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Suspense fallback={<CommandWorkspaceLoading />}>
        <AppShell />
      </Suspense>
    </div>
  )
}

/**
 * Loading state for Command Workspace
 */
function CommandWorkspaceLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <h2 className="text-xl font-semibold">Loading Command Workspace...</h2>
        <p className="text-muted-foreground">Setting up three-pane shell</p>
        <div className="text-xs text-muted-foreground">
          Research-validated architecture loading
        </div>
      </div>
    </div>
  )
}

/**
 * Metadata for the Command Workspace app
 */
export const metadata = {
  title: 'Command Workspace | LinearTime',
  description: 'AI-powered productivity platform with command-first navigation and contextual AI agents',
}