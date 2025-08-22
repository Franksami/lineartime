'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Contrast } from 'lucide-react'
import { cn } from '@/lib/utils'
import { announceToScreenReader } from '@/lib/accessibility'
import { useSettingsContext } from '@/contexts/SettingsContext'

export function HighContrastToggle() {
  const { settings, toggleSetting } = useSettingsContext()
  const isHighContrast = settings.appearance.highContrast

  const handleToggle = () => {
    toggleSetting('appearance', 'highContrast')
    announceToScreenReader(
      isHighContrast ? 'High contrast mode disabled' : 'High contrast mode enabled'
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
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