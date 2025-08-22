'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { UserSettings } from '@/lib/settings/types'

export function AppearanceSettings() {
  const { settings, updateCategory } = useSettingsContext()
  const appearance = settings.appearance

  const handleThemeChange = (theme: UserSettings['appearance']['theme']) => {
    updateCategory('appearance', { theme })
  }

  const handleColorSchemeChange = (colorScheme: UserSettings['appearance']['colorScheme']) => {
    updateCategory('appearance', { colorScheme })
  }

  const handleFontSizeChange = (fontSize: UserSettings['appearance']['fontSize']) => {
    updateCategory('appearance', { fontSize })
  }

  const toggleHighContrast = () => {
    updateCategory('appearance', { highContrast: !appearance.highContrast })
  }

  const toggleReducedMotion = () => {
    updateCategory('appearance', { reducedMotion: !appearance.reducedMotion })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Appearance</h3>
        
        <div className="space-y-4">
          {/* Theme Selection */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select value={appearance.theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme" className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Scheme */}
          <div className="flex items-center justify-between">
            <Label htmlFor="colorScheme">Color Scheme</Label>
            <Select value={appearance.colorScheme} onValueChange={handleColorSchemeChange}>
              <SelectTrigger id="colorScheme" className="w-[180px]">
                <SelectValue placeholder="Select color scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select value={appearance.fontSize} onValueChange={handleFontSizeChange}>
              <SelectTrigger id="fontSize" className="w-[180px]">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="highContrast">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="highContrast"
              checked={appearance.highContrast}
              onCheckedChange={toggleHighContrast}
              aria-label="Toggle high contrast mode"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reducedMotion">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reducedMotion"
              checked={appearance.reducedMotion}
              onCheckedChange={toggleReducedMotion}
              aria-label="Toggle reduced motion"
            />
          </div>
        </div>
      </div>
    </div>
  )
}