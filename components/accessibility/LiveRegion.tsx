'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  clearAfter?: number
  className?: string
}

/**
 * Component for announcing messages to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function LiveRegion({ 
  message, 
  priority = 'polite',
  clearAfter = 1000,
  className 
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message)

  React.useEffect(() => {
    setCurrentMessage(message)
    
    if (message && clearAfter) {
      const timer = setTimeout(() => {
        setCurrentMessage('')
      }, clearAfter)
      
      return () => clearTimeout(timer)
    }
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {currentMessage}
    </div>
  )
}

/**
 * Global live region hook for announcing messages
 */
export function useLiveRegion() {
  const [message, setMessage] = React.useState('')
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite')

  const announce = React.useCallback((msg: string, prio: 'polite' | 'assertive' = 'polite') => {
    setMessage(msg)
    setPriority(prio)
    
    // Clear after announcement
    setTimeout(() => {
      setMessage('')
    }, 1000)
  }, [])

  return {
    message,
    priority,
    announce
  }
}

/**
 * Provider for global live region announcements
 */
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = React.useState<Array<{
    id: string
    message: string
    priority: 'polite' | 'assertive'
  }>>([])

  React.useEffect(() => {
    const handleAnnouncement = (event: CustomEvent) => {
      const { message, priority = 'polite' } = event.detail
      const id = crypto.randomUUID()
      
      setAnnouncements(prev => [...prev, { id, message, priority }])
      
      // Remove after 1 second
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }, 1000)
    }

    window.addEventListener('announce' as any, handleAnnouncement)
    return () => window.removeEventListener('announce' as any, handleAnnouncement)
  }, [])

  return (
    <>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => a.message)
          .join('. ')}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => a.message)
          .join('. ')}
      </div>
    </>
  )
}

/**
 * Helper function to announce globally
 */
export function announceGlobal(message: string, priority: 'polite' | 'assertive' = 'polite') {
  window.dispatchEvent(new CustomEvent('announce', {
    detail: { message, priority }
  }))
}