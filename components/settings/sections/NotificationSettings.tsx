'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { Bell, BellOff } from 'lucide-react'

export function NotificationSettings() {
  const { settings, updateCategory } = useSettingsContext()
  const notifications = settings.notifications

  const toggleNotifications = () => {
    updateCategory('notifications', { enabled: !notifications.enabled })
  }

  const toggleEventReminders = () => {
    updateCategory('notifications', { eventReminders: !notifications.eventReminders })
  }

  const toggleSound = () => {
    updateCategory('notifications', { sound: !notifications.sound })
  }

  const toggleDesktop = () => {
    updateCategory('notifications', { desktop: !notifications.desktop })
  }

  const toggleEmail = () => {
    updateCategory('notifications', { email: !notifications.email })
  }

  const toggleDailyDigest = () => {
    updateCategory('notifications', { dailyDigest: !notifications.dailyDigest })
  }

  const handleReminderTimeChange = (index: number, value: string) => {
    const newReminders = [...notifications.reminderMinutes]
    newReminders[index] = parseInt(value)
    updateCategory('notifications', { reminderMinutes: newReminders })
  }

  const addReminderTime = () => {
    updateCategory('notifications', { 
      reminderMinutes: [...notifications.reminderMinutes, 30] 
    })
  }

  const removeReminderTime = (index: number) => {
    const newReminders = notifications.reminderMinutes.filter((_, i) => i !== index)
    updateCategory('notifications', { reminderMinutes: newReminders })
  }

  const handleDailyDigestTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCategory('notifications', { dailyDigestTime: e.target.value })
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        alert('Notification permission granted!')
        updateCategory('notifications', { desktop: true })
      } else {
        alert('Notification permission denied. You can enable it in your browser settings.')
      }
    } else {
      alert('Your browser does not support notifications.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                {notifications.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts and reminders for your events
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications.enabled}
              onCheckedChange={toggleNotifications}
              aria-label="Toggle notifications"
            />
          </div>

          {notifications.enabled && (
            <>
              {/* Event Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="eventReminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded before events start
                  </p>
                </div>
                <Switch
                  id="eventReminders"
                  checked={notifications.eventReminders}
                  onCheckedChange={toggleEventReminders}
                  aria-label="Toggle event reminders"
                />
              </div>

              {/* Reminder Times */}
              {notifications.eventReminders && (
                <div className="space-y-2">
                  <Label>Reminder Times (minutes before)</Label>
                  <div className="space-y-2">
                    {notifications.reminderMinutes.map((minutes, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={minutes.toString()}
                          onValueChange={(value) => handleReminderTimeChange(index, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="1440">1 day</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReminderTime(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addReminderTime}
                    >
                      Add Reminder Time
                    </Button>
                  </div>
                </div>
              )}

              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound for notifications
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={notifications.sound}
                  onCheckedChange={toggleSound}
                  aria-label="Toggle sound alerts"
                />
              </div>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="desktop">Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show browser notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="desktop"
                    checked={notifications.desktop}
                    onCheckedChange={toggleDesktop}
                    aria-label="Toggle desktop notifications"
                  />
                  {!notifications.desktop && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestNotificationPermission}
                    >
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={notifications.email}
                  onCheckedChange={toggleEmail}
                  aria-label="Toggle email notifications"
                />
              </div>

              {/* Daily Digest */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dailyDigest">Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary of events
                    </p>
                  </div>
                  <Switch
                    id="dailyDigest"
                    checked={notifications.dailyDigest}
                    onCheckedChange={toggleDailyDigest}
                    aria-label="Toggle daily digest"
                  />
                </div>
                
                {notifications.dailyDigest && (
                  <div className="flex items-center gap-2 ml-4">
                    <Label htmlFor="digestTime">Send at:</Label>
                    <Input
                      id="digestTime"
                      type="time"
                      value={notifications.dailyDigestTime}
                      onChange={handleDailyDigestTimeChange}
                      className="w-[120px]"
                      aria-label="Daily digest time"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}