'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { Shield, Info } from 'lucide-react'

export function PrivacySettings() {
  const { settings, updateCategory } = useSettingsContext()
  const privacy = settings.privacy

  const toggleAnalytics = () => {
    updateCategory('privacy', { analytics: !privacy.analytics })
  }

  const toggleCrashReports = () => {
    updateCategory('privacy', { crashReports: !privacy.crashReports })
  }

  const toggleUsageData = () => {
    updateCategory('privacy', { usageData: !privacy.usageData })
  }

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      // Clear all localStorage data
      localStorage.clear()
      // Reload the page to reset the app
      window.location.reload()
    }
  }

  const exportData = () => {
    // Gather all data
    const allData = {
      settings: settings,
      events: localStorage.getItem('linearCalendarEvents') || '[]',
      exportDate: new Date().toISOString()
    }
    
    // Create download
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lineartime-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy & Data
        </h3>
        
        <div className="space-y-4">
          {/* Analytics */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Usage Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve LinearTime by sharing anonymous usage data
              </p>
            </div>
            <Switch
              id="analytics"
              checked={privacy.analytics}
              onCheckedChange={toggleAnalytics}
              aria-label="Toggle usage analytics"
            />
          </div>

          {/* Crash Reports */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="crashReports">Crash Reports</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send crash reports to help fix issues
              </p>
            </div>
            <Switch
              id="crashReports"
              checked={privacy.crashReports}
              onCheckedChange={toggleCrashReports}
              aria-label="Toggle crash reports"
            />
          </div>

          {/* Usage Data */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="usageData">Feature Usage Data</Label>
              <p className="text-sm text-muted-foreground">
                Share which features you use to help prioritize development
              </p>
            </div>
            <Switch
              id="usageData"
              checked={privacy.usageData}
              onCheckedChange={toggleUsageData}
              aria-label="Toggle usage data"
            />
          </div>

          {/* Data Management */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Data Management</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Export All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Download all your LinearTime data as JSON
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                >
                  Export Data
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Clear All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete all local data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllData}
                >
                  Clear Data
                </Button>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t">
            <div className="flex gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Privacy Notice</p>
                <p className="text-xs text-muted-foreground">
                  LinearTime stores all data locally in your browser. No data is sent to external servers 
                  unless you explicitly enable analytics or crash reporting. Your calendar events and 
                  settings never leave your device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}