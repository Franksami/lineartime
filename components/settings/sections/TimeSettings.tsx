'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { UserSettings } from '@/lib/settings/types'

export function TimeSettings() {
  const { settings, updateCategory } = useSettingsContext()
  const time = settings.time

  const handleFormatChange = (format: UserSettings['time']['format']) => {
    updateCategory('time', { format })
  }

  const handleDateFormatChange = (dateFormat: UserSettings['time']['dateFormat']) => {
    updateCategory('time', { dateFormat })
  }

  const handleTimezoneChange = (timezone: string) => {
    updateCategory('time', { timezone })
  }

  const handleFirstDayOfYearChange = (firstDayOfYear: UserSettings['time']['firstDayOfYear']) => {
    updateCategory('time', { firstDayOfYear })
  }

  const handleFiscalYearStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCategory('time', { fiscalYearStart: e.target.value })
  }

  // Get list of common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Moscow',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Mumbai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Time & Date Preferences</h3>
        
        <div className="space-y-4">
          {/* Time Format */}
          <div className="flex items-center justify-between">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select value={time.format} onValueChange={handleFormatChange}>
              <SelectTrigger id="timeFormat" className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="flex items-center justify-between">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={time.dateFormat} onValueChange={handleDateFormatChange}>
              <SelectTrigger id="dateFormat" className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={time.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger id="timezone" className="w-[180px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                  System Default
                </SelectItem>
                {timezones.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* First Day of Year */}
          <div className="flex items-center justify-between">
            <Label htmlFor="firstDayOfYear">First Day of Year</Label>
            <Select value={time.firstDayOfYear} onValueChange={handleFirstDayOfYearChange}>
              <SelectTrigger id="firstDayOfYear" className="w-[180px]">
                <SelectValue placeholder="Select first day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january1">January 1st</SelectItem>
                <SelectItem value="fiscalYear">Fiscal Year</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fiscal Year Start (only show if fiscal year selected) */}
          {time.firstDayOfYear === 'fiscalYear' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Input
                id="fiscalYearStart"
                type="text"
                placeholder="MM-DD (e.g., 04-01)"
                value={time.fiscalYearStart || ''}
                onChange={handleFiscalYearStartChange}
                className="w-[180px]"
                pattern="\d{2}-\d{2}"
                aria-label="Fiscal year start date"
              />
            </div>
          )}

          {/* Example Display */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current format examples:</p>
              <div className="space-y-1">
                <p className="text-sm">
                  Time: {time.format === '12h' ? '2:30 PM' : '14:30'}
                </p>
                <p className="text-sm">
                  Date: {
                    time.dateFormat === 'MM/DD/YYYY' ? '12/25/2024' :
                    time.dateFormat === 'DD/MM/YYYY' ? '25/12/2024' :
                    '2024-12-25'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}