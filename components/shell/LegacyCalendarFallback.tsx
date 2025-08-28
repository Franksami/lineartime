/**
 * Legacy Calendar Fallback Component
 * Safe fallback to original calendar foundation when Command Workspace disabled
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Fallback component when Command Workspace is disabled
 * Redirects to legacy calendar routes for seamless user experience
 */
export function LegacyCalendarFallback() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to legacy dashboard route
    // This preserves user experience during rollback situations
    console.log('🔄 Command Workspace disabled - redirecting to legacy calendar')
    router.push('/dashboard')
  }, [router])
  
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <h2 className="text-xl font-semibold">Redirecting to Calendar...</h2>
        <p className="text-muted-foreground">Loading familiar calendar interface</p>
      </div>
    </div>
  )
}