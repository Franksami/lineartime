'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Bell, BellOff, Play, Volume1, Volume2, VolumeX } from 'lucide-react';
import type * as React from 'react';

export function NotificationSettings() {
  const { settings, updateCategory, playSound, toggleSound, setSoundVolume, toggleSoundType } =
    useSettingsContext();
  const notifications = settings.notifications;

  const toggleNotifications = () => {
    updateCategory('notifications', { enabled: !notifications.enabled });
  };

  const toggleEventReminders = () => {
    updateCategory('notifications', { eventReminders: !notifications.eventReminders });
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = Number.parseFloat(e.target.value);
    setSoundVolume(volume);
  };

  // Test sound playback
  const testSound = (type: 'success' | 'error' | 'notification') => {
    playSound(type);
  };

  // Get volume icon based on level
  const getVolumeIcon = () => {
    const volume = notifications.soundVolume;
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const toggleDesktop = () => {
    updateCategory('notifications', { desktop: !notifications.desktop });
  };

  const toggleEmail = () => {
    updateCategory('notifications', { email: !notifications.email });
  };

  const toggleDailyDigest = () => {
    updateCategory('notifications', { dailyDigest: !notifications.dailyDigest });
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    const newReminders = [...notifications.reminderMinutes];
    newReminders[index] = Number.parseInt(value);
    updateCategory('notifications', { reminderMinutes: newReminders });
  };

  const addReminderTime = () => {
    updateCategory('notifications', {
      reminderMinutes: [...notifications.reminderMinutes, 30],
    });
  };

  const removeReminderTime = (index: number) => {
    const newReminders = notifications.reminderMinutes.filter((_, i) => i !== index);
    updateCategory('notifications', { reminderMinutes: newReminders });
  };

  const handleDailyDigestTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCategory('notifications', { dailyDigestTime: e.target.value });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notification permission granted!');
        updateCategory('notifications', { desktop: true });
      } else {
        alert('Notification permission denied. You can enable it in your browser settings.');
      }
    } else {
      alert('Your browser does not support notifications.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>

        <div className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                {notifications.enabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
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
                  <p className="text-sm text-muted-foreground">Get reminded before events start</p>
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
                        <Button variant="ghost" size="sm" onClick={() => removeReminderTime(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addReminderTime}>
                      Add Reminder Time
                    </Button>
                  </div>
                </div>
              )}

              {/* Sound Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound" className="flex items-center gap-2">
                      <VolumeIcon className="h-4 w-4" />
                      Sound Effects
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for different notification types
                    </p>
                  </div>
                  <Switch
                    id="sound"
                    checked={notifications.sound}
                    onCheckedChange={toggleSound}
                    aria-label="Toggle sound effects"
                  />
                </div>

                {notifications.sound && (
                  <div className="space-y-4 ml-4 border-l border-border pl-4">
                    {/* Volume Control */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="volume">Volume</Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(notifications.soundVolume * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="volume"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={notifications.soundVolume}
                          onChange={handleVolumeChange}
                          className="flex-1"
                          aria-label="Sound volume"
                        />
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Sound Types */}
                    <div className="space-y-3">
                      <Label>Sound Types</Label>

                      {/* Success Sounds */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="sound-success" className="text-sm">
                            Success sounds
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => testSound('success')}
                            disabled={!notifications.soundTypes.success}
                            aria-label="Test success sound"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                        <Switch
                          id="sound-success"
                          checked={notifications.soundTypes.success}
                          onCheckedChange={() => toggleSoundType('success')}
                          aria-label="Toggle success sounds"
                        />
                      </div>

                      {/* Error Sounds */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="sound-error" className="text-sm">
                            Error sounds
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => testSound('error')}
                            disabled={!notifications.soundTypes.error}
                            aria-label="Test error sound"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                        <Switch
                          id="sound-error"
                          checked={notifications.soundTypes.error}
                          onCheckedChange={() => toggleSoundType('error')}
                          aria-label="Toggle error sounds"
                        />
                      </div>

                      {/* Notification Sounds */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="sound-notification" className="text-sm">
                            General notifications
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => testSound('notification')}
                            disabled={!notifications.soundTypes.notification}
                            aria-label="Test notification sound"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                        <Switch
                          id="sound-notification"
                          checked={notifications.soundTypes.notification}
                          onCheckedChange={() => toggleSoundType('notification')}
                          aria-label="Toggle notification sounds"
                        />
                      </div>
                    </div>

                    {/* Accessibility Note */}
                    <p className="text-xs text-muted-foreground">
                      Sound effects respect your system's reduced motion preferences and require
                      user interaction to play.
                    </p>
                  </div>
                )}
              </div>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="desktop">Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show browser notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="desktop"
                    checked={notifications.desktop}
                    onCheckedChange={toggleDesktop}
                    aria-label="Toggle desktop notifications"
                  />
                  {!notifications.desktop && (
                    <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
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
  );
}
