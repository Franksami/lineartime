'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Contrast } from 'lucide-react'
import { cn } from '@/lib/utils'
import { prefersHighContrast, announceToScreenReader } from '@/lib/accessibility'

export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  React.useEffect(() => {
    // Check system preference on mount
    const systemPreference = prefersHighContrast()
    setIsHighContrast(systemPreference)
    
    // Check localStorage for user preference
    const savedPreference = localStorage.getItem('high-contrast')
    if (savedPreference !== null) {
      setIsHighContrast(savedPreference === 'true')
    }
  }, [])

  React.useEffect(() => {
    // Apply high contrast mode
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast')
      localStorage.setItem('high-contrast', 'true')
      announceToScreenReader('High contrast mode enabled')
    } else {
      document.documentElement.classList.remove('high-contrast')
      localStorage.setItem('high-contrast', 'false')
      announceToScreenReader('High contrast mode disabled')
    }
  }, [isHighContrast])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsHighContrast(!isHighContrast)}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={isHighContrast}
      className={cn(
        "transition-all",
        isHighContrast && "bg-primary text-primary-foreground"
      )}
    >
      <Contrast className="h-4 w-4" aria-hidden="true" />
    </Button>
  )
}