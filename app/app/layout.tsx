/**
 * Command Workspace Layout
 * Layout configuration for the /app route with Geist fonts and providers
 */

import { ReactNode } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

interface CommandWorkspaceLayoutProps {
  children: ReactNode
}

/**
 * Layout for Command Workspace (/app route)
 * Integrates Vercel Geist fonts with semantic design tokens
 */
export default function CommandWorkspaceLayout({ children }: CommandWorkspaceLayoutProps) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <main className="font-sans bg-background text-foreground">
        {children}
      </main>
    </div>
  )
}

/**
 * Metadata for Command Workspace layout
 */
export const metadata = {
  title: {
    template: '%s | Command Workspace',
    default: 'Command Workspace | LinearTime'
  },
  description: 'Research-validated Command Workspace with three-pane architecture and contextual AI integration'
}